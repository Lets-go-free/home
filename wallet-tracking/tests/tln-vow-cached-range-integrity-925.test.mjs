import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const hash='0x'+'b'.repeat(64),token='0x'+'c'.repeat(40);
const legacy={kind:'verified_discovery_results',wallet:'0x'+'a'.repeat(40),completedStep:5,
  lastCheckedBlock:20,process:{done:{rewards:true,referral:true}}};
const snapshot=[{user_id:'owner',wallet_id:'wallet',payload:legacy}];
const mkTransfer=(block,uniqueId)=>({blockNum:'0x'+block.toString(16),hash,uniqueId,
  from:'0x'+'a'.repeat(40),to:'0x'+'d'.repeat(40),rawContract:{address:token}});
const raw=[{user_id:'owner',wallet_id:'wallet',scanner_version:'erc20-raw-v1',
  complete_from_block:10,last_scanned_block:19,payload:[mkTransfer(11,'id1'),mkTransfer(11,'id1'),
    mkTransfer(25,'id3'),{hash,blockNum:'not-hex',rawContract:{address:token}}]}];
let handler,rpcCalls=0,writes=0;
const db={from:()=>({select:()=>{
  let key='';const query={eq:(name,value)=>{if(name==='cache_key')key=value;return query;},
    order:()=>query,range:async()=>({data:key==='erc20-history-v1'?raw:snapshot,error:null})};return query;}})};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret'})[k]},serve:f=>handler=f},createClient:()=>db,Response,Request,TextEncoder,
  Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async()=>{rpcCalls++;throw new Error('RPC unexpected')}};
vm.runInNewContext(source,ctx);
const res=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'cached-range-integrity'})}));
const data=await res.json();
assert.equal(res.status,200);
assert.equal(data.summary.legacyWallets,1);
assert.equal(data.summary.validRecordedRanges,1);
assert.equal(data.summary.rowsExamined,4);
assert.equal(data.summary.invalidRows,1);
assert.equal(data.summary.outsideRecordedRange,1);
assert.equal(data.summary.duplicateIdentities,1);
assert.equal(data.summary.snapshotCursorAhead,1);
assert.equal(data.details[0].paginationProofPresent,false);
assert.equal(rpcCalls,0);assert.equal(writes,0);
assert.doesNotMatch(JSON.stringify(data),/owner|wallet|0xaaaa|0xbbbb/);
console.log('PASS 9.25: raw event/range diagnostics with anomalies, no completeness claim or writes');
