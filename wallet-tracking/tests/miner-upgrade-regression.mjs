import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const OLD='0xa1b761890c36e356f49f9df8d495fcffa76857ad', NEW='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d', MANAGER='0x8c45ebe231b225c7179f5bb2bc19b008a1c01302';
const WALLET='0x239c5822a0d2a67e629d7a3b5c8180721e228b47', OTHER='0x'+'b'.repeat(40), ZERO='0x'+'0'.repeat(40), SINK='0x'+'c'.repeat(40);
const HASH='0x47fa2a889a34e99208931afaaca0a1e1c45016e3b20bcc66804473438454c4f1', BUY='0x'+'1'.repeat(64), MOVED='0x'+'2'.repeat(64);
// Screenshot-derived transaction facts. Transfer objects are synthetic Blockscout v2 fixtures;
// the API was unavailable here. No assertion claims a live API roundtrip.
const detail={status:'ok',raw_input:'0x454b0608'+'0'.repeat(64),to:{hash:MANAGER},from:{hash:WALLET},block_number:14772428,timestamp:'2026-10-04T22:12:05Z'};
const tr=(contract,id,from,to,hash=HASH,block=14772428)=>({token:{address_hash:contract,type:'ERC-721'},total:{token_id:id},from:{hash:from},to:{hash:to},transaction_hash:hash,block_number:block,timestamp:detail.timestamp});
const transfers=[tr(OLD,'90270',WALLET,SINK),tr(NEW,'46489',ZERO,WALLET)];
let caches=[],user='A',history=new Map(),evidence=new Map();
const sandbox={window:{getCachedNftsForWalletId:()=>caches,getAllCachedNfts:()=>caches},ethers:{id:()=> '0x'+'0'.repeat(64)},console,TextEncoder,TextDecoder,URL,Map,Set,Date,Intl,setTimeout,clearTimeout,performance};
let source=readFileSync(new URL('../projects/dao1/dao1.js',import.meta.url),'utf8');
source=source.replace('return { nftPurchaseResolverVersion,','return { __test:{parse:dao1MinerUpgradeFromTx,link:dao1MinerUpgradeForNft,inherit:dao1InheritedMinerPurchase,basis:dao1PurchaseBasisKey,overview:dao1BotOverviewTableHtml,totals:dao1TeamPurchaseTotalsHtml,kind:dao1TeamAcquisitionText,status:dao1TeamBotStatus,setup:(context,ev,hist)=>{getContext=()=>context;ensureLoaded=async()=>{};dao1PaymentEvidenceForTx=async hash=>ev.get(hash)||{txHash:hash,purchase:null,transfers:[],paymentCandidates:[]};fetchCachedNftHistories=async(contract,ids)=>new Map(ids.map(id=>[id,hist.get(contract+"|"+id)||[]]));loadWalletNftTransferHistory=async()=>[];dao1TeamPartnerDetailsCache.clear();}}, nftPurchaseResolverVersion,');
vm.runInNewContext(source,sandbox);
const api=sandbox.window.DAO1Project,t=api.__test;
function setup(){t.setup({currentUser:{id:user},wallets:[{id:'wallet'}]},evidence,history);}
function ev(hash,tx,flows,purchase=null){return {txHash:hash,txDetail:tx,transfers:flows,purchase,paymentCandidates:purchase?[purchase]:[],at:tx?.timestamp,block:tx?.block_number};}
const purchase={amount:1000,symbol:'wUSDT',contract:'0x'+'d'.repeat(40),timestamp:'2025-03-01T12:00:00Z',block:100000};
const oldStored={purchase,checked:true,resolverVersion:3,acquiredAt:purchase.timestamp,acquiredBlock:purchase.block,acquisitionTxHash:BUY,purchaseTxHash:BUY,purchaseWallet:WALLET};
const oldNft={chain:'apertum',tokenAddress:OLD,tokenId:'90270',purchaseEvidence:oldStored};
caches=[oldNft];evidence.set(HASH,ev(HASH,detail,transfers,{amount:9,symbol:'APTM',contract:'native'}));setup();
const parsed=t.parse(transfers,detail,HASH);
assert.equal(parsed.oldId,'90270');assert.equal(parsed.newId,'46489');
for(const invalid of [{...detail,status:'error'},{...detail,to:{hash:OTHER}},{...detail,raw_input:'0x19da4078'},{...detail,block_number:0}])assert.equal(t.parse(transfers,invalid,HASH),null);
assert.equal(t.parse([...transfers,tr(OLD,'90271',WALLET,SINK)],detail,HASH),null);
assert.equal(t.parse([transfers[0],tr(NEW,'46489',ZERO,OTHER)],detail,HASH),null);
assert.equal(t.parse([transfers[0],{...transfers[1],transaction_hash:BUY}],detail,HASH),null);
assert.equal(t.parse([transfers[0],{...transfers[1],token:{...transfers[1].token,type:'ERC-20'}}],detail,HASH),null);
assert.ok(t.parse([...transfers,transfers[0]],detail,HASH),'Duplicate transfer items are deduplicated by NFT id');
let resolved=await api.resolveNftPurchaseEvidence({contract:NEW,tokenId:'46489',acquisitionWallet:WALLET,acquisitionTxHash:HASH,acquiredBlock:14772428});
assert.equal(resolved.status,'upgrade_price_inherited');assert.equal(resolved.resolverVersion,4);
assert.equal(resolved.purchase.amount,1000);assert.equal(resolved.purchaseTxHash,BUY);assert.equal(resolved.purchaseAt,purchase.timestamp);assert.equal(resolved.purchaseBlock,purchase.block);
assert.equal(resolved.acquisitionTxHash,HASH);assert.equal(resolved.acquiredAt,detail.timestamp);assert.equal(resolved.upgradePayments[0].amount,9,'Upgrade payments stay separate');
assert.equal(resolved.purchase.costBasisNftKey,OLD+'|90270');
const oldRow={contract:OLD,id:'90270',subtype:'Mining-Bot',name:'old',wallet:WALLET,current:false,purchase};
const newRow={contract:NEW,id:'46489',subtype:'Mining-Bot',name:'new',wallet:WALLET,current:true,purchase:resolved.purchase,upgrade:resolved.upgrade,acquisition_kind:'miner_upgrade'};
assert.equal(t.basis(oldRow),t.basis(newRow));assert.equal(t.status(oldRow),'migriert');assert.equal(t.kind(newRow),'Mining-Bot Upgrade');
const html=t.overview([oldRow,newRow]);assert.ok(html.includes('migriert'));assert.ok(html.includes('Upgrade-Tx'));assert.ok(html.replaceAll("'",'’').includes('Kaufpreise</span><strong>1’000 wUSDT</strong>'),html.slice(850,1300));
const totals=t.totals([oldRow,newRow]);assert.equal((totals.replaceAll("'",'’').match(/1’000 wUSDT/g)||[]).length,1);
// Reload: recover old -> new relationship from private persisted purchaseEvidence.
caches=[oldNft,{chain:'apertum',tokenAddress:NEW,tokenId:'46489',purchaseEvidence:resolved}];
const reload={...sandbox,window:{getCachedNftsForWalletId:()=>caches,getAllCachedNfts:()=>caches}};
vm.runInNewContext(source,reload);reload.window.DAO1Project.__test.setup({currentUser:{id:'A'},wallets:[{id:'wallet'}]},evidence,history);
assert.equal(reload.window.DAO1Project.__test.link(oldRow).newId,'46489');
user='B';caches=[];setup();assert.equal(t.link(oldRow),null,'Upgrade RAM links never cross user boundaries');
user='A';caches=[oldNft];evidence.set(MOVED,ev(MOVED,{status:'ok',timestamp:'2026-10-05T00:00:00Z',block_number:14774000},[]));history.set(NEW+'|46489',[transfers[1]]);setup();
resolved=await api.resolveNftPurchaseEvidence({contract:NEW,tokenId:'46489',acquisitionWallet:OTHER,acquisitionTxHash:MOVED,acquiredBlock:14774000});
assert.equal(resolved.purchaseTxHash,BUY);assert.equal(resolved.upgrade.txHash,HASH);assert.equal(resolved.acquisitionTxHash,MOVED);
// A genuine subsequent purchase of the new NFT has its own cost basis.
evidence.set(MOVED,ev(MOVED,{status:'ok',timestamp:'2026-10-05T00:00:00Z',block_number:14774000},[],{...purchase,amount:500,timestamp:'2026-10-05T00:00:00Z',block:14774000}));setup();
const resale=await api.resolveNftPurchaseEvidence({contract:NEW,tokenId:'46489',acquisitionWallet:OTHER,acquisitionTxHash:MOVED});
assert.equal(resale.purchase.amount,500);assert.equal(resale.purchaseTxHash,MOVED);assert.equal(resale.purchase.costBasisNftKey,NEW+'|46489');
// Missing original cost must remain unresolved, never 0 and never the migration payment.
caches=[];history.set(OLD+'|90270',[]);setup();
resolved=await api.resolveNftPurchaseEvidence({contract:NEW,tokenId:'46489',acquisitionWallet:WALLET,acquisitionTxHash:HASH});
assert.equal(resolved.purchase,null);assert.equal(resolved.checked,false);assert.equal(resolved.status,'upgrade_original_price_unresolved');
// An old price appearing later invalidates the unresolved in-session acquisition cache.
caches=[oldNft];
resolved=await api.resolveNftPurchaseEvidence({contract:NEW,tokenId:'46489',acquisitionWallet:WALLET,acquisitionTxHash:HASH});
assert.equal(resolved.purchase.amount,1000);
caches=[];
// No old cache: find the payment in the old NFT's actual pre-upgrade transfer chain.
history.set(OLD+'|90270',[tr(OLD,'90270',ZERO,WALLET,BUY,100000)]);evidence.set(BUY,ev(BUY,{timestamp:purchase.timestamp,block_number:100000},[],purchase));setup();
resolved=await api.resolveNftPurchaseEvidence({contract:NEW,tokenId:'46489',acquisitionWallet:WALLET,acquisitionTxHash:HASH});assert.equal(resolved.purchase.amount,1000);assert.equal(resolved.purchaseTxHash,BUY);
// Ambiguous migration: do not turn a migration payment into a new bot purchase.
history.clear();evidence.set(HASH,ev(HASH,detail,[...transfers,tr(OLD,'90271',WALLET,SINK)],{amount:9,symbol:'APTM'}));setup();
resolved=await api.resolveNftPurchaseEvidence({contract:NEW,tokenId:'46489',acquisitionWallet:WALLET,acquisitionTxHash:HASH});assert.equal(resolved.purchase,null);assert.equal(resolved.checked,false);
console.log('PASS: screenshot-derived 90270 -> 46489; method/contract/success/owner/uniqueness guards; inherited original price/date/tx; separate upgrade payment; unresolved price; historical lookup; wallet transfer; user isolation; purchase totals count once; HTML links/status.');
const appSource=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const ui={window:{DAO1Project:api,getAllCachedNfts:()=>caches},console,normalizeAddress:a=>String(a||'').toLowerCase(),lowerAddressForNft:a=>String(a||'').toLowerCase(),nftOwnershipInfo:()=>({firstOwnedWalletAddress:WALLET,firstOwnedBlock:14772428,acquisitionTxHash:HASH,acquisitionKind:'mint'}),nftWalletAddressById:()=>WALLET,escapeAttr:a=>String(a||''),nftOwnershipDate:a=>String(a||'')};
vm.runInNewContext(appSource.slice(appSource.indexOf('function nftPurchaseText('),appSource.indexOf('function centralNftPurchaseEvidenceNeedsRefresh(')),ui);
const item={chain:'apertum',tokenAddress:NEW,tokenId:'46489',purchaseEvidence:{resolverVersion:3,status:'price_verified',purchase}};
item.purchaseEvidence.inputEvidenceKey=ui.centralNftPurchaseEvidenceKey(item);assert.equal(ui.centralNftPurchaseEvidenceIsCurrent(item),false);
item.purchaseEvidence={resolverVersion:4,status:'upgrade_original_price_unresolved',upgrade:parsed,inputEvidenceKey:ui.centralNftPurchaseEvidenceKey(item)};
caches=[];assert.equal(ui.centralNftPurchaseEvidenceIsCurrent(item),true,'Unchanged unresolved evidence remains cacheable');
caches=[oldNft];assert.equal(ui.centralNftPurchaseEvidenceIsCurrent(item),false,'Newly resolved old price triggers one new inheritance pass');
item.purchaseEvidence={resolverVersion:4,status:'upgrade_price_inherited',upgrade:parsed,purchase,purchaseAt:purchase.timestamp,purchaseTxHash:BUY,inputEvidenceKey:ui.centralNftPurchaseEvidenceKey(item)};
assert.equal(ui.centralNftPurchaseEvidenceIsCurrent(item),true);
assert.equal(ui.nftPurchaseText(item).replaceAll("'",'’'),"1’000 wUSDT");
const provenance=ui.nftPurchaseProvenanceHtml(item);assert.ok(provenance.includes('Upgrade von #90270'));assert.ok(provenance.includes(BUY));assert.ok(provenance.includes(HASH));assert.ok(provenance.includes(purchase.timestamp));
caches=[oldNft,item];assert.equal(ui.nftMinerUpgradeInfo(oldNft).direction,'out');
console.log('PASS: central NFT targeted resolver invalidation, stable unresolved cache, source-price retry, persisted reverse link and original purchase provenance.');
