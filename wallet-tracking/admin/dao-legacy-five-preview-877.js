/* WalletTracking 8.77: admin-only, read-only next five historical MineBot claims. */
(() => {
 'use strict';
 const MODE='admin-legacy-next-five-preview-877';
 const WALLET='8a3c5dc6-0610-482d-a327-3f3ba03db158';
 let active=false;
 const el=id=>document.getElementById(id);
 const status=(message,failed=false)=>{
  const node=el('daoLegacyFiveStatus877');
  if(node){node.textContent=message;node.style.color=failed?'var(--danger,#b3261e)':'';}
 };
 window.previewDaoLegacyFive877=async()=>{
  if(active)return;
  if(!window.isSecureContext||!navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id){
   status('HTTPS, Internet und angemeldetes Admin-Konto erforderlich.',true);return;
  }
  active=true;
  const button=el('daoLegacyFiveStart877');if(button)button.disabled=true;
  const output=el('daoLegacyFiveResult877');if(output)output.textContent='';
  status('Prüfe maximal fünf unverarbeitete Claims. Bei Abweichung wird sofort gestoppt…');
  try{
   const user=currentUser.id;
   const {data:session,error:se}=await sb.auth.getSession();
   if(se||!session?.session?.access_token||currentUser?.id!==user)throw Error('Admin-Sitzung geändert');
   const {data,error}=await sb.functions.invoke('dao-reward-refresh',{body:{mode:MODE}});
   if(error){
    let detail='';try{detail=String((await error.context?.clone?.().json())?.error||'')}catch(_ignored){}
    throw Error(detail||String(error.message||error));
   }
   if(data?.ok!==true||data.mode!==MODE||data.walletId!==WALLET||
      data.writesPerformed!==0||data.claimsCreated!==0||
      !Number.isInteger(data.checked)||data.checked<0||data.checked>5||
      !Array.isArray(data.results)||data.results.length!==data.checked)
    throw Error('Unvollständige oder unerwartete Stapelantwort');
   if(output)output.textContent=JSON.stringify(data,null,2);
   const verified=data.results.filter(x=>x.status==='verified_preview').length;
   status(`${verified}/${data.checked} verifiziert, verbleibend zuvor ${data.remainingBefore??'–'}. ${data.stopped==='completed'?'Prüfung abgeschlossen.':'Stopp: '+data.stopped}. Keine Datenänderungen.`,data.stopped!=='completed');
  }catch(e){status(`Prüfung abgebrochen: ${String(e?.message||e)}. Keine automatische Wiederholung.`,true);}
  finally{active=false;if(button)button.disabled=false;}
 };
})();
