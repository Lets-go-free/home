import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const source=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
assert.doesNotMatch(source,/\.upsert\(|\.insert\(|\.update\(|\.delete\(/);
const script=stripTypeScriptTypes(source,{mode:'strip'}).replace(/^import .*;?$/gm,'');
const transfer='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const wallet='0x'+'a'.repeat(40), walletTopic='0x'+ '0'.repeat(24)+'a'.repeat(40);
const sample=(w=wallet)=>[{user_id:'u',wallet_id:'id',chain_key:'bsc',cache_key:'verified-discovery-results',updated_at:'2026-09-28T00:00:00Z',last_scanned_block:900,payload:{kind:'verified_discovery_results',wallet:w,completedStep:5,lastCheckedAt:'2026-09-28T00:00:00Z',lastCheckedBlock:900,process:{done:{rewards:true,referral:true}}}}];
async function run({mode='delta-scan-preview',rows=sample(),rpcFail=false,invalidLog=false,secret='secret'}={}) {
 let handler,requests=[];
 const db={from:()=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({order:()=>({range:async()=>({data:rows,error:null})})})})})})})};
 const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'test'})[k]},serve:f=>handler=f},createClient:()=>db,
  Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async (_url,opts)=>{
    const q=JSON.parse(opts.body);requests.push(q);
    if(q.method==='eth_blockNumber')return new Response(JSON.stringify({jsonrpc:'2.0',result:'0x3e8'}));
    if(rpcFail)return new Response(JSON.stringify({jsonrpc:'2.0',error:{message:'log range limit'}}));
    const isIncoming=q.params[0].topics.length===3;
    const logs=isIncoming?[{address:'0xf585b5b4f22816baf7629aea55b701662630397b',blockNumber:'0x384',transactionHash:'0x'+'b'.repeat(64),topics:[transfer,'0x'+'0'.repeat(64),invalidLog?'0x'+'c'.repeat(64):walletTopic]}]:[];
    return new Response(JSON.stringify({jsonrpc:'2.0',result:logs}));
  }};
 vm.runInNewContext(script,ctx);
 const r=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':secret},body:JSON.stringify({mode})}));
 return {status:r.status,body:await r.json(),requests};
}
let r=await run();
assert.equal(r.status,200);assert.equal(r.body.inspection.events,1);assert.equal(r.body.inspection.uniqueTransactions,1);
assert.equal(r.body.chunk.fromBlock,772);assert.equal(r.body.chunk.toBlock,1000);
assert.equal(r.body.chunk.persisted,false);assert.equal(r.body.scanCompleted,true);
assert.deepEqual(r.requests.map(x=>x.method),['eth_blockNumber','eth_getLogs','eth_getLogs']);
assert.equal(r.requests[1].params[0].topics[2],walletTopic);
assert.equal(r.requests[2].params[0].topics[1],walletTopic);
r=await run({invalidLog:true});assert.equal(r.status,503);assert.equal(r.body.scanCompleted,false);
r=await run({rpcFail:true});assert.equal(r.status,503);assert.equal(r.body.scanCompleted,false);
r=await run({rows:sample('nonsense')});assert.equal(r.status,409);assert.equal(r.requests.length,1);
r=await run({mode:'delta-preview'});assert.equal(r.status,200);assert.deepEqual(r.requests.map(x=>x.method),['eth_blockNumber']);
r=await run({mode:'read-only-preflight'});assert.equal(r.status,200);assert.equal(r.requests.length,0);
r=await run({secret:'wrong'});assert.equal(r.status,401);assert.equal(r.requests.length,0);
console.log('PASS 9.12: wallet/topic filter, bounded transfer log query, malformed/provider fail closed, no writes, existing modes, secret guard');
