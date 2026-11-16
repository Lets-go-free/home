import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {assessLegacySingle872} from '../supabase/functions/dao-reward-refresh/legacy-single-preview-872.js'

const raw=(id)=>'0x86bb8f37'+BigInt(id).toString(16).padStart(64,'0')+50n.toString(16).padStart(64,'0')
const base=(id=819,block=40707)=>({
 candidate:{status:'unassigned_legacy',payout_status:'pending',claim_block:block},
 transaction:{selector:'0x86bb8f37',status:'ok',block_number:block,raw_input:raw(id),value_aptm:0},
 proof:{status:'verified',reason:'matched-native-minter-call-and-event',amountRaw:'2432568024883926698',amountAptm:'2.432568024883926698',asset:'native',decimals:18},
 ownership:{nft_id:id,is_current:false,acquisition_verified:true,acquisition_kind:'mint_to_own_wallet',owned_from_block:10904,owned_to_block:id===819?11448526:11448349},
 catalog:{nft_id:id,subtype:'Mining-Bot'},canonicalCount:0,flowCount:0
})
test('early 819 native mint is verified but remains unpriced',()=>{
 const result=assessLegacySingle872(base())
 assert.equal(result.status,'verified_preview')
 assert.equal(result.nftId,819)
 assert.equal(result.amountRaw,'2432568024883926698')
 assert.equal(result.price.status,'unpriced_before_exact_anchor')
 assert.equal(result.price.valueUsd,null)
 assert.equal(result.writesPerformed,0)
})
test('later 818 requires independent exact-v13 proof, no invented USD',()=>{
 const result=assessLegacySingle872(base(818,957942))
 assert.equal(result.status,'verified_preview')
 assert.equal(result.price.status,'exact_v13_proof_required')
 assert.equal(result.price.valueUsd,null)
})
test('duplicate and mismatching ownership prevent preview readiness',()=>{
 const duplicate=assessLegacySingle872({...base(),canonicalCount:1})
 assert.equal(duplicate.status,'needs_review')
 assert.deepEqual(duplicate.proposedChanges,[])
 const changed=base();changed.ownership.owned_to_block=123;
 assert.ok(assessLegacySingle872(changed).blockers.includes('historical-ownership-not-proven'))
})
test('unexpected calldata and proof mismatch are rejected',()=>{
 const changed=base();changed.transaction.raw_input=raw(999)
 assert.equal(assessLegacySingle872(changed).status,'needs_review')
 const invalid=base();invalid.proof.status='needs_review'
 assert.equal(assessLegacySingle872(invalid).status,'needs_review')
})
test('endpoint retains strict authorization; preview has no mutation methods',()=>{
 const source=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')
 const section=source.split("if(body?.mode==='admin-legacy-single-claim-preview-872'||body?.mode==='admin-legacy-single-claim-commit-874'){")[1].split('// 8.66: bounded')[0]
 assert.match(section,/authenticateInspectAdmin\(request\)/)
 assert.match(section,/DAO_REWARD_ENABLE_LIVE_WORKER/)
 assert.match(section,/LEGACY_SINGLE_TEST_WALLET_872/)
 assert.match(section,/if\(committing\)/)
 assert.match(section,/wallettracking_dao_commit_legacy_minebot_874/)
 assert.match(section,/COMMIT-957942-818/)
 assert.doesNotMatch(section,/\.insert\(|\.update\(|\.upsert\(|\.delete\(/)
})
test('admin UI exposes one selected hash and no automatic batch mode',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
 const js=readFileSync(new URL('../admin/dao-legacy-single-preview-872.js',import.meta.url),'utf8')
 assert.match(html,/id="daoLegacySingleHash"/)
 assert.match(html,/previewDaoLegacySingle872\(\)/)
 assert.match(html,/dao-legacy-single-preview-872\.js/)
 assert.match(js,/mode:MODE,txHash:hash/)
 assert.doesNotMatch(js,/setInterval|setTimeout|\.update\(|\.upsert\(/)
})
test('8.74 commit requires fixed TX, exact historical proof, explicit UI confirmation and guarded SQL finalizer',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261116161659_dao_legacy_single_native_claim_commit_874.sql',import.meta.url),'utf8')
 const js=readFileSync(new URL('../admin/dao-legacy-single-preview-872.js',import.meta.url),'utf8')
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
 assert.match(sql,/v_tx constant text := '0xc27e0aa5e092efefe9f57e8c7d6890bfdd54a974fde2988e6319a653b3eb2363'/)
 assert.match(sql,/wallettracking_dao_finalize_single_native_claim/)
 assert.match(sql,/REVOKE ALL ON FUNCTION/)
 assert.match(sql,/TO service_role/)
 assert.doesNotMatch(sql,/\bDELETE\s+FROM\b/i)
 assert.match(js,/window\.prompt/)
 assert.match(js,/window\.confirm/)
 assert.match(html,/id="daoLegacySingleCommit874"[^>]*disabled/)
})
test('8.75 native flow uses established -1 log index and surfaces server failures without retry',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261116195516_dao_legacy_native_log_index_fix_875.sql',import.meta.url),'utf8')
 const js=readFileSync(new URL('../admin/dao-legacy-single-preview-872.js',import.meta.url),'utf8')
 assert.match(sql,/log_index,token_address,token_symbol/)
 assert.match(sql,/-1,'native','APTM'/)
 assert.doesNotMatch(sql,/NULL,'native','APTM'/)
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.wallettracking_dao_commit_legacy_minebot_874/)
 assert.match(js,/response\.clone\(\)\.json\(\)/)
 assert.doesNotMatch(js,/setInterval|setTimeout/)
})
