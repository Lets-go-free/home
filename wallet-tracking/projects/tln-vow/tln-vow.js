window.TLNVOWProject = (() => {

/* =========================================================
   GENERISCHE DEFI-/DEX-KONFIGURATION AUS SUPABASE
========================================================= */
const PROJECT_KEY = "tln_vow";
let PROJECT_NAME = "TLN/VOW";
let CONFIG = {};
let providers = {};
let projectChains = [];

/* =========================================================
   ABIs
========================================================= */
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)"
];

const V2_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint112 reserve0,uint112 reserve1,uint32 blockTimestampLast)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function factory() view returns (address)"
];

const FACTORY_ABI = [
  "function getPair(address tokenA,address tokenB) view returns (address)"
];

const V3_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function slot0() view returns (uint160 sqrtPriceX96,int24 tick,uint16 observationIndex,uint16 observationCardinality,uint16 observationCardinalityNext,uint8 feeProtocol,bool unlocked)",
  "function liquidity() view returns (uint128)",
  "function fee() view returns (uint24)",
  "function factory() view returns (address)"
];

/* =========================================================
   STATE / CACHE
========================================================= */
let database = { bsc: [], eth: [] };
let references = {};

const tokenCache = new Map();
const pairCache  = new Map();
const priceCache = new Map();
// Öffentliche Preisbrücke zur Hauptseite. Schlüssel immer chain|Contract-Adresse.
const exportedPrices = new Map();

function exportProjectPrice(chain,address,result,kind="token"){
  if(!address || !result || !Number.isFinite(Number(result.price))) return;
  exportedPrices.set(chain + "|" + norm(address), {
    price:Number(result.price),
    change24h:undefined,
    source:"Projekt " + PROJECT_NAME,
    route:result.route || null,
    kind
  });
}
const v3PoolCache = new Map();
const poolTypeCache = new Map();

/*
 * Preisgraph pro Chain.
 * Voucher-Währungen werden NICHT mehr automatisch über VOW geroutet.
 */
const graphCache = {};

/* =========================================================
   BASICS
========================================================= */
function norm(x){ return String(x || "").trim().toLowerCase(); }
function same(a,b){ return !!a && !!b && norm(a) === norm(b); }

function fmt(value, decimals=8){
  if(value === null || value === undefined || !Number.isFinite(value)) return "-";
  return value.toLocaleString("de-CH",{maximumFractionDigits:decimals});
}

function usd(value){
  if(value === null || value === undefined || !Number.isFinite(value)) return "nicht verfügbar";
  if(value === 0) return "$0";
  return "$" + value.toLocaleString("en-US",{
    minimumFractionDigits:value < 1 ? 6 : 2,
    maximumFractionDigits:value < 1 ? 10 : 2
  });
}

/*
 * Neue Supabase-Klassifikation.
 *
 * Generische Werte:
 *   voucher_currency
 *   lp_token
 *   defi_token
 *
 * Supabase-Spalten:
 *   defi_project_key
 *   defi_category
 */
function rowType(row){
  if(!row) return "";
  return norm(row.defi_category);
}

function isAllowedRow(row){
  return norm(row?.defi_project_key) === PROJECT_KEY &&
    ["voucher_currency","lp_token","defi_token"].includes(rowType(row));
}

function isLP(row){ return rowType(row) === "lp_token"; }
function isVoucherRow(row){ return rowType(row) === "voucher_currency"; }
function isProjectToken(row){ return rowType(row) === "defi_token"; }

function chainRows(chain){
  return (database[chain] || []).filter(isAllowedRow);
}
function configuredLPs(chain){ return chainRows(chain).filter(isLP); }
function configuredTokens(chain){
  return chainRows(chain).filter(r => {
    if(!r || !r.address) return false;

    const type = rowType(r);

    // Token-Übersicht: ausschließlich echte Projekt-/Voucher-Tokens.
    if(type !== "voucher_currency" && type !== "defi_token"){
      return false;
    }

    return true;
  });
}

function findDbRow(chain,address){
  return chainRows(chain).find(r => r.address && same(r.address,address)) || null;
}

function findTokenByLabel(chain,label){
  return configuredTokens(chain).find(r => norm(r.label) === norm(label)) || null;
}

function findTokenByLabelContains(chain,text){
  return configuredTokens(chain).find(r => norm(r.label).includes(norm(text))) || null;
}

function displayTokenLabel(dbRow,token){
  const label = String(dbRow?.label || "").trim();
  return label || token.name || token.symbol || token.address;
}

function displayPoolLabel(dbRow,pool){
  const label = String(dbRow?.label || "").trim();
  if(label) return label;
  if(pool?.token0 && pool?.token1) return `${pool.token0.symbol} / ${pool.token1.symbol}`;
  return "Liquidity Pool";
}

/*
 * Referenz-Tokens werden NICHT mehr anhand des Supabase-Labels gesucht.
 * Das Label ist nur für die Anzeige.
 * Für USDT/USDC/BUSD/WBNB/BTCB/WETH wird das tatsächliche On-Chain-Symbol
 * des Token-Contracts verwendet. VOW bleibt bewusst fix hinterlegt.
 */
async function loadProjectInfrastructure(){
  const [{data:project,error:projectError},{data:tokens,error:tokenError},{data:dexRows,error:dexError}] = await Promise.all([
    sb.from("defi_projects").select("*").eq("project_key",PROJECT_KEY).eq("enabled",true).maybeSingle(),
    sb.from("defi_project_tokens").select("*").eq("project_key",PROJECT_KEY).eq("enabled",true),
    sb.from("dex_configs").select("*").eq("enabled",true)
  ]);
  if(projectError) throw projectError;
  if(tokenError) throw tokenError;
  if(dexError) throw dexError;
  if(!project) throw new Error(`DeFi-Projekt ${PROJECT_KEY} ist in Supabase nicht aktiv konfiguriert.`);

  PROJECT_NAME = project.name || PROJECT_KEY;
  CONFIG = {};
  providers = {};
  references = {};
  projectChains = [];

  const referenceTokens = (tokens||[]).filter(t => norm(t.role)==="reference");
  for(const ref of referenceTokens){
    const chain = norm(ref.chain_key);
    if(!chain || !CHAIN_CONFIG[chain]) continue;
    if(!CONFIG[chain]) CONFIG[chain]={};
    if(!references[chain]) references[chain]={};
    references[chain].vow = ref.contract_address;
    if(!projectChains.includes(chain)) projectChains.push(chain);
  }

  for(const chain of projectChains){
    const chainDex=(dexRows||[]).filter(d => norm(d.chain_key)===chain);
    const v2=chainDex.find(d => norm(d.version)==="v2");
    const v3=chainDex.find(d => norm(d.version)==="v3");
    CONFIG[chain]={
      rpc: configuredRpcUrl(chain),
      v2Factory:v2?.factory_address || null,
      v3Factory:v3?.factory_address || null
    };
    if(!CONFIG[chain].v2Factory) throw new Error(`${PROJECT_NAME}: Für ${chain} fehlt eine aktive V2-DEX-Factory.`);
    providers[chain]=new ethers.JsonRpcProvider(CONFIG[chain].rpc);
    graphCache[chain]=null;
    references[chain]=references[chain] || {};
  }
}

