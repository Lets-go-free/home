import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
test('explicit modes distinguish history, resume and delta',()=>{
 assert.match(src,/checkpoint\?'resume-history':cursor>0\?'incremental-delta':'initial-history'/);
});
test('completed no-change delta does not rewrite verified cursor',()=>{
 assert.match(src,/if\(checkpoint\|\|advanced\|\|cursor===0\)await saveScan/);
 assert.match(src,/upToDate:emptyInitial\|\|\(cursor>0&&!advanced\)/);
});
test('overlap is still handled; no silent newer event loss',()=>{
 assert.match(src,/if\(block>=Math.max\(0,cursor-OVERLAP\)\)rows.push/);
 assert.match(src,/if\(rows.length\)await handler\(rows\)/);
});
test('historical incomplete still persists continuation',()=>{
 assert.match(src,/await saveScan\(job,kind,cursor,\{version:1/);
 assert.match(src,/scanMode,newBlocksObserved:highest>cursor,upToDate:false/);
});
