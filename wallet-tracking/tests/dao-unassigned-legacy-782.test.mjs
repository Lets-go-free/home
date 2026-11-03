import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/migrations/20261103111113_dao_unassigned_legacy_claims_782.sql',import.meta.url),'utf8');
const begin=src.indexOf('async function enqueueCandidates('),end=src.indexOf('async function verifyPendingCandidates(',begin);
const body=src.slice(begin,end).replace('job:any','job').replace('rows:any[]','rows').replace('nfts:Map<string,any>','nfts');
function worker(match){let written=[];const sb={from:()=>({upsert:async(rows,config)=>{assert.equal(config.ignoreDuplicates,true);written.push(...rows);return {error:null}}})};const fn=Function('sb','unequivocalClaimNft','CLAIM_SELECTOR','NEW_MINER_CLAIM_SELECTOR','PROJECT','CHAIN',body+';return enqueueCandidates')(sb,match,'0x86bb8f37','0x19da4078','dao1','apertum');return {fn,written}}
const job={user_id:'u',wallet_id:'w'};
test('legacy claim without NFT evidence is durably staged, not dropped',async()=>{const w=worker(()=>null);assert.equal(await w.fn(job,[{selector:'0x86bb8f37',tx_hash:'0x111',block_number:1,raw_input:'0x86bb8f37'}],new Map()),1);assert.equal(w.written[0].status,'unassigned_legacy');assert.equal(w.written[0].nft_id,null)});
test('new miner stays separate from legacy',async()=>{const w=worker(()=>null);await w.fn(job,[{selector:'0x19da4078',tx_hash:'0x222',block_number:2,raw_input:'0x19da4078'}],new Map());assert.equal(w.written[0].status,'unassigned_miner')});
test('unrelated transaction is not staged',async()=>{const w=worker(()=>null);assert.equal(await w.fn(job,[{selector:'0x12345678',tx_hash:'0x333',block_number:3}],new Map()),0)});
test('unambiguous NFT still requires historical ownership',async()=>{const w=worker(()=>({nft:{_contract:'0xabc'},id:'9'}));await w.fn(job,[{selector:'0x86bb8f37',tx_hash:'0x444',block_number:4,raw_input:'0x86bb8f37'}],new Map());assert.equal(w.written[0].status,'pending')});
test('payout verifier includes legacy without updating canonical data',()=>{const seg=src.slice(src.indexOf('async function verifyCandidatePayouts('),src.indexOf('async function process('));assert.match(seg,/unassigned_legacy/);assert.doesNotMatch(seg,/claim_reward_usd|claim_reward_aptm|claim_nft_id/);assert.match(sql,/unassigned_legacy/)});
