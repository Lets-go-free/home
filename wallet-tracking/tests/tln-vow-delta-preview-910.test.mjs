import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
const source = fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts', import.meta.url),'utf8');
assert.match(source,/DELTA_OVERLAP_BLOCKS = 128/);
assert.match(source,/mode==='delta-preview'/);
assert.doesNotMatch(source,/\.upsert\(|\.insert\(|\.update\(|\.delete\(/);
const script = stripTypeScriptTypes(source,{mode:'strip'}).replace(/^import .*;?$/gm,'');
const makeRow=(block,done={rewards:true,referral:true},step=5)=>({user_id:'u1',wallet_id:'w1',updated_at:'2026-11-17T00:00:00Z',last_scanned_block:block,payload:{kind:'verified_discovery_results',completedStep:step,lastCheckedAt:'2026-11-17T00:00:00Z',lastCheckedBlock:block,process:{done}}});
async function run(body,rows,block='0x3e8',key='rpc-key'){
 let handler,methodCalls=[],writes=0;
 const db={from:(table)=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({order:()=>({range:async()=>({data:rows,error:null})})})})})})})};
 const ctx={Deno:{env:{get:(k)=>({SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'service',TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:key})[k]},serve:(fn)=>handler=fn},createClient:()=>db,
 Response,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,console,
 fetch:async(url,opts)=>{methodCalls.push(JSON.parse(opts.body).method);return new Response(JSON.stringify({jsonrpc:'2.0',result:block}),{status:200})}};
 vm.runInNewContext(script,ctx);
 const request=new Request('https://example.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},body:JSON.stringify(body)});
 const out=await handler(request);return {status:out.status,json:await out.json(),methodCalls,writes};
}
let r=await run({mode:'delta-preview'},[makeRow(900)]);
assert.equal(r.json.ok,true);assert.equal(r.json.window.fromBlock,772);assert.equal(r.json.window.toBlock,1000);
assert.deepEqual(r.methodCalls,['eth_blockNumber']);assert.equal(r.json.selectedWallets,1);
r=await run({mode:'delta-preview'},[makeRow(900,{rewards:true,referral:false})]);assert.equal(r.status,409);assert.deepEqual(r.methodCalls,[]);
r=await run({mode:'delta-preview'},[makeRow(1100)]);assert.equal(r.status,409);
r=await run({mode:'delta-preview'},[makeRow(900)],'0x3e8','');assert.equal(r.status,503);
r=await run({},[makeRow(900)]);assert.equal(r.json.mode,'read-only-preflight');assert.deepEqual(r.methodCalls,[]);
console.log('PASS 9.10: read-only delta window, proof guard, head guard, RPC unavailable, legacy preflight, TS transpilation');
