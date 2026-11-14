// DAO1/APTMDAO: incremental transaction and ERC-20 flow ingestion (staging worker).
// A raw import transitions to 'staged', NOT 'completed'. Only the future
// canonical claim/flow/valuation pipeline may mark reward jobs completed.
// Important: NOT a complete reward worker. Candidate ownership checks are now
// durable and incremental; confirmed claims and prices still need canonical enrichment.
import { createClient } from 'npm:@supabase/supabase-js@^2'
import { inspectClaimPayoutCoverage, noPayoutEvidenceAllowed } from './payout-coverage.ts'
import './asset-policy.js'
import { rewardFlowCounterparty } from './counterparty-policy.js'
const DB_URL=Deno.env.get('SUPABASE_URL')||''
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''
const CRON_SECRET=Deno.env.get('DAO_REWARD_CRON_SECRET')||''
const MASTER=Deno.env.get('WALLET_ENCRYPTION_MASTER_KEY_V1')||''
const sb=createClient(DB_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const enc=new TextEncoder(),dec=new TextDecoder()
const EXPLORER='https://explorer.apertum.io/api/v2'
const OVERLAP=250
const MAX_HISTORICAL_CHECKS=20
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
const REFERRAL_REWARD_CONTRACT='0xcd40d3bcfc29c51edb1fdd78580578362366f856'
const REFERRAL_WUSDT_TOKEN='0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f'
// Verified wAPTM backpayments from the known legacy MineBot migration payout wallet.
// A transfer is an unreviewed candidate, never an automatic confirmed claim.
const LEGACY_MINER_PAYOUT_SENDER='0x6d0539de11b95e18cb202a55098e3854b0313022'
const LEGACY_MINER_WAPTM='0x110ac02ba3384bc055c13a87766049a74517beda'
function isVerifiedReferralTransaction(address:string,tx:any,flows:any[]){
 const method=String(tx?.method||'').toLowerCase()
 return /^0x[0-9a-f]{40}$/.test(address)
  && lower(tx?.to_address)===REFERRAL_REWARD_CONTRACT
  && (!method||method==='withdraw'||method==='contract call'||method.startsWith('0x'))
  && flows.some(f=>f.direction==='eingang'&&lower(f.token_address)===REFERRAL_WUSDT_TOKEN&&lower(f.counterparty_address)===REFERRAL_REWARD_CONTRACT)
}
// Server-side DAO referral classification mirrors verifiedReferralRewards() in
// projects/dao1/dao1.js. The canonical asset flows are the source of truth:
// no separate reward posting, token valuation, or inferred DID is created.
// TX + flow key is the identity (one withdrawal can have several assets).
// Fetch each persisted stream once per page. The earlier implementation did an
// extra SQL request for every 40 relevant transactions and could time out.
// Fetch bounds are intentional: an incomplete audit must fail, not silently
// return a partial reward total.
async function referralAuditRows(table:string,columns:string,job:any,onlyIncoming=false){
 const pageSize=500,maxPages=20,rows:any[]=[];
 const deadline=AbortSignal.timeout(30000);
 for(let page=0;page<maxPages;page++){
  let query=sb.from(table).select(columns)
   .eq('user_id',job.user_id).eq('wallet_id',job.wallet_id)
   .eq('project_key',PROJECT).eq('chain_key',CHAIN);
  if(onlyIncoming)query=query.eq('direction','eingang');
  const {data,error}=await query.order('id',{ascending:true})
   .range(page*pageSize,(page+1)*pageSize-1)
   .abortSignal(deadline);
  if(error)throw Error('Referral audit '+table+': '+error.message);
  const batch=data||[];rows.push(...batch);
  if(batch.length<pageSize)return rows;
 }
 throw Error('Referral audit '+table+': page safety limit reached; complete scan required');
}
async function verifiedReferralSummary(job:any,address:string){
 const empty={verifiedTransactions:0,verifiedFlows:0,byAsset:[] as any[],unverifiedIncomingWusdt:0};

 // Bounded streams for any eligible wallet; no external explorer calls.
 // No external explorer call, no writes, and no per-transaction DB requests.
 const [transactions,flows]=await Promise.all([
  referralAuditRows('project_transactions','tx_hash,to_address,method,selector,claim_nft_subtype',job),
  referralAuditRows('project_transaction_asset_flows','tx_hash,flow_key,direction,token_address,token_symbol,amount,counterparty_address,value_usd',job,true)
 ]);
 const byTx=new Map<string,any[]>();
 for(const f of flows){const key=lower(f.tx_hash);if(!byTx.has(key))byTx.set(key,[]);byTx.get(key)!.push(f)}
 const assets=new Map<string,{tokenAddress:string,symbol:string,amount:string,flows:number,pricedFlows:number}>();
 let verifiedTransactions=0,verifiedFlows=0,unverifiedIncomingWusdt=0;
 const seen=new Set<string>();
 for(const tx of transactions){
  const key=lower(tx.tx_hash);if(seen.has(key))continue;seen.add(key);
  const incoming=byTx.get(key)||[];
  const isDid=String(tx.claim_nft_subtype||'').toUpperCase()==='DID';
  const isClaim=[CLAIM_SELECTOR,NEW_MINER_CLAIM_SELECTOR].includes(String(tx.selector||'').toLowerCase());
  const eligible=isDid?incoming:
   !isClaim&&isVerifiedReferralTransaction(address,tx,incoming)
    ?incoming.filter((f:any)=>f.direction==='eingang'&&lower(f.token_address)===REFERRAL_WUSDT_TOKEN&&lower(f.counterparty_address)===REFERRAL_REWARD_CONTRACT):[];
  if(!eligible.length){
   if(!isDid)unverifiedIncomingWusdt+=incoming.filter((f:any)=>lower(f.token_address)===REFERRAL_WUSDT_TOKEN).length;
   continue;
  }
  verifiedTransactions++;
  const flowSeen=new Set<string>();
  for(const f of eligible){
   const identity=String(f.flow_key||'')||[lower(f.tx_hash),lower(f.token_address),String(f.amount),lower(f.counterparty_address)].join(':');
   if(flowSeen.has(identity))continue;flowSeen.add(identity);
   const contract=lower(f.token_address),symbol=String(f.token_symbol||'TOKEN');
   const assetKey=contract||'symbol:'+symbol.toLowerCase();
   let entry=assets.get(assetKey);
   if(!entry){entry={tokenAddress:contract,symbol,amount:'0',flows:0,pricedFlows:0};assets.set(assetKey,entry)}
   entry.amount=addDecimalStrings(entry.amount,String(f.amount??'0'));
   entry.flows++;verifiedFlows++;
   if(f.value_usd!==null&&f.value_usd!==undefined)entry.pricedFlows++;
  }
 }
 return {verifiedTransactions,verifiedFlows,unverifiedIncomingWusdt,
  scannedTransactions:transactions.length,scannedIncomingFlows:flows.length,
  byAsset:[...assets.values()].sort((a,b)=>a.tokenAddress.localeCompare(b.tokenAddress)),
  notice:'Read-only server-side classification of persisted payouts. Bounded paginated queries; no reward posting or NFT assignment; historical values remain canonical.'};
}
function addDecimalStrings(a:string,b:string){
 const decimal=/^-?\d+(?:\.\d+)?$/;
 if(!decimal.test(a)||!decimal.test(b))throw Error('Invalid canonical referral amount');
 const scale=Math.max((a.split('.')[1]||'').length,(b.split('.')[1]||'').length);
 const n=(s:string)=>{const sign=s.startsWith('-')?-1n:1n;const parts=s.replace('-','').split('.');return sign*BigInt(parts[0]+(parts[1]||'').padEnd(scale,'0'))};
 const sum=n(a)+n(b),negative=sum<0n,raw=(negative?-sum:sum).toString().padStart(scale+1,'0');
 return (negative?'-':'')+(scale?raw.slice(0,-scale)+'.'+raw.slice(-scale):raw);
}

// Do not advance the canonical browser/claim cursors until reward enrichment is implemented.
const RAW_TX_SCAN='reward_server_raw_transactions_v1'
const RAW_FLOW_SCAN='reward_server_raw_flows_v1'
// Independent targeted scan: a token transfer may not be listed in the wallet's address transactions.
const REFERRAL_FLOW_SCAN='reward_server_referral_wusdt_v1'
// Preserve structured PostgREST/PostgreSQL errors instead of rendering '[object Object]'.
// Response remains bounded and contains no credentials, wallet plaintext or request headers.
function daoErrorSummary(e:unknown):string{
 if(e instanceof Error)return e.message||e.name||'Unknown error';
 if(typeof e==='string')return e||'Unknown error';
 if(e&&typeof e==='object'){
  const o=e as Record<string,unknown>;
  const parts=[typeof o.code==='string'?`SQL ${o.code}`:null,
   typeof o.message==='string'?o.message:null,
   typeof o.details==='string'?o.details:null,
   typeof o.hint==='string'?o.hint:null].filter(Boolean);
  if(parts.length)return parts.join(' | ').slice(0,1200);
  return 'Unbekannter strukturierter Fehler (Details im Server-Log prüfen)';
 }
 return String(e??'Unknown error').slice(0,1200);
}
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
// Decrypt only addresses owned by the current queue user in memory; never return
// addresses, keys or this set to the client. A failed decryption must abort the
// staging step rather than accidentally persist an internal wallet counterparty.
async function ownAddressesForJob(job:any):Promise<Set<string>> {
 const user=String(job.user_id);
 const addresses=new Set<string>();
 const key=await userKey(user);
 const pageSize=200;
 for(let offset=0;offset<2000;offset+=pageSize){
  const {data,error}=await sb.from('wallets')
   .select('id,user_id,evm_address_ciphertext,encryption_version,key_version')
   .eq('user_id',user).not('evm_address_ciphertext','is',null)
   .order('id').range(offset,offset+pageSize-1);
  if(error)throw error;
  for(const wallet of data||[]){
   if(wallet.encryption_version!==1||wallet.key_version!==1)
    throw Error('Unsupported own-wallet encryption metadata');
   const address=await decryptWalletField(key,user,wallet.id,wallet.evm_address_ciphertext,'evm_address');
   if(!/^0x[0-9a-f]{40}$/i.test(address))throw Error('Invalid decrypted own-wallet address');
   addresses.add(address.toLowerCase());
  }
  if((data||[]).length<pageSize)return addresses;
 }
 throw Error('Own-wallet scope exceeds safe bound');
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
// Checkpoint pages in the existing *server-only* scan types. The verified
// block cursor advances only after the full historical range has been read.
// Page checkpoints are recoverable on crashes: the database writes below are
// insert-only, so replaying a partially processed page is idempotent.
const MAX_PAGES_PER_INVOCATION=8;
type RawScanState={block:number;checkpoint:any|null};
async function state(job:any,kind:string):Promise<RawScanState>{
 const {data,error}=await sb.from('project_scan_state').select('last_scanned_block,last_scan_message')
  .eq('user_id',job.user_id).eq('wallet_id',job.wallet_id).eq('project_key',PROJECT)
  .eq('chain_key',CHAIN).eq('scan_type',kind).maybeSingle();
 if(error)throw error;
 let checkpoint=null;
 if(data?.last_scan_message){
  try{checkpoint=JSON.parse(data.last_scan_message)}catch{throw Error('Invalid reward scan checkpoint')}
  if(checkpoint?.version!==1||typeof checkpoint.next!=='object'||
     !Number.isSafeInteger(checkpoint.startBlock)||!Number.isSafeInteger(checkpoint.highestBlock)||
     (checkpoint.oldestBlock!==undefined&&(!Number.isSafeInteger(checkpoint.oldestBlock)||checkpoint.oldestBlock<=0)))
   throw Error('Unsupported reward scan checkpoint');
 }
 return {block:Number(data?.last_scanned_block||0),checkpoint};
}
async function saveScan(job:any,kind:string,block:number,checkpoint:any|null,verifiedEmpty=false){
 const result=checkpoint?'partial':verifiedEmpty?'empty_verified':'complete';
 const {error}=await sb.from('project_scan_state').upsert({user_id:job.user_id,
  wallet_id:job.wallet_id,project_key:PROJECT,chain_key:CHAIN,scan_type:kind,
  last_scanned_block:block,last_scanned_at:new Date().toISOString(),updated_at:new Date().toISOString(),
  last_scan_message:checkpoint?JSON.stringify(checkpoint):null,
  last_scan_result:result},
  {onConflict:'user_id,project_key,chain_key,wallet_id,scan_type'});
 if(error)throw error;
 // A successful upsert response alone is insufficient for manual diagnostics:
 // verify that the exact continuation (or completed block) is readable back.
 const {data:stored,error:readError}=await sb.from('project_scan_state')
  .select('last_scanned_block,last_scan_message,last_scan_result')
  .eq('user_id',job.user_id).eq('wallet_id',job.wallet_id)
  .eq('project_key',PROJECT).eq('chain_key',CHAIN).eq('scan_type',kind).maybeSingle();
 if(readError||!stored)throw Error('Reward checkpoint read-back failed');
 if(Number(stored.last_scanned_block)!==block||
    (stored.last_scan_message??null)!==(checkpoint?JSON.stringify(checkpoint):null)||
    stored.last_scan_result!==result)
  throw Error('Reward checkpoint write not confirmed');
}
function explorerPageUrl(path:string,params:Record<string,unknown>|null){
 const url=new URL(EXPLORER+path);
 for(const [k,v] of Object.entries(params||{}))if(v!==null&&v!==undefined)url.searchParams.set(k,String(v));
 return url.toString();
}
// Blockscout `next_page_params` may be a compound cursor; compare the entire
// object, never just one block/index field. JSON key order is normalized.
function stablePageCursor(next:any):string{
 if(!next||typeof next!=='object'||Array.isArray(next)||!Object.keys(next).length)
  throw Error('Invalid Explorer next page');
 const sorted=Object.entries(next).sort(([a],[b])=>a.localeCompare(b));
 return JSON.stringify(sorted);
}
function assertPageCursorProgress(previous:any,next:any){
 if(previous&&stablePageCursor(previous)===stablePageCursor(next))
  throw Error('Explorer pagination made no progress: unchanged next-page cursor');
}
function assertDescendingBlock(previous:number,current:number){
 if(!Number.isSafeInteger(current)||current<=0||current>previous)
  throw Error('Explorer page order changed; refusing to advance verified cursor');
}
async function paginate(job:any,kind:string,path:string,scan:RawScanState,
 handler:(items:any[])=>Promise<void>,pageLimit=MAX_PAGES_PER_INVOCATION){
 const cursor=scan.block;
 const checkpoint=scan.checkpoint;
 const scanMode=checkpoint?'resume-history':cursor>0?'incremental-delta':'initial-history';
 if(checkpoint&&checkpoint.startBlock!==cursor)throw Error('Reward cursor/checkpoint mismatch');
 let next=checkpoint?.next??null;
 let highest=Number(checkpoint?.highestBlock??cursor);
 // Enforce descending block order across pages AND across invocations. A
 // stale/unstable explorer cursor must never certify an incomplete interval.
 let previousOldest=Number(checkpoint?.oldestBlock??Infinity);
 const startingOldest=Number.isFinite(previousOldest)?previousOldest:null;
 let observedItems=0;
 const visited=new Set<string>();
 for(let page=0;page<pageLimit;page++){
  const url=explorerPageUrl(path,next);
  if(visited.has(url))throw Error('Explorer page cursor loop');visited.add(url);
  const response=await json(url);
  if(!Array.isArray(response.items))throw Error('Explorer missing items');
  let oldest=Infinity;let previousBlock=previousOldest;const rows=[];
  if(!response.items.length&&response.next_page_params)throw Error('Explorer empty page with continuation');
  // A zero-block initial scan is NOT a verified chain tip. Distinguish an
  // explicit successful empty history from an upstream 200/empty anomaly:
  // repeat the query and require the same well-formed terminal empty page.
  // HTTP errors, malformed responses or unexpected continuations fail closed.
  const emptyInitial=cursor===0&&!checkpoint&&page===0&&!response.items.length&&!response.next_page_params;
  if(emptyInitial){
   const confirmation=await json(url);
   if(!confirmation||!Array.isArray(confirmation.items)||confirmation.items.length||confirmation.next_page_params)
    throw Error('Empty Explorer history could not be confirmed');
  }
  for(const item of response.items){
   const block=await itemBlock(item);
   assertDescendingBlock(previousBlock,block);
   previousBlock=block;
   oldest=Math.min(oldest,block);highest=Math.max(highest,block);
   if(block>=Math.max(0,cursor-OVERLAP))rows.push({...item,_verifiedBlock:block});
  }
  // A completed scan rechecks only the overlap plus newly confirmed events.
  // Empty delta pages must not rewrite a verified cursor or replay old events.
  if(rows.length)await handler(rows);
  observedItems+=response.items.length;
  const finished=!response.next_page_params||(cursor>0&&oldest<Math.max(0,cursor-OVERLAP));
  if(finished){
   // In incremental mode the first page can be entirely old history.
   // Report this as a successful no-change check, not historical progress.
   const advanced=highest>cursor;
   if(checkpoint||advanced||cursor===0)await saveScan(job,kind,highest,null,emptyInitial);
   return {complete:true,coverageVerified:true,verifiedEmpty:emptyInitial,block:highest,pages:page+1,observedItems,
    scanMode,newBlocksObserved:advanced,upToDate:emptyInitial||(cursor>0&&!advanced),
    checkpointProgress:{hadCheckpoint:!!checkpoint,startOldest:startingOldest,
     endOldest:Number.isFinite(oldest)?oldest:null,advanced:!!checkpoint||advanced}};
  }
  const nextParams=response.next_page_params;
  if(!nextParams||typeof nextParams!=='object'||Array.isArray(nextParams)||
     !Object.keys(nextParams).length)throw Error('Invalid Explorer next page');
  // The Explorer must advance its continuation even when no new records were
  // inserted (those may all already exist). Never silently accept a loop.
  assertPageCursorProgress(next,nextParams);
  // Commit page continuation only AFTER the handler has successfully saved
  // every event and candidate in this page.
  await saveScan(job,kind,cursor,{version:1,startBlock:cursor,highestBlock:highest,
   oldestBlock:Number.isFinite(oldest)?oldest:previousOldest,next:nextParams});
  previousOldest=oldest;next=nextParams;
 }
 return {complete:false,coverageVerified:false,verifiedEmpty:false,block:cursor,pages:pageLimit,observedItems,
  scanMode,newBlocksObserved:highest>cursor,upToDate:false,
  checkpointProgress:{hadCheckpoint:!!checkpoint,startOldest:startingOldest,
   endOldest:Number.isFinite(previousOldest)?previousOldest:null,
   advanced:!checkpoint||stablePageCursor(checkpoint.next)!==stablePageCursor(next)}};
}
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
// staging step may observe an NFT-ID candidate from the current wallet cache,
// but MUST NOT persist claim_nft_id: present-day ownership does not prove
// ownership at the historical claim block. A verified NFT contract + historical
// transfer/ownership proof is required before writing claim_nft_id.
async function knownWalletNfts(job:any){
 const {data,error}=await sb.from('nft_cache').select('nfts').eq('user_id',job.user_id).eq('wallet_id',job.wallet_id).maybeSingle();
 if(error)throw error;
 const known=new Map<string,any>();
 // Current NFT inventory is insufficient for older claims. The canonical DAO
 // application also reads project_nft_ownership, including historical bots.
 // These entries are only candidates: ownership at the claim block must still
 // be established independently from the on-chain transfer history.
 const {data:history,error:historyError}=await sb.from('project_nft_ownership')
  .select('chain_key,nft_contract,nft_id,nft_name')
  .eq('user_id',job.user_id).eq('wallet_id',job.wallet_id).eq('project_key',PROJECT);
 if(historyError)throw historyError;
 const add=(idValue:unknown,contractValue:unknown,nft:any)=>{
  const id=String(idValue??'');if(!/^\d+$/.test(id))return;
  const normalizedId=BigInt(id).toString();const contract=lower(contractValue);
  if(!/^0x[0-9a-f]{40}$/.test(contract))return;
  const prior=known.get(normalizedId);
  if(prior===undefined)known.set(normalizedId,{...nft,tokenId:normalizedId,_contract:contract});
  else if(prior!==null&&prior._contract!==contract)known.set(normalizedId,null);
 };
 for(const nft of (Array.isArray(data?.nfts)?data.nfts:[])){
  if(String(nft?.chain||'').toLowerCase()!==CHAIN||nft?.possibleSpam||nft?.userMarkedSpam)continue;
  add(nft?.tokenId,nft?.tokenAddress,nft);
 }
 for(const nft of (history||[])){
  if(String(nft?.chain_key||'').toLowerCase()!==CHAIN)continue;
  add(nft?.nft_id,nft?.nft_contract,{name:nft?.nft_name,historical:true});
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
// Verify ERC-721 historical ownership by the last transfer STRICTLY BEFORE the
// claim block. The API is a contract+token instance history, not wallet balance.
// No writes: a proof is only evidence for the future canonical claim enricher.
// Same-block transfers, missing type/fields and incomplete pagination are unsafe.
async function historicalNftOwnership(nft:any,wallet:string,claimBlock:number){
 const contract=lower(nft?._contract),id=String(nft?.tokenId??'');
 if(!/^0x[0-9a-f]{40}$/.test(contract)||!/^[0-9]+$/.test(id)||
    !Number.isSafeInteger(claimBlock)||claimBlock<=0)return {verified:false,reason:'invalid-input'};
 const root=`${EXPLORER}/tokens/${contract}/instances/${BigInt(id).toString()}/transfers`;
 let next=root;const visited=new Set<string>();let preceding:any=null;let precedingBlock=-1;
 let precedingCount=0,lastBlock=Infinity,finished=false;
 for(let page=0;next;page++){
  if(page>=100||visited.has(next))return {verified:false,reason:'pagination-incomplete'};
  visited.add(next);
  const response=await json(next);
  if(!Array.isArray(response?.items))return {verified:false,reason:'missing-history'};
  for(const item of response.items){
   const block=await itemBlock(item);
   if(block>lastBlock)return {verified:false,reason:'history-out-of-order'};
   lastBlock=block;
   if(block===claimBlock)return {verified:false,reason:'same-block-ambiguous'};
   if(block<claimBlock){
    if(precedingBlock===-1){precedingBlock=block;preceding=item;}
    if(block===precedingBlock){precedingCount++;continue;}
    // A strictly older block means we have inspected every transfer in the
    // latest prior block, even if its entries spanned multiple pages.
    finished=true;break;
   }
  }
  if(finished)break;
  if(!response.next_page_params)break;
  const url=new URL(root);
  for(const [k,v] of Object.entries(response.next_page_params))if(v!=null)url.searchParams.set(k,String(v));
  next=url.toString();
 }
 if(!preceding)return {verified:false,reason:'no-prior-transfer'};
 // Without transaction/log ordering, two transfers in the same prior block
 // cannot establish the final owner, even if they name the same recipient.
 if(precedingCount!==1)return {verified:false,reason:'prior-block-ambiguous'};
 const tokenType=String(preceding.token?.type||preceding.token_type||'').toUpperCase();
 if(tokenType!=='ERC-721')return {verified:false,reason:'not-proven-erc721'};
 const tokenId=String(preceding.total?.token_id??preceding.token_id??preceding.token_ids?.[0]??'');
 if(!/^\d+$/.test(tokenId)||BigInt(tokenId)!==BigInt(id))return {verified:false,reason:'token-mismatch'};
 const recipient=lower(preceding.to);
 if(!/^0x[0-9a-f]{40}$/.test(recipient))return {verified:false,reason:'missing-recipient'};
 return recipient===wallet?{verified:true,reason:'prior-transfer-recipient'}:{verified:false,reason:'owned-by-other-wallet'};
}
// Read-only end-to-end evidence: an NFT proof alone is not a paid claim.
// A claim is confirmed for staging diagnostics only when its transaction
// succeeded AND a verified, positive incoming payout was observed. This does
// not mutate claim_nft_id nor replace the canonical claim/price pipeline.
function isSuccessfulClaim(tx:any){
 return [CLAIM_SELECTOR,NEW_MINER_CLAIM_SELECTOR].includes(String(tx?.selector||'').toLowerCase())
  && ['ok','success'].includes(String(tx?.status||'').toLowerCase());
}
function hasVerifiedClaimPayout(tx:any,flows:any[],address:string){
 if(!isSuccessfulClaim(tx))return false;
 return flows.some(flow=>{
  if(lower(flow?.tx_hash)!==lower(tx.tx_hash)||flow?.direction!=='eingang')return false;
  if(!/^\d+$/.test(String(flow?.amount_raw??''))||BigInt(String(flow.amount_raw))<=0n)return false;
  // Native transfers are created by nativeClaimPayout only after tracing
  // successful incoming internal transfers for this exact wallet and tx.
  if(flow?.flow_key===`claim-native:${lower(tx.tx_hash)}`&&flow?.token_address==='native')return true;
  // For token payouts the wallet address is proven by the address-scoped scan,
  // and the sender must be the recipient of the claim call. Do not count
  // unverified incoming transfers from unrelated contracts as bot payouts.
  return lower(flow?.counterparty_address)===lower(tx.to_address)
   && /^0x[0-9a-f]{40}$/.test(lower(tx.to_address))
   && /^0x[0-9a-f]{40}$/.test(lower(flow.token_address));
 });
}
// Persist candidate work before moving raw scan cursors. The candidate queue is
// deliberately separate from verified claims and does not affect reward totals.
async function enqueueCandidates(job:any, rows:any[], nfts:Map<string,any>){
 const candidates=[];
 for(const row of rows){
  if(![CLAIM_SELECTOR,NEW_MINER_CLAIM_SELECTOR].includes(row.selector))continue;
  const match=unequivocalClaimNft(row.raw_input,nfts);
  // Neither older claimReward nor newer Miner Claim calls are safe to discard
  // when no unambiguous NFT-ID appears in calldata. Preserve separate,
  // unassigned staging candidates; never manufacture bot ownership or rewards.
  // The legacy status is distinct from new-miner evidence for later review.
  candidates.push({user_id:job.user_id,wallet_id:job.wallet_id,project_key:PROJECT,
   chain_key:CHAIN,tx_hash:row.tx_hash,claim_block:row.block_number,
   nft_contract:match?.nft._contract??null,nft_id:match?.id??null,
   status:match?'pending':row.selector===NEW_MINER_CLAIM_SELECTOR?'unassigned_miner':'unassigned_legacy'});
 }
 if(candidates.length){
  const {error}=await sb.from('dao_reward_claim_candidates').upsert(candidates,
   {onConflict:'user_id,wallet_id,chain_key,tx_hash',ignoreDuplicates:true});
  if(error)throw error;
 }
 return candidates.length;
}
async function verifyPendingCandidates(job:any,address:string){
 const {data,error}=await sb.from('dao_reward_claim_candidates')
  .select('tx_hash,claim_block,nft_contract,nft_id')
  .eq('user_id',job.user_id).eq('wallet_id',job.wallet_id)
  .eq('chain_key',CHAIN).eq('status','pending')
  .order('claim_block',{ascending:true}).limit(MAX_HISTORICAL_CHECKS);
 if(error)throw error;
 let verified=0,checked=0;
 for(const item of (data||[])){
  const proof=await historicalNftOwnership({_contract:item.nft_contract,tokenId:item.nft_id},address,Number(item.claim_block));
  // Missing/inconsistent explorer evidence is a temporary verification failure,
  // NOT proof that this wallet did not own the NFT. Leave the candidate pending
  // and fail the bounded worker attempt so it can retry on a later invocation.
  // In particular, never advance the candidate status after a page-budget exit.
  if(['pagination-incomplete','missing-history','history-out-of-order'].includes(proof.reason)){
   throw Error(`Historical NFT ownership evidence incomplete (${proof.reason}) for ${item.tx_hash}`);
  }
  // Missing or ambiguous evidence is NOT a conclusive negative ownership proof.
  // Keep it visible for manual investigation rather than silently burying it
  // in the same status as a confirmed transfer to somebody else's wallet.
  const conclusiveNegative=proof.reason==='owned-by-other-wallet';
  const candidateStatus=proof.verified?'ownership_verified':conclusiveNegative?'unverified':'needs_review';
  const {error:updateError}=await sb.from('dao_reward_claim_candidates').update({
   status:candidateStatus,
   proof_reason:proof.reason,checked_at:new Date().toISOString()})
   .eq('user_id',job.user_id).eq('wallet_id',job.wallet_id)
   .eq('chain_key',CHAIN).eq('tx_hash',item.tx_hash).eq('status','pending');
  if(updateError)throw updateError;
  checked++;if(proof.verified)verified++;
 }
 const {count,error:countError}=await sb.from('dao_reward_claim_candidates')
  .select('tx_hash',{count:'exact',head:true}).eq('user_id',job.user_id)
  .eq('wallet_id',job.wallet_id).eq('chain_key',CHAIN).eq('status','pending');
 if(countError)throw countError;
 return {historicalChecks:checked,historicallyVerifiedCandidates:verified,pendingHistoricalChecks:count||0};
}

// Second independent proof: ownership_verified is NOT the same as paid.
// Inspect only persisted, wallet-scoped transaction and transfer evidence;
// do not modify the canonical reward totals, historical prices or NFT fields.
// Produce an exact, transaction-local payout proof. This is staging evidence,
// not a canonical reward or valuation. Never infer a payout from token symbols.
type PayoutEvidence={status:'verified'|'needs_review'|'no_payout_evidence';reason:string;token_address?:string;amount_raw?:string;token_decimals?:number;flow_count?:number};
function verifiedPayoutEvidence(tx:any,flows:any[],address:string):PayoutEvidence{
 if(!isSuccessfulClaim(tx))return {status:'needs_review',reason:'claim-not-successful'};
 const matched=(flows||[]).filter(flow=>hasVerifiedClaimPayout(tx,[flow],address));
 if(!matched.length)return {status:'needs_review',reason:'no-verified-incoming-flow'};
 const assets=new Set(matched.map(flow=>lower(flow.token_address)));
 // Mixed-token claims require the canonical bot-specific classification.
 if(assets.size!==1)return {status:'needs_review',reason:'multiple-payout-assets'};
 const decimals=new Set(matched.map(flow=>Number(flow.token_decimals)));
 if(decimals.size!==1)return {status:'needs_review',reason:'inconsistent-token-decimals'};
 const d=[...decimals][0];
 if(!Number.isSafeInteger(d)||d<0||d>36)return {status:'needs_review',reason:'invalid-token-decimals'};
 // An exact amount cannot be safely reconstructed from a partially truncated set.
 const keys=matched.map(flow=>String(flow.flow_key||''));
 if(keys.some(key=>!key)||new Set(keys).size!==keys.length)return {status:'needs_review',reason:'ambiguous-flow-keys'};
 const amount=matched.reduce((sum,flow)=>sum+BigInt(String(flow.amount_raw)),0n);
 if(amount<=0n)return {status:'needs_review',reason:'nonpositive-payout'};
 return {status:'verified',reason:'transaction-flow-evidence',
  token_address:[...assets][0],amount_raw:amount.toString(),token_decimals:d,
  flow_count:matched.length};
}
// Explorer/indexer lag can produce a temporarily missing payout. Keep these
// cases retryable: first process new pending claims, then recheck old ambiguous
// evidence at most once per 24 hours. Without this, needs_review is terminal
// even if the next scan imports the missing token transfer. The 20-item budget
// is shared across both classes; an indefinitely ambiguous claim cannot starve
// newly discovered payouts.
async function verifyCandidatePayouts(job:any,address:string,explicitCandidates:any[]|null=null){
 // Payout evidence is independent of NFT ownership, including pending,
 // ownership_verified, unassigned_miner, unassigned_legacy and needs_review.
 const scope=()=>sb.from('dao_reward_claim_candidates').select('tx_hash,payout_checked_at')
  .eq('user_id',job.user_id).eq('wallet_id',job.wallet_id).eq('project_key',PROJECT)
  .eq('chain_key',CHAIN).eq('canonical_existing_verified',false);
 const candidates:any[]=[];
 if(explicitCandidates){candidates.push(...explicitCandidates.slice(0,3))}
 else{
  const {data:pending,error:pendingError}=await scope()
   .eq('payout_status','pending').order('claim_block',{ascending:true}).limit(20);
  if(pendingError)throw pendingError;
  candidates.push(...(pending||[]));
  if(candidates.length<20){
   const retryBefore=new Date(Date.now()-24*60*60*1000).toISOString();
   const {data:stale,error:staleError}=await scope()
    .in('payout_status',['needs_review','no_payout_evidence'])
    .or(`payout_checked_at.is.null,payout_checked_at.lt.${retryBefore}`)
    .order('payout_checked_at',{ascending:true,nullsFirst:true})
    .limit(20-candidates.length);
   if(staleError)throw staleError;
   candidates.push(...(stale||[]));
  }
 }
 let verified=0,needsReview=0,noEvidence=0,concurrentSkips=0;const results=[];
 for(const candidate of candidates){
  const {data:tx,error:txError}=await sb.from('project_transactions')
   .select('tx_hash,selector,status,to_address,block_number').eq('user_id',job.user_id)
   .eq('wallet_id',job.wallet_id).eq('project_key',PROJECT).eq('chain_key',CHAIN)
   .eq('tx_hash',candidate.tx_hash).maybeSingle();
  if(txError)throw txError;
  const {data:flows,error:flowError}=await sb.from('project_transaction_asset_flows')
   .select('tx_hash,direction,amount_raw,flow_key,token_address,token_decimals,counterparty_address')
   .eq('user_id',job.user_id).eq('wallet_id',job.wallet_id)
   .eq('project_key',PROJECT).eq('chain_key',CHAIN).eq('tx_hash',candidate.tx_hash).limit(1001);
  if(flowError)throw flowError;
  let evidence:PayoutEvidence=tx?verifiedPayoutEvidence(tx,flows||[],address):{status:'needs_review',reason:'transaction-not-persisted'};
  let coverage:any={source:'persisted-flows-v1',complete:false};
  if((flows||[]).length>=1000)evidence={status:'needs_review',reason:'persisted-flow-limit'};
  else if(tx&&evidence.reason==='no-verified-incoming-flow'){
   const checked=await inspectClaimPayoutCoverage(tx,address,json,EXPLORER);
   coverage=checked.coverage;
   evidence={status:noPayoutEvidenceAllowed(coverage,flows||[])?'no_payout_evidence':'needs_review',reason:checked.reason};
   if(evidence.status==='needs_review'&&coverage.complete&&!coverage.observed_incoming)
    evidence.reason='stored-flow-conflicts-with-negative-evidence';
  }
  // Row lock + checked-at compare prevent concurrent stale/downgrade writes.
  // History is bounded in SQL; only staging payout metadata is ever written.
  const {data:applied,error:writeError}=await sb.rpc('wallettracking_dao_record_payout_check',{
   p_user:job.user_id,p_wallet:job.wallet_id,p_tx:candidate.tx_hash,
   p_expected_checked_at:candidate.payout_checked_at??null,
   p_status:evidence.status,p_reason:evidence.reason,p_coverage:coverage,
   p_token:evidence.status==='verified'?evidence.token_address:null,
   p_amount:evidence.status==='verified'?evidence.amount_raw:null,
   p_decimals:evidence.status==='verified'?evidence.token_decimals:null,
   p_flow_count:evidence.status==='verified'?evidence.flow_count:null});
  if(writeError)throw writeError;
  if(!applied){concurrentSkips++;continue}
  if(evidence.status==='verified')verified++;
  else if(evidence.status==='no_payout_evidence')noEvidence++;else needsReview++;
  results.push({txHash:candidate.tx_hash,payout_status:evidence.status,reason:evidence.reason,coverage});
 }
 const {count:pendingCount,error:pendingCountError}=await sb.from('dao_reward_claim_candidates')
  .select('tx_hash',{head:true,count:'exact'}).eq('user_id',job.user_id).eq('wallet_id',job.wallet_id)
  .eq('project_key',PROJECT).eq('chain_key',CHAIN).eq('canonical_existing_verified',false).eq('payout_status','pending');
 if(pendingCountError)throw pendingCountError;
 return {verifiedPayoutClaims:verified,payoutsNeedingReview:needsReview,
  pendingPayoutChecks:pendingCount??0,noPayoutEvidenceClaims:noEvidence,concurrentPayoutSkips:concurrentSkips,
  ...(explicitCandidates?{results}:{})};
}

// Explicitly reconcile already persisted and valued native Miner Claims. This
// updates ONLY the staging candidate status; canonical rewards and prices stay
// untouched. It does not invent NFT ownership and is safe to repeat.
async function classifyExistingClaims(job:any){
 const {data,error}=await sb.rpc('wallettracking_dao_mark_existing_paid_claims',
  {p_user:job.user_id,p_wallet:job.wallet_id,p_limit:500});
 if(error)throw error;
 return Number(data||0);
}
async function process(job:any,stageOnly=false){
 // Manual staging: one Explorer page per stream, no ownership/payout verification,
 // no price or canonical Claim RPCs. Still persist raw events and durable scan cursors.
 const pageLimit=stageOnly?1:MAX_PAGES_PER_INVOCATION;
 const address=await loadAddress(job);const ownAddresses=await ownAddressesForJob(job);const knownNfts=await knownWalletNfts(job);
 let txCount=0,flowCount=0,nativeClaimFlows=0,claimNftCandidates=0;
 const tc=await state(job,RAW_TX_SCAN);
 const txProgress=await paginate(job,RAW_TX_SCAN,`/addresses/${address}/transactions`,tc,async items=>{
  const rows=items.filter(t=>/^0x[0-9a-f]{64}$/i.test(hash(t))).map(t=>{
   const input=String(t.raw_input||t.input||'');const from=lower(t.from),to=lower(t.to);
   return {user_id:job.user_id,wallet_id:job.wallet_id,project_key:PROJECT,chain_key:CHAIN,
    tx_hash:hash(t),block_number:Number(t._verifiedBlock),tx_timestamp:t.timestamp||null,
    from_address:from||null,to_address:to||null,
    direction:from===address?'ausgang':to===address?'eingang':'sonst',
    method:canonicalMethod(input,t.method||t.tx_types?.[0]),selector:input.slice(0,10).toLowerCase(),
    status:String(t.status??t.result??''),value_aptm:aptmAmount(t.value??t.value_wei??'0'),
    gas_aptm:aptmAmount(t.fee?.value??'0'),raw_input:input,updated_at:new Date().toISOString()};
  });
  // Durable queue must be written BEFORE cursor advance. On a failed scan,
  // overlap replay is harmless because both writes are insert-only.
  claimNftCandidates+=await enqueueCandidates(job,rows,knownNfts);
  await insertRawWithoutReplacing('project_transactions',rows,'user_id,project_key,chain_key,wallet_id,tx_hash');
  for(const tx of rows){
   const nativeFlow=await nativeClaimPayout(address,tx);
   if(nativeFlow){await insertRawWithoutReplacing('project_transaction_asset_flows',[nativeFlow],
    'user_id,project_key,chain_key,wallet_id,flow_key');nativeClaimFlows++}
  }
  txCount+=rows.length;
 },pageLimit);

 // Reuse the exact same canonical flow keys for broad and targeted scans.
 // This prevents double-counting when Blockscout returns the same event twice.
 function transferRows(items:any[]){
  return items.map(t=>{
   const token=lower(t.token?.address_hash||t.token?.address||t.token_address);const tx=hash(t);
   const from=lower(t.from),to=lower(t.to);
   const direction=from===address&&to===address?'intern':to===address?'eingang':from===address?'ausgang':'sonst';
   const raw=String(t.total?.value??t.value??'0'),decimals=(globalThis as any).WTDaoAssetPolicy.technicalDecimals(t.token?.decimals??t.total?.decimals);
   if(!/^0x[0-9a-f]{40}$/i.test(token)||!/^0x[0-9a-f]{64}$/i.test(tx)||!/^[0-9]+$/.test(raw)||
      decimals===null||!Number.isSafeInteger(decimals)||decimals<0||decimals>36)throw Error('Malformed token transfer');
   const log=Number(t.log_index??t.logIndex??t.index??-1);
   if(!Number.isSafeInteger(log)||log<0)throw Error('Token transfer missing canonical log index');
   return {user_id:job.user_id,wallet_id:job.wallet_id,project_key:PROJECT,chain_key:CHAIN,
    flow_key:`${tx}|${token}|${log}|${direction}|${raw}`,tx_hash:tx,
    block_number:Number(t._verifiedBlock),tx_timestamp:t.timestamp||t.block_timestamp||null,
    log_index:log,token_address:token,token_symbol:String(t.token?.symbol||''),
    token_name:String(t.token?.name||''),token_decimals:decimals,amount_raw:raw,
    amount:decimalAmount(raw,decimals),
    counterparty_address:rewardFlowCounterparty(direction,from,to,address,ownAddresses),
    direction,updated_at:new Date().toISOString()};
  });
 }
 const fc=await state(job,RAW_FLOW_SCAN);
 const flowProgress=await paginate(job,RAW_FLOW_SCAN,`/addresses/${address}/token-transfers?type=ERC-20`,fc,async items=>{
  const rows=transferRows(items);
  await insertRawWithoutReplacing('project_transaction_asset_flows',rows,
   'user_id,project_key,chain_key,wallet_id,flow_key');flowCount+=rows.length;
 },pageLimit);
 // The recipient's normal address TX stream does not necessarily contain ERC-20
 // transfers initiated by the payer. The browser creates a synthetic TX identity
 // for these flow events; the server staging job must do the same, otherwise
 // the existing manual review, DAO1 Bot-Claims and dashboard cannot see them.
 // This does NOT approve a payout or assign a MineBot NFT. Insert-only means
 // the real on-chain TX row (if already present) always wins.
 let stagedLegacyMinerPayouts=0;
 const verifiedLegacyPayoutRows=new Map<string,any>();
 const addLegacyPayout=(f:any)=>{
  if(f.direction!=='eingang'||lower(f.token_address)!==LEGACY_MINER_WAPTM||
     lower(f.counterparty_address)!==LEGACY_MINER_PAYOUT_SENDER||
     !/^[0-9]+$/.test(String(f.amount_raw||''))||BigInt(f.amount_raw)<=0n||
     !/^0x[0-9a-f]{64}$/.test(lower(f.tx_hash)))return;
  const key=lower(f.tx_hash);
  if(verifiedLegacyPayoutRows.has(key))return;
  verifiedLegacyPayoutRows.set(key,{
   user_id:job.user_id,wallet_id:job.wallet_id,project_key:PROJECT,chain_key:CHAIN,
   tx_hash:key,block_number:f.block_number,tx_timestamp:f.tx_timestamp,
   from_address:LEGACY_MINER_PAYOUT_SENDER,to_address:null,
   direction:'eingang',method:'ERC-20 Transfer',selector:'',status:'token-flow',
   value_aptm:'0',gas_aptm:'0',raw_input:'',updated_at:new Date().toISOString()
  });
 };
 // Pick up already-stored payouts too: a previous worker may have advanced its
 // token-transfer cursor without materialising the corresponding TX identity.
 for(let offset=0;offset<100000;offset+=500){
  const {data,error}=await sb.from('project_transaction_asset_flows')
   .select('tx_hash,block_number,tx_timestamp,direction,token_address,counterparty_address,amount_raw')
   .eq('user_id',job.user_id).eq('wallet_id',job.wallet_id)
   .eq('project_key',PROJECT).eq('chain_key',CHAIN)
   .eq('direction','eingang').eq('token_address',LEGACY_MINER_WAPTM)
   .eq('counterparty_address',LEGACY_MINER_PAYOUT_SENDER)
   .order('flow_key',{ascending:true}).range(offset,offset+499);
  if(error)throw error;
  for(const f of data||[])addLegacyPayout(f);
  if((data||[]).length<500)break;
  if(offset===99500)throw Error('Legacy payout scan pagination safety limit');
 }
 if(verifiedLegacyPayoutRows.size){
  await insertRawWithoutReplacing('project_transactions',[...verifiedLegacyPayoutRows.values()],
   'user_id,project_key,chain_key,wallet_id,tx_hash');
  stagedLegacyMinerPayouts=verifiedLegacyPayoutRows.size;
 }
 // Match the browser's targeted referral wUSDT import for each wallet.
 // A targeted transfer is evidence of payment, NOT automatically a referral:
 // the canonical UI also requires the qualifying contract transaction.
 let targetedReferralFlows=0;
 let referralProgress:{complete:boolean;block:number;pages:number}|null=null;
 {
  const rc=await state(job,REFERRAL_FLOW_SCAN);
  referralProgress=await paginate(job,REFERRAL_FLOW_SCAN,
   `/addresses/${address}/token-transfers?type=ERC-20&filter=to&token=${REFERRAL_WUSDT_TOKEN}`,
   rc,async items=>{
    const rows=transferRows(items);
    // Do not accept a silently ignored filter from the Explorer: require
    // wallet, asset and direction independently for every returned event.
    for(const row of rows){
     if(row.direction!=='eingang'||row.token_address!==REFERRAL_WUSDT_TOKEN)
      throw Error('Targeted referral Explorer filter mismatch');
    }
    await insertRawWithoutReplacing('project_transaction_asset_flows',rows,
     'user_id,project_key,chain_key,wallet_id,flow_key');
    targetedReferralFlows+=rows.length;
    // Incoming token events do not necessarily appear in the receiver's TX
    // address history. Materialise only a genuine verified contract withdraw
    // from full TX details, never a made-up transaction from a token symbol.
    const contractTxs=new Map<string,number>();
    for(const row of rows){
     if(row.counterparty_address===REFERRAL_REWARD_CONTRACT)
      contractTxs.set(row.tx_hash,row.block_number);
    }
    for(const [txHash,flowBlock] of contractTxs){
     const tx=await json(`${EXPLORER}/transactions/${txHash}`);
     const from=lower(tx.from),to=lower(tx.to);
     const block=Number(tx.block_number??tx.block);
     const input=String(tx.raw_input||tx.input||'');
     const method=canonicalMethod(input,tx.method||tx.tx_types?.[0]);
     const status=String(tx.status??tx.result??'');
     if(block!==flowBlock||to!==REFERRAL_REWARD_CONTRACT||
        !['ok','success'].includes(status.toLowerCase())||
        !isVerifiedReferralTransaction(address,{to_address:to,method},
         rows.filter(f=>f.tx_hash===txHash)))continue;
     await insertRawWithoutReplacing('project_transactions',[{
      user_id:job.user_id,wallet_id:job.wallet_id,project_key:PROJECT,chain_key:CHAIN,
      tx_hash:txHash,block_number:block,tx_timestamp:tx.timestamp||null,
      from_address:from||null,to_address:to,direction:from===address?'ausgang':'sonst',
      method,selector:input.slice(0,10).toLowerCase(),status,
      value_aptm:aptmAmount(tx.value??tx.value_wei??'0'),
      gas_aptm:aptmAmount(tx.fee?.value??'0'),raw_input:input,
      updated_at:new Date().toISOString()
     }],'user_id,project_key,chain_key,wallet_id,tx_hash');
    }
   },pageLimit);
 }

 if(stageOnly){
  return {mode:'manual-staging-import',transactionsObserved:txCount,
   flowsObserved:flowCount,targetedReferralFlowsObserved:targetedReferralFlows,
   nativeClaimFlowsObserved:nativeClaimFlows,claimCandidatesObserved:claimNftCandidates,
   transactionScan:txProgress,flowScan:flowProgress,referralScan:referralProgress,
   notice:'Only insert-if-absent raw events, claim candidates and separate scan cursors were written. No canonical claim, reward total, price, NFT ownership verification, snapshot, or job queue was modified.'};
 }

 const referrals=await verifiedReferralSummary(job,address);
 // Separate verification budget: unprocessed candidates stay persisted and are
 // retried independently of the raw block cursors on subsequent invocations.
 const verification=await verifyPendingCandidates(job,address);
 // Do not decide that a payout is missing while either explorer import is partial.
 const payoutVerification=txProgress.complete&&flowProgress.complete
  ?await verifyCandidatePayouts(job,address)
  :{verifiedPayoutClaims:0,payoutsNeedingReview:0};
 // Reuse the SAME canonical exact-v13 target-block anchors as the DAO UI.
 // Missing anchors remain unpriced; never seek a preceding price in the worker.
 let exactAnchorPricedFlows=0;
 if(txProgress.complete&&flowProgress.complete){
  const {data,error}=await sb.rpc('wallettracking_dao_apply_exact_target_anchors',
   {p_user:job.user_id,p_wallet:job.wallet_id,p_limit:100});
  if(error)throw error;
  exactAnchorPricedFlows=Number(data||0);
 }
 // Reuse an already established canonical price only when wallet, chain,
 // contract, decimals AND exact block all match, with a unique price/source.
 // This does NOT calculate any new historic price or overwrite a manual value.
 let canonicallyPricedFlows=0;
 if(txProgress.complete&&flowProgress.complete){
  const {data,error}=await sb.rpc('wallettracking_dao_reuse_exact_block_prices',
   {p_user:job.user_id,p_wallet:job.wallet_id,p_limit:100});
  if(error)throw error;
  canonicallyPricedFlows=Number(data||0);
 }
 // Reconcile ONLY already-existing, historically owned DAO claim rows whose
 // payout flows were valued by the application's canonical price pipeline.
 // Unassigned claims, missing prices and unclear evidence remain untouched.
 // This does not complete the daily reward job or invent new reward records.
 let canonicallyReconciledClaims=0;
 if(txProgress.complete&&flowProgress.complete){
  const {data,error}=await sb.rpc('wallettracking_dao_reconcile_verified_claims',
   {p_user:job.user_id,p_wallet:job.wallet_id,p_limit:20});
  if(error)throw error;
  canonicallyReconciledClaims=Number(data||0);
 }
 // Create ONLY missing, fully verified legacy claims with pre-priced on-chain
 // flows. New miner claims / unassigned bots are intentionally excluded.
 let canonicallyCreatedLegacyClaims=0;
 if(txProgress.complete&&flowProgress.complete){
  const {data,error}=await sb.rpc('wallettracking_dao_create_verified_legacy_claims',
   {p_user:job.user_id,p_wallet:job.wallet_id,p_limit:20});
  if(error)throw error;
  canonicallyCreatedLegacyClaims=Number(data||0);
 }
 // New Miner with no proven NFT remains UNASSIGNED, even when its payout
 // has an exact, already-priced on-chain proof. Never manufacture a bot ID.
 let canonicallyCreatedUnassignedMinerClaims=0;
 if(txProgress.complete&&flowProgress.complete){
  const {data,error}=await sb.rpc('wallettracking_dao_create_verified_unassigned_miner_claims',
   {p_user:job.user_id,p_wallet:job.wallet_id,p_limit:20});
  if(error)throw error;
  canonicallyCreatedUnassignedMinerClaims=Number(data||0);
 }
 return {...payoutVerification,referrals,exactAnchorPricedFlows,canonicallyPricedFlows,canonicallyCreatedLegacyClaims,canonicallyReconciledClaims,canonicallyCreatedUnassignedMinerClaims,transactions:txCount,flows:flowCount,targetedReferralFlows,referralScan:referralProgress,nativeClaimFlows,
  claimNftCandidatesObserved:claimNftCandidates,transactionScan:txProgress,flowScan:flowProgress,...verification,
  classification:'observational-only'};
}

// Verify technical decimals by eth_call at the actual claim block, never UI
// display decimals or an assumed 18. Failed archive calls remain reviewable.
async function rpcClaimTokenDecimals(token:string,block:number){
 const asset=(globalThis as any).WTDaoAssetPolicy?.asset(token);
 if(!asset||asset.native)return {token,decimals:null,reason:'unsupported-claim-asset'};
 if(!Number.isSafeInteger(block)||block<=0)return {token,decimals:null,reason:'invalid-claim-block'};
 try{
  const {data:chain,error}=await sb.from('chains').select('rpc_url,archive_rpc_url,evm_chain_id').eq('chain_key',CHAIN).maybeSingle();
  if(error||!(chain?.archive_rpc_url||chain?.rpc_url)||!Number.isSafeInteger(Number(chain.evm_chain_id))||Number(chain.evm_chain_id)<=0)
   return {token,decimals:null,reason:'technical-rpc-unavailable'};
  const url=new URL(chain.archive_rpc_url||chain.rpc_url);if(url.protocol!=='https:')return {token,decimals:null,reason:'technical-rpc-unavailable'};
  async function rpc(method:string,params:any[],id:number){
   const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),15000);
   try{
    const response=await fetch(url.toString(),{method:'POST',signal:abort.signal,
     headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id,method,params})});
    if(!response.ok)throw Error('rpc-unavailable');
    const body=await response.json();if(body.error||body.id!==id||typeof body.result!=='string')throw Error('rpc-incomplete');
    return body.result;
   }finally{clearTimeout(timer)}
  }
  const chainId=await rpc('eth_chainId',[],80601);
  if(!/^0x[0-9a-f]+$/i.test(chainId)||BigInt(chainId)!==BigInt(chain.evm_chain_id))
   return {token,decimals:null,reason:'technical-chain-mismatch'};
  const raw=await rpc('eth_call',[{to:token,data:'0x313ce567'},'0x'+block.toString(16)],80602);
  if(!/^0x[0-9a-f]{64}$/i.test(raw)||BigInt(raw)>36n)return {token,decimals:null,reason:'technical-decimals-invalid'};
  return {token,decimals:Number(BigInt(raw)),block,source:'eth_call-decimals-at-claim-block',reason:'verified'};
 }catch{return {token,decimals:null,reason:'technical-decimals-unavailable'}}
}

