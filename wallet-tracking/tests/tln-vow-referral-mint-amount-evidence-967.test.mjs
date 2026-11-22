import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const start=source.indexOf('async function attachManualRewardProofMatches(');
const end=source.indexOf('\nconst num =',start);
assert.ok(start>0&&end>start);
const functionCode=stripTypeScriptTypes(source.slice(start,end),{mode:'strip'});
const wallet='0x'+'a'.repeat(40),sender='0x'+'b'.repeat(40),staking='0x'+'c'.repeat(40);
const token='0x'+'d'.repeat(40),zero='0x'+'0'.repeat(40);
const hash='0x'+'e'.repeat(64);
const context={
  verificationCore:{manualReferralMintVerdict:()=>({strong:true}),manualPositionReceiptEvidence:()=>({}),
    reconcileVerifiedTopUpReceipt:()=>[],reconcileVerifiedStakeReceipt:()=>[],
    discoverNewMintRewardCandidates:()=>[],classifyExplicitClaimReceipt:()=>[],
    manualBonusEvidenceForClaim:()=>null,classifyStateDeltaReceipt:()=>[],
    assignReceiptCandidatesToUniqueLots:()=>[]},
  evmAddress:s=>typeof s==='string'&&/^0x[0-9a-f]{40}$/i.test(s)?s.toLowerCase():null,
  cachedReferralPathEvidence:async()=>({verified:true,level:2}),
  probeHistoricalRewardState:async()=>({attempted:false,paired:0,deltas:[]}),
  Set,BigInt,Number,Array,String,Date,Math
};
vm.runInNewContext(functionCode+'\nthis.attach=attachManualRewardProofMatches;',context);
const receipt={receiptVerified:true,transactionSender:sender,calledContract:staking,
  referralPrincipalTransfers:1,referralStakeEvents:0,referralMintTokens:[token],
  transfers:[
    {token,from:zero,to:wallet,amountRaw:'0x64',logIndex:3},
    {token,from:zero,to:wallet,amountRaw:'0xc8',logIndex:4},
    {token,from:wallet,to:staking,amountRaw:'0x32',logIndex:5}
  ]};
const result=await context.attach(wallet,hash,receipt,{process:{lots:[]}},[staking],123,{});
assert.equal(result.referralMintCandidateCount,1);
assert.equal(result.referralMintPathVerifiedCount,1);
assert.equal(result.referralMintCandidates[0].mintAmountRaw,'300');
assert.equal(result.referralMintCandidates[0].walletNetRaw,'250');
assert.deepEqual(Array.from(result.referralMintCandidates[0].mintLogIndexes),[3,4]);
const duplicate=await context.attach(wallet,hash,{...receipt,transfers:[receipt.transfers[0],receipt.transfers[0]]},
  {process:{lots:[]}},[staking],123,{});
assert.equal(duplicate.referralMintCandidateCount,0);
const self=await context.attach(wallet,hash,{...receipt,receiptVerified:false},
  {process:{lots:[]}},[staking],123,{});
assert.equal(self.referralMintCandidateCount,0);
console.log('9.67 exact referral zero-mint payout amount and log identity evidence');
