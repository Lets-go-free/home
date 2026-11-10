import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const edge=readFileSync(new URL('supabase/functions/dao-reward-refresh/index.ts',root),'utf8');
const browser=readFileSync(new URL('projects/dao1/dao1.js',root),'utf8');
const migration=readdirSync(new URL('supabase/migrations/',root)).find(f=>f.endsWith('_dao_reward_state_constraint_817.sql'));
const sql=readFileSync(new URL('supabase/migrations/'+migration,root),'utf8');
const html=readFileSync(new URL('index.html',root),'utf8');
test('8.17 version and build visible consistently',()=>{
 assert.match(html,/window.APP_VERSION="8\.17"/);
 const build=html.match(/window.BUILD_ID="([\d-]+)"/)?.[1];assert.ok(build);
 assert.ok(html.includes('Phase 8.17 · Build '+build));
});
test('migration captures reward_running without mutating claims or wallets',()=>{
 for(const state of ['pending','running','partial','staged','reward_running','failed','completed'])assert.match(sql,new RegExp("'"+state+"'"));
 assert.match(sql,/BEGIN;[\s\S]*COMMIT;/);
 assert.doesNotMatch(sql,/\b(UPDATE|DELETE|INSERT)\s+/i);
 assert.doesNotMatch(sql,/project_nft_claims|project_transaction_asset_flows/);
});
test('staging and staged failure preserve database error code/message without object coercion',()=>{
 assert.match(edge,/function daoErrorSummary\(e:unknown\)/);
 assert.match(edge,/typeof o\.code==='string'/);
 assert.match(edge,/typeof o\.message==='string'/);
 const from=edge.indexOf("if(body.mode==='cron-staged-one')");
 const to=edge.indexOf('// 8.13: explicit single-wallet',from);
 const routes=edge.slice(from,to);
 assert.equal((routes.match(/const error=daoErrorSummary\(e\)/g)||[]).length,2);
 assert.doesNotMatch(routes,/const error=String\(e instanceof Error\?e\.message:e\)/);
});
test("browser incremental DAO1 fetch has no undeclared fetched counter",()=>{
 const from=browser.indexOf('async function fetchWalletTransactionsIncremental(');
 const to=browser.indexOf('function selectedNftsForMining(',from);
 const body=browser.slice(from,to);
 assert.ok(from>=0&&to>from);
 assert.doesNotMatch(body,/fetched\s*\+=/);
 assert.match(body,/return \{transactions:out,maxSeen,state,fromBlock\}/);
});
