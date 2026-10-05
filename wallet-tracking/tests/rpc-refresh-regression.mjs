import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
function part(start,end){return src.slice(src.indexOf(start),src.indexOf(end,src.indexOf(start)));}
const ctx=vm.createContext({assert,console,AbortController,TypeError,setTimeout(fn,ms){if(ms<2000)queueMicrotask(fn);return 1;},clearTimeout(){},walletData:{},NATIVE_SYMBOL:{matic:"POL"},CHAIN_CONFIG:{matic:{walletType:'evm',balanceProvider:'evm_rpc'}},CHAIN_META:{matic:{label:'Polygon'}},wallets:[],currentUser:{id:'u'},document:{getElementById(){return {disabled:false};}},window:{},events:[],renderResults(){},renderSafeTokenTable(){},renderCustomTokenList(){},renderAllocationChart(){},renderDashboard(){},renderWalletDataFreshness(){},renderCacheStatusNote(){},markRequestAudit(){},runDataJob:async(label,job)=>job(),renderCentralRefreshProgress(){}});
vm.runInContext(part('// Nur vorübergehende Transportfehler','function decodeAbiString')+part('async function evmRpcBatch','// Cache für Dezimalstellen')+part('function walletAddressForChain','async function mergeTlnBsc')+part('let walletRefreshStates =','async function loadWalletRefreshStates')+part('async function markWalletRefreshFailed','function confirmedSpamAddressesForWallet')+part('function walletDataFreshnessMarkup','function renderCentralRefreshProgress')+part('async function finishAllRefresh','let dashboardProjectSummaryPromise')+part('async function loadAll(options','// ---- Rendering ----'),ctx);
await vm.runInContext(`(async()=>{
 let tries=0;fetch=async()=>{tries++;return tries<3?{ok:false,status:529}:{ok:true,json:async()=>({result:'0x10'})};};
 assert.equal(await evmRpcCall('rpc','eth_getBalance',[]),'0x10');assert.equal(tries,3);
 tries=0;fetch=async()=>{tries++;return {ok:false,status:401};};await assert.rejects(evmRpcCall('rpc','x',[]),/401/);assert.equal(tries,1);
 tries=0;fetch=async()=>{tries++;throw Object.assign(new Error(),{name:'AbortError'});};await assert.rejects(evmRpcBatch('rpc',[{to:'x',data:'x'}]),/Timeout/);assert.equal(tries,3);
 tries=0;fetch=async()=>{tries++;return {ok:true,json:async()=>[{id:1,result:'0x02'},{id:0,result:'0x01'}]};};assert.deepEqual(Array.from(await evmRpcBatch('rpc',[{to:'a'},{to:'b'}])),['0x01','0x02']);assert.equal(tries,1);
 configuredRpcUrl=()=> 'rpc';fetchEvmAddressInfo=async()=>{throw new Error('RPC HTTP 529');};
 const w={id:'w',label:'Chris',evm:'0xabc'};wallets=[w];walletData.w={matic:{native:42,tokens:[{amount:7}]}};
 const result=await loadWalletChain(w,'matic');assert.equal(result.ok,false);assert.match(result.error,/Chris · Polygon · Bestände/);assert.equal(walletData.w.matic.native,42);assert.equal(walletData.w.matic.tokens[0].amount,7);assert.equal(walletData.w.matic.stale,true);
 saveWalletRefreshState=async(w,c,t,p)=>{walletRefreshStates.set(refreshStateKey(w.id,c,t),p);return p;};
 const date='2026-09-30T12:00:00Z';walletRefreshStates.set('w|matic|balances',{last_refreshed_at:date,last_checked_block:88,data_version:1});
 await markWalletRefreshFailed(w,'matic','balances');const failed=walletRefreshStates.get('w|matic|balances');assert.equal(failed.last_refreshed_at,date);assert.equal(failed.last_checked_block,88);assert.equal(refreshedToday(w,'matic','balances'),false);
 escapeAttr=String;assert.match(walletDataFreshnessMarkup(),/Polygon: Abruf fehlgeschlagen/);
 fetchEvmAddressInfo=async()=>({native:43,tokens:[]});await loadWalletChain(w,'matic');assert.equal(walletData.w.matic.native,43);assert.equal(walletData.w.matic.stale,undefined);
 loadAllCore=async()=>({failures:[],progress:[]});refreshDashboardProjectSummaries=async()=>{events.push('summaries');};createSnapshot=async()=>{events.push('snapshot');};finishAllRefresh=async(core)=>{events.push('finish');return core;};
 window.DAO1Project={runDailyDeltaRefresh:async()=>{events.push('dao');return {transactions:{ok:true},team:{ok:true}};}};
 await loadAll();assert.deepEqual(Array.from(events),['dao','summaries','snapshot','finish']);
 events.length=0;window.DAO1Project.runDailyDeltaRefresh=async()=>{events.push('dao');throw new Error('Timeout');};const partial=await loadAll();assert.match(partial.failures[0].error,/Apertum.*Timeout/);assert.deepEqual(Array.from(events),['dao','summaries','finish']);
 events.length=0;window.DAO1Project.runDailyDeltaRefresh=async()=>({transactions:{ok:false},team:{ok:false}});assert.equal((await loadAll()).failures.length,2);assert.equal(events.includes('snapshot'),false);
})()`,ctx);
// Exercise the real core failure path with only a Polygon balance, no projects/NFTs.
vm.runInContext(part('async function loadAllCore','async function finishAllRefresh'),ctx);
await vm.runInContext(`(async()=>{
 const w={id:'w',label:'Chris',evm:'0xabc'};wallets=[w];walletData.w={matic:{native:9,tokens:[]}};
 refreshAllCurrentPrices=async()=>{};mergeTlnBscStakingCacheIntoWalletData=async()=>{};mergeProjectStakingCacheIntoWalletData=async()=>{};loadDashboardLpPositionCache=async()=>{};refreshNftsForWallet=async()=>({count:0});
 refreshProjectWallet=async()=>{};GENERIC_LP_PROJECT_KEY='lp';
 let balanceReads=0,activityReads=0;fetchEvmAddressInfo=async()=>{balanceReads++;throw new Error('RPC Timeout');};
 evmRelevantActivitySince=async()=>{activityReads++;return {changed:false};};
 walletRefreshStates.set('w|matic|balances',{last_result:'failed',last_checked_at:new Date().toISOString(),last_refreshed_at:'2026-09-30',last_checked_block:88,data_version:1});
 const r=await loadAllCore({automatic:true});assert.equal(balanceReads,1);assert.equal(activityReads,0);assert.equal(r.failures.length,1);assert.equal(walletRefreshStates.get('w|matic|balances').last_result,'failed');assert.equal(walletRefreshStates.get('w|matic|balances').last_checked_block,88);assert.equal(walletData.w.matic.native,9);
})()`,ctx);
console.log('RPC/Refresh regression passed');
vm.runInContext(part('async function createSnapshot','async function deleteSnapshot'),ctx);
await vm.runInContext(`(async()=>{
 buildCurrentSnapshotItems=()=>[{amount:9}];let ops=[],filters=[],failItems=false,failHeader=false;
 sb={from(table){return {insert(rows){ops.push('insert:'+table);if(table==='snapshot_items')return Promise.resolve({error:failItems?{message:'items failed'}:null});return {select(){return {single:async()=>({data:{id:'new'},error:failHeader?{message:'header failed'}:null})};}};},delete(){ops.push('delete:'+table);const q={eq(k,v){filters.push([k,v]);return q;},neq(k,v){filters.push(['neq:'+k,v]);return q;},then(resolve){return Promise.resolve({error:null}).then(resolve);}};return q;}};}};
 await createSnapshot(true);assert.deepEqual(Array.from(ops),['insert:snapshots','insert:snapshot_items','delete:snapshots']);assert.equal(filters.some(x=>x[0]==='neq:id'&&x[1]==='new'),true);
 ops=[];filters=[];failItems=true;await assert.rejects(createSnapshot(true),/items failed/);assert.equal(filters.some(x=>x[0]==='id'&&x[1]==='new'),true);assert.equal(filters.some(x=>x[0]==='is_automated'),false);
 ops=[];failHeader=true;await assert.rejects(createSnapshot(true),/header failed/);assert.deepEqual(Array.from(ops),['insert:snapshots']);
})()`,ctx);
console.log('Snapshot preservation regression passed');
