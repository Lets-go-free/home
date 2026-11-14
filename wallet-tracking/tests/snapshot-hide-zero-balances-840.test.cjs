const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
const start=src.indexOf('function snapshotItemBelongsToWallet(');
const end=src.indexOf('function renderTable(',start);
assert(start>0&&end>start);
const c={console,Number,Map,Set,Array,historyChainKey:x=>({arb:'arbitrum',matic:'polygon'}[x]||x),
  visibleSnapshots:()=>c.snaps,priceForToken:()=>null,nativePrices:{},currentUser:{id:'a'}};
vm.createContext(c);vm.runInContext(src.slice(start,end),c);
c.snaps=[{id:'s1',items:[{wallet_id:'w1',chain:'eth',is_native:true,amount:'0',price_usd:1900},
  {wallet_id:'w1',chain:'bsc',address:'0xold',symbol:'OLD',amount:'3',price_usd:2},
  {wallet_id:'w1',chain:'bsc',address:'0xzero',symbol:'ZERO',amount:'0',price_usd:5}]},
  {id:'s2',items:[{wallet_id:'w1',chain:'bsc',address:'0xold',symbol:'OLD',amount:'0',price_usd:2}]}];
const w={dbId:'w1'};
assert.equal(c.hasVisibleSnapshotDataForChain('eth',w),false,'zero native has no presence');
assert.equal(c.hasVisibleSnapshotDataForChain('bsc',w),true,'historically positive chain retained');
let r=c.attachSnapshotColumns([{symbol:'BNB',isNative:true,amount:0,chain:'bsc'},
  {symbol:'USDT',isNative:false,address:'0xzero',amount:0,chain:'bsc'},
  {symbol:'CURRENT',isNative:false,address:'0xcurrent',amount:2,chain:'bsc'}],'bsc',w);
assert.equal(r.length,2,'zero-only rows omitted; current and historical rows kept');
assert(r.some(x=>x.isHistoricalOnly&&x.symbol.startsWith('OLD')));
assert(!r.some(x=>x.symbol.startsWith('ZERO')));
assert(r.some(x=>x.symbol==='CURRENT' && x.snapshotValues.s1===null),'missing history is not zero');
r=c.attachSnapshotColumns([], 'eth',w);assert.equal(r.length,0,'no historical-only zero native row');
c.snaps=[{id:'s3',items:[{wallet_id:'w1',chain:'bsc',address:'0xzero',symbol:'ZERO',amount:'0'}]}];
assert.equal(c.attachSnapshotColumns([], 'bsc',w).length,0,'all-zero snapshots hidden');
console.log('PASS 8.40: zero-only hidden; historical positive retained; missing is null');
