import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8'),dao=fs.readFileSync(new URL('../projects/dao1/dao1.js',import.meta.url),'utf8');
const slice=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const events=[];let active=0;const stateWrites=[];
const ctx=vm.createContext({console,Date,Promise,window:{},events,beginDataJobUi(){active++;},endDataJobUi(){active--;},getContext:()=>({currentUser:{id:'u'},refreshedToday(){},saveWalletRefreshState:async(...args)=>stateWrites.push(args)}),sb:{from(){const q={select(){return q},eq(){return q},order(){return q},limit(){return Promise.resolve({data:[],error:null})}};return q;}},CHAIN_KEY:'apertum',ensureMounted:async()=>{},refreshConfig:async()=>{},loaded:true,allProjectWalletOptions:()=>[{id:'w'}],txFilterWallet:'__all',refreshTransactionHistory:async()=>{events.push('tx');return {ok:true}},loadDAO1OwnedDidRoots:async()=>{},dao1OwnedDidRoots:[1],aptmdaoOwnedDidRoots:[2],dao1TeamDiscovery:{legacy:{},aptmdao:{}},dao1HydrateVisibleDidOwners:async(system)=>{events.push('owner-'+system)},loadDashboardSummary:async()=>{events.push('summary')},scanOldDao1TreeCore:async()=>{events.push('legacy')},scanAptmdaoTreeCore:async()=>{events.push('aptm')}});
vm.runInContext('let dataJobTail=Promise.resolve();'+slice(app,'function runDataJob(', 'window.isDataJobActive')+slice(dao,'  const daoTreeScanInflight=', '  const aptmdaoTreeCacheDiag=')+dao.split('\n').find(line=>line.includes('async function scanAptmdaoTree(options='))+slice(dao,'  async function runDailyDeltaRefresh(', '  async function ensureLoaded()'),ctx);
const deadline=(p)=>Promise.race([p,new Promise((_,reject)=>{const t=setTimeout(()=>reject(new Error('Deadlock: nested job did not finish')),500);t.unref();})]);
await deadline(vm.runInContext("runDataJob('central',()=>runDailyDeltaRefresh({force:true,withinDataJob:true}))",ctx));
assert.deepEqual(events,['tx','legacy','aptm','owner-legacy','owner-aptmdao','summary']);assert.equal(active,0);assert.equal(stateWrites.length,2);
// A separate user/admin job must still wait behind an active central job.
events.length=0;let release;ctx.hold=new Promise(resolve=>{release=resolve});
const parent=vm.runInContext("runDataJob('parent',async()=>{events.push('parent');await hold;events.push('parent-end')})",ctx);
await Promise.resolve();await Promise.resolve();
const other=vm.runInContext('scanOldDao1Tree({checkChain:true})',ctx);
await Promise.resolve();assert.deepEqual(events,['parent']);release();await deadline(Promise.all([parent,other]));assert.deepEqual(events,['parent','parent-end','legacy']);assert.equal(active,0);
// Failure releases the queue, then a fresh run can complete.
ctx.scanOldDao1TreeCore=async()=>{throw new Error('team failed')};
await assert.rejects(deadline(vm.runInContext("runDataJob('central',()=>runDailyDeltaRefresh({force:true,withinDataJob:true}))",ctx)),/team failed/);assert.equal(active,0);
ctx.scanOldDao1TreeCore=async()=>events.push('legacy');await deadline(vm.runInContext("runDataJob('central',()=>runDailyDeltaRefresh({force:true,withinDataJob:true}))",ctx));assert.equal(active,0);
// Verify the actual application passes explicit ownership of the job.
assert.match(app,/runDailyDeltaRefresh\(\{force:true,useCachedCurrentNfts:true,withinDataJob:true\}\)/);
console.log('PASS: nested DAO1/APTMDAO team refresh completes; independent jobs stay serial; errors release queue; app passes parent-job ownership.');
