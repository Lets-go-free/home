import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261103134421_dao_verified_unassigned_miner_claims_785.sql',import.meta.url),'utf8');
const worker=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
test('only new miner transactions with previously verified payment and value qualify',()=>{
 assert.match(sql,/c.status='unassigned_miner' AND c.payout_status='verified'/);
 assert.match(sql,/t.selector='0x19da4078'/);
 assert.match(sql,/sum\(f.amount_raw::numeric\)=c.payout_amount_raw::numeric/);
 assert.match(sql,/f.value_usd IS NOT NULL/);
 assert.match(sql,/min\(f.price_source\)=max\(f.price_source\)/);
});
test('never infer a bot identity, existing claim safe, service role only',()=>{
 assert.match(sql,/NULL::text,NULL::bigint/);
 assert.match(sql,/'Nicht zugeordnet','Mining-Bot'/);
 assert.match(sql,/ON CONFLICT \(user_id,project_key,chain_key,tx_hash\) DO NOTHING/);
 assert.match(sql,/auth.role\(\) IS DISTINCT FROM 'service_role'/);
});
test('worker leaves daily job staged and calls integration only after full raw import',()=>{
 assert.match(worker,/wallettracking_dao_create_verified_unassigned_miner_claims/);
 assert.match(worker,/canonicallyCreatedUnassignedMinerClaims/);
 assert.match(worker,/queueState:partial\?'partial':'staged'/);
 assert.doesNotMatch(worker,/wallettracking_reward_complete/);
});
