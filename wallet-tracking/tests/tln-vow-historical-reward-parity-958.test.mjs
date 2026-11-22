import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const dir=new URL('../',import.meta.url);
const coreSource=fs.readFileSync(new URL('js/tln-reward-verification-core.js',dir),'utf8');
const edge=fs.readFileSync(new URL('supabase/functions/tln-vow-reward-refresh/index.ts',dir),'utf8');
const browser=fs.readFileSync(new URL('projects/tln-vow/tln-vow-discovery.js',dir),'utf8');
const sandbox={};vm.runInNewContext(coreSource,sandbox);
const core=sandbox.WT_TLN_REWARD_VERIFICATION_CORE;
const hash=n=>'0x'+n.repeat(64),wallet='0x'+'a'.repeat(40),token='0x'+'b'.repeat(40),zero='0x'+'0'.repeat(40);
const lot={stakeTx:hash('1'),stakeTime:'2024-12-14T00:00:00Z',stakeBlockHex:'0x10',
  topUps:[{tx:hash('2'),evidence:'onchain_same_wallet_position_state',storageProof:{proven:true}}],
  rewardClaims:[]};
const rewards=[{hash:hash('1'),token,amount:250,from:zero,to:wallet,rewardProof:'receipt',rewardFlowEvidence:'zero-mint'},
  {hash:hash('2'),token,amount:5500,from:zero,to:wallet,rewardProof:'receipt',rewardFlowEvidence:'zero-mint'}];
assert.equal(core.verifiedStakeTxRewardClaims([lot],rewards,wallet).length,1);
assert.equal(core.verifiedTopUpMintCandidates([lot],rewards,wallet).length,1);
assert.equal(core.verifiedTopUpMintCandidates([lot],[{...rewards[1],rewardProof:null}],wallet).length,0);
assert.equal(core.verifiedTopUpMintCandidates([lot,lot],rewards,wallet).length,0,'ambiguous position ownership rejected');
assert.ok(browser.includes('verifiedStakeTxRewardClaims('));
assert.ok(browser.includes('verifiedTopUpMintCandidates('));
assert.ok(edge.includes("mode==='historical-manual-reward-parity'"));
assert.ok(edge.includes('verificationCore.verifiedStakeTxRewardClaims(lots,proven,wallet)'));
assert.ok(edge.includes('verificationCore.verifiedTopUpMintCandidates(lots,proven,wallet)'));
assert.ok(edge.includes('independentReceiptVerificationPerformed:false'));
console.log('9.58 historical stake/top-up reward parity uses existing manual rules, rejects unproven/ambiguous mints');
