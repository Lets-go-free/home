import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const sql=readFileSync(new URL('../supabase/migrations/20261117112925_dao_historical_existing_claim_flows_889.sql',import.meta.url),'utf8')
const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
const ui=readFileSync(new URL('../admin/dao-historical-flow-commit-889.js',import.meta.url),'utf8')
const route=edge.split("if(['admin-historical-flow-preview-886','admin-historical-flow-commit-889'].includes(body?.mode)){ ")[1]??
 edge.split("if(['admin-historical-flow-preview-886','admin-historical-flow-commit-889'].includes(body?.mode)){")[1]?.split('// 8.63/8.65:')[0]

test('8.89 commits only native flows for pre-existing canonical claims',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.wallettracking_dao_commit_historical_existing_flows_889/)
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/)
 assert.match(sql,/BETWEEN 1 AND 3/)
 assert.match(sql,/pg_advisory_xact_lock/)
 assert.match(sql,/v_expected IS DISTINCT FROM v_submitted/)
 assert.match(sql,/project_nft_claims n[\s\S]*FOR SHARE/)
 assert.match(sql,/abs\(v_amount-v_claim\.reward_aptm\)>0\.000000000001/)
 assert.match(sql,/EXISTS\(SELECT 1 FROM public\.project_transaction_asset_flows f/)
 assert.match(sql,/INSERT INTO public\.project_transaction_asset_flows/)
 assert.match(sql,/UPDATE public\.dao_reward_claim_candidates c/)
 assert.doesNotMatch(sql,/INSERT INTO public\.project_nft_claims|UPDATE public\.project_nft_claims|UPDATE public\.project_transactions|INSERT INTO public\.aptm_price_anchors/)
 assert.match(sql,/REVOKE ALL ON FUNCTION.*wallettracking_dao_commit_historical_existing_flows_889/)
 assert.match(sql,/TO service_role/)
})

test('8.89 Edge path freshly repeats all strict proofs before RPC, under admin authentication',()=>{
 assert.ok(route)
 assert.match(route,/authenticateInspectAdmin\(request\)/)
 assert.match(route,/DAO_REWARD_ENABLE_LIVE_WORKER/)
 assert.match(route,/COMMIT-3-HISTORICAL-FLOWS/)
 assert.match(route,/historicalNftOwnership\(/)
 assert.match(route,/verifyLegacyNativeMint866\(/)
 assert.match(route,/assessHistoricalRawAmount886\(/)
 assert.match(route,/results\.some\(/)
 assert.match(route,/wallettracking_dao_commit_historical_existing_flows_889/)
 assert.match(route,/claimsCreated:0/)
})

test('8.89 requires an explicit browser confirmation and never auto-loops commits',()=>{
 assert.match(html,/id="daoHistoricalFlowCommitPanel889"/)
 assert.match(html,/dao-historical-flow-commit-889\.js/)
 assert.match(html,/window\.APP_VERSION="8\.89"/)
 assert.match(ui,/confirm\(/)
 assert.match(ui,/COMMIT-3-HISTORICAL-FLOWS/)
 assert.match(ui,/commitDaoHistoricalFlows889/)
 assert.doesNotMatch(ui,/while\s*\(|for\s*\(/)
})
