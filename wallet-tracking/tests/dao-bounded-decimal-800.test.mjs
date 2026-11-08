import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const m=readdirSync(new URL('supabase/migrations/',root)).find(x=>x.endsWith('_dao_bounded_decimal_native_match_800.sql'));
const sql=readFileSync(new URL('supabase/migrations/'+m,root),'utf8');
const html=readFileSync(new URL('index.html',root),'utf8');
const pred='abs((f.amount_raw::numeric / 1000000000000000000::numeric) - t.claim_reward_aptm::numeric) <= 0.000000000000001::numeric';
test('both DAO functions use identical bounded decimal predicate',()=>{
 assert.equal(sql.split(pred).length-1,2);
 assert.doesNotMatch(sql,/f\.amount_raw::double precision/);
 assert.match(sql,/f\.amount_raw ~ '\^\[0-9\]\+\$'/);
 assert.equal(sql.split('f.amount=t.claim_reward_aptm').length-1,2);
});
test('authorization and atomic guards remain',()=>{
 assert.equal(sql.split("auth.role() IS DISTINCT FROM 'service_role'").length-1,2);
 for(const x of ['pg_advisory_xact_lock','v_eligible <> p_expected_eligible','v_updated <> v_eligible','v_marked_after <> v_marked_before+v_updated']) assert.ok(sql.includes(x));
 assert.equal(sql.split('CREATE OR REPLACE FUNCTION').length-1,2);
 assert.doesNotMatch(sql,/UPDATE public\.project_transactions/i);
 assert.doesNotMatch(sql,/UPDATE public\.project_transaction_asset_flows/i);
});
test('known historical payment differences all fit tolerance, larger differences do not',()=>{
 const raw=['13346119753204579439','13346119753204579439','12011461069501031318','12011461069501031318'];
 const canon=['13.34611975320458','13.34611975320458','12.011461069501031','12.011461069501031'];
 function wei(s){const [a,b='']=s.split('.');return BigInt(a)*10n**18n+BigInt((b+'0'.repeat(18)).slice(0,18));}
 for(let i=0;i<4;i++){
  const delta=BigInt(raw[i])-wei(canon[i]);
  assert.ok(delta>=-1000n && delta<=1000n);
 }
 assert.ok((wei('12.011461069501031')+1001n)-wei('12.011461069501031')>1000n);
});
test('visible phase and build match the active release metadata',()=>{
 const version=html.match(/window\.APP_VERSION="([0-9.]+)"/)?.[1];
 const build=html.match(/window\.BUILD_ID="([0-9-]+)"/)?.[1];
 assert.ok(version);assert.ok(build);
 assert.ok(html.includes(`Phase ${version} · Build ${build}`));
});
