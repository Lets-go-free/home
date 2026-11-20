import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40),token='0x'+'c'.repeat(40),hash='0x'+'d'.repeat(64);
const block=5555,amount=12.5;
const payload={kind:'verified_discovery_results',wallet,
  process:{lots:[{stakeTx:'0x'+'e'.repeat(64),topUps:[{tx:hash,block,
    evidence:'onchain_same_wallet_position_state',storageProof:{proven:true}}]}]},
  globals:{provenRewardRows:[{hash,token,amount,from:'0x'+'0'.repeat(40),to:wallet,
    rewardProof:{present:true},rewardFlowEvidence:{present:true}}]}};
const rows=[{user_id:'owner',wallet_id:'wallet',payload}];
let handler,writes=0,methods=[];
const db={from:()=>{const q={select:()=>q,eq:()=>q,order:()=>q,range:async()=>({data:rows,error:null}),
  insert:()=>{writes++;throw Error('write');},update:()=>{writes++;throw Error('write');},
  upsert:()=>{writes++;throw Error('write');}};return q;}};
const transferTopic='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'test'})[k]},serve:f=>handler=f},createClient:()=>db,
  Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async(_url,opts)=>{const {method,params}=JSON.parse(opts.body);methods.push(method);
    assert.ok(!JSON.stringify(params).includes('acf7cfc506809bdb57435995267e1592cd7ce537296581a55be60e6668509131'));
    if(method==='eth_getTransactionByHash')return new Response(JSON.stringify({result:{hash,from:wallet,
      blockNumber:'0x15b3',input:'0x12345678',to:'0x'+'b'.repeat(40)}}));
    if(method==='eth_getTransactionReceipt')return new Response(JSON.stringify({result:{transactionHash:hash,
      blockNumber:'0x15b3',status:'0x1',logs:[{address:token,
        topics:[transferTopic,'0x'+'0'.repeat(64),'0x'+wallet.slice(2).padStart(64,'0')],
        data:'0x'+(1250n).toString(16)}]}}));
    if(method==='eth_call'){
      assert.equal(params[0].to,token);assert.equal(params[1],'0x15b3');
      return new Response(JSON.stringify({result:'0x2'}));
    }
    throw Error('Unexpected RPC');}};
vm.runInNewContext(source,ctx);
const res=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'cached-topup-mint-rpc-preview',hash:'0x'+'f'.repeat(64)})}));
const data=await res.json();
assert.equal(res.status,200,JSON.stringify(data));
assert.equal(data.candidatesFound,1);
assert.equal(data.inspected,1);
assert.equal(data.verifiedAgreementCount,1);
assert.equal(data.results[0].expectedAmount,12.5);
assert.equal(data.results[0].selector,'0x12345678');
assert.equal(data.results[0].mintAmountMatches,true);
assert.equal(data.claimsCreated,0);
assert.equal(data.persisted,false);
assert.equal(writes,0);
assert.deepEqual(methods,['eth_getTransactionByHash','eth_getTransactionReceipt','eth_call']);
assert.doesNotMatch(JSON.stringify(data),new RegExp(wallet+'|'+token+'|'+hash));
rows.push({user_id:'another-owner',wallet_id:'another-wallet',payload});
methods=[];
const ambiguous=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'cached-topup-mint-rpc-preview'})}));
const ambiguity=await ambiguous.json();
assert.equal(ambiguous.status,200);
assert.equal(ambiguity.candidatesFound,2);
assert.equal(ambiguity.uniqueEligible,0);
assert.equal(ambiguity.inspected,0);
assert.deepEqual(methods,[]);
assert.equal(writes,0);
console.log('PASS 9.32: non-hardcoded cached top-up verification, exact fractional amount, no writes');
