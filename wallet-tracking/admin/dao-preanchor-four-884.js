/* WalletTracking 8.84: manually confirmed four historic pre-anchor claims. */
(()=>{
 'use strict';
 const WALLET='8a3c5dc6-0610-482d-a327-3f3ba03db158';
 const PREVIEW='admin-legacy-preanchor-preview-884';
 const COMMIT='admin-legacy-preanchor-commit-884';
 const EXPECTED=[
  ['0xc66aa64b38d65910e64c3bd63b26b58961f155e5a35663900494bd0721641c6c',40707,819,'2432568024883926698'],
  ['0xa7bf9a4827adcb397f92c0f67412320d0d77a74022878e5700b950fb28c47333',40709,818,'2432568024883926698'],
  ['0x88459cda136bdc5abebc2f3d79c2dcdd05320d498fac6d8c0c23c83f54f79b8f',62642,818,'676221939941904344'],
  ['0x37b087ddc4dc1a70cdfbb659561eeb1e81a7ad104e498f80ac9a453d4931ca53',62644,819,'676221939941904344']
 ];
 let active=false,ready=[];
 const el=id=>document.getElementById(id);
 const status=(s,error=false)=>{const n=el('daoPreanchorStatus884');if(n){n.textContent=s;n.style.color=error?'var(--danger,#b3261e)':'';}};
 const buttons=()=>{
  const preview=el('daoPreanchorPreview884'),commit=el('daoPreanchorCommit884');
  if(preview)preview.disabled=active;
  if(commit)commit.disabled=active||ready.length!==4;
 };
 const invoke=async body=>{
  if(!window.isSecureContext||!navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id)
   throw Error('HTTPS, Internet und angemeldetes Admin-Konto erforderlich');
  const user=currentUser.id;
  const {data:session,error:se}=await sb.auth.getSession();
  if(se||!session?.session?.access_token||currentUser.id!==user)throw Error('Admin-Sitzung geändert');
  const {data,error}=await sb.functions.invoke('dao-reward-refresh',{body});
  if(error){let detail='';try{detail=String((await error.context?.clone?.().json())?.error||'')}catch(_ignored){}
   throw Error(detail||String(error.message||error));}
  return data;
 };
 window.previewDaoPreanchorFour884=async()=>{
  if(active)return;ready=[];active=true;buttons();status('Prüfe vier frühe Claims erneut über Live-Trace und NFT-Belege. Keine Buchung…');
  try{
   const data=await invoke({mode:PREVIEW});
   if(data?.ok!==true||data.mode!==PREVIEW||data.walletId!==WALLET||
      data.checked!==4||data.stopped!=='completed'||data.writesPerformed!==0||data.claimsCreated!==0||
      !Array.isArray(data.results)||data.results.length!==4||data.results.some((x,i)=>
       x.txHash!==EXPECTED[i][0]||x.claimBlock!==EXPECTED[i][1]||x.nftId!==EXPECTED[i][2]||
       x.amountRaw!==EXPECTED[i][3]||x.status!=='verified_preview'||
       x.priceStatus!=='unpriced_before_exact_anchor'||x.rewardUsd!==null||
       x.mintCalls!==1||x.mintEvents!==1))throw Error('Preanchor-Vorschau nicht vollständig verifiziert');
   const output=el('daoPreanchorResult884');if(output)output.textContent=JSON.stringify(data,null,2);
   ready=data.results.map(x=>x.txHash);
   status('4/4 ohne USD-Preis vollständig nachgewiesen. Keine Datenänderungen. Manueller Commit freigegeben.');
  }catch(e){status(`Vorschau gestoppt: ${String(e?.message||e)}`,true);}
  finally{active=false;buttons();}
 };
 window.commitDaoPreanchorFour884=async()=>{
  if(active||ready.length!==4){status('Zuerst alle vier Claims frisch prüfen.',true);return;}
  const hashes=[...ready];
  if(window.prompt('Vier Claims mit APTM, aber OHNE USD-Bewertung atomar buchen. Gib COMMIT-PREANCHOR-884 ein:')!==
     'COMMIT-PREANCHOR-884')return;
  if(!window.confirm('Letzte Bestätigung: Genau vier historische Claims mit NULL-USD gemeinsam übernehmen?'))return;
  ready=[];active=true;buttons();status('Erneute Live-Prüfung und atomarer Commit. Keine automatische Wiederholung…');
  try{
   const data=await invoke({mode:COMMIT,confirm:'COMMIT-PREANCHOR-884',expectedTxHashes:hashes});
   if(data?.ok!==true||data.mode!==COMMIT||data.walletId!==WALLET||
      data.status!=='committed'||data.claimsCreated!==4||!Array.isArray(data.results)||
      data.results.length!==4||data.results.some((x,i)=>x.txHash!==hashes[i]||
       x.status!=='completed'||x.rewardUsd!==null))throw Error('Keine vollständige Commit-Bestätigung');
   const output=el('daoPreanchorResult884');if(output)output.textContent=JSON.stringify(data,null,2);
   status('Vier Claims als atomar übernommen gemeldet. Jetzt unabhängig in der Datenbank abnehmen.');
  }catch(e){status(`Commit nicht bestätigt: ${String(e?.message||e)}. Vor Wiederholung Datenbankstatus prüfen.`,true);}
  finally{active=false;buttons();}
 };
})();
