import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const sql=read('../supabase/migrations/20261109171222_dao_historical_nft_assignment_811.sql');
const browser=read('../projects/dao1/dao1.js');
const server=read('../supabase/functions/dao-reward-refresh/index.ts');
const index=read('../index.html');
test('browser and server call precisely one shared evidence RPC',()=>{
 assert.match(browser,/sb\.rpc\('wallettracking_dao_reconcile_nft_claims'/);
 assert.match(server,/mode==='reconcile-nft-test-wallet'/);
 assert.match(server,/sb\.rpc\('wallettracking_dao_reconcile_nft_claims'/);
 assert.match(server,/authenticateInspectAdmin\(request\)/);
 assert.match(server,/DAO_REWARD_ENABLE_LIVE_WORKER/);
});
test('migration requires strict history and immutable financial fields',()=>{
 for(const phrase of ['h.is_complete=true','h.transfer_count','same_block.block_number=c.claim_block','prev.block_number<c.claim_block','HAVING COUNT(*)=1','AND t.claim_nft_id IS NULL','AND n.nft_id IS NULL','auth.uid() IS DISTINCT FROM p_user'])assert.ok(sql.includes(phrase),phrase);
 const mutators=sql.match(/UPDATE public\.(?:project_transactions|project_nft_claims)[\s\S]*?GET DIAGNOSTICS/g)||[];
 assert.equal(mutators.length,2);
 for(const block of mutators){
  const set=(block.split(/ SET\s/i)[1]||'').split(/\sFROM pg_temp\./i)[0];
  for(const forbidden of ['reward_aptm','reward_usd','price_usd','amount_raw','reward_asset_amount','gas_aptm','price_source'])assert.ok(!new RegExp('\\b'+forbidden+'\\s*=').test(set),forbidden);
 }
 assert.match(sql,/ON COMMIT DROP/);
 assert.doesNotMatch(sql,/INSERT INTO public\.project_nft_claims/i);
});
test('version and cache invalidation are updated',()=>{
 assert.match(index,/window.APP_VERSION="8\.(?:11|12|13|14|15|16)"/);
 assert.match(index,/projects\/dao1\/dao1.js\?v=20261109-(?:171222|211827)/);
 assert.match(browser,/daoHistoryTxCache\.delete\(`wallet:\$\{walletIdForAddress\(address\)\}`\)/);
});
