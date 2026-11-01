import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const migration=readFileSync(new URL('../supabase/migrations/20261101140447_reward_staging_status_609.sql',import.meta.url),'utf8');
test('successful raw import is only staged, never reward-completed',()=>{
  assert.match(worker,/wallettracking_reward_stage/);
  assert.doesNotMatch(worker,/p_error:null/);
  assert.match(migration,/state='staged'/);
  assert.match(migration,/lease_until>now\(\)/);
  assert.match(migration,/auth\.role\(\).*service_role/);
});
test('raw worker leaves canonical cursor untouched',()=>{
  assert.match(worker,/reward_server_raw_transactions_v1/);
  assert.match(worker,/reward_server_raw_flows_v1/);
});
