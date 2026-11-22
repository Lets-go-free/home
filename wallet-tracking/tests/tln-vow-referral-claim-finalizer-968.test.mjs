import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const raw=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const source=stripTypeScriptTypes(raw,{mode:'strip'}).replace(/^import .*;?$/gm,'');
const uid='00000000-0000-4000-8000-000000000001',wid='00000000-0000-4000-8000-000000000002';
const wallet='0x'+'a'.repeat(40),sender='0x'+'b'.repeat(40),staking='0x'+'c'.repeat(40);
const token='0x29280091fa7f3abe4739ad5f1f7c5287feaf7736',hash='0x'+'d'.repeat(64);
const zero='0x'+'0'.repeat(40);
async function run({commit=false,verified=true,previous=false,alterAmount=false}={}){
  let handler;const writes=[];
  const snapshot={user_id:uid,wallet_id:wid,payload:{kind:'verified_discovery_results',wallet,
    globals:{claimReferenceResult:{strong:previous?[{hash,mints:[{token}]}]:[]}},process:{lots:[]}}};
  const receipt={receiptVerified:true,transactionSender:sender,calledContract:staking,
    referralPrincipalTransfers:1,referralStakeEvents:0,
    transfers:[{token,from:zero,to:wallet,amountRaw:'0x64',logIndex:7}],
    referralMintCandidates:[{kind:'referral_mint_strong',token,mintAmountRaw:alterAmount?'101':'100',
      mintLogIndexes:[7],walletNetRaw:'100',receiptVerified:true,
      referralPathVerified:verified,referralLevel:2,
      referralPathEvidence:{verified,level:2,path:[sender,'0x'+'e'.repeat(40),wallet]}}]};
  const stage={user_id:uid,wallet_id:wid,chain_key:'bsc',tx_hash:hash,block_number:123,evidence:receipt};
  const lists={tln_vow_staking_scan_cache:[snapshot],tln_vow_reward_receipt_stage:[stage],
    defi_staking_contracts:[{contract_address:staking}]};
  const sb={from:name=>({select:()=>{
    const q={eq:()=>q,order:()=>q,range:async(a,b)=>({data:(lists[name]||[]).slice(a,b+1),error:null}),
      then:(resolve,reject)=>Promise.resolve({data:lists[name]||[],error:null}).then(resolve,reject)};
    return q;
  },upsert:async(rows,args)=>{writes.push({name,rows,args});return {error:null}}})};
  const ctx={Deno:{env:{get:k=>({SUPABASE_URL:'https://mock.test',SUPABASE_SERVICE_ROLE_KEY:'service',
    TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'provider'})[k]},serve:f=>handler=f},
    createClient:()=>sb,Response,Request,TextEncoder,Date,Intl,Number,BigInt,AbortController,
    setTimeout,clearTimeout,JSON,Map,Set,Object,console,fetch:async()=>{throw Error('No RPC expected')}};
  vm.runInNewContext(source,ctx);
  const response=await handler(new Request('https://mock.test',{method:'POST',
    headers:{'x-tln-reward-secret':'secret'},body:JSON.stringify({mode:'referral-claim-finalize',commit})}));
  return {status:response.status,result:await response.json(),writes};
}
let r=await run();
assert.equal(r.status,200);
assert.equal(r.result.eligibleReferralClaims,1);
assert.equal(r.result.dryRun,true);
assert.equal(r.writes.length,0);
r=await run({commit:true});
assert.equal(r.result.eligibleReferralClaims,1);
assert.equal(r.writes.length,1);
assert.equal(r.writes[0].name,'tln_vow_reward_referral_claims');
assert.equal(r.writes[0].rows[0].amount_raw,'100');
assert.equal(r.writes[0].rows[0].referral_level,2);
assert.equal(r.writes[0].args.ignoreDuplicates,true);
for(const opts of [{commit:true,verified:false},{commit:true,previous:true},
  {commit:true,alterAmount:true}]){
  r=await run(opts);
  assert.equal(r.status,200);
  assert.equal(r.result.eligibleReferralClaims,0);
  assert.equal(r.writes.length,0);
}
console.log('9.68 exact manual Step-5 referral ledger finalizer, idempotence and fail-closed guards');
