// 8.53: strict, read-only parser for the on-chain RewardClaimed event.
// Event: RewardClaimed(uint256 indexed collectionId,uint256 indexed tokenId,address indexed staker,uint256 amount)
export const REWARD_CLAIMED_TOPIC_853 = '0xa8325f46ec9623d7ced8f695ff820511a4acef4f5d5c4933bd5d992141a2b905'
const MINER = '0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d'
const hex32 = x => typeof x === 'string' && /^0x[0-9a-fA-F]{64}$/.test(x)
const addr = x => typeof x === 'string' && /^0x[0-9a-fA-F]{40}$/.test(x) ? x.toLowerCase() : null

export function parseMinerRewardEvent853(log, txHash) {
  const topics = log?.topics
  if (!Array.isArray(topics) || topics.length !== 4 || !topics.every(hex32) || !hex32(log?.data)) return null
  if (topics[0].toLowerCase() !== REWARD_CLAIMED_TOPIC_853 ||
      String(log?.address?.hash || log?.address_hash || log?.address || '').toLowerCase() !== MINER) return null
  const indexedAddress = '0x'+topics[3].slice(26).toLowerCase()
  const collection = BigInt(topics[1]), token = BigInt(topics[2]), amount = BigInt(log.data)
  if (collection > 9223372036854775807n || token > 9223372036854775807n ||
      amount <= 0n || !addr(indexedAddress) ||
      String(log?.tx_hash || log?.transaction_hash || txHash).toLowerCase() !== txHash.toLowerCase()) return null
  return {collectionId:collection.toString(),tokenId:token.toString(),staker:indexedAddress,amountRaw:amount.toString()}
}

export function uniqueMinerRewardEvent853(logs, txHash) {
  const matches = logs.map(log => parseMinerRewardEvent853(log, txHash)).filter(Boolean)
  return matches.length === 1 ? matches[0] : null
}
