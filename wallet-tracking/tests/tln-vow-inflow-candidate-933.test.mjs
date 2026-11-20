import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40),token='0x29280091fa7f3abe4739ad5f1f7c5287feaf7736';
const hash='0x'+'d'.repeat(64),known='0x'+'e'.repeat(64);
const snapshot={user_id:'owner',wallet_id:'wallet',payload:{kind:'verified_discovery_results',wallet,
  globals:{provenRewardRows:[{hash:known,token}]},process:{lots:[]}}};
const transfer=(h,block)=>({hash:h,blockNum:'0x'+block.toString(16),rawContract:{address:token},
  to:wallet,from:'0x'+'b'.repeat(40),value:3.5});
const raw={user_id:'owner',wallet_id:'wallet',scanner_version:'erc20-raw-v1',complete_from_block:0,
  last_scanned_block:5000,payload:[transfer(known,4000),transfer(hash,4500)]};
let handler,requests=[],writes=0;
const db={from:()=>{const q={select:()=>q,eq:(k,v)=>{if(k==='cache_key')q.cacheKey=v;return q;},
  order:()=>q,range:async()=>({data:q.cacheKey==='erc20-history-v1'?[raw]:[snapshot],error:null}),
  insert:()=>{writes++;throw Error('unexpected write');},update:()=>{writes++;throw Error('unexpected write');},
  upsert:()=>{writes++;throw Error('unexpected write');}};return q;}};
const topic='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'test'})[k]},serve:f=>handler=f},createClient:()=>db,
  Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async(_url,opts)=>{const {method,params}=JSON.parse(opts.body);requests.push(method);
    assert.equal(params[0],hash);
    if(method==='eth_getTransactionByHash')return new Response(JSON.stringify({result:{hash,
      blockNumber:'0x1194',input:'0x12345678'}}));
    if(method==='eth_getTransactionReceipt')return new Response(JSON.stringify({result:{transactionHash:hash,
      blockNumber:'0x1194',status:'0x1',logs:[{address:token,
        topics:[topic,'0x'+'0'.repeat(64),'0x'+wallet.slice(2).padStart(64,'0')],data:'0x1'}]}}));
    throw Error('unexpected RPC');}};
vm.runInNewContext(source,ctx);
const res=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'historical-inflow-candidate-preview',hash:known})}));
const data=await res.json();
assert.equal(res.status,200,JSON.stringify(data));
assert.equal(data.candidatesFound,1);
assert.equal(data.excludedPreviouslyProven,1);
assert.equal(data.confirmedTransferEvidence,1);
assert.equal(data.results[0].zeroMintLogs,1);
assert.equal(data.results[0].rewardClassified,false);
assert.equal(data.rewardClassificationCompleted,false);
assert.equal(data.historicalCoverageVerified,false);
assert.equal(data.claimsCreated,0);
assert.equal(data.persisted,false);
assert.equal(writes,0);
assert.deepEqual(requests,['eth_getTransactionByHash','eth_getTransactionReceipt']);
assert.doesNotMatch(JSON.stringify(data),new RegExp(wallet+'|'+token+'|'+hash));
console.log('PASS 9.33: unknown ERC20 inflow receipt evidence, exclusion of already proven, no reward claim');
