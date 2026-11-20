import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'})
  .replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40),userId='00000000-0000-4000-8000-000000000001';
const walletId='00000000-0000-4000-8000-000000000002';
const token='0xf585b5b4f22816baf7629aea55b701662630397b';
const sender='0x'+'b'.repeat(40),hash='0x'+'d'.repeat(64);
const snapshot={user_id:userId,wallet_id:walletId,payload:{kind:'verified_discovery_results',wallet,
  completedStep:5,process:{lots:[]}}};
const raw={user_id:userId,wallet_id:walletId,scanner_version:'erc20-raw-v1',
  complete_from_block:0,last_scanned_block:900,payload:[]};
function topic(addr){return '0x'+addr.slice(2).padStart(64,'0')}
async function run({oneTransfer=false}={}){
  let handler;const writes=[],rpc=[];
  const db={from:name=>({select:()=>{let cacheKey='';const q={eq:(key,val)=>{if(key==='cache_key')cacheKey=val;return q},order:()=>q,
    range:async()=>({data:name==='tln_vow_staking_scan_cache'?
      (cacheKey==='verified-discovery-results'?[snapshot]:[raw]):[],error:null})};return q},
    insert:async row=>{writes.push({name,row});return {error:null}}})};
  const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
    TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'api-secret'})[k]},serve:f=>handler=f},
    createClient:()=>db,Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,
    setTimeout,clearTimeout,JSON,Map,Set,Object,console,fetch:async(_url,opt)=>{
      const q=JSON.parse(opt.body);rpc.push(q.method);
      if(q.method==='eth_blockNumber')return new Response(JSON.stringify({result:'0x98968'}));
      if(q.method==='alchemy_getAssetTransfers'){
        const x=q.params[0],inFirst=Number.parseInt(x.fromBlock,16)===772;
        const transfers=oneTransfer&&inFirst&&x.toAddress===wallet?[{
          uniqueId:'synthetic-one',hash,blockNum:'0x320',from:sender,to:wallet,
          rawContract:{address:token,value:'0x64'},value:0.0001}]:[];
        return new Response(JSON.stringify({result:{transfers}}));
      }
      if(q.method==='eth_getTransactionByHash')return new Response(JSON.stringify({result:{
        hash,blockNumber:'0x320',to:sender,input:'0x12345678'}}));
      if(q.method==='eth_getTransactionReceipt')return new Response(JSON.stringify({result:{
        transactionHash:hash,blockNumber:'0x320',status:'0x1',logs:[{
          address:token,topics:['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            topic(sender),topic(wallet)],data:'0x64',logIndex:'0x0'}]}}));
      throw new Error('Unexpected RPC '+q.method);
    }};
  vm.runInNewContext(source,ctx);
  const response=await handler(new Request('https://mock.test',{method:'POST',
    headers:{'x-tln-reward-secret':'secret'},body:JSON.stringify({mode:'delta-work-cycle',maxBlocks:100})}));
  return {status:response.status,body:await response.json(),writes,rpc};
}
let r=await run();
assert.equal(r.status,200);assert.equal(r.body.status,'work_cycle_staged');
assert.equal(r.body.chunks.length,3);assert.equal(r.body.chunks[0].fromBlock,772);
assert.equal(r.body.chunks[2].toBlock,1071);assert.equal(r.writes.length,3);
assert.equal(r.writes.every(x=>x.name==='tln_vow_reward_delta_stage'),true);
r=await run({oneTransfer:true});
assert.equal(r.status,200);assert.equal(r.body.receiptVerified,1);
assert.equal(r.writes.filter(x=>x.name==='tln_vow_reward_receipt_stage').length,1);
assert.equal(r.writes.filter(x=>x.name==='tln_vow_reward_delta_stage').length,3);
assert.equal(r.body.claimsCreated,0);
console.log('9.38 work cycle: 3 contiguous chunks, direct receipt hand-off, no reward writes');
