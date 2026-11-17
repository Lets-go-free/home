import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'

const sql=readFileSync(new URL('../supabase/migrations/20261117112925_dao_historical_existing_claim_flows_889.sql',import.meta.url),'utf8')
const edge=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8')
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
const ui=readFileSync(new URL('../admin/dao-historical-flow-commit-889.js',import.meta.url),'utf8')
const route=edge.split("if(['admin-historical-flow-preview-886','admin-historical-flow-commit-889'].includes(body?.mode)){ ")[1]??
 edge.split("if(['admin-historical-flow-preview-886','admin-historical-flow-commit-889'].includes(body?.mode)){")[1]?.split('// 8.63/8.65:')[0]

test('8.89 commits only native flows for pre-existing canonical claims',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.wallettracking_dao_commit_historical_existing_flows_889/)
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/)
 assert.match(sql,/BETWEEN 1 AND 3/)
 assert.match(sql,/pg_advisory_xact_lock/)
 assert.match(sql,/v_expected IS DISTINCT FROM v_submitted/)
 assert.match(sql,/project_nft_claims n[\s\S]*FOR SHARE/)
 assert.match(sql,/abs\(v_amount-v_claim\.reward_aptm\)>0\.000000000001/)
 assert.match(sql,/EXISTS\(SELECT 1 FROM public\.project_transaction_asset_flows f/)
 assert.match(sql,/INSERT INTO public\.project_transaction_asset_flows/)
 assert.match(sql,/UPDATE public\.dao_reward_claim_candidates c/)
 assert.doesNotMatch(sql,/INSERT INTO public\.project_nft_claims|UPDATE public\.project_nft_claims|UPDATE public\.project_transactions|INSERT INTO public\.aptm_price_anchors/)
 assert.match(sql,/REVOKE ALL ON FUNCTION.*wallettracking_dao_commit_historical_existing_flows_889/)
 assert.match(sql,/TO service_role/)
})

test('8.89 Edge path freshly repeats all strict proofs before RPC, under admin authentication',()=>{
 assert.ok(route)
 assert.match(route,/authenticateInspectAdmin\(request\)/)
 assert.match(route,/DAO_REWARD_ENABLE_LIVE_WORKER/)
 assert.match(route,/COMMIT-3-HISTORICAL-FLOWS/)
 assert.match(route,/historicalNftOwnership\(/)
 assert.match(route,/verifyLegacyNativeMint866\(/)
 assert.match(route,/assessHistoricalRawAmount886\(/)
 assert.match(route,/results\.some\(/)
 assert.match(route,/wallettracking_dao_commit_historical_existing_flows_889/)
 assert.match(route,/claimsCreated:0/)
})

test('8.90 requires explicit confirmation before running the guarded commit loop',()=>{
 assert.match(html,/id="daoHistoricalFlowCommitPanel889"/)
 assert.match(html,/dao-historical-flow-commit-889\.js/)
 assert.match(html,/window\.APP_VERSION="8\.90"/)
 assert.match(ui,/confirm\(/)
 assert.match(ui,/COMMIT-3-HISTORICAL-FLOWS/)
 assert.match(ui,/commitDaoHistoricalFlows889/)
 assert.match(ui,/commitAllDaoHistoricalFlows890/)
 assert.match(ui,/stopDaoHistoricalFlowCommit890/)
 assert.match(ui,/remaining>0&&!stopRequested/)
})

test('8.90 sequentially commits 161 as 53 groups of 3 plus one of 2, no automatic retry',async()=>{
 const ids=['daoHistoricalFlowCommit889','daoHistoricalFlowCommitAll890','daoHistoricalFlowStop890',
  'daoHistoricalFlowCommitResult889','daoHistoricalFlowCommitStatus889'];
 const dom=new Map(ids.map(id=>[id,{disabled:false,textContent:'',style:{}}]));
 let remaining=161,calls=0,failOn=null;
 const memory=new Map();
 const context={isSecureContext:true,navigator:{onLine:true},isAdmin:true,currentUser:{id:'admin'},
  confirm:()=>true,document:{getElementById:id=>dom.get(id)},
  sessionStorage:{getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)},
  sb:{auth:{getSession:async()=>({data:{session:{access_token:'jwt'}}})},functions:{invoke:async(_name,{body})=>{
   assert.equal(body.confirmation,'COMMIT-3-HISTORICAL-FLOWS')
   calls++;
   if(calls===failOn)return {error:{message:'network response unknown'}};
   const n=Math.min(3,remaining),before=remaining;remaining-=n;
   return {data:{ok:true,mode:body.mode,walletId:'e8b5c835-0db2-4449-bbee-258e28b42bbb',
    status:'committed',totalBefore:before,flowsCreated:n,verified:n,claimsCreated:0,
    results:Array.from({length:n},(_,i)=>({status:'flow_committed',
     txHash:'0x'+(calls*3+i).toString(16).padStart(64,'0'),amountRaw:'123'}))}}
  }}}}
 context.window=context;vm.createContext(context);vm.runInContext(ui,context);
 await context.commitAllDaoHistoricalFlows890();
 assert.equal(calls,54);assert.equal(remaining,0);
 assert.match(dom.get('daoHistoricalFlowCommitStatus889').textContent,/Abgeschlossen/);
 assert.equal(dom.get('daoHistoricalFlowCommitAll890').disabled,false);
 remaining=161;calls=0;failOn=3;
 await context.commitAllDaoHistoricalFlows890();
 assert.equal(calls,3);assert.equal(remaining,155);
 assert.match(dom.get('daoHistoricalFlowCommitStatus889').textContent,/gestoppt/);
})
