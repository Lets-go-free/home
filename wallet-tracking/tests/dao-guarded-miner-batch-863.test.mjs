import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const batch=edge.slice(edge.indexOf('// 8.63: explicitly administered'),edge.indexOf('// 8.61: general admin-only'));

test('8.63 requires the manual/admin flags and refuses live worker',()=>{
 assert.match(batch,/authenticateInspectAdmin\(request\)/);
 assert.match(batch,/DAO_REWARD_ENABLE_TEST_IMPORT/);
 assert.match(batch,/DAO_REWARD_ENABLE_LIVE_WORKER/);
 assert.match(batch,/firstTxHash/);
});
test('8.63 bounds the queue to three and does not activate background processing',()=>{
 assert.match(batch,/\.limit\(3\)/);
 assert.match(batch,/45000/);
 assert.doesNotMatch(batch,/cron\.schedule|queue\.insert|process\(job/);
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
