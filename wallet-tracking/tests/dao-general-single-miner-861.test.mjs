import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const edge=readFileSync(new URL('supabase/functions/dao-reward-refresh/index.ts',root),'utf8');
const sql=readFileSync(new URL('supabase/migrations/20261115190509_dao_general_single_miner_assignment_861.sql',root),'utf8');
const route=edge.slice(edge.indexOf("if(body?.mode==='admin-miner-nft-preview-861'"),edge.indexOf(' // 8.59: second approved'));

test('8.61 general route has separate read-only preview and one guarded NFT writer',()=>{
 assert.match(route,/admin-miner-nft-preview-861/);
 assert.match(route,/admin-miner-nft-assign-861/);
 assert.match(route,/const commit=body.mode/);
 assert.match(route,/if\(!commit\)return reply/);
 assert.match(route,/authenticateInspectAdmin/);
 assert.match(route,/DAO_REWARD_ENABLE_LIVE_WORKER/);
 assert.match(route,/aggregateMinerRewardEvents857/);
 assert.match(route,/nativeClaimPayout/);
 assert.match(route,/evaluateMinerPreview856/);
 assert.match(route,/wallettracking_dao_assign_multi_miner_nft_861/);
 assert.equal((route.match(/sb\.rpc\(/g)||[]).length,1);
 for(const hash of ['0xed7beb78eae4965a64a2dd929edb7cf3c39ef5731b8093d445ec848d05ec93be',
  '0xb4090cfae1d9a3d86e68755d2130a87e38e172626a948ebac2b7b17bdb806954'])
  assert.ok(!route.includes(hash),'pilot transaction must not be hardcoded');
 assert.doesNotMatch(route,/\.update\(|\.upsert\(|\.insert\(|\.delete\(/);
});

test('8.61 SQL validates dynamic target, immutable exact-v13 flow and NFT ownership',()=>{
 assert.match(sql,/p_tx !~ '\^0x\[0-9a-f\]\{64\}\$'/);
 assert.match(sql,/p_event_count<1 OR p_event_count>1000/);
 assert.match(sql,/p_collection_id<=0/);
 assert.match(sql,/p_nft_id<=0/);
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.match(sql,/FOR UPDATE/);
 assert.match(sql,/Canonical claim already present/);
 assert.match(sql,/Payout flow or exact historical price mismatch/);
 assert.match(sql,/Complete NFT transfer coverage required/);
 assert.match(sql,/SET nft_contract=v_contract,nft_id=p_nft_id,status='pending'/);
 assert.match(sql,/GRANT EXECUTE.*TO service_role/);
 assert.doesNotMatch(sql,/INSERT INTO|DELETE FROM|updated_at=now\(\)/i);
 for(const amount of ['50945303137912696144','54477996600093324995'])
  assert.ok(!sql.includes(amount),'pilot amounts must not be hardcoded');
});