// Central metadata is contract-scoped, not a historical price or per-claim RPC proof.
async function resolveCentralTokenDecimals(token:string,block:number|null=null,refresh=false){
 token=lower(token);
 if(!/^0x[0-9a-f]{40}$/.test(token))return {token,decimals:null,reason:'invalid-token-address'};
 const {data:rows,error}=await sb.from('predefined_tokens').select('address,decimals,decimals_status,decimals_source')
  .eq('chain','apertum').ilike('address',token).limit(2);
 if(error)throw Error('Central technical metadata unavailable');
 if(rows?.length>1)return {token,decimals:null,reason:'token-not-uniquely-registered'};
 const registered=rows?.length===1;const row=registered?rows[0]:{};const valid=(globalThis as any).WTDaoAssetPolicy.technicalDecimals;
 if(row.decimals_status==='conflict')return {token,decimals:null,reason:'technical-decimals-conflict'};
 const cached=valid(row.decimals);
 if(!refresh&&cached!==null)return {token,decimals:cached,source:'central-predefined-token-decimals',reason:'verified'};
 let observed:any=null;
 try{
  const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),15000);
  let response:any;try{const res=await fetch(EXPLORER+'/tokens/'+token,{signal:abort.signal});
   if(!res.ok)throw Error('Explorer metadata unavailable');response=await res.json();}finally{clearTimeout(timer)}
  const meta=response?.token||response;
  const returned=meta?.address_hash??meta?.address;
  const returnedAddress=typeof returned==='object'?returned?.hash:returned;
  // A different contract is a contradictory response, never a usable observation.
  if(returnedAddress!=null&&lower(returnedAddress)!==token)return {token,decimals:null,reason:'explorer-token-mismatch'};
  if(meta?.type!=null&&!['ERC-20','ERC20'].includes(meta.type))return {token,decimals:null,reason:'unsupported-token-type'};
  const d=valid(meta?.decimals);
  if(d!==null)observed={token,decimals:d,source:'apertum-explorer-token-metadata',symbol:String(meta?.symbol||''),name:String(meta?.name||'')};
 }catch{/* RPC is only a fallback for missing metadata, never a default scale. */}
 if(!observed&&block!==null)observed=await rpcClaimTokenDecimals(token,block);
 if(!observed||valid(observed.decimals)===null)return {token,decimals:null,reason:'technical-decimals-unavailable'};
 if(!registered)return {...observed,reason:'unregistered-token-metadata',persisted:false};
 const {data:recorded,error:writeError}=await sb.rpc('wallettracking_record_apertum_token_decimals',{
  p_token:token,p_decimals:observed.decimals,p_source:observed.source});
 if(writeError)throw Error('Central technical metadata could not be stored');
 return {...recorded,token,source:observed.source,decimals:valid(recorded?.decimals),symbol:observed.symbol||null,name:observed.name||null};
}
async function verifiedClaimTokenDecimals(token:string,block:number){
 const asset=(globalThis as any).WTDaoAssetPolicy?.asset(token);
 if(!asset||asset.native)return {token,decimals:null,reason:'unsupported-claim-asset'};
 if(!Number.isSafeInteger(block)||block<=0)return {token,decimals:null,reason:'invalid-claim-block'};
 const {data,error}=await sb.functions.invoke('token-metadata',{body:{mode:'resolve',chain:CHAIN,address:token,block}});
 if(error||!data?.ok||data.status!=='verified')return {token,decimals:null,reason:data?.reason||'central-technical-metadata-unavailable'};
 return {token,decimals:(globalThis as any).WTDaoAssetPolicy.technicalDecimals(data.decimals),source:'central-predefined-token-decimals',metadataSource:data.source,reason:'verified'};
}

