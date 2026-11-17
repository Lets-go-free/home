/* WalletTracking 8.89: explicitly confirmed three-claim atomic commit only. */
(()=>{
 'use strict';
 const MODE='admin-historical-flow-commit-889';
 let busy=false;
 const el=id=>document.getElementById(id);
 const status=(message,error=false)=>{const node=el('daoHistoricalFlowCommitStatus889');if(node){node.textContent=message;node.style.color=error?'var(--danger,#b3261e)':'';}};
 window.commitDaoHistoricalFlows889=async()=>{
  if(busy)return;
  if(!confirm('Genau die drei ältesten noch offenen Claims werden mit frischen On-Chain-Belegen geprüft und bei Erfolg atomar als Eingangsflows gespeichert. Bestehende Claims und Preise bleiben unverändert. Jetzt wirklich übernehmen?'))return;
  busy=true;
  const button=el('daoHistoricalFlowCommit889');if(button)button.disabled=true;
  status('Prüfe die nächsten maximal drei Claims erneut live; schreibe nur bei vollständig gültigen Belegen …');
  try{
   if(!window.isSecureContext||!navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id)
    throw Error('HTTPS, Internet und angemeldetes Admin-Konto erforderlich');
   const user=currentUser.id;
   const {data:session,error:sessionError}=await sb.auth.getSession();
   if(sessionError||!session?.session?.access_token||currentUser.id!==user)throw Error('Admin-Sitzung geändert');
   const {data,error}=await sb.functions.invoke('dao-reward-refresh',{
    body:{mode:MODE,offset:0,confirmation:'COMMIT-3-HISTORICAL-FLOWS'}});
   if(error){let detail='';try{const info=await error.context?.clone?.().json();detail=String(info?.error||info?.status||'')}catch(_ignored){}
    throw Error(detail||String(error.message||error));}
   const output=el('daoHistoricalFlowCommitResult889');if(output)output.textContent=JSON.stringify(data,null,2);
   if(data?.ok!==true||data.mode!==MODE||data.status!=='committed'||
      !Number.isInteger(data.flowsCreated)||data.flowsCreated<1||data.flowsCreated>3||
      data.claimsCreated!==0||!Array.isArray(data.results)||data.results.length!==data.flowsCreated||
      data.results.some(x=>x.status!=='flow_committed'))
    throw Error('Übernahme-Antwort nicht eindeutig: vor einem erneuten Versuch Datenbank kontrollieren.');
   status(`${data.flowsCreated} historische Eingangsflows atomar übernommen; 0 Claims neu angelegt. Bitte jetzt unabhängig in Supabase kontrollieren.`);
  }catch(e){status(`Aktion gestoppt: ${String(e?.message||e)}. Vor Wiederholung Datenbank kontrollieren.`,true);}
  finally{busy=false;if(button)button.disabled=false;}
 };
})();
