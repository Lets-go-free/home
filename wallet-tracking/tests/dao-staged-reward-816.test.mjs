import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,readdirSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const src=readFileSync(new URL('supabase/functions/dao-reward-refresh/index.ts',base),'utf8');
const migration=readdirSync(new URL('supabase/migrations/',base)).find(x=>x.endsWith('_dao_guarded_staged_reward_phase_816.sql'));
assert.ok(migration);
const sql=readFileSync(new URL('supabase/migrations/'+migration,base),'utf8');
const html=readFileSync(new URL('index.html',base),'utf8');
const route=src.slice(src.indexOf("if(body.mode==='cron-staged-one')"),src.indexOf('// 8.14: manually authorized'));
test('version is at least 8.16 and index footer/build consistent',()=>{
 assert.match(html,/window.APP_VERSION="8\.(?:16|17)"/);
 const build=html.match(/window.BUILD_ID="([\d-]+)"/)?.[1];assert.ok(build);
 assert.ok(html.includes('Phase '+html.match(/window.APP_VERSION="([^"]+)/)?.[1]+' · Build '+build));
});
test('staged mode remains manual, fixed shape, disabled if live worker enabled',()=>{
 assert.match(route,/DAO_REWARD_ENABLE_MULTI_WALLET_TEST/);
 assert.match(route,/DAO_REWARD_ENABLE_LIVE_WORKER/);
 assert.match(route,/Object.keys\(body\).some\(k=>k!=='mode'\)/);
 assert.match(route,/wallettracking_dao_reward_claim_staged_v3/);
 assert.match(route,/wallettracking_dao_reward_finish_staged_v3/);
});
test('one-claim processing reuses existing strict canonical worker but never reimports staged data',()=>{
 assert.match(route,/processSingleNativeClaim\([^\n]+false,true,true\)/);
 assert.match(src,/skipImport\?\{mode:'already-staged'/);
 assert.match(route,/created>1/);
 assert.match(route,/referralPosting|referralFlowsVerified/);
});
test('cannot finish with pending claims or unverified referral coverage',()=>{
 assert.match(route,/one\.status==='no_eligible_claim'&&unresolved===0/);
 assert.match(route,/exceptionCount===0&&referralCoverage/);
 assert.match(route,/address===REFERRAL_WALLET\|\|Number\(incomingWusdt\|\|0\)===0/);
 assert.match(sql,/canonical_existing_verified IS DISTINCT FROM true/);
 assert.match(sql,/audit_classification IS NULL/);
});
test('lease token, state, budgets and service-role permissions are enforced',()=>{
 assert.match(sql,/a\.step_count<8 AND a\.failure_count<3/);
 assert.match(sql,/state='reward_running' AND lease_token=p_lease AND lease_until>now\(\)/);
 assert.match(sql,/FOR UPDATE OF a SKIP LOCKED LIMIT 1/);
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.match(sql,/REVOKE ALL ON FUNCTION/);
 assert.match(sql,/GRANT EXECUTE/);
});
test('no automatic cron scheduling or bulk reward writes in migration',()=>{
 assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|INSERT INTO public\.project_nft_claims/i);
 assert.doesNotMatch(route,/cron\.schedule/);
});
