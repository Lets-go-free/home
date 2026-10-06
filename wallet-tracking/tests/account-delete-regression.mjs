import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const source=read('supabase/functions/wallet-private/index.ts').replace(/^import .*\n/gm,'').replace('export default {','globalThis.endpoint = {');
const sandbox={console:{...console,error:()=>{}},crypto:webcrypto,Response,Request,URL,TextEncoder,TextDecoder,DOMException,AbortController,setTimeout,clearTimeout,atob,btoa,Deno:{env:{get:()=>undefined}},withSupabase:(o,h)=>h,createClient:()=>{throw Error('No service client needed');}};
vm.runInNewContext(stripTypeScriptTypes(source),sandbox);
async function edge(options={}){
 const calls=[];
 const client={auth:{getUser:async()=>({data:{user:{id:options.identity??A}},error:options.identityError??null})},rpc:async(name,args)=>{
  calls.push([name,args]);
  if(name==='wallettracking_is_admin')return {data:options.admin??false,error:options.adminError??null};
  assert.equal(name,'wallettracking_delete_own_account');
  assert.deepEqual(JSON.parse(JSON.stringify(args)),{p_confirmation:'KONTO LÖSCHEN'});
  return {data:options.result??{ok:true,user_id:A,auth_account_deleted:true},error:options.deleteError??null};
 }};
 const response=await sandbox.endpoint.fetch(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({action:'account_delete',confirmation:'KONTO LÖSCHEN',user_id:B,...options.body})}),{supabase:client,userClaims:{id:A}});
 return {status:response.status,data:await response.json(),calls};
}
let x=await edge();assert.equal(x.status,200);assert.equal(x.data.result.user_id,A);assert.equal(x.calls.length,2);
x=await edge({admin:true});assert.equal(x.status,403);assert.equal(x.calls.length,1);
x=await edge({adminError:{message:'RPC unavailable'}});assert.equal(x.status,500);assert.equal(x.calls.length,1);
x=await edge({identity:B});assert.equal(x.status,401);assert.equal(x.calls.length,0);
x=await edge({body:{confirmation:'LÖSCHEN'}});assert.equal(x.status,400);assert.equal(x.calls.length,0);
x=await edge({body:{expected_user_id:B}});assert.equal(x.status,409);assert.equal(x.calls.length,0);
x=await edge({deleteError:{message:'Admin-Konten können nicht gelöscht werden.'}});assert.equal(x.status,500);assert.equal(x.data.ok,false);
x=await edge({result:{ok:true,auth_account_deleted:false}});assert.equal(x.status,500);
const app=read('js/app.js');
const render=app.slice(app.indexOf('function renderAccountDeletionState(){'),app.indexOf('function renderAuthSecurityState(){'));
const fn=app.slice(app.indexOf('async function deleteWalletTrackingAccount(){'),app.indexOf('function clearWalletRelatedMemory('));
async function ui(options={}){
 const calls=[];const elements=Object.fromEntries(['deleteAccountBtn','deleteAccountAdminNotice','deleteAccountStatus'].map(k=>[k,{}]));
 const s={console:{error:()=>{},warn:()=>{}},currentUser:{id:A,email:'test@example.invalid'},isAdmin:!!options.admin,document:{getElementById:k=>elements[k]},window:{},alert:t=>calls.push('alert'),prompt:()=>options.cancel?'':'KONTO LÖSCHEN',confirm:()=>options.confirm!==false,runDataJob:async(label,job)=>{if(options.switchUser)s.currentUser={id:B};return job();},invokeWalletPrivate:async(action,body)=>{calls.push('server');assert.equal(action,'account_delete');assert.equal(body.expected_user_id,A);if(options.error)throw Error('server failed');return {result:{auth_account_deleted:options.unconfirmed?false:true}};},sb:{auth:{signOut:async arg=>{assert.equal(arg.scope,'local');calls.push('logout');}}},clearWalletTrackingLocalUserData:async arg=>{assert.equal(arg.preserveAuthSession,false);calls.push('clear');},REDIRECT_URL:'/',location:{replace:()=>calls.push('redirect')}};
 vm.runInNewContext(render+fn,s);s.renderAccountDeletionState();await s.window.deleteWalletTrackingAccount();return {calls,elements,s};
}
x=await ui();assert.deepEqual(x.calls,['server','logout','clear','alert','redirect']);assert.equal(x.s.currentUser,null);
for(const opts of [{admin:true},{cancel:true},{confirm:false},{switchUser:true}]){x=await ui(opts);assert.ok(!x.calls.includes('server'));assert.ok(!x.calls.includes('clear'));}
x=await ui({admin:true});assert.equal(x.elements.deleteAccountBtn.hidden,true);
for(const opts of [{error:true},{unconfirmed:true}]){x=await ui(opts);assert.ok(x.calls.includes('server'));assert.ok(!x.calls.includes('clear'));assert.ok(!x.calls.includes('logout'));assert.ok(!x.calls.includes('redirect'));assert.equal(x.elements.deleteAccountBtn.disabled,false);}
const sql=read('sql/090-account-delete-admin-guard.sql');
const reset=sql.slice(0,sql.indexOf('create or replace function public.wallettracking_delete_own_account'));
assert.equal((reset.match(/t.table_name <> 'admins'/g)||[]).length,3);
assert.match(sql,/v_user_id uuid := auth.uid\(\)/);assert.match(sql,/p_confirmation is distinct from 'KONTO LÖSCHEN'/);
assert.match(sql,/a.user_id = v_user_id/);assert.match(sql,/lower\(a.email\) = lower\(v_email\)/);
assert.match(sql,/lock table public.admins in share mode/);
assert.ok(sql.indexOf("raise exception 'Admin-Konten")<sql.indexOf('v_result := public.wallettracking_delete_all_user_data()'));
assert.ok(sql.indexOf("raise exception 'Kontolöschung blockiert")<sql.indexOf('v_result := public.wallettracking_delete_all_user_data()'));
assert.ok(sql.indexOf('v_result := public.wallettracking_delete_all_user_data()')<sql.indexOf('delete from auth.users where id = v_user_id'));
assert.match(sql,/revoke all on function public.wallettracking_delete_own_account\(text\) from public, anon/);
assert.ok(!sql.slice(sql.indexOf('create or replace function public.wallettracking_delete_own_account')).includes('exception when'));assert.ok(!sql.includes('delete from storage.objects'));
assert.ok(!app.includes('Konto erstellt. Bitte die einmalige Bestätigungs-Mail öffnen.'));
console.log('account-delete regression passed (Edge/UI runtime; SQL static contract only)');
