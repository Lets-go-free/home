import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const worker=read('supabase/functions/dao-reward-refresh/index.ts');
const ui=read('projects/dao1/dao1.js');
test('manual refresh persists synthetic ERC20 transaction rows for incoming flow events',()=>{
 assert.match(ui,/async function syncApertumTokenFlowCache/);
 assert.match(ui,/const synthetic=\[\];[\s\S]*?await saveTransactionRows\(synthetic\)/);
 assert.match(ui,/const BOT_PAYOUT_SENDER="0x6d0539de11b95e18cb202a55098e3854b0313022"/);
});
test('worker stages exactly the same sender and contract as the browser',()=>{
 assert.match(worker,/LEGACY_MINER_PAYOUT_SENDER='0x6d0539de11b95e18cb202a55098e3854b0313022'/);
 assert.match(worker,/LEGACY_MINER_WAPTM='0x110ac02ba3384bc055c13a87766049a74517beda'/);
 assert.match(worker,/f\.direction!==\s*'eingang'/);
 assert.match(worker,/BigInt\(f\.amount_raw\)<=0n/);
});
test('job backfills existing flows into insert-only transaction identities, without automatic confirmation',()=>{
 assert.match(worker,/verifiedLegacyPayoutRows=new Map/);
 assert.match(worker,/\.order\('flow_key',[\s\S]*?\.range\(offset,offset\+499\)/);
 assert.match(worker,/insertRawWithoutReplacing\('project_transactions',\[\.\.\.verifiedLegacyPayoutRows.values\(\)\]/);
 assert.doesNotMatch(worker,/\.from\('dao_bot_claim_reviews'\)\.(?:insert|upsert|update)/);
 assert.match(ui,/botClaimReviewStatus\(row\)==="confirmed" && separateBotPayoutFlows/);
});
test('confirmed payouts are labelled as legacy but remain without individual NFT IDs',()=>{
 assert.match(ui,/Miner-Nachzahlung \(bestätigt\) · Alte MineBots/);
 assert.match(ui,/Alter MineBot · NFT nicht zugeordnet/);
 assert.match(ui,/if\(isConfirmedSeparateBotClaim\(r\)\)return \{id:null/);
});
