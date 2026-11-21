import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../js/tln-reward-verification-core.js',import.meta.url),'utf8');
const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const ctx={};vm.runInNewContext(source,ctx);
const core=ctx.WT_TLN_REWARD_VERIFICATION_CORE;
assert.ok([...core.rewardStateProbeSignatures].includes('earned(address)'));
const wallet='0x'+'a'.repeat(40),contract='0x'+'b'.repeat(40),token='0x'+'c'.repeat(40),hash='0x'+'d'.repeat(64);
const receipt={receiptVerified:true,knownBridge:false,transactionSender:wallet,calledContract:contract,
  selector:'0xa9059cbb',transfers:[{token,from:contract,to:wallet,amountRaw:'0xff'}]};
const delta={contract,sig:'earned(address)',before:'0x'+'0'.repeat(64),after:'0x'+'0'.repeat(63)+'1'};
const input={wallet,hash,receipt,stakingContracts:[contract],stateDeltas:[delta]};
assert.equal(core.classifyStateDeltaReceipt(input).length,1);
assert.equal(core.classifyStateDeltaReceipt(input)[0].rewardVerified,false);
assert.equal(core.classifyStateDeltaReceipt({...input,stateDeltas:[]}).length,0);
assert.equal(core.classifyStateDeltaReceipt({...input,stakingContracts:[]}).length,0);
assert.equal(core.classifyStateDeltaReceipt({...input,receipt:{...receipt,transactionSender:token}}).length,0);
assert.equal(core.classifyStateDeltaReceipt({...input,receipt:{...receipt,knownBridge:true}}).length,0);
assert.equal(core.classifyStateDeltaReceipt({...input,receipt:{...receipt,selector:'0x4e71d92d'}}).length,0);
assert.equal(core.classifyStateDeltaReceipt({...input,receipt:{...receipt,transfers:[{...receipt.transfers[0],from:token}]}}).length,0);
assert.ok(edge.includes('async function probeHistoricalRewardState('));
assert.ok(edge.includes('stateChangeCandidates:stateCandidates'));
assert.ok(edge.includes('reward_classification_verified:false'));
console.log('9.43: paired state-change evidence is conservative and noncanonical');
