import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const src=readFileSync(new URL('supabase/functions/dao-reward-refresh/index.ts',root),'utf8');
const html=readFileSync(new URL('index.html',root),'utf8');
const batch=src.slice(src.indexOf("if(body.mode==='cron-multi-wallet-batch')"),src.indexOf('// 8.14: manually authorized, exactly one encrypted wallet',src.indexOf("if(body.mode==='cron-multi-wallet-batch')")));
test('8.19 manual batch is allowlisted and requires dedicated cron authentication',()=>{
 assert.match(src,/body\?\.mode!=='cron-multi-wallet-batch'/);
 assert.match(src,/if\(!await authorizedDaoCron\(request\)\)/);
 assert.match(batch,/Object\.keys\(body\)\.some\(k=>k!=='mode'\)/);
 assert.match(batch,/DAO_REWARD_ENABLE_MULTI_WALLET_TEST/);
 assert.match(batch,/DAO_REWARD_ENABLE_LIVE_WORKER/);
});
test('8.19 batch is capped by fixed step and time budgets',()=>{
 assert.match(batch,/MAX_BATCH_STEPS=10,MAX_BATCH_ELAPSED_MS=65000/);
 assert.match(batch,/for\(let i=0;i<MAX_BATCH_STEPS;i\+\+\)/);
 assert.match(batch,/Date\.now\(\)-started>=MAX_BATCH_ELAPSED_MS/);
 assert.doesNotMatch(batch,/body\.(?:limit|maxSteps|walletId|userId)/);
});
test('8.19 batch reuses v2 atomic leases, covers failures, and stages only',()=>{
 assert.match(batch,/sb\.rpc\('wallettracking_dao_reward_claim_v2'/);
 assert.match(batch,/sb\.rpc\('wallettracking_dao_reward_transition_v2'/);
 assert.match(batch,/p_lease:job\.lease_token/);
 assert.match(batch,/p_state:'failed'/);
 assert.match(batch,/stopped:'lease_transition_error'/);
 assert.match(batch,/status:'failed'/);
 assert.match(batch,/process\(\{user_id:job\.user_id,wallet_id:job\.wallet_id\},true\)/);
 assert.match(batch,/claimsCreated:0,referralPosting:'disabled'/);
 assert.doesNotMatch(batch,/processSingleNativeClaim|wallettracking_dao_reward_claim_staged_v3|referralPosting:'enabled'/);
});
test('8.19 remains visibly versioned',()=>{
 assert.match(html,/window\.APP_VERSION="8\.19"/);
 assert.match(html,/Phase 8\.19 · Build/);
});
