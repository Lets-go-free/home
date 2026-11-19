import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const ts=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
assert.doesNotMatch(ts,/\.upsert\(|\.insert\(|\.update\(|\.delete\(/);
const source=stripTypeScriptTypes(ts,{mode:'strip'}).replace(/^import .*;?$/gm,'');
const wallet='0x'+'a'.repeat(40), tx='0x'+'b'.repeat(64);
const contract='0xf585b5b4f22816baf7629aea55b701662630397b';
const row={user_id:'u',wallet_id:'id',chain_key:'bsc',cache_key:'verified-discovery-results',
  updated_at:'2026-09-28T00:00:00Z',last_scanned_block:900,
  payload:{kind:'verified_discovery_results',wallet,completedStep:5,lastCheckedAt:'2026-09-28T00:00:00Z',lastCheckedBlock:900,
    process:{done:{rewards:true,referral:true}}}};
async function run({incomplete=false,badSecret=false}={}) {
  let handler;const requests=[];
  const db={from:()=>({select:()=>({eq:()=>({eq:()=>({eq:()=>({order:()=>({range:async()=>({data:[row],error:null})})})})})})})};
  const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
    TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'private-provider-key'})[k]},serve:f=>handler=f},
    createClient:()=>db,Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,
    JSON,Map,Set,Object,console,fetch:async (_url,opts)=>{
      const q=JSON.parse(opts.body);requests.push(q);
      if(q.method==='eth_blockNumber')return new Response(JSON.stringify({result:'0x3e8'}));
      assert.equal(q.method,'alchemy_getAssetTransfers');
      const query=q.params[0];assert.equal(query.fromBlock,'0x304');assert.equal(query.toBlock,'0x3e8');
      assert.equal(query.category[0],'erc20');assert.equal(query.maxCount,'0x3e8');
      const incoming=!!query.toAddress;
      const transfers=incoming&&requests.length===2?[{hash:tx,blockNum:'0x320',
        rawContract:{address:contract},from:'0x'+'c'.repeat(40),to:wallet}]:[];
      return new Response(JSON.stringify({result:{transfers,pageKey:incomplete?`nextpage-${requests.length}`:null}}));
    }};
  vm.runInNewContext(source,ctx);
  const res=await handler(new Request('https://mock.test',{method:'POST',headers:{'x-tln-reward-secret':badSecret?'wrong':'secret'},
    body:JSON.stringify({mode:'delta-scan-preview',maxBlocks:250})}));
  return {status:res.status,body:await res.json(),requests};
}
let r=await run();assert.equal(r.status,200);assert.equal(r.body.scanCompleted,true);
assert.equal(r.body.inspection.method,'alchemy_getAssetTransfers');
assert.equal(r.body.inspection.events,1);assert.equal(r.body.inspection.uniqueTransactions,1);
assert.equal(r.requests.length,3);
assert.doesNotMatch(JSON.stringify(r.body),/private-provider-key|0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/);
r=await run({incomplete:true});assert.equal(r.status,200);
assert.equal(r.body.scanCompleted,false);assert.equal(r.body.inspection.complete,false);
assert.equal(r.body.chunk.nextFromBlock,null);
assert.equal(r.requests.length,17);
r=await run({badSecret:true});assert.equal(r.status,401);assert.equal(r.requests.length,0);
console.log('PASS 9.16: Alchemy AssetTransfers manual-provider parity, pagination ceiling, no cursor writes');
