import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
for(const cursor of ['reward_server_raw_transactions_v1','reward_server_raw_flows_v1'])assert.ok(source.includes(cursor),`separate server cursor ${cursor}`);
for(const canonical of ["state(job,'transactions_wallet_v1')","state(job,'token_flows_wallet_v2')", "updateState(job,'transactions_wallet_v1'", "updateState(job,'token_flows_wallet_v2'"]){assert.ok(!source.includes(canonical),`must not alter canonical cursor: ${canonical}`)}
assert.match(source,/if\(!complete\)throw Error\('Incomplete pagination'\)/);
assert.match(source,/if\(!Number\.isSafeInteger\(log\)\|\|log<0\)throw Error/);
assert.match(source,/if\(minute<245\|\|minute>=330\)/);
assert.match(source,/async function insertRawWithoutReplacing/);
assert.match(source,/ignoreDuplicates:true/);
assert.match(source,/from===address&&to===address\?'intern'/);
assert.doesNotMatch(source,/const merged=\{\.\.\.old\}/);
assert.doesNotMatch(source,/await upsert\('project_transactions'/);
assert.doesNotMatch(source,/cron\.schedule|CREATE EXTENSION|createSnapshot/i);
console.log('Reward staging worker safety checks passed');
