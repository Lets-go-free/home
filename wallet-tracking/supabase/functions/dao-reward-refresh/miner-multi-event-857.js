import {parseMinerRewardEvent853,REWARD_CLAIMED_TOPIC_853} from './miner-event-853.js'

const miner='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d'
const lower=x=>String(x?.hash||x?.address_hash||x?.address||x||'').toLowerCase()

// Return one aggregated claim proof only when every RewardClaimed log from the
// mining contract refers to the SAME NFT and staker, with unique log indices.
// Caller must independently match this exact Wei total to internal payout and
// persisted flow. Other events do not establish or change ownership.
export function aggregateMinerRewardEvents857(logs,txHash){
 if(!Array.isArray(logs)||!logs.length||logs.length>1000||!/^0x[0-9a-f]{64}$/.test(txHash))return null
 const matches=[],indices=new Set()
 for(const log of logs){
  if(lower(log?.address)!==miner || String(log?.topics?.[0]||'').toLowerCase()!==REWARD_CLAIMED_TOPIC_853)continue
  const event=parseMinerRewardEvent853(log,txHash)
  if(!event)return null
  const index=log.index??log.log_index
  if(index==null||!/^(0|[1-9][0-9]*)$/.test(String(index)))return null
  const key=String(BigInt(index))
  if(indices.has(key))return null
  indices.add(key);matches.push(event)
 }
 if(!matches.length)return null
 const first=matches[0],collections=new Set()
 if(matches.some(e=>e.tokenId!==first.tokenId||e.staker!==first.staker))return null
 const sum=matches.reduce((n,e)=>{
  collections.add(e.collectionId)
  return n+BigInt(e.amountRaw)
 },0n)
 if(sum<=0n)return null
 return {tokenId:first.tokenId,staker:first.staker,amountRaw:sum.toString(),
  eventCount:matches.length,collectionIds:[...collections].sort((a,b)=>BigInt(a)<BigInt(b)?-1:BigInt(a)>BigInt(b)?1:0)}
}
