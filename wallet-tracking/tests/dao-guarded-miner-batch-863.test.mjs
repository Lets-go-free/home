import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const batch=edge.slice(edge.indexOf('// 8.63/8.65: explicitly administered'),edge.indexOf('// 8.61: general admin-only'));

test('8.63 requires the manual/admin flags and refuses live worker',()=>{
 assert.match(batch,/authenticateInspectAdmin\(request\)/);
 assert.match(batch,/DAO_REWARD_ENABLE_TEST_IMPORT/);
 assert.match(batch,/DAO_REWARD_ENABLE_LIVE_WORKER/);
 assert.match(batch,/firstTxHash/);
});
test('8.64 accepts a standard five-group UUID for the batch wallet',()=>{
 const valid='8a3c5dc6-0610-482d-a327-3f3ba03db158';
 const guard=batch.match(/!\/(\^\[0-9a-f\].+?\$)\/i\.test\(String\(body\.walletId\|\|''\)\)/);
 assert.ok(guard,'batch wallet UUID guard is present');
 const uuidPattern=new RegExp(guard[1],'i');
 assert.equal(uuidPattern.test(valid),true);
 assert.equal(uuidPattern.test(`${valid}-1111`),false);
});
test('8.63 bounds the queue to three and does not activate background processing',()=>{
 assert.match(batch,/maxCandidates=extended\?10:3/);
 assert.match(batch,/\.limit\(maxCandidates\)/);
 assert.match(batch,/45000/);
 assert.doesNotMatch(batch,/cron\.schedule|queue\.insert|process\(job/);
});
test('8.65 adds explicit 10-candidate plan and commit without changing 8.63 modes',()=>{
 for(const mode of ['admin-miner-batch-plan-863','admin-miner-batch-commit-863',
                    'admin-miner-batch-plan-865','admin-miner-batch-commit-865'])
  assert.ok(batch.includes(mode),`${mode} is present`);
 assert.match(batch,/maxCandidates=extended\?10:3/);
 assert.match(batch,/body\.mode\.endsWith\('-865'\)/);
 assert.match(batch,/selected\[0\]\.txHash!==body\.firstTxHash/);
});
test('8.63 handles all three candidate stages with independent RPC guards',()=>{
 assert.match(batch,/c\.payout_status==='pending'/);
 assert.match(batch,/wallettracking_dao_verify_single_native_payout_843/);
 assert.match(batch,/current\.nft_id==null/);
 assert.match(batch,/aggregateMinerRewardEvents857/);
 assert.match(batch,/evaluateMinerPreview856/);
 assert.match(batch,/wallettracking_dao_assign_multi_miner_nft_861/);
 assert.match(batch,/wallettracking_dao_preview_verified_miner_849/);
 assert.match(batch,/wallettracking_dao_finalize_single_native_claim/);
 assert.match(batch,/finalized\?\.claimsCreated!==1/);
});
test('8.63 never proceeds to a second transaction after a guard failure',()=>{
 assert.match(batch,/catch\(e\)\{row\.error=daoErrorSummary\(e\);stopped='guard-failed';break;\}/);
 assert.match(batch,/if\(!selected\.length\|\|selected\[0\]\.txHash!==body\.firstTxHash\)/);
 assert.match(batch,/if\(!commit\)return reply/);
});