async function resolveReferences(chain){
  /*
   * WICHTIG:
   * Seit tln_vow_category nur noch Projekt-Tokens/LPs enthält,
   * dürfen USDT, USDC, BTCB, WBNB, WETH usw. NICHT mehr davon
   * abhängig sein, ob sie selbst als Supabase-Tokenzeile vorhanden sind.
   *
   * Deshalb werden Referenz-Assets direkt aus den Token0/Token1-
   * Contracts der konfigurierten LPs erkannt.
   *
   * Zusätzlich wird, sobald eine Stablecoin-Adresse bekannt ist,
   * die DEX-Factory für direkte Märkte verwendet.
   */

  const wanted = chain === "bsc"
    ? ["USDT","USDC","BUSD","WBNB","BTCB"]
    : ["USDT","USDC","WETH"];

  const found = {};

  for(const dbPool of configuredLPs(chain)){
    try{
      const type = await detectPoolType(chain,dbPool.address);
      const pool = type === "v3"
        ? await readV3Pool(chain,dbPool.address)
        : await readV2Pool(chain,dbPool.address);

      for(const token of [pool.token0,pool.token1]){
        const symbol = String(token.symbol || "").trim().toUpperCase();

        if(wanted.includes(symbol) && !found[symbol]){
          found[symbol] = token.address;
        }
      }
    }catch(e){
      console.warn(
        "Referenz-Asset konnte aus LP nicht gelesen werden:",
        dbPool.address,
        e
      );
    }
  }

  /*
   * Als zweite Quelle dürfen auch die explizit zugelassenen
   * Projekt-/Voucher-Tokenzeilen dienen. Das hilft z.B., falls ein
   * Referenzasset doch bewusst mit tln_vow_category gepflegt wurde.
   */
  for(const row of configuredTokens(chain)){
    try{
      const token = await getToken(chain,row.address);
      const symbol = String(token.symbol || "").trim().toUpperCase();

      if(wanted.includes(symbol) && !found[symbol]){
        found[symbol] = token.address;
      }
    }catch(e){
      console.warn("Referenz-Token konnte nicht gelesen werden:",row.address,e);
    }
  }

  references[chain] = references[chain] || {};
  references[chain].usdt = found.USDT || null;
  references[chain].usdc = found.USDC || null;
  references[chain].busd = found.BUSD || null;
  references[chain].wbnb = found.WBNB || null;
  references[chain].btcb = found.BTCB || null;
  references[chain].weth = found.WETH || null;

  console.log("Resolved references",chain,references[chain]);
}

/* =========================================================
   SUPABASE
========================================================= */
async function loadSupabase(){
  const {data:rows,error}=await sb.from("predefined_tokens")
    .select("*")
    .eq("defi_project_key",PROJECT_KEY)
    .eq("enabled",true);
  if(error) throw error;

  database={};
  for(const chain of projectChains){
    database[chain]=(rows||[]).filter(r => norm(r.chain)===chain && isAllowedRow(r));
  }
}

/* =========================================================
   TOKEN INFO
========================================================= */
async function getToken(chain,address){
  const key = chain + ":" + norm(address);
  if(tokenCache.has(key)) return tokenCache.get(key);

  const contract = new ethers.Contract(address,ERC20_ABI,providers[chain]);

  // Metadaten sind bewusst fehlertolerant. Einige ältere/projektspezifische
  // ERC-20-Contracts implementieren einzelne optionale Metadata-Reads nicht
  // sauber und können z.B. bei name() mit "execution reverted" antworten.
  // Das darf eine ansonsten gültige LP-/Preisabfrage nicht abbrechen.
  let name = null, symbol = null, decimals = 18;
  try { name = await contract.name(); } catch(e) {
    console.warn(`TLN/VOW ${chain} ${address}: name() nicht verfügbar`, e);
  }
  try { symbol = await contract.symbol(); } catch(e) {
    console.warn(`TLN/VOW ${chain} ${address}: symbol() nicht verfügbar`, e);
  }
  try { decimals = Number(await contract.decimals()); } catch(e) {
    console.warn(`TLN/VOW ${chain} ${address}: decimals() nicht verfügbar; Fallback 18`, e);
    decimals = 18;
  }

  const fallback = String(address).slice(0,8) + "…";
  const result = {
    address,
    name: String(name || symbol || fallback),
    symbol: String(symbol || name || fallback),
    decimals: Number.isFinite(Number(decimals)) ? Number(decimals) : 18
  };
  tokenCache.set(key,result);
  return result;
}

/* =========================================================
   V2 PAIR LOOKUP
========================================================= */
async function findPair(chain,tokenA,tokenB){
  if(!tokenA || !tokenB) return null;

  const key = chain + ":" + [norm(tokenA),norm(tokenB)].sort().join(":");
  if(pairCache.has(key)) return pairCache.get(key);

  const factory = new ethers.Contract(CONFIG[chain].v2Factory,FACTORY_ABI,providers[chain]);
  const pair = await factory.getPair(tokenA,tokenB);
  const result = pair === ethers.ZeroAddress ? null : pair;

  pairCache.set(key,result);
  return result;
}

/* =========================================================
   V2 PRICE
========================================================= */
async function getV2Price(chain,pairAddress,baseToken){
  const pair = new ethers.Contract(pairAddress,V2_ABI,providers[chain]);
  const [a,b,res] = await Promise.all([pair.token0(),pair.token1(),pair.getReserves()]);
  const [t0,t1] = await Promise.all([getToken(chain,a),getToken(chain,b)]);

  const r0 = Number(ethers.formatUnits(res[0],t0.decimals));
  const r1 = Number(ethers.formatUnits(res[1],t1.decimals));
  if(!r0 || !r1) return null;

  if(same(baseToken,a)) return {price:r1/r0,quote:t1.address};
  if(same(baseToken,b)) return {price:r0/r1,quote:t0.address};

  return null;
}

/* =========================================================
   STABLECOINS
========================================================= */
function stableReference(chain,address){
  const ref = references[chain];
  if(same(address,ref.usdt)) return {price:1,route:"USDT",hops:0};
  if(same(address,ref.usdc)) return {price:1,route:"USDC",hops:0};
  if(chain === "bsc" && same(address,ref.busd)) return {price:1,route:"BUSD",hops:0};
  return null;
}

async function tokenSymbol(chain,address){
  try { return (await getToken(chain,address)).symbol; }
  catch { return address.slice(0,6)+"…"; }
}

