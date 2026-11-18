import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const source=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
assert.doesNotMatch(source,/\.upsert\(|\.insert\(|\.update\(|\.delete\(/);
const script=stripTypeScriptTypes(source,{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40);
const row={user_id:'u',wallet_id:'id',chain_key:'bsc',cache_key:'verified-discovery-results',updated_at:'2026-09-28T00:00:00Z',last_scanned_block:900,
  payload:{kind:'verified_discovery_results',wallet,completedStep:5,lastCheckedAt:'2026-09-28T00:00:00Z',lastCheckedBlock:900,process:{done:{rewards:true,referral:true}}}};
async function run({maxBlocks=100,kind='http',secret='secret'}={}) {
 let handler;const requests=[];
 const db={from:()=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({order:()=>({range:async()=>({data:[row],error:null})})})})})})})};
 const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'private-provider-key'})[k]},serve:f=>handler=f},createClient:()=>db,
  Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async (url,opts)=>{const q=JSON.parse(opts.body);requests.push({url,q});
    if(q.method==='eth_blockNumber')return new Response(JSON.stringify({jsonrpc:'2.0',result:'0x3e8'}));
    if(q.method==='eth_chainId')return new Response(JSON.stringify({jsonrpc:'2.0',result:'0x38'}));
    if(kind==='http')return new Response('SECRET private-provider-key',{status:400});
    if(kind==='rpc')return new Response(JSON.stringify({jsonrpc:'2.0',error:{code:-32005,message:'private-provider-key'}}));
    return new Response(JSON.stringify({jsonrpc:'2.0',result:[]}));
  }};
 vm.runInNewContext(script,ctx);
 const r=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':secret},body:JSON.stringify({mode:'rpc-diagnostic',maxBlocks})}));
 return {status:r.status,body:await r.json(),requests};
}
let r=await run();
assert.equal(r.status,200);assert.equal(r.body.mode,'rpc-diagnostic');
assert.equal(r.body.chunk.fromBlock,772);assert.equal(r.body.chunk.toBlock,871);assert.equal(r.body.chunk.blocks,100);
assert.equal(r.requests.length,7);assert.equal(r.body.diagnosis.probes.length,6);
assert.equal(r.body.diagnosis.probes[0].chainIdMatchesBsc,true);
assert.equal(r.body.diagnosis.probes[1].httpStatus,400);
const q=r.requests.map(x=>x.q);
assert.equal(q[0].method,'eth_blockNumber');assert.equal(q[1].method,'eth_chainId');
assert.equal(q[2].params[0].fromBlock,q[2].params[0].toBlock);
assert.equal(q[3].params[0].toBlock,'0x367');
assert.equal(typeof q[3].params[0].address,'string');
assert.equal(q[4].params[0].address.length,4);assert.equal(q[5].params[0].topics.length,3);
assert.equal(q[6].params[0].fromBlock,'0x3e8');
assert.doesNotMatch(JSON.stringify(r.body),/private-provider-key|SECRET|0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/);
r=await run({kind:'ok',maxBlocks:5000});
assert.equal(r.status,200);assert.equal(r.body.chunk.blocks,100);assert.equal(r.body.chunk.maxBlocks,100);
assert.equal(r.body.diagnosis.probes[1].category,'ok');
r=await run({kind:'rpc'});assert.equal(r.body.diagnosis.probes[2].rpcCode,-32005);
r=await run({secret:'bad'});assert.equal(r.status,401);assert.equal(r.requests.length,0);
console.log('PASS 9.14: bounded six-probe RPC filter diagnosis, HTTP 400, sanitized response, chain ID, read-only');
