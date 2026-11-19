import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const coreSource=fs.readFileSync(new URL('../js/tln-reward-verification-core.js',import.meta.url),'utf8');
const edgeSource=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40),token='0x'+'b'.repeat(40),hash='0x'+'c'.repeat(64);
const claim={hash,token,amount:3.5,eventType:'claim',symbol:'VOW'};
const cacheRow={user_id:'u',wallet_id:'id',payload:{kind:'verified_discovery_results',completedStep:5,
  process:{done:{rewards:true,referral:true},lots:[{rewardClaims:[claim]}]},
  globals:{provenRewardRows:[claim],claimReferenceResult:{strong:[{hash}]}}},updated_at:'2026-09-28T00:00:00Z'};
const rawRow={user_id:'u',wallet_id:'id',scanner_version:'erc20-raw-v1',complete_from_block:0,
  last_scanned_block:1200,payload:[]};
let handler,requests=0,dbReads=0;
const db={from:()=>{
  let cacheKey='';
  const q={select(){return this},eq(column,value){if(column==='cache_key')cacheKey=value;return this},
    order(){return this},range:async()=>{dbReads++;return {data:cacheKey==='erc20-history-v1'?[rawRow]:[cacheRow],error:null}}};
  return q;
}};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret'})[k]},serve:f=>handler=f},createClient:()=>db,Response,Request,
  TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async()=>{requests++;throw new Error('No RPC allowed')}};
vm.runInNewContext(coreSource,ctx);vm.runInNewContext(edgeSource,ctx);
const res=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'legacy-evidence-audit'})}));
const data=await res.json();
assert.equal(res.status,200);assert.equal(data.summary.snapshots,1);
assert.equal(data.summary.provenRows,1);assert.equal(data.summary.matchingProvenClaimKeys,1);
assert.equal(data.summary.strongReferralRows,1);assert.equal(data.summary.withRecordedErc20Range,1);
assert.equal(requests,0);assert.equal(dbReads,2);
assert.doesNotMatch(JSON.stringify(data),/0xaaaaaaaa|0xbbbbbbbb|0xcccccccc/);
const core=ctx.WT_TLN_REWARD_VERIFICATION_CORE;
assert.equal(core.legacySnapshotEvidence({process:{lots:[]},globals:{provenRewardRows:[]}}).provenRows,0);
assert.equal(core.auditSnapshot(cacheRow.payload).verified,false);
console.log('PASS 9.19: historical structural evidence audit, distinct scan cache, read-only/no RPC');
