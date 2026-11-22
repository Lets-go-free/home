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
  // Exact browser Step-4 stake-transaction reward assignment, extracted from
  // attachRewardClaimsToLots without changing its evidence or deduplication.
  function verifiedStakeTxRewardClaims(lots,provenRows,wallet){
    const norm=v=>String(v||'').toLowerCase(),address=norm(wallet);
    const zero='0x'+'0'.repeat(40),out=[];
    for(let i=0;i<(lots||[]).length;i++){
      const lot=lots[i],stakeHash=norm(lot?.stakeTx);
      if(!stakeHash)continue;
      const stakeRewardRows=[];
      for(const ev of (lot?.stakeRewardEvidence||[])){
        stakeRewardRows.push({
          hash:stakeHash,time:lot?.stakeTime||null,
          block:lot?.stakeBlockHex?Number(BigInt(lot.stakeBlockHex)):null,
          token:norm(ev?.token),symbol:ev?.symbol||'Token',decimals:ev?.decimals??null,
          amount:Number(ev?.amount||0),from:norm(ev?.from),to:norm(ev?.to),selector:null,
          calledContract:lot?.entry_contract||norm(lot?.staking?.contract_address||lot?.counterparty)||null,
          rewardProof:'verifizierte Stake-Tx + kausaler Reward-Transfer/Mint an das Wallet',
          rewardFlowEvidence:norm(ev?.from)===zero?'Zero-Address-Mint direkt an das Wallet':'direkter Payout aus dem Staking-/Entry-System',
          source:ev?.source||'Stake-Transaktion'
        });
      }
      for(const row of (provenRows||[])){
        if(norm(row?.hash)!==stakeHash||norm(row?.to)!==address||
          !(Number(row?.amount||0)>0)||!norm(row?.token))continue;
        stakeRewardRows.push(row);
      }
      const seen=new Set();
      for(const ev of stakeRewardRows){
        const amount=Number(ev?.amount||0),token=norm(ev?.token),from=norm(ev?.from),to=norm(ev?.to);
        if(!(amount>0)||!token||to!==address)continue;
        const key=`${stakeHash}|${token}|${from}|${to}|${amount}`;
        if(seen.has(key))continue;
        seen.add(key);
        out.push({lotIndex:i,claim:{
          hash:stakeHash,time:ev?.time||lot?.stakeTime||null,
          block:ev?.block??(lot?.stakeBlockHex?Number(BigInt(lot.stakeBlockHex)):null),
          token,symbol:ev?.symbol||'Token',decimals:ev?.decimals??null,amount,from,to,
          assignmentScope:'position',assignmentReasonCode:'verified_stake_tx_reward',positionAmbiguous:false,
          method:from===zero?'Mint beim Stake':'Reward-Transfer beim Stake',
          selector:ev?.selector||null,calledContract:ev?.calledContract||lot?.entry_contract||norm(lot?.staking?.contract_address||lot?.counterparty)||null,
          assignmentReason:'verifizierte Stake-Tx derselben Position + belegter Reward-Transfer/Mint im selben Receipt',
          source:ev?.source||'Wallet-weiter Reward-Beweis aus vollständigem Transaction Receipt',assignmentScore:1000,
          rewardProof:ev?.rewardProof||'verifizierte Stake-Tx + kausaler Reward-Transfer/Mint an das Wallet',
          rewardFlowEvidence:ev?.rewardFlowEvidence||(from===zero?'Zero-Address-Mint direkt an das Wallet':'direkter Payout aus dem Staking-/Entry-System'),
          eventType:'stake_reward',finalUnstakeReward:false,finalUnstakeRewardEvidence:null
        }});
      }
    }
    return out;
  }
  // Compare the existing manual Step-4 stake claims with independently
  // verified ERC20 receipt logs. These are existing claims, not new rows.
  function reconcileVerifiedStakeReceipt(input){
    const norm=v=>String(v||'').toLowerCase(),wallet=norm(input?.wallet),hash=norm(input?.hash);
    const receipt=input?.receipt||{},zero='0x'+'0'.repeat(40);
    if(!/^0x[0-9a-f]{40}$/.test(wallet)||!/^0x[0-9a-f]{64}$/.test(hash)||
      receipt.receiptVerified!==true||receipt.knownBridge===true)return [];
    const candidates=verifiedStakeTxRewardClaims(input?.lots||[],input?.provenRows||[],wallet)
      .filter(x=>norm(x.claim.hash)===hash&&norm(x.claim.from)===zero&&norm(x.claim.to)===wallet);
    const logs=Array.isArray(receipt.transfers)?receipt.transfers:[],out=[],seen=new Set();
    for(const {lotIndex,claim} of candidates){
      if(candidates.filter(x=>norm(x.claim.token)===norm(claim.token)&&
        Number(x.claim.amount)===Number(claim.amount)).length!==1)continue;
      const decimals=claim.decimals,amount=String(claim.amount||'');
      if(!Number.isSafeInteger(decimals)||decimals<0||decimals>36||
        !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(amount))continue;
      const [whole,frac='']=amount.split('.');
      if(frac.length>decimals)continue;
      const expected=BigInt(whole)*10n**BigInt(decimals)+BigInt((frac.padEnd(decimals,'0'))||'0');
      if(expected<=0n)continue;
      const matches=logs.filter(l=>norm(l.token)===norm(claim.token)&&norm(l.from)===zero&&
        norm(l.to)===wallet&&/^0x[0-9a-f]+$/i.test(String(l.amountRaw||''))&&
        BigInt(l.amountRaw)===expected&&Number.isSafeInteger(l.logIndex));
      if(matches.length!==1)continue;
      const key=hash+'|'+norm(claim.token)+'|'+matches[0].logIndex;
      if(seen.has(key))continue;
      seen.add(key);
      out.push({hash,token:norm(claim.token),amountRaw:expected.toString(),logIndex:matches[0].logIndex,
        lotIndex,claimSource:'manual_verified_stake_tx_reward',alreadyInManualDiscovery:true});
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
  function keccak256Hex(bytes){
    const mask=(1n<<64n)-1n;
    const rc=[1n,0x8082n,0x800000000000808an,0x8000000080008000n,0x808bn,
      0x80000001n,0x8000000080008081n,0x8000000000008009n,0x8an,0x88n,
      0x80008009n,0x8000000an,0x8000808bn,0x800000000000008bn,
      0x8000000000008089n,0x8000000000008003n,0x8000000000008002n,
      0x8000000000000080n,0x800an,0x800000008000000an,
      0x8000000080008081n,0x8000000000008080n,0x80000001n,0x8000000080008008n];
    const rot=[0,1,62,28,27,36,44,6,55,20,3,10,43,25,39,41,45,15,21,8,18,2,61,56,14];
    const padded=new Uint8Array(Math.ceil((bytes.length+1)/136)*136);
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
    const hex=Array.from({length:32},(_,i)=>Number((a[Math.floor(i/8)]>>BigInt(8*(i%8)))&255n).toString(16).padStart(2,'0')).join('');
    return '0x'+hex;
  }
  function keccakSelector(signature){return keccak256Hex(Array.from(signature,c=>c.charCodeAt(0))).slice(0,10)}
  // Same slot as manual ethers.AbiCoder(address,uint256) + ethers.keccak256.
  function manualWalletMappingSlot(wallet,root,offset=0){
    const w=String(wallet||'').toLowerCase();
    if(!/^0x[0-9a-f]{40}$/.test(w)||!Number.isInteger(root)||root<0||root>65535||
      !Number.isInteger(offset)||offset<0||offset>32)return null;
    const hex=w.slice(2).padStart(64,'0')+BigInt(root).toString(16).padStart(64,'0');
    const bytes=Array.from({length:64},(_,i)=>parseInt(hex.slice(i*2,i*2+2),16));
    const key=BigInt(keccak256Hex(bytes))+BigInt(offset);
    if(key>=(1n<<256n))return null;
    return '0x'+key.toString(16).padStart(64,'0');
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
  // Exact manual Step-4 bonus evidence: ONLY the two explicit claimBonus
  // selectors. The caller must separately establish a proven token payout.
  function manualBonusEvidenceForClaim(claim){
    const selector=String(claim?.selector||'').toLowerCase();
    const method=bonusMethodSignatures.find(sig=>keccakSelector(sig)===selector)||null;
    if(!method)return null;
    return {kind:'bonus',confidence:'hoch',method,
      reason:`Explizite Bonus-Claim-Methode ${method} (${selector})`};
  }
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
  // Bounded subset of the manual Step-4 historical reward state probes.
  // Unsupported or failed contract getters never imply a zero reward.
  const rewardStateProbeSignatures=Object.freeze([
    'earned(address)','pendingReward(address)','pendingRewards(address)',
    'withdrawableYield(address)','claimable(address)','referralRewards(address)']);
  function classifyStateDeltaReceipt(input){
    const wallet=String(input?.wallet||'').toLowerCase(),hash=String(input?.hash||'').toLowerCase();
    const receipt=input?.receipt||{},callTo=String(receipt.calledContract||'').toLowerCase();
    const allowed=new Set((input?.stakingContracts||[]).map(x=>String(x||'').toLowerCase()));
    const deltas=Array.isArray(input?.stateDeltas)?input.stateDeltas:[];
    if(!/^0x[0-9a-f]{40}$/.test(wallet)||!/^0x[0-9a-f]{64}$/.test(hash)||
      receipt.receiptVerified!==true||receipt.knownBridge===true||
      String(receipt.transactionSender||'').toLowerCase()!==wallet||!allowed.has(callTo)||
      knownClaimMethodIntent(receipt.selector)||deltas.length===0)return [];
    const flow=classifyRewardTransferFlow({wallet,callTo,transfers:receipt.transfers,
      lifecycle:false,explicitRewardIntent:false,stateDeltaEvidence:deltas,traceSources:[]});
    return flow.payoutTransfers.filter(t=>String(t.from||'').toLowerCase()===callTo&&
      /^0x[0-9a-f]{40}$/i.test(String(t.token||''))&&
      /^0x[0-9a-f]+$/i.test(String(t.amountRaw||''))&&BigInt(t.amountRaw)>0n)
      .map(t=>({hash,token:String(t.token).toLowerCase(),amountRaw:String(t.amountRaw),
        kind:deltas.some(d=>String(d.sig||'').toLowerCase().includes('referral'))?'referral_state_change':'reward_state_change',
        stateDeltas:deltas,causalPath:t.rewardFlowEvidence,rewardVerified:false,
        reason:'contract state changed across containing block; transaction-specific attribution still unverified'}));
  }
  // Match independent receipt-backed reward candidates to exactly ONE known
  // staking lot. This is shared selection logic, not a canonical claim:
  // position identifiers and historical referral attribution may still matter.
  function assignReceiptCandidatesToUniqueLots(input){
    const addr=v=>String(v||'').toLowerCase();
    const wallet=addr(input?.wallet),hash=addr(input?.hash),receipt=input?.receipt||{};
    const callTo=addr(receipt.calledContract),lots=Array.isArray(input?.lots)?input.lots:[];
    if(!/^0x[0-9a-f]{40}$/.test(wallet)||!/^0x[0-9a-f]{64}$/.test(hash)||
      !/^0x[0-9a-f]{40}$/.test(callTo)||receipt.receiptVerified!==true||receipt.knownBridge===true||
      addr(receipt.transactionSender)!==wallet)return [];
    const candidates=Array.isArray(input?.candidates)?input.candidates:[];
    const eligible=lots.map((lot,index)=>{
      const contracts=[lot?.staking?.contract_address,lot?.counterparty,lot?.entry_contract,
        lot?.stake_event_contract].map(addr).filter(x=>/^0x[0-9a-f]{40}$/.test(x));
      const lifecycle=[lot?.stakeTx,lot?.unstakeTx,...(Array.isArray(lot?.topUps)?lot.topUps.map(x=>x?.tx):[])].map(addr);
      const principal=[lot?.pair?.address,lot?.pair?.pairAddress,lot?.pair?.pair,
        lot?.pair_address,lot?.pairAddress,lot?.asset,lot?.pair?.token0?.address,
        lot?.pair?.token1?.address].map(addr);
      return {index,contracts:new Set(contracts),lifecycle:new Set(lifecycle),principal:new Set(principal)};
    });
    const seen=new Set(),out=[];
    for(const candidate of candidates){
      const token=addr(candidate?.token),raw=String(candidate?.amountRaw||'');
      if(addr(candidate?.hash)!==hash||!/^0x[0-9a-f]{40}$/.test(token)||
        !/^0x[0-9a-f]+$/i.test(raw)||BigInt(raw)<=0n||candidate.rewardVerified===true)continue;
      const matches=eligible.filter(x=>x.contracts.has(callTo)&&
        !x.lifecycle.has(hash)&&!x.principal.has(token));
      if(matches.length!==1)continue;
      const key=hash+'|'+token+'|'+BigInt(raw).toString()+'|'+String(candidate.kind||'');
      if(seen.has(key))continue;
      seen.add(key);
      out.push({hash,token,amountRaw:raw,lotIndex:matches[0].index,
        candidateKind:String(candidate.kind||'unknown'),contract:callTo,
        assignmentVerified:false,reason:'unique direct staking-contract lot relation; position proof and final classification pending'});
    }
    return out;
  }
  // Strict direct CLAIM receipt: a single payout token emitted by the called
  // staking contract, a single unambiguous lot, no principal or exchange leg.
  // It intentionally does NOT finalize mint, referral, bonus, state-only or
  // indirect contract/aggregator evidence.
  function verifiedDirectStakingClaim(input){
    const norm=v=>String(v||'').toLowerCase(),wallet=norm(input?.wallet),hash=norm(input?.hash);
    const receipt=input?.receipt||{},callTo=norm(receipt.calledContract);
    const lots=Array.isArray(input?.lots)?input.lots:[];
    if(!/^0x[0-9a-f]{40}$/.test(wallet)||!/^0x[0-9a-f]{64}$/.test(hash)||
      receipt.receiptVerified!==true||receipt.knownBridge===true||
      receipt.lifecycleLotMatches!==0||norm(receipt.transactionSender)!==wallet||
      knownClaimMethodIntent(receipt.selector)!=='staking_reward')return null;
    const transfers=Array.isArray(receipt.transfers)?receipt.transfers:[];
    if(transfers.some(t=>norm(t?.from)===wallet&&norm(t?.to)!==wallet))return null;
    const incoming=transfers.filter(t=>norm(t?.to)===wallet&&norm(t?.from)!==wallet);
    if(incoming.length!==1||norm(incoming[0].from)!==callTo)return null;
    const transfer=incoming[0],token=norm(transfer.token),raw=String(transfer.amountRaw||'');
    if(!/^0x[0-9a-f]{40}$/.test(token)||!/^0x[0-9a-f]+$/i.test(raw)||
      BigInt(raw)<=0n||!Number.isSafeInteger(transfer.logIndex)||transfer.logIndex<0)return null;
    const candidates=classifyExplicitClaimReceipt({wallet,hash,receipt,stakingContracts:input?.stakingContracts||[]});
    if(candidates.length!==1||norm(candidates[0].token)!==token||BigInt(candidates[0].amountRaw)!==BigInt(raw))return null;
    const assignments=assignReceiptCandidatesToUniqueLots({wallet,hash,receipt,lots,candidates});
    if(assignments.length!==1)return null;
    const lot=lots[assignments[0].lotIndex];
    if(!lot||!/^(?:0x[0-9a-f]{64})$/.test(norm(lot.stakeTx)))return null;
    if(lots.some(l=>(Array.isArray(l?.rewardClaims)?l.rewardClaims:[]).some(c=>
      norm(c?.hash)===hash&&norm(c?.token)===token)))return null;
    return {hash,token,amountRaw:BigInt(raw).toString(),logIndex:transfer.logIndex,
      lotStakeTx:norm(lot.stakeTx),calledContract:callTo,kind:'staking_reward',
      proof:'direct_explicit_staking_claim_with_unique_lot_and_verified_receipt'};
  }
  // Exact manual Step-2 selector gate. This is an intent classification, NOT
  // enough to create a position without asset and on-chain position evidence.
  function manualPositionCallIntent(input){
    if(input?._teamPositionExcluded===true)return 'excluded';
    const selector=String(typeof input==='string'?input:input?._selector||input?._input||input?.selector||'').slice(0,10).toLowerCase();
    if(selector==='0xc50a74a6')return 'excluded'; // TLN Rebound: verified NOT a stake.
    const stake=['stake()','stake(uint256)'];
    const unstake=['unstake()','unstake(uint256)'];
    if(stake.some(s=>keccakSelector(s)===selector))return 'stake';
    if(unstake.some(s=>keccakSelector(s)===selector))return 'unstake';
    if(typeof input==='object'&&String(input?._method||'').toLowerCase()==='stake')return 'stake';
    if(typeof input==='object'&&String(input?._method||'').toLowerCase()==='unstake')return 'unstake';
    return 'unknown';
  }
  // Manual Step-2's secondary Unstake association: only one OPEN position on
  // the exact staking/entry contract can be selected. Multiple parallel lots
  // stay ambiguous. The caller must separately verify successful tx/receipt.
  function manualUniqueUnstakeLotIndex(input){
    const target=String(input?.calledContract||'').toLowerCase();
    if(!/^0x[0-9a-f]{40}$/.test(target)||input?.intent!=='unstake')return null;
    const atTime=Number.isFinite(input?.atTime)?input.atTime:null;
    const atBlock=Number.isSafeInteger(input?.atBlock)?input.atBlock:null;
    const lots=Array.isArray(input?.lots)?input.lots:[];
    const eligible=[];
    for(let i=0;i<lots.length;i++){
      const lot=lots[i];if(!lot||lot.status==='closed'||Number(lot.remaining)===0)continue;
      const staking=String(lot?.staking?.contract_address||lot?.counterparty||'').toLowerCase();
      const entry=String(lot?.entry_contract||'').toLowerCase();
      if(staking!==target&&entry!==target)continue;
      const stakeTime=lot.stakeTime?Date.parse(lot.stakeTime):NaN;
      if(atTime!==null&&Number.isFinite(stakeTime)&&atTime<stakeTime)continue;
      const rawBlock=lot.stakeBlockHex;
      if(atBlock!==null&&rawBlock!=null){
        let stakeBlock;try{stakeBlock=Number(BigInt(rawBlock))}catch{return null}
        if(!Number.isSafeInteger(stakeBlock)||atBlock<stakeBlock)continue;
      }
      eligible.push(i);
      if(eligible.length>1)return null;
    }
    return eligible.length===1?eligible[0]:null;
  }
  // Exact deterministic Step-2 lot construction, shared with the browser.
  // Rows must ALREADY be classified as genuine Stake/Unstake LP events by the
  // manual discovery pipeline. This function never classifies raw transfers.
  function manualBuildDiagnosticLots(stakingRows){
    const norm=v=>String(v||'').toLowerCase();
    const pair=r=>norm(r?.p?.address||r?.pair?.address||r?.pair_address||r?.address);
    const key=r=>`${pair(r)}|${norm(r?.staking?.contract_address||r?.counterparty)}`;
    const positionId=v=>{try{return BigInt(v).toString()}catch{return null}};
    const lotIds=lot=>{
      const ids=new Set(),add=v=>{const id=positionId(v);if(id!==null&&id!=='0')ids.add(id)};
      add(lot?.stake_token_id);
      for(const x of lot?.position_identifiers||[])add(x?.value??x);
      return ids;
    };
    const tx=(r,kind)=>({kind,hash:r?.t?.hash||null,time:r?.t?.metadata?.blockTimestamp||null,
      block:r?.t?.blockNum?parseInt(r.t.blockNum,16):null,amount:Number(r?.amount||0),source:'LP-Transfer'});
    const addTx=(lot,item)=>{if(!item.hash)return;if(!lot.transactions.some(x=>x.hash===item.hash&&x.kind===item.kind))lot.transactions.push(item)};
    const ordered=[...(Array.isArray(stakingRows)?stakingRows:[])].sort((a,b)=>{
      const ta=String(a?.t?.metadata?.blockTimestamp||''),tb=String(b?.t?.metadata?.blockTimestamp||'');
      return ta!==tb?ta.localeCompare(tb):parseInt(a?.t?.blockNum||'0x0',16)-parseInt(b?.t?.blockNum||'0x0',16);
    });
    const prior=[],seen=new Set();
    for(let i=0;i<ordered.length;i++){
      prior[i]=new Set(seen);
      if(String(ordered[i]?.action||'').toUpperCase()==='STAKE')seen.add(key(ordered[i]));
    }
    const duplicates=new Set();
    for(let i=0;i<ordered.length;i++){
      const r=ordered[i];if(String(r?.action||'').toUpperCase()!=='UNSTAKE')continue;
      const hash=norm(r?.t?.hash),asset=pair(r),amount=Number(r?.amount||0);
      if(!hash||!asset||!(amount>0))continue;
      const same=[];
      for(let j=0;j<ordered.length;j++){
        const x=ordered[j];
        if(String(x?.action||'').toUpperCase()==='UNSTAKE'&&norm(x?.t?.hash)===hash&&pair(x)===asset&&
          Math.abs(Number(x?.amount||0)-amount)<=1e-9)same.push(j);
      }
      if(same.length<2)continue;
      const canonical=same.filter(j=>prior[j]?.has(key(ordered[j])));
      if(canonical.length===1)for(const j of same)if(j!==canonical[0])duplicates.add(j);
    }
    const groups=new Map(),lots=[],unmatched=[];
    for(let i=0;i<ordered.length;i++){
      if(duplicates.has(i))continue;
      const r=ordered[i],k=key(r);if(!groups.has(k))groups.set(k,[]);
      const q=groups.get(k);
      if(r.action==='Stake'){
        const stakeTime=r.t.metadata?.blockTimestamp||null,amount=Number(r.amount||0);
        const id=positionId(r.stake_token_id);
        const existing=id?q.find(x=>x?.remaining>1e-12&&lotIds(x).has(id))||null:null;
        if(existing){
          existing.topUps.push({time:stakeTime,block:r?.t?.blockNum?parseInt(r.t.blockNum,16):null,
            blockHex:r?.t?.blockNum||null,tx:r?.t?.hash||null,amount,resultingPrincipal:Number(existing.remaining||0)+amount});
          existing.original+=amount;existing.remaining+=amount;existing.lastTopUpTime=stakeTime;
          existing.lastTopUpBlockHex=r?.t?.blockNum||null;existing.lockBaseTime=stakeTime;
          existing.lockBaseReason='Aufstockung des bestehenden Stakings';
          existing.expiryTime=null;existing.durationDays=null;existing.durationSource=null;
          addTx(existing,{...tx(r,'Aufstockung'),amount,source:'Wiederholter Stake bei bereits offener Position'});
        }else{
          const lot={key:k,pair:r.p||null,pair_address:pair(r),token0_symbol:r?.p?.token0?.symbol||'Token0',
            token1_symbol:r?.p?.token1?.symbol||'Token1',staking:r.staking,counterparty:r.counterparty,
            entry_contract:r.entry_contract||null,stake_event_contract:r.stake_event_contract||null,
            staking_asset_recipient:r.staking_asset_recipient||null,duration_contract:r.duration_contract||null,
            stake_token_id:r.stake_token_id||null,stake_cave_id:r.stake_cave_id||null,
            position_identifiers:r.stake_token_id?[{kind:'stake_event_token_id',value:String(r.stake_token_id),sourceTx:r?.t?.hash||null}]:[],
            stakeTime,stakeBlockHex:r?.t?.blockNum||null,lockBaseTime:stakeTime,lockBaseReason:'Erst-Stake',
            expiryTime:null,durationDays:null,durationSource:null,stakeTx:r.t.hash,original:amount,remaining:amount,
            status:'open',transactions:[],topUps:[]};
          addTx(lot,tx(r,'Stake'));lots.push(lot);q.push(lot);
        }
      }else{
        let left=Number(r.amount||0);
        while(left>1e-12&&q.length){
          const lot=q[0],used=Math.min(left,lot.remaining);
          addTx(lot,{...tx(r,'Unstake'),amount:used});lot.remaining-=used;left-=used;
          if(lot.remaining<=1e-12){lot.remaining=0;lot.status='closed';lot.unstakeTime=r?.t?.metadata?.blockTimestamp||null;
            lot.unstakeTx=r?.t?.hash||null;lot.unstakeBlockHex=r?.t?.blockNum||null;
            lot.unstakeEvidence='lp_transfer_event';q.shift()}
          else lot.status='partial';
        }
        if(left>1e-9)unmatched.push({row:r,unmatched:left,key:k});
      }
    }
    return {lots,unmatched,routedDuplicateUnstakes:duplicates.size};
  }
  // Manual Step-2's proven top-up merge, extracted without any new inference.
  // Caller MUST supply a proof independently validated on chain; the function
  // itself only applies the already accepted position-state continuity verdict.
  function manualMergeProvenTopUpPosition(previous,next,proof){
    if(!previous||!next||proof?.proven!==true)return null;
    const addTx=(lot,t)=>{if(t?.hash&&!lot.transactions.some(x=>x.hash===t.hash&&x.kind===t.kind))lot.transactions.push(t)};
    const block=next.stakeBlockHex?Number(BigInt(next.stakeBlockHex)):null;
    const added=Number(next.original||0);
    previous.topUps=previous.topUps||[];
    previous.topUps.push({time:next.stakeTime,block,blockHex:next.stakeBlockHex||null,tx:next.stakeTx||null,
      amount:added,resultingPrincipal:Number(previous.original||0)+added,evidence:'onchain_same_wallet_position_state',storageProof:proof});
    previous.original=Number(previous.original||0)+added;
    previous.remaining=Number(previous.remaining||0)+Number(next.remaining||0);
    previous.lastTopUpTime=next.stakeTime;previous.lastTopUpBlockHex=next.stakeBlockHex||null;
    previous.durationAnchorTx=next.stakeTx||previous.durationAnchorTx||previous.stakeTx;
    previous.lockBaseTime=next.stakeTime||previous.lockBaseTime||previous.stakeTime;
    previous.positionNormalizedTopUp=true;
    previous.lockBaseReason='On-chain bestätigte Aufstockung derselben Position; Lockdauer wird in Schritt 3 am letzten Top-up geprüft';
    previous.topUpEvidence={type:'onchain_same_wallet_position_state',...proof,normalizedInStep2:true};
    const ms=t=>Date.parse(String(t||''))||0;
    if(next.unstakeTime&&(!previous.unstakeTime||ms(next.unstakeTime)>=ms(previous.unstakeTime))){
      previous.unstakeTime=next.unstakeTime;previous.unstakeTx=next.unstakeTx;
      previous.unstakeBlockHex=next.unstakeBlockHex;previous.unstakeEvidence=next.unstakeEvidence;
    }
    previous.status=(Number(previous.remaining||0)<=1e-12&&Number(next.remaining||0)<=1e-12)?'closed':
      (Number(previous.remaining||0)<Number(previous.original||0)?'partial':'open');
    addTx(previous,{kind:'Aufstockung',hash:next.stakeTx,time:next.stakeTime,block,amount:added,
      source:'On-chain Storage-Kontinuität',assignmentReason:'gleicher Wallet-Positions-State'});
    for(const t of next.transactions||[]){
      if(String(t?.hash||'').toLowerCase()===String(next.stakeTx||'').toLowerCase()&&/stake/i.test(String(t?.kind||'')))continue;
      addTx(previous,t);
    }
    for(const k of ['durationDays','lockDurationSeconds','expiryTime','lastLockedBlock','firstUnlockedBlock',
      'implementationStable','durationEvidence','durationConfidence','durationSource','durationStrictVerdict','lockEvidence'])delete previous[k];
    return previous;
  }
  // Replays *recorded* manual proof evidence solely to compare historic lots.
  // Never promotes recorded proof to independently checked coverage.
  function manualReplayRecordedTopUps(reconstructed,cached){
    const lots=Array.isArray(reconstructed)?reconstructed:[],saved=Array.isArray(cached)?cached:[];
    const byHash=new Map(lots.map(l=>[String(l?.stakeTx||'').toLowerCase(),l]));
    let merged=0,missingProof=0,ambiguous=0;
    for(const s of saved){
      const first=byHash.get(String(s?.stakeTx||'').toLowerCase());if(!first)continue;
      for(const top of s?.topUps||[]){
        if(top?.evidence!=='onchain_same_wallet_position_state')continue;
        const proof=top.storageProof;
        if(proof?.proven!==true){missingProof++;continue}
        const hash=String(top?.tx||'').toLowerCase(),next=byHash.get(hash);
        if(!next||next===first){ambiguous++;continue}
        if(String(next?.staking?.contract_address||next?.counterparty||'').toLowerCase()!==
          String(first?.staking?.contract_address||first?.counterparty||'').toLowerCase()){
          ambiguous++;continue;
        }
        if(!manualMergeProvenTopUpPosition(first,next,proof)){ambiguous++;continue}
        byHash.delete(hash);merged++;
      }
    }
    return {lots:lots.filter(l=>byHash.has(String(l?.stakeTx||'').toLowerCase())),merged,missingProof,ambiguous,
      historicalProofIndependentlyReplayed:false};
  }
  // Existing manual Step-2 contract/receipt unstake reconciliation. Only
  // successful calls and real LP returns on the exact contract path may close
  // a position; fallback selector path requires exactly one open matching lot.
  function manualReconcileUnstakeContractCalls(lots,calls,wallet){
    const norm=v=>String(v||'').toLowerCase();
    const address=norm(wallet),usedCalls=Array.isArray(calls)?calls:[];
    const time=c=>{const v=c?.metadata?.blockTimestamp,n=v?Date.parse(v):NaN;return Number.isFinite(n)?n:null};
    const target=c=>norm(c?._staking?.contract_address||c?.to);
    const paths=l=>new Set([norm(l?.staking?.contract_address||l?.counterparty),norm(l?.entry_contract)].filter(Boolean));
    const amount=(raw,dec)=>{
      try{
        const n=BigInt(raw),d=Number(dec);
        if(!Number.isSafeInteger(d)||d<0||d>80)return null;
        const base=10n**BigInt(d),whole=n/base,frac=n%base;
        return Number(whole)+Number(frac)/Number(base);
      }catch{return null}
    };
    const add=(l,item)=>{
      l.transactions=l.transactions||[];
      if(item?.hash&&!l.transactions.some(x=>x.hash===item.hash&&x.kind===item.kind))l.transactions.push(item);
    };
    const close=(l,c,reason,ret=null)=>{
      l.status='closed';l.remaining=0;l.unstakeTime=c.metadata?.blockTimestamp||null;
      l.unstakeTx=c.hash||null;l.unstakeBlockHex=c._blockNumber!=null?'0x'+Number(c._blockNumber).toString(16):null;
      l.unstakeEvidence=reason;l.unstakeSelector=c._selector||null;
      l.unstakeArg=c._uintArg==null?null:String(c._uintArg);
      l.unstakeEntryContract=norm(c.to||c?._staking?.contract_address);
      if(ret)l.unstakeAmountRaw=String(ret.amountRaw);
      add(l,{kind:'Unstake',hash:c.hash,time:c.metadata?.blockTimestamp||null,block:c._blockNumber||null,
        selector:c._selector||null,method:c._method||'Unstake',source:ret?'Contract-Receipt':'Contract-Call'});
    };
    const sorted=usedCalls.filter(c=>c?._success!==false).sort((a,b)=>(time(a)||0)-(time(b)||0));
    let receiptClosures=0,uniqueCallClosures=0,ambiguousCalls=0;
    for(const c of sorted){
      const matches=[],at=time(c),called=target(c);
      for(const l of lots||[]){
        if(l.status==='closed')continue;
        const st=l.stakeTime?Date.parse(l.stakeTime):null;
        if(at&&st&&at<st)continue;
        if(norm(c?.hash)&&norm(c.hash)===norm(l.stakeTx))continue;
        if(called&&paths(l).size&&!paths(l).has(called))continue;
        const asset=norm(l?.pair_address||l?.pair?.address);
        const ret=(c?._erc20Transfers||[]).find(x=>norm(x?.token)===asset&&norm(x?.to)===address);
        if(!ret||ret.amountRaw==null)continue;
        const returned=amount(ret.amountRaw,l?.pair?.decimals??18),principal=Number(l?.original||l?.remaining||0);
        if(!Number.isFinite(returned)||returned<=0||!Number.isFinite(principal)||principal<=0)continue;
        const diff=Math.abs(returned-principal),tol=Math.max(1e-9,Math.abs(principal)*1e-8);
        matches.push({l,ret,returned,principal,diff,exact:diff<=tol});
      }
      if(!matches.length)continue;
      matches.sort((a,b)=>Number(b.exact)-Number(a.exact)||a.diff-b.diff);
      const best=matches[0];
      if(!best.exact){const ratio=best.returned/best.principal;if(ratio<0.99999999||ratio>1.00000001)continue}
      close(best.l,c,'lp_return_in_receipt',best.ret);
      c._method='Unstake (LP-Rückgabe erkannt)';receiptClosures++;
    }
    for(const c of sorted){
      if(String(c?._method||'').toLowerCase()!=='unstake')continue;
      const index=manualUniqueUnstakeLotIndex({lots,intent:'unstake',calledContract:target(c),atTime:time(c)});
      if(index===null){ambiguousCalls++;continue}
      close(lots[index],c,'successful_contract_call');uniqueCallClosures++;
    }
    return {lots,receiptClosures,uniqueCallClosures,ambiguousCalls};
  }
  // Exact Step-2/3 on-chain storage-continuity verdict for two stake records.
  // Inputs must already carry independently fetched pre/stake storage states;
  // this function does NO RPC and never treats same contract/time as proof.
  function manualTopUpStorageContinuity(previous,next){
    const targeted=l=>l?.durationReference?.targeted||l?.lockEvidence?.reference?.targeted||null;
    const a=targeted(previous),b=targeted(next);
    if(!a?.available||!b?.available)return {proven:false,reason:'Staking-Struct für mindestens einen Stake nicht erkannt.'};
    const rootA=Number(a.root),rootB=Number(b.root);
    const startA=Number(a.startRow?.offset),startB=Number(b.startRow?.offset);
    if(!Number.isInteger(rootA)||rootA!==rootB)return {proven:false,reason:`unterschiedlicher Mapping-Root (${a.root??'–'} / ${b.root??'–'})`};
    if(!Number.isInteger(startA)||startA!==startB)return {proven:false,reason:`unterschiedlicher Stake-Timestamp-Offset (${a.startRow?.offset??'–'} / ${b.startRow?.offset??'–'})`};
    const sec=l=>{const v=l?.positionNormalizedTopUp?(l?.lockBaseTime||l?.stakeTime):l?.stakeTime;
      const ms=Date.parse(String(v||''));return Number.isFinite(ms)?Math.floor(ms/1000):null};
    const ts=(t,part,off)=>Number((t?.byOffset||[]).find(x=>Number(x?.offset)===Number(off))?.[part]?.timestamp||0)||null;
    const value=(t,part,off)=>{const v=(t?.byOffset||[]).find(x=>Number(x?.offset)===Number(off))?.[part]?.value;
      return v==null?null:String(v).toLowerCase()};
    const firstTs=sec(previous),secondTs=sec(next);
    const beforeSecondTs=ts(b,'before',startB),atSecondTs=ts(b,'stake',startB);
    const firstAtStakeTs=ts(a,'stake',startA);
    const timestampContinuity=firstTs!=null&&beforeSecondTs!=null&&Math.abs(beforeSecondTs-firstTs)<=10;
    const secondReset=secondTs!=null&&atSecondTs!=null&&Math.abs(atSecondTs-secondTs)<=10;
    const firstWritten=firstTs!=null&&firstAtStakeTs!=null&&Math.abs(firstAtStakeTs-firstTs)<=10;
    const offsets=[...new Set([...(a.coreOffsets||[]),...(b.coreOffsets||[])].map(Number).filter(Number.isInteger))];
    const nonStart=offsets.filter(x=>x!==startB);
    const changedAtSecond=nonStart.filter(off=>value(b,'before',off)!==value(b,'stake',off));
    const occupiedBefore=nonStart.some(off=>{const v=value(b,'before',off);
      try{return v!=null&&BigInt(v)!==0n}catch{return !!v&&v!=='0x0'}});
    const sameFirstStateSurvives=nonStart.some(off=>{const first=value(a,'stake',off),before=value(b,'before',off);
      return first!=null&&before!=null&&first===before});
    const proven=firstWritten&&timestampContinuity&&secondReset&&occupiedBefore&&changedAtSecond.length>0&&sameFirstStateSurvives;
    return {proven,root:rootA,startOffset:startA,firstWritten,timestampContinuity,secondReset,occupiedBefore,
      sameFirstStateSurvives,changedAtSecond,firstTs,beforeSecondTs,secondTs,atSecondTs,
      reason:proven
        ?`derselbe Wallet-Mapping-State (Root ${rootA}, Timestamp-Offset ${startA}) bestand vor dem zweiten Stake fort und wurde beim zweiten Stake inklusive Start-Timestamp erneut beschrieben`
        :'Storage-Kontinuität reicht für einen belastbaren Top-up-Nachweis nicht aus.'};
  }
  // Step-2 receipt evidence projection. Incoming mints, swaps and calls alone
  // never authorize a new staking lot or a verified reward.
  function manualPositionReceiptEvidence(input){
    const wallet=String(input?.wallet||'').toLowerCase(),receipt=input?.receipt||{};
    const called=String(receipt.calledContract||'').toLowerCase();
    const registry=new Set((input?.stakingContracts||[]).map(v=>String(v||'').toLowerCase()));
    const intent=manualPositionCallIntent({selector:receipt.selector});
    const transfers=Array.isArray(receipt.transfers)?receipt.transfers:[];
    const outgoing=transfers.filter(t=>String(t?.from||'').toLowerCase()===wallet&&
      String(t?.to||'').toLowerCase()===called&&String(t?.token||'').toLowerCase()!==called&&
      /^0x[0-9a-f]+$/i.test(String(t?.amountRaw||''))&&BigInt(t.amountRaw)>0n);
    const incoming=transfers.filter(t=>String(t?.to||'').toLowerCase()===wallet&&
      String(t?.from||'').toLowerCase()===called&&
      /^0x[0-9a-f]+$/i.test(String(t?.amountRaw||''))&&BigInt(t.amountRaw)>0n);
    const trusted=receipt.receiptVerified===true&&receipt.knownBridge!==true&&
      String(receipt.transactionSender||'').toLowerCase()===wallet&&registry.has(called);
    const uniqueUnstakeLotIndex=trusted?manualUniqueUnstakeLotIndex({
      lots:input?.lots,intent,calledContract:called,atBlock:input?.block}):null;
    return {intent,knownStakingContract:registry.has(called),receiptVerified:trusted,
      principalSentToContract:trusted&&intent==='stake'?outgoing.length:0,
      principalReturnedFromContract:trusted&&intent==='unstake'?incoming.length:0,
      uniqueUnstakeLotIndex,candidateOnly:true,positionCreated:false,durationVerified:false};
  }
  root.WT_TLN_REWARD_VERIFICATION_CORE=Object.freeze({rewardCoverageVerdict,referralVerdict,scanBlockEvidence,auditSnapshot,legacySnapshotEvidence,verifiedTopUpMintCandidates,verifiedStakeTxRewardClaims,reconcileVerifiedStakeReceipt,legacyUnmatchedProofRows,legacyStakeLifecycleEvidence,classifyRewardTransferFlow,reconcileVerifiedTopUpReceipt,discoverNewMintRewardCandidates,keccakSelector,keccak256Hex,manualWalletMappingSlot,knownClaimMethodIntent,manualBonusEvidenceForClaim,classifyExplicitClaimReceipt,rewardStateProbeSignatures,classifyStateDeltaReceipt,assignReceiptCandidatesToUniqueLots,verifiedDirectStakingClaim,manualPositionCallIntent,manualPositionReceiptEvidence,manualBuildDiagnosticLots,manualMergeProvenTopUpPosition,manualReplayRecordedTopUps,manualReconcileUnstakeContractCalls,manualUniqueUnstakeLotIndex,manualTopUpStorageContinuity});
})(globalThis);
