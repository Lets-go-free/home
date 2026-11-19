// WalletTracking 9.17 – TLN/VOW read-only preview with shared verification core.
// Same wallet-scoped alchemy_getAssetTransfers API as manual discovery; NO reward/cursor/cache writes or cron.
// Deploy only for a protected staging inspection. This is NOT a reward worker.
import { createClient } from 'npm:@supabase/supabase-js@^2'
import '../../../js/tln-reward-verification-core.js'
const verificationCore=(globalThis as any).WT_TLN_REWARD_VERIFICATION_CORE
const URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const SECRET = Deno.env.get('TLN_REWARD_CRON_SECRET') || ''
const ALCHEMY_API_KEY = Deno.env.get('ALCHEMY_API_KEY') || ''
const DELTA_OVERLAP_BLOCKS = 128
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
    const mode=body?.mode==='delta-preview' || body?.mode==='delta-scan-preview' || body?.mode==='rpc-diagnostic' || body?.mode==='rpc-range-diagnostic' || body?.mode==='snapshot-verification-audit' ? body.mode : 'read-only-preflight'
    if(body?.mode && !['delta-preview','delta-scan-preview','rpc-diagnostic','rpc-range-diagnostic','snapshot-verification-audit','read-only-preflight'].includes(body.mode)) return reply({ok:false,error:'Unsupported mode'},400)
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
