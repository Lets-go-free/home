import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/migrations/20261103110156_dao_unassigned_miner_candidates_781.sql',import.meta.url),'utf8');
const start=source.indexOf('async function enqueueCandidates(');
const end=source.indexOf('async function verifyPendingCandidates(',start);
const implementation=source.slice(start,end).replace('job:any','job').replace('rows:any[]','rows').replace('nfts:Map<string,any>','nfts');
function worker(match){
 let captured=[];
 const sb={from:table=>{
  assert.equal(table,'dao_reward_claim_candidates');
  return {upsert:async (rows,options)=>{captured.push(...rows);assert.equal(options.ignoreDuplicates,true);return {error:null}}};
 }};
 const fn=Function('sb','unequivocalClaimNft','CLAIM_SELECTOR','NEW_MINER_CLAIM_SELECTOR','PROJECT','CHAIN',`${implementation};return enqueueCandidates`)(sb,match,'0x86bb8f37','0x19da4078','dao1','apertum');
 return {fn,get rows(){return captured}};
}
const job={user_id:'user',wallet_id:'wallet'};
test('new Miner without NFT identity remains explicitly unassigned and persisted',async()=>{
 const x=worker(()=>null);
 assert.equal(await x.fn(job,[{tx_hash:'0xabc',block_number:555,selector:'0x19da4078',raw_input:'0x19da4078'}],new Map()),1);
 assert.equal(x.rows.length,1);
 assert.equal(x.rows[0].status,'unassigned_miner');
 assert.equal(x.rows[0].nft_id,null);
 assert.equal(x.rows[0].nft_contract,null);
});
test('legacy claims without NFTs have independent staging status (not miner)',async()=>{
 const x=worker(()=>null);
 assert.equal(await x.fn(job,[{tx_hash:'0xabc',block_number:555,selector:'0x86bb8f37',raw_input:'0x86bb8f37'}],new Map()),1);
 assert.equal(x.rows.length,1);
 assert.equal(x.rows[0].status,'unassigned_legacy');
});
test('known NFT evidence retains historical ownership verification route',async()=>{
 const x=worker(()=>({nft:{_contract:'0xabc'},id:'123'}));
 await x.fn(job,[{tx_hash:'0xabc',block_number:555,selector:'0x19da4078',raw_input:'0x19da4078'}],new Map());
 assert.equal(x.rows[0].status,'pending');
 assert.equal(x.rows[0].nft_id,'123');
});
test('new payout verification includes explicit unassigned status without touching canonical reward fields',()=>{
 const unit=source.slice(source.indexOf('async function verifyCandidatePayouts('),source.indexOf('async function process('));
 assert.match(unit,/in\('status',\['ownership_verified','unassigned_miner','unassigned_legacy'\]\)/);
 assert.doesNotMatch(unit,/claim_reward_usd|claim_nft_id|\.from\('snapshots'\)/);
 assert.match(sql,/nft_contract DROP NOT NULL/);
 assert.match(sql,/nft_id DROP NOT NULL/);
 assert.match(sql,/status='unassigned_miner' AND nft_contract IS NULL AND nft_id IS NULL/);
});
