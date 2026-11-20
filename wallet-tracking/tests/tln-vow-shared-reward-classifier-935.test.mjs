import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../js/tln-reward-verification-core.js',import.meta.url),'utf8');
const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const browser=fs.readFileSync(new URL('../projects/tln-vow/tln-vow-discovery.js',import.meta.url),'utf8');
const context={};vm.runInNewContext(source,context);
const decide=context.WT_TLN_REWARD_VERIFICATION_CORE.classifyRewardTransferFlow;
assert.equal(typeof decide,'function');
assert.ok(edge.includes('function classifyRewardTransferFlow(input)'),'Edge must bundle exact shared code');
assert.ok(browser.includes('core.classifyRewardTransferFlow({wallet:w,callTo,transfers,lifecycle,'),
  'Manual Step 4 must call shared decision core');
const w='0x'+'a'.repeat(40),s='0x'+'b'.repeat(40),t='0x'+'c'.repeat(40),z='0x'+'0'.repeat(40);
const transfer=(from,to,token=t)=>({from,to,token,amountRaw:100n});
const classify=(transfers,extra={})=>decide({wallet:w,callTo:s,transfers,...extra});
assert.equal(classify([transfer(s,w)]).kind,'incoming_unproven');
assert.equal(classify([transfer(s,w)]).payoutTransfers.length,0);
assert.equal(classify([transfer(s,w)],{explicitRewardIntent:true}).payoutTransfers[0].rewardProof,'explicit_claim_method');
assert.equal(classify([transfer(s,w)],{stateDeltaEvidence:[{sig:'earned(address)'}]}).payoutTransfers[0].rewardProof,'reward_state_delta');
assert.equal(classify([transfer(z,w)]).payoutTransfers[0].rewardProof,'mint');
assert.equal(classify([transfer(z,w)],{bridge:true}).kind,'bridge_ignored');
assert.equal(classify([transfer(s,w)],{lifecycle:true,explicitRewardIntent:true}).kind,'lifecycle');
assert.equal(classify([transfer(s,w),transfer(w,s,'0x'+'d'.repeat(40))]).kind,'exchange_or_liquidity');
assert.equal(classify([transfer(s,w),transfer(w,s,'0x'+'d'.repeat(40))],{explicitRewardIntent:true}).kind,'reward_candidate');
assert.equal(classify([transfer('0x'+'e'.repeat(40),w)],{explicitRewardIntent:true}).payoutTransfers.length,0);
assert.equal(classify([transfer('0x'+'e'.repeat(40),w)],{explicitRewardIntent:true,traceSources:['0x'+'e'.repeat(40)]}).payoutTransfers.length,1);
console.log('Shared reward flow 9.35: browser/Edge embedding and ten conservative decision cases OK');
