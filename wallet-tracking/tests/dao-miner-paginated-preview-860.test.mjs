import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const start=source.indexOf("if(body?.mode==='admin-miner-batch-preview-856'");
const end=source.indexOf(" // 8.53: one strictly read-only");
const route=source.slice(start,end);

test('8.60 preserves legacy 8.56 preview and adds read-only page route',()=>{
 assert.match(route,/admin-miner-batch-preview-856/);
 assert.match(route,/admin-miner-page-preview-860/);
 assert.match(route,/authenticateInspectAdmin/);
 assert.match(route,/DAO_REWARD_ENABLE_LIVE_WORKER/);
 assert.match(route,/sourceQuery\.or/);
 assert.match(route,/claim_block\.gt/);
 assert.match(route,/claim_block\.eq/);
 assert.match(route,/tx_hash\.gt/);
 assert.match(route,/\.limit\(paged\?4:3\)/);
 assert.match(route,/\.slice\(0,3\)/);
 assert.match(route,/evaluateMinerPreview856/);
 assert.match(route,/aggregateMinerRewardEvents857/);
 assert.match(route,/continuation,hasMore/);
 assert.doesNotMatch(route,/sb\.rpc\(|\.update\(|\.upsert\(|\.insert\(/);
});
test('8.60 cursor requires a safe integer block and valid hash together',()=>{
 assert.match(route,/body\.afterBlock!==undefined\|\|body\.afterTxHash!==undefined/);
 assert.match(route,/Number\.isSafeInteger\(afterBlock\)/);
 assert.match(route,/afterBlock<=0/);
 assert.match(route,/typeof afterTxHash!=='string'/);
 assert.match(route,/\^0x\[0-9a-f\]\{64\}\$/);
 assert.match(route,/results\.length<windowCandidates\.length/);
});
