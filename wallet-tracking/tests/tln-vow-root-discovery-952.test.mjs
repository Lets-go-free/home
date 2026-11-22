import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const root=new URL('../',import.meta.url);
const edge=fs.readFileSync(new URL('supabase/functions/tln-vow-reward-refresh/index.ts',root),'utf8');
const browser=fs.readFileSync(new URL('projects/tln-vow/tln-vow-discovery.js',root),'utf8');
const source=fs.readFileSync(new URL('js/tln-reward-verification-core.js',root),'utf8');
const coreCtx={};vm.runInNewContext(source,coreCtx);
const core=coreCtx.WT_TLN_REWARD_VERIFICATION_CORE;
const start=edge.indexOf('async function discoverKnownStakeRoot(');
const end=edge.indexOf('\nfunction reply(',start);
assert.ok(start>0&&end>start);
assert.ok(browser.includes('async function archiveStorageScan('));
assert.ok(edge.includes("mode==='known-stake-root-discovery'"));
assert.ok(edge.includes("const rootsToExpand=hitRoots.length?hitRoots:[0,1,2,3,4,5,6,7,8]"));
const wallet='0x'+'a'.repeat(40),contract='0x'+'b'.repeat(40),stakeTs=1734176744,block=44865255;
const slotValues=new Map();
for(const [offset,value] of [[0,100n],[1,200n],[2,BigInt(stakeTs)]]){
  const slot=core.manualWalletMappingSlot(wallet,3,offset);
  slotValues.set(slot.toLowerCase(),value);
}
let requests=0;
const sandbox={verificationCore:core,NODEREAL_BSC_RPC_URL:'https://archive.example/rpc',
  evmAddress:a=>/^0x[0-9a-f]{40}$/.test(String(a))?a:null,
  AbortController,clearTimeout,setTimeout,fetch:async(_url,opts)=>{
    const jobs=JSON.parse(opts.body);requests+=jobs.length;
    return {ok:true,json:async()=>jobs.map(job=>({id:job.id,
      result:'0x'+(job.params[2]==='0x'+block.toString(16)?
        (slotValues.get(job.params[1].toLowerCase())||0n):0n).toString(16)}))};
  }};
vm.runInNewContext(stripTypeScriptTypes(edge.slice(start,end)),sandbox);
const result=await sandbox.discoverKnownStakeRoot(wallet,contract,block,stakeTs);
assert.equal(result.detectedRoot,3);
assert.equal(result.detectedTimestampOffset,2);
assert.equal(result.exactStakeTimestampVerified,true);
assert.equal(result.rootAmbiguous,false);
assert.equal(result.reads,requests);
assert.equal(result.reads,52);
console.log('9.52 browser A1/B known-root discovery replay: root 3, offset 2, 52 bounded archive reads');
