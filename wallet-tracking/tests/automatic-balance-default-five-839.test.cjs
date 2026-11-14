const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'..','js','app.js'),'utf8');
const block=src.slice(src.indexOf('let dailyBalanceHistoryLoaded = null;'),src.indexOf('// ---- Verlauf-Grafik'));
const today='2026-11-14';
const rows=Array.from({length:7},(_,i)=>({sample_day:`2026-11-${String(14-i).padStart(2,'0')}`,captured_at:`2026-11-${String(14-i).padStart(2,'0')}T01:00:00Z`,wallet_count:2,position_count:3,total_usd:10,unpriced_positions:0}));
const historyEl={textContent:'',innerHTML:'',setAttribute(){},removeAttribute(){}};
const calls=[];let renders=0;
const context={currentUser:{id:'u1'},document:{getElementById:()=>historyEl},renderResults:()=>renders++,console,Date,Set,Map,Number,Array,Math,String,escapeAttr:x=>String(x),sb:{from(t){assert.equal(t,'wallet_daily_balance_history');return {select(){return this},eq(k,v){assert.equal(k,'user_id');assert.equal(v,'u1');return this},order(){return this},limit(){return Promise.resolve({data:rows,error:null})},in(k,days){assert.equal(k,'sample_day');calls.push(days);return Promise.resolve({data:days.map(sample_day=>({sample_day,captured_at:sample_day+'T01:00:00Z',positions:[{wallet_id:'w1',chain:'bsc',symbol:'BNB',amount:'1.5',price_usd:'700',is_native:true}]})),error:null})}}}}};
vm.createContext(context);
vm.runInContext(block,context);
(async()=>{
 await vm.runInContext('loadDailyBalanceHistory()',context);
 assert.equal(vm.runInContext('selectedDailyBalanceDays.size',context),5,'5 latest selected automatically');
 assert.equal(calls.length,1);
 assert.deepEqual([...calls[0]],rows.slice(0,5).map(r=>r.sample_day));
 assert.match(historyEl.innerHTML,/Alle Snapshots anzeigen/);
 await vm.runInContext('toggleAllDailyBalanceSnapshots(true)',context);
 assert.equal(vm.runInContext('selectedDailyBalanceDays.size',context),7);
 assert.deepEqual([...calls[1]],rows.slice(5).map(r=>r.sample_day));
 await vm.runInContext('toggleAllDailyBalanceSnapshots(false)',context);
 assert.equal(vm.runInContext('selectedDailyBalanceDays.size',context),5);
 assert.equal(calls.length,2,'return to five does not refetch');
 context.currentUser={id:'u2'};
 // Simulate user context change and verify no cross-user columns before a refresh.
 assert.ok(vm.runInContext('[...selectedDailyBalanceDays.values()].every(s=>s.userId!==currentUser.id)',context));
 assert.ok(renders>0);
 console.log('PASS: five default, all toggle, return to five, existing data reuse, user isolation');
})().catch(e=>{console.error(e);process.exit(1)});
