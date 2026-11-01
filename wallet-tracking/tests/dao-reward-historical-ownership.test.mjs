import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const begin=src.indexOf('async function historicalNftOwnership(');
const end=src.indexOf('\n// Read-only end-to-end evidence:',begin);
assert.ok(begin>0&&end>begin);
const code=src.slice(begin,end).replace('nft:any,wallet:string,claimBlock:number','nft,wallet,claimBlock').replace('let preceding:any=null','let preceding=null').replace('new Set<string>()','new Set()');
const addr='0x'+'a'.repeat(40),other='0x'+'b'.repeat(40),contract='0x'+'c'.repeat(40);
const make=(b,to,type='ERC-721')=>({block_number:b,transaction_hash:'0x'+'d'.repeat(64),token:{type},token_id:'42',to:{hash:to}});
async function check(pages,block=100){
 const json=async url=>pages.shift()??{items:[],next_page_params:null};
 const itemBlock=async x=>x.block_number;
 const lower=x=>String(x?.hash||x?.address_hash||x?.address||x||'').toLowerCase();
 const EXPLORER='https://explorer.example/api/v2';
 return await new Function('json','itemBlock','lower','EXPLORER',code+'; return historicalNftOwnership;')(json,itemBlock,lower,EXPLORER)({_contract:contract,tokenId:'42'},addr,block)
}
assert.equal((await check([{items:[make(99,addr)],next_page_params:null}])).verified,true);
assert.equal((await check([{items:[make(99,other)],next_page_params:null}])).verified,false);
assert.equal((await check([{items:[make(100,addr)],next_page_params:null}])).reason,'same-block-ambiguous');
assert.equal((await check([{items:[make(101,other)],next_page_params:{index:1}},{items:[make(98,addr)],next_page_params:null}])).verified,true);
assert.equal((await check([{items:[make(99,addr,'ERC-1155')],next_page_params:null}])).verified,false);
assert.equal((await check([{items:[make(101,other)],next_page_params:{index:1}}],100)).reason,'no-prior-transfer');
assert.equal((await check([{items:[make(99,addr),make(99,other)],next_page_params:null}])).reason,'prior-block-ambiguous');
assert.equal((await check([{items:[make(99,addr)],next_page_params:{index:1}},{items:[make(99,other),make(98,addr)],next_page_params:null}])).reason,'prior-block-ambiguous');
assert.equal((await check([{items:[make(99,addr)],next_page_params:{index:1}},{items:[make(98,other)],next_page_params:null}])).verified,true);
assert.match(src,/historicallyVerifiedCandidates/);
assert.match(src,/Candidate is diagnostic only/);
console.log('9 NFT ownership evidence regression cases passed');
