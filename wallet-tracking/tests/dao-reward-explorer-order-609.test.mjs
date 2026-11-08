import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const match=src.match(/function assertDescendingBlock\(previous:number,current:number\)\{[\s\S]*?\n\}/);
assert.ok(match,'Missing descending-block guard');
const fn=vm.runInNewContext(`(${match[0].replace('previous:number,current:number','previous,current')})`);
test('descending blocks and equal-block transactions pass',()=>{
 assert.doesNotThrow(()=>fn(Infinity,500));
 assert.doesNotThrow(()=>fn(500,500));
 assert.doesNotThrow(()=>fn(500,499));
});
test('ascending blocks fail closed',()=>{
 assert.throws(()=>fn(499,500),/Explorer page order changed/);
 assert.throws(()=>fn(400,401),/Explorer page order changed/);
});
test('malformed blocks fail closed',()=>{
 for(const n of [-1,0,NaN,1.2,Infinity])assert.throws(()=>fn(500,n));
});
test('saved oldest block is checked on resume, and persisted after each page',()=>{
 assert.match(src,/checkpoint\?\.oldestBlock\?\?Infinity/);
 assert.match(src,/let previousBlock=previousOldest/);
 assert.match(src,/assertDescendingBlock\(previousBlock,block\)/);
 assert.match(src,/oldestBlock:Number\.isFinite\(oldest\)\?oldest:previousOldest,next:nextParams/);
});
test('never persist incomplete page or certify when incomplete',()=>{
 const body=src.slice(src.indexOf('async function paginate('),src.indexOf('// The raw staging import'));
 assert.ok(body.indexOf('await handler(rows)') < body.indexOf('await saveScan(job,kind,cursor,'));
 assert.match(body,/if\(finished\)\{/);
 assert.match(body,/if\(checkpoint\|\|advanced\|\|cursor===0\)await saveScan\(job,kind,highest,null\)/);
 assert.match(body,/Explorer empty page with continuation/);
});
