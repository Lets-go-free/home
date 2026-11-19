import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const edge=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const hash='0xacf7cfc506809bdb57435995267e1592cd7ce537296581a55be60e6668509131';
const token='0x29280091fa7f3abe4739ad5f1f7c5287feaf7736';
const row={user_id:'u',wallet_id:'id',updated_at:'2026-09-28T00:00:00Z',payload:{
  kind:'verified_discovery_results',wallet:'0x'+'a'.repeat(40),completedStep:5,
  process:{lots:[{stakeTx:'0x'+'c'.repeat(64),stakeBlockHex:'0x'+(44871017).toString(16),status:'closed',
    staking:{contract_address:'0x'+'d'.repeat(40)},pair:{symbol:'LP'}}],
    contractCalls:[{hash}],stakingContractCalls:[{hash}]},
  globals:{provenRewardRows:[{hash,token,amount:5500}]}}};
let handler,rpcCalls=0;
const db={from:()=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({order:()=>({range:async()=>({data:[row],error:null})})})})})})})};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret'})[k]},serve:f=>handler=f},createClient:()=>db,Response,Request,TextEncoder,
  Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async()=>{rpcCalls++;throw new Error('Unexpected RPC')}};
vm.runInNewContext(edge,ctx);
const res=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'legacy-stake-lifecycle'})}));
const data=await res.json();
assert.equal(res.status,200);assert.equal(data.targetFoundInSnapshots,1);
assert.equal(data.inspections[0].lotsTotal,1);
assert.equal(data.inspections[0].exactStakeTxLots,0);
assert.equal(data.inspections[0].sameBlockLots,0);
assert.equal(data.inspections[0].nearestLots[0].blockDistance,1);
assert.equal(data.inspections[0].contractCallsAtTx,1);
assert.equal(data.inspections[0].stakingCallsAtTx,1);
assert.equal(rpcCalls,0);
assert.doesNotMatch(JSON.stringify(data),/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/);
console.log('PASS 9.21: fixed historical stake lifecycle comparison, no RPC or writes');
