import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';import vm from 'node:vm';import {stripTypeScriptTypes} from 'node:module';
const root=new URL('../',import.meta.url),src=readFileSync(new URL('supabase/functions/dao-reward-refresh/index.ts',root),'utf8');
const token='0x110ac02ba3384bc055c13a87766049a74517beda',policy=readFileSync(new URL('supabase/functions/dao-reward-refresh/asset-policy.js',root),'utf8');
const helper=src.slice(src.indexOf('async function resolveCentralTokenDecimals('),src.indexOf('// Controlled one-claim path:'));
async function resolve({rows=[{decimals:null,decimals_status:'unverified'}],metadata={decimals:'18',address_hash:token,type:'ERC-20'},refresh=false,block=null,rpcDecimals=null,http=true,write=null}={}){
 const calls={fetch:0,rpc:0,writes:[]};const ctx={EXPLORER:'https://example.test',lower:v=>String(v||'').toLowerCase(),AbortController,setTimeout,clearTimeout,
  sb:{from:()=>({select(){return this},eq(){return this},ilike(){return this},limit:async()=>({data:rows})}),rpc:async(name,p)=>{calls.writes.push({name,p});return {data:write||{decimals:p.p_decimals,status:'verified'}}}},
  rpcClaimTokenDecimals:async()=>{calls.rpc++;return {token,decimals:rpcDecimals,source:'eth_call-decimals-at-claim-block'}},
  fetch:async()=>{calls.fetch++;return {ok:http,json:async()=>metadata}}};
 vm.createContext(ctx);vm.runInContext(policy,ctx);vm.runInContext(stripTypeScriptTypes(helper),ctx);
 return {result:await ctx.resolveCentralTokenDecimals(token,block,refresh),calls};
}
test('central cached technical decimals including zero need neither Explorer nor per-claim RPC',async()=>{
 for(const decimals of [0,6,18,36]){const {result,calls}=await resolve({rows:[{decimals,decimals_status:'verified'}],block:100});assert.equal(result.decimals,decimals);assert.equal(result.source,'central-predefined-token-decimals');assert.equal(calls.fetch,0);assert.equal(calls.rpc,0);assert.equal(calls.writes.length,0);}
});
test('Explorer fills a central NULL and records authoritative source; no claimed historical RPC proof',async()=>{
 const {result,calls}=await resolve();assert.equal(result.decimals,18);assert.equal(result.source,'apertum-explorer-token-metadata');assert.equal(calls.fetch,1);assert.equal(calls.rpc,0);assert.equal(calls.writes[0].p.p_decimals,18);
});
test('strict decimals never convert NULL, booleans, empty strings or fractions to zero/18',async()=>{
 for(const decimals of [null,undefined,'',true,'1.2',-1,37,'018']){const {result,calls}=await resolve({metadata:{decimals}});assert.equal(result.decimals,null);assert.equal(calls.writes.length,0);}
});
test('Explorer contract/type mismatch blocks; missing metadata uses historical RPC only when a claim block exists',async()=>{
 for(const metadata of [{decimals:'18',address_hash:'0x'+'a'.repeat(40)},{decimals:'18',type:'ERC-721'}]){const {result,calls}=await resolve({metadata,block:100,rpcDecimals:18});assert.equal(result.decimals,null);assert.equal(calls.rpc,0);assert.equal(calls.writes.length,0);}
 const {result,calls}=await resolve({http:false,block:100,rpcDecimals:6});assert.equal(result.decimals,6);assert.equal(calls.rpc,1);assert.equal(calls.writes[0].p.p_source,'eth_call-decimals-at-claim-block');
});
test('conflict is sticky and blocks automatic refresh; newly observed conflict never returned as usable',async()=>{
 let x=await resolve({rows:[{decimals:18,decimals_status:'conflict'}],refresh:true});assert.equal(x.result.decimals,null);assert.equal(x.calls.fetch,0);
 x=await resolve({rows:[{decimals:18}],refresh:true,metadata:{decimals:'6'},write:{decimals:null,status:'conflict'}});assert.equal(x.result.decimals,null);assert.equal(x.calls.writes.length,1);
});
test('unregistered custom metadata is usable transiently without creating global master rows; duplicate contracts block',async()=>{
 let x=await resolve({rows:[]});assert.equal(x.result.decimals,18);assert.equal(x.result.persisted,false);assert.equal(x.calls.writes.length,0);
 x=await resolve({rows:[{},{}]});assert.equal(x.result.decimals,null);assert.equal(x.calls.fetch,0);
});
const route=src.slice(src.indexOf(" if(body?.mode==='resolve-apertum-token-decimals'"),src.indexOf(" if(body?.mode==='inspect-test-wallet')"));
test('browser metadata requires validated user JWT; batch also requires admin/test flag and worker off',async()=>{
 for(const [mode,header,session,permission,enabled,live,status] of [
 ['resolve-apertum-token-decimals','',{}, {ok:true},'true','false',401],
 ['resolve-apertum-token-decimals','Bearer bad',{}, {ok:true},'true','false',401],
 ['resolve-apertum-token-decimals','Bearer good',{user:{id:'u'}},{ok:true},'false','false',200],
 ['refresh-apertum-token-decimals','Bearer good',{user:{id:'u'}},{ok:true},'false','false',403],
 ['refresh-apertum-token-decimals','Bearer good',{user:{id:'u'}},{ok:true},'true','true',409],
 ['refresh-apertum-token-decimals','Bearer good',{user:{id:'u'}},{ok:false,status:403,error:'Admin required'},'true','false',403]
 ]){
 const calls=[];const ctx={body:{mode,token,decimals:3,source:'untrusted'},request:{headers:new Headers({authorization:header})},Response,metadataCors:{},
  Deno:{env:{get:k=>k==='DAO_REWARD_ENABLE_TEST_IMPORT'?enabled:live}},authenticateInspectAdmin:async()=>permission,
  sb:{auth:{getUser:async()=>({data:session})}},resolveCentralTokenDecimals:async(...args)=>{calls.push(args);return {decimals:18}}};
 const response=await vm.runInNewContext(stripTypeScriptTypes('(async()=>{'+route+'})()'),ctx);assert.equal(response.status,status);if(status===200)assert.deepEqual(calls,[[token]]);else assert.equal(calls.length,0);
 }
});
let PGlite;try{({PGlite}=await import(process.env.WT_PGLITE_MODULE||'@electric-sql/pglite'))}catch{}
const dir=new URL('supabase/migrations/',root),migration=s=>readFileSync(new URL(readdirSync(dir).find(n=>n.endsWith(s)),dir),'utf8');
test('PostgreSQL central metadata: fill-only, preserve display/summary, row locks, conflict, grants and canonical finalizer',{skip:!PGlite},async()=>{
 const db=new PGlite();try{
 const fixture=readFileSync(new URL('tests/dao-erc20-pipeline-806.test.mjs',root),'utf8');
 const schema=fixture.slice(fixture.indexOf(' await db.exec(`')+16,fixture.indexOf('`);\n await db.exec(migration'));
 const user='00000000-0000-0000-0000-000000000001',wallet='00000000-0000-0000-0000-000000000002';
 await db.exec(schema.replaceAll('${wallet}',wallet).replaceAll('${user}',user));
 await db.exec('CREATE TABLE predefined_tokens(chain text,address text,decimals integer,display_decimals smallint,summary_decimals smallint,PRIMARY KEY(chain,address));');
 await db.exec(migration('_dao_no_payout_evidence_802.sql'));await db.exec(migration('_dao_single_native_claim_pipeline_805.sql'));await db.exec(migration('_dao_erc20_single_claim_pipeline_806.sql'));
 await db.exec(migration('_apertum_central_token_decimals_807.sql'));await db.exec(migration('_apertum_central_token_decimals_807.sql'));
 await db.query("INSERT INTO predefined_tokens VALUES('apertum',$1,NULL,4,2,NULL,NULL,NULL,'unverified')",[token]);
 const record=async(d,source='apertum-explorer-token-metadata')=>(await db.query('SELECT wallettracking_record_apertum_token_decimals($1,$2,$3) result',[token,d,source])).rows[0].result;
 assert.equal((await record(0)).decimals,0);assert.equal((await record(0)).status,'verified');assert.equal((await record(6)).decimals,null);assert.equal((await record(0)).status,'conflict');
 const row=(await db.query('SELECT * FROM predefined_tokens')).rows[0];assert.equal(row.decimals,0);assert.equal(row.display_decimals,4);assert.equal(row.summary_decimals,2);
 await assert.rejects(record(37));await assert.rejects(record(18,'browser-input'));
 const missing=(await db.query("SELECT wallettracking_record_apertum_token_decimals($1,18,'apertum-explorer-token-metadata') result",['0x'+'9'.repeat(40)])).rows[0].result;assert.equal(missing.decimals,null);
 const blocked=(await db.query("SELECT wallettracking_dao_finalize_single_claim_with_metadata($1,$2,$3,$4,0,1,true,'central-predefined-token-decimals') result",[user,wallet,'0x'+'a'.repeat(64),token])).rows[0].result;
 assert.equal(blocked.reason,'central-technical-decimals-unavailable');
 const stable='0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f',tx='0x'+'b'.repeat(64),miner='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d';
 await db.query("INSERT INTO predefined_tokens(chain,address,decimals,display_decimals,summary_decimals,decimals_status) VALUES('apertum',$1,6,2,2,'verified')",[stable]);
 await db.query("INSERT INTO dao_reward_claim_candidates(user_id,wallet_id,tx_hash,claim_block,payout_status,payout_token_address,payout_token_decimals,payout_amount_raw,payout_flow_count) VALUES($1,$2,$3,16000000,'verified',$4,6,'1234567',1)",[user,wallet,tx,stable]);
 await db.query("INSERT INTO project_transactions(user_id,wallet_id,project_key,chain_key,tx_hash,block_number,tx_timestamp,selector,status,to_address,gas_aptm) VALUES($1,$2,'dao1','apertum',$3,16000000,now(),'0x19da4078','ok',$4,0.001)",[user,wallet,tx,miner]);
 await db.query("INSERT INTO project_transaction_asset_flows(user_id,wallet_id,project_key,chain_key,tx_hash,flow_key,block_number,direction,token_address,token_decimals,amount_raw,amount,token_symbol,counterparty_address,log_index) VALUES($1,$2,'dao1','apertum',$3,$4,16000000,'eingang',$5,6,'1234567',1.234567,'wUSDT',$6,0)",[user,wallet,tx,`${tx}|${stable}|0|eingang|1234567`,stable,miner]);
 const finish=async()=>(await db.query("SELECT wallettracking_dao_finalize_single_claim_with_metadata($1,$2,$3,$4,6,1,true,'central-predefined-token-decimals') result",[user,wallet,tx,stable])).rows[0].result;
 assert.equal((await finish()).claimsCreated,1);assert.equal((await finish()).claimsCreated,0);
 const evidence=(await db.query('SELECT claim_pipeline_asset_evidence FROM dao_reward_claim_candidates WHERE tx_hash=$1',[tx])).rows[0].claim_pipeline_asset_evidence;assert.equal(evidence.source,'central-predefined-token-decimals');
 const reward=(await db.query('SELECT reward_asset_amount FROM project_nft_claims')).rows[0];assert.equal(reward.reward_asset_amount,'1.234567');
 await db.exec("SELECT set_config('request.jwt.claim.role','authenticated',false)");await assert.rejects(record(0),/Service role/);
 const privileges=(await db.query("SELECT has_function_privilege('authenticated','wallettracking_record_apertum_token_decimals(text,integer,text)','EXECUTE') allowed")).rows[0];assert.equal(privileges.allowed,false);
 }finally{await db.close()}
});
test('browser uses central zero and deduplicates concurrent metadata fills, rejects conflicts and unknown scales',async()=>{
 const app=readFileSync(new URL('js/app.js',root),'utf8'),part=app.slice(app.indexOf('const tokenTechnicalInflight='),app.indexOf('async function taxTokenDecimalsCurrent('));
 const ctx={predefinedTokenDecimals:{['apertum|'+token]:0},predefinedTokenDecimalStatuses:{},window:{},normalizeAddress:(a)=>a.toLowerCase(),sb:{functions:{invoke:async()=>({data:{ok:true,status:'verified',decimals:6}})}}};
 vm.createContext(ctx);vm.runInContext(policy,ctx);ctx.window.WTDaoAssetPolicy=ctx.WTDaoAssetPolicy;vm.runInContext(part,ctx);
 assert.equal(await ctx.resolveApertumTokenDecimals(token),0);delete ctx.predefinedTokenDecimals['apertum|'+token];
 let count=0;ctx.sb.functions.invoke=async()=>{count++;return {data:{ok:true,status:'verified',decimals:6}}};
 const results=await Promise.all([ctx.resolveApertumTokenDecimals(token),ctx.resolveApertumTokenDecimals(token)]);assert.deepEqual(results,[6,6]);assert.equal(count,1);
 ctx.predefinedTokenDecimalStatuses['apertum|'+token]='conflict';await assert.rejects(ctx.resolveApertumTokenDecimals(token),/widersprüchlich/);
 delete ctx.predefinedTokenDecimalStatuses['apertum|'+token];delete ctx.predefinedTokenDecimals['apertum|'+token];ctx.sb.functions.invoke=async()=>({data:{ok:true,status:'verified',decimals:null}});await assert.rejects(ctx.resolveApertumTokenDecimals(token),/Ungültige|fehlen/);
});
test('admin refresh checks at most 20 catalog contracts with continuation, ignores caller-supplied technical values',async()=>{
 const addresses=Array.from({length:23},(_,i)=>({address:'0x'+(i+1).toString(16).padStart(40,'0')})),calls=[];
 const ctx={body:{mode:'refresh-apertum-token-decimals',decimals:7,source:'untrusted'},request:{},Response,metadataCors:{},lower:v=>String(v||'').toLowerCase(),
 Deno:{env:{get:k=>k==='DAO_REWARD_ENABLE_TEST_IMPORT'?'true':'false'}},authenticateInspectAdmin:async()=>({ok:true}),
 sb:{from:()=>({select(){return this},eq(){return this},order:async()=>({data:addresses})})},
 resolveCentralTokenDecimals:async(...args)=>{calls.push(args);return {token:args[0],decimals:18}}};
 const run=async()=>await(await vm.runInNewContext(stripTypeScriptTypes('(async()=>{'+route+'})()'),ctx)).json();
 let data=await run();assert.equal(data.checked,20);assert.equal(calls.length,20);assert.equal(data.nextAfter,addresses[19].address);assert.ok(calls.every(c=>c[1]===null&&c[2]===true));
 ctx.body.after=data.nextAfter;data=await run();assert.equal(data.checked,3);assert.equal(data.nextAfter,null);
});
