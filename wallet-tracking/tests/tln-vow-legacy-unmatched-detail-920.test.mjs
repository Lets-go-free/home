import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const edge=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40),hash='0x'+'b'.repeat(64),token='0x'+'c'.repeat(40);
const row={user_id:'u',wallet_id:'id',updated_at:'2026-09-28T00:00:00Z',payload:{
  kind:'verified_discovery_results',wallet,completedStep:5,
  process:{lots:[{rewardClaims:[{hash:'0x'+'d'.repeat(64),token,amount:1}]}]},
  globals:{provenRewardRows:[{hash,token,amount:4.75,symbol:'TLN+',selector:'0x12345678',
    from:'0x'+'0'.repeat(40),to:wallet,rewardProof:'onchain receipt',rewardFlowEvidence:'transfer'}]}}};
let handler,rpcCalls=0;
const db={from:()=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({order:()=>({range:async()=>({data:[row],error:null})})})})})})})};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret'})[k]},serve:f=>handler=f},createClient:()=>db,Response,Request,TextEncoder,
  Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async()=>{rpcCalls++;throw new Error('Unexpected RPC')}};
vm.runInNewContext(edge,ctx);
let res=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'legacy-unmatched-detail'})}));
const data=await res.json();
assert.equal(res.status,200);assert.equal(data.totalUnmatched,1);assert.equal(data.items[0].hash,hash);
assert.equal(data.items[0].symbol,'TLN+');assert.equal(data.items[0].amount,4.75);
assert.equal(data.items[0].selector,'0x12345678');assert.equal(data.items[0].fromIsZero,true);
assert.equal(data.items[0].recipientIsWallet,true);assert.equal(rpcCalls,0);
assert.doesNotMatch(JSON.stringify(data),new RegExp(wallet));
res=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'wrong'},
  body:JSON.stringify({mode:'legacy-unmatched-detail'})}));
assert.equal(res.status,401);
console.log('PASS 9.20: one unmatched historical row, sanitized context, no RPC, protected');
