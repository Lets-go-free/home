import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const code=stripTypeScriptTypes(readFileSync(new URL('supabase/functions/token-metadata/index.ts',root),'utf8')).replace(/^import .*$/gm,'');
const providers=stripTypeScriptTypes(readFileSync(new URL('supabase/functions/token-metadata/metadata.ts',root),'utf8')).replaceAll('export ','');
const sqlName=readdirSync(new URL('supabase/migrations/',root)).find(n=>n.endsWith('_arbitrum_token_metadata_alias_832.sql'));
const sql=readFileSync(new URL('supabase/migrations/'+sqlName,root),'utf8');
test('arbitrum keeps its token key but uses registered arb configuration and EVM chain 42161',async()=>{
 const queries=[],writes=[],requests=[];let handler;
 const sb={auth:{getUser:async()=>({data:{user:{id:'test-admin'}}})},from:(name)=>({
  select(){return this},eq(field,value){queries.push([name,field,value]);return this},ilike(){return this},limit:async()=>({data:[]}),
  maybeSingle:async()=>({data:name==='chains'?{chain_key:'arb',wallet_type:'evm',native_symbol:'ETH',evm_chain_id:42161,rpc_url:'https://example.test/arbitrum',archive_rpc_url:null}:name==='admins'?{user_id:'test-admin'}:null})
 }),rpc:async(name,args)=>{
  if(name==='wallettracking_get_token_metadata')return {data:null};
  if(name==='wallettracking_record_token_metadata'){writes.push(args);return {data:{...args.p_observation,chain:args.p_chain,address:args.p_address}};}
  throw Error('Unexpected RPC '+name);
 }};
 const ctx={URL,Request,Response,TextDecoder,Uint8Array,AbortController,setTimeout,clearTimeout,
  createClient:()=>sb,Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://example.test':k==='SUPABASE_SERVICE_ROLE_KEY'?'secret':''},serve:f=>{handler=f}},
  fetch:async(u,options)=>{const b=JSON.parse(options.body);requests.push(b);return Response.json({id:808,jsonrpc:'2.0',result:b.method==='eth_chainId'?'0xa4b1':b.params?.[0]?.data==='0x313ce567'?'0x'+(18).toString(16).padStart(64,'0'):'0x'});}};
 vm.createContext(ctx);vm.runInContext(providers,ctx);vm.runInContext(code,ctx);
 const address='0x82af49447d8a07e3bd95bd0d56f35241523fbab1';
 const res=await handler(new Request('https://example.test',{method:'POST',headers:{authorization:'Bearer secret','content-type':'application/json'},body:JSON.stringify({mode:'resolve',chain:'arbitrum',address,refresh:true})}));
 const out=await res.json();assert.equal(out.status,'verified');assert.equal(out.decimals,18);
 assert.ok(queries.some(x=>x[0]==='chains'&&x[1]==='chain_key'&&x[2]==='arb'));
 assert.ok(queries.some(x=>x[0]==='predefined_tokens'&&x[1]==='chain'&&x[2]==='arbitrum'));
 assert.ok(writes.some(x=>x.p_chain==='arbitrum'));
 assert.ok(requests.some(x=>x.method==='eth_chainId'));
});
test('SQL normalizer supports arbitrum alias without renaming existing rows',()=>{
 assert.match(sql,/WHEN p_chain='arbitrum' THEN 'arb'/);
 assert.doesNotMatch(sql,/UPDATE\s+public\.predefined_tokens/i);
 assert.doesNotMatch(sql,/UPDATE\s+public\.chains/i);
});
