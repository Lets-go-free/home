import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const batch=code.slice(code.indexOf("if(body?.mode==='verify-native-payout-batch-844'"),code.indexOf("if(body?.mode==='check-pending-native-payouts-test-wallet')"));
test('8.44 retains four-only guard and shared 8.43 proof',()=>{
 assert.match(batch,/const maxGroups=multi\?3:1/);
 assert.match(batch,/\.limit\(4\)/);
 assert.match(batch,/\.eq\('payout_status','pending'\)/);
 assert.match(batch,/\.is\('audit_classification',null\)/);
 assert.match(batch,/\.eq\('canonical_existing_verified',false\)/);
 assert.match(batch,/wallettracking_dao_verify_single_native_payout_843/);
 assert.match(batch,/nativeClaimPayout\(address,rows\[0\]\)/);
 assert.match(batch,/stopped='rpc_not_verified';break/);
 assert.match(batch,/stopped='verification_error'/);
 assert.match(batch,/authenticateInspectAdmin\(request\)/);
 assert.match(batch,/DAO_REWARD_ENABLE_LIVE_WORKER/);
 assert.doesNotMatch(batch,/\.from\('project_nft_claims'\)\.insert|\.from\('project_transactions'\)\.update/);
});
