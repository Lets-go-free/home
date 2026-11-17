/* WalletTracking 8.88 — sequential, abortable, strictly read-only historic mint proof. */
(()=>{
 'use strict';
 const MODE='admin-historical-flow-preview-886',WALLET='e8b5c835-0db2-4449-bbee-258e28b42bbb',TOTAL=164;
 const CHECKPOINT='wt-dao-historical-flow-preview-888-offset';
 let active=false,stopRequested=false,nextOffset=null;
 const el=id=>document.getElementById(id);
 const status=(s,bad=false)=>{const n=el('daoHistoricalFlowStatus886');if(n){n.textContent=s;n.style.color=bad?'var(--danger,#b3261e)':'';}};
 const checkpoint=()=>{try{const value=sessionStorage.getItem(CHECKPOINT);return value===null?NaN:Number(value);}catch{return NaN;}};
 const saveCheckpoint=n=>{try{sessionStorage.setItem(CHECKPOINT,String(n));}catch{/* Still usable without storage. */}};
 const buttons=()=>{
  const first=el('daoHistoricalFlowFirst886'),next=el('daoHistoricalFlowNext886'),stop=el('daoHistoricalFlowStop888');
  if(first)first.disabled=active;
  if(next)next.disabled=active||nextOffset===null||nextOffset>=TOTAL;
  if(stop)stop.disabled=!active||stopRequested;
 };
 const setOffset=n=>{nextOffset=n<TOTAL?n:null;saveCheckpoint(n);const field=el('daoHistoricalFlowResume888');if(field)field.value=String(n);};
 window.stopDaoHistoricalFlow888=()=>{if(active){stopRequested=true;buttons();status('Stopp angefordert – der aktuelle Dreieraufruf wird abgeschlossen.');}};
 async function verifyPage(offset,user){
   if(!navigator.onLine||currentUser?.id!==user)throw Error('Internetverbindung oder Admin-Sitzung geändert');
   const {data:session,error:sessionError}=await sb.auth.getSession();
   if(sessionError||!session?.session?.access_token||currentUser.id!==user)
    throw Error('Admin-Sitzung abgelaufen');
   const {data,error}=await sb.functions.invoke('dao-reward-refresh',{body:{mode:MODE,offset}});
   if(error){let detail='';try{detail=String((await error.context?.clone?.().json())?.error||'')}catch(_ignored){}
    throw Error(detail||String(error.message||error));}
   const output=el('daoHistoricalFlowResult886');if(output)output.textContent=JSON.stringify(data,null,2);
   if(data?.ok!==true||data.mode!==MODE||data.walletId!==WALLET||data.total!==TOTAL||
      data.offset!==offset||!Number.isInteger(data.checked)||data.checked<1||data.checked>3||
      data.writesPerformed!==0||data.claimsCreated!==0||!Array.isArray(data.results)||
      data.results.length!==data.checked||data.nextOffset!==offset+data.checked||
      data.hasMore!==(data.nextOffset<TOTAL)||data.selected!==data.checked||
      data.results.some(r=>r.status!=='verified_preview'||r.blockers?.length!==0||
       !/^\d+$/.test(String(r.amountRaw||''))||r.ownershipProof!=='prior-transfer-recipient'))
    throw Error(`Live-Vorschau ab Position ${offset+1} meldet Abweichung oder unvollständige Belege. Details unten.`);
   if(data.stopped!=='completed')throw Error(`Vorschau ab Position ${offset+1} nicht vollständig abgeschlossen.`);
   return data.nextOffset;
 }
 window.previewDaoHistoricalFlows886=continuing=>{
  if(active||continuing&&nextOffset===null)return;
  return run(continuing?nextOffset:0,false);
 };
 window.runDaoHistoricalFlowAll888=()=>{
  if(active)return;
  const field=el('daoHistoricalFlowResume888'),offset=Number(field?.value);
  if(!Number.isSafeInteger(offset)||offset<0||offset>=TOTAL){status('Startposition muss zwischen 0 und 163 liegen.',true);return;}
  return run(offset,true);
 };
 async function run(start,all){
  active=true;stopRequested=false;buttons();
  let offset=start,verified=0,requests=0;
  status(`Starte lesende Prüfung ab Position ${start+1}/${TOTAL} …`);
  try{
   if(!window.isSecureContext||typeof sb==='undefined'||!isAdmin||!currentUser?.id)
    throw Error('HTTPS und angemeldetes Admin-Konto erforderlich');
   const user=currentUser.id;
   do{
    // Every invocation still checks a maximum of three claims using unchanged server-side guards.
    const advanced=await verifyPage(offset,user);
    verified+=advanced-offset;offset=advanced;requests++;
    setOffset(offset);
    status(`${offset}/${TOTAL} verifiziert · ${verified} in diesem Durchlauf · ${requests} Dreieraufrufe · 0 Änderungen.`);
   }while(all&&offset<TOTAL&&!stopRequested);
   if(offset===TOTAL)status(`Abgeschlossen: ${TOTAL}/${TOTAL} Claims verifiziert · 0 Datenänderungen. Noch keine Flows angelegt.`);
   else if(stopRequested)status(`Manuell gestoppt bei ${offset}/${TOTAL}. Wiederaufnahme ab Offset ${offset}.`);
   else status(`${offset}/${TOTAL} verifiziert · keine Änderungen. Nächste Gruppe bereit.`);
  }catch(e){
   status(`Prüfung bei Position ${offset+1} gestoppt: ${String(e?.message||e)} · ${offset}/${TOTAL} erfolgreich; keine Datenänderungen.`,true);
  }finally{active=false;stopRequested=false;buttons();}
 }
 const saved=checkpoint();
 if(Number.isSafeInteger(saved)&&saved>=0&&saved<=TOTAL)setOffset(saved);
 else setOffset(6); // Six independently verified previews in version 8.87.
 buttons();
})();
