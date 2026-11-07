import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
test('explorer history reads a bounded number of pages per run',()=>{
 assert.match(src,/const MAX_PAGES_PER_INVOCATION=8/);
 assert.match(src,/for\(let page=0;page<pageLimit;page\+\+\)/);
 assert.match(src,/return \{complete:false,block:cursor,pages:pageLimit\}/);
});
test('checkpoint persists only after page handler has completed',()=>{
 const begin=src.indexOf('async function paginate(');
 const end=src.indexOf('// The raw staging import',begin);
 const body=src.slice(begin,end);
 assert.ok(body.indexOf('await handler(rows)')<body.indexOf('await saveScan(job,kind,cursor,'));
 assert.match(body,/highestBlock:highest,[\s\S]*?next:nextParams/);
 assert.match(body,/await saveScan\(job,kind,highest,null\)/);
 assert.match(body,/checkpoint\.startBlock!==cursor/);
});
test('canonical browser scan cursors remain untouched',()=>{
 assert.match(src,/reward_server_raw_transactions_v1/);
 assert.match(src,/reward_server_raw_flows_v1/);
 assert.doesNotMatch(src,/saveScan\(job,'transactions_wallet_v1'/);
});
