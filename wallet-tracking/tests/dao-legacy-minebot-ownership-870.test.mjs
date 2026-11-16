import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const file=new URL('../supabase/migrations/20261116132036_dao_legacy_minebot_nft_ownership_870.sql',import.meta.url)
const sql=readFileSync(file,'utf8')
assert.match(sql,/BEGIN;[\s\S]*COMMIT;/)
assert.match(sql,/candidates_count <> 76/)
assert.match(sql,/count_818 <> 42 OR count_819 <> 34/)
assert.match(sql,/transfer_count=2/)
assert.match(sql,/c\.is_complete/)
assert.match(sql,/RAISE EXCEPTION/)
assert.match(sql,/IF EXISTS \(SELECT 1 FROM public\.project_nft_ownership/)
assert.match(sql,/wallet_address,owned_from_block,owned_to_block/)
assert.match(sql,/false,zero_address,m\.tx_hash,'mint_to_own_wallet',true/)
assert.match(sql,/GET DIAGNOSTICS written = ROW_COUNT/g)
assert.equal((sql.match(/INSERT INTO public\./g)||[]).length,2)
assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE)\b\s+public\./i)
for(const table of ['dao_reward_claim_candidates','project_transactions','project_nft_claims','project_miners']){
 assert.doesNotMatch(sql,new RegExp(`INSERT INTO public\\.${table}\\b`,'i'))
}
console.log('8.70: historical MineBot ownership migration limited to 2 tables with guards')
