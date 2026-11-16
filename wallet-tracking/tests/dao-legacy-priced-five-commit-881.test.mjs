import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const sql=readFileSync(new URL('../supabase/migrations/20261116211800_dao_legacy_priced_five_atomic_commit_881.sql',import.meta.url),'utf8')
const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')
const ui=readFileSync(new URL('../admin/dao-legacy-priced-five-preview-878.js',import.meta.url),'utf8')
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
const expected=[
 ['0x9c9f96176b85f475568b8360919f70af67bee87cd5c359db1e4f36076de5490f',2337881,819,'1137205057236417485',1.9321904798310519],
 ['0xaf426c032f2506eb7e9fd2279072457e750b678f76cc06d505170e124ff9c29c',2396232,818,'487363152984477954',1.8732107004603566],
 ['0x105cc30694e9de6bcafc948bf688d2dc4e9eaca765776e20837e09b3505c4a89',2743281,819,'3411310607339698510',1.7170427180788568],
 ['0x174c195a835de324dea9c4dd0b70e55d97f6a1e75dcb6fbeb28e05fd2684aaed',2743285,818,'2923947454355220556',1.7170506314776859],
 ['0x4e0458a361e2fd6c93fdb99a78dac414cb205fcf4a5e961b81b4017fe10ca703',2803236,818,'487311054585855039',1.6983804634903685]
]

test('8.81 identity, exact raw amount and price match across SQL, Edge and UI',()=>{
 for(const [hash,block,nft,raw,price] of expected){
  const row=sql.split('\n').find(x=>x.includes(`'${hash}'`))
  assert.ok(row?.includes(String(block))&&row.includes(String(nft))&&row.includes(`'${raw}'`)&&row.includes(`${price}::numeric`))
  assert.ok(edge.includes(`'${hash}',${block},${nft},'${raw}',${price}`))
  assert.ok(ui.includes(`'${hash}',${block},${nft},'${raw}',${price}`))
 }
})
test('8.81 single atomic service-role finalizer and independent live evidence gate',()=>{
 assert.match(sql,/BEGIN;[\s\S]*COMMIT;/)
 assert.match(sql,/wallettracking_dao_commit_legacy_priced_five_881/)
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/)
 assert.match(sql,/jsonb_array_length\(p_proofs\)<>5/)
 assert.match(sql,/pg_advisory_xact_lock/)
 assert.match(sql,/wallettracking_dao_raw_decimal\(v_fixed\.amount_raw,18\)/)
 assert.match(sql,/wallettracking_dao_finalize_single_native_claim/)
 assert.match(sql,/RAISE EXCEPTION/)
 assert.match(edge,/const committing881=body\.mode==='admin-legacy-priced-five-commit-881'/)
 assert.match(edge,/wallettracking_dao_commit_legacy_priced_five_881/)
 assert.match(edge,/COMMIT-FIVE-881/)
 assert.match(edge,/Live worker must remain disabled/)
})
test('8.81 browser button is gated, twice confirmed and never automatic',()=>{
 assert.match(html,/id="daoLegacyPricedFiveCommit881"[^>]*disabled/)
 assert.match(html,/window\.APP_VERSION="8\.82"/)
 assert.match(ui,/ready881=false/)
 assert.match(ui,/window\.prompt\('Fünf neue/)
 assert.match(ui,/COMMIT-FIVE-881/)
 assert.match(ui,/window\.confirm\('Letzte Bestätigung/)
 assert.match(ui,/body:\{mode:COMMIT_MODE_881,confirm:'COMMIT-FIVE-881'\}/)
 assert.match(ui,/Vor Wiederholung Datenbankstatus prüfen/)
 assert.doesNotMatch(ui,/setInterval|setTimeout/)
})
