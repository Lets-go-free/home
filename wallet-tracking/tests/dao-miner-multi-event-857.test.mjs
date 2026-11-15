import assert from 'node:assert/strict'
import test from 'node:test'
import {aggregateMinerRewardEvents857} from '../supabase/functions/dao-reward-refresh/miner-multi-event-857.js'
import {REWARD_CLAIMED_TOPIC_853} from '../supabase/functions/dao-reward-refresh/miner-event-853.js'

const miner='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d'
const staker='0x39180b13f5bd24432f01535ceb2c069fd2adf937'
const hash='0x'+'a'.repeat(64)
const p=n=>'0x'+BigInt(n).toString(16).padStart(64,'0')
const event=(index,collection,token,amount,address=staker)=>({
 index,address:{hash:miner},tx_hash:hash,
 topics:[REWARD_CLAIMED_TOPIC_853,p(collection),p(token),'0x'+address.slice(2).padStart(64,'0')],data:p(amount)
})

test('8.57 aggregates multiple collection rewards exactly in Wei for one NFT',()=>{
 const proof=aggregateMinerRewardEvents857([
  event(0,32888,37084,'272476981132075471'),
  event(1,32889,37084,'205525494339622641'),
  event(2,32890,37084,'55014400000000000')],hash)
 assert.deepEqual(proof,{tokenId:'37084',staker,amountRaw:'533016875471698112',
  eventCount:3,collectionIds:['32888','32889','32890']})
})
test('8.57 rejects mixed tokenIds and stakers even if event amounts are positive',()=>{
 assert.equal(aggregateMinerRewardEvents857([event(0,32888,37084,1),event(1,32889,37085,2)],hash),null)
 assert.equal(aggregateMinerRewardEvents857([event(0,32888,37084,1),event(1,32889,37084,2,miner)],hash),null)
})
test('8.57 rejects duplicate or missing log indices and malformed matching events',()=>{
 assert.equal(aggregateMinerRewardEvents857([event(0,32888,37084,1),event(0,32889,37084,2)],hash),null)
 const noIndex={...event(0,32888,37084,1)};delete noIndex.index
 assert.equal(aggregateMinerRewardEvents857([noIndex],hash),null)
 assert.equal(aggregateMinerRewardEvents857([event(0,32888,37084,0)],hash),null)
})
test('8.57 ignores unrelated logs and refuses wrong contract/transaction',()=>{
 const unrelated={index:11,address:{hash:staker},topics:[p(4)],data:p(1)}
 assert.equal(aggregateMinerRewardEvents857([unrelated,event(1,32888,37084,4)],hash).amountRaw,'4')
 assert.equal(aggregateMinerRewardEvents857([event(0,32888,37084,1)],'0x'+'b'.repeat(64)),null)
})
