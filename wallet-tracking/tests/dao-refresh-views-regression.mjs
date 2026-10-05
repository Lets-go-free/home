import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const dao=fs.readFileSync(new URL('../projects/dao1/dao1.js',import.meta.url),'utf8');
const start=dao.indexOf('  let dao1BotOverviewRun=0;');
const end=dao.indexOf('  function dao1TeamMembershipLabel',start);
let displayed=[],networkReads=0;
const el={style:{display:''},innerHTML:'old missing-price view'};
const ctx=vm.createContext({console,document:{getElementById:id=>id==='dao1-subtab-overview'?el:null},
 allProjectWalletOptions:()=>[],loadAllApertumTransactionRows:async()=>{networkReads++;return []},loadAllAssetFlowRows:async()=>{networkReads++;return []},
 transactionRows:[],transactionAssetFlows:[],dao1BotOverviewRows:()=>[{id:'46482',wallet:'w',purchase:null}],
 dao1ApplyCachedAcquisitionEvidence:n=>({...n,purchase:{amount:10000,symbol:'wUSDT'}}),dashboardRewardPeriods:()=>({}),
 dao1OverviewTeamCount:async()=>{networkReads++;return 5},dao1OverviewSummaryHtml:()=>'',
 dao1BotOverviewTableHtml:rows=>{displayed=rows;return String(rows[0].purchase.amount)},escapeHtml:String});
vm.runInContext(dao.slice(start,end),ctx);
await vm.runInContext('renderDAO1BotOverview({cacheOnly:true})',ctx);
assert.equal(el.innerHTML,'10000');assert.equal(displayed[0].purchase.amount,10000);
assert.equal(networkReads,0,'Final view rebuild must never call transaction/history/team APIs');
// Preserve an explicit Legacy selection; fresh sessions start on APTMDAO.
assert.match(dao,/let dao1TeamTreeMode="aptmdao";/);
assert.match(dao,/if\(dao1TeamTreeMode==="wallet"\)dao1TeamTreeMode="aptmdao";/);
console.log('PASS: final cached Bot view displays saved price with zero API calls; fresh team default is APTMDAO.');
// A slow older render must not overwrite the final cached view, even on failure.
let rejectOlder;
ctx.loadAllApertumTransactionRows=()=>new Promise((resolve,reject)=>{rejectOlder=reject});
const older=vm.runInContext('renderDAO1BotOverview()',ctx);
await vm.runInContext('renderDAO1BotOverview({cacheOnly:true})',ctx);
rejectOlder(new Error('older request failed'));
await older;
assert.equal(el.innerHTML,'10000');
console.log('PASS: slow older failed render cannot overwrite newer cached price view.');