/* =========================================================
   PREISGRAPH AUS DEN SUPABASE-LPs AUFBAUEN
========================================================= */
async function buildPriceGraph(chain){
  if(graphCache[chain]) return graphCache[chain];

  const edges = [];

  for(const dbPool of configuredLPs(chain)){
    try{
      const type = await detectPoolType(chain,dbPool.address);

      if(type === "v2"){
        const pool = await readV2Pool(chain,dbPool.address);

        if(pool.r0 > 0 && pool.r1 > 0){
          edges.push({
            type:"v2",
            from:pool.token0.address,
            to:pool.token1.address,
            rate:pool.r1/pool.r0,
            fromSymbol:pool.token0.symbol,
            toSymbol:pool.token1.symbol,
            pool:dbPool.address,
            reserveFrom:pool.r0,
            reserveTo:pool.r1
          });

          edges.push({
            type:"v2",
            from:pool.token1.address,
            to:pool.token0.address,
            rate:pool.r0/pool.r1,
            fromSymbol:pool.token1.symbol,
            toSymbol:pool.token0.symbol,
            pool:dbPool.address,
            reserveFrom:pool.r1,
            reserveTo:pool.r0
          });
        }
      }

      if(type === "v3"){
        const pool = await readV3Pool(chain,dbPool.address);

        if(Number.isFinite(pool.price0) && pool.price0 > 0){
          edges.push({
            type:"v3",
            from:pool.token0.address,
            to:pool.token1.address,
            rate:pool.price0,
            fromSymbol:pool.token0.symbol,
            toSymbol:pool.token1.symbol,
            pool:dbPool.address,
            reserveFrom:null,
            reserveTo:null
          });

          edges.push({
            type:"v3",
            from:pool.token1.address,
            to:pool.token0.address,
            rate:pool.price1,
            fromSymbol:pool.token1.symbol,
            toSymbol:pool.token0.symbol,
            pool:dbPool.address,
            reserveFrom:null,
            reserveTo:null
          });
        }
      }
    }catch(e){
      console.warn("Preisgraph: Pool konnte nicht gelesen werden:",dbPool.address,e);
    }
  }

  graphCache[chain] = edges;
  return edges;
}

/* =========================================================
   SHORTEST-PATH PREISROUTER
========================================================= */
async function enumerateUSDPaths(chain,tokenAddress,maxHops=4,maxPaths=80){
  const stableSelf = stableReference(chain,tokenAddress);
  if(stableSelf){
    return [{
      price:1,
      route:stableSelf.route,
      stable:stableSelf.route,
      hops:0,
      edges:[],
      pathLiquidityUSD:Infinity
    }];
  }

  const edges = await buildPriceGraph(chain);

  const stablePriority = [
    {name:"USDT", address:references[chain].usdt, priority:0},
    {name:"USDC", address:references[chain].usdc, priority:1},
    ...(chain === "bsc"
      ? [{name:"BUSD", address:references.bsc.busd, priority:2}]
      : [])
  ].filter(x => x.address);

  const stableMap = new Map(
    stablePriority.map(x => [norm(x.address), x])
  );

  const paths = [];
  const startSymbol = await tokenSymbol(chain,tokenAddress);

  async function dfs(currentAddress, multiplier, symbols, pathEdges, visited){
    if(paths.length >= maxPaths) return;
    if(pathEdges.length >= maxHops) return;

    const outgoing = edges.filter(e => same(e.from,currentAddress));

    for(const edge of outgoing){
      const nextKey = norm(edge.to);
      if(visited.has(nextKey)) continue;

      const nextMultiplier = multiplier * edge.rate;
      const nextSymbols = [...symbols,edge.toSymbol];
      const nextEdges = [...pathEdges,edge];

      const stable = stableMap.get(nextKey);

      if(stable){
        paths.push({
          price:nextMultiplier,
          route:nextSymbols.join(" → "),
          stable:stable.name,
          stablePriority:stable.priority,
          hops:nextEdges.length,
          edges:nextEdges,
          pathLiquidityUSD:null
        });
        continue;
      }

      const nextVisited = new Set(visited);
      nextVisited.add(nextKey);

      await dfs(
        edge.to,
        nextMultiplier,
        nextSymbols,
        nextEdges,
        nextVisited
      );
    }
  }

  await dfs(
    tokenAddress,
    1,
    [startSymbol],
    [],
    new Set([norm(tokenAddress)])
  );

  return paths;
}


/*
 * Für einen V2-Pfad lässt sich die USD-Liquidität jedes Hops aus
 * der nachfolgenden USD-Bewertung abschätzen:
 *
 * TVL ≈ ReserveFrom * USD(From) + ReserveTo * USD(To)
 *
 * Da die Preise aus genau diesem Pool stammen, sind beide Seiten
 * im Idealfall annähernd gleichwertig.
 *
 * Als Pfad-Liquidität verwenden wir den kleinsten TVL aller Hops
 * ("Bottleneck"). Eine Route ist nur so stark wie ihr schwächster Pool.
 *
 * V3-Hops besitzen hier keine einfachen reserve0/reserve1-Werte.
 * Sie erhalten deshalb keinen erfundenen TVL-Wert; bei gemischten
 * Routen wird nur die messbare V2-Liquidität verwendet.
 */
function scorePathLiquidity(path){
  if(!path.edges.length){
    path.pathLiquidityUSD = Infinity;
    return path;
  }

  let usdTo = 1; // Stablecoin am Ende
  let bottleneck = Infinity;
  let measurableHops = 0;

  for(let i=path.edges.length-1; i>=0; i--){
    const edge = path.edges[i];

    const usdFrom = edge.rate * usdTo;

    if(
      edge.type === "v2" &&
      Number.isFinite(edge.reserveFrom) &&
      Number.isFinite(edge.reserveTo)
    ){
      const tvl =
        edge.reserveFrom * usdFrom +
        edge.reserveTo * usdTo;

      if(Number.isFinite(tvl) && tvl > 0){
        bottleneck = Math.min(bottleneck,tvl);
        measurableHops++;
      }
    }

    usdTo = usdFrom;
  }

  path.pathLiquidityUSD =
    measurableHops > 0
      ? bottleneck
      : null;

  return path;
}


async function graphUSDPrice(chain,tokenAddress,maxHops=4){
  const paths = await enumerateUSDPaths(chain,tokenAddress,maxHops);

  if(!paths.length) return null;

  paths.forEach(scorePathLiquidity);

  /*
   * Auswahl:
   * 1. messbare Liquidität vorhanden -> höchste Bottleneck-Liquidität
   * 2. bei ähnlicher/gleicher Liquidität: USDT bevorzugen
   * 3. danach kürzere Route
   * 4. reine V3-Routen ohne messbare V2-Reserve bleiben nutzbar,
   *    werden aber hinter messbaren Routen einsortiert.
   */
  paths.sort((a,b)=>{
    const aLiq = a.pathLiquidityUSD;
    const bLiq = b.pathLiquidityUSD;

    const aMeasured = Number.isFinite(aLiq);
    const bMeasured = Number.isFinite(bLiq);

    if(aMeasured && bMeasured && aLiq !== bLiq){
      return bLiq - aLiq;
    }

    if(aMeasured !== bMeasured){
      return aMeasured ? -1 : 1;
    }

    if((a.stablePriority ?? 99) !== (b.stablePriority ?? 99)){
      return (a.stablePriority ?? 99) - (b.stablePriority ?? 99);
    }

    return a.hops - b.hops;
  });

  const best = paths[0];

  return {
    price:best.price,
    route:best.route,
    hops:best.hops,
    stable:best.stable,
    pathLiquidityUSD:best.pathLiquidityUSD,
    alternatives:paths.slice(1,4).map(p=>({
      price:p.price,
      route:p.route,
      stable:p.stable,
      hops:p.hops,
      pathLiquidityUSD:p.pathLiquidityUSD
    }))
  };
}

