// DAO1/APTMDAO: incremental transaction and ERC-20 flow ingestion (staging worker).
// A raw import transitions to 'staged', NOT 'completed'. Only the future
// canonical claim/flow/valuation pipeline may mark reward jobs completed.
// Important: NOT a complete reward worker. NFT claim classification and historical
// price enrichment still require the canonical DAO application pipeline.
import { createClient } from 'npm:@supabase/supabase-js@^2'
const DB_URL=Deno.env.get('SUPABASE_URL')||''
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''
const SECRET=Deno.env.get('WALLET_DAILY_REFRESH_SECRET')||''
const MASTER=Deno.env.get('WALLET_ENCRYPTION_MASTER_KEY_V1')||''
const sb=createClient(DB_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const enc=new TextEncoder(),dec=new TextDecoder()
const EXPLORER='https://explorer.apertum.io/api/v2'
const OVERLAP=250
const PROJECT='dao1', CHAIN='apertum'
// Use the same function selectors as the canonical DAO claim UI.
const CLAIM_SELECTOR='0x86bb8f37', NEW_MINER_CLAIM_SELECTOR='0x19da4078'
function canonicalMethod(input:string,explorerMethod:unknown){
 const selector=input.slice(0,10).toLowerCase();
 if(selector===CLAIM_SELECTOR)return 'claimReward';
 if(selector===NEW_MINER_CLAIM_SELECTOR)return 'Miner Claim';
 return String(explorerMethod||'Transfer/Call').trim()||'Transfer/Call'
}
// Contract evidence must match the canonical DAO browser rules; never infer
// rewards from a token symbol or an unverified incoming transfer alone.
const REFERRAL_WALLET='0x239c5822a0d2a67e629d7a3b5c8180721e228b47'
const REFERRAL_REWARD_CONTRACT='0xcd40d3bcfc29c51edb1fdd78580578362366f856'
const REFERRAL_WUSDT_TOKEN='0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f'
function isVerifiedReferralTransaction(address:string,tx:any,flows:any[]){
 const method=String(tx?.method||'').toLowerCase()
 return address===REFERRAL_WALLET
  && lower(tx?.to_address)===REFERRAL_REWARD_CONTRACT
  && (!method||method==='withdraw'||method==='contract call'||method.startsWith('0x'))
  && flows.some(f=>f.direction==='eingang'&&lower(f.token_address)===REFERRAL_WUSDT_TOKEN&&lower(f.counterparty_address)===REFERRAL_REWARD_CONTRACT)
}
// Do not advance the canonical browser/claim cursors until reward enrichment is implemented.
const RAW_TX_SCAN='reward_server_raw_transactions_v1'
const RAW_FLOW_SCAN='reward_server_raw_flows_v1'
function localDay(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function localMinute(){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Zurich',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());return Number(parts.find(x=>x.type==='hour')?.value)*60+Number(parts.find(x=>x.type==='minute')?.value)}
function bytesFromMaster(){
 const raw=MASTER.trim();if(/^[0-9a-f]{64}$/i.test(raw))return Uint8Array.from(raw.match(/../g)! as string[],h=>parseInt(h,16));
 const txt=raw.replace(/-/g,'+').replace(/_/g,'/');const decoded=atob(txt+'='.repeat((4-txt.length%4)%4));
 if(decoded.length!==32)throw Error('Encryption master key has invalid length');
 return Uint8Array.from(decoded,c=>c.charCodeAt(0))
}
function b64urlDecode(raw:string){const x=raw.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(x+'='.repeat((4-x.length%4)%4)),c=>c.charCodeAt(0))}
async function userKey(user:string){
 const material=await crypto.subtle.importKey('raw',bytesFromMaster(),'HKDF',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:enc.encode('wallet-tracking/private-data/hkdf-salt/v1'),info:enc.encode(`wallet-tracking:user:${user}:key-version:1`)},material,{name:'AES-GCM',length:256},false,['decrypt'])
}
async function decryptWalletField(key:CryptoKey,user:string,id:string,ciphertext:unknown,field:string){
 if(ciphertext===null||ciphertext==='')return '';
 if(typeof ciphertext!=='string')throw Error('Invalid ciphertext type');
 const parts=ciphertext.split('.');if(parts.length!==4||parts[0]!=='wt1'||parts[1]!=='k1')throw Error('Unsupported encryption version');
 for(const aadField of [`wallets.${field}_ciphertext`,`wallets.${field}`]){
  try{return dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:b64urlDecode(parts[2]),additionalData:enc.encode(`wallet-tracking|enc=1|key=1|user=${user}|record=${id}|field=${aadField}`),tagLength:128},key,b64urlDecode(parts[3])))}catch{}
 }
 throw Error(`Cannot decrypt wallet field ${field}`)
}

