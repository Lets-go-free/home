import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

const source = fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts', import.meta.url), 'utf8');
assert.match(source, /DELTA_CHUNK_BLOCKS = 5_000/);
assert.match(source, /requiresVerifiedCommitBeforeAdvance:true/);
assert.doesNotMatch(source, /\.upsert\(|\.insert\(|\.update\(|\.delete\(|method:['"]eth_getLogs/);
const script = stripTypeScriptTypes(source, {mode:'strip'}).replace(/^import .*;?$/gm,'');
const sample=(block,done={rewards:true,referral:true})=>({
 user_id:'test-user',wallet_id:'test-wallet',chain_key:'bsc',cache_key:'verified-discovery-results',updated_at:'2026-11-17T00:00:00Z',last_scanned_block:block,
 payload:{kind:'verified_discovery_results',completedStep:5,lastCheckedAt:'2026-11-17T00:00:00Z',lastCheckedBlock:block,process:{done}}
});
async function run({mode='delta-preview',rows=[sample(900)],head=1000,secret='s',rpc='rpc'}) {
 let handler; const methods=[]; let writes=0;
 const db={from:()=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({order:()=>({range:async()=>({data:rows,error:null})})})})})})})};
 const ctx={Deno:{env:{get:(k)=>({SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'service',TLN_REWARD_CRON_SECRET:'s',ALCHEMY_API_KEY:rpc})[k]},serve:(fn)=>handler=fn},createClient:()=>db,
  Response,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,console,
  fetch:async(_u,opts)=>{methods.push(JSON.parse(opts.body).method);return new Response(JSON.stringify({jsonrpc:'2.0',result:'0x'+head.toString(16)}),{status:200})}};
 vm.runInNewContext(script,ctx);
 const response=await handler(new Request('https://example.test',{method:'POST',headers:{'x-tln-reward-secret':secret},body:JSON.stringify({mode})}));
 return {status:response.status,body:await response.json(),methods,writes};
}
let r=await run({rows:[sample(124514156)],head:134378901});
assert.equal(r.status,200);assert.equal(r.body.window.fromBlock,124514028);assert.equal(r.body.window.blocks,9864874);
assert.equal(r.body.chunk.fromBlock,124514028);assert.equal(r.body.chunk.toBlock,124519027);
assert.equal(r.body.chunk.blocks,5000);assert.equal(r.body.chunk.nextFromBlock,124519028);
assert.equal(r.body.chunk.remainingBlocks,9859874);assert.equal(r.body.chunk.remainingChunks,1972);
assert.equal(r.body.chunk.persisted,false);assert.equal(r.body.chunk.executed,false);
assert.deepEqual(r.methods,['eth_blockNumber']);assert.equal(r.writes,0);
r=await run({rows:[sample(900)],head:1000});assert.equal(r.body.chunk.blocks,229);
assert.equal(r.body.chunk.nextFromBlock,null);assert.equal(r.body.chunk.remainingBlocks,0);assert.equal(r.body.chunk.remainingChunks,0);
r=await run({rows:[sample(900)],head:5727});assert.equal(r.body.chunk.blocks,4956); // from 772 to 5727
assert.equal(r.body.chunk.nextFromBlock,null);
r=await run({rows:[sample(900,{rewards:false,referral:true})]});assert.equal(r.status,409);assert.deepEqual(r.methods,[]);
r=await run({rows:[sample(1100)]});assert.equal(r.status,409);
r=await run({rpc:''});assert.equal(r.status,503);
r=await run({mode:'read-only-preflight'});assert.equal(r.status,200);assert.equal(r.body.mode,'read-only-preflight');assert.deepEqual(r.methods,[]);
r=await run({secret:'wrong'});assert.equal(r.status,401);assert.deepEqual(r.methods,[]);
console.log('PASS 9.11: large window first 5k, short/exact terminal windows, proof/head/RPC/auth guards, read-only and 9.09 compatibility');
