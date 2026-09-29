// Phase 6.78 · 29.09.2026 17:48:45 CEST: Projektübergreifender Staking-Katalog ergänzt: verifizierte generische Staking-Kandidaten werden chainweit und optional projektbezogen klassifiziert. Build 20260929-174845.
window.WalletStakingEngine = (() => {
  let ctx=()=>({});
  const catalogCache=new Map(), allCatalogCache=new Map();
  const norm=x=>String(x||"").trim().toLowerCase();

  async function loadCatalog(projectKey,chain,force=false){
    const key=`${projectKey}|${chain}`;
    if(catalogCache.has(key)&&!force)return catalogCache.get(key);
    const c=ctx();
    if(!c.sb||!c.currentUser?.id){catalogCache.set(key,[]);return [];}
    const {data,error}=await c.sb.from("defi_staking_contracts")
      .select("*")
      .eq("project_key",projectKey)
      .eq("chain_key",chain)
      .eq("enabled",true);
    if(error)throw error;
    let rows=data||[];
    // Projektzugeordnete, administrativ verifizierte generische LP-Staking-Ziele
    // ergänzen den bestehenden Contract-Katalog. Die Tabelle ist ab Migration 077 vorhanden.
    try{
      const {data:extra,error:extraError}=await c.sb.from("lp_staking_candidates").select("*")
        .eq("chain_key",chain).eq("project_key",projectKey).eq("status","verified");
      if(!extraError) rows=rows.concat((extra||[]).map(r=>({
        project_key:r.project_key||projectKey,chain_key:r.chain_key,
        contract_address:r.contract_address,pair_address:r.pair_address,
        label:r.label||"Verifiziertes LP-Staking",role:"staking",enabled:true,classify_transfers:true,
        _genericRegistry:true
      })));
    }catch{}
    catalogCache.set(key,rows);return rows;
  }

  async function loadCatalogAll(chain,force=false){
    const key=String(chain||"");
    if(allCatalogCache.has(key)&&!force)return allCatalogCache.get(key);
    const c=ctx();if(!c.sb||!c.currentUser?.id){allCatalogCache.set(key,[]);return [];}
    let rows=[];
    try{
      const {data,error}=await c.sb.from("defi_staking_contracts").select("*").eq("chain_key",chain).eq("enabled",true);
      if(!error)rows=data||[];
    }catch{}
    try{
      const {data,error}=await c.sb.from("lp_staking_candidates").select("*").eq("chain_key",chain).eq("status","verified");
      if(!error)rows=rows.concat((data||[]).map(r=>({
        project_key:r.project_key||"generic_lp",chain_key:r.chain_key,
        contract_address:r.contract_address,pair_address:r.pair_address,
        label:r.label||"Verifiziertes LP-Staking",role:"staking",enabled:true,classify_transfers:true,
        _genericRegistry:true
      })));
    }catch{}
    const seen=new Set();rows=rows.filter(r=>{const k=`${norm(r.contract_address)}|${norm(r.pair_address||"")}`;if(seen.has(k))return false;seen.add(k);return true;});
    allCatalogCache.set(key,rows);return rows;
  }

  async function contractInfo(projectKey,chain,address){
    if(!address)return null;
    const rows=await loadCatalog(projectKey,chain);
    return rows.find(r=>norm(r.contract_address)===norm(address))||null;
  }

  async function classifyTransferAny(chain,direction,counterparty,pairAddress=null){
    const fallback=direction==="out"?"send":"receive";
    const rows=await loadCatalogAll(chain);
    const info=rows.find(r=>norm(r.contract_address)===norm(counterparty) && (!r.pair_address||!pairAddress||norm(r.pair_address)===norm(pairAddress)))||null;
    if(!info||!info.classify_transfers)return {eventType:fallback,staking:null};
    return {eventType:direction==="out"?"stake":"unstake",staking:info};
  }

  async function classifyTransfer(projectKey,chain,direction,counterparty,pairAddress=null){
    const fallback=direction==="out"?"send":"receive";
    // Projektübergreifend: Ein Transfer gilt ausschließlich dann als Stake/Unstake,
    // wenn die Gegenadresse im verifizierten Staking-Contract-Katalog des jeweiligen
    // Projekts/der Chain steht und classify_transfers=true gesetzt ist.
    const info=await contractInfo(projectKey,chain,counterparty);
    if(!info||!info.classify_transfers)return {eventType:fallback,staking:null};
    if(info.pair_address&&pairAddress&&norm(info.pair_address)!==norm(pairAddress))return {eventType:fallback,staking:null};
    return {eventType:direction==="out"?"stake":"unstake",staking:info};
  }

  function stakeBalanceAt(events,pairAddress,cutoff=null){
    const pair=norm(pairAddress);let staked=0;
    const cutBlock=(cutoff&&typeof cutoff==="object"&&Number.isFinite(Number(cutoff.block)))?Number(cutoff.block):null;
    const cutRaw=(cutoff&&typeof cutoff==="object")?(cutoff.time??cutoff.date??null):cutoff;
    const cutTime=cutRaw?new Date(cutRaw).getTime():null;
    for(const e of [...(events||[])].sort((a,b)=>Number(a.block_number||0)-Number(b.block_number||0)||Number(a.log_index||0)-Number(b.log_index||0))){
      if(norm(e.pair_address)!==pair)continue;
      // Der historische Stichtagsblock ist die stärkere Evidenz als ein optionaler Zeitstempel.
      // So kann ein späterer Stake/Unstake ohne tx_timestamp nie in einen früheren 31.12. hineinfallen.
      if(cutBlock!=null&&Number(e.block_number||0)>cutBlock)continue;
      if(cutBlock==null&&Number.isFinite(cutTime)&&e.tx_timestamp&&new Date(e.tx_timestamp).getTime()>cutTime)continue;
      const amount=Math.abs(Number(e.lp_delta||0));
      if(e.event_type==="stake")staked+=amount;
      else if(e.event_type==="unstake")staked-=amount;
    }
    return Math.max(0,staked);
  }

  function buildLots(events,pairAddress=null,cutoff=null){
    const cut=cutoff?new Date(cutoff).getTime():null,queues=new Map(),lots=[];
    const rows=[...(events||[])]
      .filter(e=>["stake","unstake"].includes(e.event_type))
      .filter(e=>!pairAddress||norm(e.pair_address)===norm(pairAddress))
      .filter(e=>!cut||!e.tx_timestamp||new Date(e.tx_timestamp).getTime()<=cut)
      .sort((a,b)=>Number(a.block_number||0)-Number(b.block_number||0)||Number(a.log_index||0)-Number(b.log_index||0));
    for(const e of rows){
      const key=`${norm(e.wallet_address)}|${norm(e.pair_address)}|${norm(e.staking_contract||e.counterparty)}`;
      if(!queues.has(key))queues.set(key,[]);const q=queues.get(key);
      if(e.event_type==="stake"){
        const amount=Math.abs(Number(e.lp_delta||0));
        const lot={wallet_address:norm(e.wallet_address),pair_address:norm(e.pair_address),staking_contract:norm(e.staking_contract||e.counterparty),staking_label:e.staking_label||null,stake_tx_hash:e.tx_hash,stake_timestamp:e.tx_timestamp,original_lp:amount,remaining_lp:amount,amount0:Number(e.amount0||0),amount1:Number(e.amount1||0),value_usd:e.value_usd==null?null:Number(e.value_usd),status:"open"};
        lots.push(lot);q.push(lot);
      }else{
        let left=Math.abs(Number(e.lp_delta||0));
        while(left>1e-12&&q.length){const lot=q[0],used=Math.min(left,lot.remaining_lp);lot.remaining_lp-=used;left-=used;if(lot.remaining_lp<=1e-12){lot.remaining_lp=0;lot.status="closed";q.shift();}else lot.status="partial";}
      }
    }
    return lots;
  }

  function displayName(event,pairLabel="LP"){
    return event?.staking_label||event?.stakingLabel||`Staking – ${String(pairLabel||"LP").replace(/^PancakeSwap\s*(V2)?\s*/i,"").replace(/\s*LP$/i,"")}`;
  }

  function clearCache(){catalogCache.clear();allCatalogCache.clear();}
  function configure(fn){ctx=fn||ctx;clearCache();}
  return {configure,clearCache,loadCatalog,loadCatalogAll,contractInfo,classifyTransfer,classifyTransferAny,stakeBalanceAt,buildLots,displayName};
})();
