// Phase 7.53 · 08.10.2026 18:29:47 CEST: 24-Stunden-Vergleich für DEX-Kurse über dieselbe aktuelle Bewertungsroute; globaler Cache, ehrliche Lücken und Referenzkennzeichnung. Build 20261008-182947.
// Historical comparison replays the selected current valuation basis; no alternative market fallback.
window.CurrentPriceComparison=(()=>{
  let cache={version:1,entries:{}};
  const words=raw=>{if(!/^0x[0-9a-f]+$/i.test(raw||'')||(raw.length-2)%64)throw Error('Ungültige historische RPC-Antwort');return raw.slice(2).match(/.{64}/g).map(x=>BigInt('0x'+x));};
  const address=raw=>'0x'+words(raw)[0].toString(16).padStart(40,'0').slice(-40);
  const hex=n=>'0x'+Number(n).toString(16);
  const norm=x=>String(x||'').toLowerCase();
  async function blockAt(rpc,chain,epoch){
    const last=await rpc(chain,'eth_getBlockByNumber',['latest',false]);
    if(!last?.number||!last.timestamp||Number(BigInt(last.timestamp))<epoch)throw Error('Kein aktueller Block verfügbar');
    let lo=0,hi=Number(BigInt(last.number)),best=null;
    while(lo<=hi){const mid=Math.floor((lo+hi)/2),b=await rpc(chain,'eth_getBlockByNumber',[hex(mid),false]);if(!b?.timestamp)throw Error('Historischer Block nicht verfügbar');const ts=Number(BigInt(b.timestamp));if(ts<=epoch){best={block:mid,timestamp:ts};lo=mid+1}else hi=mid-1;}
    if(!best||epoch-best.timestamp>300)throw Error('Kein zeitnaher Vergleichsblock verfügbar');return best;
  }
  function basisFor(chain,asset,price,metadata){
    if(price.valuationBasis)return price.valuationBasis;
    if(chain!=='apertum')return null;
    const all=Object.entries(metadata).filter(([k])=>k.startsWith(chain+'|'));
    const find=s=>all.find(([,v])=>String(v.symbol||'').toUpperCase()===s)?.[0].split('|')[1];
    const usd=find('WUSDT')||find('USDT'),wrapped=find('WAPTM');
    if(!usd)return null;
    if(/Stablecoin 1 USD/.test(price.source||'')&&asset===usd)return {type:'fixed',price:1};
    const pools=(String(price.source||'').match(/0x[a-fA-F0-9]{40}/g)||[]).map(address=>({address:norm(address),type:'v2'}));
    if(!pools.length)return null;
    return {type:'path',base:asset==='native'?wrapped:asset,quote:usd,pools};
  }
  async function refresh({nativePrices,tokenPrices,metadata={},rpc,resolveBlock=null,historicalV2Leg=null,historicalLp=null,now=Date.now()}){
    const epoch=Math.floor(now/1000)-86400,blocks=new Map(),states=new Map(),decimals=new Map(),out={covered:0,missing:0};
    const entries={};
    const call=(chain,to,data,block)=>rpc(chain,'eth_call',[{to,data},block==='latest'?'latest':hex(block)]);
    const decimal=async(chain,a,block)=>{const k=chain+'|'+norm(a);if(!decimals.has(k))decimals.set(k,(async()=>{const d=Number(words(await call(chain,a,'0x313ce567',chain==='apertum'?'latest':block))[0]);if(!Number.isInteger(d)||d<0||d>36)throw Error('Token-Decimalseinstellung ungültig');return d;})());return decimals.get(k);};
    const state=async(chain,pool,block)=>{const k=chain+'|'+norm(pool.address)+'|'+pool.type;if(!states.has(k))states.set(k,(async()=>{
      const a=address(await call(chain,pool.address,'0x0dfe1681',chain==='apertum'?'latest':block)),b=address(await call(chain,pool.address,'0xd21220a7',chain==='apertum'?'latest':block));
      const da=await decimal(chain,a,block),db=await decimal(chain,b,block);
      if(pool.type==='v3'){const w=words(await call(chain,pool.address,'0x3850c7bd',block)),q=Number(w[0])/2**96;const rate=q*q*10**(da-db);if(!(rate>0&&Number.isFinite(rate)))throw Error('Historischer V3-Kurs fehlt');return {a,b,rate};}
      if(historicalV2Leg){const leg=await historicalV2Leg(chain,pool.address,a,b,block,da,db);if(!(leg?.price>0))throw Error('Historischer V2-Preis fehlt');return {a,b,rate:leg.price};}
      const w=words(await call(chain,pool.address,'0x0902f1ac',block)),r0=Number(w[0])/10**da,r1=Number(w[1])/10**db;if(!(r0>0&&r1>0))throw Error('Historische Poolreserven fehlen');return {a,b,rate:r1/r0,r0,r1};
    })());return states.get(k);};
    const evaluate=async(chain,basis,block)=>{
      if(basis?.type==='fixed')return Number(basis.price);
      if(basis?.type==='lp'){
        if(historicalLp){const result=await historicalLp(chain,basis,block,async asset=>{const token=norm(asset.address);const child=token===norm(basis.token0)?basis.price0:token===norm(basis.token1)?basis.price1:null;if(!child)throw Error('LP-Vergleichsroute fehlt');return {price:await evaluate(chain,child,block)};});if(!(result?.price>0))throw Error('Historischer LP-Preis fehlt');return result.price;}

        const p=await state(chain,{address:basis.pool,type:'v2'},block);
        if(norm(basis.token0)!==p.a||norm(basis.token1)!==p.b)throw Error('LP-Token stimmen nicht überein');
        const lpDecimals=await decimal(chain,basis.pool,block),supply=Number(words(await call(chain,basis.pool,'0x18160ddd',block))[0])/10**lpDecimals;
        if(!(supply>0))throw Error('Historische LP-Supply fehlt');
        return (p.r0*await evaluate(chain,basis.price0,block)+p.r1*await evaluate(chain,basis.price1,block))/supply;
      }
      if(basis?.type!=='path'||!basis.base||!basis.quote||!basis.pools?.length)throw Error('Vergleichsroute nicht belegt');
      let token=norm(basis.base),value=1;
      for(const pool of basis.pools){const p=await state(chain,pool,block);if(token===p.a){value*=p.rate;token=p.b}else if(token===p.b){value/=p.rate;token=p.a}else throw Error('Historische Poolroute nicht zusammenhängend');}
      if(token!==norm(basis.quote))throw Error('Historische USD-Referenz stimmt nicht überein');return value;
    };
    const rows=[...Object.entries(nativePrices).map(([chain,p])=>[chain,'native',p]),...Object.entries(tokenPrices).map(([key,p])=>[key.slice(0,key.indexOf('|')),key.slice(key.indexOf('|')+1),p])];
    for(const [chain,asset,p] of rows){
      if(!p||!(/PancakeSwap|Uniswap|Apertum DEX|Projekt TLN\/VOW/.test(p.source||'')))continue;
      delete p.change24h;delete p.comparison24h;
      const basis=basisFor(chain,asset,p,metadata),key=chain+'|'+asset,signature=JSON.stringify(basis);
      const currentTime=Date.parse(p.refreshedAt||'');
      if(!(Number(p.price)>0)||!Number.isFinite(currentTime)||Math.abs(now-currentTime)>20*60000){p.change24hReason='Aktueller Kurs nicht frisch genug für den 24-Stunden-Vergleich';out.missing++;continue;}
      try{
        if(!basis)throw Error('Bewertungsroute für den Vergleich fehlt');
        if(basis.type==='fixed'){p.change24h=0;delete p.change24hReason;p.comparison24h={kind:'fixed-reference',note:'Konstante USD-Referenzbewertung, keine gemessene Marktbewegung'};out.covered++;continue;}
        const old=cache.entries[key];let reference;
        if(old?.epoch===epoch&&old.signature===signature&&old.price>0)reference=old;
        else{
          if(!blocks.has(chain))blocks.set(chain,resolveBlock?resolveBlock(chain,epoch):blockAt(rpc,chain,epoch));
          const b=await blocks.get(chain);if(!Number.isFinite(b.timestamp)||b.timestamp>epoch||epoch-b.timestamp>300)throw Error('Kein zeitnaher Vergleichsblock verfügbar');const price=await evaluate(chain,basis,b.block);
          if(!(price>0&&Number.isFinite(price)))throw Error('Kein positiver historischer Vergleichskurs');
          reference={epoch,signature,price,block:b.block,timestamp:b.timestamp};
        }
        entries[key]=reference;p.change24h=(Number(p.price)/reference.price-1)*100;
        p.comparison24h={kind:'same-route',price:reference.price,block:reference.block,timestamp:reference.timestamp,currentTimestamp:Math.floor(currentTime/1000)};
        delete p.change24hReason;out.covered++;
      }catch(e){p.change24hReason='24-Stunden-Vergleich nicht verfügbar: '+String(e.message||e);out.missing++;}
    }
    cache={version:1,entries};return out;
  }
  return {refresh,blockAt,basisFor,decorate:(chain,asset,price,cached)=>{
    if(!cached||cached.price!==price.price||cached.route!==price.route||JSON.stringify(cached.valuationBasis)!==JSON.stringify(price.valuationBasis))return price;
    return {...price,change24h:cached.change24h,comparison24h:cached.comparison24h,change24hReason:cached.change24hReason};
  },hydrate:value=>{cache=value?.version===1&&value.entries?value:{version:1,entries:{}};},snapshot:()=>cache};
})();
