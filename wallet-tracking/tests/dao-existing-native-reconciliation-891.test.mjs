import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const sql=readFileSync(new URL('../supabase/migrations/20261117170603_dao_existing_native_claim_reconciliation_891.sql',import.meta.url),'utf8')
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')

test('8.91 is a default read-only, explicitly opted-in atomic mark',()=>{
 assert.match(sql,/p_commit boolean DEFAULT false/)
 assert.match(sql,/service_role/)
 assert.match(sql,/session_user IS DISTINCT FROM 'postgres'/)
 assert.match(sql,/pg_advisory_xact_lock/)
 assert.match(sql,/FOR UPDATE/)
 assert.match(sql,/v_candidates<>1706 OR v_eligible<>1690 OR v_missing_flow<>16 OR v_preanchor<>1/)
 assert.match(sql,/IF p_commit THEN/)
 assert.match(sql,/GET DIAGNOSTICS v_updated=ROW_COUNT/)
 assert.match(sql,/IF v_updated<>1690/)
 assert.match(sql,/v_row_count<>16/)
})

test('8.91 checks exact source wei within bounded tolerance and preserves preanchor USD null',()=>{
 assert.match(sql,/wallettracking_dao_raw_decimal\(v_flow\.amount_raw,18\)/)
 assert.match(sql,/abs\(v_amount_from_raw-v_claim\.reward_aptm\)>0\.000000000001/)
 assert.match(sql,/v_flow\.value_usd IS DISTINCT FROM v_claim\.reward_usd/)
 assert.match(sql,/v_candidate\.claim_block>=88356/)
 assert.match(sql,/v_flow\.token_address IS DISTINCT FROM 'native'/)
 assert.match(sql,/v_claim\.nft_id IS DISTINCT FROM v_candidate\.nft_id/)
 assert.doesNotMatch(sql,/INSERT INTO public\.project_|UPDATE public\.project_|INSERT INTO public\.aptm_price_anchors/)
 assert.match(sql,/SET\s+canonical_existing_verified=true,canonical_existing_checked_at=clock_timestamp\(\)/)
 assert.match(html,/window\.APP_VERSION="8\.91"/)
})
