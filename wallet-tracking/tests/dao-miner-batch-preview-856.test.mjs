import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import {evaluateMinerPreview856} from '../supabase/functions/dao-reward-refresh/miner-batch-preview-856.js'

const addr='0x39180b13f5bd24432f01535ceb2c069fd2adf937'
const miner='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d'
const txHash='0x'+'a'.repeat(64)
const source={
 candidate:{status:'unassigned_miner',payout_status:'pending',claim_pipeline_status:'pending',audit_classification:null,canonical_existing_verified:false,nft_id:null,nft_contract:null,claim_block:14099107},
 tx:{tx_hash:txHash,block_number:14099107,selector:'0x19da4078',status:'ok',to_address:miner,from_address:addr,claim_nft_id:null,claim_reward_aptm:null,claim_reward_usd:null},
 flows:[{flow_key:`claim-native:${txHash}`,direction:'eingang',token_address:'native',token_decimals:18,amount_raw:'72141524528301886',counterparty_address:miner,value_usd:'0.0063171887167288',price_source:'APTM/wUSDT Pool · Sync Block 14099107 · exact-v13'}],
 event:{collectionId:'32887',tokenId:'37084',staker:addr,amountRaw:'72141524528301886'},
 observed:{counterparty_address:miner,amount_raw:'72141524528301886'},
 ownership:[{owned_from_block:14098941,owned_to_block:null}],
 coverage:[{is_complete:true,transfer_count:3}],
 transfers:[{block_number:14098941,log_index:1,to_address:addr},{block_number:14098000,log_index:1,to_address:addr},{block_number:14097000,log_index:1,to_address:addr}],
 address:addr
}
const assess=changes=>evaluateMinerPreview856({...source,...changes})
test('8.56 accepts complete, independently consistent read-only evidence',()=>assert.deepEqual(assess({}),{ready:true,reason:'all-preview-guards-passed'}))
test('8.56 refuses prior claims and unverified assets',()=>{
 assert.equal(assess({candidate:{...source.candidate,claim_pipeline_status:'completed'}}).ready,false)
 assert.equal(assess({candidate:{...source.candidate,payout_status:'verified'}}).ready,false)
 assert.equal(assess({flows:[{...source.flows[0],value_usd:null}]}).ready,false)
})
test('8.56 refuses event/payout mismatches',()=>{
 assert.equal(assess({event:{...source.event,staker:miner}}).ready,false)
 assert.equal(assess({observed:{...source.observed,amount_raw:'1'}}).ready,false)
})
test('8.56 refuses missing or ambiguous historical ownership',()=>{
 assert.equal(assess({ownership:[]}).ready,false)
 assert.equal(assess({coverage:[{is_complete:false,transfer_count:3}]}).ready,false)
 assert.equal(assess({transfers:[{...source.transfers[0],block_number:14099107},...source.transfers.slice(1)]}).ready,false)
 assert.equal(assess({transfers:[{...source.transfers[0],to_address:miner},...source.transfers.slice(1)]}).ready,false)
})
test('8.56 endpoint has bounded read-only surface',()=>{
 const code=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')
 const region=code.split("if(body?.mode==='admin-miner-batch-preview-856'){")[1].split('// 8.53: one strictly read-only')[0]
 assert.match(region,/limit\(3\)/)
 assert.match(region,/from\('dao_reward_claim_candidates'\)\s*\.select\(/)
 assert.match(region,/uniqueMinerRewardEvent853/)
 assert.match(region,/evaluateMinerPreview856/)
 assert.doesNotMatch(region,/sb\.rpc\(|\.upsert\(|\.insert\(|\.update\(|\.delete\(/)
})
