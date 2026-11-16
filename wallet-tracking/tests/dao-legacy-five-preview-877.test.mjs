import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const source=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')
const section=source.split("if(body?.mode==='admin-legacy-next-five-preview-877'||body?.mode==='admin-legacy-priced-next-five-preview-878'||")[1]
 ?.split('// 8.74: explicit single-claim commit')[0]

test('8.77 exposes only a bounded read-only, fixed-wallet next-five preview',()=>{
 assert.ok(section)
 assert.match(section,/LEGACY_SINGLE_TEST_WALLET_872/)
 assert.match(section,/authenticateInspectAdmin\(request\)/)
 assert.match(section,/DAO_REWARD_ENABLE_LIVE_WORKER/)
 assert.match(section,/\.limit\(6\)/)
 assert.match(section,/\.slice\(0,5\)/)
 assert.match(section,/stopped='needs_review';break/)
 assert.doesNotMatch(section,/\.insert\(|\.update\(|\.upsert\(|\.delete\(/)
})

test('8.77 checks trace, ownership, canonical duplication and independent price',()=>{
 assert.match(section,/verifyLegacyNativeMint866/)
 assert.match(section,/assessLegacySingle872/)
 assert.match(section,/previewExactPriceAtBlock873/)
 assert.match(section,/project_nft_claims/)
 assert.match(section,/project_transaction_asset_flows/)
 assert.match(section,/project_nft_ownership/)
 assert.match(section,/writesPerformed:0,claimsCreated:0/)
})

test('8.77 UI never auto-runs and presents all five results',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
 const js=readFileSync(new URL('../admin/dao-legacy-five-preview-877.js',import.meta.url),'utf8')
 assert.match(html,/id="daoLegacyFiveStart877"/)
 assert.match(html,/dao-legacy-five-preview-877\.js/)
 assert.match(js,/admin-legacy-next-five-preview-877/)
 assert.match(js,/JSON\.stringify\(data,null,2\)/)
 assert.doesNotMatch(js,/setInterval|setTimeout|\.update\(|\.insert\(/)
})
