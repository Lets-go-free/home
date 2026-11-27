import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;?$/gm,'');
const user='00000000-0000-4000-8000-000000000001';
const walletId='00000000-0000-4000-8000-000000000002';
const wallet='0x'+'a'.repeat(40);
const other='0x'+'b'.repeat(40);
const master=Buffer.alloc(32,7), encoder=new TextEncoder();
const key=await webcrypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:encoder.encode('wallet-tracking/private-data/hkdf-salt/v1'),info:encoder.encode(`wallet-tracking:user:${user}:key-version:1`)},await webcrypto.subtle.importKey('raw',master,'HKDF',false,['deriveKey']),{name:'AES-GCM',length:256},false,['encrypt']);
const iv=Buffer.alloc(12,3), aad=encoder.encode(`wallet-tracking|enc=1|key=1|user=${user}|record=${walletId}|field=wallets.evm_address_ciphertext`);
const encrypted=`wt1.k1.${iv.toString('base64url')}.${Buffer.from(await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},key,encoder.encode(wallet))).toString('base64url')}`;
const token='0x'+'e'.repeat(40), listed='0x'+'f'.repeat(40);
const transfer=(id,bn,contract=token)=>({uniqueId:id,hash:'0x'+id.slice(-1).repeat(64),blockNum:'0x'+bn.toString(16),from:other,to:wallet,rawContract:{address:contract,value:'0x1',decimal:18},asset:'UNLISTED',value:1,metadata:{blockTimestamp:'2024-01-01T00:00:00Z'}});
const row={user_id:user,wallet_id:walletId,project_key:'tln_vow',chain_key:'bsc',cache_key:'erc20-history-v1',scanner_version:'erc20-raw-v1',complete_from_block:0,last_scanned_block:90,payload:[],updated_at:'2026-11-24T08:00:00.000Z'};
const tables={wallets:[{id:walletId,user_id:user,evm_address_ciphertext:encrypted,encryption_version:1,key_version:1}],tln_vow_staking_scan_cache:[{user_id:user,wallet_id:walletId,project_key:'tln_vow',chain_key:'bsc',cache_key:'verified-discovery-results'},row],tln_vow_identity_global_cache:[],tln_vow_smartnode_graph_cache:[],predefined_tokens:[{chain:'bsc',defi_project_key:'tln_vow',address:listed,enabled:true,historical_only:false,tln_vow_category:'tln_vow_token'}]};
let queries=[], scenario="normal";
let handler,writes=0,updates=0,conflicts=0,forceConflict=false,failRpc=false, rejectAbove=Infinity;
const clone=x=>JSON.parse(JSON.stringify(x));
const query=(name,action,payload)=>{
 const filters=[];
 const q={
  not:()=>q,eq:(k,v)=>{filters.push(r=>r[k]===v);return q},ilike:(k,v)=>{filters.push(r=>String(r[k]||'').toLowerCase()===v.toLowerCase());return q},
  or:()=>q,order:()=>q,
  range:async(a,b)=>({data:tables[name].filter(r=>filters.every(f=>f(r))).slice(a,b+1).map(clone),error:null}),
  limit:async(n)=>({data:tables[name].filter(r=>filters.every(f=>f(r))).slice(0,n).map(clone),error:null}),
  maybeSingle:async()=>({data:clone(tables[name].find(r=>filters.every(f=>f(r)))||null),error:null}),
  select:(cols)=> action==='select'?q: (async()=>{
   writes++;
   if(action==='insert'){
     if(tables[name].some(r=>r.cache_key===payload.cache_key&&r.wallet_id===payload.wallet_id))return {data:null,error:{code:'23505'}};
     tables[name].push(clone(payload));return {data:[{wallet_id:payload.wallet_id}],error:null};
   }
   if(forceConflict){forceConflict=false;row.updated_at='2026-11-24T08:05:00.000Z';row.payload.push({...transfer('id9',40),_direction:'in'});row.last_scanned_block=94;}
   const index=tables[name].findIndex(r=>filters.every(f=>f(r)));
   if(index<0){conflicts++;return {data:[],error:null}}
   updates++;tables[name][index]=clone(payload);return {data:[{wallet_id:payload.wallet_id}],error:null};
  })()
 };
 return q;
};
const db={from:(name)=>({select:()=>query(name,'select'),update:payload=>query(name,'update',payload),insert:payload=>query(name,'insert',payload)})};
const fetch=async (_url,req)=>{
 const body=JSON.parse(req.body);
 if(Array.isArray(body))return {ok:true,json:async()=>body.map(c=>({id:c.id,result:'0x0'}))};
 if(body.method==='alchemy_getAssetTransfers'){
   if(failRpc)return {ok:false,status:503,json:async()=>({})};
   const incoming=Boolean(body.params[0].toAddress),range=body.params[0];
   if(Number(BigInt(range.toBlock))-Number(BigInt(range.fromBlock))+1>rejectAbove)return {ok:false,status:413,json:async()=>({})};
   queries.push(range);
   const list=scenario==='empty'?[]:incoming?[{...transfer('id2',120),category:'erc20'}]:[];
   if(scenario==='bad')return {ok:true,json:async()=>({result:{transfers:[],pageKey:'unexpected'}})};
   if(scenario==='contradiction'&&incoming)list[0].blockNum='0x20';
   if(scenario==='prefix-conflict'&&incoming&&Number(BigInt(range.toBlock))===119)list[0].blockNum='0x64';
   if(scenario==='boundary-missing'&&range.fromBlock===range.toBlock)list.length=0;
   const filtered=list.filter(t=>BigInt(t.blockNum)>=BigInt(range.fromBlock)&&BigInt(t.blockNum)<=BigInt(range.toBlock));
   return {ok:true,json:async()=>({result:{transfers:filtered,...(filtered.length?{pageKey:'next'}:{})}})};
 }
 return {ok:true,json:async()=>({result:'0x30d40'})};
};
const ctx={fetch,Deno:{env:{get:k=>({SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'service',TLN_REWARD_CRON_SECRET:'secret',ALCHEMY_API_KEY:'test_key',WALLET_ENCRYPTION_MASTER_KEY_V1:master.toString('hex')})[k]},serve:f=>handler=f},createClient:()=>db,crypto:webcrypto,TextEncoder,TextDecoder,atob,Response,Request,Date,Intl,Number,BigInt,AbortController,setTimeout,clearTimeout,JSON,Map,Set,Object,console};
vm.runInNewContext(source,ctx);
const call=async(body)=>{const response=await handler(new Request('https://test.invalid',{method:'POST',headers:{'x-tln-reward-secret':'secret'},body:JSON.stringify({mode:'encrypted-wallet-scan-guarded-stage-preview',...body})}));return {status:response.status,value:await response.json()}};
const mode='encrypted-wallet-scan-empty-prefix-preview';
let r=await call({mode});
assert.equal(r.status,200);assert.equal(r.value.selectedWallets,1);assert.equal(r.value.results[0].providerPrefixConfirmed,true);assert.equal(r.value.results[0].prefixEmpty,true);assert.equal(r.value.results[0].boundaryMatches,true);assert.equal(r.value.cursorAdvanceAuthorized,false);assert.equal(r.value.historicalScanCoverageVerified,false);assert.equal(queries.length,6);
assert.equal(queries.filter(q=>q.toBlock==='0x77'&&q.fromBlock==='0x0').length,2);assert.equal(queries.filter(q=>q.toBlock==='0x78'&&q.fromBlock==='0x78').length,2);
for(const [scenarioName,expected] of [['prefix-conflict',false],['boundary-missing',false],['contradiction',false],['empty',false]]){scenario=scenarioName;r=await call({mode});assert.equal(r.status,200);assert.equal(r.value.results[0].providerPrefixConfirmed,expected);assert.equal(r.value.cursorAdvanceAuthorized,false);}
scenario='bad';r=await call({mode});assert.equal(r.status,503);failRpc=true;r=await call({mode});assert.equal(r.status,503);failRpc=false;
for(const extra of [{commit:true},{walletId},{fromBlock:1}]){r=await call({mode,...extra});assert.equal(r.status,400);}
assert.equal(writes,0);assert.equal(row.last_scanned_block,90);assert.equal(JSON.stringify(r.value).includes(wallet),false);console.log('10.24 empty prefix mocked integration tests passed');
