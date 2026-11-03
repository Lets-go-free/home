import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../sql/audits/dao-reward-live-readiness-789.sql',import.meta.url),'utf8');
test('single read-only SELECT with no mutation or sensitive row identifiers',()=>{
 const body=sql.replace(/^--.*$/gm,'');
 assert.match(body,/^\s*WITH\s/i);
 assert.match(body,/AS dao_reward_readiness_audit;/);
 assert.doesNotMatch(body,/\b(INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER|CREATE|GRANT|REVOKE|CALL|DO|EXECUTE)\s+/i);
 assert.doesNotMatch(body,/SELECT\s+\*/i);
 assert.doesNotMatch(body,/evm_address|ciphertext|tx_hash|wallet_address|\blast_error\b/i);
});
test('checks canonical functions, payout evidence, missing prices and queue backlog',()=>{
 for(const value of ['wallettracking_dao_apply_exact_target_anchors','wallettracking_dao_reconcile_verified_claims',
   'wallettracking_dao_create_verified_unassigned_miner_claims','payout_verified_without_amount',
   'incoming_unpriced','ownership_needs_review',"state='partial'",'canonical_aptm_anchors'])
  assert.ok(sql.includes(value),value);
});
