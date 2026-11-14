import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const raw=readFileSync(new URL('../supabase/functions/token-risk/index.ts',import.meta.url),'utf8');
const sqlFiles=Object.keys(import.meta.glob?.('../supabase/migrations/*837.sql')||{});
assert.match(raw,/CACHE_SUCCESS_MS=24\*60\*60\*1000/);
assert.match(raw,/GATE_RPC='wallettracking_token_risk_provider_gate'/);
assert.doesNotMatch(raw,/for\(let i=0;i<missing\.length;i\+=3\)/);
const transpiled=ts.transpileModule(raw.replace(/import \{createClient\} from 'npm:@supabase\/supabase-js@\^2';/,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const a='0xed019f84763497417c211107705742bbb061da9b';
async function setup(mode){
 const stored=new Map(); let handler,calls=0,gateCalls=0,cooldown=false;
 const sb={auth:{getUser:async()=>({data:{user:{id:'uid'}}})},
  from:()=>({select:()=>({eq:()=>({in:()=>({gt:async()=>({data:[...stored.values()],error:null})})})}),upsert:async vals=>{for(const v of vals)stored.set(v.address,v);return {error:null}}}),
  rpc:async(_name,args)=>{gateCalls++;if(args.p_cooldown_seconds){cooldown=true;return {data:'cooldown',error:null}};return {data:cooldown?'cooldown':'allowed',error:null}}
 };
 const fetch=async url=>{
  if(url.includes('gopluslabs')){calls++;return Response.json(mode==='limit'?{code:4029,message:'limited'}:{code:1,result:{[a]:{is_open_source:'0'}}});}
  return new Response('',{status:403});
 };
 const context={Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://example.supabase.co':'service'},serve:f=>{handler=f}},createClient:()=>sb,AbortController,setTimeout,clearTimeout,fetch,Response,console,URL};
 vm.runInNewContext(transpiled,context);
 async function call(){const req=new Request('https://example.com',{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json'},body:JSON.stringify({chain:'bsc',addresses:[a]})});const res=await handler(req);return {status:res.status,data:await res.json()}};
 return {call,calls:()=>calls,gateCalls:()=>gateCalls};
}
let run=await setup('success');let first=await run.call();
assert.equal(first.status,200);assert.equal(first.data.results[a].checked,true);assert.ok(first.data.results[a].flags.includes('GoPlus: Contract nicht verifiziert'));
let second=await run.call();assert.equal(second.data.results[a].cacheStatus,'hit');assert.equal(run.calls(),1);assert.equal(run.gateCalls(),1);
run=await setup('limit');first=await run.call();assert.equal(first.data.results[a].checked,false);assert.equal(first.data.results[a].providerStatus,'api-code-4029');
second=await run.call();assert.equal(second.data.results[a].providerStatus,'api-code-4029-cooldown');assert.equal(run.calls(),1);
console.log('8.37: 24h Cache-Hit, GoPlus-4029-Cooldown und Fail-Closed bestanden');
