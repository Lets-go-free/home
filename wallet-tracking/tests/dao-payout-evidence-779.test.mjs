import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const migration=readFileSync(new URL('../supabase/migrations/20261103084538_dao_payout_evidence_amount_779.sql',import.meta.url),'utf8');
const section=source.slice(source.indexOf('function verifiedPayoutEvidence('),source.indexOf('async function verifyCandidatePayouts('));
const script=section.replace('function verifiedPayoutEvidence(tx:any,flows:any[],address:string):PayoutEvidence','function verifiedPayoutEvidence(tx,flows,address)');
const wallet='0x'+'1'.repeat(40),contract='0x'+'2'.repeat(40),token='0x'+'3'.repeat(40),hash='0x'+'a'.repeat(64);
const ctx={BigInt,Set,Number,String,lower:v=>String(v||'').toLowerCase(),isSuccessfulClaim:tx=>tx.selector==='0x86bb8f37'&&tx.status==='ok',hasVerifiedClaimPayout:(tx,flows)=>flows.some(f=>f.tx_hash===tx.tx_hash&&f.direction==='eingang'&&f.counterparty_address===tx.to_address&&BigInt(f.amount_raw)>0n)};
vm.runInNewContext(script,ctx);
const tx={tx_hash:hash,selector:'0x86bb8f37',status:'ok',to_address:contract};
const flow=(i,raw,asset=token,decimals=18)=>({tx_hash:hash,direction:'eingang',counterparty_address:contract,token_address:asset,token_decimals:decimals,amount_raw:raw,flow_key:`flow:${i}`});
const proof=(...flows)=>ctx.verifiedPayoutEvidence(tx,flows,wallet);
test('sums exact payout base units without Number rounding',()=>{
 const p=proof(flow(1,'1000000000000000001'),flow(2,'2'));
 assert.equal(p.status,'verified');assert.equal(p.amount_raw,'1000000000000000003');assert.equal(p.token_decimals,18);assert.equal(p.flow_count,2);
});
test('rejects mixed token contracts, inconsistent decimals and duplicate flow keys',()=>{
 assert.equal(proof(flow(1,'1'),flow(2,'1','0x'+'4'.repeat(40))).reason,'multiple-payout-assets');
 assert.equal(proof(flow(1,'1'),flow(2,'1',token,6)).reason,'inconsistent-token-decimals');
 assert.equal(proof(flow(1,'1'),flow(1,'1')).reason,'ambiguous-flow-keys');
});
test('rejects unverified transactions or absent incoming payout',()=>{
 assert.equal(ctx.verifiedPayoutEvidence({...tx,status:'error'},[flow(1,'10')],wallet).status,'needs_review');
 assert.equal(proof({...flow(1,'10'),direction:'ausgang'}).status,'needs_review');
});
test('migration preserves existing rewards and rechecks legacy incomplete evidence',()=>{
 assert.match(migration,/UPDATE public\.dao_reward_claim_candidates/);
 assert.match(migration,/payout_status='verified' AND payout_amount_raw IS NULL/);
 assert.doesNotMatch(migration,/UPDATE public\.project_transactions|UPDATE public\.snapshot|UPDATE public\.project_transaction_asset_flows/);
});
test('staging does not overwrite canonical valuation or claim ids',()=>{
 const section2=source.slice(source.indexOf('async function verifyCandidatePayouts('),source.indexOf('async function process('));
 assert.doesNotMatch(section2,/claim_reward_usd|claim_nft_id|price_usd|\.from\('snapshots'\)/);
 assert.match(section2,/p_amount:evidence.status==='verified'\?evidence.amount_raw:null/);
});