/* =========================================================
   DIREKTE USD-MÄRKTE FÜR EXTERNE / CORE ASSETS
========================================================= */

/*
 * BTCB, WBNB, WETH und VOW werden NICHT über andere Ecosystem-Tokens geroutet.
 *
 * Für diese Assets gilt:
 *   TOKEN -> USDT
 *   TOKEN -> USDC
 *   TOKEN -> BUSD (nur BSC)
 *
 * Auf Ethereum darf ein direkter Uniswap-V3-Pool ebenfalls als
 * direkter Stablecoin-Markt dienen (z.B. WETH/USDC).
 *
 * Es gibt ausdrücklich KEIN:
 *   BTCB -> VOW -> ...
 *   WBNB -> VOW -> ...
 *   WETH -> VOW -> ...
 */

function strictCoreSymbol(symbol){
  return ["BTCB","WBNB","WETH","BNB","ETH"].includes(
    String(symbol || "").trim().toUpperCase()
  );
}

async function directV2StableMarkets(chain,tokenAddress){
  const candidates = [
    {name:"USDT",address:references[chain].usdt,priority:0},
    {name:"USDC",address:references[chain].usdc,priority:1},
    ...(chain === "bsc"
      ? [{name:"BUSD",address:references.bsc.busd,priority:2}]
      : [])
  ].filter(x => x.address);

  const results = [];
  const symbol = await tokenSymbol(chain,tokenAddress);

  for(const stable of candidates){
    try{
      const pairAddress = await findPair(chain,tokenAddress,stable.address);
      if(!pairAddress) continue;

      const pair = await readV2Pool(chain,pairAddress);

      let tokenReserve = null;
      let stableReserve = null;
      let price = null;

      if(same(pair.token0.address,tokenAddress)){
        tokenReserve = pair.r0;
        stableReserve = pair.r1;
        price = pair.r1 / pair.r0;
      }else if(same(pair.token1.address,tokenAddress)){
        tokenReserve = pair.r1;
        stableReserve = pair.r0;
        price = pair.r0 / pair.r1;
      }

      if(
        price === null ||
        !Number.isFinite(price) ||
        price <= 0
      ) continue;

      /*
       * Da der Quote-Token ein USD-Stablecoin ist, können wir den
       * Pool-TVL ohne weitere Preisroute abschätzen:
       *
       * Token-Seite = tokenReserve * price
       * Stable-Seite = stableReserve * $1
       */
      const liquidityUSD =
        tokenReserve * price +
        stableReserve;

      results.push({
        price,
        route:`${symbol} → ${stable.name}`,
        stable:stable.name,
        stablePriority:stable.priority,
        hops:1,
        pathLiquidityUSD:liquidityUSD,
        source:"direct-v2",
        pool:pairAddress
      });
    }catch(e){
      console.warn("Direkter V2-Stablemarkt konnte nicht gelesen werden:",tokenAddress,stable.name,e);
    }
  }

  return results;
}

async function directV3StableMarkets(chain,tokenAddress){
  if(chain !== "eth") return [];

  const candidates = [
    {name:"USDT",address:references.eth.usdt,priority:0},
    {name:"USDC",address:references.eth.usdc,priority:1}
  ].filter(x => x.address);

  const results = [];
  const symbol = await tokenSymbol(chain,tokenAddress);

  /*
   * Wir verwenden ausschließlich die in Supabase als LP/Pool
   * hinterlegten Uniswap-V3-Pools. Keine externe API.
   */
  for(const dbPool of configuredLPs("eth")){
    try{
      const type = await detectPoolType("eth",dbPool.address);
      if(type !== "v3") continue;

      const pool = await readV3Pool("eth",dbPool.address);

      for(const stable of candidates){
        if(
          same(pool.token0.address,tokenAddress) &&
          same(pool.token1.address,stable.address)
        ){
          results.push({
            price:pool.price0,
            route:`${symbol} → ${stable.name} (Uniswap V3)`,
            stable:stable.name,
            stablePriority:stable.priority,
            hops:1,
            pathLiquidityUSD:null,
            source:"direct-v3",
            pool:dbPool.address
          });
        }

        if(
          same(pool.token1.address,tokenAddress) &&
          same(pool.token0.address,stable.address)
        ){
          results.push({
            price:pool.price1,
            route:`${symbol} → ${stable.name} (Uniswap V3)`,
            stable:stable.name,
            stablePriority:stable.priority,
            hops:1,
            pathLiquidityUSD:null,
            source:"direct-v3",
            pool:dbPool.address
          });
        }
      }
    }catch(e){
      console.warn("V3-Pool konnte für direkten Stablemarkt nicht gelesen werden:",dbPool.address,e);
    }
  }

  return results;
}


/*
 * LETZTER FALLBACK FÜR PROJEKT-TOKENS
 *
 * Für tln_vow_token (z.B. TLN / TLN+) prüfen wir als letzten Schritt
 * nochmals explizit einen direkten V2-Pool gegen USDT.
 *
 * Keine Route über VOW.
 * Keine externe API.
 * Nur Factory.getPair(token, USDT) + getReserves().
 */
async function directUSDTFallback(chain,token){
  const usdt = references[chain].usdt;
  if(!usdt) return null;

  try{
    const pairAddress = await findPair(chain,token.address,usdt);
    if(!pairAddress) return null;

    const pair = await readV2Pool(chain,pairAddress);

    let price = null;
    let tokenReserve = null;
    let usdtReserve = null;

    if(same(pair.token0.address,token.address)){
      price = pair.r1 / pair.r0;
      tokenReserve = pair.r0;
      usdtReserve = pair.r1;
    }else if(same(pair.token1.address,token.address)){
      price = pair.r0 / pair.r1;
      tokenReserve = pair.r1;
      usdtReserve = pair.r0;
    }

    if(!Number.isFinite(price) || price <= 0) return null;

    const liquidityUSD =
      tokenReserve * price +
      usdtReserve;

    return {
      price,
      route:`${token.symbol} → USDT (direkter V2-Fallback)`,
      stable:"USDT",
      hops:1,
      pathLiquidityUSD:liquidityUSD,
      source:"direct-usdt-fallback",
      pool:pairAddress
    };

  }catch(e){
    console.warn(
      "Direkter USDT-Fallback fehlgeschlagen:",
      chain,
      token.symbol,
      token.address,
      e
    );
    return null;
  }
}

async function strictDirectUSDPrice(chain,token){
  const stableSelf = stableReference(chain,token.address);
  if(stableSelf) return stableSelf;

  const v2 = await directV2StableMarkets(chain,token.address);
  const v3 = await directV3StableMarkets(chain,token.address);

  const all = [...v2,...v3];
  if(!all.length) return null;

  /*
   * Auswahl direkter Märkte:
   * 1. Wenn TVL messbar ist: größter direkter Pool.
   * 2. Bei Gleichstand: USDT vor USDC/BUSD.
   * 3. V3 bleibt möglich, wenn kein messbarer V2-Direktmarkt existiert.
   */
  all.sort((a,b)=>{
    const aMeasured = Number.isFinite(a.pathLiquidityUSD);
    const bMeasured = Number.isFinite(b.pathLiquidityUSD);

    if(aMeasured && bMeasured && a.pathLiquidityUSD !== b.pathLiquidityUSD){
      return b.pathLiquidityUSD - a.pathLiquidityUSD;
    }

    if(aMeasured !== bMeasured){
      return aMeasured ? -1 : 1;
    }

    return (a.stablePriority ?? 99) - (b.stablePriority ?? 99);
  });

  return all[0];
}

