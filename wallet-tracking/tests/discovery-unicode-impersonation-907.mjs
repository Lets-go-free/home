import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
function extract(start,end){const a=source.indexOf(start);assert.ok(a>=0,start);const b=source.indexOf(end,a+start.length);assert.ok(b>a,end);return source.slice(a,b);}
const refs=extract('// 9.06: chain-specific reference contracts','function discoveryPredefinedIdentityMismatch(f){');
const suspected=extract('function isFindingScamSuspect(f) {','function isFindingScam(f)');
const context={discoveryClaimLinkPhishing:()=>false,isKnownExplorerFraudContract:()=>false,discoveryPredefinedIdentityMismatch:()=>null};
vm.createContext(context);
vm.runInContext(refs+'\n'+suspected+'\nthis.suspect=isFindingScamSuspect;this.mismatch=discoveryReferenceSymbolMismatch;this.normalize=discoveryTickerIdentity;',context);
const fakeAddress='0x724f22f2bf92cbfcb50cc8adc010cdd56fd3a91a';
const base={chain:'bsc',address:fakeAddress,risk:null};
for(const symbol of ['USDT','U឵S឵DΤ','UＳDＴ','UЅDТ','U\u200bSDT']){
  assert.equal(context.normalize(symbol),'USDT',`normalization: ${symbol}`);
  assert.equal(context.suspect({...base,symbol}),true,`must suspect: ${symbol}`);
}
assert.equal(context.mismatch({...base,symbol:'U឵S឵DΤ'}).unicodeImpersonation,true);
assert.equal(context.suspect({...base,symbol:'U឵S឵DΤ',userMarkedScam:true}),false);
assert.equal(context.suspect({...base,symbol:'U឵S឵DΤ',_retainedSpamMarker:true}),false);
assert.equal(context.suspect({...base,symbol:'USDT',address:'0x55d398326f99059ff775485246999027b3197955'}),false);
assert.equal(context.suspect({...base,symbol:'牛来火星'}),false,'unrelated Chinese ticker must not be flagged');
assert.equal(context.suspect({...base,symbol:'BÖRSЕ'}),false,'unrelated non-reference ticker must not be flagged');
assert.match(source,/const symbol=discoveryTickerIdentity\(f\.symbol\)\.toLowerCase\(\), name=discoveryIdentityText\(f\.name\)/);
console.log('9.07 Unicode identity / manual spam priority: passed');
