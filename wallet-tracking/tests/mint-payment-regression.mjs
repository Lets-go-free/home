import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('projects/dao1/dao1.js'),app=read('js/app.js');
const wallet='0x5682810a3f03593bc94480df70fe036a8cfe4940',contract='0xa1b761890c36e356f49f9df8d495fcffa76857ad',zero='0x'+'0'.repeat(40),hash='0x'+'a'.repeat(64);
const s={lower:v=>String(v||'').toLowerCase(),transferFromAddress:t=>t.from,transferToAddress:t=>t.to,transferTokenIds:t=>[t.id],tokenTransferAddress:t=>t.contract,tokenTransferRawValue:t=>t.raw};
vm.runInNewContext(source.slice(source.indexOf('  function dao1MintPaymentCheck('),source.indexOf('  async function dao1HistoricalPurchaseForNft(')),s);
function evidence(ids){return {txDetail:{status:'ok',value:'0'},internals:[{value:'0'}],transfers:ids.map(id=>({token:{type:'ERC-721'},contract,id,from:zero,to:wallet}))};}
for(const ids of [['120469','120470'],['15541','15542']])for(const id of ids){const check=s.dao1MintPaymentCheck({contract,id},evidence(ids),wallet);assert.equal(check.complete,true);assert.equal(check.mintWithoutPayment,true);}
const nft={contract,id:'15542'};
for(const modify of [e=>e.internals=null,e=>e.txDetail=null,e=>e.txDetail.status='error',e=>delete e.txDetail.value,e=>e.internals[0].value='invalid',e=>e.transfers.push({token:{type:'ERC-20'}})]){const e=evidence(['15542']);modify(e);assert.equal(s.dao1MintPaymentCheck(nft,e,wallet).mintWithoutPayment,false);}
for(const modify of [e=>e.txDetail.value='1',e=>e.internals[0].value='1',e=>e.transfers.push({token:{type:'ERC-20'},total:{value:'1'},from:'third-party'}),e=>e.transfers[0].from=wallet,e=>e.transfers[0].id='other']){const e=evidence(['15542']);modify(e);assert.equal(s.dao1MintPaymentCheck(nft,e,wallet).mintWithoutPayment,false);}
let page={items:[],next_page_params:{page:2}};
const paged={fetchJson:async()=>page,nextUrl:()=> 'https://test/page2'};
vm.runInNewContext(source.slice(source.indexOf('  async function fetchPagedUrl('),source.indexOf('  function isNonSpamNftTransfer(')),paged);
await assert.rejects(paged.fetchPagedUrl('https://test',1,true),/pagination/);
page={};await assert.rejects(paged.fetchPagedUrl('https://test',1,true),/Transferantwort/);
// Actual adapter: separate complete same-TX result from still unknown purchase price.
let acq={txHash:hash,acquisitionKind:'mint',purchase:null,mintWithoutPayment:true,sameTxPaymentCheckComplete:true};
const adapter={ensureLoaded:async()=>{},lower:s.lower,dao1TeamAcquisitionForNft:async()=>acq,nftPurchaseResolverVersion:()=>4};
vm.runInNewContext(source.slice(source.indexOf('  async function resolveNftPurchaseEvidence('),source.indexOf('  const DAO1_LIFECYCLE_STATUS=')),adapter);
let ev=await adapter.resolveNftPurchaseEvidence({contract,id:'15542',wallet});assert.equal(ev.status,'mint_without_same_tx_payment');assert.equal(ev.checked,false);assert.equal(ev.purchase,null);assert.equal(ev.sameTxPaymentCheckComplete,true);
acq={...acq,mintWithoutPayment:false,sameTxPaymentCheckComplete:false};ev=await adapter.resolveNftPurchaseEvidence({contract,id:'15542',wallet});assert.equal(ev.status,'incomplete_no_deterministic_payment');
acq={...acq,purchase:{amount:6750}};ev=await adapter.resolveNftPurchaseEvidence({contract,id:'15542',wallet});assert.equal(ev.status,'price_verified');assert.equal(ev.checked,true);
const ui={escapeAttr:v=>v};vm.runInNewContext(app.slice(app.indexOf('function nftPurchaseText('),app.indexOf('function nftMinerUpgradeInfo(')),ui);assert.equal(ui.nftPurchaseText({purchaseEvidence:{status:'mint_without_same_tx_payment'}}),'nicht ermittelt');
const team={tokenAmount:v=>v,escapeHtml:v=>v};vm.runInNewContext(source.slice(source.indexOf('  function dao1TeamPurchaseText('),source.indexOf('  function dao1TeamSourceText(')),team);
assert.equal(team.dao1TeamAcquisitionText({acquisition_kind:'mint',mint_without_same_tx_payment:true}),'Mint ohne Zahlung in dieser TX');assert.equal(team.dao1TeamPurchaseText({mint_without_same_tx_payment:true}),'nicht ermittelt');
assert.equal(team.dao1TeamAcquisitionText({acquisition_kind:'mint'}),'Mint / Kaufprüfung offen');
assert.ok(app.includes('Mint ohne Zahlung in dieser TX'));
console.log('PASS: four screenshot-derived mints, payments including third party, incomplete values/pages/errors, separate price state and NFT/DAO presentation.');
// Actual payment reader must not turn failed API calls into complete no-payment evidence.
let failTransfers=false,failInternals=false;
const reader={...s,console:{warn:()=>{}},EXPLORER_API:'https://test',H:v=>v?.hash||v||'',fetchTransactionTokenTransfers:async(_hash,opts)=>{assert.equal(opts.strict,true);if(failTransfers)throw Error('HTTP 500');return evidence(['15542']).transfers;},fetchJson:async()=>({status:'ok',value:'0',from:{hash:wallet}}),fetchPagedUrl:async(_url,_limit,strict)=>{assert.equal(strict,true);if(failInternals)throw Error('HTTP 500');return [{value:'0'}];},dao1TeamBotSystemEvidenceFromTx:()=>({}),dao1PurchaseDidFromInput:()=>0,REFERRAL_WUSDT_TOKEN:'0xnone'};
vm.runInNewContext(source.slice(source.indexOf('  async function dao1PaymentEvidenceForTx('),source.indexOf('  async function dao1HistoricalPurchaseForNft(')),reader);
let actual=await reader.dao1PaymentEvidenceForTx(hash,wallet);assert.equal(reader.dao1MintPaymentCheck(nft,actual,wallet).mintWithoutPayment,true);
failInternals=true;actual=await reader.dao1PaymentEvidenceForTx(hash,wallet);assert.equal(reader.dao1MintPaymentCheck(nft,actual,wallet).complete,false);
failTransfers=true;await assert.rejects(reader.dao1PaymentEvidenceForTx(hash,wallet),/500/);
console.log('PASS: actual payment reader strict transfer request and failed internal/transfer calls stay incomplete.');
