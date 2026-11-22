import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const coreSource=fs.readFileSync(new URL('../js/tln-reward-verification-core.js',import.meta.url),'utf8');
const browser=fs.readFileSync(new URL('../projects/tln-vow/tln-vow-discovery.js',import.meta.url),'utf8');
const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const context={};vm.runInNewContext(coreSource,context);
const core=context.WT_TLN_REWARD_VERIFICATION_CORE;
assert.ok(browser.includes('WT_TLN_REWARD_VERIFICATION_CORE.verifiedStakeTxRewardClaims('),
  'browser Step 4 must use exactly the shared stake assignment rule');
assert.ok(edge.includes('verificationCore.reconcileVerifiedStakeReceipt('),
  'Edge must reconcile the same manual stake claims');
const wallet='0x'+'a'.repeat(40),token='0x'+'b'.repeat(40),contract='0x'+'c'.repeat(40),zero='0x'+'0'.repeat(40);
for(const [n,amount] of [250,45000,5500].entries()){
  const hash='0x'+String(n+1).repeat(64),raw=(BigInt(amount)*10n**18n).toString();
  const lot={stakeTx:hash,stakeTime:'2024-12-14T00:00:00Z',staking:{contract_address:contract},
    stakeRewardEvidence:[]};
  const provenRows=[{hash,token,symbol:'TLN+',decimals:18,amount,
    from:zero,to:wallet,selector:'0xa7d545db',calledContract:contract,
    rewardProof:'mint',rewardFlowEvidence:'mint_to_wallet'}];
  const assigned=core.verifiedStakeTxRewardClaims([lot],provenRows,wallet);
  assert.equal(assigned.length,1);
  assert.equal(assigned[0].claim.assignmentReasonCode,'verified_stake_tx_reward');
  assert.equal(assigned[0].claim.amount,amount);
  const receipt={receiptVerified:true,knownBridge:false,
    transfers:[{token,from:zero,to:wallet,amountRaw:'0x'+BigInt(raw).toString(16),logIndex:4}]};
  const reconciled=core.reconcileVerifiedStakeReceipt({wallet,hash,receipt,lots:[lot],provenRows});
  assert.equal(reconciled.length,1);
  assert.equal(reconciled[0].amountRaw,raw);
  assert.equal(reconciled[0].alreadyInManualDiscovery,true);
  assert.equal(core.reconcileVerifiedStakeReceipt({wallet,hash,receipt:{...receipt,knownBridge:true},lots:[lot],provenRows}).length,0);
  assert.equal(core.reconcileVerifiedStakeReceipt({wallet,hash,receipt:{...receipt,transfers:[]},lots:[lot],provenRows}).length,0);
  assert.equal(core.reconcileVerifiedStakeReceipt({wallet,hash,receipt:{...receipt,transfers:[...receipt.transfers,...receipt.transfers]},lots:[lot],provenRows}).length,0);
}
console.log('9.47: browser Step-4 stake claim and Edge receipt reconciliation share identical selection for 250/45000/5500 TLN+');
