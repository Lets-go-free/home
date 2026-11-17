import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const sql=readFileSync(new URL('../supabase/migrations/20261117084052_dao_legacy_preanchor_four_guarded_884.sql',import.meta.url),'utf8')
const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')
const ui=readFileSync(new URL('../admin/dao-preanchor-four-884.js',import.meta.url),'utf8')
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')

test('8.84 installs only a fixed four-claim service-role function',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.wallettracking_dao_commit_legacy_preanchor_four_884/)
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/)
 assert.match(sql,/jsonb_array_length\(p_proofs\)<>4/)
 assert.match(sql,/pg_advisory_xact_lock/)
 assert.match(sql,/FOR UPDATE/)
 assert.match(sql,/Historical NFT ownership proof incomplete/)
 assert.match(sql,/Duplicate claim or asset flow/)
 assert.match(sql,/unpriced_before_exact_anchor/)
 assert.match(sql,/reward_usd IS NULL AND n\.reward_asset_usd IS NULL/)
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.wallettracking_dao_commit_legacy_preanchor_four_884/)
 assert.doesNotMatch(sql,/INSERT INTO public\.aptm_price_anchors/)
})

test('8.84 Edge repeats live mint proofs and invokes only one guarded SQL RPC',()=>{
 assert.match(edge,/body\?\.mode==='admin-legacy-preanchor-preview-884'/)
 assert.match(edge,/body\.confirm!=='COMMIT-PREANCHOR-884'/)
 assert.match(edge,/verifyLegacyNativeMint866\(raw\?\.result\?\?raw,logs,address\)/)
 assert.match(edge,/wallettracking_dao_commit_legacy_preanchor_four_884/)
 assert.match(edge,/Live worker must remain disabled/)
 assert.match(edge,/checked:4,stopped:'completed'/)
})

test('8.84 browser requires fresh read-only preview and two manual confirmations',()=>{
 assert.match(html,/window\.APP_VERSION="8\.84"/)
 assert.match(html,/id="daoPreanchorCommit884"[^>]*disabled/)
 assert.match(ui,/window\.previewDaoPreanchorFour884=async/)
 assert.match(ui,/window\.commitDaoPreanchorFour884=async/)
 assert.match(ui,/window\.prompt/)
 assert.match(ui,/window\.confirm/)
 assert.match(ui,/expectedTxHashes:hashes/)
 assert.match(ui,/Vor Wiederholung Datenbankstatus prüfen/)
 assert.doesNotMatch(ui,/setInterval|setTimeout/)
})
