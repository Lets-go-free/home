// WalletTracking 8.37 – öffentliches Contract-Risikosignal; kein Sicherheitszertifikat.
// Keine Wallet-Adressen, Benutzerlisten oder private Token-Namen an Dritte senden.
import {createClient} from 'npm:@supabase/supabase-js@^2';
const URL=Deno.env.get('SUPABASE_URL')||'',KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'authorization, apikey, content-type, x-client-info','access-control-allow-methods':'POST, OPTIONS'};
// UI-/Registry-Schlüssel verweisen auf dieselbe EVM-Chain. Keine Änderung der DB-Keys.
const chainIds:Record<string,string>={
 eth:'1',bsc:'56',matic:'137',polygon:'137',pol:'137',
 arb:'42161',arbitrum:'42161',base:'8453',avax:'43114',avalanche:'43114'
};
const nonEvmChains=new Set(['sol','solana','btc','bitcoin','xrp','tron','akash']);
const flaggedBsc='0xa2afaf65004551ad9c11f8b68d72d63980fd9b62';
const fraudLabel='Fake_Phishing1123827';
const timeoutFetch=async(url:string,ms=6500)=>{
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),ms);
 try{return await fetch(url,{signal:ctrl.signal,headers:{'accept':'text/html,application/json'}})}finally{clearTimeout(timer)};
};
function goPlusFlags(info:any){
 const flags:string[]=[];
 if(info?.is_honeypot==='1')flags.push('GoPlus: Honeypot');
 if(info?.is_blacklisted==='1')flags.push('GoPlus: Blacklist');
 if(info?.cannot_sell_all==='1')flags.push('GoPlus: möglicherweise nicht vollständig verkaufbar');
 if(info?.is_mintable==='1')flags.push('GoPlus: nachprägbar');
 if(info?.is_open_source==='0')flags.push('GoPlus: Contract nicht verifiziert');
 return flags;
}
async function bscscanWarning(address:string){
 try{
  // Explorer-HTML ist eine optionale Quelle. Bei Blockade/Markup-Änderung: "nicht geprüft".
  const r=await timeoutFetch('https://bscscan.com/address/'+address,5000);
  if(!r.ok)return {checked:false,flags:[] as string[]};
  const html=(await r.text()).slice(0,1500000);
  if(!html.toLowerCase().includes(address))return {checked:false,flags:[] as string[]};
  const tags=[...html.matchAll(/\b(?:Fake[_ -]?Phishing\d*|Fake[_ -]?Token)\b/gi)].map(m=>m[0]);
  const flags=[...new Set(tags)].slice(0,4).map(t=>'BscScan-Warnung: '+t);
  return {checked:true,flags};
 }catch{return {checked:false,flags:[] as string[]}}
}
// Gemeinsamer Cache, damit Seitenaufrufe nicht pro Benutzer erneut das GoPlus-Limit verbrauchen.
// Nur öffentliche Contract-Risikosignale, niemals Wallet-/User-Daten im Cache.
const CACHE_TABLE='wallet_token_risk_cache';
const GATE_RPC='wallettracking_token_risk_provider_gate';
const CACHE_SUCCESS_MS=24*60*60*1000;
const CACHE_MISSING_MS=15*60*1000;
function newResult(chain:string,address:string,info:any,status:string){
 const known=chain==='bsc'&&address===flaggedBsc;
 const flags=[...new Set([...(known?['BscScan: '+fraudLabel+' (bekannter dokumentierter Fall)']:[]),...goPlusFlags(info)])];
 const limited=status==='api-code-4029'||status==='api-code-4029-cooldown';
 return {checked:!!info||known,flags,
  reason:info?'GoPlus geprüft':known?'Dokumentierte BscScan-Kennzeichnung':limited?'GoPlus-Anfragelimit erreicht':'GoPlus nicht verfügbar',
  providerStatus:info?'ok':status,explorerChecked:false};
}
Deno.serve(async request=>{
 const reply=(body:any,status=200)=>Response.json(body,{status,headers:cors});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(request.method!=='POST')return reply({ok:false,error:'POST required'},405);
 if(!URL||!KEY)return reply({ok:false,error:'Service configuration unavailable'},503);
 const bearer=/^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization')||'');
 if(!bearer)return reply({ok:false,error:'Authentication required'},401);
 const sb=createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:auth,error:authError}=await sb.auth.getUser(bearer[1]);
 if(authError||!auth?.user?.id)return reply({ok:false,error:'Invalid user token'},401);
 let body:any;try{body=await request.json()}catch{return reply({ok:false,error:'Invalid JSON'},400)}
 const chain=String(body?.chain||'').trim().toLowerCase(),id=chainIds[chain];
 const addrs=body?.addresses;
 if(!Array.isArray(addrs)||addrs.length<1||addrs.length>10||addrs.some((a:any)=>typeof a!=='string'||!a.trim()))
  return reply({ok:false,error:'Invalid addresses',reason:'expected 1–10 non-empty addresses'},400);
 if(nonEvmChains.has(chain))return reply({ok:true,chain,status:'unsupported',reason:'No GoPlus ERC-20 check for this chain',results:{}});
 if(!id)return reply({ok:false,error:'Unsupported chain',reason:'unknown-chain',chain},422);
 if(addrs.some((a:string)=>!/^0x[0-9a-f]{40}$/i.test(a)))
  return reply({ok:false,error:'Invalid addresses',reason:'expected 0x + 40 hexadecimal characters'},400);
 const addresses=[...new Set((addrs as string[]).map(a=>a.toLowerCase()))];
 const results:Record<string,any>={};
 const now=new Date();
 // Datenbankfehler dürfen nicht unbemerkt zu ungebremsten Provider-Aufrufen führen.
 const {data:cached,error:cacheError}=await sb.from(CACHE_TABLE)
   .select('address,assessment,expires_at').eq('chain_id',id).in('address',addresses)
   .gt('expires_at',now.toISOString());
 if(cacheError)return reply({ok:false,error:'Risk cache unavailable',reason:'server-cache-error'},503);
 for(const item of cached||[]){
  if(item?.assessment&&typeof item.assessment==='object'&&!Array.isArray(item.assessment)){
   results[item.address]={...item.assessment,cacheStatus:'hit'};
  }
 }
 const missing=addresses.filter(a=>!results[a]);
 if(missing.length){
  const {data:gate,error:gateError}=await sb.rpc(GATE_RPC,{p_provider:'goplus',p_cooldown_seconds:0});
  if(gateError)return reply({ok:false,error:'Risk rate gate unavailable',reason:'server-gate-error'},503);
  let providerStatus=gate==='cooldown'?'api-code-4029-cooldown':'request-throttled';
  const security:Record<string,any>={};
  if(gate==='allowed'){
   try{
    const endpoint='https://api.gopluslabs.io/api/v1/token_security/'+id+'?contract_addresses=';
    // Höchstens eine Batch-Anfrage; kein Retry-Sturm bei API-Code 4029.
    const response=await timeoutFetch(endpoint+missing.join(','),6500);
    if(!response.ok)providerStatus='http-'+response.status;
    else{
     let payload:any;
     try{payload=await response.json()}catch{providerStatus='invalid-json'}
     if(payload){
      if(String(payload?.code)!=='1'){
       const code=String(payload?.code??'missing').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,24);
       providerStatus='api-code-'+(code||'unknown');
      }else if(!payload.result||typeof payload.result!=='object'||Array.isArray(payload.result)){
       providerStatus='invalid-result';
      }else{
       providerStatus='missing-contract-result';
       for(const [key,value] of Object.entries(payload.result)){
        const addr=key.toLowerCase();
        if(missing.includes(addr)&&value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length>0)
         security[addr]=value;
       }
      }
     }
    }
   }catch(e){providerStatus=e instanceof Error&&e.name==='AbortError'?'timeout':'network-error'}
   if(providerStatus==='api-code-4029'||providerStatus==='http-429'){
    // Persistente Sperre für alle Edge-Instanzen, nicht nur für diese Anfrage.
    const {error:cooldownError}=await sb.rpc(GATE_RPC,{p_provider:'goplus',p_cooldown_seconds:3600});
    if(cooldownError)return reply({ok:false,error:'Risk cooldown persistence failed'},503);
   }
  }
  const writes:any[]=[];
  for(const a of missing){
   const info=security[a]||null;
   const status=info?'ok':providerStatus;
   const result=newResult(chain,a,info,status);
   // Explorer best-effort nur bei nicht bereits bekanntem Fraud-Label.
   if(chain==='bsc'&&a!==flaggedBsc){
    const explorer=await bscscanWarning(a);
    result.explorerChecked=explorer.checked;
    if(explorer.flags.length){result.checked=true;result.flags.push(...explorer.flags)}
   }
   results[a]=result;
   // Bei bereits erkanntem Limit keine kurzlebigen Fehler-Einträge schreiben:
   // Die globale Sperre übernimmt die Drosselung.
   if(status!=='api-code-4029'&&status!=='api-code-4029-cooldown'&&status!=='http-429'&&status!=='request-throttled'){
    const ttl=info?CACHE_SUCCESS_MS:CACHE_MISSING_MS;
    writes.push({chain_id:id,address:a,assessment:result,
      expires_at:new Date(Date.now()+ttl).toISOString(),updated_at:new Date().toISOString()});
   }
  }
  if(writes.length){
   const {error:writeError}=await sb.from(CACHE_TABLE).upsert(writes,{onConflict:'chain_id,address'});
   if(writeError)return reply({ok:false,error:'Risk cache write failed',reason:'server-cache-error'},503);
  }
 }
 // Hardcoded dokumentiertes Phishing-Signal ist auch bei Alt-Cache sichtbar.
 for(const a of addresses){
  if(chain==='bsc'&&a===flaggedBsc){
   results[a].flags=[...new Set([...(results[a].flags||[]),'BscScan: '+fraudLabel+' (bekannter dokumentierter Fall)'])];
   results[a].checked=true;
   if(results[a].reason==='GoPlus nicht verfügbar')results[a].reason='Dokumentierte BscScan-Kennzeichnung';
  }
 }
 return reply({ok:true,chain,results});
});
