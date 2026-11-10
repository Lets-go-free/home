import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const route=src.slice(src.indexOf('Deno.serve(async request=>'));
const start=route.indexOf("if(body.mode==='cron-test-wallet-one')");
const end=route.indexOf("if(Deno.env.get('DAO_REWARD_ENABLE_LIVE_WORKER')!=='true'",start);
const block=route.slice(start,end);
test('cron authentication precedes fixed-wallet rehearsal',()=>{
 assert.ok(route.indexOf('authorizedDaoCron(request)') < start);
 assert.match(route,/body\?\.mode!=='cron-test-wallet-one'/);
 assert.match(block,/DAO_REWARD_ENABLE_TEST_IMPORT/);
 assert.match(block,/DAO_REWARD_ENABLE_LIVE_WORKER/);
});
test('no arbitrary wallet, no forced retries, one-claim canonical pipeline only',()=>{
 assert.match(block,/body\.walletId!==undefined/);
 assert.match(block,/body\.userId!==undefined/);
 assert.match(block,/body\.address!==undefined/);
 assert.match(block,/body\.retryBlocked!==undefined/);
 assert.match(block,/findInspectWalletMatches\(\)/);
 assert.match(block,/matches\.length!==1/);
 assert.match(block,/processSingleNativeClaim\(\{user_id:selected\.user_id,wallet_id:selected\.id\},false,true\)/);
 assert.match(block,/queueTouched:false,dailyCompletion:false/);
 assert.doesNotMatch(block,/wallettracking_reward_(claim|finish|stage|continue)/);
});
test('version and safe installation docs',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/window\.APP_VERSION="8\.(?:13|14|15|16|17)"/);
 const doc=readFileSync(new URL('../docs/releases/8.13-dao-fixed-wallet-cron-rehearsal.md',import.meta.url),'utf8');
 assert.match(doc,/schreibend/);
 assert.match(doc,/kein automatischer Job/i);
});
