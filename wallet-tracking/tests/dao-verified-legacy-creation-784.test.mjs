import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261103-114841_dao_verified_legacy_claim_creation_784.sql',import.meta.url),'utf8');
const worker=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
test('inserts only proven legacy claims and existing historical price',()=>{
 assert.match(sql,/c.status='ownership_verified' AND c.payout_status='verified'/);
 assert.match(sql,/t.selector='0x86bb8f37'/);
 assert.match(sql,/sum\(f.amount_raw::numeric\)=c.payout_amount_raw::numeric/);
 assert.match(sql,/f.value_usd IS NOT NULL/);
 assert.doesNotMatch(sql,/INSERT INTO public.project_transaction_asset_flows/i);
});
test('does not overwrite existing claims or accept browser credentials',()=>{
 assert.match(sql,/ON CONFLICT \(user_id,project_key,chain_key,tx_hash\) DO NOTHING/);
 assert.match(sql,/auth.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION .* TO service_role/);
});
test('worker calls creation only after import complete and still stays staged',()=>{
 assert.match(worker,/sb.rpc\('wallettracking_dao_create_verified_legacy_claims'/);
 assert.match(worker,/if\(txProgress.complete&&flowProgress.complete\)/);
 assert.match(worker,/queueState:partial\?'partial':'staged'/);
 assert.doesNotMatch(worker,/wallettracking_reward_complete/);
});
