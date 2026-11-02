import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const src = readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
assert.match(src,/from\('project_nft_ownership'\)/);
assert.match(src,/\.eq\('user_id',job\.user_id\)\.eq\('wallet_id',job\.wallet_id\)\.eq\('project_key',PROJECT\)/);
assert.match(src,/prior\._contract!==contract\)known\.set\(normalizedId,null\)/);
assert.match(src,/historicalNftOwnership\(\{_contract:item\.nft_contract,tokenId:item\.nft_id\},address,Number\(item\.claim_block\)\)/);
console.log('Historical NFT candidate checks passed');
