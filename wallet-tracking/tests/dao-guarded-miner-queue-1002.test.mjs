import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const src=readFileSync(new URL('supabase/functions/dao-reward-refresh/index.ts',root),'utf8');
const dir=new URL('supabase/migrations/',root);
const sql=readFileSync(new URL(readdirSync(dir).find(x=>x.endsWith('_dao_guarded_miner_rewards_and_queue_1002.sql')),dir),'utf8');
const code=stripTypeScriptTypes(src.slice(src.indexOf('async function runOneStagedReward(){'),src.indexOf('Deno.serve(async request=>{')));
async function run({one,unresolved=0,exceptions=0,step=3,referralCoverage=true,current=null}={}){
 const calls=[]; const job={user_id:'user',wallet_id:'wallet',lease_token:'lease',step_count:step};
 const sb={rpc:async(name,params)=>{calls.push([name,params]);
  if(name.endsWith('claim_staged_v3'))return {data:[job]};
  if(name.endsWith('readiness_v3'))return {data:{candidates:581,unresolved,unrecognizedExceptions:exceptions}};
  if(name.endsWith('finish_staged_v3'))return {};throw Error(name);},
  from(table){const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:table==='project_scan_state'?{last_scan_result:referralCoverage?'complete':'partial'}:current}),then(resolve){resolve({count:0})}};return q;}};
 const context={sb,localDay:()=> '2026-11-24',loadAddress:async()=> 'wallet-address',processSingleNativeClaim:async()=>one,
  verifiedReferralSummary:async()=>({verifiedFlows:9,unverifiedIncomingWusdt:189}),PROJECT:'dao1',CHAIN:'apertum',REFERRAL_WUSDT_TOKEN:'wusdt',REFERRAL_FLOW_SCAN:'ref',daoErrorSummary:e=>String(e)};
 const result=await vm.runInNewContext(code+'\nrunOneStagedReward()',context);
 const finish=calls.find(x=>x[0].endsWith('finish_staged_v3'))?.[1];return {result,finish};
}
const candidateTxHash='0x'+'a'.repeat(64);
const blocked={status:'blocked',claimsCreated:0,reason:'assigned-miner-history-proof-open',candidateTxHash,ownershipProofReason:'prior-transfer-recipient',payoutReason:'already-verified'};
test('persisted candidate block allows other pending claims; diagnostic fields preserved',async()=>{
 const {result,finish}=await run({one:blocked,unresolved:39,current:{claim_pipeline_status:'blocked',claim_pipeline_checked_at:'2026-11-24T20:00Z',payout_status:'verified'}});
 assert.equal(finish.p_state,'staged');assert.equal(finish.p_error,null);assert.equal(result.body.claimTxHash,candidateTxHash);assert.equal(result.body.claimReason,blocked.reason);
});
test('no selectable claim and unresolved work becomes a non-selectable queue block',async()=>{
 const {result,finish}=await run({one:{status:'no_eligible_claim',claimsCreated:0},unresolved:3});
 assert.equal(result.body.status,'blocked');assert.equal(JSON.parse(finish.p_error).reason,'no-eligible-claim-with-open-readiness');
});
test('result not persisted stops instead of repeatedly selecting a pending candidate',async()=>{
 const {finish}=await run({one:blocked,unresolved:39,current:{claim_pipeline_status:'pending',payout_status:'verified'}});
 assert.equal(finish.p_state,'blocked');assert.equal(JSON.parse(finish.p_error).reason,'candidate-result-not-persisted');
});
test('32-step budget is explicit; clean completion still takes precedence',async()=>{
 let {finish}=await run({one:blocked,step:32,unresolved:39});assert.equal(finish.p_state,'blocked');assert.equal(JSON.parse(finish.p_error).reason,'daily-step-budget-exhausted');
 ({finish}=await run({one:{status:'no_eligible_claim',claimsCreated:0},step:32}));assert.equal(finish.p_state,'completed');assert.equal(finish.p_error,null);
});
test('readiness and referral coverage still gate completion; one claim limit retained',async()=>{
 for(const opts of [{exceptions:1},{referralCoverage:false}]){const {finish}=await run({one:{status:'no_eligible_claim',claimsCreated:0},...opts});assert.equal(finish.p_state,'blocked');}
 const {result,finish}=await run({one:{status:'completed',claimsCreated:2,candidateTxHash}});assert.equal(result.statusCode,500);assert.equal(finish.p_state,'failed');
});
test('SQL source preserves positive miner proof, complete persisted history, ambiguity guard, atomic companions and permissions',()=>{
 assert.match(sql,/c\.status='ownership_verified' AND c\.proof_reason='prior-transfer-recipient'/);
 assert.match(sql,/h\.is_complete=true/);assert.match(sql,/tr\.block_number=c\.claim_block/);assert.match(sql,/tr\.block_number=\(SELECT max\(p\.block_number\)/);
 assert.match(sql,/lower\(t\.from_address\)/);assert.match(sql,/c\.payout_token_address='native'/);
 assert.match(sql,/central-technical-decimals-unavailable/);assert.match(sql,/metadata_available:=false/);
 assert.match(sql,/claim_nft_id=CASE WHEN c\.nft_id IS NOT NULL/);assert.match(sql,/rollback claim/);assert.match(sql,/ON CONFLICT\(user_id,project_key,chain_key,tx_hash\) DO NOTHING/);
 assert.match(sql,/p_state IN \('failed','blocked'\)/);assert.match(sql,/failure_count=failure_count\+CASE WHEN p_state='failed'/);
 assert.match(sql,/d\.claim_pipeline_reason='ownership-or-bot-assignment-open'/);assert.match(sql,/assigned-miner-history-proof-open/);
 assert.match(sql,/FROM PUBLIC,anon,authenticated/);assert.match(sql,/TO service_role/);
 assert.doesNotMatch(sql,/cron\.schedule|cron\.alter_job/);
});
