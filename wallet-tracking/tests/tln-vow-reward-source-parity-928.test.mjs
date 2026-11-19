import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const known='0x29280091fa7f3abe4739ad5f1f7c5287feaf7736';
const other='0x'+'a'.repeat(40),stake='0x'+'b'.repeat(40);
let handler,reads=[],writes=0,rpcs=0;
const data={
  tln_vow_staking_scan_cache:[],
  defi_project_tokens:[{contract_address:known,role:'reward'},{contract_address:other,role:'underlying'}],
  defi_staking_contracts:[{contract_address:stake,role:'staking',classify_transfers:true},
    {contract_address:other,role:'entry',classify_transfers:false}]
};
const db={from:table=>{reads.push(table);const q={select:()=>q,eq:()=>q,order:()=>q,
  range:async()=>({data:data[table],error:null}),then:(resolve,reject)=>Promise.resolve({data:data[table],error:null}).then(resolve,reject)};
  return q;}};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret'})[k]},serve:f=>handler=f},createClient:()=>db,Response,Request,TextEncoder,
  Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async()=>{rpcs++;throw new Error('RPC unexpected')}};
vm.runInNewContext(source,ctx);
const res=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'reward-source-parity-audit'})}));
const out=await res.json();
assert.equal(res.status,200);
assert.equal(out.counts.fixedEdgeTokenContracts,4);
assert.equal(out.counts.configuredProjectTokenContracts,2);
assert.equal(out.counts.configuredProjectTokensOutsideFixedEdgeSet,1);
assert.equal(out.counts.configuredStakingOrEntryContracts,2);
assert.equal(out.counts.stakingOrEntryContractsOutsideFixedEdgeSet,2);
assert.equal(out.counts.classifyTransferRegistryRows,1);
assert.equal(out.counts.entryOrAuxiliaryRegistryRows,1);
assert.equal(out.parityVerified,false);
assert.equal(out.rewardCompletenessVerified,false);
assert.equal(out.referralCompletenessVerified,false);
assert.equal(out.manualSources.filter(x=>x.manual&&!x.edgePreview).length,6);
assert.deepEqual(reads,['tln_vow_staking_scan_cache','defi_staking_contracts','defi_project_tokens']);
assert.equal(rpcs,0);assert.equal(writes,0);
assert.doesNotMatch(JSON.stringify(out),new RegExp(other));
console.log('PASS 9.28: registry and feature parity gap, zero RPC/writes and no contract addresses');
