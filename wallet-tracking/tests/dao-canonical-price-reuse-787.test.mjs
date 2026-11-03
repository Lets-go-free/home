import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
const files=readdirSync(new URL('../supabase/migrations/',import.meta.url));
const file=files.find(x=>/^\d{14}_dao_canonical_exact_block_price_reuse_787\.sql$/.test(x));
assert.ok(file,'migration filename must use 14-digit timestamp');
const sql=readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8');
const worker=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
test('prices reuse only canonical exactly matching token/block/decimals within same wallet',()=>{
 for(const part of ['valued.block_number=target.block_number','valued.token=lower(target.token_address)','valued.token_decimals=target.token_decimals','f.user_id=p_user AND f.wallet_id=p_wallet','target.user_id=p_user AND target.wallet_id=p_wallet'])assert.ok(sql.includes(part),part);
});
test('never overwrite prior valuations or accept conflicting price proofs',()=>{
 assert.match(sql,/min\(f.price_usd\)=max\(f.price_usd\)/);
 assert.match(sql,/min\(f.price_source\)=max\(f.price_source\)/);
 assert.match(sql,/target.price_usd IS NULL AND target.value_usd IS NULL/);
 assert.match(sql,/f.price_usd IS NULL AND f.value_usd IS NULL/);
 assert.match(sql,/target.amount_raw ~ '\^\[0-9\]\+\$'/);
});
test('service only and rejects invalid wallet or unbounded requests',()=>{
 assert.match(sql,/auth.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.match(sql,/Wallet ownership mismatch/);
 assert.match(sql,/p_limit > 500/);
 assert.match(sql,/GRANT EXECUTE.*TO service_role/);
});
test('worker reuses price only after full raw import and before claim reconciliation',()=>{
 const i=worker.indexOf("wallettracking_dao_reuse_exact_block_prices");
 assert.ok(i>0);
 assert.ok(worker.lastIndexOf('if(txProgress.complete&&flowProgress.complete)',i)>0);
 assert.ok(i<worker.indexOf('wallettracking_dao_reconcile_verified_claims'));
 assert.match(worker,/canonicallyPricedFlows/);
 assert.doesNotMatch(worker,/wallettracking_reward_complete/);
});
