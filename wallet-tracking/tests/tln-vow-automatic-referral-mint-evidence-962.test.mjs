import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const edge=fs.readFileSync(new URL('supabase/functions/tln-vow-reward-refresh/index.ts',root),'utf8');
for(const addr of ['0xf7d142a354322c7560250caa0e2a06c89649e4c2',
 '0x29280091fa7f3abe4739ad5f1f7c5287feaf7736',
 '0x3dda9ea88136ecede768cd374a2af37219da55e7'])
  assert.ok(edge.includes(addr));
assert.ok(edge.includes('...REFERRAL_MINT_CONTRACTS'));
assert.ok(edge.includes('verificationCore.manualReferralMintVerdict({'));
assert.ok(edge.includes('referralMintTokens:'));
assert.ok(edge.includes('referralPrincipalTransfers:'));
assert.ok(edge.includes('referralStakeEvents:'));
assert.ok(edge.includes('referralMintCandidates,referralMintCandidateCount:referralMintCandidates.length'));
assert.ok(edge.includes('referralMintCandidates+=receipts.reduce('));
assert.ok(edge.includes('referralMintCandidates:evidence.reduce('));
console.log('9.62 exact manual referral token scope and receipt-backed candidate staging wired');
