import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const source=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
assert.doesNotMatch(source,/\.upsert\(|\.insert\(|\.update\(|\.delete\(/);
const script=stripTypeScriptTypes(source,{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40);
const row={user_id:'u',wallet_id:'id',chain_key:'bsc',cache_key:'verified-discovery-results',updated_at:'2026-09-28T00:00:00Z',last_scanned_block:900,payload:{kind:'verified_discovery_results',wallet,completedStep:5,lastCheckedAt:'2026-09-28T00:00:00Z',lastCheckedBlock:900,process:{done:{rewards:true,referral:true}}}};
async function run(secret='secret') {
 let handler; const requests=[];
 const db={from:()=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({order:()=>({range:async()=>({data:[row],error:null})})})})})})})};
 const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'private-provider-key'})[k]},serve:f=>handler=f},createClient:()=>db,Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,fetch:async (url,opts)=>{
  const q=JSON.parse(opts.body);requests.push({url,q});
  if(q.method==='eth_blockNumber')return new Response(JSON.stringify({jsonrpc:'2.0',result:'0x3e8'}));
  const f=q.params[0],count=parseInt(f.toBlock,16)-parseInt(f.fromBlock,16)+1;
  if(count>10)return new Response('API KEY private-provider-key',{status:400});
  return new Response(JSON.stringify({jsonrpc:'2.0',result:[]}));
 }};
 vm.runInNewContext(script,ctx);
 const r=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':secret},body:JSON.stringify({mode:'rpc-range-diagnostic'})}));
 return {status:r.status,body:await r.json(),requests};
}
let r=await run();
assert.equal(r.status,200);assert.equal(r.body.mode,'rpc-range-diagnostic');
assert.deepEqual(Array.from(r.body.diagnosis.probes,x=>x.blocks),[1,2,5,10,11,100,10]);
assert.deepEqual(Array.from(r.body.diagnosis.probes,x=>x.httpStatus),[200,200,200,200,400,400,200]);
assert.deepEqual(Array.from(r.body.diagnosis.probes,x=>x.name),['historical_1_blocks','historical_2_blocks','historical_5_blocks','historical_10_blocks','historical_11_blocks','historical_100_blocks','recent_10_blocks']);
assert.equal(r.requests.length,8);
for(const x of r.requests.slice(1,7)) {assert.equal(x.q.params[0].address,'0xf585b5b4f22816baf7629aea55b701662630397b');assert.equal(x.q.params[0].topics.length,1);}
assert.doesNotMatch(JSON.stringify(r.body),/private-provider-key|0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa|API KEY/);
r=await run('wrong');assert.equal(r.status,401);assert.equal(r.requests.length,0);
console.log('PASS 9.15: range-limit probes 1/2/5/10/11/100 and current 10; read-only; protected, sanitized');
