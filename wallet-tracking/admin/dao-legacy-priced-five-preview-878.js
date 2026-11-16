/* WalletTracking 8.82: reusable bounded historical claim preview and atomic commit. */
(() => {
 'use strict';
 const MODE='admin-legacy-priced-next-five-preview-878';
 const WALLET='8a3c5dc6-0610-482d-a327-3f3ba03db158';
 const COMMIT_MODE='admin-legacy-priced-five-commit-879';
 const COMMIT_MODE_880='admin-legacy-priced-five-commit-880';
 const COMMIT_MODE_881='admin-legacy-priced-five-commit-881';
 const COMMIT_MODE_882='admin-legacy-priced-bounded-commit-882';
 const FIXED=[
  ['0x21a0ec877f6ebf0452db83b9a0439ea26d12b28351f571b8d48c21ce9d6eb99d',165133,818,'2897336081630970904',1.5082171161676934],
  ['0x0c7c6987ef6b39a84fc8cb38cbc8beb5865ccc249e6b15141bc7b5c0f4a5a9d4',957944,819,'18064831138661371117',1.3088042775902748],
  ['0xd74d49ef15fdb8f7a888978c00f0a4202afee6f416e8be7df04436ddb92e8a62',1235068,818,'4683845788150189695',1.2121051069783015],
  ['0x586e659f7bd640e9da1af365128c6957b581e5e35793696ac8c7bd061c3ab9de',1563318,818,'5371944796713223241',0.8792326692622405],
  ['0x34babc2ceda4baeae94aa3bd1d108126de8a9f4267f01e74a85121f51f370a7b',1571769,819,'10055790584863412936',0.9277639319938638]
 ];
 const FIXED_880=[
  ['0xfb2184155412199053bb6df979dc8b4c57283725b935d30b8364c06676bd0d87',1839700,818,'2525083041605479397',1.29818624453132],
  ['0xb4abf20ae63e8488013729c1160d1578faecbf7b4b13183b2db3fb136e9e5596',1858236,819,'2687537425933638715',1.2969281481676773],
  ['0xc801519cac197cb76b38b2eca6432639f1a3588ef82af1cb1310dbda6f151bd0',2185604,818,'2924284507977177513',1.6625433945298382],
  ['0x4bf476ecd9fa1ffe956ddce09e40731ea856170c034b706bb3e4a8e98813af6b',2185862,819,'2761830123649018195',1.6638156156980808],
  ['0x5bfd2df402f5ac52708c88838cf443711932fa6f7dc1f91bf6635c21c210429f',2337875,818,'1137205057236417485',1.9320395188634845]
 ];
 const FIXED_881=[
  ['0x9c9f96176b85f475568b8360919f70af67bee87cd5c359db1e4f36076de5490f',2337881,819,'1137205057236417485',1.9321904798310519],
  ['0xaf426c032f2506eb7e9fd2279072457e750b678f76cc06d505170e124ff9c29c',2396232,818,'487363152984477954',1.8732107004603566],
  ['0x105cc30694e9de6bcafc948bf688d2dc4e9eaca765776e20837e09b3505c4a89',2743281,819,'3411310607339698510',1.7170427180788568],
  ['0x174c195a835de324dea9c4dd0b70e55d97f6a1e75dcb6fbeb28e05fd2684aaed',2743285,818,'2923947454355220556',1.7170506314776859],
  ['0x4e0458a361e2fd6c93fdb99a78dac414cb205fcf4a5e961b81b4017fe10ca703',2803236,818,'487311054585855039',1.6983804634903685]
 ];
 let active=false;
 let ready=false;
 let ready880=false;
 let ready881=false;
 let ready882=[];
 const el=id=>document.getElementById(id);
 const status=(message,failed=false)=>{
  const node=el('daoLegacyPricedFiveStatus878');
  if(node){node.textContent=message;node.style.color=failed?'var(--danger,#b3261e)':'';}
 };
 window.previewDaoLegacyPricedFive878=async()=>{
  if(active)return;
  ready=false;ready880=false;ready881=false;ready882=[];
  const commitButton=el('daoLegacyPricedFiveCommit879');if(commitButton)commitButton.disabled=true;
  const commitButton880=el('daoLegacyPricedFiveCommit880');if(commitButton880)commitButton880.disabled=true;
  const commitButton881=el('daoLegacyPricedFiveCommit881');if(commitButton881)commitButton881.disabled=true;
  const commitButton882=el('daoLegacyPricedFiveCommit882');if(commitButton882)commitButton882.disabled=true;
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
   if(data.stopped==='completed'&&data.checked===5&&data.results.every((x,i)=>
      x.status==='verified_preview'&&x.blockers?.length===0&&
      x.txHash===FIXED_880[i][0]&&Number(x.claimBlock)===FIXED_880[i][1]&&
      x.nftId===FIXED_880[i][2]&&x.amountRaw===FIXED_880[i][3]&&
      x.price?.status==='exact_v13_verified'&&x.price?.priceUsd===FIXED_880[i][4]&&
      x.price?.source==='historical-pool-state'&&x.price?.proofBlock===FIXED_880[i][1])){
    ready880=true;if(commitButton880)commitButton880.disabled=false;
   }
   if(data.stopped==='completed'&&data.checked===5&&data.results.every((x,i)=>
      x.status==='verified_preview'&&x.blockers?.length===0&&
      x.txHash===FIXED_881[i][0]&&Number(x.claimBlock)===FIXED_881[i][1]&&
      x.nftId===FIXED_881[i][2]&&x.amountRaw===FIXED_881[i][3]&&
      x.price?.status==='exact_v13_verified'&&x.price?.priceUsd===FIXED_881[i][4]&&
      x.price?.source==='historical-pool-state'&&x.price?.proofBlock===FIXED_881[i][1])){
    ready881=true;if(commitButton881)commitButton881.disabled=false;
   }
   if(data.stopped==='completed'&&data.checked>0&&data.checked<=5&&
      data.results.every(x=>x.status==='verified_preview'&&x.blockers?.length===0&&
       [818,819].includes(x.nftId)&&/^[0-9]+$/.test(x.amountRaw)&&
       x.price?.status==='exact_v13_verified'&&x.price?.priceUsd>0&&
       x.price?.source==='historical-pool-state'&&x.price?.proofBlock===Number(x.claimBlock)&&
       x.price?.targetBlock===Number(x.claimBlock)&&x.price?.scannedFromBlock===Number(x.claimBlock)&&
       x.price?.parserVersion===1&&
       x.price?.poolAddress?.toLowerCase()==='0x38acbfa5108d3c76d6cea4d380182e832a289b57'&&
       x.mintCalls>=1&&x.mintCalls===x.mintEvents)){
    ready882=data.results.map(x=>x.txHash);
    if(commitButton882)commitButton882.disabled=false;
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
 window.commitDaoLegacyPricedFive880=async()=>{
  if(active||!ready880){status('Zuerst die fünf festgelegten Claims für 8.80 erneut prüfen.',true);return;}
  const code=window.prompt('Fünf neue kanonische Claims in EINER Datenbanktransaktion verbuchen. Gib COMMIT-FIVE-880 ein:');
  if(code!=='COMMIT-FIVE-880'){status('Stapelübernahme nicht bestätigt. Keine Datenänderung.');return;}
  if(!window.confirm('Letzte Bestätigung: Genau die 5 neuen historischen MineBot-Claims atomar übernehmen?'))return;
  const button=el('daoLegacyPricedFiveStart878'),commitButton=el('daoLegacyPricedFiveCommit880');
  ready880=false;active=true;if(button)button.disabled=true;if(commitButton)commitButton.disabled=true;
  status('Prüfe alle fünf Live-Belege erneut. Bei Abweichung keine Buchung…');
  try{
   if(!window.isSecureContext||!navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id)
    throw Error('Sichere Admin-Sitzung erforderlich');
   const user=currentUser.id;
   const {data:session,error:se}=await sb.auth.getSession();
   if(se||!session?.session?.access_token||currentUser?.id!==user)throw Error('Admin-Sitzung geändert');
   const {data,error}=await sb.functions.invoke('dao-reward-refresh',{
    body:{mode:COMMIT_MODE_880,confirm:'COMMIT-FIVE-880'}
   });
   if(error){
    let detail='';try{detail=String((await error.context?.clone?.().json())?.error||'')}catch(_ignored){}
    throw Error(detail||String(error.message||error));
   }
   if(data?.ok!==true||data.mode!==COMMIT_MODE_880||data.walletId!==WALLET||
      data.status!=='committed'||data.claimsCreated!==5||data.results?.length!==5||
      data.results.some((x,i)=>x.txHash!==FIXED_880[i][0]||x.status!=='completed'))
    throw Error(data?.error||'Keine vollständige Bestätigung der atomaren 8.80-Übernahme');
   const output=el('daoLegacyPricedFiveResult878');if(output)output.textContent=JSON.stringify(data,null,2);
   status('Fünf festgelegte 8.80-Claims atomar übernommen. Datenbank-Abnahme erforderlich.');
  }catch(e){status(`Stapelübernahme nicht bestätigt: ${String(e?.message||e)}. Vor Wiederholung Datenbankstatus prüfen.`,true);}
  finally{active=false;if(button)button.disabled=false;}
 };
 window.commitDaoLegacyPricedFive881=async()=>{
  if(active||!ready881){status('Zuerst die fünf festgelegten Claims für 8.80 erneut prüfen.',true);return;}
  const code=window.prompt('Fünf neue kanonische Claims in EINER Datenbanktransaktion verbuchen. Gib COMMIT-FIVE-881 ein:');
  if(code!=='COMMIT-FIVE-881'){status('Stapelübernahme nicht bestätigt. Keine Datenänderung.');return;}
  if(!window.confirm('Letzte Bestätigung: Genau die 5 neuen historischen MineBot-Claims atomar übernehmen?'))return;
  const button=el('daoLegacyPricedFiveStart878'),commitButton=el('daoLegacyPricedFiveCommit881');
  ready881=false;active=true;if(button)button.disabled=true;if(commitButton)commitButton.disabled=true;
  status('Prüfe alle fünf Live-Belege erneut. Bei Abweichung keine Buchung…');
  try{
   if(!window.isSecureContext||!navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id)
    throw Error('Sichere Admin-Sitzung erforderlich');
   const user=currentUser.id;
   const {data:session,error:se}=await sb.auth.getSession();
   if(se||!session?.session?.access_token||currentUser?.id!==user)throw Error('Admin-Sitzung geändert');
   const {data,error}=await sb.functions.invoke('dao-reward-refresh',{
    body:{mode:COMMIT_MODE_881,confirm:'COMMIT-FIVE-881'}
   });
   if(error){
    let detail='';try{detail=String((await error.context?.clone?.().json())?.error||'')}catch(_ignored){}
    throw Error(detail||String(error.message||error));
   }
   if(data?.ok!==true||data.mode!==COMMIT_MODE_881||data.walletId!==WALLET||
      data.status!=='committed'||data.claimsCreated!==5||data.results?.length!==5||
      data.results.some((x,i)=>x.txHash!==FIXED_881[i][0]||x.status!=='completed'))
    throw Error(data?.error||'Keine vollständige Bestätigung der atomaren 8.80-Übernahme');
   const output=el('daoLegacyPricedFiveResult878');if(output)output.textContent=JSON.stringify(data,null,2);
   status('Fünf festgelegte 8.80-Claims atomar übernommen. Datenbank-Abnahme erforderlich.');
  }catch(e){status(`Stapelübernahme nicht bestätigt: ${String(e?.message||e)}. Vor Wiederholung Datenbankstatus prüfen.`,true);}
  finally{active=false;if(button)button.disabled=false;}
 };
 window.commitDaoLegacyPricedBounded882=async()=>{
  if(active||ready882.length<1||ready882.length>5){
   status('Zuerst den nächsten Stapel vollständig und erfolgreich lesen.',true);return;
  }
  const expected=[...ready882];
  const code=window.prompt(`Genau ${expected.length} frisch geprüfte Claims atomar übernehmen. Gib COMMIT-NEXT-882 ein:`);
  if(code!=='COMMIT-NEXT-882'){status('Keine Übernahme bestätigt.');return;}
  if(!window.confirm(`Letzte Bestätigung: ${expected.length} historische MineBot-Claims gemeinsam übernehmen?`))return;
  const button=el('daoLegacyPricedFiveStart878'),commitButton=el('daoLegacyPricedFiveCommit882');
  ready882=[];active=true;if(button)button.disabled=true;if(commitButton)commitButton.disabled=true;
  status('Prüfe den bestätigten Stapel live erneut. Bei Abweichung keine Buchung…');
  try{
   if(!window.isSecureContext||!navigator.onLine||typeof sb==='undefined'||!isAdmin||!currentUser?.id)
    throw Error('Sichere Admin-Sitzung erforderlich');
   const user=currentUser.id;
   const {data:session,error:se}=await sb.auth.getSession();
   if(se||!session?.session?.access_token||currentUser?.id!==user)throw Error('Admin-Sitzung geändert');
   const {data,error}=await sb.functions.invoke('dao-reward-refresh',{
    body:{mode:COMMIT_MODE_882,confirm:'COMMIT-NEXT-882',expectedTxHashes:expected}
   });
   if(error){
    let detail='';try{detail=String((await error.context?.clone?.().json())?.error||'')}catch(_ignored){}
    throw Error(detail||String(error.message||error));
   }
   if(data?.ok!==true||data.mode!==COMMIT_MODE_882||data.walletId!==WALLET||
      data.status!=='committed'||data.claimsCreated!==expected.length||
      !Array.isArray(data.results)||data.results.length!==expected.length||
      data.results.some((x,i)=>x.txHash!==expected[i]||x.status!=='completed'))
    throw Error(data?.error||'Keine vollständige atomare Übernahmebestätigung');
   const output=el('daoLegacyPricedFiveResult878');if(output)output.textContent=JSON.stringify(data,null,2);
   status(`${expected.length} historische Claims atomar übernommen. Vor dem nächsten Stapel Datenbank-Abnahme durchführen.`);
  }catch(e){status(`Übernahme nicht bestätigt: ${String(e?.message||e)}. Vor Wiederholung Datenbankstatus prüfen.`,true);}
  finally{active=false;if(button)button.disabled=false;}
 };
})();
