import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectClaimPayoutCoverage,noPayoutEvidenceAllowed} from '../supabase/functions/dao-reward-refresh/payout-coverage.ts';
const wallet='0x'+'1'.repeat(40),contract='0x'+'2'.repeat(40),token='0x'+'3'.repeat(40),hash='0x'+'a'.repeat(64);
const tx={tx_hash:hash,block_number:403915,selector:'0x86bb8f37',to_address:contract};
const detail={hash,block_number:tx.block_number,raw_input:tx.selector,from:{hash:wallet},to:{hash:contract},status:'ok',value:'0'};
const flow={transaction_hash:hash,block_number:tx.block_number,from:{hash:contract},to:{hash:wallet},total:{value:'1'},token:{type:'ERC-20',address_hash:token,decimals:'18'}};
async function check({t=tx,d=detail,tokens={items:[],next_page_params:null},internals={items:[],next_page_params:null},read}={}){
 const urls=[];
 const result=await inspectClaimPayoutCoverage(t,wallet,async u=>{
  urls.push(u);
  if(read)return read(u,urls.length);
  if(u.includes('/token-transfers'))return {next_page_params:null,...tokens};
  if(u.includes('/internal-transactions'))return {next_page_params:null,...internals};
  return d;
 },'https://example.test/api/v2');
 return {...result,urls};
}
test('all three zero-reward fixtures require transaction-local complete pages; no hardcoded tx whitelist',async()=>{
 for(const block of [403915,10791488,11254937]){
  const r=await check({t:{...tx,block_number:block},d:{...detail,block_number:block}});
  assert.equal(r.coverage.complete,true);assert.equal(noPayoutEvidenceAllowed(r.coverage,[]),true);
  assert.equal(r.urls.length,3);
 }
});
test('new APTMDAO Miner Claim uses the same coverage proof',async()=>{
 const r=await check({t:{...tx,selector:'0x19da4078'},d:{...detail,raw_input:'0x19da4078'}});
 assert.equal(noPayoutEvidenceAllowed(r.coverage,[]),true);
});
test('unknown ERC20 sender and tiny incoming token values prevent negative classification',async()=>{
 const r=await check({tokens:{items:[{...flow,from:{hash:token}}]}});
 assert.equal(r.coverage.complete,true);assert.equal(noPayoutEvidenceAllowed(r.coverage,[]),false);
});
test('native proxy payment prevents negative evidence, including just one wei',async()=>{
 const r=await check({internals:{items:[{...flow,total:undefined,token:undefined,value:'1',status:'ok'}]}});
 assert.equal(r.coverage.observed_incoming,true);assert.equal(noPayoutEvidenceAllowed(r.coverage,[]),false);
});
test('unavailable or incomplete pages, unknown token, missing amounts and outcomes stay reviewable',async()=>{
 for(const options of [
  {tokens:{}},{tokens:{items:[],next_page_params:{index:1}}},
  {tokens:{items:[{...flow,token:{...flow.token,type:'ERC-721'}}]}},
  {tokens:{items:[{...flow,total:{}}]}},
  {tokens:{items:[{...flow,transaction_hash:'0x'+'b'.repeat(64)}]}},
  {internals:{items:[{...flow,value:'0'}]}},
  {read:()=>({items:[]})},
  {read:()=>{throw Error('HTTP 429 with private URL')}}]){
  const r=await check(options);assert.equal(r.coverage.complete,false);
  assert.equal(noPayoutEvidenceAllowed(r.coverage,[]),false);
  assert.doesNotMatch(r.reason,/private|https/);
 }
});
test('transaction identity, block, sender, selector and success must match',async()=>{
 for(const patch of [{hash:'0x'+'b'.repeat(64)},{block_number:1},{from:{hash:token}},{raw_input:'0x12345678'},{status:'error'},{value:null}]){
  const r=await check({d:{...detail,...patch}});assert.equal(r.coverage.complete,false);
 }
});
test('later pages are read and incoming transfers there block negative evidence',async()=>{
 const r=await check({read:u=>u.includes('/token-transfers?')?{items:[flow],next_page_params:null}:
  u.includes('/token-transfers')?{items:[{...flow,total:{value:'0'}}],next_page_params:{index:2}}:
  u.includes('/internal-transactions')?{items:[],next_page_params:null}:detail});
 assert.equal(r.coverage.complete,true);assert.equal(r.coverage.token_count,2);
 assert.equal(noPayoutEvidenceAllowed(r.coverage,[]),false);
});
test('looping cursors and page budget cannot certify completeness',async()=>{
 for(const loop of [true,false]){
  const r=await check({read:(u,n)=>u.includes('/token-transfers')?
   {items:[{...flow,total:{value:'0'}}],next_page_params:{index:loop?2:n}}:detail});
  assert.equal(r.coverage.complete,false);
 }
});
test('new persisted evidence or corrupt incoming flow defeats an otherwise complete negative scan',async()=>{
 const r=await check();
 for(const f of [{direction:'eingang',amount_raw:'1'},{direction:'eingang',amount_raw:null},{direction:'intern',amount_raw:'1'},{amount_raw:'0'}])
  assert.equal(noPayoutEvidenceAllowed(r.coverage,[f]),false);
 assert.equal(noPayoutEvidenceAllowed(r.coverage,[{direction:'eingang',amount_raw:'0'}]),true);
});
