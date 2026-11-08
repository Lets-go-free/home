import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const file=readdirSync(new URL('../supabase/migrations/',import.meta.url)).find(n=>n.includes('dao_strict_existing_native_claims_797'));
const sql=readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8');
test('read only mode is explicitly admin gated',()=>{
 assert.match(src,/body\?\.mode==='reconcile-test-wallet'/);
 assert.match(src,/DAO_REWARD_ENABLE_TEST_INSPECT/);
 const section=src.split('async function reconcileTestClaims(){')[1].split('// The manual inspector uses')[0];
 assert.doesNotMatch(section,/\.update\(|\.upsert\(|\.insert\(|sb\.rpc\(/);
});
test('differentiate token payouts and strict native evidence',()=>{
 assert.match(src,/strictNativeMatches/);assert.match(src,/strictTokenPayoutEvidence/);
 assert.match(src,/verifiedPayoutEvidence/);
});
test('RPC requires native exact match and prevents client privilege escalation',()=>{
 assert.match(sql,/service_role/);assert.match(sql,/f\.token_address='native'/);
 assert.match(sql,/f\.amount=t\.claim_reward_aptm/);
 assert.match(sql,/f\.amount_raw::numeric = t\.claim_reward_aptm \* 1000000000000000000::numeric/);
 assert.match(sql,/REVOKE ALL/);
});
