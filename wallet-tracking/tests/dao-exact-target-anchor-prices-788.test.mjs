import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const dir=new URL('../supabase/migrations/',import.meta.url);
const name=readdirSync(dir).find(x=>/^\d{14}_dao_exact_target_anchor_prices_788\.sql$/.test(x));
assert.ok(name,'Migration must have exactly 14 timestamp digits');
const sql=readFileSync(new URL(name,dir),'utf8');
const worker=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
test('canonical anchors require exact target block, parser, pool, and market start',()=>{
 for(const s of ['a.target_block=f.block_number','a.parser_version=1',"lower(a.pool_address)='0x38acbfa5108d3c76d6cea4d380182e832a289b57'",'f.block_number >= 88356','a.sync_block <= f.block_number'])assert.ok(sql.includes(s),s);
 assert.doesNotMatch(sql.replace(/^--.*$/gm,''),/aptm_price_history|ORDER BY a\.target_block DESC|a.target_block<=f.block_number/i);
});
test('accept native APTM or exact verified wAPTM token, not symbol-only ERC20',()=>{
 assert.match(sql,/lower\(f\.token_address\)='native' AND upper\(f\.token_symbol\)='APTM'/);
 assert.match(sql,/lower\(f\.token_address\)='0x110ac02ba3384bc055c13a87766049a74517beda'/);
 assert.match(sql,/f.amount_raw ~ '\^\[0-9\]\+\$'/);
});
test('no overwrite, bounded & service-role only',()=>{
 for(const s of ['f.price_usd IS NULL AND f.value_usd IS NULL','p_limit > 500','Service role required','Wallet ownership mismatch','GRANT EXECUTE ON FUNCTION'])assert.ok(sql.includes(s),s);
});
test('worker calls canonical anchor reuse before same-block reuse and reconciliation',()=>{
 const anchor=worker.indexOf("sb.rpc('wallettracking_dao_apply_exact_target_anchors'");
 const flow=worker.indexOf("sb.rpc('wallettracking_dao_reuse_exact_block_prices'");
 const reconcile=worker.indexOf("sb.rpc('wallettracking_dao_reconcile_verified_claims'");
 assert.ok(anchor>0&&anchor<flow&&flow<reconcile);
 assert.match(worker,/exactAnchorPricedFlows/);
 assert.doesNotMatch(worker,/wallettracking_reward_complete/);
});
