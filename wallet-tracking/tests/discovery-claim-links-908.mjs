import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
function extract(start,end){const a=source.indexOf(start);assert.ok(a>=0,start);const b=source.indexOf(end,a+start.length);assert.ok(b>a,end);return source.slice(a,b);}
const helper=extract('function discoveryClaimLinkPhishing(f){','// Alchemy Token API:');
const suspect=extract('function isFindingScamSuspect(f) {','function isFindingScam(f)');
const ctx={discoveryReferenceSymbolMismatch:()=>null,isKnownExplorerFraudContract:()=>false,discoveryPredefinedIdentityMismatch:()=>null};
vm.createContext(ctx);vm.runInContext(helper+'\n'+suspect+'\nthis.check=discoveryClaimLinkPhishing;this.suspect=isFindingScamSuspect;',ctx);
for(const name of ['ACCESS [AAVE.MOBI] TO CLAIM YOUR TOKENS','ACCESS [LIDO.DOG] TO CLAIM','Check/claim: pepevip.art','ACCESS [PENDLE.UNO] TO CLAIM AIRDROP','Connect wallet at claim-now.xyz']) {
  assert.equal(ctx.check({name}),true,`phishing: ${name}`);
  assert.equal(ctx.suspect({name,risk:null,nameScamFlag:false}),true,`cached name must be checked: ${name}`);
}
for(const name of ['Claim Rewards','Airdrop Announcement','Legitimate Rewards','München Token','Bull Claim DAO','USDT'])assert.equal(ctx.check({name}),false,`benign: ${name}`);
assert.equal(ctx.suspect({name:'ACCESS [LIDO.DOG] TO CLAIM',userMarkedScam:true}),false);
assert.equal(ctx.suspect({name:'Check/claim: pepevip.art',_retainedSpamMarker:true}),false);
assert.match(source,/Offenen Spam-Verdacht ausblenden/);
assert.match(source,/Bereits als Spam markierte ausblenden/);
assert.match(source,/\(Bestand &gt; 1 USD\)/);
console.log('9.08 claim-link + cached entries + user-mark priority + UI labels: passed');
