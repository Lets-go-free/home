import assert from 'node:assert/strict'
import test from 'node:test'
import {parseMinerRewardEvent853,uniqueMinerRewardEvent853,REWARD_CLAIMED_TOPIC_853} from '../supabase/functions/dao-reward-refresh/miner-event-853.js'

const tx='0xed667ac1962cbc234629b0d1258378192087f0c2445c26a6f22a99a6a2b71b32'
const pad=n=>'0x'+BigInt(n).toString(16).padStart(64,'0')
const miner='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d'
const staker='0x39180b13f5bd24432f01535ceb2c069fd2adf937'
const log={address:{hash:miner},topics:[REWARD_CLAIMED_TOPIC_853,pad(32887),pad(37084),'0x'+staker.slice(2).padStart(64,'0')],data:pad(72141524528301886n),tx_hash:tx}

test('8.53 decodes observed indexed reward event without precision loss',()=>{
 assert.deepEqual(parseMinerRewardEvent853(log,tx),{collectionId:'32887',tokenId:'37084',staker,amountRaw:'72141524528301886'})
})
test('8.53 rejects duplicate evidence',()=>assert.equal(uniqueMinerRewardEvent853([log,log],tx),null))
test('8.53 rejects wrong contract and wrong event signature',()=>{
 assert.equal(parseMinerRewardEvent853({...log,address:{hash:staker}},tx),null)
 assert.equal(parseMinerRewardEvent853({...log,topics:[pad(3),...log.topics.slice(1)]},tx),null)
})
test('8.53 rejects zero payouts, malformed logs and mismatched transaction',()=>{
 assert.equal(parseMinerRewardEvent853({...log,data:pad(0)},tx),null)
 assert.equal(parseMinerRewardEvent853({...log,topics:log.topics.slice(0,3)},tx),null)
 assert.equal(parseMinerRewardEvent853({...log,tx_hash:'0x'+'a'.repeat(64)},tx),null)
})
