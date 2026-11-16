/* WalletTracking 8.79: priced five preview + separately confirmed fixed atomic commit. */
(() => {
 'use strict';
 const MODE='admin-legacy-priced-next-five-preview-878';
 const WALLET='8a3c5dc6-0610-482d-a327-3f3ba03db158';
 const COMMIT_MODE='admin-legacy-priced-five-commit-879';
 const FIXED=[
  ['0x21a0ec877f6ebf0452db83b9a0439ea26d12b28351f571b8d48c21ce9d6eb99d',165133,818,'2897336081630970904',1.5082171161676934],
  ['0x0c7c6987ef6b39a84fc8cb38cbc8beb5865ccc249e6b15141bc7b5c0f4a5a9d4',957944,819,'18064831138661371117',1.3088042775902748],
  ['0xd74d49ef15fdb8f7a888978c00f0a4202afee6f416e8be7df04436ddb92e8a62',1235068,818,'4683845788150189695',1.2121051069783015],
  ['0x586e659f7bd640e9da1af365128c6957b581e5e35793696ac8c7bd061c3ab9de',1563318,818,'5371944796713223241',0.8792326692622405],
  ['0x34babc2ceda4baeae94aa3bd1d108126de8a9f4267f01e74a85121f51f370a7b',1571769,819,'10055790584863412936',0.9277639319938638]
 ];
 let active=false;
 let ready=false;
 const el=id=>document.getElementById(id);
 const status=(message,failed=false)=>{
  const node=el('daoLegacyPricedFiveStatus878');
  if(node){node.textContent=message;node.style.color=failed?'var(--danger,#b3261e)':'';}
 };
 window.previewDaoLegacyPricedFive878=async()=>{
  if(active)return;
  ready=false;const commitButton=el('daoLegacyPricedFiveCommit879');if(commitButton)commitButton.disabled=true;
  if(!window.isSecureContext||!navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id){
   status('HTTPS, Internet und angemeldetes Admin-Konto erforderlich.',true);return;
  }
  const button=el('daoLegacyPricedFiveStart878');
  const output=el('daoLegacyPricedFiveResult878');
  active=true;if(button)button.disabled=true;if(output)output.textContent='';
  status('Prüfe fünf offene Claims ab Preisbeginn. Keine Buchungen…');
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
      data.pricedOnly!==true||data.minClaimBlock!==88356||
      data.writesPerformed!==0||data.claimsCreated!==0||
      !Number.isInteger(data.checked)||data.checked<0||data.checked>5||
      !Array.isArray(data.results)||data.results.length!==data.checked||
      data.results.some(x=>Number(x.claimBlock)<88356||
       (x.status==='verified_preview'&&x.price?.status!=='exact_v13_verified')))
    throw Error('Unvollständige oder fehlerhafte historische Preisprüfung');
   if(output)output.textContent=JSON.stringify(data,null,2);
   if(data.stopped==='completed'&&data.checked===5&&data.results.every((x,i)=>
      x.status==='verified_preview'&&x.blockers?.length===0&&
      x.txHash===FIXED[i][0]&&Number(x.claimBlock)===FIXED[i][1]&&
      x.nftId===FIXED[i][2]&&x.amountRaw===FIXED[i][3]&&
      x.price?.status==='exact_v13_verified'&&x.price?.priceUsd===FIXED[i][4]&&
      x.price?.source==='historical-pool-state'&&x.price?.proofBlock===FIXED[i][1])){
    ready=true;if(commitButton)commitButton.disabled=false;
   }
   const verified=data.results.filter(x=>x.status==='verified_preview').length;
   status(`${verified}/${data.checked} mit historischem USD-Beleg verifiziert. ${data.stopped==='completed'?'Prüfung abgeschlossen.':'Stopp: '+data.stopped}. Keine Datenänderungen.`,data.stopped!=='completed');
  }catch(e){status(`Prüfung abgebrochen: ${String(e?.message||e)}. Keine automatische Wiederholung.`,true);}
  finally{active=false;if(button)button.disabled=false;}
 };
 window.commitDaoLegacyPricedFive879=async()=>{
  if(active||!ready){status('Zuerst alle fünf festgelegten Claims erneut vollständig prüfen.',true);return;}
  const code=window.prompt('Fünf kanonische Claims in EINER Datenbanktransaktion verbuchen. Gib COMMIT-FIVE-879 ein:');
  if(code!=='COMMIT-FIVE-879'){status('Stapelübernahme nicht bestätigt. Keine Datenänderung.');return;}
  if(!window.confirm('Letzte Bestätigung: Genau 5 festgelegte historische MineBot-Claims atomar übernehmen?'))return;
  const button=el('daoLegacyPricedFiveStart878'),commitButton=el('daoLegacyPricedFiveCommit879');
  ready=false;active=true;if(button)button.disabled=true;if(commitButton)commitButton.disabled=true;
  status('Prüfe alle fünf Live-Belege nochmals und starte nur bei vollständiger Übereinstimmung eine atomare Buchung…');
  try{
   if(!window.isSecureContext||!navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id)
    throw Error('Sichere Admin-Sitzung erforderlich');
   const user=currentUser.id;
   const {data:session,error:se}=await sb.auth.getSession();
   if(se||!session?.session?.access_token||currentUser?.id!==user)throw Error('Admin-Sitzung geändert');
   const {data,error}=await sb.functions.invoke('dao-reward-refresh',{
    body:{mode:COMMIT_MODE,confirm:'COMMIT-FIVE-879'}
   });
   if(error){
    let detail='';try{detail=String((await error.context?.clone?.().json())?.error||'')}catch(_ignored){}
    throw Error(detail||String(error.message||error));
   }
   if(data?.ok!==true||data.mode!==COMMIT_MODE||data.walletId!==WALLET||
      data.status!=='committed'||data.claimsCreated!==5||data.results?.length!==5||
      data.results.some((x,i)=>x.txHash!==FIXED[i][0]||x.status!=='completed'))
    throw Error(data?.error||'Keine vollständige Bestätigung der atomaren Stapelübernahme');
   const output=el('daoLegacyPricedFiveResult878');if(output)output.textContent=JSON.stringify(data,null,2);
   status('Fünf festgelegte kanonische Claims gemeinsam übernommen. Datenbank-Abnahme erforderlich.');
  }catch(e){status(`Stapelübernahme nicht bestätigt: ${String(e?.message||e)}. Vor Wiederholung Datenbankstatus prüfen.`,true);}
  finally{active=false;if(button)button.disabled=false;}
 };
})();
