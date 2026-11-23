import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const user='00000000-0000-4000-8000-000000000001';
const wallets=['00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003'];
const addresses=['0x'+'a'.repeat(40),'0x'+'b'.repeat(40)];
const master=Buffer.alloc(32,7);
const encoder=new TextEncoder();
const key=await webcrypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:encoder.encode('wallet-tracking/private-data/hkdf-salt/v1'),info:encoder.encode(`wallet-tracking:user:${user}:key-version:1`)},await webcrypto.subtle.importKey('raw',master,'HKDF',false,['deriveKey']),{name:'AES-GCM',length:256},false,['encrypt']);
const encrypted=await Promise.all(wallets.map(async(id,i)=>{
 const iv=Buffer.alloc(12,i+2);
 const aad=encoder.encode(`wallet-tracking|enc=1|key=1|user=${user}|record=${id}|field=wallets.evm_address_ciphertext`);
 const cipher=Buffer.from(await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},key,encoder.encode(addresses[i])));
 return {id,user_id:user,evm_address_ciphertext:`wt1.k1.${iv.toString('base64url')}.${cipher.toString('base64url')}`,encryption_version:1,key_version:1};
}));
const tables={wallets:encrypted,tln_vow_staking_scan_cache:[{user_id:user,wallet_id:wallets[0],project_key:'tln_vow',chain_key:'bsc',cache_key:'verified-discovery-results'}],tln_vow_identity_global_cache:[],tln_vow_smartnode_graph_cache:[],predefined_tokens:[{chain:'bsc',defi_project_key:'tln_vow',address:'0x'+'f'.repeat(40),enabled:true,historical_only:false,tln_vow_category:'tln_vow_token'}]};
let handler;let writes=0;
const queryCounts={};
const db={from:(name)=>({select:()=>{
 const filters=[];
 const q={
   not:()=>q,
   eq:(column,value)=>{filters.push(row=>row[column]===value);return q},
   ilike:(column,value)=>{filters.push(row=>String(row[column]||'').toLowerCase()===value.toLowerCase());return q},
   or:(expr)=>{const [left,right]=expr.split(','); const [a,opA,vA]=left.split('.');const [b,opB,vB]=right.split('.');
     assert.equal(opA,'ilike');assert.equal(opB,'ilike');
     filters.push(row=>String(row[a]||'').toLowerCase()===vA.toLowerCase()||String(row[b]||'').toLowerCase()===vB.toLowerCase());return q},
   order:()=>q,
   limit:async(n)=>{queryCounts[name]=(queryCounts[name]||0)+1;return {data:tables[name].filter(row=>filters.every(fn=>fn(row))).slice(0,n),error:null}},
   range:async(start,end)=>{queryCounts[name]=(queryCounts[name]||0)+1;return {data:tables[name].filter(row=>filters.every(fn=>fn(row))).slice(start,end+1),error:null}}
 };return q;
 },insert:()=>{writes++;throw Error('Unexpected write')}})};
tables.tln_vow_staking_scan_cache.push({user_id:user,wallet_id:wallets[0],project_key:'tln_vow',chain_key:'bsc',cache_key:'erc20-history-v1',scanner_version:'erc20-raw-v1',complete_from_block:0,last_scanned_block:90,payload:[]});
let rpcFail=false;
const fetch=async (_url,req)=>{const batch=JSON.parse(req.body);return {ok:true,json:async()=>Array.isArray(batch)?batch.map(call=>({id:call.id,result:rpcFail?'invalid':'0x'+(call.params[0].data.endsWith('b'.repeat(40))?'1':'0')})):{id:1,result:'0x64'}}};
const ctx={fetch,Deno:{env:{get:key=>({SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'service',TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'test_key',WALLET_ENCRYPTION_MASTER_KEY_V1:master.toString('hex')})[key]},serve:f=>handler=f},createClient:()=>db,crypto:webcrypto,TextEncoder,TextDecoder,atob,Response,Request,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console};
vm.runInNewContext(source,ctx);
async function query(mode='encrypted-wallet-scan-start-audit-preview'){const response=await handler(new Request('https://test.invalid',{method:'POST',headers:{'x-tln-reward-secret':'secret'},body:JSON.stringify({mode})}));return {response,value:await response.json()}}
let {response,value}=await query();
assert.equal(response.status,200);
assert.equal(value.encryptedEvmWallets,2);
assert.equal(value.totalProjectRelevantWallets,2);
assert.equal(value.scanCoverageRelevantWalletsChecked,2);
assert.equal(value.scanCoverageMissingRawCache,1);
assert.equal(value.scanCoveragePartialOrUnverifiedRange,1);
assert.equal(value.scanCoverageGenesisToHeadRanges,0);
assert.equal(value.scanStartAuditExecuted,true);
assert.equal(value.manualErc20InitialStartBlock,0);
assert.equal(value.manualErc20ResumeOverlapBlocks,24);
assert.equal(value.scanRangesStartingAtGenesis,1);
assert.equal(value.scanRangesStartingAfterGenesis,0);
assert.equal(value.scanRangesBehindChainHead,1);
assert.equal(value.scanRangesAtChainHead,0);
assert.equal(value.scanMaxHeadLagBlocks,10);
assert.equal(value.scanCoverageClassificationComplete,true);
assert.equal(value.historicalScanCoverageVerified,false);
assert.equal(value.canEnableWritingCron,false);
assert.equal(value.persisted,false);
assert.equal(writes,0);
assert.equal(JSON.stringify(value).includes(user),false);
assert.equal(JSON.stringify(value).includes(addresses[0]),false);
// A genesis-to-current-head cache is a range claim, not proof of all reward streams.
tables.tln_vow_staking_scan_cache[1].last_scanned_block=100;
({response,value}=await query());
assert.equal(value.scanCoverageGenesisToHeadRanges,1);
assert.equal(value.scanRangesAtChainHead,1);
assert.equal(value.scanRangesBehindChainHead,0);
// A cache starting after genesis is never treated as a full historical range.
tables.tln_vow_staking_scan_cache[1].complete_from_block=20;
({response,value}=await query());
assert.equal(value.scanRangesStartingAfterGenesis,1);
assert.equal(value.scanCoverageGenesisToHeadRanges,0);
tables.tln_vow_staking_scan_cache[1].complete_from_block=0;
assert.equal(value.historicalScanCoverageVerified,false);
// Malformed cache is not silently classified as complete.
tables.tln_vow_staking_scan_cache[1].payload={};
({response,value}=await query());
assert.equal(value.scanCoverageInvalidRawCache,1);
assert.equal(value.scanCoverageMissingRawCache,1);
assert.equal(value.canEnableWritingCron,false);
// Original coverage mode stays backward-compatible.
({response,value}=await query('encrypted-wallet-coverage-preview'));
assert.equal(response.status,200);
assert.equal(value.scanCoverageAuditExecuted,undefined);
assert.equal(writes,0);
console.log('9.82: genesis/nonzero start, head lag, missing, invalid, no writes, compatibility passed');
