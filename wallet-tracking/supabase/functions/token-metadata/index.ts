// Public on-chain technical metadata. No wallet decryption, prices, rewards or cron.
import {createClient} from 'npm:@supabase/supabase-js@^2';
import {metadataAddress,providerMetadata,technicalDecimals} from './metadata.ts';
const DB=Deno.env.get('SUPABASE_URL')||'',KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const sb=createClient(DB,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'authorization, apikey, content-type, x-client-info','access-control-allow-methods':'POST, OPTIONS'};
async function json(url:string,options:any={}){const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);try{const r=await fetch(url,{...options,signal:abort.signal});if(!r.ok)throw Error('provider-http-unavailable');return await r.json()}finally{clearTimeout(timer)}}
const inflight=new Map<string,Promise<any>>();
async function resolveMetadata(chainKey:string,address:string,refresh=false,block:number|null=null){
 // The UI/predefined token key is 'arbitrum'; the chains registry uses 'arb'.
 // Keep the original token key for metadata cache and predefined-token writes.
 const configKey=chainKey==='arbitrum'?'arb':chainKey;
 const {data:chain,error}=await sb.from('chains').select('chain_key,wallet_type,native_symbol,evm_chain_id,rpc_url,balance_api_base,archive_rpc_url,archive_rpc_provider').eq('chain_key',configKey).maybeSingle();
 if(error||!chain)throw Error('unknown-chain');
 const alchemy=Deno.env.get('ALCHEMY_API_KEY')||'';
 const expandRpc=(raw:any)=>{
  if(!raw)return null;
  if(/^https:\/\/[a-z0-9-]+\.g\.alchemy\.com\/v2\/?$/i.test(raw))return alchemy?raw.replace(/\/$/,'')+'/'+encodeURIComponent(alchemy):null;
  return raw;
 };
 chain.rpc_url=expandRpc(chain.rpc_url);
 if(chain.wallet_type==='sol'&&!chain.rpc_url)chain.rpc_url=expandRpc(chain.archive_rpc_url)||expandRpc(chain.balance_api_base);
 const a=metadataAddress(chain,address),key=chainKey+'|'+a;
 if(inflight.has(key))return await inflight.get(key);
 const work=(async()=>{
  const {data:master,error:me}=await sb.from('predefined_tokens').select('address,decimals,decimals_status,symbol,name').eq('chain',chainKey)
   [chain.wallet_type==='evm'?'ilike':'eq']('address',a).limit(2);
  if(me||master?.length>1)throw Error('token-master-unavailable');const m=master?.[0];
  const {data:cached,error:ce}=await sb.rpc('wallettracking_get_token_metadata',{p_chain:chainKey,p_address:a});if(ce)throw Error('metadata-cache-unavailable');
  if(m?.decimals_status==='conflict'||cached?.status==='conflict')return {...(cached||{}),chain:chainKey,address:a,status:'conflict',decimals:null,reason:'technical-decimals-conflict'};
  async function record(o:any){const {data,error}=await sb.rpc('wallettracking_record_token_metadata',{p_chain:chainKey,p_address:a,p_observation:o});if(error)throw Error('metadata-save-failed');return data}
  if(cached?.status==='verified'&&m?.decimals!=null&&m.decimals!==cached.decimals)return await record({status:'verified',decimals:cached.decimals,kind:cached.kind,source:cached.source,symbol:cached.symbol,name:cached.name});
  if(!refresh&&['verified','not_applicable'].includes(cached?.status))return {...cached,cached:true};
  if(!refresh&&m&&technicalDecimals(m.decimals)!==null)return {...await record({status:'verified',decimals:m.decimals,source:'existing-predefined-token',kind:a==='native'?'native':chain.wallet_type==='evm'?'erc20':chain.wallet_type==='tron'?'trc20':chain.wallet_type==='sol'?'spl_mint':'cosmos_denom',symbol:m.symbol,name:m.name}),cached:true};
  if(!refresh&&cached?.status==='unavailable'&&Date.now()-Date.parse(cached.checked_at)<60000)return {...cached,cached:true};
  try{
   let observed:any;
   try{observed=await providerMetadata(chain,a,json,block)}catch(first){
    const alchemy=Deno.env.get('ALCHEMY_API_KEY')||'';let backup=chain.archive_rpc_url;
    if(chain.archive_rpc_provider==='alchemy'&&alchemy&&/^https:\/\/[a-z0-9-]+\.g\.alchemy\.com\/v2\/?$/i.test(backup||''))backup=backup.replace(/\/$/,'')+'/'+encodeURIComponent(alchemy);
    // Chain mismatch and contradictory Explorer metadata must not be hidden by retries.
    const reason=String(first instanceof Error?first.message:first);
    if(!['evm','sol'].includes(chain.wallet_type)||! /provider-|fetch|aborted|timeout|network|rpc-missing|rpc-error/i.test(reason))throw first;
    // Arbitrum One: offizieller öffentlicher RPC als letzter lesender Fallback;
    // providerMetadata prüft die Chain-ID vor jedem eth_call erneut.
    if((!backup||backup===chain.rpc_url)&&configKey==='arb')backup='https://arb1.arbitrum.io/rpc';
    if(!backup||backup===chain.rpc_url)throw first;
    observed=await providerMetadata({...chain,rpc_url:backup},a,json,block);
   }
   return await record(observed);
  }catch(e){const reason=String(e instanceof Error?e.message:e);return await record({status:'unavailable',decimals:null,kind:'unknown',source:'provider-unavailable',reason:/^[a-z0-9-]{1,100}$/.test(reason)?reason:'provider-unavailable'})}
 })();inflight.set(key,work);try{return await work}finally{inflight.delete(key)}
}
Deno.serve(async request=>{
 const reply=(v:any,status=200)=>Response.json(v,{status,headers:cors});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(request.method!=='POST')return reply({ok:false,error:'POST required'},405);
 if(!DB||!KEY)return reply({ok:false,error:'Server configuration missing'},500);
 try{
  const bearer=/^Bearer\s+([^\s]+)$/i.exec(request.headers.get('authorization')||'');if(!bearer)return reply({ok:false,error:'User JWT required'},401);
  const service=bearer[1]===KEY;let user:any=null;
  if(!service){const {data,error}=await sb.auth.getUser(bearer[1]);if(error||!data?.user?.id)return reply({ok:false,error:'Invalid user JWT'},401);user=data.user}
  const body=await request.json();
  if(body.mode==='resolve'){
   if(typeof body.chain!=='string'||typeof body.address!=='string')return reply({ok:false,error:'Chain and address required'},400);
   const block=service&&Number.isSafeInteger(body.block)&&body.block>0?body.block:null;
   // Refresh ist nur für Admins bzw. interne Service-Aufrufe erlaubt.
   let forceRefresh=false;
   if(body.refresh===true){
    if(service)forceRefresh=true;
    else{
     const {data:admin,error:adminError}=await sb.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();
     if(adminError||!admin)return reply({ok:false,error:'Admin access required for refresh'},403);
     forceRefresh=true;
    }
   }
   try{
    const result=await resolveMetadata(body.chain,body.address,forceRefresh,block);
    return reply({ok:['verified','not_applicable'].includes(result.status),...result});
   }catch(e){
    const raw=String(e instanceof Error?e.message:e);
    const reason=/^[a-z0-9-]{1,100}$/.test(raw)?raw:'metadata-service-error';
    // Fachliche Prüfung fehlgeschlagen != Transportfehler; detaillierte, aber
    // nicht-sensitive Diagnose an den Browser liefern.
    return reply({ok:false,chain:body.chain,address:body.address,status:'unavailable',reason});
   }
  }
  if(body.mode!=='refresh-catalog'&&body.mode!=='refresh-own')return reply({ok:false,error:'Unknown mode'},400);
  if(service)return reply({ok:false,error:'User JWT required for catalog'},403);
  if(body.mode==='refresh-catalog'){
   const {data:admin,error}=await sb.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();if(error||!admin)return reply({ok:false,error:'Admin access required'},403);
  }
  if(body.after!==undefined&&(typeof body.after!=='string'||body.after.length>250))return reply({ok:false,error:'Invalid continuation'},400);
  const {data:all,error}=await sb.rpc('wallettracking_token_metadata_batch',{p_user:user.id,p_after:body.after||'',p_own_only:body.mode==='refresh-own'});if(error)throw Error('catalog-unavailable');
  const selected=(all||[]).slice(0,12),results:any[]=[];
  for(let i=0;i<selected.length;i+=4)results.push(...await Promise.all(selected.slice(i,i+4).map(async(t:any)=>{try{return await resolveMetadata(t.chain,t.address,true)}catch{return {chain:t.chain,address:t.address,status:'unavailable',decimals:null,reason:'metadata-request-failed'}}})));
  return reply({ok:true,mode:body.mode,checked:results.length,results,nextAfter:all.length>12?selected.at(-1).key:null,
   notice:'Technical metadata only. Personal lists/display settings, balances, prices, rewards and cron unchanged.'});
 }catch{return reply({ok:false,error:'Metadata request failed'},500)}
});
