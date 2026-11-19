import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40);
const legacy={kind:'verified_discovery_results',wallet,completedStep:5,process:{done:{rewards:true,referral:true},
  lots:[{rewardClaims:[{hash:'0x'+'b'.repeat(64),token:'0x'+'c'.repeat(40),amount:5}]}]},
  globals:{provenRewardRows:[{hash:'0x'+'b'.repeat(64),token:'0x'+'c'.repeat(40),amount:5}],
    claimReferenceResult:{strong:[]}}};
const verified={...legacy,wallet:'0x'+'d'.repeat(40),process:{...legacy.process,verification:{
  rewards:{normal:1,assigned:1,unassigned:0},referral:{completed:true,strongCount:0}}},
  blockEvidence:{completeFromBlock:1,completeToBlock:20,coverageVerified:true}};
const snapshots=[{user_id:'u1',wallet_id:'w1',payload:legacy},{user_id:'u2',wallet_id:'w2',payload:verified}];
const raw=[{user_id:'u1',wallet_id:'w1',scanner_version:'erc20-raw-v1',complete_from_block:1,
  last_scanned_block:20,payload:[]}];
let handler,fetches=0,writes=0;
const db={from:()=>({select:()=>{
  let cacheKey='';const query={eq:(key,value)=>{if(key==='cache_key')cacheKey=value;return query;},
    order:()=>query,range:async()=>({data:cacheKey==='erc20-history-v1'?raw:snapshots,error:null})};
  return query;}})};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret'})[k]},serve:f=>handler=f},createClient:()=>db,Response,Request,TextEncoder,
  Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async()=>{fetches++;throw new Error('Unexpected RPC')}};
vm.runInNewContext(source,ctx);
const response=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'legacy-proof-gaps'})}));
const result=await response.json();
assert.equal(response.status,200);
assert.equal(result.summary.snapshotWallets,2);
assert.equal(result.summary.legacyWallets,1);
assert.equal(result.summary.missingRewardCoverage,1);
assert.equal(result.summary.missingReferralVerification,1);
assert.equal(result.summary.missingBlockCoverage,1);
assert.equal(result.summary.recordedErc20Ranges,1);
assert.equal(result.summary.withMatchingClaimKeys,1);
assert.equal(result.details[0].existing.recordedErc20Range,true);
assert.equal(result.details[0].existing.matchedClaimKeys,1);
assert.equal(fetches,0);assert.equal(writes,0);
assert.doesNotMatch(JSON.stringify(result),/u1|u2|w1|w2|0xaaaa/);
console.log('PASS 9.24: legacy proof-gap audit, raw cache is evidence not verification, no RPC/writes');
