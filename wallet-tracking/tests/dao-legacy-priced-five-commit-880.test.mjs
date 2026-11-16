import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')
const ui=readFileSync(new URL('../admin/dao-legacy-priced-five-preview-878.js',import.meta.url),'utf8')
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
const sql=readFileSync(new URL('../supabase/migrations/20261116205701_dao_legacy_priced_five_atomic_commit_880.sql',import.meta.url),'utf8')
const expected=[
 ['0xfb2184155412199053bb6df979dc8b4c57283725b935d30b8364c06676bd0d87',1839700,818,'2525083041605479397',1.29818624453132],
 ['0xb4abf20ae63e8488013729c1160d1578faecbf7b4b13183b2db3fb136e9e5596',1858236,819,'2687537425933638715',1.2969281481676773],
 ['0xc801519cac197cb76b38b2eca6432639f1a3588ef82af1cb1310dbda6f151bd0',2185604,818,'2924284507977177513',1.6625433945298382],
 ['0x4bf476ecd9fa1ffe956ddce09e40731ea856170c034b706bb3e4a8e98813af6b',2185862,819,'2761830123649018195',1.6638156156980808],
 ['0x5bfd2df402f5ac52708c88838cf443711932fa6f7dc1f91bf6635c21c210429f',2337875,818,'1137205057236417485',1.9320395188634845]
]

test('8.80 all five identities, raw amounts and exact prices agree in SQL, Edge and UI',()=>{
 for(const [hash,block,id,raw,price] of expected){
  assert.ok(sql.includes(`'${hash}'`));
  const row=sql.split('\n').find(line=>line.includes(`'${hash}'`));
  assert.ok(row?.includes(String(block))&&row.includes(String(id))&&row.includes(`'${raw}'`)&&row.includes(`${price}::numeric`))
  assert.ok(edge.includes(`'${hash}',${block},${id},'${raw}',${price}`))
  assert.ok(ui.includes(`'${hash}',${block},${id},'${raw}',${price}`))
 }
})
test('8.80 commit is distinct from 8.79, service role only and fully atomic',()=>{
 assert.match(sql,/BEGIN;[\s\S]*COMMIT;/)
 assert.match(sql,/wallettracking_dao_commit_legacy_priced_five_880/)
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/)
 assert.match(sql,/jsonb_array_length\(p_proofs\)<>5/)
 assert.match(sql,/pg_advisory_xact_lock/)
 assert.match(sql,/wallettracking_dao_raw_decimal\(v_fixed\.amount_raw,18\)/)
 assert.match(sql,/wallettracking_dao_finalize_single_native_claim/)
 assert.match(sql,/R(AISE EXCEPTION|EVOKE ALL)/)
 assert.match(edge,/body\?\.mode==='admin-legacy-priced-five-commit-879'\|\|body\?\.mode==='admin-legacy-priced-five-commit-880'/)
 assert.match(edge,/committing880\?\s*'wallettracking_dao_commit_legacy_priced_five_880'/)
 assert.match(edge,/DAO_REWARD_ENABLE_LIVE_WORKER/)
})
test('8.80 UI needs verified preview and two manual confirmations',()=>{
 assert.match(html,/id="daoLegacyPricedFiveCommit880"[^>]*disabled/)
 assert.match(html,/window\.APP_VERSION="8\.81"/)
 assert.match(ui,/ready880=false/)
 assert.match(ui,/window\.prompt\('Fünf neue/)
 assert.match(ui,/window\.confirm\('Letzte Bestätigung/)
 assert.match(ui,/body:\{mode:COMMIT_MODE_880,confirm:'COMMIT-FIVE-880'\}/)
 assert.match(ui,/Vor Wiederholung Datenbankstatus prüfen/)
 assert.doesNotMatch(ui,/setInterval|setTimeout/)
})
