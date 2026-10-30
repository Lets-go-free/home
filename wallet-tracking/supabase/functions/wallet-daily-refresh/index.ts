// WalletTracking daily refresh v7.68 – service-only bounded background worker.
// 30.10.2026: EVM RPC 429/5xx/timeout fallback to configured Alchemy archive endpoint.
// No private wallet address or private label is ever written to the public portfolio cache.
import { createClient } from 'npm:@supabase/supabase-js@^2'
const DB_URL=Deno.env.get('SUPABASE_URL')||''
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''
const SECRET=Deno.env.get('WALLET_DAILY_REFRESH_SECRET')||''
const ALCHEMY=Deno.env.get('ALCHEMY_API_KEY')||''
const MASTER=Deno.env.get('WALLET_ENCRYPTION_MASTER_KEY_V1')||''
const sb=createClient(DB_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const enc=new TextEncoder(),dec=new TextDecoder()
const DUST=1e-25
function todayCH(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function hourCH(){return Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Zurich',hour:'2-digit',hourCycle:'h23'}).format(new Date()))}
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
async function fetchJson(url:string,init:RequestInit={}){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),18000)
 try{const r=await fetch(url,{...init,signal:c.signal});if(!r.ok)throw Error(`HTTP ${r.status}: ${new URL(url).hostname}`);return await r.json()}
 finally{clearTimeout(t)}
}
async function rpc(url:string,method:string,params:any[]){
 const x=await fetchJson(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
 if(x?.error||!Object.prototype.hasOwnProperty.call(x||{},'result'))throw Error(`${method}: ${x?.error?.message||'invalid response'}`);return x.result
}
function bigAmount(raw:unknown,decimals:number){if(!Number.isInteger(decimals)||decimals<0||decimals>36)throw Error('Invalid token decimals');const s=String(raw||'0');if(!/^\d+$/.test(s))throw Error('Invalid token balance');const v=Number(BigInt(s))/10**decimals;if(!Number.isFinite(v))throw Error('Token amount overflow');return v}
function evmHexAmount(raw:string,decimals=18){if(!/^0x[0-9a-f]+$/i.test(raw))throw Error('Invalid RPC quantity');return bigAmount(BigInt(raw).toString(),decimals)}
function cleanAddr(a:any){return String(a||'').trim()}
function norm(chain:string,a:string){return chain==='tron'?a.trim():a.trim().toLowerCase()}
type Entry={chain:string,symbol:string,address:string|null,is_native:boolean,amount:number,price_usd:number|null}
type Token={chain:string,address:string,label:string,symbol:string,decimals:number|null}
type Chain={chain_key:string,wallet_type:string,balance_provider:string,rpc_url:string|null,balance_api_base:string|null,archive_rpc_url:string|null,archive_rpc_provider:string|null,native_symbol:string}
function priceFromCache(prices:any,chain:string,address:string|null){const p=address?prices?.tokenPrices?.[`${chain}|${norm(chain,address)}`]:prices?.nativePrices?.[chain];const n=Number(p?.price);return Number.isFinite(n)&&n>0?n:null}
function emit(result:Entry[],prices:any,chain:Chain,symbol:string,address:string|null,amount:number){
 if(!Number.isFinite(amount)||amount<0)throw Error('Invalid balance');if(amount<DUST && address!==null)return;
 result.push({chain:chain.chain_key,symbol:address?symbol:`${symbol} (nativ)`,address,is_native:!address,amount,price_usd:priceFromCache(prices,chain.chain_key,address)})
}
async function evmBatch(url:string,calls:{to:string,data:string}[],allowRevert=false){
 const result:string[]=[];
 for(let start=0;start<calls.length;start+=40){
  const part=calls.slice(start,start+40);
  const raw=await fetchJson(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(part.map((c,i)=>({jsonrpc:'2.0',id:i+1,method:'eth_call',params:[c,'latest']})))});
  if(!Array.isArray(raw))throw Error('RPC batch was not an array');
  const byId=new Map(raw.map((r:any)=>[Number(r.id),r]));
  for(let i=0;i<part.length;i++){
   const row:any=byId.get(i+1);
   if(row?.error){
    if(allowRevert && /execution reverted|revert/i.test(String(row.error.message||''))){result.push('REVERTED');continue}
    throw Error(`RPC batch call ${start+i}: ${row.error.message||'unknown RPC error'}`)
   }
   if(typeof row?.result!=='string')throw Error(`RPC batch call ${start+i}: missing result`);
   result.push(row.result)
  }
 }
 return result
}
function isTransientEvmRpcError(error:unknown){
 const message=String(error instanceof Error?error.message:error);
 return /HTTP (?:408|429|500|502|503|504)\b|AbortError|aborted|timed out|timeout|fetch failed|network error|rate limit|too many requests|ERC20 balanceOf invalid response|Invalid ERC20 balance|RPC batch was not an array|RPC batch call \d+: missing result|eth_getBalance: invalid response/i.test(message);
}
function alchemyEvmUrl(chain:Chain){
 if(chain.archive_rpc_provider!=='alchemy'||!chain.archive_rpc_url||!ALCHEMY)return null;
 const url=chain.archive_rpc_url.replace(/\/+$/,'');
 // Do not accidentally append the API key twice or send it to an unrelated host.
 if(!/^https:\/\/[a-z0-9-]+\.g\.alchemy\.com\/v2$/i.test(url))return null;
 return `${url}/${encodeURIComponent(ALCHEMY)}`;
}
async function readEvm(chain:Chain,address:string,tokens:Token[],prices:any,out:Entry[]){
 const primary=chain.rpc_url;if(!primary)throw Error('EVM RPC not configured');
 const backup=alchemyEvmUrl(chain);
 if(!/^0x[0-9a-f]{40}$/i.test(address))throw Error('Invalid EVM address');
 const temp:Entry[]=[];
 try{
  await readEvmAtUrl(chain,primary,address,tokens,prices,temp);
 }catch(e){
  if(!isTransientEvmRpcError(e)||!backup||backup===primary)throw e;
  console.warn(`Daily refresh: ${chain.chain_key} primary RPC temporarily unavailable; retrying whole chain via Alchemy`);
  temp.length=0;
  try{await readEvmAtUrl(chain,backup,address,tokens,prices,temp)}
  catch(fallbackError){
   throw Error(`${chain.chain_key}: primary RPC failed (${String(e instanceof Error?e.message:e)}); Alchemy fallback failed (${String(fallbackError instanceof Error?fallbackError.message:fallbackError)})`)
  }
 }
 out.push(...temp);
}
async function readEvmAtUrl(chain:Chain,url:string,address:string,tokens:Token[],prices:any,out:Entry[]){
 const native=await rpc(url,'eth_getBalance',[address,'latest']);emit(out,prices,chain,chain.native_symbol,null,evmHexAmount(native));
 const owner=address.slice(2).toLowerCase().padStart(64,'0');
 const eligible=tokens.filter(t=>/^0x[0-9a-f]{40}$/i.test(t.address));
 if(eligible.length!==tokens.length)throw Error('Invalid configured ERC20 contract');
 const balances=await evmBatch(url,eligible.map(t=>({to:t.address,data:`0x70a08231${owner}`})),true);
 // Some pool contracts return an empty `0x` instead of an RPC revert for
 // ERC-20 balanceOf(). Verify their V3 pool interface before excluding them.
 // For every other invalid response, fail with the exact contract address.
 for(let i=0;i<balances.length;i++){
  const response=balances[i];
  if(/^0x[0-9a-f]{64}$/i.test(response))continue;
  const token=eligible[i];
  let isV3Pool=false;
  try{
   const [slot0,fee,token0]=await Promise.all([
    rpc(url,'eth_call',[{to:token.address,data:'0x3850c7bd'},'latest']),
    rpc(url,'eth_call',[{to:token.address,data:'0xddca3f43'},'latest']),
    rpc(url,'eth_call',[{to:token.address,data:'0x0dfe1681'},'latest']),
   ]);
   isV3Pool=/^0x[0-9a-f]{64,}$/i.test(slot0)&&/^0x[0-9a-f]{64}$/i.test(fee)&&/^0x[0-9a-f]{64}$/i.test(token0)&&BigInt(fee)>0n;
  }catch{/* Reject rather than hide unknown failures. */}
  if(!isV3Pool){
   const kind=response==='REVERTED'?'reverted':/^0x[0-9a-f]*$/i.test(response)?`invalid response (${response.length} chars)`:'invalid response format';
   throw Error(`ERC20 balanceOf ${kind}: ${chain.chain_key}/${token.address} (${token.symbol||token.label||'unnamed'})`);
  }
  console.info(`Daily refresh: excluded verified V3 pool ${chain.chain_key}/${token.address} from ERC20 holdings`);
  balances[i]='0x'+'0'.repeat(64);
 }
 const nonzero:{token:Token,balance:string}[]=[];
 balances.forEach((bal,i)=>{if(!/^0x[0-9a-f]{64}$/i.test(bal))throw Error(`Invalid ERC20 balance for ${chain.chain_key}/${eligible[i].address}`);if(BigInt(bal)>0n)nonzero.push({token:eligible[i],balance:bal})});
 const unknown=nonzero.filter(x=>x.token.decimals===null);
 const decimalsResults=await evmBatch(url,unknown.map(x=>({to:x.token.address,data:'0x313ce567'})));
 const meta=new Map<string,number>();
 unknown.forEach((x,i)=>{if(!/^0x[0-9a-f]+$/i.test(decimalsResults[i]))throw Error('Invalid ERC20 decimals');meta.set(x.token.address,Number(BigInt(decimalsResults[i])))});
 for(const item of nonzero){const d=item.token.decimals??meta.get(item.token.address);if(d===undefined)throw Error('Missing ERC20 decimals');
  emit(out,prices,chain,item.token.symbol||item.token.label||item.token.address.slice(0,8),item.token.address,evmHexAmount(item.balance,d))}
}
async function readBitcoin(chain:Chain,address:string,prices:any,out:Entry[]){
 const root=chain.balance_api_base;if(!root)throw Error('Bitcoin API not configured');
 const x=await fetchJson(`${root.replace(/\/$/,'')}/address/${encodeURIComponent(address)}`);
 const n=['chain_stats','mempool_stats'].reduce((sum,key)=>sum+Number(x?.[key]?.funded_txo_sum)-Number(x?.[key]?.spent_txo_sum),0);
 if(!Number.isFinite(n)||n<0)throw Error('Invalid BTC amount');emit(out,prices,chain,chain.native_symbol,null,n/1e8)
}
async function readXrp(chain:Chain,address:string,prices:any,out:Entry[]){
 if(!chain.balance_api_base)throw Error('XRP API missing');const x=await fetchJson(`${chain.balance_api_base}/account/${encodeURIComponent(address)}`);
 if(x?.xrpBalance==null)throw Error('XRP balance missing');emit(out,prices,chain,chain.native_symbol,null,Number(x.xrpBalance))
}
async function readAkash(chain:Chain,address:string,prices:any,out:Entry[]){
 if(!chain.balance_api_base)throw Error('Akash API missing');const x=await fetchJson(`${chain.balance_api_base}/cosmos/bank/v1beta1/balances/${encodeURIComponent(address)}`);
 if(!Array.isArray(x?.balances))throw Error('Akash balances missing');
 const raw=x.balances.find((r:any)=>r.denom==='uakt')?.amount||'0';emit(out,prices,chain,chain.native_symbol,null,bigAmount(raw,6))
}
const SOL_PROGRAMS=['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb']
async function readSol(chain:Chain,address:string,tokens:Token[],prices:any,out:Entry[]){
 if(!ALCHEMY||!chain.archive_rpc_url||chain.archive_rpc_provider!=='alchemy')throw Error('Solana Alchemy RPC unavailable');
 const url=chain.archive_rpc_url.replace(/\/$/,'')+'/'+encodeURIComponent(ALCHEMY);
 const native=await rpc(url,'getBalance',[address]);if(native?.value==null)throw Error('Sol balance missing');emit(out,prices,chain,chain.native_symbol,null,Number(native.value)/1e9);
 const allow=new Map(tokens.map(t=>[t.address,t]));const sums=new Map<string,number>();
 for(const program of SOL_PROGRAMS){
  const result=await rpc(url,'getTokenAccountsByOwner',[address,{programId:program},{encoding:'jsonParsed',commitment:'confirmed'}]);
  if(!Array.isArray(result?.value))throw Error('Solana token result incomplete');
  for(const r of result.value){const info=r?.account?.data?.parsed?.info;const mint=info?.mint;if(!allow.has(mint))continue;
   const raw=info?.tokenAmount;if(!raw||raw.amount==null||raw.decimals==null)throw Error('Invalid Solana token amount');
   const amount=bigAmount(raw.amount,Number(raw.decimals));sums.set(mint,(sums.get(mint)||0)+amount)}
 }
 for(const [mint,amount] of sums){const t=allow.get(mint)!;emit(out,prices,chain,t.symbol||t.label||mint.slice(0,8),mint,amount)}
}
async function readTron(chain:Chain,address:string,tokens:Token[],prices:any,out:Entry[]){
 if(!chain.balance_api_base)throw Error('Tron API missing');const x=await fetchJson(`${chain.balance_api_base}/v1/accounts/${encodeURIComponent(address)}`);
 if(x?.success!==true||!Array.isArray(x?.data))throw Error('TronGrid incomplete result');
 const account=x.data[0];emit(out,prices,chain,chain.native_symbol,null,Number(account?.balance||0)/1e6);
 const allow=new Map(tokens.map(t=>[t.address,t]));
 for(const entry of account?.trc20||[]){const [addr,raw]=Object.entries(entry)[0]||[];const t=allow.get(addr||'');if(!t)continue;
  if(t.decimals==null)throw Error(`Tron token decimals not verified: ${addr}`);
  emit(out,prices,chain,t.symbol||t.label||addr!,addr!,bigAmount(raw,t.decimals))}
}
async function readApertum(chain:Chain,address:string,tokens:Token[],prices:any,out:Entry[]){
 const root=chain.balance_api_base;if(!root)throw Error('Blockscout URL missing');
 const x=await fetchJson(`${root}/addresses/${address}`);if(x?.coin_balance==null)throw Error('Apertum coin balance missing');
 emit(out,prices,chain,chain.native_symbol,null,bigAmount(x.coin_balance,18));
 const allow=new Map(tokens.map(t=>[t.address.toLowerCase(),t]));let next:any=null,pages=0;
 do{const q=new URL(`${root}/addresses/${address}/tokens`);q.searchParams.set('type','ERC-20');if(next)for(const [k,v] of Object.entries(next))q.searchParams.set(k,String(v));
  const r=await fetchJson(q.toString());if(!Array.isArray(r?.items))throw Error('Blockscout token list incomplete');
  for(const row of r.items){const addr=String(row?.token?.address||'').toLowerCase();const t=allow.get(addr);if(!t)continue;
   const decimals=t.decimals??Number(row.token.decimals);if(!Number.isInteger(decimals))throw Error('Apertum decimals missing');
   emit(out,prices,chain,t.symbol||t.label||row.token.symbol||addr,addr,bigAmount(row.value,decimals))}
  next=r.next_page_params||null;if(++pages>50)throw Error('Apertum pagination exceeds safety limit')
 }while(next)
}
async function getPriceCache(){
 const {data,error}=await sb.from('wallet_global_current_price_snapshot').select('payload,captured_at').eq('snapshot_key','current').eq('valuation_version','wallettracking-current-prices-v6').maybeSingle();
 if(error){console.warn('Daily refresh: price cache unavailable',error.message);return {}}
 // A missing/stale price cache is allowed: amounts remain correct and prices are null.
 return data?.payload&&Date.now()-Date.parse(data.captured_at)<36*3600*1000?data.payload:{}
}
async function loadWallet(job:any){
 const {data,error}=await sb.from('wallets').select('id,user_id,evm_address_ciphertext,btc_address_ciphertext,xrp_address_ciphertext,sol_address_ciphertext,tron_address_ciphertext,akash_address_ciphertext,encryption_version,key_version').eq('id',job.wallet_id).eq('user_id',job.user_id).single();
 if(error||!data)throw Error('Wallet missing or access failed');
 if(data.encryption_version!==1||data.key_version!==1)throw Error('Unsupported wallet encryption version');
 const key=await userKey(job.user_id);const addresses:Record<string,string>={};
 for(const field of ['evm','btc','xrp','sol','tron','akash'])addresses[field]=await decryptWalletField(key,job.user_id,job.wallet_id,data[`${field}_address_ciphertext`],`${field}_address`);
 return addresses
}
async function allRows(table:string,select:string,filters:{column:string,value:any}[]=[]){
 const out:any[]=[];
 for(let start=0;start<50000;start+=500){
  let q=sb.from(table).select(select);
  if(table==='predefined_tokens')q=q.order('chain').order('address');else q=q.order('id');
  q=q.range(start,start+499);
  for(const f of filters)q=q.eq(f.column,f.value);
  const {data,error}=await q;if(error)throw Error(`${table}: ${error.message}`);
  out.push(...(data||[]));if((data||[]).length<500)return out;
 }
 throw Error(`Table ${table} exceeds safe pagination limit`)
}
async function scanWallet(job:any){
 const [addresses,prices]=await Promise.all([loadWallet(job),getPriceCache()]);
 const [{data:chains,error:ce},known,safe]=await Promise.all([
  sb.from('chains').select('chain_key,wallet_type,balance_provider,rpc_url,balance_api_base,archive_rpc_url,archive_rpc_provider,native_symbol').eq('enabled',true).order('sort_order'),
  allRows('predefined_tokens','chain,address,label,symbol,decimals,is_native,enabled,historical_only',[{column:'enabled',value:true},{column:'historical_only',value:false}]),
  allRows('safe_tokens','id,chain,address,label,user_id',[{column:'user_id',value:job.user_id}])
 ]);
 if(ce||!chains?.length)throw Error(`Chain config failed: ${ce?.message||'no chains'}`);
 const listed:Token[]=[];for(const row of [...(known||[]),...(safe||[])]){
  if(row.is_native||String(row.address).toLowerCase()==='native'||!row.address)continue;
  listed.push({chain:row.chain,address:norm(row.chain,row.address),label:row.label||'',symbol:row.symbol||row.label||'',decimals:Number.isInteger(row.decimals)?row.decimals:null})
 }
 const entries:Entry[]=[];const failures:string[]=[];const fieldByType:Record<string,string>={evm:'evm',btc:'btc',xrp:'xrp',sol:'sol',tron:'tron',akash:'akash'};
 // At most three chains at a time to bound wall time and provider pressure.
 const active=chains as Chain[];
 for(let idx=0;idx<active.length;idx+=3){
  await Promise.all(active.slice(idx,idx+3).map(async chain=>{
   const field=fieldByType[chain.wallet_type];if(!field){failures.push(`${chain.chain_key}: unsupported wallet type`);return}
   const address=cleanAddr(addresses[field]);if(!address)return;
   const chainTokens=[...new Map(listed.filter(t=>t.chain===chain.chain_key).map(t=>[t.address,t])).values()];
   const chainEntries:Entry[]=[];
   try{switch(chain.balance_provider){
    case 'evm_rpc':await readEvm(chain,address,chainTokens,prices,chainEntries);break;
    case 'blockscout':await readApertum(chain,address,chainTokens,prices,chainEntries);break;
    case 'blockstream':await readBitcoin(chain,address,prices,chainEntries);break;
    case 'xrpscan':await readXrp(chain,address,prices,chainEntries);break;
    case 'solana_rpc':await readSol(chain,address,chainTokens,prices,chainEntries);break;
    case 'trongrid':await readTron(chain,address,chainTokens,prices,chainEntries);break;
    case 'akash_rest':await readAkash(chain,address,prices,chainEntries);break;
    default:throw Error('Unsupported balance provider '+chain.balance_provider)
   }entries.push(...chainEntries)}catch(e){failures.push(`${chain.chain_key}: ${e instanceof Error?e.message:String(e)}`)}
  }))
 }
 if(failures.length)throw Error(failures.join('; ').slice(0,2000));
 return entries
}
Deno.serve(async req=>{
 if(req.method!=='POST')return Response.json({ok:false,error:'Method not allowed'},{status:405});
 if(!SECRET||req.headers.get('x-wallet-refresh-secret')!==SECRET)return Response.json({ok:false,error:'Unauthorized'},{status:401});
 if(!DB_URL||!SERVICE_KEY||!MASTER)return Response.json({ok:false,error:'Server secrets missing'},{status:500});
 let body:any={};try{body=await req.json()}catch{}
 if(hourCH()<3&&body?.run_now!==true)return Response.json({ok:true,skipped:'before 03:00 Europe/Zurich'});
 const day=todayCH();let job:any=null;
 try{
  const claim=await sb.rpc('wallettracking_daily_claim',{p_day:day});if(claim.error)throw claim.error;
  job=claim.data?.[0];if(!job)return Response.json({ok:true,day,skipped:'no pending wallets'});
  const entries=await scanWallet(job);
  const finish=await sb.rpc('wallettracking_daily_complete',{p_wallet:job.wallet_id,p_user:job.user_id,p_day:day,p_items:entries});
  if(finish.error)throw finish.error;
  return Response.json({ok:true,day,wallet:job.wallet_id,positions:entries.length,finalized:finish.data});
 }catch(e){
  const error=String(e instanceof Error?e.message:e).slice(0,2000);
  if(job){try{await sb.rpc('wallettracking_daily_fail',{p_wallet:job.wallet_id,p_user:job.user_id,p_day:day,p_error:error})}catch{}}
  return Response.json({ok:false,day,error},{status:500});
 }
})
