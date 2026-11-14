import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const raw=readFileSync(new URL('../supabase/functions/token-risk/index.ts',import.meta.url),'utf8');
assert.match(raw,/const missing=addresses\.filter\(a=>!security\[a\]\)/);
assert.match(raw,/for\(let i=0;i<missing\.length;i\+=3\)/);
assert.match(raw,/String\(payload\?\.code\)!=='1'/);
const code=ts.transpileModule(raw.replace(/import \{createClient\} from 'npm:@supabase\/supabase-js@\^2';/,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const a='0x2ca0ce162ae5ca5fc1c735772b71b9cedcfd4681';
const b='0xed019f84763497417c211107705742bbb061da9b';
async function run(kind){
 let handler,calls=[];
 const fetch=async url=>{
  const q=new URL(url).searchParams.get('contract_addresses');
  if(url.includes('gopluslabs')){
   calls.push(q);
   let result={};
   if(q.includes(','))result={[a]:{is_open_source:'0'}};
   else if(q===b&&kind==='available')result={[b]:{is_open_source:'0',token_name:'Binance-Peg BSC-USD'}};
   else if(q===a)result={[a]:{is_open_source:'0'}};
   return Response.json({code:1,message:'OK',result});
  }
  return new Response('no explorer', {status:403});
 };
 const context={Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://example.supabase.co':'service'},serve:h=>{handler=h}},createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'test'}}})}}),AbortController,setTimeout,clearTimeout,fetch,Response,console,URL};
 vm.runInNewContext(code,context);
 const req=new Request('https://example.org',{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json'},body:JSON.stringify({chain:'bsc',addresses:[a,b]})});
 const res=await handler(req);assert.equal(res.status,200);
 return {data:await res.json(),calls};
}
const ok=await run('available');
assert.deepEqual(ok.calls,[`${a},${b}`,b]);
assert.equal(ok.data.results[b].checked,true);
assert.ok(ok.data.results[b].flags.includes('GoPlus: Contract nicht verifiziert'));
const unavailable=await run('unavailable');
assert.equal(unavailable.data.results[b].checked,false);
assert.equal(unavailable.data.results[b].reason,'GoPlus nicht verfügbar');
assert.equal(unavailable.data.results[a].checked,true);
console.log('8.35: GoPlus-Batch-Teilantwort und fehlgeschlagener Einzel-Fallback bestanden');
