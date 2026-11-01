import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
// Isolate the exact pure conversion logic from the deployed edge source rather
// than testing a separately rewritten implementation.
const start=source.indexOf('function aptmAmount(');
const end=source.indexOf('async function loadAddress(',start);
assert.ok(start>=0&&end>start);
const chunk=source.slice(start,end).replaceAll('raw:unknown','raw').replaceAll('raw:string','raw').replaceAll('decimals:number','decimals');
const convert=Function(chunk+'; return aptmAmount')();
test('native wei are persisted without IEEE-754 truncation',()=>{
 assert.equal(convert('1000000000000000001'),'1.000000000000000001');
 assert.equal(convert('123456789012345678901234567890'),'123456789012.34567890123456789');
 assert.equal(convert('0'),'0');
 assert.equal(convert('1'),'0.000000000000000001');
});
test('invalid or already-decimal API amounts fail closed',()=>{
 for(const v of ['-1','1.2','1e18','NaN','','abc'])assert.throws(()=>convert(v));
});
test('transactions and fees both use the same exact native converter',()=>{
 assert.match(source,/value_aptm:aptmAmount\(t\.value/);
 assert.match(source,/gas_aptm:aptmAmount\(t\.fee\?\.value/);
});
