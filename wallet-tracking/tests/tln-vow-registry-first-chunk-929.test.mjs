import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40),stakingAddress='0x'+'b'.repeat(40),extraToken='0x'+'c'.repeat(40);
const snapshot={user_id:'owner',wallet_id:'wallet',payload:{kind:'verified_discovery_results',wallet,
  completedStep:5,process:{done:{rewards:true,referral:true}}}};
const raw={user_id:'owner',wallet_id:'wallet',scanner_version:'erc20-raw-v1',
  complete_from_block:0,last_scanned_block:125000,payload:[]};
const fixtures={tln_vow_staking_scan_cache:[snapshot],defi_staking_contracts:[
  {contract_address:stakingAddress,role:'staking',classify_transfers:true}],
  defi_project_tokens:[{contract_address:extraToken,role:'token'}]};
let handler,reads=[],rpcCalls=[],writes=0;
const db={from:table=>{reads.push(table);const q={select:()=>q,eq:(col,val)=>{if(col==='cache_key')q.cacheKey=val;return q;},
  order:()=>q,range:async()=>({data:table==='tln_vow_staking_scan_cache'?(q.cacheKey==='erc20-history-v1'?[raw]:[snapshot]):fixtures[table],error:null}),
  then:(resolve,reject)=>Promise.resolve({data:fixtures[table],error:null}).then(resolve,reject),
  insert:()=>{writes++;throw Error('Unexpected insert');},update:()=>{writes++;throw Error('Unexpected update');},
  upsert:()=>{writes++;throw Error('Unexpected upsert');}};return q;}};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'test'})[k]},serve:f=>handler=f},createClient:()=>db,
  Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async(_url,opts)=>{const body=JSON.parse(opts.body);rpcCalls.push(body);
    if(body.method==='eth_blockNumber')return new Response(JSON.stringify({result:'0x20000'}));
    assert.equal(body.method,'alchemy_getAssetTransfers');
    assert.equal(body.params[0].fromBlock,'0x1e7c8');
    assert.equal(body.params[0].toBlock,'0x1e82b');
    const incoming=!!body.params[0].toAddress;
    return new Response(JSON.stringify({result:{transfers:[{rawContract:{address:stakingAddress},
      to:incoming?wallet:extraToken,from:incoming?extraToken:wallet,
      blockNum:'0x1e7c9',hash:'0x'+'d'.repeat(64)}]}}));
  }};
vm.runInNewContext(source,ctx);
const res=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'registry-first-chunk-scan-preview',maxBlocks:100,wallet:extraToken})}));
const data=await res.json();
assert.equal(res.status,200,JSON.stringify(data));
assert.equal(data.registrySummary.configuredStakingRows,1);
assert.equal(data.registrySummary.configuredProjectTokenRows,1);
assert.equal(data.registrySummary.uniqueContractsInspected,6);
assert.equal(data.registrySummary.classificationPerformed,false);
assert.equal(data.inspection.events,2);
assert.equal(data.inspection.contracts.length,0);
assert.equal(data.rewardClassificationCompleted,false);
assert.equal(data.referralClassificationCompleted,false);
assert.equal(data.chunk.persisted,false);
assert.equal(rpcCalls.length,3);
assert.equal(writes,0);
assert.deepEqual(reads,['tln_vow_staking_scan_cache','tln_vow_staking_scan_cache','defi_staking_contracts','defi_project_tokens']);
assert.doesNotMatch(JSON.stringify(data),new RegExp(wallet+'|'+stakingAddress+'|'+extraToken+'|owner'));
console.log('PASS 9.29: dynamic registry matching, bounded preview, no addresses/writes/claim classification');
