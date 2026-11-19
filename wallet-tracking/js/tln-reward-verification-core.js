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
  root.WT_TLN_REWARD_VERIFICATION_CORE=Object.freeze({rewardCoverageVerdict,referralVerdict,scanBlockEvidence,auditSnapshot,legacySnapshotEvidence,legacyUnmatchedProofRows,legacyStakeLifecycleEvidence});
})(globalThis);
