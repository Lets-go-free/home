/* WalletTracking 8.86 — bounded, strictly read-only historic native mint proof. */
(()=>{
 'use strict';
 const MODE='admin-historical-flow-preview-886';
 const WALLET='e8b5c835-0db2-4449-bbee-258e28b42bbb';
 let active=false,nextOffset=null;
 const el=id=>document.getElementById(id);
 const status=(s,bad=false)=>{const n=el('daoHistoricalFlowStatus886');if(n){n.textContent=s;n.style.color=bad?'var(--danger,#b3261e)':'';}};
 const buttons=()=>{
  const first=el('daoHistoricalFlowFirst886'),next=el('daoHistoricalFlowNext886');
  if(first)first.disabled=active;
  if(next)next.disabled=active||nextOffset===null||nextOffset>=164;
 };
 window.previewDaoHistoricalFlows886=async continuing=>{
  if(active||continuing&&nextOffset===null)return;
  const offset=continuing?nextOffset:0;
  nextOffset=null;active=true;buttons();status(`Prüfe die historischen Claims ab Position ${offset+1}; keine Datenänderungen …`);
  try{
   if(!window.isSecureContext||!navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id)
    throw Error('HTTPS, Internet und angemeldetes Admin-Konto erforderlich');
   const user=currentUser.id;
   const {data:session,error:sessionError}=await sb.auth.getSession();
   if(sessionError||!session?.session?.access_token||currentUser.id!==user)
    throw Error('Admin-Sitzung geändert');
   const {data,error}=await sb.functions.invoke('dao-reward-refresh',{body:{mode:MODE,offset}});
   if(error){let detail='';try{detail=String((await error.context?.clone?.().json())?.error||'')}catch(_ignored){}
    throw Error(detail||String(error.message||error));}
   const output=el('daoHistoricalFlowResult886');if(output)output.textContent=JSON.stringify(data,null,2);
   if(data?.ok!==true||data.mode!==MODE||data.walletId!==WALLET||data.total!==164||
      data.offset!==offset||data.checked<1||data.checked>3||data.writesPerformed!==0||data.claimsCreated!==0||
      !Array.isArray(data.results)||data.results.length!==data.checked||
      data.results.some(r=>r.status!=='verified_preview'||!/^\d+$/.test(String(r.amountRaw||''))))
    throw Error('Live-Vorschau meldet Abweichung oder unvollständige Belege. Keine Fortsetzung.');
   if(data.stopped!=='completed')throw Error('Vorschau nicht vollständig abgeschlossen. Keine Fortsetzung.');
   nextOffset=data.hasMore?data.nextOffset:null;
   status(`${data.checked}/3 dieser Gruppe verifiziert · ${data.nextOffset}/164 geprüft · keine Datenänderungen.${data.hasMore?' Nächste Gruppe manuell freigegeben.':' Letzte Gruppe erreicht.'}`);
  }catch(e){status(`Prüfung gestoppt: ${String(e?.message||e)}`,true);}
  finally{active=false;buttons();}
 };
})();
