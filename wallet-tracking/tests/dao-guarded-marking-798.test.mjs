import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const filename=readdirSync(new URL('../supabase/migrations/',import.meta.url)).find(f=>f.endsWith('_dao_guarded_existing_claim_marking_798.sql'));
const sql=readFileSync(new URL('../supabase/migrations/'+filename,import.meta.url),'utf8');
test('fixed-wallet manual RPC requires admin, import gate, disabled worker and client expectations',()=>{
 const section=src.split("if(body?.mode==='mark-matched-existing-test-wallet'){")[1].split("if(body?.mode==='classify-existing-test-wallet')")[0];
 for(const term of ['DAO_REWARD_ENABLE_TEST_IMPORT','DAO_REWARD_ENABLE_LIVE_WORKER','authenticateInspectAdmin','findInspectWalletMatches','expectedAlreadyMarked','expectedStrictMatches','wallettracking_dao_mark_existing_paid_claims_guarded'])assert.ok(section.includes(term),term);
 assert.doesNotMatch(section,/body\?\.walletAddress|body\?\.walletId/);
});
test('atomic SQL enforces exact expectation and checks returned count',()=>{
 for(const term of ['pg_advisory_xact_lock','v_marked_before <> p_expected_marked','v_eligible <> p_expected_eligible','v_updated <> v_eligible','v_marked_after <> v_marked_before+v_updated','wallettracking_dao_mark_existing_paid_claims(p_user,p_wallet,500)'])assert.ok(sql.includes(term),term);
});
test('SQL remains service-only and does not modify canonical claims',()=>{
 assert.match(sql,/auth\.role\(\)/);assert.match(sql,/REVOKE ALL/);
 assert.doesNotMatch(sql,/UPDATE public\.project_transactions/i);
 assert.doesNotMatch(sql,/UPDATE public\.project_transaction_asset_flows/i);
});
