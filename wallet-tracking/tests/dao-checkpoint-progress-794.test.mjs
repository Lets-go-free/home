import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
function extractFunction(name, next){
 const start=src.indexOf(`function ${name}(`);
 const end=src.indexOf(`function ${next}(`,start);
 assert.ok(start>=0&&end>start);
 return src.slice(start,end);
}
const funcs=extractFunction('stablePageCursor','assertDescendingBlock');
const {stablePageCursor,assertPageCursorProgress}=new Function(`${funcs.replaceAll('next:any','next').replaceAll('previous:any','previous').replaceAll('):string{','){')}; return {stablePageCursor,assertPageCursorProgress}`)();
test('same continuation is rejected even if parameter key order differs',()=>{
 assert.throws(()=>assertPageCursorProgress({index:2,block_number:42},{block_number:42,index:2}),/no progress/);
});
test('changed continuation is accepted',()=>{
 assert.doesNotThrow(()=>assertPageCursorProgress({block_number:42,index:2},{block_number:41,index:1}));
});
test('malformed continuation is rejected',()=>{
 assert.throws(()=>stablePageCursor({}),/Invalid Explorer next page/);
});
test('database write has explicit updated_at and read-back confirmation',()=>{
 const write=src.slice(src.indexOf('async function saveScan('),src.indexOf('function explorerPageUrl('));
 assert.match(write,/updated_at:new Date\(\)\.toISOString\(\)/);
 assert.match(write,/Reward checkpoint write not confirmed/);
 assert.match(write,/last_scan_message,last_scan_result/);
});
test('manual import exposes checkpoint progress and applies no reward update',()=>{
 assert.match(src,/checkpointProgress:\{hadCheckpoint/);
 assert.match(src,/observedItems/);
 assert.match(src,/assertPageCursorProgress\(next,nextParams\)/);
 const stage=src.slice(src.indexOf('if(stageOnly){'),src.indexOf('// Separate verification budget'));
 assert.doesNotMatch(stage,/wallettracking_dao_create_verified/);
});
