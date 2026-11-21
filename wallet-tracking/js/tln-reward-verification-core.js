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
  // Pure Step-4 transfer-flow decision shared by the manual browser discovery
  // and the Edge worker. Evidence collection (receipts, traces, state probes)
  // remains outside this function. Never infer intent from an unverified selector.
  function classifyRewardTransferFlow(input){
    const norm=v=>String(v||'').toLowerCase();
    const wallet=norm(input?.wallet),callTo=norm(input?.callTo);
    const zero='0x'+'0'.repeat(40);
    const transfers=Array.isArray(input?.transfers)?input.transfers:[];
    const lifecycle=input?.lifecycle===true;
    const incoming=transfers.filter(t=>norm(t?.to)===wallet&&norm(t?.from)!==wallet);
    const outgoing=transfers.filter(t=>norm(t?.from)===wallet&&norm(t?.to)!==wallet);
    if(input?.bridge===true)return {kind:'bridge_ignored',exchangeLike:false,incoming:[],outgoing:[],
      payoutTransfers:[],rejectedTransfers:[],explicitRewardIntent:false,stateDeltaEvidence:[],traceSources:[]};
    const outgoingTokens=new Set(outgoing.map(t=>norm(t?.token)));
    const incomingTokens=new Set(incoming.map(t=>norm(t?.token)));
    const exchangeLike=!lifecycle&&outgoing.length>0&&incoming.length>0&&
      [...incomingTokens].some(t=>!outgoingTokens.has(t));
    const explicitRewardIntent=input?.explicitRewardIntent===true;
    const stateDeltaEvidence=Array.isArray(input?.stateDeltaEvidence)?input.stateDeltaEvidence:[];
    const stateProvesReward=stateDeltaEvidence.length>0;
    const traceSources=new Set((Array.isArray(input?.traceSources)?input.traceSources:[]).map(norm));
    if(callTo)traceSources.add(callTo);
    const payoutTransfers=[],rejectedTransfers=[];
    for(const tr of incoming){
      const from=norm(tr.from);
      let causalPath=null;
      if(from===zero)causalPath='mint_to_wallet';
      else if(callTo&&from===callTo)causalPath='direct_from_called_contract';
      else if(traceSources.has(from))causalPath='from_internal_call_chain';
      let proof=null;
      if(from===zero)proof='mint';
      else if(causalPath&&explicitRewardIntent)proof='explicit_claim_method';
      else if(causalPath&&stateProvesReward)proof='reward_state_delta';
      if(causalPath&&proof)payoutTransfers.push({...tr,rewardFlowEvidence:causalPath,
        rewardProof:proof,rewardStateDelta:stateDeltaEvidence});
      else rejectedTransfers.push({...tr,rejectReason:causalPath?
        'causal_transfer_without_reward_proof':'no_causal_payout_path',causalPath});
    }
    const kind=lifecycle?'lifecycle':payoutTransfers.length?'reward_candidate':
      exchangeLike?'exchange_or_liquidity':incoming.length?'incoming_unproven':'other';
    return {kind,exchangeLike,incoming,outgoing,payoutTransfers,rejectedTransfers,
      explicitRewardIntent,stateDeltaEvidence,traceSources:[...traceSources]};
  }
  // Deterministic receipt-to-manual-proof reconciliation. A mint by itself is
  // not a reward; this requires the browser's independently verified top-up
  // storage proof AND its proven reward row for the exact same transaction.
  function reconcileVerifiedTopUpReceipt(input){
    const wallet=String(input?.wallet||'').toLowerCase();
    const hash=String(input?.hash||'').toLowerCase();
    const receipt=input?.receipt||{};
    if(!/^0x[0-9a-f]{40}$/.test(wallet)||!/^0x[0-9a-f]{64}$/.test(hash)||
      receipt.receiptVerified!==true||receipt.knownBridge===true)return [];
    const candidates=verifiedTopUpMintCandidates(input?.lots||[],input?.provenRows||[],wallet)
      .filter(x=>String(x.row.hash).toLowerCase()===hash);
    const logs=Array.isArray(receipt.transfers)?receipt.transfers:[];
    const out=[];
    for(const candidate of candidates){
      const token=String(candidate.row.token).toLowerCase();
      const matches=logs.filter(log=>String(log?.token||'').toLowerCase()===token&&
        String(log?.from||'').toLowerCase()==='0x'+'0'.repeat(40)&&
        String(log?.to||'').toLowerCase()===wallet&&
        /^0x[0-9a-f]+$/i.test(String(log?.amountRaw||''))&&BigInt(log.amountRaw)>0n);
      // Multiple same-token mints cannot be associated with a single manual
      // proof row without independently verifying each exact amount.
      if(matches.length!==1)continue;
      out.push({hash,token,amount:candidate.row.amount,lotIndex:candidate.lotIndex,
        kind:'verified_manual_topup_receipt_match',canonicalRewardVerified:false});
    }
    return out;
  }
  // Independently discover possible NEW staking-related zero-mints without
  // relying on an earlier browser snapshot. These are NOT confirmed rewards.
  function discoverNewMintRewardCandidates(input){
    const wallet=String(input?.wallet||'').toLowerCase();
    const hash=String(input?.hash||'').toLowerCase();
    const to=String(input?.calledContract||'').toLowerCase();
    const known=new Set((Array.isArray(input?.stakingContracts)?input.stakingContracts:[])
      .map(x=>String(x||'').toLowerCase()));
    if(!/^0x[0-9a-f]{40}$/.test(wallet)||!/^0x[0-9a-f]{64}$/.test(hash)||
       input?.receipt?.receiptVerified!==true||input?.receipt?.knownBridge===true||
       (!known.has(to)&&input?.knownLifecycle!==true))return [];
    const transfers=Array.isArray(input.receipt.transfers)?input.receipt.transfers:[];
    const flow=classifyRewardTransferFlow({wallet,callTo:to,transfers,
      lifecycle:input?.knownLifecycle===true,bridge:false,explicitRewardIntent:false,
      stateDeltaEvidence:[],traceSources:[]});
    const zero='0x'+'0'.repeat(40),seen=new Set(),out=[];
    for(const tr of flow.payoutTransfers){
      if(String(tr.from||'').toLowerCase()!==zero||
        !/^0x[0-9a-f]{40}$/.test(String(tr.token||'').toLowerCase())||
        !/^0x[0-9a-f]+$/i.test(String(tr.amountRaw||''))||BigInt(tr.amountRaw)<=0n)continue;
      const logIndex=Number(tr.logIndex);
      if(!Number.isSafeInteger(logIndex)||logIndex<0)continue;
      const token=String(tr.token).toLowerCase(),key=token+'|'+logIndex;
      if(seen.has(key))continue;
      seen.add(key);
      out.push({hash,token,amountRaw:String(tr.amountRaw),logIndex,
        kind:'unverified_staking_related_mint',rewardVerified:false,
        reason:'mint and staking relationship only; independent reward/lifecycle proof required'});
    }
    return out;
  }
  // Explicit method signatures are the same fixed set used by manual Step 4.
  // The precomputed 4-byte selectors are generated once by Ethereum Keccak-256.
  // A method name is only intent; payout proof still requires a receipt-backed
  // causal token transfer and a registered called staking contract.
  function keccakSelector(signature){
    const mask=(1n<<64n)-1n;
    const rc=[1n,0x8082n,0x800000000000808an,0x8000000080008000n,0x808bn,
      0x80000001n,0x8000000080008081n,0x8000000000008009n,0x8an,0x88n,
      0x80008009n,0x8000000an,0x8000808bn,0x800000000000008bn,
      0x8000000000008089n,0x8000000000008003n,0x8000000000008002n,
      0x8000000000000080n,0x800an,0x800000008000000an,
      0x8000000080008081n,0x8000000000008080n,0x80000001n,0x8000000080008008n];
    const rot=[0,1,62,28,27,36,44,6,55,20,3,10,43,25,39,41,45,15,21,8,18,2,61,56,14];
    const bytes=Array.from(signature,c=>c.charCodeAt(0)),padded=new Uint8Array(Math.ceil((bytes.length+1)/136)*136);
    padded.set(bytes);padded[bytes.length]^=1;padded[padded.length-1]^=128;
    const a=Array(25).fill(0n),rol=(x,n)=>n?((x<<BigInt(n))|(x>>BigInt(64-n)))&mask:x;
    for(let off=0;off<padded.length;off+=136){
      for(let i=0;i<136;i++)a[Math.floor(i/8)]^=BigInt(padded[off+i])<<BigInt((i%8)*8);
      for(const round of rc){
        const c=Array.from({length:5},(_,x)=>a[x]^a[x+5]^a[x+10]^a[x+15]^a[x+20]);
        for(let x=0;x<5;x++)for(let y=0;y<5;y++)a[x+5*y]^=c[(x+4)%5]^rol(c[(x+1)%5],1);
        const b=Array(25).fill(0n);
        for(let x=0;x<5;x++)for(let y=0;y<5;y++)b[y+5*((2*x+3*y)%5)]=rol(a[x+5*y],rot[x+5*y]);
        for(let x=0;x<5;x++)for(let y=0;y<5;y++)a[x+5*y]=b[x+5*y]^((~b[(x+1)%5+5*y])&b[(x+2)%5+5*y]);
        a[0]^=round;
      }
    }
    const hex=Array.from({length:4},(_,i)=>Number((a[0]>>BigInt(8*i))&255n).toString(16).padStart(2,'0')).join('');
    return '0x'+hex;
  }
  const rewardMethodSignatures=['claim()','claim(uint256)','claimRewards()','claimReward()',
    'getReward()','harvest()','withdrawReward()','withdrawYield()','withdrawYield(uint256)'];
  const referralMethodSignatures=['claimReferralReward()','claimReferralRewards()',
    'withdrawReferralReward()','withdrawReferralRewards()','claimAffiliateReward()',
    'claimPartnerReward()'];
  const bonusMethodSignatures=['claimBonus(address)','claimBonus()'];
  const methodIntents=new Map();
  for(const [intent,signatures] of [['staking_reward',rewardMethodSignatures],
    ['referral',referralMethodSignatures],['bonus',bonusMethodSignatures]])
    for(const sig of signatures)methodIntents.set(keccakSelector(sig),intent);
  function knownClaimMethodIntent(selector){return methodIntents.get(String(selector||'').toLowerCase())||null}
  function classifyExplicitClaimReceipt(input){
    const wallet=String(input?.wallet||'').toLowerCase(),hash=String(input?.hash||'').toLowerCase();
    const receipt=input?.receipt||{},callTo=String(receipt.calledContract||'').toLowerCase();
    const known=new Set((input?.stakingContracts||[]).map(x=>String(x||'').toLowerCase()));
    const intent=knownClaimMethodIntent(receipt.selector);
    if(!intent||!known.has(callTo)||String(receipt.transactionSender||'').toLowerCase()!==wallet||
      !/^0x[0-9a-f]{40}$/.test(wallet)||
      !/^0x[0-9a-f]{64}$/.test(hash)||receipt.receiptVerified!==true||receipt.knownBridge===true)return [];
    const flow=classifyRewardTransferFlow({wallet,callTo,transfers:receipt.transfers,
      lifecycle:false,explicitRewardIntent:true,stateDeltaEvidence:[],traceSources:[]});
    return flow.payoutTransfers.filter(t=>/^(?:0x[0-9a-f]{40})$/i.test(String(t.token||''))&&
      /^0x[0-9a-f]+$/i.test(String(t.amountRaw||''))&&BigInt(t.amountRaw)>0n)
      .map(t=>({hash,token:String(t.token).toLowerCase(),amountRaw:String(t.amountRaw),
        kind:intent,proof:t.rewardProof,causalPath:t.rewardFlowEvidence,
        rewardVerified:false,reason:'explicit known method and receipt-backed payout; lifecycle and amount verification pending'}));
  }
  root.WT_TLN_REWARD_VERIFICATION_CORE=Object.freeze({rewardCoverageVerdict,referralVerdict,scanBlockEvidence,auditSnapshot,legacySnapshotEvidence,legacyUnmatchedProofRows,legacyStakeLifecycleEvidence,verifiedTopUpMintCandidates,classifyRewardTransferFlow,reconcileVerifiedTopUpReceipt,discoverNewMintRewardCandidates,keccakSelector,knownClaimMethodIntent,classifyExplicitClaimReceipt});
})(globalThis);
