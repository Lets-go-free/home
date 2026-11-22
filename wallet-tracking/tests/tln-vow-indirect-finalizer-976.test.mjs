import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const file=new URL('../js/tln-reward-verification-core.js',import.meta.url);
const sandbox={};vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox);
const core=sandbox.WT_TLN_REWARD_VERIFICATION_CORE;
assert.equal(typeof core.verifiedIndirectStakingClaim,'function');
const wallet='0x'+'1'.repeat(40),call='0x'+'2'.repeat(40),source='0x'+'3'.repeat(40);
const token='0x'+'4'.repeat(40),hash='0x'+'5'.repeat(64),stakeTx='0x'+'6'.repeat(64);
const receipt={receiptVerified:true,knownBridge:false,lifecycleLotMatches:0,
  transactionSender:wallet,calledContract:call,selector:core.keccakSelector('getReward()'),
  transfers:[{from:source,to:wallet,token,amountRaw:'0x64',logIndex:3}]};
const input={wallet,hash,receipt,lots:[{stakeTx,staking:{contract_address:call},rewardClaims:[]}],
  stakingContracts:[call],traceVerified:true,traceMethod:'debug_traceTransaction',
  traceSources:[call,source]};
const result=core.verifiedIndirectStakingClaim(input);
assert.equal(result?.amountRaw,'100');
assert.equal(result?.lotStakeTx,stakeTx);
assert.equal(result?.fromContract,source);
assert.equal(core.verifiedIndirectStakingClaim({...input,traceVerified:false}),null);
assert.equal(core.verifiedIndirectStakingClaim({...input,traceSources:[call]}),null);
assert.equal(core.verifiedIndirectStakingClaim({...input,lots:[...input.lots,...input.lots]}),null);
assert.equal(core.verifiedIndirectStakingClaim({...input,receipt:{...receipt,transfers:[...receipt.transfers,{from:wallet,to:source,token,amountRaw:'0x1',logIndex:4}]}}),null);
assert.equal(core.verifiedIndirectStakingClaim({...input,receipt:{...receipt,selector:'0x12345678'}}),null);
const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
assert.match(edge,/mode==='indirect-claim-finalize'/);
assert.match(edge,/const commit=body\?\.commit===true/);
assert.match(edge,/receiptInternalCallSources\(row\.tx_hash,row\.receipt,row\.wallet,row\.stakingContracts\)/);
const sql=fs.readFileSync(new URL('../supabase/migrations/20261122230047_tln_vow_indirect_staking_ledger_976.sql',import.meta.url),'utf8');
assert.match(sql,/create table if not exists public\.tln_vow_reward_indirect_claims/i);
console.log('9.76 indirect finalizer strict shared rule passed');
