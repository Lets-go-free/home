// Optional PostgreSQL execution test: npm install @electric-sql/pglite.
// WT_PGLITE_MODULE may point to an isolated dependency installation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
let PGlite;try{({PGlite}=await import(process.env.WT_PGLITE_MODULE||'@electric-sql/pglite'))}catch{}
const dir=new URL('../supabase/migrations/',import.meta.url);
const migration=readFileSync(new URL(readdirSync(dir).find(n=>n.endsWith('_dao_no_payout_evidence_802.sql')),dir),'utf8');
test('SQL executes idempotently; incomplete evidence rejected, revalidation, history, CAS and verified protection', {skip:!PGlite},async()=>{
 const db=new PGlite();
 try{
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE TABLE public.dao_reward_claim_candidates (
 user_id uuid,wallet_id uuid,project_key text DEFAULT 'dao1',chain_key text DEFAULT 'apertum',tx_hash text,
 claim_block bigint,status text DEFAULT 'pending',payout_status text DEFAULT 'pending',payout_checked_at timestamptz,
 canonical_existing_verified boolean DEFAULT false,payout_reason text,payout_token_address text,payout_amount_raw text,
 payout_token_decimals integer,payout_flow_count integer,PRIMARY KEY(user_id,wallet_id,chain_key,tx_hash));
 CREATE TABLE public.project_transaction_asset_flows(user_id uuid,wallet_id uuid,project_key text,chain_key text,
 tx_hash text,direction text,amount_raw text);`);
 await db.exec(migration);await db.exec(migration);
 const user='00000000-0000-0000-0000-000000000001',wallet='00000000-0000-0000-0000-000000000002',tx='0x'+'a'.repeat(64);
 await db.query('INSERT INTO dao_reward_claim_candidates(user_id,wallet_id,tx_hash,claim_block) VALUES ($1,$2,$3,403915)',[user,wallet,tx]);
 const coverage={source:'blockscout-tx-v1',complete:true,transaction:true,token_transfers:true,internal_transactions:true,observed_incoming:false,tx_hash:tx,block_number:403915};
 const row=async()=> (await db.query('SELECT * FROM dao_reward_claim_candidates')).rows[0];
 const save=async(status,checkedAt=null,cov=coverage)=> (await db.query(
  'SELECT wallettracking_dao_record_payout_check($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11) AS applied',
  [user,wallet,tx,checkedAt,status,'test-evidence',JSON.stringify(cov),status==='verified'?'native':null,status==='verified'?'1':null,status==='verified'?18:null,status==='verified'?1:null])).rows[0].applied;
 await assert.rejects(()=>save('no_payout_evidence',null,{complete:true}));
 assert.equal((await row()).payout_status,'pending');
 assert.equal(await save('no_payout_evidence'),true);
 let current=await row();assert.equal(current.payout_status,'no_payout_evidence');assert.equal(current.payout_amount_raw,null);
 assert.equal(current.status,'pending');assert.equal(current.canonical_existing_verified,false);
 assert.equal(await save('needs_review'),false); // stale writer
 assert.equal(await save('needs_review',current.payout_checked_at,{complete:false}),true);
 // DB-side conflict guard catches new positive incoming evidence, independently of the worker.
 await db.query('INSERT INTO project_transaction_asset_flows VALUES ($1,$2,\'dao1\',\'apertum\',$3,\'eingang\',\'1\')',[user,wallet,tx]);
 assert.equal(await save('no_payout_evidence',(await row()).payout_checked_at),false);
 await db.exec('DELETE FROM project_transaction_asset_flows');
 for(let i=0;i<12;i++)assert.equal(await save('no_payout_evidence',(await row()).payout_checked_at),true);
 current=await row();assert.equal(current.payout_check_history.length,10);
 assert.equal(current.payout_check_history.at(-1).status,'no_payout_evidence');
 assert.equal(await save('verified',current.payout_checked_at,{source:'persisted-flows-v1',complete:false}),true);
 current=await row();assert.equal(current.payout_amount_raw,'1');
 assert.equal(await save('needs_review',current.payout_checked_at),false);
 assert.equal((await row()).payout_status,'verified');
 const rights=await db.query(`SELECT has_function_privilege('authenticated',
 'public.wallettracking_dao_record_payout_check(uuid,uuid,text,timestamptz,text,text,jsonb,text,text,integer,integer)','EXECUTE') AS allowed`);
 assert.equal(rights.rows[0].allowed,false);
 }finally{await db.close()}
});
