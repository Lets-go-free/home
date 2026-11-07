import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const base=new URL('../',import.meta.url);
const worker=fs.readFileSync(new URL('supabase/functions/dao-reward-refresh/index.ts',base),'utf8');
const migration=fs.readFileSync(new URL('supabase/migrations/20261107184158_dao_existing_canonical_claims_793.sql',base),'utf8');
test('existing claims classification is manually admin-gated and single-wallet scoped',()=>{
 const route=worker.slice(worker.indexOf("if(body?.mode==='classify-existing-test-wallet')"),worker.indexOf("if(body?.mode==='import-test-wallet')"));
 assert.match(route,/DAO_REWARD_ENABLE_TEST_IMPORT/);
 assert.match(route,/DAO_REWARD_ENABLE_LIVE_WORKER/);
 assert.match(route,/authenticateInspectAdmin\(request\)/);
 assert.match(route,/findInspectWalletMatches\(\)/);
 assert.match(route,/matches\.length!==1/);
 assert.doesNotMatch(route,/body\.(address|wallet_id|user_id)/);
});
test('only separate candidate evidence columns are updated, not canonical claims',()=>{
 assert.match(migration,/ADD COLUMN IF NOT EXISTS canonical_existing_verified boolean/);
 assert.match(migration,/canonical_existing_checked_at/);
 assert.match(migration,/t\.claim_reward_aptm > 0/);
 assert.match(migration,/t\.claim_reward_usd > 0/);
 assert.match(migration,/f\.amount=t\.claim_reward_aptm/);
 assert.match(migration,/f\.flow_key=concat\('claim-native:'/);
 assert.match(migration,/c\.canonical_existing_verified IS DISTINCT FROM true/);
 assert.doesNotMatch(migration,/UPDATE public\.(project_transactions|project_transaction_asset_flows|project_nft_claims)/);
 assert.doesNotMatch(migration,/SET status=/);
});
test('service role only, input constraints, transaction',()=>{
 assert.match(migration,/IF auth\.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.match(migration,/p_limit > 500/);
 assert.match(migration,/Wallet ownership mismatch/);
 assert.match(migration,/BEGIN;[\s\S]*COMMIT;/);
 assert.match(migration,/REVOKE ALL ON FUNCTION/);
});
test('manual endpoint does not invoke explorer or full reward pipeline',()=>{
 const route=worker.slice(worker.indexOf("if(body?.mode==='classify-existing-test-wallet')"),worker.indexOf("if(body?.mode==='import-test-wallet')"));
 assert.doesNotMatch(route,/process\(|paginate\(|apply_exact_target_anchors/);
 assert.match(route,/classifyExistingClaims\(/);
});
