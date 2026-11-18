import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
const src=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const a=src.indexOf('function discoveryClaimLinkPhishing(f){'),b=src.indexOf('// Alchemy Token API:',a);
assert.ok(a>=0&&b>a);
const ctx={};vm.createContext(ctx);vm.runInContext(src.slice(a,b)+'\nthis.detect=discoveryClaimLinkPhishing',ctx);
for(const symbol of ['ACCESS [AAVE.MOBI] TO CLAIM YOUR TOKENS','ACCESS [LIDO.DOG] TO CLAIM','Check/claim: pepevip.art','ACCESS [PENDLE.UNO] TO CLAIM AIRDROP','ACCESS [AAVE.\u200BMOBI] TO CLAIM']){
 assert.equal(ctx.detect({symbol,name:'! AAVE',risk:null}),true,symbol)
}
assert.equal(ctx.detect({symbol:'Token',name:'Airdrop Announcement'}),false);
assert.equal(ctx.detect({symbol:'München Token',name:'Beispiel'}),false);
assert.equal(ctx.detect({symbol:'ACCESS [PENDLE.UNO] TO CLAIM',userMarkedScam:true}),true,'classifier is pure; manual precedence enforced by caller');
assert.match(src,/if\(f\?\.userMarkedScam\|\|f\?\._retainedSpamMarker\)return false/);
console.log('9.09 phishing normalization + existing cache and mark priority: passed');
