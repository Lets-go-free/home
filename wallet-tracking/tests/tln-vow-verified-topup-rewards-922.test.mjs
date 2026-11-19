import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const coreSource=fs.readFileSync(new URL('../js/tln-reward-verification-core.js',import.meta.url),'utf8');
const discovery=fs.readFileSync(new URL('../projects/tln-vow/tln-vow-discovery.js',import.meta.url),'utf8');
const ctx={};vm.runInNewContext(coreSource,ctx);
const pick=ctx.WT_TLN_REWARD_VERIFICATION_CORE.verifiedTopUpMintCandidates;
const wallet='0x'+'a'.repeat(40),hash='0xacf7cfc506809bdb57435995267e1592cd7ce537296581a55be60e6668509131';
const lot={stakeTx:'0x'+'b'.repeat(64),topUps:[{tx:hash,evidence:'onchain_same_wallet_position_state',
  storageProof:{proven:true,root:3,sameFirstStateSurvives:true}}]};
const mint={hash,token:'0x29280091fa7f3abe4739ad5f1f7c5287feaf7736',symbol:'TLN+',amount:5500,
  from:'0x'+'0'.repeat(40),to:wallet,rewardProof:'receipt evidence',rewardFlowEvidence:'zero mint'};
assert.equal(pick([lot],[mint],wallet).length,1);
assert.equal(pick([lot,lot],[mint],wallet).length,0,'ambiguous lot ownership must not be assigned');
assert.equal(pick([{...lot,topUps:[{...lot.topUps[0],storageProof:{proven:false}}]}],[mint],wallet).length,0);
assert.equal(pick([lot],[{...mint,from:'0x'+'c'.repeat(40)}],wallet).length,0);
assert.equal(pick([lot],[{...mint,to:'0x'+'c'.repeat(40)}],wallet).length,0);
assert.equal(pick([lot],[{...mint,rewardProof:null}],wallet).length,0);
assert.equal(pick([lot],[mint,mint],wallet).length,1,'same mint cannot be double-counted');
assert.match(discovery,/verifiedTopUpMintCandidates\(\s*lots,CURRENT_PROVEN_REWARD_ROWS,wallet\)/);
assert.match(discovery,/assignmentReasonCode:'verified_topup_tx_reward'/);
assert.match(discovery,/selectorBonusIntent\(ev\.selector\|\|''\)/);
console.log('PASS 9.22: verified storage top-up mint 5500 TLN+, dedupe and invalid/ambiguous proof guards');
