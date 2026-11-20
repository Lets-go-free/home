import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const coreSource=fs.readFileSync(new URL('../js/tln-reward-verification-core.js',import.meta.url),'utf8');
const context={};vm.runInNewContext(coreSource,context);
const core=context.WT_TLN_REWARD_VERIFICATION_CORE;
assert.equal(core.rewardCoverageVerdict({normal:3,assigned:3,unassigned:0}).verified,true);
assert.equal(core.rewardCoverageVerdict({normal:3,assigned:2,unassigned:0}).verified,false);
assert.equal(core.rewardCoverageVerdict({normal:3,assigned:3,unassigned:1}).verified,false);
assert.equal(core.referralVerdict({completed:true,strongCount:0}).verified,true);
assert.equal(core.referralVerdict({completed:true,strongCount:1,error:'backend error'}).verified,false);
assert.equal(core.scanBlockEvidence({lastEventBlock:90}).coverageVerified,false);
assert.equal(core.scanBlockEvidence({lastEventBlock:90,completeFromBlock:80,completeToBlock:100,paginationComplete:true}).completeToBlock,100);
assert.equal(core.auditSnapshot({process:{done:{rewards:true,referral:true}}}).verified,false);
assert.equal(core.auditSnapshot({process:{verification:{rewards:{normal:2,assigned:2,unassigned:0},
  referral:{completed:true,strongCount:0}}},blockEvidence:{lastEventBlock:90,completeFromBlock:80,
  completeToBlock:100,coverageVerified:true}}).verified,true);

const edge=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
assert.doesNotMatch(edge,/\.upsert\(|\.update\(|\.delete\(/);
assert.match(edge,/from\('tln_vow_reward_delta_stage'\)\.insert\(/);
const wallet='0x'+'a'.repeat(40);
const legacy={kind:'verified_discovery_results',wallet,completedStep:5,lastCheckedAt:'2026-09-28T00:00:00Z',
  lastCheckedBlock:100,process:{done:{rewards:true,referral:true}}};
const verified={...legacy,process:{...legacy.process,verification:{rewards:{normal:1,assigned:1,unassigned:0},
  referral:{completed:true,strongCount:0}}},blockEvidence:{lastEventBlock:90,completeFromBlock:80,
  completeToBlock:100,coverageVerified:true}};
const rows=[legacy,verified].map((payload,i)=>({user_id:'u',wallet_id:`wallet${i}`,payload,updated_at:'2026-09-28T00:00:00Z'}));
let handler,rpcCalls=0;
const db={from:()=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({order:()=>({range:async()=>({data:rows,error:null})})})})})})})};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret'})[k]},serve:f=>handler=f},createClient:()=>db,Response,Request,TextEncoder,
  Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async()=>{rpcCalls++;throw new Error('No RPC allowed for audit')}};
vm.runInNewContext(coreSource,ctx);vm.runInNewContext(edge,ctx);
const res=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'snapshot-verification-audit'})}));
const body=await res.json();
assert.equal(res.status,200);assert.equal(body.summary.snapshots,2);
assert.equal(body.summary.workflowDone,2);assert.equal(body.summary.fullyVerified,1);
assert.equal(body.summary.legacyWithoutVerification,1);assert.equal(rpcCalls,0);
console.log('PASS 9.17: shared browser/edge verdicts, legacy uncertainty, read-only audit');
