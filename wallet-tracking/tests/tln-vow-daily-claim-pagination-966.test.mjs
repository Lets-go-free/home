import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const raw=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const source=stripTypeScriptTypes(raw,{mode:'strip'}).replace(/^import .*;?$/gm,'');
const uid='00000000-0000-4000-8000-000000000001';
const wid='00000000-0000-4000-8000-000000000002';
const wallet='0x'+'a'.repeat(40);
const snapshot={user_id:uid,wallet_id:wid,payload:{kind:'verified_discovery_results',wallet,process:{lots:[]}}};
async function exercise(count,commit){
  let handler;const writes=[];const ranges=[];
  const receipts=Array.from({length:count},(_,i)=>({user_id:uid,wallet_id:wid,
    chain_key:'bsc',tx_hash:'0x'+i.toString(16).padStart(64,'0'),block_number:i+1,
    evidence:{receiptVerified:true,calledContract:wallet,transactionSender:wallet,selector:'0x00000000',transfers:[]}}));
  const sb={from:name=>({
    select:()=>{
      const q={eq:()=>q,order:()=>q,limit:()=>q,range:async(a,b)=>{
        if(name==='tln_vow_reward_receipt_stage')ranges.push([a,b]);
        const rows=name==='tln_vow_staking_scan_cache'?[snapshot]:
          name==='tln_vow_reward_receipt_stage'?receipts:name==='defi_staking_contracts'?[]:[];
        return {data:rows.slice(a,b+1),error:null};
      },then:(resolve,reject)=>Promise.resolve({data:name==='tln_vow_staking_scan_cache'?[snapshot]:[],error:null}).then(resolve,reject)};
      return q;
    },upsert:async(rows)=>{writes.push({name,rows});return {error:null}}
  })};
  const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
    TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'provider'})[k]},serve:f=>handler=f},
    createClient:()=>sb,Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,
    setTimeout,clearTimeout,JSON,Map,Set,Object,console,fetch:async()=>{throw Error('No RPC expected')}};
  vm.runInNewContext(source,ctx);
  const response=await handler(new Request('https://mock.test',{method:'POST',
    headers:{'x-tln-reward-secret':'secret'},body:JSON.stringify({mode:'daily-direct-claim-cycle',commit})}));
  return {status:response.status,result:await response.json(),ranges,writes};
}

let test=await exercise(205,false);
assert.equal(test.status,200);
assert.equal(test.result.inspectedReceipts,205);
assert.equal(test.result.receiptInventoryComplete,true);
assert.deepEqual(test.ranges.map(r=>Array.from(r)),[[0,199],[200,399]]);
assert.equal(test.writes.length,0);
test=await exercise(4000,true);
assert.equal(test.status,200);
assert.equal(test.result.receiptInventoryComplete,true);
assert.equal(test.result.inspectedReceipts,4000);
test=await exercise(4001,true);
assert.equal(test.status,409);
assert.equal(test.result.persisted,false);
assert.equal(test.writes.length,0);
assert.match(test.result.error,/exceeds 4000/);
console.log('9.66 daily full inventory pagination and fail-closed cap');
