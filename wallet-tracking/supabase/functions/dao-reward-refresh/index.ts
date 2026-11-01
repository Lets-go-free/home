// DAO1/APTMDAO: incremental transaction and ERC-20 flow ingestion (staging worker).
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
function aptmAmount(raw:unknown){
 if(typeof raw==='number'){if(!Number.isFinite(raw)||raw<0)throw Error('Invalid APTM value');return raw>1e12?raw/1e18:raw}
 const x=String(raw??'0');if(!/^\d+$/.test(x))throw Error('Invalid APTM value');return Number(BigInt(x))/1e18
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
async function paginate(path:string,cursor:number,handler:(items:any[])=>Promise<void>){
 let url=EXPLORER+path, count=0, max=cursor,complete=false;const visited=new Set<string>();
 while(url){
  if(visited.has(url)||++count>200)throw Error('Explorer pagination safety limit');visited.add(url);
  const response=await json(url);if(!Array.isArray(response.items))throw Error('Explorer missing items');
  let oldest=Infinity;const rows=[];
  for(const t of response.items){const block=Number(t.block_number??t.block);if(!Number.isSafeInteger(block)||block<0)throw Error('Invalid block number');oldest=Math.min(oldest,block);max=Math.max(max,block);if(block>=Math.max(0,cursor-OVERLAP))rows.push(t)}
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
async function process(job:any){
 const address=await loadAddress(job);let txCount=0,flowCount=0;
 const tc=await state(job,RAW_TX_SCAN);
 const lastTx=await paginate(`/addresses/${address}/transactions`,tc,async items=>{
  const rows=items.filter(t=>/^0x[0-9a-f]{64}$/i.test(hash(t))).map(t=>{
   const input=String(t.raw_input||t.input||'');const from=lower(t.from),to=lower(t.to);
   return {user_id:job.user_id,wallet_id:job.wallet_id,project_key:PROJECT,chain_key:CHAIN,tx_hash:hash(t),block_number:Number(t.block_number),tx_timestamp:t.timestamp||null,from_address:from||null,to_address:to||null,direction:from===address?'ausgang':to===address?'eingang':'sonst',method:String(t.method||t.tx_types?.[0]||''),selector:input.slice(0,10).toLowerCase(),status:String(t.status??t.result??''),value_aptm:aptmAmount(t.value??t.value_wei??'0'),gas_aptm:aptmAmount(t.fee?.value??'0'),raw_input:input,updated_at:new Date().toISOString()}
  });await insertRawWithoutReplacing('project_transactions',rows,'user_id,project_key,chain_key,wallet_id,tx_hash');txCount+=rows.length
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
   return {user_id:job.user_id,wallet_id:job.wallet_id,project_key:PROJECT,chain_key:CHAIN,flow_key:`${tx}|${token}|${log}|${direction}|${raw}`,tx_hash:tx,block_number:Number(t.block_number),tx_timestamp:t.timestamp||t.block_timestamp||null,log_index:log,token_address:token,token_symbol:String(t.token?.symbol||''),token_name:String(t.token?.name||''),token_decimals:decimals,amount_raw:raw,amount:decimalAmount(raw,decimals),counterparty_address:direction==='eingang'?from:direction==='ausgang'?to:null,direction,updated_at:new Date().toISOString()}
  });await insertRawWithoutReplacing('project_transaction_asset_flows',rows,'user_id,project_key,chain_key,wallet_id,flow_key');flowCount+=rows.length
 });await updateState(job,RAW_FLOW_SCAN,lastFlow);
 return {transactions:txCount,flows:flowCount}
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
  const completed=await sb.rpc('wallettracking_reward_finish',{p_day:day,p_project:'dao1',p_user:job.user_id,p_wallet:job.wallet_id,p_error:null});if(completed.error)throw completed.error;
  return Response.json({ok:true,...result,notice:'Raw events only; reward classification incomplete; canonical browser cursors untouched'});
 }catch(e){const message=String(e instanceof Error?e.message:e);if(job)await sb.rpc('wallettracking_reward_finish',{p_day:day,p_project:'dao1',p_user:job.user_id,p_wallet:job.wallet_id,p_error:message.slice(0,2000)});return Response.json({ok:false,error:message},{status:500})}
})