// Controlled one-claim path: one import page per stream, then at most ONE
// fresh native claim. Historical reference classifications are excluded in SQL.
async function processSingleNativeClaim(job:any,retryBlocked=false,includeErc20=false,skipImport=false){
 // Staged phase reuses the existing canonical single-claim implementation
 // without rescanning or moving any raw cursor a second time.
 const imported=skipImport?{mode:'already-staged',transactionScan:{complete:true},flowScan:{complete:true},referralScan:null}:await process(job,true);
 if(!imported.transactionScan.complete||!imported.flowScan.complete||imported.referralScan?.complete===false)
  return {status:'import_partial',claimsCreated:0,imported};
 const {data:candidate,error:pickError}=await sb.rpc('wallettracking_dao_next_native_claim_candidate',{
  p_user:job.user_id,p_wallet:job.wallet_id,p_retry_blocked:retryBlocked});
 if(pickError)throw pickError;
 if(!candidate)return {status:'no_eligible_claim',claimsCreated:0,imported};
 const address=await loadAddress(job);
 // Current NFT inventory was only a candidate. Reuse historical owner proof;
 // incomplete evidence never manufactures an NFT or a positive owner decision.
 if(['pending','needs_review'].includes(candidate.status)&&candidate.nft_contract&&candidate.nft_id!=null){
  const proof=await historicalNftOwnership({_contract:candidate.nft_contract,tokenId:candidate.nft_id},address,Number(candidate.claim_block));
  const temporary=['pagination-incomplete','missing-history','history-out-of-order'].includes(proof.reason);
  if(!temporary){
   const {error}=await sb.from('dao_reward_claim_candidates').update({
    status:proof.verified?'ownership_verified':proof.reason==='owned-by-other-wallet'?'unverified':'needs_review',
    proof_reason:proof.reason,checked_at:new Date().toISOString()})
    .eq('user_id',job.user_id).eq('wallet_id',job.wallet_id).eq('project_key',PROJECT)
    .eq('chain_key',CHAIN).eq('tx_hash',candidate.tx_hash).eq('canonical_existing_verified',false)
    .in('status',['pending','needs_review']);
   if(error)throw error;
  }
 }
 let payout=null;
 if(candidate.payout_status!=='verified')payout=await verifyCandidatePayouts(job,address,[candidate]);
 let assetEvidence:any=null;
 let fixedQuote:any=null;
 if(includeErc20){
  const {data:paid,error}=await sb.from('dao_reward_claim_candidates')
   .select('payout_status,payout_token_address').eq('user_id',job.user_id).eq('wallet_id',job.wallet_id)
   .eq('project_key',PROJECT).eq('chain_key',CHAIN).eq('tx_hash',candidate.tx_hash).maybeSingle();
  if(error)throw error;
  if(paid?.payout_status==='verified'&&paid.payout_token_address!=='native'){
   assetEvidence=await verifiedClaimTokenDecimals(lower(paid.payout_token_address),Number(candidate.claim_block));
   fixedQuote=(globalThis as any).WTDaoAssetPolicy?.fixedQuote(paid.payout_token_address)||null;
  }
 }
 const rpcName=includeErc20?'wallettracking_dao_finalize_single_claim_with_metadata':'wallettracking_dao_finalize_single_native_claim';
 const params:any={p_user:job.user_id,p_wallet:job.wallet_id,p_tx:candidate.tx_hash};
 if(includeErc20)Object.assign(params,{p_verified_token:assetEvidence?.token??null,
  p_verified_decimals:assetEvidence?.decimals??null,p_metadata_source:assetEvidence?.source??null,p_fixed_price:fixedQuote?.price??null,p_include_erc20:true});
 const {data:finalized,error:finalizeError}=await sb.rpc(rpcName,params);
 if(finalizeError)throw finalizeError;
 return {...(finalized||{}),imported,payout,...(includeErc20?{assetEvidence}:{})};
}

