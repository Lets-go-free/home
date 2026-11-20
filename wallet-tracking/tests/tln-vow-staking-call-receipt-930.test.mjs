import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40),staking='0x'+'b'.repeat(40),hash='0x'+'d'.repeat(64);
const snap={user_id:'u',wallet_id:'w',payload:{kind:'verified_discovery_results',wallet,
  completedStep:5,process:{done:{rewards:true,referral:true}}}};
const raw={user_id:'u',wallet_id:'w',scanner_version:'erc20-raw-v1',complete_from_block:0,
  last_scanned_block:125000,payload:[]};
let handler,rpc=[],writes=0;
const db={from:table=>{const q={select:()=>q,eq:(k,v)=>{if(k==='cache_key')q.key=v;return q;},order:()=>q,
  range:async()=>({data:q.key==='erc20-history-v1'?[raw]:[snap],error:null}),
  then:(yes,no)=>Promise.resolve({data:table==='defi_staking_contracts'?
    [{contract_address:staking,role:'staking',classify_transfers:true}]:[],error:null}).then(yes,no),
  update:()=>{writes++;throw Error('write');},upsert:()=>{writes++;throw Error('write');}};return q;}};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'test'})[k]},serve:f=>handler=f},createClient:()=>db,
  Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async(_url,opts)=>{const body=JSON.parse(opts.body);rpc.push(body.method);
    if(body.method==='eth_blockNumber')return new Response(JSON.stringify({result:'0x20000'}));
    if(body.method==='alchemy_getAssetTransfers')return new Response(JSON.stringify({result:{transfers:[
      {from:wallet,to:staking,hash,blockNum:'0x1e7c9'}]}}));
    if(body.method==='eth_getTransactionByHash')return new Response(JSON.stringify({result:{from:wallet,to:staking,
      blockNumber:'0x1e7c9',input:'0xa694fc3a'}}));
    if(body.method==='eth_getTransactionReceipt')return new Response(JSON.stringify({result:{transactionHash:hash,
      status:'0x1',logs:[{topics:['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']}]}}));
    throw Error('unexpected RPC');}};
vm.runInNewContext(source,ctx);
const response=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'staking-call-receipt-preview',maxBlocks:100})}));
const data=await response.json();
assert.equal(response.status,200,JSON.stringify(data));
assert.equal(data.registry.stakingContracts,1);
assert.equal(data.evidence.matchingContractCalls,1);
assert.equal(data.evidence.callsInspected,1);
assert.equal(data.evidence.selectorCounts[0].selector,'0xa694fc3a');
assert.equal(data.evidence.erc20TransferLogs,1);
assert.equal(data.evidence.successfulReceipts,1);
assert.equal(data.evidence.evidenceComplete,true);
assert.equal(data.rewardClassificationCompleted,false);
assert.equal(data.chunk.persisted,false);
assert.deepEqual(rpc,['eth_blockNumber','alchemy_getAssetTransfers','eth_getTransactionByHash','eth_getTransactionReceipt']);
assert.equal(writes,0);
assert.doesNotMatch(JSON.stringify(data),new RegExp(wallet+'|'+staking+'|'+hash));
console.log('PASS 9.30: bounded staking calls, selectors, receipts; no writes or identities');
