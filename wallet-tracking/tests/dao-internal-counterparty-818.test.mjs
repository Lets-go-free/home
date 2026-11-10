import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rewardFlowCounterparty } from '../supabase/functions/dao-reward-refresh/counterparty-policy.js';

const root = new URL('../',import.meta.url);
const edge = readFileSync(new URL('supabase/functions/dao-reward-refresh/index.ts',root),'utf8');
const browser = readFileSync(new URL('projects/dao1/dao1.js',root),'utf8');
const a='0x239c5822a0d2a67e629d7a3b5c8180721e228b47';
const b='0xc7e112d6db20a4a9213834b2cb235c34733e6591';
const external='0xcd40d3bcfc29c51edb1fdd78580578362366f856';
const zero='0x0000000000000000000000000000000000000000';
const own=new Set([a,b]);

test('8.18 never persists a second own wallet address as counterparty',()=>{
 assert.equal(rewardFlowCounterparty('eingang',a,b,b,own),null);
 assert.equal(rewardFlowCounterparty('ausgang',a,b,a,own),null);
 assert.equal(rewardFlowCounterparty('intern',a,a,a,own),null);
});
test('8.18 preserves third-party and zero-address provenance',()=>{
 assert.equal(rewardFlowCounterparty('eingang',external,a,a,own),external);
 assert.equal(rewardFlowCounterparty('ausgang',a,external,a,own),external);
 assert.equal(rewardFlowCounterparty('eingang',zero,a,a,own),zero);
 assert.equal(rewardFlowCounterparty('eingang','',a,a,own),null);
});
test('8.18 no referral or token history rewrite and private per-user decrypt',()=>{
 assert.match(edge,/import \{ rewardFlowCounterparty \} from '\.\/counterparty-policy\.js'/);
 assert.match(edge,/const ownAddresses=await ownAddressesForJob\(job\)/);
 assert.match(edge,/counterparty_address:rewardFlowCounterparty\(direction,from,to,address,ownAddresses\)/);
 assert.match(edge,/\.eq\('user_id',user\)/);
 assert.match(edge,/await decryptWalletField\(key,user,wallet\.id,wallet\.evm_address_ciphertext,'evm_address'\)/);
 assert.match(edge,/Unsupported own-wallet encryption metadata/);
 assert.match(edge,/const referralCoverage=address===REFERRAL_WALLET/);
 assert.match(browser,/if\(to===a\)return own\.has\(from\)\?null:from;/);
 assert.match(browser,/if\(from===a\)return own\.has\(to\)\?null:to;/);
});
