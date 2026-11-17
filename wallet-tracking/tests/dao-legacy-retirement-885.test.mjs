import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8')
const html = read('../index.html')
const edge = read('../supabase/functions/dao-reward-refresh/index.ts')
const sql = read('../supabase/migrations/20261117100618_dao_retire_completed_legacy_helpers_885.sql')
const oldModes = [
  'admin-legacy-native-mint-preview-866',
  'admin-legacy-single-claim-preview-872',
  'admin-legacy-single-claim-commit-874',
  'admin-legacy-next-five-preview-877',
  'admin-legacy-priced-next-five-preview-878',
  'admin-legacy-priced-five-commit-879',
  'admin-legacy-priced-five-commit-880',
  'admin-legacy-priced-five-commit-881',
  'admin-legacy-priced-bounded-commit-882',
  'admin-legacy-preanchor-preview-884',
  'admin-legacy-preanchor-commit-884',
]

test('8.85 removes old browser controls and Edge API routes', () => {
  assert.match(html, /window\.APP_VERSION="8\.8[5-8]"/)
  for (const id of ['daoLegacyMintDrain869', 'daoLegacySingle872', 'daoLegacyFive877',
    'daoLegacyPricedFive878', 'daoPreanchorFour884'])
    assert.doesNotMatch(html, new RegExp('id="'+id+'"'))
  for (const name of ['dao-legacy-mint-drain-869.js','dao-legacy-single-preview-872.js',
    'dao-legacy-five-preview-877.js','dao-legacy-priced-five-preview-878.js','dao-preanchor-four-884.js'])
    assert.doesNotMatch(html, new RegExp('<script src="[^"]*'+name.replaceAll('.', '\\.')+'"'))
  for (const mode of oldModes) assert.ok(!edge.includes(mode), mode)
  // A later read-only historic proof may reuse the pure event parser, but
  // the retired 8.66 preview route and its obsolete build metadata stay gone.
  assert.doesNotMatch(edge, /LEGACY_MINT_PROOF_BUILD/)
  assert.doesNotMatch(edge, /import .*legacy-single-preview-872/)
  assert.match(html, /id="adminHardcodingAudit"/)
  assert.match(edge, /admin-miner-batch-plan-865/)
})

test('8.85 migration checks fixed wallet completion and RESTRICT-drops only obsolete RPCs', () => {
  assert.match(sql, /BEGIN;/)
  assert.match(sql, /v_open <> 0 OR v_completed < 76/)
  assert.match(sql, /8a3c5dc6-0610-482d-a327-3f3ba03db158/)
  assert.match(sql, /COMMIT;/)
  assert.doesNotMatch(sql, /CASCADE/)
  const names = ['minebot_874','preanchor_four_884','priced_bounded_882',
    'priced_five_879','priced_five_880','priced_five_881']
  for (const name of names)
    assert.match(sql, new RegExp('DROP FUNCTION IF EXISTS public\\.wallettracking_dao_commit_legacy_'+name+'\\([^;]+\\) RESTRICT;'))
  assert.equal((sql.match(/DROP FUNCTION IF EXISTS /g)||[]).length,6)
  assert.doesNotMatch(sql, /DROP FUNCTION.*finalize_single/)
})
