const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'..','js','app.js'),'utf8');
const block=src.slice(src.indexOf('let dailyBalanceHistoryLoaded = null;'),src.indexOf('// ---- Verlauf-Grafik'));
const table=src.slice(src.indexOf('function visibleSnapshots()'),src.indexOf('function explorerUrlForWallet('));
const context={renderResults:()=>{},console,Date,Set,Map,Number,Array,Math,String,escapeAttr:x=>x,fmt:(v)=>String(v),fmtPrice:(v)=>String(v),fmtUsd:v=>String(v),fmtChange:()=>'',badge:()=>'',snapshots:[],CHAIN_META:{},nativePrices:{},priceForToken:()=>null,document:{getElementById:()=>({innerHTML:'',textContent:'',setAttribute(){},removeAttribute(){}})},alert:msg=>{throw Error(msg)},currentUser:{id:'u1'}};
const rows=[{sample_day:'2026-11-14',captured_at:'2026-11-14T01:00:00Z',wallet_count:1,position_count:2,total_usd:9,unpriced_positions:0}];
const chain={
 select(){return this},eq(){return this},order(){return this},
 limit(){return Promise.resolve({data:rows,error:null})},
 single(){return Promise.resolve({data:{sample_day:'2026-11-14',captured_at:'2026-11-14T01:00:00Z',positions:[
  {wallet_id:'w1',chain:'matic',symbol:'WETH',address:'0xaaa',is_native:false,amount:'2',price_usd:'4'},
  {wallet_id:'w2',chain:'polygon',symbol:'WETH',address:'0xaaa',is_native:false,amount:'20',price_usd:'4'}
 ]},error:null})}
};
context.sb={from(){return chain}};
vm.createContext(context);
vm.runInContext(block+'\n'+table,context);
(async()=>{
 await vm.runInContext('loadDailyBalanceHistory()',context);
 await vm.runInContext("toggleDailyBalanceSnapshot('2026-11-14',true)",context);
 const out=vm.runInContext(`({count:visibleSnapshots().length,a:snapshotValueForKey(visibleSnapshots()[0],'polygon','0xaaa',{dbId:'w1'}),b:snapshotValueForKey(visibleSnapshots()[0],'polygon','0xaaa',{dbId:'w3'}),sum:snapshotValueForKey(visibleSnapshots()[0],'polygon','0xaaa',[{dbId:'w1'}]),extra:attachSnapshotColumns([], 'polygon',{dbId:'w1'}).length})`,context);
 assert.deepStrictEqual(JSON.parse(JSON.stringify(out)),{count:1,a:2,b:null,sum:2,extra:1});
 await vm.runInContext("toggleDailyBalanceSnapshot('2026-11-14',false)",context);
 assert.equal(vm.runInContext('visibleSnapshots().length',context),0);
 console.log('PASS: lazy load, selection, chain aliases, wallet isolation, missing history, historical token, deselection');
})().catch(e=>{console.error(e);process.exit(1)});
