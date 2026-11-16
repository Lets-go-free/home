/* WalletTracking 8.72: one manually selected historical claim, read-only. */
(() => {
 'use strict';
 const MODE='admin-legacy-single-claim-preview-872';
 const WALLET='8a3c5dc6-0610-482d-a327-3f3ba03db158';
 let active=false;
 const el=id=>document.getElementById(id);
 const status=(value,failed=false)=>{
  const node=el('daoLegacySingleStatus');if(node){node.textContent=value;node.style.color=failed?'var(--danger,#b3261e)':'';}
 };
 window.previewDaoLegacySingle872=async()=>{
  if(active)return;
  const hash=String(el('daoLegacySingleHash')?.value||'').trim().toLowerCase();
  if(!/^0x[0-9a-f]{64}$/.test(hash)){status('Ungültiger Transaktionshash.',true);return;}
  if(!window.isSecureContext||!window.navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id){
   status('HTTPS, Internet und angemeldetes Admin-Konto erforderlich.',true);return;
  }
  const user=currentUser.id;active=true;
  const button=el('daoLegacySingleStart');if(button)button.disabled=true;
  const out=el('daoLegacySingleResult');if(out)out.textContent='';
  status('Prüfe ausgewählte Transaktion und historische Blockchain-Nachweise…');
  try{
   const {data:session,error:sessionError}=await sb.auth.getSession();
   if(sessionError||!session?.session?.access_token||currentUser?.id!==user)throw Error('Admin-Sitzung geändert');
   const {data,error}=await sb.functions.invoke('dao-reward-refresh',{body:{mode:MODE,txHash:hash}});
   if(error)throw Error(String(error.message||error));
   if(!data||data.ok!==true||data.mode!==MODE||data.walletId!==WALLET||
      data.txHash!==hash||data.writesPerformed!==0||!['verified_preview','needs_review'].includes(data.status))
    throw Error('Ungültige oder unvollständige Prüfantwort');
   if(out)out.textContent=JSON.stringify(data,null,2);
   const priceLabel=data.price?.status==='exact_v13_verified'
    ?`exact-v13: ${data.price.priceUsd} USD/APTM (Belegblock ${data.price.proofBlock}); indikativ ${data.price.rewardUsdEstimate??'–'} USD`
    :`USD: ${data.price?.status||'offen'}`;
   status(data.status==='verified_preview'
    ?`Prüfung erfolgreich: MineBot #${data.nftId}, ${data.amountAptm} APTM. ${priceLabel}. Keine Datenänderungen.`
    :`Nicht zur Übernahme bereit: ${(data.blockers||[]).join(', ')}. Keine Datenänderungen.`,data.status!=='verified_preview');
  }catch(e){status(`Prüfung abgebrochen: ${String(e?.message||e)}. Keine automatische Wiederholung.`,true);}
  finally{active=false;if(button)button.disabled=false;}
 };
})();
