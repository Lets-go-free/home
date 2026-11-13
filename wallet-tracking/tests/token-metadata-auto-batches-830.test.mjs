import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync('wallet-tracking/js/app.js','utf8');
const start=src.indexOf("async function refreshTechnicalTokenMetadata(mode='refresh-catalog'){");
const end=src.indexOf('\n// Gezielte technische Pruefung',start);
assert.ok(start>=0&&end>start);
const run=async(responses)=>{
 const btn={disabled:false},status={textContent:''},calls=[];
 const context={
  tokenMetadataContinuationUser:null,tokenMetadataContinuation:{},currentUser:{id:'tester'},
  document:{getElementById:(id)=>id.endsWith('Btn')?btn:status},
  sb:{functions:{invoke:async (_name,opts)=>{calls.push(opts.body.after);return responses.shift()??{error:new Error('network')};}}},
  loadPredefinedTokensFromDb:async()=>{},loadCustomSafeTokensFromDb:async()=>{},
  renderSafeTokenTable:()=>{},renderCustomTokenList:()=>{},renderResults:()=>{},alert:()=>{}
 };
 vm.createContext(context);vm.runInContext(src.slice(start,end),context);
 const result=await vm.runInContext("refreshTechnicalTokenMetadata('refresh-catalog')",context);
 return {result,status:status.textContent,calls,btn,cursor:context.tokenMetadataContinuation['refresh-catalog']};
};
const batch=(count,nextAfter)=>({data:{ok:true,checked:count,results:Array.from({length:count},()=>({status:'verified'})),nextAfter}});
const success=await run([batch(12,'eth|a'),batch(12,'eth|b'),batch(4,null)]);
assert.equal(success.result.checked,28);
assert.equal(success.result.verified,28);
assert.deepEqual(success.calls,['','eth|a','eth|b']);
assert.match(success.status,/Liste abgeschlossen/);
assert.equal(success.btn.disabled,false);
const interrupted=await run([batch(12,'eth|a'),{error:new Error('network')}]);
assert.equal(interrupted.result,null);
assert.equal(interrupted.cursor,'eth|a');
assert.match(interrupted.status,/Unterbrochen/);
assert.equal(interrupted.btn.disabled,false);
const stalled=await run([batch(12,'eth|a'),batch(12,'eth|a')]);
assert.equal(stalled.result,null);
assert.match(stalled.status,/Fortsetzungscursor/);
console.log('8.30 automatic metadata batches: pagination, aggregate counters, interruption and cursor guard OK');
