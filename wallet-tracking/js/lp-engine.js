window.WalletLPEngine = (() => {
  const V2 = new ethers.Interface([
    "function token0() view returns(address)","function token1() view returns(address)",
    "function getReserves() view returns(uint112,uint112,uint32)","function totalSupply() view returns(uint256)",
    "function balanceOf(address) view returns(uint256)","function decimals() view returns(uint8)","function factory() view returns(address)"
  ]);
  const ERC20 = new ethers.Interface(["function symbol() view returns(string)","function name() view returns(string)","function decimals() view returns(uint8)"]);
  const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)").toLowerCase();
  let ctx=()=>({}); const pairCache=new Map(), metaCache=new Map(), blockCache=new Map();
  const norm=x=>String(x||"").toLowerCase();
  const hex=n=>"0x"+Number(n).toString(16);
  const addrTopic=a=>"0x"+norm(a).replace(/^0x/,"").padStart(64,"0");
  const topicAddr=t=>"0x"+String(t||"").replace(/^0x/,"").slice(-40).toLowerCase();
  const rawValue=d=>BigInt(d&&d!=="0x"?d:"0x0");

  async function rpc(chain,method,params=[]){
    const c=ctx();
    // Bevorzugt den zentralen RPC-Resolver der Hauptanwendung. Der ergänzt z. B. bei
    // Alchemy den Frontend-Key, nutzt Retry/Throttling und den rpc_url-Fallback korrekt.
    if(typeof c.rpc==="function")return c.rpc(chain,method,params);
    const url=c.chainConfig?.[chain]?.archiveRpcUrl||c.chainConfig?.[chain]?.rpcUrl;
    if(!url)throw new Error(`${chain}: RPC fehlt`);
    let r;try{r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:Date.now(),method,params})});}
    catch(e){throw new Error(`${chain}: RPC Netzwerkfehler bei ${method} (${e?.message||e||"Failed to fetch"})`);}
    if(!r.ok)throw new Error(`${chain}: RPC HTTP ${r.status} bei ${method}`);
    const j=await r.json();if(j.error)throw new Error(`${chain}: ${method}: ${j.error.message||"RPC Fehler"}`);return j.result;
  }
  async function call(chain,to,data,block="latest"){return rpc(chain,"eth_call",[{to,data},block==="latest"?"latest":hex(block)]);}
  async function meta(chain,address){
    const k=chain+"|"+norm(address);if(metaCache.has(k))return metaCache.get(k);
    const c=ctx(),pk=k;let m={address:norm(address),symbol:c.predefinedTokenSymbols?.[pk]||null,name:c.predefinedTokenNames?.[pk]||null,decimals:c.predefinedTokenDecimals?.[pk]};
    try{if(!m.symbol)m.symbol=ERC20.decodeFunctionResult("symbol",await call(chain,address,ERC20.encodeFunctionData("symbol",[])))[0];}catch{}
    try{if(!Number.isFinite(Number(m.decimals)))m.decimals=Number(ERC20.decodeFunctionResult("decimals",await call(chain,address,ERC20.encodeFunctionData("decimals",[])))[0]);}catch{}
    m.decimals=Number.isFinite(Number(m.decimals))?Number(m.decimals):18;m.symbol=m.symbol||address.slice(0,8)+"…";metaCache.set(k,m);return m;
  }
  async function pairInfo(chain,address,block="latest"){
    const key=chain+"|"+norm(address)+"@"+block;if(pairCache.has(key))return pairCache.get(key);
    try{
      const [t0r,t1r,rr,tsr,dr,fr]=await Promise.all([
        call(chain,address,V2.encodeFunctionData("token0",[]),block),call(chain,address,V2.encodeFunctionData("token1",[]),block),
        call(chain,address,V2.encodeFunctionData("getReserves",[]),block),call(chain,address,V2.encodeFunctionData("totalSupply",[]),block),
        call(chain,address,V2.encodeFunctionData("decimals",[]),block),call(chain,address,V2.encodeFunctionData("factory",[]),block)
      ]);
      const [t0]=V2.decodeFunctionResult("token0",t0r),[t1]=V2.decodeFunctionResult("token1",t1r),[r0,r1]=V2.decodeFunctionResult("getReserves",rr),[supply]=V2.decodeFunctionResult("totalSupply",tsr),[dec]=V2.decodeFunctionResult("decimals",dr),[factory]=V2.decodeFunctionResult("factory",fr);
      if(!t0||!t1||norm(t0)===norm(t1))return null;
      const [m0,m1]=await Promise.all([meta(chain,t0),meta(chain,t1)]);
      const out={chain,address:norm(address),factory:norm(factory),decimals:Number(dec),total:Number(ethers.formatUnits(supply,Number(dec))),t0:m0,t1:m1,r0:Number(ethers.formatUnits(r0,m0.decimals)),r1:Number(ethers.formatUnits(r1,m1.decimals))};
      pairCache.set(key,out);return out;
    }catch{return null;}
  }
  function label(chain){return chain==="bsc"?"PCLP":chain==="apertum"?"DAO1-LP":"LP";}
  async function balance(chain,pair,wallet,block="latest"){const raw=await call(chain,pair.address,V2.encodeFunctionData("balanceOf",[wallet]),block);const [b]=V2.decodeFunctionResult("balanceOf",raw);return Number(ethers.formatUnits(b,pair.decimals));}
  async function valuePosition(chain,pair,bal,block="latest",dateStr=null){
    const share=pair.total>0?bal/pair.total:0,a0=pair.r0*share,a1=pair.r1*share,c=ctx();let p0=null,p1=null;
    if(block!=="latest"&&dateStr&&c.historicalPrice){p0=await c.historicalPrice(chain,{address:pair.t0.address,symbol:pair.t0.symbol,decimals:pair.t0.decimals},dateStr,block).catch(()=>null);p1=await c.historicalPrice(chain,{address:pair.t1.address,symbol:pair.t1.symbol,decimals:pair.t1.decimals},dateStr,block).catch(()=>null);}
    else if(c.currentPrice){const x0=c.currentPrice(chain,pair.t0.address),x1=c.currentPrice(chain,pair.t1.address);p0=x0==null?null:(typeof x0==="number"?{price:x0}:x0);p1=x1==null?null:(typeof x1==="number"?{price:x1}:x1);}
    const usd=(p0?.price!=null&&p1?.price!=null)?a0*p0.price+a1*p1.price:null;return {balance:bal,share,amount0:a0,amount1:a1,price0:p0?.price??null,price1:p1?.price??null,usd};
  }
  async function positions(chain,wallet,candidates,block="latest",dateStr=null){const out=[];for(const a of [...new Set((candidates||[]).map(norm))]){const p=await pairInfo(chain,a,block);if(!p)continue;const b=await balance(chain,p,wallet,block).catch(()=>0);if(!(b>0))continue;out.push({...p,...await valuePosition(chain,p,b,block,dateStr),lpLabel:label(chain)});}return out;}

  async function blockTimestamp(chain,blockNumber){
    const k=chain+"|"+blockNumber;if(blockCache.has(k))return blockCache.get(k);
    const b=await rpc(chain,"eth_getBlockByNumber",[hex(blockNumber),false]);
    const ts=b?.timestamp?Number(BigInt(b.timestamp)):null;blockCache.set(k,ts);return ts;
  }
  async function historyEventFromReceipt(chain,pair,wallet,txHash,blockNumber){
    const receipt=await rpc(chain,"eth_getTransactionReceipt",[txHash]);if(!receipt)return null;
    const wa=norm(wallet),pa=norm(pair.address),t0=norm(pair.t0.address),t1=norm(pair.t1.address);
    let lpIn=0n,lpOut=0n,in0=0n,in1=0n,out0=0n,out1=0n,firstLog=Number.MAX_SAFE_INTEGER;
    for(const l of receipt.logs||[]){
      if(norm(l.topics?.[0])!==TRANSFER_TOPIC||!l.topics?.[1]||!l.topics?.[2])continue;
      const ca=norm(l.address),from=topicAddr(l.topics[1]),to=topicAddr(l.topics[2]),v=rawValue(l.data),li=Number(l.logIndex?BigInt(l.logIndex):0n);firstLog=Math.min(firstLog,li);
      if(ca===pa){if(to===wa)lpIn+=v;if(from===wa)lpOut+=v;continue;}
      if(ca===t0){if(to===pa)in0+=v;if(from===pa)out0+=v;}
      if(ca===t1){if(to===pa)in1+=v;if(from===pa)out1+=v;}
    }
    const lpDeltaRaw=lpIn-lpOut;let eventType=null,a0=0n,a1=0n;
    if(lpDeltaRaw>0n&&(in0>0n||in1>0n)){eventType="add";a0=in0;a1=in1;}
    else if(lpDeltaRaw<0n&&(out0>0n||out1>0n)){eventType="remove";a0=out0;a1=out1;}
    else return null; // normaler LP-Transfer, kein Add/Remove Liquidity
    const ts=await blockTimestamp(chain,blockNumber).catch(()=>null),dateStr=ts?new Date(ts*1000).toISOString().slice(0,10):null,c=ctx();
    let p0=null,p1=null;
    if(c.historicalPrice&&dateStr){
      p0=await c.historicalPrice(chain,{address:pair.t0.address,symbol:pair.t0.symbol,decimals:pair.t0.decimals},dateStr,blockNumber).catch(()=>null);
      p1=await c.historicalPrice(chain,{address:pair.t1.address,symbol:pair.t1.symbol,decimals:pair.t1.decimals},dateStr,blockNumber).catch(()=>null);
    }
    const amount0=Number(ethers.formatUnits(a0,pair.t0.decimals)),amount1=Number(ethers.formatUnits(a1,pair.t1.decimals));
    const valueUsd=(p0?.price!=null&&p1?.price!=null)?amount0*p0.price+amount1*p1.price:null;
    return {tx_hash:txHash,block_number:blockNumber,tx_timestamp:ts?new Date(ts*1000).toISOString():null,event_type:eventType,log_index:Number.isFinite(firstLog)?firstLog:0,lp_delta:Number(ethers.formatUnits(lpDeltaRaw<0n?-lpDeltaRaw:lpDeltaRaw,pair.decimals))*(eventType==="remove"?-1:1),amount0,amount1,price0_usd:p0?.price??null,price1_usd:p1?.price??null,value_usd:valueUsd,price_source:[p0?.source,p1?.source].filter(Boolean).join(" + ")||null};
  }

  async function loadHistory(projectKey,chain,wallet){
    const c=ctx();if(!c.sb||!c.currentUser?.id)return [];
    const out=[];let from=0;
    while(true){
      const {data,error}=await c.sb.from("lp_history_events").select("*").eq("project_key",projectKey).eq("chain_key",chain).ilike("wallet_address",norm(wallet)).order("block_number",{ascending:true}).order("log_index",{ascending:true}).range(from,from+999);
      if(error)throw error;out.push(...(data||[]));if(!data||data.length<1000)break;from+=1000;
    }
    return out;
  }
  async function saveHistory(projectKey,chain,wallet,pair,event){
    const c=ctx();if(!c.sb||!c.currentUser?.id)return;
    const row={user_id:c.currentUser.id,project_key:projectKey,chain_key:chain,wallet_address:norm(wallet),pair_address:norm(pair.address),lp_label:label(chain),token0_address:norm(pair.t0.address),token0_symbol:String(pair.t0.symbol||""),token0_decimals:pair.t0.decimals,token1_address:norm(pair.t1.address),token1_symbol:String(pair.t1.symbol||""),token1_decimals:pair.t1.decimals,...event,updated_at:new Date().toISOString()};
    const {error}=await c.sb.from("lp_history_events").upsert(row,{onConflict:"user_id,project_key,chain_key,wallet_address,pair_address,tx_hash,event_type"});if(error)throw error;
  }
  async function getScanState(projectKey,chain,wallet,scanType="lp_history_v2"){
    const c=ctx();if(!c.sb||!c.currentUser?.id)return 0;
    const {data,error}=await c.sb.from("project_scan_state").select("last_scanned_block").eq("project_key",projectKey).eq("chain_key",chain).ilike("wallet_address",norm(wallet)).eq("scan_type",scanType).maybeSingle();
    if(error)throw error;return Number(data?.last_scanned_block||0);
  }
  async function setScanState(projectKey,chain,wallet,lastBlock,scanType="lp_history_v2"){
    const c=ctx();if(!c.sb||!c.currentUser?.id)return;
    const now=new Date().toISOString(),row={user_id:c.currentUser.id,project_key:projectKey,chain_key:chain,wallet_address:norm(wallet),scan_type:scanType,last_scanned_block:Number(lastBlock||0),last_scanned_at:now,updated_at:now};
    const {error}=await c.sb.from("project_scan_state").upsert(row,{onConflict:"user_id,project_key,chain_key,wallet_address,scan_type"});if(error)throw error;
  }
  async function latestBlock(chain){return Number(BigInt(await rpc(chain,"eth_blockNumber",[])));}
  function configure(fn){ctx=fn||ctx;}
  return {configure,pairInfo,positions,label,meta,rpc,latestBlock,historyEventFromReceipt,loadHistory,saveHistory,getScanState,setScanState};
})();
