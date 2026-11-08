import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
test('new audit mode is explicit and admin gated',()=>{
 assert.match(src,/body\?\.mode==='audit-test-wallet'/);
 assert.match(src,/authenticateInspectAdmin\(request\)/);
 assert.match(src,/DAO_REWARD_ENABLE_TEST_INSPECT/);
});
test('audits separate canonical existing flag from legacy pending status',()=>{
 assert.match(src,/canonical_existing_verified/);
 assert.match(src,/canonicalExistingVerified/);
 assert.match(src,/pricedButNotMarkedExisting/);
});
test('pre-anchor claims remain unpriced without fallback',()=>{
 assert.match(src,/APTM_EXACT_ANCHOR_MIN_BLOCK=88356/);
 assert.match(src,/unpriced_before_exact_anchor/);
 assert.match(src,/never infer an actual payout from a positive/);
});
test('audit does not modify database or attempt RPC',()=>{
 const section=src.split('async function auditTestClaims(){')[1].split('// The manual inspector uses')[0];
 assert.ok(section);
 assert.doesNotMatch(section,/\.update\(|\.upsert\(|\.insert\(|\.delete\(|sb\.rpc\(/);
});
