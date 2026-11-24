import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../projects/tln-vow/tln-vow-discovery.js',import.meta.url),'utf8');
const start=src.indexOf('async function savePersistentErc20Cache(wallet,cache){');
const end=src.indexOf('\nconst TECHNICAL_PROCESS_SESSION_CACHE=',start);
assert(start>=0&&end>start);
let row=null,conflicts=0,updates=0,inserts=0,reads=0;
const clone=x=>x===null?null:JSON.parse(JSON.stringify(x));
const table={
 select:()=>{
  const q={eq:()=>q,maybeSingle:async()=>{reads++;return {data:clone(row),error:null}}};return q;
 },
 update:next=>{
  const filters={};const q={eq:(key,val)=>{filters[key]=val;return q},select:async()=>{
    updates++;
    if(row&&Object.entries(filters).every(([k,v])=>row[k]===v)){
      row=clone(next);return {data:[{wallet_id:next.wallet_id}],error:null};
    }
    conflicts++;return {data:[],error:null};
  }};return q;
 },
 insert:next=>({select:async()=>{
  inserts++;
  if(row)return {data:null,error:{code:'23505'}};
  row=clone(next);return {data:[{wallet_id:next.wallet_id}],error:null};
 }})
};
const wallet='0x'+'a'.repeat(40),user='00000000-0000-4000-8000-000000000001',walletId='00000000-0000-4000-8000-000000000002';
const t=(id)=>({uniqueId:id,hash:'0x'+'1'.repeat(64),rawContract:{address:'0x'+'b'.repeat(40),value:'5'},from:wallet,to:'0x'+'c'.repeat(40),blockNum:'0x1',_direction:'out'});
const logs=[];
const ctx={currentUserId:user,stakingScanDbCacheAvailable:true,privateWalletIdForAddress:async()=>walletId,STAKING_SCAN_CACHE_TABLE:'tln_vow_staking_scan_cache',STAKING_SCAN_CACHE_KEY:'erc20-history-v1',sb:{from:()=>table},norm:x=>String(x||'').toLowerCase(),compactTransferForCache:x=>clone(x),transferIdentity:x=>x.uniqueId,log:(...args)=>logs.push(args),short:x=>x.slice(0,6),Date,Number,Map,Array,Math,console};
vm.runInNewContext(src.slice(start,end),ctx);
const save=(transfers,latest)=>ctx.savePersistentErc20Cache(wallet,{rows:transfers,latestBlock:latest,completeFromBlock:0});
assert.equal(await save([t('one')],100),true);assert.equal(inserts,1);assert.equal(row.last_scanned_block,100);
assert.equal(await save([t('two')],120),true);assert.equal(updates,1);assert.equal(row.payload.length,2);
assert.equal(await save([t('three')],110),true);assert.equal(row.last_scanned_block,120);assert.equal(row.payload.length,3);
assert.equal(await save([t('one')],130),true);assert.equal(row.payload.length,3);assert.equal(row.last_scanned_block,130);
// Simulate a different writer winning after our first read but before UPDATE.
let steal=true;
const orig=table.update;
table.update=next=>{
 const q=orig(next);const oldSelect=q.select;
 q.select=async()=>{
   if(steal){steal=false;row={...row,updated_at:new Date(Date.parse(row.updated_at)+10).toISOString(),payload:[...row.payload,t('racer')],last_scanned_block:145}}
   return oldSelect();
 };return q;
};
assert.equal(await save([t('four')],140),true);
assert(conflicts>=1);assert.equal(row.last_scanned_block,145);assert.equal(row.payload.length,5);
assert.equal(new Set(row.payload.map(x=>x.uniqueId)).size,5);
// Safe failure: persistent interference exhausts retry limit without overwrites.
table.update=next=>{const q=orig(next);q.select=async()=>{row={...row,updated_at:new Date(Date.parse(row.updated_at)+10).toISOString()};return {data:[],error:null}};return q};
assert.equal(await save([t('five')],150),false);
assert.equal(row.payload.some(x=>x.uniqueId==='five'),false);
assert(logs.length>0);
console.log('9.90 manual cache: insert, dedup merge, monotone cursor, concurrent CAS retry, guarded abort passed');
