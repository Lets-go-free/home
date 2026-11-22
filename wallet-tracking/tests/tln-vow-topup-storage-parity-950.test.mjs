import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('js/tln-reward-verification-core.js',root),'utf8');
const browser=fs.readFileSync(new URL('projects/tln-vow/tln-vow-discovery.js',root),'utf8');
const edge=fs.readFileSync(new URL('supabase/functions/tln-vow-reward-refresh/index.ts',root),'utf8');
const ctx={};vm.runInNewContext(source,ctx);
const verify=ctx.WT_TLN_REWARD_VERIFICATION_CORE.manualTopUpStorageContinuity;
assert.ok(browser.includes('shared(previous,next)'), 'Browser must call canonical shared top-up proof');
assert.ok(edge.includes('verificationCore.manualTopUpStorageContinuity(previous,next)'),
  'Edge must call canonical shared top-up proof');
const firstTs=1734176744,secondTs=1734194033;
const first={stakeTime:new Date(firstTs*1000).toISOString(),durationReference:{targeted:{
  available:true,root:3,startRow:{offset:2},coreOffsets:[0,1,2],byOffset:[
    {offset:0,stake:{value:'0x1'}},{offset:1,stake:{value:'0x2'}},
    {offset:2,stake:{timestamp:firstTs}}]}}};
const second={stakeTime:new Date(secondTs*1000).toISOString(),durationReference:{targeted:{
  available:true,root:3,startRow:{offset:2},coreOffsets:[0,1,2],byOffset:[
    {offset:0,before:{value:'0x1'},stake:{value:'0x3'}},
    {offset:1,before:{value:'0x2'},stake:{value:'0x4'}},
    {offset:2,before:{timestamp:firstTs},stake:{timestamp:secondTs}}]}}};
const good=verify(first,second);
assert.equal(good.proven,true);
assert.equal(good.root,3);
assert.equal(good.startOffset,2);
assert.equal(good.timestampContinuity,true);
assert.equal(good.secondReset,true);
assert.equal(verify(first,{...second,durationReference:{targeted:{...second.durationReference.targeted,root:4}}}).proven,false);
assert.equal(verify(first,{...second,durationReference:{targeted:{...second.durationReference.targeted,
  byOffset:second.durationReference.targeted.byOffset.map(x=>x.offset===2?
    {...x,before:{timestamp:firstTs+999}}:x)}}}).proven,false);
assert.equal(verify(first,{...second,durationReference:{targeted:{...second.durationReference.targeted,
  byOffset:second.durationReference.targeted.byOffset.map(x=>x.offset===0?
    {...x,stake:{value:'0x1'}}:x.offset===1?{...x,stake:{value:'0x2'}}:x)}}}).proven,false);
assert.equal(verify(first,{...second,durationReference:null}).proven,false);
console.log('9.50 exact browser/Edge storage-root, timestamp, occupied-state and mutation continuity rule');
