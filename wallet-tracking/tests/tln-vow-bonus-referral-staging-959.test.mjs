import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('js/tln-reward-verification-core.js',root),'utf8');
const browser=fs.readFileSync(new URL('projects/tln-vow/tln-vow-discovery.js',root),'utf8');
const edge=fs.readFileSync(new URL('supabase/functions/tln-vow-reward-refresh/index.ts',root),'utf8');
const sandbox={};vm.runInNewContext(source,sandbox);
const core=sandbox.WT_TLN_REWARD_VERIFICATION_CORE;
for(const sig of ['claimBonus(address)','claimBonus()']){
  const selector=core.keccakSelector(sig);
  assert.equal(core.manualBonusEvidenceForClaim({selector})?.method,sig);
  assert.equal(core.knownClaimMethodIntent(selector),'bonus');
}
for(const sig of ['claimReferralReward()','claimPartnerReward()']){
  const selector=core.keccakSelector(sig);
  assert.equal(core.manualBonusEvidenceForClaim({selector}),null);
  assert.equal(core.knownClaimMethodIntent(selector),'referral');
}
assert.equal(core.manualBonusEvidenceForClaim({selector:'0x12345678'}),null);
assert.ok(browser.includes('WT_TLN_REWARD_VERIFICATION_CORE?.manualBonusEvidenceForClaim'));
assert.ok(edge.includes('bonusClaimCandidateCount:bonusClaimCandidates.length'));
assert.ok(edge.includes('referralClaimCandidateCount:referralClaimCandidates.length'));
assert.ok(edge.includes('bonusClaimCandidates+=receipts.reduce('));
assert.ok(edge.includes('referralClaimCandidates+=receipts.reduce('));
console.log('9.59 existing bonus selector rule shared; server stages distinct bonus/referral candidates only');
