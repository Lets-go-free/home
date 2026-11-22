import assert from 'node:assert/strict';
import fs from 'node:fs';
const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
assert.ok(edge.includes("'historical-smartnode-parent-rpc-check'"));
assert.ok(edge.includes("mode==='historical-smartnode-parent-rpc-check'"));
assert.ok(edge.includes(".from('tln_vow_smartnode_graph_cache')"));
assert.ok(edge.includes('await onchainSmartNodeParent(evmAddress(selected.child_wallet)!,Date.now()+16000)'));
for(const status of ['no_verified_graph_edge','parent_agreement','parent_disagreement','onchain_unresolved'])
  assert.ok(edge.includes(status));
assert.ok(edge.includes('selectedFromKnownSnapshot:'));
console.log('9.65 single verified cached parent vs live shared RPC, read-only');
