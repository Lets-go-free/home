import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const text=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const migration=readFileSync(new URL('../supabase/migrations/20261102215854_dao_candidate_review_777.sql',import.meta.url),'utf8');
const verification=text.slice(text.indexOf('async function verifyPendingCandidates('),text.indexOf('async function process('));
test('incomplete explorer evidence is retryable, not a negative verdict',()=>{
 for(const reason of ['pagination-incomplete','missing-history','history-out-of-order']) assert.ok(verification.includes(`'${reason}'`));
 assert.match(verification,/throw Error\(`Historical NFT ownership evidence incomplete/);
});
test('only explicitly proven different owner produces unverified',()=>{
 assert.match(verification,/conclusiveNegative=proof.reason==='owned-by-other-wallet'/);
 assert.match(verification,/conclusiveNegative\?'unverified':'needs_review'/);
});
test('migration preserves ambiguous historical rows',()=>{
 assert.match(migration,/ADD CONSTRAINT dao_reward_claim_candidates_status_check/);
 assert.match(migration,/proof_reason IS DISTINCT FROM 'owned-by-other-wallet'/);
 assert.match(migration,/status='needs_review'/);
});
