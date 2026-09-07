window.WalletPriceEngine = (() => {
  const V2 = new ethers.Interface([
    "function token0() view returns(address)",
    "function token1() view returns(address)",
    "function getReserves() view returns(uint112,uint112,uint32)",
    "function totalSupply() view returns(uint256)",
    "function decimals() view returns(uint8)",
    "function factory() view returns(address)"
  ]);
  const ERC20 = new ethers.Interface([
    "function symbol() view returns(string)",
    "function name() view returns(string)",
    "function decimals() view returns(uint8)"
  ]);

  let ctx = () => ({});
  const pairStateCache = new Map();
  const tokenMetaCache = new Map();
  const tokenPriceCache = new Map();
  const priceGraphCache = new Map();

  const norm = x => String(x || "").trim().toLowerCase();
  const same = (a,b) => !!a && !!b && norm(a) === norm(b);
  const blockKey = block => block === "latest" || block == null ? "latest" : String(Number(block));

  async function call(chain,to,data,block="latest"){
    const c = ctx();
    if(typeof c.call === "function") return await c.call(chain,to,data,block);

    const provider = typeof c.provider === "function" ? c.provider(chain) : null;
    if(!provider) throw new Error(`${chain}: WalletPriceEngine RPC-Provider fehlt.`);
    return await provider.call({to,data}, block === "latest" ? undefined : Number(block));
  }

  async function tokenMeta(chain,address){
    const key = `${chain}|${norm(address)}`;
    if(tokenMetaCache.has(key)) return tokenMetaCache.get(key);

    const c = ctx();
    if(typeof c.tokenMeta === "function"){
      const external = await c.tokenMeta(chain,address);
      if(external){ tokenMetaCache.set(key,external); return external; }
    }

    let symbol = null, name = null, decimals = 18;
    try{
      const raw = await call(chain,address,ERC20.encodeFunctionData("symbol",[]));
      [symbol] = ERC20.decodeFunctionResult("symbol",raw);
    }catch{}
    try{
      const raw = await call(chain,address,ERC20.encodeFunctionData("name",[]));
      [name] = ERC20.decodeFunctionResult("name",raw);
    }catch{}
    try{
      const raw = await call(chain,address,ERC20.encodeFunctionData("decimals",[]));
      [decimals] = ERC20.decodeFunctionResult("decimals",raw);
    }catch{}

    const fallback = String(address).slice(0,8) + "…";
    const out = {
      address,
      symbol:String(symbol || name || fallback),
      name:String(name || symbol || fallback),
      decimals:Number.isFinite(Number(decimals)) ? Number(decimals) : 18
    };
    tokenMetaCache.set(key,out);
    return out;
  }

  async function getPairState(chain,address,block="latest"){
    const key = `${chain}|${norm(address)}@${blockKey(block)}`;
    if(pairStateCache.has(key)) return pairStateCache.get(key);

    const promise = (async()=>{
      const calls = [
        ["token0",[]], ["token1",[]], ["getReserves",[]],
        ["totalSupply",[]], ["decimals",[]], ["factory",[]]
      ];
      const raw = await Promise.all(calls.map(([fn,args]) => call(chain,address,V2.encodeFunctionData(fn,args),block)));
      const [token0] = V2.decodeFunctionResult("token0",raw[0]);
      const [token1] = V2.decodeFunctionResult("token1",raw[1]);
      const [r0Raw,r1Raw,blockTimestampLast] = V2.decodeFunctionResult("getReserves",raw[2]);
      const [totalSupplyRaw] = V2.decodeFunctionResult("totalSupply",raw[3]);
      const [lpDecimalsRaw] = V2.decodeFunctionResult("decimals",raw[4]);
      const [factory] = V2.decodeFunctionResult("factory",raw[5]);

      if(!token0 || !token1 || norm(token0) === norm(token1)) throw new Error(`${chain}: ${address} liefert ungültige token0/token1-Adressen.`);

      const [t0,t1] = await Promise.all([tokenMeta(chain,token0),tokenMeta(chain,token1)]);
      const lpDecimals = Number(lpDecimalsRaw);
      const reserve0 = Number(ethers.formatUnits(r0Raw,t0.decimals));
      const reserve1 = Number(ethers.formatUnits(r1Raw,t1.decimals));
      const totalSupply = Number(ethers.formatUnits(totalSupplyRaw,lpDecimals));

      return {
        chain,
        address:norm(address),
        block:block === "latest" ? "latest" : Number(block),
        factory:norm(factory),
        token0:t0,
        token1:t1,
        reserve0,
        reserve1,
        totalSupply,
        lpDecimals,
        blockTimestampLast:Number(blockTimestampLast)
      };
    })();

    pairStateCache.set(key,promise);
    try{
      const out = await promise;
      pairStateCache.set(key,out);
      return out;
    }catch(e){
      pairStateCache.delete(key);
      throw e;
    }
  }

  async function getV2Price(chain,pairAddress,baseToken,block="latest"){
    const p = await getPairState(chain,pairAddress,block);
    if(!(p.reserve0 > 0) || !(p.reserve1 > 0)) return null;
    if(norm(baseToken) === norm(p.token0.address)) return {price:p.reserve1/p.reserve0,quote:p.token1.address,pairState:p};
    if(norm(baseToken) === norm(p.token1.address)) return {price:p.reserve0/p.reserve1,quote:p.token0.address,pairState:p};
    return null;
  }

  function getReferences(chain){
    const c = ctx();
    const r = typeof c.references === "function" ? c.references(chain) : c.references?.[chain];
    return r || {};
  }

  function stableReference(chain,address){
    const ref = getReferences(chain);
    if(same(address,ref.usdt)) return {price:1,route:"USDT",stable:"USDT",hops:0,pathLiquidityUSD:Infinity,source:"stable-self"};
    if(same(address,ref.usdc)) return {price:1,route:"USDC",stable:"USDC",hops:0,pathLiquidityUSD:Infinity,source:"stable-self"};
    if(chain === "bsc" && same(address,ref.busd)) return {price:1,route:"BUSD",stable:"BUSD",hops:0,pathLiquidityUSD:Infinity,source:"stable-self"};
    return null;
  }

  async function findPair(chain,tokenA,tokenB){
    const c = ctx();
    if(typeof c.findPair !== "function") throw new Error("WalletPriceEngine: findPair-Adapter fehlt.");
    return await c.findPair(chain,tokenA,tokenB);
  }

  function tokenCategory(chain,address){
    const c = ctx();
    return String(typeof c.tokenCategory === "function" ? c.tokenCategory(chain,address) || "" : "").trim().toLowerCase();
  }

  function strictCoreSymbol(symbol){
    return ["BTCB","WBNB","WETH","BNB","ETH"].includes(String(symbol || "").trim().toUpperCase());
  }

  async function directV2StableMarkets(chain,tokenAddress,block="latest"){
    const ref = getReferences(chain);
    const candidates = [
      {name:"USDT",address:ref.usdt,priority:0},
      {name:"USDC",address:ref.usdc,priority:1},
      ...(chain === "bsc" ? [{name:"BUSD",address:ref.busd,priority:2}] : [])
    ].filter(x => x.address);
    const results = [];
    const token = await tokenMeta(chain,tokenAddress);

    for(const stable of candidates){
      try{
        const pairAddress = await findPair(chain,tokenAddress,stable.address);
        if(!pairAddress) continue;
        const pair = await getPairState(chain,pairAddress,block);
        let tokenReserve = null, stableReserve = null, price = null;
        if(same(pair.token0.address,tokenAddress)){
          tokenReserve = pair.reserve0; stableReserve = pair.reserve1; price = pair.reserve1/pair.reserve0;
        }else if(same(pair.token1.address,tokenAddress)){
          tokenReserve = pair.reserve1; stableReserve = pair.reserve0; price = pair.reserve0/pair.reserve1;
        }
        if(!Number.isFinite(price) || price <= 0) continue;
        results.push({
          price,
          route:`${token.symbol} → ${stable.name}`,
          stable:stable.name,
          stablePriority:stable.priority,
          hops:1,
          pathLiquidityUSD:tokenReserve*price + stableReserve,
          source:"direct-v2",
          pool:pairAddress
        });
      }catch(e){
        console.warn("WalletPriceEngine: direkter V2-Stablemarkt fehlgeschlagen",chain,tokenAddress,stable.name,e);
      }
    }
    return results;
  }

  async function directV3StableMarkets(chain,tokenAddress,block="latest"){
    if(block !== "latest" || chain !== "eth") return [];
    const c = ctx();
    if(typeof c.listPools !== "function" || typeof c.poolType !== "function" || typeof c.readV3Pool !== "function") return [];
    const ref = getReferences(chain);
    const candidates = [
      {name:"USDT",address:ref.usdt,priority:0},
      {name:"USDC",address:ref.usdc,priority:1}
    ].filter(x => x.address);
    const results = [];
    const token = await tokenMeta(chain,tokenAddress);

    for(const dbPool of (c.listPools(chain) || [])){
      try{
        if(await c.poolType(chain,dbPool.address) !== "v3") continue;
        const pool = await c.readV3Pool(chain,dbPool.address);
        for(const stable of candidates){
          if(same(pool.token0.address,tokenAddress) && same(pool.token1.address,stable.address)){
            results.push({price:pool.price0,route:`${token.symbol} → ${stable.name} (Uniswap V3)`,stable:stable.name,stablePriority:stable.priority,hops:1,pathLiquidityUSD:null,source:"direct-v3",pool:dbPool.address});
          }
          if(same(pool.token1.address,tokenAddress) && same(pool.token0.address,stable.address)){
            results.push({price:pool.price1,route:`${token.symbol} → ${stable.name} (Uniswap V3)`,stable:stable.name,stablePriority:stable.priority,hops:1,pathLiquidityUSD:null,source:"direct-v3",pool:dbPool.address});
          }
        }
      }catch(e){
        console.warn("WalletPriceEngine: V3-Stablemarkt fehlgeschlagen",dbPool?.address,e);
      }
    }
    return results;
  }

  async function directUSDTFallback(chain,token,block="latest"){
    const usdt = getReferences(chain).usdt;
    if(!usdt) return null;
    try{
      const pairAddress = await findPair(chain,token.address,usdt);
      if(!pairAddress) return null;
      const pair = await getPairState(chain,pairAddress,block);
      let price = null, tokenReserve = null, usdtReserve = null;
      if(same(pair.token0.address,token.address)){
        price = pair.reserve1/pair.reserve0; tokenReserve = pair.reserve0; usdtReserve = pair.reserve1;
      }else if(same(pair.token1.address,token.address)){
        price = pair.reserve0/pair.reserve1; tokenReserve = pair.reserve1; usdtReserve = pair.reserve0;
      }
      if(!Number.isFinite(price) || price <= 0) return null;
      return {price,route:`${token.symbol} → USDT (direkter V2-Fallback)`,stable:"USDT",hops:1,pathLiquidityUSD:tokenReserve*price+usdtReserve,source:"direct-usdt-fallback",pool:pairAddress};
    }catch(e){
      console.warn("WalletPriceEngine: direkter USDT-Fallback fehlgeschlagen",chain,token.symbol,token.address,e);
      return null;
    }
  }

  async function vCurrencyUSDPrice(chain,token,block="latest"){
    const ref = getReferences(chain);
    const vow = ref.vow, usdt = ref.usdt;
    if(!vow || !usdt) return null;
    try{
      const vToVowPair = await findPair(chain,token.address,vow);
      if(!vToVowPair) return null;
      const vToVow = await getV2Price(chain,vToVowPair,token.address,block);
      if(!vToVow) return null;
      const vowToUsdtPair = await findPair(chain,vow,usdt);
      if(!vowToUsdtPair) return null;
      const vowToUsdt = await getV2Price(chain,vowToUsdtPair,vow,block);
      if(!vowToUsdt) return null;

      const tokenUsd = vToVow.price*vowToUsdt.price;
      const vPool = vToVow.pairState || await getPairState(chain,vToVowPair,block);
      const vowPool = vowToUsdt.pairState || await getPairState(chain,vowToUsdtPair,block);
      const vPoolTVL = same(vPool.token0.address,token.address)
        ? vPool.reserve0*tokenUsd + vPool.reserve1*vowToUsdt.price
        : vPool.reserve1*tokenUsd + vPool.reserve0*vowToUsdt.price;
      const vowPoolTVL = same(vowPool.token0.address,vow)
        ? vowPool.reserve0*vowToUsdt.price + vowPool.reserve1
        : vowPool.reserve1*vowToUsdt.price + vowPool.reserve0;
      const pathLiquidityUSD = Number.isFinite(vPoolTVL) && Number.isFinite(vowPoolTVL) ? Math.min(vPoolTVL,vowPoolTVL) : null;
      return {price:tokenUsd,route:`${token.symbol} → VOW → USDT`,stable:"USDT",hops:2,pathLiquidityUSD,source:"v-currency-direct-vow-usdt",pools:[vToVowPair,vowToUsdtPair]};
    }catch(e){
      console.warn("WalletPriceEngine: v_currency-Preisroute fehlgeschlagen",chain,token.symbol,token.address,e);
      return null;
    }
  }

  async function projectTokenUSDPrice(chain,token,block="latest"){
    const ref = getReferences(chain);
    const vow = ref.vow, usdt = ref.usdt;
    if(!usdt) return null;
    if(vow && same(token.address,vow)) return await directUSDTFallback(chain,token,block);

    if(vow){
      try{
        const tokenVowPair = await findPair(chain,token.address,vow);
        if(tokenVowPair){
          const tokenToVow = await getV2Price(chain,tokenVowPair,token.address,block);
          if(tokenToVow){
            const vowUsdtPair = await findPair(chain,vow,usdt);
            if(vowUsdtPair){
              const vowToUsdt = await getV2Price(chain,vowUsdtPair,vow,block);
              if(vowToUsdt){
                const tokenUsd = tokenToVow.price*vowToUsdt.price;
                let pathLiquidityUSD = null;
                try{
                  const tokenVowPool = tokenToVow.pairState || await getPairState(chain,tokenVowPair,block);
                  const vowUsdtPool = vowToUsdt.pairState || await getPairState(chain,vowUsdtPair,block);
                  const tokenVowTVL = same(tokenVowPool.token0.address,token.address)
                    ? tokenVowPool.reserve0*tokenUsd + tokenVowPool.reserve1*vowToUsdt.price
                    : tokenVowPool.reserve1*tokenUsd + tokenVowPool.reserve0*vowToUsdt.price;
                  const vowUsdtTVL = same(vowUsdtPool.token0.address,vow)
                    ? vowUsdtPool.reserve0*vowToUsdt.price + vowUsdtPool.reserve1
                    : vowUsdtPool.reserve1*vowToUsdt.price + vowUsdtPool.reserve0;
                  if(Number.isFinite(tokenVowTVL) && Number.isFinite(vowUsdtTVL)) pathLiquidityUSD = Math.min(tokenVowTVL,vowUsdtTVL);
                }catch(e){
                  console.warn("WalletPriceEngine: Pfad-Liquidität für Projekt-Token fehlgeschlagen",token.symbol,e);
                }
                return {price:tokenUsd,route:`${token.symbol} → VOW → USDT`,stable:"USDT",hops:2,pathLiquidityUSD,source:"tln-vow-token-via-vow",pools:[tokenVowPair,vowUsdtPair]};
              }
            }
          }
        }
      }catch(e){
        console.warn("WalletPriceEngine: TOKEN/VOW-Route fehlgeschlagen",chain,token.symbol,token.address,e);
      }
    }
    return await directUSDTFallback(chain,token,block);
  }

  async function strictDirectUSDPrice(chain,token,block="latest"){
    const self = stableReference(chain,token.address);
    if(self) return self;
    const [v2,v3] = await Promise.all([
      directV2StableMarkets(chain,token.address,block),
      directV3StableMarkets(chain,token.address,block)
    ]);
    const all = [...v2,...v3];
    if(!all.length) return null;
    all.sort((a,b)=>{
      const am = Number.isFinite(a.pathLiquidityUSD), bm = Number.isFinite(b.pathLiquidityUSD);
      if(am && bm && a.pathLiquidityUSD !== b.pathLiquidityUSD) return b.pathLiquidityUSD-a.pathLiquidityUSD;
      if(am !== bm) return am ? -1 : 1;
      return (a.stablePriority ?? 99)-(b.stablePriority ?? 99);
    });
    return all[0];
  }

  async function buildPriceGraph(chain,block="latest"){
    const c = ctx();
    if(typeof c.listPools !== "function" || typeof c.poolType !== "function") return [];
    const key = `${chain}@${blockKey(block)}`;
    if(priceGraphCache.has(key)) return priceGraphCache.get(key);
    const promise = (async()=>{
      const edges = [];
      for(const dbPool of (c.listPools(chain) || [])){
        try{
          const type = await c.poolType(chain,dbPool.address);
          if(type === "v2"){
            const p = await getPairState(chain,dbPool.address,block);
            if(p.reserve0 > 0 && p.reserve1 > 0){
              edges.push({type:"v2",from:p.token0.address,to:p.token1.address,rate:p.reserve1/p.reserve0,fromSymbol:p.token0.symbol,toSymbol:p.token1.symbol,pool:dbPool.address,reserveFrom:p.reserve0,reserveTo:p.reserve1});
              edges.push({type:"v2",from:p.token1.address,to:p.token0.address,rate:p.reserve0/p.reserve1,fromSymbol:p.token1.symbol,toSymbol:p.token0.symbol,pool:dbPool.address,reserveFrom:p.reserve1,reserveTo:p.reserve0});
            }
          }else if(type === "v3" && block === "latest" && typeof c.readV3Pool === "function"){
            const p = await c.readV3Pool(chain,dbPool.address);
            if(Number.isFinite(p.price0) && p.price0 > 0){
              edges.push({type:"v3",from:p.token0.address,to:p.token1.address,rate:p.price0,fromSymbol:p.token0.symbol,toSymbol:p.token1.symbol,pool:dbPool.address,reserveFrom:null,reserveTo:null});
              edges.push({type:"v3",from:p.token1.address,to:p.token0.address,rate:p.price1,fromSymbol:p.token1.symbol,toSymbol:p.token0.symbol,pool:dbPool.address,reserveFrom:null,reserveTo:null});
            }
          }
        }catch(e){
          console.warn("WalletPriceEngine: Preisgraph-Pool nicht lesbar",dbPool?.address,e);
        }
      }
      return edges;
    })();
    priceGraphCache.set(key,promise);
    try{
      const out = await promise;
      priceGraphCache.set(key,out);
      return out;
    }catch(e){ priceGraphCache.delete(key); throw e; }
  }

  function scorePathLiquidity(path){
    if(!path.edges.length){ path.pathLiquidityUSD = Infinity; return path; }
    let usdTo=1, bottleneck=Infinity, measurable=0;
    for(let i=path.edges.length-1;i>=0;i--){
      const edge=path.edges[i], usdFrom=edge.rate*usdTo;
      if(edge.type === "v2" && Number.isFinite(edge.reserveFrom) && Number.isFinite(edge.reserveTo)){
        const tvl=edge.reserveFrom*usdFrom + edge.reserveTo*usdTo;
        if(Number.isFinite(tvl) && tvl>0){ bottleneck=Math.min(bottleneck,tvl); measurable++; }
      }
      usdTo=usdFrom;
    }
    path.pathLiquidityUSD=measurable>0?bottleneck:null;
    return path;
  }

  async function graphUSDPrice(chain,tokenAddress,maxHops=4,block="latest"){
    const self=stableReference(chain,tokenAddress);
    if(self) return self;
    const edges=await buildPriceGraph(chain,block);
    const ref=getReferences(chain);
    const stablePriority=[{name:"USDT",address:ref.usdt,priority:0},{name:"USDC",address:ref.usdc,priority:1},...(chain==="bsc"?[{name:"BUSD",address:ref.busd,priority:2}]:[])].filter(x=>x.address);
    const stableMap=new Map(stablePriority.map(x=>[norm(x.address),x]));
    const token=await tokenMeta(chain,tokenAddress);
    const paths=[];
    const maxPaths=80;
    async function dfs(current,multiplier,symbols,pathEdges,visited){
      if(paths.length>=maxPaths || pathEdges.length>=maxHops) return;
      for(const edge of edges.filter(e=>same(e.from,current))){
        const nk=norm(edge.to); if(visited.has(nk)) continue;
        const nextMultiplier=multiplier*edge.rate;
        const nextSymbols=[...symbols,edge.toSymbol];
        const nextEdges=[...pathEdges,edge];
        const stable=stableMap.get(nk);
        if(stable){ paths.push({price:nextMultiplier,route:nextSymbols.join(" → "),stable:stable.name,stablePriority:stable.priority,hops:nextEdges.length,edges:nextEdges,pathLiquidityUSD:null}); continue; }
        const nv=new Set(visited); nv.add(nk);
        await dfs(edge.to,nextMultiplier,nextSymbols,nextEdges,nv);
      }
    }
    await dfs(tokenAddress,1,[token.symbol],[],new Set([norm(tokenAddress)]));
    if(!paths.length) return null;
    paths.forEach(scorePathLiquidity);
    paths.sort((a,b)=>{
      const am=Number.isFinite(a.pathLiquidityUSD), bm=Number.isFinite(b.pathLiquidityUSD);
      if(am && bm && a.pathLiquidityUSD!==b.pathLiquidityUSD) return b.pathLiquidityUSD-a.pathLiquidityUSD;
      if(am!==bm) return am?-1:1;
      if((a.stablePriority??99)!==(b.stablePriority??99)) return (a.stablePriority??99)-(b.stablePriority??99);
      return a.hops-b.hops;
    });
    const best=paths[0];
    return {price:best.price,route:best.route,hops:best.hops,stable:best.stable,pathLiquidityUSD:best.pathLiquidityUSD,source:"ecosystem-graph",alternatives:paths.slice(1,4).map(p=>({price:p.price,route:p.route,stable:p.stable,hops:p.hops,pathLiquidityUSD:p.pathLiquidityUSD}))};
  }

  async function getTokenPrice({projectKey="default",chain,token,address,block="latest"}){
    const resolvedToken = token || await tokenMeta(chain,address);
    if(!resolvedToken?.address) return null;
    const key=`${projectKey}|${chain}|${norm(resolvedToken.address)}@${blockKey(block)}`;
    if(tokenPriceCache.has(key)) return tokenPriceCache.get(key);
    const promise=(async()=>{
      let result=stableReference(chain,resolvedToken.address);
      const category=tokenCategory(chain,resolvedToken.address);
      if(!result && category === "voucher_currency") result=await vCurrencyUSDPrice(chain,resolvedToken,block);
      if(!result && category === "defi_token") result=await projectTokenUSDPrice(chain,resolvedToken,block);
      if(!result && strictCoreSymbol(resolvedToken.symbol)) result=await strictDirectUSDPrice(chain,resolvedToken,block);
      if(!result && category !== "voucher_currency" && category !== "defi_token") result=await graphUSDPrice(chain,resolvedToken.address,4,block);
      return result;
    })();
    tokenPriceCache.set(key,promise);
    try{ const out=await promise; tokenPriceCache.set(key,out); return out; }
    catch(e){ tokenPriceCache.delete(key); throw e; }
  }

  async function getLpValuation({chain,lpAddress,amount=1,block="latest",priceForToken,projectKey="default"}){
    const pair = await getPairState(chain,lpAddress,block);
    if(!(pair.totalSupply > 0)) return null;
    const share = Number(amount)/pair.totalSupply;
    const amount0 = pair.reserve0*share;
    const amount1 = pair.reserve1*share;
    const resolver = typeof priceForToken === "function"
      ? priceForToken
      : async (ch,tok,bl) => await getTokenPrice({projectKey,chain:ch,token:tok,block:bl});
    const [p0,p1] = await Promise.all([resolver(chain,pair.token0,block),resolver(chain,pair.token1,block)]);
    const price0 = p0 == null ? null : Number(typeof p0 === "number" ? p0 : p0.price);
    const price1 = p1 == null ? null : Number(typeof p1 === "number" ? p1 : p1.price);
    const valueUsd = Number.isFinite(price0) && Number.isFinite(price1) ? amount0*price0 + amount1*price1 : null;
    return {chain,lpAddress:norm(lpAddress),amount:Number(amount),block:pair.block,pair,amount0,amount1,price0Usd:price0,price1Usd:price1,valueUsd,priceUsd:valueUsd==null?null:valueUsd/Number(amount)};
  }

  function configure(fn){ ctx = fn || ctx; }
  function clearCurrent(){
    for(const k of [...pairStateCache.keys()]) if(k.endsWith("@latest")) pairStateCache.delete(k);
    for(const k of [...tokenPriceCache.keys()]) if(k.endsWith("@latest")) tokenPriceCache.delete(k);
    for(const k of [...priceGraphCache.keys()]) if(k.endsWith("@latest")) priceGraphCache.delete(k);
  }
  function clearAll(){ pairStateCache.clear(); tokenMetaCache.clear(); tokenPriceCache.clear(); priceGraphCache.clear(); }

  function currentEntries(map,latestOnly=false){
    return [...map.entries()]
      .filter(([key,value]) => !latestOnly || String(key).endsWith("@latest"))
      .filter(([,value]) => value && typeof value?.then !== "function");
  }

  function exportCurrentState(){
    return {
      schemaVersion:1,
      pairStates:currentEntries(pairStateCache,true),
      tokenMeta:currentEntries(tokenMetaCache,false),
      tokenPrices:currentEntries(tokenPriceCache,true),
      priceGraphs:currentEntries(priceGraphCache,true)
    };
  }

  function importCurrentState(state,{replaceCurrent=true}={}){
    if(!state || Number(state.schemaVersion)!==1) return false;
    if(replaceCurrent) clearCurrent();
    const restore=(map,rows) => {
      for(const row of Array.isArray(rows)?rows:[]){
        if(!Array.isArray(row) || row.length!==2 || !row[0]) continue;
        map.set(String(row[0]),row[1]);
      }
    };
    restore(pairStateCache,state.pairStates);
    restore(tokenMetaCache,state.tokenMeta);
    restore(tokenPriceCache,state.tokenPrices);
    restore(priceGraphCache,state.priceGraphs);
    return true;
  }

  function stats(){ return {pairStates:pairStateCache.size,tokenMeta:tokenMetaCache.size,tokenPrices:tokenPriceCache.size,priceGraphs:priceGraphCache.size}; }

  return {
    configure,
    getPairState,
    getV2Price,
    getTokenPrice,
    getLpValuation,
    tokenMeta,
    stableReference,
    directV2StableMarkets,
    directV3StableMarkets,
    directUSDTFallback,
    strictDirectUSDPrice,
    vCurrencyUSDPrice,
    projectTokenUSDPrice,
    graphUSDPrice,
    clearCurrent,
    clearAll,
    exportCurrentState,
    importCurrentState,
    stats
  };
})();