/* =========================================================
   ÖKOSYSTEM-PREISE
========================================================= */

/*
 * Nur für Tokens, die NICHT zu den externen Core-Assets gehören,
 * darf der vorhandene Pool-Graph verwendet werden.
 *
 * Damit bleiben z.B. v$, v€, v£ oder TLN Gold über ihre echten
 * LP-Verbindungen bewertbar, während BTCB vollständig unabhängig
 * von VOW bleibt.
 */
async function ecosystemUSDPrice(chain,token){
  return await graphUSDPrice(chain,token.address,4);
}

/* =========================================================
   USD PRICE ROUTER
========================================================= */

/* =========================================================
   SPEZIELLE PREISLOGIK FÜR v_currency
========================================================= */

/*
 * Nur für Datensätze mit:
 *   tln_vow_category = "v_currency"
 *
 * gilt bewusst:
 *
 *   v-Währung -> VOW -> USDT
 *
 * Schritt 1:
 *   direkter V2-Pool v-Währung / VOW
 *
 * Schritt 2:
 *   direkter V2-Pool VOW / USDT
 *
 * Keine Suche über v$, v€, v£ untereinander.
 * Kein Graph-Routing für v_currency.
 */
async function vCurrencyUSDPrice(chain,token){
  const vow = references[chain].vow;
  const usdt = references[chain].usdt;

  if(!vow || !usdt) return null;

  try{
    const vToVowPair = await findPair(chain,token.address,vow);
    if(!vToVowPair) return null;

    const vToVow = await getV2Price(
      chain,
      vToVowPair,
      token.address
    );

    if(!vToVow) return null;

    const vowToUsdtPair = await findPair(chain,vow,usdt);
    if(!vowToUsdtPair) return null;

    const vowToUsdt = await getV2Price(
      chain,
      vowToUsdtPair,
      vow
    );

    if(!vowToUsdt) return null;

    /*
     * Für die angezeigte Pfad-Liquidität nehmen wir den
     * kleineren TVL der beiden V2-Pools als Bottleneck.
     */
    const vPool = await readV2Pool(chain,vToVowPair);
    const vowPool = await readV2Pool(chain,vowToUsdtPair);

    let vPoolTVL = null;
    let vowPoolTVL = null;

    // v_currency/VOW-Pool in USD bewerten
    // token USD = (token->VOW) * (VOW->USDT)
    const tokenUsd = vToVow.price * vowToUsdt.price;

    if(same(vPool.token0.address,token.address)){
      vPoolTVL =
        vPool.r0 * tokenUsd +
        vPool.r1 * vowToUsdt.price;
    }else{
      vPoolTVL =
        vPool.r1 * tokenUsd +
        vPool.r0 * vowToUsdt.price;
    }

    // VOW/USDT-Pool
    if(same(vowPool.token0.address,vow)){
      vowPoolTVL =
        vowPool.r0 * vowToUsdt.price +
        vowPool.r1;
    }else{
      vowPoolTVL =
        vowPool.r1 * vowToUsdt.price +
        vowPool.r0;
    }

    const pathLiquidityUSD =
      Number.isFinite(vPoolTVL) && Number.isFinite(vowPoolTVL)
        ? Math.min(vPoolTVL,vowPoolTVL)
        : null;

    return {
      price:tokenUsd,
      route:`${token.symbol} → VOW → USDT`,
      stable:"USDT",
      hops:2,
      pathLiquidityUSD,
      source:"v-currency-direct-vow-usdt",
      pools:[vToVowPair,vowToUsdtPair]
    };

  }catch(e){
    console.warn(
      "v_currency Preisroute fehlgeschlagen:",
      chain,
      token.symbol,
      token.address,
      e
    );

    return null;
  }
}


/* =========================================================
   SPEZIELLE PREISLOGIK FÜR tln_vow_token
========================================================= */

/*
 * Für tln_vow_token gilt:
 *
 * 1. Wenn der Token VOW selbst ist:
 *      VOW -> USDT
 *
 * 2. Für alle anderen tln_vow_token:
 *      zuerst prüfen: TOKEN / VOW Pool vorhanden?
 *
 *      Wenn JA:
 *          TOKEN -> VOW -> USDT
 *
 *      Wenn NEIN:
 *          direkten TOKEN / USDT Pool prüfen
 *
 * Kein allgemeines Graph-Routing für tln_vow_token.
 */
async function projectTokenUSDPrice(chain,token){
  const vow = references[chain].vow;
  const usdt = references[chain].usdt;

  if(!usdt) return null;

  /*
   * VOW selbst:
   * niemals VOW/VOW suchen.
   * Immer direkt gegen USDT.
   */
  if(vow && same(token.address,vow)){
    return await directUSDTFallback(chain,token);
  }

  /*
   * 1. TOKEN / VOW
   */
  if(vow){
    try{
      const tokenVowPair = await findPair(chain,token.address,vow);

      if(tokenVowPair){
        const tokenToVow = await getV2Price(
          chain,
          tokenVowPair,
          token.address
        );

        if(tokenToVow){
          const vowUsdtPair = await findPair(chain,vow,usdt);

          if(vowUsdtPair){
            const vowToUsdt = await getV2Price(
              chain,
              vowUsdtPair,
              vow
            );

            if(vowToUsdt){
              const tokenUsd =
                tokenToVow.price *
                vowToUsdt.price;

              /*
               * Pfad-Liquidität als Bottleneck der beiden V2-Pools.
               */
              let pathLiquidityUSD = null;

              try{
                const tokenVowPool = await readV2Pool(chain,tokenVowPair);
                const vowUsdtPool = await readV2Pool(chain,vowUsdtPair);

                let tokenVowTVL = null;
                let vowUsdtTVL = null;

                if(same(tokenVowPool.token0.address,token.address)){
                  tokenVowTVL =
                    tokenVowPool.r0 * tokenUsd +
                    tokenVowPool.r1 * vowToUsdt.price;
                }else{
                  tokenVowTVL =
                    tokenVowPool.r1 * tokenUsd +
                    tokenVowPool.r0 * vowToUsdt.price;
                }

                if(same(vowUsdtPool.token0.address,vow)){
                  vowUsdtTVL =
                    vowUsdtPool.r0 * vowToUsdt.price +
                    vowUsdtPool.r1;
                }else{
                  vowUsdtTVL =
                    vowUsdtPool.r1 * vowToUsdt.price +
                    vowUsdtPool.r0;
                }

                if(
                  Number.isFinite(tokenVowTVL) &&
                  Number.isFinite(vowUsdtTVL)
                ){
                  pathLiquidityUSD =
                    Math.min(
                      tokenVowTVL,
                      vowUsdtTVL
                    );
                }
              }catch(e){
                console.warn(
                  "Pfad-Liquidität für tln_vow_token konnte nicht berechnet werden:",
                  token.symbol,
                  e
                );
              }

              return {
                price:tokenUsd,
                route:`${token.symbol} → VOW → USDT`,
                stable:"USDT",
                hops:2,
                pathLiquidityUSD,
                source:"tln-vow-token-via-vow",
                pools:[
                  tokenVowPair,
                  vowUsdtPair
                ]
              };
            }
          }
        }
      }
    }catch(e){
      console.warn(
        "TOKEN/VOW-Route konnte nicht gelesen werden:",
        chain,
        token.symbol,
        token.address,
        e
      );
    }
  }

  /*
   * 2. Kein brauchbarer TOKEN/VOW-Pool:
   *    direkter TOKEN / USDT Pool
   */
  return await directUSDTFallback(
    chain,
    token
  );
}

