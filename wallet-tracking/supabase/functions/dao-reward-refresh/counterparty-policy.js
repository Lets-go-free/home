// Shared DAO1 counterparty storage policy (matches browser tokenFlowCounterparty).
// Internal own-wallet transfers deliberately do not persist a second own address.
// Contract provenance is retained for external sources, including verified referrals.
export function rewardFlowCounterparty(direction, from, to, walletAddress, ownAddresses) {
  const addr = value => String(value || '').toLowerCase();
  const a = addr(walletAddress), sender = addr(from), recipient = addr(to);
  if (sender === a && recipient === a) return null;
  if (direction === 'eingang' && recipient === a) {
    return sender && !ownAddresses.has(sender) ? sender : null;
  }
  if (direction === 'ausgang' && sender === a) {
    return recipient && !ownAddresses.has(recipient) ? recipient : null;
  }
  return null;
}
