import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const browser=fs.readFileSync(new URL('projects/tln-vow/tln-vow-discovery.js',root),'utf8');
const edge=fs.readFileSync(new URL('supabase/functions/tln-vow-reward-refresh/index.ts',root),'utf8');
const source=fs.readFileSync(new URL('js/tln-reward-verification-core.js',root),'utf8');
const ctx={};vm.runInNewContext(source,ctx);
const core=ctx.WT_TLN_REWARD_VERIFICATION_CORE;
assert.ok(browser.includes('WT_TLN_REWARD_VERIFICATION_CORE?.manualUniqueUnstakeLotIndex('),
  'Browser must use the shared unique unstake-lot rule');
assert.ok(edge.includes('manualPositionReceiptEvidence({wallet,receipt,stakingContracts,'),
  'Edge must pass verified receipt and cached lots through shared rule');
const wallet='0x'+'a'.repeat(40),contract='0x'+'b'.repeat(40),asset='0x'+'c'.repeat(40);
const base={stakeTime:'2024-12-14T00:00:00Z',stakeBlockHex:'0x64',
  staking:{contract_address:contract},entry_contract:null,status:'open',remaining:100};
const at={intent:'unstake',calledContract:contract,atBlock:101,lots:[base]};
assert.equal(core.manualUniqueUnstakeLotIndex(at),0);
assert.equal(core.manualUniqueUnstakeLotIndex({...at,atBlock:99}),null);
assert.equal(core.manualUniqueUnstakeLotIndex({...at,calledContract:asset}),null);
assert.equal(core.manualUniqueUnstakeLotIndex({...at,lots:[base,{...base,stakeBlockHex:'0x65'}]}),null,
  'parallel open lots must never be silently chosen');
assert.equal(core.manualUniqueUnstakeLotIndex({...at,lots:[{...base,status:'closed'}]}),null);
assert.equal(core.manualUniqueUnstakeLotIndex({...at,lots:[{...base,staking:{contract_address:asset},entry_contract:contract}]}),0);
const receipt={receiptVerified:true,transactionSender:wallet,calledContract:contract,
  selector:core.keccakSelector('unstake(uint256)'),knownBridge:false,
  transfers:[{token:asset,from:contract,to:wallet,amountRaw:'0x10'}]};
const evidence=core.manualPositionReceiptEvidence({wallet,receipt,stakingContracts:[contract],lots:[base],block:101});
assert.equal(evidence.intent,'unstake');
assert.equal(evidence.principalReturnedFromContract,1);
assert.equal(evidence.uniqueUnstakeLotIndex,0);
assert.equal(evidence.positionCreated,false);
assert.equal(evidence.durationVerified,false);
assert.equal(core.manualPositionReceiptEvidence({wallet,receipt,stakingContracts:[contract],lots:[base,base],block:101}).uniqueUnstakeLotIndex,null);
assert.equal(core.manualPositionReceiptEvidence({wallet,receipt:{...receipt,receiptVerified:false},stakingContracts:[contract],lots:[base],block:101}).uniqueUnstakeLotIndex,null);
console.log('9.49 shared manual Step-2 unique unstake-lot association: verified, ambiguous, chronology and contract gates');
