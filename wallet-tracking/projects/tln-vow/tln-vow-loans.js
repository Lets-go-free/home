/* TLN/VOW Loans central engine · Build 20260914-182500 */
(function(global){
'use strict';
function createLoanEngine(ctx={}){
  const ethers=ctx.ethers||global.ethers;
  const rpc=ctx.rpc;
  const alchemy=ctx.alchemy;
  const norm=ctx.norm;
  const esc=ctx.esc||((v)=>String(v??''));
  const short=ctx.short||((v)=>String(v||''));
  const tokenMeta=ctx.tokenMeta;
  const log=ctx.log||(()=>{});
  const projectOwnWalletLabel=ctx.projectOwnWalletLabel||(()=> '');
  const getWallets=ctx.getWallets||(()=>[]);
  const getProjectRows=ctx.getProjectRows||(()=>[]);
  const hasAlchemy=ctx.hasAlchemy||(()=>true);
  const loadCache=ctx.loadCache||null;
  const saveCache=ctx.saveCache||null;
  if(!ethers||typeof rpc!=='function'||typeof alchemy!=='function'||typeof norm!=='function'||typeof tokenMeta!=='function'){
    throw new Error('TLNVOWLoanEngine: unvollständiger Adapter.');
  }
// Loans · On-Chain Discovery
// -----------------------------------------------------------------------------
let LOAN_DISCOVERY_ROWS=[];
let LOAN_DISCOVERY_LOADING=false;
let LOAN_DISCOVERY_LOADED=false;
const LOAN_RECEIPT_CACHE=new Map();
const LOAN_TX_CACHE=new Map();
const LOAN_META_CACHE=new Map();
const LOAN_CACHE_KEY='loan-openings-lifecycle';
const LOAN_CACHE_VERSION='loan-engine-v3-cashflow-collateral';
const LOAN_CACHE_OVERLAP_BLOCKS=24;
const LOAN_TOKEN_CANONICAL=Object.freeze({'0x29280091fa7f3abe4739ad5f1f7c5287feaf7736':{symbol:'TLN+'},'0xaa90a8cdab8b8e902293a2817d1d286f66cbcec5':{symbol:'TLNGOLD'}});
const LOAN_TRANSFER_TOPIC=ethers.id('Transfer(address,address,uint256)').toLowerCase();
const LOAN_ZERO='0x0000000000000000000000000000000000000000';
const LOAN_OPTIONS_CONTRACT='0x82bf5fd4f64b8d9f3509723613abe1a6ae287bbd';
const LOAN_VUSD_ADDRESS='0x9c23942ca2c35e06d1d20747f33705983a18d2ab';
const LOAN_REPAY_TOPIC=ethers.id('LoanRepay(address,uint256,uint256,uint256)').toLowerCase();
const LOAN_DURATION_DAYS=372;
const LOAN_BOOSTER_BY_EVENT_VALUE3=Object.freeze({
  '0':'TLN Gold Booster ×4',
  '1':'TLN Plus 2x',
  '2':'TLN Plus 0.25x',
  '3':'TLN Gold Booster ×2',
  '4':'TLN Gold Rebound',
  '5':'TLN Gold Extended'
});

function loanNum(v,max=8){return v==null?'–':Number(v).toLocaleString('de-CH',{maximumFractionDigits:max});}
function loanWalletShort(addr){const a=String(addr||'').trim();return /^0x[0-9a-fA-F]{40}$/.test(a)?`${a.slice(0,6)}…${a.slice(-4)}`:a;}
function loanDate(v){if(!v)return '–';return new Date(v).toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'});}
function loanEvidence(v){return v==='verified'?'<span class="loan-evidence-ok">on-chain bestätigt</span>':v==='likely'?'<span class="loan-evidence-likely">wahrscheinlich</span>':'<span class="loan-evidence-open">offen</span>';}
function loanSetState(text,kind='muted'){
  const el=document.getElementById('loanDiscoveryState');if(!el)return;
  el.className=kind==='ok'?'ok':kind==='warn'?'warn':kind==='err'?'err':'muted';el.textContent=text;
}
function loanNormSymbol(v){return String(v||'').trim().replace(/\s+/g,'').toUpperCase();}
function loanTopicAddress(topic){const h=String(topic||'').toLowerCase().replace(/^0x/,'').padStart(64,'0');return norm('0x'+h.slice(-40));}
function loanDataWords(data){const h=String(data||'').replace(/^0x/,'');const out=[];for(let i=0;i+64<=h.length;i+=64){try{out.push(BigInt('0x'+h.slice(i,i+64)))}catch{}}return out;}
function loanRawWord(v){
  try{
    const n=BigInt(v);
    if(n<=1000000000000n)return n.toString();
    const scaled=Number(ethers.formatUnits(n,18));
    if(Number.isFinite(scaled)&&Math.abs(scaled)<1e15)return `${scaled.toLocaleString('de-CH',{maximumFractionDigits:12})} (18d)`;
    return n.toString();
  }catch{return String(v??'–')}
}
function loanExpiryFrom(date){if(!date)return null;const d=new Date(date);if(Number.isNaN(d.getTime()))return null;d.setUTCDate(d.getUTCDate()+LOAN_DURATION_DAYS);return d.toISOString();}
function loanClose(a,b,tol=1e-7){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=Math.max(tol,Math.abs(b)*1e-6);}
function loanAddressLabel(address){const a=norm(address||'');const row=(getProjectRows()||[]).find(x=>norm(x?.address||x?.contract_address||'')===a);return row?.symbol||row?.label||'';}
async function loanMeta(address){
  const a=norm(address);if(!a)return {symbol:'',decimals:18};if(LOAN_META_CACHE.has(a))return LOAN_META_CACHE.get(a);
  const local=(getProjectRows()||[]).find(x=>norm(x?.address||x?.contract_address||'')===a),canonical=LOAN_TOKEN_CANONICAL[a]||null;
  const validDecimals=v=>v!==null&&v!==undefined&&v!==''&&Number.isInteger(Number(v))&&Number(v)>=0&&Number(v)<=36;
  let meta={symbol:canonical?.symbol||local?.symbol||local?.label||'',decimals:validDecimals(local?.decimals)?Number(local.decimals):null};
  try{const m=await tokenMeta(a);if(m?.symbol&&!meta.symbol)meta.symbol=m.symbol;if(validDecimals(m?.decimals))meta.decimals=Number(m.decimals)}catch{}
  if(!validDecimals(meta.decimals))meta.decimals=18;LOAN_META_CACHE.set(a,meta);return meta;
}
async function loanDecodeTransfers(receipt){
  const raw=[];
  for(const [index,l] of (receipt?.logs||[]).entries()){
    if(String(l?.topics?.[0]||'').toLowerCase()!==LOAN_TRANSFER_TOPIC||!l?.topics?.[1]||!l?.topics?.[2])continue;
    const token=norm(l.address),from=loanTopicAddress(l.topics[1]),to=loanTopicAddress(l.topics[2]);
    let valueRaw=0n;try{valueRaw=BigInt(l.data||'0x0')}catch{}
    raw.push({index,token,from,to,valueRaw});
  }
  const addresses=[...new Set(raw.map(x=>x.token))];
  await Promise.all(addresses.map(a=>loanMeta(a)));
  return raw.map(x=>{const m=LOAN_META_CACHE.get(x.token)||{symbol:'',decimals:18};let amount=0;try{amount=Number(ethers.formatUnits(x.valueRaw,m.decimals))}catch{}return {...x,symbol:m.symbol,amount};});
}
function loanFindEvent(receipt,wallet){
  const wt='0x'+norm(wallet).slice(2).padStart(64,'0');const candidates=[];
  for(const [index,l] of (receipt?.logs||[]).entries()){
    if(String(l?.topics?.[0]||'').toLowerCase()===LOAN_TRANSFER_TOPIC)continue;
    if(!(l?.topics||[]).some(t=>String(t||'').toLowerCase()===wt))continue;
    const words=loanDataWords(l.data);if(!words.length)continue;
    let score=0;const first=words[0],last=words.at(-1);
    if(first>0n&&first<1000000000n)score+=5;
    if(words.length>=3)score+=2;
    if(last>=0n&&last<=50n)score+=3;
    candidates.push({index,address:norm(l.address),words,score,topic0:String(l?.topics?.[0]||'')});
  }
  candidates.sort((a,b)=>b.score-a.score||b.words.length-a.words.length||b.index-a.index);
  return candidates[0]||null;
}
function loanClassify({tlnPlus,tlnGold,vusd,interest,rawType,eventAmount18}){
  const eventValue3=String(rawType??'').trim();
  const booster=LOAN_BOOSTER_BY_EVENT_VALUE3[eventValue3];
  if(booster)return booster;

  // Unbekannte TLN-GOLD-Varianten werden NICHT nach Namen geraten.
  // Wir kennzeichnen nur belastbare Mengenmuster als Arbeitsnamen.
  if((tlnGold||0)>0&&(vusd||0)>0){
    const nominal2=(eventAmount18>0)?eventAmount18:tlnGold*2;
    const isGold2=(eventAmount18>0&&loanClose(eventAmount18,tlnGold*2,.01)&&loanClose(vusd,eventAmount18*.82,.01))
      ||(!(eventAmount18>0)&&loanClose(vusd,tlnGold*2*.82,.01));
    if(isGold2)return 'TLN GOLD ×2 · Arbeitsname';

    const nominal4=(eventAmount18>0)?eventAmount18:vusd;
    const isGold4=((eventAmount18>0&&loanClose(eventAmount18,tlnGold*4,.01))||loanClose(vusd,tlnGold*4,.01))
      && interest>0 && loanClose(interest,nominal4*.18,.01);
    if(isGold4)return 'TLN GOLD ×4 · Arbeitsname';

    if(eventValue3&&eventValue3!=='–')return `TLN GOLD · Event-Wert 3 = ${eventValue3} · noch offen`;
    return 'TLN GOLD · Booster noch offen';
  }

  if(eventValue3&&eventValue3!=='–')return `Unbekannt · Event-Wert 3 = ${eventValue3}`;
  if(!(tlnPlus>0)||!(vusd>0))return 'Loan · Typ offen';

  const mintedPerTln=vusd/tlnPlus;
  let base='TLN+ Loan';
  if(loanClose(mintedPerTln,2))base='TLN Plus 2x';
  else if(loanClose(mintedPerTln,.5))base='2 TLN+ → 1 v$';
  else if(loanClose(mintedPerTln,.25))base='TLN Plus 0.25x';
  else if(loanClose(mintedPerTln,.82))base='Original · 18 % vom Mint abgezogen';
  else base=`TLN+ Loan · ${loanNum(tlnPlus/vusd,4)} TLN+ / v$`;

  if(interest>0&&loanClose(interest,vusd*.18,.01))base+=' · 18 % vorausbezahlt';
  return base;
}

function loanInterestModel({tlnPlus,tlnGold,vusd,interest,rawType,eventAmount18}){
  const ev3=String(rawType??'').trim();
  if(ev3==='0'||ev3==='1')return 'im Voraus bezahlt · 18 % · on-chain bestätigt';
  if(ev3==='2'||ev3==='3')return 'fällig bei Rückzahlung · 18 % · on-chain bestätigt';
  if(ev3==='4')return 'keine eigene Rückzahlung · TLN Gold Rebound';
  if(ev3==='5')return 'eigener Extended-Zins bei Rückzahlung · Betrag ausschließlich on-chain ermitteln';
  if(tlnPlus>0&&vusd>0&&loanClose(vusd,tlnPlus*.82,.01))
    return 'vom geminteten v$-Betrag abgezogen · 18 %';
  if(interest>0&&vusd>0&&loanClose(interest,vusd*.18,.01))
    return 'im Voraus bezahlt · 18 %';
  return 'noch zu bestimmen';
}

function loanDebtFields({tlnPlus,tlnGold,vusd,interest,rawType,eventAmount18}){
  const ev3=String(rawType??'').trim();
  if(ev3==='4')
    return {principal:null,repayment:null,interestDue:null,interestRate:null,repaymentSource:'keine eigene Rückzahlung · TLN Gold Rebound'};

  if(ev3==='5'){
    const principal=(eventAmount18>0)?eventAmount18:(vusd||null);
    // TLN Gold Extended / Second Chance ist ein neuer, eigenständiger Loan.
    // Weder Zins noch Schuld des verfallenen Alt-Loans werden übernommen.
    // Rückzahlungsbetrag und eigener Extended-Zins dürfen NICHT rechnerisch abgeleitet werden:
    // beide erst anzeigen, wenn sie für die neue Position on-chain belegt sind.
    return {principal,repayment:null,interestDue:null,interestRate:null,
      repaymentSource:'TLN Gold Extended · neuer eigenständiger Second-Chance-Loan · Rückzahlungsbetrag und eigener Zins ausschließlich positionsbezogen on-chain ermitteln'};
  }

  if(['0','1','2','3'].includes(ev3)){
    const principal=(eventAmount18>0)?eventAmount18:(vusd||null);
    const interestDue=principal!=null?principal*.18:null;
    const upfront=(ev3==='0'||ev3==='1');
    return {
      principal,
      repayment:principal!=null?(upfront?principal:principal*1.18):null,
      interestDue,
      interestRate:18,
      repaymentSource:upfront
        ?'Principal on-chain aus Options-Event · 18 % bei Eröffnung bezahlt · Rückzahlung 100 % Principal on-chain bestätigt'
        :'Principal on-chain aus Options-Event · 18 % bei Rückzahlung · Rückzahlung 118 % Principal on-chain bestätigt'
    };
  }

  if(tlnPlus>0&&vusd>0&&loanClose(vusd,tlnPlus*.82,.01)){
    const principal=tlnPlus,interestDue=principal-vusd;
    return {principal,repayment:principal,interestDue,interestRate:18,
      repaymentSource:'Legacy-Modell · Principal aus TLN+ Burn · 18 % vom geminteten v$-Betrag abgezogen'};
  }

  return {principal:(eventAmount18>0?eventAmount18:(vusd||null)),repayment:null,interestDue:null,interestRate:null,
    repaymentSource:'Rückzahlung on-chain noch zu bestimmen'};
}
async function loanReceipt(hash){
  const h=String(hash||'').toLowerCase();if(LOAN_RECEIPT_CACHE.has(h))return LOAN_RECEIPT_CACHE.get(h);
  const r=await rpc('eth_getTransactionReceipt',[h]);if(r)LOAN_RECEIPT_CACHE.set(h,r);return r;
}
async function loanBurnCandidatesForWallet(wallet,{fromBlock=0}={}){
  const out=[];
  const run=async qBase=>{let pageKey=null,pages=0;do{const q={fromBlock:'0x'+Math.max(0,Number(fromBlock||0)).toString(16),toBlock:'latest',fromAddress:wallet,category:['erc20'],excludeZeroValue:false,withMetadata:true,maxCount:'0x3e8',order:'asc',...qBase,...(pageKey?{pageKey}:{})};const r=await alchemy('alchemy_getAssetTransfers',[q]);pages++;for(const tr of (r?.transfers||[]))out.push(tr);pageKey=r?.pageKey||null;if(pages>250)throw new Error(`Loan-Transfer-Scan ${short(wallet)}: Pagination >250 Seiten abgebrochen.`)}while(pageKey)};
  // Direkter Burn-Scan plus breiter ausgehender Scan: Second-Chance-Burns dürfen nicht vom Zero-Address-Index abhängen.
  await run({toAddress:LOAN_ZERO});await run({});
  const dedup=new Map();for(const tr of out){const k=`${String(tr?.hash||'').toLowerCase()}|${String(tr?.uniqueId||tr?.logIndex||'')}|${norm(tr?.rawContract?.address||'')}`;if(!dedup.has(k))dedup.set(k,tr)}
  const filtered=[];for(const tr of dedup.values()){const addr=norm(tr?.rawContract?.address||'');let sym=LOAN_TOKEN_CANONICAL[addr]?.symbol||loanNormSymbol(tr?.asset);if(!['TLN+','TLNGOLD'].includes(loanNormSymbol(sym))&&addr){const m=await loanMeta(addr);sym=m?.symbol||sym}sym=loanNormSymbol(sym);if(['TLN+','TLNGOLD'].includes(sym))filtered.push({...tr,_loanSymbol:sym})}return filtered;
}
async function loanRepayCandidatesForWallet(wallet,{fromBlock=0}={}){
  const out=[];let pageKey=null,pages=0;
  do{
    const q={fromBlock:'0x'+Math.max(0,Number(fromBlock||0)).toString(16),toBlock:'latest',fromAddress:wallet,contractAddresses:[LOAN_VUSD_ADDRESS],category:['erc20'],excludeZeroValue:false,withMetadata:true,maxCount:'0x3e8',order:'asc',...(pageKey?{pageKey}:{})};
    const r=await alchemy('alchemy_getAssetTransfers',[q]);pages++;
    for(const tr of (r?.transfers||[]))if(norm(tr?.to||'')===LOAN_OPTIONS_CONTRACT)out.push(tr);
    pageKey=r?.pageKey||null;if(pages>250)throw new Error(`Loan-Repay-Scan ${short(wallet)}: Pagination >250 Seiten abgebrochen.`)
  }while(pageKey);
  return out;
}
async function loanBuildRepayment(wallet,tr){
  const hash=String(tr?.hash||'').toLowerCase();if(!hash)return null;
  const receipt=await loanReceipt(hash);if(!receipt||receipt.status==='0x0')return null;
  const w=norm(wallet),wt='0x'+w.slice(2).padStart(64,'0');
  const ev=(receipt.logs||[]).find(l=>String(l?.topics?.[0]||'').toLowerCase()===LOAN_REPAY_TOPIC&&String(l?.topics?.[1]||'').toLowerCase()===wt);
  if(!ev)return null;
  const words=loanDataWords(ev.data);if(words.length<3)return null;
  const transfers=await loanDecodeTransfers(receipt);
  const paid=transfers.filter(x=>x.token===LOAN_VUSD_ADDRESS&&x.from===w&&x.to===LOAN_OPTIONS_CONTRACT).reduce((n,x)=>n+Number(x.amount||0),0)||null;
  let principal=null,vowReleased=null;
  try{principal=Number(ethers.formatUnits(words[1],18))}catch{}
  try{vowReleased=Number(ethers.formatUnits(words[2],18))}catch{}
  let date=tr?.metadata?.blockTimestamp||null;
  if(!date&&receipt.blockNumber){try{const b=await rpc('eth_getBlockByNumber',[receipt.blockNumber,false]);if(b?.timestamp)date=new Date(Number(BigInt(b.timestamp))*1000).toISOString()}catch{}}
  const interest=(paid!=null&&principal!=null)?paid-principal:null;
  const interestRate=(interest!=null&&principal>0)?interest/principal*100:null;
  return {wallet:w,tx:hash,date,positionRef:Number(words[0]),principal,paid,interest,interestRate,vowReleased,rawEvent:words.map((x,i)=>`w${i+1}=${loanRawWord(x)}`).join(' · ')};
}
function loanApplyRepayments(rows,repayments){
  for(const rp of repayments){
    if(rp.principal==null)continue;
    let candidates=rows.filter(r=>norm(r.wallet)===rp.wallet&&Number(r.eventId)===Number(rp.positionRef)&&!r.repaymentDate);
    if(candidates.length!==1){
      candidates=rows.filter(r=>norm(r.wallet)===rp.wallet&&r.principal!=null&&loanClose(r.principal,rp.principal,.0001)&&!r.repaymentDate);
    }
    if(candidates.length!==1)continue;
    const r=candidates[0],ev3=String(r.rawType??'').trim();
    r.repayment=rp.paid??rp.principal;r.repaymentDate=rp.date||null;
    if(['0','1','2','3'].includes(ev3)){
      r.interestRate=18;
      r.interest=r.principal!=null?r.principal*.18:r.interest;
      r.interestModel=(ev3==='0'||ev3==='1')
        ?'im Voraus bezahlt · 18 % · on-chain bestätigt'
        :'fällig bei Rückzahlung · 18 % · on-chain bestätigt';
    }else{
      r.interest=rp.interest??r.interest;
      r.interestRate=rp.interestRate??r.interestRate;
    }
    r.repaymentSource=`LoanRepay on-chain · Position ${rp.positionRef} · Principal ${loanNum(rp.principal,8)} v$ · tatsächlich bezahlt ${rp.paid==null?'–':loanNum(rp.paid,8)+' v$'}`;
    r.collateralReturnedVow=rp.vowReleased??r.collateralReturnedVow??null;
    if(rp.vowReleased!=null&&rp.vowReleased>0){
      r.collateralStatus=`zurückgegeben · ${loanNum(rp.vowReleased,8)} VOW · LoanRepay on-chain`;
    }else if(r.collateralSource==='eigene VOW aus Wallet'){
      r.collateralStatus='Repay bestätigt · Collateral-Rückgabe im Lifecycle noch separat prüfen';
    }
    r.status='Zurückbezahlt · on-chain bestätigt';
    r.link=`Repay-Position ${rp.positionRef}`;
    r.evidence='verified';
  }
}
function loanExtendedRelationCandidateIds(receipt,eventId){
  const current=Number(eventId||0),out=[];
  for(const l of (receipt?.logs||[])){
    if(String(l?.topics?.[0]||'').toLowerCase()===LOAN_TRANSFER_TOPIC)continue;
    for(const w of loanDataWords(l?.data)){
      if(w<=50n||w>=1000000000n)continue;
      const n=Number(w);
      if(!Number.isSafeInteger(n)||n===current||out.includes(n))continue;
      out.push(n);
    }
  }
  return out;
}
async function loanResolveExtendedRelations(rows){
  const byWalletPosition=new Map();
  for(const r of rows){
    const id=Number(r?.eventId||0),wallet=norm(r?.wallet||'');
    if(wallet&&Number.isSafeInteger(id)&&id>0)byWalletPosition.set(`${wallet}|${id}`,r);
    delete r.replacedByPositionId;delete r.replacedByDate;
  }
  for(const r of rows){
    if(String(r?.rawType??'').trim()!=='5'&&r?.type!=='TLN Gold Extended')continue;
    let ids=Array.isArray(r.extendedRelationCandidateIds)?r.extendedRelationCandidateIds.map(Number).filter(Number.isSafeInteger):[];
    if(!ids.length&&r?.tx){
      try{const receipt=await loanReceipt(r.tx);ids=loanExtendedRelationCandidateIds(receipt,r.eventId)}catch{}
      r.extendedRelationCandidateIds=ids;
    }
    const matches=ids.map(id=>byWalletPosition.get(`${norm(r.wallet)}|${id}`)).filter(Boolean)
      .filter(old=>!r.date||!old.date||new Date(old.date)<=new Date(r.date));
    if(matches.length!==1){
      r.replacesPositionId=null;r.replacesDate=null;
      continue;
    }
    const old=matches[0];
    r.replacesPositionId=Number(old.eventId);r.replacesDate=old.date||null;
    r.link=`Ersetzt Position ${r.replacesPositionId}`;
    old.replacedByPositionId=Number(r.eventId);old.replacedByDate=r.date||null;
  }

  // TLN Gold Extended / Second Chance:
  // Alt→Neu bleibt ausschließlich als historische Beziehung bestehen.
  // Der alte Loan ist verfallen; Zins/Schuld werden NICHT auf den neuen Extended-Loan übertragen.
  // Solange Rückzahlungsbetrag/Zins der neuen Position nicht on-chain belegt sind, bleiben diese Felder leer.
  for(const r of rows){
    if(String(r?.rawType??'').trim()!=='5'&&r?.type!=='TLN Gold Extended')continue;
    r.interest=null;
    r.interestRate=null;
    r.repayment=null;
    r.interestModel='eigener Extended-Zins bei Rückzahlung · on-chain noch nicht aufgelöst';
    r.repaymentSource='TLN Gold Extended · neuer eigenständiger Second-Chance-Loan · Rückzahlungsbetrag und eigener Zins ausschließlich positionsbezogen on-chain ermitteln';
  }
}
function loanOptionCellHtml(r){
  const parts=[`<b>${esc(r.idLabel)}</b>`];
  if(r.replacesPositionId){
    parts.push(`<span class="team-lifecycle-sub">↳ ersetzt #${esc(String(r.replacesPositionId))}</span>`);
    if(r.replacesDate)parts.push(`<span class="team-lifecycle-sub">Loan vom ${loanDate(r.replacesDate)}</span>`);
  }
  if(r.replacedByPositionId){
    parts.push(`<span class="team-lifecycle-sub">↳ ersetzt durch #${esc(String(r.replacedByPositionId))}</span>`);
    if(r.replacedByDate)parts.push(`<span class="team-lifecycle-sub">Extended am ${loanDate(r.replacedByDate)}</span>`);
  }
  return parts.join('');
}

async function loanBuildRow(wallet,burns){
  const hash=String(burns?.[0]?.hash||'').toLowerCase();if(!hash)return null;
  const receipt=await loanReceipt(hash);if(!receipt||receipt.status==='0x0')return null;
  const transfers=await loanDecodeTransfers(receipt);const w=norm(wallet);
  const sum=(arr)=>arr.reduce((n,x)=>n+Number(x.amount||0),0);
  const tlnPlus=sum(transfers.filter(x=>x.from===w&&x.to===LOAN_ZERO&&loanNormSymbol(x.symbol)==='TLN+'))||null;
  const tlnGold=sum(transfers.filter(x=>x.from===w&&x.to===LOAN_ZERO&&loanNormSymbol(x.symbol)==='TLNGOLD'))||null;
  if(!tlnPlus&&!tlnGold)return null;
  const vs=transfers.filter(x=>loanNormSymbol(x.symbol)==='V$');
  const principalCandidates=vs.filter(x=>x.from!==w||x.to===w).map(x=>x.amount).filter(x=>x>0);
  const vusd=principalCandidates.length?Math.max(...principalCandidates):null;
  const explicitInterest=sum(vs.filter(x=>x.from===w&&x.to!==LOAN_ZERO&&x.to!==w))||null;
  const netVusdToWallet=sum(vs.filter(x=>x.to===w&&x.from!==w&&x.from!==LOAN_ZERO))||null;
  const mintedFromZero=vs.filter(x=>x.from===LOAN_ZERO).map(x=>Number(x.amount||0)).filter(x=>x>0);
  const grossMintFromTransfer=mintedFromZero.length?Math.max(...mintedFromZero):null;
  const vows=transfers.filter(x=>loanNormSymbol(x.symbol)==='VOW'&&x.from!==LOAN_ZERO&&x.to!==LOAN_ZERO);
  const walletCollateral=vows.filter(x=>x.from===w).map(x=>x.amount).filter(x=>x>0);
  const inheritedCollateral=(tlnGold&&vows.length)?vows.map(x=>x.amount).filter(x=>x>0):[];
  const collateralVow=walletCollateral.length?Math.max(...walletCollateral):(inheritedCollateral.length?Math.max(...inheritedCollateral):null);
  const ev=loanFindEvent(receipt,wallet);let eventId=null,rawType='–',rawParams='–',rawContract='–',eventAmount18=null; // rawType = unveränderter dritter Data-Wert des Options-Events (Event-Wert 3)
  if(ev){
    if(ev.words[0]>0n&&ev.words[0]<1000000000n)eventId=Number(ev.words[0]);
    const last=ev.words.at(-1);if(last>=0n&&last<=50n)rawType=String(last);
    if(ev.words.length>=2){try{eventAmount18=Number(ethers.formatUnits(ev.words[1],18))}catch{}}
    rawParams=ev.words.map((x,i)=>`w${i+1}=${loanRawWord(x)}`).join(' · ');
    rawContract=`${ev.address} · log ${ev.index}`;
  }
  let date=burns.find(x=>x?.metadata?.blockTimestamp)?.metadata?.blockTimestamp||null;
  if(!date&&receipt.blockNumber){try{const b=await rpc('eth_getBlockByNumber',[receipt.blockNumber,false]);if(b?.timestamp)date=new Date(Number(BigInt(b.timestamp))*1000).toISOString()}catch{}}
  const grossMintVusd=(eventAmount18>0)?eventAmount18:(grossMintFromTransfer||vusd||null);
  const deductedInterest=(grossMintVusd>0&&netVusdToWallet>0&&grossMintVusd>netVusdToWallet&&loanClose(netVusdToWallet,grossMintVusd*.82,.01))
    ?grossMintVusd-netVusdToWallet:null;
  const interest=explicitInterest||deductedInterest||null;
  const type=loanClassify({tlnPlus,tlnGold,vusd:grossMintVusd||vusd,interest,rawType,eventAmount18});
  let interestModel=loanInterestModel({tlnPlus,tlnGold,vusd:grossMintVusd||vusd,interest,rawType,eventAmount18});
  const debt=loanDebtFields({tlnPlus,tlnGold,vusd:grossMintVusd||vusd,interest,rawType,eventAmount18});
  if(String(rawType)==='5'&&deductedInterest!=null){
    interestModel='vom geminteten v$-Betrag abgezogen · 18 % · on-chain aus Brutto-/Netto-v$-Flow bestätigt';
  }
  const collateralSource=walletCollateral.length
    ?'eigene VOW aus Wallet'
    :(['0','1','2','3'].includes(String(rawType))?'aus geminteten v$ gekauft / Swap':'noch zu bestimmen');
  const collateralStatus=walletCollateral.length
    ?'eigene VOW gebunden · Rückgabe bei Repay / Verfall bei Nicht-Rückzahlung noch live zu prüfen'
    :((collateralVow!=null)?'Collateral erkannt · Herkunft/Lifecycle weiter prüfen':'noch zu bestimmen');
  const evidence=vusd?'verified':'likely';
  const idLabel=eventId?`Option #${eventId}`:'Option # noch nicht erkannt';
  return {date,wallet:w,idLabel,eventId,type,tlnPlus,tlnGold,
    vusd:grossMintVusd||vusd,grossMintVusd:grossMintVusd||vusd,netVusdToWallet,
    principal:debt.principal,repayment:debt.repayment,interest:(deductedInterest??debt.interestDue??interest??null),
    interestRate:(debt.interestRate??((grossMintVusd>0&&deductedInterest!=null)?deductedInterest/grossMintVusd*100:null)),
    interestModel,repaymentSource:debt.repaymentSource,collateralVow,collateralSource,collateralStatus,collateralReturnedVow:null,
    status:'Eröffnung on-chain erkannt · Lifecycle wird bei jedem Laden live geprüft',swapDate:null,
    maturityDate:null,repaymentDate:null,
    maturitySource:'offen · Fälligkeit beginnt erst mit v$→VOW-Swap / Marktstart',
    link:'Lifecycle-Verknüpfung noch zu ermitteln',tx:hash,evidence,rawType,rawParams,rawContract,
    extendedRelationCandidateIds:String(rawType)==='5'?loanExtendedRelationCandidateIds(receipt,eventId):[],
    replacesPositionId:null,replacesDate:null,replacedByPositionId:null,replacedByDate:null,
    blockNumber:receipt.blockNumber||null,receiptTo:norm(receipt.to||''),transferCount:transfers.length};
}


const LOAN_TLNGOLD_ADDRESS=Object.keys(LOAN_TOKEN_CANONICAL).find(a=>loanNormSymbol(LOAN_TOKEN_CANONICAL[a]?.symbol)==='TLNGOLD')||'0xaa90a8cdab8b8e902293a2817d1d286f66cbcec5';
const LOAN_TLNPLUS_ADDRESS=Object.keys(LOAN_TOKEN_CANONICAL).find(a=>loanNormSymbol(LOAN_TOKEN_CANONICAL[a]?.symbol)==='TLN+')||'0x29280091fa7f3abe4739ad5f1f7c5287feaf7736';

function loanGoldGlobalSetState(text,kind='muted'){
  const el=document.getElementById('loanGoldGlobalState');if(!el)return;
  el.className=kind==='ok'?'ok':kind==='warn'?'warn':kind==='err'?'err':'muted';
  el.textContent=text;
}

async function loanGoldGlobalBurns(limit=250){
  // Der konfigurierte BSC-RPC lehnt historische eth_getLogs-Abfragen selbst
  // bei sehr kleinen Blockfenstern mit -32005 ab. Deshalb nutzen wir hier
  // alchemy_getAssetTransfers in begrenzten Blockfenstern.
  const latestHex=await rpc('eth_blockNumber',[]);
  const latest=Number(BigInt(latestHex));
  if(!Number.isFinite(latest)||latest<=0)throw new Error('Aktuellen BSC-Block konnte nicht ermittelt werden.');

  const out=[];
  const seen=new Set();
  let toBlock=latest;
  let window=250000;
  let windowsChecked=0;

  while(toBlock>=0 && out.length<limit){
    const fromBlock=Math.max(0,toBlock-window+1);
    let pageKey=null;
    let windowOk=false;
    let windowTransfers=[];

    try{
      do{
        const q={
          fromBlock:'0x'+fromBlock.toString(16),
          toBlock:'0x'+toBlock.toString(16),
          contractAddresses:[LOAN_TLNGOLD_ADDRESS],
          category:['erc20'],
          excludeZeroValue:false,
          withMetadata:true,
          maxCount:'0x3e8',
          order:'desc',
          ...(pageKey?{pageKey}:{})
        };
        const r=await alchemy('alchemy_getAssetTransfers',[q]);
        for(const tr of (r?.transfers||[])){
          if(norm(tr?.to||'')!==LOAN_ZERO)continue;
          const from=norm(tr?.from||'');
          if(!/^0x[0-9a-f]{40}$/.test(from)||from===LOAN_ZERO)continue;
          const hash=String(tr?.hash||'').toLowerCase();
          const key=`${hash}|${String(tr?.uniqueId||tr?.logIndex||'')}`;
          if(seen.has(key))continue;
          seen.add(key);
          windowTransfers.push(tr);
        }
        pageKey=r?.pageKey||null;
        if(windowTransfers.length+out.length>=limit)break;
      }while(pageKey);

      windowOk=true;
    }catch(e){
      // Bei Provider-/Backend-Limits Fenster verkleinern und denselben Bereich erneut versuchen.
      if(window>1000){
        window=Math.max(1000,Math.floor(window/2));
        continue;
      }
      throw new Error(`TLN-GOLD Transfer-Scan fehlgeschlagen bei Block ${fromBlock}–${toBlock}: ${e?.message||e}`);
    }

    if(windowOk){
      windowTransfers.sort((a,b)=>{
        const ad=String(a?.metadata?.blockTimestamp||'');
        const bd=String(b?.metadata?.blockTimestamp||'');
        return bd.localeCompare(ad);
      });
      for(const tr of windowTransfers){
        out.push(tr);
        if(out.length>=limit)break;
      }

      windowsChecked++;
      if(fromBlock===0)break;
      toBlock=fromBlock-1;

      // Nach mehreren erfolgreichen Fenstern vorsichtig wieder größer werden,
      // aber nicht über 250k Blöcke.
      if(windowsChecked%5===0 && window<250000)window=Math.min(250000,window*2);
      if(windowsChecked>5000)throw new Error('TLN-GOLD Transfer-Scan nach 5000 Blockfenstern abgebrochen.');
    }
  }

  out.sort((a,b)=>String(b?.metadata?.blockTimestamp||'').localeCompare(String(a?.metadata?.blockTimestamp||'')));
  return out.slice(0,limit);
}

async function loanGoldAnalyzeBurnTransfer(tr){
  const hash=String(tr?.hash||'').toLowerCase();if(!hash)return null;
  const receipt=await loanReceipt(hash);if(!receipt||receipt.status==='0x0')return null;
  const transfers=await loanDecodeTransfers(receipt);
  const wallet=norm(tr?.from||'');
  if(!/^0x[0-9a-f]{40}$/.test(wallet))return null;

  const sum=arr=>arr.reduce((n,x)=>n+Number(x.amount||0),0);
  const goldBurn=sum(transfers.filter(x=>x.from===wallet&&x.to===LOAN_ZERO&&loanNormSymbol(x.symbol)==='TLNGOLD'))||null;
  if(!(goldBurn>0))return null;

  const vs=transfers.filter(x=>loanNormSymbol(x.symbol)==='V$');
  const mintedCandidates=vs.filter(x=>x.from===LOAN_ZERO||x.to===LOAN_OPTIONS_CONTRACT||x.to===wallet).map(x=>Number(x.amount||0)).filter(x=>x>0);
  const vusd=mintedCandidates.length?Math.max(...mintedCandidates):null;
  const interest=sum(vs.filter(x=>x.from===wallet&&x.to!==wallet&&x.to!==LOAN_ZERO))||null;

  const ev=loanFindEvent(receipt,wallet);
  let optionId=null,eventValue3='–',eventAmount18=null,eventContract='–',raw='–',logIndex=null;
  if(ev){
    if(ev.words?.[0]>0n&&ev.words[0]<1000000000n)optionId=Number(ev.words[0]);
    if(ev.words?.length>=2){try{eventAmount18=Number(ethers.formatUnits(ev.words[1],18))}catch{}}
    const last=ev.words?.at(-1);
    if(last!=null&&last>=0n&&last<=50n)eventValue3=String(last);
    eventContract=ev.address||'–';logIndex=ev.index;
    raw=ev.words.map((x,i)=>`w${i+1}=${x.toString()}`).join(' · ');
  }

  let date=tr?.metadata?.blockTimestamp||null;
  if(!date&&receipt.blockNumber){
    try{const b=await rpc('eth_getBlockByNumber',[receipt.blockNumber,false]);if(b?.timestamp)date=new Date(Number(BigInt(b.timestamp))*1000).toISOString()}catch{}
  }

  const ratioMint=(goldBurn&&vusd)?vusd/goldBurn:null;
  const ratioEvent=(goldBurn&&eventAmount18)?eventAmount18/goldBurn:null;

  let candidate='offen';
  let confidence='offen';

  // ×2 working model: nominal ≈ GOLD*2 and mint ≈ 82% of nominal
  const nominal2=eventAmount18>0?eventAmount18:(goldBurn*2);
  const is2=((eventAmount18>0&&loanClose(eventAmount18,goldBurn*2,.02))||!(eventAmount18>0))
    && vusd>0 && loanClose(vusd,nominal2*.82,.02);
  if(is2){
    candidate='TLN GOLD ×2 · Kandidat';
    confidence=eventAmount18>0?'stark':'mittel';
  }

  // ×4 working model: principal ≈ GOLD*4 and separate 18% interest at opening
  const nominal4=eventAmount18>0?eventAmount18:vusd;
  const is4=(((eventAmount18>0&&loanClose(eventAmount18,goldBurn*4,.02))||loanClose(vusd,goldBurn*4,.02)))
    && interest>0 && loanClose(interest,nominal4*.18,.02);
  if(is4){
    candidate='TLN GOLD ×4 · Kandidat';
    confidence=eventAmount18>0?'stark':'mittel';
  }

  const knownBooster=LOAN_BOOSTER_BY_EVENT_VALUE3[String(eventValue3||'')]||null;

  return {
    date,wallet,hash,optionId,eventValue3,eventAmount18,eventContract,logIndex,raw,
    goldBurn,vusd,interest,ratioMint,ratioEvent,candidate,confidence,knownBooster,
    blockNumber:receipt.blockNumber||null
  };
}

async function loanSearchGoldVariantsGlobal(){
  const btn=document.getElementById('loanGoldGlobalRun');
  const result=document.getElementById('loanGoldGlobalResult');
  const limit=Math.max(10,Math.min(1000,Number(document.getElementById('loanGoldGlobalLimit')?.value||250)));
  const unknownOnly=!!document.getElementById('loanGoldUnknownOnly')?.checked;
  if(btn)btn.disabled=true;
  if(result)result.innerHTML='';
  loanGoldGlobalSetState(`Suche bis zu ${limit} TLN-GOLD-Burns chainweit …`);

  try{
    if(!hasAlchemy())throw new Error('Keine Alchemy Discovery-API für BSC konfiguriert.');
    const burns=await loanGoldGlobalBurns(limit);
    const analyzed=[];
    for(let i=0;i<burns.length;i++){
      if(i===0||i%10===0)loanGoldGlobalSetState(`Analysiere ${i+1}/${burns.length} TLN-GOLD-Burn-Txs …`);
      try{
        const row=await loanGoldAnalyzeBurnTransfer(burns[i]);
        if(row)analyzed.push(row);
      }catch(e){console.warn('[TLN GOLD global candidate]',e)}
    }

    const knownValues=new Set(Object.keys(LOAN_BOOSTER_BY_EVENT_VALUE3));
    let rows=analyzed.slice();
    if(unknownOnly){
      rows=rows.filter(r=>!knownValues.has(String(r.eventValue3)));
    }
    rows.sort((a,b)=>{
      const ac=a.candidate==='offen'?1:0,bc=b.candidate==='offen'?1:0;
      if(ac!==bc)return ac-bc;
      return String(b.date||'').localeCompare(String(a.date||''));
    });

    const unknownCount=rows.filter(r=>!knownValues.has(String(r.eventValue3))).length;
    const x2=rows.filter(r=>r.candidate.includes('×2')).length;
    const x4=rows.filter(r=>r.candidate.includes('×4')).length;

    const trs=rows.map(r=>{
      const ev3=loanDiagEsc(r.eventValue3??'–');
      const booster=r.knownBooster||'–';
      const option=r.optionId?`#${r.optionId}`:'–';
      const ratioMint=r.ratioMint==null?'–':loanNum(r.ratioMint,6);
      const ratioEvent=r.ratioEvent==null?'–':loanNum(r.ratioEvent,6);
      return `<tr>
        <td>${loanDate(r.date)}</td>
        <td><span>${loanDiagEsc(short(r.wallet))}</span></td>
        <td>${option}</td>
        <td><b>${loanDiagEsc(r.candidate)}</b><div class="muted">${loanDiagEsc(r.confidence)}</div></td>
        <td>${loanNum(r.goldBurn,8)}</td>
        <td>${r.vusd==null?'–':loanNum(r.vusd,8)}</td>
        <td>${r.eventAmount18==null?'–':loanNum(r.eventAmount18,8)}</td>
        <td>${r.interest==null?'–':loanNum(r.interest,8)}</td>
        <td>${ratioMint}</td>
        <td>${ratioEvent}</td>
        <td>${ev3}</td>
        <td>${loanDiagEsc(booster)}</td>
        <td><a target="_blank" href="https://bscscan.com/tx/${r.hash}">${short(r.hash)}</a></td>
        <td class="loan-raw">${loanDiagEsc(r.raw)}</td>
      </tr>`;
    }).join('');

    result.innerHTML=`
      <div class="loan-summary">
        <div class="metric"><b>${rows.length}</b><span>analysierte Burns</span></div>
        <div class="metric"><b>${unknownCount}</b><span>unbekannte Event-Werte</span></div>
        <div class="metric"><b>${x2}</b><span>×2-Kandidaten</span></div>
        <div class="metric"><b>${x4}</b><span>×4-Kandidaten</span></div>
      </div>
      <div class="wrap">
        <table class="project-data-table" style="min-width:2200px">
          <thead><tr>
            <th>Datum</th><th>Wallet</th><th>Option #</th><th>Kandidat</th>
            <th>TLN GOLD Burn</th><th>v$ Mint / Flow</th><th>Event-Wert 2</th><th>v$ Zinsflow</th>
            <th>v$/GOLD</th><th>Event2/GOLD</th><th>Event-Wert 3</th><th>bekannter Booster</th><th>Tx</th><th>Rohwerte</th>
          </tr></thead>
          <tbody>${trs||'<tr><td colspan="14">Keine Kandidaten gefunden.</td></tr>'}</tbody>
        </table>
      </div>`;
    loanGoldGlobalSetState(`Fertig: ${analyzed.length} TLN-GOLD-Burn-Txs analysiert · ${rows.length} nach Filter sichtbar · ${x2} ×2-Kandidat(en) · ${x4} ×4-Kandidat(en).`,(rows.length||x2||x4)?'ok':'warn');
  }catch(e){
    console.error('[TLN GOLD global scan]',e);
    loanGoldGlobalSetState(`Fehler: ${e?.message||e}`,'err');
  }finally{
    if(btn)btn.disabled=false;
  }
}


function loanRepayVerifySetState(text,kind='muted'){
  const el=document.getElementById('loanRepayVerifyState');if(!el)return;
  el.className=kind==='ok'?'ok':kind==='warn'?'warn':kind==='err'?'err':'muted';el.textContent=text;
}

async function loanGlobalRepayTransfers(limit=25){
  const latestHex=await rpc('eth_blockNumber',[]);
  const latest=Number(BigInt(latestHex));
  if(!Number.isFinite(latest)||latest<=0)throw new Error('Aktuellen BSC-Block konnte nicht ermittelt werden.');
  const out=[],seen=new Set();
  let toBlock=latest,window=250000,windows=0;
  while(toBlock>=0&&out.length<limit){
    const fromBlock=Math.max(0,toBlock-window+1);
    let pageKey=null,ok=false,tmp=[];
    try{
      do{
        const q={
          fromBlock:'0x'+fromBlock.toString(16),toBlock:'0x'+toBlock.toString(16),
          contractAddresses:[LOAN_VUSD_ADDRESS],category:['erc20'],excludeZeroValue:false,
          withMetadata:true,maxCount:'0x3e8',order:'desc',...(pageKey?{pageKey}:{})
        };
        const r=await alchemy('alchemy_getAssetTransfers',[q]);
        for(const tr of (r?.transfers||[])){
          if(norm(tr?.to||'')!==LOAN_OPTIONS_CONTRACT)continue;
          const h=String(tr?.hash||'').toLowerCase(),key=`${h}|${String(tr?.uniqueId||tr?.logIndex||'')}`;
          if(seen.has(key))continue;seen.add(key);tmp.push(tr);
        }
        pageKey=r?.pageKey||null;
        if(tmp.length+out.length>=limit)break;
      }while(pageKey);
      ok=true;
    }catch(e){
      if(window>1000){window=Math.max(1000,Math.floor(window/2));continue}
      throw e;
    }
    if(ok){
      tmp.sort((a,b)=>String(b?.metadata?.blockTimestamp||'').localeCompare(String(a?.metadata?.blockTimestamp||'')));
      for(const tr of tmp){out.push(tr);if(out.length>=limit)break}
      if(fromBlock===0)break;
      toBlock=fromBlock-1;windows++;
      if(windows%5===0&&window<250000)window=Math.min(250000,window*2);
      if(windows>5000)break;
    }
  }
  return out;
}

async function loanFindOpeningByPosition(wallet,positionRef){
  const burns=await loanBurnCandidatesForWallet(wallet);
  const byHash=new Map();
  for(const tr of burns){const h=String(tr?.hash||'').toLowerCase();if(!h)continue;if(!byHash.has(h))byHash.set(h,[]);byHash.get(h).push(tr)}
  const wt='0x'+norm(wallet).slice(2).padStart(64,'0');
  for(const [hash,items] of byHash){
    const receipt=await loanReceipt(hash);if(!receipt||receipt.status==='0x0')continue;
    for(const [logIndex,l] of (receipt.logs||[]).entries()){
      if(String(l?.topics?.[0]||'').toLowerCase()===LOAN_TRANSFER_TOPIC)continue;
      if(!(l?.topics||[]).some(t=>String(t||'').toLowerCase()===wt))continue;
      const words=loanDataWords(l.data);if(words.length<2)continue;
      if(words[0]!==BigInt(positionRef))continue;
      let eventValue3='–',principal=null;
      const last=words.at(-1);if(last>=0n&&last<=50n)eventValue3=String(last);
      try{principal=Number(ethers.formatUnits(words[1],18))}catch{}
      let date=items.find(x=>x?.metadata?.blockTimestamp)?.metadata?.blockTimestamp||null;
      if(!date&&receipt.blockNumber){try{const b=await rpc('eth_getBlockByNumber',[receipt.blockNumber,false]);if(b?.timestamp)date=new Date(Number(BigInt(b.timestamp))*1000).toISOString()}catch{}}
      return {hash,date,logIndex,eventValue3,principal,eventContract:norm(l.address),raw:words.map(x=>x.toString()).join(' | ')};
    }
  }
  return null;
}

async function loanVerifyRepaymentModels(){
  const btn=document.getElementById('loanRepayVerifyRun'),result=document.getElementById('loanRepayVerifyResult');
  const scanLimit=Math.max(50,Math.min(10000,Number(document.getElementById('loanRepayVerifyLimit')?.value||500)));
  const target=String(document.getElementById('loanRepayVerifyType')?.value||'all');
  if(btn)btn.disabled=true;if(result)result.innerHTML='';
  loanRepayVerifySetState(`Suche bis zu ${scanLimit} globale v$→Loan-Contract Repay-Txs …`);
  try{
    const trs=await loanGlobalRepayTransfers(scanLimit);
    const rows=[];let checked=0;
    const typeStats=new Map(),unknownStats=new Map();
    const KNOWN_REPAY_TYPES=new Set(['0','1','2','3','4','5']);
    const maxRows=(target==='all'||target==='unknown')?100:5;
    for(const tr of trs){
      if(rows.length>=maxRows && target!=='all' && target!=='unknown')break;
      checked++;if(checked===1||checked%25===0)loanRepayVerifySetState(`Prüfe Repay ${checked}/${trs.length} · ${rows.length} Treffer …`);
      const rp=await loanBuildRepayment(norm(tr?.from||''),tr);
      if(!rp)continue;
      loanRepayVerifySetState(`Repay Position ${rp.positionRef}: suche Eröffnung …`);
      let opening=null;
      try{opening=await loanFindOpeningByPosition(rp.wallet,rp.positionRef)}catch(e){console.warn('[Repay opening lookup]',e)}
      const resolvedType=String(opening?.eventValue3??'–');
      typeStats.set(resolvedType,(typeStats.get(resolvedType)||0)+1);
      if(!KNOWN_REPAY_TYPES.has(resolvedType))unknownStats.set(resolvedType,(unknownStats.get(resolvedType)||0)+1);
      if(target==='unknown'){
        if(KNOWN_REPAY_TYPES.has(resolvedType))continue;
      }else if(target!=='all'){
        const allowed=new Set(target.split(',').map(x=>x.trim()).filter(Boolean));
        if(!allowed.has(resolvedType))continue;
      }
      if(rows.length<maxRows)rows.push({rp,opening});
    }

    const html=rows.map(({rp,opening})=>{
      const typ=opening?.eventValue3||'–',booster=LOAN_BOOSTER_BY_EVENT_VALUE3[String(typ)]||'–';
      const paidVsPrincipal=(rp.paid!=null&&rp.principal>0)?rp.paid/rp.principal:null;
      let modelCheck='–';
      if(String(typ)==='0'||String(typ)==='1'){
        if(paidVsPrincipal!=null&&loanClose(paidVsPrincipal,1,.001))modelCheck='100 % Principal · bestätigt';
        else if(paidVsPrincipal!=null)modelCheck=`${loanNum(paidVsPrincipal*100,4)} % des Principal`;
      }else if(String(typ)==='2'||String(typ)==='3'){
        if(paidVsPrincipal!=null&&loanClose(paidVsPrincipal,1.18,.001))modelCheck='118 % Principal · bestätigt';
        else if(paidVsPrincipal!=null)modelCheck=`${loanNum(paidVsPrincipal*100,4)} % des Principal`;
      }else if(String(typ)==='5'){
        // Extended / Second Chance: keine 18-%-Annahme. Nur reale Repay-Daten auswerten.
        if(rp.paid!=null&&rp.principal!=null&&rp.principal>0){
          modelCheck=`Extended on-chain · bezahlt ${loanNum(rp.paid,8)} v$ / Principal ${loanNum(rp.principal,8)} v$ · Differenz ${loanNum(rp.paid-rp.principal,8)} v$ (${loanNum((rp.paid/rp.principal-1)*100,4)} %)`;
        }else modelCheck='Extended · Repay-Daten unvollständig';
      }
      return `<tr>
        <td>${loanDate(rp.date)}</td><td>${loanDiagEsc(short(rp.wallet))}</td><td>${rp.positionRef}</td>
        <td>${loanDiagEsc(typ)}</td><td>${loanDiagEsc(booster)}</td>
        <td style="text-align:right">${rp.principal==null?'–':loanNum(rp.principal,8)+' v$'}</td>
        <td style="text-align:right">${rp.paid==null?'–':loanNum(rp.paid,8)+' v$'}</td>
        <td style="text-align:right">${rp.interest==null?'–':loanNum(rp.interest,8)+' v$'}</td>
        <td style="text-align:right">${rp.interestRate==null?'–':loanNum(rp.interestRate,4)+' %'}</td>
        <td>${loanDiagEsc(modelCheck)}</td>
        <td>${opening?loanDate(opening.date):'–'}</td>
        <td><a target="_blank" href="https://bscscan.com/tx/${rp.tx}">Repay</a>${opening?` · <a target="_blank" href="https://bscscan.com/tx/${opening.hash}">Eröffnung</a>`:''}</td>
      </tr>`;
    }).join('');

    const statRows=[...typeStats.entries()].sort((a,b)=>b[1]-a[1]).map(([typ,n])=>{
      const known=KNOWN_REPAY_TYPES.has(String(typ));
      return `<tr><td>${loanDiagEsc(typ)}</td><td style="text-align:right">${n}</td><td>${known?'bekannt':'UNBEKANNT · prüfen'}</td><td>${loanDiagEsc(LOAN_BOOSTER_BY_EVENT_VALUE3[String(typ)]||'–')}</td></tr>`;
    }).join('');
    const unknownTotal=[...unknownStats.values()].reduce((a,b)=>a+b,0);
    result.innerHTML=`
      <div class="loan-summary">
        <div class="metric"><b>${checked}</b><span>Repay-Txs geprüft</span></div>
        <div class="metric"><b>${typeStats.size}</b><span>Event-Werte gefunden</span></div>
        <div class="metric"><b>${unknownTotal}</b><span>unbekannte Typ-Fälle</span></div>
        <div class="metric"><b>${rows.length}</b><span>angezeigte Treffer</span></div>
      </div>
      <div class="wrap"><table class="project-data-table" style="min-width:720px"><thead><tr>
        <th>Event-Wert 3</th><th>Anzahl</th><th>Status</th><th>bekannter Booster</th>
      </tr></thead><tbody>${statRows||'<tr><td colspan="4">Keine Eröffnungs-Typen aufgelöst.</td></tr>'}</tbody></table></div>
      <div class="wrap" style="margin-top:10px"><table class="project-data-table" style="min-width:1500px"><thead><tr>
        <th>Repay-Datum</th><th>Wallet</th><th>Position</th><th>Event-Wert 3</th><th>Booster</th>
        <th>Principal</th><th>bezahlt</th><th>Zins</th><th>Zinssatz</th><th>Modell-Check</th><th>Eröffnung</th><th>Tx</th>
      </tr></thead><tbody>${html||'<tr><td colspan="12">Keine passenden Repay-Fälle gefunden.</td></tr>'}</tbody></table></div>`;
    loanRepayVerifySetState(`Fertig: ${checked} Repay-Txs geprüft · ${typeStats.size} Event-Wert(e) · ${unknownTotal} unbekannte Typ-Fälle · ${rows.length} Treffer angezeigt.`,(rows.length||typeStats.size)?'ok':'warn');
  }catch(e){
    console.error('[Loan repay model verify]',e);loanRepayVerifySetState(`Fehler: ${e?.message||e}`,'err');
  }finally{if(btn)btn.disabled=false}
}

function loanDiagSetState(text,kind='muted'){
  const el=document.getElementById('loanDiagState');if(!el)return;
  el.className=kind==='ok'?'ok':kind==='warn'?'warn':kind==='err'?'err':'muted';el.textContent=text;
}
function loanDiagEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function loanDiagTxDate(receipt,transfer){
  let d=transfer?.metadata?.blockTimestamp||null;
  if(!d&&receipt?.blockNumber){
    try{const b=await rpc('eth_getBlockByNumber',[receipt.blockNumber,false]);if(b?.timestamp)d=new Date(Number(BigInt(b.timestamp))*1000).toISOString()}catch{}
  }
  return d;
}
async function loanDiagTransaction(hash){
  const h=String(hash||'').toLowerCase();if(!h)return null;if(LOAN_TX_CACHE.has(h))return LOAN_TX_CACHE.get(h);
  const tx=await rpc('eth_getTransactionByHash',[h]);LOAN_TX_CACHE.set(h,tx||null);return tx||null;
}
function loanDiagInputWords(input){
  const h=String(input||'').replace(/^0x/,'');if(h.length<=8)return [];
  const payload=h.slice(8),out=[];for(let i=0;i+64<=payload.length;i+=64){try{out.push(BigInt('0x'+payload.slice(i,i+64)))}catch{}}return out;
}
function loanDiagSmallPositionCandidates(tx,receipt,currentPosition){
  const cur=BigInt(currentPosition);const hits=[];
  const add=(value,source)=>{try{const n=BigInt(value);if(n===cur||n<=50n||n>=1000000000n)return;hits.push({n,source})}catch{}};
  loanDiagInputWords(tx?.input).forEach((n,i)=>add(n,`Tx-Input Wort ${i+1}`));
  for(const [logIndex,l] of (receipt?.logs||[]).entries()){
    if(String(l?.topics?.[0]||'').toLowerCase()===LOAN_TRANSFER_TOPIC)continue;
    loanDataWords(l?.data).forEach((n,i)=>add(n,`Log ${logIndex} Data-Wort ${i+1}`));
    (l?.topics||[]).slice(1).forEach((t,i)=>{try{add(BigInt(t),`Log ${logIndex} Topic ${i+1}`)}catch{}});
  }
  const seen=new Set();return hits.filter(x=>{const k=x.n.toString();if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>Number(a.n-b.n));
}
function loanDiagTxDetailsHtml(tx,receipt,currentPosition){
  if(!tx&&!receipt)return '<div class="warn">Transaktionsdetails nicht verfügbar.</div>';
  const input=String(tx?.input||'0x'),selector=input.length>=10?input.slice(0,10):'–',inputWords=loanDiagInputWords(input);
  const candidateRows=loanDiagSmallPositionCandidates(tx,receipt,currentPosition).map(x=>`<tr><td><b>${loanDiagEsc(x.n.toString())}</b></td><td>${loanDiagEsc(x.source)}</td></tr>`).join('');
  const logRows=(receipt?.logs||[]).map((l,logIndex)=>{
    if(String(l?.topics?.[0]||'').toLowerCase()===LOAN_TRANSFER_TOPIC)return '';
    const words=loanDataWords(l?.data),topics=(l?.topics||[]).map((t,i)=>`t${i}=${t}`).join(' | ');
    return `<tr><td>${logIndex}</td><td class="loan-link">${loanDiagEsc(norm(l?.address||''))}</td><td class="loan-raw">${loanDiagEsc(topics||'–')}</td><td class="loan-raw">${loanDiagEsc(words.length?words.map((w,i)=>`w${i+1}=${w.toString()}`).join(' | '):String(l?.data||'–'))}</td></tr>`;
  }).filter(Boolean).join('');
  return `<details open style="margin-top:10px"><summary><b>Typ-5-Diagnose · Tx-Input + Non-Transfer-Events</b></summary>
    <div class="muted" style="margin:8px 0">Gesucht wird insbesondere eine zweite kleine Positionsnummer neben der neuen Position ${loanDiagEsc(currentPosition.toString())}. Keine automatische Alt→Neu-Zuordnung ohne eindeutigen Beleg.</div>
    <div class="wrap"><table class="project-data-table" style="min-width:900px"><tbody>
      <tr><th>Tx von</th><td class="loan-link">${loanDiagEsc(norm(tx?.from||''))}</td></tr><tr><th>Tx an</th><td class="loan-link">${loanDiagEsc(norm(tx?.to||''))}</td></tr>
      <tr><th>Function Selector</th><td class="loan-raw">${loanDiagEsc(selector)}</td></tr><tr><th>Input-Wörter dezimal</th><td class="loan-raw">${loanDiagEsc(inputWords.length?inputWords.map((w,i)=>`w${i+1}=${w.toString()}`).join(' | '):'–')}</td></tr>
      <tr><th>Tx-Input roh</th><td class="loan-raw">${loanDiagEsc(input)}</td></tr>
    </tbody></table></div>
    <div style="margin-top:10px"><b>Mögliche weitere Positionsnummern</b></div><div class="wrap"><table class="project-data-table" style="min-width:520px"><thead><tr><th>Wert</th><th>Fundstelle</th></tr></thead><tbody>${candidateRows||'<tr><td colspan="2">Keine weitere kleine Ganzzahl &gt; 50 und &lt; 1 Mrd. gefunden.</td></tr>'}</tbody></table></div>
    <div style="margin-top:10px"><b>Alle Non-Transfer-Events der Transaktion</b></div><div class="wrap"><table class="project-data-table" style="min-width:1250px"><thead><tr><th>Log</th><th>Contract</th><th>Topics</th><th>Data / Wörter dezimal</th></tr></thead><tbody>${logRows||'<tr><td colspan="4">Keine Non-Transfer-Events gefunden.</td></tr>'}</tbody></table></div>
  </details>`;
}
async function loanSearchPositionBackwards(){
  const wallet=norm(document.getElementById('loanDiagWallet')?.value||'');
  let position;
  try{position=BigInt(String(document.getElementById('loanDiagPosition')?.value||'').trim())}catch{loanDiagSetState('Ungültige Position / Referenz.','err');return}
  if(!/^0x[0-9a-f]{40}$/.test(wallet)){loanDiagSetState('Ungültige EVM-Wallet-Adresse.','err');return}
  const out=document.getElementById('loanDiagResult');if(out)out.innerHTML='';
  loanDiagSetState(`Suche ${short(wallet)} · Referenz ${position.toString()} …`);
  try{
    const trs=await loanBurnCandidatesForWallet(wallet);
    const byHash=new Map();
    for(const tr of trs){const h=String(tr?.hash||'').toLowerCase();if(!h)continue;if(!byHash.has(h))byHash.set(h,[]);byHash.get(h).push(tr)}
    const direct=[],candidates=[];let done=0;
    for(const [hash,items] of byHash){
      done++;if(done===1||done%10===0)loanDiagSetState(`Prüfe ${done}/${byHash.size} mögliche Eröffnungs-Txs …`);
      const receipt=await loanReceipt(hash);if(!receipt||receipt.status==='0x0')continue;
      const wt='0x'+wallet.slice(2).padStart(64,'0');
      for(const [logIndex,l] of (receipt.logs||[]).entries()){
        if(String(l?.topics?.[0]||'').toLowerCase()===LOAN_TRANSFER_TOPIC)continue;
        if(!(l?.topics||[]).some(t=>String(t||'').toLowerCase()===wt))continue;
        const words=loanDataWords(l.data);if(!words.length)continue;
        if(words.some(w=>w===position))direct.push({hash,items,receipt,event:{logIndex,address:norm(l.address),words}});
      }
      const best=loanFindEvent(receipt,wallet);
      if(best)candidates.push({hash,date:await loanDiagTxDate(receipt,items[0]),event:best});
    }
    candidates.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    if(direct.length){
      const rows=[];
      for(const hit of direct){
        const date=await loanDiagTxDate(hit.receipt,hit.items[0]),ev=hit.event;
        const ev3=ev.words.length>=3?ev.words[2].toString():'';
        const booster=LOAN_BOOSTER_BY_EVENT_VALUE3[ev3]||'–';
        rows.push(`<tr><td>${loanDate(date)}</td><td><a target="_blank" href="https://bscscan.com/tx/${hit.hash}">${short(hit.hash)}</a></td><td>${ev.logIndex}</td><td class="loan-link">${loanDiagEsc(ev.address)}</td><td class="loan-raw">${loanDiagEsc(ev.words.map(x=>x.toString()).join(' | '))}</td><td>${loanDiagEsc(ev3||'–')}</td><td>${loanDiagEsc(booster)}</td></tr>`);
      }
      const detailHtml=[];
      for(const hit of direct){
        const tx=await loanDiagTransaction(hit.hash).catch(()=>null);
        detailHtml.push(loanDiagTxDetailsHtml(tx,hit.receipt,position));
      }
      out.innerHTML=`<div class="ok"><b>${direct.length} direkter Treffer</b> für Referenz ${position.toString()}.</div><div class="wrap" style="margin-top:8px"><table class="project-data-table"><thead><tr><th>Datum</th><th>Tx</th><th>Log</th><th>Event-Contract</th><th>Data-Werte dezimal</th><th>Event-Wert 3</th><th>Booster</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>${detailHtml.join('')}`;
      loanDiagSetState(`Fertig: ${direct.length} direkter Treffer · Tx-Input und Non-Transfer-Events eingeblendet.`, 'ok');
    }else{
      const rows=candidates.slice(0,40).map(c=>{
        const ev=c.event,ev3=ev.words.length>=3?ev.words[2].toString():'',booster=LOAN_BOOSTER_BY_EVENT_VALUE3[ev3]||'–';
        return `<tr><td>${loanDate(c.date)}</td><td><a target="_blank" href="https://bscscan.com/tx/${c.hash}">${short(c.hash)}</a></td><td>${ev.index}</td><td>${ev.words.length?loanDiagEsc(ev.words[0].toString()):'–'}</td><td>${loanDiagEsc(ev3||'–')}</td><td>${loanDiagEsc(booster)}</td><td class="loan-raw">${loanDiagEsc(ev.words.map(x=>x.toString()).join(' | '))}</td></tr>`;
      }).join('');
      out.innerHTML=`<div class="warn"><b>Kein direkter Datenwert ${position.toString()} gefunden.</b> Unten stehen die bis zu 40 jüngsten erkannten Options-/Loan-Events dieses Wallets zum Abgleich.</div><div class="wrap" style="margin-top:8px"><table class="project-data-table"><thead><tr><th>Datum</th><th>Tx</th><th>Log</th><th>Event-Wert 1 / Option-Kandidat</th><th>Event-Wert 3</th><th>Booster</th><th>Rohwerte</th></tr></thead><tbody>${rows||'<tr><td colspan="7">Keine Kandidaten gefunden.</td></tr>'}</tbody></table></div>`;
      loanDiagSetState(`Fertig: kein direkter Treffer; ${byHash.size} mögliche Eröffnungs-Txs geprüft.`, 'warn');
    }
  }catch(e){console.error('[Loans position diagnostic]',e);loanDiagSetState(`Fehler: ${e?.message||e}`,'err')}
}


const LOAN_EIP1967_IMPLEMENTATION_SLOT='0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

function loanStateSetState(text,kind='muted'){
  const el=document.getElementById('loanStateState');if(!el)return;
  el.className=kind==='ok'?'ok':kind==='warn'?'warn':kind==='err'?'err':'muted';el.textContent=text;
}
function loanStateHexWord(v){
  try{return BigInt(v).toString(16).padStart(64,'0')}catch{return ''}
}
function loanStateDecodeAddressWord(wordHex){
  const h=String(wordHex||'').replace(/^0x/,'').padStart(64,'0');
  const lead=h.slice(0,24);
  if(!/^0+$/.test(lead))return null;
  const addr='0x'+h.slice(-40);
  return /^0x0{40}$/i.test(addr)?null:norm(addr);
}
function loanStateReturnWords(data){
  const h=String(data||'').replace(/^0x/,'');
  if(!h||h.length%64!==0)return [];
  const out=[];
  for(let i=0;i<h.length;i+=64){
    const raw=h.slice(i,i+64);
    try{
      const n=BigInt('0x'+raw);
      const addr=loanStateDecodeAddressWord(raw);
      let as18='–';
      if(n>0n){
        const whole=n/1000000000000000000n, frac=n%1000000000000000000n;
        if(whole<1000000000000n){
          const fs=frac.toString().padStart(18,'0').replace(/0+$/,'').slice(0,8);
          as18=whole.toString()+(fs?'.'+fs:'');
        }
      }
      let time='–';
      if(n>=946684800n&&n<=4102444800n){
        try{time=new Date(Number(n)*1000).toISOString()}catch{}
      }
      out.push({index:out.length+1,raw:'0x'+raw,uint:n.toString(),as18,address:addr||'–',timestamp:time});
    }catch{}
  }
  return out;
}
function loanStateExtractSelectors(bytecode){
  const h=String(bytecode||'').replace(/^0x/,'').toLowerCase(),set=new Set();
  // PUSH4 <selector>. Solidity/Vyper dispatcher selectors appear this way in runtime bytecode.
  for(const m of h.matchAll(/63([0-9a-f]{8})/g))set.add('0x'+m[1]);
  return [...set];
}
function loanStateCallData(selector,types,values){
  const enc=types.length?ethers.AbiCoder.defaultAbiCoder().encode(types,values).slice(2):'';
  return selector+enc;
}
async function loanStateEthCall(to,data){
  try{
    const r=await rpc('eth_call',[{to,data},'latest']);
    if(!r||r==='0x'||/^0x0*$/.test(r))return null;
    return r;
  }catch{return null}
}
async function loanReadPositionState(){
  const wallet=norm(document.getElementById('loanStateWallet')?.value||'');
  let position;
  try{position=BigInt(String(document.getElementById('loanStatePosition')?.value||'').trim())}catch{loanStateSetState('Ungültige Position.','err');return}
  if(!/^0x[0-9a-f]{40}$/.test(wallet)){loanStateSetState('Ungültige EVM-Wallet-Adresse.','err');return}
  const btn=document.getElementById('loanStateRun'),out=document.getElementById('loanStateResult');
  if(btn)btn.disabled=true;if(out)out.innerHTML='';
  loanStateSetState(`Lese Proxy/Implementation und prüfe Position ${position.toString()} …`);
  try{
    const storage=await rpc('eth_getStorageAt',[LOAN_OPTIONS_CONTRACT,LOAN_EIP1967_IMPLEMENTATION_SLOT,'latest']);
    const impl=storage&&storage!=='0x'?norm('0x'+String(storage).replace(/^0x/,'').slice(-40)):null;
    if(!impl||!/^0x[0-9a-f]{40}$/.test(impl))throw new Error('Implementation-Adresse aus EIP-1967-Slot nicht lesbar.');
    const bytecode=await rpc('eth_getCode',[impl,'latest']);
    const extracted=loanStateExtractSelectors(bytecode);
    const namedSignatures=[
      'loan(uint256)','loans(uint256)','getLoan(uint256)','position(uint256)','positions(uint256)','getPosition(uint256)',
      'option(uint256)','options(uint256)','getOption(uint256)','debt(uint256)','debts(uint256)',
      'loan(address,uint256)','loans(address,uint256)','position(address,uint256)','positions(address,uint256)',
      'getLoan(address,uint256)','getPosition(address,uint256)'
    ];
    const named=new Map(namedSignatures.map(sig=>['0x'+ethers.id(sig).slice(2,10),sig]));
    const selectors=[...new Set([...extracted,...named.keys()])];
    const positionHex=loanStateHexWord(position);
    const walletHex=wallet.slice(2).padStart(64,'0');
    const probes=[];
    for(const selector of selectors){
      const known=named.get(selector)||'';
      probes.push({selector,signature:known,form:'(uint256 position)',data:selector+positionHex});
      probes.push({selector,signature:known,form:'(address wallet, uint256 position)',data:selector+walletHex+positionHex});
      probes.push({selector,signature:known,form:'(uint256 position, address wallet)',data:selector+positionHex+walletHex});
      // no-arg is useful for selectors that reveal global config/rate/status constants.
      probes.push({selector,signature:known,form:'()',data:selector});
    }
    const successes=[];
    const concurrency=8;
    let cursor=0,done=0;
    const worker=async()=>{
      while(cursor<probes.length){
        const idx=cursor++,p=probes[idx];
        const ret=await loanStateEthCall(LOAN_OPTIONS_CONTRACT,p.data);
        done++;
        if(done===1||done%40===0)loanStateSetState(`State-Probe ${done}/${probes.length} · ${successes.length} nichtleere Treffer …`);
        if(ret){
          const words=loanStateReturnWords(ret);
          successes.push({...p,ret,words});
        }
      }
    };
    await Promise.all(Array.from({length:Math.min(concurrency,probes.length)},worker));

    // Deduplicate identical selector/form/results and prioritize results that contain position-like / v$-like values.
    const seen=new Set(),rows=[];
    for(const hit of successes){
      const k=hit.selector+'|'+hit.form+'|'+hit.ret;if(seen.has(k))continue;seen.add(k);
      let score=0;
      for(const w of hit.words){
        try{
          const n=BigInt(w.uint);
          if(n===position)score+=8;
          if(n>=1000000000000000000n&&n<=1000000000000000000000000n)score+=3;
          if(n===820000000000000000000n||n===967600000000000000000n)score+=20;
          if(n>=946684800n&&n<=4102444800n)score+=2;
        }catch{}
      }
      rows.push({...hit,score});
    }
    rows.sort((a,b)=>b.score-a.score||a.selector.localeCompare(b.selector));

    const resultRows=rows.map(hit=>{
      const wordHtml=hit.words.length?hit.words.map(w=>`<div style="margin:2px 0"><b>w${w.index}</b> · uint ${loanDiagEsc(w.uint)} · /1e18 ${loanDiagEsc(w.as18)} · addr ${loanDiagEsc(w.address)} · time ${loanDiagEsc(w.timestamp)}</div>`).join(''):`<span class="loan-raw">${loanDiagEsc(hit.ret)}</span>`;
      return `<tr><td class="loan-raw">${loanDiagEsc(hit.selector)}</td><td>${loanDiagEsc(hit.signature||'unbekannter Selector')}</td><td>${loanDiagEsc(hit.form)}</td><td style="text-align:right">${hit.score}</td><td class="loan-raw">${wordHtml}<details><summary>Rohantwort</summary>${loanDiagEsc(hit.ret)}</details></td></tr>`;
    }).join('');

    const extractedNamed=extracted.map(s=>`${s}${named.has(s)?` = ${named.get(s)}`:''}`).join(' · ');
    out.innerHTML=`
      <div class="wrap"><table class="project-data-table" style="min-width:900px"><tbody>
        <tr><th>Options-Proxy</th><td class="loan-link">${loanDiagEsc(LOAN_OPTIONS_CONTRACT)}</td></tr>
        <tr><th>EIP-1967 Implementation</th><td class="loan-link">${loanDiagEsc(impl)}</td></tr>
        <tr><th>Runtime-Bytecode</th><td>${String(bytecode||'0x').length>2?Math.floor((String(bytecode).length-2)/2).toLocaleString('de-CH')+' Bytes':'–'}</td></tr>
        <tr><th>PUSH4-Selectoren</th><td>${extracted.length}</td></tr>
        <tr><th>Position</th><td>${loanDiagEsc(position.toString())}</td></tr>
        <tr><th>Wallet</th><td class="loan-link">${loanDiagEsc(wallet)}</td></tr>
      </tbody></table></div>
      <details style="margin-top:8px"><summary><b>Gefundene Runtime-Selectoren (${extracted.length})</b></summary><div class="loan-raw" style="word-break:break-all">${loanDiagEsc(extractedNamed||'keine')}</div></details>
      <div class="muted" style="margin:10px 0">
        Treffer werden nur als Roh-State angezeigt. „/1e18“ ist lediglich eine technische Dezimalansicht für mögliche 18-Decimal-Werte, keine fachliche Interpretation.
        Score dient nur zum Sortieren auffälliger Antworten; er ist kein Beweis.
      </div>
      <div class="wrap"><table class="project-data-table" style="min-width:1450px"><thead><tr>
        <th>Selector</th><th>bekannte Signatur</th><th>Probeform</th><th style="text-align:right">Score</th><th>Return-Wörter</th>
      </tr></thead><tbody>${resultRows||'<tr><td colspan="5">Keine nichtleeren eth_call-Antworten gefunden.</td></tr>'}</tbody></table></div>`;
    loanStateSetState(`Fertig: ${selectors.length} Selectoren · ${probes.length} eth_call-Proben · ${rows.length} nichtleere Treffer.`,rows.length?'ok':'warn');
  }catch(e){
    console.error('[Loan contract state diagnostic]',e);
    loanStateSetState(`Fehler: ${e?.message||e}`,'err');
  }finally{if(btn)btn.disabled=false}
}


const LOAN_POSITION_STRUCT_SELECTOR='0xe4ba13c7';

function loanStatusCompareSetState(text,kind='muted'){
  const el=document.getElementById('loanStatusCompareState');if(!el)return;
  el.className=kind==='ok'?'ok':kind==='warn'?'warn':kind==='err'?'err':'muted';el.textContent=text;
}
function loanStatusKnownLifecycleLabel(r){
  if(r?.repaymentDate)return 'zurückbezahlt';
  if(r?.swapDate)return 'Swap erkannt';
  if(String(r?.rawType??'').trim()==='5'||r?.type==='TLN Gold Extended')return 'Extended · Wait to Swap (fachlich bekannt)';
  if(/Rebound/i.test(String(r?.type||'')))return 'Rebound · Wait to Swap (fachlich bekannt)';
  return 'älterer Kontrollfall / Lifecycle prüfen';
}
async function loanReadPositionStructRaw(position,wallet){
  const posHex=loanStateHexWord(BigInt(position));
  const walletHex=String(wallet||'').replace(/^0x/,'').toLowerCase().padStart(64,'0');
  const forms=[
    {form:'(uint256 position)',data:LOAN_POSITION_STRUCT_SELECTOR+posHex},
    {form:'(uint256 position, address wallet)',data:LOAN_POSITION_STRUCT_SELECTOR+posHex+walletHex},
    {form:'(address wallet, uint256 position)',data:LOAN_POSITION_STRUCT_SELECTOR+walletHex+posHex}
  ];
  for(const f of forms){
    const ret=await loanStateEthCall(LOAN_OPTIONS_CONTRACT,f.data);
    if(ret){
      const words=loanStateReturnWords(ret);
      if(words.length>=2)return {form:f.form,ret,words};
    }
  }
  return null;
}
async function loanComparePositionStatusFields(){
  const out=document.getElementById('loanStatusCompareResult');
  const btn=document.getElementById('loanStatusCompareRun');
  const limit=Math.max(5,Math.min(200,Number(document.getElementById('loanStatusCompareLimit')?.value||40)));
  if(btn)btn.disabled=true;if(out)out.innerHTML='';
  try{
    const mode=document.getElementById('loanStatusCompareMode')?.value||'mixed';
    const allRows=(LOAN_DISCOVERY_ROWS||[]).filter(r=>r?.eventId&&r?.wallet);
    const isWaitType=r=>{
      const raw=String(r?.rawType??'').trim(),typ=String(r?.type||'');
      return raw==='5'||typ==='TLN Gold Extended'||/Rebound/i.test(typ);
    };
    const newest=(arr,n)=>[...arr].sort((a,b)=>Number(b?.eventId||0)-Number(a?.eventId||0)).slice(0,n);
    const oldest=(arr,n)=>[...arr].sort((a,b)=>Number(a?.eventId||0)-Number(b?.eventId||0)).slice(0,n);
    let rows;
    if(mode==='old'){
      rows=oldest(allRows.filter(r=>!isWaitType(r)),limit);
    }else if(mode==='all'){
      rows=newest(allRows,limit);
    }else if(mode==='collateral'){
      const waitRows=newest(allRows.filter(isWaitType),Math.max(5,Math.floor(limit/3)));
      const controlPool=oldest(allRows.filter(r=>!isWaitType(r)),Math.max(limit*3,80));
      rows=[...waitRows,...controlPool];
    }else{
      const waitCount=Math.max(3,Math.floor(limit/3));
      const controlCount=Math.max(3,limit-waitCount);
      rows=[...newest(allRows.filter(isWaitType),waitCount),...oldest(allRows.filter(r=>!isWaitType(r)),controlCount)];
    }

    if(!rows.length){
      loanStatusCompareSetState('Keine geladenen Loan-Positionen vorhanden. Zuerst Loans on-chain neu laden.','warn');
      return;
    }

    const result=[];
    for(let i=0;i<rows.length;i++){
      const r=rows[i];
      if(i===0||i%5===0)loanStatusCompareSetState(`Lese Struct ${i+1}/${rows.length} …`);
      const state=await loanReadPositionStructRaw(r.eventId,r.wallet);
      if(!state)continue;
      const words=state.words;
      const last=words.at(-1)?.uint??'–';
      const w5=BigInt(words[4]?.uint||0),w6=BigInt(words[5]?.uint||0);
      const collateralCandidate=(w5>0n||w6>0n);
      result.push({r,state,last,collateralCandidate});
    }

    let shown=result;
    if(mode==='collateral'){
      const waits=result.filter(v=>isWaitType(v.r)).slice(0,Math.max(5,Math.floor(limit/3)));
      const controls=result.filter(v=>!isWaitType(v.r)&&v.collateralCandidate).slice(0,Math.max(5,limit-waits.length));
      shown=[...waits,...controls];
    }
    const counts=new Map();
    for(const x of shown)counts.set(x.last,(counts.get(x.last)||0)+1);

    const summary=[...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([v,n])=>
      `<tr><td>${loanDiagEsc(v)}</td><td style="text-align:right">${n}</td></tr>`).join('');

    const html=shown.map(({r,state,last,collateralCandidate})=>{
      const words=state.words;
      const wordText=words.map(w=>`w${w.index}=${w.uint}${w.as18!=='–'?` (/1e18 ${w.as18})`:''}${w.timestamp!=='–'?` (${w.timestamp})`:''}`).join(' · ');
      return `<tr>
        <td>${loanDate(r.date)}</td>
        <td>${loanDiagEsc(r.idLabel||('#'+r.eventId))}</td>
        <td>${loanDiagEsc(r.type||'–')}</td>
        <td>${loanDiagEsc(loanStatusKnownLifecycleLabel(r))}</td>
        <td>${r.repaymentDate?loanDate(r.repaymentDate):'–'}</td>
        <td>${collateralCandidate?'<b>positiver w5/w6-Kandidat</b>':'–'}</td>
        <td style="text-align:right"><b>${loanDiagEsc(last)}</b></td>
        <td>${loanDiagEsc(state.form)}</td>
        <td class="loan-raw">${loanDiagEsc(wordText)}</td>
      </tr>`;
    }).join('');

    out.innerHTML=`
      <div class="muted" style="margin-bottom:8px">
        Wichtig: Das letzte Feld wird nur als Rohwert verglichen. Erst wenn derselbe Wert konsistent mit einem bekannten Lifecycle-Zustand korreliert, darf eine fachliche Bezeichnung vergeben werden.
      </div>
      <div style="margin-bottom:10px"><b>Verteilung letztes Struct-Feld</b></div>
      <div class="wrap"><table class="project-data-table" style="min-width:420px"><thead><tr><th>Rohwert</th><th style="text-align:right">Anzahl</th></tr></thead><tbody>${summary||'<tr><td colspan="2">Keine Werte.</td></tr>'}</tbody></table></div>
      <div class="wrap" style="margin-top:10px"><table class="project-data-table" style="min-width:1500px"><thead><tr>
        <th>Eröffnung</th><th>Position</th><th>Typ</th><th>bekannter Lifecycle</th><th>Repay</th><th>VOW-Collateral-Indiz</th><th style="text-align:right">letztes Feld</th><th>Getter-Form</th><th>Struct-Rohwerte</th>
      </tr></thead><tbody>${html||'<tr><td colspan="9">Keine Structs lesbar.</td></tr>'}</tbody></table></div>`;

    loanStatusCompareSetState(`Fertig: ${rows.length} Positionen geprüft · ${result.length} Structs lesbar · ${counts.size} verschiedene letzte Rohwerte · Vergleichsgruppe ${mode}.`,result.length?'ok':'warn');
  }catch(e){
    console.error('[Loan status compare]',e);
    loanStatusCompareSetState(`Fehler: ${e?.message||e}`,'err');
  }finally{if(btn)btn.disabled=false}
}


function loanLifecycleSetState(text,kind='muted'){
  const el=document.getElementById('loanLifecycleState');if(!el)return;
  el.className=kind==='ok'?'ok':kind==='warn'?'warn':kind==='err'?'err':'muted';
  el.textContent=text;
}
function loanLifecycleFindRowByPosition(position){
  const id=Number(position);
  const matches=(LOAN_DISCOVERY_ROWS||[]).filter(r=>Number(r?.eventId)===id&&r?.wallet);
  if(matches.length===1)return matches[0];
  if(matches.length>1){
    // Prefer exact option row with known type/date; position ids should be unique per current universe.
    return matches.sort((a,b)=>String(b?.date||'').localeCompare(String(a?.date||'')))[0];
  }
  return null;
}
async function loanLifecycleRelevantTransfers(receipt,wallet){
  const transfers=await loanDecodeTransfers(receipt).catch(()=>[]);
  const w=norm(wallet);
  return transfers.filter(t=>{
    const sym=loanNormSymbol(t?.symbol);
    return ['VOW','V$','VUSD','TLN+','TLNGOLD'].includes(sym)||t.from===w||t.to===w||t.to===LOAN_OPTIONS_CONTRACT||t.from===LOAN_OPTIONS_CONTRACT;
  });
}
async function loanInspectPositionLifecycle(){
  const out=document.getElementById('loanLifecycleResult');
  const btn=document.getElementById('loanLifecycleRun');
  let position;
  try{position=BigInt(String(document.getElementById('loanLifecyclePosition')?.value||'').trim())}
  catch{loanLifecycleSetState('Ungültige Positionsnummer.','err');return}
  const row=loanLifecycleFindRowByPosition(position);
  if(!row){
    loanLifecycleSetState(`Position #${position.toString()} nicht in den geladenen Loan-Daten gefunden. Zuerst „Loans on-chain neu laden“.`, 'warn');
    if(out)out.innerHTML='';
    return;
  }
  const wallet=norm(row.wallet);
  if(btn)btn.disabled=true;if(out)out.innerHTML='';
  loanLifecycleSetState(`Position #${position.toString()} · Wallet automatisch erkannt: ${short(wallet)} · prüfe Lifecycle …`);
  try{
    const state=await loanReadPositionStructRaw(position,wallet);
    const receipt=row.tx?await loanReceipt(row.tx):null;
    const tx=row.tx?await loanDiagTransaction(row.tx):null;
    const transfers=receipt?await loanLifecycleRelevantTransfers(receipt,wallet):[];
    const structWords=state?.words||[];

    const transferRows=transfers.map(t=>`<tr>
      <td>${loanDiagEsc(t.symbol||'–')}</td>
      <td>${loanDiagEsc(t.from||'–')}</td>
      <td>${loanDiagEsc(t.to||'–')}</td>
      <td style="text-align:right">${loanDiagEsc(loanNum(t.amount,8))}</td>
    </tr>`).join('');

    const structRows=structWords.map(w=>`<tr>
      <td>w${w.index}</td>
      <td class="loan-raw">${loanDiagEsc(w.uint)}</td>
      <td style="text-align:right">${loanDiagEsc(w.as18)}</td>
      <td>${loanDiagEsc(w.timestamp)}</td>
      <td class="loan-link">${loanDiagEsc(w.address)}</td>
    </tr>`).join('');

    const knownLifecycle=loanStatusKnownLifecycleLabel(row);
    const relation=row.replacesPositionId?`ersetzt #${row.replacesPositionId}`:(row.replacedByPositionId?`ersetzt durch #${row.replacedByPositionId}`:'–');

    out.innerHTML=`
      <div class="wrap"><table class="project-data-table" style="min-width:900px"><tbody>
        <tr><th>Position</th><td>#${loanDiagEsc(position.toString())}</td></tr>
        <tr><th>Wallet automatisch</th><td class="loan-link">${loanDiagEsc(wallet)}</td></tr>
        <tr><th>Typ</th><td>${loanDiagEsc(row.type||'–')}</td></tr>
        <tr><th>Eröffnung</th><td>${loanDate(row.date)}</td></tr>
        <tr><th>Eröffnungs-Tx</th><td>${row.tx?`<a target="_blank" href="https://bscscan.com/tx/${loanDiagEsc(row.tx)}">${loanDiagEsc(short(row.tx))}</a>`:'–'}</td></tr>
        <tr><th>Bekannter Lifecycle</th><td>${loanDiagEsc(knownLifecycle)}</td></tr>
        <tr><th>Alt/Neu-Bezug</th><td>${loanDiagEsc(relation)}</td></tr>
        <tr><th>Repay-Datum</th><td>${row.repaymentDate?loanDate(row.repaymentDate):'–'}</td></tr>
        <tr><th>Swap-Datum</th><td>${row.swapDate?loanDate(row.swapDate):'noch nicht verifiziert'}</td></tr>
      </tbody></table></div>

      <div style="margin-top:10px"><b>Aktueller Positions-Struct · Getter ${loanDiagEsc(LOAN_POSITION_STRUCT_SELECTOR)}</b></div>
      <div class="wrap"><table class="project-data-table" style="min-width:1000px"><thead><tr>
        <th>Feld</th><th>uint roh</th><th style="text-align:right">/1e18</th><th>Timestamp-Kandidat</th><th>Address-Kandidat</th>
      </tr></thead><tbody>${structRows||'<tr><td colspan="5">Struct nicht lesbar.</td></tr>'}</tbody></table></div>

      <div style="margin-top:10px"><b>Relevante Transfers der Eröffnungs-Tx</b></div>
      <div class="wrap"><table class="project-data-table" style="min-width:1000px"><thead><tr>
        <th>Token</th><th>Von</th><th>An</th><th style="text-align:right">Betrag</th>
      </tr></thead><tbody>${transferRows||'<tr><td colspan="4">Keine relevanten Transfers dekodiert.</td></tr>'}</tbody></table></div>

      ${loanDiagTxDetailsHtml(tx,receipt,position)}
    `;
    loanLifecycleSetState(`Fertig: Position #${position.toString()} · Wallet ${short(wallet)} automatisch aufgelöst.`, 'ok');
  }catch(e){
    console.error('[Loan position lifecycle]',e);
    loanLifecycleSetState(`Fehler: ${e?.message||e}`,'err');
  }finally{if(btn)btn.disabled=false}
}


let LOAN_GLOBAL_REFERENCE_RESULTS=[];

function loanGlobalRefSetState(text,kind='muted'){
  const el=document.getElementById('loanGlobalRefState');if(!el)return;
  el.className=kind==='ok'?'ok':kind==='warn'?'warn':kind==='err'?'err':'muted';
  el.textContent=text;
}
function loanGlobalRefType(rawType,typeLabel){
  const r=String(rawType??'').trim();
  const t=String(typeLabel||'');
  // Current central mapping / working labels:
  // 1 = TLN+ x2, 2 = TLN+ 0.25, 3 = TLN Gold x2, 0 = TLN Gold x4.
  if(r==='2'||/TLN Plus 0\.25/i.test(t))return 'TLN+ 0.25';
  if(r==='1'||/TLN Plus 2x/i.test(t))return 'TLN+ x2';
  if(r==='3'||/TLN Gold Booster ×2/i.test(t))return 'TLN Gold x2';
  if(r==='0'||/TLN Gold Booster ×4/i.test(t))return 'TLN Gold x4';
  return null;
}
function loanGlobalRefLifecycleScore(words){
  if(!Array.isArray(words)||!words.length)return 0;
  let score=0;
  try{
    const w5=BigInt(words[4]?.uint||0),w6=BigInt(words[5]?.uint||0),w7=BigInt(words[6]?.uint||0);
    if(w5>0n)score+=4;
    if(w6>0n)score+=4;
    if(w7===0n)score+=2;
    if(w7===1n)score+=1;
  }catch{}
  return score;
}
async function loanGlobalBurnTransfersForToken(tokenAddress,limit){
  if(!hasAlchemy())throw new Error('Keine Alchemy Discovery-API für BSC konfiguriert.');
  const latestHex=await rpc('eth_blockNumber',[]);
  const latest=Number(BigInt(latestHex));
  const out=[],seen=new Set();
  let toBlock=latest,window=250000,windows=0;
  while(toBlock>=0&&out.length<limit){
    const fromBlock=Math.max(0,toBlock-window+1);
    let pageKey=null,tmp=[],ok=false;
    try{
      do{
        const q={
          fromBlock:'0x'+fromBlock.toString(16),toBlock:'0x'+toBlock.toString(16),
          contractAddresses:[tokenAddress],category:['erc20'],excludeZeroValue:false,
          withMetadata:true,maxCount:'0x3e8',order:'desc',...(pageKey?{pageKey}:{})
        };
        const r=await alchemy('alchemy_getAssetTransfers',[q]);
        for(const tr of (r?.transfers||[])){
          if(norm(tr?.to||'')!==LOAN_ZERO)continue;
          const from=norm(tr?.from||'');
          if(!/^0x[0-9a-f]{40}$/.test(from)||from===LOAN_ZERO)continue;
          const hash=String(tr?.hash||'').toLowerCase();
          const key=`${hash}|${String(tr?.uniqueId||tr?.logIndex||'')}`;
          if(seen.has(key))continue;seen.add(key);tmp.push(tr);
        }
        pageKey=r?.pageKey||null;
        if(tmp.length+out.length>=limit)break;
      }while(pageKey);
      ok=true;
    }catch(e){
      if(window>1000){window=Math.max(1000,Math.floor(window/2));continue}
      throw e;
    }
    if(ok){
      tmp.sort((a,b)=>String(b?.metadata?.blockTimestamp||'').localeCompare(String(a?.metadata?.blockTimestamp||'')));
      for(const tr of tmp){out.push(tr);if(out.length>=limit)break}
      if(fromBlock===0)break;
      toBlock=fromBlock-1;windows++;
      if(windows%5===0&&window<250000)window=Math.min(250000,window*2);
      if(windows>5000)break;
    }
  }
  return out;
}
async function loanGlobalReferenceCandidates(limit){
  // True chainwide opening source: scan TLN+ and TLN-GOLD burns to zero, then
  // reconstruct each opening from the full receipt. This avoids bias toward
  // repayments or the user's own wallets.
  const perToken=Math.max(100,limit);
  const [plusBurns,goldBurns]=await Promise.all([
    loanGlobalBurnTransfersForToken(LOAN_TLNPLUS_ADDRESS,perToken),
    loanGlobalBurnTransfersForToken(LOAN_TLNGOLD_ADDRESS,perToken)
  ]);
  const seeds=[];
  for(const tr of [...plusBurns,...goldBurns]){
    const wallet=norm(tr?.from||'');
    const hash=String(tr?.hash||'').toLowerCase();
    if(!wallet||!hash)continue;
    seeds.push({wallet,tx:hash,transfer:tr,source:'global-burn'});
  }
  const seen=new Set();
  return seeds.filter(s=>{const k=s.tx;if(seen.has(k))return false;seen.add(k);return true})
    .sort((a,b)=>String(b.transfer?.metadata?.blockTimestamp||'').localeCompare(String(a.transfer?.metadata?.blockTimestamp||'')))
    .slice(0,Math.max(limit*2,limit));
}
async function loanGlobalResolveOpening(position,wallet,seedRow,seedTransfer){
  if(seedRow)return seedRow;
  if(seedTransfer){
    return await loanBuildRow(wallet,[seedTransfer]).catch(()=>null);
  }
  if(position==null)return null;
  const trs=await loanBurnCandidatesForWallet(wallet).catch(()=>[]);
  const byHash=new Map();
  for(const tr of trs){
    const h=String(tr?.hash||'').toLowerCase();if(!h)continue;
    if(!byHash.has(h))byHash.set(h,[]);byHash.get(h).push(tr);
  }
  for(const [hash,items] of byHash){
    const receipt=await loanReceipt(hash);if(!receipt||receipt.status==='0x0')continue;
    const ev=loanFindEvent(receipt,wallet);
    if(!ev||!ev.words?.length)continue;
    const eventId=(ev.words[0]>0n&&ev.words[0]<1000000000n)?Number(ev.words[0]):null;
    if(eventId!==Number(position))continue;
    const built=await loanBuildRow(wallet,items).catch(()=>null);
    if(built)return built;
  }
  return null;
}

function loanPickBestReference(type){
  const rows=LOAN_GLOBAL_REFERENCE_RESULTS.filter(x=>x.typ===type);
  if(!rows.length)return null;
  // Prefer true lifecycle evidence, then older cases, then latest position id as tiebreaker.
  return [...rows].sort((a,b)=>{
    if((b.score||0)!==(a.score||0))return (b.score||0)-(a.score||0);
    const ad=Date.parse(a.row?.date||0)||0,bd=Date.parse(b.row?.date||0)||0;
    if(ad!==bd)return ad-bd;
    return Number(a.row?.eventId||0)-Number(b.row?.eventId||0);
  })[0]||null;
}
async function loanInspectBestReference(type){
  const out=document.getElementById('loanGlobalBestRefResult');
  const hit=loanPickBestReference(type);
  if(!hit){
    if(out)out.innerHTML=`<div class="warn">Kein Referenzfall für ${loanDiagEsc(type)} vorhanden.</div>`;
    return;
  }
  if(out)out.innerHTML=`<div class="muted">Analysiere besten Referenzfall ${loanDiagEsc(type)} · #${loanDiagEsc(hit.row.eventId)} …</div>`;
  try{
    const r=hit.row;
    const receipt=r.tx?await loanReceipt(r.tx):null;
    const tx=r.tx?await loanDiagTransaction(r.tx):null;
    const transfers=receipt?await loanLifecycleRelevantTransfers(receipt,r.wallet):[];
    const state=hit.state||await loanReadPositionStructRaw(r.eventId,r.wallet);
    const words=state?.words||[];
    const transferRows=transfers.map(t=>`<tr>
      <td>${loanDiagEsc(t.symbol||'–')}</td><td class="loan-link">${loanDiagEsc(t.from||'–')}</td>
      <td class="loan-link">${loanDiagEsc(t.to||'–')}</td><td style="text-align:right">${loanDiagEsc(loanNum(t.amount,8))}</td>
    </tr>`).join('');
    const structRows=words.map(w=>`<tr><td>w${w.index}</td><td class="loan-raw">${loanDiagEsc(w.uint)}</td>
      <td style="text-align:right">${loanDiagEsc(w.as18)}</td><td>${loanDiagEsc(w.timestamp)}</td><td class="loan-link">${loanDiagEsc(w.address)}</td></tr>`).join('');
    const ev3=String(r.rawType??'–');
    const suggestedEvidence=(hit.score||0)>=4?'weiter fortgeschrittener Struct-Kandidat':'Basis-/Wait-State-Kandidat';
    out.innerHTML=`
      <div class="custom-token-card" style="margin-top:8px">
        <h3 style="margin-top:0">Bester Referenzfall · ${loanDiagEsc(type)}</h3>
        <div class="wrap"><table class="project-data-table" style="min-width:900px"><tbody>
          <tr><th>Position</th><td>#${loanDiagEsc(r.eventId)}</td></tr>
          <tr><th>Typ-ID</th><td>${loanDiagEsc(ev3)}</td></tr>
          <tr><th>Eröffnung</th><td>${loanDiagEsc(loanDate(r.date))}</td></tr>
          <tr><th>Wallet</th><td class="loan-link">${loanDiagEsc(r.wallet)}</td></tr>
          <tr><th>Lifecycle-Score</th><td>${loanDiagEsc(hit.score||0)} · ${loanDiagEsc(suggestedEvidence)}</td></tr>
          <tr><th>Repay</th><td>${r.repaymentDate?loanDiagEsc(loanDate(r.repaymentDate)):'–'}</td></tr>
          <tr><th>Eröffnungs-Tx</th><td>${r.tx?`<a target="_blank" href="https://bscscan.com/tx/${loanDiagEsc(r.tx)}">${loanDiagEsc(short(r.tx))}</a>`:'–'}</td></tr>
        </tbody></table></div>
        <div style="margin-top:10px"><b>Positions-Struct</b></div>
        <div class="wrap"><table class="project-data-table" style="min-width:1000px"><thead><tr>
          <th>Feld</th><th>uint roh</th><th style="text-align:right">/1e18</th><th>Timestamp-Kandidat</th><th>Address-Kandidat</th>
        </tr></thead><tbody>${structRows||'<tr><td colspan="5">Struct nicht lesbar.</td></tr>'}</tbody></table></div>
        <div style="margin-top:10px"><b>Relevante Transfers der Eröffnungs-Tx</b></div>
        <div class="wrap"><table class="project-data-table" style="min-width:1000px"><thead><tr>
          <th>Token</th><th>Von</th><th>An</th><th style="text-align:right">Betrag</th>
        </tr></thead><tbody>${transferRows||'<tr><td colspan="4">Keine relevanten Transfers dekodiert.</td></tr>'}</tbody></table></div>
        ${loanDiagTxDetailsHtml(tx,receipt,BigInt(r.eventId))}
      </div>`;
  }catch(e){
    console.error('[Best loan reference]',e);
    if(out)out.innerHTML=`<div class="err">Referenzanalyse fehlgeschlagen: ${loanDiagEsc(e?.message||e)}</div>`;
  }
}

async function loanSearchGlobalReferenceLoans(){
  const btn=document.getElementById('loanGlobalRefRun');
  const out=document.getElementById('loanGlobalRefResult');
  const limit=Math.max(100,Math.min(5000,Number(document.getElementById('loanGlobalRefLimit')?.value||800)));
  if(btn)btn.disabled=true;if(out)out.innerHTML='';
  loanGlobalRefSetState(`Scanne chainweit TLN+ und TLN GOLD Burns · Ziel bis zu ${limit} je Token …`);
  try{
    const seeds=await loanGlobalReferenceCandidates(limit);
    const targetTypes=new Set(['TLN+ 0.25','TLN+ x2','TLN Gold x2','TLN Gold x4']);
    const found=[];
    let done=0;
    for(const seed of seeds){
      done++;
      if(done===1||done%20===0)loanGlobalRefSetState(`Prüfe ${done}/${seeds.length} Kandidaten · ${found.length} passende Referenzen …`);
      const row=await loanGlobalResolveOpening(seed.position??null,seed.wallet,seed.row,seed.transfer).catch(()=>null);
      if(!row)continue;
      const typ=loanGlobalRefType(row.rawType,row.type);
      if(!typ||!targetTypes.has(typ))continue;
      const state=await loanReadPositionStructRaw(row.eventId,row.wallet).catch(()=>null);
      const score=loanGlobalRefLifecycleScore(state?.words||[]);
      found.push({typ,row,state,score,seedSource:seed.source});
      // Stop once we have enough usable candidates per type.
      const counts={};
      for(const f of found)counts[f.typ]=(counts[f.typ]||0)+1;
      if([...targetTypes].every(t=>(counts[t]||0)>=5))break;
    }

    found.sort((a,b)=>a.typ.localeCompare(b.typ)||b.score-a.score||Number(b.row.eventId)-Number(a.row.eventId));
    const counts={};for(const f of found)counts[f.typ]=(counts[f.typ]||0)+1;

    LOAN_GLOBAL_REFERENCE_RESULTS=found.map(f=>({
      typ:f.typ,score:f.score,row:{...f.row},state:f.state?{...f.state,words:(f.state.words||[]).map(w=>({...w}))}:null
    }));
    const summary=[...targetTypes].map(t=>{
      const subset=found.filter(f=>f.typ===t);
      return `<tr>
        <td><b>${loanDiagEsc(t)}</b></td>
        <td style="text-align:right">${subset.length}</td>
        <td>${subset.length?(subset.some(f=>f.score>=4)?'mind. ein weiter fortgeschrittener Struct-Kandidat':'nur Basis-/Wait-State-Kandidaten'):'kein Treffer'}</td>
        <td>${subset.length?`<button type="button" class="secondary loan-best-ref-btn" data-loan-best-type="${loanDiagEsc(t)}">Besten Referenzfall untersuchen</button>`:'–'}</td>
      </tr>`;
    }).join('');

    const rows=found.slice(0,80).map(f=>{
      const words=f.state?.words||[];
      const w5=words[4]?.as18??'–',w6=words[5]?.as18??'–',w7=words[6]?.uint??'–';
      return `<tr>
        <td>${loanDiagEsc(f.typ)}</td>
        <td>${loanDiagEsc(f.row.rawType??'–')}</td>
        <td>${loanDiagEsc(f.row.idLabel||('#'+f.row.eventId))}</td>
        <td>${loanDiagEsc(loanDate(f.row.date))}</td>
        <td class="loan-link">${loanDiagEsc(short(f.row.wallet))}</td>
        <td style="text-align:right">${loanDiagEsc(String(f.score))}</td>
        <td style="text-align:right">${loanDiagEsc(w5)}</td>
        <td style="text-align:right">${loanDiagEsc(w6)}</td>
        <td style="text-align:right">${loanDiagEsc(w7)}</td>
        <td>${f.row.repaymentDate?loanDiagEsc(loanDate(f.row.repaymentDate)):'–'}</td>
        <td>${f.row.tx?`<a target="_blank" href="https://bscscan.com/tx/${loanDiagEsc(f.row.tx)}">Eröffnung</a>`:'–'}</td>
      </tr>`;
    }).join('');

    out.innerHTML=`
      <div class="wrap"><table class="project-data-table" style="min-width:900px"><thead><tr><th>Typ</th><th style="text-align:right">Treffer</th><th>Struct-Hinweis</th><th>Referenzanalyse</th></tr></thead><tbody>${summary}</tbody></table></div>
      <div class="muted" style="margin:8px 0">Lifecycle-Score ist nur eine Sortierhilfe: positive w5/w6-Felder erhöhen den Score. Das ist noch kein Beweis für VOW-Collateral oder erfolgten Swap.</div>
      <div class="wrap"><table class="project-data-table" style="min-width:1400px"><thead><tr>
        <th>Typ</th><th>Typ-ID</th><th>Position</th><th>Eröffnung</th><th>Wallet</th><th style="text-align:right">Score</th><th style="text-align:right">w5 /1e18</th><th style="text-align:right">w6 /1e18</th><th style="text-align:right">w7</th><th>Repay</th><th>Tx</th>
      </tr></thead><tbody>${rows||'<tr><td colspan="11">Keine passenden Referenz-Loans gefunden.</td></tr>'}</tbody></table></div>`;
    document.querySelectorAll('.loan-best-ref-btn').forEach(btn=>{
      btn.addEventListener('click',()=>void loanInspectBestReference(String(btn.dataset.loanBestType||'')));
    });
    loanGlobalRefSetState(`Fertig: ${done} Kandidaten geprüft · ${found.length} passende Referenz-Loans gefunden.`,found.length?'ok':'warn');
  }catch(e){
    console.error('[Loan global references]',e);
    loanGlobalRefSetState(`Fehler: ${e?.message||e}`,'err');
  }finally{if(btn)btn.disabled=false}
}

function loanRefreshFilterOptions(){
  const typeSel=document.getElementById('loanFilterType');if(!typeSel)return;
  const keepType=typeSel.value||'all';
  typeSel.innerHTML='<option value="all">Alle Booster / Typen</option>';
  [...new Set(LOAN_DISCOVERY_ROWS.map(r=>r.type).filter(Boolean))].sort().forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;typeSel.appendChild(o)});
  if([...typeSel.options].some(o=>o.value===keepType))typeSel.value=keepType;
}
function renderLoanDiscovery(){
  const body=document.getElementById('loanDiscoveryRows'),reboundBody=document.getElementById('loanReboundRows');if(!body||!reboundBody)return;
  const val=id=>document.getElementById(id)?.value??'';
  const from=val('loanFilterFrom'),to=val('loanFilterTo'),walletFilter=document.getElementById('projectWalletFilter')?.value||'all',typ=val('loanFilterType')||'all';
  const tmin=Number(val('loanFilterTlnMin')),tmax=Number(val('loanFilterTlnMax')),gmin=Number(val('loanFilterGoldMin')),gmax=Number(val('loanFilterGoldMax'));
  const htmin=val('loanFilterTlnMin')!=='',htmax=val('loanFilterTlnMax')!=='',hgmin=val('loanFilterGoldMin')!=='',hgmax=val('loanFilterGoldMax')!=='';
  const rows=LOAN_DISCOVERY_ROWS.filter(r=>{const day=String(r.date||'').slice(0,10);if(from&&day<from)return false;if(to&&day>to)return false;if(htmin&&(r.tlnPlus==null||r.tlnPlus<tmin))return false;if(htmax&&(r.tlnPlus==null||r.tlnPlus>tmax))return false;if(hgmin&&(r.tlnGold==null||r.tlnGold<gmin))return false;if(hgmax&&(r.tlnGold==null||r.tlnGold>gmax))return false;if(walletFilter!=='all'&&norm(r.wallet)!==walletFilter)return false;if(typ!=='all'&&r.type!==typ)return false;return true;}).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  const reboundRows=rows.filter(r=>r.type==='TLN Gold Rebound');
  const loanRows=rows.filter(r=>r.type!=='TLN Gold Rebound');
  const rowHtml=r=>`<tr><td>${loanDate(r.date)}</td><td><span class="team-lifecycle-name">${esc(projectOwnWalletLabel(r.wallet)||'Wallet')}</span><span class="team-lifecycle-sub mono loan-wallet-short" title="${esc(r.wallet)}">${esc(loanWalletShort(r.wallet))}</span></td><td>${loanOptionCellHtml(r)}</td><td>${esc(r.type)}</td><td class="num">${loanNum(r.tlnPlus)}</td><td class="num">${loanNum(r.tlnGold)}</td><td class="num">${r.grossMintVusd==null?'–':loanNum(r.grossMintVusd,8)+' v$'}</td><td class="num">${r.netVusdToWallet==null?'0 v$':loanNum(r.netVusdToWallet,8)+' v$'}</td><td class="num">${r.principal==null?'–':loanNum(r.principal,8)+' v$'}</td><td class="num">${r.repayment==null?'–':loanNum(r.repayment,8)+' v$'}</td><td class="num">${r.interest==null?'–':loanNum(r.interest,8)+' v$'}</td><td class="num">${r.interestRate==null?'–':loanNum(r.interestRate,4)+' %'}</td><td>${esc(r.interestModel)}</td><td>${esc(r.repaymentSource||'–')}</td><td>${esc(r.collateralSource||'–')}</td><td class="num">${r.collateralVow==null?'–':loanNum(r.collateralVow,8)+' VOW'}</td><td>${esc(r.collateralStatus||'–')}</td><td>${esc(r.status)}</td><td>${loanDate(r.swapDate)}</td><td>${r.maturityDate?`${loanDate(r.maturityDate)}<span class="team-lifecycle-sub">${esc(r.maturitySource||'')}</span>`:'–'}</td><td>${r.repaymentDate?loanDate(r.repaymentDate):'–'}</td><td>${esc(r.link)}</td><td class="loan-link"><a href="https://bscscan.com/tx/${encodeURIComponent(r.tx)}" target="_blank" rel="noopener">${esc(r.tx.slice(0,10))}…${esc(r.tx.slice(-8))}</a></td><td>${loanEvidence(r.evidence)}</td><td class="loan-raw">${esc(r.rawType)}</td><td class="loan-raw">${esc(r.rawParams)}</td><td class="loan-raw">${esc(r.rawContract)}</td></tr>`;
  body.innerHTML=loanRows.length?loanRows.map(rowHtml).join(''):`<tr><td colspan="27">${LOAN_DISCOVERY_LOADING?'Loans werden on-chain geladen …':'Keine Loans entsprechen den Filtern.'}</td></tr>`;
  reboundBody.innerHTML=reboundRows.length?reboundRows.map(rowHtml).join(''):`<tr><td colspan="27">${LOAN_DISCOVERY_LOADING?'Rebound-Optionen werden on-chain geladen …':'Keine TLN Gold Rebound Optionen entsprechen den Filtern.'}</td></tr>`;
  const sumVal=(subset,key)=>subset.reduce((a,r)=>a+(Number(r?.[key])||0),0);
  const summaryRows=(subset,kind)=>{
    const cell=(v,d=2)=>loanNum(v,d);
    const isRebound=kind==='rebound';
    const repaidRows=subset.filter(r=>!!r.repaymentDate || /^Zurückbezahlt/i.test(String(r.status||'')));
    const openRows=subset.filter(r=>!r.repaymentDate && !/^Zurückbezahlt/i.test(String(r.status||'')));
    const extendedCount=subset.filter(r=>r.type==='TLN Gold Extended').length;
    const repaymentTotal=sumVal(subset,'repayment');
    const repaymentOpen=sumVal(openRows,'repayment');
    const repaymentPaid=sumVal(repaidRows,'repayment');
    const interestTotal=sumVal(subset,'interest');
    const upfrontInterest=sumVal(subset.filter(r=>String(r.interestModel||'').startsWith('im Voraus bezahlt')),'interest');
    const repayInterest=sumVal(subset.filter(r=>String(r.interestModel||'').startsWith('fällig bei Rückzahlung')),'interest');
    const deductedInterest=sumVal(subset.filter(r=>String(r.interestModel||'').startsWith('vom geminteten')),'interest');
    const unresolvedExtendedInterest=subset.filter(r=>(String(r?.rawType??'').trim()==='5'||r?.type==='TLN Gold Extended')&&r.interest==null).length;
    const valueWithBreakdown=(main,parts)=>`${cell(main,2)}<span class="team-lifecycle-sub">${parts.filter(Boolean).join(' · ')}</span>`;
    const rows=[
      [isRebound?'Anzahl Rebounds':'Anzahl Loans / Optionen', String(subset.length)],
      ['davon offen', String(openRows.length)]
    ];
    if(!isRebound)rows.push(
      ['davon zurückbezahlt', String(repaidRows.length)],
      ['davon TLN Gold Extended', String(extendedCount)]
    );
    rows.push(
      ['TLN+ Burn gesamt', cell(sumVal(subset,'tlnPlus'),4)],
      ['TLN GOLD Burn gesamt', cell(sumVal(subset,'tlnGold'),8)],
      ['v$ Brutto-Mint / Option gesamt', cell(sumVal(subset,'grossMintVusd'),2)],
      ['v$ netto an Wallets ausgezahlt', cell(sumVal(subset,'netVusdToWallet'),2)]
    );
    if(!isRebound){
      rows.push(
        ['Principal / Schuld gesamt', cell(sumVal(subset,'principal'),2)],
        ['Rückzahlung gesamt', valueWithBreakdown(repaymentTotal,[`davon offen ${cell(repaymentOpen,2)} v$`,`zurückbezahlt ${cell(repaymentPaid,2)} v$`])],
        ['Zinsen gesamt', valueWithBreakdown(interestTotal,[`vorausbezahlt ${cell(upfrontInterest,2)} v$`,`bei Rückzahlung fällig ${cell(repayInterest,2)} v$`,`vom Mint abgezogen ${cell(deductedInterest,2)} v$`,unresolvedExtendedInterest?`Extended on-chain offen ${unresolvedExtendedInterest}`:''])]
      );
    }
    return rows.map(([label,value],i)=>`<tr><td${i===0?' style="font-weight:700"':''}>${label}</td><td class="loan-num"${i===0?' style="font-weight:700"':''}>${value}</td></tr>`).join('');
  };
  const loanSummary=document.getElementById('loanSummaryLoansRows');
  if(loanSummary)loanSummary.innerHTML=summaryRows(loanRows,'loan');
  const reboundSummary=document.getElementById('loanSummaryReboundsRows');
  if(reboundSummary)reboundSummary.innerHTML=summaryRows(reboundRows,'rebound');
}
async function discoverLoansOnchain({force=false}={}){
  if(LOAN_DISCOVERY_LOADING)return;
  const wallets=[...new Set((getWallets()||[]).map(x=>norm(x?.evm_address||'')).filter(x=>/^0x[0-9a-f]{40}$/.test(x)))];
  if(!wallets.length){loanSetState('Keine TLN/VOW-Wallets verfügbar.','warn');return;}
  if(!hasAlchemy()){loanSetState('Keine Alchemy Discovery-API für BSC konfiguriert.','err');return;}
  LOAN_DISCOVERY_LOADING=true;
  const reload=document.getElementById('loanDiscoveryReload');if(reload)reload.disabled=true;
  if(force){LOAN_DISCOVERY_ROWS=[];LOAN_RECEIPT_CACHE.clear();}
  renderLoanDiscovery();
  loanSetState(`Loan-Cache + Live-Lifecycle-Prüfung für ${wallets.length} Wallet(s) …`);
  const allRows=[];let burnTxs=0,errors=0;
  try{
    const latestHex=await rpc('eth_blockNumber',[]);
    const latestBlock=Number(BigInt(latestHex));
    for(let base=0;base<wallets.length;base+=3){
      const group=wallets.slice(base,base+3);
      const results=await Promise.all(group.map(async wallet=>{
        try{
          const cached=(!force&&loadCache)?await loadCache(wallet,LOAN_CACHE_KEY,LOAN_CACHE_VERSION).catch(()=>null):null;
          let rows=Array.isArray(cached?.rows)?cached.rows.map(r=>({...r,wallet})):[];

          // Immutable Eröffnungs-Fakten inkrementell ergänzen.
          const openingFrom=force||!cached?0:Math.max(0,Number(cached.lastOpeningBlock||0)-LOAN_CACHE_OVERLAP_BLOCKS);
          loanSetState(`Eröffnungen ${short(wallet)} ab Block ${openingFrom.toLocaleString('de-CH')} …`);
          const burns=await loanBurnCandidatesForWallet(wallet,{fromBlock:openingFrom});
          const byTx=new Map();
          for(const b of burns){const h=String(b?.hash||'').toLowerCase();if(!h)continue;if(!byTx.has(h))byTx.set(h,[]);byTx.get(h).push(b)}
          const newRows=[];
          for(const bs of byTx.values()){
            burnTxs++;
            try{const row=await loanBuildRow(wallet,bs);if(row)newRows.push(row)}
            catch(e){errors++;log(`Loan-Discovery ${short(wallet)} ${String(bs?.[0]?.hash||'').slice(0,12)}: ${e.message||e}`,'warn')}
          }
          const merged=new Map();
          for(const r of [...rows,...newRows])merged.set(`${norm(r.wallet)}|${String(r.tx).toLowerCase()}`,r);
          rows=[...merged.values()];

          // Mutable Lifecycle-Fakten IMMER live nachprüfen. Nur der bereits geprüfte Block
          // wird gecacht; jeder Aufruf liest die neue Kette mit 24-Block-Overlap.
          const lifecycleFrom=force||!cached?0:Math.max(0,Number(cached.lastLifecycleBlock||0)-LOAN_CACHE_OVERLAP_BLOCKS);
          loanSetState(`Lifecycle live ${short(wallet)} ab Block ${lifecycleFrom.toLocaleString('de-CH')} …`);
          const repayTransfers=await loanRepayCandidatesForWallet(wallet,{fromBlock:lifecycleFrom});
          const repaymentRows=[];
          for(const tr of repayTransfers){
            try{const rp=await loanBuildRepayment(wallet,tr);if(rp)repaymentRows.push(rp)}
            catch(e){errors++;log(`Loan-Repay-Discovery ${short(wallet)} ${String(tr?.hash||'').slice(0,12)}: ${e.message||e}`,'warn')}
          }
          loanApplyRepayments(rows,repaymentRows);
          await loanResolveExtendedRelations(rows);

          // Swap-/Fälligkeitsdaten bleiben bewusst offen, bis deren On-Chain-Event/State
          // verifiziert ist. Die Architektur prüft den Lifecycle bei jedem Laden neu.
          for(const r of rows){
            if(!r.repaymentDate && !r.swapDate){
              r.status='Offen · Swap/Fälligkeit wird bei jedem Laden live geprüft';
              r.maturityDate=null;
              r.maturitySource='offen · 372 Tage starten erst mit verifiziertem v$→VOW-Swap / Marktstart';
            }
          }

          if(saveCache)await saveCache(wallet,LOAN_CACHE_KEY,LOAN_CACHE_VERSION,{
            kind:'tln_vow_loans',
            schemaVersion:3,
            rows:rows.map(r=>{const x={...r};delete x.wallet;return x;}),
            lastOpeningBlock:latestBlock,
            lastLifecycleBlock:latestBlock,
            savedAt:new Date().toISOString()
          },latestBlock).catch(()=>false);
          return rows;
        }catch(e){errors++;log(`Loan-Scan ${short(wallet)}: ${e.message||e}`,'warn');return []}
      }));
      allRows.push(...results.flat());
      LOAN_DISCOVERY_ROWS=[...allRows].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
      loanRefreshFilterOptions();renderLoanDiscovery();
    }
    const dedup=new Map();
    for(const r of allRows)dedup.set(`${norm(r.wallet)}|${String(r.tx).toLowerCase()}`,r);
    LOAN_DISCOVERY_ROWS=[...dedup.values()].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
    LOAN_DISCOVERY_LOADED=true;loanRefreshFilterOptions();renderLoanDiscovery();
    loanSetState(`${LOAN_DISCOVERY_ROWS.length} Loan-/Options-Eröffnung(en) · Cache für Eröffnungs-Fakten aktiv · Lifecycle bis Block ${latestBlock.toLocaleString('de-CH')} live geprüft${errors?` · ${errors} Prüffehler`:''}.`,errors?'warn':'ok');
  }catch(e){
    loanSetState(`Loan-Discovery fehlgeschlagen: ${e.message||e}`,'err');
    log(e.stack||e.message||String(e),'err');
  }finally{
    LOAN_DISCOVERY_LOADING=false;if(reload)reload.disabled=false;renderLoanDiscovery();
  }
}
function loanShowInnerPanel(name){
  const target=name==='rebounds'?'rebounds':'loans';
  document.querySelectorAll('#loanInnerTabs [data-loan-panel]').forEach(btn=>{
    const active=btn.dataset.loanPanel===target;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-selected',active?'true':'false');
  });
  const loans=document.getElementById('loanInnerPanel-loans');
  const rebounds=document.getElementById('loanInnerPanel-rebounds');
  if(loans)loans.style.display=target==='loans'?'block':'none';
  if(rebounds)rebounds.style.display=target==='rebounds'?'block':'none';
}

function initLoanDiscovery(){
  const sel=document.getElementById('loanFilterType');if(!sel||sel.dataset.ready==='1')return;sel.dataset.ready='1';
  loanRefreshFilterOptions();
  document.querySelectorAll('#loanInnerTabs [data-loan-panel]').forEach(btn=>{
    btn.addEventListener('click',()=>loanShowInnerPanel(btn.dataset.loanPanel));
  });
  loanShowInnerPanel('loans');
  ['loanFilterFrom','loanFilterTo','loanFilterTlnMin','loanFilterTlnMax','loanFilterGoldMin','loanFilterGoldMax','loanFilterType'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderLoanDiscovery));
  document.getElementById('loanFilterReset')?.addEventListener('click',()=>{['loanFilterFrom','loanFilterTo','loanFilterTlnMin','loanFilterTlnMax','loanFilterGoldMin','loanFilterGoldMax'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});sel.value='all';renderLoanDiscovery();});
  document.getElementById('loanDiscoveryReload')?.addEventListener('click',()=>void discoverLoansOnchain({force:true}));
  document.getElementById('loanDiagRun')?.addEventListener('click',()=>void loanSearchPositionBackwards());
  document.getElementById('loanStateRun')?.addEventListener('click',()=>void loanReadPositionState());
  document.getElementById('loanStatusCompareRun')?.addEventListener('click',()=>void loanComparePositionStatusFields());
  document.getElementById('loanLifecycleRun')?.addEventListener('click',()=>void loanInspectPositionLifecycle());
  document.getElementById('loanGlobalRefRun')?.addEventListener('click',()=>void loanSearchGlobalReferenceLoans());
  document.getElementById('loanGoldGlobalRun')?.addEventListener('click',()=>void loanSearchGoldVariantsGlobal());
  document.getElementById('loanRepayVerifyRun')?.addEventListener('click',()=>void loanVerifyRepaymentModels());
  renderLoanDiscovery();
}


  return {
    init:initLoanDiscovery,
    discover:discoverLoansOnchain,
    render:renderLoanDiscovery,
    getRows:()=>LOAN_DISCOVERY_ROWS.map(r=>({...r})),
    refreshLifecycle:()=>discoverLoansOnchain({force:false}),
    constants:{optionsContract:LOAN_OPTIONS_CONTRACT,vusd:LOAN_VUSD_ADDRESS,boosterByEventValue3:LOAN_BOOSTER_BY_EVENT_VALUE3}
  };
}
global.TLNVOWLoanEngine=Object.freeze({create:createLoanEngine,version:'20260914-182500'});
})(window);
