// WalletTracking 8.48: all-user, target-block-only APTM price enrichment.
// Mirrors the application's exact-v13 pool-state -> verified Sync predecessor
// proof order. No neighbouring cached price, reward, NFT or claim creation.
const PAIR='0x38acbfa5108d3c76d6cea4d380182e832a289b57';
const WAPTM='0x110ac02ba3384bc055c13a87766049a74517beda';
const WUSDT='0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f';
const SYNC='0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1';
const MARKET_START=88356;
type SupabaseLike=any;
const hx=(n:number)=>'0x'+n.toString(16);
const addr=(value:string)=>'0x'+value.slice(-40).toLowerCase();
function validHex(value:unknown,bytes:number){return typeof value==='string'&&new RegExp('^0x[0-9a-fA-F]{'+(bytes*2)+'}$').test(value)}
function priceFromRaw(data:string,aptmIs0:boolean,d0:number,d1:number){
 const clean=data.replace(/^0x/,'');
 if(!/^[0-9a-fA-F]{128,}$/.test(clean))throw Error('Invalid verified pool reserve payload');
 const a=BigInt('0x'+clean.slice(0,64));const b=BigInt('0x'+clean.slice(64,128));
 const aptm=(Number(aptmIs0?a:b)/10**(aptmIs0?d0:d1));
 const usdt=(Number(aptmIs0?b:a)/10**(aptmIs0?d1:d0));
 const price=usdt/aptm;
 if(!(aptm>0&&usdt>0&&price>0&&Number.isFinite(price)))throw Error('Invalid positive pool reserve ratio');
 return price;
}
async function rpcFactory(sb:SupabaseLike){
 const {data:chain,error}=await sb.from('chains').select('rpc_url,archive_rpc_url,evm_chain_id').eq('chain_key','apertum').single();
 if(error||!chain)throw Error('Apertum chain configuration missing');
 if(Number(chain.evm_chain_id)!==2786)throw Error('Apertum chain-ID configuration mismatch');
 const source=chain.archive_rpc_url||chain.rpc_url;
 const url=new URL(source);
 if(url.protocol!=='https:'||url.hostname!=='rpc.apertum.io')throw Error('Unsupported Apertum price RPC endpoint');
 let sequence=0;
 async function rpc(method:string,params:unknown[]){
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),11000);
  try{
   const id=++sequence;
   const response=await fetch(url.toString(),{method:'POST',signal:controller.signal,headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id,method,params})});
   if(!response.ok)throw Error(`Apertum RPC HTTP ${response.status}`);
   const json=await response.json();
   if(json?.id!==id||json?.error||json?.result==null)throw Error('Apertum RPC incomplete: '+String(json?.error?.message||method));
   return json.result;
  }finally{clearTimeout(timeout)}
 }
 const chainId=await rpc('eth_chainId',[]);
 if(!validHex(chainId,2)&&!/^0x[0-9a-f]+$/i.test(String(chainId)))throw Error('Invalid remote chain ID');
 if(BigInt(chainId)!==2786n)throw Error('Apertum remote chain ID mismatch');
 return rpc;
}
async function poolMetadata(rpc:(method:string,params:unknown[])=>Promise<any>){
 const call=async(to:string,data:string)=>rpc('eth_call',[{to,data},'latest']);
 const token0=addr(String(await call(PAIR,'0x0dfe1681'))),token1=addr(String(await call(PAIR,'0xd21220a7')));
 if(!([token0,token1].includes(WAPTM)&&[token0,token1].includes(WUSDT)))throw Error('Historical pool has unexpected token contracts');
 const decimals=async(token:string)=>{
  const raw=await call(token,'0x313ce567');
  if(!validHex(raw,32)||BigInt(raw)>36n)throw Error('Invalid pool token decimals');
  return Number(BigInt(raw));
 };
 return {aptmIs0:token0===WAPTM,d0:await decimals(token0),d1:await decimals(token1)};
}
async function logsAdaptive(rpc:(method:string,params:unknown[])=>Promise<any>,from:number,to:number,depth=0):Promise<any[]>{
 try{
  const result=await rpc('eth_getLogs',[{fromBlock:hx(from),toBlock:hx(to),address:PAIR,topics:[SYNC]}]);
  if(!Array.isArray(result))throw Error('Invalid Apertum Sync log result');
  return result;
 }catch(e){
  if(to-from+1<=500||depth>=12)throw e;
  const mid=Math.floor((from+to)/2);
  const left=await logsAdaptive(rpc,from,mid,depth+1);
  const right=await logsAdaptive(rpc,mid+1,to,depth+1);
  return [...left,...right];
 }
}
async function exactAnchor(block:number,rpc:(method:string,params:unknown[])=>Promise<any>,meta:{aptmIs0:boolean,d0:number,d1:number}){
 const common={project_key:'dao1',chain_key:'apertum',pool_address:PAIR,parser_version:1,target_block:block};
 // Same first-choice proof as exactPoolPriceFromHistoricalReserves in dao1.js.
 try{
  const reserves=await rpc('eth_call',[{to:PAIR,data:'0x0902f1ac'},hx(block)]);
  return {...common,sync_block:block,log_index:null,tx_hash:null,
   aptm_usd:priceFromRaw(String(reserves),meta.aptmIs0,meta.d0,meta.d1),
   scanned_from_block:block,scanned_at:new Date().toISOString()};
 }catch{/* Archive state not supplied: use proven predecessor Sync (not cached nearest price). */}
 let to=block,span=512;
 for(let round=0;round<20 && to>=MARKET_START;round++){
  const from=Math.max(MARKET_START,to-span+1);
  const logs=await logsAdaptive(rpc,from,to);
  const parsed=logs.filter((l:any)=>String(l.address||'').toLowerCase()===PAIR&&String(l.topics?.[0]||'').toLowerCase()===SYNC)
   .filter((l:any)=>validHex(l.transactionHash,32)&&/^0x[0-9a-f]+$/i.test(String(l.blockNumber))&&/^0x[0-9a-f]+$/i.test(String(l.logIndex)))
   .map((l:any)=>({block:Number(BigInt(l.blockNumber)),index:Number(BigInt(l.logIndex)),tx:String(l.transactionHash).toLowerCase(),data:String(l.data||'')}))
   .filter((l:any)=>Number.isSafeInteger(l.block)&&l.block>=from&&l.block<=to)
   .sort((a:any,b:any)=>b.block-a.block||b.index-a.index);
  if(parsed.length){
   const last=parsed[0];
   return {...common,sync_block:last.block,log_index:last.index,tx_hash:last.tx,
    aptm_usd:priceFromRaw(last.data,meta.aptmIs0,meta.d0,meta.d1),
    scanned_from_block:from,scanned_at:new Date().toISOString()};
  }
  if(from===MARKET_START)break;
  to=from-1;span=Math.min(span*2,250000);
 }
 throw Error('No complete historical reserve/Sync proof for target block');
}
export async function processExactPriceTargets(sb:SupabaseLike,{preview=false,maxTargets=4}:{preview?:boolean,maxTargets?:number}={}){
 const {data:targets,error}=await sb.rpc('wallettracking_dao_next_price_targets_848',{p_limit:maxTargets});
 if(error)throw Error('Global DAO price candidate selection: '+error.message);
 const selected=targets||[];
 if(preview)return {selected:selected.length,targets:selected.map((x:any)=>({block:x.claim_block,walletId:x.wallet_id})),processed:0,remaining:'not_counted'};
 if(!selected.length)return {selected:0,processed:0,pricedFlows:0,stopped:'no_pending'};
 const rpc=await rpcFactory(sb);const meta=await poolMetadata(rpc);
 let pricedFlows=0,anchorsInserted=0;
 const results:any[]=[];
 // Limited to 4 globally selected verified unpriced target blocks per invocation.
 for(const target of selected){
  const block=Number(target.claim_block);
  if(!Number.isSafeInteger(block)||block<MARKET_START)throw Error('Invalid verified claim block');
  try{
   const {data:cached,error:cacheError}=await sb.from('aptm_price_anchors').select('target_block,sync_block,aptm_usd,scanned_from_block')
    .eq('project_key','dao1').eq('chain_key','apertum').eq('pool_address',PAIR).eq('parser_version',1).eq('target_block',block).maybeSingle();
   if(cacheError)throw cacheError;
   if(!cached){
    const row=await exactAnchor(block,rpc,meta);
    const {error:saveError}=await sb.from('aptm_price_anchors').upsert(row,{onConflict:'pool_address,parser_version,target_block',ignoreDuplicates:true});
    if(saveError)throw saveError;
    anchorsInserted++;
   }else if(!(Number(cached.aptm_usd)>0 && cached.sync_block!==null && Number(cached.sync_block)<=block && Number(cached.scanned_from_block)>=0)){
    throw Error('Existing invalid/empty anchor; manual audit required, not overwritten');
   }
   const {data:updated,error:applyError}=await sb.rpc('wallettracking_dao_apply_exact_target_anchors_scoped',{
    p_user:target.user_id,p_wallet:target.wallet_id,p_limit:10,p_tx:target.tx_hash
   });
   if(applyError)throw applyError;
   const n=Number(updated||0);pricedFlows+=n;
   results.push({block,walletId:target.wallet_id,pricedFlows:n,status:n?'priced':'unchanged'});
  }catch(e){
   results.push({block,walletId:target.wallet_id,status:'blocked',reason:String(e instanceof Error?e.message:e).slice(0,250)});
   break; // do not skip repeatedly failing oldest target or manufacture prices
  }
 }
 return {selected:selected.length,processed:results.length,anchorsInserted,pricedFlows,results,
  stopped:results.some(r=>r.status==='blocked')?'proof_or_save_failure':'batch_complete'};
}
