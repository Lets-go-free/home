import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const legacy={kind:'verified_discovery_results',wallet:'0x'+'a'.repeat(40),completedStep:5,
  lastCheckedAt:'2026-11-18T12:00:00Z',process:{done:{rewards:true,referral:true}}};
const snapshots=[{user_id:'owner1',wallet_id:'wallet1',payload:legacy},
  {user_id:'owner2',wallet_id:'wallet2',payload:{...legacy,wallet:'invalid'}}];
const raw=[{user_id:'owner1',wallet_id:'wallet1',scanner_version:'erc20-raw-v1',
  complete_from_block:0,last_scanned_block:125000,payload:[]}];
let handler,rpcCalls=0;
const db={from:()=>({select:()=>{
  let key='';const q={eq:(name,value)=>{if(name==='cache_key')key=value;return q;},
    order:()=>q,range:async()=>({data:key==='erc20-history-v1'?raw:snapshots,error:null})};return q;}})};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'test'})[k]},serve:f=>handler=f},createClient:()=>db,Response,Request,TextEncoder,
  Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async(_url,opts)=>{rpcCalls++;assert.equal(JSON.parse(opts.body).method,'eth_blockNumber');
    return new Response(JSON.stringify({result:'0x20000'}),{status:200});}};
vm.runInNewContext(source,ctx);
const response=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'delta-bootstrap-preview',maxBlocks:100})}));
const data=await response.json();
assert.equal(response.status,200);
assert.equal(data.summary.legacyCandidates,2);
assert.equal(data.summary.eligibleForPreview,1);
assert.equal(data.summary.invalidSnapshotWallet,1);
assert.equal(data.plan[0].recordedFromBlock,0);
assert.equal(data.plan[0].fromBlock,124872);
assert.equal(data.plan[0].toBlock,124971);
assert.equal(data.plan[0].historicalCompletenessVerified,false);
assert.equal(data.plan[0].verifiedCursorCreated,false);
assert.equal(data.plan[0].persisted,false);
assert.equal(data.plan[0].executed,false);
assert.equal(rpcCalls,1);
assert.doesNotMatch(JSON.stringify(data),/owner1|owner2|wallet1|wallet2|0xaaaa/);
console.log('PASS 9.26: non-authoritative legacy bootstrap proposals, one head RPC, no writes');
