/* TLN/VOW Loans central engine · Build 20260913-181616 */
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
const LOAN_META_CACHE=new Map();
const LOAN_CACHE_KEY='loan-openings-lifecycle';
const LOAN_CACHE_VERSION='loan-engine-v2-central-verified-interest';
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
  if(ev3==='5')return 'keine eigene Rückzahlung · TLN Gold Extended';
  if(tlnPlus>0&&vusd>0&&loanClose(vusd,tlnPlus*.82,.01))
    return 'vom geminteten v$-Betrag abgezogen · 18 %';
  if(interest>0&&vusd>0&&loanClose(interest,vusd*.18,.01))
    return 'im Voraus bezahlt · 18 %';
  return 'noch zu bestimmen';
}

function loanDebtFields({tlnPlus,tlnGold,vusd,interest,rawType,eventAmount18}){
  const ev3=String(rawType??'').trim();
  if(ev3==='4'||ev3==='5')
    return {principal:null,repayment:null,interestDue:null,interestRate:null,repaymentSource:'keine eigene Rückzahlung (Booster/Option)'};

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
    r.status='Zurückbezahlt · on-chain bestätigt';
    r.link=`Repay-Position ${rp.positionRef}`;
    r.evidence='verified';
  }
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
  const interest=sum(vs.filter(x=>x.from===w&&x.to!==LOAN_ZERO&&x.to!==w))||null;
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
  const type=loanClassify({tlnPlus,tlnGold,vusd,interest,rawType,eventAmount18});
  const interestModel=loanInterestModel({tlnPlus,tlnGold,vusd,interest,rawType,eventAmount18});
  const debt=loanDebtFields({tlnPlus,tlnGold,vusd,interest,rawType,eventAmount18});
  const evidence=vusd?'verified':'likely';
  const idLabel=eventId?`Option #${eventId}`:'Option # noch nicht erkannt';
  return {date,wallet:w,idLabel,eventId,type,tlnPlus,tlnGold,vusd,principal:debt.principal,repayment:debt.repayment,interest:(debt.interestDue??interest??null),interestRate:debt.interestRate,interestModel,repaymentSource:debt.repaymentSource,collateralVow,
    status:'Eröffnung on-chain erkannt · Lifecycle wird bei jedem Laden live geprüft',swapDate:null,
    maturityDate:null,repaymentDate:null,
    maturitySource:'offen · Fälligkeit beginnt erst mit v$→VOW-Swap / Marktstart',
    link:'Lifecycle-Verknüpfung noch zu ermitteln',tx:hash,evidence,rawType,rawParams,rawContract,
    blockNumber:receipt.blockNumber||null,receiptTo:norm(receipt.to||''),transferCount:transfers.length};
}


