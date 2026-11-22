import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.doesNotThrow(()=>stripTypeScriptTypes(edge,{mode:'strip'}));
const begin=edge.indexOf('async function receiptInternalCallSources(');
const end=edge.indexOf('const SMARTNODE_CONTRACT=',begin);
assert.ok(begin>0&&end>begin);
const code=edge.slice(begin,end);
assert.match(code,/verificationCore\.knownClaimMethodIntent/);
assert.match(code,/receipt\?\.receiptVerified!==true/);
assert.match(code,/debug_traceTransaction/);
assert.match(code,/trace_transaction/);
assert.match(code,/classificationVerified:false|rewardVerified:false/);
assert.match(code,/verificationCore\.classifyRewardTransferFlow/);
assert.match(code,/rewardFlowEvidence==='from_internal_call_chain'/);
assert.match(edge,/indirectTraceVerified:indirectTrace\.verified/);
assert.match(edge,/indirectRewardCandidates,indirectRewardCandidateCount/);
assert.match(html,/window\.APP_VERSION="9\.73"/);
const wallet='0x'+'a'.repeat(40),contract='0x'+'b'.repeat(40),payout='0x'+'c'.repeat(40);
const token='0x'+'d'.repeat(40),hash='0x'+'e'.repeat(64);
const receipt={calledContract:contract,transactionSender:wallet,selector:'0x12345678',
  receiptVerified:true,knownBridge:false,lifecycleLotMatches:0,
  transfers:[{token,from:payout,to:wallet,amountRaw:'0x64',logIndex:1}]};
const base={ALCHEMY_API_KEY:'fake-test-key',evmAddress:s=>typeof s==='string'&&/^0x[0-9a-f]{40}$/i.test(s)?s.toLowerCase():null,
  verificationCore:{knownClaimMethodIntent:()=> 'staking_reward',
    classifyRewardTransferFlow:({traceSources,transfers})=>({payoutTransfers:traceSources.includes(payout)
      ?transfers.map(t=>({...t,rewardFlowEvidence:'from_internal_call_chain',rewardProof:'explicit_claim_method'})):[]})},
  AbortController,setTimeout,clearTimeout,Date,Set,BigInt,String,Number,Array,Math};
const helpers=stripTypeScriptTypes(code,{mode:'strip'})+'\nthis.inspect=receiptInternalCallSources;';
const success={...base,fetch:async(_,options)=>({ok:true,json:async()=>({result:{from:wallet,to:contract,
  calls:[{from:contract,to:payout}]}})})};
vm.runInNewContext(helpers,success);
const found=await success.inspect(hash,receipt,wallet,[contract]);
assert.equal(found.verified,true);
assert.equal(found.candidates.length,1);
assert.equal(found.candidates[0].amountRaw,'100');
assert.equal(found.candidates[0].rewardVerified,false);
const failure={...base,fetch:async()=>({ok:false})};
vm.runInNewContext(helpers,failure);
const unresolved=await failure.inspect(hash,receipt,wallet,[contract]);
assert.equal(unresolved.verified,false);
assert.equal(unresolved.candidates,undefined);
console.log('9.73 indirect trace evidence guards OK');