function lower(v:any){return String(v?.hash||v?.address_hash||v?.address||v||'').toLowerCase()}
function hash(v:any){return lower(v?.transaction_hash||v?.tx_hash||v?.hash||'')}
// Blockscout v2 transaction value and fee.value are unsigned WEI strings.
// Persist exact decimal amounts; converting wei through Number loses precision.
function aptmAmount(raw:unknown){
 const value=String(raw??'0');
 if(!/^\d+$/.test(value))throw Error('Invalid APTM wei value');
 return decimalAmount(value,18);
}
function decimalAmount(raw:string,decimals:number){
 const n=BigInt(raw),d=Math.max(0,Math.min(36,decimals));
 const sign=n<0n?'-':'';const digits=(n<0n?-n:n).toString().padStart(d+1,'0');
 return sign+(d?(digits.slice(0,-d)+'.'+digits.slice(-d).replace(/0+$/,'')).replace(/\.$/,''):digits)
}
async function loadAddress(job:any){
 const {data,error}=await sb.from('wallets').select('id,user_id,evm_address_ciphertext,encryption_version,key_version').eq('id',job.wallet_id).eq('user_id',job.user_id).single();
 if(error||!data||data.encryption_version!==1||data.key_version!==1)throw Error('Wallet decryption metadata unavailable');
 const a=await decryptWalletField(await userKey(job.user_id),job.user_id,job.wallet_id,data.evm_address_ciphertext,'evm_address');
 if(!/^0x[0-9a-f]{40}$/i.test(a))throw Error('Wallet has no valid EVM address');return a.toLowerCase()
}
async function json(url:string){const abort=new AbortController();const t=setTimeout(()=>abort.abort(),15000);try{const r=await fetch(url,{signal:abort.signal,headers:{accept:'application/json'}});if(!r.ok)throw Error('Explorer status '+r.status);return await r.json()}finally{clearTimeout(t)}}
// Blockscout-compatible explorers do not consistently include block_number
// in address token-transfer items. Resolve missing blocks from the canonical
// transaction detail before deciding which page or event can advance a cursor.
// Never guess a block from a page cursor or timestamp.
const txBlockCache=new Map<string,number>()
async function itemBlock(item:any){
 const direct=Number(item.block_number??item.block);
 if(Number.isSafeInteger(direct)&&direct>0)return direct;
 const tx=hash(item);
 if(!/^0x[0-9a-f]{64}$/.test(tx))throw Error('Transfer without block and transaction hash');
 const cached=txBlockCache.get(tx);if(cached)return cached;
 const detail=await json(`${EXPLORER}/transactions/${tx}`);
 const block=Number(detail?.block_number??detail?.block);
 if(!Number.isSafeInteger(block)||block<=0)throw Error('Transaction has no verified block');
 txBlockCache.set(tx,block);return block;
}
async function paginate(path:string,cursor:number,handler:(items:any[])=>Promise<void>){
 let url=EXPLORER+path, count=0, max=cursor,complete=false;const visited=new Set<string>();
 while(url){
  if(visited.has(url)||++count>200)throw Error('Explorer pagination safety limit');visited.add(url);
  const response=await json(url);if(!Array.isArray(response.items))throw Error('Explorer missing items');
  let oldest=Infinity;const rows=[];
  for(const t of response.items){const block=await itemBlock(t);oldest=Math.min(oldest,block);max=Math.max(max,block);if(block>=Math.max(0,cursor-OVERLAP))rows.push({...t,_verifiedBlock:block})}
  await handler(rows);
  if(!response.next_page_params){complete=true;break}
  if(cursor>0&&oldest<Math.max(0,cursor-OVERLAP)){complete=true;break}
  const next=new URL(EXPLORER+path);for(const [k,v] of Object.entries(response.next_page_params))if(v!=null)next.searchParams.set(k,String(v));url=next.toString()
 }
 if(!complete)throw Error('Incomplete pagination');return max
}
async function state(job:any,kind:string){const {data,error}=await sb.from('project_scan_state').select('last_scanned_block').eq('user_id',job.user_id).eq('wallet_id',job.wallet_id).eq('project_key',PROJECT).eq('chain_key',CHAIN).eq('scan_type',kind).maybeSingle();if(error)throw error;return Number(data?.last_scanned_block||0)}
async function updateState(job:any,kind:string,block:number){if(!block)return;const {error}=await sb.from('project_scan_state').upsert({user_id:job.user_id,wallet_id:job.wallet_id,project_key:PROJECT,chain_key:CHAIN,scan_type:kind,last_scanned_block:block,last_scanned_at:new Date().toISOString()},{onConflict:'user_id,project_key,chain_key,wallet_id,scan_type'});if(error)throw error}
// The raw staging import is insert-only. On an existing transaction/flow, a
// canonical browser refresh may be enriching claim classification or prices
// concurrently. Never perform a read-modify-upsert: it can race and overwrite
// those enriched columns. Database uniqueness + ignoreDuplicates makes retries
// and overlapping block scans safe without changing existing rows.
async function insertRawWithoutReplacing(table:string,rows:any[],conflict:string){
 for(let i=0;i<rows.length;i+=100){
  const batch=rows.slice(i,i+100);
  if(!batch.length)continue;
  const {error}=await sb.from(table).upsert(batch,{onConflict:conflict,ignoreDuplicates:true});
  if(error)throw error;
 }
}
// Native APTM claim payouts are transaction-local. Only successful, directly
// evidenced incoming transfers are staged. Missing explorer evidence is not
// treated as a zero payout, and no USD price is invented.
async function nativeClaimPayout(address:string,tx:any){
 if(![CLAIM_SELECTOR,NEW_MINER_CLAIM_SELECTOR].includes(String(tx.selector||'')))return null;
 if(!['ok','success'].includes(String(tx.status||'').toLowerCase()))return null;
 const url=`${EXPLORER}/transactions/${tx.tx_hash}/internal-transactions`;
 let items:any[]=[];let next=url;const seen=new Set<string>();
 while(next){
  if(seen.has(next)||seen.size>=30)throw Error('Native claim pagination safety limit');
  seen.add(next);
  const response=await json(next);
  if(!Array.isArray(response.items))throw Error('Native claim internal transfers missing');
  items.push(...response.items);
  if(!response.next_page_params)break;
  const u=new URL(url);
  for(const [k,v] of Object.entries(response.next_page_params))if(v!=null)u.searchParams.set(k,String(v));
  next=u.toString();
 }
 const transfers=items.filter(r=>lower(r.to)===address&&!r.error&&r.success!==false&&String(r.status||'').toLowerCase()!=='error').map(r=>{
  const raw=String(r.value?.value??r.value??'0');
  if(!/^\d+$/.test(raw))throw Error('Invalid native payout amount');
  return {from:lower(r.from),raw:BigInt(raw)};
 }).filter(r=>r.raw>0n);
 // Match the canonical browser preference: direct contract payment first;
 // if no direct payment exists, accept traced inbound proxy transfers.
 const direct=transfers.filter(r=>r.from===lower(tx.to_address));
 const chosen=direct.length?direct:transfers;
 const sum=chosen.reduce((v,r)=>v+r.raw,0n);
 if(sum<=0n)return null;
 return {
  user_id:tx.user_id,wallet_id:tx.wallet_id,project_key:PROJECT,chain_key:CHAIN,
  flow_key:`claim-native:${tx.tx_hash}`,tx_hash:tx.tx_hash,
  block_number:tx.block_number,tx_timestamp:tx.tx_timestamp,
  log_index:-1,token_address:'native',token_symbol:'APTM',token_name:'Apertum',
  token_decimals:18,amount_raw:sum.toString(),amount:decimalAmount(sum.toString(),18),
  counterparty_address:direct.length?lower(tx.to_address):(chosen.length===1?chosen[0].from:null),
  direction:'eingang',updated_at:new Date().toISOString()
 };
}
// The canonical browser uses wallet NFT evidence to match claims. This server
// staging step deliberately assigns an NFT only when ABI arguments identify
// exactly one NFT present in the user-specific Apertum NFT cache. Historical
// ownership, ambiguous calls and unknown NFTs remain unassigned for review.
async function knownWalletNfts(job:any){
 const {data,error}=await sb.from('nft_cache').select('nfts').eq('user_id',job.user_id).eq('wallet_id',job.wallet_id).maybeSingle();
 if(error)throw error;
 const known=new Map<string,any>();
 for(const nft of (Array.isArray(data?.nfts)?data.nfts:[])){
  if(String(nft?.chain||'').toLowerCase()!==CHAIN)continue;
  if(nft?.possibleSpam||nft?.userMarkedSpam)continue;
  const id=String(nft?.tokenId??'');
  if(!/^\d+$/.test(id))continue;
  // Token IDs are only unique inside an NFT contract. Two different NFT
  // collections may both contain #42; never silently select the last one.
  const normalizedId=BigInt(id).toString();
  const contract=lower(nft?.tokenAddress);
  if(!/^0x[0-9a-f]{40}$/.test(contract))continue;
  const prior=known.get(normalizedId);
  if(prior===undefined)known.set(normalizedId,{...nft,_contract:contract});
  else if(prior!==null && prior._contract!==contract)known.set(normalizedId,null);
 }
 return known;
}
function unequivocalClaimNft(input:string,known:Map<string,any>){
 const selector=input.slice(0,10).toLowerCase();
 if(selector!==CLAIM_SELECTOR&&selector!==NEW_MINER_CLAIM_SELECTOR)return null;
 const args=input.slice(10);
 if(!/^[0-9a-f]*$/i.test(args)||args.length%64!==0)return null;
 const limit=selector===CLAIM_SELECTOR?Math.min(args.length,128):args.length;
 const matches=new Set<string>();
 for(let i=0;i<limit;i+=64){
  const id=BigInt('0x'+args.slice(i,i+64)).toString();
  if(known.has(id))matches.add(id);
 }
 if(matches.size!==1)return null;
 const id=[...matches][0];
 // A duplicated numeric NFT ID across contracts is not unique evidence.
 if(!known.get(id))return null;
 // DB claim_nft_id is bigint: never write a JS-rounded identifier.
 if(BigInt(id)>9223372036854775807n)return null;
 return {id,nft:known.get(id)};
}
async function process(job:any){
 const address=await loadAddress(job);const knownNfts=await knownWalletNfts(job);let txCount=0,flowCount=0,nativeClaimFlows=0,claimNftCandidates=0;const txReferralCandidates=new Map<string,any>();const verifiedReferralHashes=new Set<string>();
 const tc=await state(job,RAW_TX_SCAN);
 const lastTx=await paginate(`/addresses/${address}/transactions`,tc,async items=>{
  const rows=items.filter(t=>/^0x[0-9a-f]{64}$/i.test(hash(t))).map(t=>{
   const input=String(t.raw_input||t.input||'');const from=lower(t.from),to=lower(t.to);
   const candidate=unequivocalClaimNft(input,knownNfts);if(candidate)claimNftCandidates++;
   return {user_id:job.user_id,wallet_id:job.wallet_id,project_key:PROJECT,chain_key:CHAIN,tx_hash:hash(t),block_number:Number(t._verifiedBlock),tx_timestamp:t.timestamp||null,from_address:from||null,to_address:to||null,direction:from===address?'ausgang':to===address?'eingang':'sonst',method:canonicalMethod(input,t.method||t.tx_types?.[0]),selector:input.slice(0,10).toLowerCase(),status:String(t.status??t.result??''),value_aptm:aptmAmount(t.value??t.value_wei??'0'),gas_aptm:aptmAmount(t.fee?.value??'0'),raw_input:input,...(candidate?{claim_nft_id:candidate.id,claim_nft_name:String(candidate.nft?.name||candidate.nft?.collectionName||`NFT #${candidate.id}`)}:{}),updated_at:new Date().toISOString()}
  });for(const row of rows)if(address===REFERRAL_WALLET&&lower(row.to_address)===REFERRAL_REWARD_CONTRACT)txReferralCandidates.set(row.tx_hash,row);await insertRawWithoutReplacing('project_transactions',rows,'user_id,project_key,chain_key,wallet_id,tx_hash');
  for(const tx of rows){
   const nativeFlow=await nativeClaimPayout(address,tx);
   if(nativeFlow){await insertRawWithoutReplacing('project_transaction_asset_flows',[nativeFlow],'user_id,project_key,chain_key,wallet_id,flow_key');nativeClaimFlows++}
  }
  txCount+=rows.length
 });await updateState(job,RAW_TX_SCAN,lastTx);
 const fc=await state(job,RAW_FLOW_SCAN);
 const lastFlow=await paginate(`/addresses/${address}/token-transfers?type=ERC-20`,fc,async items=>{
  const rows=items.map((t)=>{
   const token=lower(t.token?.address_hash||t.token?.address||t.token_address);const tx=hash(t);
   const from=lower(t.from),to=lower(t.to);const direction=from===address&&to===address?'intern':to===address?'eingang':from===address?'ausgang':'sonst';
   const raw=String(t.total?.value??t.value??'0'),decimals=Number(t.token?.decimals??t.total?.decimals??18);
   if(!/^0x[0-9a-f]{40}$/i.test(token)||!/^0x[0-9a-f]{64}$/i.test(tx)||!/^\d+$/.test(raw)||!Number.isSafeInteger(decimals)||decimals<0||decimals>36)throw Error('Malformed token transfer');
   const log=Number(t.log_index??t.logIndex??t.index??-1);
   // Do not assign synthetic page indices for missing log_index: page order changes.
   if(!Number.isSafeInteger(log)||log<0)throw Error('Token transfer missing canonical log index');
   return {user_id:job.user_id,wallet_id:job.wallet_id,project_key:PROJECT,chain_key:CHAIN,flow_key:`${tx}|${token}|${log}|${direction}|${raw}`,tx_hash:tx,block_number:Number(t._verifiedBlock),tx_timestamp:t.timestamp||t.block_timestamp||null,log_index:log,token_address:token,token_symbol:String(t.token?.symbol||''),token_name:String(t.token?.name||''),token_decimals:decimals,amount_raw:raw,amount:decimalAmount(raw,decimals),counterparty_address:direction==='eingang'?from:direction==='ausgang'?to:null,direction,updated_at:new Date().toISOString()}
  });for(const row of rows){const candidate=txReferralCandidates.get(row.tx_hash);if(candidate&&isVerifiedReferralTransaction(address,candidate,[row]))verifiedReferralHashes.add(row.tx_hash)}await insertRawWithoutReplacing('project_transaction_asset_flows',rows,'user_id,project_key,chain_key,wallet_id,flow_key');flowCount+=rows.length
 });await updateState(job,RAW_FLOW_SCAN,lastFlow);
 return {transactions:txCount,flows:flowCount,nativeClaimFlows,claimNftCandidates,verifiedReferralEventsObserved:verifiedReferralHashes.size,classification:'observational-only'}
}
Deno.serve(async request=>{
 if(request.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
 if(!SECRET||request.headers.get('x-wallet-refresh-secret')!==SECRET)return Response.json({error:'Unauthorized'},{status:401});
 if(!DB_URL||!SERVICE_KEY||!MASTER)return Response.json({error:'Server configuration missing'},{status:500});
 const minute=localMinute();if(minute<245||minute>=330)return Response.json({ok:true,skipped:'Outside DAO window'});
 const day=localDay();let job:any=null;
 try{const claim=await sb.rpc('wallettracking_reward_claim',{p_day:day,p_project:'dao1'});if(claim.error)throw claim.error;
  job=claim.data?.[0];if(!job)return Response.json({ok:true,skipped:'No pending DAO wallets'});
  const result=await process(job);
  const staged=await sb.rpc('wallettracking_reward_stage',{p_day:day,p_project:'dao1',p_user:job.user_id,p_wallet:job.wallet_id});if(staged.error)throw staged.error;
  return Response.json({ok:true,...result,notice:'Rohdaten importiert; Claim-/Referral-/Preisbewertung ausstehend; Job bewusst NICHT abgeschlossen'});
 }catch(e){const message=String(e instanceof Error?e.message:e);if(job)await sb.rpc('wallettracking_reward_finish',{p_day:day,p_project:'dao1',p_user:job.user_id,p_wallet:job.wallet_id,p_error:message.slice(0,2000)});return Response.json({ok:false,error:message},{status:500})}
})
