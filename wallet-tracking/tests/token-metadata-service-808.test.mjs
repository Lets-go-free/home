import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {stripTypeScriptTypes} from 'node:module';import vm from 'node:vm';
const root=new URL('../',import.meta.url),code=stripTypeScriptTypes(readFileSync(new URL('supabase/functions/token-metadata/index.ts',root),'utf8')).replace(/^import .*$/gm,'');
const provider=stripTypeScriptTypes(readFileSync(new URL('supabase/functions/token-metadata/metadata.ts',root),'utf8')).replaceAll('export ','');
const token='0x'+'a'.repeat(40),user='00000000-0000-0000-0000-000000000001';
function setup({admin=true,master=[],existing=[],decimals=6,fail=false,batch=[],chainConfig={},alchemy=''}={}){
 const cache=new Map(existing.map(x=>[x.chain+'|'+x.address,x])),calls={providers:0,writes:[],auth:0,batches:[],tags:[]};let handler;
 const sb={auth:{getUser:async jwt=>{calls.auth++;return jwt==='good'?{data:{user:{id:user}}}:{error:{message:'invalid'}}}},
 from:table=>{const query={select(){return this},eq(){return this},ilike(){return this},limit:async()=>({data:master}),maybeSingle:async()=>({data:table==='chains'?{chain_key:'eth',wallet_type:'evm',native_symbol:'ETH',evm_chain_id:1,rpc_url:'https://example.test',...chainConfig}:admin?{user_id:user}:null})};return query},
 rpc:async(name,p)=>{
 const key=p.p_chain+'|'+p.p_address;
 if(name==='wallettracking_get_token_metadata')return {data:cache.get(key)||null};
 if(name==='wallettracking_record_token_metadata'){calls.writes.push(p);const o=p.p_observation;const old=cache.get(key);const row={...o,chain:p.p_chain,address:p.p_address,checked_at:new Date().toISOString()};if(old?.status==='verified'&&o.status==='unavailable')return {data:{...old,refreshFailed:true}};cache.set(key,row);return {data:row}}
 if(name==='wallettracking_token_metadata_batch'){calls.batches.push(p);return {data:batch.filter(x=>x.key>p.p_after).slice(0,13)}}throw Error(name);
 }};
 const ctx={URL,Response,Request,TextDecoder,Uint8Array,AbortController,setTimeout,clearTimeout,createClient:()=>sb,
 Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://project.test':k==='SUPABASE_SERVICE_ROLE_KEY'?'service-key':k==='ALCHEMY_API_KEY'?alchemy:''},serve:fn=>{handler=fn}},
 fetch:async(url,options)=>{calls.providers++;if(fail)throw Error('https://private.test/rpc?credential=secret');const b=JSON.parse(options.body);if(b.method==='getAccountInfo')return Response.json({jsonrpc:'2.0',id:808,result:{value:{owner:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',executable:false,data:{parsed:{type:'mint',info:{decimals:9,isInitialized:true}}}}}});let result=b.method==='eth_chainId'?'0x1':b.params[0].data==='0x313ce567'?'0x'+BigInt(decimals).toString(16).padStart(64,'0'):'0x';if(b.method==='eth_call')calls.tags.push(b.params[1]);return Response.json({jsonrpc:'2.0',id:808,result})}};
 vm.createContext(ctx);vm.runInContext(provider,ctx);vm.runInContext(code,ctx);
 const request=async(body,auth='good',method='POST')=>{const headers={'content-type':'application/json'};if(auth)headers.authorization='Bearer '+auth;const response=await handler(new Request('https://function.test',{method,headers,...(method==='POST'?{body:JSON.stringify(body)}:{})}));return {status:response.status,data:method==='OPTIONS'?null:await response.json(),response}};
 return {request,calls,cache};
}
test('metadata HTTP handler requires real user JWT, rejects arbitrary modes and non-POST; handles CORS preflight',async()=>{
 const x=setup();for(const auth of ['', 'bad'])assert.equal((await x.request({mode:'resolve',chain:'eth',address:token},auth)).status,401);
 assert.equal((await x.request({mode:'arbitrary'})).status,400);assert.equal((await x.request({},'good','GET')).status,405);const preflight=await x.request({},'', 'OPTIONS');assert.equal(preflight.status,204);assert.equal(preflight.response.headers.get('access-control-allow-origin'),'*');assert.equal(x.calls.providers,0);
});
test('new custom token fills global technical cache without global token/list insertion; second lookup makes no provider calls',async()=>{
 const x=setup();let r=await x.request({mode:'resolve',chain:'eth',address:token,decimals:18,source:'hostile',user_id:'other'});assert.equal(r.data.decimals,6);assert.equal(r.data.source,'evm-decimals-call');assert.equal(r.data.ok,true);assert.equal(x.calls.writes.length,1);
 const before=x.calls.providers;r=await x.request({mode:'resolve',chain:'eth',address:token});assert.equal(r.data.cached,true);assert.equal(x.calls.providers,before);assert.equal(x.calls.writes[0].p_observation.decimals,6);
});
test('valid existing master zero is reused without network, conflicts never reach provider or conversions',async()=>{
 let x=setup({master:[{decimals:0,decimals_status:'unverified'}]});let r=await x.request({mode:'resolve',chain:'eth',address:token});assert.equal(r.data.decimals,0);assert.equal(x.calls.providers,0);
 x=setup({master:[{decimals:18,decimals_status:'conflict'}]});r=await x.request({mode:'resolve',chain:'eth',address:token});assert.equal(r.data.ok,false);assert.equal(r.data.status,'conflict');assert.equal(r.data.decimals,null);assert.equal(x.calls.providers,0);
});
test('master/cache mismatch records a protected observation rather than trusting caller-supplied precision',async()=>{
 const x=setup({master:[{decimals:18}],existing:[{chain:'eth',address:token,decimals:6,status:'verified',source:'evm-decimals-call',kind:'erc20'}]});await x.request({mode:'resolve',chain:'eth',address:token});assert.equal(x.calls.providers,0);assert.equal(x.calls.writes.length,1);assert.equal(x.calls.writes[0].p_observation.decimals,6);
});
test('catalog refresh requires admin; own refresh is user-scoped; service secret cannot enumerate private catalogs',async()=>{
 const x=setup({admin:false});assert.equal((await x.request({mode:'refresh-catalog'})).status,403);assert.equal(x.calls.batches.length,0);
 let r=await x.request({mode:'refresh-own',user_id:'other'});assert.equal(r.status,200);assert.equal(x.calls.batches[0].p_user,user);assert.equal(x.calls.batches[0].p_own_only,true);
 assert.equal((await x.request({mode:'refresh-catalog'},'service-key')).status,403);
});
test('bounded catalog checks 12 tokens with continuation and cache-safe private values',async()=>{
 const batch=Array.from({length:15},(_,i)=>({chain:'eth',address:'0x'+(i+1).toString(16).padStart(40,'0'),key:'eth|0x'+(i+1).toString(16).padStart(40,'0')}));
 const x=setup({batch});let r=await x.request({mode:'refresh-catalog'});assert.equal(r.data.checked,12);assert.equal(r.data.nextAfter,batch[11].key);
 r=await x.request({mode:'refresh-catalog',after:r.data.nextAfter});assert.equal(r.data.checked,3);assert.equal(r.data.nextAfter,null);
});
test('only trusted service calls can choose a historical block; normal clients cannot manufacture a block proof',async()=>{
 let x=setup();await x.request({mode:'resolve',chain:'eth',address:token,block:123});assert.ok(x.calls.tags.every(t=>t==='latest'));
 x=setup();await x.request({mode:'resolve',chain:'eth',address:token,block:123},'service-key');assert.ok(x.calls.tags.every(t=>t==='0x7b'));assert.equal(x.calls.auth,0);
});
test('provider outages remain explicit unavailable, do not disclose credentials or assume 18; immediate retry is bounded',async()=>{
 const x=setup({fail:true});let r=await x.request({mode:'resolve',chain:'eth',address:token});assert.equal(r.data.status,'unavailable');assert.equal(r.data.ok,false);assert.equal(r.data.decimals,null);assert.doesNotMatch(JSON.stringify(r.data),/credential|secret|https:/);
 const n=x.calls.providers;r=await x.request({mode:'resolve',chain:'eth',address:token});assert.equal(x.calls.providers,n);assert.equal(r.data.cached,true);
});
test('personal display preferences override global formatting without affecting technical units, including zero and reset',()=>{
 const app=readFileSync(new URL('js/app.js',root),'utf8'),part=app.slice(app.indexOf('function tokenDisplayMeta('),app.indexOf('window.WalletTokenFormat',app.indexOf('function tokenDisplayMeta(')));
 const key='eth|'+token,ctx={customSafeTokens:[{chain:'eth',address:token,displayDecimals:3,summaryDecimals:null,technicalDecimals:18}],normalizeAddress:a=>a.toLowerCase(),predefinedTokenDisplayDecimals:{[key]:6},predefinedTokenSummaryDecimals:{[key]:2},predefinedTokenDisplayByChainSymbol:{}};
 vm.createContext(ctx);vm.runInContext(part,ctx);assert.equal(ctx.tokenDisplayDigits({chain:'eth',address:token}),3);assert.equal(ctx.tokenDisplayDigits({chain:'eth',address:token},true),3);
 ctx.customSafeTokens[0].displayDecimals=0;ctx.customSafeTokens[0].summaryDecimals=1;assert.equal(ctx.tokenDisplayDigits({chain:'eth',address:token}),0);assert.equal(ctx.tokenDisplayDigits({chain:'eth',address:token},true),1);
 ctx.customSafeTokens[0].displayDecimals=null;ctx.customSafeTokens[0].summaryDecimals=null;assert.equal(ctx.tokenDisplayDigits({chain:'eth',address:token}),6);assert.equal(ctx.tokenDisplayDigits({chain:'eth',address:token},true),2);assert.equal(ctx.customSafeTokens[0].technicalDecimals,18);
});

test('Solana uses the configured Alchemy endpoint when generic rpc_url is absent',async()=>{
 const x=setup({chainConfig:{chain_key:'sol',wallet_type:'sol',native_symbol:'SOL',rpc_url:null,archive_rpc_url:'https://solana-mainnet.g.alchemy.com/v2',archive_rpc_provider:'alchemy'},alchemy:'test-only-key'});
 const r=await x.request({mode:'resolve',chain:'sol',address:'So11111111111111111111111111111111111111112'});assert.equal(r.data.status,'verified');assert.equal(r.data.decimals,9);assert.equal(r.data.source,'solana-mint-account');assert.equal(x.calls.providers,1);
});
test('browser balance conversion resolves units for positive holdings, leaves zero holdings alone and excludes proven pools',async()=>{
 const app=readFileSync(new URL('js/app.js',root),'utf8'),start=app.indexOf('async function fetchKnownTokenBalances('),part=app.slice(start,app.indexOf('async function fetchEvmAddressInfo(',start));let metadataCalls=0;
 const owner='0x'+'b'.repeat(40),word=n=>'0x'+BigInt(n).toString(16).padStart(64,'0');let raw=word(0);
 const ctx={SAFE_ADDRESSES:{eth:[token]},customSafeTokens:[],predefinedTokenDecimalStatuses:{},evmRpcBatch:async()=>[raw],
  fetchEvmTokenMetadata:async()=>{metadataCalls++;return {[token]:{decimals:6,symbol:'TEST'}}},resolveTokenTechnicalMetadata:async()=>({status:'not_applicable',decimals:null})};
 vm.createContext(ctx);vm.runInContext(part,ctx);
 assert.equal((await ctx.fetchKnownTokenBalances('https://example.test',owner,'eth')).length,0);assert.equal(metadataCalls,0);
 raw=word(1234567);let rows=await ctx.fetchKnownTokenBalances('https://example.test',owner,'eth');assert.equal(rows[0].amount,1.234567);assert.equal(metadataCalls,1);
 raw='0x';rows=await ctx.fetchKnownTokenBalances('https://example.test',owner,'eth');assert.equal(rows.length,0);
});
test('native master setup uses explicit supported protocol units, leaves unknown future chains unguessed',()=>{
 const app=readFileSync(new URL('js/app.js',root),'utf8'),start=app.indexOf('function inferNativeTechnicalDecimals('),part=app.slice(start,app.indexOf('async function syncNativeAssetForChain',start));const ctx=vm.createContext({});vm.runInContext(part,ctx);
 assert.equal(ctx.inferNativeTechnicalDecimals('akash','akash'),6);assert.equal(ctx.inferNativeTechnicalDecimals('evm','bsc'),18);assert.equal(ctx.inferNativeTechnicalDecimals('evm','future-chain'),null);assert.equal(ctx.inferNativeTechnicalDecimals('sol','bsc'),null);
});