// Read-only, manually enabled single-address readiness check. It never claims a
// queue row, advances a cursor, imports an event or writes to a reward table.
const INSPECT_ADDRESS='0x239c5822a0d2a67e629d7a3b5c8180721e228b47';
async function countScoped(table:string,filters:Record<string,string>,extra?:{column:string;value:string}){
 let q=sb.from(table).select('*',{head:true,count:'exact'});
 for(const [key,value] of Object.entries(filters))q=q.eq(key,value);
 if(extra)q=q.eq(extra.column,extra.value);
 const {count,error}=await q;
 if(error)throw Error('Inspect '+table+': '+error.message);
 return count||0;
}
async function findInspectWalletMatches(){
 // Do not accept a user-supplied address; explicitly restrict to the known
 // DAO referral test address. Wallet ciphertext remains protected at rest.
 const matches:{id:string;user_id:string}[]=[];
 let offset=0;
 while(true){
  const {data,error}=await sb.from('wallets')
   .select('id,user_id,evm_address_ciphertext,encryption_version,key_version')
   .not('evm_address_ciphertext','is',null)
   .order('id').range(offset,offset+199);
  if(error)throw Error('Inspect wallets: '+error.message);
  const batch=data||[];
  for(const wallet of batch){
   if(wallet.encryption_version!==1||wallet.key_version!==1)continue;
   try{
    const value=await decryptWalletField(await userKey(wallet.user_id),wallet.user_id,
     wallet.id,wallet.evm_address_ciphertext,'evm_address');
    if(value.toLowerCase()===INSPECT_ADDRESS)
     matches.push({id:wallet.id,user_id:wallet.user_id});
   }catch{ /* Unreadable wallets cannot be silently selected. */ }
  }
  if(batch.length<200)break;
  offset+=batch.length;
  if(offset>=2000)throw Error('Inspect wallet search exceeds safe bound');
 }
 return matches;
}
async function inspectTestAddress(){
 const matches=await findInspectWalletMatches();
 const wallets=[];
 for(const wallet of matches){
  const scope={user_id:wallet.user_id,wallet_id:wallet.id,project_key:PROJECT};
  const {data:cursors,error:cursorError}=await sb.from('project_scan_state')
   .select('scan_type,last_scanned_block,last_scan_result')
   .eq('user_id',wallet.user_id).eq('wallet_id',wallet.id)
   .eq('project_key',PROJECT).eq('chain_key',CHAIN)
   .in('scan_type',[RAW_TX_SCAN,RAW_FLOW_SCAN,REFERRAL_FLOW_SCAN]);
  if(cursorError)throw cursorError;
  const {data:attempts,error:attemptError}=await sb.from('wallet_reward_refresh_attempts')
   .select('scan_day,state,attempt_count,last_error')
   .eq('user_id',wallet.user_id).eq('wallet_id',wallet.id)
   .eq('project_key',PROJECT).order('scan_day',{ascending:false}).limit(1);
  if(attemptError)throw attemptError;
  wallets.push({
   // No user id, wallet id, transaction hash, ciphertext, or token amounts.
   transactions:await countScoped('project_transactions',scope),
   incomingFlows:await countScoped('project_transaction_asset_flows',scope,{column:'direction',value:'eingang'}),
   candidateClaims:await countScoped('dao_reward_claim_candidates',
    {user_id:wallet.user_id,wallet_id:wallet.id,chain_key:CHAIN}),
   canonicalAlreadyPricedClaims:await countScoped('dao_reward_claim_candidates',
    {user_id:wallet.user_id,wallet_id:wallet.id,chain_key:CHAIN},
    {column:'canonical_existing_verified',value:'true'}),
   cursors:(cursors||[]).map(({scan_type,last_scanned_block,last_scan_result})=>
    ({scan_type,last_scanned_block,last_scan_result})),
   queue:(attempts||[]).map(({scan_day,state,attempt_count,last_error})=>
    ({scan_day,state,attempt_count,has_error:!!last_error}))
  });
 }
 return {ok:true,mode:'read-only-test',project:PROJECT,chain:CHAIN,
  walletAddress:INSPECT_ADDRESS,matchingWallets:matches.length,wallets,
  notice:'No wallet data, reward sum, snapshot, scan cursor or queue row was modified.'};
}
// Read-only reconciliation audit: never infer an actual payout from a positive
// canonical claim amount alone. The first eligible exact-v13 APTM price block
// in migration 7.88 is 88356, so earlier blocks cannot be filled by fallback.
// This audit is deliberately restricted to the single already-registered test
// wallet and returns no raw wallet identifiers or arbitrary user records.
const APTM_EXACT_ANCHOR_MIN_BLOCK=88356;
async function auditTestClaims(){
 const matches=await findInspectWalletMatches();
 if(matches.length!==1)throw Error('Expected exactly one registered test wallet');
 const job=matches[0];
 const {data:candidates,error:ce}=await sb.from('dao_reward_claim_candidates')
  .select('tx_hash,claim_block,status,payout_status,canonical_existing_verified')
  .eq('user_id',job.user_id).eq('wallet_id',job.id)
  .eq('project_key',PROJECT).eq('chain_key',CHAIN)
  .order('claim_block',{ascending:true}).limit(1000);
 if(ce)throw ce;
 const rows=candidates||[];
 if(rows.length===1000)throw Error('Audit exceeds 999 claim candidates; paginate instead of returning a partial result');
 const known=new Map<string,any>();
 for(let i=0;i<rows.length;i+=80){
  const hashes=rows.slice(i,i+80).map(c=>c.tx_hash);
  const {data:txs,error:te}=await sb.from('project_transactions')
   .select('tx_hash,block_number,selector,claim_reward_aptm,claim_reward_usd,claim_nft_id,price_source')
   .eq('user_id',job.user_id).eq('wallet_id',job.id)
   .eq('project_key',PROJECT).eq('chain_key',CHAIN)
   .in('tx_hash',hashes);
  if(te)throw te;
  for(const tx of txs||[])known.set(lower(tx.tx_hash),tx);
 }
 const buckets=new Map<string,{category:string;count:number}>();
 const selectors=new Map<string,number>();
 const exceptions:any[]=[];
 const totals={candidates:rows.length,canonicalExistingVerified:0,
  pending:0,payoutVerified:0,positiveAptm:0,pricedUsd:0,botAssigned:0,
  noTransaction:0,zeroOrMissingReward:0,positiveUnpricedBeforeExactAnchor:0,
  positiveUnpricedAfterExactAnchor:0,pricedButNotMarkedExisting:0};
 for(const c of rows){
  const t=known.get(lower(c.tx_hash));
  const verified=c.canonical_existing_verified===true;
  if(verified)totals.canonicalExistingVerified++;
  if(c.status==='pending')totals.pending++;
  if(c.payout_status==='verified')totals.payoutVerified++;
  const selector=String(t?.selector||'missing');
  selectors.set(selector,(selectors.get(selector)||0)+1);
  const reward=Number(t?.claim_reward_aptm||0);
  const priced=t?.claim_reward_usd!==null&&t?.claim_reward_usd!==undefined;
  const block=Number(t?.block_number??c.claim_block);
  if(t&&reward>0)totals.positiveAptm++;
  if(t&&priced)totals.pricedUsd++;
  if(t&&t.claim_nft_id!==null&&t.claim_nft_id!==undefined)totals.botAssigned++;
  let category:string;
  if(!t){category='transaction_missing';totals.noTransaction++}
  else if(!(reward>0)){category='zero_or_missing_reward';totals.zeroOrMissingReward++}
  else if(!priced&&block<APTM_EXACT_ANCHOR_MIN_BLOCK){category='unpriced_before_exact_anchor';totals.positiveUnpricedBeforeExactAnchor++}
  else if(!priced){category='unpriced_requires_exact_anchor_review';totals.positiveUnpricedAfterExactAnchor++}
  else if(verified){category='priced_and_existing_verified'}
  else {category='priced_not_marked_existing';totals.pricedButNotMarkedExisting++}
  const entry=buckets.get(category)||{category,count:0};entry.count++;buckets.set(category,entry);
  if(!t||!(reward>0)||!priced){
   exceptions.push({txHash:c.tx_hash,block,selector,aptmReward:t?.claim_reward_aptm??null,
    usdReward:t?.claim_reward_usd??null,botId:t?.claim_nft_id??null,
    priceSource:t?.price_source??null,category});
  }
 }
 return {ok:true,mode:'read-only-reward-audit',project:PROJECT,chain:CHAIN,
  walletAddress:INSPECT_ADDRESS,exactAnchorMinimumBlock:APTM_EXACT_ANCHOR_MIN_BLOCK,
  totals,categories:[...buckets.values()].sort((a,b)=>a.category.localeCompare(b.category)),
  bySelector:[...selectors].map(([selector,count])=>({selector,count})),
  exceptions:exceptions.slice(0,100),exceptionsTruncated:exceptions.length>100,
  notice:'Read-only categorisation. A positive canonical amount or an existing USD value alone does not verify an on-chain payout. Never backfill prices before the exact anchor window using a predecessor or guessed price. No claim, price, reward, cursor, wallet or queue writes.'};
}

