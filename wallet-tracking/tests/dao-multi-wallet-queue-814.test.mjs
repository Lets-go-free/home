import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/migrations/20261109211827_dao_guarded_multi_wallet_queue_814.sql',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('v2 lease token is allocated atomically and checked for every transition',()=>{
 assert.match(sql,/lease_token=gen_random_uuid\(\)/);
 assert.match(sql,/state='running' AND lease_token=p_lease AND lease_until>now\(\)/);
 assert.match(sql,/FOR UPDATE OF a SKIP LOCKED LIMIT 1/);
});
test('bounded daily steps and failure retries, no partial reset',()=>{
 assert.match(sql,/a.step_count < 8 AND a.failure_count < 3/);
 assert.match(sql,/failure_count=failure_count\+CASE WHEN p_state='failed'/);
 assert.doesNotMatch(sql,/attempt_count=0/);
});
test('security and existing project isolation',()=>{
 assert.match(sql,/auth.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.match(sql,/REVOKE ALL ON FUNCTION/);
 assert.match(sql,/project_key='dao1'/);
 assert.doesNotMatch(sql,/wallettracking_reward_claim\(/);
});
test('manually gated mode only, with no arbitrary wallet selection',()=>{
 const route=src.slice(src.indexOf("if(body.mode==='cron-multi-wallet-one')"),src.indexOf("// 8.13: explicit single-wallet integration rehearsal"));
 assert.match(route,/DAO_REWARD_ENABLE_MULTI_WALLET_TEST/);
 assert.match(route,/DAO_REWARD_ENABLE_LIVE_WORKER/);
 assert.match(route,/Object.keys\(body\).some\(k=>k!=='mode'\)/);
 assert.match(route,/process\(\{user_id:job.user_id,wallet_id:job.wallet_id\},true\)/);
 assert.doesNotMatch(route,/processSingleNativeClaim/);
 assert.match(route,/wallettracking_dao_reward_transition_v2/);
});
test('preview reads only and version/build reflect 8.14',()=>{
 assert.match(src,/cron-multi-wallet-preview/);
 assert.match(html,/window.APP_VERSION="8\.14"/);
 assert.match(html,/Phase 8\.14 · Build/);
});
