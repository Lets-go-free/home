import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const part=code.slice(code.indexOf("if(body?.mode==='verify-native-payout-batch-844'"),code.indexOf("if(body?.mode==='check-pending-native-payouts-test-wallet')"));
test('8.45 is admin-only and permits no external limits',()=>{
 assert.match(part,/body\?\.mode==='verify-native-payout-multi-batch-845'/);
 assert.match(part,/Object\.keys\(body\)\.some\(k=>!\['mode','walletId'\]\.includes\(k\)\)/);
 assert.match(part,/authenticateInspectAdmin\(request\)/);
 assert.match(part,/DAO_REWARD_ENABLE_TEST_IMPORT/);
 assert.match(part,/DAO_REWARD_ENABLE_LIVE_WORKER/);
});
test('8.45 fixed 3 by 4, sequential, checkpointing via 8.43 RPC',()=>{
 assert.match(part,/const maxGroups=multi\?3:1/);
 assert.match(part,/\.limit\(4\)/);
 assert.match(part,/const deadline=Date\.now\(\)\+\(multi\?50000:45000\)/);
 assert.match(part,/for\(let group=0;group<maxGroups;group\+\+\)/);
 assert.match(part,/\.eq\('payout_status','pending'\)/);
 assert.match(part,/wallettracking_dao_verify_single_native_payout_843/);
 assert.match(part,/if\(stopped!=='batch_complete'\)break/);
 assert.match(part,/maxBatches:3,maxPayouts:12,timeBudgetMs:50000/);
 assert.doesNotMatch(part,/\.from\('project_nft_claims'\)\.insert|\.from\('project_transaction_asset_flows'\)\.update/);
});
