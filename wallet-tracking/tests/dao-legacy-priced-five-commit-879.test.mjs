import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')
const ui=readFileSync(new URL('../admin/dao-legacy-priced-five-preview-878.js',import.meta.url),'utf8')
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
const sql=readFileSync(new URL('../supabase/migrations/20261116203937_dao_legacy_priced_five_atomic_commit_879.sql',import.meta.url),'utf8')
const five=['0x21a0ec877f6ebf0452db83b9a0439ea26d12b28351f571b8d48c21ce9d6eb99d',
 '0x0c7c6987ef6b39a84fc8cb38cbc8beb5865ccc249e6b15141bc7b5c0f4a5a9d4',
 '0xd74d49ef15fdb8f7a888978c00f0a4202afee6f416e8be7df04436ddb92e8a62',
 '0x586e659f7bd640e9da1af365128c6957b581e5e35793696ac8c7bd061c3ab9de',
 '0x34babc2ceda4baeae94aa3bd1d108126de8a9f4267f01e74a85121f51f370a7b']

test('8.79 fixed targets match across browser, live evidence and SQL',()=>{
 for(const hash of five){assert.ok(edge.includes(hash));assert.ok(ui.includes(hash));assert.ok(sql.includes(hash))}
 assert.match(sql,/p_proofs jsonb/)
 assert.match(sql,/jsonb_array_length\(p_proofs\)<>5/)
 assert.match(sql,/v_proof->>'priceUsd'/)
 assert.match(sql,/v_proof->>'amountRaw'/)
 assert.match(sql,/v_proof->>'proofBlock'/)
})
test('8.79 SQL is service-only and atomic, and existing canonical pipeline is reused',()=>{
 assert.match(sql,/BEGIN;/)
 assert.match(sql,/COMMIT;/)
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/)
 assert.match(sql,/pg_advisory_xact_lock/)
 assert.match(sql,/wallettracking_dao_finalize_single_native_claim/)
 assert.match(sql,/wallettracking_dao_raw_decimal\(v_fixed\.amount_raw,18\)/)
 assert.match(sql,/R(AISE EXCEPTION|EVOKE ALL)/)
 assert.match(sql,/GRANT EXECUTE.*wallettracking_dao_commit_legacy_priced_five_879/s)
 assert.match(sql,/n\.reward_usd=n\.reward_asset_usd/)
 assert.match(edge,/body\.mode==='admin-legacy-priced-five-commit-879'/)
 assert.match(edge,/COMMIT-FIVE-879/)
 assert.match(edge,/Live worker must remain disabled/)
 assert.match(edge,/wallettracking_dao_commit_legacy_priced_five_879'/)
 assert.match(edge,/results\.some\(x=>x\.status!=='verified_preview'\)/)
})
test('8.79 manual button is initially disabled and requires two confirmations',()=>{
 assert.match(html,/id="daoLegacyPricedFiveCommit879"[^>]*disabled/)
 assert.match(html,/window\.APP_VERSION="8\.82"/)
 assert.match(ui,/ready=false/)
 assert.match(ui,/window\.prompt\(/)
 assert.match(ui,/window\.confirm\(/)
 assert.match(ui,/body:\{mode:COMMIT_MODE,confirm:'COMMIT-FIVE-879'\}/)
 assert.match(ui,/Vor Wiederholung Datenbankstatus prüfen/)
 assert.doesNotMatch(ui,/setInterval|setTimeout/)
})