// Read-only reconciliation of existing canonical amounts against raw on-chain
// evidence. This is NOT payout verification: any missing, conflicting or
// untrusted proof stays unclassified. Wallet is fixed server-side.
async function reconcileTestClaims(){
 const matches=await findInspectWalletMatches();
 if(matches.length!==1)throw Error('Expected exactly one registered test wallet');
 const job=matches[0], address=INSPECT_ADDRESS;
 const {data:cs,error:ce}=await sb.from('dao_reward_claim_candidates')
  .select('tx_hash,canonical_existing_verified')
  .eq('user_id',job.user_id).eq('wallet_id',job.id)
  .eq('project_key',PROJECT).eq('chain_key',CHAIN).limit(1000);
 if(ce)throw ce;
 if((cs||[]).length===1000)throw Error('Candidate limit reached: paginate before reconciliation');
 const totals={candidates:(cs||[]).length,alreadyMarked:0,
  pricedUnmarked:0,strictNativeMatches:0,strictTokenPayoutEvidence:0,
  noVerifiedPayout:0,ambiguousOrDifferentAsset:0,otherNotEligible:0};
 const examples:any[]=[];
 for(let i=0;i<(cs||[]).length;i+=50){
  const batch=(cs||[]).slice(i,i+50),hashes=batch.map(c=>c.tx_hash);
  const [tr,fr]=await Promise.all([
   sb.from('project_transactions').select('tx_hash,selector,status,to_address,claim_reward_aptm,claim_reward_usd')
    .eq('user_id',job.user_id).eq('wallet_id',job.id).eq('project_key',PROJECT).eq('chain_key',CHAIN).in('tx_hash',hashes),
   sb.from('project_transaction_asset_flows').select('tx_hash,direction,amount_raw,flow_key,token_address,token_decimals,counterparty_address')
    .eq('user_id',job.user_id).eq('wallet_id',job.id).eq('project_key',PROJECT).eq('chain_key',CHAIN).in('tx_hash',hashes)
  ]);
  if(tr.error)throw tr.error;if(fr.error)throw fr.error;
  const txs=new Map((tr.data||[]).map(t=>[lower(t.tx_hash),t]));
  const grouped=new Map<string,any[]>();
  for(const f of fr.data||[]){const h=lower(f.tx_hash);grouped.set(h,[...(grouped.get(h)||[]),f])}
  for(const c of batch){
   if(c.canonical_existing_verified===true){totals.alreadyMarked++;continue}
   const t=txs.get(lower(c.tx_hash));
   if(!t||!isSuccessfulClaim(t)||!(Number(t.claim_reward_aptm)>0)||!(Number(t.claim_reward_usd)>0)){
    totals.otherNotEligible++;continue;
   }
   totals.pricedUnmarked++;
   const evidence=verifiedPayoutEvidence(t,grouped.get(lower(c.tx_hash))||[],address);
   if(evidence.status!=='verified'){
    totals.noVerifiedPayout++;
    if(examples.length<20)examples.push({txHash:c.tx_hash,reason:evidence.reason});
    continue;
   }
   if(evidence.token_address==='native'&&evidence.token_decimals===18&&
      Number(evidence.amount_raw)/1e18===Number(t.claim_reward_aptm)){
    totals.strictNativeMatches++;continue;
   }
   if(evidence.token_address!=='native'){
    totals.strictTokenPayoutEvidence++;
   }else totals.ambiguousOrDifferentAsset++;
   if(examples.length<20)examples.push({txHash:c.tx_hash,reason:'payout-not-equal-to-canonical-aptm'});
  }
 }
 return {ok:true,mode:'read-only-existing-claim-reconciliation',project:PROJECT,chain:CHAIN,
  walletAddress:INSPECT_ADDRESS,totals,examples,
  notice:'Read-only, strict native amount match is diagnostic only; token payouts need canonical asset and ownership checks. No automatic marking or canonical reward modification.'};
}

