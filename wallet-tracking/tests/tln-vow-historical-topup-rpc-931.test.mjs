import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40),hash='0xacf7cfc506809bdb57435995267e1592cd7ce537296581a55be60e6668509131';
const token='0x29280091fa7f3abe4739ad5f1f7c5287feaf7736',block='0x2acad6a';
const lot={stakeTx:'0x'+'b'.repeat(64),topUps:[{tx:hash,evidence:'onchain_same_wallet_position_state',
  storageProof:{proven:true}}]};
const proven={hash,token,amount:5500,from:'0x'+'0'.repeat(40),to:wallet,rewardProof:{ok:true},
  rewardFlowEvidence:{ok:true}};
const snapshot={user_id:'test-owner',wallet_id:'test-wallet',payload:{kind:'verified_discovery_results',wallet,process:{lots:[lot]},
  globals:{provenRewardRows:[proven]}}};
let handler,methods=[],writes=0,receiptMintAmount=5500n;
const db={from:()=>{const q={select:()=>q,eq:()=>q,order:()=>q,range:async()=>({data:[snapshot],error:null}),
  insert:()=>{writes++;throw Error('insert');},update:()=>{writes++;throw Error('update');},
  upsert:()=>{writes++;throw Error('upsert');}};return q;}};
const topicAddress=a=>'0x'+a.slice(2).padStart(64,'0');
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'test'})[k]},serve:f=>handler=f},createClient:()=>db,
  Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async(_url,opt)=>{const {method,params}=JSON.parse(opt.body);methods.push(method);
    if(method==='eth_getTransactionByHash')return new Response(JSON.stringify({result:{hash,from:wallet,
      to:'0x'+'e'.repeat(40),blockNumber:block,input:'0xa7d545db'+('0'.repeat(64))}}));
    if(method==='eth_getTransactionReceipt')return new Response(JSON.stringify({result:{transactionHash:hash,
      blockNumber:block,status:'0x1',logs:[{address:token,
        topics:['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x'+'0'.repeat(64),topicAddress(wallet)],data:'0x'+(receiptMintAmount*10n**18n).toString(16)}]}}));
    if(method==='eth_call'){
      assert.equal(params[0].to,token);assert.equal(params[1],block);
      return new Response(JSON.stringify({result:'0x12'}));
    }
    throw Error('Unexpected RPC');}};
vm.runInNewContext(source,ctx);
const res=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'historical-topup-rpc-regression'})}));
const data=await res.json();
assert.equal(res.status,200,JSON.stringify(data));
assert.equal(data.verifiedAgreement,true);
assert.equal(data.onchain.selector,'0xa7d545db');
assert.equal(data.onchain.matchingZeroMintsToWallet,1);
assert.equal(data.onchain.mintAmountMatches,true);
assert.equal(data.cached.storageProofRecorded,true);
assert.equal(data.claimsCreated,0);
assert.equal(data.persisted,false);
assert.deepEqual(methods,['eth_getTransactionByHash','eth_getTransactionReceipt','eth_call']);
assert.equal(writes,0);
assert.doesNotMatch(JSON.stringify(data),new RegExp(wallet+'|'+hash+'|'+token));
receiptMintAmount=5400n;
const changed=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'historical-topup-rpc-regression'})}));
assert.equal(changed.status,200);
const negative=await changed.json();
assert.equal(negative.onchain.mintAmountMatches,false);
assert.equal(negative.verifiedAgreement,false);
assert.equal(writes,0);
console.log('PASS 9.31: historical top-up receipt, TLN+ 5500 mint and cached proof compared read-only');
