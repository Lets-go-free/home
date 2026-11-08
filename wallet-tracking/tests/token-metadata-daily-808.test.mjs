import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {stripTypeScriptTypes} from 'node:module';import vm from 'node:vm';
const source=stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/wallet-daily-refresh/index.ts',import.meta.url),'utf8')).replace(/^import .*$/gm,'');
const token='0x'+'a'.repeat(40),owner='0x'+'b'.repeat(40),word=n=>'0x'+BigInt(n).toString(16).padStart(64,'0');
function worker({decimals=6,ok=true}={}){
 const invokes=[],rpcCalls=[];
 const ctx={URL,AbortController,setTimeout,clearTimeout,TextEncoder,TextDecoder,createClient:()=>({functions:{invoke:async(name,p)=>{invokes.push({name,p});return {data:{ok,status:ok?'verified':'conflict',decimals}}}}}),
 Deno:{env:{get:()=>''},serve:()=>{}},fetch:async(url,options)=>{
  if(String(url).includes('/v1/accounts/'))return Response.json({success:true,data:[{balance:0,trc20:[{TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t:'1000000000000000000'}]}]});
  const req=JSON.parse(options.body);const handle=r=>{rpcCalls.push(r);return {jsonrpc:'2.0',id:r.id,result:r.method==='eth_getBalance'?word(0):word(1234567)}};
  return Response.json(Array.isArray(req)?req.map(handle):handle(req));
 },console};vm.createContext(ctx);vm.runInContext(source,ctx);return {ctx,invokes,rpcCalls};
}
test('daily EVM amounts use central metadata for missing custom units; no independent decimals RPC fallback',async()=>{
 const x=worker(),out=[];await x.ctx.readEvmAtUrl({chain_key:'eth',native_symbol:'ETH'},'https://example.test',owner,[{address:token,chain:'eth',label:'Private',symbol:'TEST',decimals:null}],{},out);
 assert.equal(out.find(r=>r.address===token).amount,1.234567);assert.equal(x.invokes.length,1);assert.equal(x.invokes[0].name,'token-metadata');assert.ok(x.rpcCalls.every(r=>r.params?.[0]?.data!=='0x313ce567'));
});
test('daily verified zero units are reused without metadata request; conflicts stop rather than guess',async()=>{
 let x=worker(),out=[];await x.ctx.readEvmAtUrl({chain_key:'eth',native_symbol:'ETH'},'https://example.test',owner,[{address:token,chain:'eth',label:'T',decimals:0}],{},out);assert.equal(out.find(r=>r.address===token).amount,1234567);assert.equal(x.invokes.length,0);
 x=worker({ok:false});await assert.rejects(x.ctx.readEvmAtUrl({chain_key:'eth',native_symbol:'ETH'},'https://example.test',owner,[{address:token,chain:'eth',label:'T',decimals:null}],{},[]),/unavailable/);
});
test('daily Tron uses per-token units instead of universal six; Solana/Tron addresses retain case',async()=>{
 const x=worker({decimals:18}),address='TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',out=[];
 await x.ctx.readTron({chain_key:'tron',native_symbol:'TRX',balance_api_base:'https://example.test'},address,[{address,chain:'tron',symbol:'T',decimals:null}],{},out);assert.equal(out.find(r=>r.address===address).amount,1);
 assert.equal(x.ctx.norm('tron',address),address);const mint='So11111111111111111111111111111111111111112';assert.equal(x.ctx.norm('sol',mint),mint);assert.equal(x.ctx.norm('eth','0x'+'A'.repeat(40)),token);
});
