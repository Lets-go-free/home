// WalletTracking 9.24 – structural proof-gap diagnostic for legacy TLN/VOW snapshots.
// Same wallet-scoped alchemy_getAssetTransfers API as manual discovery; NO reward/cursor/cache writes or cron.
// Deploy only for a protected staging inspection. This is NOT a reward worker.
import { createClient } from 'npm:@supabase/supabase-js@^2'
// BEGIN GENERATED TLN VERIFICATION CORE – regenerate using tools/build-tln-reward-edge.mjs
// WalletTracking 9.17 – pure shared TLN/VOW verification rules.
// Classic browser script AND Deno side-effect import: no browser, network or DB dependencies.
// The "done" workflow flags are deliberately NOT a substitute for these verdicts.
(function(root){
  'use strict';
  function nonnegativeInteger(v){return typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:null}
  function rewardCoverageVerdict(input){
    const normal=nonnegativeInteger(input?.normal);
    const assigned=nonnegativeInteger(input?.assigned);
    const unassigned=nonnegativeInteger(input?.unassigned);
    if(normal===null||assigned===null||unassigned===null||assigned>normal)
      return {verified:false,reason:'missing-or-invalid-coverage',normal,assigned,unassigned};
    return {verified:assigned===normal&&unassigned===0,
      reason:assigned!==normal?'missing-reward-assignment':unassigned!==0?'unassigned-claims':'complete',
      normal,assigned,unassigned};
  }
  function referralVerdict(input){
    if(input?.error)return {verified:false,reason:'reference-engine-error'};
    if(input?.completed!==true)return {verified:false,reason:'reference-engine-not-completed'};
    if(!Number.isSafeInteger(input?.strongCount)||input.strongCount<0)
      return {verified:false,reason:'invalid-referral-count'};
    return {verified:true,reason:'reference-engine-completed',strongCount:input.strongCount};
  }
  function scanBlockEvidence(input){
    const lastEventBlock=nonnegativeInteger(input?.lastEventBlock);
    const from=nonnegativeInteger(input?.completeFromBlock);
    const to=nonnegativeInteger(input?.completeToBlock);
    const coverageVerified=from!==null&&to!==null&&to>=from&&input?.paginationComplete===true;
    return {lastEventBlock,completeFromBlock:coverageVerified?from:null,
      completeToBlock:coverageVerified?to:null,coverageVerified};
  }
  function auditSnapshot(snapshot){
    const q=snapshot?.process?.verification||{};
    const rewards=rewardCoverageVerdict(q.rewards);
    const referral=referralVerdict(q.referral);
    const b=snapshot?.blockEvidence||{};
    const blocks=scanBlockEvidence({lastEventBlock:b.lastEventBlock,
      completeFromBlock:b.completeFromBlock,completeToBlock:b.completeToBlock,
      paginationComplete:b.coverageVerified});
    return {rewards,referral,blocks,verified:rewards.verified&&referral.verified&&blocks.coverageVerified};
  }
  // Forensic-only reconstruction from historical payloads. Structural matches are
  // NOT the manual claim/bonus/referral classification and cannot certify a reward.
  function historicalRewardKey(row){
    const hash=typeof row?.hash==='string'?row.hash.toLowerCase():'';
    const token=typeof row?.token==='string'?row.token.toLowerCase():'';
    const amount=Number(row?.amount);
    return /^0x[0-9a-f]{64}$/.test(hash)&&/^0x[0-9a-f]{40}$/.test(token)&&Number.isFinite(amount)&&amount>0
      ?`${hash}|${token}|${amount.toPrecision(15)}`:null;
  }
  function legacySnapshotEvidence(snapshot){
    const lots=Array.isArray(snapshot?.process?.lots)?snapshot.process.lots:[];
    const proven=Array.isArray(snapshot?.globals?.provenRewardRows)?snapshot.globals.provenRewardRows:[];
    const ref=snapshot?.globals?.claimReferenceResult;
    const claimed=new Set();let claimsWithIdentity=0;
    for(const lot of lots)for(const claim of (Array.isArray(lot?.rewardClaims)?lot.rewardClaims:[])){
      const key=historicalRewardKey(claim);if(key){claimed.add(key);claimsWithIdentity++}
    }
    let provenWithIdentity=0,matchedClaimKeys=0;
    const uniqueProven=new Set();
    for(const row of proven){
      const key=historicalRewardKey(row);if(!key||uniqueProven.has(key))continue;
      uniqueProven.add(key);provenWithIdentity++;
      if(claimed.has(key))matchedClaimKeys++;
    }
    const referencePresent=!!ref&&typeof ref==='object';
    const referenceError=referencePresent&&!!ref.error;
    const strongCount=Array.isArray(ref?.strong)?ref.strong.length:null;
    return {lots:lots.length,provenRows:proven.length,provenWithIdentity,
      claimsWithIdentity,matchedClaimKeys,unmatchedProvenKeys:provenWithIdentity-matchedClaimKeys,
      referencePresent,referenceError,strongCount,
      scope:'Historical structural evidence only; no independent correctness or completeness verdict'};
  }
  function legacyUnmatchedProofRows(snapshot){
    const wallet=String(snapshot?.wallet||'').toLowerCase();
    const lots=Array.isArray(snapshot?.process?.lots)?snapshot.process.lots:[];
    const proven=Array.isArray(snapshot?.globals?.provenRewardRows)?snapshot.globals.provenRewardRows:[];
    const claimed=new Set(lots.flatMap(lot=>Array.isArray(lot?.rewardClaims)?lot.rewardClaims:[])
      .map(historicalRewardKey).filter(Boolean));
    const seen=new Set(),out=[];
    for(const row of proven){
      const key=historicalRewardKey(row);
      if(!key||claimed.has(key)||seen.has(key))continue;
      seen.add(key);
      const hash=String(row.hash).toLowerCase(),selector=String(row.selector||'').toLowerCase();
      out.push({hash,token:String(row.token).toLowerCase(),symbol:String(row.symbol||'').slice(0,32),
        amount:Number(row.amount),selector:/^0x[0-9a-f]{8}$/.test(selector)?selector:null,
        fromIsZero:String(row.from||'').toLowerCase()==='0x'+'0'.repeat(40),
        recipientIsWallet:!!wallet&&String(row.to||'').toLowerCase()===wallet,
        rewardProofPresent:!!row.rewardProof,rewardFlowEvidencePresent:!!row.rewardFlowEvidence,
        calledContractPresent:!!row.calledContract,
        referralStateDeltaPresent:Array.isArray(row.stateDeltaEvidence)&&row.stateDeltaEvidence.length>0,
        lotStakeTxMatch:lots.some(l=>String(l?.stakeTx||'').toLowerCase()===hash),
        lotUnstakeTxMatch:lots.some(l=>String(l?.unstakeTx||'').toLowerCase()===hash)});
    }
    return out;
  }
  function legacyStakeLifecycleEvidence(snapshot,hash,blockNumber){
    const tx=String(hash||'').toLowerCase(),targetBlock=Number(blockNumber);
    if(!/^0x[0-9a-f]{64}$/.test(tx)||!Number.isSafeInteger(targetBlock)||targetBlock<0)return null;
    const process=snapshot?.process||{};
    const lots=Array.isArray(process.lots)?process.lots:[];
    const blockOf=v=>{
      if(typeof v==='number')return Number.isSafeInteger(v)&&v>=0?v:null;
      if(typeof v!=='string'||!(/^(?:0x[0-9a-f]+|\d+)$/i).test(v))return null;
      const n=Number(v.startsWith('0x')?BigInt(v):BigInt(v));
      return Number.isSafeInteger(n)&&n>=0?n:null;
    };
    const project=(lot)=>{
      const b=blockOf(lot?.stakeBlockHex??lot?.stakeBlock);
      const stakeTx=String(lot?.stakeTx||'').toLowerCase();
      return {stakeTx:/^0x[0-9a-f]{64}$/.test(stakeTx)?stakeTx:null,
        stakeBlock:b,blockDistance:b===null?null:Math.abs(b-targetBlock),
        sameTransaction:stakeTx===tx,sameBlock:b===targetBlock,
        status:String(lot?.status||'').slice(0,32),stakeTime:String(lot?.stakeTime||'').slice(0,40),
        stakingContract:String(lot?.staking?.contract_address||lot?.counterparty||'').toLowerCase().slice(0,42),
        entryContract:String(lot?.entry_contract||'').toLowerCase().slice(0,42),
        pairSymbol:String(lot?.pair?.symbol||'').slice(0,32)};
    };
    const projected=lots.map(project);
    const calls=Array.isArray(process.contractCalls)?process.contractCalls:[];
    const stakingCalls=Array.isArray(process.stakingContractCalls)?process.stakingContractCalls:[];
    const matches=xs=>xs.filter(c=>String(c?.hash||'').toLowerCase()===tx).length;
    const nearest=[...projected].sort((a,b)=>(a.blockDistance??Number.MAX_SAFE_INTEGER)-(b.blockDistance??Number.MAX_SAFE_INTEGER)).slice(0,10);
    return {targetHash:tx,targetBlock,lotsTotal:lots.length,
      exactStakeTxLots:projected.filter(x=>x.sameTransaction).length,
      sameBlockLots:projected.filter(x=>x.sameBlock).length,
      contractCallsAtTx:matches(calls),stakingCallsAtTx:matches(stakingCalls),
      nearestLots:nearest,scope:'Cached lifecycle comparison only; no chain verification or position rewrite'};
  }
  // Shared strict selection of receipt-proven zero-address mints during a
  // storage-verified same-wallet top-up. Classification is not granted to
  // arbitrary ERC20 inflows or a top-up recorded under multiple positions.
  function verifiedTopUpMintCandidates(lots,provenRows,wallet){
    const address=String(wallet||'').toLowerCase();
    if(!/^0x[0-9a-f]{40}$/.test(address))return [];
    const zero='0x'+'0'.repeat(40),owners=new Map();
    for(let i=0;i<(lots||[]).length;i++)for(const topUp of (Array.isArray(lots[i]?.topUps)?lots[i].topUps:[])){
      const hash=String(topUp?.tx||'').toLowerCase();
      if(!/^0x[0-9a-f]{64}$/.test(hash)||topUp?.evidence!=='onchain_same_wallet_position_state'||topUp?.storageProof?.proven!==true)continue;
      if(!owners.has(hash))owners.set(hash,[]);
      owners.get(hash).push({lotIndex:i,topUp});
    }
    const out=[],seen=new Set();
    for(const row of (provenRows||[])){
      const hash=String(row?.hash||'').toLowerCase(),token=String(row?.token||'').toLowerCase();
      const amount=Number(row?.amount),matches=owners.get(hash)||[];
      if(matches.length!==1||!/^0x[0-9a-f]{40}$/.test(token)||!(Number.isFinite(amount)&&amount>0)||
        String(row?.from||'').toLowerCase()!==zero||String(row?.to||'').toLowerCase()!==address||
        !row?.rewardProof||!row?.rewardFlowEvidence)continue;
      const key=historicalRewardKey(row);
      if(!key||seen.has(key))continue;
      seen.add(key);
      out.push({lotIndex:matches[0].lotIndex,topUp:matches[0].topUp,row});
    }
    return out;
  }
  root.WT_TLN_REWARD_VERIFICATION_CORE=Object.freeze({rewardCoverageVerdict,referralVerdict,scanBlockEvidence,auditSnapshot,legacySnapshotEvidence,legacyUnmatchedProofRows,legacyStakeLifecycleEvidence,verifiedTopUpMintCandidates});
})(globalThis);
// END GENERATED TLN VERIFICATION CORE
const verificationCore=(globalThis as any).WT_TLN_REWARD_VERIFICATION_CORE
const URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const SECRET = Deno.env.get('TLN_REWARD_CRON_SECRET') || ''
const ALCHEMY_API_KEY = Deno.env.get('ALCHEMY_API_KEY') || ''
const DELTA_OVERLAP_BLOCKS = 128
// Fixed historical verification target from the independently inspected BscScan transaction.
const LEGACY_STAKE_AUDIT_HASH='0xacf7cfc506809bdb57435995267e1592cd7ce537296581a55be60e6668509131'
const LEGACY_STAKE_AUDIT_BLOCK=44871018
const MAX_DELTA_WINDOW_BLOCKS = 100_000
const DELTA_CHUNK_BLOCKS = 5_000
// Deliberately bounded; caller may request fewer blocks but never expand the range.
function previewBlockBudget(value:unknown):number|null {
  if(value===undefined || value===null) return DELTA_CHUNK_BLOCKS
  return typeof value==='number' && Number.isSafeInteger(value) && value>=1 && value<=DELTA_CHUNK_BLOCKS ? value : null
}
// RPC provider diagnostics must never expose URL paths, query keys, wallet addresses,
// tokens, or arbitrary response bodies to the caller. Keep only machine-readable codes.
class RpcDiagnosticError extends Error {
  readonly phase:string
  readonly category:string
  readonly httpStatus:number|null
  readonly rpcCode:number|null
  constructor(phase:string, category:string, httpStatus:number|null=null, rpcCode:number|null=null) {
    super(`BSC RPC ${phase}: ${category}`)
    this.phase=phase; this.category=category; this.httpStatus=httpStatus; this.rpcCode=rpcCode
  }
}
function rpcCodeOf(error:unknown):number|null {
  const code=(error as {code?:unknown}|null)?.code
  return typeof code==='number' && Number.isSafeInteger(code) ? code : null
}
function safeRpcDiagnostic(error:unknown) {
  if(error instanceof RpcDiagnosticError)
    return {phase:error.phase,category:error.category,httpStatus:error.httpStatus,rpcCode:error.rpcCode}
  return {phase:'alchemy_getAssetTransfers',category:error instanceof Error && error.name==='AbortError'?'timeout':'unexpected',httpStatus:null,rpcCode:null}
}
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
// BSC contracts already identified in the TLN/VOW application (vow trading, TLN+ and TLN GOLD).
// NOT a complete or authoritative registry of all TLN/VOW staking or reward contracts.
const SCAN_CONTRACTS = Object.freeze({
  '0xf585b5b4f22816baf7629aea55b701662630397b':'VOW',
  '0x9c23942ca2c35e06d1d20747f33705983a18d2ab':'v$',
  '0x29280091fa7f3abe4739ad5f1f7c5287feaf7736':'TLN+',
  '0xaa90a8cdab8b8e902293a2817d1d286f66cbcec5':'TLNGOLD'
})
const MAX_TRANSFER_PAGES_PER_DIRECTION = 8
const MAX_TRANSFERS_PER_DIRECTION = MAX_TRANSFER_PAGES_PER_DIRECTION * 1000
// Diagnostic probes are fixed server-side. They never accept addresses, arbitrary filters or endpoints.
// Only status/category/counts are returned. No raw logs, provider message, API key or wallet address.
const DIAGNOSTIC_PROBE_BLOCKS = 100
const DIAGNOSTIC_TIMEOUT_MS = 6500
async function rpcProbe(rpcUrl:string, method:'eth_chainId'|'eth_getLogs', params:unknown[]):Promise<{
  ok:boolean,category:string,httpStatus:number|null,rpcCode:number|null,resultCount:number|null,chainIdMatchesBsc?:boolean
}> {
  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(),DIAGNOSTIC_TIMEOUT_MS)
  try {
    const response=await fetch(rpcUrl,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,
      body:JSON.stringify({jsonrpc:'2.0',id:14,method,params})})
    if(!response.ok)return {ok:false,category:'http_error',httpStatus:response.status,rpcCode:null,resultCount:null}
    let body:any
    try {body=await response.json()}catch{return {ok:false,category:'invalid_json',httpStatus:response.status,rpcCode:null,resultCount:null}}
    if(body?.error)return {ok:false,category:'rpc_error',httpStatus:response.status,rpcCode:rpcCodeOf(body.error),resultCount:null}
    if(method==='eth_chainId'){
      const valid=typeof body?.result==='string' && /^0x[0-9a-f]+$/i.test(body.result)
      if(!valid)return {ok:false,category:'invalid_response',httpStatus:response.status,rpcCode:null,resultCount:null}
      return {ok:true,category:'ok',httpStatus:response.status,rpcCode:null,resultCount:null,chainIdMatchesBsc:body.result.toLowerCase()==='0x38'}
    }
    if(!Array.isArray(body?.result))return {ok:false,category:'invalid_response',httpStatus:response.status,rpcCode:null,resultCount:null}
    return {ok:true,category:'ok',httpStatus:response.status,rpcCode:null,resultCount:body.result.length}
  }catch(error){
    return {ok:false,category:error instanceof Error && error.name==='AbortError'?'timeout':'network_error',httpStatus:null,rpcCode:null,resultCount:null}
  }finally{clearTimeout(timer)}
}
async function rpcFilterDiagnosis(wallet:string,fromBlock:number,toBlock:number,head:number) {
  if(!ALCHEMY_API_KEY)throw new Error('BSC RPC not configured')
  const address=evmAddress(wallet)
  if(!address)throw new Error('Invalid verified snapshot wallet address')
  if(!Number.isSafeInteger(fromBlock)||!Number.isSafeInteger(toBlock)||toBlock<fromBlock||
    toBlock-fromBlock+1>DIAGNOSTIC_PROBE_BLOCKS||!Number.isSafeInteger(head)||head<toBlock)
    throw new Error('Unsafe diagnostic scan window')
  const rpcUrl=`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`
  const walletTopic='0x'+address.slice(2).padStart(64,'0')
  const contracts=Object.keys(SCAN_CONTRACTS)
  const single=contracts[0]
  const atBlock={fromBlock:hexBlock(fromBlock),toBlock:hexBlock(fromBlock)}
  const inRange={fromBlock:hexBlock(fromBlock),toBlock:hexBlock(toBlock)}
  const atHead={fromBlock:hexBlock(head),toBlock:hexBlock(head)}
  const cases:{name:string,method:'eth_chainId'|'eth_getLogs',params:unknown[]}[]=[
    {name:'network_chain_id',method:'eth_chainId',params:[]},
    {name:'historical_one_block_single_contract',method:'eth_getLogs',params:[{...atBlock,address:single,topics:[TRANSFER_TOPIC]}]},
    {name:'historical_range_single_contract',method:'eth_getLogs',params:[{...inRange,address:single,topics:[TRANSFER_TOPIC]}]},
    {name:'historical_range_contract_array',method:'eth_getLogs',params:[{...inRange,address:contracts,topics:[TRANSFER_TOPIC]}]},
    {name:'historical_range_wallet_topic',method:'eth_getLogs',params:[{...inRange,address:contracts,topics:[TRANSFER_TOPIC,null,walletTopic]}]},
    {name:'recent_one_block_single_contract',method:'eth_getLogs',params:[{...atHead,address:single,topics:[TRANSFER_TOPIC]}]}
  ]
  const probes=[]
  for(const c of cases){
    probes.push({name:c.name,...await rpcProbe(rpcUrl,c.method,c.params)})
  }
  return {probes,probeBlocks:toBlock-fromBlock+1,scope:'Read-only RPC filter compatibility tests; no reward classification or cursor progression'}
}
// Fixed, bounded compatibility check for provider block-range policy.
// All probes share the same single approved contract and Transfer topic, changing
// only the inclusive block count. No user-provided RPC URL/contract/wallet accepted.
async function rpcRangeLimitDiagnosis(fromBlock:number, head:number) {
  if(!ALCHEMY_API_KEY) throw new Error('BSC RPC not configured')
  if(!Number.isSafeInteger(fromBlock)||fromBlock<0||!Number.isSafeInteger(head)||head<fromBlock+99)
    throw new Error('Unsafe range-limit diagnostic window')
  const rpcUrl=`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`
  const single=Object.keys(SCAN_CONTRACTS)[0]
  const probeSizes=[1,2,5,10,11,100] as const
  const probes=[]
  for(const count of probeSizes){
    const filter={fromBlock:hexBlock(fromBlock),toBlock:hexBlock(fromBlock+count-1),address:single,topics:[TRANSFER_TOPIC]}
    probes.push({name:`historical_${count}_blocks`,blocks:count,...await rpcProbe(rpcUrl,'eth_getLogs',[filter])})
  }
  // Check whether the same 10-block filter works near the latest chain head.
  probes.push({name:'recent_10_blocks',blocks:10,...await rpcProbe(rpcUrl,'eth_getLogs',[{
    fromBlock:hexBlock(head-9),toBlock:hexBlock(head),address:single,topics:[TRANSFER_TOPIC]
  }])})
  return {probes,provider:'alchemy_bnb_mainnet',scope:'Read-only single-contract ERC20 Transfer range-limit diagnosis; no reward classification, writes or cursor progression'}
}
const evmAddress = (v:unknown) => typeof v==='string' && /^0x[0-9a-fA-F]{40}$/.test(v) ? v.toLowerCase() : null
const hexBlock = (n:number)=>'0x'+n.toString(16)
async function inspectWalletTransfers(wallet:string, fromBlock:number, toBlock:number, maxBlocks:number) {
  if (!ALCHEMY_API_KEY) throw new Error('BSC RPC not configured')
  const address=evmAddress(wallet)
  if(!address)throw new Error('Invalid verified snapshot wallet address')
  if(!Number.isSafeInteger(fromBlock)||!Number.isSafeInteger(toBlock)||fromBlock<0||toBlock<fromBlock||toBlock-fromBlock+1>maxBlocks||maxBlocks>DELTA_CHUNK_BLOCKS)
    throw new Error('Unsafe scan window')
  const contracts=Object.keys(SCAN_CONTRACTS)
  const byContract=new Map<string,{incoming:number,outgoing:number}>(contracts.map(c=>[c,{incoming:0,outgoing:0}]))
  const unique=new Set<string>()
  const directions=[]
  let observedTransfers=0
  const rpcUrl=`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`
  for(const direction of ['incoming','outgoing'] as const){
    let pageKey:string|null=null
    const seenKeys=new Set<string>()
    let pages=0, total=0, matched=0, complete=false
    while(pages<MAX_TRANSFER_PAGES_PER_DIRECTION){
      const controller=new AbortController()
      const timer=setTimeout(()=>controller.abort(),15000)
      try {
        const q:Record<string,unknown>={fromBlock:hexBlock(fromBlock),toBlock:hexBlock(toBlock),
          category:['erc20'],withMetadata:true,excludeZeroValue:false,maxCount:'0x3e8',
          [direction==='incoming'?'toAddress':'fromAddress']:address}
        if(pageKey)q.pageKey=pageKey
        const res=await fetch(rpcUrl,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,
          body:JSON.stringify({jsonrpc:'2.0',id:direction==='incoming'?2:3,method:'alchemy_getAssetTransfers',params:[q]})})
        if(!res.ok)throw new RpcDiagnosticError('alchemy_getAssetTransfers','http_error',res.status)
        let body:any
        try {body=await res.json()}catch{throw new RpcDiagnosticError('alchemy_getAssetTransfers','invalid_json')}
        if(body?.error)throw new RpcDiagnosticError('alchemy_getAssetTransfers','rpc_error',null,rpcCodeOf(body.error))
        if(!Array.isArray(body?.result?.transfers))throw new RpcDiagnosticError('alchemy_getAssetTransfers','invalid_response')
        pages++
        total+=body.result.transfers.length
        if(total>MAX_TRANSFERS_PER_DIRECTION)throw new RpcDiagnosticError('alchemy_getAssetTransfers','too_many_transfers')
        for(const transfer of body.result.transfers){
          const c=evmAddress(transfer?.rawContract?.address)
          const side=evmAddress(direction==='incoming'?transfer?.to:transfer?.from)
          const bn=typeof transfer?.blockNum==='string' && /^0x[0-9a-f]+$/i.test(transfer.blockNum)?Number(BigInt(transfer.blockNum)):NaN
          const tx=typeof transfer?.hash==='string' && /^0x[0-9a-f]{64}$/i.test(transfer.hash)?transfer.hash.toLowerCase():null
          if(!side||side!==address||!Number.isSafeInteger(bn)||bn<fromBlock||bn>toBlock||!tx)
            throw new RpcDiagnosticError('alchemy_getAssetTransfers','invalid_transfer')
          if(!c||!byContract.has(c))continue
          byContract.get(c)![direction]++
          unique.add(tx)
          matched++;observedTransfers++
        }
        const next=body.result.pageKey
        if(!next){complete=true;break}
        if(typeof next!=='string'||next.length>2000||seenKeys.has(next))
          throw new RpcDiagnosticError('alchemy_getAssetTransfers','invalid_pagination')
        seenKeys.add(next);pageKey=next
      }catch(error){
        if(error instanceof RpcDiagnosticError)throw error
        if(error instanceof Error && error.name==='AbortError')throw new RpcDiagnosticError('alchemy_getAssetTransfers','timeout')
        throw new RpcDiagnosticError('alchemy_getAssetTransfers','network_or_validation_failure')
      }finally{clearTimeout(timer)}
    }
    directions.push({direction,pages,totalTransfers:total,matchedKnownContracts:matched,complete})
  }
  return {provider:'alchemy_bnb_mainnet',method:'alchemy_getAssetTransfers',
    complete:directions.every(d=>d.complete),directions,events:observedTransfers,uniqueTransactions:unique.size,
    contracts:contracts.map(address=>({symbol:SCAN_CONTRACTS[address as keyof typeof SCAN_CONTRACTS],
      incoming:byContract.get(address)!.incoming,outgoing:byContract.get(address)!.outgoing})),
    scope:'Wallet-scoped ERC20 AssetTransfers for four known token contracts; not proof of a staking, referral or bonus reward'}
}
const num = (v: unknown) => { const n=Number(v); return Number.isSafeInteger(n) && n>=0 ? n : null }
async function bscHead(): Promise<number> {
  if (!ALCHEMY_API_KEY) throw new Error('BSC RPC not configured')
  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(), 8000)
  try {
    const response=await fetch(`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`,{
      method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_blockNumber',params:[]}),signal:controller.signal
    })
    if(!response.ok) throw new Error('BSC RPC HTTP failure')
    const body=await response.json()
    if(body?.error || typeof body?.result !== 'string' || !/^0x[0-9a-f]+$/i.test(body.result)) throw new Error('Invalid BSC RPC head')
    const head=Number(BigInt(body.result))
    if(!Number.isSafeInteger(head)) throw new Error('Invalid BSC block height')
    return head
  } finally {clearTimeout(timer)}
}
function reply(body: unknown, code = 200) {
  return new Response(JSON.stringify(body), {status:code,headers:{'content-type':'application/json','cache-control':'no-store'}})
}
function dayCH() { return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()) }
Deno.serve(async (req) => {
  if(req.method !== 'POST') return reply({ok:false,error:'Method not allowed'},405)
  if(!SECRET || !URL || !SERVICE) return reply({ok:false,error:'Worker not configured'},503)
  const provided = req.headers.get('x-tln-reward-secret') || ''
  // Secret is not accepted from query parameters or request body.
  const a=new TextEncoder().encode(provided), b=new TextEncoder().encode(SECRET)
  let diff=a.length ^ b.length
  for(let i=0;i<Math.max(a.length,b.length);i++) diff |= (a[i]||0) ^ (b[i]||0)
  if(diff!==0) return reply({ok:false,error:'Unauthorized'},401)
  try {
    const sb=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}})
    const body=await req.json().catch(()=>({}))
    const supportedModes=['delta-preview','delta-scan-preview','rpc-diagnostic','rpc-range-diagnostic','snapshot-verification-audit','legacy-evidence-audit','legacy-proof-gaps','legacy-unmatched-detail','legacy-stake-lifecycle','verified-topup-mint-preview','multi-wallet-readiness','read-only-preflight']
    const mode=supportedModes.includes(body?.mode)?body.mode:'read-only-preflight'
    if(body?.mode && !supportedModes.includes(body.mode)) return reply({ok:false,error:'Unsupported mode'},400)
    const maxBlocks=previewBlockBudget(body?.maxBlocks)
    if(maxBlocks===null)return reply({ok:false,mode,error:'maxBlocks must be an integer from 1 to 5000'},400)
    const pageSize=500, maxPages=20
    const rows: any[]=[]
    let complete=false
    for(let p=0;p<maxPages;p++){
      const {data,error}=await sb.from('tln_vow_staking_scan_cache')
        .select('user_id,wallet_id,chain_key,cache_key,payload,updated_at,last_scanned_block')
        .eq('project_key','tln_vow').eq('chain_key','bsc').eq('cache_key','verified-discovery-results')
        .order('updated_at',{ascending:false}).range(p*pageSize,(p+1)*pageSize-1)
      if(error) throw new Error(error.message)
      rows.push(...(data||[]))
      if((data||[]).length<pageSize){complete=true;break}
    }
    if(!complete) return reply({ok:false,mode,error:'Pagination limit: completeness not established'},409)
    // One freshest verified-discovery snapshot per owner/wallet; do not output addresses or UUIDs.
    const byWallet=new Map<string,any>()
    for(const r of rows){
      if(!r.user_id || !r.wallet_id) continue
      const k=String(r.user_id)+'|'+String(r.wallet_id)
      if(!byWallet.has(k))byWallet.set(k,r)
    }
    if(mode==='multi-wallet-readiness'){
      // Inventory only: encrypted-wallet eligibility cannot be established from the
      // Discovery cache. No owner/wallet IDs or addresses leave this endpoint.
      const summary={snapshotWallets:byWallet.size,readyForPlanning:0,legacyWithoutCoverage:0,
        incompleteWorkflow:0,invalidSource:0,stale24h:0,stale48h:0}
      const eligible:any[]=[]
      for(const row of byWallet.values()){
        const p=row.payload
        const checkedAt=p?.lastCheckedAt||p?.savedAt||row.updated_at||null
        const checkedMs=Date.parse(checkedAt||'')
        const block=num(p?.lastCheckedBlock??p?.sourceLastBlock??row.last_scanned_block)
        const valid=p?.kind==='verified_discovery_results' && evmAddress(p?.wallet) &&
          block!==null && block>0 && Number.isFinite(checkedMs)
        if(!valid){summary.invalidSource++;continue}
        const age=Date.now()-checkedMs
        if(age>86400000)summary.stale24h++
        if(age>172800000)summary.stale48h++
        if(num(p?.completedStep)===null || Number(p.completedStep)<5 ||
          p?.process?.done?.rewards!==true || p?.process?.done?.referral!==true){
          summary.incompleteWorkflow++;continue
        }
        const evidence=verificationCore.auditSnapshot(p)
        if(!evidence.verified){summary.legacyWithoutCoverage++;continue}
        summary.readyForPlanning++
        eligible.push({checkedMs,lastBlock:block})
      }
      eligible.sort((a,b)=>a.checkedMs-b.checkedMs)
      let head:number|null=null
      if(eligible.length){
        try{head=await bscHead()}catch{
          return reply({ok:false,mode,error:'BSC head unavailable; no plan or writes',summary},503)
        }
      }
      const selected=eligible.slice(0,25)
      const plan=selected.map((p,i)=>{
        const fromBlock=Math.max(0,p.lastBlock-DELTA_OVERLAP_BLOCKS)
        if(head===null || p.lastBlock>head)return {ordinal:i+1,status:'cursor_ahead_of_head',persisted:false}
        const toBlock=Math.min(head,fromBlock+maxBlocks-1)
        return {ordinal:i+1,status:'hypothetical_only',fromBlock,toBlock,
          remainingChunks:Math.ceil((head-toBlock)/maxBlocks),persisted:false,executed:false}
      })
      return reply({ok:true,mode,day:dayCH(),summary,chain:'bsc',head,
        maxBlocks,plannedWallets:plan.length,truncated:eligible.length>plan.length,plan,
        notice:'Global cache-only readiness inventory, at most 25 anonymous first chunks. It excludes legacy snapshots without independent coverage proof. Does NOT enumerate all eligible encrypted wallets, execute RPC log scans, classify rewards, persist cursors, change caches, reserve leases or enable cron.'})
    }
    if(mode==='snapshot-verification-audit'){
      const summary={snapshots:0,workflowDone:0,rewardCoverageVerified:0,referralEngineVerified:0,
        scanCoverageVerified:0,fullyVerified:0,legacyWithoutVerification:0}
      for(const row of byWallet.values()){
        const p=row.payload
        if(p?.kind!=='verified_discovery_results')continue
        summary.snapshots++
        if(p?.process?.done?.rewards===true&&p?.process?.done?.referral===true)summary.workflowDone++
        if(!p?.process?.verification||!p?.blockEvidence)summary.legacyWithoutVerification++
        const audit=verificationCore.auditSnapshot(p)
        if(audit.rewards.verified)summary.rewardCoverageVerified++
        if(audit.referral.verified)summary.referralEngineVerified++
        if(audit.blocks.coverageVerified)summary.scanCoverageVerified++
        if(audit.verified)summary.fullyVerified++
      }
      return reply({ok:true,mode,day:dayCH(),summary,
        notice:'Read-only historical cache audit using the same pure verification core as manual Discovery. Legacy workflow flags alone do not prove coverage. No RPC, writes or cron.'})
    }
    if(mode==='legacy-proof-gaps'){
      // Cached ERC20 scan ranges are useful forensic evidence but are not proof
      // that all reward/claim contract events were classified or paginated.
      const rawRows:any[]=[]
      let rawComplete=false
      for(let p=0;p<maxPages;p++){
        const {data,error}=await sb.from('tln_vow_staking_scan_cache')
          .select('user_id,wallet_id,scanner_version,complete_from_block,last_scanned_block,payload')
          .eq('project_key','tln_vow').eq('chain_key','bsc').eq('cache_key','erc20-history-v1')
          .range(p*pageSize,(p+1)*pageSize-1)
        if(error)throw new Error(error.message)
        rawRows.push(...(data||[]))
        if((data||[]).length<pageSize){rawComplete=true;break}
      }
      if(!rawComplete)return reply({ok:false,mode,error:'Raw-cache pagination limit; no complete diagnosis'},409)
      const rawByWallet=new Map<string,any>()
      for(const r of rawRows){
        if(!r.user_id||!r.wallet_id)continue
        const k=String(r.user_id)+'|'+String(r.wallet_id)
        if(!rawByWallet.has(k)||Number(r.last_scanned_block||0)>Number(rawByWallet.get(k).last_scanned_block||0))rawByWallet.set(k,r)
      }
      const summary={snapshotWallets:byWallet.size,legacyWallets:0,missingRewardCoverage:0,
        missingReferralVerification:0,missingBlockCoverage:0,recordedErc20Ranges:0,
        noRecordedErc20Range:0,withProvenRewardRows:0,withMatchingClaimKeys:0,
        withUnmatchedClaimKeys:0,withReferralReference:0,referralReferenceErrors:0}
      const details:any[]=[]
      for(const [key,row] of byWallet){
        const p=row.payload
        if(p?.kind!=='verified_discovery_results')continue
        const a=verificationCore.auditSnapshot(p)
        if(a.verified)continue
        summary.legacyWallets++
        if(!a.rewards.verified)summary.missingRewardCoverage++
        if(!a.referral.verified)summary.missingReferralVerification++
        if(!a.blocks.coverageVerified)summary.missingBlockCoverage++
        const evidence=verificationCore.legacySnapshotEvidence(p)
        if(evidence.provenRows>0)summary.withProvenRewardRows++
        if(evidence.matchedClaimKeys>0)summary.withMatchingClaimKeys++
        if(evidence.unmatchedProvenKeys>0)summary.withUnmatchedClaimKeys++
        if(evidence.referencePresent)summary.withReferralReference++
        if(evidence.referenceError)summary.referralReferenceErrors++
        const raw=rawByWallet.get(key)
        const from=Number(raw?.complete_from_block),to=Number(raw?.last_scanned_block)
        const hasRawRange=raw?.scanner_version==='erc20-raw-v1'&&Array.isArray(raw?.payload)&&
          Number.isSafeInteger(from)&&from>=0&&Number.isSafeInteger(to)&&to>=from&&to>0
        if(hasRawRange)summary.recordedErc20Ranges++
        else summary.noRecordedErc20Range++
        if(details.length<25)details.push({ordinal:details.length+1,
          missing:{rewardCoverage:!a.rewards.verified,referralVerification:!a.referral.verified,
            blockCoverage:!a.blocks.coverageVerified},
          existing:{recordedErc20Range:hasRawRange,provenRewardRows:evidence.provenRows,
            matchedClaimKeys:evidence.matchedClaimKeys,unmatchedProvenKeys:evidence.unmatchedProvenKeys,
            referralReferencePresent:evidence.referencePresent,referralReferenceError:evidence.referenceError}})
      }
      return reply({ok:true,mode,day:dayCH(),summary,returned:details.length,
        truncated:summary.legacyWallets>details.length,details,
        notice:'Anonymized historical proof-gap inventory only. ERC20 cache ranges, reference results and claim-key matches are structural evidence, NOT independent proof of complete rewards, referrals or block coverage. No wallet/user identifiers, RPC, writes, cursor changes or cron.'})
    }
    if(mode==='legacy-evidence-audit'){
      // This independent ERC20-history cache can prove that a transfer index has
      // a recorded scan range. It cannot retroactively certify reward semantics.
      const rawRows:any[]=[]
      let rawComplete=false
      for(let p=0;p<maxPages;p++){
        const {data,error}=await sb.from('tln_vow_staking_scan_cache')
          .select('user_id,wallet_id,scanner_version,complete_from_block,last_scanned_block,payload')
          .eq('project_key','tln_vow').eq('chain_key','bsc').eq('cache_key','erc20-history-v1')
          .range(p*pageSize,(p+1)*pageSize-1)
        if(error)throw new Error(error.message)
        rawRows.push(...(data||[]))
        if((data||[]).length<pageSize){rawComplete=true;break}
      }
      if(!rawComplete)return reply({ok:false,mode,error:'Raw-cache pagination limit; audit incomplete'},409)
      const rawByWallet=new Map<string,any>()
      for(const r of rawRows){
        if(!r.user_id||!r.wallet_id)continue
        const key=String(r.user_id)+'|'+String(r.wallet_id)
        const old=rawByWallet.get(key)
        if(!old||Number(r.last_scanned_block||0)>Number(old.last_scanned_block||0))rawByWallet.set(key,r)
      }
      const summary={snapshots:0,withProvenRows:0,provenRows:0,provenWithIdentity:0,
        assignedClaimsWithIdentity:0,matchingProvenClaimKeys:0,unmatchedProvenKeys:0,
        withReferralReference:0,referralReferenceErrors:0,strongReferralRows:0,
        withRecordedErc20Range:0,rawCacheMissingOrUnproven:0}
      for(const [key,row] of byWallet){
        if(row.payload?.kind!=='verified_discovery_results')continue
        summary.snapshots++
        const evidence=verificationCore.legacySnapshotEvidence(row.payload)
        if(evidence.provenRows>0)summary.withProvenRows++
        summary.provenRows+=evidence.provenRows
        summary.provenWithIdentity+=evidence.provenWithIdentity
        summary.assignedClaimsWithIdentity+=evidence.claimsWithIdentity
        summary.matchingProvenClaimKeys+=evidence.matchedClaimKeys
        summary.unmatchedProvenKeys+=evidence.unmatchedProvenKeys
        if(evidence.referencePresent)summary.withReferralReference++
        if(evidence.referenceError)summary.referralReferenceErrors++
        summary.strongReferralRows+=evidence.strongCount||0
        const raw=rawByWallet.get(key)
        const from=Number(raw?.complete_from_block),to=Number(raw?.last_scanned_block)
        if(raw?.scanner_version==='erc20-raw-v1'&&Array.isArray(raw?.payload)&&
          Number.isSafeInteger(from)&&from>=0&&Number.isSafeInteger(to)&&to>=from&&to>0)
          summary.withRecordedErc20Range++
        else summary.rawCacheMissingOrUnproven++
      }
      return reply({ok:true,mode,day:dayCH(),summary,
        notice:'Historical structural evidence only. Matching rows and ERC20 cache ranges do NOT prove reward/referral completeness; no existing rows or cursor changed. Read-only, no RPC, no cron.'})
    }
    if(mode==='legacy-unmatched-detail'){
      const limit=10,items:any[]=[]
      let total=0
      for(const row of byWallet.values()){
        if(row.payload?.kind!=='verified_discovery_results')continue
        const unmatched=verificationCore.legacyUnmatchedProofRows(row.payload)
        total+=unmatched.length
        for(const item of unmatched){
          if(items.length<limit)items.push(item)
        }
      }
      return reply({ok:true,mode,day:dayCH(),totalUnmatched:total,returned:items.length,truncated:total>limit,items,
        notice:'Read-only forensic details of structurally unmatched proven rows. Tx hashes are public identifiers; no wallet identity, RPC call, classification change, write or cron. Do not infer a missing staking claim solely from this match.'})
    }
    if(mode==='legacy-stake-lifecycle'){
      const matches=[]
      for(const row of byWallet.values()){
        if(row.payload?.kind!=='verified_discovery_results')continue
        const unmatched=verificationCore.legacyUnmatchedProofRows(row.payload)
        if(!unmatched.some((x:any)=>x.hash===LEGACY_STAKE_AUDIT_HASH))continue
        matches.push(verificationCore.legacyStakeLifecycleEvidence(row.payload,LEGACY_STAKE_AUDIT_HASH,LEGACY_STAKE_AUDIT_BLOCK))
      }
      return reply({ok:true,mode,day:dayCH(),targetFoundInSnapshots:matches.length,
        inspections:matches.slice(0,3),truncated:matches.length>3,
        notice:'Read-only comparison against persisted lifecycle and contract-call rows for the fixed 14-Dec-2024 stake. No wallet identity, RPC, new classification, writes or cron.'})
    }
    if(mode==='verified-topup-mint-preview'){
      let candidateCount=0
      const examples:any[]=[]
      for(const row of byWallet.values()){
        const payload=row.payload
        if(payload?.kind!=='verified_discovery_results')continue
        const candidates=verificationCore.verifiedTopUpMintCandidates(
          payload?.process?.lots||[],payload?.globals?.provenRewardRows||[],payload?.wallet)
        candidateCount+=candidates.length
        for(const candidate of candidates){
          if(examples.length>=10)break
          const lot=payload.process.lots[candidate.lotIndex]
          examples.push({hash:String(candidate.row.hash).toLowerCase(),token:String(candidate.row.token).toLowerCase(),
            symbol:String(candidate.row.symbol||'').slice(0,32),amount:Number(candidate.row.amount),
            lotStakeTx:String(lot?.stakeTx||'').toLowerCase(),
            storageProofVerified:true,existingClaimSameHash:(Array.isArray(lot?.rewardClaims)?lot.rewardClaims:[]).some((x:any)=>
              String(x?.hash||'').toLowerCase()===String(candidate.row.hash).toLowerCase())})
        }
      }
      return reply({ok:true,mode,day:dayCH(),candidateCount,examples,truncated:candidateCount>10,
        notice:'Read-only shared-rule preview for uniquely verified top-up zero mints; no additional manual proof, cache writes, claim creation, cursor update, RPC or cron.'})
    }
    if(mode==='delta-preview' || mode==='delta-scan-preview' || mode==='rpc-diagnostic' || mode==='rpc-range-diagnostic') {
      // The snapshot is not authoritative proof of wallet eligibility. This preview never creates work.
      // Choose one deterministic stale candidate, without disclosing owner or wallet identity.
      const candidate=[...byWallet.values()].filter((r)=>r.payload?.kind==='verified_discovery_results' &&
        num(r.payload?.completedStep)!==null && Number(r.payload.completedStep)>=5)
        .sort((a,b)=>Date.parse(a.payload?.lastCheckedAt||a.payload?.savedAt||a.updated_at||'') -
                    Date.parse(b.payload?.lastCheckedAt||b.payload?.savedAt||b.updated_at||''))[0]
      if(!candidate) return reply({ok:false,mode,error:'No complete source snapshot; no delta window can be planned'},409)
      const payload=candidate.payload
      const lastBlock=num(payload?.lastCheckedBlock ?? payload?.sourceLastBlock ?? candidate.last_scanned_block)
      const checkedAt=payload?.lastCheckedAt||payload?.savedAt||candidate.updated_at||null
      const done=payload?.process?.done||{}
      const sourceAudit=verificationCore.auditSnapshot(payload)
      if(lastBlock===null || lastBlock<=0 || !Number.isFinite(Date.parse(checkedAt||'')))
        return reply({ok:false,mode,error:'Snapshot cursor or timestamp invalid; cannot safely plan delta'},409)
      if(!(done.rewards===true && done.referral===true))
        return reply({ok:false,mode,error:'Reward/referral proof flags missing; cannot plan verified delta'},409)
      let head:number
      try{head=await bscHead()}catch(e){console.error('TLN delta RPC head failed',e);return reply({ok:false,mode,error:'BSC RPC head unavailable (ALCHEMY_API_KEY / provider); no writes'},503)}
      if(head<lastBlock) return reply({ok:false,mode,error:'Snapshot cursor ahead of chain head; no delta scan'},409)
      const fromBlock=Math.max(0,lastBlock-DELTA_OVERLAP_BLOCKS)
      const blocks=head-fromBlock+1
      // This is only a hypothetical first chunk, not an executed or persisted scan.
      // Inclusive endpoints: maxBlocks=100 means [fromBlock, fromBlock + 99].
      // After a verified successful future scan, the next *unprocessed* block would be
      // chunkToBlock + 1. No progress is stored and no scan is executed in this mode.
      const chunkToBlock=Math.min(head,fromBlock+maxBlocks-1)
      const chunkBlocks=chunkToBlock-fromBlock+1
      const remainingBlocks=head-chunkToBlock
      const remainingChunks=Math.ceil(remainingBlocks/maxBlocks)
      if(mode==='rpc-range-diagnostic') {
        let diagnosis
        try { diagnosis=await rpcRangeLimitDiagnosis(fromBlock,head) }
        catch(e){
          console.error('TLN RPC range-limit diagnostic precondition failed',safeRpcDiagnostic(e))
          return reply({ok:false,mode,error:'RPC range-limit diagnosis could not be prepared; no progress saved'},503)
        }
        return reply({ok:true,mode,day:dayCH(),diagnosis,selectedWallets:1,
          notice:'Read-only fixed 1/2/5/10/11/100-block historical probes plus recent 10 blocks. No raw RPC bodies, keys, wallet addresses, rewards, cache/cursor writes or cron.'})
      }
      if(mode==='rpc-diagnostic') {
        const wallet=evmAddress(payload?.wallet)
        if(!wallet)return reply({ok:false,mode,error:'Verified snapshot has no valid wallet address; no RPC diagnosis'},409)
        const diagnosticTo=Math.min(head,fromBlock+Math.min(maxBlocks,DIAGNOSTIC_PROBE_BLOCKS)-1)
        let diagnosis
        try {diagnosis=await rpcFilterDiagnosis(wallet,fromBlock,diagnosticTo,head)}
        catch(e){
          console.error('TLN RPC diagnosis precondition failed',safeRpcDiagnostic(e))
          return reply({ok:false,mode,error:'RPC diagnosis could not be prepared; no progress saved'},503)
        }
        return reply({ok:true,mode,day:dayCH(),chunk:{fromBlock,toBlock:diagnosticTo,
          blocks:diagnosticTo-fromBlock+1,maxBlocks:Math.min(maxBlocks,DIAGNOSTIC_PROBE_BLOCKS),persisted:false},
          diagnosis,selectedWallets:1,
          notice:'Read-only, fixed BSC RPC compatibility probes, six bounded requests including network identity. No raw RPC bodies or keys returned; no rewards/claims/logs imported, no cursor/cache writes and no cron.'})
      }
      if(mode==='delta-scan-preview') {
        // The verified snapshot wallet is the only permitted target; do not accept a wallet supplied in the request.
        const wallet=evmAddress(payload?.wallet)
        if(!wallet)return reply({ok:false,mode,error:'Verified snapshot has no valid wallet address; no log scan'},409)
        let inspection
        try {inspection=await inspectWalletTransfers(wallet,fromBlock,chunkToBlock,maxBlocks)}
        catch(e){
          const diagnostic=safeRpcDiagnostic(e)
          // Log only typed/sanitized metadata; never log the RPC URL, key or raw provider body.
          console.error('TLN wallet-scoped RPC log scan failed',diagnostic)
          return reply({ok:false,mode,error:'BSC scoped transfer scan unavailable or rejected; no progress saved',
            rpcDiagnostic:diagnostic,
            chunk:{fromBlock,toBlock:chunkToBlock,blocks:chunkBlocks,maxBlocks,persisted:false},scanCompleted:false},503)}
        return reply({ok:true,mode,day:dayCH(),source:{completedStep:Number(payload.completedStep),
          sourceCheckedAt:checkedAt,sourceLastBlock:lastBlock,rewardsVerified:sourceAudit.rewards.verified,referralVerified:sourceAudit.referral.verified,
          scanCoverageVerified:sourceAudit.blocks.coverageVerified,legacyWorkflowDone:true},
          chunk:{fromBlock,toBlock:chunkToBlock,blocks:chunkBlocks,maxBlocks,
            nextFromBlock:inspection.complete&&chunkToBlock<head?chunkToBlock+1:null,persisted:false,executed:true},
          inspection,selectedWallets:1,scanCompleted:inspection.complete,
          notice:'Read-only Alchemy AssetTransfers like manual discovery. An incomplete pagination window cannot advance a cursor. No reward/referral classification, claim import, cache/cursor writes or cron. This cannot prove reward completeness.'})
      }
      return reply({ok:true,mode,day:dayCH(),source:{completedStep:Number(payload.completedStep),
        sourceCheckedAt:checkedAt,sourceLastBlock:lastBlock,rewardsVerified:sourceAudit.rewards.verified,referralVerified:sourceAudit.referral.verified,
        scanCoverageVerified:sourceAudit.blocks.coverageVerified,legacyWorkflowDone:true},
        window:{chain:'bsc',fromBlock,toBlock:head,overlapBlocks:DELTA_OVERLAP_BLOCKS,blocks,withinPreviewBudget:blocks<=MAX_DELTA_WINDOW_BLOCKS},
        chunk:{fromBlock,toBlock:chunkToBlock,blocks:chunkBlocks,maxBlocks,
          nextFromBlock:chunkToBlock<head?chunkToBlock+1:null,
          remainingBlocks,remainingChunks,requiresVerifiedCommitBeforeAdvance:true,
          persisted:false,executed:false},selectedWallets:1,
        notice:'Read-only one-wallet first-chunk plan only. nextFromBlock is hypothetical: no cursor is persisted or advanced. No eth_getLogs, no reward/claim discovery, no RPC data import, no cache/cursor writes, no leases, no cron. No proof that new rewards were found or all eligible wallets were covered.'})
    }
    const result={complete:0,missingRewardStep:0,stale24h:0,stale48h:0,invalid:0}
    for(const row of byWallet.values()){
      const p=row.payload
      if(p?.kind!=='verified_discovery_results'){result.invalid++;continue}
      const step=Number(p?.completedStep||0)
      if(step<5){result.missingRewardStep++;continue}
      result.complete++
      const at=Date.parse(p?.lastCheckedAt||p?.savedAt||row.updated_at||'')
      if(!Number.isFinite(at)){result.invalid++;continue}
      const age=Date.now()-at
      if(age>24*3600*1000)result.stale24h++
      if(age>48*3600*1000)result.stale48h++
    }
    return reply({ok:true,mode:'read-only-preflight',day:dayCH(),wallets:byWallet.size,snapshots:rows.length,summary:result,
      notice:'Read-only. No RPC, discovery, reward, cursor, queue or cache writes. This does not refresh rewards or prove completeness of eligible encrypted wallets.'})
  }catch(e){console.error('TLN preflight failed',e);return reply({ok:false,mode:'read-only-preflight',error:'Database preflight failed'},500)}
})