// Diagnostic only: pin down why the server has no eligible NFT for a bot
// claim. A candidate from calldata is NOT an ownership proof and is never
// written to the canonical claim. This is intentionally read-only.
async function auditTestWalletNftCandidates(job:any){
 const known=await knownWalletNfts(job);
 const totals={knownIds:known.size,ambiguousKnownIds:0,claimTransactions:0,
  withCanonicalNft:0,missingCanonicalNft:0,uniqueCalldataCandidate:0,
  noUniqueCalldataCandidate:0,alreadyStagedWithNft:0};
 for(const nft of known.values())if(nft===null)totals.ambiguousKnownIds++;
 const examples:any[]=[];
 for(let start=0;;start+=200){
  const {data,error}=await sb.from('project_transactions')
   .select('tx_hash,selector,block_number,raw_input,claim_nft_id')
   .eq('user_id',job.user_id).eq('wallet_id',job.wallet_id)
   .eq('project_key',PROJECT).eq('chain_key',CHAIN)
   .in('selector',[CLAIM_SELECTOR,NEW_MINER_CLAIM_SELECTOR])
   .order('id',{ascending:true}).range(start,start+199);
  if(error)throw Error('NFT audit transactions: '+error.message);
  for(const tx of data||[]){
   totals.claimTransactions++;
   if(tx.claim_nft_id!==null){totals.withCanonicalNft++;continue}
   totals.missingCanonicalNft++;
   const match=unequivocalClaimNft(String(tx.raw_input||''),known);
   if(match)totals.uniqueCalldataCandidate++;else totals.noUniqueCalldataCandidate++;
   if(examples.length<12)examples.push({txHash:tx.tx_hash,block:tx.block_number,
    selector:tx.selector,calldataCandidate:match?.id||null,
    reason:match?'candidate-only-needs-historical-ownership':'no-unique-known-nft-id-in-calldata'});
  }
  if((data||[]).length<200)break;
 }
 const {count,error:stagedError}=await sb.from('dao_reward_claim_candidates')
  .select('tx_hash',{count:'exact',head:true}).eq('user_id',job.user_id).eq('wallet_id',job.wallet_id)
  .eq('project_key',PROJECT).eq('chain_key',CHAIN).not('nft_id','is',null);
 if(stagedError)throw Error('NFT audit candidates: '+stagedError.message);
 totals.alreadyStagedWithNft=count||0;
 return {totals,examples,notice:'Read-only diagnostic. Calldata candidate is not historical NFT ownership; no claim assignment or reward change.'};
}

