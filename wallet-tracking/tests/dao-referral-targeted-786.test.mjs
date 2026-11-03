import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
test('targeted referral import only runs for canonical referral wallet',()=>{
 assert.match(worker,/if\(address===REFERRAL_WALLET\)/);
 assert.match(worker,/filter=to&token=\$\{REFERRAL_WUSDT_TOKEN\}/);
 assert.match(worker,/REFERRAL_FLOW_SCAN='reward_server_referral_wusdt_v1'/);
});
test('targeted imports use same deduplicated flow keys as broad import',()=>{
 assert.match(worker,/function transferRows\(items:any\[\]\)/);
 assert.match(worker,/flow_key:`\$\{tx\}\|\$\{token\}\|\$\{log\}\|\$\{direction\}\|\$\{raw\}`/);
 assert.match(worker,/ignoreDuplicates:true/);
});
test('reject explorer filter mismatches; confirm contract transaction before materializing it',()=>{
 assert.match(worker,/row.direction!=='eingang'\|\|row.token_address!==REFERRAL_WUSDT_TOKEN/);
 assert.match(worker,/to!==REFERRAL_REWARD_CONTRACT/);
 assert.match(worker,/block!==flowBlock/);
 assert.match(worker,/isVerifiedReferralTransaction\(address/);
});
test('queue cannot stage while targeted referral scan is partial',()=>{
 assert.match(worker,/result.referralScan\?\.complete===false/);
 assert.match(worker,/referralScan:referralProgress/);
 assert.doesNotMatch(worker,/wallettracking_reward_complete/);
});
