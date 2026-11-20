import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const edge=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'})
  .replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40),sender='0x'+'b'.repeat(40),token='0x'+'c'.repeat(40);
const hash='0x'+'d'.repeat(64),uid='00000000-0000-4000-8000-000000000001',wid='00000000-0000-4000-8000-000000000002';
const topic=a=>'0x'+a.slice(2).padStart(64,'0');
async function simulate({mismatch=false,unauthorized=false}={}){
  let handler;const writes=[],rpc=[];
  const snapshot={user_id:uid,wallet_id:wid,payload:{kind:'verified_discovery_results',wallet,process:{lots:[]}}};
  const stage={user_id:uid,wallet_id:wid,from_block:100,to_block:199,transfer_events:[
    {hash,block:105,from:sender,to:wallet,token,rawValue:'0x64'}]};
  const values={'tln_vow_staking_scan_cache':[snapshot],tln_vow_reward_delta_stage:[stage],
    tln_vow_reward_receipt_stage:[]};
  const db={from:name=>({select:()=>{const q={eq:()=>q,order:()=>q,
    range:async()=>({data:values[name]||[],error:null})};return q},
    insert:async rows=>{writes.push({name,rows});return {error:null}}})};
  const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
    TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'api-secret'})[k]},serve:f=>handler=f},
    createClient:()=>db,Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,
    setTimeout,clearTimeout,JSON,Map,Set,Object,console,fetch:async(_url,opt)=>{
      const request=JSON.parse(opt.body);rpc.push(request.method);
      const tx={hash,blockNumber:'0x69',to:sender,input:'0x12345678'};
      const receipt={transactionHash:hash,blockNumber:'0x69',status:'0x1',logs:[{
        address:token,topics:['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          topic(sender),topic(wallet)],data:mismatch?'0x65':'0x64',logIndex:'0x0'}]};
      return new Response(JSON.stringify({result:request.method==='eth_getTransactionByHash'?tx:receipt}));
    }};
  vm.runInNewContext(edge,ctx);
  const result=await handler(new Request('https://mock.test',{method:'POST',
    headers:{'x-tln-reward-secret':unauthorized?'wrong':'secret'},
    body:JSON.stringify({mode:'delta-receipt-verify'})}));
  return {status:result.status,result:await result.json(),writes,rpc};
}
let out=await simulate();
assert.equal(out.status,200);assert.equal(out.result.status,'receipt_evidence_staged');
assert.equal(out.result.verifiedTransactions,1);assert.equal(out.result.claimsCreated,0);
assert.equal(out.writes.length,1);assert.equal(out.writes[0].name,'tln_vow_reward_receipt_stage');
assert.equal(out.writes[0].rows[0].evidence.transfers.length,1);
assert.equal(out.writes[0].rows[0].reward_classification_verified,false);
out=await simulate({mismatch:true});
assert.equal(out.status,503);assert.equal(out.writes.length,0);
out=await simulate({unauthorized:true});
assert.equal(out.status,401);assert.equal(out.rpc.length,0);assert.equal(out.writes.length,0);
console.log('TLN/VOW 9.37: verified receipt writes only after exact onchain match; mismatch/unauthorized blocked');
