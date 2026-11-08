import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/migrations/20261102220424_dao_payout_evidence_778.sql',import.meta.url),'utf8');
const unit=source.slice(source.indexOf('async function verifyCandidatePayouts('),source.indexOf('async function process('));
test('payout verification covers proven NFTs and explicitly unassigned new miners',()=>{
 assert.doesNotMatch(unit,/\.in\('status'/); // Payout is independent of ownership since 8.02.
 assert.match(unit,/eq\('payout_status','pending'\)/);
});
test('payouts require known successful transaction and on-chain flow',()=>{
 assert.match(unit,/verifiedPayoutEvidence\(tx,flows\|\|\[\],address\)/);
 assert.match(source,/txProgress.complete&&flowProgress.complete/);
});
test('payout proof writes no reward sums or claim NFT fields',()=>{
 assert.doesNotMatch(unit,/\.update\(\{[^}]*claim_nft_id|\.update\(\{[^}]*claim_reward_usd|\.update\(\{[^}]*price_usd/);
 assert.match(unit,/p_status:evidence.status/);
});
test('migration restricts payout status and indexes pending work',()=>{
 assert.match(sql,/CHECK \(payout_status IN \('pending','verified','needs_review'\)\)/);
 assert.match(sql,/WHERE status='ownership_verified' AND payout_status='pending'/);
});
