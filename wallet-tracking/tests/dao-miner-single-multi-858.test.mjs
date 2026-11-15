import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const base=new URL('../',import.meta.url);
const edge=readFileSync(new URL('supabase/functions/dao-reward-refresh/index.ts',base),'utf8');
const sql=readFileSync(new URL('supabase/migrations/20261115175153_dao_multi_event_miner_assignment_858.sql',base),'utf8');
const body=edge.slice(edge.indexOf("if(body?.mode==='admin-miner-multi-nft-assign-858')"),edge.indexOf("// 8.56: bounded multi-candidate"));

test('8.58 route is one transaction, one wallet and admin-only',()=>{
 assert.match(body,/body\.walletId!==targetWallet\|\|body\.txHash!==target/);
 assert.match(body,/authenticateInspectAdmin\(request\)/);
 assert.match(body,/DAO_REWARD_ENABLE_LIVE_WORKER/);
 assert.match(body,/event\.eventCount!==499/);
 assert.match(body,/aggregateMinerRewardEvents857\(logs,target\)/);
 assert.match(body,/nativeClaimPayout\(address,t\)/);
 assert.match(body,/evaluateMinerPreview856/);
 assert.equal((body.match(/sb\.rpc\(/g)||[]).length,1);
});
test('8.58 SQL independently guards the one candidate and only writes NFT fields',()=>{
 assert.match(sql,/p_wallet IS DISTINCT FROM '8a3c5dc6-0610-482d-a327-3f3ba03db158'/);
 assert.match(sql,/p_user IS DISTINCT FROM 'f1c89973-f40b-402a-9670-33cee7300b1e'/);
 assert.match(sql,/p_event_count IS DISTINCT FROM 499/);
 assert.match(sql,/p_event_amount_raw IS DISTINCT FROM '54477996600093324995'/);
 assert.match(sql,/FOR UPDATE/);
 assert.match(sql,/Complete NFT transfer coverage required/);
 assert.match(sql,/Canonical claim already present/);
 assert.match(sql,/price_source NOT LIKE '%exact-v13%'/);
 assert.match(sql,/SET nft_contract=v_contract,nft_id=p_nft_id,status='pending'/);
 assert.doesNotMatch(sql,/updated_at=now\(\)/);
 assert.doesNotMatch(sql,/INSERT INTO|DELETE FROM/i);
 assert.match(sql,/GRANT EXECUTE.*service_role/);
});
