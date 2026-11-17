import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
const ui=readFileSync(new URL('../admin/dao-legacy-priced-five-preview-878.js',import.meta.url),'utf8')
const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')

test('8.83 removes obsolete hidden commit controls without weakening the guarded commit',()=>{
 assert.match(html,/window\.APP_VERSION="8\.(83|84)"/)
 for(const id of ['daoLegacyPricedFiveCommit879','daoLegacyPricedFiveCommit880','daoLegacyPricedFiveCommit881'])
  assert.doesNotMatch(html,new RegExp(`id="${id}"`))
 assert.match(html,/id="daoLegacyPricedFiveCommit882"[^>]*disabled/)
 assert.match(ui,/remainingBefore/)
 assert.match(ui,/expectedTxHashes:expected/)
 assert.match(ui,/COMMIT-NEXT-882/)
 assert.match(edge,/wallettracking_dao_commit_legacy_priced_bounded_882/)
 assert.match(edge,/Live worker must remain disabled/)
})
