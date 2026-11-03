import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261103111756_dao_canonical_payout_reconcile_783.sql',import.meta.url),'utf8');
const worker=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
test('service role only and wallet/user scoped',()=>{
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.match(sql,/WHERE w\.id=p_wallet AND w\.user_id=p_user/);
 assert.match(sql,/REVOKE ALL ON FUNCTION .* FROM PUBLIC,anon,authenticated/);
});
test('reconcile ONLY pre-existing NFT claims backed by ownership, payment, transaction and historical price',()=>{
 assert.match(sql,/JOIN public\.project_nft_claims n/);
 assert.match(sql,/c\.status='ownership_verified' AND c\.payout_status='verified'/);
 assert.match(sql,/sum\(f\.amount_raw::numeric\)=c\.payout_amount_raw::numeric/);
 assert.match(sql,/count\(\*\)=c\.payout_flow_count/);
 assert.match(sql,/min\(f\.price_usd\)=max\(f\.price_usd\)/);
 assert.match(sql,/min\(f\.price_source\)=max\(f\.price_source\)/);
 assert.doesNotMatch(sql,/INSERT INTO public\.project_nft_claims/i);
 assert.doesNotMatch(sql,/UPDATE public\.project_transactions/i);
 assert.doesNotMatch(sql,/UPDATE public\.project_transaction_asset_flows/i);
});
test('never overrides user manual or previously valued claim',()=>{
 assert.match(sql,/n\.price_is_manual=false/);
 assert.match(sql,/n\.reward_asset_usd IS NULL/);
 assert.doesNotMatch(sql,/SET\s+claim_reward_aptm|claim_nft_id|SET\s+reward_aptm/i);
});
test('worker invokes reconciliation only after both raw imports complete, leaving job staged',()=>{
 const p=worker.indexOf("sb.rpc('wallettracking_dao_reconcile_verified_claims'");
 assert.ok(p>0);
 assert.match(worker.slice(p-110,p),/txProgress\.complete&&flowProgress\.complete/);
 assert.match(worker,/queueState:partial\?'partial':'staged'/);
 assert.doesNotMatch(worker,/wallettracking_reward_complete/);
});