async function getUSD(chain,token){
  const key = chain + ":" + norm(token.address);
  if(priceCache.has(key)) return priceCache.get(key);

  let result = null;
  const dbRow = findDbRow(chain,token.address);

  /*
   * Stablecoins.
   */
  result = stableReference(chain,token.address);

  /*
   * v_currency:
   * immer direkter v/VOW-Pool -> VOW/USDT.
   */
  if(
    !result &&
    dbRow &&
    isVoucherRow(dbRow)
  ){
    result = await vCurrencyUSDPrice(
      chain,
      token
    );
  }

  /*
   * tln_vow_token:
   *
   * VOW selbst:
   *   VOW -> USDT
   *
   * Andere Projekt-Tokens:
   *   zuerst TOKEN -> VOW -> USDT
   *   falls kein TOKEN/VOW-Pool: TOKEN -> USDT
   */
  if(
    !result &&
    dbRow &&
    isProjectToken(dbRow)
  ){
    result = await projectTokenUSDPrice(
      chain,
      token
    );
  }

  /*
   * BTCB / WBNB / WETH / ETH / BNB:
   * strikt vom VOW-Ökosystem getrennt.
   */
  if(
    !result &&
    strictCoreSymbol(token.symbol)
  ){
    result = await strictDirectUSDPrice(
      chain,
      token
    );
  }

  /*
   * Technischer Fallback nur für intern benötigte Tokens,
   * die weder v_currency noch tln_vow_token sind.
   */
  if(
    !result &&
    (!dbRow || (!isVoucherRow(dbRow) && !isProjectToken(dbRow)))
  ){
    result = await ecosystemUSDPrice(
      chain,
      token
    );
  }

  priceCache.set(key,result);
  return result;
}

/* =========================================================
   POOL TYPE
========================================================= */
async function detectPoolType(chain,address){
  const key = chain + ":" + norm(address);
  if(poolTypeCache.has(key)) return poolTypeCache.get(key);
  if(!providers[chain]) throw new Error(`${chain}: RPC-Provider für Pool ${address} fehlt.`);
  if(!ethers.isAddress(address)) throw new Error(`${chain}: Ungültige Pool-Adresse ${address}.`);

  const minimal = new ethers.Contract(
    address,
    ["function factory() view returns (address)"],
    providers[chain]
  );

  let factory;
  try{ factory = await minimal.factory(); }
  catch(e){
    throw new Error(`${chain}: ${address} · factory() fehlgeschlagen: ${e?.shortMessage || e?.reason || e?.message || e}`);
  }

  let type = null;
  if(same(factory,CONFIG[chain].v2Factory)) type = "v2";
  if(CONFIG[chain]?.v3Factory && same(factory,CONFIG[chain].v3Factory)) type = "v3";

  if(!type) throw new Error(`${chain}: ${address} gehört nicht zu einer konfigurierten V2/V3-Factory (factory=${factory}).`);
  poolTypeCache.set(key,type);
  return type;
}

/* =========================================================
   READ V2 POOL
========================================================= */
async function readV2Pool(chain,address){
  if(!providers[chain]) throw new Error(`${chain}: RPC-Provider für Pool ${address} fehlt.`);
  const pair = new ethers.Contract(address,V2_ABI,providers[chain]);

  // Kernfunktionen müssen funktionieren; wir lesen sie bewusst einzeln fehlertolerant
  // und melden exakt, welcher Contract-Read fehlschlägt. So kann ein RPC-Revert nicht
  // mehr als anonyme JSON-Meldung erscheinen. LP-Metadaten wie symbol() bleiben optional.
  const coreCalls = [
    ["token0()", () => pair.token0()],
    ["token1()", () => pair.token1()],
    ["getReserves()", () => pair.getReserves()],
    ["totalSupply()", () => pair.totalSupply()],
    ["decimals()", () => pair.decimals()],
    ["factory()", () => pair.factory()]
  ];
  const settled = await Promise.allSettled(coreCalls.map(([,fn]) => fn()));
  const failedIndex = settled.findIndex(x => x.status === "rejected");
  if(failedIndex >= 0){
    const err = settled[failedIndex].reason;
    throw new Error(`${chain}: ${address} · ${coreCalls[failedIndex][0]} fehlgeschlagen: ${err?.shortMessage || err?.reason || err?.message || err}`);
  }
  const [token0,token1,reserves,totalSupply,lpDecimals,factory] = settled.map(x => x.value);
  if(!token0 || !token1 || same(token0,token1)) throw new Error(`${chain}: ${address} liefert ungültige token0/token1-Adressen.`);
  let lpSymbol = "LP";
  try { lpSymbol = String(await pair.symbol()); } catch(e) {
    console.warn(`TLN/VOW ${chain} ${address}: LP symbol() nicht verfügbar`, e);
  }

  if(!same(factory,CONFIG[chain].v2Factory)){
    throw new Error("Pool gehört nicht zur erwarteten V2-Factory.");
  }

  const [t0,t1] = await Promise.all([getToken(chain,token0),getToken(chain,token1)]);

  return {
    type:"v2",
    address,
    token0:t0,
    token1:t1,
    r0:Number(ethers.formatUnits(reserves[0],t0.decimals)),
    r1:Number(ethers.formatUnits(reserves[1],t1.decimals)),
    lpSupply:Number(ethers.formatUnits(totalSupply,Number(lpDecimals))),
    lpDecimals:Number(lpDecimals),
    lpSymbol
  };
}

/* =========================================================
   READ V3 POOL
========================================================= */
async function readV3Pool(chain,address){
  if(chain !== "eth") throw new Error("V3 ist in dieser Version nur für Ethereum vorgesehen.");

  const cacheKey = chain + ":" + norm(address);
  if(v3PoolCache.has(cacheKey)) return v3PoolCache.get(cacheKey);

  const pool = new ethers.Contract(address,V3_ABI,providers[chain]);
  const [token0,token1,slot0,liquidity,fee,factory] = await Promise.all([
    pool.token0(),
    pool.token1(),
    pool.slot0(),
    pool.liquidity(),
    pool.fee(),
    pool.factory()
  ]);

  if(!CONFIG[chain]?.v3Factory || !same(factory,CONFIG[chain].v3Factory)){
    throw new Error("Pool gehört nicht zur Uniswap-V3-Factory.");
  }

  const [t0,t1] = await Promise.all([getToken(chain,token0),getToken(chain,token1)]);

  const sqrtPriceX96 = Number(slot0.sqrtPriceX96);
  const raw = (sqrtPriceX96 * sqrtPriceX96) / Math.pow(2,192);
  const price1Per0 = raw * Math.pow(10,t0.decimals - t1.decimals);

  const result = {
    type:"v3",
    address,
    token0:t0,
    token1:t1,
    price0:price1Per0,
    price1:1/price1Per0,
    liquidity:liquidity.toString(),
    fee:Number(fee)
  };

  v3PoolCache.set(cacheKey,result);
  return result;
}

