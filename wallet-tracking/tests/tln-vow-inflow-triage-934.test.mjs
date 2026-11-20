import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40),staking='0x'+'b'.repeat(40),token='0x29280091fa7f3abe4739ad5f1f7c5287feaf7736';
const h1='0x'+'d'.repeat(64),h2='0x'+'e'.repeat(64),topic='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const snapshot={user_id:'owner',wallet_id:'wallet',payload:{kind:'verified_discovery_results',wallet,
  globals:{provenRewardRows:[]},process:{lots:[]}}};
const raw={user_id:'owner',wallet_id:'wallet',scanner_version:'erc20-raw-v1',complete_from_block:0,
  last_scanned_block:5000,payload:[{hash:h1,blockNum:'0x1194',to:wallet,value:1,rawContract:{address:token}},
    {hash:h2,blockNum:'0x1193',to:wallet,value:1,rawContract:{address:token}}]};
let handler,methods=[],writes=0;
const db={from:table=>{const q={select:()=>q,eq:(k,v)=>{if(k==='cache_key')q.cacheKey=v;return q;},
  order:()=>q,range:async()=>({data:q.cacheKey==='erc20-history-v1'?[raw]:[snapshot],error:null}),
  then:(yes,no)=>Promise.resolve({data:table==='defi_staking_contracts'?[{contract_address:staking}]:[],error:null}).then(yes,no),
  upsert:()=>{writes++;throw Error('write');}};return q;}};
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'test'})[k]},serve:f=>handler=f},createClient:()=>db,
  Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async(_url,opts)=>{const {method,params}=JSON.parse(opts.body);methods.push(method);
    const hash=params[0],first=hash===h1,block=first?'0x1194':'0x1193';
    if(method==='eth_getTransactionByHash')return new Response(JSON.stringify({result:{hash,blockNumber:block,
      to:first?'0x'+'f'.repeat(40):staking,input:first?'0x3593564c':'0x12345678',from:wallet}}));
    if(method==='eth_getTransactionReceipt')return new Response(JSON.stringify({result:{transactionHash:hash,
      blockNumber:block,status:'0x1',logs:[{address:token,topics:[topic,first?'0x'+'1'.padStart(64,'0'):'0x'+'0'.repeat(64),
        '0x'+wallet.slice(2).padStart(64,'0')],data:'0x1'}]}}));
    throw Error('Unexpected RPC');}};
vm.runInNewContext(source,ctx);
const response=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'historical-inflow-triage-preview',offset:0})}));
const data=await response.json();
assert.equal(response.status,200,JSON.stringify(data));
assert.equal(data.candidatesFound,2);
assert.equal(data.inspected,2);
assert.equal(data.stakingContractsChecked,1);
assert.equal(data.results[0].triageHint,'router_like_selector_unverified');
assert.equal(data.results[1].triageHint,'mint_requires_position_proof');
assert.equal(data.results[1].directStakingContractCall,true);
assert.equal(data.results.every(r=>r.requiresRewardReview&&r.rewardClassified===false),true);
assert.equal(data.rewardClassificationCompleted,false);
assert.equal(data.persisted,false);
assert.equal(writes,0);
assert.deepEqual(methods,['eth_getTransactionByHash','eth_getTransactionReceipt',
  'eth_getTransactionByHash','eth_getTransactionReceipt']);
assert.doesNotMatch(JSON.stringify(data),new RegExp(wallet+'|'+staking+'|'+h1+'|'+h2));
const invalid=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'historical-inflow-triage-preview',offset:-1})}));
assert.equal(invalid.status,400);
console.log('PASS 9.34: bounded contract/mint triage, no reward verdict, no writes');
