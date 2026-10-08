import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync('projects/dao1/dao1.js','utf8');
const block=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const sender='0x6d0539de11b95e18cb202a55098e3854b0313022',token='0x110ac02ba3384bc055c13a87766049a74517beda';
const row=(wallet,tx)=>({wallet_id:wallet,tx_hash:tx,tx_timestamp:'2026-10-08T08:40:04Z'});
const flow=(wallet,tx,extra={})=>({wallet_id:wallet,tx_hash:tx,direction:'eingang',token_address:token,token_symbol:'wAPTM',amount:232.13969071,counterparty_address:sender,...extra});
const rows=[row('a','tx1'),row('b','tx2'),row('a','wrong-sender'),row('a','wrong-token'),row('a','out'),row('a','normal-claim')];rows.at(-1).selector='0x86bb8f37';
const flows=[flow('a','tx1'),flow('b','tx2'),flow('a','wrong-sender',{counterparty_address:'other'}),flow('a','wrong-token',{token_address:'usdt'}),flow('a','out',{direction:'ausgang'}),flow('a','normal-claim')];
let uid='user1',allow=true,fail=false;const persisted=new Map(),writes=[],alerts=[];
const c=vm.createContext({Map,Set,Date,Number,String,Promise,encodeURIComponent,transactionRows:rows,transactionAssetFlows:flows,DB_PAGE_SIZE:1000,PROJECT_KEY:'dao1',CHAIN_KEY:'apertum',REFERRAL_WALLET:'referral',REFERRAL_REWARD_CONTRACT:'referral-contract',EXPLORER:'https://explorer.apertum.io',getContext:()=>({currentUser:{id:uid}}),lower:s=>String(s||'').toLowerCase(),escapeHtml:s=>String(s||''),tokenAmount:n=>String(n),claimWalletDisplay:r=>({name:r.wallet_id,address:'0xabc'}),confirm:()=>allow,alert:s=>alerts.push(s),renderClaimsTab(){},renderTransactionHistory(){},loadDashboardSummary:async()=>{},isKnownClaimSelector:v=>['0x86bb8f37','0x19da4078'].includes(v),rowWalletAddress:()=>'',isVerifiedReferralFlow:()=>false,
 sb:{from(table){assert.equal(table,'dao_bot_claim_reviews');return {select(){let user='';return {eq(k,v){user=v;return this;},order(){return this;},async range(){return {data:[...persisted.values()].filter(r=>r.user_id===user),error:null};}};},upsert(payload,options){assert.match(options.onConflict,/user_id.*wallet_id.*tx_hash/);return {async select(){if(fail)return {error:Error('db offline')};writes.push(payload);for(const r of payload)persisted.set(r.user_id+'|'+r.wallet_id+'|'+r.tx_hash,r);return {data:payload};}};}};}}
});
vm.runInContext(block('  const BOT_PAYOUT_SENDER=','  // Verifizierter DAO1-Referral-Kontrollfall')+block('  function dashboardRewardPeriods(','  async function loadDashboardRewardCache('),c);
await c.loadBotClaimReviews();assert.equal(c.pendingBotClaimRows(rows).length,2);assert.equal(c.pendingBotClaimRows([...rows,rows[0]]).length,2);assert.equal(c.separateBotPayoutFlows(row('a','tx1'),[flow('b','tx1')]).length,0);
c.botClaimReviewHtml(rows);allow=false;await c.decideBotClaimReview('a','confirmed');assert.equal(writes.length,0);
allow=true;fail=true;await c.decideBotClaimReview('a','confirmed');assert.equal(c.isConfirmedSeparateBotClaim(rows[0]),false);assert.match(alerts.at(-1),/nicht gespeichert/);
fail=false;c.botClaimReviewHtml(rows);rows.push(row('a','later'));flows.push(flow('a','later'));
await c.decideBotClaimReview('a','confirmed');assert.equal(writes.at(-1).length,1);assert.equal(c.isConfirmedSeparateBotClaim(rows[0]),true);assert.equal(c.isConfirmedSeparateBotClaim(rows.at(-1)),false);assert.equal(c.isConfirmedSeparateBotClaim(row('b','tx1')),false);
c.botClaimReviewHtml(rows);await c.decideBotClaimReview('b','ignored');assert.equal(c.isConfirmedSeparateBotClaim(rows[1]),false);assert.deepEqual(Array.from(c.pendingBotClaimRows(rows),r=>r.tx_hash),['later']);
await c.loadBotClaimReviews({force:true});assert.equal(c.isConfirmedSeparateBotClaim(rows[0]),true);assert.equal(c.pendingBotClaimRows(rows).length,1);
const allFlows=flows.slice();c.transactionAssetFlows=[flow('b','tx2')];const totals=c.dashboardRewardPeriods(rows,allFlows);assert.equal(totals.rewards.total[0].amount,464.27938142);assert.equal(totals.referralRewards.total.length,0);assert.equal(totals.pendingBotClaimWallets[0].walletId,'a');
uid='user2';await c.loadBotClaimReviews();assert.equal(c.isConfirmedSeparateBotClaim(rows[0],allFlows),false);
assert.match(source,/name:"Nicht zugeordnet"/);const app=fs.readFileSync('js/app.js','utf8');assert.match(app,/"pendingBotClaimWallets"/);assert.match(app,/DAO1Project.openBotClaimReview/);
const sql=fs.readFileSync('sql/091-dao-bot-claim-reviews.sql','utf8');assert.match(sql,/enable row level security/);assert.match(sql,/revoke all.*public, anon, authenticated/);assert.match(sql,/references public.project_transactions[\s\S]*on delete cascade/);assert.match(sql,/user_id = auth.uid\(\)/);assert.doesNotMatch(sql,/grant.*to anon/);
console.log('PASS strict token/sender/wallet filter, dedup, cancel, errors, frozen batch, reload, user isolation, dashboard totals, unassigned NFT, actions and SQL RLS/cascades');
// Execute the real payout reader and claim renderer, including the unassigned NFT filter.
uid='user1';await c.loadBotClaimReviews();c.transactionAssetFlows=allFlows;c.transactionRows=rows;
c.incomingAssetFlowsForTx=r=>allFlows.filter(f=>f.wallet_id===r.wallet_id&&f.tx_hash===r.tx_hash&&f.direction==='eingang');
vm.runInContext(block('  function claimPayoutEntriesForTx(','  // Prelaunch')+block('  function transactionClaimDescriptor(','  function isDidReferralRow(')+block('  function botClaimPayoutSummary(','  function referralPayoutSummary('),c);
allFlows.push(flow('a','tx1',{token_address:'other',token_symbol:'OTHER',amount:999}));
assert.equal(c.claimPayoutEntriesForTx(rows[0]).length,1,'confirmed review cannot count unrelated incoming assets');
const node={innerHTML:''};Object.assign(c,{document:{getElementById:()=>node},claimFilterWallet:'__all',claimFilterNft:'__unassigned',isNewMinerClaimSelector:()=>false,tabWalletFilteredRows:r=>r,isDidReferralRow:()=>false,isClaimTxRow:r=>c.isConfirmedSeparateBotClaim(r)||r.selector==='0x86bb8f37',isWrappedAptmSymbol:s=>String(s).toLowerCase()==='waptm',isPrelaunchClaimPayout:()=>false,tabWalletFilterHtml:()=>'',claimNftFilterHtml:()=>'',payoutSummaryCardHtml:()=>'',claimGasHistoricalUsd:()=>null,claimPayoutHistoricalUsdHtml:()=>'-',fmt:String,usd:String});
vm.runInContext(block('  function renderClaimsTab(){','  let dao1TeamTreeMode='),c);c.renderClaimsTab();
assert.match(node.innerHTML,/Nicht zugeordnet/);assert.match(node.innerHTML,/Miner-Nachzahlung \(bestätigt\)/);assert.match(node.innerHTML,/232\.13969071/);assert.match(node.innerHTML,/Als Bot-Claims bestätigen/);assert.match(node.innerHTML,/Ignorieren, kein Bot-Claim/);assert.match(node.innerHTML,/\/tx\/tx1/);assert.doesNotMatch(node.innerHTML,/\/tx\/tx2/,'ignored payment excluded');
console.log('PASS actual claim renderer: confirmation label, amount/TX, unassigned filter, review buttons, ignored exclusion and unrelated-asset guard');
