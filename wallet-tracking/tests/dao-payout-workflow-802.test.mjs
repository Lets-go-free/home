import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import {inspectClaimPayoutCoverage,noPayoutEvidenceAllowed} from '../supabase/functions/dao-reward-refresh/payout-coverage.ts';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const wallet='0x'+'1'.repeat(40),contract='0x'+'2'.repeat(40),txHash='0x'+'a'.repeat(64);
const user='user-one',walletId='wallet-one',job={user_id:user,wallet_id:walletId};
const scoped={...job,project_key:'dao1',chain_key:'apertum'};
const tx={...scoped,tx_hash:txHash,selector:'0x86bb8f37',status:'ok',to_address:contract,block_number:403915};
const candidate=(hash=txHash)=>({...scoped,tx_hash:hash,claim_block:403915,payout_status:'pending',payout_checked_at:null,canonical_existing_verified:false,status:'pending'});
function harness(candidates=[candidate()],flows=[]){
 const tables={dao_reward_claim_candidates:candidates,project_transactions:[tx],project_transaction_asset_flows:flows};
 let rpcCalls=0,networkCalls=0,failNetwork=false;
 const sb={from(table){let filters=[],max=Infinity,head=false,count=false,single=false,sort=null;
  const q={select(_s,o){head=!!o?.head;count=!!o?.count;return q},eq(k,v){filters.push(r=>r[k]===v);return q},
   in(k,v){filters.push(r=>v.includes(r[k]));return q},or(){filters.push(r=>r.payout_checked_at==null||Date.parse(r.payout_checked_at)<Date.now()-86400000);return q},
   order(k,o){sort=[k,o];return q},limit(n){max=n;return q},maybeSingle(){single=true;return q},
   then(resolve,reject){try{let rows=tables[table].filter(r=>filters.every(f=>f(r)));
    if(sort)rows=rows.slice().sort((a,b)=>String(a[sort[0]]??'').localeCompare(String(b[sort[0]]??''))*(sort[1].ascending?1:-1));
    const total=rows.length;rows=rows.slice(0,max);
    return Promise.resolve({data:head?null:single?rows[0]??null:rows,count:count?total:null,error:null}).then(resolve,reject);
   }catch(e){return Promise.reject(e).then(resolve,reject)}}};return q},
  async rpc(name,p){assert.equal(name,'wallettracking_dao_record_payout_check');rpcCalls++;
   const c=candidates.find(c=>c.tx_hash===p.p_tx&&c.user_id===p.p_user&&c.wallet_id===p.p_wallet);
   if(!c||c.payout_status==='verified'||c.canonical_existing_verified||c.payout_checked_at!==p.p_expected_checked_at)return {data:false};
   Object.assign(c,{payout_status:p.p_status,payout_checked_at:new Date().toISOString(),payout_coverage:p.p_coverage});
   return {data:true};
  }};
 const ctx={sb,PROJECT:'dao1',CHAIN:'apertum',CLAIM_SELECTOR:'0x86bb8f37',NEW_MINER_CLAIM_SELECTOR:'0x19da4078',
  EXPLORER:'https://example.test',lower:v=>String(v||'').toLowerCase(),inspectClaimPayoutCoverage,noPayoutEvidenceAllowed,
  async json(url){networkCalls++;if(failNetwork)throw Error('network-failed');
   return url.includes('/token-transfers')||url.includes('/internal-transactions')?{items:[],next_page_params:null}:
    {hash:txHash,block_number:403915,raw_input:'0x86bb8f37',from:{hash:wallet},to:{hash:contract},status:'ok',value:'0'};}};
 vm.runInNewContext(stripTypeScriptTypes(src.slice(src.indexOf('function isSuccessfulClaim('),src.indexOf('// Explicitly reconcile'))),ctx);
 return {run:explicit=>ctx.verifyCandidatePayouts(job,wallet,explicit??null),candidates,flows,
  counters:()=>({rpcCalls,networkCalls}),fail:()=>{failNetwork=true}};
}
test('pending ownership does not block independent no-payout classification, then a later canonical flow verifies payment',async()=>{
 const h=harness();let result=await h.run();
 assert.equal(result.noPayoutEvidenceClaims,1);assert.equal(h.candidates[0].status,'pending');
 h.candidates[0].payout_checked_at='2020-01-01T00:00:00Z';
 h.flows.push({...scoped,tx_hash:txHash,direction:'eingang',amount_raw:'1',flow_key:`claim-native:${txHash}`,token_address:'native',token_decimals:18});
 result=await h.run();assert.equal(result.verifiedPayoutClaims,1);assert.equal(h.candidates[0].payout_status,'verified');
 const before=h.counters().rpcCalls;await h.run();assert.equal(h.counters().rpcCalls,before);
});
test('24-hour delay prevents repeated negative scans; explicit bounded manual recheck can invalidate negative coverage',async()=>{
 const h=harness();await h.run();const before=h.counters().networkCalls;
 await h.run();assert.equal(h.counters().networkCalls,before);
 h.fail();const result=await h.run(h.candidates);
 assert.equal(result.payoutsNeedingReview,1);assert.equal(h.candidates[0].payout_status,'needs_review');
});
test('per-wallet 20-item budget leaves measurable backlog; verified, canonical and other-user rows excluded',async()=>{
 const rows=Array.from({length:23},(_,i)=>candidate('0x'+i.toString(16).padStart(64,'0')));
 rows.push({...candidate(),user_id:'another-user'},{...candidate(),canonical_existing_verified:true},{...candidate(),payout_status:'verified'});
 const h=harness(rows);const result=await h.run();
 assert.equal(h.counters().rpcCalls,20);assert.equal(result.pendingPayoutChecks,3);
 assert.match(src,/result.pendingPayoutChecks>0/);
 assert.equal(rows[23].payout_status,'pending');assert.equal(rows[24].payout_status,'pending');assert.equal(rows[25].payout_status,'verified');
});
test('manual route enforces admin, opt-in, disabled live worker and fixed wallet without caller-selected hashes',()=>{
 const route=src.slice(src.indexOf("if(body?.mode==='recheck-zero-payout-test-wallet')"),src.indexOf("if(body?.mode==='classify-existing-test-wallet')"));
 for(const text of ['DAO_REWARD_ENABLE_TEST_IMPORT','DAO_REWARD_ENABLE_LIVE_WORKER','authenticateInspectAdmin(request)','findInspectWalletMatches()','.limit(3)',".eq('claim_reward_aptm',0)"])assert.ok(route.includes(text));
 assert.doesNotMatch(route,/body\.(wallet|user|address|tx)/);
});
