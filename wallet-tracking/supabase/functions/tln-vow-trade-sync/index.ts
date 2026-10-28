// WalletTracking 7.64 · DEX-trade indexer for Supabase scheduled invocation.
// Deploy with JWT verification disabled, guarded by TRADE_SYNC_SECRET.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Interface, formatUnits, id } from 'npm:ethers@6';

const contracts: Record<string, Record<string,string>> = {
  bsc: {'0xf585b5b4f22816baf7629aea55b701662630397b':'vow','0x9c23942ca2c35e06d1d20747f33705983a18d2ab':'vdollar'},
  eth: {'0x1bbf25e71ec48b84d773809b4ba55b6f4be946fb':'vow','0xba7fe208e0167e4047a996e1efea830515f433f8':'vdollar','0x6c559d849f70477723dc94405018a436fa9fdc12':'vdollar'}
};
const v2 = new Interface(['event Swap(address indexed sender,uint256 amount0In,uint256 amount1In,uint256 amount0Out,uint256 amount1Out,address indexed to)']);
const v3 = new Interface(['event Swap(address indexed sender,address indexed recipient,int256 amount0,int256 amount1,uint160 sqrtPriceX96,uint128 liquidity,int24 tick)']);
const topics = [id('Swap(address,uint256,uint256,uint256,uint256,address)').toLowerCase(),id('Swap(address,address,int256,int256,uint160,uint128,int24)').toLowerCase()];
const selector={token0:'0x0dfe1681',token1:'0xd21220a7',decimals:'0x313ce567',slot0:'0x3850c7bd',reserves:'0x0902f1ac'};
const norm=(v:unknown)=>String(v||'').toLowerCase();
const hex=(n:number)=>'0x'+n.toString(16);
const asInt=(v:string)=>Number(BigInt(v));
const dburl=Deno.env.get('SUPABASE_URL')||'';
const adminKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const apiKey=Deno.env.get('ALCHEMY_API_KEY')||'';
const authSecret=Deno.env.get('TRADE_SYNC_SECRET')||'';
const sb=createClient(dburl,adminKey,{auth:{persistSession:false}});
const urls:Record<string,string>={bsc:`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(apiKey)}`,eth:`https://eth-mainnet.g.alchemy.com/v2/${encodeURIComponent(apiKey)}`};

