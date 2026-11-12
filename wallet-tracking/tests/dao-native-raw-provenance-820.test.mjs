import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../projects/dao1/dao1.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const section=(start,end)=>src.slice(src.indexOf(start),src.indexOf(end,src.indexOf(start)));
test('8.20 native browser payout flow requires on-chain raw wei and cannot fabricate via toFixed',()=>{
 const flow=section('function nativeClaimAssetFlowRow(', 'async function backfillNativeClaimAssetFlows');
 assert.match(flow,/exactNativeClaimWeiByHash\.get\(`\$\{txHash\}\|\$\{lower\(address\)\}`\)/);
 assert.match(flow,/if\(!wei.*return null/);
 assert.match(flow,/amount_raw:wei,amount:decimalAmountFromRawWei\(wei\)/);
 assert.doesNotMatch(flow,/toFixed|nativeClaimAmountRaw|amount_raw:numericAmount/);
});
test('8.20 external source preserves original wei from logs and successful internal transfers',()=>{
 const logs=section('function rewardFromLogs(', 'const dao1InternalRewardCache');
 const internal=section('async function rewardFromInternalTransactions(', 'async function mapLimited(');
 assert.match(logs,/exactWei\+=raw/);
 assert.match(logs,/storeExactNativeWei\(txHash,wallet,exactWei\)/);
 assert.match(internal,/storeExactNativeWei\(hash,wallet,chosen\.reduce/);
 assert.match(src,/rewardFromLogs\(logs,address,t\.tx_hash\)/);
 assert.match(src,/rewardFromLogs\(logs,address,c\.t\.hash\)/);
});
test('8.20 raw decimal conversion preserves 18 places and is independent of JS Number',()=>{
 const dec=section('function decimalAmountFromRawWei(', 'async function backfillNativeClaimAssetFlows');
 const fn=new Function('raw',dec.match(/function decimalAmountFromRawWei\(raw\)\{([\s\S]*?)\n  \}/)[1]);
 assert.equal(fn('636396007202193459307'),'636.396007202193459307');
 assert.equal(fn('1'),'0.000000000000000001');
 assert.equal(fn('1000000000000000000'),'1');
});
test('8.20 version and worker remain disabled',()=>{
 assert.match(html,/window\.APP_VERSION="8\.20"/);
 assert.doesNotMatch(src,/cron-staged-one|wallettracking_dao_reward_finish_staged_v3/);
});
