import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
const tables = {user_team_aliases_private: [], security_crypto_tests: []};
const operations=[];
class Query {
  constructor(table,role){this.table=table;this.role=role;this.filters=[];this.op='select';}
  select(){this.op='select';return this;}
  insert(value){this.op='insert';this.value=value;return this;}
  update(value){this.op='update';this.value=value;return this;}
  delete(){this.op='delete';return this;}
  eq(key,value){this.filters.push([key,value]);return this;}
  single(){this.one=true;return this;}
  then(ok,bad){return Promise.resolve().then(()=>{
    if(this.role!=='service') return {error:{message:'permission denied'}};
    operations.push({op:this.op,table:this.table,filters:this.filters,value:this.value});
    assert.ok(this.op==='insert' ? this.value.user_id : this.filters.some(([k])=>k==='user_id'),'Service operation requires user scope');
    const matches=row=>this.filters.every(([k,v])=>row[k]===v);
    let rows=tables[this.table];
    if(this.op==='insert')rows.push({...this.value});
    if(this.op==='update')for(const row of rows.filter(matches))Object.assign(row,this.value);
    if(this.op==='delete')tables[this.table]=rows.filter(row=>!matches(row));
    const result=rows.filter(matches).map(row=>({...row}));
    return {data:this.one?result[0]:result,error:null};
  }).then(ok,bad);}
}
const service={from:t=>new Query(t,'service')};
const userClient={from:t=>new Query(t,'user')};
const sandbox={console:{...console,error:()=>{}},crypto:webcrypto,Response,Request,URL,TextEncoder,TextDecoder,DOMException,AbortController,setTimeout,clearTimeout,atob,btoa,
 Deno:{env:{get:name=>name==='WALLET_ENCRYPTION_MASTER_KEY_V1'?'11'.repeat(32):name==='SUPABASE_URL'?'https://test.invalid':name==='SUPABASE_SERVICE_ROLE_KEY'?'test-service':undefined}},
 withSupabase:(options,handler)=>handler,
 createClient:(url,key,options)=>{assert.equal(key,'test-service');assert.equal(options.auth.persistSession,false);return service;}};
let source=readFileSync(new URL('../supabase/functions/wallet-private/index.ts',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace('export default {','globalThis.endpoint = {');
vm.runInNewContext(stripTypeScriptTypes(source),sandbox);
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
async function call(user,body){const res=await sandbox.endpoint.fetch(new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)}),{supabase:userClient,userClaims:{id:user}});return {status:res.status,data:await res.json()};}
async function good(user,body){let r=await call(user,body);assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.ok,true);return r.data;}
for(const reference of ['id:7205','wallet:0x'+'a'.repeat(40),'dao1:did:21043','aptmdao:did:7315'])await good(A,{action:'team_alias_save',reference,alias:reference+' name',user_id:B});
await good(B,{action:'team_alias_save',reference:'id:7205',alias:'B name'});
let aliases=(await good(A,{action:'team_alias_list'})).aliases;
assert.equal(Object.keys(aliases).length,4);assert.equal((await good(B,{action:'team_alias_list'})).aliases['id:7205'],'B name');
const oldId=tables.user_team_aliases_private.find(r=>r.user_id===A).id;
await good(A,{action:'team_alias_save',reference:'id:7205',alias:'changed'});
assert.equal(tables.user_team_aliases_private.find(r=>r.user_id===A).id,oldId);
assert.equal((await good(A,{action:'team_alias_list'})).aliases['id:7205'],'changed');
await good(A,{action:'team_alias_replace_all',scope:'tln-vow',aliases:{'id:7205':'TLN replacement'}});
aliases=(await good(A,{action:'team_alias_list'})).aliases;
assert.equal(Object.keys(aliases).length,3);assert.ok(aliases['dao1:did:21043']);assert.ok(aliases['aptmdao:did:7315']);
await good(A,{action:'team_alias_replace_all',aliases:{'id:7205':'old client'}});
assert.equal((await good(A,{action:'team_alias_list'})).aliases['id:7205'],'old client');
assert.equal((await call(A,{action:'team_alias_replace_all',scope:'other',aliases:{}})).status,500);
assert.equal((await call(A,{action:'team_alias_replace_all',aliases:{'dao1:did:21043':'bad'}})).status,500);
assert.equal((await call(A,{action:'team_alias_save',reference:'invalid',alias:'bad'})).status,500);
await good(A,{action:'team_alias_save',reference:'dao1:did:21043',alias:''});
assert.equal((await good(A,{action:'team_alias_list'})).aliases['dao1:did:21043'],undefined);
assert.equal((await good(B,{action:'team_alias_list'})).aliases['id:7205'],'B name');
for(const row of tables.user_team_aliases_private){assert.ok(row.alias_ciphertext);assert.ok(row.reference_ciphertext);assert.equal(row.alias,undefined);assert.equal(row.reference,undefined);}
await good(A,{action:'db_self_test',keep:true});await good(B,{action:'db_self_test',keep:true});
assert.equal(tables.security_crypto_tests.length,2);
await good(A,{action:'cleanup_tests',user_id:B});
assert.equal(tables.security_crypto_tests.length,1);assert.equal(tables.security_crypto_tests[0].user_id,B);
await good(A,{action:'db_self_test'});assert.equal(tables.security_crypto_tests.length,1);
assert.equal((await call(null,{action:'team_alias_list'})).status,401);
console.log('PASS: encrypted alias CRUD (TLN, DAO1, APTMDAO), two-user isolation, forged user_id ignored, TLN replacement preserves DAO aliases, legacy client scope, invalid scope/reference, DB roundtrip and scoped cleanup, unauthenticated rejection. '+operations.length+' scoped DB operations.');
const frontend=readFileSync(new URL('../projects/tln-vow/tln-vow-discovery.js',import.meta.url),'utf8');
const ui={console,ethers:{isAddress:a=>/^0x[0-9a-f]{40}$/i.test(a)},norm:a=>String(a||'').toLowerCase(),currentUserId:A,log:()=>{},sb:{functions:{invoke:()=>{throw Error('must not persist before loaded');}}}};
const start=frontend.indexOf('function loadTeamAliases(){'),end=frontend.indexOf('// Phase 5.17: Nach Identity-',start);
vm.runInNewContext('let TEAM_ALIAS_CACHE={"dao1:did:7205":"DAO name","aptmdao:did:7205":"APTMDAO name"};let TEAM_ALIAS_CACHE_LOADED=true;'+frontend.slice(start,end)+';globalThis.aliasFor=teamAliasFor;',ui);
assert.equal(ui.aliasFor('0x'+'b'.repeat(40),{nodeId:'7205'}),'');
const persistStart=frontend.indexOf('async function persistTeamAliasesToSupabase(){');
const persistEnd=frontend.indexOf('\nasync function ',persistStart+1);
const guard={...ui};
vm.runInNewContext('let TEAM_ALIAS_CACHE={};let TEAM_ALIAS_CACHE_LOADED=false;'+frontend.slice(persistStart,persistEnd)+';globalThis.persist=persistTeamAliasesToSupabase;',guard);
assert.equal(await guard.persist(),false);
console.log('PASS: TLN equal-ID DAO namespace isolation and failed-load persistence guard.');
