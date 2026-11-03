import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const code=fs.readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
test('test mode is explicitly enabled and fixed to the chosen referral address',()=>{
 assert.match(code,/DAO_REWARD_ENABLE_TEST_INSPECT/);
 assert.match(code,/const INSPECT_ADDRESS='0x239c5822a0d2a67e629d7a3b5c8180721e228b47'/);
 assert.match(code,/body\?\.mode==='inspect-test-wallet'/);
});
test('ordinary worker is disabled unless separately enabled',()=>{
 assert.match(code,/DAO_REWARD_ENABLE_LIVE_WORKER/);
 assert.ok(code.indexOf("DAO_REWARD_ENABLE_LIVE_WORKER")<code.indexOf('const minute=localMinute();if(minute<245'));
});
test('test path does not call process or queue claim',()=>{
 const start=code.indexOf('async function inspectTestAddress()');
 const end=code.indexOf('Deno.serve(async request=>');
 const part=code.slice(start,end);
 assert.ok(start>0 && end>start);
 assert.doesNotMatch(part,/\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(|process\(job\)/);
});