// The manual inspector uses a logged-in ADMIN account, never the daily job secret.
// Its fixed-address scope is enforced server-side and its body cannot select a wallet.
async function authenticateInspectAdmin(request:Request){
 const authorization=request.headers.get('authorization')||'';
 const match=/^Bearer\s+([^\s]+)$/i.exec(authorization);
 if(!match)return {ok:false,status:401,error:'Valid user Authorization Bearer JWT required'};
 const {data:session,error:authError}=await sb.auth.getUser(match[1]);
 if(authError||!session?.user?.id)return {ok:false,status:401,error:'Invalid or expired user JWT'};
 // The existing admins.user_id UUID, NOT client-supplied roles or email, grants access.
 const {data:admin,error:adminError}=await sb.from('admins')
  .select('user_id').eq('user_id',session.user.id).maybeSingle();
 if(adminError)throw Error('Admin authorization check failed');
 if(!admin)return {ok:false,status:403,error:'Administrator access required'};
 return {ok:true,status:200};
}
// Separate DAO cron credential. Do not reuse the wallet-daily-refresh credential.
// Compare digests in constant work; a missing or weak secret never authorizes anything.
async function authorizedDaoCron(request:Request){
 const supplied=request.headers.get('x-dao-reward-cron-secret')||'';
 if(CRON_SECRET.length<32||supplied.length<32||supplied.length>256)return false;
 const hash=async(value:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value)));
 const [actual,expected]=await Promise.all([hash(supplied),hash(CRON_SECRET)]);
 let diff=0;for(let i=0;i<expected.length;i++)diff|=actual[i]^expected[i];
 return diff===0;
}
const metadataCors={'access-control-allow-origin':'*','access-control-allow-headers':'authorization, apikey, content-type, x-client-info','access-control-allow-methods':'POST, OPTIONS'};
Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:metadataCors});
 if(request.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
 if(!DB_URL||!SERVICE_KEY||!MASTER)return Response.json({error:'Server configuration missing'},{status:500});
 // The test route is independent from the existing daily-refresh secret.
 // All other routes continue to require that secret, even if the worker is disabled.
 let body:any={};try{body=await request.json()}catch{}
 if(body?.mode==='resolve-apertum-token-decimals'||body?.mode==='refresh-apertum-token-decimals'){
  const reply=(value:any,status=200)=>Response.json(value,{status,headers:metadataCors});
  try{
   const batch=body.mode==='refresh-apertum-token-decimals';
   if(batch){
    if(Deno.env.get('DAO_REWARD_ENABLE_TEST_IMPORT')!=='true')return reply({error:'Manual metadata refresh disabled'},403);
    if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')return reply({error:'Disable live DAO worker before manual refresh'},409);
    const permission=await authenticateInspectAdmin(request);if(!permission.ok)return reply({error:permission.error},permission.status);
    // Fixed bounded batch; no request-supplied decimals, source, user or wallet.
    const {data:tokens,error}=await sb.from('predefined_tokens').select('address').eq('chain','apertum').order('address');
    if(error)throw Error('Token catalog unavailable');
    const all=(tokens||[]).filter((t:any)=>/^0x[0-9a-f]{40}$/i.test(t.address));
    const after=typeof body.after==='string'?lower(body.after):'';
    if(after&&!/^0x[0-9a-f]{40}$/.test(after))return reply({error:'Invalid continuation address'},400);
    const pending=all.filter((t:any)=>lower(t.address)>after).sort((a:any,b:any)=>lower(a.address).localeCompare(lower(b.address)));
    const selected=pending.slice(0,20);const results:any[]=[];
    // Four requests at a time, bounded to 20 contracts per invocation.
    for(let i=0;i<selected.length;i+=4)results.push(...await Promise.all(selected.slice(i,i+4).map((t:any)=>resolveCentralTokenDecimals(t.address,null,true))));
    return reply({ok:true,mode:body.mode,checked:results.length,results,nextAfter:pending.length>20?lower(selected.at(-1).address):null,
     notice:'Only central technical metadata updated; display decimals, rewards, prices, cursors, queue and cron unchanged.'});
   }
   const authorization=request.headers.get('authorization')||'';const match=/^Bearer\s+([^\s]+)$/i.exec(authorization);
   if(!match)return reply({error:'User JWT required'},401);
   const {data:session,error}=await sb.auth.getUser(match[1]);if(error||!session?.user?.id)return reply({error:'Invalid user JWT'},401);
   const result=await resolveCentralTokenDecimals(String(body.token||''));return reply({ok:result.decimals!==null,...result});
  }catch{return reply({ok:false,error:'Technical metadata request failed'},500)}
 }
 // 8.11: Restricted, idempotent historical NFT identity backfill.
 // No generic user- or wallet-supplied arguments and no live worker execution.
 if(body?.mode==='reconcile-nft-test-wallet'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_IMPORT')!=='true')
   return Response.json({error:'Manual NFT reconciliation disabled'},{status:403});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')
   return Response.json({error:'Disable live DAO worker before NFT reconciliation'},{status:409});
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   const matches=await findInspectWalletMatches();
   if(matches.length!==1)return Response.json({error:'Expected exactly one registered test wallet',matchingWallets:matches.length},{status:409});
   const selected=matches[0];
   const {data,error}=await sb.rpc('wallettracking_dao_reconcile_nft_claims',{
    p_user:selected.user_id,p_wallet:selected.id,p_limit:200
   });
   if(error)throw Error('NFT reconciliation failed: '+error.message);
   return Response.json({ok:true,mode:'manual-historical-nft-reconciliation',project:PROJECT,chain:CHAIN,
    walletAddress:INSPECT_ADDRESS,...data});
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(body?.mode==='audit-nft-candidates-test-wallet'){
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   const matches=await findInspectWalletMatches();
   if(matches.length!==1)return Response.json({error:'Expected exactly one registered test wallet',matchingWallets:matches.length},{status:409});
   const selected=matches[0];
   const result=await auditTestWalletNftCandidates({user_id:selected.user_id,wallet_id:selected.id});
   return Response.json({ok:true,mode:'read-only-nft-candidate-audit',project:PROJECT,chain:CHAIN,
    walletAddress:INSPECT_ADDRESS,...result});
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(body?.mode==='audit-referrals-test-wallet'){
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   const matches=await findInspectWalletMatches();
   if(matches.length!==1)return Response.json({error:'Expected exactly one registered test wallet',matchingWallets:matches.length},{status:409});
   const selected=matches[0];
   const summary=await verifiedReferralSummary({user_id:selected.user_id,wallet_id:selected.id},INSPECT_ADDRESS);
   return Response.json({ok:true,mode:'read-only-referral-audit',project:PROJECT,chain:CHAIN,
    walletAddress:INSPECT_ADDRESS,...summary});
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(body?.mode==='inspect-test-wallet'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_INSPECT')!=='true')
   return Response.json({error:'Manual read-only inspection disabled'},{status:403});
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   return Response.json(await inspectTestAddress());
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(body?.mode==='audit-test-wallet'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_INSPECT')!=='true')
   return Response.json({error:'Manual read-only audit disabled'},{status:403});
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   return Response.json(await auditTestClaims());
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(body?.mode==='reconcile-test-wallet'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_INSPECT')!=='true')
   return Response.json({error:'Manual read-only reconciliation disabled'},{status:403});
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   return Response.json(await reconcileTestClaims());
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(body?.mode==='mark-matched-existing-test-wallet'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_IMPORT')!=='true')
   return Response.json({error:'Manual claim marking disabled'},{status:403});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')
   return Response.json({error:'Disable live DAO worker before marking'},{status:409});
  const expectedMarked=body?.expectedAlreadyMarked;
  const expectedEligible=body?.expectedStrictMatches;
  if(!Number.isInteger(expectedMarked)||expectedMarked<0||
     !Number.isInteger(expectedEligible)||expectedEligible<0||expectedEligible>500)
   return Response.json({error:'expectedAlreadyMarked and expectedStrictMatches must be nonnegative integers (max 500 matches)'},{status:400});
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   const matches=await findInspectWalletMatches();
   if(matches.length!==1)return Response.json({error:'Expected exactly one registered test wallet',matchingWallets:matches.length},{status:409});
   const selected=matches[0];
   const {data,error}=await sb.rpc('wallettracking_dao_mark_existing_paid_claims_guarded',{
    p_user:selected.user_id,p_wallet:selected.id,
    p_expected_marked:expectedMarked,p_expected_eligible:expectedEligible});
   if(error)return Response.json({ok:false,error:error.message,code:error.code,
    notice:'Guarded marking failed; the SQL transaction rolls back on any count mismatch.'},{status:409});
   return Response.json({ok:true,mode:'manual-guarded-existing-claim-marking',
    project:PROJECT,chain:CHAIN,walletAddress:INSPECT_ADDRESS,
    ...(data||{}),notice:'Only canonical_existing_verified and canonical_existing_checked_at were changed on strictly matched candidates. No canonical reward, price, payout, NFT, wallet, cursor or job updates.'});
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(body?.mode==='recheck-zero-payout-test-wallet'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_IMPORT')!=='true')
   return Response.json({error:'Manual payout recheck disabled'},{status:403});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')
   return Response.json({error:'Disable live DAO worker before payout recheck'},{status:409});
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   const matches=await findInspectWalletMatches();
   if(matches.length!==1)return Response.json({error:'Expected exactly one registered test wallet',matchingWallets:matches.length},{status:409});
   const selected=matches[0];
   const {data:zeroClaims,error:zeroError}=await sb.from('project_transactions')
    .select('tx_hash').eq('user_id',selected.user_id).eq('wallet_id',selected.id)
    .eq('project_key',PROJECT).eq('chain_key',CHAIN).eq('claim_reward_aptm',0)
    .in('selector',[CLAIM_SELECTOR,NEW_MINER_CLAIM_SELECTOR]).in('status',['ok','success'])
    .order('block_number',{ascending:true}).limit(3);
   if(zeroError)throw zeroError;
   if(!zeroClaims?.length)return Response.json({ok:true,checked:0});
   const {data:candidates,error:candidateError}=await sb.from('dao_reward_claim_candidates')
    .select('tx_hash,payout_checked_at').eq('user_id',selected.user_id).eq('wallet_id',selected.id)
    .eq('project_key',PROJECT).eq('chain_key',CHAIN).eq('canonical_existing_verified',false)
    .in('payout_status',['pending','needs_review','no_payout_evidence'])
    .in('tx_hash',zeroClaims.map(c=>c.tx_hash)).order('claim_block',{ascending:true}).limit(3);
   if(candidateError)throw candidateError;
   const result=await verifyCandidatePayouts({user_id:selected.user_id,wallet_id:selected.id},
    await loadAddress({user_id:selected.user_id,wallet_id:selected.id}),candidates||[]);
   return Response.json({ok:true,mode:'manual-zero-payout-recheck',...result,
    notice:'Only staging payout evidence and its bounded history were updated. Indexed completeness is not an independent on-chain zero proof. No canonical rewards, prices, NFT ownership, cursors or queue writes.'});
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 // 8.43: one explicitly selected transaction, independently re-traced through Explorer.
 // No automatic bulk verification, canonical claim creation or valuation.
 if(body?.mode==='verify-one-native-payout-843'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_IMPORT')!=='true')
   return Response.json({error:'Manual payout verification disabled'},{status:403});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')
   return Response.json({error:'Disable live DAO worker before payout verification'},{status:409});
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   const walletId=String(body.walletId||'');const txHash=lower(body.txHash);
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(walletId)
    || !/^0x[0-9a-f]{64}$/.test(txHash) || Object.keys(body).some(k=>!['mode','walletId','txHash'].includes(k)))
    return Response.json({error:'Provide only mode, walletId and txHash'},{status:400});
   const {data:wallet,error:walletError}=await sb.from('wallets').select('id,user_id')
    .eq('id',walletId).maybeSingle();
   if(walletError)throw walletError;
   if(!wallet)return Response.json({error:'Wallet not found'},{status:404});
   const job={user_id:wallet.user_id,wallet_id:wallet.id};
   const address=await loadAddress(job);
   const {data:rows,error:txError}=await sb.from('project_transactions')
    .select('user_id,wallet_id,tx_hash,selector,status,to_address,block_number,tx_timestamp')
    .eq('user_id',job.user_id).eq('wallet_id',job.wallet_id).eq('project_key',PROJECT)
    .eq('chain_key',CHAIN).eq('tx_hash',txHash).limit(2);
   if(txError)throw txError;
   if(rows?.length!==1||!isSuccessfulClaim(rows[0])
    ||lower(rows[0].to_address)!=='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d')
    return Response.json({error:'Eligible successful claim transaction required'},{status:409});
   // This call re-fetches all pages of Internal Transactions. If Explorer is incomplete,
   // throws or yields no direct contract payout, DO NOT write any verification.
   const observed=await nativeClaimPayout(address,rows[0]);
   if(!observed || lower(observed.counterparty_address)!==lower(rows[0].to_address)
    || !/^\d+$/.test(String(observed.amount_raw)) || BigInt(observed.amount_raw)<=0n)
    return Response.json({error:'Direct positive Explorer internal payout not proven'},{status:409});
   const {data,error}=await sb.rpc('wallettracking_dao_verify_single_native_payout_843',{p_user:job.user_id,p_wallet:job.wallet_id,
    p_tx:txHash,p_explorer_amount_raw:observed.amount_raw});
   if(error)throw error;
   return Response.json({ok:true,mode:'verify-one-native-payout-843',walletId:wallet.id,...(data||{}),
    notice:'One Explorer re-traced payout matched to persisted flow. Candidate payout fields only. No canonical claim, price, NFT or job changes.'});
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(body?.mode==='check-pending-native-payouts-test-wallet'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_IMPORT')!=='true')
   return Response.json({error:'Manual positive payout check disabled'},{status:403});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')
   return Response.json({error:'Disable live DAO worker before positive payout check'},{status:409});
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   const matches=await findInspectWalletMatches();
   if(matches.length!==1)return Response.json({error:'Expected exactly one registered test wallet',matchingWallets:matches.length},{status:409});
   const selected=matches[0];
   const {data,error}=await sb.rpc('wallettracking_dao_check_pending_native_payouts',{
    p_user:selected.user_id,p_wallet:selected.id,p_limit:4});
   if(error)throw error;
   return Response.json({ok:true,mode:'manual-pending-native-payout-check',...(data||{}),
    notice:'Only candidate payout evidence and history were updated from existing native flows. No historical USD price was required or created. No canonical-existing flags, rewards, NFT ownership, cursors, queue or snapshots were changed.'});
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(body?.mode==='process-next-native-claim-test-wallet'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_IMPORT')!=='true')
   return Response.json({error:'Manual single-claim pipeline disabled'},{status:403});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')
   return Response.json({error:'Disable live DAO worker before single-claim test'},{status:409});
  if(body.retryBlocked!==undefined&&typeof body.retryBlocked!=='boolean')
   return Response.json({error:'retryBlocked must be boolean'},{status:400});
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   const matches=await findInspectWalletMatches();
   if(matches.length!==1)return Response.json({error:'Expected exactly one registered test wallet',matchingWallets:matches.length},{status:409});
   const selected=matches[0];
   const result=await processSingleNativeClaim({user_id:selected.user_id,wallet_id:selected.id},body.retryBlocked===true);
   return Response.json({ok:true,mode:'manual-single-native-claim-pipeline',...result,
    notice:'One page per raw stream and at most one native claim. May create one proven canonical claim or fill this TX using an existing exact target anchor. Historical reference cases, existing rewards/prices and browser cursors are protected. No daily queue completion, no cron, no new price route.'});
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(body?.mode==='process-next-claim-test-wallet'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_IMPORT')!=='true')
   return Response.json({error:'Manual single-claim pipeline disabled'},{status:403});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')
   return Response.json({error:'Disable live DAO worker before single-claim test'},{status:409});
  if(body.retryBlocked!==undefined&&typeof body.retryBlocked!=='boolean')
   return Response.json({error:'retryBlocked must be boolean'},{status:400});
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   const matches=await findInspectWalletMatches();
   if(matches.length!==1)return Response.json({error:'Expected exactly one registered test wallet',matchingWallets:matches.length},{status:409});
   const selected=matches[0];
   const result=await processSingleNativeClaim({user_id:selected.user_id,wallet_id:selected.id},body.retryBlocked===true,true);
   return Response.json({ok:true,mode:'manual-single-claim-pipeline',...result,
    notice:'One raw page per stream, at most one native or supported ERC20 claim. Central technical decimals reused; Explorer primary, historical RPC only as fallback; shared browser/worker asset policy and canonical prices. No historical reference reset, no daily queue completion and no cron.'});
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(body?.mode==='classify-existing-test-wallet'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_IMPORT')!=='true')
   return Response.json({error:'Manual staging classification disabled'},{status:403});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')
   return Response.json({error:'Disable live DAO worker before manual classification'},{status:409});
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   const matches=await findInspectWalletMatches();
   if(matches.length!==1)return Response.json({error:'Expected exactly one registered test wallet',matchingWallets:matches.length},{status:409});
   const selected=matches[0];
   const newlyClassified=await classifyExistingClaims({user_id:selected.user_id,wallet_id:selected.id});
   return Response.json({ok:true,mode:'manual-existing-claim-classification',
    project:PROJECT,chain:CHAIN,walletAddress:INSPECT_ADDRESS,
    newlyClassified,
    notice:'Only claim candidate statuses were updated. Canonical claims, token flows, reward amounts, USD values, NFT ownership, cursors, queue and snapshots were not modified.'});
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(body?.mode==='import-test-wallet'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_IMPORT')!=='true')
   return Response.json({error:'Manual staging import disabled'},{status:403});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')
   return Response.json({error:'Disable live DAO worker before manual import'},{status:409});
  try{
   const permission=await authenticateInspectAdmin(request);
   if(!permission.ok)return Response.json({error:permission.error},{status:permission.status});
   const matches=await findInspectWalletMatches();
   if(matches.length!==1)return Response.json({error:'Expected exactly one registered test wallet',matchingWallets:matches.length},{status:409});
   const selected=matches[0];
   const result=await process({user_id:selected.user_id,wallet_id:selected.id},true);
   return Response.json({ok:true,project:PROJECT,chain:CHAIN,walletAddress:INSPECT_ADDRESS,...result});
  }catch(e){return Response.json({ok:false,error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 // Only explicit DAO cron routes are accepted, never an implicit default request.
 // Read-only authentication probe is safe even when the live worker is disabled.
 if(body?.mode!=='cron-auth-check'&&body?.mode!=='cron-stage-one'&&body?.mode!=='cron-test-wallet-one'&&body?.mode!=='cron-multi-wallet-preview'&&body?.mode!=='cron-multi-wallet-one'&&body?.mode!=='cron-multi-wallet-batch'&&body?.mode!=='cron-staged-preview'&&body?.mode!=='cron-staged-one')
  return Response.json({error:'Unsupported DAO cron mode'},{status:400});
 if(!await authorizedDaoCron(request))return Response.json({error:'Unauthorized DAO cron request'},{status:401});
 if(body.mode==='cron-auth-check')return Response.json({ok:true,mode:'cron-auth-check',authenticated:true,
  liveWorkerEnabled:Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true',
  notice:'Authentication check only. No queue, rewards, snapshot or cursor changed.'});
 // 8.14: read-only preview of eligible encrypted EVM wallets and DAO queue.
 // No address decryption, no queue reservation or writes.
 if(body.mode==='cron-multi-wallet-preview'){
  if(Object.keys(body).some(k=>k!=='mode'))return Response.json({error:'No preview parameters supported'},{status:400});
  const {count:eligible,error:walletError}=await sb.from('wallets').select('id',{count:'exact',head:true})
   .not('evm_address_ciphertext','is',null).eq('encryption_version',1).eq('key_version',1);
  if(walletError)return Response.json({error:'Wallet preview failed'},{status:500});
  const {data:queued,error:queueError}=await sb.from('wallet_reward_refresh_attempts')
   .select('state,step_count,failure_count').eq('project_key',PROJECT).eq('scan_day',localDay())
   .limit(1000);
  if(queueError)return Response.json({error:'Queue preview failed'},{status:500});
  const rows=queued||[];
  if(rows.length===1000)return Response.json({error:'Queue preview exceeds safe bound'},{status:409});
  const byState:Record<string,number>={};for(const r of rows)byState[r.state]=(byState[r.state]||0)+1;
  return Response.json({ok:true,mode:'cron-multi-wallet-preview',project:PROJECT,day:localDay(),
   eligibleEncryptedEvmWallets:eligible||0,queueRows:rows.length,byState,
   liveWorkerEnabled:Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true',
   multiWalletTestEnabled:Deno.env.get('DAO_REWARD_ENABLE_MULTI_WALLET_TEST')==='true',
   notice:'Read-only. No address values, imports, reservations, cursors, rewards or queue writes.'});
 }
 // 8.16: read-only preview of the second reward-processing stage.
 if(body.mode==='cron-staged-preview'){
  if(Object.keys(body).some(k=>k!=='mode'))return Response.json({error:'No preview parameters supported'},{status:400});
  const {data:rows,error}=await sb.from('wallet_reward_refresh_attempts')
   .select('state,step_count,failure_count').eq('project_key',PROJECT).eq('scan_day',localDay())
   .in('state',['staged','reward_running','completed','failed']).limit(1000);
  if(error)return Response.json({error:'Reward-stage preview failed'},{status:500});
  if((rows||[]).length===1000)return Response.json({error:'Preview exceeds safe bound'},{status:409});
  const byState:Record<string,number>={};for(const x of rows||[])byState[x.state]=(byState[x.state]||0)+1;
  return Response.json({ok:true,mode:'cron-staged-preview',day:localDay(),byState,
   stagedTestEnabled:Deno.env.get('DAO_REWARD_ENABLE_MULTI_WALLET_TEST')==='true',
   liveWorkerEnabled:Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true',
   notice:'Read-only. No reservation, decryption, import, claim, reward or cursor writes.'});
 }
 // Exactly one staged wallet, bounded one-claim processing, no automatic cron.
 if(body.mode==='cron-staged-one'){
  if(Object.keys(body).some(k=>k!=='mode'))return Response.json({error:'No wallet selection or batch parameters supported'},{status:400});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')return Response.json({error:'Disable live DAO worker before rehearsal'},{status:409});
  if(Deno.env.get('DAO_REWARD_ENABLE_MULTI_WALLET_TEST')!=='true')return Response.json({error:'DAO staged test disabled'},{status:403});
  const day=localDay();let job:any=null;
  try{
   const claim=await sb.rpc('wallettracking_dao_reward_claim_staged_v3',{p_day:day});
   if(claim.error)throw claim.error;
   job=claim.data?.[0];
   if(!job)return Response.json({ok:true,mode:'cron-staged-one',status:'no_staged_wallet',claimsCreated:0});
   const address=await loadAddress(job);
   // Reuse current single-claim proof and canonical SQL transaction. No raw import.
   const one=await processSingleNativeClaim({user_id:job.user_id,wallet_id:job.wallet_id},false,true,true);
   const created=Number(one.claimsCreated||0);
   if(!Number.isSafeInteger(created)||created<0||created>1)throw Error('Unexpected canonical claim count');
   const {data:readiness,error:readinessError}=await sb.rpc('wallettracking_dao_reward_readiness_v3',{
    p_user:job.user_id,p_wallet:job.wallet_id});
   if(readinessError)throw readinessError;
   const {count:incomingWusdt,error:incomingError}=await sb.from('project_transaction_asset_flows')
    .select('id',{count:'exact',head:true}).eq('user_id',job.user_id).eq('wallet_id',job.wallet_id)
    .eq('project_key',PROJECT).eq('chain_key',CHAIN).eq('direction','eingang')
    .eq('token_address',REFERRAL_WUSDT_TOKEN);
   if(incomingError)throw incomingError;
   // Coverage must be based on an actually completed referral scan, not on
   // the wallet address or on the absence of already-staged wUSDT flows.
   const referral=await verifiedReferralSummary(job,address);
   const {data:referralCursor,error:referralCursorError}=await sb.from('project_scan_state')
    .select('last_scan_result').eq('user_id',job.user_id).eq('wallet_id',job.wallet_id)
    .eq('project_key',PROJECT).eq('chain_key',CHAIN).eq('scan_type',REFERRAL_FLOW_SCAN).maybeSingle();
   if(referralCursorError)throw referralCursorError;
   const referralCoverage=['complete','empty_verified'].includes(String(referralCursor?.last_scan_result||''));
   const unresolved=Number(readiness?.unresolved??-1);
   const exceptionCount=Number(readiness?.unrecognizedExceptions??-1);
   // If one claim was created, leave staged for a fresh isolated pass. A missing
   // payout or unknown NFT must never be converted into 'completed'.
   const complete=created===0&&one.status==='no_eligible_claim'&&unresolved===0
    &&exceptionCount===0&&referralCoverage;
   const state=complete?'completed':'staged';
   const transition=await sb.rpc('wallettracking_dao_reward_finish_staged_v3',{
    p_day:day,p_user:job.user_id,p_wallet:job.wallet_id,p_lease:job.lease_token,p_state:state,p_error:null});
   if(transition.error)throw transition.error;
   return Response.json({ok:true,mode:'cron-staged-one',status:state,queueStep:job.step_count,
    claimStatus:one.status||'unknown',claimsCreated:created,readiness,
    referralFlowsVerified:referral?.verifiedFlows??null,unreviewedWusdt:referral?referral.unverifiedIncomingWusdt:null,
    referralCoverage,notice:'One previously staged wallet. At most one canonical claim with existing strict guards. No new referral postings or raw cursor updates. Completed only after conservative candidate and referral checks.'});
  }catch(e){
   const error=daoErrorSummary(e);
   if(job){const failed=await sb.rpc('wallettracking_dao_reward_finish_staged_v3',{
    p_day:day,p_user:job.user_id,p_wallet:job.wallet_id,p_lease:job.lease_token,p_state:'failed',p_error:error});
    if(failed.error)return Response.json({ok:false,error:'Reward phase failed; lease transition failed; inspect logs',leaseError:failed.error.message},{status:500});}
   return Response.json({ok:false,mode:'cron-staged-one',error},{status:500});
  }
 }
 // 8.19: manual bounded batch of the SAME staging-only v2 queue used by
 // cron-multi-wallet-one. No body-supplied wallet, count, cursor or time limit.
 // Every step owns its own SQL lease; failed steps are individually finalized.
 if(body.mode==='cron-multi-wallet-batch'){
  if(Object.keys(body).some(k=>k!=='mode'))return Response.json({error:'Batch does not accept parameters'},{status:400});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')
   return Response.json({error:'Disable live DAO worker before manual batch'},{status:409});
  if(Deno.env.get('DAO_REWARD_ENABLE_MULTI_WALLET_TEST')!=='true')
   return Response.json({error:'Multi-wallet rehearsal not enabled'},{status:403});
  const day=localDay(),MAX_BATCH_STEPS=10,MAX_BATCH_ELAPSED_MS=65000;
  const started=Date.now(),steps:any[]=[];
  let stopped='max_steps',failed=0,staged=0,partial=0;
  for(let i=0;i<MAX_BATCH_STEPS;i++){
   // Bound work on a request. A single Explorer call may still overrun this
   // budget; it is not an abort signal or a guarantee against platform timeout.
   if(Date.now()-started>=MAX_BATCH_ELAPSED_MS){stopped='time_budget';break;}
   let job:any=null;
   try{
    const picked=await sb.rpc('wallettracking_dao_reward_claim_v2',{p_day:day});
    if(picked.error)throw picked.error;
    job=picked.data?.[0];
    if(!job){stopped='no_eligible_wallet';break;}
    const imported=await process({user_id:job.user_id,wallet_id:job.wallet_id},true);
    const proved=(scan:any)=>!!scan&&scan.complete===true&&scan.coverageVerified===true
     &&(scan.block>0||scan.verifiedEmpty===true);
    const incomplete=!proved(imported.transactionScan)||!proved(imported.flowScan)
     ||(imported.referralScan!==null&&!proved(imported.referralScan));
    const state=incomplete?'partial':'staged';
    const transition=await sb.rpc('wallettracking_dao_reward_transition_v2',{
     p_day:day,p_user:job.user_id,p_wallet:job.wallet_id,p_lease:job.lease_token,p_state:state,p_error:null});
    if(transition.error)throw transition.error;
    if(incomplete)partial++;else staged++;
    steps.push({walletId:job.wallet_id,queueStep:job.step_count,status:state,
     transactionsObserved:imported.transactionsObserved,flowsObserved:imported.flowsObserved,
     claimCandidatesObserved:imported.claimCandidatesObserved,
     transactionScanMode:imported.transactionScan?.scanMode??null,
     flowScanMode:imported.flowScan?.scanMode??null,
     transactionCheckpointAdvanced:imported.transactionScan?.checkpointProgress?.advanced===true,
     flowCheckpointAdvanced:imported.flowScan?.checkpointProgress?.advanced===true});
   }catch(e){
    const error=daoErrorSummary(e);
    if(!job){
     // No lease to release: the queue/DB itself failed. Stop the batch.
     return Response.json({ok:false,mode:'cron-multi-wallet-batch',day,
      stopped:'queue_error',stepsCompleted:steps.length,failed,staged,partial,steps,error},{status:500});
    }
    const transition=await sb.rpc('wallettracking_dao_reward_transition_v2',{
     p_day:day,p_user:job.user_id,p_wallet:job.wallet_id,p_lease:job.lease_token,p_state:'failed',p_error:error});
    if(transition.error){
     // Do not continue when an outstanding lease could remain behind.
     return Response.json({ok:false,mode:'cron-multi-wallet-batch',day,
      stopped:'lease_transition_error',stepsCompleted:steps.length,failed,staged,partial,steps,
      walletId:job.wallet_id,error,leaseError:daoErrorSummary(transition.error)},{status:500});
    }
    failed++;
    steps.push({walletId:job.wallet_id,queueStep:job.step_count,status:'failed',error});
    // This wallet is bounded by the existing failure_count < 3 SQL guard.
    // Continue with another eligible wallet rather than blocking the batch.
   }
  }
  return Response.json({ok:failed===0,mode:'cron-multi-wallet-batch',project:PROJECT,day,
   maxSteps:MAX_BATCH_STEPS,stepsCompleted:steps.length,staged,partial,failed,stopped,steps,
   claimsCreated:0,referralPosting:'disabled',liveWorkerEnabled:false,
   notice:'Manual bounded staging only. Same guarded v2 leases and per-wallet error limits as single-step mode. No canonical claims, prices, NFT, reward postings or cron scheduling. A timed-out individual Explorer request may still hit the platform limit.'});
 }
 // 8.14: manually authorized, exactly one encrypted wallet per invocation.
 // Staging only: never finalize a canonical claim or post a referral reward.
 if(body.mode==='cron-multi-wallet-one'){
  if(Object.keys(body).some(k=>k!=='mode'))return Response.json({error:'No wallet selection or batch overrides supported'},{status:400});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')
   return Response.json({error:'Disable live worker during multi-wallet rehearsal'},{status:409});
  if(Deno.env.get('DAO_REWARD_ENABLE_MULTI_WALLET_TEST')!=='true')
   return Response.json({error:'Multi-wallet rehearsal not enabled'},{status:403});
  const day=localDay();let job:any=null;
  try{
   const picked=await sb.rpc('wallettracking_dao_reward_claim_v2',{p_day:day});
   if(picked.error)throw picked.error;
   job=picked.data?.[0];
   if(!job)return Response.json({ok:true,mode:'cron-multi-wallet-one',status:'no_eligible_wallet',queueTouched:false});
   // All address decryption is scoped to user_id + wallet_id and never returned.
   const imported=await process({user_id:job.user_id,wallet_id:job.wallet_id},true);
   // Stage only with affirmative provider coverage evidence for BOTH streams.
   // Zero-block cursors are allowed solely when a repeated successful empty
   // Explorer response was persisted as 'empty_verified'.
   const proved=(scan:any)=>!!scan&&scan.complete===true&&scan.coverageVerified===true
    &&(scan.block>0||scan.verifiedEmpty===true);
   const partial=!proved(imported.transactionScan)||!proved(imported.flowScan)
    ||(imported.referralScan!==null&&!proved(imported.referralScan));
   const target=partial?'partial':'staged';
   const transition=await sb.rpc('wallettracking_dao_reward_transition_v2',{
    p_day:day,p_user:job.user_id,p_wallet:job.wallet_id,p_lease:job.lease_token,p_state:target,p_error:null});
   if(transition.error)throw transition.error;
   return Response.json({ok:true,mode:'cron-multi-wallet-one',status:target,project:PROJECT,
    queueStep:job.step_count,imported,claimsCreated:0,referralPosting:'disabled',
    notice:'Staging only, one encrypted wallet. No canonical claim/price/NFT/reward writes or daily completion.'});
  }catch(e){
   const error=daoErrorSummary(e);
   if(job){
    const failed=await sb.rpc('wallettracking_dao_reward_transition_v2',{
     p_day:day,p_user:job.user_id,p_wallet:job.wallet_id,p_lease:job.lease_token,p_state:'failed',p_error:error});
    if(failed.error)return Response.json({ok:false,error:'Staging failed; lease transition failed; inspect logs',leaseError:failed.error.message},{status:500});
   }
   return Response.json({ok:false,mode:'cron-multi-wallet-one',error},{status:500});
  }
 }
 // 8.13: explicit single-wallet integration rehearsal, NEVER a scheduled job.
 // The wallet is fixed server-side; a request cannot select a wallet/user or
 // raise the one-claim limit. This path does not depend on enabling live mode.
 if(body.mode==='cron-test-wallet-one'){
  if(Deno.env.get('DAO_REWARD_ENABLE_TEST_IMPORT')!=='true')
   return Response.json({error:'DAO single-wallet rehearsal disabled'},{status:403});
  if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')==='true')
   return Response.json({error:'Disable DAO live worker for rehearsal'},{status:409});
  if(body.retryBlocked!==undefined||body.walletId!==undefined||body.userId!==undefined||body.address!==undefined)
   return Response.json({error:'Only the registered fixed test wallet and default retry policy are supported'},{status:400});
  try{
   const matches=await findInspectWalletMatches();
   if(matches.length!==1)return Response.json({error:'Expected exactly one registered test wallet',matchingWallets:matches.length},{status:409});
   const selected=matches[0];
   // Existing safe path: one import page per stream, at most one eligible
   // canonical claim; no daily queue/finish transition. Referral classification
   // is an independent, read-only audit and is not posted as a second reward.
   const result=await processSingleNativeClaim({user_id:selected.user_id,wallet_id:selected.id},false,true);
   return Response.json({ok:true,mode:'cron-test-wallet-one',project:PROJECT,chain:CHAIN,
    walletAddress:INSPECT_ADDRESS,...result,
    referralPosting:'disabled-existing-flow-classification-only',
    queueTouched:false,dailyCompletion:false,
    notice:'Manual fixed-wallet integration rehearsal. Can import raw rows, advance isolated scan cursors and create at most one proven canonical claim. No automatic job, no referral reposting, no daily queue completion.'});
  }catch(e){return Response.json({ok:false,mode:'cron-test-wallet-one',error:String(e instanceof Error?e.message:e)},{status:500})}
 }
 if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')!=='true')
  return Response.json({ok:true,mode:'cron-stage-one',skipped:'DAO staging worker disabled; no queue or raw import performed'});
 // This is a staging-only worker, NOT a completed daily rewards pipeline.
 // No cron schedule is created by 8.12; activation requires separate approval.
 const minute=localMinute();if(minute<245||minute>=330)return Response.json({ok:true,skipped:'Outside DAO window'});
 const day=localDay();let job:any=null;
 try{const claim=await sb.rpc('wallettracking_reward_claim',{p_day:day,p_project:'dao1'});if(claim.error)throw claim.error;
  job=claim.data?.[0];if(!job)return Response.json({ok:true,skipped:'No pending DAO wallets'});
  const result=await process(job);
  // Partial explorer pages and ownership backlog must remain claimable TODAY.
  // 'staged' is terminal for today's raw import; it is NOT reward completion.
  const partial=!result.transactionScan.complete||!result.flowScan.complete||result.referralScan?.complete===false||result.pendingHistoricalChecks>0||result.pendingPayoutChecks>0;
  const transition=await sb.rpc(partial?'wallettracking_reward_continue':'wallettracking_reward_stage',
   {p_day:day,p_project:'dao1',p_user:job.user_id,p_wallet:job.wallet_id});
  if(transition.error)throw transition.error;
  return Response.json({ok:true,...result,queueState:partial?'partial':'staged',
   notice:'Rohdaten/Prüfliste verarbeitet; Claim-/Referral-/Preisbewertung ausstehend; Job bewusst NICHT abgeschlossen'});
 }catch(e){const message=String(e instanceof Error?e.message:e);if(job)await sb.rpc('wallettracking_reward_finish',{p_day:day,p_project:'dao1',p_user:job.user_id,p_wallet:job.wallet_id,p_error:message.slice(0,2000)});return Response.json({ok:false,error:message},{status:500})}
})
