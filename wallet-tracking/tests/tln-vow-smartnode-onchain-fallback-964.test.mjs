import assert from 'node:assert/strict';
import fs from 'node:fs';
const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const browser=fs.readFileSync(new URL('../projects/tln-vow/tln-vow-discovery.js',import.meta.url),'utf8');
for(const sig of ['referrerOf(address)','getReferrer(address)','referrer(address)',
  'referrers(address)','sponsorOf(address)','sponsor(address)',
  'upline(address)','parent(address)','inviter(address)']){
  assert.ok(edge.includes(sig));assert.ok(browser.includes(sig));
}
assert.ok(edge.includes("verificationCore.keccakSelector('join(address)')"));
assert.ok(edge.includes("verificationCore.keccakSelector('nodeIdOf(address)')"));
assert.ok(edge.includes("method:'POST'"));
assert.ok(edge.includes('for(let page=0;page<10;page++)'));
assert.ok(edge.includes('const deadline=Date.now()+16000'));
assert.ok(edge.includes('onchainSmartNodeParent(cursor,deadline)'));
assert.ok(edge.includes("reason:'incomplete_join_pagination'"));
assert.ok(edge.includes("reason:'identity_getter_unavailable'"));
assert.ok(edge.includes('referralMintPathVerifiedCount:'));
console.log('9.64 bounded manual SmartNode getter/join and identity fallback integrated');
