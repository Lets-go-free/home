import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
test('missing token-transfer block must resolve using canonical tx detail',()=>{
 assert.match(source,/async function itemBlock\(/);
 assert.match(source,/json\(`\$\{EXPLORER\}\/transactions\/\$\{tx\}`\)/);
 assert.match(source,/txBlockCache\.set\(tx,block\)/);
 assert.match(source,/block=await itemBlock\(t\)/);
 assert.match(source,/_verifiedBlock:block/);
});
test('stored raw events use the verified block rather than an optional API field',()=>{
 assert.equal((source.match(/block_number:Number\(t\._verifiedBlock\)/g)||[]).length,2);
 assert.doesNotMatch(source,/block_number:Number\(t\.block_number\)/);
});
