import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const src=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('initial empty history demands a second valid terminal Explorer response',()=>{
 assert.match(src,/const emptyInitial=cursor===0&&!checkpoint&&page===0/);
 assert.match(src,/const confirmation=await json\(url\)/);
 assert.match(src,/!Array\.isArray\(confirmation.items\)/);
 assert.match(src,/Empty Explorer history could not be confirmed/);
});
test('verified empty is persisted and checked with distinct state',()=>{
 assert.match(src,/verifiedEmpty\?\'empty_verified\'/);
 assert.match(src,/last_scan_result:result/);
 assert.match(src,/stored.last_scan_result!==result/);
});
test('staging requires positive full coverage and cannot silently stage block zero',()=>{
 const start=src.indexOf("if(body.mode==='cron-multi-wallet-one')");
 const end=src.indexOf('// 8.13: explicit single-wallet integration rehearsal',start);
 const body=src.slice(start,end);
 assert.match(body,/scan.coverageVerified===true/);
 assert.match(body,/scan.block>0\|\|scan.verifiedEmpty===true/);
 assert.match(body,/partial\?'partial':'staged'/);
 assert.doesNotMatch(body,/processSingleNativeClaim/);
});
test('fallback returns explicit incomplete coverage and never stages',()=>{
 assert.match(src,/complete:false,coverageVerified:false,verifiedEmpty:false/);
});
test('build reflects 8.15 or newer',()=>{
 assert.match(html,/window.APP_VERSION="8\.(?:15|16)"/);
 assert.match(html,/Phase 8\.(?:15|16) · Build/);
});
