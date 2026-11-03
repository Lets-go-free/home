import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const code=fs.readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const route=code.slice(code.indexOf('Deno.serve(async request=>'));
test('test mode uses real auth user and existing UUID-bound admin record',()=>{
 assert.match(code,/sb\.auth\.getUser\(match\[1\]\)/);
 assert.match(code,/\.from\('admins'\)/);
 assert.match(code,/\.eq\('user_id',session\.user\.id\)/);
 assert.match(route,/authenticateInspectAdmin\(request\)/);
});
test('test mode precedes shared daily secret; other modes remain secret protected',()=>{
 assert.ok(route.indexOf("body?.mode==='inspect-test-wallet'")<route.indexOf("request.headers.get('x-wallet-refresh-secret')"));
 assert.ok(route.indexOf("request.headers.get('x-wallet-refresh-secret')")<route.indexOf("DAO_REWARD_ENABLE_LIVE_WORKER"));
});
test('inspector is fixed, read only, and opt in',()=>{
 assert.match(code,/const INSPECT_ADDRESS='0x239c5822a0d2a67e629d7a3b5c8180721e228b47'/);
 assert.match(route,/DAO_REWARD_ENABLE_TEST_INSPECT/);
 const block=code.slice(code.indexOf('async function inspectTestAddress()'),code.indexOf('// The manual inspector uses'));
 assert.doesNotMatch(block,/\.(?:insert|upsert|delete|update|rpc)\(/);
});
