import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const dir=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('js/tln-reward-verification-core.js',dir),'utf8');
const browser=fs.readFileSync(new URL('projects/tln-vow/tln-vow-discovery.js',dir),'utf8');
const edge=fs.readFileSync(new URL('supabase/functions/tln-vow-reward-refresh/index.ts',dir),'utf8');
const sandbox={};vm.runInNewContext(source,sandbox);
const core=sandbox.WT_TLN_REWARD_VERIFICATION_CORE;
assert.ok(browser.includes('shared(c)===\'stake\''));
assert.ok(edge.includes('verificationCore.manualPositionReceiptEvidence('));
for(const signature of ['stake()','stake(uint256)']){
  assert.equal(core.manualPositionCallIntent({selector:core.keccakSelector(signature)}),'stake');
}
for(const signature of ['unstake()','unstake(uint256)']){
  assert.equal(core.manualPositionCallIntent({selector:core.keccakSelector(signature)}),'unstake');
}
assert.equal(core.manualPositionCallIntent({selector:'0xc50a74a6',_method:'Stake'}),'excluded');
assert.equal(core.manualPositionCallIntent({_teamPositionExcluded:true,_method:'Stake'}),'excluded');
assert.equal(core.manualPositionCallIntent({selector:'0x12345678'}),'unknown');
const wallet='0x'+'a'.repeat(40),contract='0x'+'b'.repeat(40),token='0x'+'c'.repeat(40);
const receipt={receiptVerified:true,transactionSender:wallet,calledContract:contract,
  selector:core.keccakSelector('stake(uint256)'),knownBridge:false,
  transfers:[{token,from:wallet,to:contract,amountRaw:'0x10'}]};
const result=core.manualPositionReceiptEvidence({wallet,receipt,stakingContracts:[contract]});
assert.equal(result.intent,'stake');
assert.equal(result.principalSentToContract,1);
assert.equal(result.positionCreated,false);
assert.equal(result.durationVerified,false);
assert.equal(core.manualPositionReceiptEvidence({wallet,receipt:{...receipt,selector:'0xc50a74a6'},stakingContracts:[contract]}).principalSentToContract,0);
assert.equal(core.manualPositionReceiptEvidence({wallet,receipt:{...receipt,receiptVerified:false},stakingContracts:[contract]}).principalSentToContract,0);
assert.equal(core.manualPositionReceiptEvidence({wallet,receipt,stakingContracts:[]}).principalSentToContract,0);
console.log('9.48 browser and Edge share exact position-call intent; receipt evidence cannot create lots');
