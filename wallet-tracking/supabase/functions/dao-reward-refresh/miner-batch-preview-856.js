// Pure, fail-closed guard for the read-only 8.56 three-candidate preview.
const contract = '0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d'
const lower = x => String(x || '').toLowerCase()
const blocked = reason => ({ready:false,reason})

export function evaluateMinerPreview856({candidate:c,tx:t,flows,event,observed,ownership,coverage,transfers,address}) {
  if (!c || !t || c.status !== 'unassigned_miner' || c.payout_status !== 'pending' ||
      c.audit_classification != null || c.canonical_existing_verified === true ||
      c.claim_pipeline_status !== 'pending' || c.nft_id != null || c.nft_contract != null)
    return blocked('candidate-not-eligible')
  const block = Number(c.claim_block)
  if (!Number.isSafeInteger(block) || block <= 0 || Number(t.block_number) !== block ||
      t.selector !== '0x19da4078' || !['ok','success'].includes(lower(t.status)) ||
      lower(t.to_address) !== contract || lower(t.from_address) !== lower(address) ||
      !/^0x[0-9a-f]{40}$/.test(lower(address)) ||
      Number(t.claim_reward_aptm || 0) !== 0 || Number(t.claim_reward_usd || 0) !== 0 ||
      t.claim_nft_id != null) return blocked('transaction-or-wallet-mismatch')
  if (!event || event.staker !== lower(address) || !/^[0-9]+$/.test(event.tokenId || '') ||
      !/^[0-9]+$/.test(event.collectionId || '') ||
      !/^[0-9]+$/.test(event.amountRaw || '')) return blocked('reward-event-missing-or-ambiguous')
  if (!observed || lower(observed.counterparty_address) !== contract ||
      observed.amount_raw !== event.amountRaw) return blocked('explorer-native-payout-mismatch')
  if (!Array.isArray(flows) || flows.length !== 1 || flows[0].direction !== 'eingang' ||
      flows[0].token_address !== 'native' || flows[0].token_decimals !== 18 ||
      flows[0].flow_key !== `claim-native:${lower(t.tx_hash)}` ||
      flows[0].amount_raw !== event.amountRaw ||
      lower(flows[0].counterparty_address) !== contract ||
      flows[0].value_usd == null || !String(flows[0].price_source || '').includes('exact-v13'))
    return blocked('persisted-flow-or-exact-price-mismatch')
  if (!Array.isArray(ownership) || ownership.length !== 1 ||
      Number(ownership[0].owned_from_block) > block ||
      (ownership[0].owned_to_block != null && Number(ownership[0].owned_to_block) < block))
    return blocked('historical-ownership-interval-missing')
  if (!Array.isArray(coverage) || coverage.length !== 1 || coverage[0].is_complete !== true ||
      !Array.isArray(transfers) || transfers.length >= 1000 ||
      transfers.length !== Number(coverage[0].transfer_count))
    return blocked('nft-transfer-coverage-incomplete')
  if (transfers.some(x => Number(x.block_number) === block))return blocked('nft-same-block-transfer')
  const prior = transfers.filter(x => Number(x.block_number) < block)
    .sort((a,b)=>Number(b.block_number)-Number(a.block_number)||Number(b.log_index)-Number(a.log_index))
  if (!prior.length || prior.filter(x=>Number(x.block_number)===Number(prior[0].block_number)).length!==1 ||
      lower(prior[0].to_address) !== lower(address))return blocked('historical-last-owner-mismatch')
  return {ready:true,reason:'all-preview-guards-passed'}
}
