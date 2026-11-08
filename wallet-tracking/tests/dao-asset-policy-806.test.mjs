import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const policySrc=readFileSync(new URL('../supabase/functions/dao-reward-refresh/asset-policy.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8'),dao=readFileSync(new URL('../projects/dao1/dao1.js',import.meta.url),'utf8');
const WA='0x110ac02ba3384bc055c13a87766049a74517beda',USDT='0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f',USDC='0xd979f41e12a69aa82f04866444ea91e8e8faefd9',FAKE='0x'+'8'.repeat(40);
const c=vm.createContext({});vm.runInContext(policySrc,c);const policy=c.WTDaoAssetPolicy;
test('one immutable contract registry is loaded by browser and worker; symbols are never identities',()=>{
 for(const token of [USDT,USDC]){assert.equal(policy.fixedQuote(token).price,1);assert.equal(policy.asset(token).kind,'stable');}
 assert.equal(policy.asset(WA.toUpperCase()).kind,'aptm');assert.equal(policy.fixedQuote(WA),null);
 for(const v of [FAKE,'wUSDT','__proto__','constructor',''])assert.equal(policy.asset(v),null);
 assert.ok(Object.isFrozen(policy));assert.ok(Object.isFrozen(policy.asset(USDT)));
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(html.indexOf('dao-reward-refresh/asset-policy.js')<html.indexOf('projects/dao1/dao1.js'));
 assert.match(readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8'),/import '\.\/asset-policy\.js'/);
});
test('historical main-page price resolver and LP-underlying valuation use the shared rule',async()=>{
 const ctx={window:{WTDaoAssetPolicy:policy},normalizeAddress:a=>String(a).toLowerCase(),predefinedTokenSymbols:{},predefinedTokenNames:{},predefinedTokenLabels:{},
  taxHistoricalPrice:async()=>({price:2,source:'canonical anchor'}),taxPredefinedBySymbol:()=>null,taxTokenDecimalsCurrent:async()=>18,taxDirectV2Price:async()=>null,
  nativePrices:{apertum:{price:2}},priceForToken:()=>null};vm.createContext(ctx);
 vm.runInContext(app.slice(app.indexOf('async function taxApertumWrappedPrice('),app.indexOf('async function taxHistoricalPrice('))+
  app.slice(app.indexOf('function currentUnderlyingPrice('),app.indexOf('async function loadCustomSafeLpPrices(')),ctx);
 for(const address of [USDT,USDC]){const q=await ctx.taxApertumWrappedPrice('apertum',{address,symbol:'untrusted text'},100000);assert.equal(q.price,1);assert.equal(q.source,policy.fixedQuote(address).source);}
 assert.equal((await ctx.taxApertumWrappedPrice('apertum',{address:WA,symbol:'unknown'},100000)).price,2);
 assert.equal(await ctx.taxApertumWrappedPrice('apertum',{address:FAKE,symbol:'wUSDT'},100000),null);
 assert.equal(ctx.currentUnderlyingPrice('apertum',{address:FAKE,symbol:'wUSDT'}),null);
 assert.equal(ctx.currentUnderlyingPrice('apertum',{address:USDT,symbol:'unknown'}),1);
 assert.equal(ctx.currentUnderlyingPrice('eth',{address:FAKE,symbol:'USDT'}),1);
});
test('DAO historical flow valuation consumes the same policy and does not assign parity by token name',async()=>{
 const ctx={CHAIN_KEY:'apertum',window:{WTDaoAssetPolicy:policy},document:{getElementById:()=>null},
  isNativeAptmAssetFlow:r=>r.token_address==='native',ensurePricesForClaimBlocks:async()=>[],priceForTransaction:async()=>({price:2,source:'canonical anchor'}),
  getContext:()=>({taxHistoricalPrice:async()=>({price:42,source:'actual other-token route'})})};vm.createContext(ctx);
 vm.runInContext(dao.slice(dao.indexOf('  function isAptmPricedAssetFlow('),dao.indexOf('  async function getTokenFlowScanState('))+
  dao.slice(dao.indexOf('  async function valueAssetFlows('),dao.indexOf('  function assetFlowRowFromTransfer(')),ctx);
 const rows=[{token_address:USDT,amount:'1.234567',token_symbol:'unknown'},{token_address:WA,amount:2,token_symbol:'unknown'},
  {token_address:FAKE,amount:3,token_symbol:'wUSDT'}].map(r=>({...r,block_number:16000000,tx_timestamp:'2026-11-08T12:00:00Z'}));await ctx.valueAssetFlows(rows);
 assert.equal(rows[0].price_usd,1);assert.equal(rows[0].price_source,policy.fixedQuote(USDT).source);assert.equal(rows[1].price_usd,2);assert.equal(rows[2].price_usd,42);
});
test('current batch and fallback prices share parity and avoid a false stablecoin symbol',async()=>{
 for(const mode of ['Legacy','']){
  const pair='0x'+'a'.repeat(40),key=(a,b)=>[a,b].sort().join('|');
  const ctx={window:{WTDaoAssetPolicy:policy,DAO1Project:{getAptmUsdtPairAddress:()=>pair}},console,
   taxPredefinedBySymbol:(chain,s)=>s==='WAPTM'?{address:WA}:s==='WUSDT'?{address:USDT}:null,
   normalizeAddress:a=>String(a||'').toLowerCase(),taxTokenDecimalsCurrent:async()=>18,
   SAFE_ADDRESSES:{apertum:[WA,USDT,USDC,FAKE]},customSafeTokens:[],predefinedTokenLabels:{},predefinedTokenSymbols:{},
   predefinedTokenDecimals:{},predefinedTokenTicker:(chain,a)=>a===WA?'wAPTM':a===USDC?'wUSDC':'wUSDT',ethers:{isAddress:a=>/^0x[0-9a-f]{40}$/.test(a)},
   tokenPrices:{},nativePrices:{},apertumCurrentValuationBasis:()=>({type:'path'}),
   apertumCurrentDirectPrice:async(a,b)=>a===WA&&b===USDT?{price:2,pair}:null,
   taxDexFactory:async()=>pair,apertumCurrentPairKey:key,apertumCurrentPairLookupBatch:async()=>new Map([[key(WA,USDT),pair]]),
   apertumCurrentPairStatesBatch:async()=>new Map([[pair,{}]]),apertumCurrentLegFromState:(a,b,d,e,p)=>a===WA&&b===USDT?{price:2,pair:p}:null};
  vm.createContext(ctx);vm.runInContext(app.slice(app.indexOf('async function loadApertumCurrentPricesLegacy('),app.indexOf('function apertumCurrentPairKey(')),ctx);
  vm.runInContext(app.slice(app.indexOf('async function loadApertumCurrentPrices(){'),app.indexOf('const COINGECKO_PLATFORM_BY_CHAIN')),ctx);
  assert.equal(await ctx['loadApertumCurrentPrices'+mode](),true);
  assert.equal(ctx.tokenPrices['apertum|'+USDC].price,1);assert.equal(ctx.tokenPrices['apertum|'+USDC].source,policy.fixedQuote(USDC).source);
  assert.equal(ctx.nativePrices.apertum.price,2);assert.equal(ctx.tokenPrices['apertum|'+FAKE],undefined);
 }
});
