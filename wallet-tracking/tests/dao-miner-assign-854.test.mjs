import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

const sql=readFileSync(new URL('../supabase/migrations/20261115162034_dao_single_miner_nft_assignment_854.sql',import.meta.url),'utf8')
const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')

test('8.54 SQL remains confined to the verified pilot',()=>{
 assert.match(sql,/0xed667ac1962cbc234629b0d1258378192087f0c2445c26a6f22a99a6a2b71b32/)
 assert.match(sql,/p_collection_id IS DISTINCT FROM 32887/)
 assert.match(sql,/p_nft_id IS DISTINCT FROM 37084/)
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/)
 assert.match(sql,/FOR UPDATE/)
 assert.match(sql,/Complete NFT transfer coverage required/)
 assert.match(sql,/Same-block NFT transfer ambiguity/)
 assert.match(sql,/Historical last NFT owner mismatch/)
 assert.match(sql,/SET nft_contract=v_contract,nft_id=p_nft_id,status='pending'/)
 assert.doesNotMatch(sql,/INSERT INTO public\.project_nft_claims/i)
 assert.doesNotMatch(sql,/UPDATE public\.project_transactions/i)
})

test('8.54 Edge commit remains behind live event preview and SQL guard',()=>{
 assert.match(edge,/admin-miner-event-preview-853'\|\|body\?\.mode==='admin-miner-nft-assign-854'/)
 assert.match(edge,/if\(commit&&!ready\)/)
 assert.match(edge,/if\(commit&&ready\)/)
 assert.match(edge,/wallettracking_dao_assign_single_miner_nft_854/)
 assert.match(edge,/uniqueMinerRewardEvent853\(logs,txHash\)/)
})
