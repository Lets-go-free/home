import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const sql=fs.readFileSync(new URL('../supabase/migrations/20261123074334_tln_vow_daily_all_rewards_preview_disabled_977.sql',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(edge,/mode==='daily-all-rewards-preview'/);
assert.match(edge,/body\?\.commit===true/);
assert.match(edge,/JSON\.stringify\(\{mode:check\.mode,commit:false\}\)/);
assert.match(edge,/canEnableWritingCron:false/);
assert.match(sql,/'tln-vow-all-rewards-preview-daily'/);
assert.match(sql,/active := false/);
assert.doesNotMatch(sql,/"commit":true/);
assert.match(html,/window\.APP_VERSION="9\.77"/);
const src=edge.replace(/^import\s+\{\s*createClient\s*\}\s+from\s+[^\n]+\n/m,'');
const compiled=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}});
let handler;
let failReceipts=false;
let writeCalls=0;
const db={from(table){
 const query={select(){return this},eq(){return this},order(){return this},range(){
   if(failReceipts && table==='tln_vow_reward_receipt_stage')return Promise.resolve({data:null,error:{message:'missing'}});
   return Promise.resolve({data:[],error:null});
 },upsert(){writeCalls++;throw new Error('WRITE NOT ALLOWED')}};
 return query;
}};
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fake',TLN_REWARD_CRON_SECRET:'demo'};
const context={Request,Response,TextEncoder,TextDecoder,AbortController,console,crypto,setTimeout,clearTimeout,
 Deno:{env:{get(key){return env[key]||''}},serve(fn){handler=fn}},
 createClient(){return db},fetch(){throw new Error('Unexpected RPC')}};
context.globalThis=context;
vm.runInNewContext(compiled.outputText,context,{timeout:6000});
assert.equal(typeof handler,'function');
async function invoke(body){
 const response=await handler(new Request('https://example.supabase.co/functions/v1/tln-vow-reward-refresh',{
   method:'POST',headers:{'x-tln-reward-secret':'demo','Content-Type':'application/json'},body:JSON.stringify(body)}));
 return {code:response.status,data:await response.json()};
}
const happy=await invoke({mode:'daily-all-rewards-preview'});
assert.equal(happy.code,200);
assert.equal(happy.data.ok,true);
assert.equal(happy.data.pathsChecked,4);
assert.equal(happy.data.status,'preview_only');
assert.equal(happy.data.canEnableWritingCron,false);
assert.equal(happy.data.claimsCreated,0);
assert.equal(happy.data.results.length,4);
assert.ok(happy.data.results.every(x=>x.dryRun===true&&x.receiptInventoryComplete===true&&x.eligibleClaims===0));
assert.equal(writeCalls,0);
const forbidden=await invoke({mode:'daily-all-rewards-preview',commit:true});
assert.equal(forbidden.code,400);
assert.equal(forbidden.data.ok,false);
assert.equal(writeCalls,0);
failReceipts=true;
const blocked=await invoke({mode:'daily-all-rewards-preview'});
assert.equal(blocked.code,409);
assert.equal(blocked.data.status,'blocked');
assert.equal(blocked.data.canEnableWritingCron,false);
assert.equal(writeCalls,0);
console.log('9.77 in-process four-finalizer dry-run, write guard, fail-closed tests passed');
