import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

const source=readFileSync(new URL('../supabase/migrations/20261115162034_dao_single_miner_nft_assignment_854.sql',import.meta.url),'utf8')
const fixed=readFileSync(new URL('../supabase/migrations/20261115162700_dao_single_miner_nft_assignment_fix_855.sql',import.meta.url),'utf8')

test('8.55 only removes missing candidate updated_at assignment',()=>{
 const normalize=s=>s.replace(/^-- WalletTracking 8\.5[45] \| .*$/m,'-- release')
 assert.equal(normalize(fixed),normalize(source).replace("status='pending',updated_at=now()","status='pending'"))
 assert.doesNotMatch(fixed,/updated_at\s*=/)
 assert.match(fixed,/CREATE OR REPLACE FUNCTION public\.wallettracking_dao_assign_single_miner_nft_854/)
 assert.match(fixed,/p_tx IS DISTINCT FROM/)
 assert.match(fixed,/auth\.role\(\) IS DISTINCT FROM 'service_role'/)
})
