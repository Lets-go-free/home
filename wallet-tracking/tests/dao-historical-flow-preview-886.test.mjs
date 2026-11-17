import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {assessHistoricalRawAmount886} from '../supabase/functions/dao-reward-refresh/legacy-flow-proof-886.js'

const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
const ui=readFileSync(new URL('../admin/dao-historical-flow-preview-886.js',import.meta.url),'utf8')
const section=edge.split("if(body?.mode==='admin-historical-flow-preview-886'){")[1]?.split('// 8.63/8.65:')[0]

test('8.86 guards exact raw units without using binary floating point',()=>{
 assert.deepEqual(assessHistoricalRawAmount886('636396007202193459300','636.3960072021935'),
  {ok:true,reason:'within-historical-precision',differenceWei:'-40700',precisionLimitWei:'1000000'})
 assert.equal(assessHistoricalRawAmount886('2432568024883926698','2.4325680248839263').ok,true)
 assert.equal(assessHistoricalRawAmount886('2432568024883926698','2.4325680248').ok,false)
 assert.equal(assessHistoricalRawAmount886('not-a-raw','2.4').ok,false)
})

test('8.86 only exposes a three-claim admin preview for the fixed historic wallet',()=>{
 assert.ok(section)
 assert.match(section,/e8b5c835-0db2-4449-bbee-258e28b42bbb/)
 assert.match(section,/0x2096bd2e860b450498a7c908708757a1eb306416/)
 assert.match(section,/authenticateInspectAdmin\(request\)/)
 assert.match(section,/DAO_REWARD_ENABLE_LIVE_WORKER/)
 assert.match(section,/total!==164/)
 assert.match(section,/Math\.min\(offset\+2,163\)/)
 assert.match(section,/verifyLegacyNativeMint866/)
 assert.match(section,/assessHistoricalRawAmount886/)
 assert.match(section,/flows!==0/)
 assert.doesNotMatch(section,/\.insert\(|\.upsert\(|\.update\(|\.delete\(|\.rpc\(/)
 assert.match(section,/writesPerformed:0,claimsCreated:0/)
 assert.match(html,/id="daoHistoricalFlowPreview886"/)
 assert.match(html,/dao-historical-flow-preview-886\.js/)
 assert.match(ui,/admin-historical-flow-preview-886/)
 assert.doesNotMatch(ui,/commit|COMMIT|confirm\(/)
})
