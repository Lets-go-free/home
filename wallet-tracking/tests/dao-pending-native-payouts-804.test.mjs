import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
let PGlite;try{({PGlite}=await import(process.env.WT_PGLITE_MODULE||'@electric-sql/pglite'))}catch{}
const dir=new URL('../supabase/migrations/',import.meta.url);
const migration=suffix=>readFileSync(new URL(readdirSync(dir).find(n=>n.endsWith(suffix)),dir),'utf8');
const user='00000000-0000-0000-0000-000000000001',wallet='00000000-0000-0000-0000-000000000002';
const other='00000000-0000-0000-0000-000000000003';
const tx=i=>'0x'+i.toString(16).padStart(64,'0');
test('bounded native payout SQL, including unpriced early rewards', {skip:!PGlite},async t=>{
 const db=new PGlite();
 try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
 CREATE SCHEMA auth;CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT current_setting('request.jwt.claim.role',true) $$;
 SELECT set_config('request.jwt.claim.role','service_role',false);
 CREATE TABLE public.wallets(id uuid,user_id uuid);
 CREATE TABLE public.dao_reward_claim_candidates(
  user_id uuid,wallet_id uuid,project_key text DEFAULT 'dao1',chain_key text DEFAULT 'apertum',
  tx_hash text,claim_block bigint,status text DEFAULT 'pending',audit_classification text,
  payout_status text DEFAULT 'pending',payout_checked_at timestamptz,canonical_existing_verified boolean DEFAULT false,
  payout_reason text,payout_token_address text,payout_amount_raw text,payout_token_decimals integer,payout_flow_count integer,
  PRIMARY KEY(user_id,wallet_id,chain_key,tx_hash));
 CREATE TABLE public.project_transactions(user_id uuid,wallet_id uuid,project_key text,chain_key text,
  tx_hash text,block_number bigint,selector text,status text,to_address text,claim_reward_aptm numeric,claim_reward_usd numeric);
 CREATE TABLE public.project_transaction_asset_flows(user_id uuid,wallet_id uuid,project_key text,chain_key text,
  tx_hash text,block_number bigint,direction text,flow_key text,token_address text,token_decimals integer,amount_raw text);
 INSERT INTO public.wallets VALUES ('${wallet}','${user}');`);
 await db.exec(migration('_dao_no_payout_evidence_802.sql'));
 await db.exec(migration('_dao_pending_native_payout_checks_804.sql'));
 await db.exec(migration('_dao_pending_native_payout_checks_804.sql')); // repeat DDL
 async function reset(){await db.exec('TRUNCATE dao_reward_claim_candidates,project_transactions,project_transaction_asset_flows');}
 async function seed(i=1,block=60731,amount='4.650944472418587',raw='4650944472418587000'){
  await db.query(`INSERT INTO dao_reward_claim_candidates(user_id,wallet_id,tx_hash,claim_block,audit_classification)
   VALUES($1,$2,$3,$4,'unpriced_before_exact_anchor')`,[user,wallet,tx(i),block]);
  await db.query(`INSERT INTO project_transactions VALUES($1,$2,'dao1','apertum',$3,$4,'0x86bb8f37','ok',$5,$6,NULL)`,
   [user,wallet,tx(i),block,'0x'+'2'.repeat(40),amount]);
  await db.query(`INSERT INTO project_transaction_asset_flows VALUES($1,$2,'dao1','apertum',$3,$4,'eingang',$5,'native',18,$6)`,
   [user,wallet,tx(i),block,'claim-native:'+tx(i),raw]);
 }
 const run=async(u=user,w=wallet,limit=4)=>(await db.query('SELECT public.wallettracking_dao_check_pending_native_payouts($1,$2,$3) AS result',[u,w,limit])).rows[0].result;
 const row=async()=> (await db.query('SELECT * FROM dao_reward_claim_candidates ORDER BY claim_block')).rows;
 await t.test('all four early unpriced payouts verify without changing USD, amount, audit or ownership',async()=>{
  await reset();for(const [i,block] of [60731,72665,81698,81700].entries())
   await seed(i+1,block,i<2?'4.650944472418587':'4.031915382788697',i<2?'4650944472418587000':'4031915382788697000');
  const before=(await db.query('SELECT * FROM project_transactions')).rows;
  const flowsBefore=(await db.query('SELECT * FROM project_transaction_asset_flows')).rows;
  const result=await run();assert.equal(result.checked,4);assert.equal(result.verifiedPayoutClaims,4);assert.equal(result.pendingPayoutChecks,0);
  assert.deepEqual((await db.query('SELECT * FROM project_transactions')).rows,before);
  assert.deepEqual((await db.query('SELECT * FROM project_transaction_asset_flows')).rows,flowsBefore);
  for(const c of await row()){
   assert.equal(c.payout_status,'verified');assert.equal(c.audit_classification,'unpriced_before_exact_anchor');
   assert.equal(c.canonical_existing_verified,false);assert.equal(c.status,'pending');
   assert.equal(c.payout_token_decimals,18);assert.equal(c.payout_amount_raw,Number(c.claim_block)<80000?'4650944472418587000':'4031915382788697000');
   assert.equal(c.payout_check_history.length,1);assert.equal(c.payout_coverage.canonical_amount_matched,true);
   assert.equal(c.payout_coverage.complete,false); // positive existence is not full tx coverage
  }
  const checkedTimes=(await row()).map(c=>c.payout_checked_at);
  const repeat=await run();assert.equal(repeat.checked,0);assert.equal(repeat.verifiedPayoutClaims,0);
  assert.deepEqual((await row()).map(c=>c.payout_checked_at),checkedTimes);
 });
 await t.test('exact decimal tolerance accepts historical JS rounding, rejects larger mismatch',async()=>{
  for(const [raw,expected] of [['4650944472418587561','verified'],['4650944472418588000','verified'],['4650944472418588001','needs_review']]){
   await reset();await seed(1,60731,'4.650944472418587',raw);await run();assert.equal((await row())[0].payout_status,expected);
  }
 });
 await t.test('missing, corrupt, duplicate or mixed flows never verify',async()=>{
  for(const change of [
   'DELETE FROM project_transaction_asset_flows',
   "UPDATE project_transaction_asset_flows SET amount_raw='invalid'",
   "UPDATE project_transaction_asset_flows SET token_decimals=6",
   'UPDATE project_transaction_asset_flows SET block_number=1',
   'INSERT INTO project_transaction_asset_flows SELECT * FROM project_transaction_asset_flows',
   "INSERT INTO project_transaction_asset_flows SELECT user_id,wallet_id,project_key,chain_key,tx_hash,block_number,'eingang','other-token','0x' || repeat('3',40),18,'1' FROM project_transaction_asset_flows"
  ]){
   await reset();await seed();await db.exec(change);const result=await run();
   assert.equal(result.verifiedPayoutClaims,0);assert.equal((await row())[0].payout_status,'needs_review');
  }
 });
 await t.test('failed or mismatched transaction, nonpositive/invalid canonical amounts stay reviewable',async()=>{
  for(const change of ["UPDATE project_transactions SET status='error'","UPDATE project_transactions SET block_number=1",
   "UPDATE project_transactions SET selector='0x00000000'","UPDATE project_transactions SET claim_reward_aptm=0",
   "UPDATE project_transactions SET claim_reward_aptm='NaN'",'DELETE FROM project_transactions',
   'INSERT INTO project_transactions SELECT * FROM project_transactions']){
   await reset();await seed();await db.exec(change);assert.equal((await run()).verifiedPayoutClaims,0);
  }
 });
 await t.test('new Miner Claim requires canonical contract and remains independent of USD',async()=>{
  for(const [contract,expected] of [['0x'+'2'.repeat(40),0],['0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d',1]]){
   await reset();await seed();await db.query("UPDATE project_transactions SET selector='0x19da4078',to_address=$1",[contract]);
   assert.equal((await run()).verifiedPayoutClaims,expected);
  }
 });
 await t.test('four-item budget leaves pending backlog; canonical, negative, verified and other-user candidates excluded',async()=>{
  await reset();for(let i=1;i<=5;i++)await seed(i,60730+i);
  await seed(6,60736);await db.exec("UPDATE dao_reward_claim_candidates SET canonical_existing_verified=true WHERE claim_block=60736");
  await db.query('INSERT INTO dao_reward_claim_candidates(user_id,wallet_id,tx_hash,claim_block) VALUES($1,$2,$3,1)',[other,wallet,tx(10)]);
  const first=await run();assert.equal(first.checked,4);assert.equal(first.pendingPayoutChecks,1);
  const second=await run();assert.equal(second.checked,1);assert.equal(second.pendingPayoutChecks,0);
  const untouched=(await row()).filter(c=>c.user_id===other||c.canonical_existing_verified);
  assert.ok(untouched.every(c=>c.payout_status==='pending'&&c.payout_check_history.length===0));
 });
 await t.test('no-payout rows stay untouched by positive-only pass',async()=>{
  await reset();await seed();await db.exec("DELETE FROM project_transaction_asset_flows");
  const coverage={source:'blockscout-tx-v1',complete:true,transaction:true,token_transfers:true,internal_transactions:true,observed_incoming:false,tx_hash:tx(1),block_number:60731};
  await db.query("SELECT wallettracking_dao_record_payout_check($1,$2,$3,NULL,'no_payout_evidence','fixture',$4::jsonb,NULL,NULL,NULL,NULL)",[user,wallet,tx(1),JSON.stringify(coverage)]);
  assert.equal((await run()).checked,0);assert.equal((await row())[0].payout_status,'no_payout_evidence');
 });
 await t.test('a mid-batch persistence failure rolls back prior candidate writes and logs',async()=>{
  await reset();await seed(1,60731);await seed(2,72665);
  await db.exec(`CREATE FUNCTION public.reject_second_fixture() RETURNS trigger LANGUAGE plpgsql AS $$
   BEGIN IF NEW.claim_block=72665 THEN RAISE EXCEPTION 'simulated write failure';END IF;RETURN NEW;END $$;
   CREATE TRIGGER reject_second BEFORE UPDATE ON public.dao_reward_claim_candidates
   FOR EACH ROW EXECUTE FUNCTION public.reject_second_fixture();`);
  await assert.rejects(()=>run());
  for(const c of await row()){
   assert.equal(c.payout_status,'pending');assert.equal(c.payout_checked_at,null);assert.equal(c.payout_check_history.length,0);
  }
  await db.exec('DROP TRIGGER reject_second ON public.dao_reward_claim_candidates;DROP FUNCTION public.reject_second_fixture()');
 });
 await t.test('service role, wallet ownership and batch bounds enforced; browser execution denied',async()=>{
  await assert.rejects(()=>run(user,wallet,5));await assert.rejects(()=>run(other,wallet));
  await db.exec("SELECT set_config('request.jwt.claim.role','authenticated',false)");await assert.rejects(()=>run());
  await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
  const rights=await db.query("SELECT has_function_privilege('authenticated','public.wallettracking_dao_check_pending_native_payouts(uuid,uuid,integer)','EXECUTE') AS allowed");
  assert.equal(rights.rows[0].allowed,false);
 });
 }finally{await db.close()}
});
