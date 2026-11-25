import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import {processClaimExactPrice1003} from '../supabase/functions/dao-reward-refresh/price-target-worker.ts';
const tx='0x'+'a'.repeat(64), job={user_id:'u',wallet_id:'w'}, target={...job,tx_hash:tx,claim_block:16532883};
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const migrationDir=new URL('../supabase/migrations/',import.meta.url);
const sql=readFileSync(new URL(readdirSync(migrationDir).find(x=>x.endsWith('_dao_automatic_exact_price_1003.sql')),migrationDir),'utf8');
const code=stripTypeScriptTypes(src.slice(src.indexOf('async function processSingleNativeClaim('),src.indexOf('// Read-only, manually enabled single-address readiness check.')));
async function run({reason='canonical-price-missing',priced=1,skipImport=true}={}){
 const calls=[];let finalizations=0;
 const sb={rpc:async(name,params)=>{calls.push([name,params]);if(name.includes('next_native'))return {data:{tx_hash:tx,claim_block:target.claim_block,status:'ownership_verified',payout_status:'verified'}};return {data:++finalizations===1?{status:'blocked',reason,claimsCreated:0}:{status:'completed',claimsCreated:1}};},from(){const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:{payout_status:'verified',payout_token_address:'native'}})};return q;}};
 const context={sb,PROJECT:'dao1',CHAIN:'apertum',loadAddress:async()=>'',process:async()=>({transactionScan:{complete:true},flowScan:{complete:true},referralScan:null}),processClaimExactPrice1003:async(_sb,j,t)=>{assert.equal(j.wallet_id,'w');assert.equal(t,tx);calls.push(['price']);return {pricedFlows:priced};}};
 const result=await vm.runInNewContext(code+`\nprocessSingleNativeClaim(${JSON.stringify(job)},false,true,${skipImport})`,context);return {result,calls,finalizations};
}
test('price block proves exact target then retries same guarded finalizer once',async()=>{const r=await run();assert.equal(r.result.claimsCreated,1);assert.equal(r.finalizations,2);assert.deepEqual(r.calls.filter(x=>x[0].includes('finalize')).map(x=>x[1].p_tx),[tx,tx]);});
test('failed price proof does not retry finalizer',async()=>{const r=await run({priced:0});assert.equal(r.result.status,'blocked');assert.equal(r.finalizations,1);});
test('ownership block and non-staged path never trigger price worker',async()=>{for(const opts of [{reason:'ownership-or-bot-assignment-open'},{skipImport:false}]){const r=await run(opts);assert.equal(r.calls.some(x=>x[0]==='price'),false);}});
test('no reservation means no RPC or price writes',async()=>{const sb={rpc:async(name,params)=>{assert.equal(name,'wallettracking_dao_reserve_exact_price_target_1003');assert.deepEqual(params,{p_user:'u',p_wallet:'w',p_tx:tx});return {data:[]};}};assert.equal((await processClaimExactPrice1003(sb,job,tx)).pricedFlows,0);});
test('valid cached proof uses scoped application without chain call',async()=>{const sb={rpc:async(name,p)=>{if(name.includes('reserve'))return {data:[target]};assert.equal(p.p_tx,tx);assert.equal(p.p_wallet,'w');return {data:1};},from(table){assert.equal(table,'aptm_price_anchors');const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:{aptm_usd:0.2,sync_block:16532880,scanned_from_block:16532870}})};return q;}};assert.equal((await processClaimExactPrice1003(sb,job,tx)).pricedFlows,1);});
test('invalid cached proof never overwritten or applied',async()=>{const sb={rpc:async(name)=>{assert.match(name,/reserve/);return {data:[target]};},from(){const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:{aptm_usd:0.2,sync_block:16532880,scanned_from_block:null}})};return q;}};const r=await processClaimExactPrice1003(sb,job,tx);assert.equal(r.pricedFlows,0);assert.equal(r.stopped,'proof_or_save_failure');});
test('SQL scopes reservation, cooldown, historical protections and no cron activation',()=>{assert.match(sql,/c\.user_id=p_user AND c\.wallet_id=p_wallet AND c\.tx_hash=p_tx/);assert.match(sql,/price_auto_attempted_at<now\(\)-interval '24 hours'/);assert.match(sql,/d\.price_auto_attempted_at IS NULL/);assert.match(sql,/c\.audit_classification IS NULL/);assert.match(sql,/c\.status IN \('pending','ownership_verified','unassigned_miner'\)/);assert.match(sql,/TO service_role/);assert.doesNotMatch(sql,/cron\.alter_job|cron\.schedule/);});
