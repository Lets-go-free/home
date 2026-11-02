import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const src = readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts', import.meta.url), 'utf8');
assert.match(src, /const MAX_HISTORICAL_CHECKS=20/);
assert.doesNotMatch(src, /if\(!candidate\|\|historicalCheckCount>=20\)continue/);
assert.match(src, /if\(!candidate\)continue;[\s\S]*?if\(historicalCheckCount>=MAX_HISTORICAL_CHECKS\)throw Error\(/);
assert.match(src, /historicalCheckCount\+\+;[\s\S]*?historicalNftOwnership\(/);
assert.match(src, /const lastTx=await paginate\([\s\S]*?\);await updateState\(job,RAW_TX_SCAN,lastTx\)/);
// A thrown handler aborts paginate; the cursor update must not execute.
assert.match(src, /await handler\(rows\);/);
console.log('Historical verification budget / cursor protection source checks passed');
