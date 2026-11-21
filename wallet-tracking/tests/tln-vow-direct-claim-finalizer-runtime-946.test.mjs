import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const ts=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const source=stripTypeScriptTypes(ts,{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40),contract='0x'+'b'.repeat(40),token='0x'+'c'.repeat(40),hash='0x'+'d'.repeat(64);
const userId='00000000-0000-4000-8000-000000000001',walletId='00000000-0000-4000-8000-000000000002';
const snapshot={user_id:userId,wallet_id:walletId,payload:{kind:'verified_discovery_results',wallet,
  process:{lots:[{stakeTx:'0x'+'e'.repeat(64),staking:{contract_address:contract},rewardClaims:[]}]}}};
const receipt={user_id:userId,wallet_id:walletId,chain_key:'bsc',tx_hash:hash,block_number:44871018,
  evidence:{receiptVerified:true,knownBridge:false,lifecycleLotMatches:0,transactionSender:wallet,
    calledContract:contract,selector:'0x4e71d92d',transfers:[{token,from:contract,to:wallet,amountRaw:'0x64',logIndex:11}]}};
async function run({badBridge=false}={}){
  let handler;const writes=[];
  const lists={tln_vow_staking_scan_cache:[snapshot],tln_vow_reward_receipt_stage:[{
    ...receipt,evidence:{...receipt.evidence,knownBridge:badBridge}}],
    defi_staking_contracts:[{contract_address:contract}]};
  const sb={from:name=>({
    select:()=>{
      const q={eq:()=>q,order:()=>q,range:async()=>({data:lists[name]||[],error:null}),
        then:(resolve,reject)=>Promise.resolve({data:lists[name]||[],error:null}).then(resolve,reject)};
      return q;
    },
    upsert:async(rows,args)=>{writes.push({name,rows,args});return {error:null}}
  })};
  const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
    TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'provider'})[k]},serve:f=>handler=f},
    createClient:()=>sb,Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,
    setTimeout,clearTimeout,JSON,Map,Set,Object,console,fetch:async()=>{throw Error('Finalizer must use persisted receipts only')}};
  vm.runInNewContext(source,ctx);
  const response=await handler(new Request('https://mock.test',{method:'POST',
    headers:{'x-tln-reward-secret':'secret'},body:JSON.stringify({mode:'direct-claim-finalize'})}));
  return {response:await response.json(),status:response.status,writes};
}
let result=await run();
assert.equal(result.status,200);
assert.equal(result.response.eligibleDirectClaims,1);
assert.equal(result.writes.length,1);
assert.equal(result.writes[0].name,'tln_vow_reward_direct_claims');
assert.equal(result.writes[0].rows[0].amount_raw,'100');
assert.equal(result.writes[0].rows[0].lot_stake_tx,'0x'+'e'.repeat(64));
assert.equal(result.writes[0].args.ignoreDuplicates,true);
result=await run({badBridge:true});
assert.equal(result.response.eligibleDirectClaims,0);
assert.equal(result.writes.length,0);
console.log('9.46: opt-in canonical direct claims persist idempotently; bridges never write');
