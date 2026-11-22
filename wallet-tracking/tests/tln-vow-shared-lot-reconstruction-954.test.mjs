import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('js/tln-reward-verification-core.js',root),'utf8');
const browser=fs.readFileSync(new URL('projects/tln-vow/tln-vow-discovery.js',root),'utf8');
const edge=fs.readFileSync(new URL('supabase/functions/tln-vow-reward-refresh/index.ts',root),'utf8');
const sandbox={};vm.runInNewContext(source,sandbox);
const build=sandbox.WT_TLN_REWARD_VERIFICATION_CORE.manualBuildDiagnosticLots;
assert.ok(browser.includes('manualBuildDiagnosticLots'));
assert.ok(edge.includes("mode==='cached-lot-reconstruction-preview'"));
const addr='0x'+'a'.repeat(40),contract='0x'+'b'.repeat(40);
function row(action,hash,block,amount,positionId=null,recipient=contract){
  return {action,t:{hash,blockNum:`0x${block.toString(16)}`,metadata:{blockTimestamp:new Date(block*1000).toISOString()}},
    p:{address:addr,token0:{symbol:'A'},token1:{symbol:'B'}},staking:{contract_address:recipient},
    counterparty:recipient,amount,stake_token_id:positionId};
}
const rows=[row('Stake','a',1,10),row('Stake','b',2,20),row('Unstake','c',3,12)];
const result=build(rows);
assert.equal(result.lots.length,2,'repeated stake without ID must remain parallel');
assert.equal(result.lots[0].status,'closed');
assert.equal(result.lots[1].remaining,18);
assert.equal(result.unmatched.length,0);
const idRows=[row('Stake','d',4,10,'7'),row('Stake','e',5,5,'7')];
const topup=build(idRows);
assert.equal(topup.lots.length,1);
assert.equal(topup.lots[0].remaining,15);
assert.equal(topup.lots[0].topUps.length,1);
const mirror=[row('Stake','f',6,10),row('Unstake','g',7,10),row('Unstake','g',7,10,null,'0x'+'c'.repeat(40))];
const dedup=build(mirror);
assert.equal(dedup.routedDuplicateUnstakes,1);
assert.equal(dedup.lots[0].status,'closed');
assert.equal(dedup.unmatched.length,0);
const manualCore=sandbox.WT_TLN_REWARD_VERIFICATION_CORE;
const original=build([row('Stake','first',11,100),row('Stake','second',12,50)]);
const proof={proven:true,root:3,startOffset:2,timestampContinuity:true};
const saved=[{stakeTx:'first',topUps:[{tx:'second',evidence:'onchain_same_wallet_position_state',storageProof:proof}]}];
const replay=manualCore.manualReplayRecordedTopUps(original.lots,saved);
assert.equal(replay.merged,1);
assert.equal(replay.lots.length,1);
assert.equal(replay.lots[0].original,150);
assert.equal(replay.historicalProofIndependentlyReplayed,false);
const unproven=manualCore.manualReplayRecordedTopUps(build([row('Stake','f',15,20),row('Stake','g',16,10)]).lots,
  [{stakeTx:'f',topUps:[{tx:'g',evidence:'onchain_same_wallet_position_state',storageProof:{proven:false}}]}]);
assert.equal(unproven.merged,0);
assert.equal(unproven.lots.length,2);
console.log('9.54 shared browser/Edge FIFO lots, parallel stakes, explicit-ID top-ups, mirrored exits');
