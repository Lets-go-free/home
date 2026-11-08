import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {stripTypeScriptTypes} from 'node:module';import vm from 'node:vm';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const driver=src.slice(src.indexOf('async function processSingleNativeClaim('),src.indexOf('// Read-only, manually enabled single-address readiness check.'));
const candidate={tx_hash:'0x'+'a'.repeat(64),claim_block:16000000,status:'unassigned_miner',nft_id:null,nft_contract:null,payout_status:'pending',payout_checked_at:null};
async function run({partial=false,referralPartial=false,selected=candidate,proof={verified:true,reason:'historical-transfer-owner'},failure=null,retry=false}={}){
 const calls=[];const updates=[];
 const ctx={PROJECT:'dao1',CHAIN:'apertum',
  async process(job,stageOnly){calls.push(['import',stageOnly]);return {transactionScan:{complete:!partial},flowScan:{complete:true},referralScan:{complete:!referralPartial}}},
  loadAddress:async()=> '0x'+'1'.repeat(40),
  historicalNftOwnership:async()=>{calls.push(['owner']);return proof},
  verifyCandidatePayouts:async(job,address,candidates)=>{calls.push(['payout',candidates.length]);return {verifiedPayoutClaims:1}},
  sb:{rpc:async(name,args)=>{calls.push([name,JSON.parse(JSON.stringify(args))]);
   if(name.includes('next_native'))return {data:selected,error:null};
   return {data:{status:'completed',claimsCreated:1},error:failure}},
   from:table=>{const q={update:value=>{updates.push([table,value]);return q},eq:()=>q,in:()=>q,then:resolve=>Promise.resolve({error:null}).then(resolve)};return q;}}};
 vm.runInNewContext(stripTypeScriptTypes(driver),ctx);
 const result=await ctx.processSingleNativeClaim({user_id:'user',wallet_id:'wallet'},retry);return {result,calls,updates};
}
test('partial raw or referral import stops before candidate or reward mutation',async()=>{
 for(const options of [{partial:true},{referralPartial:true}]){
  const r=await run(options);assert.equal(r.result.status,'import_partial');assert.deepEqual(r.calls,[['import',true]]);
 }
});
test('no new eligible claim is a legitimate no-work result; historical candidates are not forced into the new path',async()=>{
 const r=await run({selected:null});assert.equal(r.result.status,'no_eligible_claim');assert.equal(r.result.claimsCreated,0);
 assert.equal(r.calls.length,2);
});
test('one unassigned miner imports, verifies payout, then finalizes exactly once',async()=>{
 const r=await run();assert.equal(r.result.claimsCreated,1);
 assert.deepEqual(r.calls.map(c=>c[0]),['import','wallettracking_dao_next_native_claim_candidate','payout','wallettracking_dao_finalize_single_native_claim']);
 assert.equal(r.calls[2][1],1);assert.equal(r.updates.length,0);
});
test('known candidate owner is checked independently; missing history never sets ownership_verified',async()=>{
 const selected={...candidate,status:'pending',nft_contract:'0x'+'2'.repeat(40),nft_id:'7'};
 let r=await run({selected});assert.equal(r.updates[0][1].status,'ownership_verified');
 r=await run({selected,proof:{verified:false,reason:'pagination-incomplete'}});assert.equal(r.updates.length,0);
 r=await run({selected,proof:{verified:false,reason:'owned-by-other-wallet'}});assert.equal(r.updates[0][1].status,'unverified');
});
test('existing verified payout is never rewritten; retry flag is passed without any change to wallet scope',async()=>{
 const r=await run({selected:{...candidate,payout_status:'verified'},retry:true});assert.ok(!r.calls.some(c=>c[0]==='payout'));
 assert.deepEqual(r.calls[1][1],{p_user:'user',p_wallet:'wallet',p_retry_blocked:true});
});
test('canonical failure propagates to manual route; never reports completion',async()=>{
 await assert.rejects(()=>run({failure:new Error('canonical insert failed')}));
});
const route=src.slice(src.indexOf(" if(body?.mode==='process-next-native-claim-test-wallet')"),src.indexOf(" if(body?.mode==='classify-existing-test-wallet')"));
async function invoke({importEnabled='true',live='false',permission={ok:true},matches=[{user_id:'fixed-user',id:'fixed-wallet'}],retryBlocked=false}={}){
 const calls=[];const ctx={body:{mode:'process-next-native-claim-test-wallet',retryBlocked,user_id:'hostile',wallet_id:'hostile'},request:{},Response,
  Deno:{env:{get:k=>k==='DAO_REWARD_ENABLE_TEST_IMPORT'?importEnabled:live}},authenticateInspectAdmin:async()=>permission,findInspectWalletMatches:async()=>matches,
  processSingleNativeClaim:async(job,retry)=>{calls.push([JSON.parse(JSON.stringify(job)),retry]);return {status:'no_eligible_claim',claimsCreated:0}}};
 const response=await vm.runInNewContext('(async()=>{'+route+'})()',ctx);return {status:response.status,calls,body:await response.json()};
}
test('route requires opt-in, worker disabled, Admin JWT and exactly one fixed registered wallet',async()=>{
 for(const [options,status] of [[{importEnabled:'false'},403],[{live:'true'},409],[{permission:{ok:false,status:401,error:'JWT'}},401],
  [{permission:{ok:false,status:403,error:'admin'}},403],[{matches:[]},409],[{matches:[{},{}]},409],[{retryBlocked:'true'},400]]){
  const r=await invoke(options);assert.equal(r.status,status);assert.equal(r.calls.length,0);
 }
});
test('route ignores caller-supplied identity, accepts explicit bounded retry and returns stage diagnostics',async()=>{
 const r=await invoke({retryBlocked:true});assert.equal(r.status,200);assert.equal(r.body.status,'no_eligible_claim');
 assert.deepEqual(r.calls,[[{user_id:'fixed-user',wallet_id:'fixed-wallet'},true]]);
 assert.doesNotMatch(route,/wallettracking_reward_(claim|stage|finish)|ENABLE_LIVE_WORKER.*set/);
});