async function rpc(chain:string,method:string,params:unknown[]){
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),15000);
  try{
    const res=await fetch(urls[chain],{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:c.signal});
    if(!res.ok)throw new Error(`${chain} RPC HTTP ${res.status} (${method})`);
    const raw=await res.json();if(raw.error)throw new Error(`${chain} ${method}: ${raw.error.message}`);
    return raw.result;
  }finally{clearTimeout(timer);}
}
async function batchReceipts(chain:string,hashes:string[]){
  const result=new Map<string,any>();
  for(let p=0;p<hashes.length;p+=10){
    const chunk=hashes.slice(p,p+10),c=new AbortController(),timer=setTimeout(()=>c.abort(),15000);
    try{
      const res=await fetch(urls[chain],{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(chunk.map((hash,i)=>({jsonrpc:'2.0',id:i+1,method:'eth_getTransactionReceipt',params:[hash]}))),signal:c.signal});
      if(!res.ok)throw new Error(`${chain} receipt batch HTTP ${res.status}`);
      const rows=await res.json();if(!Array.isArray(rows))throw new Error('Receipt batch format');
      const ids=new Map(rows.map((x:any)=>[Number(x.id),x]));
      for(let i=0;i<chunk.length;i++){const x:any=ids.get(i+1);if(x?.error||!x?.result?.logs)throw new Error(`Receipt missing ${chunk[i]}`);result.set(chunk[i],x.result);}
    }finally{clearTimeout(timer);}
  }
  return result;
}
async function call(chain:string,address:string,data:string){return await rpc(chain,'eth_call',[{to:address,data},'latest']);}
const poolCache=new Map<string,any>();
async function verifyPool(chain:string,address:string){
  const k=`${chain}:${address}`;if(poolCache.has(k))return poolCache.get(k);
  let pool:any=null;
  try{
    const x0=await call(chain,address,selector.token0),x1=await call(chain,address,selector.token1);
    if(!/^0x[0-9a-fA-F]{64,}$/.test(x0)||!/^0x[0-9a-fA-F]{64,}$/.test(x1))throw new Error('Not pool');
    const a0=norm('0x'+x0.slice(-40)),a1=norm('0x'+x1.slice(-40));
    if(!contracts[chain][a0]&&!contracts[chain][a1])throw new Error('No target token');
    let typ:string;
    try{const r=await call(chain,address,selector.slot0);if(!r||r==='0x')throw 0;typ='v3';}
    catch{const r=await call(chain,address,selector.reserves);if(!r||r==='0x')throw 0;typ='v2';}
    const getDecimals=async(a:string)=>{try{return Math.min(36,asInt(await call(chain,a,selector.decimals)));}catch{return 18;}};
    pool={type:typ,address,token0:a0,token1:a1,decimals:[await getDecimals(a0),await getDecimals(a1)]};
  }catch{pool=null;}
  poolCache.set(k,pool);return pool;
}
async function locateStart(chain:string,latest:number,target:number){
  let lo=0,hi=latest;
  while(lo<hi){const mid=Math.floor((lo+hi)/2),block=await rpc(chain,'eth_getBlockByNumber',[hex(mid),false]);
    if(!block)throw new Error('Block lookup failed');if(asInt(block.timestamp)<target)lo=mid+1;else hi=mid;}
  return lo;
}
async function transferWindow(chain:string,from:number,to:number,cutoff:number,user:string){
  const transfers=new Map<string,{timestamp:number}>();let pageKey:string|undefined,pages=0;
  do{
    const q:any={fromBlock:hex(from),toBlock:hex(to),category:['erc20'],contractAddresses:Object.keys(contracts[chain]),withMetadata:true,order:'asc',maxCount:'0x3e8',excludeZeroValue:true};
    if(pageKey)q.pageKey=pageKey;
    const data=await rpc(chain,'alchemy_getAssetTransfers',[q]);
    if(!Array.isArray(data?.transfers))throw new Error('Alchemy transfers missing');
    for(const t of data.transfers){const hash=norm(t.hash),timestamp=Math.floor(Date.parse(t.metadata?.blockTimestamp||'')/1000);
      if(/^0x[0-9a-f]{64}$/.test(hash)&&Number.isFinite(timestamp)&&timestamp>=cutoff)transfers.set(hash,{timestamp});}
    pageKey=data.pageKey;pages++;if(pages>50)throw new Error('Too many pages; reduce block window');
  }while(pageKey);
  const hashes=[...transfers.keys()],events:any[]=[];
  for(let i=0;i<hashes.length;i+=10){
    const receipts=await batchReceipts(chain,hashes.slice(i,i+10));
    for(const hash of hashes.slice(i,i+10)){
      const r=receipts.get(hash);if(r.status==='0x0')continue;
      const wallet=norm(r.from),timestamp=transfers.get(hash)!.timestamp;
      for(const log of r.logs){const topic=norm(log.topics?.[0]);if(!topics.includes(topic))continue;
        const address=norm(log.address),pool=await verifyPool(chain,address);
        if(!pool||topic!==(pool.type==='v2'?topics[0]:topics[1]))continue;
        try{
          const parsed=(pool.type==='v2'?v2:v3).parseLog({topics:log.topics,data:log.data});if(!parsed)continue;
          for(let j=0;j<2;j++){
            const tokenKey=contracts[chain][j===0?pool.token0:pool.token1];if(!tokenKey)continue;
            const records:any[]=[];
            if(pool.type==='v2'){
              const inn=parsed.args[j===0?'amount0In':'amount1In'] as bigint,out=parsed.args[j===0?'amount0Out':'amount1Out'] as bigint;
              if(inn>0n)records.push({side:'sell',qty:inn});if(out>0n)records.push({side:'buy',qty:out});
            }else{const v=parsed.args[j===0?'amount0':'amount1'] as bigint;if(v!==0n)records.push({side:v>0n?'sell':'buy',qty:v>0n?v:-v});}
            for(const rec of records){events.push({user_id:user,chain_key:chain,pool_address:address,tx_hash:hash,
              log_index:asInt(log.logIndex),token_key:tokenKey,side:rec.side,amount:formatUnits(rec.qty,pool.decimals[j]),
              wallet_address:wallet,block_number:asInt(r.blockNumber),block_time:new Date(timestamp*1000).toISOString()});}
          }
        }catch(e){throw new Error(`Swap decoding failed ${hash}: ${String(e)}`);}
      }
    }
  }
  for(let i=0;i<events.length;i+=200){const {error}=await sb.from('tln_vow_trade_cache').upsert(events.slice(i,i+200),{onConflict:'user_id,chain_key,tx_hash,log_index,token_key,side'});if(error)throw error;}
  return {transfers:hashes.length,events:events.length};
}
async function syncChain(user:string,chain:string){
  const now=Math.floor(Date.now()/1000),cutoff=now-30*86400;
  const latest=asInt(await rpc(chain,'eth_blockNumber',[]));
  const {data:state,error}=await sb.from('tln_vow_trade_scan_state').select('last_scanned_block,schema_version').eq('user_id',user).eq('chain_key',chain).eq('group_key','alchemy:transfers-v1').maybeSingle();
  if(error)throw error;
  const first=state?.schema_version===5?null:await locateStart(chain,latest,cutoff);
  const start=Math.max(0,state?.schema_version===5?Number(state.last_scanned_block)-20:first!);
  // Bounded work: one small window per chain and invocation; next cron resumes from checkpoint.
  const span=chain==='bsc'?1200:180;const end=Math.min(latest,start+span-1);
  const result=await transferWindow(chain,start,end,cutoff,user);
  const {error:upsertError}=await sb.from('tln_vow_trade_scan_state').upsert({user_id:user,chain_key:chain,group_key:'alchemy:transfers-v1',schema_version:5,last_scanned_block:end,updated_at:new Date().toISOString()}, {onConflict:'user_id,chain_key,group_key'});
  if(upsertError)throw upsertError;
  return {chain,from:start,to:end,latest,complete:end>=latest,...result};
}
Deno.serve(async(req)=>{
  if(req.method!=='POST')return new Response('Method Not Allowed',{status:405});
  if(!authSecret||req.headers.get('x-trade-sync-secret')!==authSecret)return new Response('Unauthorized',{status:401});
  if(!apiKey||!adminKey||!dburl)return new Response('Missing server secrets',{status:500});
  try{
    const {data:rows,error}=await sb.from('tln_vow_trade_scan_state').select('user_id').eq('group_key','alchemy:transfers-v1').limit(1000);
    if(error)throw error;
    // Registered users who previously ran the analysis; no browser session required.
    const users=[...new Set((rows||[]).map((r:any)=>r.user_id))];
    const out:any[]=[];
    for(const user of users){for(const chain of ['bsc','eth']){
      try{out.push({user,...await syncChain(user,chain)});}catch(e){out.push({user,chain,error:String(e)});}
    }}
    const {error:cleanError}=await sb.from('tln_vow_trade_cache').delete().lt('block_time',new Date(Date.now()-30*86400000).toISOString());
    if(cleanError)throw cleanError;
    return Response.json({ok:out.every(x=>!x.error),users:users.length,results:out},{status:out.some(x=>x.error)?500:200});
  }catch(e){return Response.json({ok:false,error:String(e)},{status:500});}
});
