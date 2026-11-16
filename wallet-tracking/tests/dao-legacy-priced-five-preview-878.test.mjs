import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')
const ui=readFileSync(new URL('../admin/dao-legacy-priced-five-preview-878.js',import.meta.url),'utf8')
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
const section=edge.split("if(body?.mode==='admin-legacy-next-five-preview-877'||body?.mode==='admin-legacy-priced-next-five-preview-878'){")[1]
 ?.split('// 8.74: explicit single-claim commit')[0]

test('8.78 selects only priced-start candidates from the fixed wallet, maximum five',()=>{
 assert.ok(section)
 assert.match(section,/const pricedOnly=body\.mode==='admin-legacy-priced-next-five-preview-878'/)
 assert.match(section,/if\(pricedOnly\)queueQuery=queueQuery\.gte\('claim_block',88356\)/)
 assert.match(section,/LEGACY_SINGLE_TEST_WALLET_872/)
 assert.match(section,/\.limit\(6\)/)
 assert.match(section,/\.slice\(0,5\)/)
 assert.match(section,/price\.status!=='exact_v13_verified'/)
 assert.match(section,/pricedOnly&&assessment\.price\.status!=='exact_v13_verified'/)
 assert.doesNotMatch(section,/\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(/)
})

test('8.78 UI is a manual read-only action and rejects unpriced results',()=>{
 assert.match(html,/id="daoLegacyPricedFiveStart878"/)
 assert.match(html,/dao-legacy-priced-five-preview-878\.js/)
 assert.match(ui,/body:\{mode:MODE\}/)
 assert.match(ui,/data\.pricedOnly!==true/)
 assert.match(ui,/x\.price\?\.status!=='exact_v13_verified'/)
 assert.doesNotMatch(ui,/setInterval|setTimeout|\.update\(|\.insert\(|commit/i)
})
