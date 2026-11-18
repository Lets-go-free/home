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
async function run({mode='delta-scan-preview',maxBlocks=100,kind='http',secret='secret'}={}) {
 let handler;const requests=[];
 const db={from:()=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({order:()=>({range:async()=>({data:[row],error:null})})})})})})})};
 const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'private-provider-key'})[k]},serve:f=>handler=f},createClient:()=>db,
  Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async (url,opts)=>{const q=JSON.parse(opts.body);requests.push(q);
    if(q.method==='eth_blockNumber')return new Response(JSON.stringify({jsonrpc:'2.0',result:'0x3e8'}));
    if(kind==='http')return new Response('SECRET private-provider-key',{status:429});
    if(kind==='rpc')return new Response(JSON.stringify({jsonrpc:'2.0',error:{code:-32005,message:'secret url private-provider-key'}}));
    return new Response(JSON.stringify({jsonrpc:'2.0',result:[]}));
  }};
 vm.runInNewContext(script,ctx);
 const r=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':secret},body:JSON.stringify({mode,maxBlocks})}));
 return {status:r.status,body:await r.json(),requests};
}
let r=await run();
assert.equal(r.status,503);assert.equal(r.body.chunk.blocks,100);assert.equal(r.body.chunk.toBlock,871);
assert.equal(r.body.chunk.maxBlocks,100);assert.equal(r.body.rpcDiagnostic.phase,'eth_getLogs');
assert.equal(r.body.rpcDiagnostic.category,'http_error');assert.equal(r.body.rpcDiagnostic.httpStatus,429);
assert.equal(r.requests[1].params[0].fromBlock,'0x304');assert.equal(r.requests[1].params[0].toBlock,'0x367');
assert.doesNotMatch(JSON.stringify(r.body),/private-provider-key|SECRET/);
r=await run({kind:'rpc'});assert.equal(r.body.rpcDiagnostic.rpcCode,-32005);assert.equal(r.body.rpcDiagnostic.category,'rpc_error');
assert.doesNotMatch(JSON.stringify(r.body),/private-provider-key/);
r=await run({kind:'ok'});assert.equal(r.status,200);assert.equal(r.body.chunk.blocks,100);assert.equal(r.requests.length,3);
r=await run({mode:'delta-preview'});assert.equal(r.status,200);assert.equal(r.body.chunk.blocks,100);assert.equal(r.requests.length,1);
r=await run({maxBlocks:5001});assert.equal(r.status,400);assert.equal(r.requests.length,0);
r=await run({maxBlocks:0});assert.equal(r.status,400);assert.equal(r.requests.length,0);
r=await run({maxBlocks:1.2});assert.equal(r.status,400);
r=await run({secret:'bad'});assert.equal(r.status,401);assert.equal(r.requests.length,0);
console.log('PASS 9.13: adjustable bounded scan, HTTP 429/RPC code diagnostics, sanitized output, 400 guard, read-only');
