import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const script=stripTypeScriptTypes(edge,{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40);
const userId='00000000-0000-4000-8000-000000000001';
const walletId='00000000-0000-4000-8000-000000000002';
const snapshot={user_id:userId,wallet_id:walletId,updated_at:'2026-11-20T00:00:00Z',
  payload:{kind:'verified_discovery_results',wallet,completedStep:5,
    process:{done:{rewards:true,referral:true}}}};
const raw={user_id:userId,wallet_id:walletId,scanner_version:'erc20-raw-v1',
  complete_from_block:0,last_scanned_block:900,payload:[]};
async function run({incomplete=false}={}){
  let handler;const writes=[];const rpc=[];
  const data={tln_vow_staking_scan_cache:null,tln_vow_reward_delta_stage:[],
    defi_staking_contracts:[],defi_project_tokens:[]};
  const sb={from:(name)=>({
    select:()=>{
      const q={eq:()=>q,order:()=>q,range:async()=>({data:name==='tln_vow_staking_scan_cache'?
        (data.tln_vow_staking_scan_cache===null?[snapshot]:[raw]):data[name],error:null})};
      // The cache is requested twice, with distinct cache_key filters.
      let cacheKey='';q.eq=(col,val)=>{if(col==='cache_key')cacheKey=val;return q};
      q.range=async()=>({data:name==='tln_vow_staking_scan_cache'?
        (cacheKey==='verified-discovery-results'?[snapshot]:[raw]):data[name],error:null});
      return q;
    },
    insert:async(value)=>{writes.push({name,value});return {error:null}}
  })};
  const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
    TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'provider-secret'})[k]},serve:f=>handler=f},
    createClient:()=>sb,Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,
    setTimeout,clearTimeout,JSON,Map,Set,Object,console,fetch:async (_url,opts)=>{
      const request=JSON.parse(opts.body);rpc.push(request);
      if(request.method==='eth_blockNumber')return new Response(JSON.stringify({result:'0x3e8'}));
      assert.equal(request.method,'alchemy_getAssetTransfers');
      if(incomplete)return new Response(JSON.stringify({result:{transfers:[],pageKey:'same'}}));
      return new Response(JSON.stringify({result:{transfers:[]}}));
    }};
  vm.runInNewContext(script,ctx);
  const response=await handler(new Request('https://mock.test',{method:'POST',
    headers:{'x-tln-reward-secret':'secret'},body:JSON.stringify({mode:'delta-transfer-stage',maxBlocks:100})}));
  return {status:response.status,result:await response.json(),writes,rpc};
}
let r=await run();
assert.equal(r.status,200);assert.equal(r.result.status,'staged_transfer_evidence');
assert.equal(r.result.chunk.fromBlock,772);assert.equal(r.result.chunk.toBlock,871);
assert.equal(r.result.chunk.events,0);assert.equal(r.writes.length,1);
assert.equal(r.writes[0].name,'tln_vow_reward_delta_stage');
assert.equal(r.writes[0].value.reward_classification_verified,false);
assert.equal(r.writes[0].value.historical_completeness_verified,false);
r=await run({incomplete:true});
assert.equal(r.status,503);assert.equal(r.writes.length,0);
console.log('TLN/VOW 9.36 staging: complete chunk inserts once; repeated pagination refuses all writes');
