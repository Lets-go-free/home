import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('js/tln-reward-verification-core.js',root),'utf8');
const browser=fs.readFileSync(new URL('projects/tln-vow/tln-vow-discovery.js',root),'utf8');
const edge=fs.readFileSync(new URL('supabase/functions/tln-vow-reward-refresh/index.ts',root),'utf8');
const sandbox={};vm.runInNewContext(source,sandbox);
const core=sandbox.WT_TLN_REWARD_VERIFICATION_CORE;
assert.ok(browser.includes('manualReconcileUnstakeContractCalls'));
assert.ok(edge.includes('receiptBasedUnstakeClosures'));
const wallet='0x'+'a'.repeat(40),staking='0x'+'b'.repeat(40),asset='0x'+'c'.repeat(40);
const time=(n)=>new Date(n*1000).toISOString();
const lot=(hash,amount=10)=>({stakeTx:hash,stakeTime:time(10),pair_address:asset,
  pair:{address:asset,decimals:18},staking:{contract_address:staking},original:amount,
  remaining:amount,status:'open',transactions:[]});
const receipt={hash:'out',to:staking,_staking:{contract_address:staking},_method:'Unstake',
  _success:true,_blockNumber:20,metadata:{blockTimestamp:time(20)},
  _erc20Transfers:[{token:asset,to:wallet,amountRaw:'10000000000000000000'}]};
const a=[lot('in')],yes=core.manualReconcileUnstakeContractCalls(a,[receipt],wallet);
assert.equal(yes.receiptClosures,1);
assert.equal(yes.uniqueCallClosures,0);
assert.equal(a[0].status,'closed');
assert.equal(a[0].unstakeEvidence,'lp_return_in_receipt');
const two=[lot('first'),lot('second')];
const ambiguous=core.manualReconcileUnstakeContractCalls(two,[{
  hash:'out2',to:staking,_method:'Unstake',_success:true,metadata:{blockTimestamp:time(30)}
}],wallet);
assert.equal(ambiguous.uniqueCallClosures,0);
assert.equal(ambiguous.ambiguousCalls,1);
assert.equal(two.filter(x=>x.status==='open').length,2);
const wrongPath=[lot('single')];
const rejected=core.manualReconcileUnstakeContractCalls(wrongPath,[{
  ...receipt,hash:'bad',to:'0x'+'d'.repeat(40),_staking:null,_method:'Unstake',
  _erc20Transfers:[]
}],wallet);
assert.equal(rejected.receiptClosures,0);
assert.equal(rejected.uniqueCallClosures,0);
assert.equal(wrongPath[0].status,'open');
console.log('9.56 same manual LP-return and unambiguous unstake-call rules in browser and Edge');
