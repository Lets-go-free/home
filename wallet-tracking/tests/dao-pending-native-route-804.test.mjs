import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const route=src.slice(src.indexOf(" if(body?.mode==='check-pending-native-payouts-test-wallet')"),src.indexOf(" if(body?.mode==='classify-existing-test-wallet')"));
async function invoke({enabled='true',live='false',permission={ok:true},matches=[{user_id:'server-user',id:'server-wallet'}],failure=null}={}){
 const calls=[];
 const ctx={body:{mode:'check-pending-native-payouts-test-wallet',user_id:'hostile-user',wallet_id:'hostile-wallet',p_limit:500},
  request:{},Response,Deno:{env:{get:k=>k==='DAO_REWARD_ENABLE_TEST_IMPORT'?enabled:live}},
  authenticateInspectAdmin:async()=>permission,findInspectWalletMatches:async()=>matches,
  sb:{rpc:async(name,params)=>{calls.push({name,params});return {data:{checked:4,verifiedPayoutClaims:4},error:failure}}}};
 const response=await vm.runInNewContext('(async()=>{'+route+'})()',ctx);
 return {status:response.status,data:await response.json(),calls};
}
test('positive manual route checks flag and disabled worker before doing work',async()=>{
 for(const [options,status] of [[{enabled:'false'},403],[{live:'true'},409]]){
  const r=await invoke(options);assert.equal(r.status,status);assert.equal(r.calls.length,0);
 }
});
test('positive route rejects missing JWT/admin and ambiguous registered wallet',async()=>{
 for(const [options,status] of [[{permission:{ok:false,status:401,error:'jwt'}},401],[{permission:{ok:false,status:403,error:'admin'}},403],[{matches:[]},409],[{matches:[{},{}]},409]]){
  const r=await invoke(options);assert.equal(r.status,status);assert.equal(r.calls.length,0);
 }
});
test('server selects scope and four-item limit; no caller override and no full process call',async()=>{
 const r=await invoke();assert.equal(r.status,200);assert.equal(r.data.verifiedPayoutClaims,4);
 assert.equal(r.calls.length,1);assert.equal(r.calls[0].name,'wallettracking_dao_check_pending_native_payouts');
 assert.deepEqual(JSON.parse(JSON.stringify(r.calls[0].params)),{p_user:'server-user',p_wallet:'server-wallet',p_limit:4});
 assert.doesNotMatch(route,/process\(|apply_exact|mark_existing|\.from\(|loadAddress\(/);
});
test('SQL failure is reported, never returned as success',async()=>{
 const r=await invoke({failure:new Error('RPC failure')});assert.equal(r.status,500);assert.equal(r.data.ok,false);
});