const LOAN_TLNGOLD_ADDRESS=Object.keys(LOAN_TOKEN_CANONICAL).find(a=>loanNormSymbol(LOAN_TOKEN_CANONICAL[a]?.symbol)==='TLNGOLD')||'0xaa90a8cdab8b8e902293a2817d1d286f66cbcec5';

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
      out.innerHTML=`<div class="ok"><b>${direct.length} direkter Treffer</b> für Referenz ${position.toString()}.</div><div class="wrap" style="margin-top:8px"><table class="project-data-table"><thead><tr><th>Datum</th><th>Tx</th><th>Log</th><th>Event-Contract</th><th>Data-Werte dezimal</th><th>Event-Wert 3</th><th>Booster</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
      loanDiagSetState(`Fertig: ${direct.length} direkter Treffer in ${byHash.size} möglichen Eröffnungs-Txs.`, 'ok');
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

function loanRefreshFilterOptions(){
  const typeSel=document.getElementById('loanFilterType'),walletSel=document.getElementById('loanFilterWallet');if(!typeSel||!walletSel)return;
  const keepType=typeSel.value||'all',keepWallet=walletSel.value||'all';
  typeSel.innerHTML='<option value="all">Alle Booster / Typen</option>';walletSel.innerHTML='<option value="all">Alle Wallets</option>';
  const wallets=[...new Set([...(getWallets()||[]).map(x=>norm(x?.evm_address||'')),...LOAN_DISCOVERY_ROWS.map(r=>norm(r.wallet))].filter(x=>/^0x[0-9a-f]{40}$/.test(x)))];
  wallets.sort((a,b)=>String(projectOwnWalletLabel(a)||a).localeCompare(String(projectOwnWalletLabel(b)||b),'de')).forEach(w=>{const o=document.createElement('option');o.value=w;const name=projectOwnWalletLabel(w)||'Wallet';o.textContent=`${name} · ${w.slice(0,8)}…${w.slice(-6)}`;walletSel.appendChild(o)});
  [...new Set(LOAN_DISCOVERY_ROWS.map(r=>r.type).filter(Boolean))].sort().forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;typeSel.appendChild(o)});
  if([...walletSel.options].some(o=>o.value===keepWallet))walletSel.value=keepWallet;
  if([...typeSel.options].some(o=>o.value===keepType))typeSel.value=keepType;
}
function renderLoanDiscovery(){
  const body=document.getElementById('loanDiscoveryRows'),reboundBody=document.getElementById('loanReboundRows');if(!body||!reboundBody)return;
  const val=id=>document.getElementById(id)?.value??'';
  const from=val('loanFilterFrom'),to=val('loanFilterTo'),walletFilter=val('loanFilterWallet')||'all',typ=val('loanFilterType')||'all';
  const tmin=Number(val('loanFilterTlnMin')),tmax=Number(val('loanFilterTlnMax')),gmin=Number(val('loanFilterGoldMin')),gmax=Number(val('loanFilterGoldMax'));
  const htmin=val('loanFilterTlnMin')!=='',htmax=val('loanFilterTlnMax')!=='',hgmin=val('loanFilterGoldMin')!=='',hgmax=val('loanFilterGoldMax')!=='';
  const rows=LOAN_DISCOVERY_ROWS.filter(r=>{const day=String(r.date||'').slice(0,10);if(from&&day<from)return false;if(to&&day>to)return false;if(htmin&&(r.tlnPlus==null||r.tlnPlus<tmin))return false;if(htmax&&(r.tlnPlus==null||r.tlnPlus>tmax))return false;if(hgmin&&(r.tlnGold==null||r.tlnGold<gmin))return false;if(hgmax&&(r.tlnGold==null||r.tlnGold>gmax))return false;if(walletFilter!=='all'&&norm(r.wallet)!==walletFilter)return false;if(typ!=='all'&&r.type!==typ)return false;return true;}).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  const reboundRows=rows.filter(r=>r.type==='TLN Gold Rebound');
  const loanRows=rows.filter(r=>r.type!=='TLN Gold Rebound');
  const rowHtml=r=>`<tr><td>${loanDate(r.date)}</td><td><span class="team-lifecycle-name">${esc(projectOwnWalletLabel(r.wallet)||'Wallet')}</span><span class="team-lifecycle-sub mono">${esc(r.wallet)}</span></td><td><b>${esc(r.idLabel)}</b></td><td>${esc(r.type)}</td><td style="text-align:right">${loanNum(r.tlnPlus)}</td><td style="text-align:right">${loanNum(r.tlnGold)}</td><td style="text-align:right">${r.vusd==null?'–':loanNum(r.vusd,8)+' v$'}</td><td style="text-align:right">${r.principal==null?'–':loanNum(r.principal,8)+' v$'}</td><td style="text-align:right">${r.repayment==null?'–':loanNum(r.repayment,8)+' v$'}</td><td style="text-align:right">${r.interest==null?'–':loanNum(r.interest,8)+' v$'}</td><td style="text-align:right">${r.interestRate==null?'–':loanNum(r.interestRate,4)+' %'}</td><td>${esc(r.interestModel)}</td><td>${esc(r.repaymentSource||'–')}</td><td style="text-align:right">${r.collateralVow==null?'–':loanNum(r.collateralVow,8)+' VOW'}</td><td>${esc(r.status)}</td><td>${loanDate(r.swapDate)}</td><td>${r.maturityDate?`${loanDate(r.maturityDate)}<span class="team-lifecycle-sub">${esc(r.maturitySource||'')}</span>`:'–'}</td><td>${r.repaymentDate?loanDate(r.repaymentDate):'–'}</td><td>${esc(r.link)}</td><td class="loan-link"><a href="https://bscscan.com/tx/${encodeURIComponent(r.tx)}" target="_blank" rel="noopener">${esc(r.tx.slice(0,10))}…${esc(r.tx.slice(-8))}</a></td><td>${loanEvidence(r.evidence)}</td><td class="loan-raw">${esc(r.rawType)}</td><td class="loan-raw">${esc(r.rawParams)}</td><td class="loan-raw">${esc(r.rawContract)}</td></tr>`;
  body.innerHTML=loanRows.length?loanRows.map(rowHtml).join(''):`<tr><td colspan="20">${LOAN_DISCOVERY_LOADING?'Loans werden on-chain geladen …':'Keine Loans entsprechen den Filtern.'}</td></tr>`;
  reboundBody.innerHTML=reboundRows.length?reboundRows.map(rowHtml).join(''):`<tr><td colspan="20">${LOAN_DISCOVERY_LOADING?'Rebound-Optionen werden on-chain geladen …':'Keine TLN Gold Rebound Optionen entsprechen den Filtern.'}</td></tr>`;
  const sumVal=(subset,key)=>subset.reduce((a,r)=>a+(Number(r?.[key])||0),0);
  const summaryRows=(subset,kind)=>{
    const cell=(v,d=2)=>loanNum(v,d);
    const isRebound=kind==='rebound';
    const repaidCount=subset.filter(r=>!!r.repaymentDate || /^Zurückbezahlt/i.test(String(r.status||''))).length;
    const openCount=subset.filter(r=>!r.repaymentDate && !/^Zurückbezahlt/i.test(String(r.status||''))).length;
    const extendedCount=subset.filter(r=>r.type==='TLN Gold Extended').length;
    const rows=[
      [isRebound?'Anzahl Rebounds':'Anzahl Loans / Optionen', String(subset.length)],
      ['davon offen', String(openCount)]
    ];
    if(!isRebound)rows.push(
      ['davon zurückbezahlt', String(repaidCount)],
      ['davon TLN Gold Extended', String(extendedCount)]
    );
    rows.push(
      ['TLN+ Burn gesamt', cell(sumVal(subset,'tlnPlus'),4)],
      ['TLN GOLD Burn gesamt', cell(sumVal(subset,'tlnGold'),8)],
      ['v$ Loan / Option gesamt', cell(sumVal(subset,'vusd'),2)]
    );
    if(!isRebound){
      rows.push(
        ['Principal / Schuld gesamt', cell(sumVal(subset,'principal'),2)],
        ['Rückzahlung gesamt', cell(sumVal(subset,'repayment'),2)],
        ['Zinsen gesamt', cell(sumVal(subset,'interest'),2)]
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
            schemaVersion:2,
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
  const sel=document.getElementById('loanFilterType'),walletSel=document.getElementById('loanFilterWallet');if(!sel||!walletSel||sel.dataset.ready==='1')return;sel.dataset.ready='1';
  loanRefreshFilterOptions();
  document.querySelectorAll('#loanInnerTabs [data-loan-panel]').forEach(btn=>{
    btn.addEventListener('click',()=>loanShowInnerPanel(btn.dataset.loanPanel));
  });
  loanShowInnerPanel('loans');
  ['loanFilterFrom','loanFilterTo','loanFilterTlnMin','loanFilterTlnMax','loanFilterGoldMin','loanFilterGoldMax','loanFilterWallet','loanFilterType'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderLoanDiscovery));
  document.getElementById('loanFilterReset')?.addEventListener('click',()=>{['loanFilterFrom','loanFilterTo','loanFilterTlnMin','loanFilterTlnMax','loanFilterGoldMin','loanFilterGoldMax'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});walletSel.value='all';sel.value='all';renderLoanDiscovery();});
  document.getElementById('loanDiscoveryReload')?.addEventListener('click',()=>void discoverLoansOnchain({force:true}));
  document.getElementById('loanDiagRun')?.addEventListener('click',()=>void loanSearchPositionBackwards());
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
global.TLNVOWLoanEngine=Object.freeze({create:createLoanEngine,version:'20260913-150133'});
})(window);
