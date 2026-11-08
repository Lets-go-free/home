import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectClaimPayoutCoverage,noPayoutEvidenceAllowed} from '../supabase/functions/dao-reward-refresh/payout-coverage.ts';
// Real Internal-TX response supplied by the user. TX details/token pages below
// are controlled fixtures: this is not a new independent live-chain test.
const real=JSON.parse(readFileSync(new URL('./fixtures/dao-internals-403915.json',import.meta.url),'utf8'));
const hash=real.items[0].transaction_hash,block=real.items[0].block_number;
const wallet='0x'+'1'.repeat(40),contract='0x'+'2'.repeat(40);
const tx={tx_hash:hash,block_number:block,selector:'0x86bb8f37',to_address:contract};
const detail={hash,block_number:block,raw_input:tx.selector,from:{hash:wallet},to:{hash:contract},status:'ok',value:'0'};
async function inspect(items=real.items,pageOverride={}){
 return inspectClaimPayoutCoverage(tx,wallet,async url=>url.endsWith('/internal-transactions')?
  {items,next_page_params:null,...pageOverride}:url.endsWith('/token-transfers')?
  {items:[],next_page_params:null}:detail,'https://example.test/api/v2');
}
test('real 17 internal calls with success=true, error=null and no status all pass',async()=>{
 assert.equal(real.items.length,17);
 assert.ok(real.items.every(x=>x.success===true&&x.error===null&&x.value==='0'&&!Object.hasOwn(x,'status')));
 const r=await inspect();
 assert.equal(r.coverage.complete,true);assert.equal(r.coverage.internal_count,17);
 assert.equal(r.coverage.internal_transactions,true);assert.equal(noPayoutEvidenceAllowed(r.coverage,[]),true);
});
test('status-only success remains supported; explicit boolean success does not require status',async()=>{
 for(const patch of [{success:true},{success:true,status:'ok'},{success:undefined,status:'ok'},
  {success:null,status:'success'},{success:true,status:null},{success:true,status:''}]){
  const r=await inspect([{...real.items[0],...patch}]);assert.equal(r.coverage.complete,true);
 }
});
test('failure or contradictory fields block negative evidence',async()=>{
 for(const patch of [{success:false},{success:false,status:'ok'},{success:true,status:'error'},
  {success:true,status:'reverted'},{success:true,status:'unknown'},{success:true,error:'execution reverted'},
  {success:'true'},{success:'false',status:'ok'}]){
  const r=await inspect([{...real.items[0],...patch}]);
  assert.equal(r.reason,'internal-outcome-incomplete');assert.equal(r.coverage.complete,false);
  assert.equal(noPayoutEvidenceAllowed(r.coverage,[]),false);
 }
});
test('missing outcome is not silently assumed successful',async()=>{
 for(const patch of [{success:undefined},{success:null},{success:undefined,status:''}]){
  const r=await inspect([{...real.items[0],...patch}]);assert.equal(r.coverage.complete,false);
 }
});
test('successful native receipt in boolean format still blocks no_payout_evidence',async()=>{
 const r=await inspect([{...real.items[0],to:{hash:wallet},value:'1'}]);
 assert.equal(r.coverage.complete,true);assert.equal(r.coverage.observed_incoming,true);
 assert.equal(noPayoutEvidenceAllowed(r.coverage,[]),false);
});
test('real response with incomplete continuation is still rejected',async()=>{
 const r=await inspect(real.items,{next_page_params:{index:17}});
 assert.equal(r.coverage.complete,false);assert.equal(noPayoutEvidenceAllowed(r.coverage,[]),false);
});
