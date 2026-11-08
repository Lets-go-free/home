import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {stripTypeScriptTypes} from 'node:module';import vm from 'node:vm';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const helper=src.slice(src.indexOf('async function verifiedClaimTokenDecimals('),src.indexOf('// Controlled one-claim path:'));
const USDT='0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f',FAKE='0x'+'8'.repeat(40);
async function inspect({token=USDT,block=16000000,decimals=6,chain='0xae2',bad=null,archive=false}={}){
 const requests=[];const urls=[];const ctx={CHAIN:'apertum',URL,setTimeout,clearTimeout,AbortController,
  sb:{from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{rpc_url:'https://example.test/rpc?private=secret',archive_rpc_url:archive?'https://archive.example.test/rpc':null,evm_chain_id:2786}})})},
  fetch:async(url,options)=>{urls.push(url);const body=JSON.parse(options.body);requests.push(body);if(bad==='network')throw Error(url);
   return {ok:bad!=='http',json:async()=>({jsonrpc:'2.0',id:bad==='id'?0:body.id,error:bad==='rpc'?{code:-32000}:undefined,
    result:body.method==='eth_chainId'?chain:bad==='short'?'0x6':bad==='empty'?'0x':'0x'+BigInt(decimals).toString(16).padStart(64,'0')})}}};
 vm.createContext(ctx);vm.runInContext(readFileSync(new URL('../supabase/functions/dao-reward-refresh/asset-policy.js',import.meta.url),'utf8'),ctx);
 vm.runInContext(stripTypeScriptTypes(helper),ctx);const result=await ctx.verifiedClaimTokenDecimals(token,block);return {result,requests,urls};
}
test('technical decimals are verified by eth_call at the exact claim block, not display precision or latest',async()=>{
 for(const decimals of [0,6,18,36]){const r=await inspect({decimals});assert.equal(r.result.decimals,decimals);assert.equal(r.result.block,16000000);
  assert.equal(r.requests.length,2);assert.deepEqual(r.requests[1].params,[{to:USDT,data:'0x313ce567'},'0xf42400']);}
});
test('technical metadata honors the configured archive endpoint',async()=>{
 const r=await inspect({archive:true});assert.equal(r.result.decimals,6);assert.equal(r.urls.length,2);
 assert.ok(r.urls.every(u=>new URL(u).hostname==='archive.example.test'));
});
test('unknown asset, wrong chain, malformed result, error or unavailable archive never assumes 18',async()=>{
 for(const options of [{token:FAKE},{chain:'0x1'},{decimals:37},{bad:'short'},{bad:'empty'},{bad:'id'},{bad:'network'},{bad:'rpc'},{bad:'http'},{block:0}]){
  const r=await inspect(options);assert.equal(r.result.decimals,null);assert.doesNotMatch(JSON.stringify(r.result),/secret|https:/);
 }
 const unknown=await inspect({token:FAKE});assert.equal(unknown.requests.length,0);
});
const driver=src.slice(src.indexOf('async function processSingleNativeClaim('),src.indexOf('// Read-only, manually enabled single-address readiness check.'));
test('generic driver passes policy quote and verified token identity/decimals to the scoped finalizer',async()=>{
 const calls=[];const ctx={PROJECT:'dao1',CHAIN:'apertum',lower:v=>String(v||'').toLowerCase(),
  process:async()=>({transactionScan:{complete:true},flowScan:{complete:true},referralScan:{complete:true}}),loadAddress:async()=>FAKE,
  verifiedClaimTokenDecimals:async(token,block)=>({token,block,decimals:6,source:'eth_call-decimals-at-claim-block'}),
  sb:{rpc:async(name,p)=>{calls.push({name,p:JSON.parse(JSON.stringify(p))});return {data:name.includes('next_native')?
   {tx_hash:'0x'+'a'.repeat(64),claim_block:16000000,status:'unassigned_miner',payout_status:'verified'}:{status:'completed',claimsCreated:1}}},
   from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{payout_status:'verified',payout_token_address:USDT}})})}};
 vm.createContext(ctx);vm.runInContext(readFileSync(new URL('../supabase/functions/dao-reward-refresh/asset-policy.js',import.meta.url),'utf8'),ctx);vm.runInContext(stripTypeScriptTypes(driver),ctx);
 const r=await ctx.processSingleNativeClaim({user_id:'user',wallet_id:'wallet'},false,true);assert.equal(r.claimsCreated,1);
 assert.equal(calls.at(-1).name,'wallettracking_dao_finalize_single_claim');
 assert.equal(calls.at(-1).p.p_verified_token,USDT);assert.equal(calls.at(-1).p.p_verified_decimals,6);assert.equal(calls.at(-1).p.p_fixed_price,1);assert.equal(calls.at(-1).p.p_include_erc20,true);
});
const route=src.slice(src.indexOf(" if(body?.mode==='process-next-claim-test-wallet')"),src.indexOf(" if(body?.mode==='classify-existing-test-wallet')"));
test('generic route keeps Admin/JWT/flag/fixed-wallet gates and rejects caller-selected identity',async()=>{
 for(const [enabled,live,permission,matches,status] of [
  ['false','false',{ok:true},[{}],403],['true','true',{ok:true},[{}],409],
  ['true','false',{ok:false,status:401,error:'JWT'},[{}],401],['true','false',{ok:false,status:403,error:'admin'},[{}],403],
  ['true','false',{ok:true},[],409],['true','false',{ok:true},[{id:'fixed',user_id:'server-user'}],200]
 ]){
  const calls=[];const ctx={body:{mode:'process-next-claim-test-wallet',user_id:'hostile',wallet_id:'hostile'},request:{},Response,
   Deno:{env:{get:k=>k==='DAO_REWARD_ENABLE_TEST_IMPORT'?enabled:live}},authenticateInspectAdmin:async()=>permission,findInspectWalletMatches:async()=>matches,
   processSingleNativeClaim:async(job,retry,tokens)=>{calls.push({job:JSON.parse(JSON.stringify(job)),tokens});return {status:'no_eligible_claim',claimsCreated:0}}};
  const response=await vm.runInNewContext('(async()=>{'+route+'})()',ctx);assert.equal(response.status,status);
  if(status===200){assert.equal(calls[0].tokens,true);assert.deepEqual(calls[0].job,{user_id:'server-user',wallet_id:'fixed'});}else assert.equal(calls.length,0);
 }
});
