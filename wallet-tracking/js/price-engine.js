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

  const norm = x => String(x || "").trim().toLowerCase();
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

  async function getLpValuation({chain,lpAddress,amount=1,block="latest",priceForToken}){
    const pair = await getPairState(chain,lpAddress,block);
    if(!(pair.totalSupply > 0)) return null;
    const share = Number(amount)/pair.totalSupply;
    const amount0 = pair.reserve0*share;
    const amount1 = pair.reserve1*share;
    const [p0,p1] = typeof priceForToken === "function"
      ? await Promise.all([priceForToken(chain,pair.token0,block),priceForToken(chain,pair.token1,block)])
      : [null,null];
    const price0 = p0 == null ? null : Number(typeof p0 === "number" ? p0 : p0.price);
    const price1 = p1 == null ? null : Number(typeof p1 === "number" ? p1 : p1.price);
    const valueUsd = Number.isFinite(price0) && Number.isFinite(price1) ? amount0*price0 + amount1*price1 : null;
    return {chain,lpAddress:norm(lpAddress),amount:Number(amount),block:pair.block,pair,amount0,amount1,price0Usd:price0,price1Usd:price1,valueUsd,priceUsd:valueUsd==null?null:valueUsd/Number(amount)};
  }

  function configure(fn){ ctx = fn || ctx; }
  function clearCurrent(){
    for(const k of [...pairStateCache.keys()]) if(k.endsWith("@latest")) pairStateCache.delete(k);
  }
  function clearAll(){ pairStateCache.clear(); tokenMetaCache.clear(); }
  function stats(){ return {pairStates:pairStateCache.size,tokenMeta:tokenMetaCache.size}; }

  return {configure,getPairState,getV2Price,getLpValuation,tokenMeta,clearCurrent,clearAll,stats};
})();
