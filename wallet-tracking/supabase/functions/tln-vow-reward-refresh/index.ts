// WalletTracking 9.80 – read-only encrypted wallet coverage including current balanceOf gate.
// Uses configured archive-state RPC for storage, Alchemy for transfers. No verified reward cursor.
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
  // Exact final strong/candidate decision from the manual Step-5 engine.
  // Inputs are independently collected mint/stake evidence, not arbitrary transfers.
  function manualReferralMintVerdict(row,wallet){
    const sender=String(row?.sender||'').toLowerCase(),owner=String(wallet||'').toLowerCase();
    const stakeEvidence=(Array.isArray(row?.principalTransfers)&&row.principalTransfers.length>0)||
      (Array.isArray(row?.stakeEvents)&&row.stakeEvents.length>0);
    const stakingRecognized=!!row?.staking||
      (Array.isArray(row?.stakeEvents)&&row.stakeEvents.length>0);
    const foreignSender=/^0x[0-9a-f]{40}$/.test(sender)&&
      /^0x[0-9a-f]{40}$/.test(owner)&&sender!==owner;
    return {stakeEvidence,stakingRecognized,
      strong:foreignSender&&stakingRecognized&&stakeEvidence,
      candidate:foreignSender&&stakingRecognized};
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
  // Exact shared manual Step-4 trace-source + single receipt payout decision.
  // A trace is mandatory for a payout emitted by a contract other than the
  // wallet-called staking contract. Only a single known staking-reward intent,
  // one non-principal payout and one unique lot can become a canonical claim.
  function verifiedIndirectStakingClaim(input){
    const norm=v=>String(v||'').toLowerCase(),wallet=norm(input?.wallet),hash=norm(input?.hash);
    const receipt=input?.receipt||{},callTo=norm(receipt.calledContract);
    const lots=Array.isArray(input?.lots)?input.lots:[];
    const registry=new Set((input?.stakingContracts||[]).map(norm));
    const traceSources=(Array.isArray(input?.traceSources)?input.traceSources:[]).map(norm);
    if(!/^0x[0-9a-f]{40}$/.test(wallet)||!/^0x[0-9a-f]{64}$/.test(hash)||
      receipt.receiptVerified!==true||receipt.knownBridge===true||receipt.lifecycleLotMatches!==0||
      norm(receipt.transactionSender)!==wallet||!registry.has(callTo)||
      knownClaimMethodIntent(receipt.selector)!=='staking_reward'||
      input?.traceVerified!==true||!['debug_traceTransaction','trace_transaction'].includes(input?.traceMethod)||
      !traceSources.includes(callTo)||new Set(traceSources).size!==traceSources.length)return null;
    const transfers=Array.isArray(receipt.transfers)?receipt.transfers:[];
    if(transfers.some(t=>norm(t?.from)===wallet&&norm(t?.to)!==wallet))return null;
    const incoming=transfers.filter(t=>norm(t?.to)===wallet&&norm(t?.from)!==wallet);
    if(incoming.length!==1)return null;
    const tr=incoming[0],source=norm(tr.from),token=norm(tr.token),raw=String(tr.amountRaw||'');
    if(source===callTo||source==='0x'+'0'.repeat(40)||!traceSources.includes(source)||
      !/^0x[0-9a-f]{40}$/.test(token)||!/^0x[0-9a-f]+$/i.test(raw)||BigInt(raw)<=0n||
      !Number.isSafeInteger(tr.logIndex)||tr.logIndex<0)return null;
    const flow=classifyRewardTransferFlow({wallet,callTo,transfers,lifecycle:false,
      explicitRewardIntent:true,stateDeltaEvidence:[],traceSources});
    if(flow.payoutTransfers.length!==1||flow.payoutTransfers[0].rewardFlowEvidence!=='from_internal_call_chain'||
      norm(flow.payoutTransfers[0].from)!==source)return null;
    const assignments=assignReceiptCandidatesToUniqueLots({wallet,hash,receipt,lots,
      candidates:[{hash,token,amountRaw:raw,kind:'staking_reward',rewardVerified:false}]});
    if(assignments.length!==1)return null;
    const lot=lots[assignments[0].lotIndex];
    if(!lot||!/^0x[0-9a-f]{64}$/.test(norm(lot.stakeTx))||
      lots.some(l=>(Array.isArray(l?.rewardClaims)?l.rewardClaims:[]).some(c=>
        norm(c?.hash)===hash&&norm(c?.token)===token)))return null;
    return {hash,token,amountRaw:BigInt(raw).toString(),logIndex:tr.logIndex,
      fromContract:source,calledContract:callTo,lotStakeTx:norm(lot.stakeTx),
      kind:'staking_reward',proof:'manual_step4_trace_backed_indirect_unique_lot'};
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
  root.WT_TLN_REWARD_VERIFICATION_CORE=Object.freeze({rewardCoverageVerdict,referralVerdict,manualReferralMintVerdict,scanBlockEvidence,auditSnapshot,legacySnapshotEvidence,verifiedTopUpMintCandidates,verifiedStakeTxRewardClaims,reconcileVerifiedStakeReceipt,legacyUnmatchedProofRows,legacyStakeLifecycleEvidence,classifyRewardTransferFlow,reconcileVerifiedTopUpReceipt,discoverNewMintRewardCandidates,keccakSelector,keccak256Hex,manualWalletMappingSlot,knownClaimMethodIntent,manualBonusEvidenceForClaim,classifyExplicitClaimReceipt,rewardStateProbeSignatures,classifyStateDeltaReceipt,assignReceiptCandidatesToUniqueLots,verifiedDirectStakingClaim,verifiedIndirectStakingClaim,manualPositionCallIntent,manualPositionReceiptEvidence,manualBuildDiagnosticLots,manualMergeProvenTopUpPosition,manualReplayRecordedTopUps,manualReconcileUnstakeContractCalls,manualUniqueUnstakeLotIndex,manualTopUpStorageContinuity});
})(globalThis);
// END GENERATED TLN VERIFICATION CORE
// Phase 9.78: protected, read-only own-wallet coverage inventory.
// Crypto format and AAD match the existing dao-reward-refresh server implementation.
const WALLET_MASTER_V1 = Deno.env.get('WALLET_ENCRYPTION_MASTER_KEY_V1') || ''
const walletTextEncoder = new TextEncoder()
function walletB64url(input:string):Uint8Array {
  const normalized=input.replace(/-/g,'+').replace(/_/g,'/')
  return Uint8Array.from(atob(normalized+'='.repeat((4-normalized.length%4)%4)),c=>c.charCodeAt(0))
}
async function walletUserDecryptionKey(user:string):Promise<CryptoKey> {
  const raw=WALLET_MASTER_V1.trim()
  const bytes=/^[0-9a-f]{64}$/i.test(raw)
    ? Uint8Array.from(raw.match(/../g)!,h=>parseInt(h,16)) : walletB64url(raw)
  if(bytes.length!==32)throw Error('Wallet encryption key unavailable')
  const base=await crypto.subtle.importKey('raw',bytes,'HKDF',false,['deriveKey'])
  return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',
    salt:walletTextEncoder.encode('wallet-tracking/private-data/hkdf-salt/v1'),
    info:walletTextEncoder.encode(`wallet-tracking:user:${user}:key-version:1`)},
    base,{name:'AES-GCM',length:256},false,['decrypt'])
}
async function decryptOwnEvmAddress(key:CryptoKey,user:string,id:string,ciphertext:unknown):Promise<string> {
  if(typeof ciphertext!=='string')throw Error('Invalid encrypted EVM address')
  const parts=ciphertext.split('.')
  if(parts.length!==4||parts[0]!=='wt1'||parts[1]!=='k1')throw Error('Unsupported wallet ciphertext')
  for(const field of ['wallets.evm_address_ciphertext','wallets.evm_address']){
    try{
      const clear=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',
        iv:walletB64url(parts[2]),additionalData:walletTextEncoder.encode(
          `wallet-tracking|enc=1|key=1|user=${user}|record=${id}|field=${field}`),
        tagLength:128},key,walletB64url(parts[3]))).toLowerCase()
      if(!/^0x[0-9a-f]{40}$/.test(clear))throw Error('Invalid decrypted address')
      return clear
    }catch{/* Old AAD naming may be in use; try the other documented variant. */}
  }
  throw Error('Could not decrypt an EVM wallet')
}
// All pages must be present; never assert coverage when a database page failed.
async function coverageRows(sb:any,table:string,columns:string,filters:(q:any)=>any=(q:any)=>q):Promise<any[]> {
  const out:any[]=[],limit=500,maxPages=20
  for(let i=0;i<maxPages;i++){
    const {data,error}=await filters(sb.from(table).select(columns)).range(i*limit,(i+1)*limit-1)
    if(error)throw Error('Wallet coverage source unavailable: '+table)
    out.push(...(data||[]))
    if((data||[]).length<limit)return out
  }
  throw Error('Wallet coverage pagination limit: '+table)
}
// Same membership predicate and ERC-20 balanceOf(address) selector as the manual
// selectTlnVowProjectWallets() gate. Only the RPC transport differs (bounded JSON-RPC
// batch instead of the browser's ethers Multicall3). Failed reads are UNKNOWN.
function coverageProjectTokens(rows:any[]):string[]{
  return [...new Set(rows.filter(r=>r?.enabled!==false&&!r?.historical_only&&r?.address&&
    String(r?.tln_vow_category||r?.defi_category||'').trim())
    .map(r=>String(r.address).toLowerCase())
    .filter(a=>/^0x[0-9a-f]{40}$/.test(a)))]
}
async function coverageCurrentBalances(addresses:string[],tokens:string[]):Promise<{hits:Set<string>,unknown:Set<string>,checked:boolean}> {
  const hits=new Set<string>(),unknown=new Set<string>()
  if(!addresses.length)return {hits,unknown,checked:true}
  if(!tokens.length){addresses.forEach(a=>unknown.add(a));return {hits,unknown,checked:false}}
  if(!ALCHEMY_API_KEY){addresses.forEach(a=>unknown.add(a));return {hits,unknown,checked:false}}
  // One bounded request per wallet. Provider batch failure must never mean zero balance.
  const endpoint=`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`
  for(const address of addresses){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000)
    try{
      const data='0x70a08231'+address.slice(2).padStart(64,'0')
      const calls=tokens.map((token,i)=>({jsonrpc:'2.0',id:i+1,method:'eth_call',params:[{to:token,data},'latest']}))
      const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify(calls),signal:controller.signal})
      if(!response.ok)throw Error('BSC balance batch HTTP failure')
      const body=await response.json()
      if(!Array.isArray(body)||body.length!==calls.length)throw Error('BSC balance batch unsupported or incomplete')
      const byId=new Map(body.map((r:any)=>[r.id,r]))
      let failed=false,positive=false
      for(let i=0;i<calls.length;i++){
        const row:any=byId.get(i+1)
        if(!row||row.error||typeof row.result!=='string'||!/^0x[0-9a-f]+$/i.test(row.result)){
          failed=true;continue
        }
        try{if(BigInt(row.result)>0n)positive=true}catch{failed=true}
      }
      if(positive)hits.add(address)
      else if(failed)unknown.add(address)
    }catch{unknown.add(address)}
    finally{clearTimeout(timer)}
  }
  return {hits,unknown,checked:unknown.size===0}
}
async function encryptedTlnWalletCoveragePreview(sb:any,scanAudit=false,scanStartAudit=false,scanBatchPlan=false,scanDryRun=false,scanEvidenceRun=false,scanWritePlan=false,scanRawParity=false,scanRawEvidence=false,scanAdaptiveParity=false,scanGuardedStage=false,commitGuardedStage=false){
  if(!WALLET_MASTER_V1)return {ok:false,mode:'encrypted-wallet-coverage-preview',
    error:'Encryption service not configured',canEnableWritingCron:false}
  const wallets=await coverageRows(sb,'wallets',
    'id,user_id,evm_address_ciphertext,encryption_version,key_version',
    q=>q.not('evm_address_ciphertext','is',null).order('id'))
  // Never enumerate the potentially unbounded global SmartNode graph.
  // Resolve evidence only against decrypted wallet addresses, on the server.
  const scanRows=await coverageRows(sb,'tln_vow_staking_scan_cache',
    scanAudit?'user_id,wallet_id,cache_key,scanner_version,complete_from_block,last_scanned_block,payload,updated_at':'user_id,wallet_id,cache_key',
    q=>q.eq('project_key','tln_vow').eq('chain_key','bsc'))
  const scanKeys=new Set(scanRows.filter(r=>r.wallet_id&&r.user_id).map(r=>`${r.user_id}|${r.wallet_id}`))
  const bscScanned=new Set(scanRows.filter(r=>r.cache_key==='erc20-history-v1'&&r.wallet_id&&r.user_id)
    .map(r=>`${r.user_id}|${r.wallet_id}`))
  async function hasHistoricalAddressEvidence(address:string):Promise<boolean>{
    const {data:identity,error:identityError}=await sb.from('tln_vow_identity_global_cache')
      .select('wallet_address').eq('chain_key','bsc').ilike('wallet_address',address).limit(1)
    if(identityError)throw Error('Wallet coverage source unavailable: tln_vow_identity_global_cache')
    if((identity||[]).length>0)return true
    const {data:graph,error:graphError}=await sb.from('tln_vow_smartnode_graph_cache')
      .select('child_wallet,parent_wallet').eq('chain_key','bsc')
      .or(`child_wallet.ilike.${address},parent_wallet.ilike.${address}`).limit(1)
    if(graphError)throw Error('Wallet coverage source unavailable: tln_vow_smartnode_graph_cache')
    return (graph||[]).length>0
  }
  const userKeys=new Map<string,CryptoKey>()
  const unknownAddresses:string[]=[]
  const historicalRelevantKeys=new Set<string>()
  const addressToKey=new Map<string,string>()
  const result={encryptedEvmWallets:wallets.length, historicalProjectMatch:0,
    historicalCacheMatch:0,historicalIdentityOrGraphMatch:0,
    noHistoricalMatchCurrentBalanceUnchecked:0,withBscHistoryCache:0,
    historicalMatchWithoutBscHistoryCache:0}
  for(const w of wallets){
    if(w.encryption_version!==1||w.key_version!==1||!w.user_id||!w.id)
      throw Error('Unsupported encrypted EVM wallet metadata')
    if(!userKeys.has(w.user_id))userKeys.set(w.user_id,await walletUserDecryptionKey(w.user_id))
    const address=await decryptOwnEvmAddress(userKeys.get(w.user_id)!,w.user_id,w.id,w.evm_address_ciphertext)
    const k=`${w.user_id}|${w.id}`
    addressToKey.set(address,k)
    const fromCache=scanKeys.has(k),fromIdentity=await hasHistoricalAddressEvidence(address)
    if(fromCache)result.historicalCacheMatch++
    if(fromIdentity)result.historicalIdentityOrGraphMatch++
    if(fromCache||fromIdentity){result.historicalProjectMatch++;historicalRelevantKeys.add(k)}
    else unknownAddresses.push(address)
    if(bscScanned.has(k))result.withBscHistoryCache++
    else if(fromCache||fromIdentity)result.historicalMatchWithoutBscHistoryCache++
  }
  // Mirror the manual selection's eligible-token predicate, without classifying
  // failed RPC reads as zero balances. The result is an aggregate only.
  const projectRows=await coverageRows(sb,'predefined_tokens',
    'address,enabled,historical_only,tln_vow_category,defi_category',
    q=>q.eq('chain','bsc').eq('defi_project_key','tln_vow'))
  const eligibleTokens=coverageProjectTokens(projectRows)
  const balances=await coverageCurrentBalances(unknownAddresses,eligibleTokens)
  const currentMatches=balances.hits.size
  result.noHistoricalMatchCurrentBalanceUnchecked=balances.unknown.size
  const complete=balances.checked&&eligibleTokens.length>0
  // Audit the very same selected wallet set; no second relevance algorithm.
  // Raw cache boundaries alone cannot prove all historical reward paths.
  let scanCoverage:any={}
  if(scanAudit){
    const relevant=new Set(historicalRelevantKeys)
    for(const address of balances.hits){const key=addressToKey.get(address);if(key)relevant.add(key)}
    const rawByKey=new Map<string,any[]>()
    for(const r of scanRows){
      if(r.cache_key!=='erc20-history-v1'||!r.user_id||!r.wallet_id)continue
      const k=`${r.user_id}|${r.wallet_id}`
      if(!rawByKey.has(k))rawByKey.set(k,[])
      rawByKey.get(k)!.push(r)
    }
    let head:number|null=null
    try{head=await bscHead()}catch{/* Lack of chain head must not imply a fresh scan. */}
    let missing=0,invalid=0,partial=0,genesisToHead=0,validRange=0
    let fromGenesis=0,nonzeroStart=0,behindHead=0,atHead=0,maxHeadLag=0
    let plannedChunks=0,plannedNew=0,plannedResume=0,plannedBlocks=0,maxWalletChunks=0,invalidPlan=0
    for(const k of relevant){
      const rows=rawByKey.get(k)||[]
      if(!rows.length){
        missing++
        if(scanBatchPlan&&head!==null){
          const chunks=Math.ceil((head+1)/250000)
          plannedNew++;plannedChunks+=chunks;plannedBlocks+=head+1
          maxWalletChunks=Math.max(maxWalletChunks,chunks)
        }
        continue
      }
      if(rows.length!==1){invalid++;if(scanBatchPlan)invalidPlan++;continue}
      const r=rows[0],from=Number(r.complete_from_block),to=Number(r.last_scanned_block)
      if(r.scanner_version!=='erc20-raw-v1'||!Array.isArray(r.payload)||
        !Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<0||to<from||to<=0||
        (head!==null&&to>head)) {invalid++;if(scanBatchPlan)invalidPlan++;continue}
      validRange++
      if(scanBatchPlan&&head!==null&&to<head){
        // Exactly mirror manual allErc20Transfers: last_scanned_block - 24 + 1.
        const start=Math.max(0,to-24+1)
        const blocks=head-start+1
        const chunks=Math.ceil(blocks/250000)
        plannedResume++;plannedChunks+=chunks;plannedBlocks+=blocks
        maxWalletChunks=Math.max(maxWalletChunks,chunks)
      }
      if(from===0)fromGenesis++
      else nonzeroStart++
      if(head!==null){
        const lag=head-to
        if(lag>0){behindHead++;maxHeadLag=Math.max(maxHeadLag,lag)}
        else atHead++
      }
      if(head!==null&&from===0&&to>=head)genesisToHead++
      else partial++
    }
    scanCoverage={scanCoverageAuditExecuted:true,scanCoverageChainHeadAvailable:head!==null,
      scanCoverageRelevantWalletsChecked:relevant.size,scanCoverageMissingRawCache:missing,
      scanCoverageInvalidRawCache:invalid,scanCoveragePartialOrUnverifiedRange:partial,
      scanCoverageValidRawCacheRanges:validRange,
      scanCoverageGenesisToHeadRanges:genesisToHead,
      scanCoverageClassificationComplete:complete&&head!==null,
      scanCoverageStatus:'raw-cache-boundaries-only',
      historicalScanCoverageVerified:false}
    if(scanWritePlan){
      // Read-only preflight for a future atomic, DB-owned merge. This does NOT
      // build a write payload or grant permission to write. The existing browser
      // performs a read-then-upsert, which cannot protect against concurrent writers.
      const candidateKeys=[...relevant].sort()
      const nextPlans:{cached:boolean,from:number,to:number,existingRows:number,duplicateKeys:number,unkeyedRows:number}[]=[]
      let missingRaw=0,invalidRaw=0,cacheDuplicateEntries=0,unkeyedExistingEntries=0
      for(const k of candidateKeys){
        const rows=rawByKey.get(k)||[]
        if(rows.length===0){
          missingRaw++
          if(head!==null)nextPlans.push({cached:false,from:0,to:Math.min(head,99),existingRows:0,duplicateKeys:0,unkeyedRows:0})
          continue
        }
        if(rows.length!==1){invalidRaw++;continue}
        const r=rows[0],from=Number(r.complete_from_block),to=Number(r.last_scanned_block)
        if(r.scanner_version!=='erc20-raw-v1'||!Array.isArray(r.payload)||
          !Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from!==0||to<from||
          (head!==null&&to>head)){invalidRaw++;continue}
        const seen=new Set<string>()
        let duplicateKeys=0,unkeyedRows=0
        for(const transfer of r.payload){
          const hash=typeof transfer?.hash==='string'?transfer.hash.toLowerCase():''
          const token=evmAddress(transfer?.rawContract?.address)
          const unique=typeof transfer?.uniqueId==='string'?transfer.uniqueId:''
          const block=typeof transfer?.blockNum==='string'?transfer.blockNum.toLowerCase():''
          if(!/^0x[0-9a-f]{64}$/.test(hash)||!token||!/^0x[0-9a-f]+$/.test(block)||!unique){unkeyedRows++;continue}
          const id=[hash,token,unique].join('|')
          if(seen.has(id))duplicateKeys++
          seen.add(id)
        }
        cacheDuplicateEntries+=duplicateKeys
        unkeyedExistingEntries+=unkeyedRows
        if(head!==null&&to<head){
          const start=Math.max(0,to-24+1)
          nextPlans.push({cached:true,from:start,to:Math.min(head,start+99),existingRows:r.payload.length,duplicateKeys,unkeyedRows})
        }
      }
      const selected=nextPlans.sort((a,b)=>Number(b.cached)-Number(a.cached)||a.from-b.from)[0]||null
      return {ok:complete&&head!==null&&invalidRaw===0,
        mode:'encrypted-wallet-scan-write-plan-preview',day:dayCH(),dryRun:true,
        persisted:false,executed:true,canEnableWritingCron:false,
        fullWalletSelectionVerified:complete,relevantWallets:relevant.size,
        cachedWalletsWithCandidateChunks:nextPlans.filter(x=>x.cached).length,
        walletsWithoutRawCache:missingRaw,invalidRawCaches:invalidRaw,
        cachedDuplicateTransferKeys:cacheDuplicateEntries,
        cachedTransfersMissingRequiredIdentity:unkeyedExistingEntries,
        selectedChunk:selected?{fromBlock:selected.from,toBlock:selected.to,
          blocks:selected.to-selected.from+1,overlapBlocks:selected.cached?24:0,
          existingCachedTransfers:selected.existingRows}:null,
        currentChainHeadAvailable:head!==null,
        writePreconditions:{completeRpcPaginationRequired:true,
          existingTransfersMustBePreserved:true,
          stableTransferDeduplicationRequired:true,
          singleDatabaseTransactionRequired:true,
          staleCursorCompareAndSwapRequired:true,
          atomicMergeProcedureAvailable:false},
        safeToWrite:false,blocker:'No verified atomic database merge/compare-and-swap procedure; browser read-then-upsert is not concurrency-safe',
        rewardClassificationVerified:false,historicalScanCoverageVerified:false,
        notice:'Planning only. No chain scan, no cache/transaction/cursor/claim/reward writes, no IDs, addresses, transaction hashes or keys returned.'}
    }
    if(scanEvidenceRun||scanRawEvidence||scanAdaptiveParity){
      const evidenceMode=scanAdaptiveParity?'encrypted-wallet-scan-adaptive-parity-preview':scanRawEvidence?'encrypted-wallet-scan-raw-evidence-preview':'encrypted-wallet-scan-transfer-evidence-preview'
      // Guarded positive-evidence replay: pick exactly one previously cached,
      // project-token-matching transfer, then independently fetch its block
      // from Alchemy. The cache chooses a test location, not a proven result.
      if(!complete||head===null||invalid>0||!ALCHEMY_API_KEY)
        return {ok:false,mode:evidenceMode,dryRun:true,
          error:'Wallet selection, raw-cache bounds or BSC RPC not ready',
          persisted:false,canEnableWritingCron:false}
      const registry=new Set(eligibleTokens)
      const candidates:{key:string,block:number,hash:string,token:string,direction:string,unlisted:boolean}[]=[]
      for(const k of relevant){
        const rows=rawByKey.get(k)||[]
        if(rows.length!==1)continue
        const r=rows[0]
        const from=Number(r.complete_from_block),to=Number(r.last_scanned_block)
        if(r.scanner_version!=='erc20-raw-v1'||!Array.isArray(r.payload)||
          !Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<0||to<from||to>head)continue
        const address=[...addressToKey].find(([,key])=>key===k)?.[0]
        if(!address)throw Error('Internal wallet selection mismatch')
        for(const transfer of r.payload){
          if(!transfer||typeof transfer!=='object')continue
          const token=evmAddress(transfer.rawContract?.address)
          const hash=typeof transfer.hash==='string'?transfer.hash.toLowerCase():''
          let block=NaN
          try{if(typeof transfer.blockNum==='string'&&/^0x[0-9a-f]+$/i.test(transfer.blockNum))
            block=Number(BigInt(transfer.blockNum))}catch{/* malformed historical cache event */}
          const incoming=evmAddress(transfer.to)===address
          const outgoing=evmAddress(transfer.from)===address
          if(!token||(!scanRawEvidence&&!scanAdaptiveParity&&!registry.has(token))||!/^0x[0-9a-f]{64}$/.test(hash)||
            !Number.isSafeInteger(block)||block<from||block>to||(!incoming&&!outgoing))continue
          // A self-transfer has both directions; match either independently.
          candidates.push({key:k,block,hash,token,direction:incoming?'incoming':'outgoing',unlisted:!registry.has(token)})
          if(candidates.length>=1000)break
        }
        if(candidates.length>=1000)break
      }
      candidates.sort((a,b)=>((scanRawEvidence||scanAdaptiveParity)?Number(b.unlisted)-Number(a.unlisted):0)||a.block-b.block||a.key.localeCompare(b.key)||a.hash.localeCompare(b.hash))
      const candidate=candidates[0]
      if(!candidate)return {ok:true,mode:evidenceMode,day:dayCH(),
        dryRun:true,executed:false,persisted:false,canEnableWritingCron:false,
        status:(scanRawEvidence||scanAdaptiveParity)?'no-suitable-cached-erc20-transfer':'no-suitable-cached-project-token-transfer',relevantWallets:relevant.size,
        candidateTransfers:0,independentTransferMatchVerified:false,
        historicalScanCoverageVerified:false,rewardClassificationVerified:false,
        notice:scanRawEvidence?'No eligible cached ERC20 transfer anchor; no replay or writes.':'No eligible cached project-token transfer anchor. No RPC transfer replay, writes or reward assertions.'}
      const address=[...addressToKey].find(([,k])=>k===candidate.key)?.[0]
      if(!address)throw Error('Internal wallet selection mismatch')
      const fromBlock=Math.max(0,candidate.block-49)
      const toBlock=Math.min(head,fromBlock+99)
      try{
        const inspection=await inspectWalletTransfers(address,fromBlock,toBlock,100,eligibleTokens,true,scanRawEvidence||scanAdaptiveParity,scanAdaptiveParity)
        const finished=inspection.complete===true
        const matched=finished&&((scanRawEvidence||scanAdaptiveParity)?inspection.capturedRawEvents:inspection.capturedEvents||[]).some((event:any)=>
          event.hash===candidate.hash&&event.token===candidate.token&&
          event.direction===candidate.direction&&event.block===candidate.block)
        return {ok:finished,mode:evidenceMode,day:dayCH(),
          dryRun:true,executed:true,persisted:false,canEnableWritingCron:false,
          status:matched?'cached-transfer-independently-confirmed':'cached-transfer-not-confirmed',
          selectedWallets:1,relevantWallets:relevant.size,candidateTransfers:candidates.length,
          selectionVerified:true,source:(scanRawEvidence||scanAdaptiveParity)?'existing-erc20-raw-cache-any-token-transfer':'existing-erc20-raw-cache-project-token-transfer',
          ...((scanRawEvidence||scanAdaptiveParity)?{selectedAnchorIsUnlistedToken:candidate.unlisted,rawErc20Transfers:inspection.rawTransfers,rawUniqueTransferIdentities:inspection.rawUniqueIdentities,rawDiscardedMissingContract:inspection.rawDiscardedMissingContract}:{}),
          chunk:{fromBlock,toBlock,blocks:toBlock-fromBlock+1,persisted:false},
          provider:inspection.provider,method:inspection.method,
          incomingComplete:inspection.directions[0]?.complete===true,
          outgoingComplete:inspection.directions[1]?.complete===true,
          complete:finished,paginationPages:inspection.directions.reduce((n:number,d:any)=>n+d.pages,0),
          ...(scanAdaptiveParity?{adaptiveSplitCount:inspection.adaptiveSplitCount||0,adaptiveLeafRanges:inspection.adaptiveLeafRanges||1,adaptiveModeVerified:finished}:{}),
          totalObservedProjectTokenTransfers:inspection.events,
          matchedProjectTokenTransfers:inspection.directions.reduce((n:number,d:any)=>n+d.matchedKnownContracts,0),
          independentTransferMatchVerified:matched,
          historicalScanCoverageVerified:false,rewardClassificationVerified:false,
          notice:scanAdaptiveParity?'Bounded adaptive replay of one cached ERC20 anchor, using strict pagination and splitting only in this read-only mode. No writes or global coverage claim.':scanRawEvidence?'One cached ERC20 transfer (prefer unlisted token) independently checked using existing raw-parity scan. No identifying data or writes; no global or reward coverage claim.':'One cached ERC20 project-token transfer anchor independently checked on chain. No transaction, token, address or user identifiers returned; no writes. This is not reward classification or global scan coverage.'}
      }catch(e){
        const diagnostic=safeRpcDiagnostic(e)
        console.error('TLN guarded historical transfer evidence RPC failed',diagnostic)
        return {ok:false,mode:evidenceMode,day:dayCH(),
          dryRun:true,executed:false,persisted:false,canEnableWritingCron:false,
          error:'Historical transfer replay RPC failed; no progress saved',rpcDiagnostic:diagnostic,
          independentTransferMatchVerified:false,historicalScanCoverageVerified:false}
      }
    }
    if(scanGuardedStage){
      const mode='encrypted-wallet-scan-guarded-stage-preview'
      // A caller cannot select a wallet, cursor, range or chain. In commit mode
      // still only ONE 100-block chunk is possible and no claims are booked.
      if(!complete||head===null||invalid>0||!ALCHEMY_API_KEY||eligibleTokens.length===0)
        return {ok:false,mode,error:'Wallet selection, cache validation or RPC incomplete',
          persisted:false,canEnableWritingCron:false}
      const candidates:{key:string,start:number,cached:boolean}[]=[]
      for(const k of relevant){
        const rows=rawByKey.get(k)||[]
        if(!rows.length){candidates.push({key:k,start:0,cached:false});continue}
        if(rows.length!==1)continue
        const r=rows[0],from=Number(r.complete_from_block),to=Number(r.last_scanned_block)
        if(r.scanner_version!=='erc20-raw-v1'||!Array.isArray(r.payload)||!r.updated_at||
          !Number.isSafeInteger(from)||from!==0||!Number.isSafeInteger(to)||to<from||to>head)continue
        if(to<head)candidates.push({key:k,start:Math.max(0,to-23),cached:true})
      }
      candidates.sort((a,b)=>Number(b.cached)-Number(a.cached)||a.start-b.start||a.key.localeCompare(b.key))
      const selected=candidates[0]
      if(!selected)return {ok:true,mode,dryRun:!commitGuardedStage,executed:false,persisted:false,
        status:'no_pending_scan_range',canEnableWritingCron:false}
      const address=[...addressToKey].find(([,key])=>key===selected.key)?.[0]
      if(!address)throw Error('Internal wallet selection mismatch')
      const end=Math.min(head,selected.start+99)
      try{
        // Reuse same Alchemy function and manual 24-block overlap. Capture
        // complete compact raw transfer objects privately, never in response.
        const inspected=await inspectWalletTransfers(address,selected.start,end,100,
          eligibleTokens,false,true,true,0,true)
        if(!inspected.complete||!inspected.directions.every((d:any)=>d.complete)||
          !Array.isArray(inspected.cacheRows))throw Error('Incomplete raw ERC20 scan')
        const incoming=inspected.cacheRows as any[]
        const newKeys=new Set<string>()
        for(const t of incoming){
          const token=evmAddress(t?.rawContract?.address)
          const bn=typeof t?.blockNum==='string'&&/^0x[0-9a-f]+$/i.test(t.blockNum)?Number(BigInt(t.blockNum)):NaN
          if(!token||!t.uniqueId||!/^0x[0-9a-f]{64}$/.test(t.hash)||
            !Number.isSafeInteger(bn)||bn<selected.start||bn>end||
            (t._direction!=='in'&&t._direction!=='out'))throw Error('Unsafe raw cache row')
          newKeys.add(t.uniqueId)
        }
        const summary={mode,day:dayCH(),executed:true,selectedWallets:1,relevantWallets:relevant.size,
          rawRowsCaptured:incoming.length,uniqueRawKeys:newKeys.size,selectionVerified:true,
          chunk:{fromBlock:selected.start,toBlock:end,overlapBlocks:selected.cached?24:0,blocks:end-selected.start+1},
          incomingComplete:true,outgoingComplete:true,
          paginationPages:inspected.directions.reduce((n:number,d:any)=>n+d.pages,0),
          adaptiveSplitCount:inspected.adaptiveSplitCount||0,
          historicalScanCoverageVerified:false,rewardClassificationVerified:false,canEnableWritingCron:false}
        if(!commitGuardedStage)return {ok:true,...summary,dryRun:true,persisted:false,
          status:'staged-full-raw-payload-preview',notice:'Complete manual-compatible raw rows staged in memory. NO writes; server commit still requires a separate explicit call.'}
        // The same cooperative updated_at compare-and-swap protocol as the
        // existing manual savePersistentErc20Cache(), no extra SQL function.
        const [userId,walletId]=selected.key.split('|')
        if(!userId||!walletId)throw Error('Invalid selected encrypted wallet')
        let retryCount=0
        for(;retryCount<3;retryCount++){
          const scope=sb.from('tln_vow_staking_scan_cache')
            .select('scanner_version,complete_from_block,last_scanned_block,payload,updated_at')
            .eq('user_id',userId).eq('chain_key','bsc').eq('wallet_id',walletId).eq('cache_key','erc20-history-v1')
          const {data:existing,error:readError}=await scope.maybeSingle()
          if(readError)throw Error('Raw cache CAS read failed')
          if(Boolean(existing)!==selected.cached&&retryCount===0){
            // A concurrent initial creation is safe to retry, but a deletion
            // or unexpected cache replacement cannot be taken as coverage.
            if(selected.cached)throw Error('Selected cache disappeared during scan')
          }
          if(existing&&(existing.scanner_version!=='erc20-raw-v1'||!Array.isArray(existing.payload)||!existing.updated_at||
            Number(existing.complete_from_block)!==0||!Number.isSafeInteger(Number(existing.last_scanned_block))))
            throw Error('Raw cache format changed during scan')
          const currentCursor=existing?Number(existing.last_scanned_block):null
          // If another writer advanced the cursor beyond the scan, merge the
          // overlapping rows but never mark new coverage on our own authority.
          if(currentCursor!==null&&currentCursor<selected.start-1)throw Error('Raw cache gap detected')
          const merged=new Map<string,any>()
          for(const t of [...(existing?.payload||[]),...incoming]){
            const token=evmAddress(t?.rawContract?.address)
            const hash=typeof t?.hash==='string'?t.hash.toLowerCase():''
            if(!token||!/^0x[0-9a-f]{64}$/.test(hash)||!t.uniqueId||!t.blockNum)
              throw Error('Invalid pre-existing raw cache transfer')
            const id=String(t.uniqueId||`${hash}|${token}|${t.from||''}|${t.to||''}|${t.rawContract?.value||t.value||''}`)
            merged.set(id,t)
          }
          const oldMillis=existing?Date.parse(existing.updated_at):0
          if(existing&&!Number.isFinite(oldMillis))throw Error('Invalid raw cache timestamp')
          const stamp=new Date(Math.max(Date.now(),oldMillis+1)).toISOString()
          const row={user_id:userId,project_key:'tln_vow',chain_key:'bsc',wallet_id:walletId,
            wallet_address:null,cache_key:'erc20-history-v1',scanner_version:'erc20-raw-v1',
            complete_from_block:0,last_scanned_block:Math.max(currentCursor??0,end),
            payload:[...merged.values()],updated_at:stamp}
          let saved:any
          if(existing){
            saved=await sb.from('tln_vow_staking_scan_cache').update(row)
              .eq('user_id',userId).eq('chain_key','bsc').eq('wallet_id',walletId)
              .eq('cache_key','erc20-history-v1').eq('updated_at',existing.updated_at).select('wallet_id')
          }else{
            saved=await sb.from('tln_vow_staking_scan_cache').insert(row).select('wallet_id')
            if(saved.error?.code==='23505')continue
          }
          if(saved.error)throw Error('Raw cache guarded write failed')
          if(Array.isArray(saved.data)&&saved.data.length===1)
            return {ok:true,...summary,dryRun:false,persisted:true,storedTransferCount:merged.size,
              conflictRetries:retryCount,status:'guarded-raw-cache-chunk-saved',
              notice:'One 100-block raw cache chunk persisted by guarded CAS. No reward/claim/cron writes. Full historical reward coverage NOT proven.'}
        }
        throw Error('Raw cache concurrent update retry limit')
      }catch(error){
        const diagnostic=safeRpcDiagnostic(error)
        console.error('TLN raw cache guarded stage failed',diagnostic)
        return {ok:false,mode,dryRun:!commitGuardedStage,persisted:false,executed:false,
          error:'Guarded scan/stage failed; no coverage progress claimed',
          canEnableWritingCron:false,diagnostic}
      }
    }
    if(scanDryRun||scanRawParity){
      // Use the EXACT selected wallet set above. Never accept a caller-provided
      // address, wallet ID, token registry, block range or provider endpoint.
      if(!complete||head===null||invalid>0||!ALCHEMY_API_KEY)
        return {ok:false,mode:scanRawParity?'encrypted-wallet-scan-raw-parity-preview':'encrypted-wallet-scan-chunk-dry-run',dryRun:true,
          error:'Wallet selection, raw-cache bounds or BSC RPC not ready',
          canEnableWritingCron:false,persisted:false}
      const candidates:{key:string,start:number,cached:boolean}[]=[]
      for(const k of relevant){
        const rows=rawByKey.get(k)||[]
        if(rows.length===0){candidates.push({key:k,start:0,cached:false});continue}
        if(rows.length!==1)continue
        const r=rows[0],to=Number(r.last_scanned_block)
        if(Number.isSafeInteger(to)&&to<head)
          candidates.push({key:k,start:Math.max(0,to-23),cached:true})
      }
      // Prefer existing older cursors for a meaningful resume test. This is
      // NOT fair scheduling and does not represent an operational queue.
      candidates.sort((a,b)=>Number(b.cached)-Number(a.cached)||a.start-b.start||a.key.localeCompare(b.key))
      const candidate=candidates[0]
      if(!candidate)return {ok:false,mode:scanRawParity?'encrypted-wallet-scan-raw-parity-preview':'encrypted-wallet-scan-chunk-dry-run',dryRun:true,
        error:'No pending raw scan window',persisted:false,canEnableWritingCron:false}
      const address=[...addressToKey].find(([,k])=>k===candidate.key)?.[0]
      if(!address)throw Error('Internal wallet selection mismatch')
      const end=Math.min(head,candidate.start+99)
      try{
        // Existing provider implementation: both transfer directions, bounded
        // pagination, validation, wallet scope, duplicate transaction counts.
        // Limit contract matching to the same enabled manual project-token set;
        // never claim this covers all reward contracts or proves completeness.
        const inspection=await inspectWalletTransfers(address,candidate.start,end,100,eligibleTokens,false,scanRawParity)
        const finished=inspection.complete===true
        return {ok:finished,mode:scanRawParity?'encrypted-wallet-scan-raw-parity-preview':'encrypted-wallet-scan-chunk-dry-run',day:dayCH(),
          dryRun:true,executed:true,persisted:false,canEnableWritingCron:false,
          selectedWallets:1,relevantWallets:relevant.size,
          selectionVerified:true,source: candidate.cached?'existing-raw-cache-resume':'missing-raw-cache-genesis',
          chunk:{fromBlock:candidate.start,toBlock:end,blocks:end-candidate.start+1,
            overlapBlocks:candidate.cached?24:0,persisted:false},
          provider:inspection.provider,method:inspection.method,
          incomingComplete:inspection.directions[0]?.complete===true,
          outgoingComplete:inspection.directions[1]?.complete===true,
          complete:finished,totalObservedTransfers:inspection.events,
          ...(scanRawParity?{rawErc20Transfers:inspection.rawTransfers,rawUniqueTransferIdentities:inspection.rawUniqueIdentities,
            rawDiscardedMissingContract:inspection.rawDiscardedMissingContract,rawModeVerified:finished}:{}),
          matchedProjectTokenTransfers:inspection.directions.reduce((n:number,d:any)=>n+d.matchedKnownContracts,0),
          paginationPages:inspection.directions.reduce((n:number,d:any)=>n+d.pages,0),
          historicalScanCoverageVerified:false,rewardClassificationVerified:false,
          notice:scanRawParity?'All wallet ERC20 transfers counted using the manual cache token-acceptance and transfer-identity rules. Strict 100-block/8-page read-only audit; insufficient pagination is a failure, not coverage proof. No writes or identifying data returned.':'Single 100-block wallet-scoped RPC dry run. No token/transaction/address/user IDs returned; no cache, cursor, reward, claim or cron writes. Pagination limited; this does not prove global history or reward completeness.'}
      }catch(e){
        const diagnostic=safeRpcDiagnostic(e)
        console.error('TLN guarded raw chunk dry run RPC failed',diagnostic)
        return {ok:false,mode:scanRawParity?'encrypted-wallet-scan-raw-parity-preview':'encrypted-wallet-scan-chunk-dry-run',day:dayCH(),
          dryRun:true,executed:false,persisted:false,canEnableWritingCron:false,
          error:'One-wallet RPC dry run failed; no progress saved',rpcDiagnostic:diagnostic,
          historicalScanCoverageVerified:false}
      }
    }
    if(scanBatchPlan)Object.assign(scanCoverage,{
      scanBatchPlanExecuted:true,scanBatchPlanStatus:'planning-only-no-chain-scan',
      scanBatchPlanChunkBlocks:250000,scanBatchPlanMinimumSplitBlocks:5000,
      scanBatchPlanResumeOverlapBlocks:24,
      scanBatchPlanNewWallets:plannedNew,scanBatchPlanResumeWallets:plannedResume,
      scanBatchPlanInvalidWallets:invalidPlan,
      scanBatchPlanTotalMainChunks:head!==null?plannedChunks:null,
      scanBatchPlanTotalBlockVisits:head!==null?plannedBlocks:null,
      scanBatchPlanMaxChunksPerWallet:head!==null?maxWalletChunks:null,
      scanBatchPlanEligible:complete&&head!==null&&invalidPlan===0,
      scanBatchPlanSafeToWrite:false,
      scanBatchPlanDisclaimer:'Plan uses raw cache boundaries, not proof of completed pagination or reward coverage. Scanner is browser-bound; server worker needs guarded implementation.'
    })
    if(scanStartAudit)Object.assign(scanCoverage,{
      scanStartAuditExecuted:true,manualErc20InitialStartBlock:0,manualErc20ResumeOverlapBlocks:24,
      scanRangesStartingAtGenesis:fromGenesis,scanRangesStartingAfterGenesis:nonzeroStart,
      scanRangesBehindChainHead:behindHead,scanRangesAtChainHead:atHead,
      scanMaxHeadLagBlocks:head!==null?maxHeadLag:null,
      scanStartAuditStatus:'raw-cache-boundaries-only-not-reward-completeness'
    })
  }
  return {ok:true,mode:scanBatchPlan?'encrypted-wallet-scan-batch-plan-preview':scanStartAudit?'encrypted-wallet-scan-start-audit-preview':scanAudit?'encrypted-wallet-scan-coverage-preview':'encrypted-wallet-coverage-preview',day:dayCH(),dryRun:true,
    ...result,currentBalanceGateExecuted:complete,currentProjectTokenMatch:currentMatches,
    currentBalanceUnknown:balances.unknown.size,
    currentBalanceConfirmedNoMatch:complete?unknownAddresses.length-currentMatches:0,
    currentProjectTokensChecked:eligibleTokens.length,
    totalProjectRelevantWallets:result.historicalProjectMatch+currentMatches,
    fullWalletSelectionVerified:complete,historicalScanCoverageVerified:false,...scanCoverage,
    canEnableWritingCron:false,persisted:false,
    notice:'Historical project evidence plus current BSC ERC20 balanceOf gate. Any RPC failure remains unknown, not irrelevant. No addresses, keys, user IDs, wallet IDs, writes or cron changes. Historical scan completeness is NOT proven.'}
}
const verificationCore=(globalThis as any).WT_TLN_REWARD_VERIFICATION_CORE
const URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const SECRET = Deno.env.get('TLN_REWARD_CRON_SECRET') || ''
const ALCHEMY_API_KEY = Deno.env.get('ALCHEMY_API_KEY') || ''
// Separate archive-state RPC. Never embed the Browser's historical public URL/key.
const NODEREAL_BSC_RPC_URL = Deno.env.get('NODEREAL_BSC_RPC_URL') || ''
const DELTA_OVERLAP_BLOCKS = 128
// Fixed historical verification target from the independently inspected BscScan transaction.
const LEGACY_STAKE_AUDIT_HASH='0xacf7cfc506809bdb57435995267e1592cd7ce537296581a55be60e6668509131'
const LEGACY_STAKE_AUDIT_BLOCK=44871018
const LEGACY_TOPUP_MINT_TOKEN='0x29280091fa7f3abe4739ad5f1f7c5287feaf7736'
const MAX_DELTA_WINDOW_BLOCKS = 100_000
const DELTA_CHUNK_BLOCKS = 5_000
const MAX_WORK_CYCLE_BLOCKS = 100_000
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
// Exact manually configured Step-5 referral mint-token scope.
const REFERRAL_MINT_CONTRACTS=Object.freeze([
  '0xf7d142a354322c7560250caa0e2a06c89649e4c2', // TLN
  '0x29280091fa7f3abe4739ad5f1f7c5287feaf7736', // TLN+
  '0x3dda9ea88136ecede768cd374a2af37219da55e7'  // TLNX
])
const STAKE_EVENT_TOPIC=verificationCore.keccak256Hex(Array.from('Stake(address,uint256,uint256)',c=>c.charCodeAt(0)))
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
async function inspectWalletTransfers(wallet:string, fromBlock:number, toBlock:number, maxBlocks:number,
  contractOverrides?:string[],collectEvents=false,rawParity=false,adaptiveReadOnly=false,depth=0,captureCacheRows=false) {
  if (!ALCHEMY_API_KEY) throw new Error('BSC RPC not configured')
  const address=evmAddress(wallet)
  if(!address)throw new Error('Invalid verified snapshot wallet address')
  if(!Number.isSafeInteger(fromBlock)||!Number.isSafeInteger(toBlock)||fromBlock<0||toBlock<fromBlock||toBlock-fromBlock+1>maxBlocks||
    maxBlocks>(collectEvents?MAX_WORK_CYCLE_BLOCKS:DELTA_CHUNK_BLOCKS))
    throw new Error('Unsafe scan window')
  const contracts=contractOverrides||Object.keys(SCAN_CONTRACTS)
  if(contracts.length===0||contracts.length>100||contracts.some(c=>evmAddress(c)!==c)||new Set(contracts).size!==contracts.length)
    throw new Error('Unsafe registry scope')
  const byContract=new Map<string,{incoming:number,outgoing:number}>(contracts.map(c=>[c,{incoming:0,outgoing:0}]))
  const unique=new Set<string>()
  const capturedEvents:any[]=[]
  const capturedKeys=new Set<string>()
  const rawIdentities=new Set<string>()
  const capturedRawEvents:{hash:string,token:string,block:number,direction:string}[]= []
  const cacheRows:any[]=[]
  let rawTransfers=0,rawDiscardedMissingContract=0
  const directions=[]
  let observedTransfers=0
  const rpcUrl=`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`
  let splitRequired=false
  let splitCause:unknown=null
  try {
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
          if(rawParity){
            // Manual mergeErc20CacheRange accepts every ERC20 token address,
            // deduplicating by uniqueId or the same hash/contract/from/to/value fallback.
            if(!c){rawDiscardedMissingContract++;continue}
            const rawId=typeof transfer.uniqueId==='string'&&transfer.uniqueId
              ?transfer.uniqueId
              :`${tx}|${c}|${evmAddress(transfer.from)||''}|${evmAddress(transfer.to)||''}|${transfer.rawContract?.value||transfer.value||''}`
            rawIdentities.add(rawId);rawTransfers++
            if(captureCacheRows){
              if(cacheRows.length>=250)throw new RpcDiagnosticError('alchemy_getAssetTransfers','raw_cache_row_budget_exceeded')
              const from=evmAddress(transfer.from),to=evmAddress(transfer.to)
              if(!from||!to||typeof transfer.uniqueId!=='string'||!transfer.uniqueId||
                 typeof transfer.blockNum!=='string'||!/^0x[0-9a-f]+$/i.test(transfer.blockNum))
                throw new RpcDiagnosticError('alchemy_getAssetTransfers','invalid_raw_cache_transfer')
              // EXACT browser compactTransferForCache() shape. Preserve all-token
              // raw history, not the restricted reward classification events.
              cacheRows.push({uniqueId:transfer.uniqueId,hash:tx,from,to,blockNum:transfer.blockNum,
                metadata:transfer?.metadata?.blockTimestamp?{blockTimestamp:transfer.metadata.blockTimestamp}:null,
                rawContract:{address:c,value:transfer.rawContract?.value??null,decimal:transfer.rawContract?.decimal??null},
                value:transfer?.value??null,asset:transfer?.asset??null,_direction:direction==='incoming'?'in':'out'})
            }
            if(collectEvents){
              if(capturedRawEvents.length>=250)throw new RpcDiagnosticError('alchemy_getAssetTransfers','stage_event_budget_exceeded')
              capturedRawEvents.push({hash:tx,token:c,block:bn,direction})
            }
          }
          if(!c||!byContract.has(c))continue
          if(collectEvents){
            const id=String(transfer.uniqueId||'')
            if(!id||id.length>300)throw new RpcDiagnosticError('alchemy_getAssetTransfers','missing_event_identity')
            const key=direction+'|'+id
            if(!capturedKeys.has(key)){
              capturedKeys.add(key)
              if(capturedEvents.length>=250)throw new RpcDiagnosticError('alchemy_getAssetTransfers','stage_event_budget_exceeded')
              capturedEvents.push({id,hash:tx,block:bn,token:c,
                from:evmAddress(transfer.from),to:evmAddress(transfer.to),
                rawValue:typeof transfer?.rawContract?.value==='string'?transfer.rawContract.value:null,
                direction})
            }
          }
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
    if(adaptiveReadOnly && !complete){splitRequired=true;break}
  }
  }catch(error){
    if(!adaptiveReadOnly)throw error
    splitRequired=true;splitCause=error
  }
  if(adaptiveReadOnly && splitRequired){
    // Read-only parity test only. No partial page set may ever count as complete.
    // Restrict to 100 original blocks, max 4 split levels and 16 leaves.
    if(!rawParity||toBlock-fromBlock+1<=1||depth>=4){
      if(splitCause)throw splitCause
      throw new RpcDiagnosticError('alchemy_getAssetTransfers','adaptive_minimum_window_reached')
    }
    const mid=Math.floor((fromBlock+toBlock)/2)
    const left=await inspectWalletTransfers(wallet,fromBlock,mid,maxBlocks,contracts,collectEvents,true,true,depth+1,captureCacheRows)
    const right=await inspectWalletTransfers(wallet,mid+1,toBlock,maxBlocks,contracts,collectEvents,true,true,depth+1,captureCacheRows)
    if(!left.complete||!right.complete)throw new RpcDiagnosticError('alchemy_getAssetTransfers','adaptive_incomplete')
    const both=[left,right]
    const events=both.flatMap(r=>r.capturedEvents||[])
    const rawEvents=both.flatMap(r=>r.capturedRawEvents||[])
    const mergedCacheRows=both.flatMap(r=>r.cacheRows||[])
    if(events.length>250||rawEvents.length>250||mergedCacheRows.length>250)throw new RpcDiagnosticError('alchemy_getAssetTransfers','stage_event_budget_exceeded')
    return {provider:'alchemy_bnb_mainnet',method:'alchemy_getAssetTransfers',complete:true,
      directions:(['incoming','outgoing'] as const).map(direction=>({direction,
        pages:both.reduce((n,r)=>n+(r.directions.find((d:any)=>d.direction===direction)?.pages||0),0),
        totalTransfers:both.reduce((n,r)=>n+(r.directions.find((d:any)=>d.direction===direction)?.totalTransfers||0),0),
        matchedKnownContracts:both.reduce((n,r)=>n+(r.directions.find((d:any)=>d.direction===direction)?.matchedKnownContracts||0),0),complete:true})),
      events:left.events+right.events,uniqueTransactions:left.uniqueTransactions+right.uniqueTransactions,
      ...(collectEvents?{capturedEvents:events,capturedRawEvents:rawEvents}:{}),
      ...(captureCacheRows?{cacheRows:mergedCacheRows}:{}),
      rawTransfers:left.rawTransfers+right.rawTransfers,
      rawUniqueIdentities:left.rawUniqueIdentities+right.rawUniqueIdentities,
      rawDiscardedMissingContract:left.rawDiscardedMissingContract+right.rawDiscardedMissingContract,
      adaptiveSplitCount:1+(left.adaptiveSplitCount||0)+(right.adaptiveSplitCount||0),
      adaptiveLeafRanges:(left.adaptiveLeafRanges||1)+(right.adaptiveLeafRanges||1),
      contracts:[],scope:'Read-only adaptive raw ERC20 parity replay; no writes or reward classification'}
  }
  return {provider:'alchemy_bnb_mainnet',method:'alchemy_getAssetTransfers',
    complete:directions.every(d=>d.complete),directions,events:observedTransfers,uniqueTransactions:unique.size,
    ...(collectEvents?{capturedEvents}:{}),
    ...(rawParity?{rawTransfers,rawUniqueIdentities:rawIdentities.size,rawDiscardedMissingContract,...(collectEvents?{capturedRawEvents}:{})}:{}),
    ...(captureCacheRows?{cacheRows}:{}),
    contracts:contractOverrides?[]:contracts.map(address=>({symbol:SCAN_CONTRACTS[address as keyof typeof SCAN_CONTRACTS],
      incoming:byContract.get(address)!.incoming,outgoing:byContract.get(address)!.outgoing})),
    scope:contractOverrides?'Wallet ERC20 transfers matched against bounded configured contract set; not reward classification':
      'Wallet-scoped ERC20 AssetTransfers for four known token contracts; not proof of a staking, referral or bonus reward'}
}
// Mirrors manual allExternalCallsToStaking discovery's external -> tx -> receipt
// evidence chain, but deliberately does not import or classify any reward.
async function inspectStakingContractCalls(wallet:string,fromBlock:number,toBlock:number,targets:string[]) {
  const address=evmAddress(wallet)
  if(!ALCHEMY_API_KEY||!address||targets.length<1||targets.length>100||
    targets.some(t=>evmAddress(t)!==t)||new Set(targets).size!==targets.length)
    throw new RpcDiagnosticError('external_calls','unsafe_scope')
  const allowed=new Set(targets)
  const rpcUrl=`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`
  const call=async(method:string,params:unknown[])=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000)
    try {
      const r=await fetch(rpcUrl,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,
        body:JSON.stringify({jsonrpc:'2.0',id:31,method,params})})
      if(!r.ok)throw new RpcDiagnosticError(method,'http_error',r.status)
      let result:any
      try{result=await r.json()}catch{throw new RpcDiagnosticError(method,'invalid_json')}
      if(result?.error)throw new RpcDiagnosticError(method,'rpc_error',null,rpcCodeOf(result.error))
      if(!Object.hasOwn(result||{},'result'))throw new RpcDiagnosticError(method,'invalid_response')
      return result.result
    }catch(e){if(e instanceof RpcDiagnosticError)throw e
      throw new RpcDiagnosticError(method,e instanceof Error&&e.name==='AbortError'?'timeout':'network_error')
    }finally{clearTimeout(timer)}
  }
  const hashes=new Set<string>(),seenPages=new Set<string>()
  let pageKey:string|null=null,pages=0,totalExternal=0
  const selected:string[]=[]
  // Fixed per-preview caps protect Alchemy, execution time and data exposure.
  const MAX_INSPECTED_CALLS=12
  let truncated=false,complete=false
  while(pages<MAX_TRANSFER_PAGES_PER_DIRECTION){
    const q:Record<string,unknown>={fromBlock:hexBlock(fromBlock),toBlock:hexBlock(toBlock),
      fromAddress:address,category:['external'],excludeZeroValue:false,withMetadata:true,maxCount:'0x3e8'}
    if(pageKey)q.pageKey=pageKey
    const result=await call('alchemy_getAssetTransfers',[q])
    if(!Array.isArray(result?.transfers))throw new RpcDiagnosticError('external_calls','invalid_response')
    pages++;totalExternal+=result.transfers.length
    for(const item of result.transfers){
      const from=evmAddress(item?.from),to=evmAddress(item?.to)
      const hash=typeof item?.hash==='string'&&/^0x[0-9a-f]{64}$/i.test(item.hash)?item.hash.toLowerCase():null
      const block=typeof item?.blockNum==='string'&&/^0x[0-9a-f]+$/i.test(item.blockNum)?Number(BigInt(item.blockNum)):NaN
      if(from!==address||!hash||!Number.isSafeInteger(block)||block<fromBlock||block>toBlock)
        throw new RpcDiagnosticError('external_calls','invalid_transfer')
      if(!to||!allowed.has(to)||hashes.has(hash))continue
      hashes.add(hash)
      if(selected.length<MAX_INSPECTED_CALLS)selected.push(hash)
      else truncated=true
    }
    const next=result.pageKey
    if(!next){complete=true;break}
    if(typeof next!=='string'||next.length>2000||seenPages.has(next))
      throw new RpcDiagnosticError('external_calls','invalid_pagination')
    seenPages.add(next);pageKey=next
  }
  const selectors=new Map<string,number>()
  let successfulReceipts=0,failedReceipts=0,receiptLogs=0,erc20TransferLogs=0
  for(const hash of selected){
    const tx=await call('eth_getTransactionByHash',[hash])
    if(!tx||evmAddress(tx.from)!==address||!allowed.has(evmAddress(tx.to)||'')||
      typeof tx.blockNumber!=='string'||Number(BigInt(tx.blockNumber))<fromBlock||
      Number(BigInt(tx.blockNumber))>toBlock)throw new RpcDiagnosticError('eth_getTransactionByHash','tx_mismatch')
    const input=typeof tx.input==='string'&&/^0x[0-9a-f]*$/i.test(tx.input)?tx.input.toLowerCase():null
    if(input===null)throw new RpcDiagnosticError('eth_getTransactionByHash','invalid_input')
    const selector=input.length>=10?input.slice(0,10):'none'
    selectors.set(selector,(selectors.get(selector)||0)+1)
    const rec=await call('eth_getTransactionReceipt',[hash])
    if(!rec||String(rec.transactionHash||'').toLowerCase()!==hash||!Array.isArray(rec.logs))
      throw new RpcDiagnosticError('eth_getTransactionReceipt','receipt_mismatch')
    if(rec.status==='0x1')successfulReceipts++
    else if(rec.status==='0x0')failedReceipts++
    else throw new RpcDiagnosticError('eth_getTransactionReceipt','invalid_status')
    receiptLogs+=rec.logs.length
    erc20TransferLogs+=rec.logs.filter((l:any)=>Array.isArray(l?.topics)&&
      String(l.topics[0]||'').toLowerCase()===TRANSFER_TOPIC).length
  }
  return {method:'alchemy_getAssetTransfers + eth_getTransactionByHash + eth_getTransactionReceipt',
    externalPages:pages,externalTransfers:totalExternal,externalPaginationComplete:complete,
    matchingContractCalls:hashes.size,callsInspected:selected.length,callsTruncated:truncated,
    selectorCounts:[...selectors].map(([selector,count])=>({selector,count})),
    successfulReceipts,failedReceipts,receiptLogs,erc20TransferLogs,
    evidenceComplete:complete&&!truncated,classificationPerformed:false}
}
// The manual staking discovery also looks at direct wallet contract calls.
// Capture their identities even when no ERC20 transfer is emitted. Calls are
// verified against the on-chain transaction and receipt before use.
async function captureStakingCallIdentities(wallet:string,fromBlock:number,toBlock:number,targets:string[]){
  const address=evmAddress(wallet),allowed=new Set(targets)
  if(!ALCHEMY_API_KEY||!address||targets.length>100||
    targets.some(t=>evmAddress(t)!==t)||allowed.size!==targets.length)
    throw new RpcDiagnosticError('staking_calls','unsafe_scope')
  if(!targets.length)return []
  const url=`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`
  const seenPages=new Set<string>(),events:any[]=[],seenHashes=new Set<string>()
  let pageKey:string|null=null,complete=false
  for(let p=0;p<MAX_TRANSFER_PAGES_PER_DIRECTION;p++){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000)
    try{
      const query:Record<string,unknown>={fromBlock:hexBlock(fromBlock),toBlock:hexBlock(toBlock),
        fromAddress:address,category:['external'],excludeZeroValue:false,maxCount:'0x3e8'}
      if(pageKey)query.pageKey=pageKey
      const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,
        body:JSON.stringify({jsonrpc:'2.0',id:51,method:'alchemy_getAssetTransfers',params:[query]})})
      if(!response.ok)throw new RpcDiagnosticError('staking_calls','http_error',response.status)
      const body=await response.json()
      if(body?.error)throw new RpcDiagnosticError('staking_calls','rpc_error',null,rpcCodeOf(body.error))
      if(!Array.isArray(body?.result?.transfers))throw new RpcDiagnosticError('staking_calls','invalid_response')
      for(const item of body.result.transfers){
        const from=evmAddress(item?.from),to=evmAddress(item?.to),hash=String(item?.hash||'').toLowerCase()
        const block=typeof item?.blockNum==='string'&&/^0x[0-9a-f]+$/i.test(item.blockNum)?Number(BigInt(item.blockNum)):-1
        if(from!==address||!/^0x[0-9a-f]{64}$/.test(hash)||!Number.isSafeInteger(block)||block<fromBlock||block>toBlock)
          throw new RpcDiagnosticError('staking_calls','invalid_transfer')
        if(!to||!allowed.has(to)||seenHashes.has(hash))continue
        seenHashes.add(hash)
        if(events.length>=250)throw new RpcDiagnosticError('staking_calls','stage_event_budget_exceeded')
        events.push({kind:'staking_contract_call',hash,block,from,to})
      }
      const next=body.result.pageKey
      if(!next){complete=true;break}
      if(typeof next!=='string'||next.length>2000||seenPages.has(next))
        throw new RpcDiagnosticError('staking_calls','invalid_pagination')
      seenPages.add(next);pageKey=next
    }catch(e){if(e instanceof RpcDiagnosticError)throw e
      throw new RpcDiagnosticError('staking_calls',e instanceof Error&&e.name==='AbortError'?'timeout':'network_error')
    }finally{clearTimeout(timer)}
  }
  if(!complete)throw new RpcDiagnosticError('staking_calls','pagination_incomplete')
  return events
}
function amountInBaseUnits(amount:unknown,decimals:number):bigint|null {
  const s=String(amount)
  if(!/^\d+(?:\.\d+)?$/.test(s)||!Number.isSafeInteger(decimals)||decimals<0||decimals>36)return null
  const [whole,fraction='']=s.split('.')
  if(fraction.length>decimals)return null
  const raw=BigInt(whole)*10n**BigInt(decimals)+BigInt((fraction.padEnd(decimals,'0'))||'0')
  return raw>0n?raw:null
}
async function inspectHistoricalTopUpProof(wallet:string,expectedAmount:number,hash:string=LEGACY_STAKE_AUDIT_HASH,
  token:string=LEGACY_TOPUP_MINT_TOKEN,block:number=LEGACY_STAKE_AUDIT_BLOCK) {
  const address=evmAddress(wallet)
  const contract=evmAddress(token)
  if(!address||!contract||!ALCHEMY_API_KEY||!/^0x[0-9a-f]{64}$/.test(hash)||
    !Number.isSafeInteger(block)||block<1||amountInBaseUnits(expectedAmount,36)===null)
    throw new RpcDiagnosticError('historical_topup','invalid_cached_anchor')
  const url=`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`
  const call=async(method:string,params:unknown[])=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000)
    try {
      const res=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,
        body:JSON.stringify({jsonrpc:'2.0',id:31,method,params})})
      if(!res.ok)throw new RpcDiagnosticError(method,'http_error',res.status)
      let result:any
      try{result=await res.json()}catch{throw new RpcDiagnosticError(method,'invalid_json')}
      if(result?.error)throw new RpcDiagnosticError(method,'rpc_error',null,rpcCodeOf(result.error))
      if(!Object.hasOwn(result||{},'result'))throw new RpcDiagnosticError(method,'invalid_response')
      return result.result
    }catch(e){if(e instanceof RpcDiagnosticError)throw e
      throw new RpcDiagnosticError(method,e instanceof Error&&e.name==='AbortError'?'timeout':'network_error')
    }finally{clearTimeout(timer)}
  }
  const tx=await call('eth_getTransactionByHash',[hash])
  const txHashMatches=String(tx?.hash||'').toLowerCase()===hash
  const blockMatches=typeof tx?.blockNumber==='string'&&/^0x[0-9a-f]+$/i.test(tx.blockNumber)&&
    Number(BigInt(tx.blockNumber))===block
  const senderMatches=evmAddress(tx?.from)===address
  const selector=typeof tx?.input==='string'&&/^0x[0-9a-f]{8}/i.test(tx.input)?tx.input.slice(0,10).toLowerCase():null
  const receipt=await call('eth_getTransactionReceipt',[hash])
  const receiptMatches=String(receipt?.transactionHash||'').toLowerCase()===hash&&
    typeof receipt?.blockNumber==='string'&&/^0x[0-9a-f]+$/i.test(receipt.blockNumber)&&
    Number(BigInt(receipt.blockNumber))===block
  const receiptSuccessful=receipt?.status==='0x1'
  if(!Array.isArray(receipt?.logs))throw new RpcDiagnosticError('eth_getTransactionReceipt','invalid_logs')
  const zeroTopic='0x'+'0'.repeat(64)
  const walletTopic='0x'+address.slice(2).padStart(64,'0')
  const matching=receipt.logs.filter((l:any)=>evmAddress(l?.address)===contract&&
    Array.isArray(l?.topics)&&String(l.topics[0]||'').toLowerCase()===TRANSFER_TOPIC&&
    String(l.topics[1]||'').toLowerCase()===zeroTopic&&
    String(l.topics[2]||'').toLowerCase()===walletTopic&&
    typeof l?.data==='string'&&/^0x[0-9a-f]{1,64}$/i.test(l.data))
  let decimals:number|null=null,decimalsVerified=false
  // Token decimals are read on-chain: never hard-code an assumption of 18.
  const decimalsHex=await call('eth_call',[{to:contract,data:'0x313ce567'},hexBlock(block)])
  if(typeof decimalsHex==='string'&&/^0x[0-9a-f]{1,64}$/i.test(decimalsHex)){
    const d=Number(BigInt(decimalsHex));if(Number.isSafeInteger(d)&&d>=0&&d<=36){decimals=d;decimalsVerified=true}
  }
  const expectedRaw=decimalsVerified?amountInBaseUnits(expectedAmount,decimals!):null
  const rawAmounts=matching.map((l:any)=>BigInt(l.data))
  const mintAmountMatches=expectedRaw!==null&&rawAmounts.length===1&&rawAmounts[0]===expectedRaw
  const independentlyConfirmed=txHashMatches&&blockMatches&&senderMatches&&receiptMatches&&receiptSuccessful&&mintAmountMatches
  return {txHashMatches,blockMatches,senderMatches,selector,receiptMatches,receiptSuccessful,
    matchingZeroMintsToWallet:matching.length,decimalsVerified,decimals,
    mintAmountMatches,independentlyConfirmed,
    scope:'One cache-derived transaction and mint. Does not independently redo storage continuity or prove reward/referral completeness.'}
}
async function inspectHistoricalInflowReceipt(wallet:string,hash:string,token:string,block:number,
  stakingAddresses?:Set<string>) {
  const address=evmAddress(wallet),contract=evmAddress(token)
  if(!address||!contract||!/^0x[0-9a-f]{64}$/.test(hash)||!Number.isSafeInteger(block)||block<1||!ALCHEMY_API_KEY)
    throw new RpcDiagnosticError('candidate_receipt','invalid_anchor')
  const url=`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`
  const call=async(method:string)=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000)
    try {
      const res=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,
        body:JSON.stringify({jsonrpc:'2.0',id:33,method,params:[hash]})})
      if(!res.ok)throw new RpcDiagnosticError(method,'http_error',res.status)
      let body:any
      try{body=await res.json()}catch{throw new RpcDiagnosticError(method,'invalid_json')}
      if(body?.error)throw new RpcDiagnosticError(method,'rpc_error',null,rpcCodeOf(body.error))
      if(!body?.result)throw new RpcDiagnosticError(method,'missing_result')
      return body.result
    }catch(e){if(e instanceof RpcDiagnosticError)throw e
      throw new RpcDiagnosticError(method,e instanceof Error&&e.name==='AbortError'?'timeout':'network_error')
    }finally{clearTimeout(timer)}
  }
  const tx=await call('eth_getTransactionByHash')
  const receipt=await call('eth_getTransactionReceipt')
  const txMatches=String(tx?.hash||'').toLowerCase()===hash&&
    typeof tx?.blockNumber==='string'&&/^0x[0-9a-f]+$/i.test(tx.blockNumber)&&Number(BigInt(tx.blockNumber))===block
  const receiptMatches=String(receipt?.transactionHash||'').toLowerCase()===hash&&
    typeof receipt?.blockNumber==='string'&&/^0x[0-9a-f]+$/i.test(receipt.blockNumber)&&Number(BigInt(receipt.blockNumber))===block
  if(!Array.isArray(receipt?.logs))throw new RpcDiagnosticError('eth_getTransactionReceipt','invalid_logs')
  const recipientTopic='0x'+address.slice(2).padStart(64,'0'),zeroTopic='0x'+'0'.repeat(64)
  const logs=receipt.logs.filter((l:any)=>evmAddress(l?.address)===contract&&
    Array.isArray(l?.topics)&&String(l.topics[0]||'').toLowerCase()===TRANSFER_TOPIC&&
    String(l.topics[2]||'').toLowerCase()===recipientTopic&&
    typeof l.data==='string'&&/^0x[0-9a-f]{1,64}$/i.test(l.data))
  // Apply exactly the browser Step-4 transfer decision, using all receipt
  // ERC20 flows (including outgoing swap legs), not just the target token.
  // Missing selector-intent/state-delta/trace evidence is deliberately false.
  // Its verdict is exploratory until these proof sources are available.
  const allTransfers=receipt.logs.filter((l:any)=>evmAddress(l?.address)&&
    Array.isArray(l?.topics)&&l.topics.length>=3&&
    String(l.topics[0]||'').toLowerCase()===TRANSFER_TOPIC&&
    /^0x[0-9a-f]{64}$/i.test(String(l.topics[1]||''))&&
    /^0x[0-9a-f]{64}$/i.test(String(l.topics[2]||''))&&
    /^0x[0-9a-f]{1,64}$/i.test(String(l.data||'')))
    .map((l:any)=>({token:evmAddress(l.address),
      from:'0x'+String(l.topics[1]).slice(-40).toLowerCase(),
      to:'0x'+String(l.topics[2]).slice(-40).toLowerCase(),amountRaw:String(l.data)}))
  const bridge=evmAddress(tx?.to)==='0xa7c14010afa616fa23a2bb0a94d76dd57dde644d'||
    receipt.logs.some((l:any)=>String(l?.topics?.[0]||'').toLowerCase()===
      '0xcd6ac346191b4b7531743e58f243dd4d350a52a9186641c1e5eac22b95aaedbe')
  const sharedFlow=verificationCore.classifyRewardTransferFlow({wallet:address,
    callTo:evmAddress(tx?.to)||'',transfers:allTransfers,bridge,
    lifecycle:false,explicitRewardIntent:false,stateDeltaEvidence:[],traceSources:[]})
  return {txMatches,receiptMatches,receiptSuccessful:receipt?.status==='0x1',
    selector:typeof tx?.input==='string'&&/^0x[0-9a-f]{8}/i.test(tx.input)?tx.input.slice(0,10).toLowerCase():null,
    matchingTokenInflowLogs:logs.length,zeroMintLogs:logs.filter((l:any)=>String(l.topics[1]||'').toLowerCase()===zeroTopic).length,
    directStakingContractCall:!!stakingAddresses?.has(evmAddress(tx?.to)||''),
    txSenderIsStakingContract:!!stakingAddresses?.has(evmAddress(tx?.from)||''),
    tokenTransferFromStakingContract:logs.some((l:any)=>stakingAddresses?.has('0x'+String(l.topics[1]||'').toLowerCase().slice(-40))),
    sharedFlowKind:sharedFlow.kind,sharedPayoutCandidates:sharedFlow.payoutTransfers.length,
    transferEvidenceConfirmed:txMatches&&receiptMatches&&receipt?.status==='0x1'&&logs.length>0,
    rewardClassified:false}
}
// Receipt proof for previously staged transfers. No new wallet discovery and
// no reward allocation: all original transfer rows must match on-chain logs.
async function verifyStagedReceipt(wallet:string,hash:string,block:number,events:any[],lots:any[]){
  const address=evmAddress(wallet)
  if(!address||!/^0x[0-9a-f]{64}$/.test(hash)||!Number.isSafeInteger(block)||block<1||
    events.length<1||events.length>250||events.some(e=>num(e?.block)!==block||
      String(e?.hash||'').toLowerCase()!==hash)||!ALCHEMY_API_KEY)
    throw new RpcDiagnosticError('staged_receipt','invalid_evidence')
  const url=`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`
  const call=async(method:string)=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000)
    try{
      const res=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,
        body:JSON.stringify({jsonrpc:'2.0',id:37,method,params:[hash]})})
      if(!res.ok)throw new RpcDiagnosticError(method,'http_error',res.status)
      const body=await res.json()
      if(body?.error)throw new RpcDiagnosticError(method,'rpc_error',null,rpcCodeOf(body.error))
      if(!body?.result)throw new RpcDiagnosticError(method,'missing_result')
      return body.result
    }catch(e){if(e instanceof RpcDiagnosticError)throw e
      throw new RpcDiagnosticError(method,e instanceof Error&&e.name==='AbortError'?'timeout':'network_error')
    }finally{clearTimeout(timer)}
  }
  const [tx,receipt]=await Promise.all([call('eth_getTransactionByHash'),call('eth_getTransactionReceipt')])
  if(String(tx?.hash||'').toLowerCase()!==hash||String(receipt?.transactionHash||'').toLowerCase()!==hash||
    Number(BigInt(tx?.blockNumber||0))!==block||Number(BigInt(receipt?.blockNumber||0))!==block||
    receipt?.status!=='0x1'||!Array.isArray(receipt?.logs))
    throw new RpcDiagnosticError('staged_receipt','tx_receipt_mismatch')
  const transferLogs=receipt.logs.filter((l:any)=>evmAddress(l?.address)&&
    Array.isArray(l?.topics)&&l.topics.length>=3&&
    String(l.topics[0]||'').toLowerCase()===TRANSFER_TOPIC&&
    /^0x[0-9a-f]{64}$/i.test(String(l.topics[1]||''))&&
    /^0x[0-9a-f]{64}$/i.test(String(l.topics[2]||''))&&
    /^0x[0-9a-f]{1,64}$/i.test(String(l.data||'')))
    .map((l:any)=>({token:evmAddress(l.address),from:'0x'+String(l.topics[1]).slice(-40).toLowerCase(),
      to:'0x'+String(l.topics[2]).slice(-40).toLowerCase(),amountRaw:String(l.data),
      logIndex:Number(BigInt(l.logIndex||0))}))
  if(transferLogs.length>400)throw new RpcDiagnosticError('staged_receipt','receipt_log_budget_exceeded')
  const matchedIndexes=new Set<number>()
  for(const event of events){
    if(event?.kind==='staking_contract_call'){
      if(evmAddress(event.from)!==address||evmAddress(event.to)!==evmAddress(tx.to)||
        evmAddress(tx.from)!==address||String(event.hash).toLowerCase()!==hash)
        throw new RpcDiagnosticError('staged_receipt','contract_call_mismatch')
      continue
    }
    const token=evmAddress(event?.token),from=evmAddress(event?.from),to=evmAddress(event?.to)
    const raw=String(event?.rawValue||'')
    if(!token||!from||!to||!/^0x[0-9a-f]+$/i.test(raw))
      throw new RpcDiagnosticError('staged_receipt','transfer_log_mismatch')
    const match=transferLogs.findIndex((l,i)=>!matchedIndexes.has(i)&&l.token===token&&
      l.from===from&&l.to===to&&BigInt(l.amountRaw)===BigInt(raw))
    if(match<0)throw new RpcDiagnosticError('staged_receipt','transfer_log_mismatch')
    matchedIndexes.add(match)
  }
  const bridge=evmAddress(tx.to)==='0xa7c14010afa616fa23a2bb0a94d76dd57dde644d'||
    receipt.logs.some((l:any)=>String(l?.topics?.[0]||'').toLowerCase()===
      '0xcd6ac346191b4b7531743e58f243dd4d350a52a9186641c1e5eac22b95aaedbe')
  const relatedLots=(lots||[]).filter((lot:any)=>[lot?.stakeTx,lot?.unstakeTx,
    ...(Array.isArray(lot?.topUps)?lot.topUps.map((x:any)=>x?.tx):[])].some(t=>String(t||'').toLowerCase()===hash))
  const lifecycle=relatedLots.length>0
  const flow=verificationCore.classifyRewardTransferFlow({wallet:address,callTo:evmAddress(tx?.to)||'',
    transfers:transferLogs,bridge,lifecycle,explicitRewardIntent:false,
    stateDeltaEvidence:[],traceSources:[]})
  const verifiedTopup=relatedLots.filter((lot:any)=>(lot?.topUps||[]).some((x:any)=>
    String(x?.tx||'').toLowerCase()===hash&&x?.evidence==='onchain_same_wallet_position_state'&&
    x?.storageProof?.proven===true)).length
  const zero='0x'+'0'.repeat(40)
  const referralMints=transferLogs.filter((l:any)=>l.from===zero&&l.to===address&&
    REFERRAL_MINT_CONTRACTS.includes(l.token)&&BigInt(l.amountRaw)>0n&&
    transferLogs.filter((x:any)=>x.token===l.token).reduce((sum:bigint,x:any)=>
      sum+(x.to===address?BigInt(x.amountRaw):0n)-(x.from===address?BigInt(x.amountRaw):0n),0n)>0n)
  const stakeEvents=receipt.logs.filter((l:any)=>evmAddress(l?.address)===evmAddress(tx?.to)&&
    String(l?.topics?.[0]||'').toLowerCase()===STAKE_EVENT_TOPIC&&
    Array.isArray(l.topics)&&l.topics.length>=2&&
    '0x'+String(l.topics[1]).slice(-40).toLowerCase()===evmAddress(tx?.from))
  const principalTransfers=transferLogs.filter((l:any)=>l.from===evmAddress(tx?.from)&&
    l.to===evmAddress(tx?.to)&&BigInt(l.amountRaw)>0n)
  return {receiptVerified:true,transferLogsMatched:matchedIndexes.size,receiptTransfers:transferLogs.length,
    transfers:transferLogs,
    referralMintTokens:[...new Set(referralMints.map((l:any)=>l.token))],
    referralPrincipalTransfers:principalTransfers.length,
    referralStakeEvents:stakeEvents.length,
    transactionSender:evmAddress(tx?.from)||null,
    calledContract:evmAddress(tx?.to)||null,
    selector:typeof tx?.input==='string'&&/^0x[0-9a-f]{8}/i.test(tx.input)?tx.input.slice(0,10).toLowerCase():null,
    flowKind:flow.kind,flowPayoutCandidates:flow.payoutTransfers.length,
    lifecycleLotMatches:relatedLots.length,verifiedTopupLotMatches:verifiedTopup,
    knownBridge:bridge,classificationVerified:false}
}
async function probeHistoricalRewardState(wallet:string,receipt:any,block:number,stakingContracts:string[]){
  const callTo=evmAddress(receipt?.calledContract),sender=evmAddress(receipt?.transactionSender)
  const safeContracts=new Set(stakingContracts)
  const incoming=(receipt?.transfers||[]).filter((t:any)=>
    evmAddress(t?.from)===callTo&&evmAddress(t?.to)===wallet)
  const hasOutgoing=(receipt?.transfers||[]).some((t:any)=>evmAddress(t?.from)===wallet&&evmAddress(t?.to)!==wallet)
  if(!callTo||sender!==wallet||!safeContracts.has(callTo)||receipt?.knownBridge||
    receipt?.lifecycleLotMatches>0||verificationCore.knownClaimMethodIntent(receipt?.selector)||
    incoming.length===0||hasOutgoing||!Number.isSafeInteger(block)||block<1)
    return {attempted:false,paired:0,deltas:[]}
  const signatures=(verificationCore.rewardStateProbeSignatures as string[]).filter((s:string)=>
    ['earned(address)','pendingRewards(address)','referralRewards(address)'].includes(s))
  const url=`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`
  const calls=signatures.flatMap(sig=>[block-1,block].map(height=>({sig,height,
    data:verificationCore.keccakSelector(sig)+wallet.slice(2).padStart(64,'0')})))
  const results=await Promise.all(calls.map(async c=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500)
    try{
      const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({jsonrpc:'2.0',id:41,method:'eth_call',
          params:[{to:callTo,data:c.data},'0x'+c.height.toString(16)]}),signal:controller.signal})
      if(!response.ok)return null
      const data=await response.json()
      return typeof data?.result==='string'&&/^0x[0-9a-f]{64}$/i.test(data.result)?data.result.toLowerCase():null
    }catch{return null}finally{clearTimeout(timer)}
  }))
  const deltas:any[]=[];let paired=0
  for(let i=0;i<signatures.length;i++){
    const before=results[i*2],after=results[i*2+1]
    if(before===null||after===null)continue
    paired++
    if(before!==after)deltas.push({contract:callTo,sig:signatures[i],before,after})
  }
  return {attempted:true,paired,deltas}
}
// Mirrors the manual Step-4 traceCalledAddresses source: a positive internal
// callTracer/trace_transaction path is evidence; provider failures are not.
// Restrict to known wallet-initiated staking claim calls and bounded receipts.
async function receiptInternalCallSources(hash:string,receipt:any,wallet:string,stakingContracts:string[]){
  const callTo=evmAddress(receipt?.calledContract),sender=evmAddress(receipt?.transactionSender)
  const knownIntent=verificationCore.knownClaimMethodIntent(receipt?.selector)
  const transfers=Array.isArray(receipt?.transfers)?receipt.transfers:[]
  const incoming=transfers.filter((t:any)=>t.to===wallet&&t.from!==wallet)
  const indirect=incoming.filter((t:any)=>t.from!==callTo&&t.from!=='0x'+'0'.repeat(40))
  if(!ALCHEMY_API_KEY||!callTo||sender!==wallet||!stakingContracts.includes(callTo)||
    !knownIntent||!/^0x[0-9a-f]{64}$/.test(hash)||receipt?.receiptVerified!==true||
    receipt?.knownBridge===true||receipt?.lifecycleLotMatches>0||
    !indirect.length||transfers.length>400)return {attempted:false,verified:false,sources:[],reason:'no_scoped_indirect_claim'}
  const url=`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`
  const call=async(method:string,params:any[])=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000)
    try{
      const res=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},
        signal:controller.signal,body:JSON.stringify({jsonrpc:'2.0',id:73,method,params})})
      if(!res.ok)return null
      const data=await res.json();return data?.error||data?.result==null?null:data.result
    }catch{return null}finally{clearTimeout(timer)}
  }
  const sources=new Set<string>(),limit=128
  const add=(value:any)=>{const address=evmAddress(value);if(address)sources.add(address)}
  let sourceMethod:string|null=null,invalid=false
  const trace=await call('debug_traceTransaction',[hash,{tracer:'callTracer',timeout:'8s'}])
  if(trace&&typeof trace==='object'&&evmAddress(trace.from)===wallet&&evmAddress(trace.to)===callTo){
    const visit=(node:any,depth:number)=>{
      if(depth>16||sources.size>limit){invalid=true;return}
      add(node?.to)
      if(Array.isArray(node?.calls))for(const child of node.calls)visit(child,depth+1)
    }
    visit(trace,0)
    if(!invalid&&sources.has(callTo))sourceMethod='debug_traceTransaction'
  }
  if(!sourceMethod){
    sources.clear();invalid=false
    const rows=await call('trace_transaction',[hash])
    if(Array.isArray(rows)&&rows.length<=limit){
      for(const item of rows){
        if(String(item?.transactionHash||'').toLowerCase()!==hash){invalid=true;break}
        add(item?.action?.to)
      }
      if(!invalid&&sources.has(callTo))sourceMethod='trace_transaction'
    }
  }
  if(!sourceMethod||sources.size>limit)
    return {attempted:true,verified:false,sources:[],reason:'trace_unavailable_or_invalid'}
  const flow=verificationCore.classifyRewardTransferFlow({wallet,callTo,transfers,
    lifecycle:false,bridge:receipt.knownBridge,explicitRewardIntent:true,
    stateDeltaEvidence:[],traceSources:[...sources]})
  const candidates=flow.payoutTransfers.filter((t:any)=>t.rewardFlowEvidence==='from_internal_call_chain'&&
    /^0x[0-9a-f]{40}$/i.test(String(t.token||''))&&
    /^0x[0-9a-f]+$/i.test(String(t.amountRaw||''))&&BigInt(t.amountRaw)>0n)
    .map((t:any)=>({token:t.token,amountRaw:BigInt(t.amountRaw).toString(),
      logIndex:t.logIndex,from:t.from,proof:t.rewardProof,causalPath:t.rewardFlowEvidence,
      rewardVerified:false}))
  return {attempted:true,verified:true,method:sourceMethod,
    sources:[...sources],candidates,reason:null}
}
const SMARTNODE_CONTRACT='0x028c911c10c9e346158206991e02d09bd0a8a35b'
const SMARTNODE_PARENT_GETTERS=[
  'referrerOf(address)','getReferrer(address)','referrer(address)','referrers(address)',
  'sponsorOf(address)','sponsor(address)','upline(address)','parent(address)','inviter(address)'
]
const SMARTNODE_JOIN_SELECTOR=verificationCore.keccakSelector('join(address)')
async function smartNodeRpc(method:string,params:any[]){
  if(!ALCHEMY_API_KEY)throw new Error('SmartNode RPC unavailable')
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500)
  try{
    const response=await fetch(`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`,
      {method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,
        body:JSON.stringify({jsonrpc:'2.0',id:74,method,params})})
    if(!response.ok)throw new Error('SmartNode RPC HTTP failure')
    const body=await response.json()
    if(body?.error||body?.result===undefined)throw new Error('SmartNode RPC invalid response')
    return body.result
  }finally{clearTimeout(timer)}
}
async function onchainSmartNodeParent(wallet:string,deadline:number):Promise<{
  parent:string|null;source?:string;hash?:string|null;reason?:string
}>{
  // Same ordered nine direct parent getters and historical join fallback as
  // manual Step-5; never accept an empty/failed response as a zero parent.
  for(const signature of SMARTNODE_PARENT_GETTERS){
    if(Date.now()>deadline)return {parent:null,reason:'time_budget'}
    try{
      const result=await smartNodeRpc('eth_call',[{to:SMARTNODE_CONTRACT,
        data:verificationCore.keccakSelector(signature)+wallet.slice(2).padStart(64,'0')},'latest'])
      const parent=typeof result==='string'&&/^0x[0-9a-f]{64}$/i.test(result)
        ?evmAddress('0x'+result.slice(-40)):null
      if(parent&&parent!==wallet&&parent!=='0x'+'0'.repeat(40))
        return {parent,source:`SmartNode.${signature}`,hash:null}
    }catch{}
  }
  let pageKey:string|null=null
  const seenKeys=new Set<string>()
  for(let page=0;page<10;page++){
    if(Date.now()>deadline)return {parent:null,reason:'time_budget'}
    const query:any={fromBlock:'0x0',toBlock:'latest',fromAddress:wallet,
      toAddress:SMARTNODE_CONTRACT,category:['external'],excludeZeroValue:false,
      withMetadata:false,maxCount:'0x3e8',order:'asc'}
    if(pageKey)query.pageKey=pageKey
    let result:any
    try{result=await smartNodeRpc('alchemy_getAssetTransfers',[query])}
    catch{return {parent:null,reason:'join_rpc_unavailable'}}
    if(!Array.isArray(result?.transfers))return {parent:null,reason:'invalid_join_page'}
    for(const transfer of result.transfers){
      if(Date.now()>deadline)return {parent:null,reason:'time_budget'}
      const hash=typeof transfer?.hash==='string'&&/^0x[0-9a-f]{64}$/i.test(transfer.hash)
        ?transfer.hash.toLowerCase():null
      if(!hash||evmAddress(transfer?.from)!==wallet||evmAddress(transfer?.to)!==SMARTNODE_CONTRACT)
        return {parent:null,reason:'invalid_join_transfer'}
      let tx:any
      try{tx=await smartNodeRpc('eth_getTransactionByHash',[hash])}
      catch{return {parent:null,reason:'join_tx_unavailable'}}
      if(String(tx?.hash||'').toLowerCase()!==hash||evmAddress(tx?.from)!==wallet||
        evmAddress(tx?.to)!==SMARTNODE_CONTRACT)return {parent:null,reason:'join_tx_mismatch'}
      const input=String(tx?.input||'').toLowerCase()
      if(input.slice(0,10)!==SMARTNODE_JOIN_SELECTOR)continue
      const word=input.slice(10,74)
      if(!/^[0-9a-f]{64}$/.test(word))continue
      const parent=evmAddress('0x'+word.slice(-40))
      if(parent&&parent!==wallet&&parent!=='0x'+'0'.repeat(40))
        return {parent,source:'SmartNode.join(address)',hash}
    }
    const next=result.pageKey
    if(!next)return {parent:null,reason:'no_onchain_parent'}
    if(typeof next!=='string'||next.length>2000||seenKeys.has(next))
      return {parent:null,reason:'incomplete_join_pagination'}
    seenKeys.add(next);pageKey=next
  }
  return {parent:null,reason:'join_page_budget'}
}
// Cache-first part of the manual SmartNode Upline traversal (max 20 levels).
// Missing global edges/identities do not establish a negative or positive level.
async function cachedReferralPathEvidence(sb:any,sender:string,owner:string){
  const child=evmAddress(sender),target=evmAddress(owner),path:string[]=[]
  if(!child||!target||child===target)return {verified:false,level:null,reason:'invalid_or_self'}
  const seen=new Set<string>(),proofs:any[]=[]
  const deadline=Date.now()+16000
  let cursor=child
  for(let depth=1;depth<=20;depth++){
    if(seen.has(cursor))return {verified:false,level:null,reason:'cycle'}
    seen.add(cursor);path.push(cursor)
    const {data,error}=await sb.from('tln_vow_smartnode_graph_cache')
      .select('parent_wallet,join_tx_hash,verified_at')
      .eq('chain_key','bsc').eq('child_wallet',cursor).limit(2)
    if(error)return {verified:false,level:null,reason:'graph_unavailable'}
    if(!Array.isArray(data)||data.length>1)return {verified:false,level:null,reason:'ambiguous_parent'}
    const edge=data[0]||null
    let parent=evmAddress(edge?.parent_wallet),source='verified_global_graph',hash=edge?.join_tx_hash||null
    if(edge&&(!parent||parent===cursor||!edge.verified_at))
      return {verified:false,level:null,reason:'unverified_parent'}
    if(!edge){
      const onchain=await onchainSmartNodeParent(cursor,deadline)
      parent=onchain.parent||null;source=onchain.source||'onchain_unavailable';hash=onchain.hash||null
      if(!parent)return {verified:false,level:null,reason:onchain.reason||'parent_unresolved'}
    }
    proofs.push({child:cursor,parent,source,hash})
    if(parent===target){
      path.push(parent)
      const {data:identities,error:identityError}=await sb.from('tln_vow_identity_global_cache')
        .select('wallet_address,node_id,verified_at').eq('chain_key','bsc')
        .in('wallet_address',path)
      if(identityError)return {verified:false,level:null,reason:'identity_cache_unavailable'}
      const byWallet=new Map<string,Set<string>>()
      for(const item of identities||[]){
        const address=evmAddress(item.wallet_address),node=String(item.node_id||'')
        if(!address||!item.verified_at||!/^\d+$/.test(node)||node==='0')continue
        if(!byWallet.has(address))byWallet.set(address,new Set())
        byWallet.get(address)!.add(node)
      }
      if(path.some(w=>(byWallet.get(w)?.size||0)>1))
        return {verified:false,level:null,reason:'identity_ambiguous'}
      let onchainIdentities=0
      for(const address of path){
        if(byWallet.get(address)?.size===1)continue
        if(Date.now()>deadline)return {verified:false,level:null,reason:'identity_time_budget'}
        let raw:any
        try{raw=await smartNodeRpc('eth_call',[{to:SMARTNODE_CONTRACT,
          data:verificationCore.keccakSelector('nodeIdOf(address)')+address.slice(2).padStart(64,'0')},'latest'])}
        catch{return {verified:false,level:null,reason:'identity_getter_unavailable'}}
        if(typeof raw!=='string'||!/^0x[0-9a-f]{64}$/i.test(raw)||BigInt(raw)===0n)
          return {verified:false,level:null,reason:'identity_unresolved'}
        byWallet.set(address,new Set([BigInt(raw).toString()]));onchainIdentities++
      }
      return {verified:true,level:depth,source:proofs.some(p=>p.source!=='verified_global_graph')
        ?'cache_plus_onchain':'verified_global_graph',path,proofs,
        identityProof:onchainIdentities?'global_cache_plus_onchain_getter':'verified_global_identity_cache',
        onchainIdentities}
    }
    if(seen.has(parent))return {verified:false,level:null,reason:'cycle'}
    cursor=parent
  }
  return {verified:false,level:null,reason:'max_depth'}
}
async function attachManualRewardProofMatches(wallet:string,hash:string,receipt:any,snapshot:any,stakingContracts:string[],block:number,sb?:any){
  const referralFinal=verificationCore.manualReferralMintVerdict({
    sender:receipt?.transactionSender,
    staking:stakingContracts.includes(receipt?.calledContract)?{address:receipt.calledContract}:null,
    principalTransfers:Array.from({length:Math.min(1,receipt?.referralPrincipalTransfers||0)},()=>({})),
    stakeEvents:Array.from({length:Math.min(1,receipt?.referralStakeEvents||0)},()=>({}))
  },wallet)
  // The receipt verifier already established every transfer log against the
  // chain. Preserve the exact raw payout per contract, including multi-mint
  // receipts, before the manual Step-5 strong/path decision. This is proof
  // metadata, NOT an additional reward classification or canonical claim.
  const referralMintCandidates:any[]=[]
  const zero='0x'+'0'.repeat(40)
  if(referralFinal.strong&&Array.isArray(receipt?.referralMintTokens)&&
      Array.isArray(receipt?.transfers)&&receipt.receiptVerified===true){
    for(const token of receipt.referralMintTokens){
      const mintLogs=receipt.transfers.filter((t:any)=>t?.token===token&&
        t?.from===zero&&t?.to===wallet&&/^0x[0-9a-f]+$/i.test(String(t?.amountRaw||''))&&
        Number.isSafeInteger(t?.logIndex)&&t.logIndex>=0)
      if(!mintLogs.length||mintLogs.length>400)continue
      const logIndexes=mintLogs.map((t:any)=>t.logIndex)
      if(new Set(logIndexes).size!==logIndexes.length)continue
      const mintAmountRaw=mintLogs.reduce((n:bigint,t:any)=>n+BigInt(t.amountRaw),0n)
      if(mintAmountRaw<=0n)continue
      const allTokenLogs=receipt.transfers.filter((t:any)=>t?.token===token)
      const walletNetRaw=allTokenLogs.reduce((n:bigint,t:any)=>n+
        (t.to===wallet?BigInt(t.amountRaw):0n)-
        (t.from===wallet?BigInt(t.amountRaw):0n),0n)
      if(walletNetRaw<=0n)continue
      referralMintCandidates.push({token,kind:'referral_mint_strong',
        mintAmountRaw:mintAmountRaw.toString(),mintLogIndexes:logIndexes,
        walletNetRaw:walletNetRaw.toString(),receiptVerified:true,
        storedEvidenceOnly:true})
    }
  }
  const referralPath=referralMintCandidates.length&&sb
    ?await cachedReferralPathEvidence(sb,receipt.transactionSender,wallet)
    :{verified:false,level:null,reason:'no_candidate_or_cache'}
  for(const candidate of referralMintCandidates){
    candidate.referralPathVerified=referralPath.verified===true
    candidate.referralLevel=referralPath.level
    candidate.referralPathEvidence=referralPath
  }
  const positionEvidence=verificationCore.manualPositionReceiptEvidence({wallet,receipt,stakingContracts,
    lots:snapshot?.process?.lots||[],block})
  // A historical snapshot may still contain two independent lots with full
  // targeted storage evidence. Re-run the EXACT browser continuity verdict;
  // no merge or inferred top-up when either proof is absent.
  const manualLots=Array.isArray(snapshot?.process?.lots)?snapshot.process.lots:[]
  const currentLots=manualLots.filter((l:any)=>String(l?.stakeTx||'').toLowerCase()===hash)
  const topUpContinuityCandidates:any[]=[]
  for(const next of currentLots){
    const nextContract=evmAddress(next?.staking?.contract_address||next?.counterparty)
    if(!nextContract)continue
    for(const previous of manualLots){
      if(previous===next||evmAddress(previous?.staking?.contract_address||previous?.counterparty)!==nextContract)continue
      const earlier=Date.parse(String(previous?.stakeTime||'')),later=Date.parse(String(next?.stakeTime||''))
      if(!Number.isFinite(earlier)||!Number.isFinite(later)||earlier>=later)continue
      const proof=verificationCore.manualTopUpStorageContinuity(previous,next)
      if(proof.proven===true)topUpContinuityCandidates.push({previousStakeTx:previous.stakeTx,
        nextStakeTx:next.stakeTx,storageProof:proof})
    }
  }
  const matches=verificationCore.reconcileVerifiedTopUpReceipt({wallet,hash,receipt,
    lots:snapshot?.process?.lots||[],provenRows:snapshot?.globals?.provenRewardRows||[]})
  const stakeMatches=verificationCore.reconcileVerifiedStakeReceipt({wallet,hash,receipt,
    lots:snapshot?.process?.lots||[],provenRows:snapshot?.globals?.provenRewardRows||[]})
  const newCandidates=verificationCore.discoverNewMintRewardCandidates({wallet,hash,receipt,
    calledContract:receipt.calledContract,stakingContracts,
    knownLifecycle:receipt.lifecycleLotMatches>0})
  const claimCandidates=verificationCore.classifyExplicitClaimReceipt({wallet,hash,receipt,stakingContracts})
  const bonusEvidence=verificationCore.manualBonusEvidenceForClaim({selector:receipt.selector})
  const bonusClaimCandidates=bonusEvidence
    ?claimCandidates.filter((c:any)=>c.kind==='bonus') : []
  const stateProbe=await probeHistoricalRewardState(wallet,receipt,block,stakingContracts)
  const stateCandidates=verificationCore.classifyStateDeltaReceipt({wallet,hash,receipt,
    stakingContracts,stateDeltas:stateProbe.deltas})
  const indirectTrace=await receiptInternalCallSources(hash,receipt,wallet,stakingContracts)
  const indirectRewardCandidates=indirectTrace.candidates||[]
  const referralClaimCandidates=[...claimCandidates.filter((c:any)=>c.kind==='referral'),
    ...stateCandidates.filter((c:any)=>c.kind==='referral_state_change')]
  const lotAssignments=verificationCore.assignReceiptCandidatesToUniqueLots({wallet,hash,receipt,
    lots:snapshot?.process?.lots||[],candidates:[...newCandidates,...claimCandidates,...stateCandidates]})
  // A matched historical proof is only a reconciliation hint: this does not
  // establish complete reward or referral coverage or create a claim.
  return {...receipt,manualPositionEvidence:positionEvidence,
    manualTopUpContinuityCandidates:topUpContinuityCandidates,
    manualRewardProofMatches:matches,manualStakeClaimMatches:stakeMatches,
    manualStakeClaimMatchCount:stakeMatches.length,newRewardMintCandidates:newCandidates,
    explicitClaimCandidates:claimCandidates,explicitClaimCandidateCount:claimCandidates.length,
    bonusClaimCandidates,bonusClaimCandidateCount:bonusClaimCandidates.length,
    referralClaimCandidates,referralClaimCandidateCount:referralClaimCandidates.length,
    referralMintCandidates,referralMintCandidateCount:referralMintCandidates.length,
    referralMintPathVerifiedCount:referralMintCandidates.filter((c:any)=>c.referralPathVerified).length,
    stateProbeAttempted:stateProbe.attempted,stateProbePaired:stateProbe.paired,
    stateChangeCandidates:stateCandidates,stateChangeCandidateCount:stateCandidates.length,
    indirectTraceAttempted:indirectTrace.attempted,indirectTraceVerified:indirectTrace.verified,
    indirectTraceMethod:indirectTrace.method||null,
    indirectTraceSources:indirectTrace.sources,
    indirectRewardCandidates,indirectRewardCandidateCount:indirectRewardCandidates.length,
    uniqueLotAssignmentCandidates:lotAssignments,uniqueLotAssignmentCandidateCount:lotAssignments.length,
    newRewardMintCandidateCount:newCandidates.length,
    manualRewardProofMatchCount:matches.length,classificationVerified:false}
}
const num = (v: unknown) => { const n=Number(v); return Number.isSafeInteger(n) && n>=0 ? n : null }
// The manual ERC20 raw cache is refreshed independently of this immutable
// staging ledger. Its newest overlap anchor may MOVE FORWARD after staging
// began. Preserve the oldest stored anchor, but never accept a gap, overlap,
// future block or an initial stage that skips the current cache anchor.
function contiguousStagedForwardRange(rows:any[],currentAnchor:number,head:number){
  if(!Number.isSafeInteger(currentAnchor)||currentAnchor<0||
    !Number.isSafeInteger(head)||head<currentAnchor)
    return {valid:false,next:null,anchor:null}
  if(!Array.isArray(rows)||!rows.length)
    return {valid:true,next:currentAnchor,anchor:currentAnchor}
  const first=num(rows[0]?.from_block)
  if(first===null||first>currentAnchor)return {valid:false,next:null,anchor:null}
  let next=first
  for(const row of rows){
    const from=num(row?.from_block),to=num(row?.to_block)
    if(from===null||to===null||to<from||to>head||from!==next)
      return {valid:false,next:null,anchor:first}
    next=to+1
  }
  return {valid:true,next,anchor:first}
}
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
// Bounded replay of the browser's inspectKnownStakeStructHeadless reads for one
// already known historical top-up. No root guessing, pagination or state writes.
async function replayKnownTopupStorage(wallet:string,contract:string,firstBlock:number,secondBlock:number,
  root:number,startOffset:number,offsets:number[],firstTime:string,secondTime:string){
  if(!NODEREAL_BSC_RPC_URL||!/^https:\/\//.test(NODEREAL_BSC_RPC_URL))
    throw new Error('archive_rpc_not_configured')
  if(!evmAddress(wallet)||!evmAddress(contract)||firstBlock<1||secondBlock<=firstBlock||
    offsets.length<2||offsets.length>8||!offsets.includes(startOffset))throw new Error('invalid_known_struct')
  const reads=offsets.flatMap(offset=>[firstBlock,secondBlock].flatMap(block=>[block-1,block]
    .map(height=>({offset,block,height,slot:verificationCore.manualWalletMappingSlot(wallet,root,offset)}))))
  if(reads.some(x=>!x.slot)||reads.length>32)throw new Error('invalid_known_struct')
  const requests=reads.map((r,i)=>({jsonrpc:'2.0',id:i+1,method:'eth_getStorageAt',
    params:[contract,r.slot,'0x'+r.height.toString(16)]}))
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),20000)
  let responses:any
  try{
    const response=await fetch(NODEREAL_BSC_RPC_URL,{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify(requests),signal:ctl.signal})
    if(!response.ok)throw new Error('archive_rpc_http_error')
    responses=await response.json()
  }catch{throw new Error('archive_rpc_unavailable')}
  finally{clearTimeout(timer)}
  if(!Array.isArray(responses)||responses.length!==reads.length)throw new Error('archive_rpc_incomplete')
  const byId=new Map(responses.map((r:any)=>[r?.id,r]))
  const value=(id:number)=>{
    const result=byId.get(id)?.result
    if(!/^0x[0-9a-f]{1,64}$/i.test(String(result||'')))throw new Error('archive_storage_invalid')
    return '0x'+BigInt(result).toString(16)
  }
  const timestamps=[firstTime,secondTime].map(t=>Math.floor(Date.parse(t)/1000))
  if(timestamps.some(t=>!Number.isSafeInteger(t)||t<=0))throw new Error('invalid_known_struct')
  const targets=[firstBlock,secondBlock].map((block,bi)=>({available:true,root,startRow:{offset:startOffset},
    coreOffsets:offsets,byOffset:offsets.map((offset,oi)=>{
      const index=oi*4+bi*2,prev=value(index+1),at=value(index+2)
      const classify=(raw:string)=>({value:BigInt(raw).toString(),
        timestamp:offset===startOffset&&BigInt(raw)<=BigInt(Number.MAX_SAFE_INTEGER)?Number(BigInt(raw)):null})
      return {offset,before:classify(prev),stake:classify(at)}
    })}))
  const first={stakeTime:firstTime,durationReference:{targeted:targets[0]}}
  const second={stakeTime:secondTime,durationReference:{targeted:targets[1]}}
  return verificationCore.manualTopUpStorageContinuity(first,second)
}
// Browser archiveStorageScan A1/A2/B/C selection order, limited to ONE
// already-known successful historical stake. No guessed reward or lot writes.
async function discoverKnownStakeRoot(wallet:string,contract:string,block:number,stakeTs:number){
  if(!NODEREAL_BSC_RPC_URL||!/^https:\/\//.test(NODEREAL_BSC_RPC_URL))
    throw new Error('archive_rpc_not_configured')
  if(!evmAddress(wallet)||!evmAddress(contract)||!Number.isSafeInteger(block)||block<1||
    !Number.isSafeInteger(stakeTs)||stakeTs<1000000000)throw new Error('invalid_stake_context')
  let reads=0
  const readChanges=async (candidates:{root:number,offset:number}[])=>{
    if(candidates.length>81||reads+candidates.length*2>512)throw new Error('archive_root_scan_budget')
    const out:any[]=[]
    // NodeReal's working browser RPC supports bounded JSON-RPC batches.
    for(let start=0;start<candidates.length;start+=20){
      const part=candidates.slice(start,start+20),jobs=part.flatMap((c,i)=>[block-1,block]
        .map((height,side)=>({jsonrpc:'2.0',id:1+i*2+side,method:'eth_getStorageAt',
          params:[contract,verificationCore.manualWalletMappingSlot(wallet,c.root,c.offset),'0x'+height.toString(16)]})))
      const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000)
      let raw:any
      try{
        const response=await fetch(NODEREAL_BSC_RPC_URL,{method:'POST',headers:{'content-type':'application/json'},
          body:JSON.stringify(jobs),signal:ctrl.signal})
        if(!response.ok)throw new Error('archive_rpc_http_error')
        raw=await response.json()
      }catch{throw new Error('archive_rpc_unavailable')}
      finally{clearTimeout(timer)}
      if(!Array.isArray(raw)||raw.length!==jobs.length)throw new Error('archive_rpc_incomplete')
      const byId=new Map(raw.map((r:any)=>[r?.id,r]))
      const val=(id:number)=>{
        const value=byId.get(id)?.result
        if(!/^0x[0-9a-f]{1,64}$/i.test(String(value||'')))throw new Error('archive_storage_invalid')
        return BigInt(value)
      }
      for(let i=0;i<part.length;i++){
        const before=val(i*2+1),after=val(i*2+2)
        if(before===after)continue
        const asTs=(v:bigint)=>v<=BigInt(Number.MAX_SAFE_INTEGER)&&
          Math.abs(Number(v)-stakeTs)<=10?Number(v):null
        out.push({...part[i],before:before.toString(),after:after.toString(),
          beforeTimestamp:asTs(before),afterTimestamp:asTs(after)})
      }
      reads+=jobs.length
    }
    return out
  }
  const range=(roots:number[],start:number,end:number)=>roots.flatMap(root=>
    Array.from({length:end-start+1},(_,i)=>({root,offset:start+i})))
  const a1=await readChanges(range(Array.from({length:17},(_,i)=>i),0,0))
  let hitRoots=[...new Set(a1.map(x=>x.root))],a2:any[]=[]
  if(!hitRoots.length){a2=await readChanges(range(Array.from({length:48},(_,i)=>i+17),0,0));
    hitRoots=[...new Set(a2.map(x=>x.root))]}
  const rootsToExpand=hitRoots.length?hitRoots:[0,1,2,3,4,5,6,7,8]
  if(rootsToExpand.length>8)throw new Error('ambiguous_archive_roots')
  const b=await readChanges(range(rootsToExpand,0,8))
  const all=[...a1,...a2,...b]
  if(!all.some(x=>x.afterTimestamp!==null||x.beforeTimestamp!==null)){
    const c=await readChanges(range(rootsToExpand,9,16));all.push(...c)
  }
  const exact=[...new Map(all.filter(x=>x.afterTimestamp!==null||x.beforeTimestamp!==null)
    .map(x=>[x.root+'|'+x.offset,x])).values()]
  const roots=[...new Set(exact.map(x=>x.root))]
  const detectedRoot=roots.length===1?roots[0]:null
  const timestampOffsets=exact.filter(x=>x.root===detectedRoot&&x.afterTimestamp!==null)
  const detectedTimestampOffset=timestampOffsets.length===1?timestampOffsets[0].offset:null
  return {reads,stageAChanges:a1.length+a2.length,stageBChanges:all.length-a1.length-a2.length,
    matchingTimestampSlots:exact.length,matchingRoots:roots.length,
    detectedRoot,detectedTimestampOffset,
    exactStakeTimestampVerified:detectedRoot!==null&&detectedTimestampOffset!==null,
    rootAmbiguous:roots.length!==1||timestampOffsets.length!==1}
}
async function archiveBlockTimestamp(block:number){
  if(!NODEREAL_BSC_RPC_URL||!/^https:\/\//.test(NODEREAL_BSC_RPC_URL))
    throw new Error('archive_rpc_not_configured')
  if(!Number.isSafeInteger(block)||block<1)throw new Error('invalid_block')
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000)
  try{
    const response=await fetch(NODEREAL_BSC_RPC_URL,{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getBlockByNumber',
        params:['0x'+block.toString(16),false]}),signal:ctrl.signal})
    if(!response.ok)throw new Error('archive_block_unavailable')
    const payload=await response.json()
    const result=payload?.result
    if(!result||Number(BigInt(result.number||0))!==block||
      !/^0x[0-9a-f]+$/i.test(String(result.timestamp||'')))throw new Error('archive_block_mismatch')
    const ts=Number(BigInt(result.timestamp))
    if(!Number.isSafeInteger(ts)||ts<1000000000)throw new Error('archive_block_timestamp_invalid')
    return ts
  }catch(e){if(e instanceof Error&&e.message.startsWith('archive_'))throw e
    throw new Error('archive_block_unavailable')}
  finally{clearTimeout(timer)}
}
function stagedNewStakeCandidates(rows:any[],byWallet:Map<string,any>){
  const out:any[]=[],seen=new Set<string>()
  for(const row of rows){
    const owner=String(row.user_id)+'|'+String(row.wallet_id)
    const snapshot=byWallet.get(owner)?.payload,wallet=evmAddress(snapshot?.wallet)
    const receipt=row.evidence,hash=String(row.tx_hash||'').toLowerCase()
    const block=num(row.block_number),contract=evmAddress(receipt?.calledContract)
    if(snapshot?.kind!=='verified_discovery_results'||!wallet||!contract||
      !/^0x[0-9a-f]{64}$/.test(hash)||block===null||block<1||
      receipt?.receiptVerified!==true||receipt?.knownBridge===true||
      receipt?.manualPositionEvidence?.intent!=='stake'||
      receipt?.manualPositionEvidence?.receiptVerified!==true||
      !(receipt?.manualPositionEvidence?.principalSentToContract>0)||
      evmAddress(receipt?.transactionSender)!==wallet||seen.has(owner+'|'+hash))continue
    const lots=Array.isArray(snapshot?.process?.lots)?snapshot.process.lots:[]
    const alreadyKnown=lots.some((lot:any)=>[lot?.stakeTx,lot?.unstakeTx,
      ...(Array.isArray(lot?.topUps)?lot.topUps.map((t:any)=>t?.tx):[])]
      .some(h=>String(h||'').toLowerCase()===hash))
    if(alreadyKnown)continue
    seen.add(owner+'|'+hash)
    out.push({wallet,contract,block,hash})
  }
  return out.sort((a,b)=>a.block-b.block||a.hash.localeCompare(b.hash))
}
function reply(body: unknown, code = 200) {
  return new Response(JSON.stringify(body), {status:code,headers:{'content-type':'application/json','cache-control':'no-store'}})
}
function dayCH() { return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()) }
async function handleRewardRequest(req: Request): Promise<Response> {
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
    const supportedModes=['historical-manual-reward-parity','daily-direct-claim-cycle','cached-lot-reconstruction-preview','staged-new-stake-root-preview','known-stake-root-discovery','known-topup-storage-replay','delta-work-cycle','delta-receipt-verify','delta-transfer-stage','delta-preview','delta-scan-preview','rpc-diagnostic','rpc-range-diagnostic','snapshot-verification-audit','legacy-evidence-audit','legacy-proof-gaps','cached-range-integrity','delta-bootstrap-preview','legacy-first-chunk-scan-preview','registry-first-chunk-scan-preview','staking-call-receipt-preview','historical-topup-rpc-regression','cached-topup-mint-rpc-preview','historical-inflow-candidate-preview','historical-inflow-triage-preview','reward-source-parity-audit','legacy-unmatched-detail','legacy-stake-lifecycle','verified-topup-mint-preview','multi-wallet-readiness','read-only-preflight']
    supportedModes.push('encrypted-wallet-scan-guarded-stage-preview','encrypted-wallet-scan-adaptive-parity-preview','encrypted-wallet-scan-raw-evidence-preview','encrypted-wallet-scan-raw-parity-preview','encrypted-wallet-scan-write-plan-preview','encrypted-wallet-scan-transfer-evidence-preview','encrypted-wallet-scan-chunk-dry-run','encrypted-wallet-scan-batch-plan-preview','encrypted-wallet-scan-start-audit-preview','encrypted-wallet-scan-coverage-preview','encrypted-wallet-coverage-preview','daily-all-rewards-preview','historical-bonus-referral-evidence','historical-referral-step5-parity','historical-smartnode-parent-rpc-check','referral-claim-finalize','daily-bonus-claim-cycle','indirect-claim-finalize')
    const mode=body?.mode==='direct-claim-finalize'?'direct-claim-finalize':supportedModes.includes(body?.mode)?body.mode:'read-only-preflight'
    if(body?.mode && mode!==body.mode) return reply({ok:false,error:'Unsupported mode'},400)
    const workCycle=mode==='delta-work-cycle'
    const maxBlocks=workCycle?(body?.maxBlocks??50000):previewBlockBudget(body?.maxBlocks)
    if(maxBlocks===null||!Number.isSafeInteger(maxBlocks)||maxBlocks<1||maxBlocks>(workCycle?MAX_WORK_CYCLE_BLOCKS:DELTA_CHUNK_BLOCKS))
      return reply({ok:false,mode,error:`maxBlocks must be an integer from 1 to ${workCycle?MAX_WORK_CYCLE_BLOCKS:DELTA_CHUNK_BLOCKS}`},400)
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
    if(mode==='encrypted-wallet-scan-guarded-stage-preview'||mode==='encrypted-wallet-scan-adaptive-parity-preview'||mode==='encrypted-wallet-scan-raw-evidence-preview'||mode==='encrypted-wallet-scan-raw-parity-preview'||mode==='encrypted-wallet-coverage-preview'||mode==='encrypted-wallet-scan-coverage-preview'||mode==='encrypted-wallet-scan-start-audit-preview'||mode==='encrypted-wallet-scan-batch-plan-preview'||mode==='encrypted-wallet-scan-chunk-dry-run'||mode==='encrypted-wallet-scan-transfer-evidence-preview'||mode==='encrypted-wallet-scan-write-plan-preview'){
      if(mode==='encrypted-wallet-scan-guarded-stage-preview'&&body?.commit===true&&
        (body?.confirm!=='single-raw-cache-chunk'||Object.keys(body).some((k:string)=>!['mode','commit','confirm'].includes(k))))
        return reply({ok:false,mode,error:'Explicit single-chunk confirmation required'},400)
      const preview=await encryptedTlnWalletCoveragePreview(sb,mode!=='encrypted-wallet-coverage-preview',mode==='encrypted-wallet-scan-start-audit-preview'||mode==='encrypted-wallet-scan-batch-plan-preview',mode==='encrypted-wallet-scan-batch-plan-preview',mode==='encrypted-wallet-scan-chunk-dry-run',mode==='encrypted-wallet-scan-transfer-evidence-preview',mode==='encrypted-wallet-scan-write-plan-preview',mode==='encrypted-wallet-scan-raw-parity-preview',mode==='encrypted-wallet-scan-raw-evidence-preview',mode==='encrypted-wallet-scan-adaptive-parity-preview',mode==='encrypted-wallet-scan-guarded-stage-preview',mode==='encrypted-wallet-scan-guarded-stage-preview'&&body?.commit===true)
      return reply(preview,preview.ok?200:503)
    }
    if(mode==='daily-all-rewards-preview'){
      // Read-only orchestrator. Re-run the existing FOUR finalizers in-process
      // with commit=false; never infer safety from empty caches or successful HTTP.
      // Do not call a writing mode, cron, or update any snapshots/cursors.
      if(body?.commit===true) return reply({ok:false,mode,error:'Combined daily preview never accepts commit=true'},400)
      const checks=[
        {name:'direct',mode:'daily-direct-claim-cycle',eligibleKey:'eligibleDirectClaims'},
        {name:'bonus',mode:'daily-bonus-claim-cycle',eligibleKey:'eligibleBonusClaims'},
        {name:'referral',mode:'referral-claim-finalize',eligibleKey:'eligibleReferralClaims'},
        {name:'indirect',mode:'indirect-claim-finalize',eligibleKey:'eligibleIndirectClaims'}
      ] as const
      const results:any[]=[]
      for(const check of checks){
        // Same authenticated request context, but an explicitly hardcoded
        // read-only body; never forward user-controlled write parameters.
        const inner=new Request(req.url,{
          method:'POST',headers:req.headers,
          body:JSON.stringify({mode:check.mode,commit:false})
        })
        const response=await handleRewardRequest(inner)
        let value:any
        try{value=await response.json()}catch{
          return reply({ok:false,mode,status:'blocked',failedAt:check.name,
            completedChecks:results,canEnableWritingCron:false,
            error:'Invalid sub-finalizer response; no writes performed'},503)
        }
        const count=value?.[check.eligibleKey]
        const complete=value?.receiptInventoryComplete===true
        if(!response.ok||value?.ok!==true||value?.dryRun!==true||
          !complete||!Number.isSafeInteger(count)||count<0){
          return reply({ok:false,mode,status:'blocked',failedAt:check.name,
            completedChecks:results,canEnableWritingCron:false,
            subStatus:response.status,
            error:'One sub-finalizer could not complete its read-only inspection; no writes performed'},409)
        }
        results.push({name:check.name,inspectedReceipts:value.inspectedReceipts,
          eligibleClaims:count,receiptInventoryComplete:true,dryRun:true})
      }
      return reply({ok:true,mode,day:dayCH(),status:'preview_only',dryRun:true,
        pathsChecked:results.length,results,
        receiptInventoriesComplete:true,
        historicalCoverageVerified:false,
        allEncryptedWalletsCovered:false,
        indirectRewardCoverageVerified:false,
        fullRewardCoverageVerified:false,
        canEnableWritingCron:false,claimsCreated:0,persisted:false,
        notice:'Four existing claim finalizers inspected read-only, sequentially. No atomic write and no cross-ledger commitment. Receipt inventory is NOT historical or wallet coverage. Daily writing jobs remain disabled.'})
    }
    if(mode==='historical-smartnode-parent-rpc-check'){
      // One existing verified graph edge, independently checked against the
      // manual SmartNode getter/join fallback. Never expose wallet identities.
      const {data,error}=await sb.from('tln_vow_smartnode_graph_cache')
        .select('child_wallet,parent_wallet,verified_at')
        .eq('chain_key','bsc').not('verified_at','is',null)
        .order('verified_at',{ascending:false}).limit(100)
      if(error)return reply({ok:false,mode,error:'Verified SmartNode graph unavailable'},503)
      const knownWallets=new Set([...byWallet.values()].map(x=>evmAddress(x?.payload?.wallet)).filter(Boolean))
      const valid=(data||[]).filter((e:any)=>evmAddress(e?.child_wallet)&&evmAddress(e?.parent_wallet)&&
        evmAddress(e.child_wallet)!==evmAddress(e.parent_wallet))
      const selected=valid.find((e:any)=>knownWallets.has(evmAddress(e.parent_wallet)))||valid[0]
      if(!selected)return reply({ok:true,mode,day:dayCH(),status:'no_verified_graph_edge',
        inspected:0,persisted:false,notice:'No suitable cached verified graph edge to compare. No RPC or writes.'})
      const checked=await onchainSmartNodeParent(evmAddress(selected.child_wallet)!,Date.now()+16000)
      const onchainAvailable=!!evmAddress(checked.parent)
      const sameParent=onchainAvailable&&evmAddress(checked.parent)===evmAddress(selected.parent_wallet)
      return reply({ok:true,mode,day:dayCH(),status:onchainAvailable?
        (sameParent?'parent_agreement':'parent_disagreement'):'onchain_unresolved',
        inspected:1,selectedFromKnownSnapshot:knownWallets.has(evmAddress(selected.parent_wallet)),
        manualMethod:checked.source||null,diagnosticReason:checked.reason||null,
        onchainAvailable,sameParent,persisted:false,
        notice:'Read-only single cached verified SmartNode parent vs current manual getter/join RPC. An unresolved or changed parent is NOT a reward verdict. No wallet identities, claims, cache/cursor writes or cron.'})
    }
    if(mode==='historical-referral-step5-parity'){
      // Replay the exact manual final strong/candidate decision, using ONLY
      // cached manual Step-5 rows. No chain data or new referral attribution.
      const summary={snapshots:0,withReference:0,missingReference:0,
        referenceErrors:0,rows:0,matchingRows:0,mismatchingRows:0,
        storedStrong:0,replayedStrong:0,missingRowEvidence:0}
      const details:any[]=[]
      for(const item of byWallet.values()){
        const p=item.payload,wallet=evmAddress(p?.wallet),ref=p?.globals?.claimReferenceResult
        if(p?.kind!=='verified_discovery_results'||!wallet)continue
        summary.snapshots++
        if(!ref){summary.missingReference++;continue}
        if(ref.error){summary.referenceErrors++;continue}
        if(!Array.isArray(ref.rows)||ref.rows.length>2000){summary.missingReference++;continue}
        summary.withReference++
        const row={ordinal:details.length+1,rows:ref.rows.length,
          matchingRows:0,mismatchingRows:0,storedStrong:0,replayedStrong:0,missingRowEvidence:0}
        for(const x of ref.rows){
          if(!Array.isArray(x?.principalTransfers)||!Array.isArray(x?.stakeEvents)){
            row.missingRowEvidence++;continue
          }
          const result=verificationCore.manualReferralMintVerdict(x,wallet)
          if(x?.strong===result.strong&&x?.candidate===result.candidate)row.matchingRows++
          else row.mismatchingRows++
          if(x?.strong===true)row.storedStrong++
          if(result.strong)row.replayedStrong++
        }
        for(const k of ['rows','matchingRows','mismatchingRows','storedStrong','replayedStrong','missingRowEvidence'])
          (summary as any)[k]+=(row as any)[k]
        details.push(row)
      }
      return reply({ok:true,mode,day:dayCH(),summary,details,
        allStoredRowsMatch:summary.referenceErrors===0&&summary.missingReference===0&&
          summary.mismatchingRows===0&&summary.missingRowEvidence===0,
        independentReferralCoverageVerified:false,classificationCommitted:false,persisted:false,
        notice:'Read-only cached manual Step-5 final strong/candidate decision replay. Does not rerun mint discovery, receipts, stake recognition, SmartNode/graph/level verification or prove completeness. No RPC, writes or cron.'})
    }
    if(mode==='historical-bonus-referral-evidence'){
      // Reuse manual selector rules only on previously proven payout rows.
      // Broader browser referral inference requires independently proven paths.
      const summary={wallets:0,invalidSnapshots:0,provenRows:0,
        bonusSelectorRows:0,explicitReferralSelectorRows:0,otherProvenRows:0}
      const details:any[]=[]
      for(const r of byWallet.values()){
        const p=r.payload,proven=p?.globals?.provenRewardRows
        if(p?.kind!=='verified_discovery_results'||!evmAddress(p?.wallet)||
          !Array.isArray(proven)||proven.length>2000){summary.invalidSnapshots++;continue}
        const item={ordinal:details.length+1,provenRows:0,bonusSelectorRows:0,
          explicitReferralSelectorRows:0,otherProvenRows:0}
        for(const row of proven){
          item.provenRows++
          if(verificationCore.manualBonusEvidenceForClaim(row))item.bonusSelectorRows++
          else if(verificationCore.knownClaimMethodIntent(row?.selector)==='referral')
            item.explicitReferralSelectorRows++
          else item.otherProvenRows++
        }
        summary.wallets++;summary.provenRows+=item.provenRows
        summary.bonusSelectorRows+=item.bonusSelectorRows
        summary.explicitReferralSelectorRows+=item.explicitReferralSelectorRows
        summary.otherProvenRows+=item.otherProvenRows
        details.push(item)
      }
      return reply({ok:true,mode,day:dayCH(),summary,details,
        bonusCoverageVerified:false,referralCoverageVerified:false,
        classificationCommitted:false,persisted:false,
        notice:'Read-only manual bonus and explicit referral selectors against cached proven payout rows. Other rows remain unresolved. No Step-5 reference/path verification, independent payout proof, scan completeness, RPC, writes or cron.'})
    }
    if(mode==='historical-manual-reward-parity'){
      // Run existing manual Step-4 stake/top-up proof selectors against the
      // SAME persisted discovery snapshots, without new reward heuristics.
      const details:any[]=[],totals={wallets:0,lots:0,provenRows:0,
        stakeCandidates:0,topUpCandidates:0,matchingSavedClaims:0,
        missingSavedClaims:0,invalidSnapshots:0}
      const claimKey=(hash:unknown,token:unknown,amount:unknown)=>{
        const h=String(hash||'').toLowerCase(),t=String(token||'').toLowerCase(),n=Number(amount)
        return /^0x[0-9a-f]{64}$/.test(h)&&/^0x[0-9a-f]{40}$/.test(t)&&Number.isFinite(n)&&n>0
          ?`${h}|${t}|${n.toPrecision(15)}`:null
      }
      for(const r of byWallet.values()){
        const snapshot=r.payload,wallet=evmAddress(snapshot?.wallet)
        const lots=snapshot?.process?.lots,proven=snapshot?.globals?.provenRewardRows
        if(snapshot?.kind!=='verified_discovery_results'||!wallet||!Array.isArray(lots)||
          !Array.isArray(proven)||lots.length>500||proven.length>2000){totals.invalidSnapshots++;continue}
        const saved=new Set<string>()
        for(const l of lots)for(const c of (Array.isArray(l?.rewardClaims)?l.rewardClaims:[])){
          const key=claimKey(c?.hash,c?.token,c?.amount)
          if(key)saved.add(key)
        }
        let stakes:any[],topups:any[]
        try{
          stakes=verificationCore.verifiedStakeTxRewardClaims(lots,proven,wallet)
          topups=verificationCore.verifiedTopUpMintCandidates(lots,proven,wallet)
        }catch{totals.invalidSnapshots++;continue}
        const candidates=new Set<string>()
        for(const c of stakes){const key=claimKey(c?.claim?.hash,c?.claim?.token,c?.claim?.amount);if(key)candidates.add(key)}
        for(const c of topups){const key=claimKey(c?.row?.hash,c?.row?.token,c?.row?.amount);if(key)candidates.add(key)}
        const matched=[...candidates].filter(k=>saved.has(k)).length
        const missing=candidates.size-matched
        totals.wallets++;totals.lots+=lots.length;totals.provenRows+=proven.length
        totals.stakeCandidates+=stakes.length;totals.topUpCandidates+=topups.length
        totals.matchingSavedClaims+=matched;totals.missingSavedClaims+=missing
        details.push({ordinal:details.length+1,sourceLots:lots.length,sourceProvenRows:proven.length,
          stakeCandidates:stakes.length,topUpCandidates:topups.length,
          uniqueCandidates:candidates.size,matchingSavedClaims:matched,missingSavedClaims:missing})
      }
      return reply({ok:true,mode,day:dayCH(),summary:totals,details,
        allReplayCandidatesPresent:totals.invalidSnapshots===0&&totals.missingSavedClaims===0,
        independentReceiptVerificationPerformed:false,rewardCoverageVerified:false,
        referralCoverageVerified:false,claimsCreated:0,persisted:false,
        notice:'Read-only historical replay of the exact existing manual stake-tx/top-up Step-4 reward selectors against saved manual rewardClaims. This does not independently reverify receipts, scan unindexed history, classify indirect/bonus/referral payouts or create claims. No RPC or writes.'})
    }
    if(mode==='cached-lot-reconstruction-preview'){
      const core=verificationCore.manualBuildDiagnosticLots
      if(typeof core!=='function')return reply({ok:false,mode,error:'Shared lot builder unavailable'},503)
      const candidates=[...byWallet.values()].filter(r=>r.payload?.kind==='verified_discovery_results'&&
        Array.isArray(r.payload?.process?.stakingRows)&&Array.isArray(r.payload?.process?.lots))
      const ordinal=body?.ordinal??1
      if(!Number.isInteger(ordinal)||ordinal<1||ordinal>candidates.length)
        return reply({ok:true,mode,candidateWallets:candidates.length,status:'no_matching_snapshot',persisted:false})
      const payload=candidates[ordinal-1].payload
      const input=payload.process.stakingRows
      if(input.length>2000)return reply({ok:false,mode,error:'Event budget exceeded'},409)
      const built=core(input),saved=payload.process.lots
      const normalized=verificationCore.manualReplayRecordedTopUps(built.lots,saved)
      const recordedCalls=Array.isArray(payload.process.contractCalls)?payload.process.contractCalls:[]
      const callReconciliation=verificationCore.manualReconcileUnstakeContractCalls(
        normalized.lots,recordedCalls,payload.wallet)
      // Cached lots may have independently proven top-ups, verified contract
      // paths or duration details added after the initial Step-2 FIFO builder.
      // Compare only initial stake identities, never claim canonical equality.
      const savedHashes=new Set(saved.map((l:any)=>String(l?.stakeTx||'').toLowerCase()))
      const reconstructedHashes=new Set(normalized.lots.map((l:any)=>String(l?.stakeTx||'').toLowerCase()))
      const missingInSaved=[...reconstructedHashes].filter(h=>!savedHashes.has(h)).length
      const missingInReconstruction=[...savedHashes].filter(h=>!reconstructedHashes.has(h)).length
      return reply({ok:true,mode,ordinal,candidateWallets:candidates.length,
        sourceEvents:input.length,rawReconstructedLots:built.lots.length,
        reconstructedLots:normalized.lots.length,cachedLots:saved.length,
        recordedProofTopupsMerged:normalized.merged,recordedProofMissing:normalized.missingProof,
        recordedProofAmbiguous:normalized.ambiguous,
        historicalProofIndependentlyReplayed:false,
        recordedContractCalls:recordedCalls.length,
        receiptBasedUnstakeClosures:callReconciliation.receiptClosures,
        uniqueCallUnstakeClosures:callReconciliation.uniqueCallClosures,
        ambiguousUnstakeCalls:callReconciliation.ambiguousCalls,
        reconstructedUnmatchedExits:built.unmatched.length,
        deduplicatedRoutingExits:built.routedDuplicateUnstakes,
        missingInSaved,missingInReconstruction,stakeHashSetMatches:missingInSaved===0&&missingInReconstruction===0,
        reconstructedOpenLots:normalized.lots.filter((l:any)=>l.remaining>0).length,
        reconstructedClosedLots:normalized.lots.filter((l:any)=>l.status==='closed').length,
        persisted:false,rewardCoverageVerified:false,referralCoverageVerified:false,
        notice:'Read-only shared manual FIFO, saved proof-backed top-up merge and manual Unstake contract/receipt reconciliation. Existing recorded evidence is NOT independently reverified. Unmatched raw LP routing rows remain diagnostic; no reward, referral, claim, cursor, cache or cron writes.'})
    }
    if(mode==='staged-new-stake-root-preview'){
      const staged:any[]=[]
      for(let p=0;p<20;p++){
        const {data,error}=await sb.from('tln_vow_reward_receipt_stage')
          .select('user_id,wallet_id,tx_hash,block_number,evidence').eq('chain_key','bsc')
          .order('block_number',{ascending:true}).range(p*200,(p+1)*200-1)
        if(error)return reply({ok:false,mode,error:'Verified receipt cache unavailable'},503)
        staged.push(...(data||[]))
        if((data||[]).length<200)break
        if(p===19)return reply({ok:false,mode,error:'Receipt pagination incomplete'},409)
      }
      const eligible=stagedNewStakeCandidates(staged,byWallet)
      if(!eligible.length)return reply({ok:true,mode,stagedReceipts:staged.length,
        newStakeCandidates:0,status:'no_new_verified_stake_receipts',persisted:false,
        notice:'No qualifying new stake in independently verified receipts; no speculative archive scan.'})
      const ordinal=body?.ordinal??1
      if(!Number.isInteger(ordinal)||ordinal<1||ordinal>eligible.length)
        return reply({ok:false,mode,error:'ordinal_out_of_range'},400)
      const c=eligible[ordinal-1]
      try{
        const ts=await archiveBlockTimestamp(c.block)
        const result=await discoverKnownStakeRoot(c.wallet,c.contract,c.block,ts)
        return reply({ok:true,mode,stagedReceipts:staged.length,newStakeCandidates:eligible.length,
          ordinal,...result,transactionAndReceiptVerified:true,stakeIntentVerified:true,
          principalTransferVerified:true,blockTimestampReadFromArchive:true,
          newPositionCreated:false,lockDurationVerified:false,persisted:false,
          notice:'Read-only bridge from an independently verified NEW stake receipt to manual A1/A2/B/C root discovery. Position/LP, lock, top-up and reward proof still pending.'})
      }catch(e){return reply({ok:false,mode,error:e instanceof Error?e.message:'archive_rpc_unavailable',persisted:false},503)}
    }
    if(mode==='known-stake-root-discovery'){
      const candidates:any[]=[]
      for(const row of byWallet.values()){
        const payload=row.payload,wallet=evmAddress(payload?.wallet)
        if(!wallet||payload?.kind!=='verified_discovery_results')continue
        for(const lot of (Array.isArray(payload?.process?.lots)?payload.process.lots:[])){
          const contract=evmAddress(lot?.staking?.contract_address||lot?.counterparty)
          let block:number|null=null
          try{block=lot?.stakeBlockHex?Number(BigInt(lot.stakeBlockHex)):null}catch{}
          const stakeTs=Math.floor(Date.parse(String(lot?.stakeTime||''))/1000)
          if(!contract||!Number.isSafeInteger(block)||block<1||!Number.isSafeInteger(stakeTs)||stakeTs<1000000000)continue
          candidates.push({wallet,contract,block,stakeTs,
            expectedRoot:lot?.durationReference?.targeted?.root??lot?.topUps?.[0]?.storageProof?.root??null})
        }
      }
      const ordinal=body?.ordinal??1
      if(!Number.isInteger(ordinal)||ordinal<1||ordinal>candidates.length)
        return reply({ok:true,mode,availableCandidates:candidates.length,status:'no_matching_cached_stake',persisted:false})
      const c=candidates[ordinal-1]
      try{
        const result=await discoverKnownStakeRoot(c.wallet,c.contract,c.block,c.stakeTs)
        return reply({ok:true,mode,ordinal,availableCandidates:candidates.length,...result,
          matchesCachedRoot:c.expectedRoot===null?null:Number(c.expectedRoot)===result.detectedRoot,
          persisted:false,notice:'Read-only manual A1/A2/B/C storage-root discovery for one cached stake. No new lots, durations, claims or cron.'})
      }catch(e){return reply({ok:false,mode,error:e instanceof Error?e.message:'archive_rpc_unavailable',persisted:false},503)}
    }
    if(mode==='known-topup-storage-replay'){
      const candidates:any[]=[]
      const cachedBlock=(v:any)=>{try{
        if(v===null||v===undefined||v==='')return null
        const n=Number(BigInt(v));return Number.isSafeInteger(n)&&n>0?n:null
      }catch{return null}}
      for(const row of byWallet.values()){
        const payload=row.payload,wallet=evmAddress(payload?.wallet)
        if(!wallet||payload?.kind!=='verified_discovery_results')continue
        for(const lot of (Array.isArray(payload?.process?.lots)?payload.process.lots:[])){
          const contract=evmAddress(lot?.staking?.contract_address||lot?.counterparty)
          const firstBlock=cachedBlock(lot?.stakeBlockHex)
          for(const top of (Array.isArray(lot?.topUps)?lot.topUps:[])){
            const proof=top?.storageProof
            if(top?.evidence!=='onchain_same_wallet_position_state'||proof?.proven!==true||
              !contract||!Number.isSafeInteger(firstBlock)||firstBlock<1)continue
            const secondBlock=cachedBlock(top?.blockHex??top?.block)
            const root=Number(proof.root),offset=Number(proof.startOffset)
            const offs=[...new Set([offset,...(Array.isArray(proof.changedAtSecond)?proof.changedAtSecond:[])].map(Number))]
            if(!Number.isInteger(root)||root<0||root>65535||!Number.isInteger(offset)||offset<0||offset>32||
              offs.some(x=>!Number.isInteger(x)||x<0||x>32)||offs.length<2||offs.length>8||
              !Number.isSafeInteger(secondBlock)||secondBlock<=firstBlock)continue
            candidates.push({wallet,contract,firstBlock,secondBlock,root,offset,offs,
              firstTime:lot.stakeTime,secondTime:top.time})
          }
        }
      }
      const ordinal=body?.ordinal??1
      if(!Number.isInteger(ordinal)||ordinal<1||ordinal>candidates.length)
        return reply({ok:true,mode,availableCandidates:candidates.length,status:'no_matching_cached_proof',persisted:false})
      const c=candidates[ordinal-1]
      try{
        const result=await replayKnownTopupStorage(c.wallet,c.contract,c.firstBlock,c.secondBlock,
          c.root,c.offset,c.offs,c.firstTime,c.secondTime)
        return reply({ok:true,mode,ordinal,availableCandidates:candidates.length,
          independentlyReplayed:true,storageContinuityVerified:result.proven,
          rootMatches:result.root===c.root,firstWritten:result.firstWritten===true,
          timestampContinuity:result.timestampContinuity===true,secondReset:result.secondReset===true,
          occupiedBefore:result.occupiedBefore===true,sameFirstStateSurvives:result.sameFirstStateSurvives===true,
          changedCoreOffsets:result.changedAtSecond?.length||0,persisted:false,
          notice:'One cached historical top-up independently replayed using bounded archive storage reads and the exact manual verdict. No lot/claim/cursor writes or cron.'})
      }catch(e){return reply({ok:false,mode,error:e instanceof Error?e.message:'archive_rpc_unavailable',persisted:false},503)}
    }
    if(mode==='indirect-claim-finalize'){
      // Opt-in only: reuse the identical shared manual Step-4 flow and unique
      // position rule. An observed transfer or cached trace alone cannot write.
      const commit=body?.commit===true,limit=200,maxPages=20
      const staged:any[]=[];let complete=false
      for(let page=0;page<=maxPages;page++){
        const {data,error}=await sb.from('tln_vow_reward_receipt_stage')
          .select('user_id,wallet_id,chain_key,tx_hash,block_number,evidence')
          .eq('chain_key','bsc').order('created_at',{ascending:true})
          .order('user_id',{ascending:true}).order('wallet_id',{ascending:true})
          .order('tx_hash',{ascending:true}).range(page*limit,(page+1)*limit-1)
        if(error)return reply({ok:false,mode,error:'Receipt inventory unavailable; nothing written'},503)
        if(page===maxPages&&(data||[]).length)
          return reply({ok:false,mode,error:'More than 4000 receipts; nothing written'},409)
        staged.push(...(data||[]))
        if((data||[]).length<limit){complete=true;break}
      }
      if(!complete)return reply({ok:false,mode,error:'Incomplete receipt inventory; nothing written'},409)
      const contracts=await sb.from('defi_staking_contracts').select('contract_address')
        .eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true)
      if(contracts.error||(contracts.data||[]).some((x:any)=>!evmAddress(x.contract_address)))
        return reply({ok:false,mode,error:'Staking registry unavailable or invalid'},503)
      const registry=(contracts.data||[]).map((x:any)=>evmAddress(x.contract_address)!)
      const eligible:any[]=[];let skippedIncomplete=0,skippedExisting=0
      for(const row of staged){
        const snapshot=byWallet.get(String(row.user_id)+'|'+String(row.wallet_id))?.payload
        const wallet=evmAddress(snapshot?.wallet),receipt=row.evidence
        const hash=String(row.tx_hash||'').toLowerCase(),block=num(row.block_number)
        if(snapshot?.kind!=='verified_discovery_results'||!wallet||block===null||block<1||
          !/^0x[0-9a-f]{64}$/.test(hash)||receipt?.indirectTraceVerified!==true||
          !Array.isArray(receipt?.indirectTraceSources)||!Array.isArray(receipt?.transfers)){
          skippedIncomplete++;continue
        }
        const claim=verificationCore.verifiedIndirectStakingClaim({wallet,hash,receipt,
          lots:snapshot?.process?.lots||[],stakingContracts:registry,
          traceVerified:receipt.indirectTraceVerified,
          traceMethod:receipt.indirectTraceMethod,traceSources:receipt.indirectTraceSources})
        if(!claim)continue
        const sameProof=(Array.isArray(receipt.indirectRewardCandidates)?receipt.indirectRewardCandidates:[])
          .some((x:any)=>x.token===claim.token&&x.from===claim.fromContract&&
            x.logIndex===claim.logIndex&&/^[0-9]+$/.test(String(x.amountRaw||''))&&
            BigInt(x.amountRaw)===BigInt(claim.amountRaw))
        if(!sameProof){skippedIncomplete++;continue}
        const already=(Array.isArray(snapshot?.globals?.provenRewardRows)?
          snapshot.globals.provenRewardRows:[]).some((x:any)=>
          String(x?.hash||'').toLowerCase()===hash&&evmAddress(x.token)===claim.token)
        if(already){skippedExisting++;continue}
        eligible.push({user_id:row.user_id,wallet_id:row.wallet_id,chain_key:'bsc',
          tx_hash:hash,token_address:claim.token,log_index:claim.logIndex,
          amount_raw:claim.amountRaw,block_number:block,lot_stake_tx:claim.lotStakeTx,
          called_contract:claim.calledContract,paying_contract:claim.fromContract,
          trace_method:receipt.indirectTraceMethod,proof_kind:claim.proof,
          wallet,receipt,stakingContracts:registry})
      }
      if(commit&&eligible.length){
        if(eligible.length>20||!ALCHEMY_API_KEY)
          return reply({ok:false,mode,error:'Bounded independent trace budget exceeded; nothing written'},409)
        const times=new Map<number,string>()
        try{
          // Independently replay EVERY trace before any ledger write.
          for(const row of eligible){
            const fresh=await receiptInternalCallSources(row.tx_hash,row.receipt,row.wallet,row.stakingContracts)
            if(fresh.verified!==true||!fresh.sources.includes(row.paying_contract)||
              !fresh.candidates?.some((x:any)=>x.token===row.token_address&&
                x.logIndex===row.log_index&&x.from===row.paying_contract&&
                x.amountRaw===row.amount_raw))throw new Error('trace_mismatch')
          }
          for(const height of new Set(eligible.map(x=>x.block_number)))
            times.set(height,new Date((await archiveBlockTimestamp(height))*1000).toISOString())
        }catch{return reply({ok:false,mode,error:'Independent trace or block timestamp proof unavailable; nothing written'},503)}
        const records=eligible.map(({wallet,receipt,stakingContracts,...row})=>({
          ...row,block_timestamp:times.get(row.block_number)}))
        const {error}=await sb.from('tln_vow_reward_indirect_claims').upsert(records,{
          onConflict:'user_id,wallet_id,chain_key,tx_hash,token_address,log_index',ignoreDuplicates:true})
        if(error)return reply({ok:false,mode,error:'Indirect claim ledger unavailable; snapshots unchanged'},503)
      }
      return reply({ok:true,mode,day:dayCH(),dryRun:!commit,
        inspectedReceipts:staged.length,receiptInventoryComplete:true,
        eligibleIndirectClaims:eligible.length,skippedIncomplete,
        skippedExistingSnapshotClaims:skippedExisting,
        canonicalIndirectClaimsCommitted:commit&&eligible.length>0,
        historicalCoverageVerified:false,allEncryptedWalletsCovered:false,
        notice:'Strict shared manual Step-4 trace/receipt/unique-lot rule. Commit opt-in with fresh trace and block replay. No other reward types, no snapshot edits, no cron.'})
    }
    if(mode==='daily-bonus-claim-cycle'){
      // Reuse the browser's exact shared Step-4 claimBonus selector and
      // receipt-backed explicit payout classifier. No heuristic inflows.
      const commit=body?.commit===true,limit=200,maxPages=20
      const staged:any[]=[];let complete=false
      for(let page=0;page<=maxPages;page++){
        const {data,error}=await sb.from('tln_vow_reward_receipt_stage')
          .select('user_id,wallet_id,chain_key,tx_hash,block_number,evidence')
          .eq('chain_key','bsc').order('created_at',{ascending:true})
          .order('user_id',{ascending:true}).order('wallet_id',{ascending:true})
          .order('tx_hash',{ascending:true}).range(page*limit,(page+1)*limit-1)
        if(error)return reply({ok:false,mode,error:'Receipt inventory unavailable; no claims saved'},503)
        if(page===maxPages&&(data||[]).length)
          return reply({ok:false,mode,error:'More than 4000 receipts; no claims saved'},409)
        staged.push(...(data||[]))
        if((data||[]).length<limit){complete=true;break}
      }
      if(!complete)return reply({ok:false,mode,error:'Incomplete receipt inventory; no claims saved'},409)
      const contracts=await sb.from('defi_staking_contracts').select('contract_address')
        .eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true)
      if(contracts.error)return reply({ok:false,mode,error:'Staking registry unavailable; no claims saved'},503)
      const registry=(contracts.data||[]).map((x:any)=>evmAddress(x.contract_address))
      if(registry.some((x:any)=>!x))return reply({ok:false,mode,error:'Invalid staking registry; no claims saved'},503)
      const eligible:any[]=[],seen=new Set<string>();let skippedIncomplete=0,skippedExisting=0
      for(const row of staged){
        const snapshot=byWallet.get(String(row.user_id)+'|'+String(row.wallet_id))?.payload
        const wallet=evmAddress(snapshot?.wallet),receipt=row.evidence
        const hash=String(row.tx_hash||'').toLowerCase(),block=num(row.block_number)
        const callTo=evmAddress(receipt?.calledContract)
        if(snapshot?.kind!=='verified_discovery_results'||!wallet||!callTo||
          !/^0x[0-9a-f]{64}$/.test(hash)||block===null||block<1||
          receipt?.receiptVerified!==true||!Array.isArray(receipt?.transfers)){
          skippedIncomplete++;continue
        }
        if(!verificationCore.manualBonusEvidenceForClaim({selector:receipt.selector}))continue
        const claims=verificationCore.classifyExplicitClaimReceipt({wallet,hash,receipt,
          stakingContracts:registry}).filter((c:any)=>c.kind==='bonus')
        const byToken=new Map<string,any[]>()
        for(const c of claims){
          if(!byToken.has(c.token))byToken.set(c.token,[])
          byToken.get(c.token)!.push(c)
        }
        for(const [token,candidates] of byToken){
          const inflows=receipt.transfers.filter((t:any)=>t.token===token&&t.to===wallet&&
            /^0x[0-9a-f]+$/i.test(String(t.amountRaw||''))&&BigInt(t.amountRaw)>0n)
          const transfers=receipt.transfers.filter((t:any)=>t.token===token)
          if(transfers.some((t:any)=>!/^0x[0-9a-f]+$/i.test(String(t.amountRaw||'')))||
            candidates.length!==inflows.length||!inflows.length||
            inflows.some((t:any)=>!Number.isSafeInteger(t.logIndex)||t.logIndex<0)||
            new Set(inflows.map((t:any)=>t.logIndex)).size!==inflows.length){
            skippedIncomplete++;continue
          }
          const net=transfers.reduce((n:bigint,t:any)=>n+
            (t.to===wallet?BigInt(t.amountRaw):0n)-(t.from===wallet?BigInt(t.amountRaw):0n),0n)
          const amount=inflows.reduce((n:bigint,t:any)=>n+BigInt(t.amountRaw),0n)
          if(net<=0n||amount<=0n||candidates.some((c:any)=>!
            inflows.some((t:any)=>BigInt(t.amountRaw)===BigInt(c.amountRaw)))){
            skippedIncomplete++;continue
          }
          const exists=(Array.isArray(snapshot?.globals?.provenRewardRows)?
            snapshot.globals.provenRewardRows:[]).some((r:any)=>
              String(r?.hash||'').toLowerCase()===hash&&evmAddress(r?.token)===token)
          if(exists){skippedExisting++;continue}
          const key=String(row.user_id)+'|'+String(row.wallet_id)+'|'+hash+'|'+token
          if(seen.has(key))continue
          seen.add(key)
          eligible.push({user_id:row.user_id,wallet_id:row.wallet_id,chain_key:'bsc',
            tx_hash:hash,token_address:token,block_number:block,
            amount_raw:amount.toString(),wallet_net_raw:net.toString(),
            called_contract:callTo,claim_selector:String(receipt.selector).toLowerCase(),
            log_indexes:inflows.map((t:any)=>t.logIndex).sort((a:number,b:number)=>a-b),
            proof_kind:'manual_step4_explicit_bonus_verified_receipt'})
        }
      }
      if(commit&&eligible.length){
        const heights=[...new Set(eligible.map(x=>x.block_number))]
        if(heights.length>20)return reply({ok:false,mode,error:'Timestamp verification budget exceeded; no claims saved'},409)
        const times=new Map<number,string>()
        try{
          for(const height of heights)times.set(height,new Date((await archiveBlockTimestamp(height))*1000).toISOString())
        }catch{return reply({ok:false,mode,error:'Verified block timestamp unavailable; no claims saved'},503)}
        for(const row of eligible)row.block_timestamp=times.get(row.block_number)
        const {error}=await sb.from('tln_vow_reward_bonus_claims').upsert(eligible,{
          onConflict:'user_id,wallet_id,chain_key,tx_hash,token_address',ignoreDuplicates:true})
        if(error)return reply({ok:false,mode,error:'Bonus ledger unavailable; no snapshots changed'},503)
      }
      return reply({ok:true,mode,day:dayCH(),dryRun:!commit,
        inspectedReceipts:staged.length,receiptInventoryComplete:true,
        eligibleBonusClaims:eligible.length,skippedIncomplete,skippedExistingSnapshotClaims:skippedExisting,
        canonicalBonusClaimsCommitted:commit&&eligible.length>0,
        indirectRewardCoverageVerified:false,fullRewardCoverageVerified:false,
        notice:'Shared manual claimBonus selector and receipt-backed flow only. Opt-in isolated ledger, no discovery snapshot writes or cron. Other bonus and indirect paths remain unverified.'})
    }
    if(mode==='referral-claim-finalize'){
      // Explicit opt-in only. Existing Step-5 results remain the primary UI
      // source; this ledger adds only receipts not already present there.
      const commit=body?.commit===true,limit=200,maxPages=20
      const staging:any[]=[];let complete=false
      for(let page=0;page<=maxPages;page++){
        const {data,error}=await sb.from('tln_vow_reward_receipt_stage')
          .select('user_id,wallet_id,chain_key,tx_hash,block_number,evidence')
          .eq('chain_key','bsc').order('created_at',{ascending:true})
          .order('user_id',{ascending:true}).order('wallet_id',{ascending:true})
          .order('tx_hash',{ascending:true}).range(page*limit,(page+1)*limit-1)
        if(error)return reply({ok:false,mode,error:'Receipt stage unavailable; nothing saved',persisted:false},503)
        if(page===maxPages&&(data||[]).length)
          return reply({ok:false,mode,error:'More than 4000 receipts; nothing saved',persisted:false},409)
        staging.push(...(data||[]))
        if((data||[]).length<limit){complete=true;break}
      }
      if(!complete)return reply({ok:false,mode,error:'Incomplete receipt pagination; nothing saved',persisted:false},409)
      const contracts=await sb.from('defi_staking_contracts').select('contract_address')
        .eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true)
      if(contracts.error)return reply({ok:false,mode,error:'Staking registry unavailable; nothing saved',persisted:false},503)
      const registry=new Set((contracts.data||[]).map((x:any)=>evmAddress(x.contract_address)).filter(Boolean))
      const eligible:any[]=[];let skippedExisting=0,skippedIncomplete=0
      const zero='0x'+'0'.repeat(40)
      for(const row of staging){
        const owner=String(row.user_id)+'|'+String(row.wallet_id)
        const snapshot=byWallet.get(owner)?.payload,receipt=row.evidence
        const wallet=evmAddress(snapshot?.wallet),sender=evmAddress(receipt?.transactionSender)
        const hash=String(row.tx_hash||'').toLowerCase(),block=num(row.block_number)
        if(snapshot?.kind!=='verified_discovery_results'||!wallet||!sender||
          !/^0x[0-9a-f]{64}$/.test(hash)||block===null||block<1||
          receipt?.receiptVerified!==true||!Array.isArray(receipt?.transfers)){
          skippedIncomplete++;continue
        }
        const verdict=verificationCore.manualReferralMintVerdict({sender,
          staking:registry.has(evmAddress(receipt.calledContract))?{address:receipt.calledContract}:null,
          principalTransfers:Array.from({length:Math.min(1,receipt.referralPrincipalTransfers||0)},()=>({})),
          stakeEvents:Array.from({length:Math.min(1,receipt.referralStakeEvents||0)},()=>({}))},wallet)
        if(!verdict.strong)continue
        for(const candidate of Array.isArray(receipt.referralMintCandidates)?receipt.referralMintCandidates:[]){
          const token=evmAddress(candidate?.token),path=candidate?.referralPathEvidence
          if(candidate?.kind!=='referral_mint_strong'||!token||!evmAddress(receipt.calledContract)||
            !REFERRAL_MINT_CONTRACTS.includes(token)||candidate?.receiptVerified!==true||
            candidate?.referralPathVerified!==true||path?.verified!==true||
            !Number.isInteger(candidate?.referralLevel)||candidate.referralLevel<1||candidate.referralLevel>20||
            candidate.referralLevel!==path.level||!Array.isArray(path.path)||
            path.path[0]!==sender||path.path[path.path.length-1]!==wallet||
            !Array.isArray(candidate.mintLogIndexes)||!candidate.mintLogIndexes.length){
            skippedIncomplete++;continue
          }
          const mints=receipt.transfers.filter((t:any)=>t.token===token&&t.from===zero&&t.to===wallet)
          const indices=mints.map((t:any)=>t.logIndex)
          if(!mints.length||indices.length!==new Set(indices).size||
            indices.length!==candidate.mintLogIndexes.length||
            !indices.every((n:number)=>candidate.mintLogIndexes.includes(n))){
            skippedIncomplete++;continue
          }
          const minted=mints.reduce((n:bigint,t:any)=>n+BigInt(t.amountRaw),0n)
          const net=receipt.transfers.filter((t:any)=>t.token===token)
            .reduce((n:bigint,t:any)=>n+(t.to===wallet?BigInt(t.amountRaw):0n)-
              (t.from===wallet?BigInt(t.amountRaw):0n),0n)
          if(minted<=0n||net<=0n||candidate.mintAmountRaw!==minted.toString()||
            candidate.walletNetRaw!==net.toString()){
            skippedIncomplete++;continue
          }
          const existing=(Array.isArray(snapshot?.globals?.claimReferenceResult?.strong)?
            snapshot.globals.claimReferenceResult.strong:[])
            .some((r:any)=>String(r?.hash||'').toLowerCase()===hash&&
              (r?.mints||[]).some((m:any)=>evmAddress(m?.token)===token))
          if(existing){skippedExisting++;continue}
          eligible.push({user_id:row.user_id,wallet_id:row.wallet_id,chain_key:'bsc',
            tx_hash:hash,token_address:token,block_number:block,amount_raw:minted.toString(),
            wallet_net_raw:net.toString(),staking_contract:evmAddress(receipt.calledContract),
            mint_log_indexes:[...indices].sort((a:number,b:number)=>a-b),partner_wallet:sender,
            referral_level:candidate.referralLevel,
            proof_kind:'manual_step5_strong_verified_receipt_and_parent_path'})
        }
      }
      if(commit&&eligible.length){
        // A claim without its real chain timestamp cannot safely enter
        // month/year overview buckets. Read exact blocks only for explicitly
        // approved candidate commits; never substitute created_at or today.
        const blocks=[...new Set(eligible.map(r=>r.block_number))]
        if(blocks.length>20||!ALCHEMY_API_KEY)
          return reply({ok:false,mode,error:'On-chain timestamp proof budget unavailable; no claims saved',persisted:false},409)
        const times=new Map<number,string>()
        for(const height of blocks){
          const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000)
          try{
            const res=await fetch(`https://bnb-mainnet.g.alchemy.com/v2/${encodeURIComponent(ALCHEMY_API_KEY)}`,
              {method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,
                body:JSON.stringify({jsonrpc:'2.0',id:69,method:'eth_getBlockByNumber',
                  params:['0x'+height.toString(16),false]})})
            if(!res.ok)throw new Error('block_rpc_unavailable')
            const data=await res.json(),b=data?.result
            if(!b||Number(BigInt(b.number||0))!==height)throw new Error('block_mismatch')
            const seconds=Number(BigInt(b.timestamp||0))
            if(!Number.isSafeInteger(seconds)||seconds<1500000000||seconds>Date.now()/1000+300)
              throw new Error('block_timestamp_invalid')
            times.set(height,new Date(seconds*1000).toISOString())
          }catch{
            return reply({ok:false,mode,error:'Verified on-chain block timestamp unavailable; no claims saved',persisted:false},503)
          }finally{clearTimeout(timer)}
        }
        for(const row of eligible)row.block_timestamp=times.get(row.block_number)
        const {error}=await sb.from('tln_vow_reward_referral_claims').upsert(eligible,{
          onConflict:'user_id,wallet_id,chain_key,tx_hash,token_address',ignoreDuplicates:true})
        if(error)return reply({ok:false,mode,error:'Referral ledger unavailable; no discovery snapshots modified',persisted:false},503)
      }
      return reply({ok:true,mode,day:dayCH(),dryRun:!commit,receiptInventoryComplete:complete,
        inspectedReceipts:staging.length,eligibleReferralClaims:eligible.length,
        skippedExistingSnapshotClaims:skippedExisting,skippedIncomplete,
        canonicalReferralClaimsCommitted:commit&&eligible.length>0,
        referralHistoricalCoverageVerified:false,
        notice:'Existing shared manual Step-5 strong verdict plus receipt mint amount and verified SmartNode path. Opt-in idempotent referral ledger only; snapshots and dashboard untouched. No cron.'})
    }
    if(mode==='direct-claim-finalize'||mode==='daily-direct-claim-cycle'){
      // Explicit opt-in only: no cron invokes this mode. Separate canonical
      // table preserves every manually verified discovery snapshot unchanged.
      const daily=mode==='daily-direct-claim-cycle'
      const commit=daily?body?.commit===true:true
      const offset=body?.offset??0
      if(!Number.isSafeInteger(offset)||offset<0||offset>1000000||(daily&&offset!==0))
        return reply({ok:false,mode,error:'offset must be an integer from 0 to 1000000'},400)
      // Daily runs must inspect EVERY staged page before any canonical write.
      // Offset-based manual finalization retains its existing 200-row behavior.
      // Stable ordering makes pagination deterministic even for equal timestamps.
      const stagedReceipts:any[]=[]
      const batchSize=200,maxDailyPages=20
      let allPagesComplete=false
      for(let page=0;page<(daily?maxDailyPages+1:1);page++){
        const start=daily?page*batchSize:offset
        const receiptRows=await sb.from('tln_vow_reward_receipt_stage')
          .select('user_id,wallet_id,chain_key,tx_hash,block_number,evidence')
          .eq('chain_key','bsc').order('created_at',{ascending:true})
          .order('user_id',{ascending:true}).order('wallet_id',{ascending:true})
          .order('tx_hash',{ascending:true}).range(start,start+batchSize-1)
        if(receiptRows.error)return reply({ok:false,mode,error:'Receipt staging unavailable; no claims saved',persisted:false},503)
        if(daily&&page===maxDailyPages&&(receiptRows.data||[]).length>0)
          return reply({ok:false,mode,error:'Daily receipt inventory exceeds 4000 rows; no claims saved',
            inspectedReceipts:stagedReceipts.length,persisted:false},409)
        stagedReceipts.push(...(receiptRows.data||[]))
        if((receiptRows.data||[]).length<batchSize){allPagesComplete=true;break}
      }
      if(daily&&!allPagesComplete)
        return reply({ok:false,mode,error:'Daily receipt inventory exceeds 4000 rows; no claims saved',
          inspectedReceipts:stagedReceipts.length,persisted:false},409)
      const contracts=await sb.from('defi_staking_contracts').select('contract_address')
        .eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true)
      if(contracts.error||(contracts.data||[]).some((r:any)=>!evmAddress(r.contract_address)))
        return reply({ok:false,mode,error:'Configured staking contracts invalid'},503)
      const registry=(contracts.data||[]).map((r:any)=>evmAddress(r.contract_address)!)
      const eligible:any[]=[]
      for(const row of stagedReceipts){
        const owner=String(row.user_id)+'|'+String(row.wallet_id)
        const snapshot=byWallet.get(owner)?.payload
        const wallet=evmAddress(snapshot?.wallet),receipt=row.evidence
        const block=num(row.block_number),hash=String(row.tx_hash||'').toLowerCase()
        if(snapshot?.kind!=='verified_discovery_results'||!wallet||block===null||block<1||
          !/^0x[0-9a-f]{64}$/.test(hash)||!receipt||receipt.receiptVerified!==true)continue
        const candidate=verificationCore.verifiedDirectStakingClaim({wallet,hash,receipt,
          lots:snapshot?.process?.lots||[],stakingContracts:registry})
        if(!candidate)continue
        if((Array.isArray(snapshot?.globals?.provenRewardRows)?snapshot.globals.provenRewardRows:[])
          .some((r:any)=>String(r?.hash||'').toLowerCase()===hash&&
            String(r?.token||'').toLowerCase()===candidate.token))continue
        eligible.push({user_id:row.user_id,wallet_id:row.wallet_id,chain_key:'bsc',
          tx_hash:hash,block_number:block,token_address:candidate.token,
          log_index:candidate.logIndex,amount_raw:candidate.amountRaw,
          lot_stake_tx:candidate.lotStakeTx,called_contract:candidate.calledContract,
          proof_kind:candidate.proof})
      }
      // At most 200 independent candidate rows, duplicate commits ignored by
      // the stable (wallet, tx, token, receipt-log) primary key.
      if(commit&&eligible.length){
        const {error}=await sb.from('tln_vow_reward_direct_claims').upsert(eligible,{
          onConflict:'user_id,wallet_id,chain_key,tx_hash,token_address,log_index',ignoreDuplicates:true})
        if(error)return reply({ok:false,mode,error:'Direct claim save failed; no discovery snapshot modified'},503)
      }
      return reply({ok:true,mode,day:dayCH(),offset,nextOffset:daily?null:stagedReceipts.length===200?offset+200:null,
        inspectedReceipts:stagedReceipts.length,receiptInventoryComplete:daily?allPagesComplete:stagedReceipts.length<200,
        eligibleDirectClaims:eligible.length,
        canonicalDirectClaimsCommitted:commit&&eligible.length>0,
        dryRun:!commit,completeReceiptBatch:daily?allPagesComplete:stagedReceipts.length<200,
        referralClassificationCompleted:false,fullRewardCoverageVerified:false,
        notice:'Existing strict shared direct staking-claim rule only. Daily mode scans up to 4000 staged receipts, fails closed on incomplete inventory and is read-only unless commit=true. No indirect, bonus or referral claims and no historical completeness certification.'})
    }
    if(mode==='delta-receipt-verify'){
      const staged:any[]=[],verified:any[]=[]
      for(const [table,destination,columns] of [
        ['tln_vow_reward_delta_stage',staged,'user_id,wallet_id,from_block,to_block,transfer_events'],
        ['tln_vow_reward_receipt_stage',verified,'user_id,wallet_id,tx_hash']
      ] as const){
        let complete=false
        for(let p=0;p<maxPages;p++){
          const {data,error}=await sb.from(table).select(columns).eq('chain_key','bsc')
            .order(table==='tln_vow_reward_delta_stage'?'from_block':'tx_hash',{ascending:true})
            .range(p*pageSize,(p+1)*pageSize-1)
          if(error)return reply({ok:false,mode,error:'Receipt staging table unavailable; apply 9.37 SQL'},503)
          destination.push(...(data||[]))
          if((data||[]).length<pageSize){complete=true;break}
        }
        if(!complete)return reply({ok:false,mode,error:'Evidence pagination incomplete; no receipt writes'},409)
      }
      const completed=new Set(verified.map(r=>String(r.user_id)+'|'+String(r.wallet_id)+'|'+String(r.tx_hash).toLowerCase()))
      const grouped=new Map<string,any>()
      for(const row of staged){
        const owner=String(row.user_id)+'|'+String(row.wallet_id)
        const snapshot=byWallet.get(owner),wallet=evmAddress(snapshot?.payload?.wallet)
        if(!wallet||snapshot?.payload?.kind!=='verified_discovery_results'||!Array.isArray(row.transfer_events))
          continue
        const from=num(row.from_block),to=num(row.to_block)
        if(from===null||to===null||to<from)continue
        for(const event of row.transfer_events){
          const hash=String(event?.hash||'').toLowerCase(),block=num(event?.block)
          if(!/^0x[0-9a-f]{64}$/.test(hash)||block===null||block<from||block>to)
            return reply({ok:false,mode,error:'Invalid persisted transfer evidence; no receipts saved'},409)
          const identity=owner+'|'+hash
          if(completed.has(identity))continue
          if(!grouped.has(identity))grouped.set(identity,{owner,hash,block,wallet,
            userId:row.user_id,walletId:row.wallet_id,events:[],snapshot:snapshot.payload,
            lots:snapshot.payload?.process?.lots||[]})
          const item=grouped.get(identity)
          if(item.block!==block)return reply({ok:false,mode,error:'Transaction block conflict; no receipts saved'},409)
          item.events.push(event)
        }
      }
      const pending=[...grouped.values()].sort((a,b)=>a.block-b.block||a.hash.localeCompare(b.hash))
      if(!pending.length)return reply({ok:true,mode,day:dayCH(),status:'no_pending_receipts',
        verifiedTransactions:0,persisted:false,
        notice:'No receipt candidates from the currently staged transfer windows.'})
      // Bounded on-chain reads. All must pass before one atomic batch insert.
      const batch=pending.slice(0,4)
      const registry=await sb.from('defi_staking_contracts').select('contract_address')
        .eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true)
      if(registry.error||registry.data?.some((r:any)=>!evmAddress(r.contract_address)))
        return reply({ok:false,mode,error:'Staking registry unavailable or invalid; no receipt writes'},503)
      const stakingContracts=(registry.data||[]).map((r:any)=>evmAddress(r.contract_address)!)
      const evidence:any[]=[]
      try{
        for(const item of batch)evidence.push(await attachManualRewardProofMatches(item.wallet,item.hash,
          await verifyStagedReceipt(item.wallet,item.hash,item.block,item.events,item.lots),item.snapshot,stakingContracts,item.block,sb))
      }catch(e){console.error('TLN receipt evidence failed',safeRpcDiagnostic(e))
        return reply({ok:false,mode,error:'Receipt or staged transfer mismatch; no receipt evidence saved',
          rpcDiagnostic:safeRpcDiagnostic(e),persisted:false},503)}
      const insertRows=batch.map((item,i)=>({user_id:item.userId,wallet_id:item.walletId,
        chain_key:'bsc',tx_hash:item.hash,block_number:item.block,evidence:evidence[i],
        reward_classification_verified:false}))
      const {error:insertError}=await sb.from('tln_vow_reward_receipt_stage').insert(insertRows)
      if(insertError){
        if(insertError.code==='23505')return reply({ok:true,mode,status:'already_verified_concurrently',persisted:false,
          notice:'Overlapping receipt batch was staged by another invocation.'})
        return reply({ok:false,mode,error:'Receipt evidence insert failed; no canonical rewards changed'},503)
      }
      return reply({ok:true,mode,day:dayCH(),status:'receipt_evidence_staged',
        verifiedTransactions:batch.length,remainingTransactions:pending.length-batch.length,
        verifiedTransferLogs:evidence.reduce((n,e)=>n+e.transferLogsMatched,0),
        matchingManualRewardProofs:evidence.reduce((n,e)=>n+e.manualRewardProofMatchCount,0),
        newUnverifiedMintCandidates:evidence.reduce((n,e)=>n+e.newRewardMintCandidateCount,0),
        explicitClaimCandidates:evidence.reduce((n,e)=>n+e.explicitClaimCandidateCount,0),
        bonusClaimCandidates:evidence.reduce((n,e)=>n+e.bonusClaimCandidateCount,0),
        referralClaimCandidates:evidence.reduce((n,e)=>n+e.referralClaimCandidateCount,0),
        referralMintCandidates:evidence.reduce((n,e)=>n+e.referralMintCandidateCount,0),
        referralMintPathVerified:evidence.reduce((n,e)=>n+e.referralMintPathVerifiedCount,0),
        stateChangeCandidates:evidence.reduce((n,e)=>n+e.stateChangeCandidateCount,0),
        indirectTraceVerified:evidence.filter(e=>e.indirectTraceVerified===true).length,
        indirectRewardCandidates:evidence.reduce((n,e)=>n+(e.indirectRewardCandidateCount||0),0),
        uniqueLotAssignmentCandidates:evidence.reduce((n,e)=>n+e.uniqueLotAssignmentCandidateCount,0),
        matchedLifecycleTransactions:evidence.filter(e=>e.lifecycleLotMatches>0).length,
        knownBridges:evidence.filter(e=>e.knownBridge).length,
        persisted:true,rewardClassificationCompleted:false,referralClassificationCompleted:false,
        claimsCreated:0,
        notice:'Receipt-backed facts staged only. No reward/claim/referral allocation, historical completeness or cron.'})
    }
    if(mode==='delta-transfer-stage'||workCycle){
      // Intentionally only transfer *evidence*. A committed staging chunk is
      // never an authoritative reward/claim/referral or historical cursor.
      const rawRows:any[]=[]
      let rawComplete=false
      for(let p=0;p<maxPages;p++){
        const {data,error}=await sb.from('tln_vow_staking_scan_cache')
          .select('user_id,wallet_id,scanner_version,complete_from_block,last_scanned_block,payload')
          .eq('project_key','tln_vow').eq('chain_key','bsc').eq('cache_key','erc20-history-v1')
          .range(p*pageSize,(p+1)*pageSize-1)
        if(error)return reply({ok:false,mode,error:'Raw cache unavailable; no staging'},503)
        rawRows.push(...(data||[]))
        if((data||[]).length<pageSize){rawComplete=true;break}
      }
      if(!rawComplete)return reply({ok:false,mode,error:'Raw-cache pagination incomplete'},409)
      const rawByWallet=new Map<string,any>()
      for(const r of rawRows){
        if(!r.user_id||!r.wallet_id)continue
        const key=String(r.user_id)+'|'+String(r.wallet_id)
        if(!rawByWallet.has(key)||Number(r.last_scanned_block||0)>Number(rawByWallet.get(key).last_scanned_block||0))rawByWallet.set(key,r)
      }
      const stageRows:any[]=[]
      let stageComplete=false
      for(let p=0;p<maxPages;p++){
        const {data,error}=await sb.from('tln_vow_reward_delta_stage')
          .select('user_id,wallet_id,from_block,to_block')
          .eq('chain_key','bsc').order('from_block',{ascending:true})
          .range(p*pageSize,(p+1)*pageSize-1)
        if(error)return reply({ok:false,mode,error:'Staging table unavailable; apply 9.36 SQL first'},503)
        stageRows.push(...(data||[]))
        if((data||[]).length<pageSize){stageComplete=true;break}
      }
      if(!stageComplete)return reply({ok:false,mode,error:'Staging pagination incomplete'},409)
      const chunksByWallet=new Map<string,any[]>()
      for(const row of stageRows){
        const key=String(row.user_id)+'|'+String(row.wallet_id)
        if(!chunksByWallet.has(key))chunksByWallet.set(key,[])
        chunksByWallet.get(key)!.push(row)
      }
      let head:number
      try{head=await bscHead()}catch{return reply({ok:false,mode,error:'BSC head unavailable; no staging'},503)}
      const candidates:any[]=[]
      for(const [key,snapshot] of byWallet){
        const payload=snapshot.payload,raw=rawByWallet.get(key)
        const wallet=evmAddress(payload?.wallet),from=num(raw?.complete_from_block),to=num(raw?.last_scanned_block)
        if(payload?.kind!=='verified_discovery_results'||!wallet||raw?.scanner_version!=='erc20-raw-v1'||
          !Array.isArray(raw?.payload)||from===null||to===null||to<from||to===0||to>head)continue
        const currentAnchor=Math.max(0,to-DELTA_OVERLAP_BLOCKS)
        const continuity=contiguousStagedForwardRange(chunksByWallet.get(key)||[],currentAnchor,head)
        if(!continuity.valid)return reply({ok:false,mode,error:'Noncontiguous staged range; refusing to advance'},409)
        if(continuity.next!==null&&continuity.next<=head)candidates.push({userId:snapshot.user_id,walletId:snapshot.wallet_id,
          wallet,next:continuity.next,anchor:continuity.anchor})
      }
      candidates.sort((a,b)=>a.next-b.next)
      if(!candidates.length)return reply({ok:true,mode,day:dayCH(),status:'nothing_to_stage',persisted:false,
        notice:'No known cached wallet with a valid forward range. Encrypted-wallet eligibility remains separate.'})
      const target=candidates[0]
      const [stakingResult,tokenResult]=await Promise.all([
        sb.from('defi_staking_contracts').select('contract_address').eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true),
        sb.from('defi_project_tokens').select('contract_address').eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true)
      ])
      if(stakingResult.error||tokenResult.error)return reply({ok:false,mode,error:'Registry unavailable; no staging'},503)
      const configured=[...(stakingResult.data||[]),...(tokenResult.data||[])]
      if(configured.some((r:any)=>!evmAddress(r.contract_address)))return reply({ok:false,mode,error:'Invalid registry; no staging'},409)
      const contracts=[...new Set([...Object.keys(SCAN_CONTRACTS),...REFERRAL_MINT_CONTRACTS,
        ...configured.map((r:any)=>evmAddress(r.contract_address)!)])]
      const stakingContracts=(stakingResult.data||[]).map((r:any)=>evmAddress(r.contract_address)!)
      if(contracts.length>100)return reply({ok:false,mode,error:'Registry scope too broad'},409)
      // A work cycle advances one selected wallet through a bounded number of
      // contiguous, independently committed chunks. Each chunk is durable even
      // if a later scan fails; the next invocation resumes from persisted rows.
      const limit=workCycle?3:1,start=Date.now(),chunks:any[]=[]
      let cursor=target.next,receiptVerified=0,receiptDeferred=0,manualProofMatches=0,newUnverifiedMintCandidates=0,explicitClaimCandidates=0,bonusClaimCandidates=0,referralClaimCandidates=0,referralMintCandidates=0,referralMintPathVerified=0,stateChangeCandidates=0,indirectTraceVerified=0,indirectRewardCandidates=0,uniqueLotAssignmentCandidates=0,stopReason='max_chunks'
      for(let i=0;i<limit&&cursor<=head;i++){
        if(workCycle&&i>0&&Date.now()-start>16000){stopReason='time_budget';break}
        let chunkSize=maxBlocks,inspection:any=null,toBlock=cursor
        // Reduce block count only for an explicitly exceeded event budget.
        // Network and pagination failures stop immediately without advancing.
        while(true){
          toBlock=Math.min(head,cursor+chunkSize-1)
          try{
            inspection=await inspectWalletTransfers(target.wallet,cursor,toBlock,chunkSize,contracts,true)
            const calls=await captureStakingCallIdentities(target.wallet,cursor,toBlock,stakingContracts)
            const existing=new Set(inspection.capturedEvents.map((e:any)=>e.hash))
            const newCalls=calls.filter((e:any)=>!existing.has(e.hash))
            if(inspection.capturedEvents.length+newCalls.length>250)
              throw new RpcDiagnosticError('staking_calls','stage_event_budget_exceeded')
            inspection.capturedEvents.push(...newCalls)
            inspection.directContractCalls=calls.length
            inspection.callOnlyTransactions=newCalls.length
            break
          }
          catch(e){
            if(e instanceof RpcDiagnosticError&&
              (e.category==='stage_event_budget_exceeded'||e.category==='too_many_transfers')&&chunkSize>1){
              chunkSize=Math.max(1,Math.floor(chunkSize/2));continue
            }
            console.error('TLN staged transfer scan failed',safeRpcDiagnostic(e))
            return reply({ok:false,mode,error:'Transfer scan failed; prior chunks (if any) remain persisted',
              rpcDiagnostic:safeRpcDiagnostic(e),chunks,partial:chunks.length>0},503)
          }
        }
        if(!inspection.complete)return reply({ok:false,mode,error:'Pagination incomplete; current chunk not persisted',chunks},409)
        const {error:insertError}=await sb.from('tln_vow_reward_delta_stage').insert({
          user_id:target.userId,wallet_id:target.walletId,chain_key:'bsc',
          from_block:cursor,to_block:toBlock,registry_contracts:contracts,
          transfer_events:inspection.capturedEvents,pagination_complete:true,
          historical_completeness_verified:false,reward_classification_verified:false
        })
        if(insertError){
          if(insertError.code==='23505')return reply({ok:true,mode,status:'already_staged',persisted:false,
            chunks,notice:'Concurrent identical chunk already exists; rerun to resume.'})
          return reply({ok:false,mode,error:'Evidence staging failed; no canonical rewards changed',chunks},503)
        }
        chunks.push({fromBlock:cursor,toBlock,events:inspection.capturedEvents.length,
          directContractCalls:inspection.directContractCalls,callOnlyTransactions:inspection.callOnlyTransactions,
          nextFromBlock:toBlock+1,persisted:true})
        cursor=toBlock+1
        if(!workCycle)break
        const byHash=new Map<string,any[]>()
        for(const event of inspection.capturedEvents){
          if(!byHash.has(event.hash))byHash.set(event.hash,[])
          byHash.get(event.hash)!.push(event)
        }
        const txs=[...byHash.entries()]
        if(txs.length>4){receiptDeferred+=txs.length;stopReason='receipt_backlog';break}
        if(txs.length){
          const targetSnapshot=byWallet.get(String(target.userId)+'|'+String(target.walletId))?.payload
          const matchingLots=targetSnapshot?.process?.lots||[]
          const receipts:any[]=[]
          try{
            for(const [hash,events] of txs)receipts.push({hash,block:events[0].block,
              evidence:await attachManualRewardProofMatches(target.wallet,hash,
                await verifyStagedReceipt(target.wallet,hash,events[0].block,events,matchingLots),targetSnapshot,stakingContracts,events[0].block,sb)})
          }catch(e){
            console.error('TLN immediate receipt verification failed',safeRpcDiagnostic(e))
            return reply({ok:false,mode,error:'Transfer chunk staged; receipt proof failed and is retryable',
              rpcDiagnostic:safeRpcDiagnostic(e),chunks,partial:true},503)
          }
          const rows=receipts.map(r=>({user_id:target.userId,wallet_id:target.walletId,
            chain_key:'bsc',tx_hash:r.hash,block_number:r.block,evidence:r.evidence,
            reward_classification_verified:false}))
          const {error:receiptError}=await sb.from('tln_vow_reward_receipt_stage').insert(rows)
          if(receiptError){
            // A duplicate may be an overlapping/previously verified hash; the
            // standalone delta-receipt-verify mode safely handles the backlog.
            receiptDeferred+=txs.length;stopReason='receipt_insert_retry';break
          }
          receiptVerified+=receipts.length
          manualProofMatches+=receipts.reduce((n,r)=>n+r.evidence.manualRewardProofMatchCount,0)
          newUnverifiedMintCandidates+=receipts.reduce((n,r)=>n+r.evidence.newRewardMintCandidateCount,0)
          explicitClaimCandidates+=receipts.reduce((n,r)=>n+r.evidence.explicitClaimCandidateCount,0)
          bonusClaimCandidates+=receipts.reduce((n,r)=>n+r.evidence.bonusClaimCandidateCount,0)
          referralClaimCandidates+=receipts.reduce((n,r)=>n+r.evidence.referralClaimCandidateCount,0)
          referralMintCandidates+=receipts.reduce((n,r)=>n+r.evidence.referralMintCandidateCount,0)
          referralMintPathVerified+=receipts.reduce((n,r)=>n+r.evidence.referralMintPathVerifiedCount,0)
          stateChangeCandidates+=receipts.reduce((n,r)=>n+r.evidence.stateChangeCandidateCount,0)
          indirectTraceVerified+=receipts.filter(r=>r.evidence.indirectTraceVerified===true).length
          indirectRewardCandidates+=receipts.reduce((n,r)=>n+(r.evidence.indirectRewardCandidateCount||0),0)
          uniqueLotAssignmentCandidates+=receipts.reduce((n,r)=>n+r.evidence.uniqueLotAssignmentCandidateCount,0)
        }
      }
      if(cursor>head)stopReason='chain_head'
      return reply({ok:true,mode,day:dayCH(),status:workCycle?'work_cycle_staged':'staged_transfer_evidence',
        ...(workCycle?{chunks,receiptVerified,receiptDeferred,manualProofMatches,newUnverifiedMintCandidates,explicitClaimCandidates,bonusClaimCandidates,referralClaimCandidates,referralMintCandidates,referralMintPathVerified,stateChangeCandidates,indirectTraceVerified,indirectRewardCandidates,uniqueLotAssignmentCandidates,stopReason,elapsedMs:Date.now()-start}:
          {chunk:chunks[0]}),scopedContracts:contracts.length,selectedWallets:1,
        historicalCompletenessVerified:false,rewardClassificationCompleted:false,
        referralClassificationCompleted:false,claimsCreated:0,
        notice:'Contiguous transfer and receipt evidence only. No canonical rewards/claims, historical completeness or cron.'})
    }
    if(mode==='reward-source-parity-audit'){
      // Compare the manual Discovery registries with the existing Edge preview.
      // Never suggest that token-scoped transfer counting is equivalent to
      // contract calls, receipt evidence, staking lots or the referral engine.
      const [stakingResult,tokensResult]=await Promise.all([
        sb.from('defi_staking_contracts').select('contract_address,role,classify_transfers,pair_address')
          .eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true),
        sb.from('defi_project_tokens').select('contract_address,role')
          .eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true)
      ])
      if(stakingResult.error||tokensResult.error)
        return reply({ok:false,mode,error:'Configured TLN/VOW contract registry unavailable; no parity verdict'},503)
      const staking=stakingResult.data||[],tokens=tokensResult.data||[]
      const recognized=new Set(Object.keys(SCAN_CONTRACTS))
      const unique=(items:any[])=>new Set<string>(items.map((r:any)=>evmAddress(r.contract_address)).filter((v):v is string=>!!v))
      const tokenAddresses=unique(tokens),stakingAddresses=unique(staking)
      const classify=staking.filter((r:any)=>r.classify_transfers===true)
      const entry=staking.filter((r:any)=>r.classify_transfers!==true)
      const knownTokens=[...tokenAddresses].filter(x=>recognized.has(x)).length
      const knownStaking=[...stakingAddresses].filter(x=>recognized.has(x)).length
      const counts={fixedEdgeTokenContracts:recognized.size,
        configuredProjectTokenContracts:tokenAddresses.size,
        configuredProjectTokensOutsideFixedEdgeSet:tokenAddresses.size-knownTokens,
        configuredStakingOrEntryContracts:stakingAddresses.size,
        stakingOrEntryContractsOutsideFixedEdgeSet:stakingAddresses.size-knownStaking,
        classifyTransferRegistryRows:classify.length,entryOrAuxiliaryRegistryRows:entry.length}
      const manualSources=[
        {source:'wallet_erc20_transfers',manual:true,edgePreview:true,edgeScope:'all wallet ERC20 transfers fetched, only four fixed contracts counted'},
        {source:'enabled_project_token_registry',manual:true,edgePreview:false,edgeScope:'not loaded'},
        {source:'staking_entry_contract_registry',manual:true,edgePreview:false,edgeScope:'not loaded'},
        {source:'contract_calls_and_receipts',manual:true,edgePreview:false,edgeScope:'not classified'},
        {source:'stake_topup_lifecycle_storage_proofs',manual:true,edgePreview:false,edgeScope:'not classified'},
        {source:'reward_claim_and_bonus_classification',manual:true,edgePreview:false,edgeScope:'not classified'},
        {source:'referral_reference_engine',manual:true,edgePreview:false,edgeScope:'not executed'}]
      return reply({ok:true,mode,day:dayCH(),counts,manualSources,
        parityVerified:false,rewardCompletenessVerified:false,referralCompletenessVerified:false,
        notice:'Read-only registry/feature inventory. The Edge preview fetches wallet ERC20 transfers but counts only four fixed contracts. No parity with manual staking, contract-call, receipt, top-up, reward or referral classification. No identities, chain RPC, cache/cursor writes or cron.'})
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
    if(mode==='delta-bootstrap-preview'){
      // The persisted ERC20 last block is a candidate start anchor only.
      // Explicitly keep legacy history unverified; never initialize a cursor
      // from a preexisting range without an independently checked scan.
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
      if(!rawComplete)return reply({ok:false,mode,error:'Raw-cache pagination incomplete; no bootstrap plan'},409)
      const rawByWallet=new Map<string,any>()
      for(const row of rawRows){
        if(!row.user_id||!row.wallet_id)continue
        const k=String(row.user_id)+'|'+String(row.wallet_id)
        if(!rawByWallet.has(k)||Number(row.last_scanned_block||0)>Number(rawByWallet.get(k).last_scanned_block||0))rawByWallet.set(k,row)
      }
      const summary={snapshotWallets:byWallet.size,legacyCandidates:0,
        eligibleForPreview:0,invalidOrMissingRawCache:0,invalidSnapshotWallet:0,
        cursorAheadOfHead:0,historyStillUnverified:0}
      const candidates:any[]=[]
      for(const [key,snapshot] of byWallet){
        const p=snapshot.payload
        if(p?.kind!=='verified_discovery_results'||verificationCore.auditSnapshot(p).verified)continue
        summary.legacyCandidates++
        if(!evmAddress(p.wallet)){summary.invalidSnapshotWallet++;continue}
        const raw=rawByWallet.get(key)
        const from=num(raw?.complete_from_block),to=num(raw?.last_scanned_block)
        if(raw?.scanner_version!=='erc20-raw-v1'||!Array.isArray(raw?.payload)||
          from===null||to===null||to<from||to===0){summary.invalidOrMissingRawCache++;continue}
        summary.eligibleForPreview++
        candidates.push({from,to,checkedAt:String(p?.lastCheckedAt||p?.savedAt||snapshot.updated_at||'')})
      }
      let head:number|null=null
      if(candidates.length){
        try{head=await bscHead()}catch{return reply({ok:false,mode,error:'BSC head unavailable; no bootstrap plan',summary},503)}
      }
      candidates.sort((a,b)=>a.to-b.to)
      const plan=candidates.slice(0,25).map((candidate,i)=>{
        if(head===null||candidate.to>head){summary.cursorAheadOfHead++;return {ordinal:i+1,status:'cursor_ahead_of_head',persisted:false}}
        const chunkFrom=Math.max(0,candidate.to-DELTA_OVERLAP_BLOCKS)
        const chunkTo=Math.min(head,chunkFrom+maxBlocks-1)
        summary.historyStillUnverified++
        return {ordinal:i+1,status:'proposed_unverified_anchor',
          recordedFromBlock:candidate.from,recordedToBlock:candidate.to,
          fromBlock:chunkFrom,toBlock:chunkTo,
          remainingChunks:Math.ceil((head-chunkTo)/maxBlocks),
          historicalCompletenessVerified:false,verifiedCursorCreated:false,
          requiresIndependentScanAndClassification:true,persisted:false,executed:false}
      })
      return reply({ok:true,mode,day:dayCH(),chain:'bsc',head,maxBlocks,summary,
        plannedWallets:plan.length,truncated:candidates.length>plan.length,plan,
        notice:'Read-only proposed forward scan anchors from historic ERC20 caches, not approved verified checkpoints. Prior block history remains unverified. Encrypted-wallet eligibility is not enumerated. No transfers scanned, reward or referral classification, cursor/lease/cache writes, cron or identity disclosure.'})
    }
    if(mode==='legacy-first-chunk-scan-preview'||mode==='registry-first-chunk-scan-preview'||mode==='staking-call-receipt-preview'){
      // Fixed one-wallet scope from persisted caches; callers cannot supply a
      // wallet, block range, arbitrary token contract or RPC endpoint.
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
      if(!rawComplete)return reply({ok:false,mode,error:'Raw-cache pagination incomplete; no transfer scan'},409)
      const rawByWallet=new Map<string,any>()
      for(const raw of rawRows){
        if(!raw.user_id||!raw.wallet_id)continue
        const key=String(raw.user_id)+'|'+String(raw.wallet_id)
        if(!rawByWallet.has(key)||Number(raw.last_scanned_block||0)>Number(rawByWallet.get(key).last_scanned_block||0))rawByWallet.set(key,raw)
      }
      const candidates:any[]=[]
      for(const [key,row] of byWallet){
        const p=row.payload
        if(p?.kind!=='verified_discovery_results'||verificationCore.auditSnapshot(p).verified)continue
        const wallet=evmAddress(p.wallet),raw=rawByWallet.get(key)
        const from=num(raw?.complete_from_block),to=num(raw?.last_scanned_block)
        if(!wallet||raw?.scanner_version!=='erc20-raw-v1'||!Array.isArray(raw?.payload)||
          from===null||to===null||to<from||to===0)continue
        candidates.push({wallet,recordedTo:to})
      }
      candidates.sort((a,b)=>a.recordedTo-b.recordedTo)
      const selected=candidates[0]
      if(!selected)return reply({ok:false,mode,error:'No valid legacy candidate; no scan performed'},409)
      let head:number
      try{head=await bscHead()}catch{
        return reply({ok:false,mode,error:'BSC head unavailable; no scan performed'},503)
      }
      if(selected.recordedTo>head)return reply({ok:false,mode,error:'Legacy anchor ahead of BSC head; no scan'},409)
      const fromBlock=Math.max(0,selected.recordedTo-DELTA_OVERLAP_BLOCKS)
      const toBlock=Math.min(head,fromBlock+maxBlocks-1)
      let registryContracts:string[]|undefined
      let registrySummary:any=undefined
      if(mode==='registry-first-chunk-scan-preview'||mode==='staking-call-receipt-preview'){
        const [stakingResult,tokenResult]=await Promise.all([
          sb.from('defi_staking_contracts').select('contract_address,role,classify_transfers')
            .eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true),
          sb.from('defi_project_tokens').select('contract_address,role')
            .eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true)
        ])
        if(stakingResult.error||tokenResult.error)return reply({ok:false,mode,error:'Contract registry unavailable; no scan'},503)
        const staking=stakingResult.data||[],tokens=tokenResult.data||[]
        if(staking.some((r:any)=>!evmAddress(r.contract_address))||tokens.some((r:any)=>!evmAddress(r.contract_address)))
          return reply({ok:false,mode,error:'Invalid configured contract address; no scan'},409)
        registryContracts=[...new Set([...Object.keys(SCAN_CONTRACTS),
          ...staking.map((r:any)=>evmAddress(r.contract_address)!),...tokens.map((r:any)=>evmAddress(r.contract_address)! )])]
        if(registryContracts.length>100)return reply({ok:false,mode,error:'Contract registry exceeds safe scope; no scan'},409)
        registrySummary={configuredStakingRows:staking.length,configuredProjectTokenRows:tokens.length,
          uniqueContractsInspected:registryContracts.length,
          transferClassifyingStakingRows:staking.filter((r:any)=>r.classify_transfers===true).length,
          classificationPerformed:false}
      }
      if(mode==='staking-call-receipt-preview'){
        const {data,error}=await sb.from('defi_staking_contracts').select('contract_address')
          .eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true)
        if(error)return reply({ok:false,mode,error:'Staking registry unavailable; no scan'},503)
        const targets=(data||[]).map((x:any)=>evmAddress(x.contract_address))
        if(!targets.length||targets.some(x=>!x))return reply({ok:false,mode,error:'Invalid staking registry; no scan'},409)
        const distinct=[...new Set(targets)] as string[]
        if(distinct.length>100)return reply({ok:false,mode,error:'Staking registry exceeds safe scope; no scan'},409)
        try {
          const evidence=await inspectStakingContractCalls(selected.wallet,fromBlock,toBlock,distinct)
          return reply({ok:true,mode,day:dayCH(),selectedWallets:1,
            registry:{stakingContracts:distinct.length},
            chunk:{fromBlock,toBlock,maxBlocks,executed:true,persisted:false},
            evidence,scanCompleted:evidence.evidenceComplete,
            rewardClassificationCompleted:false,referralClassificationCompleted:false,
            notice:'Read-only wallet external calls to enabled staking contracts, bounded tx selectors and receipts. Incomplete pagination or truncated calls cannot establish complete evidence. No staking-lot/reward/referral classification, cache/cursor/lease writes or cron.'})
        }catch(e){const diagnostic=safeRpcDiagnostic(e)
          console.error('TLN staking call/receipt preview failed',diagnostic)
          return reply({ok:false,mode,error:'Staking call/receipt inspection failed; no progress saved',
            rpcDiagnostic:diagnostic,chunk:{fromBlock,toBlock,persisted:false},scanCompleted:false},503)
        }
      }
      let inspection:any
      try{inspection=await inspectWalletTransfers(selected.wallet,fromBlock,toBlock,maxBlocks,registryContracts)}
      catch(e){
        const diagnostic=safeRpcDiagnostic(e)
        console.error('TLN legacy first-chunk scan preview failed',diagnostic)
        return reply({ok:false,mode,error:'Scoped Alchemy transfer scan failed; no progress saved',
          rpcDiagnostic:diagnostic,chunk:{fromBlock,toBlock,maxBlocks,persisted:false},scanCompleted:false},503)
      }
      return reply({ok:true,mode,day:dayCH(),selectedWallets:1,
        source:{recordedToBlock:selected.recordedTo,historicalCompletenessVerified:false},
        registrySummary,chunk:{fromBlock,toBlock,blocks:toBlock-fromBlock+1,maxBlocks,
          hypotheticalNextFromBlock:inspection.complete&&toBlock<head?toBlock+1:null,
          persisted:false,executed:true},inspection,scanCompleted:inspection.complete,
        rewardClassificationCompleted:false,referralClassificationCompleted:false,
        notice:mode==='registry-first-chunk-scan-preview'?
          'Read-only configured staking, entry, token and fixed-contract transfer count. No calls/receipts, reward/referral classification or verified historical completeness; no cache/cursor/lease writes, identity output or cron.':
          'Read-only one-legacy-wallet Alchemy ERC20 AssetTransfers for FOUR fixed token contracts only. Pagination completeness refers ONLY to these scoped transfers, not all possible reward/staking contracts. No reward/claim classification, cursor/cache/lease writes, identity output or cron.'})
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
    if(mode==='cached-range-integrity'){
      // Inspect historical rows but do not infer that an empty block has been
      // scanned, or that the original provider pagination was exhaustive.
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
      if(!rawComplete)return reply({ok:false,mode,error:'Raw-cache pagination incomplete; no diagnosis'},409)
      const rawByWallet=new Map<string,any>()
      for(const row of rawRows){
        if(!row.user_id||!row.wallet_id)continue
        const k=String(row.user_id)+'|'+String(row.wallet_id)
        if(!rawByWallet.has(k)||Number(row.last_scanned_block||0)>Number(rawByWallet.get(k).last_scanned_block||0))rawByWallet.set(k,row)
      }
      const summary={legacyWallets:0,withCache:0,validRecordedRanges:0,invalidRecordedRanges:0,
        rowsExamined:0,invalidRows:0,outsideRecordedRange:0,duplicateIdentities:0,
        snapshotCursorAhead:0,rawRowsExceedBudget:false}
      const details:any[]=[]
      for(const [key,snapshot] of byWallet){
        const p=snapshot.payload
        if(p?.kind!=='verified_discovery_results'||verificationCore.auditSnapshot(p).verified)continue
        summary.legacyWallets++
        const raw=rawByWallet.get(key)
        if(raw)summary.withCache++
        const from=num(raw?.complete_from_block),to=num(raw?.last_scanned_block)
        const validRange=raw?.scanner_version==='erc20-raw-v1'&&Array.isArray(raw?.payload)&&
          from!==null&&to!==null&&to>=from&&to>0
        if(validRange)summary.validRecordedRanges++
        else summary.invalidRecordedRanges++
        const rows=Array.isArray(raw?.payload)?raw.payload:[]
        if(summary.rowsExamined+rows.length>250000){summary.rawRowsExceedBudget=true;break}
        const identities=new Set<string>()
        let invalidRows=0,outsideRange=0,duplicates=0,lowBlock:number|null=null,highBlock:number|null=null
        for(const t of rows){
          const block=typeof t?.blockNum==='string' && /^0x[0-9a-f]+$/i.test(t.blockNum)
            ?Number(BigInt(t.blockNum)):num(t?.blockNum)
          const hash=String(t?.hash||'').toLowerCase()
          const token=String(t?.rawContract?.address||'').toLowerCase()
          if(block===null||!Number.isSafeInteger(block)||!/^0x[0-9a-f]{64}$/.test(hash)||
             !/^0x[0-9a-f]{40}$/.test(token)) {invalidRows++;continue}
          lowBlock=lowBlock===null?block:Math.min(lowBlock,block)
          highBlock=highBlock===null?block:Math.max(highBlock,block)
          if(!validRange||block<from||block>to)outsideRange++
          const id=String(t?.uniqueId||'')||`${hash}|${token}|${block}|${String(t?.from||'')}|${String(t?.to||'')}`
          if(identities.has(id))duplicates++
          else identities.add(id)
        }
        summary.rowsExamined+=rows.length
        summary.invalidRows+=invalidRows
        summary.outsideRecordedRange+=outsideRange
        summary.duplicateIdentities+=duplicates
        const snapshotBlock=num(p?.lastCheckedBlock??p?.sourceLastBlock)
        const cursorAhead=snapshotBlock!==null&&to!==null&&snapshotBlock>to
        if(cursorAhead)summary.snapshotCursorAhead++
        if(details.length<25)details.push({ordinal:details.length+1,validRecordedRange:validRange,
          recordedFromBlock:validRange?from:null,recordedToBlock:validRange?to:null,
          transfers:rows.length,earliestEventBlock:lowBlock,latestEventBlock:highBlock,
          invalidRows,outsideRange,duplicateIdentities:duplicates,snapshotCursorAhead:cursorAhead,
          paginationProofPresent:false})
      }
      if(summary.rawRowsExceedBudget)return reply({ok:false,mode,error:'Raw row audit budget exceeded; no completeness inference',summary},409)
      return reply({ok:true,mode,day:dayCH(),summary,returned:details.length,
        truncated:summary.legacyWallets>details.length,details,
        notice:'Historical row/range integrity only. A persisted contiguous range and valid events cannot prove original RPC pagination, completeness of empty blocks, relevant-contract coverage, or reward/referral classification. No identity exposure, RPC, writes, cursor changes or cron.'})
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
    if(mode==='historical-topup-rpc-regression'){
      const candidates=[]
      for(const row of byWallet.values()){
        const payload=row.payload
        if(payload?.kind!=='verified_discovery_results')continue
        for(const candidate of verificationCore.verifiedTopUpMintCandidates(
          payload?.process?.lots||[],payload?.globals?.provenRewardRows||[],payload?.wallet)){
          if(String(candidate.row?.hash||'').toLowerCase()===LEGACY_STAKE_AUDIT_HASH&&
            evmAddress(candidate.row?.token)===LEGACY_TOPUP_MINT_TOKEN&&Number(candidate.row?.amount)===5500)
            candidates.push({wallet:payload.wallet,lot:payload.process.lots[candidate.lotIndex],candidate})
        }
      }
      if(candidates.length!==1)return reply({ok:false,mode,error:'Historical verified cache anchor not unique; no RPC'},409)
      const candidate=candidates[0]
      const storageProof=candidate.candidate.topUp?.storageProof
      const cached={uniqueTopupLot:true,storageProofRecorded:storageProof?.proven===true,
        sameWalletPositionState:candidate.candidate.topUp?.evidence==='onchain_same_wallet_position_state',
        cachedProvenRewardAmount:5500,cachedRewardProofPresent:!!candidate.candidate.row?.rewardProof,
        cachedRewardFlowEvidencePresent:!!candidate.candidate.row?.rewardFlowEvidence}
      try{
        const onchain=await inspectHistoricalTopUpProof(candidate.wallet,5500)
        return reply({ok:true,mode,day:dayCH(),targetBlock:LEGACY_STAKE_AUDIT_BLOCK,
          cached,onchain,verifiedAgreement:cached.storageProofRecorded&&cached.sameWalletPositionState&&
            onchain.independentlyConfirmed,claimsCreated:0,persisted:false,
          notice:'Read-only fixed historical Tx/receipt/decimals vs uniquely matched cached top-up. Existing storage-proof flag is cached evidence, NOT independently re-verified. No new reward classification, writes, cursor or cron.'})
      }catch(e){const diagnostic=safeRpcDiagnostic(e)
        console.error('TLN historical top-up regression failed',diagnostic)
        return reply({ok:false,mode,error:'Historical on-chain regression unavailable; no changes',rpcDiagnostic:diagnostic,
          persisted:false},503)
      }
    }
    if(mode==='cached-topup-mint-rpc-preview'){
      // Generalized 9.31 evidence verifier. Candidate discovery is entirely
      // server-side, strictly rooted in the shared verified-top-up rule.
      const candidates:any[]=[]
      for(const row of byWallet.values()){
        const p=row.payload
        if(p?.kind!=='verified_discovery_results')continue
        for(const candidate of verificationCore.verifiedTopUpMintCandidates(
          p?.process?.lots||[],p?.globals?.provenRewardRows||[],p?.wallet)){
          const hash=String(candidate.row?.hash||'').toLowerCase()
          const token=evmAddress(candidate.row?.token)
          const block=Number(candidate.topUp?.block??candidate.row?.block)
          const amount=Number(candidate.row?.amount)
          if(!token||!Number.isSafeInteger(block)||block<=0||!Number.isFinite(amount)||amount<=0||
            amountInBaseUnits(amount,36)===null)continue
          candidates.push({hash,token,block,amount,wallet:p.wallet})
        }
      }
      const key=(c:any)=>`${c.hash}|${c.token}|${c.amount}`
      const owners=new Map<string,number>()
      for(const c of candidates)owners.set(key(c),(owners.get(key(c))||0)+1)
      const unique=candidates.filter(c=>owners.get(key(c))===1)
        .sort((a,b)=>a.block-b.block||a.hash.localeCompare(b.hash))
      const selected=unique.slice(0,3)
      if(!selected.length)return reply({ok:true,mode,day:dayCH(),candidatesFound:candidates.length,
        uniqueEligible:0,inspected:0,results:[],persisted:false,
        notice:'No unambiguous cache-derived top-up mint with usable block and amount. No RPC or writes.'})
      const results=[]
      for(let i=0;i<selected.length;i++){
        const c=selected[i]
        try {
          const evidence=await inspectHistoricalTopUpProof(c.wallet,c.amount,c.hash,c.token,c.block)
          results.push({ordinal:i+1,block:c.block,expectedAmount:c.amount,
            txHashMatches:evidence.txHashMatches,blockMatches:evidence.blockMatches,
            senderMatches:evidence.senderMatches,selector:evidence.selector,
            receiptMatches:evidence.receiptMatches,receiptSuccessful:evidence.receiptSuccessful,
            mintCount:evidence.matchingZeroMintsToWallet,decimalsVerified:evidence.decimalsVerified,
            mintAmountMatches:evidence.mintAmountMatches,verifiedAgreement:evidence.independentlyConfirmed})
        }catch(e){const diagnostic=safeRpcDiagnostic(e)
          console.error('TLN cache-derived mint RPC preview failed',diagnostic)
          return reply({ok:false,mode,error:'A cache-derived RPC verification failed; no progress saved',
            rpcDiagnostic:diagnostic,inspected:i,persisted:false},503)
        }
      }
      return reply({ok:true,mode,day:dayCH(),candidatesFound:candidates.length,
        ambiguousExcluded:candidates.length-unique.length,uniqueEligible:unique.length,
        inspected:selected.length,truncated:unique.length>selected.length,results,
        verifiedAgreementCount:results.filter(x=>x.verifiedAgreement).length,
        rewardCoverageVerified:false,referralCoverageVerified:false,claimsCreated:0,persisted:false,
        notice:'Read-only shared cached top-up proof rule plus bounded generic Tx/receipt/token-decimals verification. No new candidate discovery, storage reproof, reward or referral completeness, cache/cursor/claim writes or cron.'})
    }
    if(mode==='historical-inflow-candidate-preview'||mode==='historical-inflow-triage-preview'){
      const triage=mode==='historical-inflow-triage-preview'
      const offset=triage?(body?.offset??0):0
      if(!Number.isSafeInteger(offset)||offset<0||offset>10000)
        return reply({ok:false,mode,error:'offset must be an integer from 0 to 10000'},400)
      let stakingAddresses:Set<string>|undefined
      if(triage){
        const {data,error}=await sb.from('defi_staking_contracts').select('contract_address')
          .eq('project_key','tln_vow').eq('chain_key','bsc').eq('enabled',true)
        if(error)return reply({ok:false,mode,error:'Staking registry unavailable; no triage'},503)
        const contracts=(data||[]).map((r:any)=>evmAddress(r.contract_address))
        if(contracts.some(x=>!x)||contracts.length>100)return reply({ok:false,mode,error:'Unsafe staking registry'},409)
        stakingAddresses=new Set(contracts as string[])
      }
      // Candidate search in already persisted ERC20 raw history only. This
      // does NOT claim the original history pagination was exhaustive.
      const rawRows:any[]=[]
      let rawComplete=false
      for(let p=0;p<maxPages;p++){
        const {data,error}=await sb.from('tln_vow_staking_scan_cache')
          .select('user_id,wallet_id,scanner_version,complete_from_block,last_scanned_block,payload')
          .eq('project_key','tln_vow').eq('chain_key','bsc').eq('cache_key','erc20-history-v1')
          .range(p*pageSize,(p+1)*pageSize-1)
        if(error)return reply({ok:false,mode,error:'Raw history unavailable; no scan'},503)
        rawRows.push(...(data||[]))
        if((data||[]).length<pageSize){rawComplete=true;break}
      }
      if(!rawComplete)return reply({ok:false,mode,error:'Raw history pagination incomplete'},409)
      const rawByWallet=new Map<string,any>()
      for(const row of rawRows){
        if(!row.user_id||!row.wallet_id)continue
        const key=String(row.user_id)+'|'+String(row.wallet_id)
        if(!rawByWallet.has(key)||Number(rawByWallet.get(key).last_scanned_block||0)<Number(row.last_scanned_block||0))
          rawByWallet.set(key,row)
      }
      const accepted=new Set(Object.keys(SCAN_CONTRACTS))
      for(const snapshot of byWallet.values())for(const row of (snapshot.payload?.globals?.provenRewardRows||[])){
        const token=evmAddress(row?.token)
        if(token&&row?.rewardProof&&row?.rewardFlowEvidence)accepted.add(token)
      }
      if(accepted.size>100)return reply({ok:false,mode,error:'Proven-token scope exceeds safe budget'},409)
      const candidates:any[]=[],seen=new Set<string>()
      let examinedRows=0,invalidRows=0,excludedPreviouslyProven=0
      for(const [key,snapshot] of byWallet){
        const p=snapshot.payload,raw=rawByWallet.get(key)
        const wallet=evmAddress(p?.wallet)
        if(p?.kind!=='verified_discovery_results'||!wallet||raw?.scanner_version!=='erc20-raw-v1'||
          !Array.isArray(raw?.payload))continue
        const from=num(raw.complete_from_block),to=num(raw.last_scanned_block)
        if(from===null||to===null||to<from||to===0)continue
        const known=new Set((p?.globals?.provenRewardRows||[]).map((r:any)=>
          String(r?.hash||'').toLowerCase()+'|'+String(r?.token||'').toLowerCase()))
        for(const lot of (p?.process?.lots||[]))for(const claim of (lot?.rewardClaims||[]))
          known.add(String(claim?.hash||'').toLowerCase()+'|'+String(claim?.token||'').toLowerCase())
        for(const t of raw.payload){
          if(++examinedRows>250000)return reply({ok:false,mode,error:'Raw history exceeds read-only inspection budget'},409)
          const hash=String(t?.hash||'').toLowerCase(),token=evmAddress(t?.rawContract?.address)
          const block=typeof t?.blockNum==='string'&&/^0x[0-9a-f]+$/i.test(t.blockNum)?
            Number(BigInt(t.blockNum)):num(t?.blockNum)
          if(!/^0x[0-9a-f]{64}$/.test(hash)||block===null||!Number.isSafeInteger(block)||
            block<from||block>to){invalidRows++;continue}
          if(!token||!accepted.has(token)||evmAddress(t?.to)!==wallet||!(Number(t?.value)>0))continue
          if(known.has(hash+'|'+token)){excludedPreviouslyProven++;continue}
          const identity=key+'|'+hash+'|'+token
          if(seen.has(identity))continue
          seen.add(identity)
          candidates.push({hash,token,block,wallet})
        }
      }
      candidates.sort((a,b)=>b.block-a.block||a.hash.localeCompare(b.hash))
      const pageSizeForMode=triage?8:3
      const selected=candidates.slice(offset,offset+pageSizeForMode),results=[]
      for(let i=0;i<selected.length;i++){
        const c=selected[i]
        try{
          const evidence=await inspectHistoricalInflowReceipt(c.wallet,c.hash,c.token,c.block,stakingAddresses)
          if(triage){
            const selector=evidence.selector
            const hint=evidence.zeroMintLogs>0?'mint_requires_position_proof':
              evidence.directStakingContractCall||evidence.txSenderIsStakingContract||evidence.tokenTransferFromStakingContract?
                'staking_contract_relation_requires_proof':
              selector==='0x3593564c'?'router_like_selector_unverified':'unresolved_inflow'
            results.push({ordinal:offset+i+1,block:c.block,selector,
              transferEvidenceConfirmed:evidence.transferEvidenceConfirmed,
              zeroMintLogs:evidence.zeroMintLogs,
              sharedFlowKind:evidence.sharedFlowKind,
              sharedPayoutCandidates:evidence.sharedPayoutCandidates,
              directStakingContractCall:evidence.directStakingContractCall,
              txSenderIsStakingContract:evidence.txSenderIsStakingContract,
              tokenTransferFromStakingContract:evidence.tokenTransferFromStakingContract,
              triageHint:hint,requiresRewardReview:true,rewardClassified:false})
          }else results.push({ordinal:i+1,block:c.block,...evidence})
        }catch(e){const diagnostic=safeRpcDiagnostic(e)
          console.error('TLN raw-history candidate receipt preview failed',diagnostic)
          return reply({ok:false,mode,error:'Candidate receipt unavailable; no progress saved',
            rpcDiagnostic:diagnostic,inspected:i,persisted:false},503)
        }
      }
      return reply({ok:true,mode,day:dayCH(),examinedRows,invalidRows,
        eligibleTokenContracts:accepted.size,
        excludedPreviouslyProven,candidatesFound:candidates.length,inspected:selected.length,
        offset,remainingCandidates:Math.max(0,candidates.length-offset-selected.length),
        truncated:candidates.length>offset+selected.length,results,
        ...(triage?{stakingContractsChecked:stakingAddresses!.size,
          triageHintCounts:results.reduce((m:any,r:any)=>(m[r.triageHint]=(m[r.triageHint]||0)+1,m),{} as Record<string,number>),
          triagedTotalNotYetKnown:true}:{}),
        confirmedTransferEvidence:results.filter(r=>r.transferEvidenceConfirmed).length,
        rewardClassificationCompleted:false,referralClassificationCompleted:false,
        historicalCoverageVerified:false,claimsCreated:0,persisted:false,
        notice:triage?
          'Read-only heuristics for a bounded page of existing inflow candidates. Router selector is not definitive DEX proof; contract relation or mint is not a reward proof. No global classification, uninspected candidate verdict, historical completeness, writes or cron.':
          'Read-only unclassified positive inflow candidates from existing ERC20 caches for fixed token contracts plus previously proof-backed reward tokens. Receipt-confirmed token inflow is NOT a reward proof; no historical scan completeness, staking/bonus/referral classification, cursor/cache/claim writes or cron.'})
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
}
Deno.serve(handleRewardRequest)
