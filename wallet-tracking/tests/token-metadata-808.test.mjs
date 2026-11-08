import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';import {stripTypeScriptTypes} from 'node:module';import vm from 'node:vm';
const root=new URL('../',import.meta.url),provider=readFileSync(new URL('supabase/functions/token-metadata/metadata.ts',root),'utf8');
const context=vm.createContext({URL,TextDecoder,Uint8Array});vm.runInContext(stripTypeScriptTypes(provider).replaceAll('export ',''),context);
const {technicalDecimals,metadataAddress,providerMetadata}=context;
const token='0x'+'a'.repeat(40),other='0x'+'b'.repeat(40),word=n=>'0x'+BigInt(n).toString(16).padStart(64,'0');
const chain={chain_key:'eth',wallet_type:'evm',native_symbol:'ETH',evm_chain_id:1,rpc_url:'https://example.test/rpc'};
async function inspect({c=chain,a=token,d=6,revert=false,pool=false,badChain=false,block=null,extra={}}={}){
 const requests=[];const json=async(url,options)=>{const body=JSON.parse(options.body);requests.push(body);let result;
 if(body.method==='eth_chainId')result=badChain?'0x38':'0x1';
 else{const selector=body.params[0].data;if(selector==='0x313ce567'){if(revert)return {jsonrpc:'2.0',id:808,error:{code:3,message:'execution reverted'}};result=d===null?'0x':typeof d==='string'?d:word(d)}
 else if(selector==='0x3850c7bd')result=pool?'0x'+'0'.repeat(448):'0x';
 else if(selector==='0xddca3f43')result=word(500);
 else if(selector==='0x0dfe1681')result='0x'+'0'.repeat(24)+token.slice(2);
 else if(selector==='0xd21220a7')result='0x'+'0'.repeat(24)+other.slice(2);else result='0x'}
 return {jsonrpc:'2.0',id:808,result,...extra};};
 return {result:await providerMetadata(c,a,json,block),requests};
}
test('strict technical parser preserves zero; rejects absent values, booleans, fractions, exponents and unsupported scale',()=>{
 for(const v of [0,6,18,36,'0','18'])assert.equal(technicalDecimals(v),Number(v));for(const v of [null,undefined,true,false,'','018','1e1',-1,37,1.2,NaN])assert.equal(technicalDecimals(v),null);
});
test('only EVM addresses are lowercased; Solana and Tron case is preserved',()=>{
 assert.equal(metadataAddress(chain,'0x'+'A'.repeat(40)),token);
 for(const wallet_type of ['sol','tron']){const a=wallet_type==='sol'?'So11111111111111111111111111111111111111112':'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';assert.equal(metadataAddress({wallet_type},a),a)}
 assert.throws(()=>metadataAddress({wallet_type:'sol'},token));
});
test('EVM exact ABI decimals and matching chain, optional historical tag, no default 18',async()=>{
 for(const d of [0,6,18,36]){const x=await inspect({d,block:123});assert.equal(x.result.decimals,d);assert.equal(x.result.source,'evm-decimals-call');assert.equal(x.requests[1].params[1],'0x7b')}
 for(const options of [{d:37},{d:'0x6'},{badChain:true},{extra:{id:1}},{extra:{jsonrpc:'1.0'}}])await assert.rejects(inspect(options));
});
test('V3 pool exemption requires absent/reverting decimals AND multi-method on-chain pool evidence',async()=>{
 for(const revert of [false,true]){const x=await inspect({d:null,pool:true,revert});assert.equal(x.result.status,'not_applicable');assert.equal(x.result.decimals,null);assert.equal(x.result.kind,'v3_pool')}
 await assert.rejects(inspect({d:null,pool:false}));
 const x=await inspect({d:18,pool:true});assert.equal(x.result.kind,'erc20');
});
test('Apertum uses Explorer contract metadata first, contradicting contract/type blocks, no symbol inference',async()=>{
 for(const decimals of ['0','18']){const x=await providerMetadata({...chain,chain_key:'apertum'},token,async()=>({address_hash:token,type:'ERC-20',decimals,symbol:'ANY'}));assert.equal(x.decimals,Number(decimals));assert.equal(x.source,'apertum-explorer-token-metadata')}
 for(const response of [{address_hash:other,decimals:'18'},{address_hash:token,type:'ERC-721',decimals:'18'}])await assert.rejects(providerMetadata({...chain,chain_key:'apertum'},token,async()=>response));
});
test('native AKT uses explicit protocol units; unknown native protocols cannot inherit EVM 18',async()=>{
 const r=await providerMetadata({chain_key:'akash',wallet_type:'akash',native_symbol:'AKT'},'native',async()=>assert.fail('no network'));assert.equal(r.decimals,6);assert.equal(r.source,'native-protocol-units');
 await assert.rejects(providerMetadata({...chain,chain_key:'future-chain'},'native',async()=>({})));await assert.rejects(providerMetadata({...chain,native_symbol:'OTHER'},'native',async()=>({})));
});
test('Solana requires an initialized mint owned by a recognized token program, preserves zero decimals',async()=>{
 const mint='So11111111111111111111111111111111111111112',base={owner:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',executable:false,data:{parsed:{type:'mint',info:{decimals:0,isInitialized:true}}}};
 const call=async value=>providerMetadata({wallet_type:'sol',rpc_url:chain.rpc_url},mint,async()=>({jsonrpc:'2.0',id:808,result:{value}}));
 assert.equal((await call(base)).decimals,0);
 for(const v of [{...base,owner:'other'},{...base,executable:true},{...base,data:{parsed:{type:'account',info:{decimals:6}}}},{...base,data:{parsed:{type:'mint',info:{decimals:null,isInitialized:true}}}},null])await assert.rejects(call(v));
});
test('Tron decimals come from successful constant call with visible Base58 addresses; null/error cannot imply 6',async()=>{
 const address='TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',requests=[];
 const run=async value=>providerMetadata({wallet_type:'tron',balance_api_base:'https://api.test'},address,async(u,o)=>{requests.push(JSON.parse(o.body));return value});
 const r=await run({result:{result:true},constant_result:[word(6).slice(2)]});assert.equal(r.decimals,6);assert.equal(requests[0].visible,true);assert.equal(requests[0].contract_address,address);
 for(const value of [{result:{result:false},constant_result:[word(6)]},{result:{result:true},constant_result:['6']},{result:{result:true},constant_result:[word(37)]}])await assert.rejects(run(value));
});
test('Cosmos denomination exponent requires matching base and display unit, no micro-unit guess',async()=>{
 const c={wallet_type:'akash',balance_api_base:'https://rest.test'},metadata={base:'uakt',display:'akt',symbol:'AKT',denom_units:[{denom:'uakt',exponent:0},{denom:'akt',exponent:6}]};
 assert.equal((await providerMetadata(c,'uakt',async()=>({metadata}))).decimals,6);
 await assert.rejects(providerMetadata(c,'uatom',async()=>({metadata})));await assert.rejects(providerMetadata(c,'uakt',async()=>({metadata:{...metadata,denom_units:[]}})));
});
let PGlite;try{({PGlite}=await import(process.env.WT_PGLITE_MODULE||'@electric-sql/pglite'))}catch{}
const migrations=new URL('supabase/migrations/',root),migration=readFileSync(new URL(readdirSync(migrations).find(x=>x.endsWith('_cross_chain_token_metadata_808.sql')),migrations),'utf8');
test('PostgreSQL central metadata and private preferences: migration replay, fill-only, conflicts, pools, bounded history, user isolation',{skip:!PGlite},async t=>{
 const db=new PGlite(),u='00000000-0000-0000-0000-000000000001',u2='00000000-0000-0000-0000-000000000002';
 try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT current_setting('request.jwt.claim.role',true)$$;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE TABLE chains(chain_key text PRIMARY KEY,wallet_type text);INSERT INTO chains VALUES('eth','evm'),('bsc','evm'),('sol','sol'),('tron','tron'),('akash','akash');
 CREATE TABLE predefined_tokens(chain text,address text,decimals integer,decimals_status text DEFAULT 'unverified',decimals_source text,decimals_observed integer,decimals_checked_at timestamptz,symbol text,name text,label text,display_decimals smallint,summary_decimals smallint,PRIMARY KEY(chain,address));
 CREATE TABLE safe_tokens(id uuid PRIMARY KEY,user_id uuid,chain text,address text,label text,created_at timestamptz DEFAULT now());ALTER TABLE safe_tokens ENABLE ROW LEVEL SECURITY;
 CREATE POLICY own_safe ON safe_tokens FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());GRANT ALL ON safe_tokens TO authenticated;GRANT USAGE ON SCHEMA auth TO authenticated;
 SELECT set_config('request.jwt.claim.role','service_role',false);`);
 await db.exec(migration);await db.exec(migration);
 const record=async(chain,address,o)=>(await db.query('SELECT wallettracking_record_token_metadata($1,$2,$3::jsonb) result',[chain,address,JSON.stringify(o)])).rows[0].result;
 const observation=d=>({status:'verified',decimals:d,source:'evm-decimals-call',kind:'erc20',symbol:'TEST',name:'Provider name'});
 await t.test('fills only NULL, retains personal/global display digits and names; exact chain key and case normalization',async()=>{
  await db.query("INSERT INTO predefined_tokens(chain,address,display_decimals,summary_decimals,label) VALUES('eth',$1,2,1,'My name')",['0x'+'A'.repeat(40)]);
  let m=await record('eth',token,observation(6));assert.equal(m.decimals,6);assert.equal(m.status,'verified');
  const p=(await db.query('SELECT * FROM predefined_tokens')).rows[0];assert.equal(p.decimals,6);assert.equal(p.label,'My name');assert.equal(p.name,'Provider name');assert.equal(p.display_decimals,2);assert.equal(p.summary_decimals,1);
  m=await record('bsc',token,observation(18));assert.equal(m.decimals,18);assert.equal((await db.query('SELECT count(*) n FROM wallettracking_internal.token_metadata')).rows[0].n,2);
 });
 await t.test('new and existing conflicts are sticky, original values retained, invalid observations rejected',async()=>{
  const m=await record('eth',token,observation(18));assert.equal(m.status,'conflict');assert.equal(m.decimals,6);assert.equal(m.observed_decimals,18);assert.equal((await record('eth',token,observation(6))).status,'conflict');
  for(const d of [null,true,'6',37])await assert.rejects(record('eth',other,observation(d)));
  await assert.rejects(record('eth',other,{...observation(6),source:'browser-input'}));
 });
 await t.test('valid V3 pools stay NULL/not_applicable; contradictory token proof becomes conflict',async()=>{
  const pool='0x'+'c'.repeat(40);await db.query("INSERT INTO predefined_tokens(chain,address,display_decimals) VALUES('eth',$1,6)",[pool]);
  let m=await record('eth',pool,{status:'not_applicable',decimals:null,kind:'v3_pool',source:'evm-v3-pool-probe'});assert.equal(m.status,'not_applicable');assert.equal(m.decimals,null);
  assert.equal((await db.query('SELECT decimals_status FROM predefined_tokens WHERE address=$1',[pool])).rows[0].decimals_status,'not_applicable');
  m=await record('eth',pool,observation(18));assert.equal(m.status,'conflict');
 });
 await t.test('provider failure preserves prior verified cache and history is bounded to ten',async()=>{
  const address='0x'+'d'.repeat(40);await record('eth',address,observation(0));
  const r=await record('eth',address,{status:'unavailable',decimals:null,kind:'unknown',source:'provider-unavailable',reason:'provider-http-unavailable'});assert.equal(r.status,'verified');assert.equal(r.decimals,0);assert.equal(r.refreshFailed,true);
  for(let i=0;i<12;i++)await record('eth',address,observation(0));const h=(await db.query('SELECT jsonb_array_length(history) n FROM wallettracking_internal.token_metadata WHERE address=$1',[address])).rows[0].n;assert.equal(h,10);
 });
 await t.test('private custom list cache lookup is strictly current-user scoped; display updates cannot cross users',async()=>{
  await db.query("INSERT INTO safe_tokens(id,user_id,chain,address,label) VALUES($1,$1,'bsc',$3,'Owner one'),($2,$2,'bsc',$3,'Owner two')",[u,u2,token]);
  await db.exec(`SELECT set_config('request.jwt.claim.role','authenticated',false);SELECT set_config('request.jwt.claim.sub','${u}',false);SET ROLE authenticated;`);
  const own=(await db.query('SELECT wallettracking_list_own_safe_tokens() result')).rows[0].result;assert.equal(own.length,1);assert.equal(own[0].label,'Owner one');assert.equal(own[0].technical_decimals,18);
  await db.query('UPDATE safe_tokens SET display_decimals=3 WHERE id=$1',[u]);const denied=await db.query('UPDATE safe_tokens SET display_decimals=9 WHERE id=$1',[u2]);assert.equal(denied.affectedRows,0);
  await assert.rejects(db.query('UPDATE safe_tokens SET summary_decimals=19 WHERE id=$1',[u]));
  await assert.rejects(db.query('SELECT * FROM wallettracking_internal.token_metadata'));
  await assert.rejects(db.query('SELECT wallettracking_get_token_metadata($1,$2)',['eth',token]));
  await db.exec("RESET ROLE;SELECT set_config('request.jwt.claim.role','service_role',false)");
  assert.equal((await db.query('SELECT display_decimals FROM safe_tokens WHERE id=$1',[u2])).rows[0].display_decimals,null);
 });
 await t.test('batch merges only public definitions and requesting user safe list; bounded continuation and no labels',async()=>{
  await db.query("INSERT INTO safe_tokens(id,user_id,chain,address,label) VALUES('00000000-0000-0000-0000-000000000003',$1,'sol','So11111111111111111111111111111111111111112','Secret')",[u2]);
  const batch=async(user,after='',own=false)=>(await db.query('SELECT wallettracking_token_metadata_batch($1,$2,$3) result',[user,after,own])).rows[0].result;
  let list=await batch(u);assert.ok(list.every(x=>!('label'in x)&&x.chain!=='sol'));const own=await batch(u,'',true);assert.equal(own.length,1);assert.equal(own[0].chain,'bsc');
  for(let i=1;i<=20;i++)await db.query("INSERT INTO predefined_tokens(chain,address,display_decimals) VALUES('bsc',$1,6)",['0x'+i.toString(16).padStart(40,'0')]);
  list=await batch(u);assert.equal(list.length,13);const next=await batch(u,list[11].key);assert.ok(next.length>0);assert.ok(next.every(x=>x.key>list[11].key));
 });
 }finally{await db.close()}
});
