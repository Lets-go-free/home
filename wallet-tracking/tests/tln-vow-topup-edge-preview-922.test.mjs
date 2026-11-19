import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40),hash='0xacf7cfc506809bdb57435995267e1592cd7ce537296581a55be60e6668509131';
const snapshot={kind:'verified_discovery_results',wallet,completedStep:5,process:{lots:[{stakeTx:'0x'+'b'.repeat(64),
  topUps:[{tx:hash,evidence:'onchain_same_wallet_position_state',storageProof:{proven:true,root:3}}],rewardClaims:[]}]},
  globals:{provenRewardRows:[{hash,token:'0x29280091fa7f3abe4739ad5f1f7c5287feaf7736',amount:5500,symbol:'TLN+',
    from:'0x'+'0'.repeat(40),to:wallet,rewardProof:'proven',rewardFlowEvidence:'mint'}]}};
const row={user_id:'u',wallet_id:'id',payload:snapshot,updated_at:'2026-09-28T00:00:00Z'};
let handler,rpcCalls=0;
const db={from:()=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({order:()=>({range:async()=>({data:[row],error:null})})})})})})})};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret'})[k]},serve:f=>handler=f},createClient:()=>db,Response,Request,TextEncoder,
  Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async()=>{rpcCalls++;throw new Error('No RPC expected')}};
vm.runInNewContext(source,ctx);
const response=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'verified-topup-mint-preview'})}));
const data=await response.json();
assert.equal(response.status,200);assert.equal(data.candidateCount,1);
assert.equal(data.examples[0].amount,5500);assert.equal(data.examples[0].storageProofVerified,true);
assert.equal(data.examples[0].existingClaimSameHash,false);assert.equal(rpcCalls,0);
assert.doesNotMatch(JSON.stringify(data),new RegExp(wallet));
console.log('PASS 9.22: read-only Edge top-up mint candidate preview, no RPC/writes');
