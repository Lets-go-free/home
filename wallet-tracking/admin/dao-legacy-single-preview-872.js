/* WalletTracking 8.74: read-only single proof + explicitly confirmed, fixed-TX commit. */
(() => {
 'use strict';
 const MODE='admin-legacy-single-claim-preview-872';
 const WALLET='8a3c5dc6-0610-482d-a327-3f3ba03db158';
 const COMMIT_MODE='admin-legacy-single-claim-commit-874';
 const COMMIT_HASH='0xc27e0aa5e092efefe9f57e8c7d6890bfdd54a974fde2988e6319a653b3eb2363';
 let active=false;
 let readyHash=null;
 const el=id=>document.getElementById(id);
 const status=(value,failed=false)=>{
  const node=el('daoLegacySingleStatus');if(node){node.textContent=value;node.style.color=failed?'var(--danger,#b3261e)':'';}
 };
 window.previewDaoLegacySingle872=async()=>{
  if(active)return;
  const hash=String(el('daoLegacySingleHash')?.value||'').trim().toLowerCase();
  readyHash=null;const commitButton=el('daoLegacySingleCommit874');if(commitButton)commitButton.disabled=true;
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
   if(hash===COMMIT_HASH&&data.status==='verified_preview'&&data.nftId===818&&
      data.amountRaw==='15167495057030400213'&&data.blockers?.length===0&&
      data.price?.status==='exact_v13_verified'&&data.price?.source==='historical-pool-state'&&
      data.price?.targetBlock===957942&&data.price?.proofBlock===957942&&
      data.price?.priceUsd===1.3088042775902748){
    readyHash=hash;if(commitButton)commitButton.disabled=false;
   }
   const priceLabel=data.price?.status==='exact_v13_verified'
    ?`exact-v13: ${data.price.priceUsd} USD/APTM (Belegblock ${data.price.proofBlock}); indikativ ${data.price.rewardUsdEstimate??'–'} USD`
    :`USD: ${data.price?.status||'offen'}`;
   status(data.status==='verified_preview'
    ?`Prüfung erfolgreich: MineBot #${data.nftId}, ${data.amountAptm} APTM. ${priceLabel}. Keine Datenänderungen.`
    :`Nicht zur Übernahme bereit: ${(data.blockers||[]).join(', ')}. Keine Datenänderungen.`,data.status!=='verified_preview');
  }catch(e){status(`Prüfung abgebrochen: ${String(e?.message||e)}. Keine automatische Wiederholung.`,true);}
  finally{active=false;if(button)button.disabled=false;}
 };
 window.commitDaoLegacySingle874=async()=>{
  if(active||readyHash!==COMMIT_HASH||String(el('daoLegacySingleHash')?.value||'').trim().toLowerCase()!==COMMIT_HASH){
   status('Zuerst den unveränderten Ziel-Claim neu prüfen.',true);return;
  }
  const confirmation=window.prompt('Datenbankbuchung für genau 1 Claim (MineBot #818, Block 957942). Bitte COMMIT-957942-818 eintippen:');
  if(confirmation!=='COMMIT-957942-818'){status('Einzelübernahme nicht bestätigt; keine Datenänderung.');return;}
  if(!window.confirm('Letzte Bestätigung: 15.167495057030400213 APTM als kanonischen Claim #818 verbuchen?'))return;
  active=true;readyHash=null;
  const button=el('daoLegacySingleStart'),commitButton=el('daoLegacySingleCommit874');
  if(button)button.disabled=true;if(commitButton)commitButton.disabled=true;
  status('Prüfe Blockchain-Nachweise erneut und buche nur bei vollständiger Übereinstimmung…');
  try{
   if(!window.isSecureContext||!window.navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id)
    throw Error('Sichere angemeldete Admin-Sitzung erforderlich');
   const user=currentUser.id;
   const {data:session,error:se}=await sb.auth.getSession();
   if(se||!session?.session?.access_token||currentUser?.id!==user)throw Error('Admin-Sitzung geändert');
   const {data,error}=await sb.functions.invoke('dao-reward-refresh',{
    body:{mode:COMMIT_MODE,txHash:COMMIT_HASH,confirm:'COMMIT-957942-818'}
   });
   if(error||data?.ok!==true||data.mode!==COMMIT_MODE||data.txHash!==COMMIT_HASH||
      data.status!=='committed'||data.claimsCreated!==1)throw Error(error?.message||data?.error||'Übernahme nicht bestätigt');
   const out=el('daoLegacySingleResult');if(out)out.textContent=JSON.stringify(data,null,2);
   status('Genau 1 kanonischer Claim #818 übernommen. Weitere Claims wurden nicht verändert.');
  }catch(e){status(`Übernahme nicht bestätigt: ${String(e?.message||e)}. Datenbankstatus vor Wiederholung prüfen.`,true);}
  finally{active=false;if(button)button.disabled=false;}
 };
})();
