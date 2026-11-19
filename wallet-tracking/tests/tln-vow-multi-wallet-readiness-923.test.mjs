import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40);
const base={kind:'verified_discovery_results',wallet,completedStep:5,lastCheckedBlock:125000,
  lastCheckedAt:'2026-11-18T12:00:00Z',process:{done:{rewards:true,referral:true},verification:{
    rewards:{normal:1,assigned:1,unassigned:0},referral:{completed:true,strongCount:0}}},
  blockEvidence:{completeFromBlock:124000,completeToBlock:125000,coverageVerified:true}};
const rows=[
  {user_id:'u1',wallet_id:'w1',payload:base,updated_at:base.lastCheckedAt},
  {user_id:'u2',wallet_id:'w2',payload:{...base,wallet:'0x'+'b'.repeat(40),blockEvidence:{}},updated_at:base.lastCheckedAt},
  {user_id:'u3',wallet_id:'w3',payload:{...base,wallet:'0x'+'c'.repeat(40),process:{done:{rewards:true,referral:false}}},updated_at:base.lastCheckedAt},
  {user_id:'u4',wallet_id:'w4',payload:{...base,wallet:'invalid'},updated_at:base.lastCheckedAt}
];
let handler,rpcCalls=0,writes=0;
const db={from:()=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({order:()=>({range:async()=>({data:rows,error:null})})})})})})})};
const fetch=async(_url,options)=>{rpcCalls++;const request=JSON.parse(options.body);
  assert.equal(request.method,'eth_blockNumber');return new Response(JSON.stringify({result:'0x20000'}),{status:200});};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'test'})[k]},serve:f=>handler=f},createClient:()=>db,Response,Request,TextEncoder,
  Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,fetch};
vm.runInNewContext(source,ctx);
const response=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'multi-wallet-readiness',maxBlocks:100})}));
const result=await response.json();
assert.equal(response.status,200);
assert.equal(result.summary.snapshotWallets,4);
assert.equal(result.summary.readyForPlanning,1);
assert.equal(result.summary.legacyWithoutCoverage,1);
assert.equal(result.summary.incompleteWorkflow,1);
assert.equal(result.summary.invalidSource,1);
assert.equal(result.plan.length,1);
assert.equal(result.plan[0].fromBlock,124872);
assert.equal(result.plan[0].toBlock,124971);
assert.equal(result.plan[0].persisted,false);
assert.equal(result.plan[0].executed,false);
assert.equal(rpcCalls,1);assert.equal(writes,0);
assert.doesNotMatch(JSON.stringify(result),/u1|u2|u3|u4|w1|w2|w3|w4|0xaaaa/);
console.log('PASS 9.23: anonymous multi-wallet readiness, proof gating, bounded no-write plans');
