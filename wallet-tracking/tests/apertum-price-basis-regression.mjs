import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const src=fs.readFileSync('js/app.js','utf8');
const a='0x'+'a'.repeat(40),u='0x'+'b'.repeat(40),x='0x'+'c'.repeat(40),y='0x'+'d'.repeat(40),ref='0x'+'1'.repeat(40),direct='0x'+'2'.repeat(40),via='0x'+'3'.repeat(40);
function extract(name){let start=src.indexOf('async function '+name+'(');if(start<0)start=src.indexOf('function '+name+'(');let next=src.slice(start+1).search(/\n(?:async )?function |\nconst COINGECKO/);return src.slice(start,start+1+next);}
for(const mode of ['loadApertumCurrentPricesLegacy','loadApertumCurrentPrices']){
 const c=vm.createContext({console,Date,Map,Set,Number,String,window:{DAO1Project:{getAptmUsdtPairAddress:()=>ref}},nativePrices:{},tokenPrices:{},SAFE_ADDRESSES:{apertum:[a,u,x,y]},customSafeTokens:[],predefinedTokenLabels:{['apertum|'+a]:'wAPTM',['apertum|'+u]:'wUSDT'},predefinedTokenSymbols:{},predefinedTokenDecimals:{},ethers:{isAddress:s=>/^0x[0-9a-f]{40}$/i.test(s)},normalizeAddress:s=>String(s||'').toLowerCase(),taxPredefinedBySymbol:(chain,s)=>s==='WAPTM'?{address:a}:s==='WUSDT'?{address:u}:null,taxTokenDecimalsCurrent:async()=>18,predefinedTokenTicker:(chain,addr)=>({[a]:'WAPTM',[u]:'WUSDT',[x]:'X',[y]:'Y'})[addr],taxDexFactory:async()=>ref});
 const leg=(base,quote)=>base===a&&quote===u?{price:2,pair:ref,quoteReserve:100}:base===x&&quote===u?{price:3,pair:direct,quoteReserve:200}:base===y&&quote===a?{price:4,pair:via,quoteReserve:200}:null;
 c.apertumCurrentDirectPrice=async(b,q)=>leg(b,q);
 c.apertumCurrentPairLookupBatch=async()=>new Map([[cKey(a,u),ref],[cKey(x,u),direct],[cKey(y,a),via]]);
 c.apertumCurrentPairStatesBatch=async()=>new Map([[ref,{}],[direct,{}],[via,{}]]);
 c.apertumCurrentLegFromState=(b,q)=>leg(b,q);
 vm.runInContext(extract('apertumCurrentValuationBasis')+extract('apertumCurrentPairKey')+extract(mode),c);
 assert.equal(await c[mode](),true);
 for(const p of [c.nativePrices.apertum,c.tokenPrices['apertum|'+a]]){assert.equal(p.valuationBasis.base,a);assert.equal(p.valuationBasis.quote,u);assert.equal(p.valuationBasis.pools[0].address,ref);}
 assert.equal(c.tokenPrices['apertum|'+u].valuationBasis.type,'fixed');
 assert.deepEqual(JSON.parse(JSON.stringify(c.tokenPrices['apertum|'+x].valuationBasis.pools)),[{address:direct,type:'v2'}]);
 assert.deepEqual(JSON.parse(JSON.stringify(c.tokenPrices['apertum|'+y].valuationBasis.pools)),[{address:via,type:'v2'},{address:ref,type:'v2'}]);
 vm.runInContext(fs.readFileSync('js/current-price-comparison.js','utf8'),c);
 assert.equal(c.window.CurrentPriceComparison.basisFor('apertum','native',c.nativePrices.apertum,{}).base,a,'no symbol lookup needed');
 assert.equal(JSON.parse(JSON.stringify(c.nativePrices.apertum)).valuationBasis.pools[0].address,ref);
}
function cKey(a,b){return [a,b].sort().join('|');}
console.log('PASS both Apertum price builders: native/wrapped, fixed, direct and two-hop bases with label-only metadata; comparison and snapshot preserve route');
