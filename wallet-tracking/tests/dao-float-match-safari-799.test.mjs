import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const migrationName=readdirSync(new URL('supabase/migrations/',root)).find(f=>f.endsWith('_dao_consistent_native_float_matching_799.sql'));
const sql=readFileSync(new URL('supabase/migrations/'+migrationName,root),'utf8');
const html=readFileSync(new URL('index.html',root),'utf8');
const floatComparison=/\(f\.amount_raw::double precision \/ 1000000000000000000::double precision\) = t\.claim_reward_aptm::double precision/g;
test('both DAO RPC predicates use the same raw-to-number comparison as JS reconciliation',()=>{
 assert.equal([...sql.matchAll(floatComparison)].length,2);
 assert.doesNotMatch(sql,/f\.amount_raw::numeric\s*=\s*t\.claim_reward_aptm/);
 assert.match(sql,/v_eligible <> p_expected_eligible/);
 assert.match(sql,/v_updated <> v_eligible/);
 assert.match(sql,/v_marked_after <> v_marked_before\+v_updated/);
 assert.match(sql,/pg_advisory_xact_lock/);
});
test('only claim-candidate flags are written; access remains service-role-only',()=>{
 assert.doesNotMatch(sql,/UPDATE public\.project_transactions\b/i);
 assert.doesNotMatch(sql,/UPDATE public\.project_transaction_asset_flows\b/i);
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.equal((sql.match(/CREATE OR REPLACE FUNCTION/g)||[]).length,2);
});
test('Safari login retains stable autocomplete attributes and native form semantics',()=>{
 const form=html.match(/<form id="authPasswordForm"[^>]+>[\s\S]*?<\/form>/)?.[0];
 assert.ok(form);
 assert.match(form,/autocomplete="on"/);
 assert.match(form,/type="email" id="authEmail" name="username"[^>]+autocomplete="username"[^>]+required/);
 assert.match(form,/type="password" id="authPassword" name="password"[^>]+autocomplete="current-password"[^>]+required/);
 assert.match(form,/type="submit"/);

});
