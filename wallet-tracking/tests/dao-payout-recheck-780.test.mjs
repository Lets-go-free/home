import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const part=src.slice(src.indexOf('async function verifyCandidatePayouts('),src.indexOf('async function process('));
test('pending candidates have precedence and share a bounded 20-item budget',()=>{
 assert.match(part,/\.eq\('payout_status','pending'\)/);
 assert.match(part,/\.limit\(20\)/);
 assert.match(part,/if\(candidates\.length<20\)/);
 assert.match(part,/\.limit\(20-candidates\.length\)/);
});
test('ambiguous evidence is retried after 24 hours, not on every cron invocation',()=>{
 assert.match(part,/Date\.now\(\)-24\*60\*60\*1000/);
 assert.match(part,/\.in\('payout_status',\['needs_review','no_payout_evidence'\]\)/);
 assert.match(part,/payout_checked_at\.is\.null,payout_checked_at\.lt/);
});
test('verified claims are never downgraded or rewritten',()=>{
 assert.match(part,/wallettracking_dao_record_payout_check/); // SQL enforces verified protection under row lock.
 assert.doesNotMatch(part,/claim_reward_usd|claim_nft_id|price_usd|\.from\('snapshots'\)/);
});
