import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/migrations/20261102184148_reward_partial_continuation_609.sql',import.meta.url),'utf8');
test('incomplete pages or NFT backlog stay queued instead of becoming staged',()=>{
 assert.match(worker,/const partial=!result\.transactionScan\.complete\|\|!result\.flowScan\.complete\|\|result\.pendingHistoricalChecks>0/);
 assert.match(worker,/partial\?'wallettracking_reward_continue':'wallettracking_reward_stage'/);
});
test('partial jobs are claimable and retries remain bounded for failures',()=>{
 assert.match(sql,/a\.state IN \('pending','failed','partial'\)/);
 assert.match(sql,/a\.attempt_count<3/);
 assert.match(sql,/SET state='partial',attempt_count=0/);
 assert.match(sql,/state='running' AND lease_until>now\(\)/);
});
test('only service role can run continuation and no rewards are written by migration',()=>{
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.doesNotMatch(sql,/UPDATE public\.project_transactions|UPDATE public\.project_transaction_asset_flows/);
});
