import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../js/tln-reward-verification-core.js',import.meta.url),'utf8');
const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const context={};vm.runInNewContext(source,context);
const detect=context.WT_TLN_REWARD_VERIFICATION_CORE.discoverNewMintRewardCandidates;
const wallet='0x'+'a'.repeat(40),staking='0x'+'b'.repeat(40),token='0x'+'c'.repeat(40),hash='0x'+'d'.repeat(64);
const mint={token,from:'0x'+'0'.repeat(40),to:wallet,amountRaw:'0x10',logIndex:4};
const input={wallet,hash,calledContract:staking,stakingContracts:[staking],
  receipt:{receiptVerified:true,knownBridge:false,transfers:[mint]}};
assert.equal(detect(input).length,1);
assert.equal(detect(input)[0].rewardVerified,false);
assert.equal(detect({...input,stakingContracts:[]}).length,0);
assert.equal(detect({...input,stakingContracts:[],knownLifecycle:true}).length,1);
assert.equal(detect({...input,receipt:{...input.receipt,receiptVerified:false}}).length,0);
assert.equal(detect({...input,receipt:{...input.receipt,knownBridge:true}}).length,0);
assert.equal(detect({...input,receipt:{...input.receipt,transfers:[{...mint,from:staking}]}}).length,0);
assert.equal(detect({...input,receipt:{...input.receipt,transfers:[{...mint,amountRaw:'0x0'}]}}).length,0);
assert.equal(detect({...input,receipt:{...input.receipt,transfers:[mint,mint]}}).length,1);
assert.ok(edge.includes('function discoverNewMintRewardCandidates(input)'));
assert.ok(edge.includes('newRewardMintCandidates:newCandidates'));
assert.ok(edge.includes('reward_classification_verified:false'));
console.log('9.41: new on-chain mint candidates discovered without manual snapshots, never confirmed as rewards');