/* =========================================================
   TOKEN OVERVIEW
========================================================= */
async function renderTokenTable(chain){
  const body = document.getElementById(chain+"TokenBody");
  const tokens = configuredTokens(chain);

  body.innerHTML = '<tr><td colspan="4" class="loading">Tokens werden geladen…</td></tr>';

  const rendered = [];

  for(const row of tokens){
    try{
      // Doppelte Sicherheitsprüfung:
      // Falls versehentlich doch ein V2-LP-Contract in der Tokenliste landet,
      // prüfen wir, ob token0()/token1() vorhanden sind und überspringen ihn.
      try{
        const maybePair = new ethers.Contract(
          row.address,
          ["function token0() view returns (address)","function token1() view returns (address)"],
          providers[chain]
        );

        await Promise.all([maybePair.token0(), maybePair.token1()]);

        console.warn("LP/Pool in Tokenliste übersprungen:", row.address);
        continue;
      }catch(_notPair){
        // Normaler ERC20-Token -> weiter
      }

      const token = await getToken(chain,row.address);
      const price = await getUSD(chain,token);
      if(price) exportProjectPrice(chain,token.address,price,"token");
      rendered.push({row,token,price});
    }catch(e){
      console.error("Tokenfehler",row.address,e);
    }
  }

  rendered.sort((a,b)=>a.token.symbol.localeCompare(b.token.symbol));
  body.innerHTML = "";

  for(const item of rendered){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="pair">${item.token.symbol}</div>
        <div class="small">${displayTokenLabel(item.row,item.token)}</div>
      </td>
      <td><div class="address">${item.token.address}</div></td>
      <td><div class="usd">${item.price ? usd(item.price.price) : "nicht verfügbar"}</div></td>
      <td>${item.price
        ? `<div class="route">${item.price.route}</div>
           ${Number.isFinite(item.price.pathLiquidityUSD)
             ? `<div class="small">Pfad-Liquidität: ${usd(item.price.pathLiquidityUSD)}</div>`
             : `<div class="small">Pfad-Liquidität: nicht aus V2-Reserven messbar</div>`}`
        : `<span class="error">Keine Preisroute gefunden</span>`}
      </td>`;
    body.appendChild(tr);
  }

  document.getElementById(chain+"TokenCount").textContent = rendered.length;
}

/* =========================================================
   V2 WALLET
========================================================= */

/* =========================================================
   RENDER V2
========================================================= */
async function renderV2Pool(chain,dbPool,wallet){
  const pool = await readV2Pool(chain,dbPool.address);
  const [price0,price1] = await Promise.all([
    getUSD(chain,pool.token0),
    getUSD(chain,pool.token1)
  ]);

  const value0 = price0 ? pool.r0*price0.price : null;
  const value1 = price1 ? pool.r1*price1.price : null;
  const tvl = value0 !== null && value1 !== null ? value0+value1 : null;
  const lpPrice = tvl !== null && pool.lpSupply > 0 ? tvl/pool.lpSupply : null;

  if(price0) exportProjectPrice(chain,pool.token0.address,price0,"token");
  if(price1) exportProjectPrice(chain,pool.token1.address,price1,"token");
  if(lpPrice !== null && Number.isFinite(lpPrice)){
    exportedPrices.set(chain + "|" + norm(dbPool.address), {
      price:lpPrice,
      change24h:undefined,
      source:"Projekt TLN/VOW · LP",
      route:`TVL / LP-Supply`,
      kind:"lp"
    });
  }


  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>
      <div class="badge">${displayPoolLabel(dbPool,pool)}</div>
      <div class="pair">${pool.token0.symbol} / ${pool.token1.symbol}</div>
      <div class="address">${pool.address}</div>
      <div class="small">LP Token: ${pool.lpSymbol}</div>
    </td>
    <td>
      <b>${pool.token0.symbol}</b>
      <div class="small">${pool.token0.name}</div>
      <div class="address">${pool.token0.address}</div>
    </td>
    <td>
      <b>${pool.token1.symbol}</b>
      <div class="small">${pool.token1.name}</div>
      <div class="address">${pool.token1.address}</div>
    </td>
    <td>
      ${fmt(pool.r0)} ${pool.token0.symbol}<br>
      ${fmt(pool.r1)} ${pool.token1.symbol}
    </td>
    <td>
      <div class="price">${fmt(pool.r1/pool.r0,12)}</div>
      <div class="small">${pool.token1.symbol}/${pool.token0.symbol}</div>
      <hr>
      <div class="price">${fmt(pool.r0/pool.r1,12)}</div>
      <div class="small">${pool.token0.symbol}/${pool.token1.symbol}</div>
    </td>
    <td>
      <div class="usd">${price0 ? usd(price0.price) : "nicht verfügbar"}</div>
      <div class="small">${pool.token0.symbol}</div>
      ${price0 ? `<div class="route">${price0.route}</div>${Number.isFinite(price0.pathLiquidityUSD)?`<div class="small">Pfad-Liq.: ${usd(price0.pathLiquidityUSD)}</div>`:""}` : ""}
      <hr>
      <div class="usd">${price1 ? usd(price1.price) : "nicht verfügbar"}</div>
      <div class="small">${pool.token1.symbol}</div>
      ${price1 ? `<div class="route">${price1.route}</div>${Number.isFinite(price1.pathLiquidityUSD)?`<div class="small">Pfad-Liq.: ${usd(price1.pathLiquidityUSD)}</div>`:""}` : ""}
    </td>
    <td>
      <div class="tvl">${tvl !== null ? usd(tvl) : "nicht verfügbar"}</div>
      <div class="small">
        ${pool.token0.symbol}: ${value0 !== null ? usd(value0) : "-"}<br>
        ${pool.token1.symbol}: ${value1 !== null ? usd(value1) : "-"}
      </div>
    </td>
    <td>
      <div class="lp">${lpPrice !== null ? usd(lpPrice) : "nicht verfügbar"}</div>
      <div class="small">Wert von 1 ${pool.lpSymbol}</div>
      <hr>
      <div class="small">Supply: ${fmt(pool.lpSupply,6)} ${pool.lpSymbol}</div>
      <div class="small">
        1 LP enthält:<br>
        ${pool.lpSupply ? fmt(pool.r0/pool.lpSupply,12) : "-"} ${pool.token0.symbol}<br>
        ${pool.lpSupply ? fmt(pool.r1/pool.lpSupply,12) : "-"} ${pool.token1.symbol}
      </div>
    </td>
  `;

  return {
    row:tr,
    tvl:tvl || 0
  };
}

/* =========================================================
   RENDER V3
========================================================= */
async function renderV3Pool(chain,dbPool){
  const pool = await readV3Pool(chain,dbPool.address);
  const [price0,price1] = await Promise.all([
    getUSD(chain,pool.token0),
    getUSD(chain,pool.token1)
  ]);
  if(price0) exportProjectPrice(chain,pool.token0.address,price0,"token");
  if(price1) exportProjectPrice(chain,pool.token1.address,price1,"token");

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>
      <div class="badge">${displayPoolLabel(dbPool,pool)}</div>
      <div class="pair">${pool.token0.symbol} / ${pool.token1.symbol}</div>
      <div class="address">${pool.address}</div>
      <div class="small">Uniswap V3 · Fee ${(pool.fee/10000).toFixed(2)}%</div>
    </td>
    <td>
      <b>${pool.token0.symbol}</b>
      <div class="small">${pool.token0.name}</div>
      <div class="address">${pool.token0.address}</div>
    </td>
    <td>
      <b>${pool.token1.symbol}</b>
      <div class="small">${pool.token1.name}</div>
      <div class="address">${pool.token1.address}</div>
    </td>
    <td>
      <div class="small">Current liquidity</div>
      <div class="price">${pool.liquidity}</div>
      <div class="small">V3-Liquidität ist tick-/positionsabhängig.</div>
    </td>
    <td>
      <div class="price">${fmt(pool.price0,12)}</div>
      <div class="small">${pool.token1.symbol}/${pool.token0.symbol}</div>
      <hr>
      <div class="price">${fmt(pool.price1,12)}</div>
      <div class="small">${pool.token0.symbol}/${pool.token1.symbol}</div>
    </td>
    <td>
      <div class="usd">${price0 ? usd(price0.price) : "nicht verfügbar"}</div>
      <div class="small">${pool.token0.symbol}</div>
      ${price0 ? `<div class="route">${price0.route}</div>${Number.isFinite(price0.pathLiquidityUSD)?`<div class="small">Pfad-Liq.: ${usd(price0.pathLiquidityUSD)}</div>`:""}` : ""}
      <hr>
      <div class="usd">${price1 ? usd(price1.price) : "nicht verfügbar"}</div>
      <div class="small">${pool.token1.symbol}</div>
      ${price1 ? `<div class="route">${price1.route}</div>${Number.isFinite(price1.pathLiquidityUSD)?`<div class="small">Pfad-Liq.: ${usd(price1.pathLiquidityUSD)}</div>`:""}` : ""}
    </td>
    <td>
      <div class="warning">V3</div>
      <div class="small">Keine einfache V2-Reserve-TVL. Für exakte V3-TVL müssten die aktiven NFT-Positionen/Ticks ausgewertet werden.</div>
    </td>
    <td>
      <div class="lp">Kein LP-Token</div>
      <div class="small">Uniswap V3 verwendet NFT-Liquiditätspositionen.</div>
    </td>
    `;

  return {row:tr,tvl:0};
}

/* =========================================================
   POOL TABLE
========================================================= */
async function renderPools(chain){
  const body = document.getElementById(chain+"PoolBody");
  const pools = configuredLPs(chain);

  body.innerHTML = '<tr><td colspan="8" class="loading">Pools werden geladen…</td></tr>';

  let totalTVL = 0;
  let processed = 0;
  body.innerHTML = "";

  if(!pools.length){
    body.innerHTML = '<tr><td colspan="8" class="note">Für diese Chain sind in Supabase noch keine TLN/VOW-Liquidity-Pools als <code>lp_token</code> konfiguriert.</td></tr>';
    document.getElementById(chain+"PoolCount").textContent = "0";
    document.getElementById(chain+"TVL").textContent = "-";
    return;
  }

  for(const dbPool of pools){
    const loading = document.createElement("tr");
    loading.innerHTML = `<td colspan="8" class="loading">${dbPool.label || dbPool.address}<br>lese Blockchain-Daten…</td>`;
    body.appendChild(loading);

    try{
      const type = await detectPoolType(chain,dbPool.address);
      const result = type === "v3"
        ? await renderV3Pool(chain,dbPool)
        : await renderV2Pool(chain,dbPool,null);

      body.replaceChild(result.row,loading);
      totalTVL += result.tvl;
      processed++;
    }catch(e){
      console.error("Poolfehler",dbPool.address,e);
      loading.innerHTML = `
        <td colspan="8" class="error">
          <b>${dbPool.label || "Pool"}</b><br>
          ${dbPool.address}<br><br>
          ${e.message}
        </td>`;
    }
  }

  document.getElementById(chain+"PoolCount").textContent = processed;
  document.getElementById(chain+"TVL").textContent = totalTVL ? usd(totalTVL) : "-";
}

/* =========================================================
   DASHBOARD LOAD
========================================================= */
async function loadDashboard(chain){
  const status = document.getElementById(chain+"Status");

  status.innerHTML = '<span class="loading">Supabase wird geladen…</span>';

  try{
    await loadSupabase();

    tokenCache.clear();
    pairCache.clear();
    priceCache.clear();
    v3PoolCache.clear();
    poolTypeCache.clear();
    projectChains.forEach(c => graphCache[c]=null);

    // USDT, USDC, WETH, WBNB, BTCB, BUSD anhand der echten
    // On-Chain-Symbole der in Supabase gepflegten Token bestimmen.
    await resolveReferences(chain);

    document.getElementById(chain+"Summary").style.display = "grid";

    const ref = references[chain];
    const stableRefs = [
      ref.usdt ? "USDT" : null,
      ref.usdc ? "USDC" : null,
      chain === "bsc" && ref.busd ? "BUSD" : null
    ].filter(Boolean);

    if(!stableRefs.length){
      status.innerHTML =
        `<span class="warning">Supabase verbunden, aber in den konfigurierten LPs wurde noch kein USDT/USDC${chain==="bsc"?"/BUSD":""}-Referenzasset erkannt.</span>`;
    }else{
      status.innerHTML =
        `<span class="success">Referenzen erkannt: ${stableRefs.join(", ")} · Preise werden on-chain berechnet.</span>`;
    }

    await renderTokenTable(chain);
    await renderPools(chain);

    status.innerHTML =
      `<span class="success">Fertig · ${configuredTokens(chain).length} Tokens · ${configuredLPs(chain).length} LP/Pool-Einträge aus Supabase.</span>`;
  }catch(e){
    console.error(e);
    status.innerHTML = `<span class="error">${e.message}</span>`;
  }
}

/* =========================================================
   TABS
========================================================= */
function switchChain(chain){
  document.getElementById("bscTab").classList.toggle("active",chain==="bsc");
  document.getElementById("ethTab").classList.toggle("active",chain==="eth");
  document.getElementById("bscPanel").classList.toggle("active",chain==="bsc");
  document.getElementById("ethPanel").classList.toggle("active",chain==="eth");
}

/* =========================================================
   START
========================================================= */
let initPromise = null;

function ensureLoaded(){
  if(!initPromise){
    initPromise = (async()=>{
      await loadProjectInfrastructure();
      await Promise.all(projectChains.filter(c => ["bsc","eth"].includes(c)).map(loadDashboard));
      return true;
    })();
  }
  return initPromise;
}

function getExportedPrice(chain,address){
  if(!address) return null;
  return exportedPrices.get(chain + "|" + norm(address)) || null;
}

return {
  ensureLoaded,
  switchChain,
  getPrice:getExportedPrice
};

})();
