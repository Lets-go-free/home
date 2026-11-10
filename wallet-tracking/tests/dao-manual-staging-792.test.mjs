import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const src=fs.readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const serve=src.slice(src.indexOf('Deno.serve(async request=>'));
const staging=src.slice(src.indexOf('async function process(job:any,stageOnly=false)'),src.indexOf('// Read-only, manually enabled single-address'));
test('manually imported wallet is chosen from the fixed test address only',()=>{
 assert.match(serve,/findInspectWalletMatches\(\)/);
 assert.match(serve,/matches\.length!==1/);
 assert.match(src,/const INSPECT_ADDRESS='0x239c5822a0d2a67e629d7a3b5c8180721e228b47'/);
 const importRoute=serve.slice(serve.indexOf("if(body?.mode==='import-test-wallet')"),serve.indexOf('// Only explicit DAO cron routes')) ;
 assert.doesNotMatch(importRoute,/body\.wallet_id|body\.walletAddress|body\.address/);
});
test('manual import requires both JWT admin and separate opt-in flag',()=>{
 assert.match(serve,/DAO_REWARD_ENABLE_TEST_IMPORT/);
 assert.match(serve,/authenticateInspectAdmin\(request\)/);
 assert.match(serve,/DAO_REWARD_ENABLE_LIVE_WORKER'\)==='true'/);
 assert.ok(serve.indexOf("body?.mode==='import-test-wallet'")<serve.indexOf('authorizedDaoCron(request)'));
});
test('manual import uses one explorer page per stream',()=>{
 assert.match(staging,/const pageLimit=stageOnly\?1:MAX_PAGES_PER_INVOCATION/);
 assert.equal((staging.match(/},pageLimit\)/g)||[]).length,3);
});
test('staging exits before candidate verification and all canonical valuation calls',()=>{
 const index=staging.indexOf('if(stageOnly){');
 assert.ok(index>0);
 const rest=staging.slice(index);
 assert.ok(rest.indexOf('return {mode:')<rest.indexOf('verifyPendingCandidates(job,address)'));
 assert.ok(rest.indexOf('return {mode:')<rest.indexOf('wallettracking_dao_apply_exact_target_anchors'));
 assert.ok(rest.indexOf('return {mode:')<rest.indexOf('wallettracking_dao_create_verified_legacy_claims'));
});
test('existing scheduled flow stays secret protected and disabled',()=>{
 assert.match(serve,/authorizedDaoCron\(request\)/);
 assert.match(serve,/DAO_REWARD_ENABLE_LIVE_WORKER'\)!=='true'/);
});
