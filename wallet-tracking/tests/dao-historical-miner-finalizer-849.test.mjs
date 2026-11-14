import {readFileSync} from 'node:fs';
import {readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const files=readdirSync(new URL('../supabase/migrations/',import.meta.url));
const file=files.find(f=>f.endsWith('_dao_verified_historical_miner_finalizer_849.sql'));
assert.ok(file,'SQL migration');
const sql=readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8');
const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
for(const term of ["c.status='pending'","c.payout_status='verified'","c.payout_token_address='native'","h.is_complete=true","h.transfer_count=","tr.block_number<c.claim_block","tr.block_number=c.claim_block","lower(t.from_address)","price_source,'') NOT LIKE '%exact-v13%'",'ON CONFLICT(user_id,project_key,chain_key,tx_hash) DO NOTHING'])
 assert.ok(sql.includes(term),term);
assert.ok(sql.includes("c.status='unassigned_miner'"),'legacy path preserved');
assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.wallettracking_dao_finalize_single_claim'),'same canonical finalizer');
assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.wallettracking_dao_preview_verified_miner_849'),'read-only selection');
assert.ok(edge.includes("body?.mode==='admin-miner-claim-preview-849'"));
assert.ok(edge.includes("body?.mode==='admin-miner-claim-single-849'"));
assert.ok(edge.includes('target.txHash!==body.txHash'),'fresh preview comparison');
assert.ok(edge.includes("sb.rpc('wallettracking_dao_finalize_single_native_claim'"),'reuses same finalizer');
console.log('8.49 static protections verified');
