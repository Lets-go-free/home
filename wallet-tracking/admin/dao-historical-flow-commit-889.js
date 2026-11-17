/* WalletTracking 8.90: optionally drain verified historical native flows in guarded three-claim transactions. */
(()=>{
 'use strict';
 const MODE='admin-historical-flow-commit-889';
 const WALLET='e8b5c835-0db2-4449-bbee-258e28b42bbb';
 const CHECKPOINT='wt-dao-historical-flow-commit-890-progress';
 let busy=false,stopRequested=false;
 const el=id=>document.getElementById(id);
 const status=(message,error=false)=>{const node=el('daoHistoricalFlowCommitStatus889');if(node){node.textContent=message;node.style.color=error?'var(--danger,#b3261e)':'';}};
 const buttons=()=>{
  const once=el('daoHistoricalFlowCommit889'),all=el('daoHistoricalFlowCommitAll890'),stop=el('daoHistoricalFlowStop890');
  if(once)once.disabled=busy;
  if(all)all.disabled=busy;
  if(stop)stop.disabled=!busy||stopRequested;
 };
 const remember=(completed,remaining)=>{
  try{sessionStorage.setItem(CHECKPOINT,JSON.stringify({completed,remaining,at:new Date().toISOString()}));}catch{/* Still safe without storage */}
 };
 async function commitOne(user){
   if(!navigator.onLine||currentUser?.id!==user)throw Error('Internetverbindung oder Admin-Sitzung geändert');
   const {data:session,error:sessionError}=await sb.auth.getSession();
   if(sessionError||!session?.session?.access_token||currentUser.id!==user)throw Error('Admin-Sitzung geändert');
   const {data,error}=await sb.functions.invoke('dao-reward-refresh',{
    body:{mode:MODE,offset:0,confirmation:'COMMIT-3-HISTORICAL-FLOWS'}});
   if(error){let detail='';try{const info=await error.context?.clone?.().json();detail=String(info?.error||info?.status||'')}catch(_ignored){}
    throw Error(detail||String(error.message||error));}
   const output=el('daoHistoricalFlowCommitResult889');if(output)output.textContent=JSON.stringify(data,null,2);
   if(data?.ok!==true||data.mode!==MODE||data.status!=='committed'||data.walletId!==WALLET||
      !Number.isInteger(data.totalBefore)||data.totalBefore<1||data.totalBefore>161||
      !Number.isInteger(data.flowsCreated)||data.flowsCreated!==Math.min(3,data.totalBefore)||
      data.claimsCreated!==0||data.verified!==data.flowsCreated||
      !Array.isArray(data.results)||data.results.length!==data.flowsCreated||
      data.results.some(x=>x.status!=='flow_committed'||!/^0x[0-9a-f]{64}$/.test(x.txHash)||
       !/^\d+$/.test(x.amountRaw)))
    throw Error('Übernahme-Antwort nicht eindeutig: vor einem erneuten Versuch Datenbank kontrollieren.');
   return data;
 }
 window.commitDaoHistoricalFlows889=async()=>{
  if(busy)return;
  if(!confirm('Genau die drei ältesten noch offenen Claims werden mit frischen On-Chain-Belegen geprüft und bei Erfolg atomar als Eingangsflows gespeichert. Bestehende Claims und Preise bleiben unverändert. Jetzt wirklich übernehmen?'))return;
  busy=true;stopRequested=false;buttons();
  status('Prüfe die nächsten maximal drei Claims erneut live; schreibe nur bei vollständig gültigen Belegen …');
  try{
   if(!window.isSecureContext||!navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id)
    throw Error('HTTPS, Internet und angemeldetes Admin-Konto erforderlich');
   const user=currentUser.id;
   const data=await commitOne(user);
   status(`${data.flowsCreated} historische Eingangsflows atomar übernommen; 0 Claims neu angelegt. Bitte jetzt unabhängig in Supabase kontrollieren.`);
  }catch(e){status(`Aktion gestoppt: ${String(e?.message||e)}. Vor Wiederholung Datenbank kontrollieren.`,true);}
  finally{busy=false;stopRequested=false;buttons();}
 };
 window.stopDaoHistoricalFlowCommit890=()=>{
  if(busy){stopRequested=true;buttons();status('Stopp angefordert: Der aktuell laufende atomare Dreierstapel wird noch abgeschlossen.');}
 };
 window.commitAllDaoHistoricalFlows890=async()=>{
  if(busy)return;
  if(!confirm('Die verbleibenden 161 historischen Eingangsflows werden nacheinander in atomaren Dreierstapeln übernommen. Jeder Claim wird neu on-chain geprüft; bei Fehler oder Abbruch keine automatische Wiederholung. Alle 161 jetzt freigeben?'))return;
  busy=true;stopRequested=false;buttons();
  let committed=0,remaining=null,batches=0;
  try{
   if(!window.isSecureContext||!navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id)
    throw Error('HTTPS, Internet und angemeldetes Admin-Konto erforderlich');
   const user=currentUser.id;
   do{
    const data=await commitOne(user);
    if(remaining!==null&&data.totalBefore!==remaining)
     throw Error(`Kandidatenanzahl zwischen Stapeln geändert (erwartet ${remaining}, erhalten ${data.totalBefore}); unabhängig prüfen.`);
    remaining=data.totalBefore-data.flowsCreated;
    committed+=data.flowsCreated;batches++;
    remember(committed,remaining);
    status(`${committed} Flows in diesem Lauf übernommen · ${remaining} historisch offen · ${batches} atomare Stapel. Kein Cron. ${stopRequested?'Stopp nach aktuellem Stapel.':''}`);
   }while(remaining>0&&!stopRequested);
   if(remaining===0)status(`Abgeschlossen: ${committed} weitere Flows übernommen, 0 historische Kandidaten offen. Bitte unabhängige SQL-Gesamtabnahme durchführen.`);
   else status(`Manuell gestoppt: ${committed} übernommen, ${remaining} offen. Vor Fortsetzung Datenbank abnehmen.`);
  }catch(e){status(`Serienübernahme gestoppt: ${String(e?.message||e)}. ${committed} bestätigte Flows in diesem Lauf; letzter sicherer Restbestand ${remaining===null?'unbekannt':remaining}. Vor erneutem Start Datenbank prüfen.`,true);}
  finally{busy=false;stopRequested=false;buttons();}
 };
 buttons();
})();
