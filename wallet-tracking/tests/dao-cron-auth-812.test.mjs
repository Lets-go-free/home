import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const route=src.slice(src.indexOf('Deno.serve(async request=>'));
test('dedicated strong DAO cron secret, no wallet refresh secret reuse',()=>{
 assert.match(src,/Deno\.env\.get\('DAO_REWARD_CRON_SECRET'\)/);
 assert.doesNotMatch(src,/WALLET_DAILY_REFRESH_SECRET|x-wallet-refresh-secret/);
 assert.match(src,/CRON_SECRET\.length<32\|\|supplied\.length<32/);
 assert.match(src,/crypto\.subtle\.digest\('SHA-256'/);
});
test('no implicit worker, authenticated read-only cron probe, live guard',()=>{
 assert.ok(route.indexOf("body?.mode!=='cron-auth-check'")<route.indexOf('authorizedDaoCron(request)'));
 assert.ok(route.indexOf('authorizedDaoCron(request)')<route.indexOf("body.mode==='cron-auth-check'"));
 assert.ok(route.indexOf("body.mode==='cron-auth-check'")<route.indexOf("DAO_REWARD_ENABLE_LIVE_WORKER')!=='true'"));
 assert.match(route,/skipped:'DAO staging worker disabled/);
 assert.match(route,/wallettracking_reward_stage/);
 assert.doesNotMatch(route,/cron\.schedule|CREATE EXTENSION/);
});
