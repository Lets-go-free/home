import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const sql=readFileSync(new URL('../supabase/migrations/20261116214101_dao_legacy_priced_bounded_commit_882.sql',import.meta.url),'utf8')
const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')
const ui=readFileSync(new URL('../admin/dao-legacy-priced-five-preview-878.js',import.meta.url),'utf8')
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')

test('8.82 SQL is reusable, bounded to current next priced candidates and atomic',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.wallettracking_dao_commit_legacy_priced_bounded_882/)
 assert.match(sql,/BEGIN;[\s\S]*COMMIT;/)
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/)
 assert.match(sql,/jsonb_array_length\(p_proofs\) NOT BETWEEN 1 AND 5/)
 assert.match(sql,/pg_advisory_xact_lock/)
 assert.match(sql,/c\.status='unassigned_legacy'/)
 assert.match(sql,/c\.payout_status='pending' AND c\.claim_block>=88356/)
 assert.match(sql,/ORDER BY c\.claim_block,c\.tx_hash LIMIT 5/)
 assert.match(sql,/v_submitted IS DISTINCT FROM v_expected/)
 assert.match(sql,/SELECT z\.proof->>'txHash' AS tx_hash/)
 assert.match(sql,/FOR UPDATE/)
 assert.match(sql,/v_fixed\.nft_id NOT IN \(818,819\)/)
 assert.match(sql,/wallettracking_dao_raw_decimal\(v_fixed\.amount_raw,18\)/)
 assert.match(sql,/wallettracking_dao_finalize_single_native_claim/)
 assert.match(sql,/n\.reward_usd=n\.reward_asset_usd/)
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.wallettracking_dao_commit_legacy_priced_bounded_882/)
})

test('8.82 Edge rechecks the same ordered hashes and live proofs before one RPC',()=>{
 assert.match(edge,/body\?\.mode==='admin-legacy-priced-bounded-commit-882'/)
 assert.match(edge,/body\.confirm!=='COMMIT-NEXT-882'|COMMIT-NEXT-882/)
 assert.match(edge,/expectedTxHashes/)
 assert.match(edge,/selected\.some\(\(c,i\)=>c\.tx_hash!==body\.expectedTxHashes\[i\]\)/)
 assert.match(edge,/verifyLegacyNativeMint866/)
 assert.match(edge,/previewExactPriceAtBlock873/)
 assert.match(edge,/Reusable batch requires exact historical pool-state and matched native mint proof/)
 assert.match(edge,/wallettracking_dao_commit_legacy_priced_bounded_882/)
 assert.match(edge,/Live worker must remain disabled/)
 assert.doesNotMatch(edge.split("if(body?.mode==='admin-legacy-next-five-preview-877'")[1].split('// 8.74: explicit single-claim commit')[0],/setInterval|setTimeout/)
})

test('8.82 browser has a single manually confirmed reusable batch button',()=>{
 assert.match(html,/id="daoLegacyPricedFiveCommit882"[^>]*disabled/)
 assert.match(html,/window\.APP_VERSION="8\.(82|83|84)"/)
 assert.match(ui,/ready882=\[\]/)
 assert.match(ui,/window\.commitDaoLegacyPricedBounded882=async/)
 assert.match(ui,/window\.prompt\(/)
 assert.match(ui,/window\.confirm\(/)
 assert.match(ui,/expectedTxHashes:expected/)
 assert.match(ui,/COMMIT-NEXT-882/)
 assert.match(ui,/Vor Wiederholung Datenbankstatus prüfen/)
 assert.doesNotMatch(ui,/setInterval|setTimeout/)
})
