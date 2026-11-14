// WalletTracking 8.36 – öffentliches Contract-Risikosignal; kein Sicherheitszertifikat.
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
 // Nicht unterstützte Chains sind keine Sicherheitsfreigabe und kein Provider-Ausfall.
 if(nonEvmChains.has(chain))return reply({ok:true,chain,status:'unsupported',reason:'No GoPlus ERC-20 check for this chain',results:{}});
 if(!id)return reply({ok:false,error:'Unsupported chain',reason:'unknown-chain',chain},422);
 if(addrs.some((a:string)=>!/^0x[0-9a-f]{40}$/i.test(a)))
  return reply({ok:false,error:'Invalid addresses',reason:'expected 0x + 40 hexadecimal characters'},400);
 const addresses=[...new Set((addrs as string[]).map(a=>a.toLowerCase()))];
 // GoPlus gibt bei mehreren Adressen gelegentlich nur eine Teilmenge zurueck.
 // Fehlende Datensaetze deshalb einmal gezielt einzeln abfragen; keine Sicherheitsfreigabe bei Luecken.
 const security:Record<string,any>={};
 const providerDiagnostics:Record<string,string>={};
 // Pro angefragtem Contract nur kurze Statuscodes, keine Auth-Daten oder Fremdantworten.
 const mark=(requested:string[],reason:string)=>{for(const addr of requested){if(!security[addr])providerDiagnostics[addr]=reason}};
 const endpoint='https://api.gopluslabs.io/api/v1/token_security/'+id+'?contract_addresses=';
 async function fetchSecurity(requested:string[]){
  try{
   const response=await timeoutFetch(endpoint+requested.join(','),6500);
   if(!response.ok){mark(requested,'http-'+response.status);return}
   let payload:any;
   try{payload=await response.json()}catch{mark(requested,'invalid-json');return}
   if(String(payload?.code)!=='1'){
    // Nur einen begrenzten Provider-Code ausgeben, niemals ungefilterte Provider-Meldungen.
    const code=String(payload?.code??'missing').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,24);
    mark(requested,'api-code-'+(code||'unknown'));return;
   }
   if(!payload?.result||typeof payload.result!=='object'||Array.isArray(payload.result)){
    mark(requested,'invalid-result');return;
   }
   for(const [key,value] of Object.entries(payload.result)){
    const addr=key.toLowerCase();
    if(requested.includes(addr)&&value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length>0){
     security[addr]=value;
     delete providerDiagnostics[addr];
    }
   }
   mark(requested,'missing-contract-result');
  }catch(e){
   mark(requested,e instanceof Error&&e.name==='AbortError'?'timeout':'network-error');
  }
 }
 await fetchSecurity(addresses);
 const missing=addresses.filter(a=>!security[a]);
 // Maximal zehn Zusatzanfragen, in kleinen Gruppen statt unbeschraenkt parallel.
 for(let i=0;i<missing.length;i+=3)
  await Promise.all(missing.slice(i,i+3).map(a=>fetchSecurity([a])));
 const results:Record<string,any>={};
 for(const a of addresses){
  const known=chain==='bsc'&&a===flaggedBsc;
  const gp=security[a]||null;
  results[a]={checked:!!gp||known,flags:[...new Set([
   ...(known?['BscScan: '+fraudLabel+' (bekannter dokumentierter Fall)']:[]),...goPlusFlags(gp)
  ])],reason:gp?'GoPlus geprüft':known?'Dokumentierte BscScan-Kennzeichnung':'GoPlus nicht verfügbar',providerStatus:gp?'ok':providerDiagnostics[a]||'unknown'};
 }
 if(chain==='bsc'){
  // Kleiner, begrenzter Best-effort-Abgleich gegen Explorer; keine false-safe-Freigabe.
  for(let i=0;i<addresses.length;i+=3){
   await Promise.all(addresses.slice(i,i+3).map(async a=>{
    if(a===flaggedBsc)return;
    const label=await bscscanWarning(a);
    if(label.flags.length){results[a].checked=true;results[a].flags.push(...label.flags)}
    results[a].explorerChecked=label.checked;
   }));
  }
 }
 return reply({ok:true,chain,results});
});
