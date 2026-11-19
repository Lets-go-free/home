import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const first='0x'+'a'.repeat(40),second='0x'+'b'.repeat(40);
const snapshot=w=>({kind:'verified_discovery_results',wallet:w,completedStep:5,
  process:{done:{rewards:true,referral:true}}});
const snapshots=[{user_id:'o1',wallet_id:'w1',payload:snapshot(first)},
  {user_id:'o2',wallet_id:'w2',payload:snapshot(second)}];
const raw=[{user_id:'o1',wallet_id:'w1',scanner_version:'erc20-raw-v1',complete_from_block:0,
  last_scanned_block:125000,payload:[]},
  {user_id:'o2',wallet_id:'w2',scanner_version:'erc20-raw-v1',complete_from_block:0,
    last_scanned_block:126000,payload:[]}];
let handler;
const db={from:()=>({select:()=>{
  let key='';const q={eq:(name,value)=>{if(name==='cache_key')key=value;return q;},
    order:()=>q,range:async()=>({data:key==='erc20-history-v1'?raw:snapshots,error:null})};return q;}})};
const calls=[];
const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
  TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'test'})[k]},serve:f=>handler=f},createClient:()=>db,Response,Request,TextEncoder,
  Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console,
  fetch:async(_url,opts)=>{
    const body=JSON.parse(opts.body);calls.push(body);
    if(body.method==='eth_blockNumber')return new Response(JSON.stringify({result:'0x20000'}));
    assert.equal(body.method,'alchemy_getAssetTransfers');
    assert.equal(body.params[0].fromBlock,'0x1e7c8');
    assert.equal(body.params[0].toBlock,'0x1e82b');
    assert.equal(body.params[0].toAddress||body.params[0].fromAddress,first);
    return new Response(JSON.stringify({result:{transfers:[]}}));
  }};
vm.runInNewContext(source,ctx);
const response=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':'secret'},
  body:JSON.stringify({mode:'legacy-first-chunk-scan-preview',maxBlocks:100,wallet:second})}));
const data=await response.json();
assert.equal(response.status,200);
assert.equal(data.selectedWallets,1);
assert.equal(data.source.recordedToBlock,125000);
assert.equal(data.chunk.fromBlock,124872);
assert.equal(data.chunk.toBlock,124971);
assert.equal(data.inspection.complete,true);
assert.equal(data.chunk.persisted,false);
assert.equal(data.rewardClassificationCompleted,false);
assert.equal(data.referralClassificationCompleted,false);
assert.equal(calls.length,3);
assert.doesNotMatch(JSON.stringify(data),/o1|o2|w1|w2|0xaaaa|0xbbbb/);
console.log('PASS 9.27: one scoped legacy Alchemy window, two directional pages, no writes');
