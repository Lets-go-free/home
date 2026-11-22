import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../projects/tln-vow/tln-vow-discovery.js',import.meta.url),'utf8');
const start=source.indexOf('function projectReferralRowsForPayload(');
const end=source.indexOf('function projectDashboardRewardPeriods(',start);
assert.ok(start>0&&end>start);
const wallet='0x'+'a'.repeat(40),sender='0x'+'b'.repeat(40),hash='0x'+'c'.repeat(64);
const token='0x29280091fa7f3abe4739ad5f1f7c5287feaf7736';
const ledger=new Map([[wallet,[{tx_hash:hash,token_address:token,
  wallet_net_raw:'250000000000000000000',amount_raw:'300000000000000000000',
  block_timestamp:'2024-12-14T16:33:53.000Z',partner_wallet:sender,referral_level:2,
  staking_contract:'0x'+'e'.repeat(40)}]]]);
const decimals=new Map([[token,18]]);
const ctx={PROJECT_REFERRAL_LEDGER:ledger,PROJECT_REFERRAL_DECIMALS:decimals,
  norm:s=>String(s||'').toLowerCase(),projectTokenSymbol:()=> 'TLN+',
  projectReferralMintHumanAmount:m=>m.netRaw!=null?Number(BigInt(m.netRaw))/1e18:Number(m.amount||0),
  Date,Map,Number,Array,String,Set};
vm.runInNewContext(source.slice(start,end)+'\nthis.getRows=projectReferralRowsForPayload;',ctx);
const snapshot={globals:{claimReferenceResult:{strong:[]}}};
let rows=ctx.getRows(snapshot,wallet);
assert.equal(rows.length,1);
assert.equal(rows[0].automaticVerified,true);
assert.equal(rows[0].mint.amountHuman,250);
assert.equal(rows[0].timestamp,1734194033);
assert.equal(rows[0].staking.label,'Verifizierter Staking-Contract');
const existing={globals:{claimReferenceResult:{strong:[{hash,
  timestamp:1734194033,sender,mints:[{token,amount:250,decimals:18}]}]}}};
rows=ctx.getRows(existing,wallet);
assert.equal(rows.length,1);
assert.equal(rows[0].automaticVerified,undefined);
assert.equal(ctx.getRows({},wallet).length,1);
assert.equal(ctx.getRows({globals:{claimReferenceResult:{tokenTotals:{[token]:{total:250}}}}},wallet).length,0);
assert.equal(ctx.getRows({},'0x'+'d'.repeat(40)).length,0);
const sql=fs.readFileSync(new URL('../supabase/migrations/20261122215505_tln_vow_referral_block_timestamp_969.sql',import.meta.url),'utf8');
assert.ok(sql.includes('block_timestamp timestamptz'));
assert.ok(sql.includes('wallet_net_raw text'));
assert.ok(sql.includes('staking_contract text'));
const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
assert.ok(edge.includes("method:'eth_getBlockByNumber'"));
assert.ok(edge.includes('wallet_net_raw:net.toString()'));
console.log('9.69 referrer ledger UI de-dup, historic timestamp and wallet net-amount');
