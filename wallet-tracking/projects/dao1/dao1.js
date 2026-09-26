// Phase 6.24 · 26.09.2026 17:17:59 CEST: P5 UI-Fix: Die Claim-Spalte „APTM-Preis USD historisch“ liest den Stückpreis aus dem kanonischen Asset-Flow statt aus dem Legacy-Transaktionsfeld aptm_usd. Build 20260926-171759.
// Phase 6.21 · 26.09.2026 12:12:27 CEST: P5 Claims/Payouts: sichtbare Claim-/Export-Lesepfade verwenden ausschliesslich kanonische Asset-Flows; Legacy Reward-Felder sind kein führender Read-Pfad mehr. Build 20260926-121227.
// Phase 6.18 · 25.09.2026 18:33:32 CEST: P4: Release-Metadaten synchronisiert; DAO1-Ownership-/Kaufpreis-Fachlogik unverändert. Build 20260925-183332.
// Phase 6.12 · 24.09.2026 18:30:01 CEST: P3 Realtest abgeschlossen; Kaufpreis-Evidenz wird für den NFT-Tab persistent vorgewärmt. P4: Fresh-Build speichert ERC-20-Flows nur einmal roh und bewertet historische USD-Werte gezielt im Claim-/Detailpfad statt jede Explorer-Seite doppelt zu persistieren/bewerten. Build 20260924-183001.
// Phase 6.11 · 24.09.2026 17:32:01 CEST: P3 Kaufpreis-Regression behoben: Zahlungsresolver zentralisiert; preisloser Wallet-Eingang fällt auf globale NFT-Lifecycle-Kauf-Tx zurück; Resolver v3 revidiert alte Negativbefunde. Build 20260924-173201.
// Phase 6.10 · 24.09.2026 16:30:30 CEST: P3 Kaufpreis-/Ersterwerb-Diagnose und P4 Lifecycle-Timings; Kontrollfälle #38483/#40938 protokollieren Erwerbs-Tx und Zahlungskandidaten. Build 20260924-163030.
// Phase 6.09 · 24.09.2026 14:22:47 CEST: Audit P3 Cache-Priorität korrigiert: frischer DB-Ownership-Read darf im selben Fresh-Build nicht mehr durch einen älteren Shared-Cache überschrieben werden. Build 20260924-142247.
// Phase 6.08 · 24.09.2026 12:31:39 CEST: Audit P3 trennt Lifecycle-Besitzabdeckung vom strengeren Ownership-/Erwerbs-Repair; DB-Fresh-Read bleibt als Verifikation aktiv. Build 20260924-123139.
// Phase 6.04 · 23.09.2026 02:51:28 CEST: Audit P3 Fresh-Build-Parität: historische NFT-Kandidaten aus Wallet-Transferhistorie bekannter Projekt-Contracts; Ownership deterministisch ohne Alt-Cache-Voraussetzung; Legacy-Self-Heal vom automatischen Fresh-Build entkoppelt. Build 20260923-025128.
// Phase 6.03 · 23.09.2026 01:44:44 CEST: Release-Metadaten mit Audit P2 synchronisiert; DAO1-Lifecycle-Vertrag aus P1 unverändert, wird vom zentralen Fresh-Build-Snapshot-Gate ausgewertet. Build 20260923-014444.
// Phase 5.99 · 23.09.2026 00:15:00 CEST: DAO1 Fresh-Build stabilisiert: frisch geladene Apertum-NFTs sofort in DAO1 übernehmen; native Claim-Payouts zusätzlich via RPC-Trace; historische APTM-Preise primär per historischem getReserves statt Log-Massenscan. Build 20260923-001500.
// Phase 5.98 · 22.09.2026 23:40:05 CEST: DAO1 Fresh-Import beschleunigt: nach vollständigem Wallet-ERC20-Scan keine hunderten Tx-Detailrequests; native Claim-Evidenz parallelisiert und gecacht. Build 20260922-234005.
// Phase 5.96 · 22.09.2026 21:35:26 CEST: DAO1 Fresh-Build ergänzt inkrementelle ERC-20 Asset-Flows für relevante Wallets; Claim-Logs RPC-first; unnötiger ERC-721/1155-Claim-Request entfernt. Build 20260922-213526.
// Phase 5.93 · 22.09.2026 12:15:22 CEST: Server-RPC-Proxy passend zum lokalen Gate mit enger APTMDAO ownerOf/Parent-eth_call-Allowlist; Migration v4 kann erneut prüfen. Build 20260922-121522.
// Phase 5.88 · 22.09.2026 02:20:48 CEST: APTMDAO-Identitäts-NFTs zählen als DID; zentraler NFT-Typadapter für DID/MineBot/TradeBot; manueller NFT-Refresh kann offene Ownership-Lücken gezielt reparieren. Build 20260922-022048.
// Phase 5.87 · 22.09.2026 01:36:51 CEST: DAO1 Self-Heal für vor 5.82 hinzugefügte Wallets: fehlende/invollständige NFT-Ownership wird aus dem zentralen Current-State erkannt und gezielt nachgezogen; bekannte DID-Contracts werden ohne manuelle project_nfts-Klassifizierung korrekt gezählt. Build 20260922-013651.
// Phase 5.86 · 22.09.2026 01:06:00 CEST: DAO1 Übersicht verwendet die bestehenden allgemeinen Summary-Karten; Bot-Summen zählen nur den eindeutigen aktuellen Bestand, historische/Transfer-Zuordnungen bleiben Detaildaten. Build 20260922-010600.
// Phase 5.85 · 22.09.2026 00:53:12 CEST: Hotfix – DAO1 Übersicht wird beim ersten Öffnen des Projekts sofort gerendert, ohne dass der Übersicht-Untertab zuerst manuell angeklickt werden muss. Build 20260922-005312.
// Phase 5.84 · 22.09.2026 00:38:20 CEST: DAO1 Übersicht erhält cache-basierte Summary-Kacheln für Wallets, Bots, DIDs/Membership, Bot-Claims, Referral-Rewards und wallet-zentrierte Team-Partner. Build 20260922-003820.
// Phase 5.79: DAO Team vereinfacht: nur noch eine wallet-zentrierte User-Ansicht; alte/neue Einzelgraphen bleiben intern/DEV-Nachweis, nicht als normale Tabs.
// Phase 5.78: DAO-Team ergänzt einen 24h-IndexedDB-Current-State-Cache pro fremdem Partner-Wallet/NFT-Contract; History/Kaufpreis/DID bleiben separat. Navigation/History-Sessioncache unverändert fachlich.
// Phase 5.75: Cache-/Request-Audit: zentrale NFT-/Ownership-RAM-Daten werden für Dashboard/Initialload geteilt, historische Metadaten blockieren den DAO-Start nicht mehr und identische Tree-Scans werden in-flight dedupliziert.
// Phase 5.73: Team-Bot-Bestand nutzt dieselbe zentrale nft_cache-Klassifikation wie der NFT-Tab; Trading-Bot-Contracts werden daraus abgeleitet, Bestand und Kaufpreis-Abdeckung werden getrennt angezeigt.
// Phase 5.69: Partner-Identity und Bot-Bestand laufen unabhaengig; ein langsamer Identity-Contract darf Bot-Zahlen nicht blockieren.
// Phase 5.60: Direkte DAO1/APTMDAO-Uplines bleiben oberhalb eigener Wallets sichtbar; weiter geladene Ancestors werden nicht mehr als zusätzliche Team-Roots gerendert.
// WalletTracking Phase 5.79 · 21.09.2026 17:57:25 CEST · Build 20260921-175725
window.DAO1Project = (() => {
  const PROJECT_KEY = "dao1";
  const PROJECT_NAME = "DAO1";
  // Lokaler HTML-Escaper: dao1.js darf nicht von einem globalen Helper abhängen.
  function escapeHtml(value){
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
  const CHAIN_KEY = "apertum";
  const CLAIM_SELECTOR = "0x86bb8f37";
  const NEW_MINER_CLAIM_SELECTOR = "0x19da4078";
  function isKnownClaimSelector(value){
    const v=String(value||"").toLowerCase();
    return v===CLAIM_SELECTOR || v===NEW_MINER_CLAIM_SELECTOR;
  }
  function isNewMinerClaimSelector(value){
    return String(value||"").toLowerCase()===NEW_MINER_CLAIM_SELECTOR;
  }
  function isClaimTxRow(r){
    return r?.claim_nft_id!=null
      || !!r?.claim_nft_name
      || isKnownClaimSelector(r?.selector);
  }
  // Verifizierter DAO1-Referral-Kontrollfall vom 24.02.2025:
  // Nur dieses DAO1-Wallet hatte Referral-Partner. Ein Referral Reward ist ein
  // withdraw/Contract-Call an den Referral-Contract mit tatsächlichem wUSDT-
  // Rückfluss aus demselben Contract an dasselbe Wallet.
  const REFERRAL_WALLET = "0x239c5822a0d2a67e629d7a3b5c8180721e228b47";
  const REFERRAL_REWARD_CONTRACT = "0xcd40d3bcfc29c51edb1fdd78580578362366f856";
  const REFERRAL_WUSDT_TOKEN = "0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f";
  const SYSTEM_ADDRESS = "0x0200000000000000000000000000000000000001";
  const PAIR_ADDRESS = "0x38AcBfA5108D3c76d6cEa4D380182E832A289b57";
  // Erster on-chain definierter wAPTM/wUSDT-Marktpreis: Pair-Erstellung + erste Liquidität.
  const APTM_MARKET_START_BLOCK = 88356;
  const APTM_MARKET_START_UTC = "2025-02-18T12:39:52Z";
  const SYNC_TOPIC = "0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1";
  const PRICE_SOURCE_TAG = "exact-v13";
  const PRICE_MISSING_TAG = "missing-v13";
  const PRICE_PRELAUNCH_TAG = "prelaunch-no-market-v13";
  const PRICE_LOOKBACK_BLOCKS = 10000;
  const PRICE_ANCHOR_VERSION = 1;
  const PRICE_ANCHOR_LOCAL_LOOKBACK = 512;
  const PRICE_ANCHOR_CLUSTER_GAP = 512;
  const PRICE_ANCHOR_CLUSTER_MAX_SPAN = 4096;
  const PRICE_ANCHOR_CONCURRENCY = 8;
  const PRICE_COVERAGE_VERSION = 1;
  const PRICE_RPC_CHUNK = 25000;
  const PRICE_RPC_CONCURRENCY = 6;
  const RPC_URL = "https://rpc.apertum.io/ext/bc/YDJ1r9RMkewATmA7B35q1bdV18aywzmdiXwd9zGBq3uQjsCnn/rpc";
  const EXPLORER_API = "https://explorer.apertum.io/api/v2";
  const EXPLORER = "https://explorer.apertum.io";
  const DEFAULT_MINER_NFT_CONTRACT = "0xa1b761890c36e356f49F9DF8D495FcFFa76857ad";
  // DAO1 Team Discovery: alte und neue Struktur bleiben strikt getrennt.
  const DAO1_OLD_DID_CONTRACT = "0xde72695e54bb44beb1844c35cd3ea50f4f785f2d";
  const APTMDAO_NFT_CONTRACT = "0x0e1d3df5ce689df2c429216fb44caec064acbbaa";
  const APTMDAO_MANAGER_CONTRACT = "0x086b060acc9aa8b4eef2132f9f247b4aecf92544";
  const DAO1_OLD_TREE_START_BLOCK = 0;
  const DAO1_TEAM_MAX_LEVELS = 20;
  const DAO1_TEAM_RPC_CHUNK = 25000;
  const DAO1_OLD_TREE_CACHE_TABLE = "dao1_old_tree_graph_cache";
  const DAO1_OLD_TREE_STATE_TABLE = "dao1_old_tree_graph_state";
  const DAO1_OLD_TREE_CACHE_PAGE_SIZE = 1000;
  const DAO1_OLD_TREE_OVERLAP_BLOCKS = 24;
  const DATA_VERSIONS_TABLE = "cache_data_versions";
  const DAO1_OLD_TREE_BROWSER_NAMESPACE = "dao1";
  const DAO1_OLD_TREE_BROWSER_KEY = "legacy-tree";
  // Erhöhen, wenn bestehende DB-Zeilen wegen neuer/anders interpretierter Felder neu
  // in den Browser müssen. Neue DB-Spalten werden durch select("*") vollständig übernommen.
  const DAO1_OLD_TREE_PAYLOAD_SCHEMA_VERSION = 1;
  const DAO1_OLD_TREE_BROWSER_STORAGE_VERSION = 2; // parent_id-Index für gezielte Subtree-Lesezugriffe
  let dao1OldTreeDbAvailable = true;
  const DAO1_OLD_MINT_TOPIC = ethers.id("TokenMinted(address,uint256,uint256)").toLowerCase();
  // Neuer APTMDAO-Tree: im Explorer verifizierter Mint-Event am NFT-Contract.
  // topics[1]=child/APTMDAO-ID, topics[2]=parent/APTMDAO-ID, topics[3]=Wallet.
  const APTMDAO_TREE_EVENT_TOPIC = "0x18a46b287f917ee6700022efc6b411a7673b28ef6f5aa227aea3bf31d9b3c194";
  const APTMDAO_TREE_CACHE_TABLE = "aptmdao_tree_graph_cache";
  const APTMDAO_TREE_STATE_TABLE = "aptmdao_tree_graph_state";
  const APTMDAO_TREE_BROWSER_KEY = "aptmdao-tree";
  const APTMDAO_TREE_PAYLOAD_SCHEMA_VERSION = 1;
  const APTMDAO_TREE_BROWSER_STORAGE_VERSION = 2;
  const APTMDAO_TREE_OVERLAP_BLOCKS = 24;
  const APTMDAO_TREE_RPC_CHUNK = 250000;
  let aptmdaoTreeDbAvailable = true;

  let sb = null;
  let getContext = null;
  let mounted = false;
  let loaded = false;
  let projectRefs = [];
  let miners = [];
  let rewardRows = [];
  let ownershipRows = [];
  let ownershipRowsSource = "none";
  let ownershipRowsUserId = "";
  let ownershipLoadPromise=null;
  let selectedWalletId = "";
  let selectedNftId = "";
  let manualNftId = "";
  let nftMetaById = new Map();
  let currentApertumNfts = [];
  // Ownership refresh performance caches. Wallet transfer history and direct
  // on-chain logs are reused within the session instead of rescanning per NFT.
  const ownershipWalletTransferCache=new Map();
  const ownershipDirectTransferCache=new Map();
  const dao1TokenMetaCache=new Map();

  let projectNfts = [];
  let selectedNftClass = "Mining-Bot";
  const CLAIM_SCAN_BUFFER_BLOCKS = 250;
  const CLAIM_SCAN_TYPE = "claims_wallet_v2";
  const TX_SCAN_TYPE = "transactions_wallet_v1";
  const TOKEN_FLOW_SCAN_TYPE = "token_flows_wallet_v2";
  let transactionRows = [];
  let transactionAssetFlows = [];
  // Phase 5.77: gemeinsame Session-Caches für DAO-Historie. Claims, Referral-Rewards
  // und Übersicht dürfen dieselben bereits gelesenen Supabase-Zeilen wiederverwenden.
  const daoHistoryTxCache=new Map();
  const daoHistoryFlowCache=new Map();
  const daoHistoryTxInflight=new Map();
  const daoHistoryFlowInflight=new Map();
  let txFilterWallet = "";
  const dao1TodayIso=()=>{
    const d=new Date();
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  };
  const DAO1_DEFAULT_FROM="2025-01-01";
  let txFilterFrom = DAO1_DEFAULT_FROM;
  let txFilterTo = dao1TodayIso();
  let txFilterKind = "__all";
  let txFilterClass = "__all";
  let txFilterNft = "__all";
  let claimFilterWallet = "__all";
  let claimFilterNft = "__all";
  let referralFilterWallet = "__all";
  let transactionJobToken = 0;
  let activePriceJobLog = null;
  let priceJobTimer = null;

  function fmtElapsed(ms){
    const total=Math.max(0,Math.floor(Number(ms||0)/1000));
    const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),sec=total%60;
    return h>0?`${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`:`${m}:${String(sec).padStart(2,"0")}`;
  }

  function renderPriceJobLog(){
    const panel=document.getElementById("dao1PriceJobPanel");
    const metrics=document.getElementById("dao1PriceJobMetrics");
    const logEl=document.getElementById("dao1PriceJobLog");
    if(!panel||!metrics||!logEl)return;
    if(!activePriceJobLog){
      panel.style.display="block";
      metrics.textContent="Noch kein historischer Preisjob in dieser Sitzung.";
      logEl.textContent="Bereit.";
      return;
    }
    const x=activePriceJobLog;
    const elapsed=Date.now()-x.startedAt;
    panel.style.display="block";
    metrics.innerHTML=`
      <span>Laufzeit: <strong>${fmtElapsed(elapsed)}</strong></span>
      <span>TX: <strong>${x.txCount.toLocaleString("de-DE")}</strong></span>
      <span>Preisblöcke: <strong>${x.blockCount.toLocaleString("de-DE")}</strong></span>
      <span>Anchor-Cache: <strong>${x.anchorHits.toLocaleString("de-DE")}</strong></span>
      <span>Anchors neu: <strong>${x.anchorScans.toLocaleString("de-DE")}</strong></span>
      <span>Null-Anker neu geprüft: <strong>${Number(x.nullAnchorsRechecked||0).toLocaleString("de-DE")}</strong></span>
      <span>Legacy-Anker genutzt: <strong>${Number(x.legacyAnchorHits||0).toLocaleString("de-DE")}</strong></span>
      <span>Syncs verarbeitet: <strong>${x.syncLogs.toLocaleString("de-DE")}</strong></span>
      <span>RPC-Requests: <strong>${x.rpcChunks.toLocaleString("de-DE")}</strong></span>
      <span>DB-Batches: <strong>${x.dbBatches.toLocaleString("de-DE")}</strong></span>`;
    logEl.textContent=x.lines.join("\n")||"Bereit.";
    logEl.scrollTop=logEl.scrollHeight;
  }

  function priceJobLogText(){
    if(!activePriceJobLog)return "DAO1 / Apertum – Historische Preis-Neuberechnung\nKein Laufzeitlog vorhanden.\n";
    const x=activePriceJobLog;
    const header=[
      "DAO1 / Apertum – Historische Preis-Neuberechnung",
      `Preislogik: ${PRICE_SOURCE_TAG}`,
      `Laufzeit: ${fmtElapsed(Date.now()-x.startedAt)}`,
      `TX: ${x.txCount}`,
      `Preisblöcke: ${x.blockCount}`,
      `Anchor-Cache: ${x.anchorHits}`,
      `Anchors neu: ${x.anchorScans}`,
      `Null-Anker neu geprüft: ${Number(x.nullAnchorsRechecked||0)}`,
      `Legacy-Anker genutzt: ${Number(x.legacyAnchorHits||0)}`,
      `Syncs verarbeitet: ${x.syncLogs}`,
      `RPC-Requests: ${x.rpcChunks}`,
      `DB-Batches: ${x.dbBatches}`,
      ""
    ];
    return header.concat(x.lines||[]).join("\n")+"\n";
  }

  async function copyPriceJobLog(){
    const text=priceJobLogText();
    try{
      await navigator.clipboard.writeText(text);
      const state=document.getElementById("dao1PriceJobLogState");
      if(state)state.textContent="Log kopiert.";
    }catch(e){
      const el=document.getElementById("dao1PriceJobLog");
      if(el){el.focus();el.select?.();}
      throw e;
    }
  }

  function exportPriceJobLog(){
    const blob=new Blob([priceJobLogText()],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    a.href=url;a.download=`dao1-apertum-preisjob_${stamp}.txt`;
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    const state=document.getElementById("dao1PriceJobLogState");
    if(state)state.textContent="Log als TXT exportiert.";
  }

  function priceJobStart(txCount=0,blockCount=0){
    if(priceJobTimer){clearInterval(priceJobTimer);priceJobTimer=null;}
    activePriceJobLog={startedAt:Date.now(),txCount:Number(txCount||0),blockCount:Number(blockCount||0),anchorHits:0,anchorScans:0,nullAnchorsRechecked:0,legacyAnchorHits:0,coverageHits:0,coverageScans:0,syncLogs:0,rpcChunks:0,dbBatches:0,missingDiagnostics:[],lines:[]};
    priceJobLog(`Start · ${Number(txCount||0).toLocaleString("de-DE")} TX · ${Number(blockCount||0).toLocaleString("de-DE")} Preisblöcke`);
    priceJobTimer=setInterval(renderPriceJobLog,1000);
    renderPriceJobLog();
  }

  function priceJobLog(message){
    if(!activePriceJobLog)return;
    const elapsed=fmtElapsed(Date.now()-activePriceJobLog.startedAt);
    activePriceJobLog.lines.push(`[${elapsed}] ${String(message||"")}`);
    renderPriceJobLog();
  }

  function priceJobStop(){
    if(priceJobTimer){clearInterval(priceJobTimer);priceJobTimer=null;}
    renderPriceJobLog();
  }

  const DB_PAGE_SIZE = 1000;
  let miningFilterFrom = DAO1_DEFAULT_FROM;
  let miningFilterTo = dao1TodayIso();
  let miningFilterClass = "__all";
  let miningFilterNft = "__all";

  const H = x => typeof x === "string" ? x : (x?.hash || "");
  const lower = x => String(x || "").toLowerCase();

  // Blockscout liefert Adressen je nach Endpoint/Cache in unterschiedlichen Formen.
  // Für Ownership niemals nur auf `.hash` verlassen.
  function transferAddress(value, fallback=""){
    if(typeof value==="string")return lower(value);
    if(value && typeof value==="object"){
      return lower(
        value.hash ??
        value.address ??
        value.address_hash ??
        value.addressHash ??
        value.value ??
        fallback ??
        ""
      );
    }
    return lower(fallback||"");
  }

  function transferFromAddress(t){
    return transferAddress(t?.from, t?.from_address ?? t?.fromAddress ?? t?.from_hash ?? "");
  }
  function transferToAddress(t){
    return transferAddress(t?.to, t?.to_address ?? t?.toAddress ?? t?.to_hash ?? "");
  }
  const fmt = n => new Intl.NumberFormat("de-CH", { maximumFractionDigits: 8 }).format(Number(n || 0));
  const usd = n => n == null ? "–" : new Intl.NumberFormat("de-CH", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);

  function configure(opts) {
    sb = opts?.sb || sb;
    getContext = opts?.getContext || getContext;
  }

  async function ensureMounted() {
    if (mounted) return;
    const group = document.getElementById("defiProjectsNavGroup");
    const nav = group?.querySelector(".tab-nav");
    if (nav && !document.getElementById("dao1TabBtn")) {
      const btn = document.createElement("button");
      btn.className = "tab-btn";
      btn.id = "dao1TabBtn";
      btn.dataset.tab = "dao1";
      btn.style.display = "none";
      btn.textContent = "DAO1";
      btn.onclick = () => window.showTab?.("dao1");
      nav.appendChild(btn);
    }

    // Projekt-Panels gehören in denselben Content-Container wie TLN/VOW.
    // Direktes Anhängen an #appContent würde das CSS-Grid umgehen und DAO1
    // unter/über die linke Navigation laufen lassen.
    const app = document.querySelector("#appContent .app-main") || document.getElementById("appContent");
    if (app && !document.getElementById("tab-dao1")) {
      const panel = document.createElement("div");
      panel.id = "tab-dao1";
      panel.className = "tab-panel";
      panel.innerHTML = `
        <div class="project-subtabs"><button class="tab-btn active" onclick="DAO1Project.switchSubtab('overview',this)">Übersicht</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('transactions',this)">Transaktionen</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('claims',this)">Bot-Claims</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('referrals',this)">Referral Rewards</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('team',this)">Team</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('liquidity',this); renderProjectLpTab('dao1',['apertum'],'dao1LpContent','2025-12-31',false)">Liquidity Pools</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('config',this)">Konfiguration</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('help',this)">Hilfe</button></div>
        <div id="dao1-subtab-overview" class="project-subtab-panel"><div class="custom-token-card"><div class="chain-title">DAO1 · Apertum</div><div class="note">Projektübersicht für DAO1-spezifische Assets auf Apertum. Detailfunktionen sind in die Unter-Tabs gegliedert.</div></div></div>
        <div id="dao1-subtab-claims" class="project-subtab-panel" style="display:none"><div id="dao1ClaimsContent"></div></div>
        <div id="dao1-subtab-referrals" class="project-subtab-panel" style="display:none"><div id="dao1ReferralContent"></div></div>
        <div id="dao1-subtab-team" class="project-subtab-panel" style="display:none"><div id="dao1TeamContent"></div></div>
        <div id="dao1-subtab-liquidity" class="project-subtab-panel" style="display:none"><div id="dao1LpContent"></div></div>
        <div id="dao1-subtab-config" class="project-subtab-panel" style="display:none"><div id="dao1AssetSummary" class="custom-token-card"><span class="loading">Projekt-Konfiguration wird geladen…</span></div></div>
        <div id="dao1-subtab-transactions" class="project-subtab-panel" style="display:none"><div class="custom-token-card"><div class="chain-title">📒 Apertum Transaktionshistorie</div><div class="note" style="margin-bottom:10px">Zentrale, dauerhaft gespeicherte Apertum-Historie. Wallet-Wechsel lesen den Cache; erst „Daten aktualisieren“ lädt neue Blockchain-Daten, aktualisiert NFTs/Besitzerhistorie und reichert neue Claims an.</div><div id="dao1TransactionControls"></div><div id="dao1TransactionStatus" class="status" style="margin-top:10px"></div>
        <div id="dao1PriceJobPanel" class="custom-token-card debug-frame" style="margin-top:10px;padding:10px 12px">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><strong>⏱️ Historische Preis-Neuberechnung · Diagnose-Log</strong><button type="button" class="secondary" onclick="DAO1Project.copyPriceJobLog()">Log kopieren</button><button type="button" class="secondary" onclick="DAO1Project.exportPriceJobLog()">Log als TXT exportieren</button><span id="dao1PriceJobLogState" class="meta">Eigenes Log-Fenster wie in Discovery; vollständig kopier- und exportierbar.</span></div>
          <div id="dao1PriceJobMetrics" style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:8px" class="meta">Noch kein historischer Preisjob in dieser Sitzung.</div>
          <textarea id="dao1PriceJobLog" readonly spellcheck="false" style="width:100%;min-height:260px;max-height:420px;resize:vertical;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.45;background:var(--card,#111);color:inherit;border:1px solid rgba(128,128,128,.25);border-radius:8px;padding:10px;box-sizing:border-box">Bereit.</textarea>
        </div><div id="dao1TransactionSummary" style="margin-top:10px"></div><div id="dao1TransactionTable" style="margin-top:10px"></div></div></div>
        <div id="dao1-subtab-help" class="project-subtab-panel" style="display:none">
          <div id="dao1HelpContent"><div class="status"><span class="loading">DAO1-Hilfe wird geladen…</span></div></div>
        </div>
      `;
      app.appendChild(panel);
    }
    mounted = true;
  }

  async function switchSubtab(name,button){
    document.querySelectorAll("#tab-dao1 .project-subtab-panel").forEach(x=>x.style.display="none");
    const el=document.getElementById("dao1-subtab-"+name);
    if(el)el.style.display="block";
    document.querySelectorAll("#tab-dao1 .project-subtabs .tab-btn").forEach(x=>x.classList.remove("active"));
    button?.classList.add("active");

    // Beim ersten Öffnen des Transaktions-Tabs muss der gespeicherte Cache sofort geladen
    // werden. Bisher wurde nur das Panel angezeigt; erst ein Wallet-Filterwechsel löste
    // refreshTransactionHistory(false) aus. Dadurch war "Alle Apertum-Wallets" initial leer.
    if(name==="overview"){
      await renderDAO1BotOverview();
    }else if(name==="transactions"){
      await refreshTransactionHistory(false);
    }else if(name==="help"){
      if(typeof window.renderDAO1Help==="function")window.renderDAO1Help();
    }else if(name==="team"){
      renderDAO1TeamTab();
    }else if(name==="claims" || name==="referrals"){
      const wallets=allProjectWalletOptions();
      transactionRows=await loadAllApertumTransactionRows(wallets,null);
      transactionAssetFlows=await loadAllAssetFlowRows(wallets);
      if(name==="claims")renderClaimsTab();
      if(name==="referrals")renderReferralRewardsTab();
    }
  }

  async function refreshConfig() {
    if (!sb) return;
    const { data, error } = await sb.from("defi_project_tokens").select("*").eq("project_key", PROJECT_KEY).eq("enabled", true);
    if (error) {
      console.warn("DAO1 Projekt-Referenzen:", error);
      projectRefs = [];
    } else projectRefs = data || [];
    await loadMiners();
    await loadProjectNfts();
    await loadOwnershipCache({preferShared:true});
    const walletsNow=projectWallets();
    if(!walletsNow.some(w=>String(w.id)===String(selectedWalletId))) selectedWalletId=String(walletsNow[0]?.id||"");
    await loadCurrentApertumNfts();
    renderMinerSelector();
    renderNftClassification();
    renderAssetSummary();
    renderMiningFilters();
    renderTransactionControls();
    if(!txFilterWallet) txFilterWallet="__all";
    // Transaktions-/Flow-Historie wird erst vom jeweiligen Untertab geladen.
    // Historische NFT-Namen werden ebenfalls nachgelagert und blockieren den Current-State-Start nicht.
    enrichHistoricalNftNames().then(()=>renderNftClassification()).catch(e=>console.warn("Historische NFT-Metadaten:",e));
    updateVisibility();
    // Audit P3: Der Legacy-Self-Heal ist kein Bestandteil mehr der Fresh-Build-
    // Korrektheit und darf nicht parallel vor dem eigentlichen Wallet-Bootstrap laufen.
    // Bestehende Altbestände bleiben ein separater Legacy-/Reparaturpfad; die
    // Fresh-Build-Korrektheit hängt nicht mehr von diesem Session-Self-Heal ab.
  }

  function assetMatches(chain, address, isNative, ctx) {
    if (isNative && chain === CHAIN_KEY) {
      return projectRefs.some(r => r.chain_key === CHAIN_KEY && r.role === "native");
    }
    const normalized = address ? ctx.normalizeAddress(address, chain) : "";
    const key = chain + "|" + normalized;
    if (ctx.predefinedTokenProject[key] === PROJECT_KEY && ctx.predefinedTokenCategory[key]) return true;
    return projectRefs.some(r => r.chain_key === chain && r.contract_address && lower(r.contract_address) === lower(normalized));
  }

  function hasProjectAsset() {
    const ctx = getContext?.();
    if (!ctx) return false;
    for (const w of (ctx.wallets || [])) {
      for (const chain of Object.keys(ctx.chainMeta || {})) {
        const cd = (ctx.walletData?.[w.id] || {})[chain];
        if (!cd || cd.error) continue;
        if (Number(cd.native || 0) >= (ctx.dustThreshold || 0) && assetMatches(chain, null, true, ctx)) return true;
        for (const t of (cd.tokens || [])) {
          if (Number(t.amount || 0) < (ctx.dustThreshold || 0)) continue;
          if (assetMatches(chain, t.address, false, ctx)) return true;
        }
      }
    }
    for (const snap of (ctx.snapshots || [])) {
      for (const it of (snap.items || [])) {
        if (Number(it.amount || 0) < (ctx.dustThreshold || 0)) continue;
        if (assetMatches(it.chain, it.address, !!it.is_native, ctx)) return true;
      }
    }
    return false;
  }

  function updateVisibility() {
    const visible = hasProjectAsset();
    const btn = document.getElementById("dao1TabBtn");
    if (btn) btn.style.display = visible ? "inline-block" : "none";
    window.updateDefiProjectsNavGroupVisibility?.();
    const panel = document.getElementById("tab-dao1");
    if (!visible && panel?.classList.contains("active")) window.showTab?.("tracking");
    return visible;
  }

  function renderAssetSummary() {
    const el = document.getElementById("dao1AssetSummary");
    if (!el) return;
    const refs = projectRefs.map(r => `<div class="custom-token-row"><div><strong>${r.symbol || r.role || "Asset"}</strong><div class="meta">${r.chain_key} · ${r.role}${r.contract_address ? " · " + r.contract_address : ""}</div></div></div>`).join("");
    el.innerHTML = `
      <span class="field-label">DAO1 Projekt-Konfiguration</span>
      ${refs || '<div class="empty">Noch keine DAO1-Projektassets in Supabase konfiguriert.</div>'}
      <details id="dao1NftClassificationDetails" style="margin-top:14px">
        <summary style="cursor:pointer;font-weight:700;display:flex;align-items:center;justify-content:space-between;gap:10px">
          <span>🏷️ DAO1 NFT-Klassifizierung</span>
          <button type="button" class="secondary" style="padding:5px 8px;font-size:.78rem"
            onclick="event.preventDefault();event.stopPropagation();DAO1Project.openNftTabForSelectedWallet()">NFT-Tab öffnen</button>
        </summary>
        <div id="dao1NftClassification" style="margin-top:10px"></div>
      </details>`;
    renderNftClassification();
  }


  function walletHasProjectAsset(wallet) {
    const ctx = getContext?.();
    if (!ctx || !wallet) return false;
    for (const chain of Object.keys(ctx.chainMeta || {})) {
      const cd = (ctx.walletData?.[wallet.id] || {})[chain];
      if (cd && !cd.error) {
        if (Number(cd.native || 0) >= (ctx.dustThreshold || 0) && assetMatches(chain, null, true, ctx)) return true;
        if ((cd.tokens || []).some(t => Number(t.amount || 0) >= (ctx.dustThreshold || 0) && assetMatches(chain, t.address, false, ctx))) return true;
      }
    }
    return (ctx.snapshots || []).some(snap =>
      (snap.items || []).some(it =>
        String(it.wallet_id ?? it.walletId ?? "") === String(wallet.id) &&
        Number(it.amount || 0) >= (ctx.dustThreshold || 0) &&
        assetMatches(it.chain, it.address, !!it.is_native, ctx)
      )
    );
  }

  function walletHasProjectNft(wallet){
    const walletId=String(wallet?.dbId||wallet?.id||"");
    const address=lower(walletAddress(wallet)||"");
    if(walletId&&window.isCentralNftCacheLoaded?.()){
      const cached=window.getCachedNftsForWalletId?.(walletId);
      if(Array.isArray(cached)&&cached.some(n=>String(n?.chain||"")===CHAIN_KEY&&!(n?.possibleSpam||n?.userMarkedSpam)))return true;
    }
    return ownershipRows.some(o=>
      String(o?.chain_key||CHAIN_KEY)===CHAIN_KEY &&
      (String(o?.wallet_id||"")===walletId || (!!address&&lower(o?.wallet_address||"")===address))
    );
  }

  function projectWallets() {
    const ctx = getContext?.();
    return (ctx?.wallets || []).filter(w=>walletHasProjectAsset(w)||walletHasProjectNft(w));
  }

  function walletAddress(wallet) {
    return String(wallet?.evm || "").trim();
  }

  function walletByAddress(address){
    const a=lower(address);
    const ctx=getContext?.();
    return (ctx?.wallets||[]).find(w=>lower(walletAddress(w))===a) || null;
  }

  function walletByDbId(walletId){
    const id=String(walletId||"");
    const ctx=getContext?.();
    return (ctx?.wallets||[]).find(w=>String(w?.dbId||w?.id||"")===id) || null;
  }

  function walletIdForAddress(address){
    const w=walletByAddress(address);
    const id=String(w?.dbId||w?.id||"").trim();
    if(!id || id.startsWith("local")) throw new Error(`Gespeicherte Wallet-ID für ${lower(address)||"Wallet"} fehlt.`);
    return id;
  }

  function hydratePrivateWalletAddress(row){
    if(!row)return row;
    const w=walletByDbId(row.wallet_id);
    return {...row,wallet_address:walletAddress(w)||row.wallet_address||""};
  }


  const NFT_SUBTYPES = ["Mining-Bot","Trading-Bot","DID","DAO / Membership","Sonstige"];
  function categoryForSubtype(subtype){
    if(subtype==="Mining-Bot" || subtype==="Trading-Bot") return "Bot";
    if(subtype==="DID") return "Identity";
    if(subtype==="DAO / Membership") return "Membership";
    return "Other";
  }
  function classificationFor(contract,id){
    return projectNfts.find(n =>
      n.project_key===PROJECT_KEY &&
      n.chain_key===CHAIN_KEY &&
      lower(n.nft_contract)===lower(contract) &&
      String(n.nft_id)===String(id) &&
      n.enabled!==false
    ) || null;
  }
  async function loadProjectNfts(){
    if(!sb)return;
    const {data,error}=await sb.from("project_nfts")
      .select("*")
      .eq("project_key",PROJECT_KEY)
      .eq("chain_key",CHAIN_KEY)
      .eq("enabled",true)
      .order("nft_name",{ascending:true});
    if(error){
      projectNfts=[];
      if(!/does not exist|schema cache/i.test(error.message||"")) console.warn("DAO1 project_nfts:",error);
      return;
    }
    projectNfts=data||[];
  }

  function openNftTabForSelectedWallet(){
    const wallet=projectWallets().find(w=>String(w.id)===String(selectedWalletId));
    if(!wallet)return;
    try{
      window.renderNftWalletSelect?.();
      const sel=document.getElementById("nftWalletSelect");
      if(sel)sel.value=String(wallet.id);
      window.showTab?.("nfts");
      // showTab("nfts") uses the already selected wallet.
      if(sel && sel.value!==String(wallet.id)){
        sel.value=String(wallet.id);
        window.onNftWalletChange?.();
      }
    }catch(e){
      console.warn("NFT-Tab öffnen:",e);
      window.showTab?.("nfts");
    }
  }

  async function saveNftClassification(contract,id,name,subtype){
    const ctx=getContext?.();
    if(!ctx?.isAdmin)return;
    contract=lower(contract);
    if(!contract || !/^\d+$/.test(String(id)))return;
    if(!subtype){
      const existing=classificationFor(contract,id);
      if(existing){
        const {error}=await sb.from("project_nfts").delete().eq("id",existing.id);
        if(error)return alert(error.message);
      }
    }else{
      const row={
        project_key:PROJECT_KEY,chain_key:CHAIN_KEY,nft_contract:contract,nft_id:Number(id),
        nft_name:name||`NFT #${id}`,category:categoryForSubtype(subtype),subtype,enabled:true
      };
      const {error}=await sb.from("project_nfts").upsert(row,{onConflict:"project_key,chain_key,nft_contract,nft_id"});
      if(error)return alert(error.message);
    }
    await loadProjectNfts();

    // Sofortige UI-Aktualisierung: project_nfts ist die maßgebliche Quelle.
    // Keine Blockchain-/Explorer-Abfrage und keine erneute Claim-Anreicherung nötig.
    renderMinerSelector();
    renderNftClassification();
    renderTransactionControls();

    // Transaktionshistorie / Summary / Exporte verwenden ebenfalls live project_nfts.
    // Deshalb reicht ein Re-Render der bereits geladenen DB-Daten.
    renderTransactionHistory();

    const status=document.getElementById("dao1TransactionStatus");
    if(status){
      status.innerHTML=`<span class="safe">✓ NFT-Klassifizierung gespeichert.</span> Historische Claims und Auswertungsfilter wurden sofort aktualisiert.`;
    }
  }
  function renderNftClassification(){
    const el=document.getElementById("dao1NftClassification");
    const ctx=getContext?.();
    if(!el)return;
    const wallet=projectWallets().find(w=>String(w.id)===String(selectedWalletId));
    const address=walletAddress(wallet);
    const nfts=nftIdsForWallet(address);
    if(!ctx?.isAdmin){
      const classified=nfts.filter(n=>classificationFor(n.contract,n.id));
      el.innerHTML=classified.length
        ? `<div class="note">${classified.length} NFT(s) für DAO1 klassifiziert.</div>`
        : `<div class="note">Noch keine NFT-Klassifizierungen vorhanden.</div>`;
      return;
    }
    if(!nfts.length){
      el.innerHTML='<div class="note">Für diese Wallet sind noch keine Apertum-NFTs zum Klassifizieren vorhanden.</div>';
      return;
    }
    el.innerHTML=`
      <div class="note" style="margin-bottom:10px">Die Klassifizierung gehört zur NFT selbst und bleibt deshalb auch nach einem Wallet-Transfer erhalten. Änderungen wirken sofort auf historische Claims, Filter, Summary und Exporte; ein neuer Blockchain-Scan ist nicht erforderlich.</div>
      <div class="chain-table-wrap project-data-table"><table class="chain-admin-table dao1-nft-class-table" style="table-layout:fixed;width:100%">
        <colgroup><col style="width:34%"><col style="width:28%"><col style="width:38%"></colgroup>
        <thead><tr><th>NFT</th><th>Klassifizierung</th><th>Contract</th></tr></thead><tbody>
        ${nfts.map(n=>{
          const c=classificationFor(n.contract,n.id);
          const opts=['',...NFT_SUBTYPES].map(v=>`<option value="${v}" ${String(c?.subtype||"")===v?"selected":""}>${v||"– nicht klassifiziert –"}</option>`).join("");
          return `<tr>
            <td><strong>${n.name||("NFT #"+n.id)}</strong><div class="meta">#${n.id}${n.current?" · aktuell":" · historisch"}</div></td>
            <td><select style="width:100%;max-width:240px" onchange="DAO1Project.saveNftClassification('${n.contract}','${n.id}','${String(n.name||"").replaceAll("'","&#39;")}',this.value)">${opts}</select></td>
            <td><code style="font-size:.82em;overflow-wrap:anywhere;word-break:break-all">${n.contract||"–"}</code></td>
          </tr>`;
        }).join("")}
        </tbody></table></div>`;
  }

  async function loadOwnershipCache({preferShared=false,force=false}={}) {
    const ctx = getContext?.();
    if (!sb || !ctx?.currentUser) return;
    const uid=String(ctx.currentUser.id||"");
    if(ownershipRowsUserId && ownershipRowsUserId!==uid){
      ownershipRows=[];
      ownershipRowsSource="none";
      ownershipLoadPromise=null;
    }
    ownershipRowsUserId=uid;
    // App-Start/Dashboard dürfen die bereits zentral geladene Ownership-Registry verwenden.
    // Nach Mutationen muss force=true dagegen einen garantiert neuen DB-Read auslösen.
    // Ein bereits laufender älterer Read wird zuerst abgewartet, damit er den danach
    // eingelesenen frischen Stand nicht zeitversetzt wieder überschreiben kann.
    if(force && ownershipLoadPromise){
      try{await ownershipLoadPromise;}catch(_e){}
    }
    // Audit P3 / Phase 6.09: Ein frischer DB-Read ist autoritativer als der zentrale
    // Shared-Cache derselben Session. Dashboard-/DID-Ladevorgaenge duerfen einen nach
    // Ownership-Mutationen frisch eingelesenen DB-Stand deshalb nicht wieder mit einem
    // aelteren (z. B. noch leeren) Shared-Cache ueberschreiben.
    if(!force && preferShared && ownershipRowsSource==="db")return ownershipRows;
    if(!force && preferShared && window.isCentralNftCacheLoaded?.()){
      const shared=window.getCentralNftOwnershipRows?.();
      if(Array.isArray(shared)){
        ownershipRows=shared.map(hydratePrivateWalletAddress);
        ownershipRowsSource="shared";
        return ownershipRows;
      }
    }
    if(!force && ownershipLoadPromise)return ownershipLoadPromise;
    const readPromise=(async()=>{
      const { data, error } = await sb.from("project_nft_ownership")
        .select("*")
        .eq("user_id", ctx.currentUser.id)
        .eq("project_key", PROJECT_KEY)
        .order("owned_from_block", { ascending: true });
      if (error) {
        ownershipRows = [];
        ownershipRowsSource="db";
        if (!/does not exist|schema cache/i.test(error.message || "")) console.warn("NFT Ownership Cache:", error);
        return ownershipRows;
      }
      ownershipRows = (data || []).map(hydratePrivateWalletAddress);
      ownershipRowsSource="db";
      return ownershipRows;
    })();
    ownershipLoadPromise=readPromise;
    try{return await readPromise;}finally{if(ownershipLoadPromise===readPromise)ownershipLoadPromise=null;}
  }


  async function enrichHistoricalNftNames(){
    const missing=[];
    for(const o of ownershipRows){
      const contract=lower(o.nft_contract||"");
      const id=String(o.nft_id);
      if(!contract || !id)continue;
      const cls=classificationFor(contract,id);
      const known=cls?.nft_name || o.nft_name || nftMetaById.get(`${contract}|${id}`)?.name;
      if(known && !/^NFT #?\d+$/i.test(String(known)))continue;
      missing.push({contract,id});
    }
    for(const m of missing.slice(0,50)){
      try{
        const inst=await fetchJson(`${EXPLORER_API}/tokens/${m.contract}/instances/${m.id}`,"Apertum Explorer · NFT-Metadaten");
        const meta=inst?.metadata||{};
        const token=inst?.token||{};
        const name=meta.name || inst?.name || token.name || token.symbol || null;
        if(name)nftMetaById.set(`${m.contract}|${m.id}`,{name});
      }catch(e){
        console.warn("Historische NFT-Metadaten:",m,e);
      }
    }
  }

  async function loadWalletNftMap(address) {
    const ctx=getContext?.();
    const a=lower(address);
    const wallet=projectWallets().find(w=>lower(walletAddress(w))===a);
    if(!ctx?.currentUser || !wallet)return new Map();

    const walletId=String(wallet.dbId || wallet.id);
    // v54: Primär exakt dieselbe In-Memory-nft_cache-Zeile wie der normale NFT-Tab.
    // DB nur als Fallback, falls der zentrale Cache noch nicht geladen ist.
    let cached=window.isCentralNftCacheLoaded?.() ? window.getCachedNftsForWalletId?.(walletId) : null;
    if(!Array.isArray(cached)){
      const {data,error}=await sb.from("nft_cache")
        .select("nfts")
        .eq("user_id",ctx.currentUser.id)
        .eq("wallet_id",walletId)
        .maybeSingle();
      if(error)throw error;
      cached=Array.isArray(data?.nfts)?data.nfts:[];
    }

    const items=new Map();
    for(const n of cached){
      if(String(n.chain||"")!==CHAIN_KEY)continue;
      if(n.possibleSpam || n.userMarkedSpam)continue;
      const contract=lower(n.tokenAddress||"");
      const id=String(n.tokenId??"");
      if(!contract || !id)continue;
      const cls=classificationFor(contract,id);
      const key=`${contract}|${id}`;
      items.set(key,{
        key,contract,id,
        name:cls?.nft_name || n.name || n.collectionName || `NFT #${id}`,
        collectionName:n.collectionName || "",
        image:n.image || null,
        current:true,
        classification:cls
      });
    }

    // Historische Besitzdaten desselben Wallets ergänzen.
    for(const o of ownershipRows){
      if(String(o.chain_key||CHAIN_KEY)!==CHAIN_KEY)continue;
      const sameWalletId=String(o.wallet_id||"")===walletId;
      const sameAddress=o.wallet_address && lower(o.wallet_address)===a;
      if(!sameWalletId && !sameAddress)continue;
      const contract=lower(o.nft_contract||"");
      const id=String(o.nft_id);
      const key=`${contract}|${id}`;
      if(items.has(key))continue;
      const cls=classificationFor(contract,id);
      const metaName=nftMetaById.get(`${contract}|${id}`)?.name;
      items.set(key,{
        key,contract,id,
        name:cls?.nft_name || metaName || o.nft_name || `NFT #${id}`,
        current:!!o.is_current,
        historical:true,
        classification:cls
      });
    }
    return items;
  }

  async function loadCurrentApertumNfts() {
    const ctx=getContext?.();
    const wallet=projectWallets().find(w=>String(w.id)===String(selectedWalletId));
    if(!ctx?.currentUser || !wallet){ currentApertumNfts=[]; return; }
    const walletId=String(wallet.dbId || wallet.id);
    let rows=null;
    if(window.isCentralNftCacheLoaded?.())rows=window.getCachedNftsForWalletId?.(walletId);
    if(!Array.isArray(rows)){
      const {data,error}=await sb.from("nft_cache")
        .select("nfts")
        .eq("user_id",ctx.currentUser.id)
        .eq("wallet_id",walletId)
        .maybeSingle();
      if(error){ console.warn("DAO1 NFT-Cache:",error); currentApertumNfts=[]; return; }
      rows=Array.isArray(data?.nfts)?data.nfts:[];
    }
    currentApertumNfts=rows
      .filter(n=>String(n.chain||"")===CHAIN_KEY)
      .filter(n=>!(n.possibleSpam || n.userMarkedSpam))
      .map(n=>({
        id:String(n.tokenId),
        contract:lower(n.tokenAddress),
        name:n.name || n.collectionName || `NFT #${n.tokenId}`,
        collectionName:n.collectionName || "",
        image:n.image || null,
        current:true
      }));
  }

  // Phase 5.87: Wallets, die vor dem gezielten New-Wallet-Bootstrap aus 5.82
  // hinzugefügt wurden, können einen aktuellen nft_cache besitzen, ohne dass
  // project_nft_ownership vollständig aufgebaut wurde. Dieser Self-Heal erkennt
  // ausschließlich solche Lücken aus bereits vorhandenem Current State und lädt
  // nur die betroffenen NFT-Transferketten nach.
  const DAO1_NFT_BOOTSTRAP_TYPE="project:dao1:nft-bootstrap";
  const DAO1_NFT_BOOTSTRAP_VERSION=1;
  let dao1LegacyWalletReconcilePromise=null;
  let dao1LegacyWalletReconcileDone=false;

  function dao1CachedCurrentNftsForWallet(wallet){
    const walletId=String(wallet?.dbId||wallet?.id||"");
    if(!walletId||!window.isCentralNftCacheLoaded?.())return null;
    const rows=window.getCachedNftsForWalletId?.(walletId);
    if(!Array.isArray(rows))return null;
    return rows
      .filter(n=>String(n?.chain||"")===CHAIN_KEY)
      .filter(n=>!(n?.possibleSpam||n?.userMarkedSpam))
      .map(n=>({
        id:String(n?.tokenId??""),
        contract:lower(n?.tokenAddress||""),
        name:n?.name||n?.collectionName||`NFT #${n?.tokenId??""}`,
        collectionName:n?.collectionName||""
      }))
      .filter(n=>n.id&&n.contract);
  }

  async function dao1LoadWalletBootstrapStates(wallets){
    const ctx=getContext?.();if(!ctx?.currentUser?.id||!wallets?.length)return new Map();
    const ids=wallets.map(w=>String(w?.dbId||w?.id||"")).filter(Boolean);
    if(!ids.length)return new Map();
    try{
      const {data,error}=await sb.from("wallet_refresh_state")
        .select("wallet_id,data_version,last_checked_at,last_refreshed_at,last_result")
        .eq("user_id",ctx.currentUser.id)
        .eq("chain_key",CHAIN_KEY)
        .eq("data_type",DAO1_NFT_BOOTSTRAP_TYPE)
        .in("wallet_id",ids);
      if(error)throw error;
      return new Map((data||[]).map(r=>[String(r.wallet_id),r]));
    }catch(e){
      console.warn("DAO1 Wallet-Bootstrap-Status lesen",e);
      return new Map();
    }
  }

  async function dao1SaveWalletBootstrapState(wallet,result,details=""){
    const ctx=getContext?.(),walletId=String(wallet?.dbId||wallet?.id||"");
    if(!ctx?.currentUser?.id||!walletId)return null;
    const now=new Date().toISOString();
    const payload={
      user_id:ctx.currentUser.id,
      wallet_id:walletId,
      chain_key:CHAIN_KEY,
      data_type:DAO1_NFT_BOOTSTRAP_TYPE,
      data_version:DAO1_NFT_BOOTSTRAP_VERSION,
      last_checked_at:now,
      last_refreshed_at:result==="complete"?now:null,
      last_result:details?`${result}:${details}`:result,
      updated_at:now
    };
    try{
      const {data,error}=await sb.from("wallet_refresh_state")
        .upsert(payload,{onConflict:"user_id,wallet_id,chain_key,data_type"})
        .select().single();
      if(error)throw error;
      return data;
    }catch(e){
      console.warn("DAO1 Wallet-Bootstrap-Status speichern",e);
      return null;
    }
  }

  function dao1OwnershipNeedsRepair(wallet,nft){
    const walletId=String(wallet?.dbId||wallet?.id||"");
    const address=lower(walletAddress(wallet)||"");
    const contract=lower(nft?.contract||""),id=String(nft?.id||"");
    const row=ownershipRows.find(o=>
      String(o?.chain_key||CHAIN_KEY)===CHAIN_KEY &&
      lower(o?.nft_contract||"")===contract &&
      String(o?.nft_id??"")===id &&
      !!o?.is_current &&
      (String(o?.wallet_id||"")===walletId || (!!address&&lower(o?.wallet_address||"")===address))
    );
    if(!row)return true;
    return !(Number(row.owned_from_block||0)>0) || !row.owned_from_at;
  }

  function dao1OwnershipLifecycleCovered(wallet,nft){
    const walletId=String(wallet?.dbId||wallet?.id||"");
    const address=lower(walletAddress(wallet)||"");
    const contract=lower(nft?.contract||""),id=String(nft?.id||"");
    const rows=ownershipRows.filter(o=>
      String(o?.chain_key||CHAIN_KEY)===CHAIN_KEY &&
      lower(o?.nft_contract||"")===contract &&
      String(o?.nft_id??"")===id &&
      (String(o?.wallet_id||"")===walletId || (!!address&&lower(o?.wallet_address||"")===address))
    );
    if(!rows.length)return false;

    // Audit P3 / Phase 6.08: Lifecycle-Konsistenz und Enrichment-Repair sind zwei
    // verschiedene Qualitätsstufen. Für den Lifecycle muss nur belastbar belegt sein,
    // dass die Wallet das NFT aktuell besitzt bzw. historisch besessen hat. Ein fehlender
    // Erwerbsbeginn/Kaufpreis bleibt weiterhin Sache des strengeren Repair-Pfads
    // dao1OwnershipNeedsRepair() und darf den gesamten Wallet-Bootstrap nicht dauerhaft
    // auf partial halten.
    if(nft?.historical===true || nft?.current===false){
      return rows.some(row=>
        !!row.is_current ||
        (Number(row.owned_from_block||0)>0) || !!row.owned_from_at ||
        (Number(row.owned_to_block||0)>0) || !!row.owned_to_at ||
        row.acquisition_kind==="outgoing_transfer_evidence_only" ||
        row.acquisition_kind==="current_state_evidence_only"
      );
    }

    // Aktueller Besitz ist für den Lifecycle ausreichend belegt, sobald nach dem
    // Fresh-Readback ein persistierter is_current-Datensatz für genau diese Wallet
    // existiert. Ob dessen owned_from_* vollständig ist, bleibt bewusst offen.
    return rows.some(row=>!!row.is_current);
  }

  async function dao1EnsureIntrinsicClassifications(nfts){
    const missing=[];
    for(const n of (nfts||[])){
      const contract=lower(n?.contract||""),id=String(n?.id||"");
      if(!contract||!id||classificationFor(contract,id))continue;
      if(contract===lower(DAO1_OLD_DID_CONTRACT)){
        missing.push({
          project_key:PROJECT_KEY,chain_key:CHAIN_KEY,nft_contract:contract,nft_id:Number(id),
          nft_name:n?.name||`DID #${id}`,category:"Identity",subtype:"DID",enabled:true
        });
      }
    }
    if(!missing.length)return 0;
    try{
      const {error}=await sb.from("project_nfts").upsert(missing,{onConflict:"project_key,chain_key,nft_contract,nft_id"});
      if(error)throw error;
      await loadProjectNfts();
      return missing.length;
    }catch(e){
      console.warn("DAO1 intrinsische NFT-Klassifikation",e);
      return 0;
    }
  }

  async function reconcileLegacyDaoWallets(){
    if(dao1LegacyWalletReconcileDone)return {skipped:true};
    if(dao1LegacyWalletReconcilePromise)return dao1LegacyWalletReconcilePromise;
    dao1LegacyWalletReconcilePromise=(async()=>{
      const ctx=getContext?.();
      if(!ctx?.currentUser||!window.isCentralNftCacheLoaded?.())return {deferred:true};
      const wallets=(ctx.wallets||[]).filter(w=>walletAddress(w)).filter(w=>{
        const cached=dao1CachedCurrentNftsForWallet(w);
        const walletId=String(w?.dbId||w?.id||""),address=lower(walletAddress(w)||"");
        const hasOwnership=ownershipRows.some(o=>String(o?.wallet_id||"")===walletId||lower(o?.wallet_address||"")===address);
        return (Array.isArray(cached)&&cached.length>0)||hasOwnership||walletHasProjectAsset(w);
      });
      if(!wallets.length)return {deferred:true,wallets:0,repaired:0};
      const states=await dao1LoadWalletBootstrapStates(wallets);
      let repaired=0,failed=0,classified=0,remainingTotal=0;
      const allCurrent=[];
      for(const wallet of wallets){
        const current=dao1CachedCurrentNftsForWallet(wallet);
        if(!Array.isArray(current))continue;
        allCurrent.push(...current);
        const walletId=String(wallet.dbId||wallet.id||"");
        const state=states.get(walletId);
        const stateComplete=Number(state?.data_version||0)>=DAO1_NFT_BOOTSTRAP_VERSION &&
          String(state?.last_result||"").startsWith("complete");
        const gaps=current.filter(n=>dao1OwnershipNeedsRepair(wallet,n));
        if(stateComplete&&!gaps.length)continue;
        if(!gaps.length){
          await dao1SaveWalletBootstrapState(wallet,"complete","0 gaps");
          continue;
        }

        let cursor=0,localFailed=0;
        async function worker(){
          while(cursor<gaps.length){
            const n=gaps[cursor++];
            try{await discoverOwnershipForNft(n.id,n.contract,n.name);repaired++;}
            catch(e){localFailed++;failed++;console.warn("DAO1 Legacy-Wallet Self-Heal",wallet?.label||walletId,n,e);}
          }
        }
        await Promise.all(Array.from({length:Math.min(2,gaps.length)},worker));
        await loadOwnershipCache({force:true});
        const remaining=gaps.filter(n=>dao1OwnershipNeedsRepair(wallet,n)).length;
        remainingTotal+=remaining;
        if(!remaining&&localFailed===0)await dao1SaveWalletBootstrapState(wallet,"complete",`${gaps.length} repaired`);
        else await dao1SaveWalletBootstrapState(wallet,"partial",`${remaining} offen`);
      }
      classified=await dao1EnsureIntrinsicClassifications(allCurrent);
      await loadOwnershipCache({force:true});
      await loadDAO1OwnedDidRoots(true).catch(()=>{});
      renderNftClassification();
      renderDAO1TeamTreePanel();
      const overview=document.getElementById("dao1-subtab-overview");
      if(overview&&overview.style.display!=="none")await renderDAO1BotOverview();
      dao1LegacyWalletReconcileDone=failed===0&&remainingTotal===0;
      return {ok:failed===0&&remainingTotal===0,repaired,failed,remaining:remainingTotal,classified};
    })();
    try{return await dao1LegacyWalletReconcilePromise;}
    finally{dao1LegacyWalletReconcilePromise=null;}
  }

  function nftIdsForWallet(address) {
    const a=lower(address);
    const items=new Map();

    // Current NFTs: EXACTLY the same Apertum/non-spam cache used by the normal NFT tab.
    for(const n of currentApertumNfts){
      const key=`${n.contract}|${n.id}`;
      const cls=classificationFor(n.contract,n.id);
      const preferredName=cls?.nft_name || n.name || `NFT #${n.id}`;
      items.set(key,{...n,name:preferredName,key,current:true,classification:cls});
    }

    // Historical ownership records remain visible after an NFT has moved away.
    for(const o of ownershipRows){
      if(String(o.chain_key||CHAIN_KEY)!==CHAIN_KEY) continue;
      if(lower(o.wallet_address)!==a) continue;
      const contract=lower(o.nft_contract||"");
      const id=String(o.nft_id);
      const key=`${contract}|${id}`;
      if(items.has(key)) continue;
      const cls=classificationFor(contract,id);
      const metaName=nftMetaById.get(`${contract}|${id}`)?.name;
      items.set(key,{
        key,contract,id,
        name:cls?.nft_name || metaName || o.nft_name || `NFT #${id}`,
        current:!!o.is_current,
        historical:true,
        classification:cls
      });
    }
    return [...items.values()].sort((x,y)=>
      String(x.name||"").localeCompare(String(y.name||""),"de",{numeric:true}) ||
      Number(x.id)-Number(y.id)
    );
  }

  function renderMinerSelector(message="") {
    const el=document.getElementById("dao1MinerSelector");
    const wallets=projectWallets();
    if(!el)return;
    if(!wallets.length){
      el.innerHTML='<div class="empty">Keine DAO1/Apertum-Wallet mit aktuellem oder historischem Projektbestand gefunden.</div>';
      return;
    }
    if(!wallets.some(w=>String(w.id)===String(selectedWalletId)))selectedWalletId=String(wallets[0].id);
    el.innerHTML=`
      <div class="action-row" style="margin-top:4px;margin-bottom:12px">
        <button class="secondary" onclick="DAO1Project.discoverMinerNfts()">NFT-Bestand / Besitzerhistorie aktualisieren</button>
      </div>
      <div class="custom-token-grid" style="grid-template-columns:minmax(320px,1fr);max-width:720px">
        <label><span class="field-label">Apertum Wallet für Claim-Erfassung</span>
          <select id="dao1WalletSelect" onchange="DAO1Project.selectWallet(this.value)">
            ${wallets.map(w=>`<option value="${w.id}" ${String(w.id)===String(selectedWalletId)?"selected":""}>${w.label} · ${walletAddress(w)}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="note" style="margin-top:8px"><strong>Claim-Erfassung:</strong> Die Wallet wird vollständig bzw. inkrementell gescannt. Dabei werden alle erkannten <code>claimReward()</code>-Transaktionen gespeichert und den NFTs zugeordnet. Klassifizierung, NFT und Datum werden ausschließlich unten für die Auswertung verwendet.</div>
      ${message?`<div class="status" style="margin-top:8px">${message}</div>`:""}`;
  }

  async function fetchPagedUrl(initialUrl, maxPages=500) {
    let url=initialUrl, out=[], pages=0;
    while(url && pages<maxPages){
      pages++;
      const j=await fetchJson(url,"Apertum Explorer · Wallet-Transaktionen");
      out.push(...(j.items || []));
      url=nextUrl(initialUrl, j.next_page_params);
    }
    return out;
  }

  function isNonSpamNftTransfer(t) {
    const token=t?.token || {};
    const flags=[
      token.is_spam, token.isSpam, token.spam,
      t?.is_spam, t?.isSpam, t?.spam
    ];
    if(flags.some(v=>v===true || v===1 || String(v).toLowerCase()==="true")) return false;
    const reputation=String(token.reputation || t?.reputation || "").toLowerCase();
    if(["spam","scam","malicious","suspicious"].includes(reputation)) return false;
    return true;
  }

  function nftNameFromTransfer(t) {
    const token=t?.token || {};
    return token.name || token.symbol || t?.token_name || t?.token_symbol || "Apertum Miner NFT";
  }

  function transferTokenId(t) {
    const total=t?.total;
    const id = total?.token_id ?? total?.id ?? t?.token_id ?? t?.token_instance?.id;
    if (id != null) return String(id);
    if (Array.isArray(t?.token_ids) && t.token_ids.length===1) return String(t.token_ids[0]);
    return "";
  }

  function nftOwnershipKey(contract,id){return `${lower(contract||"")}|${String(id??"")}`;}

  function invalidateOwnershipRuntimeCaches(nfts){
    const ctx=getContext?.();
    const contracts=new Set();
    for(const n of (nfts||[])){
      const contract=lower(n.contract||n.nft_contract||DEFAULT_MINER_NFT_CONTRACT);
      const id=String(n.id??n.nft_id??"");
      if(!contract||!id)continue;
      contracts.add(contract);
      const key=nftDirectCacheKey(contract,id);
      ownershipDirectTransferCache.delete(key);
      ownershipGlobalHistoryCache.delete(key);
    }
    // Wallet-/Contract-Historien sind nur ein Laufzeitcache. Sobald sich der aktuelle
    // NFT-Bestand geändert hat, müssen die betroffenen Contracts für alle eigenen
    // Wallets frisch gelesen werden, damit ein Walletwechsel sicher erkannt wird.
    for(const w of (ctx?.wallets||[])){
      const a=lower(walletAddress(w));
      if(!a)continue;
      for(const contract of contracts)ownershipWalletTransferCache.delete(`${a}|${contract}`);
    }
  }

  async function refreshWalletNftsAndOwnership(wallet,statusPrefix="",options={}){
    const lifecyclePerfStarted=performance.now();
    let lifecyclePerfMark=lifecyclePerfStarted;
    const ctx=getContext?.(),address=walletAddress(wallet);if(!ctx?.currentUser||!address)return {nfts:0,ownership:0,failed:0,changed:0,skipped:0};
    const walletId=String(wallet.dbId||wallet.id||"");

    // v42: Der aktuelle NFT-Bestand wird weiterhin live abgeglichen. Die teure komplette
    // Transferketten-Rekonstruktion läuft danach aber nur noch für NFTs, deren aktueller
    // Besitzerzustand gegenüber project_nft_ownership tatsächlich geändert ist.
    // Unveränderte NFTs werden vollständig aus dem persistenten Ownership-Cache übernommen.
    let freshlyLoadedNfts=null;
    if(typeof ctx.refreshApertumNftsForWallet==="function")freshlyLoadedNfts=await ctx.refreshApertumNftsForWallet(wallet,p=>setTransactionStatus("loading",`${statusPrefix}${wallet.label}: Apertum-NFT-Bestand wird abgeglichen…`,`Explorer-Seite ${p} · Besitzerhistorien nur bei Änderungen`));
    const prev=selectedWalletId;
    selectedWalletId=String(wallet.id);
    // Phase 5.99: refreshApertumNftsForWallet aktualisiert den persistierten Cache sofort,
    // während der zentrale In-Memory-NFT-Cache dieses Tabs bis zum nächsten globalen
    // Reload noch den alten Stand enthalten kann. Beim Fresh-Build daher die gerade
    // geladenen Explorer-NFTs direkt verwenden; sonst konnte die DAO1-Übersicht trotz
    // erfolgreichem NFT-Import 0 Bots / 0 DIDs anzeigen.
    if(Array.isArray(freshlyLoadedNfts)){
      currentApertumNfts=freshlyLoadedNfts
        .filter(n=>String(n.chain||CHAIN_KEY)===CHAIN_KEY)
        .filter(n=>!(n.possibleSpam||n.userMarkedSpam))
        .map(n=>({
          id:String(n.tokenId),contract:lower(n.tokenAddress),
          name:n.name||n.collectionName||`NFT #${n.tokenId}`,
          collectionName:n.collectionName||"",image:n.image||null,current:true
        }))
        .filter(n=>n.id&&n.contract);
    }else{
      await loadCurrentApertumNfts();
    }
    const ownershipInventoryMs=Math.round(performance.now()-lifecyclePerfMark);
    lifecyclePerfMark=performance.now();

    const currentByKey=new Map(currentApertumNfts.map(n=>[nftOwnershipKey(n.contract,n.id),n]));
    const dbCurrent=ownershipRows.filter(r=>
      String(r.chain_key||CHAIN_KEY)===CHAIN_KEY &&
      String(r.wallet_id||"")===walletId &&
      !!r.is_current
    );
    const dbCurrentByKey=new Map(dbCurrent.map(r=>[nftOwnershipKey(r.nft_contract,r.nft_id),r]));
    const walletAddressLower=lower(address);
    const dbAnyByKey=new Map(ownershipRows.filter(r=>
      String(r.chain_key||CHAIN_KEY)===CHAIN_KEY &&
      (String(r.wallet_id||"")===walletId || lower(r.wallet_address||"")===walletAddressLower)
    ).map(r=>[nftOwnershipKey(r.nft_contract,r.nft_id),r]));
    const historicalCandidates=Array.isArray(options?.historicalCandidates)?options.historicalCandidates:[];
    const affected=new Map();

    // Audit P3: Historische NFTs eines Fresh-Builds kommen aus der unabhängigen
    // Wallet-Transferhistorie, nicht aus einem bereits existierenden User-Ownership-Cache.
    // Damit können auch heute nicht mehr gehaltene Bots/DIDs reproduzierbar aufgebaut werden.
    for(const n of historicalCandidates){
      const key=nftOwnershipKey(n?.contract,n?.id);
      if(!n?.contract||!n?.id||currentByKey.has(key)||dbAnyByKey.has(key))continue;
      affected.set(key,{...n,historical:true,current:false});
    }

    // Neu in dieser Wallet: Historie dieses NFT neu zusammensetzen.
    for(const [key,n] of currentByKey){
      if(!dbCurrentByKey.has(key))affected.set(key,n);
    }
    // Nicht mehr in dieser Wallet: Historie ebenfalls neu zusammensetzen, damit die
    // bisher offene Besitzperiode geschlossen bzw. ein interner Walletwechsel erfasst wird.
    for(const [key,r] of dbCurrentByKey){
      if(!currentByKey.has(key))affected.set(key,{
        id:String(r.nft_id),contract:lower(r.nft_contract),name:r.nft_name||`NFT #${r.nft_id}`,
        historical:true
      });
    }

    const unchanged=Math.max(0,currentByKey.size-[...currentByKey.keys()].filter(k=>affected.has(k)).length);
    if(!affected.size){
      selectedWalletId=prev;
      setTransactionStatus("loading",`${statusPrefix}${wallet.label}: NFT-Besitz unverändert.`,`${currentByKey.size} aktuelle NFT(s) aus Cache bestätigt · keine Transferketten neu geladen.`);
      return {nfts:currentByKey.size,historicalCandidates:historicalCandidates.length,ownership:0,failed:0,changed:0,skipped:unchanged};
    }

    const changedNfts=[...affected.values()];
    invalidateOwnershipRuntimeCaches(changedNfts);
    setTransactionStatus("loading",`${statusPrefix}${wallet.label}: ${changedNfts.length} NFT-Besitzänderung(en) werden geprüft…`,`${unchanged} unverändert · nur betroffene Transferketten werden aktualisiert.`);
    const ownershipPrepareMs=Math.round(performance.now()-lifecyclePerfMark);
    const ownershipPerfStarted=performance.now();
    let ownershipPerfMark=ownershipPerfStarted;
    await prewarmCachedNftOwnership(changedNfts,`${statusPrefix}${wallet.label}: `);
    const ownershipPrewarmMs=Math.round(performance.now()-ownershipPerfMark);

    let saved=0,failed=0;
    ownershipPerfMark=performance.now();
    // Phase 6.13 / P4: Die Historien sind oben bereits contractweise vorgewärmt.
    // Der anschließende Rebuild war trotzdem NFT für NFT seriell und kostete im
    // 6.12-Realtest ~23 s. Begrenzte Parallelität hält Explorer/Supabase moderat,
    // ohne die fachliche Ownership-Rekonstruktion oder Kaufpreis-Evidenz zu ändern.
    await mapLimited(changedNfts,4,async(n)=>{
      try{
        const key=nftOwnershipKey(n.contract,n.id);
        const count=await discoverOwnershipForNft(n.id,n.contract,n.name,{
          currentWallet:currentByKey.has(key)?wallet:null
        });
        saved+=Number(count||0);
      }catch(e){
        failed++;
        console.warn("NFT Ownership inkrementell",n,e);
      }
    });
    const ownershipRebuildMs=Math.round(performance.now()-ownershipPerfMark);
    selectedWalletId=prev;
    ownershipPerfMark=performance.now();
    const readback=await loadOwnershipCache({force:true});
    const ownershipReadbackMs=Math.round(performance.now()-ownershipPerfMark);
    const readbackWalletRows=(readback||[]).filter(o=>
      String(o?.wallet_id||"")===walletId || lower(o?.wallet_address||"")===lower(address)
    );
    console.info("DAO1 NFT Ownership Fresh-Readback",{
      wallet:wallet.label||walletId,
      address:lower(address),
      writtenPeriods:saved,
      changedNfts:changedNfts.length,
      totalRows:Array.isArray(readback)?readback.length:0,
      walletRows:readbackWalletRows.length,
      source:ownershipRowsSource
    });
    const ownershipCoreMs=Math.round(performance.now()-ownershipPerfStarted);
    const ownershipLifecycleMs=Math.round(performance.now()-lifecyclePerfStarted);
    const ownershipUnaccountedMs=Math.max(0,ownershipLifecycleMs-(ownershipInventoryMs+ownershipPrepareMs+ownershipPrewarmMs+ownershipRebuildMs+ownershipReadbackMs));
    console.info(`DAO1 NFT Ownership Performance · changedNfts=${changedNfts.length} · inventoryMs=${ownershipInventoryMs} · prepareMs=${ownershipPrepareMs} · prewarmMs=${ownershipPrewarmMs} · rebuildMs=${ownershipRebuildMs} · readbackMs=${ownershipReadbackMs} · coreMs=${ownershipCoreMs} · lifecycleMs=${ownershipLifecycleMs} · unaccountedMs=${ownershipUnaccountedMs} · savedPeriods=${saved} · failed=${failed}`);
    return {nfts:currentByKey.size,historicalCandidates:historicalCandidates.length,ownership:saved,failed,changed:changedNfts.length,skipped:unchanged,readbackRows:readbackWalletRows.length};
  }

  async function discoverMinerNfts() {
    const ctx=getContext?.();
    const wallet=projectWallets().find(w=>String(w.id)===String(selectedWalletId));
    const address=walletAddress(wallet);
    if(!ctx?.currentUser || !address) return;

    await loadCurrentApertumNfts();
    renderMinerSelector("Aktueller Apertum-NFT-Bestand wurde aus dem NFT-Tab übernommen. Besitzerhistorien werden für die sichtbaren NFTs ergänzt…");

    let saved=0, failed=0;
    await prewarmCachedNftOwnership(currentApertumNfts,"DAO1: ");
    // Contract scans are batched; individual ownership assembly below uses the run cache.
    for(const n of currentApertumNfts){
      try{ saved += await discoverOwnershipForNft(n.id,n.contract,n.name); }
      catch(e){ failed++; console.warn("NFT Ownership",n,e); }
    }
    await loadOwnershipCache();
    renderMinerSelector(`${currentApertumNfts.length} aktuelle nicht-spamverdächtige Apertum-NFT(s) übernommen; ${saved} Besitzabschnitt(e) gespeichert${failed?`, ${failed} Historie(n) nicht abrufbar`:""}.`);
    renderNftClassification();
  }


  async function loadWalletNftTransferHistory(address,nftContract,{strict=false}={}){
    const contract=lower(nftContract);
    const key=`${lower(address)}|${contract}`;
    const cached=ownershipWalletTransferCache.get(key);
    if(cached && Date.now()-cached.at<5*60*1000){
      if(strict&&cached.complete===false)throw new Error(`NFT-Transferhistorie unvollständig: ${contract}`);
      return cached.rows;
    }

    const base=`${EXPLORER_API}/addresses/${address}/token-transfers`;
    const directions=["to","from"];
    const merged=new Map();
    let lastError=null,directionalSuccess=0,fallbackSuccess=false;

    for(const filter of directions){
      try{
        const initial=`${base}?type=${encodeURIComponent("ERC-721,ERC-1155")}&token=${encodeURIComponent(contract)}&filter=${filter}`;
        const rows=await fetchPagedUrl(initial,500);
        directionalSuccess++;
        for(const t of rows){
          if(!isNonSpamNftTransfer(t))continue;
          merged.set(nftTransferDedupeKey(t),t);
        }
      }catch(e){
        lastError=e;
        console.warn("Apertum Wallet-NFT-Transferhistorie gezielt",address,contract,filter,e);
      }
    }

    // Wenn einer der Richtungs-Endpunkte fehlt, ist die Historie noch nicht beweisbar
    // vollständig. Dann immer den ungefilterten Contract-Endpunkt als Vollständigkeits-
    // Fallback lesen – auch wenn die andere Richtung bereits Treffer geliefert hat.
    if(directionalSuccess<directions.length){
      try{
        const initial=`${base}?type=${encodeURIComponent("ERC-721,ERC-1155")}&token=${encodeURIComponent(contract)}`;
        const rows=await fetchPagedUrl(initial,500);
        fallbackSuccess=true;
        for(const t of rows){
          if(!isNonSpamNftTransfer(t))continue;
          merged.set(nftTransferDedupeKey(t),t);
        }
      }catch(e){lastError=e;}
    }

    const complete=directionalSuccess===directions.length||fallbackSuccess;
    const rows=[...merged.values()];
    if(!complete&&lastError){
      console.warn("Apertum Wallet-NFT-Transferhistorie:",address,contract,lastError);
      if(strict)throw lastError;
    }
    ownershipWalletTransferCache.set(key,{at:Date.now(),rows,complete});
    return rows;
  }

  function dao1HistoricalNftContracts(){
    const contracts=new Set([
      lower(DEFAULT_MINER_NFT_CONTRACT),
      lower(DAO1_OLD_DID_CONTRACT),
      lower(APTMDAO_NFT_CONTRACT)
    ]);
    for(const n of (projectNfts||[])){
      const c=lower(n?.nft_contract||"");
      if(c)contracts.add(c);
    }
    for(const n of (currentApertumNfts||[])){
      const c=lower(n?.contract||n?.tokenAddress||"");
      if(c)contracts.add(c);
    }
    return [...contracts].filter(Boolean);
  }

  async function discoverHistoricalNftCandidatesForWallet(wallet,statusPrefix=""){
    const address=walletAddress(wallet);
    if(!address)return {candidates:[],contracts:0,failedContracts:0,transfers:0};
    const candidates=new Map();
    const contracts=dao1HistoricalNftContracts();
    let failedContracts=0,transfers=0;
    for(let i=0;i<contracts.length;i++){
      const contract=contracts[i];
      setTransactionStatus("loading",`${statusPrefix}${wallet.label}: historische NFT-Kandidaten werden ermittelt…`,
        `Contract ${i+1}/${contracts.length} · Fresh-Build liest Wallet-Transferhistorie unabhängig von bestehenden User-Caches.`);
      try{
        const rows=await loadWalletNftTransferHistory(address,contract,{strict:true});
        transfers+=rows.length;
        for(const t of rows){
          const token=t?.token||{};
          const seenContract=lower(token.address||token.address_hash||t.token_address||t.token_address_hash||contract);
          if(seenContract!==contract)continue;
          for(const id of transferTokenIds(t)){
            if(!/^\d+$/.test(String(id)))continue;
            const key=nftOwnershipKey(contract,id);
            const cls=classificationFor(contract,id);
            const metaName=nftMetaById.get(key)?.name;
            candidates.set(key,{
              id:String(id),contract,
              name:cls?.nft_name||metaName||nftNameFromTransfer(t)||`NFT #${id}`,
              historical:true,current:false,evidence:"wallet-transfer-history"
            });
          }
        }
      }catch(e){
        failedContracts++;
        console.warn("DAO1 historische NFT-Kandidaten",wallet?.label||address,contract,e);
      }
    }
    console.info("DAO1 Fresh-Build historische NFT-Kandidaten",{
      wallet:wallet?.label||address,address,contracts:contracts.length,failedContracts,
      transfers,candidates:candidates.size
    });
    return {candidates:[...candidates.values()],contracts:contracts.length,failedContracts,transfers};
  }

  function transferTokenIds(t){
    const ids=[];
    const candidates=[
      t?.total?.token_id,t?.total?.id,t?.token_id,t?.tokenId,
      t?.token_instance?.id,t?.token_instance?.token_id,
      t?.token?.token_id,t?.token?.id
    ];
    for(const v of candidates)if(v!=null&&String(v)!=="")ids.push(String(v));
    for(const arr of [t?.token_ids,t?.total?.token_ids,t?.token_instance?.token_ids]){
      if(Array.isArray(arr))for(const v of arr)if(v!=null)ids.push(String(v));
    }
    return [...new Set(ids)];
  }

  async function fetchWalletNftTransfersForOwnership(address,nftContract,nftId){
    const contract=lower(nftContract),wantedId=String(nftId);
    const rows=await loadWalletNftTransferHistory(address,contract);
    return rows.filter(t=>{
      const token=t?.token||{};
      const c=lower(token.address||token.address_hash||t.token_address||t.token_address_hash||"");
      if(c!==contract)return false;
      return transferTokenIds(t).includes(wantedId);
    });
  }

  function nftTransferDedupeKey(t){
    const hash=String(t?.transaction_hash||t?.tx_hash||H(t?.transaction)||"").toLowerCase();
    return `${Number(t?.block_number||0)}|${Number(t?.log_index||0)}|${hash}|${lower(H(t?.from))}|${lower(H(t?.to))}`;
  }


  async function dao1ApertumRpc(method,params=[]){
    const allowed=new Set(["eth_blockNumber","eth_getLogs","eth_getBlockByNumber","eth_call"]);
    if(!allowed.has(method))throw new Error(`Apertum RPC-Methode nicht erlaubt: ${method}`);
    const {data,error}=await sb.functions.invoke("apertum-rpc-proxy",{
      body:{method,params}
    });
    if(error){
      let detail=error.message||String(error);
      try{
        const ctx=error.context;
        if(ctx?.clone){
          const response=ctx.clone();
          const payload=await response.json();
          if(payload?.error)detail=payload.error;
        }
      }catch(_){}
      window.reportWalletTrackingMigrationIssue?.("apertum-rpc",method,new Error(detail));
      throw new Error(detail);
    }
    if(!data?.ok){
      const detail=data?.error||`apertum-rpc-proxy/${method} fehlgeschlagen.`;
      window.reportWalletTrackingMigrationIssue?.("apertum-rpc",method,new Error(detail));
      throw new Error(detail);
    }
    return data.result;
  }

  function dao1TopicAddress(topic){
    const t=String(topic||"");
    return t.length>=42?lower("0x"+t.slice(-40)):"";
  }

  function nftDirectCacheKey(contract,id){return `${lower(contract)}|${String(id)}`;}

  async function fetchErc721TransferLogsForNfts(nftContract,nftIds,statusPrefix=""){
    const ids=[...new Set((nftIds||[]).map(String))].filter(id=>/^\d+$/.test(id));
    if(!ids.length)return new Map();

    const missing=ids.filter(id=>!ownershipDirectTransferCache.has(nftDirectCacheKey(nftContract,id)));
    if(!missing.length){
      return new Map(ids.map(id=>[id,ownershipDirectTransferCache.get(nftDirectCacheKey(nftContract,id))||[]]));
    }

    const transferTopic=ethers.id("Transfer(address,address,uint256)");
    const tokenTopics=missing.map(id=>"0x"+BigInt(id).toString(16).padStart(64,"0"));
    const latestHex=await dao1ApertumRpc("eth_blockNumber",[]);
    const latest=Number(BigInt(latestHex));
    const rawLogs=[];
    let rpcChunks=0;

    async function scanAdaptive(from,to,depth=0){
      rpcChunks++;
      if(rpcChunks===1 || rpcChunks%10===0){
        setTransactionStatus("loading",
          `${statusPrefix}NFT-Besitzhistorie on-chain…`,
          `${missing.length} NFT(s) · Contract ${nftContract.slice(0,10)}… · Block ${from.toLocaleString("de-DE")}–${to.toLocaleString("de-DE")} · ${rpcChunks} RPC-Bereiche`);
      }
      try{
        const logs=await dao1ApertumRpc("eth_getLogs",[{
          address:nftContract,
          fromBlock:"0x"+from.toString(16),
          toBlock:"0x"+to.toString(16),
          topics:[transferTopic,null,null,tokenTopics.length===1?tokenTopics[0]:tokenTopics]
        }]);
        for(const l of (logs||[]))rawLogs.push(l);
        return;
      }catch(e){
        const span=to-from+1;
        if(span<=10000 || depth>=12){
          console.warn("Apertum NFT eth_getLogs Bereich übersprungen",{
            contract:nftContract,from,to,span,error:e?.message||String(e)
          });
          return;
        }
        const mid=Math.floor((from+to)/2);
        await scanAdaptive(from,mid,depth+1);
        if(mid+1<=to)await scanAdaptive(mid+1,to,depth+1);
      }
    }

    const BIG=5000000;
    for(let from=0;from<=latest;from+=BIG){
      const to=Math.min(latest,from+BIG-1);
      await scanAdaptive(from,to,0);
    }

    const byId=new Map(missing.map(id=>[id,[]]));
    const blockTs=new Map();
    for(const l of rawLogs){
      const id=String(BigInt(l.topics?.[3]||"0x0"));
      if(!byId.has(id))continue;
      const block=Number(BigInt(l.blockNumber||"0x0"));
      if(!blockTs.has(block)){
        try{
          const b=await dao1ApertumRpc("eth_getBlockByNumber",[l.blockNumber,false]);
          blockTs.set(block,b?.timestamp?new Date(Number(BigInt(b.timestamp))*1000).toISOString():null);
        }catch{blockTs.set(block,null);}
      }
      byId.get(id).push({
        from:dao1TopicAddress(l.topics?.[1]),
        to:dao1TopicAddress(l.topics?.[2]),
        block_number:block,
        log_index:Number(BigInt(l.logIndex||"0x0")),
        timestamp:blockTs.get(block),
        transaction_hash:String(l.transactionHash||"").toLowerCase(),
        token:{address:nftContract},
        token_id:id
      });
    }

    for(const id of missing){
      ownershipDirectTransferCache.set(nftDirectCacheKey(nftContract,id),byId.get(id)||[]);
    }
    console.info("DAO1 NFT Batch-OnChain-Scan",{
      contract:nftContract,
      nftIds:missing,
      rpcChunks,
      logs:rawLogs.length
    });
    return new Map(ids.map(id=>[id,ownershipDirectTransferCache.get(nftDirectCacheKey(nftContract,id))||[]]));
  }


  const ownershipGlobalHistoryCache=new Map();

  function normalizeCachedTransfer(r){
    return {
      from:r.from_address||"",
      to:r.to_address||"",
      block_number:Number(r.block_number||0),
      log_index:Number(r.log_index||0),
      timestamp:r.block_timestamp||null,
      transaction_hash:String(r.tx_hash||"").toLowerCase(),
      token:{address:r.nft_contract||""},
      token_id:String(r.nft_id??"")
    };
  }

  async function fetchCachedNftHistories(contract,ids,statusPrefix=""){
    const clean=[...new Set((ids||[]).map(String))].filter(id=>/^\d+$/.test(id));
    if(!clean.length)return new Map();

    const missing=clean.filter(id=>!ownershipGlobalHistoryCache.has(nftDirectCacheKey(contract,id)));
    if(missing.length){
      setTransactionStatus("loading",
        `${statusPrefix}NFT-Besitzhistorie wird geladen…`,
        `${missing.length} NFT(s) · schneller Explorer-/Global-Cache-Pfad`);
      const {data,error}=await sb.functions.invoke("apertum-nft-history",{
        body:{contract:lower(contract),token_ids:missing}
      });
      if(error){
        let detail=error.message||String(error);
        try{
          const ctx=error.context;
          if(ctx?.clone){
            const response=ctx.clone();
            const payload=await response.json();
            if(payload?.error)detail=payload.error;
          }
        }catch(_){}
        throw new Error(detail);
      }
      if(!data?.ok)throw new Error(data?.error||"apertum-nft-history fehlgeschlagen.");
      const rows=Array.isArray(data.transfers)?data.transfers:[];
      const byId=new Map(missing.map(id=>[id,[]]));
      for(const r of rows){
        const id=String(r.nft_id??"");
        if(byId.has(id))byId.get(id).push(normalizeCachedTransfer(r));
      }
      for(const id of missing){
        ownershipGlobalHistoryCache.set(nftDirectCacheKey(contract,id),byId.get(id)||[]);
      }
      console.info("DAO1 NFT Global-History-Cache",{
        contract:lower(contract),
        requested:missing.length,
        transfers:rows.length,
        cache_hits:Number(data.cache_hits||0),
        refreshed:Number(data.refreshed||0),
        duration_ms:Number(data.duration_ms||0)
      });
    }
    return new Map(clean.map(id=>[id,ownershipGlobalHistoryCache.get(nftDirectCacheKey(contract,id))||[]]));
  }

  async function prewarmCachedNftOwnership(nfts,statusPrefix=""){
    const groups=new Map();
    for(const n of (nfts||[])){
      const contract=lower(n.contract||n.tokenAddress||DEFAULT_MINER_NFT_CONTRACT);
      const id=String(n.id??n.tokenId??"");
      if(!contract||!/^\d+$/.test(id))continue;
      if(!groups.has(contract))groups.set(contract,[]);
      groups.get(contract).push(id);
    }
    for(const [contract,ids] of groups){
      await fetchCachedNftHistories(contract,ids,statusPrefix);
    }
  }

  async function prewarmDirectNftOwnership(nfts,statusPrefix=""){
    const groups=new Map();
    for(const n of (nfts||[])){
      const contract=lower(n.contract||n.tokenAddress||DEFAULT_MINER_NFT_CONTRACT);
      const id=String(n.id??n.tokenId??"");
      if(!contract||!/^\d+$/.test(id))continue;
      if(!groups.has(contract))groups.set(contract,[]);
      groups.get(contract).push(id);
    }
    for(const [contract,ids] of groups){
      await fetchErc721TransferLogsForNfts(contract,ids,statusPrefix);
    }
  }

  async function fetchErc721TransferLogsForNft(nftContract,nftId){
    const key=nftDirectCacheKey(nftContract,nftId);
    if(ownershipDirectTransferCache.has(key))return ownershipDirectTransferCache.get(key)||[];
    const result=await fetchErc721TransferLogsForNfts(nftContract,[String(nftId)]);
    return result.get(String(nftId))||[];
  }


  const dao1TxTokenTransfersCache=new Map();
  const dao1TxTokenTransfersInflight=new Map();
  async function fetchTransactionTokenTransfers(txHash){
    const hash=String(txHash||"").toLowerCase();
    if(!/^0x[0-9a-f]{64}$/.test(hash))return [];
    if(dao1TxTokenTransfersCache.has(hash))return dao1TxTokenTransfersCache.get(hash);
    if(dao1TxTokenTransfersInflight.has(hash))return dao1TxTokenTransfersInflight.get(hash);
    const job=(async()=>{
    // Für Claim-/Reward-Auszahlungen benötigen wir ausschließlich fungible Token-Flows.
    // Der frühere zweite ERC-721/ERC-1155-Aufruf war fachlich unnötig und lieferte
    // bei einzelnen historischen Transaktionen HTTP 400.
    const candidates=[
      `${EXPLORER_API}/transactions/${hash}/token-transfers`
    ];
    let lastError=null;
    for(const initial of candidates){
      try{
        const rows=await fetchPagedUrl(initial,100);
        if(Array.isArray(rows)&&rows.length)return rows;
      }catch(e){lastError=e;}
    }
    if(lastError)console.warn("Apertum Tx-Token-Transfers:",hash,lastError);
    return [];
    })();
    dao1TxTokenTransfersInflight.set(hash,job);
    try{const rows=await job;dao1TxTokenTransfersCache.set(hash,rows||[]);return rows||[];}
    finally{dao1TxTokenTransfersInflight.delete(hash);}
  }

  function summarizeTokenTransfer(t){
    const token=t?.token||{};
    return {
      contract:lower(token.address||token.address_hash||t.token_address||t.token_address_hash||""),
      ids:transferTokenIds(t),
      type:String(token.type||t.token_type||t.type||""),
      symbol:String(token.symbol||t.symbol||""),
      name:String(token.name||t.name||""),
      from:transferFromAddress(t),
      to:transferToAddress(t),
      amount:String(t?.total?.value??t?.value??t?.amount??""),
      block:Number(t?.block_number||0),
      log_index:Number(t?.log_index||0),
      tx:String(t?.transaction_hash||t?.tx_hash||H(t?.transaction)||"").toLowerCase()
    };
  }

  async function diagnoseControlNft38483(nftContract,nftId,primary,walletFallback,cachedRows){
    if(String(nftId)!=="38483")return;
    const knownTx="0x31cd019cbba0c36c631debde1d9d3d020cd4671dc39d669a8f489eb026251de2";
    const txRows=await fetchTransactionTokenTransfers(knownTx);
    console.info("DAO1 NFT Kontrollfall #38483",{
      expected:{
        nft_number:"38483",
        known_purchase_tx:knownTx,
        expected_purchase_at:"2025-02-24T13:40:13.000Z",
        expected_wallet:"0xc7e112d6db20a4a9213834b2cb235c34733e6591",
        expected_payment:"10000 wUSDT"
      },
      requested_instance:{
        contract:nftContract,
        token_id:String(nftId)
      },
      transaction_token_transfers:txRows.map(summarizeTokenTransfer),
      instance_history:(primary||[]).map(summarizeTokenTransfer),
      own_wallet_history:(walletFallback||[]).map(summarizeTokenTransfer),
      global_cache_history:(cachedRows||[]).map(summarizeTokenTransfer)
    });
  }

  async function discoverOwnershipForNft(nftId, nftContract=DEFAULT_MINER_NFT_CONTRACT, knownName="", options={}) {
    const ctx=getContext?.();
    nftContract=lower(nftContract || DEFAULT_MINER_NFT_CONTRACT);

    let nftName=knownName || nftMetaById.get(`${nftContract}|${String(nftId)}`)?.name || `NFT #${nftId}`;
    try{
      const instance=await fetchJson(`${EXPLORER_API}/tokens/${nftContract}/instances/${nftId}`,"Apertum Explorer · NFT-Metadaten");
      const token=instance?.token || {};
      const spam=[token.is_spam,token.isSpam,instance?.is_spam,instance?.isSpam]
        .some(v=>v===true || v===1 || String(v).toLowerCase()==="true");
      const reputation=String(token.reputation || instance?.reputation || "").toLowerCase();
      if(spam || ["spam","scam","malicious","suspicious"].includes(reputation)){
        throw new Error(`NFT #${nftId} ist im Explorer als Spam/verdächtig markiert.`);
      }
      nftName=token.name || token.symbol || instance?.name || nftName;
      nftMetaById.set(`${nftContract}|${String(nftId)}`,{name:nftName});
    }catch(e){
      if(/Spam|verdächtig/.test(e.message||"")) throw e;
      console.warn("NFT-Metadaten:",e);
    }

    const url=`${EXPLORER_API}/tokens/${nftContract}/instances/${nftId}/transfers`;
    const primary=(await fetchPagedUrl(url)).filter(isNonSpamNftTransfer);

    // Zweite unabhängige Quelle: Transfers aus der Historie ALLER eigenen Wallets.
    // Das ist wichtig bei Wallet 1 -> Wallet 2, falls der Instance-Endpoint ältere
    // Transfers nicht vollständig liefert.
    const walletFallback=[];
    for(const w of ((ctx.wallets||[]).filter(w=>walletAddress(w)))){
      try{
        walletFallback.push(...await fetchWalletNftTransfersForOwnership(walletAddress(w),nftContract,nftId));
      }catch(e){console.warn("NFT Wallet-Historie",w?.label||walletAddress(w),e);}
    }
    const transferMap=new Map();
    for(const t of [...primary,...walletFallback])transferMap.set(nftTransferDedupeKey(t),t);
    if(String(nftId)==="7993" || String(nftId)==="7994"){
      console.info("DAO1 NFT Solar Quellen",{
        nft:`${nftContract}#${nftId}`,
        instance_transfers:primary.map(t=>({
          block:Number(t.block_number||0),
          time:t.timestamp||t.block_timestamp||null,
          from:transferFromAddress(t),to:transferToAddress(t),
          ids:transferTokenIds(t)
        })),
        own_wallet_transfers:walletFallback.map(t=>({
          block:Number(t.block_number||0),
          time:t.timestamp||t.block_timestamp||null,
          from:transferFromAddress(t),to:transferToAddress(t),
          ids:transferTokenIds(t)
        }))
      });
    }

    // Dritte Quelle: globaler serverseitiger Transfercache. Beim ersten Abruf wird
    // ausschließlich die indexierte Transferhistorie dieses NFT geladen; kein Chain-Vollscan.
    let cachedHistoryRows=[];
    try{
      const cached=await fetchCachedNftHistories(nftContract,[String(nftId)]);
      cachedHistoryRows=cached.get(String(nftId))||[];
      for(const t of cachedHistoryRows)transferMap.set(nftTransferDedupeKey(t),t);
    }catch(e){console.warn("Apertum globaler NFT-Historiencache",nftContract,nftId,e);}

    // Verifizierter Kontrollfall: #38483 wurde laut Apertum Explorer am 24.02.2025
    // in Tx 0x31cd...1de2 zusammen mit 10'000 wUSDT erworben. Die Diagnose prüft
    // hier explizit, welche technische ERC-721 Token-ID diese Transaktion enthält.
    try{await diagnoseControlNft38483(nftContract,nftId,primary,walletFallback,cachedHistoryRows);}
    catch(e){console.warn("DAO1 NFT Kontrollfall #38483 Diagnose:",e);}

    const transfers=[...transferMap.values()];
    const chronological=[...transfers].sort((a,b)=>{
      const ba=Number(a.block_number||0), bb=Number(b.block_number||0);
      if(ba!==bb)return ba-bb;
      return Number(a.log_index||0)-Number(b.log_index||0);
    });
    console.info("DAO1 NFT Ownership Transferkette",{
      nft:`${nftContract}#${nftId}`,
      transfers:chronological.map(t=>({
        block:Number(t.block_number||0),
        time:t.timestamp||t.block_timestamp||t.blockTimeStamp||null,
        from:transferFromAddress(t),
        to:transferToAddress(t),
        tx:String(t.transaction_hash||t.tx_hash||H(t.transaction)||"")
      }))
    });
    // Besitzperioden DIREKT für die eigenen Wallets aus der vollständigen Transferkette
    // rekonstruieren. Damit hängt "Erstmals von dir erworben" nicht davon ab, welche
    // Wallet gerade ausgewählt ist oder welche fremden Zwischenbesitzer vorkommen.
    const trackedWallets=(ctx.wallets||[]).filter(w=>walletAddress(w));
    const tracked=new Set(trackedWallets.map(w=>lower(walletAddress(w))).filter(Boolean));
    const openByWallet=new Map();
    const ownPeriods=[];

    // Normalisierte Kette vorab aufbauen. Bei einer konsistenten ERC-721-Kette gilt:
    // to[i] == from[i+1]. Wenn ein Explorer-Endpunkt beim früheren Transfer die
    // Empfängeradresse nicht sauber liefert, kann sie aus dem nächsten `from` sicher
    // rekonstruiert werden.
    const normalizedChain=chronological.map((t,i)=>({
      raw:t,
      block:Number(t.block_number||0),
      ts:t.timestamp||t.block_timestamp||t.blockTimeStamp||null,
      from:transferFromAddress(t),
      to:transferToAddress(t),
      nextFrom:i+1<chronological.length?transferFromAddress(chronological[i+1]):""
    }));

    for(const row of normalizedChain){
      const nextFromValid=/^0x[0-9a-f]{40}$/.test(row.nextFrom||"");
      const toValid=/^0x[0-9a-f]{40}$/.test(row.to||"");

      if(!toValid && nextFromValid){
        row.to=row.nextFrom;
        row.inferredTo=true;
        row.inferenceReason="missing_to_next_from";
      }

      if(nextFromValid && tracked.has(row.nextFrom) && row.to!==row.nextFrom){
        row.originalTo=row.to||"";
        row.to=row.nextFrom;
        row.inferredTo=true;
        row.inferenceReason="owned_next_from_continuity";
      }
    }

    if(String(nftId)==="7993" || String(nftId)==="7994"){
      console.info("DAO1 NFT Solar Wallet-Matching",{
        nft:`${nftContract}#${nftId}`,
        tracked_wallets:trackedWallets.map(w=>({
          wallet_id:String(w?.dbId||w?.id||""),
          label:w?.label||"",
          address:lower(walletAddress(w))
        })),
        chain:normalizedChain.map(r=>({
          block:r.block,time:r.ts,from:r.from,to:r.to,next_from:r.nextFrom,
          original_to:r.originalTo||null,
          from_is_own:tracked.has(r.from),to_is_own:tracked.has(r.to),
          inferred_to:!!r.inferredTo,inference_reason:r.inferenceReason||null
        }))
      });
    }

    for(const row of normalizedChain){
      const t=row.raw;
      const from=row.from, to=row.to;
      const block=row.block;
      const ts=row.ts;

      if(from && tracked.has(from)){
        let open=openByWallet.get(from);
        if(!open){
          const idx=normalizedChain.indexOf(row);
          const prev=idx>0?normalizedChain[idx-1]:null;
          if(prev && prev.block<block){
            // Nur bei eindeutig konsistenter Kette: vorheriger Empfänger ist dieselbe
            // eigene Wallet oder konnte aus diesem outgoing Transfer sicher abgeleitet werden.
            const consistent=(prev.to===from) || (!!prev.inferredTo && prev.to===from);
            if(consistent){
              open={
                user_id:ctx.currentUser.id,
                project_key:PROJECT_KEY,
                chain_key:CHAIN_KEY,
                nft_contract:nftContract,
                nft_id:Number(nftId),
                nft_name:nftName,
                wallet_id:walletIdForAddress(from),
                owned_from_block:prev.block,
                owned_from_at:prev.ts,
                owned_to_block:null,
                owned_to_at:null,
                is_current:true,
                entry_from_address:prev.from||null,
                entry_tx_hash:String(prev?.raw?.transaction_hash||prev?.raw?.tx_hash||H(prev?.raw?.transaction)||"").toLowerCase()||null,
                _inferred_from_chain:true
              };
            }
          }
        }
        if(open){
          open.owned_to_block=block;
          open.owned_to_at=ts;
          open.is_current=false;
          delete open._inferred_from_chain;
          ownPeriods.push(open);
          openByWallet.delete(from);
        }
      }

      if(to && tracked.has(to)){
        // Doppelte Quellen desselben Transfers wurden vorher dedupliziert. Falls dennoch
        // bereits eine offene Periode existiert, nicht künstlich einen Neuerwerb erzeugen.
        if(!openByWallet.has(to)){
          openByWallet.set(to,{
            user_id:ctx.currentUser.id,
            project_key:PROJECT_KEY,
            chain_key:CHAIN_KEY,
            nft_contract:nftContract,
            nft_id:Number(nftId),
            nft_name:nftName,
            wallet_id:walletIdForAddress(to),
            owned_from_block:block,
            owned_from_at:ts,
            owned_to_block:null,
            owned_to_at:null,
            is_current:true,
            entry_from_address:from||null,
            entry_tx_hash:String(t?.transaction_hash||t?.tx_hash||H(t?.transaction)||"").toLowerCase()||null
          });
        }
      }
    }

    for(const open of openByWallet.values())ownPeriods.push(open);

    // Audit P3 / Phase 6.06: Der zentrale Current-State ist eine eigene, belastbare
    // Besitz-Evidenz. Falls die Explorer-Historie den ursprünglichen Eingang eines
    // HEUTE gehaltenen NFTs nicht mehr liefert, persistieren wir deshalb eine offene
    // Current-State-Evidence-Periode mit unbekanntem Start. Das schliesst die fachliche
    // Besitzabdeckung, ohne einen Erwerbsblock/-zeitpunkt zu erfinden. Erwerbs-/Preis-
    // Evidence bleibt weiterhin offen und kann über den strengeren Repair-Pfad später
    // nachgezogen werden.
    const currentEvidenceWallet=options?.currentWallet||null;
    if(currentEvidenceWallet){
      const currentWalletId=String(currentEvidenceWallet?.dbId||currentEvidenceWallet?.id||"");
      const alreadyCurrent=ownPeriods.some(r=>String(r?.wallet_id||"")===currentWalletId && !!r?.is_current);
      if(!alreadyCurrent){
        ownPeriods.push({
          user_id:ctx.currentUser.id,
          project_key:PROJECT_KEY,
          chain_key:CHAIN_KEY,
          nft_contract:nftContract,
          nft_id:Number(nftId),
          nft_name:nftName,
          wallet_id:currentWalletId,
          owned_from_block:null,
          owned_from_at:null,
          owned_to_block:null,
          owned_to_at:null,
          is_current:true,
          entry_from_address:null,
          entry_tx_hash:null,
          acquisition_kind:"current_state_evidence_only",
          acquisition_verified:false,
          acquisition_tx_hash:null
        });
        console.info("DAO1 NFT aktueller Besitz nur durch Current-State belegt",{
          nft:`${nftContract}#${nftId}`,
          wallet_id:currentWalletId,
          wallet:currentEvidenceWallet?.label||lower(walletAddress(currentEvidenceWallet)||""),
          transfers:normalizedChain.length
        });
      }
    }

    // Audit P3 Nachbesserung: Einige historische NFTs sind in der heutigen Explorer-
    // Historie nur noch durch einen belegten Abgang AUS einer eigenen Wallet sichtbar.
    // Das beweist den früheren Besitz, aber NICHT dessen Beginn. Statt den Startzeitpunkt
    // zu erfinden, persistieren wir einen geschlossenen Evidence-only-Abschnitt mit
    // owned_from_* = null und dem verifizierten Abgang als owned_to_*. Dadurch bleibt
    // der Fresh-Build reproduzierbar und die UI darf einen unbekannten Ersterwerb auch
    // weiterhin als unbekannt anzeigen.
    if(!ownPeriods.length){
      const outgoingEvidence=new Map();
      for(const row of normalizedChain){
        const from=row.from;
        if(!from||!tracked.has(from)||!(Number(row.block||0)>0)||!row.ts)continue;
        const walletId=walletIdForAddress(from);
        const key=String(walletId);
        const prev=outgoingEvidence.get(key);
        if(prev && Number(prev.owned_to_block||0)<=Number(row.block||0))continue;
        outgoingEvidence.set(key,{
          user_id:ctx.currentUser.id,
          project_key:PROJECT_KEY,
          chain_key:CHAIN_KEY,
          nft_contract:nftContract,
          nft_id:Number(nftId),
          nft_name:nftName,
          wallet_id:walletId,
          owned_from_block:null,
          owned_from_at:null,
          owned_to_block:Number(row.block||0),
          owned_to_at:row.ts,
          is_current:false,
          entry_from_address:null,
          entry_tx_hash:null,
          acquisition_kind:"outgoing_transfer_evidence_only",
          acquisition_verified:false,
          acquisition_tx_hash:null
        });
      }
      ownPeriods.push(...outgoingEvidence.values());
      if(ownPeriods.length){
        console.info("DAO1 NFT historische Ownership nur durch Abgang belegt",{
          nft:`${nftContract}#${nftId}`,
          periods:ownPeriods.map(r=>({wallet_id:r.wallet_id,to_block:r.owned_to_block,to_at:r.owned_to_at}))
        });
      }
    }
    if(!ownPeriods.length)return 0;


    // Deterministischer Neuaufbau aus der vollständigen NFT-Transferhistorie.
    // Alte Cache-Perioden dürfen keinen falschen Ersterwerb konservieren.
    const ownershipPeriodSortBlock=row=>{
      if(row?.acquisition_kind==="current_state_evidence_only" && row?.is_current)return Number.MAX_SAFE_INTEGER;
      const from=Number(row?.owned_from_block||0); if(from>0)return from;
      const to=Number(row?.owned_to_block||0); if(to>0)return to;
      return Number.MAX_SAFE_INTEGER-1;
    };
    const rebuilt=ownPeriods.sort((a,b)=>ownershipPeriodSortBlock(a)-ownershipPeriodSortBlock(b));

    // "Erstmals von dir erworben" darf nur als verifiziert gelten, wenn wir den
    // wirtschaftlichen Erwerb on-chain belegen können.
    if(rebuilt.length){
      const firstPeriod=rebuilt[0];
      const zero="0x0000000000000000000000000000000000000000";
      const entryFrom=lower(firstPeriod.entry_from_address||"");
      const evidenceOnly=firstPeriod.acquisition_kind==="outgoing_transfer_evidence_only";
      let acquisitionKind=evidenceOnly?"outgoing_transfer_evidence_only":"wallet_receipt_only";
      let acquisitionVerified=false;

      // Direkter Mint an eigene Wallet = sicherer on-chain Ersterwerb.
      if(!evidenceOnly && entryFrom===zero){
        acquisitionKind="mint_to_own_wallet";
        acquisitionVerified=true;
      }else if(!evidenceOnly && firstPeriod.entry_tx_hash){
        // Sekundärkauf / Kaufvertrag: wenn in derselben Tx eine ERC-20-Zahlung
        // von derselben eigenen Wallet ausgeht, werten wir den Eingang als Kauf.
        try{
          const txRows=await fetchTransactionTokenTransfers(firstPeriod.entry_tx_hash);
          const ownWallet=trackedWallets.find(w=>String(w?.dbId||w?.id||"")===String(firstPeriod.wallet_id));
          const ownAddr=lower(walletAddress(ownWallet)||"");
          const hasPayment=txRows.some(t=>{
            const token=t?.token||{};
            const type=String(token.type||t?.token_type||t?.type||"").toUpperCase();
            if(type!=="ERC-20")return false;
            if(transferFromAddress(t)!==ownAddr)return false;
            const raw=t?.total?.value??t?.value??t?.amount??null;
            if(raw==null)return false;
            try{return BigInt(String(raw))>0n;}catch{return Number(raw)>0;}
          });
          if(hasPayment){
            acquisitionKind="purchase_same_tx";
            acquisitionVerified=true;
          }
        }catch(e){
          console.warn("DAO1 NFT Erwerbsnachweis-Tx",firstPeriod.entry_tx_hash,e);
        }
      }

      for(const r of rebuilt){
        const evidenceKind=String(r.acquisition_kind||"");
        if(evidenceKind==="outgoing_transfer_evidence_only" || evidenceKind==="current_state_evidence_only"){
          r.acquisition_verified=false;
          r.acquisition_tx_hash=null;
          continue;
        }
        r.acquisition_kind=acquisitionKind;
        r.acquisition_verified=acquisitionVerified;
        // Phase 5.58: Die Entry-Tx ist auch dann wertvolle Evidence, wenn der wirtschaftliche
        // Kauf noch nicht verifiziert wurde. Ohne diese Tx konnte der zentrale Preisresolver
        // historische DAO1-Käufe später nicht mehr nachanalysieren.
        r.acquisition_tx_hash=firstPeriod.entry_tx_hash||null;
      }
    }

    // Bei internen Transfers darf der vorherige eigene Besitzabschnitt nicht als
    // endgültiger Verlust der User-Eigentümersphäre interpretiert werden. Für die Anzeige
    // bleibt jedoch jede Wallet-Periode einzeln erhalten.
    for(let i=0;i<rebuilt.length;i++){
      const r=rebuilt[i],next=rebuilt[i+1]||null;
      r.is_current=!next && r.is_current!==false;
      if(next && r.owned_to_block==null){
        r.owned_to_block=Number(next.owned_from_block||0)||null;
        r.owned_to_at=next.owned_from_at||null;
        r.is_current=false;
      }
    }

    await sb.from("project_nft_ownership")
      .delete()
      .eq("user_id",ctx.currentUser.id)
      .eq("project_key",PROJECT_KEY)
      .eq("chain_key",CHAIN_KEY)
      .eq("nft_contract",nftContract)
      .eq("nft_id",Number(nftId));

    const {error}=await sb.from("project_nft_ownership").insert(rebuilt);
    if(error) throw error;
    if(String(nftId)==="7993" || String(nftId)==="7994"){
      const compact=rebuilt.map(r=>({
        wallet_id:r.wallet_id,
        from_block:Number(r.owned_from_block||0),
        from_at:r.owned_from_at||null,
        to_block:Number(r.owned_to_block||0)||null,
        to_at:r.owned_to_at||null,
        current:!!r.is_current
      }));
      console.info("DAO1 NFT Solar Besitzperioden gespeichert",{nft:`${nftContract}#${nftId}`,periods:compact});
      try{
        const {data:verify,error:verifyError}=await sb.from("project_nft_ownership")
          .select("wallet_id,owned_from_block,owned_from_at,owned_to_block,owned_to_at,is_current")
          .eq("user_id",ctx.currentUser.id).eq("project_key",PROJECT_KEY).eq("chain_key",CHAIN_KEY)
          .eq("nft_contract",nftContract).eq("nft_id",Number(nftId))
          .order("owned_from_block",{ascending:true});
        console.info("DAO1 NFT Solar Besitzperioden DB-Readback",{
          nft:`${nftContract}#${nftId}`,
          error:verifyError?.message||null,
          periods:verify||[]
        });
      }catch(e){console.warn("DAO1 NFT Solar DB-Readback",e);}
    }
    return rebuilt.length;
  }
  async function selectWallet(id){
    selectedWalletId=String(id||""); selectedNftId="";
    await loadCurrentApertumNfts();
    renderMinerSelector();
    renderNftClassification();
  }
  function selectNft(id){ selectedNftId=String(id||""); }
  function selectNftClass(value){ selectedNftClass=String(value||"Mining-Bot"); selectedNftId="__all"; renderMinerSelector(); }
  async function useManualNft(){
    const v=String(document.getElementById("dao1ManualNft")?.value||"").trim();
    if(!/^\d+$/.test(v)) return alert("Bitte eine gültige NFT-ID eingeben.");
    manualNftId=v; selectedNftId=`manual|${v}`;
    // Try ownership discovery immediately, but keep manual selection even if explorer data is missing.
    try{ await discoverOwnershipForNft(v,DEFAULT_MINER_NFT_CONTRACT,`NFT #${v}`); await loadOwnershipCache(); }catch(e){ console.warn("Manuelle NFT Ownership:",e); }
    renderMinerSelector(`NFT #${v} wurde manuell für die Auswertung gewählt.`);
    selectedNftId=v;
    const sel=document.getElementById("dao1NftSelect");
    if(sel && ![...sel.options].some(o=>o.value===v)){
      const o=document.createElement("option"); o.value=`manual|${v}`; o.textContent=`${nftMetaById.get(`${lower(DEFAULT_MINER_NFT_CONTRACT)}|${v}`)?.name || "NFT"} #${v} · manuell`; o.selected=true; sel.appendChild(o);
    }else if(sel) sel.value=`manual|${v}`;
  }

  async function loadMiners() {
    const ctx = getContext?.();
    if (!sb || !ctx?.currentUser) return;
    const { data, error } = await sb.from("project_miners").select("*").eq("project_key", PROJECT_KEY).eq("user_id", ctx.currentUser.id).eq("enabled", true).order("created_at");
    if (error) {
      miners = [];
      renderMinerEditor(error.message);
      return;
    }
    miners = (data || []).map(hydratePrivateWalletAddress);
    renderMinerEditor();
  }

  function renderMinerEditor(dbError = "") {
    const el = document.getElementById("dao1AdminMinerEditor");
    const ctx = getContext?.();
    if (!el) return;
    if (dbError) {
      el.innerHTML = `<div class="note">Miner-Tabelle noch nicht verfügbar: ${dbError}. Bitte zuerst <code>sql/001-dao1-apertum.sql</code> ausführen.</div>`;
      return;
    }
    const rows = miners.map(m => `<div class="custom-token-row"><div><strong>${m.label || "Miner #" + m.nft_id}</strong><div class="meta">${m.wallet_address} · NFT ${m.nft_id}</div></div>${ctx?.isAdmin ? `<button class="remove" onclick="DAO1Project.deleteMiner('${m.id}')">Löschen</button>` : ""}</div>`).join("");
    const admin = ctx?.isAdmin ? `<div class="custom-token-grid" style="grid-template-columns:2fr 1fr 1fr auto;margin-top:10px"><input id="dao1MinerWallet" placeholder="Apertum Wallet 0x…"><input id="dao1MinerNft" type="number" placeholder="NFT-ID"><input id="dao1MinerLabel" placeholder="Bezeichnung"><button onclick="DAO1Project.addMiner()">+ Miner</button></div>` : "";
    el.innerHTML = `<span class="field-label">Miner-Zuordnungen</span>${rows || '<div class="empty">Noch keine Miner hinterlegt.</div>'}${admin}`;
  }

  async function addMiner() {
    const ctx = getContext?.();
    if (!ctx?.isAdmin || !ctx.currentUser) return;
    const wallet = document.getElementById("dao1MinerWallet")?.value.trim();
    const nft = Number(document.getElementById("dao1MinerNft")?.value);
    const label = document.getElementById("dao1MinerLabel")?.value.trim();
    if (!wallet || !Number.isFinite(nft)) return alert("Wallet und NFT-ID eingeben.");
    let walletId;
    try{walletId=walletIdForAddress(wallet);}catch(e){return alert("Die Miner-Wallet muss zuerst unter Meine Wallets gespeichert sein.");}
    const { error } = await sb.from("project_miners").insert({ user_id: ctx.currentUser.id, project_key: PROJECT_KEY, chain_key: CHAIN_KEY, wallet_id: walletId, nft_id: nft, label: label || `Miner #${nft}`, enabled: true });
    if (error) return alert(error.message);
    await loadMiners();
  }

  async function deleteMiner(id) {
    const ctx = getContext?.();
    if (!ctx?.isAdmin || !confirm("Miner-Zuordnung löschen?")) return;
    const { error } = await sb.from("project_miners").delete().eq("id", id).eq("user_id", ctx.currentUser.id);
    if (error) return alert(error.message);
    await loadMiners();
  }

  function sleep(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }

  async function fetchWithRetry(url, options={}, label="Netzwerk", attempts=3, timeoutMs=30000) {
    let lastError=null;
    for(let i=1;i<=attempts;i++){
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),timeoutMs);
      try{
        const r=await fetch(url,{...options,signal:controller.signal});
        clearTimeout(timeout);
        if(!r.ok){
          const e=new Error(`${label}: HTTP ${r.status}`);
          e.httpStatus=r.status;
          throw e;
        }
        return r;
      }catch(e){
        clearTimeout(timeout);
        lastError=e;
        if(i<attempts)await sleep(600*i);
      }
    }
    const detail=lastError?.name==="AbortError"
      ? "Zeitüberschreitung"
      : (lastError?.message==="Failed to fetch" || /fetch/i.test(lastError?.message||""))
        ? "Netzwerkzugriff fehlgeschlagen (Failed to fetch)"
        : (lastError?.message||"unbekannter Fehler");
    throw new Error(`${label}: ${detail}`);
  }

  async function fetchJson(url, label="Apertum Explorer") {
    const r = await fetchWithRetry(url,{headers:{accept:"application/json"}},label,3);
    try{return await r.json();}
    catch{throw new Error(`${label}: ungültige JSON-Antwort`);}
  }
  function nextUrl(base, next) {
    if (!next) return null;
    const u = new URL(base);
    for (const [k,v] of Object.entries(next)) if (v != null) u.searchParams.set(k, String(v));
    return u.toString();
  }
  async function fetchAll(path) {
    let url = EXPLORER_API + path, out = [];
    while (url) {
      const j = await fetchJson(url, `Apertum Explorer ${path}`);
      out.push(...(j.items || []));
      url = nextUrl(EXPLORER_API + path, j.next_page_params);
    }
    return out;
  }
  function words(input) {
    let h = String(input || "").replace(/^0x/, "");
    if (h.length >= 8) h = h.slice(8);
    const out = [];
    for (let i=0;i+64<=h.length;i+=64) try { out.push(BigInt("0x" + h.slice(i,i+64))); } catch {}
    return out;
  }
  function feeAptm(t) {
    try {
      if (t?.fee?.value != null) return Number(BigInt(t.fee.value))/1e18;
      if (t?.gas_used != null && t?.gas_price != null) return Number(BigInt(t.gas_used)*BigInt(t.gas_price))/1e18;
    } catch {}
    return 0;
  }
  function topicAddr(t) { return "0x" + String(t || "").replace(/^0x/, "").slice(-40); }
  function rewardFromLogs(logs, wallet) {
    let total = 0;
    for (const l of logs || []) {
      if (lower(H(l.address)) !== lower(SYSTEM_ADDRESS)) continue;
      const targets = (l.topics || []).slice(1).map(topicAddr);
      if (!targets.some(a => lower(a) === lower(wallet))) continue;
      try { total += Number(BigInt(l.data || "0"))/1e18; } catch {}
    }
    return total;
  }

  const dao1InternalRewardCache=new Map();
  const dao1InternalRewardInflight=new Map();
  const dao1TraceRewardCache=new Map();
  let dao1TraceTransactionSupported=null;
  let dao1DebugTraceSupported=null;

  function nativeWeiAmount(value){
    try{
      if(value==null||value==="")return 0;
      return Number(BigInt(String(value)))/1e18;
    }catch{return 0;}
  }
  function sumPreferredNativeTransfers(rows,target,source){
    const valid=(rows||[]).filter(x=>x&&lower(x.to||"")===target&&Number(x.amount||0)>0);
    if(!valid.length)return 0;
    const direct=source?valid.filter(x=>lower(x.from||"")===source):valid;
    return (direct.length?direct:valid).reduce((sum,x)=>sum+Number(x.amount||0),0);
  }
  async function rewardFromRpcTrace(txHash,wallet,expectedFrom=null){
    const hash=String(txHash||"").toLowerCase(),target=lower(wallet),source=lower(expectedFrom||"");
    const key=`${hash}|${target}|${source}`;
    if(dao1TraceRewardCache.has(key))return dao1TraceRewardCache.get(key)||0;
    let amount=0;

    // Avalanche/Subnet-kompatible Nodes unterstützen je nach Client entweder
    // trace_transaction oder debug_traceTransaction(callTracer). Capability wird
    // nach dem ersten echten Fehlschlag pro Session abgeschaltet, damit 200+ Claims
    // nicht denselben unsupported RPC immer wieder probieren.
    if(dao1TraceTransactionSupported!==false){
      try{
        const traces=await rpc("trace_transaction",[hash]);
        dao1TraceTransactionSupported=true;
        const rows=(Array.isArray(traces)?traces:[]).map(t=>({
          from:t?.action?.from||"",to:t?.action?.to||"",amount:nativeWeiAmount(t?.action?.value),
          failed:!!t?.error
        })).filter(x=>!x.failed);
        amount=sumPreferredNativeTransfers(rows,target,source);
      }catch(e){
        dao1TraceTransactionSupported=false;
        console.info("DAO1 trace_transaction nicht verfügbar; debug_traceTransaction-Fallback wird verwendet.",e?.message||e);
      }
    }
    if(!(amount>0) && dao1DebugTraceSupported!==false){
      try{
        const root=await rpc("debug_traceTransaction",[hash,{tracer:"callTracer",timeout:"12s"}]);
        dao1DebugTraceSupported=true;
        const rows=[];
        const walk=node=>{
          if(!node||typeof node!=="object")return;
          rows.push({from:node.from||"",to:node.to||"",amount:nativeWeiAmount(node.value),failed:!!node.error});
          for(const c of (node.calls||[]))walk(c);
        };
        walk(root);
        amount=sumPreferredNativeTransfers(rows.filter(x=>!x.failed),target,source);
      }catch(e){
        dao1DebugTraceSupported=false;
        console.info("DAO1 debug_traceTransaction nicht verfügbar; native Auszahlung bleibt ohne Trace-Beweis.",e?.message||e);
      }
    }
    dao1TraceRewardCache.set(key,Number(amount||0));
    return Number(amount||0);
  }

  async function rewardFromInternalTransactions(txHash,wallet,expectedFrom=null){
    const target=lower(wallet);
    const source=lower(expectedFrom||"");
    const hash=String(txHash||"").toLowerCase();
    const cacheKey=`${hash}|${target}|${source}`;
    if(dao1InternalRewardCache.has(cacheKey))return dao1InternalRewardCache.get(cacheKey)||0;
    if(dao1InternalRewardInflight.has(cacheKey))return dao1InternalRewardInflight.get(cacheKey);
    const job=(async()=>{
      let rows=[];
      try{
        rows=await fetchAll(`/transactions/${hash}/internal-transactions`);
      }catch(e){
        console.warn("DAO1 Claim Internal Transactions",txHash,e);
        return rewardFromRpcTrace(hash,wallet,expectedFrom);
      }
      const valid=[];
      for(const r of rows){
        const to=lower(H(r?.to) || r?.to_address || r?.to_address_hash || "");
        const from=lower(H(r?.from) || r?.from_address || r?.from_address_hash || "");
        if(to!==target)continue;
        if(r?.error || r?.success===false || String(r?.status||"").toLowerCase()==="error")continue;
        try{
          const raw=r?.value?.value ?? r?.value ?? "0";
          const amount=Number(BigInt(String(raw)))/1e18;
          if(amount>0)valid.push({from,amount});
        }catch{}
      }
      if(valid.length){
        // Bevorzugt weiterhin die direkte Auszahlung vom erwarteten Claim-Contract.
        // Proxy-/Router-Strukturen dürfen aber einen darunterliegenden Contract als
        // tatsächlichen Internal-Absender verwenden. Gibt es keinen Direct-Match,
        // zählt deshalb die nachweislich erfolgreiche native Zahlung an genau das Wallet.
        const direct=source?valid.filter(x=>x.from===source):valid;
        const chosen=direct.length?direct:valid;
        const sum=chosen.reduce((total,x)=>total+x.amount,0);
        if(sum>0)return sum;
      }
      // Blockscout liefert bei historischen Apertum-Claims teilweise eine leere
      // Internal-Transaction-Liste. Dann gezielt den RPC-Trace derselben Tx prüfen.
      return rewardFromRpcTrace(hash,wallet,expectedFrom);
    })();
    dao1InternalRewardInflight.set(cacheKey,job);
    try{
      const amount=await job;
      dao1InternalRewardCache.set(cacheKey,Number(amount||0));
      return Number(amount||0);
    }finally{
      dao1InternalRewardInflight.delete(cacheKey);
    }
  }

  async function mapLimited(items,limit,worker){
    const input=Array.isArray(items)?items:[];
    if(!input.length)return [];
    const out=new Array(input.length);
    let cursor=0;
    const count=Math.min(Math.max(1,Number(limit||1)),input.length);
    async function run(){
      while(true){
        const i=cursor++;
        if(i>=input.length)return;
        out[i]=await worker(input[i],i);
      }
    }
    await Promise.all(Array.from({length:count},run));
    return out;
  }

  function rpcCandidates(){
    const ctx=getContext?.();
    const cfg=ctx?.chainConfig?.[CHAIN_KEY] || {};
    const candidates=[
      cfg.rpcUrl,cfg.rpc_url,cfg.rpc,cfg.balanceRpcUrl,cfg.balance_rpc_url,
      RPC_URL
    ].filter(Boolean);
    return [...new Set(candidates)];
  }

  async function rpc(method, params) {
    let lastError=null;
    for(const url of rpcCandidates()){
      try{
        const r=await fetchWithRetry(url,{
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})
        },`Apertum RPC (${method})`,2);
        const j=await r.json();
        if(j.error)throw new Error(`Apertum RPC (${method}): ${j.error.message}`);
        return j.result;
      }catch(e){
        lastError=e;
        console.warn("Apertum RPC Fallback:",url,e);
      }
    }
    throw lastError || new Error(`Apertum RPC (${method}): kein RPC-Endpunkt verfügbar`);
  }
  const hexBlock = n => "0x" + Math.max(0, Number(n)).toString(16);
  function decodeSync(data, aptmDecimals, usdtDecimals) {
    const h = String(data || "").replace(/^0x/, "");
    if (h.length < 128) return null;
    const r0 = BigInt("0x" + h.slice(0,64));
    const r1 = BigInt("0x" + h.slice(64,128));
    const reserveA = Number(r0) / 10**aptmDecimals;
    const reserveU = Number(r1) / 10**usdtDecimals;
    if (!(reserveA > 0 && reserveU > 0)) return null;
    return { reserveAptm: reserveA, reserveUsdt: reserveU, aptmUsd: reserveU/reserveA };
  }
  async function ethCall(to, data) { return rpc("eth_call", [{to,data}, "latest"]); }
  async function poolMeta() {
    const token0 = "0x" + (await ethCall(PAIR_ADDRESS, "0x0dfe1681")).slice(-40);
    const token1 = "0x" + (await ethCall(PAIR_ADDRESS, "0xd21220a7")).slice(-40);
    const d0 = Number(BigInt(await ethCall(token0, "0x313ce567")));
    const d1 = Number(BigInt(await ethCall(token1, "0x313ce567")));
    const waptm = lower(token0).includes("110ac02ba3384bc055c13a87766049a74517beda") ? token0 : token1;
    const aptmIs0 = lower(token0) === lower(waptm);
    return { token0, token1, d0, d1, aptmIs0 };
  }

  async function loadCachedPrices(minBlock, maxBlock) {
    const requestedMin=Math.max(0,Number(minBlock||0)),max=Math.max(requestedMin,Number(maxBlock||0));
    if(max<APTM_MARKET_START_BLOCK)return [];
    const min=Math.max(APTM_MARKET_START_BLOCK,requestedMin);
    // Load only the requested range plus exactly one predecessor anchor. The previous
    // implementation loaded the complete pool history from genesis on every call.
    const {data,error}=await sb.from("aptm_price_history").select("*")
      .eq("pool_address",lower(PAIR_ADDRESS)).gte("block_number",min).lte("block_number",max)
      .order("block_number",{ascending:true}).order("log_index",{ascending:true});
    if(error)throw error;
    let predecessor=[];
    if(min>0){
      const {data:prev,error:prevError}=await sb.from("aptm_price_history").select("*")
        .eq("pool_address",lower(PAIR_ADDRESS)).lt("block_number",min)
        .order("block_number",{ascending:false}).order("log_index",{ascending:false}).limit(1);
      if(prevError)throw prevError;
      predecessor=prev||[];
    }
    return [...predecessor,...(data||[])].sort((a,b)=>Number(a.block_number)-Number(b.block_number)||Number(a.log_index)-Number(b.log_index));
  }
  function priceAtBlock(history, block) {
    // History is sorted by block/log index. Binary search avoids O(history × tx)
    // work during large repricing jobs.
    const target=Number(block);
    if(!Array.isArray(history)||!history.length||!Number.isFinite(target))return null;
    let lo=0,hi=history.length-1,best=-1;
    while(lo<=hi){
      const mid=(lo+hi)>>1;
      if(Number(history[mid].block_number)<=target){best=mid;lo=mid+1;}
      else hi=mid-1;
    }
    return best>=0?history[best]:null;
  }

  function priceRowFromSyncLog(l,meta){
    const raw=String(l.data||"").replace(/^0x/,"");
    if(raw.length<128)return null;
    const a=BigInt("0x"+raw.slice(0,64));
    const b=BigInt("0x"+raw.slice(64,128));
    const aptmRaw=meta.aptmIs0?a:b;
    const usdtRaw=meta.aptmIs0?b:a;
    const aptmDecimals=meta.aptmIs0?meta.d0:meta.d1;
    const usdtDecimals=meta.aptmIs0?meta.d1:meta.d0;
    const reserveAptm=Number(aptmRaw)/10**aptmDecimals;
    const reserveUsdt=Number(usdtRaw)/10**usdtDecimals;
    if(!(reserveAptm>0 && reserveUsdt>0))return null;
    return {
      project_key:PROJECT_KEY,
      chain_key:CHAIN_KEY,
      pool_address:lower(PAIR_ADDRESS),
      block_number:parseInt(l.blockNumber,16),
      log_index:parseInt(l.logIndex,16),
      tx_hash:l.transactionHash,
      reserve_aptm:reserveAptm,
      reserve_usdt:reserveUsdt,
      aptm_usd:reserveUsdt/reserveAptm
    };
  }

  function compactPriceRowsByBlock(rows){
    // aptm_price_history is a block-level fallback cache. Historical valuation asks
    // for the last known pool state at/before a target block, never for an earlier
    // Sync inside the same block. Keep only the highest log_index per pool+block so
    // the global cache cannot grow again with redundant intra-block Sync states.
    const byBlock=new Map();
    for(const row of rows||[]){
      const key=`${lower(row?.pool_address||PAIR_ADDRESS)}|${Number(row?.block_number)}`;
      const prev=byBlock.get(key);
      if(!prev || Number(row?.log_index||0)>Number(prev?.log_index||0))byBlock.set(key,row);
    }
    return [...byBlock.values()].sort((a,b)=>Number(a.block_number)-Number(b.block_number)||Number(a.log_index)-Number(b.log_index));
  }

  async function savePriceRows(rows){
    const compact=compactPriceRowsByBlock(rows);
    if(!compact.length)return [];
    const {error}=await sb.from("aptm_price_history")
      .upsert(compact,{onConflict:"pool_address,block_number,log_index",ignoreDuplicates:true});
    if(error){console.warn("APTM Preis-Cache speichern:",error);throw error;}
    return compact;
  }

  function mergeCoverageRanges(rows){
    const ranges=(rows||[])
      .map(r=>[Number(r.from_block),Number(r.to_block)])
      .filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)&&a<=b)
      .sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const out=[];
    for(const r of ranges){
      const last=out[out.length-1];
      if(last&&r[0]<=last[1]+1)last[1]=Math.max(last[1],r[1]);
      else out.push([...r]);
    }
    return out;
  }

  async function loadPriceCoverage(fromBlock,toBlock){
    const requestedFrom=Math.max(0,Number(fromBlock||0)),to=Math.max(requestedFrom,Number(toBlock||0));
    if(to<APTM_MARKET_START_BLOCK)return [];
    const from=Math.max(APTM_MARKET_START_BLOCK,requestedFrom);
    try{
      const all=[];
      let offset=0;
      while(true){
        const {data,error}=await sb.from("aptm_price_coverage").select("from_block,to_block,sync_count")
          .eq("project_key",PROJECT_KEY).eq("chain_key",CHAIN_KEY)
          .eq("pool_address",lower(PAIR_ADDRESS)).eq("parser_version",PRICE_COVERAGE_VERSION)
          .lte("from_block",to).gte("to_block",from)
          .order("from_block",{ascending:true}).range(offset,offset+DB_PAGE_SIZE-1);
        if(error)throw error;
        const page=data||[];
        all.push(...page);
        if(page.length<DB_PAGE_SIZE)break;
        offset+=DB_PAGE_SIZE;
      }
      return mergeCoverageRanges(all);
    }catch(e){
      // Deployment-safe: if migration 047 is not installed yet, pricing still works,
      // only without persistent range reuse.
      console.warn("APTM Coverage-Cache lesen:",e);
      if(activePriceJobLog)priceJobLog("Coverage-Tabelle nicht verfügbar · temporärer RPC-Modus");
      return [];
    }
  }

  function subtractCoveredRange(fromBlock,toBlock,covered){
    const from=Math.max(0,Number(fromBlock||0)),to=Math.max(from,Number(toBlock||0));
    const gaps=[];
    let cursor=from;
    for(const [a0,b0] of mergeCoverageRanges((covered||[]).map(([a,b])=>({from_block:a,to_block:b})))){
      const a=Math.max(from,a0),b=Math.min(to,b0);
      if(b<cursor||a>to)continue;
      if(a>cursor)gaps.push([cursor,a-1]);
      cursor=Math.max(cursor,b+1);
      if(cursor>to)break;
    }
    if(cursor<=to)gaps.push([cursor,to]);
    return gaps;
  }

  async function savePriceCoverage(fromBlock,toBlock,syncCount){
    const ctx=getContext?.();
    if(!ctx?.isAdmin)return;
    try{
      const row={
        project_key:PROJECT_KEY,chain_key:CHAIN_KEY,pool_address:lower(PAIR_ADDRESS),
        parser_version:PRICE_COVERAGE_VERSION,from_block:Number(fromBlock),to_block:Number(toBlock),
        sync_count:Number(syncCount||0),scanned_at:new Date().toISOString()
      };
      const {error}=await sb.from("aptm_price_coverage").upsert(row,{onConflict:"pool_address,parser_version,from_block,to_block"});
      if(error)throw error;
    }catch(e){
      console.warn("APTM Coverage-Cache speichern:",e);
      if(activePriceJobLog)priceJobLog("Coverage konnte nicht persistent gespeichert werden");
    }
  }

  async function fetchSyncLogsVerifiedAdaptive(fromBlock,toBlock,status,depth=0){
    if(fromBlock>toBlock)return [];
    try{
      if(activePriceJobLog){activePriceJobLog.rpcChunks++;renderPriceJobLog();}
      if(status)status.textContent=`Historische APTM-Kurse: Pool-Syncs ${fromBlock}–${toBlock}…`;
      return await rpc("eth_getLogs",[{
        fromBlock:hexBlock(fromBlock),toBlock:hexBlock(toBlock),address:PAIR_ADDRESS,topics:[SYNC_TOPIC]
      }]);
    }catch(e){
      const span=toBlock-fromBlock+1;
      if(span<=500||depth>=12)throw e; // never mark an unresolved range as covered
      const mid=Math.floor((fromBlock+toBlock)/2);
      const left=await fetchSyncLogsVerifiedAdaptive(fromBlock,mid,status,depth+1);
      const right=await fetchSyncLogsVerifiedAdaptive(mid+1,toBlock,status,depth+1);
      return [...left,...right];
    }
  }

  async function syncPriceRangeChunked(minBlock,maxBlock,status){
    const ctx=getContext?.();
    if(!ctx?.isAdmin)return [];
    const requestedMin=Math.max(0,Number(minBlock||0)),max=Math.max(requestedMin,Number(maxBlock||0));
    if(max<APTM_MARKET_START_BLOCK)return [];
    const min=Math.max(APTM_MARKET_START_BLOCK,requestedMin);
    const covered=await loadPriceCoverage(min,max);
    const missing=subtractCoveredRange(min,max,covered);
    if(activePriceJobLog){
      activePriceJobLog.coverageHits+=covered.length;
      priceJobLog(`Coverage ${min}–${max}: ${covered.length} vorhandene Bereiche · ${missing.length} Lücken`);
    }
    if(!missing.length)return [];

    const ranges=[];
    for(const [a,b] of missing){
      for(let from=a;from<=b;from+=PRICE_RPC_CHUNK)ranges.push([from,Math.min(b,from+PRICE_RPC_CHUNK-1)]);
    }
    const meta=await poolMeta();
    const rows=[];
    let next=0,done=0;
    async function worker(){
      while(true){
        const idx=next++;
        if(idx>=ranges.length)return;
        const [from,to]=ranges[idx];
        try{
          const logs=await fetchSyncLogsVerifiedAdaptive(from,to,null);
          const part=(logs||[]).map(l=>priceRowFromSyncLog(l,meta)).filter(Boolean);
          // Order is deliberate: sync rows first, coverage second. Coverage is only proof
          // after the complete RPC range succeeded and all discovered Sync rows were saved.
          const saved=part.length?await savePriceRows(part):[];
          await savePriceCoverage(from,to,part.length);
          rows.push(...saved);
          done++;
          if(activePriceJobLog){
            activePriceJobLog.coverageScans++;
            activePriceJobLog.syncLogs+=part.length;
            if(done===1||done%10===0||done===ranges.length)priceJobLog(`RPC-Coverage ${done}/${ranges.length} · ${part.length} Syncs im letzten Bereich`);
            renderPriceJobLog();
          }
          if(status)status.textContent=`Historische APTM-Kurse: ${done}/${ranges.length} fehlende Coverage-Chunks geprüft…`;
        }catch(e){
          console.warn(`APTM Coverage ${from}-${to} NICHT gespeichert:`,e);
          if(activePriceJobLog)priceJobLog(`RPC-Bereich ${from}–${to} fehlgeschlagen · bleibt ungeprüft`);
          // Continue with other independent ranges. Failed range intentionally remains a gap.
        }
      }
    }
    await Promise.all(Array.from({length:Math.min(PRICE_RPC_CONCURRENCY,ranges.length)},()=>worker()));
    return rows.sort((a,b)=>Number(a.block_number)-Number(b.block_number)||Number(a.log_index)-Number(b.log_index));
  }

  async function repairPriceAnchorBeforeBlock(block,status,{forceSearch=false}={}){
    block=Number(block);
    if(!Number.isFinite(block)||block<0)return null;
    let history=[];
    const localFrom=Math.max(0,block-PRICE_LOOKBACK_BLOCKS+1);
    try{history=await loadCachedPrices(localFrom,block);}catch{}
    let found=priceAtBlock(history,block);
    if(found&&!forceSearch)return found;

    // IMPORTANT: a cached Sync somewhere before the transaction is not proof that the
    // interval up to the transaction was scanned. Search backwards from the transaction
    // itself until the real last Sync before it is found. This prevents one stale cached
    // price from being reused for months of later transactions.
    let to=block;
    let span=PRICE_LOOKBACK_BLOCKS;
    let round=0;
    while(to>=0 && round<18){
      round++;
      const from=Math.max(0,to-span+1);
      if(status)status.textContent=`Historischen APTM-Preis verifizieren: Block ${block} · Suche ${from}–${to}…`;
      try{
        await syncPriceRangeChunked(from,to,status);
        // Also reload when the interval was already fully covered and therefore needed
        // zero new RPC calls. A cached Sync inside this verified interval is sufficient.
        history=await loadCachedPrices(from,block);
        found=priceAtBlock(history,block);
        if(found&&Number(found.block_number)>=from)return found;
      }catch(e){
        console.warn(`APTM Preis-Anker ${from}-${to}:`,e);
      }
      if(from===0)break;
      to=from-1;
      span=Math.min(span*2,500000);
    }
    return found||null;
  }

  function mergePriceWindows(blocks){
    const raw=[...new Set((blocks||[]).map(Number).filter(Number.isFinite))]
      .map(b=>[Math.max(0,b-PRICE_LOOKBACK_BLOCKS+1),b])
      .sort((a,b)=>a[0]-b[0]);
    const merged=[];
    for(const w of raw){
      const last=merged[merged.length-1];
      if(last&&w[0]<=last[1]+1)last[1]=Math.max(last[1],w[1]);
      else merged.push([...w]);
    }
    return merged;
  }

  function hasRecentVerifiedAnchor(history,block){
    const ph=priceAtBlock(history,Number(block));
    return !!(ph&&Number(ph.block_number)>=Number(block)-PRICE_LOOKBACK_BLOCKS+1);
  }

  async function repairMissingPriceBlocks(blocks,status){
    const unique=[...new Set((blocks||[]).map(Number).filter(Number.isFinite))].sort((a,b)=>a-b);
    const repaired=new Map();
    for(let i=0;i<unique.length;i++){
      const block=unique[i];
      let history=[];
      try{history=await loadCachedPrices(0,block);}catch{}
      let ph=priceAtBlock(history,block);
      if(!ph){
        if(status)status.textContent=`Fehlende historische Kurse werden gezielt repariert ${i+1}/${unique.length}…`;
        ph=await repairPriceAnchorBeforeBlock(block,status);
      }
      repaired.set(block,ph||null);
    }
    return repaired;
  }

  function missingPriceWindows(history,claimBlocks){
    const sorted=[...new Set(claimBlocks.map(Number).filter(Number.isFinite))].sort((a,b)=>a-b);
    if(!sorted.length)return [];
    const missing=sorted.filter(b=>!priceAtBlock(history,b));
    if(!missing.length)return [];

    // For the earliest uncovered claim we need a Sync before it. Start with a bounded
    // backward window instead of querying the complete claim history.
    const windows=[];
    let start=Math.max(0,missing[0]-10000);
    let end=missing[0];
    for(const b of missing.slice(1)){
      if(b-end<=10000)end=b;
      else{
        windows.push([start,end]);
        start=Math.max(0,b-10000);
        end=b;
      }
    }
    windows.push([start,end]);
    return windows;
  }


  async function priceForTransaction(block,timestamp,history){
    const target=Number(block);
    const anchorMap=history?._anchorByTarget;
    if(anchorMap instanceof Map){
      if(anchorMap.has(target)){
        const a=anchorMap.get(target);
        if(a?.sync_block!=null && a?.aptm_usd!=null){
          return {
            price:Number(a.aptm_usd),
            priceBlock:Number(a.sync_block),
            source:`APTM/wUSDT Pool · Sync Block ${a.sync_block} · ${PRICE_SOURCE_TAG}`
          };
        }
      }
      // Bei einer expliziten Anchor-Map darf niemals ein Preisanker eines anderen
      // target_block als Ersatz dienen. Das würde die Exact-Garantie verletzen.
      return {price:null,priceBlock:null,source:`Kein belastbarer historischer Poolpreis · ${PRICE_MISSING_TAG}`};
    }
    // Sicherheits-Fallback für alte Aufrufer ohne Anchor-Map.
    const ph=priceAtBlock(history, target);
    if(ph){
      return {price:Number(ph.aptm_usd),priceBlock:Number(ph.block_number),source:`APTM/wUSDT Pool · Sync Block ${ph.block_number} · ${PRICE_SOURCE_TAG}`};
    }
    return {price:null,priceBlock:null,source:`Kein belastbarer historischer Poolpreis · ${PRICE_MISSING_TAG}`};
  }

  function historicalPriceQuality(row){
    if(row?.price_is_manual && row?.aptm_usd!=null)return "manual";
    const source=String(row?.price_source||"");
    if(source.includes(PRICE_PRELAUNCH_TAG))return "prelaunch";
    if(row?.aptm_usd==null)return "missing";
    if(source.includes("APTM/wUSDT Pool · Sync Block"))return "exact";
    return "fallback";
  }

  function historicalPriceQualityCounts(rows){
    const out={exact:0,fallback:0,prelaunch:0,missing:0,manual:0};
    for(const row of rows||[])out[historicalPriceQuality(row)]++;
    return out;
  }

  function splitAnchorClusters(blocks){
    const sorted=[...new Set((blocks||[]).map(Number).filter(Number.isFinite))].sort((a,b)=>a-b);
    const out=[];
    let cur=[];
    for(const b of sorted){
      if(!cur.length){cur=[b];continue;}
      const gap=b-cur[cur.length-1],span=b-cur[0];
      if(gap<=PRICE_ANCHOR_CLUSTER_GAP && span<=PRICE_ANCHOR_CLUSTER_MAX_SPAN)cur.push(b);
      else{out.push(cur);cur=[b];}
    }
    if(cur.length)out.push(cur);
    return out;
  }

  async function loadCachedPriceAnchors(blocks){
    const targets=[...new Set((blocks||[]).map(Number).filter(Number.isFinite))];
    const out=[];
    const BATCH=180;
    try{
      for(let i=0;i<targets.length;i+=BATCH){
        const batch=targets.slice(i,i+BATCH);
        const {data,error}=await sb.from("aptm_price_anchors").select("target_block,sync_block,log_index,tx_hash,aptm_usd,scanned_from_block,scanned_at")
          .eq("project_key",PROJECT_KEY).eq("chain_key",CHAIN_KEY).eq("pool_address",lower(PAIR_ADDRESS))
          .eq("parser_version",PRICE_ANCHOR_VERSION).in("target_block",batch);
        if(error)throw error;
        out.push(...(data||[]));
      }
    }catch(e){
      console.warn("APTM Price-Anchor-Cache lesen:",e);
      if(activePriceJobLog)priceJobLog("Anchor-Tabelle nicht verfügbar · SQL 048 prüfen");
      return [];
    }
    return out;
  }

  async function savePriceAnchors(rows){
    const ctx=getContext?.();
    if(!ctx?.isAdmin || !rows?.length)return;
    const BATCH=500;
    for(let i=0;i<rows.length;i+=BATCH){
      const payload=rows.slice(i,i+BATCH).map(r=>({
        project_key:r.project_key,chain_key:r.chain_key,pool_address:r.pool_address,parser_version:r.parser_version,
        target_block:r.target_block,sync_block:r.sync_block,log_index:r.log_index,tx_hash:r.tx_hash,aptm_usd:r.aptm_usd,
        scanned_from_block:r.scanned_from_block,scanned_at:r.scanned_at
      }));
      const {error}=await sb.from("aptm_price_anchors").upsert(payload,{onConflict:"pool_address,parser_version,target_block"});
      if(error)throw error;
      if(activePriceJobLog){activePriceJobLog.dbBatches++;renderPriceJobLog();}
    }
  }

  async function loadLegacyPredecessorPrice(targetBlock){
    const target=Number(targetBlock);
    if(!Number.isFinite(target)||target<0)return null;
    try{
      const {data,error}=await sb.from("aptm_price_history").select("block_number,log_index,tx_hash,aptm_usd")
        .eq("pool_address",lower(PAIR_ADDRESS)).lte("block_number",target)
        .order("block_number",{ascending:false}).order("log_index",{ascending:false}).limit(1);
      if(error)throw error;
      const r=(data||[])[0];
      if(!r||r.aptm_usd==null||!Number.isFinite(Number(r.aptm_usd))||Number(r.aptm_usd)<=0)return null;
      return {
        project_key:PROJECT_KEY,chain_key:CHAIN_KEY,pool_address:lower(PAIR_ADDRESS),parser_version:PRICE_ANCHOR_VERSION,
        target_block:target,sync_block:Number(r.block_number),log_index:Number(r.log_index||0),tx_hash:r.tx_hash||null,
        aptm_usd:Number(r.aptm_usd),scanned_from_block:Number(r.block_number),scanned_at:new Date().toISOString()
      };
    }catch(e){
      console.warn("APTM Legacy-Preisanker lesen:",e);
      return null;
    }
  }

  async function revalidateNullCachedAnchors(rows,status){
    const out=[];
    for(let i=0;i<(rows||[]).length;i++){
      const r=rows[i];
      const target=Number(r.target_block);
      if(status)status.textContent=`Leere Preisanker werden neu validiert ${i+1}/${rows.length}…`;
      let replacement=await loadLegacyPredecessorPrice(target);
      if(replacement){
        if(activePriceJobLog)activePriceJobLog.legacyAnchorHits++;
      }else{
        const meta=await poolMeta();
        const pred=await findPredecessorSync(target,meta,status);
        replacement={
          project_key:PROJECT_KEY,chain_key:CHAIN_KEY,pool_address:lower(PAIR_ADDRESS),parser_version:PRICE_ANCHOR_VERSION,
          target_block:target,sync_block:pred.row?Number(pred.row.block_number):null,
          log_index:pred.row?Number(pred.row.log_index):null,tx_hash:pred.row?.tx_hash||null,
          aptm_usd:pred.row?Number(pred.row.aptm_usd):null,scanned_from_block:Number(pred.scannedFrom),scanned_at:new Date().toISOString(),
          _diag_rounds:Number(pred.rounds||0),_diag_logs:Number(pred.totalLogs||0),_diag_reason:pred.reason||null
        };
      }
      out.push(replacement);
      if(activePriceJobLog)activePriceJobLog.nullAnchorsRechecked++;
    }
    return out;
  }

  async function findPredecessorSync(targetBlock,meta,status){
    const originalTarget=Math.max(0,Number(targetBlock));
    let to=originalTarget;
    let span=PRICE_ANCHOR_LOCAL_LOOKBACK;
    let rounds=0;
    let totalLogs=0;
    let earliestScanned=originalTarget;
    while(to>=0 && rounds<20){
      rounds++;
      const from=Math.max(0,to-span+1);
      earliestScanned=Math.min(earliestScanned,from);
      if(status)status.textContent=`Historischen Preisanker suchen: ${from}–${to}…`;
      const logs=await fetchSyncLogsVerifiedAdaptive(from,to,null);
      const parsed=(logs||[]).map(l=>priceRowFromSyncLog(l,meta)).filter(Boolean)
        .sort((a,b)=>Number(a.block_number)-Number(b.block_number)||Number(a.log_index)-Number(b.log_index));
      totalLogs+=parsed.length;
      if(activePriceJobLog)activePriceJobLog.syncLogs+=parsed.length;
      if(parsed.length)return {row:parsed[parsed.length-1],scannedFrom:from,rounds,totalLogs,reason:"sync_found"};
      if(from===0)return {row:null,scannedFrom:0,rounds,totalLogs,reason:"genesis_reached"};
      to=from-1;
      span=Math.min(span*2,250000);
    }
    return {row:null,scannedFrom:earliestScanned,rounds,totalLogs,reason:"search_limit_reached"};
  }

  async function buildAnchorsForCluster(targets,meta,status){
    const sorted=[...targets].sort((a,b)=>a-b);
    const first=sorted[0],last=sorted[sorted.length-1];
    const from=Math.max(0,first-PRICE_ANCHOR_LOCAL_LOOKBACK+1);
    if(status)status.textContent=`Historische APTM-Anker: lokale Blöcke ${from}–${last}…`;
    const logs=await fetchSyncLogsVerifiedAdaptive(from,last,null);
    const local=(logs||[]).map(l=>priceRowFromSyncLog(l,meta)).filter(Boolean)
      .sort((a,b)=>Number(a.block_number)-Number(b.block_number)||Number(a.log_index)-Number(b.log_index));
    if(activePriceJobLog)activePriceJobLog.syncLogs+=local.length;

    let predecessor=null,scannedFrom=from;
    const firstLocal=local.find(r=>Number(r.block_number)<=first);
    if(!firstLocal && from>0){
      const pred=await findPredecessorSync(from-1,meta,status);
      predecessor=pred.row;
      scannedFrom=pred.scannedFrom;
    }

    const rows=[];
    let pos=0,lastSeen=predecessor;
    for(const target of sorted){
      while(pos<local.length && Number(local[pos].block_number)<=target){lastSeen=local[pos];pos++;}
      rows.push({
        project_key:PROJECT_KEY,chain_key:CHAIN_KEY,pool_address:lower(PAIR_ADDRESS),parser_version:PRICE_ANCHOR_VERSION,
        target_block:Number(target),sync_block:lastSeen?Number(lastSeen.block_number):null,
        log_index:lastSeen?Number(lastSeen.log_index):null,tx_hash:lastSeen?.tx_hash||null,
        aptm_usd:lastSeen?Number(lastSeen.aptm_usd):null,scanned_from_block:Number(scannedFrom),scanned_at:new Date().toISOString()
      });
    }
    return rows;
  }

  const dao1ReservePriceCache=new Map();
  let dao1HistoricalReserveSupported=null;
  async function exactPoolPriceFromHistoricalReserves(targetBlock,meta){
    const block=Number(targetBlock);
    if(!Number.isFinite(block)||block<APTM_MARKET_START_BLOCK)return null;
    if(dao1HistoricalReserveSupported===false)return null;
    if(dao1ReservePriceCache.has(block))return dao1ReservePriceCache.get(block);
    let row=null;
    try{
      // UniswapV2/Pangolin Pair getReserves() = 0x0902f1ac. Eine historische
      // eth_call-Antwort ist nur 96 Bytes groß und ersetzt für Fresh-Builds den
      // bisherigen teuren eth_getLogs-Suchlauf über hunderte Sync-Events.
      const data=await rpc("eth_call",[{to:PAIR_ADDRESS,data:"0x0902f1ac"},hexBlock(block)]);
      const raw=String(data||"").replace(/^0x/,"");
      if(raw.length>=128){
        const r0=BigInt("0x"+raw.slice(0,64)),r1=BigInt("0x"+raw.slice(64,128));
        const aptmRaw=meta.aptmIs0?r0:r1,usdtRaw=meta.aptmIs0?r1:r0;
        const aptmDecimals=meta.aptmIs0?meta.d0:meta.d1,usdtDecimals=meta.aptmIs0?meta.d1:meta.d0;
        const reserveAptm=Number(aptmRaw)/10**aptmDecimals,reserveUsdt=Number(usdtRaw)/10**usdtDecimals;
        if(reserveAptm>0&&reserveUsdt>0){
          dao1HistoricalReserveSupported=true;
          row={
            project_key:PROJECT_KEY,chain_key:CHAIN_KEY,pool_address:lower(PAIR_ADDRESS),parser_version:PRICE_ANCHOR_VERSION,
            target_block:block,sync_block:block,log_index:null,tx_hash:null,aptm_usd:reserveUsdt/reserveAptm,
            scanned_from_block:block,scanned_at:new Date().toISOString()
          };
        }
      }
    }catch(e){
      // Kein harter Fehler: nicht jeder konfigurierte RPC ist archivfähig. Nach dem
      // ersten echten Fehlschlag nicht hunderte weitere historische eth_call-Versuche
      // erzeugen; die bestehende Sync-Log-Suche bleibt als Fallback erhalten.
      dao1HistoricalReserveSupported=false;
      row=null;
    }
    dao1ReservePriceCache.set(block,row);
    return row;
  }

  async function ensureExactPriceAnchors(blocks,status){
    const targets=[...new Set((blocks||[]).map(Number).filter(Number.isFinite))].sort((a,b)=>a-b);
    const map=new Map();
    if(!targets.length)return map;

    const cached=await loadCachedPriceAnchors(targets);
    const validCached=cached.filter(r=>r?.aptm_usd!=null && r?.sync_block!=null);
    const nullCached=cached.filter(r=>r?.aptm_usd==null || r?.sync_block==null);
    for(const r of validCached)map.set(Number(r.target_block),r);
    if(activePriceJobLog){activePriceJobLog.anchorHits+=validCached.length;priceJobLog(`Anchor-Cache: ${validCached.length}/${targets.length} gültige Zielblöcke · ${nullCached.length} leere Anchor(s) werden neu geprüft`);}

    if(nullCached.length && !getContext?.()?.isAdmin){
      // Nicht-Admins dürfen globale leere Anchors nicht neu berechnen; vorhandener
      // negativer Cache bleibt für sie maßgeblich. Admin-Fresh-Builds behandeln leere
      // Anchors dagegen unten wie fehlende Zielblöcke und versuchen zuerst getReserves.
      for(const r of nullCached)map.set(Number(r.target_block),r);
    }

    const missing=targets.filter(b=>!map.has(b));
    if(!missing.length)return map;
    const ctx=getContext?.();
    if(!ctx?.isAdmin){
      // Nicht-Admins profitieren vom globalen Cache. Fehlende Blöcke werden aus
      // Cache-Poisoning-Gründen nicht clientseitig global geschrieben.
      return map;
    }

    const meta=await poolMeta();

    // Phase 5.99: Zuerst exakten Pool-State am Zielblock per historischem getReserves
    // lesen. Das reduziert einen Fresh-Import mit vielen Claim-Blöcken von großen
    // eth_getLogs-Antworten auf kleine eth_call-Responses. Nur Blöcke, deren RPC
    // keine historische State-Abfrage unterstützt, fallen auf die Sync-Log-Suche zurück.
    const reserveCreated=[];
    await mapLimited(missing,8,async(block,idx)=>{
      const row=await exactPoolPriceFromHistoricalReserves(block,meta);
      if(row){reserveCreated.push(row);map.set(Number(block),row);}
      if(status && ((idx+1)%25===0 || idx+1===missing.length))status.textContent=`Historische APTM-Preise ${idx+1}/${missing.length} per Pool-State geprüft…`;
    });
    if(reserveCreated.length){
      await savePriceAnchors(reserveCreated);
      if(activePriceJobLog)priceJobLog(`Reserve-Anchor: ${reserveCreated.length}/${missing.length} Zielblöcke ohne Log-Scan bewertet`);
    }
    const stillMissing=missing.filter(b=>!map.has(b));
    if(!stillMissing.length)return map;

    const clusters=splitAnchorClusters(stillMissing);
    if(activePriceJobLog)priceJobLog(`${stillMissing.length} Zielblöcke benötigen Sync-Log-Fallback · ${clusters.length} Cluster`);
    const created=[];
    let next=0,done=0;
    async function worker(){
      while(true){
        const idx=next++;
        if(idx>=clusters.length)return;
        const cluster=clusters[idx];
        const rows=await buildAnchorsForCluster(cluster,meta,status);
        created.push(...rows);
        for(const r of rows)map.set(Number(r.target_block),r);
        done++;
        if(activePriceJobLog){
          activePriceJobLog.anchorScans+=rows.length;
          if(done===1||done%10===0||done===clusters.length)priceJobLog(`Anchor-Cluster ${done}/${clusters.length} · ${rows.length} Zielblöcke im letzten Cluster`);
          renderPriceJobLog();
        }
      }
    }
    await Promise.all(Array.from({length:Math.min(PRICE_ANCHOR_CONCURRENCY,clusters.length)},()=>worker()));
    await savePriceAnchors(created);
    if(activePriceJobLog)priceJobLog(`${created.length} globale Preisanker gespeichert`);
    return map;
  }

  async function ensurePricesForClaimBlocks(claimBlocks,status){
    const blocks=[...new Set((claimBlocks||[]).map(Number).filter(Number.isFinite))].sort((a,b)=>a-b);
    const anchorMap=await ensureExactPriceAnchors(blocks,status);
    // Interface-Kompatibilität: bestehende Aufrufer erhalten weiterhin ein Array.
    // priceForTransaction nutzt aber ausschließlich die exakte target_block-Zuordnung.
    const history=[];
    history._anchorByTarget=anchorMap;
    for(const r of anchorMap.values()){
      if(r?.sync_block!=null && r?.aptm_usd!=null)history.push({block_number:Number(r.sync_block),log_index:Number(r.log_index||0),aptm_usd:Number(r.aptm_usd)});
    }
    return history;
  }

  async function historicalAptmPriceAtBlock(block,status=null){
    const target=Number(block);
    if(!Number.isFinite(target) || target<0)return null;
    if(target<APTM_MARKET_START_BLOCK)return {price:null,priceBlock:null,source:`Noch kein On-Chain-Marktpreis vorhanden · Marktstart Block ${APTM_MARKET_START_BLOCK} · ${PRICE_PRELAUNCH_TAG}`,quality:"prelaunch"};
    const history=await ensurePricesForClaimBlocks([target],status);
    const anchor=history?._anchorByTarget?.get(target) || null;
    if(anchor?.sync_block!=null && anchor?.aptm_usd!=null){
      return {
        price:Number(anchor.aptm_usd),
        priceBlock:Number(anchor.sync_block),
        source:`APTM/wUSDT Pool · Sync Block ${anchor.sync_block} · ${PRICE_SOURCE_TAG}`,
        quality:"exact"
      };
    }
    if(anchor && Number(anchor.scanned_from_block)===0){
      return {
        price:null,
        priceBlock:null,
        source:`Noch kein On-Chain-Marktpreis vorhanden · ${PRICE_PRELAUNCH_TAG}`,
        quality:"prelaunch"
      };
    }
    return {
      price:null,
      priceBlock:null,
      source:`Kein belastbarer historischer Poolpreis · ${PRICE_MISSING_TAG}`,
      quality:"missing"
    };
  }

  async function backfillCachedClaimPrices(walletAddress,nftIds,status){
    const claims=await loadCachedClaims(walletAddress,nftIds);
    const missing=claims.filter(r=>!r.price_is_manual && (r.aptm_usd==null || !String(r.price_source||"").includes(PRICE_SOURCE_TAG)));
    if(!missing.length)return claims;
    const blocks=missing.map(r=>Number(r.block_number)).filter(Number.isFinite);
    const history=await ensurePricesForClaimBlocks(blocks,status);
    const updates=[];
    for(const r of missing){
      const px=await priceForTransaction(Number(r.block_number),r.tx_timestamp,history);
      if(px.price==null)continue;
      const assetSymbol=String(r.reward_asset_symbol||"").toUpperCase();
      const assetAmount=Number(r.reward_asset_amount||0);
      let rewardUsd=r.reward_asset_usd==null?null:Number(r.reward_asset_usd);
      if(assetSymbol){
        if(rewardUsd==null && isWrappedAptmSymbol(assetSymbol,""))rewardUsd=assetAmount*Number(px.price);
        if(rewardUsd==null && isStableAssetSymbol(assetSymbol))rewardUsd=assetAmount;
      }else{
        rewardUsd=Number(r.reward_aptm||0)*Number(px.price);
      }
      updates.push({
        ...r,
        aptm_usd:px.price,
        reward_usd:rewardUsd,
        reward_asset_usd:assetSymbol?rewardUsd:r.reward_asset_usd,
        gas_usd:Number(r.gas_aptm||0)*px.price,
        price_block:px.priceBlock,
        price_source:px.source,
        updated_at:new Date().toISOString()
      });
    }
    if(updates.length)await saveClaimRows(updates);
    return loadCachedClaims(walletAddress,nftIds);
  }



  function directionForTx(t,address){
    const a=lower(address),from=lower(H(t.from)),to=lower(H(t.to));
    if(from===a && to===a)return "intern";
    if(to===a)return "eingang";
    if(from===a)return "ausgang";
    return "sonstige";
  }

  function txValueAptm(t){
    try{
      const v=t.value ?? t.value_wei ?? 0;
      if(typeof v==="number") return v>1e12 ? v/1e18 : v;
      return Number(BigInt(String(v||"0")))/1e18;
    }catch{return Number(t.value||0)||0;}
  }

  function methodLabel(t){
    const explicit=String(t.method || t.method_name || t.decoded_input?.method_call || "").trim();
    if(explicit)return explicit;
    const sel=String(t.raw_input||t.input||"").slice(0,10).toLowerCase();
    if(sel===CLAIM_SELECTOR)return "claimReward";
    if(sel===NEW_MINER_CLAIM_SELECTOR)return "Miner Claim";
    return "Transfer/Call";
  }


  function tokenTransferTxHash(t){
    return String(t?.transaction_hash || t?.tx_hash || H(t?.transaction) || t?.hash || "").toLowerCase();
  }

  function tokenTransferAddress(t){
    // Blockscout v2 liefert den ERC-20-Contract unter token.address_hash.
    // Ältere/alternative Explorer-Formate bleiben als Fallback unterstützt.
    return lower(
      t?.token?.address_hash ||
      t?.token?.contract_address_hash ||
      t?.token?.address ||
      H(t?.token) ||
      t?.token_address ||
      t?.address_hash ||
      t?.address ||
      ""
    );
  }

  function tokenTransferRawValue(t){
    const v=t?.total?.value ?? t?.value ?? t?.amount ?? t?.token?.value ?? "0";
    return String(v ?? "0");
  }

  function tokenTransferDecimals(t){
    const d=t?.token?.decimals ?? t?.total?.decimals ?? t?.decimals ?? 18;
    const n=Number(d);
    return Number.isFinite(n)?n:18;
  }

  function decimalAmount(raw,decimals){
    try{
      let v=String(raw??"0").replace(/^0x/i,"");
      let n;
      if(String(raw??"").startsWith("0x"))n=BigInt("0x"+(v||"0"));
      else n=BigInt(String(raw??"0"));
      const neg=n<0n;
      if(neg)n=-n;
      const d=Math.max(0,Number(decimals||0));
      let str=n.toString();
      if(d===0)return (neg?"-":"")+str;
      str=str.padStart(d+1,"0");
      const out=str.slice(0,-d)+"."+str.slice(-d).replace(/0+$/,"");
      return (neg?"-":"")+(out.endsWith(".")?out.slice(0,-1):out);
    }catch{
      const n=Number(raw||0)/Math.pow(10,Number(decimals||0));
      return Number.isFinite(n)?String(n):"0";
    }
  }

  function tokenFlowDirection(t,address){
    const a=lower(address),from=transferFromAddress(t),to=transferToAddress(t);
    if(from===a&&to===a)return "intern";
    if(to===a)return "eingang";
    if(from===a)return "ausgang";
    return "sonst";
  }

  function tokenFlowKey(t,address,index=0){
    const tx=tokenTransferTxHash(t);
    const token=tokenTransferAddress(t);
    const raw=tokenTransferRawValue(t);
    const log=t?.log_index ?? t?.logIndex ?? t?.index ?? index;
    const direction=tokenFlowDirection(t,address);
    // Kein Wallet-/Absender-/Empfängerwert im persistenten Schlüssel:
    // wallet_id + tx/log/token/direction/raw sind für die User-Zeile eindeutig.
    return `${tx}|${token}|${String(log)}|${direction}|${raw}`;
  }

  function tokenFlowCounterparty(t,address){
    const a=lower(address),from=transferFromAddress(t),to=transferToAddress(t);
    const own=new Set((getContext?.().wallets||[]).map(w=>lower(walletAddress(w))).filter(Boolean));
    if(from===a&&to===a)return null;
    if(to===a)return own.has(from)?null:from;
    if(from===a)return own.has(to)?null:to;
    return null;
  }

  function tokenFlowSymbol(t){
    return String(t?.token?.symbol || t?.symbol || t?.token_symbol || "").trim();
  }

  function tokenFlowName(t){
    return String(t?.token?.name || t?.token_name || "").trim();
  }

  function isStableAssetSymbol(symbol){
    return ["WUSDT","USDT","WUSDC","USDC"].includes(String(symbol||"").toUpperCase());
  }

  function isWrappedAptmSymbol(symbol,name=""){
    const s=String(symbol||"").toUpperCase(),n=String(name||"").toUpperCase();
    return s==="WAPTM" || n.includes("WRAPPED APTM") || n.includes("WAPTM");
  }

  function isNativeAptmAssetFlow(row){
    return String(row?.token_address||"").toLowerCase()==="native" && String(row?.token_symbol||"").toUpperCase()==="APTM";
  }

  function isAptmPricedAssetFlow(row){
    return isNativeAptmAssetFlow(row) || isWrappedAptmSymbol(row?.token_symbol,row?.token_name);
  }

  async function getTokenFlowScanState(address){
    const {data,error}=await sb.from("project_scan_state")
      .select("*")
      .eq("user_id",getContext?.().currentUser.id)
      .eq("project_key",PROJECT_KEY)
      .eq("chain_key",CHAIN_KEY)
      .eq("wallet_id",walletIdForAddress(address))
      .eq("scan_type",TOKEN_FLOW_SCAN_TYPE)
      .maybeSingle();
    if(error)throw error;
    return data||null;
  }

  async function saveTokenFlowScanState(address,lastBlock){
    const ctx=getContext?.();
    const row={
      user_id:ctx.currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
      wallet_id:walletIdForAddress(address),scan_type:TOKEN_FLOW_SCAN_TYPE,
      last_scanned_block:Number(lastBlock||0),last_scanned_at:new Date().toISOString()
    };
    const {error}=await sb.from("project_scan_state")
      .upsert(row,{onConflict:"user_id,project_key,chain_key,wallet_id,scan_type"});
    if(error)throw error;
  }

  async function saveAssetFlowRows(rows){
    if(!rows?.length)return;
    // Persistierte Änderungen invalidieren nur die betroffenen Session-Scopes.
    const changedWalletIds=new Set(rows.map(r=>String(r?.wallet_id||"")).filter(Boolean));
    for(const id of changedWalletIds)daoHistoryFlowCache.delete(`wallet:${id}`);
    daoHistoryFlowCache.delete("all");
    // Phase 6.23: loadAssetFlowRows() hydratisiert wallet_address nur fuer UI/Runtime.
    // project_transaction_asset_flows besitzt bewusst nur wallet_id; der private
    // Adresswert darf deshalb nie zurueck in den Persistenz-Payload gelangen.
    const persistRows=rows.map(row=>{
      const clean={...row};
      delete clean.wallet_address;
      return clean;
    });
    const BATCH=500;
    for(let i=0;i<persistRows.length;i+=BATCH){
      const {error}=await sb.from("project_transaction_asset_flows")
        .upsert(persistRows.slice(i,i+BATCH),{onConflict:"user_id,project_key,chain_key,wallet_id,flow_key"});
      if(error)throw error;
    }
  }

  async function loadAssetFlowRows(address=null,{force=false}={}){
    const cacheKey=address?`wallet:${walletIdForAddress(address)}`:"all";
    if(!force&&daoHistoryFlowCache.has(cacheKey))return daoHistoryFlowCache.get(cacheKey);
    if(!force&&daoHistoryFlowInflight.has(cacheKey))return daoHistoryFlowInflight.get(cacheKey);
    const job=(async()=>{
      const rows=[];
      let offset=0;
      while(true){
        let q=sb.from("project_transaction_asset_flows").select("*")
          .eq("user_id",getContext?.().currentUser.id)
          .eq("project_key",PROJECT_KEY)
          .eq("chain_key",CHAIN_KEY);
        if(address)q=q.eq("wallet_id",walletIdForAddress(address));
        const {data,error}=await q.order("block_number",{ascending:false}).range(offset,offset+DB_PAGE_SIZE-1);
        if(error)throw error;
        const page=data||[];
        rows.push(...page);
        if(page.length<DB_PAGE_SIZE)break;
        offset+=DB_PAGE_SIZE;
      }
      const hydrated=rows.map(hydratePrivateWalletAddress);
      daoHistoryFlowCache.set(cacheKey,hydrated);
      return hydrated;
    })();
    daoHistoryFlowInflight.set(cacheKey,job);
    try{return await job;}finally{daoHistoryFlowInflight.delete(cacheKey);}
  }

  async function loadAllAssetFlowRows(wallets){
    const out=[],seen=new Set();
    for(const w of (wallets||[])){
      const address=walletAddress(w);
      if(!address)continue;
      const rows=await loadAssetFlowRows(address);
      for(const r of rows){
        const k=`${r.wallet_id}|${r.flow_key}`;
        if(seen.has(k))continue;
        seen.add(k);out.push(r);
      }
    }
    return out;
  }

  function assetFlowsForTx(row){
    const walletId=String(row?.wallet_id||"");
    const tx=String(row?.tx_hash||"").toLowerCase();
    return transactionAssetFlows.filter(f=>String(f.wallet_id||"")===walletId && String(f.tx_hash||"").toLowerCase()===tx);
  }

  function incomingAssetFlowsForTx(row){
    return assetFlowsForTx(row).filter(f=>f.direction==="eingang");
  }

  // Phase 6.21 / Audit P5: kanonische Leseschicht fuer Claim-Auszahlungen.
  // Asset/Menge/USD werden ausschliesslich aus persistierten Asset-Flows gelesen.
  // claim_reward_aptm / claim_reward_usd bleiben nur noch Schreib-/Altbestand und
  // duerfen keinen sichtbaren Wert mehr fuehren.
  function claimPayoutEntriesForTx(row){
    return incomingAssetFlowsForTx(row).map(f=>({
      source:"asset_flow",
      token_address:f.token_address||null,token_symbol:f.token_symbol||f.token_name||"TOKEN",token_name:f.token_name||null,
      token_decimals:Number(f.token_decimals??18),amount:Number(f.amount||0),
      price_usd:f.price_usd==null?null:Number(f.price_usd),value_usd:f.value_usd==null?null:Number(f.value_usd),
      price_source:f.price_source||null,flow:f
    }));
  }

  function nativeClaimPayoutForTx(row){
    return claimPayoutEntriesForTx(row).find(f=>String(f.token_address||"").toLowerCase()==="native" && String(f.token_symbol||"").toUpperCase()==="APTM")||null;
  }

  function nativeClaimAmountFromFlows(row,flows=transactionAssetFlows){
    const walletId=String(row?.wallet_id||"");
    const tx=String(row?.tx_hash||"").toLowerCase();
    const f=(flows||[]).find(x=>
      String(x?.wallet_id||"")===walletId &&
      String(x?.tx_hash||"").toLowerCase()===tx &&
      x?.direction==="eingang" &&
      String(x?.token_address||"").toLowerCase()==="native" &&
      String(x?.token_symbol||"").toUpperCase()==="APTM"
    );
    return Number(f?.amount||0);
  }

  function claimPayoutUsdForTx(row){
    const payouts=claimPayoutEntriesForTx(row);
    if(!payouts.length)return null;
    const valued=payouts.filter(f=>f.value_usd!=null && Number.isFinite(Number(f.value_usd)));
    if(!valued.length)return null;
    return valued.reduce((a,f)=>a+Number(f.value_usd||0),0);
  }

  function nativeClaimFlowKey(txHash){
    return `claim-native:${String(txHash||"").toLowerCase()}`;
  }

  function nativeClaimAmountRaw(amount){
    const n=Number(amount);
    if(!Number.isFinite(n)||n<=0)return "0";
    const fixed=n.toFixed(18);
    const [whole,frac=""]=fixed.split(".");
    try{return BigInt(`${whole}${frac.padEnd(18,"0").slice(0,18)}`).toString();}catch{return "0";}
  }

  function nativeClaimAssetFlowRow(address,tx,amount,{priceUsd=null,valueUsd=null,priceSource=null,counterparty=null}={}){
    const ctx=getContext?.();
    const txHash=String(tx?.tx_hash||"").toLowerCase();
    const numericAmount=Number(amount||0);
    if(!ctx?.currentUser?.id||!address||!txHash||!Number.isFinite(numericAmount)||numericAmount<=0)return null;
    const px=priceUsd==null?null:Number(priceUsd);
    const usd=valueUsd==null?(Number.isFinite(px)?numericAmount*px:null):Number(valueUsd);
    return {
      user_id:ctx.currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
      wallet_id:walletIdForAddress(address),flow_key:nativeClaimFlowKey(txHash),
      tx_hash:txHash,block_number:Number(tx?.block_number||0),tx_timestamp:tx?.tx_timestamp||null,
      log_index:-1,token_address:"native",token_symbol:"APTM",token_name:"Apertum",token_decimals:18,
      amount_raw:nativeClaimAmountRaw(numericAmount),amount:numericAmount,
      counterparty_address:counterparty||tx?.to_address||null,direction:"eingang",
      price_usd:Number.isFinite(px)?px:null,value_usd:Number.isFinite(usd)?usd:null,
      price_source:priceSource||null,updated_at:new Date().toISOString()
    };
  }

  async function backfillNativeClaimAssetFlows(targetWallets=null){
    const ctx=getContext?.();
    if(!ctx?.currentUser?.id)return {wallets:0,claims:0,persisted:0};
    const rawTargets=Array.isArray(targetWallets)&&targetWallets.length?targetWallets:(ctx.wallets||[]);
    let walletsDone=0,claimsSeen=0,persisted=0;
    for(const target of rawTargets){
      const address=typeof target==="string"?lower(target):walletAddress(target);
      if(!address)continue;
      const [claims,flows,txs]=await Promise.all([
        loadCachedClaims(address,null),
        loadAssetFlowRows(address,{force:true}),
        loadTransactionRows(address,null)
      ]);
      const incomingByTx=new Set((flows||[]).filter(f=>f.direction==="eingang").map(f=>String(f.tx_hash||"").toLowerCase()));
      const txByHash=new Map((txs||[]).map(t=>[String(t.tx_hash||"").toLowerCase(),t]));
      const rows=[];
      for(const c of (claims||[])){
        claimsSeen++;
        const h=String(c.tx_hash||"").toLowerCase();
        if(!h||incomingByTx.has(h))continue;
        const symbol=String(c.reward_asset_symbol||"").toUpperCase();
        const assetAddress=lower(c.reward_asset_address||"");
        const isNative=assetAddress==="native" || (!assetAddress && symbol==="APTM");
        const amount=Number(c.reward_asset_amount??c.reward_aptm??0);
        if(!isNative||!Number.isFinite(amount)||amount<=0)continue;
        const tx=txByHash.get(h)||{tx_hash:h,block_number:c.block_number,tx_timestamp:c.tx_timestamp,to_address:c.nft_contract};
        const directPx=Number(c.aptm_usd||0);
        const derivedPx=!directPx&&Number(c.reward_asset_usd||c.reward_usd||0)>0?Number(c.reward_asset_usd||c.reward_usd)/amount:null;
        const row=nativeClaimAssetFlowRow(address,tx,amount,{
          priceUsd:directPx||derivedPx||null,
          valueUsd:c.reward_asset_usd??c.reward_usd??null,
          priceSource:c.reward_asset_price_source||c.price_source||"Historischer nativer Claim-Cache",
          counterparty:c.nft_contract||tx.to_address||null
        });
        if(row){rows.push(row);incomingByTx.add(h);}
      }
      if(rows.length){await saveAssetFlowRows(rows);persisted+=rows.length;}
      walletsDone++;
    }
    const result={wallets:walletsDone,claims:claimsSeen,persisted};
    console.info("DAO1 Native Claim Flow Migration",result);
    return result;
  }

  // Phase 6.22 / P5: bestehende native APTM-Claim-Flows erhalten ihren
  // historischen USD-Wert direkt im kanonischen Asset-Flow. Vorhandene exakte
  // Transaktionspreise werden wiederverwendet; nur noch offene Blöcke gehen
  // gesammelt durch dieselbe exact-v13 Price-Anchor-Engine wie die TX-Historie.
  async function backfillNativeClaimAssetFlowPrices(targetWallets=null){
    const ctx=getContext?.();
    if(!ctx?.currentUser?.id)return {wallets:0,flows:0,reusedTxPrices:0,enginePriced:0,prelaunch:0,missing:0,persisted:0};
    const rawTargets=Array.isArray(targetWallets)&&targetWallets.length?targetWallets:(ctx.wallets||[]);
    let walletsDone=0,flowsSeen=0,reusedTxPrices=0,enginePriced=0,prelaunch=0,missing=0,persisted=0;
    for(const target of rawTargets){
      const address=typeof target==="string"?lower(target):walletAddress(target);
      if(!address)continue;
      const [flows,txs]=await Promise.all([
        loadAssetFlowRows(address,{force:true}),
        loadTransactionRows(address,null)
      ]);
      const txByHash=new Map((txs||[]).map(t=>[String(t.tx_hash||"").toLowerCase(),t]));
      const candidates=(flows||[]).filter(f=>
        f.direction==="eingang" &&
        String(f.flow_key||"").startsWith("claim-native:") &&
        isNativeAptmAssetFlow(f) &&
        (f.price_usd==null || f.value_usd==null)
      );
      flowsSeen+=candidates.length;
      const direct=[],unresolved=[];
      for(const f of candidates){
        const tx=txByHash.get(String(f.tx_hash||"").toLowerCase());
        const price=Number(tx?.aptm_usd||0);
        if(price>0){
          f.price_usd=price;
          f.value_usd=Number(f.amount||0)*price;
          f.price_source=tx?.price_source||"Historischer APTM/USD-Kurs der Claim-TX";
          f.updated_at=new Date().toISOString();
          direct.push(f);reusedTxPrices++;
        }else unresolved.push(f);
      }
      if(unresolved.length){
        await valueAssetFlows(unresolved);
        for(const f of unresolved){
          f.updated_at=new Date().toISOString();
          if(f.price_usd!=null && f.value_usd!=null)enginePriced++;
          else if(String(f.price_source||"").includes(PRICE_PRELAUNCH_TAG))prelaunch++;
          else missing++;
        }
      }
      const changed=[...direct,...unresolved];
      if(changed.length){await saveAssetFlowRows(changed);persisted+=changed.length;}
      walletsDone++;
    }
    const result={wallets:walletsDone,flows:flowsSeen,reusedTxPrices,enginePriced,prelaunch,missing,persisted};
    console.info("DAO1 Native Claim Flow Price Migration",result);
    return result;
  }

  function tokenAmount(value,{address=null,symbol="",summary=false}={}){
    const formatter=getContext?.()?.tokenFormat?.amount || window.WalletTokenFormat?.amount;
    if(typeof formatter==="function") return formatter(value,{chain:"apertum",address,symbol},{summary});
    return fmt(value);
  }

  function flowDisplay(f,{summary=false}={}){
    const amount=Number(f?.amount||0);
    const symbol=String(f?.token_symbol||"TOKEN")||"TOKEN";
    return `${tokenAmount(amount,{address:f?.token_address||null,symbol,summary})} ${symbol}`;
  }

  function txAssetSummary(row){
    const parts=[];
    const flows=assetFlowsForTx(row);
    for(const f of flows){
      const arrow=f.direction==="eingang"?"↓":f.direction==="ausgang"?"↑":"↔";
      parts.push(`${arrow} ${flowDisplay(f)}`);
    }
    const native=Number(row?.value_aptm||0);
    if(native>0)parts.push(`${row.direction==="eingang"?"↓":row.direction==="ausgang"?"↑":"↔"} ${fmt(native)} APTM`);
    return parts.length?parts.join("<br>"):"–";
  }

  async function valueAssetFlows(rows){
    if(!rows?.length)return rows||[];
    const aptmBlocks=[...new Set(rows.filter(isAptmPricedAssetFlow).map(r=>Number(r.block_number)).filter(Number.isFinite))];
    let history=null;
    if(aptmBlocks.length){
      history=await ensurePricesForClaimBlocks(aptmBlocks,document.getElementById("dao1TransactionStatus"));
    }
    for(const r of rows){
      const amount=Number(r.amount||0);
      if(isStableAssetSymbol(r.token_symbol)){
        r.price_usd=1;
        r.value_usd=amount;
        r.price_source="Stablecoin-Parität · 1 USD";
      }else if(isAptmPricedAssetFlow(r)&&history){
        const px=await priceForTransaction(Number(r.block_number),r.tx_timestamp,history);
        const native=isNativeAptmAssetFlow(r);
        r.price_source=px.source ? (native?px.source:`wAPTM/APTM 1:1 · ${px.source}`) : null;
        if(px.price!=null){
          r.price_usd=Number(px.price);
          r.value_usd=amount*Number(px.price);
        }else{
          r.price_usd=null;
          r.value_usd=null;
        }
      }else{
        // Weitere DAO1-/Wrapped-Assets: zentrale historische Hauptseiten-Preisengine
        // verwenden. Diese kennt Apertum Token/wUSDT bzw. Token/wAPTM -> APTM/USD Routen.
        try{
          const ctx=getContext?.();
          const dateStr=r.tx_timestamp?String(r.tx_timestamp).slice(0,10):"";
          const hp=await ctx?.taxHistoricalPrice?.(CHAIN_KEY,{
            address:r.token_address,symbol:r.token_symbol,decimals:Number(r.token_decimals||18)
          },dateStr,Number(r.block_number));
          if(hp?.price!=null){
            r.price_usd=Number(hp.price);
            r.value_usd=amount*Number(hp.price);
            r.price_source=hp.source||"Zentrale historische Apertum-Preisengine";
          }
        }catch(e){
          console.warn("DAO1 Asset-Flow historische Bewertung",r.tx_hash,r.token_symbol,e);
        }
      }
    }
    return rows;
  }

  async function cacheAssetFlowsForTransaction(txHash,address,txMeta=null){
    const hash=String(txHash||"").toLowerCase();
    const transfers=await fetchTransactionTokenTransfers(hash);
    const normalized=transfers.map(t=>({
      ...t,
      transaction_hash:t?.transaction_hash || t?.tx_hash || H(t?.transaction) || hash,
      block_number:t?.block_number ?? t?.block ?? txMeta?.block_number ?? 0,
      timestamp:t?.timestamp || t?.block_timestamp || txMeta?.tx_timestamp || null
    }));
    let rows=normalized
      .map((t,i)=>assetFlowRowFromTransfer(t,address,i))
      .filter(Boolean)
      .filter(r=>r.direction==="eingang" || r.direction==="ausgang" || r.direction==="intern");

    // v53: Der neue Miner liefert über Blockscout teilweise keine tx-token-transfers.
    // Wenn kein eingehender Reward sichtbar ist, Standard-ERC20-Transfer-Events direkt
    // aus Explorer-Logs bzw. RPC-Receipt auslesen.
    if(!rows.some(r=>r.direction==="eingang")){
      const logRows=await assetFlowRowsFromTransferLogs(hash,address,txMeta);
      const byKey=new Map(rows.map(r=>[r.flow_key,r]));
      for(const r of logRows)byKey.set(r.flow_key,r);
      rows=[...byKey.values()];
    }

    if(!rows.length){
      console.warn("DAO1 Claim Tx ohne parsebare Token-Flows",{
        tx_hash:hash,
        wallet:address,
        transfer_count:transfers.length
      });
      return [];
    }

    await valueAssetFlows(rows);
    await saveAssetFlowRows(rows);
    return rows;
  }

  // v47: Referral-Daten gezielt statt Wallet-weitem ERC-20-Vollscan laden.
  // Blockscout unterstützt beim Address-Token-Transfer Endpoint sowohl filter=to
  // als auch token=<contract>. Damit laden wir nur eingehendes DAO1-wUSDT.
  async function syncTargetedReferralWusdt(address){
    if(lower(address)!==REFERRAL_WALLET)return {flows:0,synthetic:0,skipped:true};
    const base=`${EXPLORER_API}/addresses/${address}/token-transfers?type=ERC-20&filter=to&token=${encodeURIComponent(REFERRAL_WUSDT_TOKEN)}`;
    setTransactionStatus("loading","Referral Rewards werden gezielt geprüft…","Nur eingehende wUSDT-Transfers werden geladen; kein ERC-20-Wallet-Vollscan.");
    const transfers=await fetchPagedUrl(base,100);
    const rows=transfers
      .map((t,i)=>assetFlowRowFromTransfer(t,address,i))
      .filter(Boolean)
      .filter(r=>r.direction==="eingang" && lower(r.token_address)===REFERRAL_WUSDT_TOKEN);
    if(!rows.length)return {flows:0,synthetic:0};
    await valueAssetFlows(rows);
    await saveAssetFlowRows(rows);

    // Ein Referral-Transfer kann das Wallet nur als Event-Empfänger enthalten und
    // deshalb in der normalen Address-TX-Liste fehlen. Für genau diese wUSDT-TXs
    // ergänzen wir eine synthetische Transaktionszeile aus dem bereits geladenen Event.
    const existing=await loadTransactionRows(address,null);
    const hashes=new Set(existing.map(r=>String(r.tx_hash||"").toLowerCase()));
    const byTx=new Map();
    for(const f of rows){
      const h=String(f.tx_hash||"").toLowerCase();
      if(!hashes.has(h)&&!byTx.has(h))byTx.set(h,f);
    }
    const synthetic=[...byTx.values()].map(f=>({
      user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
      wallet_id:walletIdForAddress(address),tx_hash:f.tx_hash,block_number:Number(f.block_number||0),
      tx_timestamp:f.tx_timestamp,from_address:f.counterparty_address||null,to_address:null,
      direction:"eingang",method:"ERC-20 Transfer",selector:"",status:"token-flow",
      value_aptm:0,gas_aptm:0,raw_input:"",updated_at:new Date().toISOString()
    }));
    if(synthetic.length)await saveTransactionRows(synthetic);
    return {flows:rows.length,synthetic:synthetic.length};
  }

  async function syncApertumTokenFlowCache(address,{deferValuation=false}={}){
    const ctx=getContext?.();
    const state=await getTokenFlowScanState(address);
    const fromBlock=state?.last_scanned_block?Math.max(0,Number(state.last_scanned_block)-CLAIM_SCAN_BUFFER_BLOCKS):null;
    const base=`${EXPLORER_API}/addresses/${address}/token-transfers?type=ERC-20`;
    let url=base,page=0,maxSeen=Number(state?.last_scanned_block||0),fetched=0,saved=0,syntheticCount=0;
    const seenUrls=new Set();

    // Bereits vorhandene TX-Hashes nur einmal laden. Neue reine ERC-20-Ereignisse
    // werden seitenweise als synthetische TX-Zeilen ergänzt.
    const existing=await loadTransactionRows(address,null);
    const existingHashes=new Set(existing.map(r=>String(r.tx_hash||"").toLowerCase()));

    while(url){
      if(seenUrls.has(url)){
        throw new Error(`Apertum Explorer · ERC-20 Token-Transfers: Pagination wiederholt dieselbe Seite (${page+1}).`);
      }
      seenUrls.add(url);
      page++;

      setTransactionStatus("loading",`ERC-20 Asset-Flows werden geladen · Seite ${page}…`,
        fromBlock==null
          ? `${fetched.toLocaleString("de-DE")} geladen · ${saved.toLocaleString("de-DE")} bereits gespeichert.`
          : `Ab Block ${fromBlock.toLocaleString("de-DE")} inkl. Sicherheitspuffer · ${saved.toLocaleString("de-DE")} bereits gespeichert.`);

      // Für diesen Massenscan bewusst kürzer warten: zwei Versuche à 12 Sekunden.
      // So wirkt eine hängende Explorer-Seite nicht minutenlang wie ein Freeze.
      let j;
      try{
        // v46: Timeout muss die komplette Antwort inkl. JSON-Body umfassen.
        // fetch() kann bereits nach Eingang der Header auflösen, während der Body noch hängt.
        // Deshalb bleibt der AbortController aktiv, bis r.json() vollständig beendet ist.
        let lastError=null;
        for(let attempt=1;attempt<=2;attempt++){
          const controller=new AbortController();
          const timeout=setTimeout(()=>controller.abort(),12000);
          try{
            const r=await fetch(url,{headers:{accept:"application/json"},signal:controller.signal});
            if(!r.ok)throw new Error(`Apertum Explorer · ERC-20 Token-Transfers: HTTP ${r.status}`);
            j=await r.json();
            clearTimeout(timeout);
            lastError=null;
            break;
          }catch(e){
            clearTimeout(timeout);
            lastError=e;
            if(attempt<2)await sleep(600*attempt);
          }
        }
        if(lastError){
          const detail=lastError?.name==="AbortError"?"Zeitüberschreitung beim Laden der vollständigen JSON-Antwort":(lastError?.message||"unbekannter Fehler");
          throw new Error(`Apertum Explorer · ERC-20 Token-Transfers: ${detail}`);
        }
      }catch(e){
        setTransactionStatus("error",`ERC-20 Asset-Flows: Explorer antwortet auf Seite ${page} nicht vollständig.`,
          `${saved.toLocaleString("de-DE")} Transfers dieser Aktualisierung sind bereits sicher gespeichert. Die vollständige Antwort wurde nach 2 × 12 Sekunden abgebrochen. Erneut „Daten aktualisieren“ versucht den Scan nochmals; der Scan-State wird erst nach vollständigem Durchlauf fortgeschrieben.`);
        throw e;
      }

      const items=j.items||[];
      fetched+=items.length;
      let oldest=Infinity;
      const pageRows=[];

      for(let ix=0;ix<items.length;ix++){
        const t=items[ix];
        const block=Number(t.block_number??t.block??0);
        if(Number.isFinite(block)){oldest=Math.min(oldest,block);maxSeen=Math.max(maxSeen,block);}
        if(fromBlock!=null&&block<fromBlock)continue;
        const tokenAddress=tokenTransferAddress(t);
        const txHash=tokenTransferTxHash(t);
        if(!tokenAddress||!txHash){
          console.warn("DAO1 ERC-20 Transfer nicht parsebar",{tokenAddress,txHash,transfer:t});
          continue;
        }
        const decimals=tokenTransferDecimals(t);
        const raw=tokenTransferRawValue(t);
        pageRows.push({
          user_id:ctx.currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
          wallet_id:walletIdForAddress(address),flow_key:tokenFlowKey(t,address,ix),
          tx_hash:txHash,block_number:block,tx_timestamp:t.timestamp||t.block_timestamp||null,
          log_index:Number(t.log_index??t.logIndex??-1),
          token_address:tokenAddress,token_symbol:tokenFlowSymbol(t),token_name:tokenFlowName(t),
          token_decimals:decimals,amount_raw:raw,amount:decimalAmount(raw,decimals),
          counterparty_address:tokenFlowCounterparty(t,address),direction:tokenFlowDirection(t,address),
          price_usd:null,value_usd:null,price_source:null,updated_at:new Date().toISOString()
        });
      }

      // Phase 6.12 / P4: Eine Explorer-Seite wird nur einmal persistiert. Beim Fresh-Build
      // werden die Roh-Flows sofort dauerhaft gesichert; historische USD-Bewertung ist
      // für Ownership, Kaufpreis in Token und Claim-Erkennung nicht erforderlich und
      // wird deshalb gezielt im Claim-/Detailpfad nachgezogen. Im manuellen Vollrefresh
      // darf weiterhin vor dem einmaligen Persistieren vollständig bewertet werden.
      if(pageRows.length){
        if(!deferValuation)await valueAssetFlows(pageRows);
        await saveAssetFlowRows(pageRows);
        saved+=pageRows.length;

        const synthetic=[];
        const byTx=new Map();
        for(const f of pageRows){
          const h=String(f.tx_hash||"").toLowerCase();
          if(existingHashes.has(h))continue;
          if(!byTx.has(h))byTx.set(h,f);
        }
        for(const f of byTx.values()){
          synthetic.push({
            user_id:ctx.currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
            wallet_id:walletIdForAddress(address),tx_hash:f.tx_hash,block_number:Number(f.block_number||0),
            tx_timestamp:f.tx_timestamp,
            from_address:f.direction==="eingang"?(f.counterparty_address||null):null,
            to_address:f.direction==="ausgang"?(f.counterparty_address||null):null,
            direction:f.direction,method:"ERC-20 Transfer",selector:"",status:"token-flow",
            value_aptm:0,gas_aptm:0,raw_input:"",updated_at:new Date().toISOString()
          });
          existingHashes.add(String(f.tx_hash||"").toLowerCase());
        }
        if(synthetic.length){
          await saveTransactionRows(synthetic);
          syntheticCount+=synthetic.length;
        }
      }

      setTransactionStatus("loading",`ERC-20 Asset-Flows · Seite ${page} gespeichert.`,
        `${fetched.toLocaleString("de-DE")} geladen · ${saved.toLocaleString("de-DE")} persistent gespeichert.`);

      if(fromBlock!=null&&Number.isFinite(oldest)&&oldest<fromBlock)break;
      url=nextUrl(base,j.next_page_params);
    }

    // Scan-State nur nach vollständigem Durchlauf fortschreiben. Dadurch kann ein
    // abgebrochener Vollscan niemals fälschlich als abgeschlossen markiert werden.
    if(maxSeen)await saveTokenFlowScanState(address,maxSeen);
    return {flows:saved,synthetic:syntheticCount,maxSeen,deferredValuation:deferValuation?saved:0};
  }

  async function getTransactionScanState(address){
    const {data,error}=await sb.from("project_scan_state")
      .select("*")
      .eq("user_id",getContext?.().currentUser.id)
      .eq("project_key",PROJECT_KEY)
      .eq("chain_key",CHAIN_KEY)
      .eq("wallet_id",walletIdForAddress(address))
      .eq("scan_type",TX_SCAN_TYPE)
      .maybeSingle();
    if(error)throw error;
    return data||null;
  }

  async function saveTransactionScanState(address,lastBlock){
    const ctx=getContext?.();
    const row={
      user_id:ctx.currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
      wallet_id:walletIdForAddress(address),scan_type:TX_SCAN_TYPE,
      last_scanned_block:Number(lastBlock||0),last_scanned_at:new Date().toISOString()
    };
    const {error}=await sb.from("project_scan_state")
      .upsert(row,{onConflict:"user_id,project_key,chain_key,wallet_id,scan_type"});
    if(error)throw error;
  }

  async function saveTransactionRows(rows){
    if(!rows.length)return;
    const changedWalletIds=new Set(rows.map(r=>String(r?.wallet_id||"")).filter(Boolean));
    for(const id of changedWalletIds)daoHistoryTxCache.delete(`wallet:${id}`);
    daoHistoryTxCache.delete("all");
    const {error}=await sb.from("project_transactions")
      .upsert(rows,{onConflict:"user_id,project_key,chain_key,wallet_id,tx_hash"});
    if(error)throw error;
  }

  async function saveTransactionClaimPatches(rows){
    if(!rows?.length)return;
    const BATCH=500;
    for(let i=0;i<rows.length;i+=BATCH){
      const part=rows.slice(i,i+BATCH);
      const {error}=await sb.from("project_transactions")
        .upsert(part,{onConflict:"user_id,project_key,chain_key,wallet_id,tx_hash"});
      if(error)throw error;
    }
    const changedWalletIds=new Set(rows.map(r=>String(r?.wallet_id||"")).filter(Boolean));
    for(const id of changedWalletIds)daoHistoryTxCache.delete(`wallet:${id}`);
    daoHistoryTxCache.delete("all");
  }

  async function saveTransactionPricePatches(rows,status,label="Historische USD-Werte"){
    const BATCH=500;
    for(let i=0;i<rows.length;i+=BATCH){
      const part=rows.slice(i,i+BATCH);
      await saveTransactionRows(part);
      if(activePriceJobLog){activePriceJobLog.dbBatches++;renderPriceJobLog();}
      if(status)setTransactionStatus("db",`${label} werden batchweise gespeichert ${Math.min(i+BATCH,rows.length)}/${rows.length}…`,
        `Bis zu ${BATCH} Transaktionen pro Datenbank-Request statt Einzelupdates.`);
    }
  }

  async function loadTransactionRows(address=null,status=null,{force=false}={}){
    const cacheKey=address?`wallet:${walletIdForAddress(address)}`:"all";
    if(!force&&daoHistoryTxCache.has(cacheKey))return daoHistoryTxCache.get(cacheKey);
    if(!force&&daoHistoryTxInflight.has(cacheKey))return daoHistoryTxInflight.get(cacheKey);
    const job=(async()=>{
      const rows=[];
      let offset=0;
      while(true){
        let q=sb.from("project_transactions")
          .select("*")
          .eq("user_id",getContext?.().currentUser.id)
          .eq("project_key",PROJECT_KEY)
          .eq("chain_key",CHAIN_KEY);
        if(address)q=q.eq("wallet_id",walletIdForAddress(address));
        const {data,error}=await q
          .order("block_number",{ascending:false})
          .order("tx_hash",{ascending:true})
          .range(offset,offset+DB_PAGE_SIZE-1);
        if(error)throw error;
        const page=data||[];
        rows.push(...page);
        if(status && page.length) setTransactionStatus("loading",`Gespeicherte Transaktionen werden geladen… ${rows.length}`);
        if(page.length<DB_PAGE_SIZE)break;
        offset+=DB_PAGE_SIZE;
      }
      const hydrated=rows.map(hydratePrivateWalletAddress);
      daoHistoryTxCache.set(cacheKey,hydrated);
      return hydrated;
    })();
    daoHistoryTxInflight.set(cacheKey,job);
    try{return await job;}finally{daoHistoryTxInflight.delete(cacheKey);}
  }

  async function loadAllApertumTransactionRows(wallets,status=null){
    const combined=[];
    const seen=new Set();
    const list=(wallets||[]).filter(w=>walletAddress(w));
    for(let i=0;i<list.length;i++){
      const w=list[i],address=walletAddress(w);
      if(status)setTransactionStatus("db",`Gespeicherte Daten werden aggregiert ${i+1}/${list.length}…`,`${w.label||"Wallet"} · ${address}`);
      const part=await loadTransactionRows(address,null);
      for(const row of part){
        const key=`${String(row.wallet_id||"")}::${String(row.tx_hash||"").toLowerCase()}`;
        if(seen.has(key))continue;
        seen.add(key);
        combined.push(row);
      }
    }
    combined.sort((a,b)=>Number(b.block_number||0)-Number(a.block_number||0)||String(a.tx_hash||"").localeCompare(String(b.tx_hash||"")));
    return combined;
  }

  function setTransactionStatus(kind,message,details=""){
    const el=document.getElementById("dao1TransactionStatus");
    if(!el)return;
    const icon=kind==="ready"?"✅":kind==="error"?"❌":kind==="db"?"💾":"⏳";
    el.innerHTML=`<div style="font-weight:700">${icon} ${message}</div>${details?`<div class="note" style="margin-top:4px">${details}</div>`:""}`;
  }

  function transactionStatusSnapshot(rows,state){
    const claimCalls=rows.filter(r=>isKnownClaimSelector(r.selector));
    const enriched=claimCalls.filter(r=>r.claim_nft_id!=null || !!r.claim_nft_name);
    const pending=claimCalls.length-enriched.length;
    const missingPrice=enriched.filter(r=>r.aptm_usd==null).length;
    const gasRows=rows.filter(r=>Number(r.gas_aptm||0)>0);
    const missingGasUsd=gasRows.filter(r=>r.gas_usd==null).length;
    const lastAt=state?.last_scanned_at ? new Date(state.last_scanned_at).toLocaleString("de-DE") : "noch kein Scan";
    const lastBlock=state?.last_scanned_block ? Number(state.last_scanned_block).toLocaleString("de-DE") : "–";
    return {claimCalls:claimCalls.length,enriched:enriched.length,pending,missingPrice,missingGasUsd,lastAt,lastBlock};
  }

  async function showTransactionReadyStatus(address,rows,source="db"){
    let state=null;
    try{state=await getTransactionScanState(address);}catch(e){console.warn("Tx scan state:",e);}
    const x=transactionStatusSnapshot(rows,state);
    const sourceText=source==="db" ? "Nur gespeicherte Daten geladen – keine Blockchain-Abfrage." : "Blockchain-Aktualisierung abgeschlossen.";
    setTransactionStatus("ready",`Bereit – ${rows.length.toLocaleString("de-DE")} Transaktionen, ${x.enriched.toLocaleString("de-DE")} angereicherte Claims.`,
      `${sourceText} Letzter Scan: ${x.lastAt} · letzter Block: ${x.lastBlock} · offene Claim-Anreicherungen: ${x.pending} · Claims ohne historischen USD-Kurs: ${x.missingPrice} · Gas ohne historischen USD-Wert: ${x.missingGasUsd}`);
  }

  async function syncApertumTransactionCache(address,status){
    const ctx=getContext?.();
    const state=await getTransactionScanState(address);
    const fromBlock=state?.last_scanned_block
      ? Math.max(0,Number(state.last_scanned_block)-CLAIM_SCAN_BUFFER_BLOCKS)
      : null;
    let url=`${EXPLORER_API}/addresses/${address}/transactions`;
    let page=0,maxSeen=Number(state?.last_scanned_block||0),fetched=0;
    const batch=[];
    while(url){
      page++;
      setTransactionStatus("loading",fromBlock==null
        ? `Blockchain-Historie wird vollständig geladen · Explorer-Seite ${page}…`
        : `Neue Blockchain-Daten werden geladen · Explorer-Seite ${page}…`,
        fromBlock==null ? `${fetched.toLocaleString("de-DE")} Transaktionen bisher empfangen.` : `Ab Block ${fromBlock.toLocaleString("de-DE")} inklusive ${CLAIM_SCAN_BUFFER_BLOCKS} Block Sicherheitspuffer.`);
      const j=await fetchJson(url,"Apertum Explorer · Transaktionshistorie");
      const items=j.items||[];
      fetched+=items.length;
      let oldest=Infinity;
      for(const t of items){
        const block=Number(t.block_number??t.block??0);
        if(Number.isFinite(block)){
          oldest=Math.min(oldest,block);
          maxSeen=Math.max(maxSeen,block);
        }
        if(fromBlock!=null && block<fromBlock)continue;
        const input=String(t.raw_input||t.input||"");
        batch.push({
          user_id:ctx.currentUser.id,
          project_key:PROJECT_KEY,
          chain_key:CHAIN_KEY,
          wallet_id:walletIdForAddress(address),
          tx_hash:t.hash,
          block_number:block,
          tx_timestamp:t.timestamp,
          from_address:lower(H(t.from)),
          to_address:lower(H(t.to)),
          direction:directionForTx(t,address),
          method:methodLabel(t),
          selector:input.slice(0,10).toLowerCase(),
          status:String(t.status ?? t.result ?? ""),
          value_aptm:txValueAptm(t),
          gas_aptm:feeAptm(t),
          raw_input:input,
          updated_at:new Date().toISOString()
        });
      }
      if(batch.length>=500){
        const saveBatch=batch.splice(0,batch.length);
        setTransactionStatus("db",`${saveBatch.length} Transaktionen werden gespeichert…`,`${fetched.toLocaleString("de-DE")} Explorer-Datensätze bisher verarbeitet.`);
        await saveTransactionRows(saveBatch);
      }
      if(fromBlock!=null && Number.isFinite(oldest) && oldest<fromBlock)break;
      url=nextUrl(`${EXPLORER_API}/addresses/${address}/transactions`,j.next_page_params);
    }
    if(batch.length){
      setTransactionStatus("db",`${batch.length} Transaktionen werden gespeichert…`);
      await saveTransactionRows(batch);
    }
    if(maxSeen)await saveTransactionScanState(address,maxSeen);
    return {state,fromBlock,maxSeen,rows:await loadTransactionRows(address)};
  }

  function allProjectWalletOptions(){
    return projectWallets().filter(w=>walletAddress(w));
  }

  async function enrichTransactionHistoricalPrices(address,jobToken=transactionJobToken,minBlock=null){
    const txs=await loadTransactionRows(address,null);
    const pending=txs.filter(r=>(minBlock==null || Number(r.block_number)>=Number(minBlock)) && !r.price_is_manual && Number(r.block_number)>0 && (
      r.aptm_usd==null ||
      (Number(r.gas_aptm||0)>0 && r.gas_usd==null) ||
      !String(r.price_source||"").includes(PRICE_SOURCE_TAG)
    ));
    if(!pending.length)return {updated:0,missing:0};
    if(jobToken!==transactionJobToken)return {updated:0,missing:pending.length};

    const blocks=[...new Set(pending.map(r=>Number(r.block_number)).filter(Number.isFinite))];
    setTransactionStatus("loading","Historische APTM-Kurse für Transaktionen werden ergänzt…",
      `${pending.length.toLocaleString("de-DE")} Transaktion(en) ohne vollständige historische USD-Bewertung.`);
    const history=await ensurePricesForClaimBlocks(blocks,document.getElementById("dao1TransactionStatus"));
    const walletFlows=await loadAssetFlowRows(address);
    let missing=0;
    const priceRows=[];
    for(let i=0;i<pending.length;i++){
      if(jobToken!==transactionJobToken)return {updated:0,missing:pending.length-i};
      const r=pending[i];
      const px=await priceForTransaction(Number(r.block_number),r.tx_timestamp,history);
      if(px.price==null){
        missing++;
        priceRows.push({
          user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
          wallet_id:walletIdForAddress(address),tx_hash:r.tx_hash,
          aptm_usd:null,value_usd:null,gas_usd:null,claim_reward_usd:null,
          price_source:px.source,updated_at:new Date().toISOString()
        });
        continue;
      }
      const price=Number(px.price);
      priceRows.push({
        user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
        wallet_id:walletIdForAddress(address),tx_hash:r.tx_hash,
        aptm_usd:price,value_usd:Number(r.value_aptm||0)*price,gas_usd:Number(r.gas_aptm||0)*price,
        claim_reward_usd:nativeClaimAmountFromFlows(r,walletFlows)>0?nativeClaimAmountFromFlows(r,walletFlows)*price:null,
        price_source:px.source,updated_at:new Date().toISOString()
      });
    }
    await saveTransactionPricePatches(priceRows,document.getElementById("dao1TransactionStatus"),"Historische USD-Werte");
    return {updated:priceRows.length,missing};
  }

  async function repriceCachedTransactionHistory(){
    const job=++transactionJobToken;
    const wallets=allProjectWalletOptions();
    if(!wallets.length)return;

    const selectedAll=txFilterWallet==="__all";
    const targets=selectedAll ? wallets : wallets.filter(w=>String(w.id)===String(txFilterWallet));
    if(!targets.length)return;

    const btn=document.getElementById("dao1TxRepriceBtn");
    if(btn){btn.disabled=true;btn.textContent="Historische Preise werden neu berechnet…";}

    let totalRows=0,totalUpdated=0,totalMissing=0,totalPrelaunch=0,totalClaims=0;
    try{
      for(let wi=0;wi<targets.length;wi++){
        if(job!==transactionJobToken)return;
        const w=targets[wi],address=walletAddress(w);
        setTransactionStatus("db",`Wallet ${wi+1}/${targets.length}: gespeicherte Transaktionen werden für die Preis-Neuberechnung geladen…`,
          `${w.label} · Kein erneuter Explorer-Transaktionsscan.`);
        const allRows=(await loadTransactionRows(address,null)).filter(r=>!r.price_is_manual && Number(r.block_number)>0);
        const walletFlows=await loadAssetFlowRows(address);
        // v56: Der manuelle Preisjob versucht auch bisherige "ohne Preis"-Fälle erneut.
        // Nur bereits exakte Preise und bestätigte Pre-Launch-Fälle werden ausgelassen.
        const rows=allRows.filter(r=>
          !String(r.price_source||"").includes(PRICE_SOURCE_TAG) &&
          !String(r.price_source||"").includes(PRICE_PRELAUNCH_TAG)
        );
        totalRows+=allRows.length;
        if(!rows.length){
          setTransactionStatus("ready",`Wallet ${wi+1}/${targets.length}: historische Preise bereits aktuell.`,`Preisrevision ${PRICE_SOURCE_TAG}; ${allRows.length.toLocaleString("de-DE")} gecachte TX mussten nicht erneut geprüft werden.`);
          continue;
        }

        const blocks=[...new Set(rows.map(r=>Number(r.block_number)).filter(Number.isFinite))];
        if(!activePriceJobLog)priceJobStart(rows.length,blocks.length);
        priceJobLog(`Wallet ${wi+1}/${targets.length} · ${rows.length} veraltete TX · ${blocks.length} Preisblöcke`);
        setTransactionStatus("loading",`Wallet ${wi+1}/${targets.length}: historische Poolpreise werden geprüft…`,
          `${rows.length.toLocaleString("de-DE")} gecachte Transaktionen inkl. bisheriger „ohne Preis“-Fälle · ${blocks.length.toLocaleString("de-DE")} unterschiedliche TX-Blöcke.`);
        priceJobLog("Preisanker laden/verifizieren gestartet");
        const history=await ensurePricesForClaimBlocks(blocks,document.getElementById("dao1TransactionStatus"));
        priceJobLog(`Preisanker bereit · ${history._anchorByTarget?.size?.toLocaleString("de-DE")||0} Zielblöcke`);
        if(job!==transactionJobToken)return;

        const txPatches=[];
        const claimPatches=[];
        for(const r of rows){
          const px=await priceForTransaction(Number(r.block_number),r.tx_timestamp,history);
          if(px.price==null){
            const anchor=history._anchorByTarget?.get(Number(r.block_number));
            const missingDiag={
              wallet:w.label||address,
              wallet_address:address,
              tx_hash:r.tx_hash,
              tx_timestamp:r.tx_timestamp||null,
              target_block:Number(r.block_number),
              scanned_from_block:anchor?.scanned_from_block??null,
              search_rounds:anchor?._diag_rounds??null,
              syncs_found:anchor?._diag_logs??0,
              reason:anchor?._diag_reason||((anchor?.scanned_from_block===0)?"genesis_reached":"no_valid_sync_before_target")
            };
            if(missingDiag.reason==="genesis_reached")totalPrelaunch++; else totalMissing++;
            if(activePriceJobLog)activePriceJobLog.missingDiagnostics.push(missingDiag);
            txPatches.push({
              user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
              wallet_id:walletIdForAddress(address),tx_hash:r.tx_hash,
              aptm_usd:null,value_usd:null,gas_usd:null,claim_reward_usd:null,
              price_source:(missingDiag.reason==="genesis_reached"?`Noch kein On-Chain-Marktpreis vorhanden · ${PRICE_PRELAUNCH_TAG}`:px.source),updated_at:new Date().toISOString()
            });
            if(r.claim_nft_id!=null){
              totalClaims++;
              claimPatches.push({
                user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
                wallet_id:walletIdForAddress(address),tx_hash:r.tx_hash,nft_contract:r.claim_nft_contract||null,nft_id:Number(r.claim_nft_id),
                aptm_usd:null,reward_usd:null,gas_usd:null,price_block:null,
                price_source:(missingDiag.reason==="genesis_reached"?`Noch kein On-Chain-Marktpreis vorhanden · ${PRICE_PRELAUNCH_TAG}`:px.source),updated_at:new Date().toISOString()
              });
            }
            continue;
          }
          const price=Number(px.price);
          txPatches.push({
            user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
            wallet_id:walletIdForAddress(address),tx_hash:r.tx_hash,
            aptm_usd:price,value_usd:Number(r.value_aptm||0)*price,gas_usd:Number(r.gas_aptm||0)*price,
            claim_reward_usd:nativeClaimAmountFromFlows(r,walletFlows)>0?nativeClaimAmountFromFlows(r,walletFlows)*price:null,
            price_source:px.source,updated_at:new Date().toISOString()
          });
          if(r.claim_nft_id!=null){
            totalClaims++;
            claimPatches.push({
              user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
              wallet_id:walletIdForAddress(address),tx_hash:r.tx_hash,nft_contract:r.claim_nft_contract||null,nft_id:Number(r.claim_nft_id),
              aptm_usd:price,reward_usd:nativeClaimAmountFromFlows(r,walletFlows)>0?nativeClaimAmountFromFlows(r,walletFlows)*price:null,gas_usd:Number(r.gas_aptm||0)*price,
              price_block:px.priceBlock||null,price_source:px.source,updated_at:new Date().toISOString()
            });
          }
        }

        priceJobLog(`Preiszuordnung fertig · ${txPatches.length.toLocaleString("de-DE")} TX · Speichern startet`);
        await saveTransactionPricePatches(txPatches,document.getElementById("dao1TransactionStatus"),`Wallet ${wi+1}/${targets.length}: historische Preise`);
        totalUpdated+=txPatches.length;
        priceJobLog(`TX-Preise gespeichert · ${txPatches.length.toLocaleString("de-DE")} Zeilen`);

        // Claim-Repricing darf niemals neue/partielle project_nft_claims-Zeilen erzeugen.
        // Ein partielles UPSERT würde NOT-NULL-Felder wie block_number verlieren bzw. als NULL
        // einsetzen. Deshalb werden ausschließlich bereits gespeicherte Claim-Zeilen vollständig
        // übernommen und nur deren Preisfelder ersetzt. Manuelle Preise bleiben geschützt.
        if(claimPatches.length){
          const cachedClaims=await loadCachedClaims(address,null);
          const cachedByHash=new Map(cachedClaims.map(c=>[String(c.tx_hash||"").toLowerCase(),c]));
          const safeClaims=[];
          for(const patch of claimPatches){
            const existing=cachedByHash.get(String(patch.tx_hash||"").toLowerCase());
            if(!existing || existing.price_is_manual)continue;
            const blockNumber=Number(existing.block_number);
            if(!Number.isFinite(blockNumber) || blockNumber<=0){
              console.warn("DAO1 Claim-Repricing übersprungen: gespeicherter Claim ohne belastbare block_number",existing.tx_hash);
              continue;
            }
            safeClaims.push({
              user_id:existing.user_id,
              project_key:existing.project_key||PROJECT_KEY,
              chain_key:existing.chain_key||CHAIN_KEY,
              wallet_id:existing.wallet_id,
              nft_contract:existing.nft_contract??null,
              nft_id:existing.nft_id,
              nft_name:existing.nft_name??null,
              nft_subtype:existing.nft_subtype??null,
              tx_hash:existing.tx_hash,
              block_number:blockNumber,
              tx_timestamp:existing.tx_timestamp??null,
              param1:existing.param1??null,
              param2:existing.param2??null,
              reward_aptm:existing.reward_aptm,
              gas_aptm:existing.gas_aptm,
              net_aptm:existing.net_aptm,
              aptm_usd:patch.aptm_usd,
              reward_usd:patch.reward_usd,
              gas_usd:patch.gas_usd,
              price_block:patch.price_block??existing.price_block??null,
              price_source:patch.price_source,
              price_is_manual:existing.price_is_manual??false,
              updated_at:new Date().toISOString()
            });
          }
          const BATCH=500;
          for(let i=0;i<safeClaims.length;i+=BATCH){
            await saveClaimRows(safeClaims.slice(i,i+BATCH));
            if(activePriceJobLog){activePriceJobLog.dbBatches++;renderPriceJobLog();}
            setTransactionStatus("db",`Wallet ${wi+1}/${targets.length}: Claim-USD werden batchweise gespeichert ${Math.min(i+BATCH,safeClaims.length)}/${safeClaims.length}…`,
              `Preislogik ${PRICE_SOURCE_TAG} · vorhandene Claim-Zeilen werden vollständig erhalten.`);
          }
        }
      }

      if(job!==transactionJobToken)return;
      transactionRows=selectedAll?await loadAllApertumTransactionRows(targets,document.getElementById("dao1TransactionStatus")):await loadTransactionRows(walletAddress(targets[0]),null);
      renderTransactionControls();
      renderTransactionHistory();
      const quality=historicalPriceQualityCounts(transactionRows);
      const distinctPrices=new Set(transactionRows.filter(r=>r.aptm_usd!=null).map(r=>Number(r.aptm_usd).toPrecision(12))).size;
      if(activePriceJobLog && activePriceJobLog.missingDiagnostics?.length){
        priceJobLog("===== FEHLENDE PREISE · DETAILDIAGNOSE =====");
        for(const d of activePriceJobLog.missingDiagnostics){
          priceJobLog(`MISSING · Wallet=${d.wallet} · TX=${d.tx_hash} · Datum=${d.tx_timestamp||"–"} · TX-Block=${d.target_block} · geprüft_ab=${d.scanned_from_block??"–"} · Rückwärtsschritte=${d.search_rounds??"–"} · Syncs=${d.syncs_found??0} · Grund=${d.reason}`);
        }
        priceJobLog("===== ENDE FEHLENDE PREISE =====");
      }
      if(activePriceJobLog)priceJobLog(`Fertig · ${totalUpdated.toLocaleString("de-DE")} TX aktualisiert · ${totalPrelaunch.toLocaleString("de-DE")} Pre-Launch ohne Marktpreis · ${totalMissing.toLocaleString("de-DE")} echte Preis-Lücken`);
      setTransactionStatus("ready",`Historische APTM-Preise neu berechnet – ${totalUpdated.toLocaleString("de-DE")} Transaktionen aktualisiert.`,
        `${totalRows.toLocaleString("de-DE")} gecachte Transaktionen geprüft · ${totalClaims.toLocaleString("de-DE")} Claim-Datensätze mitgeführt · Preisqualität: ${quality.exact.toLocaleString("de-DE")} exact · ${quality.fallback.toLocaleString("de-DE")} fallback · ${quality.prelaunch.toLocaleString("de-DE")} Pre-Launch · ${quality.missing.toLocaleString("de-DE")} ohne Preis · ${quality.manual.toLocaleString("de-DE")} manuell · ${distinctPrices.toLocaleString("de-DE")} unterschiedliche APTM/USD-Werte. Preislogik ${PRICE_SOURCE_TAG}; kein Explorer-Transaktionsscan; globaler Price-Anchor-Cache v1; lokale RPC-Fenster statt Sync-Vollhistorie.`);
    }catch(e){
      console.error("DAO1 historische Preis-Neuberechnung:",e);
      setTransactionStatus("error","Historische Preis-Neuberechnung fehlgeschlagen.",e?.message||String(e));
    }finally{
      priceJobStop();
      const b=document.getElementById("dao1TxRepriceBtn");
      if(b && job===transactionJobToken){b.disabled=false;b.textContent="Historische Preise neu berechnen";}
    }
  }

  async function refreshTransactionHistory(scan=false){
    const job=++transactionJobToken;
    const wallets=allProjectWalletOptions();
    if(!wallets.length)return;

    const selectedAll=txFilterWallet==="__all";
    if(!selectedAll && !wallets.some(w=>String(w.id)===String(txFilterWallet))){
      txFilterWallet=String(wallets[0].id);
    }

    const targets=selectedAll ? wallets : wallets.filter(w=>String(w.id)===String(txFilterWallet));
    const btn=document.getElementById("dao1TxScanBtn");
    if(scan && btn){btn.disabled=true;btn.textContent=selectedAll?"Alle Wallets werden aktualisiert…":"Historie wird aktualisiert…";}

    try{
      if(scan){
        for(let i=0;i<targets.length;i++){
          if(job!==transactionJobToken)return;
          const w=targets[i],address=walletAddress(w);
          setTransactionStatus("loading",`Wallet ${i+1}/${targets.length}: ${w.label} wird aktualisiert…`,address);
          const txSync=await syncApertumTransactionCache(address,null);
          if(job!==transactionJobToken)return;
          // Reward-/Referral-Auszahlungen werden aus persistenten ERC-20 Asset-Flows
          // aufgebaut. Der Scan ist inkrementell und ergänzt nur neue/überlappende Blöcke.
          await syncApertumTokenFlowCache(address);
          if(job!==transactionJobToken)return;
          await syncTargetedReferralWusdt(address);
          if(job!==transactionJobToken)return;
          const walletRows=await loadTransactionRows(address,null);
          if(job!==transactionJobToken)return;
          const claimEnrich=await enrichTransactionsWithClaims(address,null,job,{assetFlowScanComplete:true});
          if(job!==transactionJobToken)return;
          // v52: Claim-Preis-Backfill nur nach echter Claim-Anreicherung.
          // Ohne neue/erneuerte Claims werden historische Claim-Preise nicht
          // bei jedem normalen "Daten aktualisieren" erneut abgearbeitet.
          if(Number(claimEnrich?.updatedClaims||0)>0){
            await backfillCachedClaimPrices(address,null,document.getElementById("dao1TransactionStatus"));
            if(job!==transactionJobToken)return;
          }
          // Nur neue/überlappende Blöcke prüfen. Alte bereits gecachte Historie wird
          // beim normalen Update nicht erneut durch die Preisengine geschickt.
          await enrichTransactionHistoricalPrices(address,job,txSync?.fromBlock);
          if(job!==transactionJobToken)return;
          setTransactionStatus("loading",`Wallet ${i+1}/${targets.length}: ${w.label} · NFTs werden aktualisiert…`,"Apertum NFT-Bestand wird live abgeglichen; Besitzerhistorien werden nur bei tatsächlichen Besitzänderungen neu aufgebaut.");
          await refreshWalletNftsAndOwnership(w,`Wallet ${i+1}/${targets.length} · `);
        }
        if(job!==transactionJobToken)return;
        transactionRows=selectedAll?await loadAllApertumTransactionRows(targets,document.getElementById("dao1TransactionStatus")):await loadTransactionRows(walletAddress(targets[0]),null);
        transactionAssetFlows=selectedAll?await loadAllAssetFlowRows(targets):await loadAssetFlowRows(walletAddress(targets[0]));
        renderTransactionControls();
        renderTransactionHistory();
        if(selectedAll){
          const claims=transactionRows.filter(r=>r.claim_nft_id!=null).length;
          const quality=historicalPriceQualityCounts(transactionRows);
          const distinctPrices=new Set(transactionRows.filter(r=>r.aptm_usd!=null).map(r=>Number(r.aptm_usd).toPrecision(12))).size;
          setTransactionStatus("ready",`Bereit – ${transactionRows.length.toLocaleString("de-DE")} Transaktionen aus ${targets.length} Wallets, ${claims.toLocaleString("de-DE")} Claims.`,
            `Blockchain-Aktualisierung und inkrementeller NFT-Besitzabgleich abgeschlossen. Preisqualität ${PRICE_SOURCE_TAG}: ${quality.exact.toLocaleString("de-DE")} exact · ${quality.fallback.toLocaleString("de-DE")} fallback · ${quality.prelaunch.toLocaleString("de-DE")} Pre-Launch · ${quality.missing.toLocaleString("de-DE")} ohne Preis · ${quality.manual.toLocaleString("de-DE")} manuell · ${distinctPrices.toLocaleString("de-DE")} unterschiedliche APTM/USD-Werte.`);
        }else{
          await showTransactionReadyStatus(walletAddress(targets[0]),transactionRows,"scan");
          const quality=historicalPriceQualityCounts(transactionRows);
          const distinctPrices=new Set(transactionRows.filter(r=>r.aptm_usd!=null).map(r=>Number(r.aptm_usd).toPrecision(12))).size;
          const statusEl=document.getElementById("dao1TransactionStatus");
          if(statusEl)statusEl.innerHTML+=`<div class="note" style="margin-top:4px">Preisqualität ${PRICE_SOURCE_TAG}: ${quality.exact.toLocaleString("de-DE")} exact · ${quality.fallback.toLocaleString("de-DE")} fallback · ${quality.prelaunch.toLocaleString("de-DE")} Pre-Launch · ${quality.missing.toLocaleString("de-DE")} ohne Preis · ${quality.manual.toLocaleString("de-DE")} manuell · ${distinctPrices.toLocaleString("de-DE")} unterschiedliche APTM/USD-Werte.</div>`;
        }
      }else{
        setTransactionStatus("db",selectedAll?"Gespeicherte Daten aller Apertum-Wallets werden geladen…":"Gespeicherte Wallet-Daten werden geladen…",
          "Keine Blockchain-Abfrage und keine Claim-Anreicherung.");
        transactionRows=selectedAll?await loadAllApertumTransactionRows(targets,document.getElementById("dao1TransactionStatus")):await loadTransactionRows(walletAddress(targets[0]),null);
        transactionAssetFlows=selectedAll?await loadAllAssetFlowRows(targets):await loadAssetFlowRows(walletAddress(targets[0]));
        if(job!==transactionJobToken)return;
        renderTransactionControls();
        renderTransactionHistory();
        if(selectedAll){
          const claims=transactionRows.filter(r=>r.claim_nft_id!=null).length;
          setTransactionStatus("ready",`Bereit – ${transactionRows.length.toLocaleString("de-DE")} Transaktionen aus ${targets.length} Wallets, ${claims.toLocaleString("de-DE")} Claims.`,
            "Nur gespeicherte Daten geladen – keine Blockchain-Abfrage.");
        }else{
          await showTransactionReadyStatus(walletAddress(targets[0]),transactionRows,"db");
        }
      }
    }catch(e){
      console.error("Apertum Transaktionshistorie:",e);
      if(job===transactionJobToken)setTransactionStatus("error",e.message||String(e));
    }finally{
      if(scan && btn && job===transactionJobToken){btn.disabled=false;btn.textContent="Daten aktualisieren";}
    }
  }

  async function enrichTransactionsWithClaims(address,status=null,jobToken=transactionJobToken,options={}){
    const claimPerf={startedAt:performance.now(),loadBaseMs:0,detailFlowsMs:0,valuationMs:0,nativeFallbackMs:0,saveNativeFlowsMs:0,nativeFlowsPersisted:0,rowBuildMs:0,saveClaimsMs:0,saveTxPatchesMs:0};
    const baseStarted=performance.now();
    const txs=await loadTransactionRows(address,null);
    // v53: Claims verwenden direkt den persistenten NFT-Cache DES betreffenden Wallets.
    // Dadurch ist die Zuordnung unabhängig davon, welches Wallet im NFT-Tab ausgewählt ist.
    const nftMap=await loadWalletNftMap(address);
    const cachedClaims=await loadCachedClaims(address,null);
    claimPerf.loadBaseMs=Math.round(performance.now()-baseStarted);
    const claimByHash=new Map(cachedClaims.map(c=>[String(c.tx_hash||"").toLowerCase(),c]));

    // v47: Zuerst nur aus den bereits vorhandenen Transaktionen Claim-Kandidaten bilden.
    // Für neue Mining-Bots genügt zunächst eine bekannte NFT-ID in den ersten ABI-Wörtern.
    // Nur für noch nicht verarbeitete Kandidaten werden anschließend deren Token-Transfers
    // direkt über /transactions/<hash>/token-transfers nachgeladen und persistent gecacht.
    function candidateEvidence(t){
      const selector=String(t?.selector||"").toLowerCase();
      if(selector===CLAIM_SELECTOR)return {legacy:true,newMiner:false,id:null};
      // v48: der neue Apertum Miner verwendet 0x19da4078 und claimt nicht
      // zwingend ein einzelnes NFT per ABI-Parameter. Deshalb reicht der
      // verifizierte Selector als Kandidat; zum echten Claim wird die TX erst
      // bei einem tatsächlichen eingehenden Reward-Asset-Flow.
      if(selector===NEW_MINER_CLAIM_SELECTOR){
        const id=knownNewMinerNftIdFromInventory(nftMap)
          || uniqueKnownNftIdFromInput(t?.raw_input||"",nftMap);
        return {legacy:false,newMiner:true,id:id||null};
      }
      const ps=words(t?.raw_input||"");
      const knownId=uniqueKnownNftIdFromInput(t?.raw_input||"",nftMap);
      return knownId?{legacy:false,newMiner:false,id:String(knownId)}:null;
    }
    const candidateByHash=new Map();
    for(const t of txs){
      const ev=candidateEvidence(t);
      if(ev)candidateByHash.set(String(t.tx_hash||"").toLowerCase(),ev);
    }

    let allFlows=await loadAssetFlowRows(address);
    const cachedFlowHashes=new Set(allFlows.map(f=>String(f.tx_hash||"").toLowerCase()));
    const cachedFlowsByHash=new Map();
    for(const f of allFlows){
      const h=String(f.tx_hash||"").toLowerCase();
      if(!cachedFlowsByHash.has(h))cachedFlowsByHash.set(h,[]);
      cachedFlowsByHash.get(h).push(f);
    }
    const detailTargets=txs.filter(t=>{
      const h=String(t.tx_hash||"").toLowerCase();
      const ev=candidateByHash.get(h);
      if(!ev)return false;
      const c=claimByHash.get(h);
      const cachedForTx=cachedFlowsByHash.get(h)||[];
      const hasIncoming=cachedForTx.some(f=>String(f.direction||"")==="eingang");
      // Phase 5.98: Wenn unmittelbar davor der vollständige Wallet-ERC-20-Scan
      // erfolgreich lief, sind fehlende Tx-Flows kein Grund für hunderte einzelne
      // Explorer-Detailrequests. ERC-20-Payouts wären bereits im Wallet-Scan
      // enthalten; offene Claims werden danach gezielt über native Receipt/Internal-
      // Evidenz geprüft. Das beseitigt den >10-Minuten-Fresh-Import.
      if(options?.assetFlowScanComplete===true)return false;
      if(ev.newMiner)return false;
      if(t.claim_nft_id!=null && c?.reward_asset_symbol)return false;
      return !cachedFlowHashes.has(h);
    });
    const detailStarted=performance.now();
    for(let i=0;i<detailTargets.length;i++){
      if(jobToken!==transactionJobToken)return;
      const t=detailTargets[i];
      setTransactionStatus("loading",`Claim-Details werden gezielt geladen ${i+1}/${detailTargets.length}…`,"Nur Token-Transfers der noch offenen Claim-Kandidaten werden abgefragt.");
      try{await cacheAssetFlowsForTransaction(t.tx_hash,address,t);}catch(e){console.warn("DAO1 Claim Detail-Flow",t.tx_hash,e);}
    }

    claimPerf.detailFlowsMs=Math.round(performance.now()-detailStarted);
    allFlows=await loadAssetFlowRows(address);

    // v49: Bereits gecachte Claim-Flows mit fehlendem historischen Preis werden
    // beim normalen "Daten aktualisieren" automatisch nachbewertet. Ein separater
    // Preisjob ist dafür nicht nötig.
    const candidateHashes=new Set(candidateByHash.keys());
    const needsValuation=allFlows.filter(f=>candidateHashes.has(String(f.tx_hash||"").toLowerCase())
      && f.direction==="eingang" && (f.price_usd==null || f.value_usd==null));
    const valuationStarted=performance.now();
    if(needsValuation.length){
      await valueAssetFlows(needsValuation);
      await saveAssetFlowRows(needsValuation);
      allFlows=await loadAssetFlowRows(address);
    }
    claimPerf.valuationMs=Math.round(performance.now()-valuationStarted);

    const flowsByTx=new Map();
    for(const f of allFlows){
      const h=String(f.tx_hash||"").toLowerCase();
      if(!flowsByTx.has(h))flowsByTx.set(h,[]);
      flowsByTx.get(h).push(f);
    }
    function claimEvidence(t){
      const h=String(t?.tx_hash||"").toLowerCase();
      const ev=candidateByHash.get(h);
      if(!ev)return null;
      if(ev.legacy)return ev;
      const allForTx=(flowsByTx.get(h)||[]);
      const incoming=allForTx.filter(f=>f.direction==="eingang");
      // Neuer Miner zahlt nachweislich über eine interne native APTM-Transaktion aus.
      // Deshalb darf fehlender ERC-20-Flow die Claim-Anreicherung nicht blockieren;
      // die tatsächliche Auszahlung wird im Claim-Loop über Internal Transactions bestätigt.
      if(ev.newMiner)return ev;
      return incoming.length?ev:null;
    }
    const evidenceByHash=new Map();
    const allClaimTxs=txs.filter(t=>{const ev=claimEvidence(t);if(ev)evidenceByHash.set(String(t.tx_hash||"").toLowerCase(),ev);return !!ev;});
    const claimTxs=allClaimTxs.filter(t=>{const c=claimByHash.get(String(t.tx_hash||"").toLowerCase());return t.claim_nft_id==null || !c?.reward_asset_symbol;});
    if(!claimTxs.length){
      console.info("DAO1 Claim Performance",{...claimPerf,totalMs:Math.round(performance.now()-claimPerf.startedAt),claimTxs:0,detailTargets:detailTargets.length,nativeTargets:0});
      setTransactionStatus("ready",`Keine neuen Claims anzureichern.`,`${allClaimTxs.length.toLocaleString("de-DE")} Claim-Transaktionen (Legacy + neue Mining-Bot-Evidenz) sind bereits assetgenau verarbeitet.`);
      return {updatedClaims:0,detailTargets:detailTargets.length};
    }
    setTransactionStatus("loading",`${claimTxs.length.toLocaleString("de-DE")} Claim(s) werden assetgenau angereichert…`,`ERC-20-Auszahlungen stammen aus dem Wallet-Flow-Cache; native Claim-Auszahlungen werden parallel aus Receipt/Internal-Evidenz ergänzt.`);

    // Phase 5.98: Native Fallback-Evidenz nicht mehr Claim für Claim seriell laden.
    // Bei 200+ historischen Claims verursachte das mehrere Minuten Wartezeit.
    // Max. 8 parallele, deduplizierte Requests halten Explorer/RPC moderat belastet.
    const nativeFallbackByHash=new Map();
    const nativeStarted=performance.now();
    const nativeTargets=claimTxs.filter(t=>{
      const h=String(t.tx_hash||"").toLowerCase();
      return !(flowsByTx.get(h)||[]).some(f=>f.direction==="eingang");
    });
    if(nativeTargets.length){
      setTransactionStatus("loading",`Native Claim-Auszahlungen werden geprüft · ${nativeTargets.length.toLocaleString("de-DE")} Tx…`,`Bis zu 8 Abfragen parallel; bereits gecachte Evidenz wird wiederverwendet.`);
      await mapLimited(nativeTargets,8,async(t,idx)=>{
        if(jobToken!==transactionJobToken)return;
        const h=String(t.tx_hash||"").toLowerCase();
        const ev=evidenceByHash.get(h);
        let amount=0;
        if(ev?.newMiner){
          amount=await rewardFromInternalTransactions(t.tx_hash,address,t.to_address||DEFAULT_MINER_NFT_CONTRACT);
        }else{
          const logs=await fetchClaimTransferLogs(t.tx_hash);
          amount=rewardFromLogs(logs,address);
        }
        nativeFallbackByHash.set(h,Number(amount||0));
        if((idx+1)%25===0 || idx+1===nativeTargets.length){
          setTransactionStatus("loading",`Native Claim-Auszahlungen ${idx+1}/${nativeTargets.length} geprüft…`,`Parallelisierte Receipt/Internal-Prüfung; keine einzelnen ERC-20-Detailrequests nach vollständigem Wallet-Flow-Scan.`);
        }
      });
      if(jobToken!==transactionJobToken)return;
    }
    claimPerf.nativeFallbackMs=Math.round(performance.now()-nativeStarted);

    // Phase 6.20 / P5: Bestätigte native APTM-Claim-Auszahlungen werden nicht mehr
    // nur als Claim-Legacyfelder geführt. Sie erhalten denselben kanonischen
    // project_transaction_asset_flows-Datensatz wie ERC-20-Claims. Damit lesen
    // Dashboard, Bot-Summen und Claim-Detail auch native Claims asset-flow-first.
    const nativeFlowStarted=performance.now();
    const nativeFlowRows=[];
    for(const t of nativeTargets){
      const h=String(t.tx_hash||"").toLowerCase();
      const amount=Number(nativeFallbackByHash.get(h)||0);
      if(!Number.isFinite(amount)||amount<=0)continue;
      if((flowsByTx.get(h)||[]).some(f=>f.direction==="eingang"))continue;
      const txPrice=Number(t.aptm_usd||0);
      const row=nativeClaimAssetFlowRow(address,t,amount,{
        priceUsd:txPrice>0?txPrice:null,
        valueUsd:txPrice>0?amount*txPrice:null,
        priceSource:txPrice>0?(t.price_source||"Historischer APTM/USD-Kurs der Claim-TX"):null,
        counterparty:t.to_address||null
      });
      if(row)nativeFlowRows.push(row);
    }
    if(nativeFlowRows.length){
      const nativeNeedsValuation=nativeFlowRows.filter(r=>r.price_usd==null || r.value_usd==null);
      if(nativeNeedsValuation.length)await valueAssetFlows(nativeNeedsValuation);
      await saveAssetFlowRows(nativeFlowRows);
      for(const row of nativeFlowRows){
        const h=String(row.tx_hash||"").toLowerCase();
        allFlows.push(row);
        if(!flowsByTx.has(h))flowsByTx.set(h,[]);
        flowsByTx.get(h).push(row);
      }
    }
    claimPerf.saveNativeFlowsMs=Math.round(performance.now()-nativeFlowStarted);
    claimPerf.nativeFlowsPersisted=nativeFlowRows.length;

    const rowBuildStarted=performance.now();
    const claimRows=[];
    for(let i=0;i<claimTxs.length;i++){
      if(jobToken!==transactionJobToken)return;
      const t=claimTxs[i];
      if(i===0 || (i+1)%10===0 || i+1===claimTxs.length){
        setTransactionStatus("loading",`Claims werden angereichert ${i+1}/${claimTxs.length}…`,`NFT + tatsächliches Auszahlungsasset werden zugeordnet.`);
      }
      const ps=words(t.raw_input||"");
      const evidence=evidenceByHash.get(String(t.tx_hash||"").toLowerCase());
      const isNewMiner=!!evidence?.newMiner;
      let knownId=evidence?.id
        || (isNewMiner?knownNewMinerNftIdFromInventory(nftMap):null)
        || uniqueKnownNftIdFromInput(t.raw_input||"",nftMap);
      if(isNewMiner && !knownId){
        setTransactionStatus("loading",`Neuer Miner · NFT-Zuordnung ${i+1}/${claimTxs.length}…`,`NFT-Bestand war nicht eindeutig; Tx-Detail und Event-Logs werden nur als Fallback gegen bekannte Wallet-NFTs geprüft.`);
        knownId=await resolveNewMinerNftId(t,nftMap);
      }
      const decodedId=knownId || (!isNewMiner ? (ps[0]?.toString() || ps[1]?.toString()) : null);
      if(!isNewMiner && (!decodedId || !/^\d+$/.test(decodedId)))continue;
      const nft=(decodedId && nftMap.has(String(decodedId)))
        ? nftMap.get(String(decodedId))
        : isNewMiner
          ? {
              id:null,contract:lower(t.to_address||""),name:"Apertum Miner",
              classification:{nft_name:"Apertum Miner",subtype:"Mining-Bot"}
            }
          : {
              id:String(decodedId),contract:lower(DEFAULT_MINER_NFT_CONTRACT),
              name:`NFT #${decodedId}`,classification:null
            };

      const incoming=(flowsByTx.get(String(t.tx_hash||"").toLowerCase())||[])
        .filter(f=>f.direction==="eingang")
        .sort((a,b)=>Number(b.value_usd||0)-Number(a.value_usd||0));
      const primary=incoming[0]||null;

      // Native APTM-Fallback wurde für alle offenen Claims bereits parallel
      // vorab ermittelt. Im Claim-Loop selbst entstehen keine seriellen Netzrequests.
      const nativeRewardAptm=primary?0:Number(nativeFallbackByHash.get(String(t.tx_hash||"").toLowerCase())||0);

      const rewardAmount=primary?Number(primary.amount||0):Number(nativeRewardAptm||0);
      const rewardSymbol=primary?String(primary.token_symbol||"TOKEN"):"APTM";
      let rewardUsd=primary?.value_usd==null?null:Number(primary.value_usd);
      let rewardPrice=primary?.price_usd==null?null:Number(primary.price_usd);
      let rewardSource=primary?.price_source||null;
      if(!primary && rewardAmount>0){
        const txPrice=Number(t.aptm_usd||0);
        if(txPrice>0){
          rewardPrice=txPrice;
          rewardUsd=rewardAmount*txPrice;
          rewardSource=t.price_source||"Historischer APTM/USD-Kurs der Claim-TX";
        }
      }
      const legacyRewardAptm=primary
        ? ((isWrappedAptmSymbol(primary.token_symbol,primary.token_name)||lower(primary.token_address||"")==="native"||String(primary.token_symbol||"").toUpperCase()==="APTM")?rewardAmount:null)
        : rewardAmount;

      claimRows.push({
        user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
        wallet_id:walletIdForAddress(address),nft_contract:nft.contract||null,nft_id:decodedId?Number(decodedId):null,
        nft_name:nft.classification?.nft_name || nft.name || (decodedId?`NFT #${decodedId}`:"Apertum Miner"),
        nft_subtype:nft.classification?.subtype||null,tx_hash:t.tx_hash,
        block_number:Number(t.block_number),tx_timestamp:t.tx_timestamp,
        param1:ps[0]?.toString(),param2:ps[1]?.toString(),
        reward_aptm:legacyRewardAptm,gas_aptm:Number(t.gas_aptm||0),
        net_aptm:legacyRewardAptm==null?0:Number(legacyRewardAptm||0)-Number(t.gas_aptm||0),
        reward_asset_address:primary?.token_address||null,
        reward_asset_symbol:rewardSymbol,
        reward_asset_decimals:primary?.token_decimals??18,
        reward_asset_amount:rewardAmount,
        reward_asset_usd:rewardUsd,
        reward_asset_price_source:rewardSource,
        aptm_usd:(!primary && rewardPrice>0)?rewardPrice:null,reward_usd:rewardUsd,gas_usd:null,
        price_block:(!primary && rewardPrice>0)?Number(t.block_number):null,
        price_source:(!primary && rewardPrice>0)?rewardSource:null,updated_at:new Date().toISOString()
      });
    }

    claimPerf.rowBuildMs=Math.round(performance.now()-rowBuildStarted);
    if(claimRows.length){
      const saveClaimsStarted=performance.now();
      await saveClaimRows(claimRows);
      claimPerf.saveClaimsMs=Math.round(performance.now()-saveClaimsStarted);
      if(jobToken!==transactionJobToken)return;
      // Phase 6.13 / P4: Bis 6.12 wurde jede Claim-TX einzeln per UPDATE
      // geschrieben (im Realtest 266 Claims, ~40 s Gesamt-Claimteiljob).
      // Dieselben Marker werden jetzt in einem Upsert-Batch gespeichert.
      const claimTxPatches=claimRows.map(r=>({
        user_id:getContext?.().currentUser.id,
        project_key:PROJECT_KEY,
        chain_key:CHAIN_KEY,
        wallet_id:walletIdForAddress(address),
        tx_hash:r.tx_hash,
        claim_nft_id:r.nft_id,
        claim_nft_name:r.nft_name,
        claim_nft_subtype:r.nft_subtype,
        // Legacy-Feld nur noch für native/wAPTM-kompatible Rewards.
        claim_reward_aptm:r.reward_aptm,
        claim_reward_usd:r.reward_asset_usd,
        updated_at:new Date().toISOString()
      }));
      const saveTxStarted=performance.now();
      try{
        await saveTransactionClaimPatches(claimTxPatches);
        claimPerf.saveTxPatchesMs=Math.round(performance.now()-saveTxStarted);
      }catch(error){
        console.warn("Tx Claim asset enrichment batch:",error);
        throw error;
      }
      setTransactionStatus("ready",`${claimRows.length.toLocaleString("de-DE")} Claim(s) assetgenau angereichert und gespeichert.`);
    }
    console.info("DAO1 Claim Performance",{...claimPerf,totalMs:Math.round(performance.now()-claimPerf.startedAt),claimTxs:claimTxs.length,detailTargets:detailTargets.length,nativeTargets:nativeTargets.length,updatedClaims:claimRows.length});
    return {updatedClaims:claimRows.length,detailTargets:detailTargets.length};
  }

  function transactionClaimDescriptor(r){
    if(r.claim_nft_id==null){
      if(isNewMinerClaimSelector(r?.selector) || r?.claim_nft_name){
        return {id:null,subtype:r?.claim_nft_subtype||"Mining-Bot",name:r?.claim_nft_name||"Apertum Miner"};
      }
      return null;
    }
    const subtype=currentSubtypeForClaim(r.claim_nft_id,r.claim_nft_subtype);
    const name=currentNameForClaim(r.claim_nft_id,r.claim_nft_name);
    return {id:String(r.claim_nft_id),subtype,name};
  }

  function isDidReferralRow(r){
    if(rowWalletAddress(r)!==REFERRAL_WALLET)return false;
    const d=transactionClaimDescriptor(r);
    return !!d && String(d.subtype||"").toUpperCase()==="DID";
  }

  function transactionFilterNfts(){
    const map=new Map();
    for(const r of transactionRows){
      const d=transactionClaimDescriptor(r);
      if(!d || d.id==null)continue;
      if(txFilterClass!=="__all" && d.subtype!==txFilterClass)continue;
      if(!map.has(d.id))map.set(d.id,d);
    }
    return [...map.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),"de",{numeric:true}) || Number(a.id)-Number(b.id));
  }

  function transactionFilterClasses(){
    return [...new Set(transactionRows.map(r=>transactionClaimDescriptor(r)?.subtype).filter(Boolean))].sort();
  }

  function rowWalletAddress(r){
    if(r?.wallet_address)return lower(r.wallet_address);
    const w=allProjectWalletOptions().find(x=>String(x.id)===String(r?.wallet_id) || String(x.dbId||"")===String(r?.wallet_id));
    return lower(walletAddress(w)||"");
  }

  function isVerifiedReferralFlow(f){
    return f?.direction==="eingang"
      && lower(f?.token_address||"")===REFERRAL_WUSDT_TOKEN
      && lower(f?.counterparty_address||"")===REFERRAL_REWARD_CONTRACT;
  }

  function isVerifiedReferralTx(r){
    if(rowWalletAddress(r)!==REFERRAL_WALLET)return false;
    if(lower(r?.to_address||"")!==REFERRAL_REWARD_CONTRACT)return false;
    const method=String(r?.method||"").toLowerCase();
    // Der verifizierte Kontrollfall ist withdraw. Falls der Explorer die Methode
    // einmal nicht decodiert, reicht Contract + tatsächlicher wUSDT-Rückfluss.
    if(method && method!=="withdraw" && method!=="contract call" && !method.startsWith("0x"))return false;
    return incomingAssetFlowsForTx(r).some(isVerifiedReferralFlow);
  }

  function verifiedReferralFlowsForTx(r){
    return isVerifiedReferralTx(r)?incomingAssetFlowsForTx(r).filter(isVerifiedReferralFlow):[];
  }

  function unverifiedReferralCandidateFlowsForTx(r){
    const own=new Set(allProjectWalletOptions().map(w=>lower(walletAddress(w))).filter(Boolean));
    if(rowWalletAddress(r)!==REFERRAL_WALLET)return [];
    return incomingAssetFlowsForTx(r).filter(f=>
      String(f?.token_symbol||"").toUpperCase()==="WUSDT"
      && !own.has(lower(f?.counterparty_address||""))
      && !verifiedReferralFlowsForTx(r).includes(f)
    );
  }

  function dao1TransactionType(r){
    if(isDidReferralRow(r))return "Referral Reward";
    if(isClaimTxRow(r))return "Claim (Bot)";
    if(verifiedReferralFlowsForTx(r).length)return "Referral Reward";
    if(unverifiedReferralCandidateFlowsForTx(r).length)return "wUSDT-Eingang (prüfen)";
    if(assetFlowsForTx(r).length)return "Token-Transfer";
    if(r?.direction==="intern")return "Interner Transfer";
    if(r?.direction==="eingang")return "Eingang";
    if(r?.direction==="ausgang")return "Ausgang";
    return r?.method&&r.method!=="Transfer"?"Contract Call":"Transaktion";
  }

  function verifiedReferralRewards(sourceRows=transactionRows){
    const out=[];
    const seen=new Set();
    for(const r of sourceRows){
      const h=String(r.tx_hash||"").toLowerCase();
      if(isDidReferralRow(r)){
        const flows=incomingAssetFlowsForTx(r);
        out.push({...r,_referralFlows:flows,_referralSource:"DID"});
        seen.add(h);
        continue;
      }
      if(isClaimTxRow(r))continue;
      const flows=verifiedReferralFlowsForTx(r);
      if(flows.length && !seen.has(h))out.push({...r,_referralFlows:flows,_referralSource:"Contract"});
    }
    return out;
  }

  function referralRewardCandidates(sourceRows=transactionRows){
    const out=[];
    for(const r of sourceRows){
      if(isClaimTxRow(r))continue;
      const flows=unverifiedReferralCandidateFlowsForTx(r);
      if(flows.length)out.push({...r,_referralFlows:flows});
    }
    return out;
  }


  function tabWalletFilteredRows(rows,filterValue){
    if(!filterValue || filterValue==="__all")return rows;
    return rows.filter(r=>String(r.wallet_id||"")===String(filterValue));
  }
  function tabWalletFilterHtml(kind,currentValue){
    const wallets=allProjectWalletOptions();
    return `<label style="min-width:320px"><span class="field-label">Wallet</span><select onchange="DAO1Project.setResultWalletFilter('${kind}',this.value)"><option value="__all" ${currentValue==="__all"?"selected":""}>Alle Wallets</option>${wallets.map(w=>`<option value="${w.id}" ${String(w.id)===String(currentValue)?"selected":""}>${w.label} · ${walletAddress(w)}</option>`).join("")}</select></label>`;
  }
  function claimNftFilterHtml(rows){
    const ids=[...new Set((rows||[]).map(r=>r.claim_nft_id).filter(v=>v!=null).map(String))].sort((a,b)=>Number(a)-Number(b));
    const hasUnassigned=(rows||[]).some(r=>r.claim_nft_id==null);
    return `<label style="min-width:220px"><span class="field-label">NFT</span><select onchange="DAO1Project.setClaimNftFilter(this.value)">
      <option value="__all" ${claimFilterNft==="__all"?"selected":""}>Alle NFTs</option>
      ${ids.map(id=>`<option value="${id}" ${claimFilterNft===id?"selected":""}>#${id}</option>`).join("")}
      ${hasUnassigned?`<option value="__unassigned" ${claimFilterNft==="__unassigned"?"selected":""}>Nicht zugeordnet</option>`:""}
    </select></label>`;
  }
  function setClaimNftFilter(value){
    claimFilterNft=String(value||"__all");
    renderClaimsTab();
  }

  function setResultWalletFilter(kind,value){
    if(kind==="claims"){claimFilterWallet=String(value||"__all");claimFilterNft="__all";renderClaimsTab();}
    else if(kind==="referrals"){referralFilterWallet=String(value||"__all");renderReferralRewardsTab();}
  }

  function claimWalletDisplay(r){
    const walletId=String(r?.wallet_id||"");
    const wallet=projectWallets().find(w=>String(w.dbId||w.id)===walletId);
    const address=wallet?walletAddress(wallet):String(r?.wallet_address||"");
    const name=String(wallet?.name || wallet?.label || "Wallet").trim();
    return {name,address};
  }

  function claimGasHistoricalUsd(r){
    const gas=Number(r?.gas_aptm||0);
    const price=Number(r?.aptm_usd||0);
    if(!(gas>0) || !(price>0))return null;
    return gas*price;
  }

  function usd2(value){
    const n=Number(value||0);
    return `$ ${Number.isFinite(n)?n.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2}):"0.00"}`;
  }

  function payoutSummaryLineHtml(symbol,entry){
    const missing=Number(entry?.missingUsd||0);
    const displaySymbol=String(entry?.symbol||symbol||"TOKEN");
    const amount=Number(entry?.amount||0);
    const amountText=tokenAmount(amount,{address:entry?.tokenAddress||null,symbol:displaySymbol});
    return `<tr>
      <td><strong>${displaySymbol}</strong></td>
      <td>${Number(entry?.count||0).toLocaleString("de-DE")} Auszahlung(en)</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums"><strong>${amountText} ${displaySymbol}</strong></td>
      <td style="text-align:right;font-variant-numeric:tabular-nums"><strong>${usd2(Number(entry?.usd||0))}</strong></td>
      <td class="meta">${missing?`${missing.toLocaleString("de-DE")} ohne USD-Wert`:"vollständig bewertet"}</td>
    </tr>`;
  }

  function botClaimPayoutSummary(rows){
    const byToken=new Map();
    let unresolvedClaims=0;
    let totalUsd=0;
    let missingUsd=0;

    function add(symbol,amount,valueUsd,hasUsd,tokenAddress=null){
      const sym=String(symbol||"TOKEN")||"TOKEN";
      const addr=lower(tokenAddress||"")||null;
      const key=addr?`${sym}|${addr}`:sym;
      if(!byToken.has(key))byToken.set(key,{symbol:sym,tokenAddress:addr,count:0,amount:0,usd:0,missingUsd:0});
      const e=byToken.get(key);
      e.count++;
      const qty=Number(amount||0);if(Number.isFinite(qty))e.amount+=qty;
      if(hasUsd){
        const v=Number(valueUsd||0);
        if(Number.isFinite(v)){e.usd+=v;totalUsd+=v;}
      }else{
        e.missingUsd++;
        missingUsd++;
      }
    }

    for(const r of rows){
      const payouts=claimPayoutEntriesForTx(r);
      if(payouts.length){
        for(const f of payouts){
          const sym=isWrappedAptmSymbol(f.token_symbol,f.token_name)?"wAPTM":String(f.token_symbol||f.token_name||"TOKEN");
          const hasUsd=f.value_usd!=null && Number.isFinite(Number(f.value_usd));
          add(sym,f.amount,f.value_usd,hasUsd,f.token_address);
        }
      }else unresolvedClaims++;
    }
    return {byToken,totalUsd,missingUsd,unresolvedClaims};
  }

  function referralPayoutSummary(rows){
    const byToken=new Map();
    let totalUsd=0;
    let missingUsd=0;
    function add(symbol,amount,valueUsd,hasUsd,tokenAddress=null){
      const sym=String(symbol||"TOKEN")||"TOKEN";
      const addr=lower(tokenAddress||"")||null;
      const key=addr?`${sym}|${addr}`:sym;
      if(!byToken.has(key))byToken.set(key,{symbol:sym,tokenAddress:addr,count:0,amount:0,usd:0,missingUsd:0});
      const e=byToken.get(key);
      e.count++;
      const qty=Number(amount||0);if(Number.isFinite(qty))e.amount+=qty;
      if(hasUsd){
        const v=Number(valueUsd||0);
        if(Number.isFinite(v)){e.usd+=v;totalUsd+=v;}
      }else{
        e.missingUsd++;
        missingUsd++;
      }
    }
    for(const r of rows){
      for(const f of (r._referralFlows||[])){
        const hasUsd=f.value_usd!=null && Number.isFinite(Number(f.value_usd));
        add(f.token_symbol||f.token_name||"TOKEN",f.amount,f.value_usd,hasUsd,f.token_address);
      }
    }
    return {byToken,totalUsd,missingUsd};
  }

  function payoutSummaryCardHtml(title,summary,extraText="",countLabel="",countValue=null){
    const lines=[...summary.byToken.entries()]
      .sort((a,b)=>a[0].localeCompare(b[0]))
      .map(([sym,e])=>payoutSummaryLineHtml(sym,e))
      .join("");
    const countRow=countLabel&&countValue!=null?`<tr class="payout-summary-count">
      <td><strong>${countLabel}</strong></td>
      <td><strong>${Number(countValue||0).toLocaleString("de-DE")}</strong></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>`:"";
    const total=`<tr class="payout-summary-total">
      <td colspan="3"><strong>Total historischer USD-Wert</strong></td>
      <td style="text-align:right;font-variant-numeric:tabular-nums"><strong>${usd2(Number(summary.totalUsd||0))}</strong></td>
      <td></td>
    </tr>`;
    const missing=Number(summary.missingUsd||0)>0
      ?`<div class="meta" style="margin-top:8px">${summary.missingUsd.toLocaleString("de-DE")} Auszahlung(en) noch ohne historischen USD-Wert.</div>`
      :"";
    return `<div class="custom-token-card project-summary-box">
      <span class="field-label">${title}</span>
      ${lines?`<div class="project-data-table compact-table payout-summary-table" style="margin-top:10px">
        <table>
          <thead><tr>
            <th>Token</th>
            <th>Auszahlungen</th>
            <th style="text-align:right">Reward-Menge</th>
            <th style="text-align:right">Wert in USD hist.</th>
            <th>Status</th>
          </tr></thead>
          <tbody>${countRow}${lines}${total}</tbody>
        </table>
      </div>`:`<div class="meta" style="margin-top:8px">Keine Auszahlungen im aktuellen Filter.</div>`}
      ${missing}${extraText}
    </div>`;
  }

  function renderClaimsTab(){
    const el=document.getElementById("dao1ClaimsContent");if(!el)return;
    const walletRows=tabWalletFilteredRows(transactionRows.filter(r=>isClaimTxRow(r) && !isDidReferralRow(r)),claimFilterWallet);
    let rows=[...walletRows];
    if(claimFilterNft==="__unassigned")rows=rows.filter(r=>r.claim_nft_id==null);
    else if(claimFilterNft!=="__all")rows=rows.filter(r=>String(r.claim_nft_id??"")===claimFilterNft);
    const payoutSummary=botClaimPayoutSummary(rows);
    const unresolvedText=payoutSummary.unresolvedClaims?`<div class="meta" style="margin-top:5px">${payoutSummary.unresolvedClaims.toLocaleString("de-DE")} Claim(s) noch ohne ermittelte Auszahlung.</div>`:"";
    el.innerHTML=`<div class="custom-token-card"><div class="chain-title">⛏️ Bot-Claims</div><div class="note">Bot-Claims werden über den Legacy-Selector 0x86bb8f37 sowie den neuen Apertum-Miner-Selector 0x19da4078 erkannt. DID-Auszahlungen sind fachlich Referral Rewards und werden hier bewusst ausgeschlossen. Beim neuen Miner bestätigt erst eine tatsächliche Auszahlung den Claim.</div><div class="custom-token-grid" style="margin-top:10px;grid-template-columns:minmax(320px,520px) minmax(220px,320px)">${tabWalletFilterHtml("claims",claimFilterWallet)}${claimNftFilterHtml(walletRows)}</div></div>
      <div class="project-summary" style="grid-template-columns:1fr">${payoutSummaryCardHtml("Auszahlungen",payoutSummary,unresolvedText,"Bot-Claims",rows.length)}</div>
      <div class="custom-token-card dao1-data-table-card" style="padding:0;overflow:hidden"><div class="chain-table-wrap project-data-table sticky-header dao1-transaction-table-wrap" style="margin:0;max-height:680px;overflow:auto"><table class="dao1-transaction-table"><thead><tr><th>Zeit</th><th>Wallet</th><th>Typ</th><th>NFT</th><th>Auszahlung<div class="meta">Wert in USD hist.</div></th><th>APTM-Preis USD<div class="meta">historisch</div></th><th>Gas APTM<div class="meta">Wert in USD hist.</div></th><th>Tx</th></tr></thead><tbody>${rows.map(r=>{const d=transactionClaimDescriptor(r);const payouts=claimPayoutEntriesForTx(r);const w=claimWalletDisplay(r);const gasUsd=claimGasHistoricalUsd(r);const payoutHtml=payouts.length?payouts.map(f=>{const isWrapped=isWrappedAptmSymbol(f.token_symbol,f.token_name);const amount=isWrapped?`${tokenAmount(Number(f.amount||0),{address:f.token_address||null,symbol:f.token_symbol||"wAPTM"})} wAPTM`:`${tokenAmount(Number(f.amount||0),{address:f.token_address||null,symbol:f.token_symbol||"TOKEN"})} ${escapeHtml(f.token_symbol||"TOKEN")}`;const histUsd=Number(f.value_usd||0);return `<strong>${amount}</strong><div class="meta">${histUsd?usd(histUsd):"USD hist. –"}</div>`;}).join(""):"–";return `<tr><td>${r.tx_timestamp?new Date(r.tx_timestamp).toLocaleString("de-CH",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"–"}</td><td><strong>${w.name||"Wallet"}</strong><div class="meta">${w.address||"–"}</div></td><td>Claim (Bot)</td><td><strong>${d?.name||"Apertum Miner"}</strong>${r.claim_nft_id!=null?`<div class="meta">#${r.claim_nft_id}${d?.subtype?" · "+d.subtype:""}</div>`:(d?.subtype?`<div class="meta">${d.subtype}</div>`:"")}</td><td>${payoutHtml}</td><td>${(()=>{const p=payouts.find(f=>((String(f.token_address||"").toLowerCase()==="native"&&String(f.token_symbol||"").toUpperCase()==="APTM")||isWrappedAptmSymbol(f.token_symbol,f.token_name))&&f.price_usd!=null&&Number.isFinite(Number(f.price_usd)));return p?usd(Number(p.price_usd)):"–";})()}</td><td>${fmt(r.gas_aptm)}${gasUsd!=null?`<div class="meta">${usd(gasUsd)}</div>`:`<div class="meta">–</div>`}</td><td><a href="${EXPLORER}/tx/${r.tx_hash}" target="_blank" rel="noopener">${String(r.tx_hash||"").slice(0,12)}…</a></td></tr>`;}).join("")}</tbody></table></div></div>`;
  }

  let dao1TeamTreeMode="wallet";
  let dao1TeamRootFilter="__all";
  let dao1OwnedDidRoots=[];
  let aptmdaoOwnedDidRoots=[];
  let dao1TeamAliases={};
  let dao1TeamAliasesLoaded=false;
  const dao1TeamCollapsed=new Set();
  const dao1TeamBlockTimeCache=new Map();
  const dao1TeamPartnerDetailsCache=new Map();
  const dao1PartnerBotStats=new Map();
  // Aktuell on-chain gehaltene DAO1-/APTMDAO-DIDs fremder Partner-Wallets.
  // Diese Identitaeten sind unabhaengig davon, ob die jeweilige DID-Kante bereits
  // im persoenlichen Tree-Slice enthalten ist (z. B. nach nachtraeglich erfasstem Root).
  const dao1PartnerIdentityStats=new Map();
  let dao1PartnerBotRefreshRunning=false;
  let dao1PartnerBotCacheLoaded=false;
  const dao1PartnerBotScanStateCache=new Map();
  const dao1PartnerBotRefreshInflight=new Map();

  function dao1TeamAliasKey(did,mode=dao1TeamTreeMode){return `${mode==="aptmdao"?"aptmdao":"dao1"}:did:${String(did||"").trim()}`;}
  function dao1TeamAliasFor(did,mode){const direct=dao1TeamAliases[dao1TeamAliasKey(did,mode)];return direct?String(direct).trim():"";}
  function dao1TeamAlias(did){return dao1TeamAliasFor(did,dao1TeamTreeMode);}
  function dao1TeamRootList(){return dao1TeamTreeMode==="aptmdao"?aptmdaoOwnedDidRoots:dao1OwnedDidRoots;}
  function dao1AllOwnedDidRoots(){return [...dao1OwnedDidRoots.map(r=>({...r,system:"legacy"})),...aptmdaoOwnedDidRoots.map(r=>({...r,system:"aptmdao"}))];}
  function dao1TeamWalletForDid(did,st=teamDiscoveryState()){const edge=(st?.edges||[]).find(e=>Number(e.child_id)===Number(did));const root=dao1TeamRootList().find(r=>Number(r.did)===Number(did));return edge?.wallet||root?.wallet_address||"";}
  async function loadDAO1TeamAliases(){
    dao1TeamAliases={};dao1TeamAliasesLoaded=true;
    try{
      const {data,error}=await sb.functions.invoke("wallet-private",{body:{action:"team_alias_list"}});
      if(error)throw error;if(!data?.ok)throw new Error(data?.error||"team_alias_list fehlgeschlagen");
      for(const [k,v] of Object.entries(data?.aliases||{})){if((k.startsWith("dao1:did:")||k.startsWith("aptmdao:did:"))&&String(v||"").trim())dao1TeamAliases[k]=String(v).trim();}
    }catch(e){console.warn("DAO1 Team-Namen",e);}
    return dao1TeamAliases;
  }
  async function dao1WalletPrivate(action,body={}){
    // Eine einzige zentrale Auth-/Retry-Implementierung verhindert, dass DAO-Team-Jobs
    // bei einem abgelaufenen JWT mit 401/403 in einem halbfertigen Zustand bleiben.
    if(typeof window.invokeWalletPrivate==="function")return window.invokeWalletPrivate(action,body);
    const {data,error}=await sb.functions.invoke("wallet-private",{body:{action,...body}});
    if(error)throw error;
    if(!data?.ok)throw new Error(data?.error||`wallet-private/${action} fehlgeschlagen`);
    return data;
  }
  async function saveDAO1TeamAlias(did,value,input=null,mode=dao1TeamTreeMode){
    const reference=dao1TeamAliasKey(did,mode),alias=String(value||"").trim();
    const oldValue=dao1TeamAliases[reference]||"";
    if(input){input.disabled=true;input.classList.remove("save-error");}
    try{
      // DAO1 und APTMDAO besitzen getrennte DID-/Alias-Namespaces; keine automatische
      // Übernahme über Wallet oder gleichlautende IDs zwischen den beiden Trees.
      await dao1WalletPrivate("team_alias_save",{reference,alias});
      if(alias)dao1TeamAliases[reference]=alias;else delete dao1TeamAliases[reference];
      if(input){input.dataset.savedValue=alias;input.title=`${mode==="aptmdao"?"APTMDAO":"DAO1"}-Name verschlüsselt gespeichert`;}
      renderDAO1TeamTreePanel();return true;
    }catch(e){
      dao1TeamAliases[reference]=oldValue;
      if(input){input.value=oldValue;input.classList.add("save-error");input.title=`Speichern fehlgeschlagen: ${e?.message||e}`;}
      console.warn("DAO1 Team-Name speichern",e);
      alert(`${mode==="aptmdao"?"APTMDAO":"DAO1"}-Name konnte nicht gespeichert werden: ${e?.message||e}`);
      return false;
    }finally{if(input)input.disabled=false;}
  }
  const dao1OldTreeCacheDiag={source:"–",localRows:0,deltaRows:0,dbRows:0,idbMs:0,stateMs:0,metaMs:0,registryMs:0,probeMs:0,deltaDbMs:0,totalCacheMs:0,latestBlockMs:0,overlapRpcMs:0,saveMs:0,scanMs:0,renderMs:0,scanMode:"–",fromBlock:0,toBlock:0,scannedBlocks:0,rpcLogs:0,changedEdges:0,note:"Noch kein Lauf"};
  const dao1TeamDiscovery={
    legacy:{running:false,status:"Noch nicht geladen",edges:[],lastBlock:0,error:""},
    aptmdao:{running:false,status:"Noch nicht geladen",edges:[],lastBlock:0,error:""}
  };

  function teamDiscoveryState(){return dao1TeamDiscovery[dao1TeamTreeMode==="aptmdao"?"aptmdao":"legacy"];}
  function teamHexNumber(v){try{return Number(BigInt(v));}catch(_){return 0;}}
  function teamShortAddress(v){const x=String(v||"");return x.length>18?`${x.slice(0,8)}…${x.slice(-6)}`:x||"–";}
  function dao1OwnWalletSet(){return new Set((getContext?.().wallets||[]).map(w=>lower(walletAddress(w))).filter(Boolean));}
  function dao1DidWalletMap(system){
    const edges=dao1TeamDiscovery[system]?.edges||[],roots=system==="aptmdao"?aptmdaoOwnedDidRoots:dao1OwnedDidRoots;
    const out=new Map();
    // Tree-Events liefern historische/technische Wallet-Adressen. Fuer eine DID, deren
    // aktueller Owner bereits in der zentralen NFT-/Ownership-Registry belegt ist, darf
    // diese Event-Adresse den Owner niemals ueberschreiben (Phase 5.55).
    for(const e of edges)if(Number(e.child_id)>=0&&e.wallet)out.set(Number(e.child_id),lower(e.wallet));
    for(const r of roots)if(r?.did&&r?.wallet_address)out.set(Number(r.did),lower(r.wallet_address));
    return out;
  }
  function dao1KnownParentDid(system,did){
    const edge=(dao1TeamDiscovery[system]?.edges||[]).find(e=>Number(e.child_id)===Number(did));
    return edge?Number(edge.parent_id):null;
  }
  function dao1ReachableRelations(system){
    const st=dao1TeamDiscovery[system]||{edges:[]},roots=system==="aptmdao"?aptmdaoOwnedDidRoots:dao1OwnedDidRoots;
    const children=new Map();for(const e of st.edges||[]){const p=Number(e.parent_id);if(!children.has(p))children.set(p,[]);children.get(p).push(e);}
    const didWallet=dao1DidWalletMap(system),out=[],seen=new Set();
    const q=roots.map(r=>({did:Number(r.did),level:0,rootDid:Number(r.did)}));
    while(q.length){const cur=q.shift();if(cur.level>=DAO1_TEAM_MAX_LEVELS)continue;for(const e of children.get(cur.did)||[]){const key=`${cur.rootDid}|${Number(e.child_id)}`;if(seen.has(key))continue;seen.add(key);const childDid=Number(e.child_id),parentDid=Number(e.parent_id),childWallet=lower(e.wallet||didWallet.get(childDid)||""),parentWallet=lower(didWallet.get(parentDid)||"");out.push({system,childDid,parentDid,childWallet,parentWallet,level:cur.level+1,rootDid:cur.rootDid,edge:e});q.push({did:childDid,level:cur.level+1,rootDid:cur.rootDid});}}
    return out;
  }
  function dao1BuildWalletGraph(){
    const own=dao1OwnWalletSet(),nodes=new Map();
    const ensure=(wallet)=>{const a=lower(wallet);if(!a)return null;if(!nodes.has(a))nodes.set(a,{wallet:a,own:own.has(a),upstream:false,dao1Dids:new Set(),aptmdaoDids:new Set(),relations:[],primary:null});return nodes.get(a);};
    for(const r of dao1OwnedDidRoots){const n=ensure(r.wallet_address);if(n)n.dao1Dids.add(Number(r.did));}
    for(const r of aptmdaoOwnedDidRoots){const n=ensure(r.wallet_address);if(n)n.aptmdaoDids.add(Number(r.did));}
    // Partner-Identitaeten kommen zusaetzlich direkt aus dem aktuellen ERC-721-Besitz.
    // So verliert die wallet-zentrierte Sicht eine zweite DID nicht nur deshalb, weil
    // deren Tree-Kante im aktuell geladenen Slice noch nicht enthalten war.
    for(const [wallet,ids] of dao1PartnerIdentityStats){
      const n=ensure(wallet);if(!n)continue;
      for(const id of ids?.legacy||[])n.dao1Dids.add(Number(id));
      for(const id of ids?.aptmdao||[])n.aptmdaoDids.add(Number(id));
    }
    for(const rel of [...dao1ReachableRelations("legacy"),...dao1ReachableRelations("aptmdao")]){
      const n=ensure(rel.childWallet);if(!n)continue;(rel.system==="aptmdao"?n.aptmdaoDids:n.dao1Dids).add(rel.childDid);n.relations.push(rel);
    }
    // Die eigene DID selbst ist bei der Downline-Traversierung der Startpunkt und ihre
    // Parent-Kante war deshalb bisher nicht enthalten. Diese direkte Kante ist aber
    // entscheidend, um mehrere eigene Wallets korrekt ineinander einzuhängen
    // (z. B. DAO1 #25924 -> #21043) und die eigene Upline fachlich zu kennen.
    for(const [system,roots] of [["legacy",dao1OwnedDidRoots],["aptmdao",aptmdaoOwnedDidRoots]]){
      const st=dao1TeamDiscovery[system]||{edges:[]},didWallet=dao1DidWalletMap(system);
      // Eigene Roots sind nur Einstiegspunkte der persönlichen Sicht, keine künstlichen
      // Graph-Roots. Ihre Parent-Kante und die bekannte Upline-Kette werden deshalb
      // ebenfalls als echte Wallet-Knoten aufgenommen (analog TLN).
      for(const r of roots||[]){
        let childDid=Number(r.did),childWallet=lower(r.wallet_address||didWallet.get(childDid)||"");
        const chainSeen=new Set();
        for(let depth=0;depth<DAO1_TEAM_MAX_LEVELS&&childDid>0&&!chainSeen.has(childDid);depth++){
          chainSeen.add(childDid);
          const edge=(st.edges||[]).find(e=>Number(e.child_id)===childDid);if(!edge)break;
          const parentDid=Number(edge.parent_id),parentWallet=lower(didWallet.get(parentDid)||"");
          const n=ensure(childWallet);if(n){
            const rel={system,childDid,parentDid,childWallet,parentWallet,level:-depth,rootDid:Number(r.did),edge};
            if(!n.relations.some(x=>x.system===system&&Number(x.childDid)===childDid&&Number(x.parentDid)===parentDid))n.relations.push(rel);
          }
          if(!(parentDid>0)||!parentWallet)break;
          const pn=ensure(parentWallet);if(pn){(system==="aptmdao"?pn.aptmdaoDids:pn.dao1Dids).add(parentDid);if(!pn.own)pn.upstream=true;}
          childDid=parentDid;childWallet=parentWallet;
        }
      }
      // Harte Eigenwallet-Verknüpfung: wenn die Parent-DID einer eigenen DID auf einer
      // anderen eigenen Wallet liegt, muss diese Kante unabhängig von Traversal-/Cache-
      // Reihenfolge den kombinierten Walletbaum bestimmen.
      const ownDidWallet=new Map((roots||[]).map(x=>[Number(x.did),lower(x.wallet_address||"")]));
      for(const r of roots||[]){
        const childDid=Number(r.did),edge=(st.edges||[]).find(e=>Number(e.child_id)===childDid);if(!edge)continue;
        const parentDid=Number(edge.parent_id),parentWallet=ownDidWallet.get(parentDid)||lower(didWallet.get(parentDid)||"");
        const childWallet=lower(r.wallet_address||didWallet.get(childDid)||"");
        const n=ensure(childWallet);if(n&&parentWallet&&parentWallet!==childWallet){
          const rel={system,childDid,parentDid,childWallet,parentWallet,level:0,rootDid:childDid,edge};
          n.relations=n.relations.filter(x=>!(x.system===system&&Number(x.childDid)===childDid));n.relations.push(rel);
        }
      }
    }
    // Ein Wallet darf im kombinierten Baum nur einmal vorkommen. Ist eine APTMDAO-
    // Beziehung in unserer Downline vorhanden, hat sie Vorrang vor einer parallelen
    // alten DAO1-Beziehung. APTMDAO unter einer fremden Upline ist nicht in unserem
    // APTMDAO-Subtree und kann deshalb die DAO1-Position nicht überschreiben.
    for(const n of nodes.values()){
      const usable=n.relations.filter(r=>r.parentWallet&&r.parentWallet!==n.wallet);
      const aptm=usable.filter(r=>r.system==="aptmdao").sort((a,b)=>a.level-b.level||a.childDid-b.childDid);
      const legacy=usable.filter(r=>r.system==="legacy").sort((a,b)=>a.level-b.level||a.childDid-b.childDid);
      if(n.own){
        // Eigene Wallets bleiben der persoenliche Einstiegspunkt. Nur eine belegte
        // Beziehung zu einer ANDEREN eigenen Wallet bestimmt ihre Position (z. B.
        // #25924 unter #21043). Externe DAO1-/APTMDAO-Uplines werden separat oberhalb
        // des Einstiegsknotens dargestellt; so koennen auch zwei Uplines gleichzeitig
        // sichtbar sein, ohne einen DAG kuenstlich in einen einzelnen Parent zu pressen.
        const ownAptm=aptm.filter(r=>own.has(r.parentWallet));
        const ownLegacy=legacy.filter(r=>own.has(r.parentWallet));
        n.primary=ownAptm[0]||ownLegacy[0]||null;
      }else n.primary=aptm[0]||legacy[0]||null;
    }
    // Auch eigene Wallets folgen der belegten DID-Beziehung. Eine zweite eigene Wallet
    // ist nicht automatisch eine zweite Root: zeigt z. B. deren DAO1-DID auf eine DID
    // der ersten eigenen Wallet, wird sie als Kind in denselben Baum eingehängt. Für
    // Partnerzahlen bleibt sie trotzdem "eigene Wallet" und zählt nicht als Partner.
    const children=new Map(),childWallets=new Set();
    for(const n of nodes.values()){
      if(n.upstream&&!n.own)continue; // reine Ancestors/Uplines sind niemals Downline-Partner
      const p=n.primary?.parentWallet;if(!p||p===n.wallet||!nodes.has(p))continue;
      if(!children.has(p))children.set(p,[]);children.get(p).push(n);childWallets.add(n.wallet);
    }
    for(const arr of children.values())arr.sort((a,b)=>{const aa=dao1WalletDisplayName(a),bb=dao1WalletDisplayName(b);return aa.localeCompare(bb,"de")||a.wallet.localeCompare(b.wallet);});
    return {nodes,children,own,childWallets};
  }
  function dao1WalletDisplayName(node){
    const aptm=[...node.aptmdaoDids],legacy=[...node.dao1Dids];
    for(const id of aptm){const a=dao1TeamAliasFor(id,"aptmdao");if(a)return a;}
    for(const id of legacy){const a=dao1TeamAliasFor(id,"legacy");if(a)return a;}
    const own=walletByAddress(node.wallet);return own?.label||"Partner-Wallet";
  }
  function dao1WalletDidListHtml(node){
    const legacy=[...node.dao1Dids].sort((a,b)=>a-b),aptm=[...node.aptmdaoDids].sort((a,b)=>a-b);
    return `<div class="wt-team-wallet-dids">${legacy.length?`<div class="wt-team-did-row dao1"><span>DAO1-DIDs:</span><strong>${legacy.map(x=>`#${x}`).join(", ")}</strong></div>`:""}${aptm.length?`<div class="wt-team-did-row aptmdao"><span>APTMDAO-DIDs:</span><strong>${aptm.map(x=>`#${x}`).join(", ")}</strong></div>`:""}</div>`;
  }

  function parseOldDao1MintLog(log){
    try{
      const topics=log.topics||[],data=String(log.data||"0x");
      if(String(topics[0]||"").toLowerCase()!==DAO1_OLD_MINT_TOPIC)return null;
      let to="",child=0,parent=0;
      if(topics.length>=3){
        // Verifizierte Legacy-Form auf Apertum:
        // TokenMinted(address to, uint256 tokenId, uint256 fid)
        // `to` und `tokenId` sind indexed (topics[1]/topics[2]); `fid` liegt
        // im data-Feld. Einzelne Explorer/ABI-Darstellungen markieren auch fid
        // als indexed; deshalb wird topics[3] defensiv ebenfalls unterstützt.
        to=dao1TopicAddress(topics[1]);
        child=teamHexNumber(topics[2]);
        if(topics.length>=4) parent=teamHexNumber(topics[3]);
        else if(data && data!=="0x") parent=Number(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"],data)[0]);
      }else if(topics.length>=2){
        // Fallback für eine Variante mit nur `to` indexed.
        to=dao1TopicAddress(topics[1]);
        const decoded=ethers.AbiCoder.defaultAbiCoder().decode(["uint256","uint256"],data);
        child=Number(decoded[0]);parent=Number(decoded[1]);
      }else{
        // Defensive Variante ohne indexed Parameter.
        const decoded=ethers.AbiCoder.defaultAbiCoder().decode(["address","uint256","uint256"],data);
        to=lower(String(decoded[0]));child=Number(decoded[1]);parent=Number(decoded[2]);
      }
      if(!Number.isFinite(child)||child<=0||!Number.isFinite(parent)||parent<0)return null;
      return {tree:"legacy",child_id:child,parent_id:parent,wallet:to,block:Number(log.blockNumber?teamHexNumber(log.blockNumber):log.block_number||0),tx_hash:String(log.transactionHash||log.transaction_hash||""),log_index:Number(log.logIndex?teamHexNumber(log.logIndex):log.log_index||0)};
    }catch(_){return null;}
  }

  async function loadOldDao1TreeVersion(){
    const {data,error}=await sb.from(DATA_VERSIONS_TABLE).select("data_version,payload_schema_version,row_count,sync_cursor,updated_at").eq("namespace",DAO1_OLD_TREE_BROWSER_NAMESPACE).eq("cache_key",DAO1_OLD_TREE_BROWSER_KEY).limit(1);
    if(error){console.warn("DATA_VERSIONS DAO1 Tree",error);return null;}
    return data?.[0]||null;
  }

  function dao1TreeEdgeFromRow(r){
    return {tree:"legacy",child_id:Number(r.child_id),parent_id:Number(r.parent_id),wallet:lower(r.wallet_address||""),block:Number(r.mint_block||0),tx_hash:String(r.mint_tx_hash||""),log_index:Number(r.log_index||0)};
  }

  async function loadOldDao1TreeCache(){
    const t0=performance.now();
    Object.assign(dao1OldTreeCacheDiag,{source:"START",localRows:0,deltaRows:0,dbRows:0,idbMs:0,stateMs:0,metaMs:0,registryMs:0,probeMs:0,deltaDbMs:0,totalCacheMs:0,latestBlockMs:0,overlapRpcMs:0,saveMs:0,scanMode:"NORMAL",fromBlock:0,toBlock:0,scannedBlocks:0,rpcLogs:0,changedEdges:0,note:"Cache-Prüfung läuft"});
    const ctx=getContext?.();
    if(!sb||!ctx?.currentUser||!dao1OldTreeDbAvailable){dao1OldTreeCacheDiag.note="Supabase/User/DB-Cache nicht verfügbar";return null;}
    const contract=lower(DAO1_OLD_DID_CONTRACT),bc=window.WalletTrackingBrowserCache;
    const rootIds=dao1OwnedDidRoots.map(r=>Number(r.did)).filter(Number.isFinite);

    async function readLocalSubtree(meta){
      const ti=performance.now();
      const [rootRows,desc,anc]=await Promise.all([
        bc.getByKeys(DAO1_OLD_TREE_BROWSER_NAMESPACE,DAO1_OLD_TREE_BROWSER_KEY,rootIds),
        bc.getDescendants(DAO1_OLD_TREE_BROWSER_NAMESPACE,DAO1_OLD_TREE_BROWSER_KEY,rootIds,{maxDepth:DAO1_TEAM_MAX_LEVELS}),
        bc.getAncestors?bc.getAncestors(DAO1_OLD_TREE_BROWSER_NAMESPACE,DAO1_OLD_TREE_BROWSER_KEY,rootIds,{maxDepth:DAO1_TEAM_MAX_LEVELS}):Promise.resolve([])
      ]);
      dao1OldTreeCacheDiag.idbMs+=performance.now()-ti;
      const byChild=new Map();for(const r of [...rootRows,...desc,...anc])byChild.set(Number(r.child_id),r);
      dao1OldTreeCacheDiag.localRows=byChild.size;
      return [...byChild.values()];
    }

    // Phase 4.89: echtes DATA_VERSIONS-Gate. Beim normalen Öffnen werden zuerst
    // ausschließlich lokales Meta + die kleine zentrale Registry geprüft. Stimmen
    // Version, Payload-Schema und Rowcount überein, gibt es KEINEN State-Read,
    // KEINEN Schema-Probe, KEIN Delta und KEIN RPC.
    let meta=null,remoteVersion=null;
    if(bc){
      try{
        const tm0=performance.now();
        const metaPromise=bc.getMeta(DAO1_OLD_TREE_BROWSER_NAMESPACE,DAO1_OLD_TREE_BROWSER_KEY).then(v=>{dao1OldTreeCacheDiag.metaMs=performance.now()-tm0;return v;});
        const tv0=performance.now();
        const versionPromise=loadOldDao1TreeVersion().then(v=>{dao1OldTreeCacheDiag.registryMs=performance.now()-tv0;return v;});
        [meta,remoteVersion]=await Promise.all([metaPromise,versionPromise]);
        if(meta&&remoteVersion){
          const schemaOk=Number(meta.payloadSchemaVersion||0)===DAO1_OLD_TREE_PAYLOAD_SCHEMA_VERSION && Number(meta.storageFormatVersion||0)===DAO1_OLD_TREE_BROWSER_STORAGE_VERSION && Number(remoteVersion.payload_schema_version||0)===DAO1_OLD_TREE_PAYLOAD_SCHEMA_VERSION;
          const remoteDataVersion=Number(remoteVersion.data_version||0),localDataVersion=Number(meta.dataVersion||0),globalCount=Number(remoteVersion.row_count||0);
          const countOk=!globalCount||Number(meta.rowCount||0)===globalCount;
          if(schemaOk&&countOk&&remoteDataVersion===localDataVersion){
            const rows=await readLocalSubtree(meta);
            Object.assign(dao1OldTreeCacheDiag,{source:"IDB + DATA_VERSIONS HIT",totalCacheMs:performance.now()-t0,note:`Ausgangsbasis: IDB + DATA_VERSIONS HIT · Version ${remoteDataVersion.toLocaleString("de-DE")} · Global ${globalCount.toLocaleString("de-DE")} Rows · nur ${rows.length.toLocaleString("de-DE")} relevante Rows aus IndexedDB`});
            renderDAO1TeamTreePanel();
            return {edges:rows.map(dao1TreeEdgeFromRow),lastBlock:remoteDataVersion,browserCache:true,registryFresh:true,registryUpdatedAt:remoteVersion.updated_at||null,totalEdgeCount:globalCount};
          }
        }
      }catch(e){console.warn("DAO1 Tree DATA_VERSIONS Gate",e);dao1OldTreeCacheDiag.note=`Gate-Fehler: ${e?.message||e}`;}
    }

    // Nur bei MISS/Erstaufbau werden State und DB-Schema geprüft.
    const ts=performance.now();
    const {data:states,error:stateError}=await sb.from(DAO1_OLD_TREE_STATE_TABLE).select("last_verified_block,edge_count,verified_at,updated_at").eq("chain_key",CHAIN_KEY).eq("contract_address",contract).limit(1);
    dao1OldTreeCacheDiag.stateMs+=performance.now()-ts;
    if(stateError){const msg=String(stateError.message||"");if(/dao1_old_tree_graph_state|relation .* does not exist|schema cache/i.test(msg))dao1OldTreeDbAvailable=false;console.warn("DAO1 Tree Global-Cache State",stateError);dao1OldTreeCacheDiag.note="Global-Cache-State Fehler";return null;}
    const state=states?.[0];if(!state){dao1OldTreeCacheDiag.note="Kein Global-Cache-State";return null;}

    if(bc){
      try{
        const tp0=performance.now();
        const schemaProbe=await sb.from(DAO1_OLD_TREE_CACHE_TABLE).select("*").limit(1);
        dao1OldTreeCacheDiag.probeMs=performance.now()-tp0;
        const remoteSchemaFingerprint=schemaProbe?.error?null:Object.keys(schemaProbe?.data?.[0]||{}).sort().join("|");
        if(meta){
          const schemaOk=Number(meta.payloadSchemaVersion||0)===DAO1_OLD_TREE_PAYLOAD_SCHEMA_VERSION && Number(meta.storageFormatVersion||0)===DAO1_OLD_TREE_BROWSER_STORAGE_VERSION && (!remoteVersion||Number(remoteVersion.payload_schema_version||1)===DAO1_OLD_TREE_PAYLOAD_SCHEMA_VERSION) && (!remoteSchemaFingerprint||meta.schemaFingerprint===remoteSchemaFingerprint);
          if(schemaOk){
            const remoteDataVersion=Number(remoteVersion?.data_version||state.last_verified_block||0),localDataVersion=Number(meta.dataVersion||0),globalCount=Number(remoteVersion?.row_count||state.edge_count||meta.rowCount||0);
            if(remoteDataVersion>localDataVersion && meta.syncCursor){
              const delta=[];let offset=0;const td0=performance.now();
              while(true){const {data,error}=await sb.from(DAO1_OLD_TREE_CACHE_TABLE).select("*").gt("updated_at",meta.syncCursor).order("updated_at",{ascending:true}).range(offset,offset+DAO1_OLD_TREE_CACHE_PAGE_SIZE-1);if(error)throw error;const part=data||[];delta.push(...part);if(part.length<DAO1_OLD_TREE_CACHE_PAGE_SIZE)break;offset+=DAO1_OLD_TREE_CACHE_PAGE_SIZE;}
              dao1OldTreeCacheDiag.deltaDbMs=performance.now()-td0;dao1OldTreeCacheDiag.deltaRows=delta.length;dao1OldTreeCacheDiag.dbRows+=delta.length;
              const nextMeta={payloadSchemaVersion:DAO1_OLD_TREE_PAYLOAD_SCHEMA_VERSION,storageFormatVersion:DAO1_OLD_TREE_BROWSER_STORAGE_VERSION,schemaFingerprint:remoteSchemaFingerprint||meta.schemaFingerprint,dataVersion:remoteDataVersion,syncCursor:remoteVersion?.sync_cursor||remoteVersion?.updated_at||new Date().toISOString(),rowCount:globalCount};
              const ti=performance.now();await bc.merge(DAO1_OLD_TREE_BROWSER_NAMESPACE,DAO1_OLD_TREE_BROWSER_KEY,delta,{keyField:"child_id",parentField:"parent_id",meta:nextMeta});dao1OldTreeCacheDiag.idbMs+=performance.now()-ti;
              const rows=await readLocalSubtree(nextMeta);
              Object.assign(dao1OldTreeCacheDiag,{source:"IDB SUBTREE + DELTA",totalCacheMs:performance.now()-t0,note:`Gate MISS · nur ${delta.length} Delta-Row(s) aus DB · ${rows.length.toLocaleString("de-DE")} relevante Rows lokal gelesen`});
              renderDAO1TeamTreePanel();
              return {edges:rows.map(dao1TreeEdgeFromRow),lastBlock:Number(state.last_verified_block||remoteDataVersion),browserCache:true,registryFresh:true,registryUpdatedAt:remoteVersion?.updated_at||null,deltaRows:delta.length,totalEdgeCount:globalCount};
            }
          }
          dao1OldTreeCacheDiag.note=schemaOk?"Cache/Version inkonsistent → Neuaufbau":"Schema/Cacheformat geändert → Neuaufbau";await bc.clear(DAO1_OLD_TREE_BROWSER_NAMESPACE,DAO1_OLD_TREE_BROWSER_KEY);
        }else dao1OldTreeCacheDiag.note="Kein lokaler Cache → Erstaufbau";
      }catch(e){console.warn("DAO1 Tree Browser-Cache",e);dao1OldTreeCacheDiag.note=`Browser-Cache Fehler: ${e?.message||e}`;}
    }

    const rawRows=[];let offset=0;
    while(true){const {data,error}=await sb.from(DAO1_OLD_TREE_CACHE_TABLE).select("*").order("child_id",{ascending:true}).range(offset,offset+DAO1_OLD_TREE_CACHE_PAGE_SIZE-1);if(error){console.warn("DAO1 Tree Global-Cache Kanten",error);return null;}const rows=data||[];rawRows.push(...rows);dao1OldTreeCacheDiag.dbRows+=rows.length;if(rows.length<DAO1_OLD_TREE_CACHE_PAGE_SIZE)break;offset+=DAO1_OLD_TREE_CACHE_PAGE_SIZE;if(offset>200000)throw new Error("DAO1 Tree Cache unerwartet groß; Abbruch statt Teilgraph.");}
    const expected=Number(state.edge_count||0);if(expected&&rawRows.length!==expected){console.warn(`DAO1 Tree Cache unvollständig: ${rawRows.length}/${expected}`);dao1OldTreeCacheDiag.note=`DB-Vollcache unvollständig ${rawRows.length}/${expected}`;return null;}
    remoteVersion=remoteVersion||await loadOldDao1TreeVersion();
    if(bc)try{const ti=performance.now();await bc.replace(DAO1_OLD_TREE_BROWSER_NAMESPACE,DAO1_OLD_TREE_BROWSER_KEY,rawRows,{keyField:"child_id",parentField:"parent_id",meta:{payloadSchemaVersion:DAO1_OLD_TREE_PAYLOAD_SCHEMA_VERSION,storageFormatVersion:DAO1_OLD_TREE_BROWSER_STORAGE_VERSION,schemaFingerprint:Object.keys(rawRows[0]||{}).sort().join("|"),dataVersion:Number(remoteVersion?.data_version||state.last_verified_block||0),syncCursor:remoteVersion?.sync_cursor||remoteVersion?.updated_at||state.updated_at||new Date().toISOString(),rowCount:rawRows.length}});dao1OldTreeCacheDiag.idbMs+=performance.now()-ti;}catch(e){console.warn("DAO1 Tree Browser-Cache initial speichern",e);}
    Object.assign(dao1OldTreeCacheDiag,{source:"DB FULL / INDEX BUILD",localRows:rawRows.length,totalCacheMs:performance.now()-t0,note:"Einmaliger Neuaufbau des lokalen parent_id-Index"});
    return {edges:rawRows.map(dao1TreeEdgeFromRow),lastBlock:Number(state.last_verified_block||0),totalEdgeCount:rawRows.length};
  }

  async function saveOldDao1TreeCache(edges,lastBlock,changedChildren=null,totalEdgeCount=null){
    const ctx=getContext?.();if(!sb||!ctx?.currentUser||!dao1OldTreeDbAvailable)return false;
    const uid=ctx.currentUser.id,contract=lower(DAO1_OLD_DID_CONTRACT),now=new Date().toISOString();
    const changed=changedChildren?new Set(changedChildren):null;
    const globalEdgeCount=Number(totalEdgeCount??edges.length);
    const rows=edges.filter(e=>!changed||changed.has(e.child_id)).map(e=>({
      // Phase 4.84: Nur veränderliche/fachliche Kantendaten schreiben. Konstanten wie
      // chain_key, contract_address und source werden nicht mehr 65k-mal dupliziert.
      child_id:Number(e.child_id),parent_id:Number(e.parent_id),wallet_address:lower(e.wallet||""),
      mint_block:Number(e.block||0),mint_tx_hash:e.tx_hash||null,log_index:Number(e.log_index||0),
      // Audit-Spalten bleiben erhalten, weil die bestehenden RLS-Policies damit Schreibzugriffe absichern.
      created_by:uid,updated_by:uid,verified_at:now,updated_at:now
    }));
    for(let i=0;i<rows.length;i+=500){
      const {error}=await sb.from(DAO1_OLD_TREE_CACHE_TABLE).upsert(rows.slice(i,i+500),{onConflict:"child_id"});
      if(error){console.warn("DAO1 Tree Cache speichern",error);return false;}
    }
    const {error}=await sb.from(DAO1_OLD_TREE_STATE_TABLE).upsert({chain_key:CHAIN_KEY,contract_address:contract,last_verified_block:Number(lastBlock||0),edge_count:globalEdgeCount,verified_at:now,updated_by:uid,updated_at:now},{onConflict:"chain_key,contract_address"});
    if(error){console.warn("DAO1 Tree Cache State speichern",error);return false;}
    // Migration 057 macht den DB-Writer autoritativ: Das State-Upsert oben löst
    // den Trigger aus, der cache_data_versions atomar nachführt. Der Browser schreibt
    // DATA_VERSIONS deshalb nicht mehr selbst.
    // Den lokalen Cache direkt mit den gerade bestätigten Änderungen mitziehen.
    const bc=window.WalletTrackingBrowserCache;if(bc)try{await bc.merge(DAO1_OLD_TREE_BROWSER_NAMESPACE,DAO1_OLD_TREE_BROWSER_KEY,rows,{keyField:"child_id",parentField:"parent_id",meta:{payloadSchemaVersion:DAO1_OLD_TREE_PAYLOAD_SCHEMA_VERSION,storageFormatVersion:DAO1_OLD_TREE_BROWSER_STORAGE_VERSION,dataVersion:Number(lastBlock||0),syncCursor:now,rowCount:globalEdgeCount}});}catch(e){console.warn("DAO1 Tree Browser-Cache nachführen",e);}
    return true;
  }

  async function scanOldDao1TreeCore({forceFull=false,checkChain=false}={}){
    const st=dao1TeamDiscovery.legacy;if(st.running)return;
    st.running=true;st.error="";st.status="DAO1 Tree-Cache wird geladen …";renderDAO1TeamTreePanel();
    try{
      const scanT0=performance.now();
      const cached=forceFull?null:await loadOldDao1TreeCache();
      dao1OldTreeCacheDiag.scanMode=forceFull?"MANUELLER VOLLSCAN":(checkChain?"MANUELLER ON-CHAIN UPDATE":"NORMALER TAB-AUFRUF");
      const byChild=new Map();
      if(cached?.edges?.length)for(const e of cached.edges)byChild.set(e.child_id,e);
      // Normales Öffnen ist strikt cache-/registry-first. Ein Chain-Freshness-Check
      // erfolgt nur bei einer expliziten Aktualisierung/Discovery (checkChain=true).
      if(cached?.registryFresh && !checkChain){
        st.edges=[...byChild.values()].sort((a,b)=>a.child_id-b.child_id);st.lastBlock=cached.lastBlock;
        st.status=`${st.edges.length.toLocaleString("de-DE")} Partner-Verbindungen im ausgewählten Baum · Cache aktuell`;
        dao1OldTreeCacheDiag.note+=` · kein RPC (normaler Tab-Aufruf)`;
        dao1OldTreeCacheDiag.scanMs=performance.now()-scanT0;
        return;
      }
      const tl0=performance.now();
      const latest=teamHexNumber(await dao1ApertumRpc("eth_blockNumber",[]));
      dao1OldTreeCacheDiag.latestBlockMs=performance.now()-tl0;
      if(cached?.registryFresh && Number(latest||0)<=Number(cached.lastBlock||0)){
        st.edges=[...byChild.values()].sort((a,b)=>a.child_id-b.child_id);st.lastBlock=cached.lastBlock;
        st.status=`${st.edges.length.toLocaleString("de-DE")} Partner-Verbindungen im ausgewählten Baum · Cache aktuell`;
        dao1OldTreeCacheDiag.note+=` · Chain unverändert, kein 24-Block-Scan`;
        dao1OldTreeCacheDiag.scanMs=performance.now()-scanT0;
        return;
      }
      let fromStart=DAO1_OLD_TREE_START_BLOCK;
      if(cached?.lastBlock>0){
        fromStart=Math.max(DAO1_OLD_TREE_START_BLOCK,cached.lastBlock-DAO1_OLD_TREE_OVERLAP_BLOCKS);
        st.edges=[...byChild.values()].sort((a,b)=>a.child_id-b.child_id);st.lastBlock=cached.lastBlock;
        st.status=`${st.edges.length.toLocaleString("de-DE")} Kanten aus Cache · Aktualisierung ab Block ${fromStart.toLocaleString("de-DE")}`;renderDAO1TeamTreePanel();
      }else if(!dao1OldTreeDbAvailable){
        st.status="DAO1 Tree-Cache nicht installiert · vollständiger Scan";renderDAO1TeamTreePanel();
      }
      const changed=new Set();
      dao1OldTreeCacheDiag.fromBlock=fromStart;dao1OldTreeCacheDiag.toBlock=latest;dao1OldTreeCacheDiag.scannedBlocks=Math.max(0,latest-fromStart+1);
      for(let from=fromStart;from<=latest;from+=DAO1_TEAM_RPC_CHUNK){
        const to=Math.min(latest,from+DAO1_TEAM_RPC_CHUNK-1);
        st.status=`DAO1 alt · ${cached?"inkrementell":"Vollscan"} · Block ${from.toLocaleString("de-DE")}–${to.toLocaleString("de-DE")} / ${latest.toLocaleString("de-DE")}`;renderDAO1TeamTreePanel();
        const tr0=performance.now();
        const logs=await dao1ApertumRpc("eth_getLogs",[{address:DAO1_OLD_DID_CONTRACT,fromBlock:"0x"+from.toString(16),toBlock:"0x"+to.toString(16),topics:[DAO1_OLD_MINT_TOPIC]}]);
        dao1OldTreeCacheDiag.overlapRpcMs+=performance.now()-tr0;dao1OldTreeCacheDiag.rpcLogs+=(logs||[]).length;
        for(const log of logs||[]){const e=parseOldDao1MintLog(log);if(e){byChild.set(e.child_id,e);changed.add(e.child_id);}}
      }
      dao1OldTreeCacheDiag.changedEdges=changed.size;
      st.edges=[...byChild.values()].sort((a,b)=>a.child_id-b.child_id);st.lastBlock=latest;
      if(dao1OldTreeDbAvailable){const newGlobalRows=cached?[...changed].filter(id=>Number(byChild.get(id)?.block||0)>Number(cached.lastBlock||0)).length:0;const globalCount=cached?Number(cached.totalEdgeCount||0)+newGlobalRows:st.edges.length;const tsave0=performance.now();await saveOldDao1TreeCache(st.edges,latest,cached?changed:null,globalCount);dao1OldTreeCacheDiag.saveMs=performance.now()-tsave0;}
      st.status=`${st.edges.length.toLocaleString("de-DE")} Partner-Verbindungen im ausgewählten Baum${cached?" · aktualisiert":""}`;
      dao1OldTreeCacheDiag.scanMs=performance.now()-scanT0;
    }catch(e){st.error=e?.message||String(e);st.status="Discovery fehlgeschlagen";}
    finally{st.running=false;renderDAO1TeamTreePanel();}
  }
  const daoTreeScanInflight=new Map();
  async function scanOldDao1Tree(options={}){
    const key=`legacy|${!!options.forceFull}|${!!options.checkChain}`;
    if(daoTreeScanInflight.has(key))return daoTreeScanInflight.get(key);
    const job=()=>scanOldDao1TreeCore(options);
    const p=Promise.resolve(typeof window.runDataJob==="function"?window.runDataJob("DAO1 Team-Daten werden aktualisiert …",job):job()).finally(()=>daoTreeScanInflight.delete(key));
    daoTreeScanInflight.set(key,p);return p;
  }

  const aptmdaoTreeCacheDiag={source:"–",localRows:0,dbRows:0,scanMs:0,fromBlock:0,toBlock:0,rpcLogs:0,changedEdges:0,note:"Noch kein Lauf"};
  function parseAptmdaoTreeLog(log){
    try{const topics=log.topics||[];if(String(topics[0]||"").toLowerCase()!==APTMDAO_TREE_EVENT_TOPIC||topics.length<4)return null;const child=teamHexNumber(topics[1]),parent=teamHexNumber(topics[2]),wallet=dao1TopicAddress(topics[3]);if(!(child>0)||parent<0||!wallet)return null;return {tree:"aptmdao",child_id:child,parent_id:parent,wallet,block:Number(log.blockNumber?teamHexNumber(log.blockNumber):log.block_number||0),tx_hash:String(log.transactionHash||log.transaction_hash||""),log_index:Number(log.logIndex?teamHexNumber(log.logIndex):log.log_index||0)};}catch(_){return null;}
  }
  function aptmdaoTreeEdgeFromRow(r){return {tree:"aptmdao",child_id:Number(r.child_id),parent_id:Number(r.parent_id),wallet:lower(r.wallet_address||""),block:Number(r.mint_block||0),tx_hash:String(r.mint_tx_hash||""),log_index:Number(r.log_index||0)};}
  async function loadAptmdaoTreeVersion(){const {data,error}=await sb.from(DATA_VERSIONS_TABLE).select("data_version,payload_schema_version,row_count,sync_cursor,updated_at").eq("namespace",DAO1_OLD_TREE_BROWSER_NAMESPACE).eq("cache_key",APTMDAO_TREE_BROWSER_KEY).limit(1);if(error){console.warn("DATA_VERSIONS APTMDAO Tree",error);return null;}return data?.[0]||null;}
  async function loadAptmdaoTreeCache(){
    if(!sb||!getContext?.()?.currentUser||!aptmdaoTreeDbAvailable)return null;const bc=window.WalletTrackingBrowserCache,rootIds=aptmdaoOwnedDidRoots.map(r=>Number(r.did)).filter(Number.isFinite);
    try{
      const [meta,ver]=bc?await Promise.all([bc.getMeta(DAO1_OLD_TREE_BROWSER_NAMESPACE,APTMDAO_TREE_BROWSER_KEY),loadAptmdaoTreeVersion()]):[null,await loadAptmdaoTreeVersion()];
      if(bc&&meta&&ver&&Number(meta.dataVersion||0)===Number(ver.data_version||0)&&Number(meta.payloadSchemaVersion||0)===APTMDAO_TREE_PAYLOAD_SCHEMA_VERSION){const [roots,desc,anc]=await Promise.all([bc.getByKeys(DAO1_OLD_TREE_BROWSER_NAMESPACE,APTMDAO_TREE_BROWSER_KEY,rootIds),bc.getDescendants(DAO1_OLD_TREE_BROWSER_NAMESPACE,APTMDAO_TREE_BROWSER_KEY,rootIds,{maxDepth:DAO1_TEAM_MAX_LEVELS}),bc.getAncestors?bc.getAncestors(DAO1_OLD_TREE_BROWSER_NAMESPACE,APTMDAO_TREE_BROWSER_KEY,rootIds,{maxDepth:DAO1_TEAM_MAX_LEVELS}):Promise.resolve([])]);const by=new Map([...(roots||[]),...(desc||[]),...(anc||[])].map(r=>[Number(r.child_id),r]));aptmdaoTreeCacheDiag.source="IDB + DATA_VERSIONS HIT";aptmdaoTreeCacheDiag.localRows=by.size;return {edges:[...by.values()].map(aptmdaoTreeEdgeFromRow),lastBlock:Number(ver.data_version||0),registryFresh:true,totalEdgeCount:Number(ver.row_count||0),registryUpdatedAt:ver.updated_at||null};}
      const {data:states,error:se}=await sb.from(APTMDAO_TREE_STATE_TABLE).select("last_verified_block,edge_count,updated_at").eq("chain_key",CHAIN_KEY).eq("contract_address",lower(APTMDAO_NFT_CONTRACT)).limit(1);if(se)throw se;const state=states?.[0];if(!state)return null;
      const rows=[];for(let from=0;;from+=DAO1_OLD_TREE_CACHE_PAGE_SIZE){const {data,error}=await sb.from(APTMDAO_TREE_CACHE_TABLE).select("*").order("child_id").range(from,from+DAO1_OLD_TREE_CACHE_PAGE_SIZE-1);if(error)throw error;rows.push(...(data||[]));if((data||[]).length<DAO1_OLD_TREE_CACHE_PAGE_SIZE)break;}
      aptmdaoTreeCacheDiag.source="Supabase Global-Cache";aptmdaoTreeCacheDiag.dbRows=rows.length;
      if(bc)try{await bc.replace(DAO1_OLD_TREE_BROWSER_NAMESPACE,APTMDAO_TREE_BROWSER_KEY,rows,{keyField:"child_id",parentField:"parent_id",meta:{payloadSchemaVersion:APTMDAO_TREE_PAYLOAD_SCHEMA_VERSION,storageFormatVersion:APTMDAO_TREE_BROWSER_STORAGE_VERSION,dataVersion:Number(state.last_verified_block||0),syncCursor:state.updated_at,rowCount:Number(state.edge_count||rows.length)}});}catch(e){console.warn("APTMDAO Browser-Cache",e);}
      return {edges:rows.map(aptmdaoTreeEdgeFromRow),lastBlock:Number(state.last_verified_block||0),registryFresh:true,totalEdgeCount:Number(state.edge_count||rows.length),registryUpdatedAt:state.updated_at||null};
    }catch(e){const msg=String(e?.message||e);if(/aptmdao_tree_graph|relation .* does not exist|schema cache/i.test(msg))aptmdaoTreeDbAvailable=false;console.warn("APTMDAO Tree Cache",e);aptmdaoTreeCacheDiag.note=aptmdaoTreeDbAvailable?msg:"Migration 063 fehlt";return null;}
  }
  async function saveAptmdaoTreeCache(edges,lastBlock,changed=null,globalCount=null){
    if(!aptmdaoTreeDbAvailable)return false;const uid=getContext?.()?.currentUser?.id;if(!uid)return false;const now=new Date().toISOString(),selected=changed?edges.filter(e=>changed.has(e.child_id)):edges;const rows=selected.map(e=>({child_id:Number(e.child_id),parent_id:Number(e.parent_id),wallet_address:lower(e.wallet||""),mint_block:Number(e.block||0),mint_tx_hash:e.tx_hash||null,log_index:Number(e.log_index||0),created_by:uid,updated_by:uid,verified_at:now,updated_at:now}));
    for(let i=0;i<rows.length;i+=500){const {error}=await sb.from(APTMDAO_TREE_CACHE_TABLE).upsert(rows.slice(i,i+500),{onConflict:"child_id"});if(error)throw error;}
    const count=globalCount==null?edges.length:globalCount;const {error}=await sb.from(APTMDAO_TREE_STATE_TABLE).upsert({chain_key:CHAIN_KEY,contract_address:lower(APTMDAO_NFT_CONTRACT),last_verified_block:Number(lastBlock||0),edge_count:count,verified_at:now,updated_by:uid,updated_at:now},{onConflict:"chain_key,contract_address"});if(error)throw error;
    const bc=window.WalletTrackingBrowserCache;if(bc&&rows.length)try{await bc.merge(DAO1_OLD_TREE_BROWSER_NAMESPACE,APTMDAO_TREE_BROWSER_KEY,rows,{keyField:"child_id",parentField:"parent_id",meta:{payloadSchemaVersion:APTMDAO_TREE_PAYLOAD_SCHEMA_VERSION,storageFormatVersion:APTMDAO_TREE_BROWSER_STORAGE_VERSION,dataVersion:Number(lastBlock||0),syncCursor:now,rowCount:count}});}catch(e){console.warn("APTMDAO Browser-Cache nachführen",e);}return true;
  }
  async function scanAptmdaoTreeCore({forceFull=false,checkChain=false}={}){
    const st=dao1TeamDiscovery.aptmdao;if(st.running)return;st.running=true;st.error="";st.status="APTMDAO Tree-Cache wird geladen …";renderDAO1TeamTreePanel();const t0=performance.now();
    try{const cached=forceFull?null:await loadAptmdaoTreeCache(),byChild=new Map();if(cached?.edges)for(const e of cached.edges)byChild.set(e.child_id,e);if(cached?.registryFresh&&!checkChain){st.edges=[...byChild.values()].sort((a,b)=>a.child_id-b.child_id);st.lastBlock=cached.lastBlock;st.status=`${st.edges.length.toLocaleString("de-DE")} Partner-Verbindungen im ausgewählten APTMDAO-Baum · Cache aktuell`;return;}
      const latest=teamHexNumber(await dao1ApertumRpc("eth_blockNumber",[]));if(cached?.registryFresh&&latest<=Number(cached.lastBlock||0)){st.edges=[...byChild.values()].sort((a,b)=>a.child_id-b.child_id);st.lastBlock=cached.lastBlock;st.status=`${st.edges.length.toLocaleString("de-DE")} Partner-Verbindungen · Cache aktuell`;return;}
      const fromStart=cached?.lastBlock>0?Math.max(0,cached.lastBlock-APTMDAO_TREE_OVERLAP_BLOCKS):0,changed=new Set();aptmdaoTreeCacheDiag.fromBlock=fromStart;aptmdaoTreeCacheDiag.toBlock=latest;
      for(let from=fromStart;from<=latest;from+=APTMDAO_TREE_RPC_CHUNK){const to=Math.min(latest,from+APTMDAO_TREE_RPC_CHUNK-1);st.status=`APTMDAO · ${cached?"inkrementell":"Vollscan"} · Block ${from.toLocaleString("de-DE")}–${to.toLocaleString("de-DE")} / ${latest.toLocaleString("de-DE")}`;renderDAO1TeamTreePanel();const logs=await dao1ApertumRpc("eth_getLogs",[{address:APTMDAO_NFT_CONTRACT,fromBlock:"0x"+from.toString(16),toBlock:"0x"+to.toString(16),topics:[APTMDAO_TREE_EVENT_TOPIC]}]);aptmdaoTreeCacheDiag.rpcLogs+=(logs||[]).length;for(const log of logs||[]){const e=parseAptmdaoTreeLog(log);if(e){byChild.set(e.child_id,e);changed.add(e.child_id);}}}
      st.edges=[...byChild.values()].sort((a,b)=>a.child_id-b.child_id);st.lastBlock=latest;aptmdaoTreeCacheDiag.changedEdges=changed.size;if(aptmdaoTreeDbAvailable){const newGlobalRows=cached?[...changed].filter(id=>Number(byChild.get(id)?.block||0)>Number(cached.lastBlock||0)).length:0,globalCount=cached?Number(cached.totalEdgeCount||0)+newGlobalRows:st.edges.length;await saveAptmdaoTreeCache(st.edges,latest,cached?changed:null,globalCount);}st.status=`${st.edges.length.toLocaleString("de-DE")} APTMDAO Partner-Verbindungen${cached?" · aktualisiert":""}`;
    }catch(e){st.error=e?.message||String(e);st.status="APTMDAO Discovery fehlgeschlagen";}finally{aptmdaoTreeCacheDiag.scanMs=performance.now()-t0;st.running=false;renderDAO1TeamTreePanel();}
  }
  async function scanAptmdaoTree(options={}){const key=`aptmdao|${!!options.forceFull}|${!!options.checkChain}`;if(daoTreeScanInflight.has(key))return daoTreeScanInflight.get(key);const job=()=>scanAptmdaoTreeCore(options);const p=Promise.resolve(typeof window.runDataJob==="function"?window.runDataJob("APTMDAO Team-Daten werden aktualisiert …",job):job()).finally(()=>daoTreeScanInflight.delete(key));daoTreeScanInflight.set(key,p);return p;}

  async function loadDAO1OwnedDidRoots(includeNftCache=true){
    // Root-DIDs muessen aus den bereits gespeicherten DAO1-NFT-Daten sofort
    // sichtbar sein. Die Tree-Discovery ist dafuer NICHT Voraussetzung.
    // Primärquelle ist project_nft_ownership (inkl. wallet_id); nft_cache ist
    // nur ein zusaetzlicher Fallback fuer einen frischeren aktuellen Bestand.
    const roots=[],aptmRoots=[];
    // Ownership kann auch zu einem Wallet gehören, das im aktuellen Balance-Lauf
    // gerade kein DAO1-Asset oberhalb der Dust-Grenze hat. Deshalb für die
    // persistierte DID-Zuordnung ALLE bekannten User-Wallets berücksichtigen.
    const ctx=getContext?.();
    const allWallets=(ctx?.wallets||[]).filter(w=>walletAddress(w));
    // Root-Erkennung darf NICHT von aktuellen DAO-Assets/Dust abhängen. Eine Wallet
    // kann eine DID besitzen, obwohl projectWallets() sie im aktuellen Balance-Lauf
    // nicht als DAO-Projektwallet einstuft. Deshalb auch der nft_cache-Fallback über
    // alle gespeicherten User-Wallets.
    const wallets=allWallets;
    const walletById=new Map(allWallets.map(w=>[String(w.dbId||w.id||""),w]));
    const pushRoot=(did,w,address,name,source)=>{
      const n=Number(did);if(!Number.isFinite(n)||n<=0||!w)return;
      roots.push({did:n,wallet:w,wallet_address:address||walletAddress(w),name:name||`DID #${n}`,source});
    };

    // 1) Bereits persistierte Ownership-Zuordnung. Diese ist fuer DAO1 die
    // robuste Quelle, weil DID-NFTs im Projekt schon den Wallets zugeordnet sind.
    for(const o of ownershipRows){
      if(String(o.chain_key||CHAIN_KEY)!==CHAIN_KEY || !o.is_current)continue;
      const contract=lower(o.nft_contract||"");
      const id=String(o.nft_id||"");
      const cls=classificationFor(contract,id);
      const isAptmdao=contract===lower(APTMDAO_NFT_CONTRACT);
      const isDidContract=contract===DAO1_OLD_DID_CONTRACT;
      const isDidClass=String(cls?.subtype||"").toUpperCase()==="DID";
      if(!isAptmdao && !isDidContract && !isDidClass)continue;
      const w=walletById.get(String(o.wallet_id||"")) || walletByAddress(o.wallet_address||"");
      if(!w)continue;
      const n=Number(id);if(!Number.isFinite(n)||n<=0)continue;
      (isAptmdao?aptmRoots:roots).push({did:n,wallet:w,wallet_address:walletAddress(w)||o.wallet_address,name:cls?.nft_name||o.nft_name||`${isAptmdao?"APTMDAO":"DID"} #${id}`,source:"ownership"});
    }

    // 2) Aktueller nft_cache als Fallback/Ergaenzung. Ein Fehler bei einem
    // Wallet darf die bereits aus Ownership erkannten Roots nicht entfernen.
    if(includeNftCache) for(const w of wallets){
      const address=walletAddress(w);if(!address)continue;
      try{
        const nftMap=await loadWalletNftMap(address);
        for(const n of nftMap.values()){
          const cls=n.classification||classificationFor(n.contract,n.id);
          const isAptmdao=lower(n.contract)===lower(APTMDAO_NFT_CONTRACT);
          const isDidContract=lower(n.contract)===DAO1_OLD_DID_CONTRACT;
          const isDidClass=String(cls?.subtype||"").toUpperCase()==="DID";
          if((!isAptmdao && !isDidContract && !isDidClass) || !n.current)continue;
          const id=Number(n.id);if(!Number.isFinite(id)||id<=0)continue;
          (isAptmdao?aptmRoots:roots).push({did:id,wallet:w,wallet_address:address,name:cls?.nft_name||n.name||`${isAptmdao?"APTMDAO":"DID"} #${n.id}`,source:"nft_cache"});
        }
      }catch(e){console.warn("DAO1 DID-Roots nft_cache",w?.label||address,e);}
    }

    // Eine DID hat immer genau einen aktuellen Owner. Falls dieselbe DID aus
    // mehreren Quellen kommt, gewinnt die persistierte Ownership-Zuordnung.
    const byDid=new Map();
    for(const r of roots){
      const prev=byDid.get(r.did);
      if(!prev || (r.source==="ownership" && prev.source!=="ownership"))byDid.set(r.did,r);
    }
    dao1OwnedDidRoots=[...byDid.values()].sort((a,b)=>a.did-b.did);
    const aptmByDid=new Map();for(const r of aptmRoots){const prev=aptmByDid.get(r.did);if(!prev||(r.source==="ownership"&&prev.source!=="ownership"))aptmByDid.set(r.did,r);}
    aptmdaoOwnedDidRoots=[...aptmByDid.values()].sort((a,b)=>a.did-b.did);
    const activeRoots=dao1TeamRootList();
    if(dao1TeamRootFilter!=="__all" && !activeRoots.some(r=>String(r.did)===String(dao1TeamRootFilter)))dao1TeamRootFilter="__all";
    return dao1OwnedDidRoots;
  }

  function selectedDAO1DidRoots(){
    const roots=dao1TeamRootList();return dao1TeamRootFilter==="__all"?roots:roots.filter(r=>String(r.did)===String(dao1TeamRootFilter));
  }

  function legacyTreeRows(edges){
    const children=new Map();for(const e of edges){if(!children.has(e.parent_id))children.set(e.parent_id,[]);children.get(e.parent_id).push(e);}
    const out=[],seen=new Set();
    function walkChildren(parent,level,rootDid){if(level>DAO1_TEAM_MAX_LEVELS)return;for(const e of children.get(parent)||[]){const key=`${rootDid}|${e.child_id}`;if(seen.has(key))continue;seen.add(key);out.push({...e,level,root_did:rootDid});walkChildren(e.child_id,level+1,rootDid);}}
    for(const root of selectedDAO1DidRoots())walkChildren(root.did,1,root.did);
    return out;
  }

  function setDAO1TeamRootFilter(value){dao1TeamRootFilter=String(value||"__all");renderDAO1TeamTreePanel();}

  function teamOwnedRootCardsHtml(){
    if(dao1TeamTreeMode!=="wallet"){
      if(!dao1TeamRootList().length)return `<div class="status warn" style="margin-top:12px"><strong>Keine eigene DID aus dem gespeicherten Ownership-Bestand erkannt.</strong><div class="note" style="margin-top:4px">Die Team-Ansicht bleibt trotzdem sichtbar. NFT-Cache und Wallet-Bestand werden im Hintergrund als zweite Quelle geprüft.</div></div>`;
      return `<div class="project-summary" style="margin-top:12px">${dao1TeamRootList().map(r=>`<div class="custom-token-card project-summary-box"><span class="field-label">Eigene DID / Root</span><strong>DID #${r.did}</strong><div class="meta">${escapeHtml(r.wallet?.label||"Wallet")} · ${teamShortAddress(r.wallet_address)}</div>${(()=>{const p=dao1KnownParentDid(dao1TeamTreeMode,r.did);return p!=null&&p>0?`<div class="meta">Meine Upline: DID #${p}</div>`:"";})()}</div>`).join("")}</div>`;
    }
    const byWallet=new Map();
    for(const r of dao1AllOwnedDidRoots()){
      const a=lower(r.wallet_address);if(!a)continue;
      const n=byWallet.get(a)||{wallet:a,label:r.wallet?.label||"Eigene Wallet",dao1:[],aptm:[]};
      (r.system==="aptmdao"?n.aptm:n.dao1).push(Number(r.did));byWallet.set(a,n);
    }
    if(!byWallet.size)return `<div class="status warn" style="margin-top:12px"><strong>Keine eigene DAO-Wallet mit DID erkannt.</strong></div>`;
    return `<div class="project-summary" style="margin-top:12px">${[...byWallet.values()].map(n=>{const legacy=n.dao1.sort((a,b)=>a-b),aptm=n.aptm.sort((a,b)=>a-b);const uplines=[];for(const id of legacy){const p=dao1KnownParentDid("legacy",id);if(p>0)uplines.push(`DAO1 #${id} → Upline #${p}`);}for(const id of aptm){const p=dao1KnownParentDid("aptmdao",id);if(p>0)uplines.push(`APTMDAO #${id} → Upline #${p}`);}return `<div class="custom-token-card project-summary-box"><span class="field-label">Eigene Wallet</span><strong>${escapeHtml(n.label)}</strong><div class="meta">${teamShortAddress(n.wallet)}</div>${legacy.length?`<div class="meta"><b>DAO1:</b> ${legacy.map(x=>`#${x}`).join(", ")}</div>`:""}${aptm.length?`<div class="meta"><b>APTMDAO:</b> ${aptm.map(x=>`#${x}`).join(", ")}</div>`:""}${uplines.length?`<div class="meta" style="margin-top:4px"><b>Meine Upline:</b> ${escapeHtml(uplines.join(" · "))}</div>`:""}</div>`;}).join("")}</div>`;
  }

  function teamRootSelectorHtml(){
    if(!dao1TeamRootList().length)return `<div class="status warn"><strong>Keine eigene DID gefunden.</strong><div class="note" style="margin-top:4px">Die Roots werden automatisch aus den aktuell zu deinen DAO-Wallets gehörenden DID-NFTs ermittelt. Der verifizierte DID-Contract wird direkt erkannt; eine zusätzliche manuelle NFT-Klassifizierung ist nicht nötig. Falls hier keine DID erscheint, bitte den NFT-Bestand der DAO-Wallets aktualisieren.</div></div>`;
    const opts=[`<option value="__all" ${dao1TeamRootFilter==="__all"?"selected":""}>Alle DIDs (${dao1TeamRootList().length})</option>`,...dao1TeamRootList().map(r=>`<option value="${r.did}" ${String(dao1TeamRootFilter)===String(r.did)?"selected":""}>DID #${r.did} · ${escapeHtml(r.wallet?.label||"Wallet")}</option>`)].join("");
    return `<label><span class="field-label">Eigene DID / Root</span><select onchange="DAO1Project.setTeamRootFilter(this.value)">${opts}</select></label>`;
  }

  function dao1TeamDate(ts){
    if(!ts)return "–";
    const d=new Date(ts);if(Number.isNaN(d.getTime()))return "–";
    return d.toLocaleDateString("de-CH",{day:"2-digit",month:"2-digit",year:"numeric"});
  }
  async function dao1TeamBlockTimestamp(block){
    block=Number(block||0);if(!block)return null;
    if(dao1TeamBlockTimeCache.has(block))return dao1TeamBlockTimeCache.get(block);
    const raw=await dao1ApertumRpc("eth_getBlockByNumber",["0x"+block.toString(16),false]);
    const sec=teamHexNumber(raw?.timestamp||0),iso=sec?new Date(sec*1000).toISOString():null;
    dao1TeamBlockTimeCache.set(block,iso);return iso;
  }
  function dao1TeamMintEdge(did,st=teamDiscoveryState()){return st.edges.find(e=>Number(e.child_id)===Number(did))||null;}
  async function hydrateDAO1TeamMintDates(host,st){
    const els=[...(host||document).querySelectorAll("[data-dao1-mint-block]")].filter(el=>!el.dataset.loaded);
    let cursor=0;
    async function worker(){while(cursor<els.length){const el=els[cursor++],block=Number(el.dataset.dao1MintBlock||0);el.dataset.loaded="1";try{const ts=await dao1TeamBlockTimestamp(block);el.textContent=ts?`DID Mint: ${dao1TeamDate(ts)}`:"DID Mint: –";el.title=ts?new Date(ts).toLocaleString("de-CH"):"";}catch(_){el.textContent="DID Mint: nicht ermittelt";}}}
    await Promise.all(Array.from({length:Math.min(4,els.length)},worker));
  }
  function dao1TeamKnownNfts(wallet){
    const a=lower(wallet||"");if(!a)return [];
    const rows=ownershipRows.filter(o=>lower(o.wallet_address||walletAddress(walletByDbId(o.wallet_id))||"")===a);
    const seen=new Set(),out=[];
    for(const o of rows){const key=`${lower(o.nft_contract)}|${o.nft_id}`;if(seen.has(key))continue;seen.add(key);const cls=classificationFor(o.nft_contract,o.nft_id),name=cls?.nft_name||o.nft_name||`NFT #${o.nft_id}`,subtype=cls?.subtype||dao1TeamProjectNftSubtype(o.nft_contract,o.nft_id,name,"");out.push({id:String(o.nft_id),contract:lower(o.nft_contract),name,subtype:subtype||"nicht klassifiziert",current:!!o.is_current,owned_from_at:o.owned_from_at||null,owned_from_block:Number(o.owned_from_block||0)||0,acquisition_verified:!!o.acquisition_verified,acquisition_kind:o.acquisition_kind||null,acquisition_tx_hash:o.acquisition_tx_hash||null,purchase:null,current_wallet:!!o.is_current?a:""});}
    return out;
  }
  function dao1TeamOwnHistoricalBotCandidates(){
    // Historische Bot-Kandidaten aller eigenen DAO-Wallets aus derselben zentralen
    // Ownership-Tabelle wie die übrige DAO-NFT-Ansicht. Diese Funktion war seit dem
    // Detail-Umbau referenziert, aber nicht definiert (5.70: ReferenceError).
    const own=new Set((getContext?.()?.wallets||[]).map(w=>lower(walletAddress(w))).filter(Boolean));
    if(!own.size)return [];
    const currentOwnerByKey=new Map();
    for(const o of ownershipRows){
      if(!o?.is_current)continue;
      const owner=lower(o.wallet_address||walletAddress(walletByDbId(o.wallet_id))||"");
      if(owner)currentOwnerByKey.set(`${lower(o.nft_contract)}|${o.nft_id}`,owner);
    }
    const out=[];
    for(const o of ownershipRows){
      const acquisitionWallet=lower(o.wallet_address||walletAddress(walletByDbId(o.wallet_id))||"");
      if(!own.has(acquisitionWallet))continue;
      const cls=classificationFor(o.nft_contract,o.nft_id);
      const n={id:String(o.nft_id),contract:lower(o.nft_contract),name:cls?.nft_name||o.nft_name||`NFT #${o.nft_id}`,subtype:cls?.subtype||"nicht klassifiziert",current:!!o.is_current,owned_from_at:o.owned_from_at||null,owned_from_block:Number(o.owned_from_block||0)||0,acquisition_verified:!!o.acquisition_verified,acquisition_kind:o.acquisition_kind||null,acquisition_tx_hash:o.acquisition_tx_hash||null,purchase:null,acquisition_wallet:acquisitionWallet,current_wallet:currentOwnerByKey.get(`${lower(o.nft_contract)}|${o.nft_id}`)||"",own_history:true};
      if(dao1TeamIsBot(n)&&!dao1TeamIsIdentityNft(n))out.push(n);
    }
    return dao1MergeWalletBotCandidates(out);
  }
  function dao1TeamBotSubtypeFromLabel(name="",collection=""){
    const label=`${name||""} ${collection||""}`.toLowerCase();
    if(/trading[ _-]*bot|trade[ _-]*bot/.test(label))return "Trading-Bot";
    if(/miner[ _-]*bot|mining[ _-]*bot|apertum miner/.test(label))return "Mining-Bot";
    return "";
  }
  function dao1TeamBotContractSubtype(contract){
    contract=lower(contract);if(!contract)return "";
    if(contract===lower(DEFAULT_MINER_NFT_CONTRACT))return "Mining-Bot";
    const types=new Set();
    for(const n of projectNfts||[]){
      if(lower(n?.nft_contract)!==contract)continue;
      if(["Mining-Bot","Trading-Bot"].includes(String(n?.subtype||"")))types.add(String(n.subtype));
    }
    for(const o of ownershipRows||[]){
      if(lower(o?.nft_contract)!==contract)continue;
      const cls=classificationFor(contract,o?.nft_id);
      if(["Mining-Bot","Trading-Bot"].includes(String(cls?.subtype||"")))types.add(String(cls.subtype));
      const inferred=dao1TeamBotSubtypeFromLabel(cls?.nft_name||o?.nft_name||"","");if(inferred)types.add(inferred);
    }
    for(const n of (window.getAllCachedNfts?.()||[])){
      if(String(n?.chain||"")!==CHAIN_KEY||lower(n?.tokenAddress)!==contract)continue;
      if(n?.possibleSpam||n?.userMarkedSpam)continue;
      const cls=classificationFor(contract,n?.tokenId);
      const subtype=["Mining-Bot","Trading-Bot"].includes(String(cls?.subtype||""))?String(cls.subtype):dao1TeamBotSubtypeFromLabel(cls?.nft_name||n?.name||"",n?.collectionName||"");
      if(subtype)types.add(subtype);
    }
    return types.size===1?[...types][0]:"";
  }
  function dao1TeamProjectNftSubtype(contract,id,name="",collection=""){
    contract=lower(contract);
    if(contract===lower(DAO1_OLD_DID_CONTRACT))return "DID";
    if(contract===lower(APTMDAO_NFT_CONTRACT))return "APTMDAO NFT";
    const cls=classificationFor(contract,id);
    if(cls?.subtype)return cls.subtype;
    const botByLabel=dao1TeamBotSubtypeFromLabel(name,collection);if(botByLabel)return botByLabel;
    const label=`${name||""} ${collection||""}`.toLowerCase();
    if(/membership/.test(label))return "DAO / Membership";
    if(/\bdid\b/.test(label))return "DID";
    const byContract=dao1TeamBotContractSubtype(contract);if(byContract)return byContract;
    return "nicht klassifiziert";
  }
  function classifyNftType(input={}){
    if(String(input?.chain||CHAIN_KEY)!==CHAIN_KEY)return null;
    const subtype=dao1TeamProjectNftSubtype(input?.contract||"",input?.id??"",input?.name||"",input?.collection||"");
    if(subtype==="DID"||subtype==="APTMDAO NFT")return "DID";
    if(subtype==="Mining-Bot")return "MineBot";
    if(subtype==="Trading-Bot")return "TradeBot";
    return null;
  }
  function dao1TeamIsIdentityNft(n){
    const contract=lower(n?.contract||n?.nft_contract||"");
    if(contract===lower(DAO1_OLD_DID_CONTRACT)||contract===lower(APTMDAO_NFT_CONTRACT))return true;
    const subtype=dao1TeamProjectNftSubtype(contract,n?.id??n?.nft_id,n?.name||n?.nft_name||"",n?.collection||"");
    return subtype==="DID"||subtype==="APTMDAO NFT";
  }
  function dao1TeamIsRelevantNft(contract,id,name="",collection=""){
    contract=lower(contract);
    return contract===lower(DEFAULT_MINER_NFT_CONTRACT)||contract===lower(DAO1_OLD_DID_CONTRACT)||contract===lower(APTMDAO_NFT_CONTRACT)||!!classificationFor(contract,id)||dao1TeamProjectNftSubtype(contract,id,name,collection)!=="nicht klassifiziert";
  }
  const dao1PartnerNftInflight=new Map();
  const DAO1_PARTNER_HOLDINGS_BROWSER_NAMESPACE="dao1";
  const DAO1_PARTNER_HOLDINGS_BROWSER_KEY="partner-current-holdings-v1";
  const DAO1_PARTNER_HOLDINGS_TTL_MS=24*60*60*1000;

  function dao1TeamBotContracts(){
    const contracts=new Set([lower(DEFAULT_MINER_NFT_CONTRACT)]);
    for(const n of projectNfts||[]){
      if(!["Mining-Bot","Trading-Bot"].includes(String(n?.subtype||"")))continue;
      const c=lower(n?.nft_contract||"");if(c)contracts.add(c);
    }
    for(const o of ownershipRows||[]){
      const c=lower(o?.nft_contract||"");if(c&&dao1TeamBotContractSubtype(c))contracts.add(c);
    }
    for(const n of (window.getAllCachedNfts?.()||[])){
      if(String(n?.chain||"")!==CHAIN_KEY||n?.possibleSpam||n?.userMarkedSpam)continue;
      const c=lower(n?.tokenAddress||"");if(c&&dao1TeamBotContractSubtype(c))contracts.add(c);
    }
    return [...contracts].filter(Boolean);
  }

  function dao1TeamTransferOrder(t){
    return [Number(t?.block_number||0),Number(t?.log_index??t?.index??0),Number(t?.transaction_index??0)];
  }
  function dao1TeamSortTransfersAsc(rows){
    return [...(rows||[])].sort((a,b)=>{
      const aa=dao1TeamTransferOrder(a),bb=dao1TeamTransferOrder(b);
      return aa[0]-bb[0]||aa[1]-bb[1]||aa[2]-bb[2];
    });
  }

  async function dao1TeamHeldTokenIdsAtBlock(wallet,contract,targetBlock=Number.MAX_SAFE_INTEGER){
    const a=lower(wallet),c=lower(contract),limit=Number(targetBlock||Number.MAX_SAFE_INTEGER);
    if(!/^0x[0-9a-f]{40}$/.test(a)||!c)return [];
    const memRows=(ownershipRows||[]).filter(o=>{
      if(lower(o?.nft_contract)!==c)return false;
      const from=Number(o?.owned_from_block||0),to=Number(o?.owned_to_block||0)||Number.MAX_SAFE_INTEGER;
      const owner=lower(o?.wallet_address||walletAddress(walletByDbId(o?.wallet_id))||"");
      return owner===a&&from<=limit&&limit<to;
    });
    if(memRows.length)return [...new Set(memRows.map(o=>String(o.nft_id)))];

    const rows=dao1TeamSortTransfersAsc(await loadWalletNftTransferHistory(a,c));
    const held=new Set();
    for(const t of rows){
      const block=Number(t?.block_number||0);if(block>limit)break;
      const ids=transferTokenIds(t);if(!ids.length)continue;
      const from=transferFromAddress(t),to=transferToAddress(t);
      if(from===a&&to!==a)for(const id of ids)held.delete(String(id));
      if(to===a)for(const id of ids)held.add(String(id));
    }
    return [...held];
  }

  async function dao1TeamCurrentContractHoldings(wallet,contract){
    const a=lower(wallet),c=lower(contract);if(!/^0x[0-9a-f]{40}$/.test(a)||!/^0x[0-9a-f]{40}$/.test(c))return [];
    // Phase 5.78: Der aktuelle Partner-Bestand ist ein abgeleiteter, öffentlicher Chain-Cache.
    // Er darf deshalb 24h im zentralen IndexedDB-Cache wiederverwendet werden – passend zum
    // bestehenden Partner-Scan-State. Dadurch muss ein Browser-Reload nicht erneut die volle
    // ERC-721-Transferhistorie jeder Partner-Wallet laden. Historische DID-Zuordnung/Kaufpreis
    // nutzt weiterhin blockgenaue Transferdaten und wird dadurch nicht ersetzt.
    const bc=window.WalletTrackingBrowserCache,itemKey=`${a}|${c}`;
    if(bc){
      try{
        const rows=await bc.getByKeys(DAO1_PARTNER_HOLDINGS_BROWSER_NAMESPACE,DAO1_PARTNER_HOLDINGS_BROWSER_KEY,[itemKey]);
        const hit=rows?.[0],checked=Date.parse(hit?.checkedAt||0);
        if(hit&&Array.isArray(hit.ids)&&Number.isFinite(checked)&&Date.now()-checked<DAO1_PARTNER_HOLDINGS_TTL_MS)return hit.ids.map(String);
      }catch(e){console.warn("DAO Partner-Bestand Browser-Cache lesen",e)}
    }
    // Kachel-/Identity-Bestand nur aus dem bekannten Contract rekonstruieren. Kein breiter
    // /address/nft-Snapshot: dieser konnte bei Explorer-Retries minutenlang blockieren.
    const ids=await dao1TeamHeldTokenIdsAtBlock(a,c,Number.MAX_SAFE_INTEGER);
    if(bc){
      try{
        await bc.merge(DAO1_PARTNER_HOLDINGS_BROWSER_NAMESPACE,DAO1_PARTNER_HOLDINGS_BROWSER_KEY,[{item_key:itemKey,wallet:a,contract:c,ids:[...ids].map(String),checkedAt:new Date().toISOString()}],{keyField:"item_key",meta:{ttlMs:DAO1_PARTNER_HOLDINGS_TTL_MS}});
      }catch(e){console.warn("DAO Partner-Bestand Browser-Cache speichern",e)}
    }
    return ids;
  }

  function dao1PartnerRerenderIfVisible(){
    if(document.getElementById("dao1TeamTreePanel"))renderDAO1TeamTreePanel();
  }

  async function dao1TeamFetchPartnerIdentity(wallet){
    const a=lower(wallet);if(!/^0x[0-9a-f]{40}$/.test(a))return {legacy:[],aptmdao:[]};
    const result=dao1PartnerIdentityStats.get(a)||{legacy:[],aptmdao:[]};
    const jobs=[["legacy",lower(DAO1_OLD_DID_CONTRACT)],["aptmdao",lower(APTMDAO_NFT_CONTRACT)]].map(async([system,contract])=>{
      try{
        const ids=await dao1TeamCurrentContractHoldings(a,contract);
        result[system]=ids.map(Number).filter(x=>Number.isFinite(x)&&x>0).sort((x,y)=>x-y);
        dao1PartnerIdentityStats.set(a,{legacy:[...(result.legacy||[])],aptmdao:[...(result.aptmdao||[])]});
        dao1PartnerRerenderIfVisible();
      }catch(e){console.warn("DAO Partner-Identity",a,system,e);}
    });
    await Promise.allSettled(jobs);
    dao1PartnerIdentityStats.set(a,result);return result;
  }

  async function dao1TeamFetchPartnerNfts(wallet,mode=dao1TeamTreeMode){
    const a=lower(wallet);if(!/^0x[0-9a-f]{40}$/.test(a))return [];
    mode=mode==="aptmdao"?"aptmdao":"legacy";
    const walletCacheKey=`wallet:${mode}:${a}`;
    const cached=dao1TeamPartnerDetailsCache.get(walletCacheKey);if(cached?.nfts&&Date.now()-Number(cached.loadedAt||0)<300000)return cached.nfts;
    if(dao1PartnerNftInflight.has(walletCacheKey))return dao1PartnerNftInflight.get(walletCacheKey);
    const job=(async()=>{
      const out=[];
      const jobs=dao1TeamBotContracts().map(async contract=>{
        try{
          const ids=await dao1TeamCurrentContractHoldings(a,contract);
          for(const id of ids){
            const cls=classificationFor(contract,id),rawName=cls?.nft_name||`NFT #${id}`;
            // Der bekannte Miner-Contract ist selbst die belastbare Typ-Evidenz. Einzelne
            // Token muessen keinen Kaufpreis/keine project_nfts-Zeile besitzen, um im
            // aktuellen Bestand als Mining-Bot gezaehlt zu werden.
            let subtype=dao1TeamProjectNftSubtype(contract,id,rawName,"");
            if(lower(contract)===lower(DEFAULT_MINER_NFT_CONTRACT))subtype="Mining-Bot";
            if(!["Mining-Bot","Trading-Bot"].includes(subtype))continue;
            out.push({id:String(id),contract:lower(contract),name:rawName,subtype,current:true,current_wallet:a,owned_from_at:null,acquisition_verified:false,acquisition_kind:null,acquisition_tx_hash:null,purchase:null});
          }
          // Bereits abgeschlossene Contract-Ergebnisse sofort in der Karte zeigen. Ein
          // langsamer zweiter Bot-Contract darf den bekannten Miner-Bestand nicht verdecken.
          const partial=[...new Map(out.map(n=>[`${lower(n.contract)}|${n.id}`,n])).values()];
          dao1PartnerBotStats.set(a,dao1BotStatsFromRows(partial,{currentOnly:true}));
          dao1PartnerRerenderIfVisible();
        }catch(e){console.warn("DAO Partner-Bot Contract-Bestand",a,contract,e);}
      });
      await Promise.allSettled(jobs);
      const dedup=[...new Map(out.map(n=>[`${lower(n.contract)}|${n.id}`,n])).values()];
      dao1TeamPartnerDetailsCache.set(walletCacheKey,{nfts:dedup,loadedAt:Date.now()});return dedup;
    })();
    dao1PartnerNftInflight.set(walletCacheKey,job);try{return await job;}finally{dao1PartnerNftInflight.delete(walletCacheKey);}
  }

  function dao1TeamNftMatchesMode(nft,mode=dao1TeamTreeMode,did=null){
    mode=mode==="aptmdao"?"aptmdao":"legacy";
    if(nft?.subtype==="DID"||nft?.subtype==="APTMDAO NFT")return false;
    if(nft?.subtype==="DAO / Membership"){
      const direct=dao1TeamNftSystemDirect(nft);
      return direct?direct===mode:mode==="legacy";
    }
    if(dao1TeamIsBot(nft)){
      if(nft?.assigned_system!==mode)return false;
      if(did!=null&&Number(nft?.assigned_did)!==Number(did))return false;
      return true;
    }
    return false;
  }

  function dao1PurchaseDidFromInput(input){
    const raw=String(input||"").toLowerCase();
    // Verifizierter Apertum-Miner-Kauf: selector 0x77ee0680, erstes Argument = APTMDAO-DID.
    if(!raw.startsWith("0x77ee0680")||raw.length<74)return 0;
    try{return Number(BigInt("0x"+raw.slice(10,74)));}catch(_){return 0;}
  }
  async function dao1AptmdaoOwnerAtBlock(did,block){
    did=Number(did||0);block=Number(block||0);if(!(did>0)||!(block>0))return "";
    try{const data="0x6352211e"+BigInt(did).toString(16).padStart(64,"0");const out=await dao1ApertumRpc("eth_call",[{to:APTMDAO_NFT_CONTRACT,data},"0x"+block.toString(16)]);return lower("0x"+String(out||"").replace(/^0x/,"").slice(-40));}catch(e){console.warn("APTMDAO ownerOf@Block",did,block,e);return "";}
  }
  async function dao1AptmdaoParentDid(did){
    did=Number(did||0);if(!(did>0))return 0;
    const cached=dao1KnownParentDid("aptmdao",did);if(cached!=null)return Number(cached)||0;
    try{const data="0x414533de"+BigInt(did).toString(16).padStart(64,"0");const out=await dao1ApertumRpc("eth_call",[{to:APTMDAO_NFT_CONTRACT,data},"latest"]);return teamHexNumber(out);}catch(e){console.warn("APTMDAO Parent-DID",did,e);return 0;}
  }

  async function dao1TeamResolveBotAssignment(nft,wallet,acq){
    const a=lower(wallet),block=Number(acq?.block||nft?.owned_from_block||0);
    if(!dao1TeamIsBot(nft)||!/^0x[0-9a-f]{40}$/.test(a)||!(block>0))return {system:null,did:null,type:"did_ownership_not_resolved"};
    // Harte neue MinerBot-Evidenz: Die Kauf-Tx trägt die verwendete APTMDAO-DID
    // explizit im ersten Funktionsargument. ownerOf wird am Kaufblock gegengeprüft.
    if(Number(acq?.purchaseDid||0)>0){
      const did=Number(acq.purchaseDid),owner=await dao1AptmdaoOwnerAtBlock(did,block);
      if(owner===a)return {system:"aptmdao",did,type:"purchase_did_input",parentDid:Number(acq?.purchaseParentDid||0)||await dao1AptmdaoParentDid(did)};
      if(owner)return {system:null,did:null,type:"purchase_did_owner_mismatch",purchaseDid:did,owner};
      // Historische RPC-Abfrage nicht verfügbar: nicht raten, sondern auf den bereits
      // vorhandenen Ownership-Historiennachweis zurückfallen.
    }
    // Fachregel: Ein erkannter Kaufpreis ist für die DID-Zuordnung nicht zwingend.
    // Bei eigenen Bots ist der persistente, historisch verifizierte erste Besitzabschnitt
    // bereits unser Erwerbsnachweis; alte DAO1-Käufe dürfen nicht nur deshalb verworfen
    // werden, weil ihre Zahlungs-Tx anders strukturiert ist. Bei fremden/live gefundenen
    // Bots bleibt dagegen ein Kaufnachweis Pflicht, damit ein späterer NFT-Transfer nicht
    // fälschlich als neuer Bot-Kauf einer DID zugeordnet wird.
    const purchaseVerified=Number(acq?.purchase?.amount||0)>0&&acq?.acquisitionKind==="purchase";
    const persistedOwnAcquisition=!!nft?.own_history&&!!(nft?.acquisition_verified||nft?.acquisition_tx_hash||nft?.owned_from_block);
    if(!purchaseVerified&&!persistedOwnAcquisition)return {system:null,did:null,type:"bot_transfer_without_purchase_evidence"};
    // Entscheidend ist anschließend der historische Besitz zum Erwerbsblock: Bot und
    // DID sind unabhängig transferierbare NFTs.
    const [aptmIds,legacyIds]=await Promise.all([
      dao1TeamHeldTokenIdsAtBlock(a,APTMDAO_NFT_CONTRACT,block),
      dao1TeamHeldTokenIdsAtBlock(a,DAO1_OLD_DID_CONTRACT,block)
    ]);
    // APTMDAO hat ab seinem historischen Besitzzeitpunkt Vorrang. Das entspricht der
    // fachlichen Generationstrennung: Bot-Erwerb während APTMDAO-DID-Besitz => neu,
    // davor (bei genau einer alten DAO1-DID) => DAO1 alt.
    if(aptmIds.length===1)return {system:"aptmdao",did:Number(aptmIds[0]),type:"did_ownership_at_bot_acquisition"};
    if(aptmIds.length>1)return {system:null,did:null,type:"ambiguous_aptmdao_dids_at_bot_acquisition",aptmIds,legacyIds};
    if(legacyIds.length===1)return {system:"legacy",did:Number(legacyIds[0]),type:"did_ownership_at_bot_acquisition"};
    if(legacyIds.length>1)return {system:null,did:null,type:"ambiguous_legacy_dids_at_bot_acquisition",aptmIds,legacyIds};
    return {system:null,did:null,type:"no_did_owned_at_bot_acquisition",aptmIds,legacyIds};
  }

  async function saveDAO1PartnerBotLifecycle(nft,wallet){
    const ctx=getContext?.();
    if(!ctx?.currentUser?.id||!dao1TeamIsBot(nft)||!nft?.acquisition_tx_hash||!nft?.assigned_system||!nft?.assigned_did)return;
    try{
      // Frühere Heuristik-Zuordnungen (z. B. unique_tree_wallet) dürfen nicht parallel
      // bestehen bleiben. Ein Bot hat genau eine historisch belegte System/DID-Zuordnung.
      const {error:deleteError}=await sb.from("dao_partner_bot_lifecycle_cache")
        .delete()
        .eq("user_id",ctx.currentUser.id)
        .eq("project_key",PROJECT_KEY)
        .eq("bot_contract",lower(nft.contract))
        .eq("bot_id",String(nft.id));
      if(deleteError)throw deleteError;
      const row={
        user_id:ctx.currentUser.id,project_key:PROJECT_KEY,tree_system:nft.assigned_system,
        partner_did:Number(nft.assigned_did),wallet_address:lower(wallet),
        bot_contract:lower(nft.contract),bot_id:String(nft.id),bot_type:nft.subtype||null,bot_name:nft.name||null,
        acquired_at:nft.owned_from_at||null,acquisition_tx_hash:lower(nft.acquisition_tx_hash),
        evidence_type:nft.assignment_type||"did_ownership_at_bot_acquisition",updated_at:new Date().toISOString()
      };
      const {error}=await sb.from("dao_partner_bot_lifecycle_cache").upsert(row,{onConflict:"user_id,tree_system,bot_contract,bot_id"});
      if(error)throw error;
    }catch(e){console.warn("DAO Partner-Bot-Lifecycle speichern",e);}
  }

  function dao1TeamBotSystemEvidenceFromTx(transfers=[],txDetail=null){
    const nftContracts=new Set((transfers||[]).map(t=>lower(tokenTransferAddress(t))).filter(Boolean));
    const hasAptm=nftContracts.has(lower(APTMDAO_NFT_CONTRACT));
    const hasLegacy=nftContracts.has(lower(DAO1_OLD_DID_CONTRACT));
    const txTo=lower(txDetail?.to?.hash||txDetail?.to?.address||txDetail?.to_address_hash||txDetail?.to_address||"");
    const viaAptmManager=txTo===lower(APTMDAO_MANAGER_CONTRACT);
    if((hasAptm||viaAptmManager)&&!hasLegacy)return {system:"aptmdao",type:viaAptmManager?"aptmdao_manager_tx":"same_acquisition_tx"};
    if(hasLegacy&&!hasAptm&&!viaAptmManager)return {system:"legacy",type:"same_acquisition_tx"};
    return {system:null,type:null};
  }

  async function dao1PaymentEvidenceForTx(txHash,payer,{fallbackBlock=0,fallbackAt=null}={}){
    const hash=lower(txHash||""),a=lower(payer||"");
    if(!/^0x[0-9a-f]{64}$/.test(hash)||!/^0x[0-9a-f]{40}$/.test(a))return {txHash:hash||null,payer:a||null,purchase:null,paymentCandidates:[],txDetail:null,block:Number(fallbackBlock||0)||0,at:fallbackAt||null,purchaseDid:0,purchaseParentDid:0,systemEvidence:null,systemEvidenceType:null};
    let txDetail=null,block=Number(fallbackBlock||0)||0,at=fallbackAt||null;
    const transfers=await fetchTransactionTokenTransfers(hash);
    try{
      txDetail=await fetchJson(`${EXPLORER_API}/transactions/${hash}`,"DAO1 · NFT-Kauf-Tx");
      if(!(block>0))block=Number(txDetail?.block_number||txDetail?.block||0)||0;
      if(!at)at=txDetail?.timestamp||txDetail?.block_timestamp||null;
    }catch(e){console.warn("DAO1 NFT-Kauf Tx-Detail",hash,e);}

    const evidence=dao1TeamBotSystemEvidenceFromTx(transfers,txDetail);
    const groups=new Map();
    for(const t of transfers){
      const token=t?.token||{},type=String(token.type||t.token_type||t.type||"").toUpperCase();
      let raw=0n;try{raw=BigInt(tokenTransferRawValue(t)||"0");}catch(_){raw=0n;}
      if(type!=="ERC-20"||transferFromAddress(t)!==a||raw<=0n)continue;
      const contract=tokenTransferAddress(t),symbol=String(token.symbol||t.symbol||"TOKEN"),amount=Number(decimalAmount(raw.toString(),tokenTransferDecimals(t)));
      if(!(amount>0))continue;
      const key=contract||symbol.toUpperCase(),g=groups.get(key)||{amount:0,symbol,contract,block:Number(t.block_number||block||0),timestamp:t.timestamp||t.block_timestamp||at,evidence:"erc20"};
      g.amount+=amount;groups.set(key,g);
    }

    const pays=[...groups.values()];
    try{
      const txFrom=lower(H(txDetail?.from)||txDetail?.from_address_hash||txDetail?.from_address||"");
      const rawNative=txDetail?.value?.value ?? txDetail?.value ?? "0";
      let nativeAmount=0;try{nativeAmount=Number(BigInt(String(rawNative)))/1e18;}catch(_){nativeAmount=Number(rawNative)||0;}
      if(txFrom===a&&nativeAmount>0)pays.push({amount:nativeAmount,symbol:"APTM",contract:"native",block,timestamp:at,evidence:"tx_value"});
    }catch(_){}
    try{
      const internals=await fetchAll(`/transactions/${hash}/internal-transactions`);
      let nativeInternal=0;
      for(const r of internals||[]){
        const from=lower(H(r?.from)||r?.from_address||r?.from_address_hash||"");
        if(from!==a||r?.error||r?.success===false||String(r?.status||"").toLowerCase()==="error")continue;
        try{const raw=r?.value?.value??r?.value??"0";nativeInternal+=Number(BigInt(String(raw)))/1e18;}catch(_){}
      }
      if(nativeInternal>0)pays.push({amount:nativeInternal,symbol:"APTM",contract:"native",block,timestamp:at,evidence:"internal_tx"});
    }catch(e){console.warn("DAO1 Kaufpreis Internal Transactions",hash,e);}

    const paymentCandidates=pays.map(p=>({amount:Number(p.amount||0),symbol:String(p.symbol||""),contract:p.contract||null,evidence:p.evidence||"erc20",block:Number(p.block||block||0)||null,timestamp:p.timestamp||at||null}));
    let purchase=null;
    const wusdt=pays.find(p=>lower(p.contract)===lower(REFERRAL_WUSDT_TOKEN)||String(p.symbol).toUpperCase()==="WUSDT");
    if(wusdt)purchase=wusdt;
    else {
      const byAsset=new Map();
      for(const p of pays){const k=lower(p.contract)||String(p.symbol||"").toUpperCase();if(!byAsset.has(k))byAsset.set(k,[]);byAsset.get(k).push(p);}
      if(byAsset.size===1){
        const candidates=[...byAsset.values()][0];
        const amounts=[...new Set(candidates.map(p=>Number(p.amount||0)).filter(v=>v>0).map(v=>v.toPrecision(15)))];
        if(amounts.length===1)purchase=candidates[0];
      }
    }

    const parsedPurchaseDid=dao1PurchaseDidFromInput(txDetail?.raw_input||txDetail?.input||txDetail?.data||"");
    const purchaseParentDid=parsedPurchaseDid?await dao1AptmdaoParentDid(parsedPurchaseDid):0;
    return {txHash:hash,payer:a,purchase,paymentCandidates,txDetail,block,at,purchaseDid:parsedPurchaseDid||0,purchaseParentDid,systemEvidence:evidence.system,systemEvidenceType:evidence.type};
  }

  async function dao1HistoricalPurchaseForNft(nft,{beforeBlock=0,excludeTx=""}={}){
    const contract=lower(nft?.contract||""),id=String(nft?.id??"");
    if(!contract||!/^\d+$/.test(id))return null;
    let rows=[];
    try{const map=await fetchCachedNftHistories(contract,[id]);rows=map.get(id)||[];}catch(e){console.warn("DAO1 NFT historische Kaufkette",contract,id,e);return null;}
    const zero="0x0000000000000000000000000000000000000000",excluded=lower(excludeTx||"");
    const candidates=rows.filter(t=>transferTokenIds(t).includes(id)).map(t=>({
      txHash:String(t.transaction_hash||t.tx_hash||H(t.transaction)||"").toLowerCase(),
      block:Number(t.block_number||0),at:t.timestamp||t.block_timestamp||null,
      from:transferFromAddress(t),to:transferToAddress(t)
    })).filter(x=>/^0x[0-9a-f]{64}$/.test(x.txHash)&&/^0x[0-9a-f]{40}$/.test(x.to)&&x.to!==zero&&x.txHash!==excluded&&(!(Number(beforeBlock)>0)||x.block<=Number(beforeBlock)))
      .sort((a,b)=>b.block-a.block);

    // Rückwärts durch die echte NFT-Lifecycle-Kette: Der nächstliegende frühere
    // Transfer mit einer eindeutigen Zahlung des damaligen Empfängers ist die
    // historische Kauf-Evidenz. Damit bleibt ein späterer eigener Walletwechsel
    // preisneutral und überschreibt den ursprünglichen Bot-/NFT-Kauf nicht.
    for(const c of candidates){
      try{
        const ev=await dao1PaymentEvidenceForTx(c.txHash,c.to,{fallbackBlock:c.block,fallbackAt:c.at});
        if(ev?.purchase)return {...ev,sourceWallet:c.from,acquisitionWallet:c.to,acquisitionKind:"purchase_history_tx"};
      }catch(e){console.warn("DAO1 NFT historische Kauf-Tx",c.txHash,e);}
    }
    return null;
  }

  async function dao1TeamAcquisitionForNft(nft,wallet){
    const a=lower(wallet),cacheKey=`acq:v3:${lower(nft.contract)}:${nft.id}:${a}`;
    const cached=dao1TeamPartnerDetailsCache.get(cacheKey);if(cached)return cached;
    let txHash=nft.acquisition_tx_hash||null,at=nft.owned_from_at||null,block=Number(nft.owned_from_block||0)||0,sourceWallet=null,acquisitionKind=nft.acquisition_kind||null;
    if(!txHash&&nft.contract&&nft.id){
      try{
        const rows=await loadWalletNftTransferHistory(a,nft.contract);
        const incoming=rows.filter(t=>transferToAddress(t)===a&&transferTokenIds(t).includes(String(nft.id)))
          .sort((x,y)=>Number(x.block_number||0)-Number(y.block_number||0)||Number(x.log_index??x.index??0)-Number(y.log_index??y.index??0))[0];
        if(incoming){
          txHash=String(incoming.transaction_hash||incoming.tx_hash||H(incoming.transaction)||"").toLowerCase()||null;
          at=incoming.timestamp||incoming.block_timestamp||at;block=Number(incoming.block_number||0);
          sourceWallet=transferFromAddress(incoming)||null;
          acquisitionKind=sourceWallet==="0x0000000000000000000000000000000000000000"?"mint":(sourceWallet?"transfer":"unknown");
        }
      }catch(e){console.warn("DAO1 Team Partner-NFT Erwerb",nft,wallet,e);}
    }

    let purchase=null,paymentCandidates=[],purchaseTxHash=null,purchaseWallet=null;
    let systemEvidence=null,systemEvidenceType=null,purchaseDid=0,purchaseParentDid=0;
    if(txHash){
      try{
        const ev=await dao1PaymentEvidenceForTx(txHash,a,{fallbackBlock:block,fallbackAt:at});
        block=Number(ev.block||block||0)||0;at=ev.at||at;
        paymentCandidates=ev.paymentCandidates||[];
        systemEvidence=ev.systemEvidence;systemEvidenceType=ev.systemEvidenceType;
        purchaseDid=Number(ev.purchaseDid||0)||0;purchaseParentDid=Number(ev.purchaseParentDid||0)||0;
        if(ev.purchase){purchase=ev.purchase;purchaseTxHash=ev.txHash;purchaseWallet=a;acquisitionKind="purchase_same_tx";}
      }catch(e){console.warn("DAO1 Team Kaufpreis",txHash,e);}
    }

    // Phase 6.11: Ein späterer Wallet-Eingang ist nicht automatisch die Kauf-Tx.
    // Wenn die aktuelle Erwerbs-Tx keine Zahlung enthält, wird die globale NFT-
    // Transferkette rückwärts nach der letzten belegten Kauf-Tx dieses NFT geprüft.
    // Separate Kauf- und Mint-Batches werden bewusst NICHT heuristisch zusammengelegt.
    if(!purchase&&nft.contract&&nft.id){
      const hist=await dao1HistoricalPurchaseForNft(nft,{beforeBlock:block||0,excludeTx:txHash||""});
      if(hist?.purchase){
        purchase=hist.purchase;purchaseTxHash=hist.txHash;purchaseWallet=hist.acquisitionWallet||null;
        paymentCandidates=hist.paymentCandidates||[];
        purchaseDid=Number(hist.purchaseDid||0)||0;purchaseParentDid=Number(hist.purchaseParentDid||0)||0;
        if(hist.systemEvidence){systemEvidence=hist.systemEvidence;systemEvidenceType=hist.systemEvidenceType;}
        acquisitionKind="purchase_history_tx";
      }
    }

    const result={txHash,at,block,purchase,sourceWallet,acquisitionKind,systemEvidence,systemEvidenceType,purchaseDid,purchaseParentDid,paymentCandidates,purchaseTxHash,purchaseWallet};
    if(["38483","40938"].includes(String(nft.id))){
      console.info("DAO1 NFT Kaufpreis-Diagnose",{
        nft:`${lower(nft.contract)}#${String(nft.id)}`,
        acquisitionWallet:a,
        inputEvidence:{owned_from_at:nft.owned_from_at||null,owned_from_block:Number(nft.owned_from_block||0)||null,acquisition_tx_hash:nft.acquisition_tx_hash||null,acquisition_kind:nft.acquisition_kind||null},
        resolved:{txHash,at,block,sourceWallet,acquisitionKind,purchase,paymentCandidates,purchaseTxHash,purchaseWallet},
        control38483:String(nft.id)==="38483"?{knownPurchaseTx:"0x31cd019cbba0c36c631debde1d9d3d020cd4671dc39d669a8f489eb026251de2",knownPayment:"10000 wUSDT",purchaseTxMatchesKnown:lower(purchaseTxHash||"")==="0x31cd019cbba0c36c631debde1d9d3d020cd4671dc39d669a8f489eb026251de2"}:null
      });
    }
    dao1TeamPartnerDetailsCache.set(cacheKey,result);return result;
  }
  function dao1TeamPurchaseText(n){
    // DID = Identität/Tree-Root, kein Bot-Kauf.
    if(n?.subtype==="DID")return "–";
    if(n?.purchase?.amount>0)return `${tokenAmount(n.purchase.amount,{address:n.purchase.contract,symbol:n.purchase.symbol})} ${escapeHtml(n.purchase.symbol)}`;
    if(n?.acquisition_kind==="transfer"||n?.acquisition_kind==="own_transfer"||n?.acquisition_kind==="mint")return "–";
    return n?.acquisition_verified?"Zahlung nicht ermittelt":"nicht ermittelt";
  }
  function dao1TeamAcquisitionText(n){
    if(n?.subtype==="DID")return "DID Mint";
    if(n?.purchase?.amount>0||n?.acquisition_kind==="purchase"||n?.acquisition_kind==="purchase_same_tx")return "Kauf";
    if(n?.acquisition_kind==="mint"||n?.acquisition_kind==="mint_to_own_wallet")return "Mint / Kaufprüfung offen";
    if(n?.acquisition_kind==="own_transfer")return "Transfer eigene Wallets";
    if(n?.acquisition_kind==="transfer")return "NFT-Transfer";
    return n?.acquisition_verified?"on-chain Erwerb":"nicht ermittelt";
  }
  function dao1TeamSourceText(n){
    const a=lower(n?.source_wallet||"");if(!a||a==="0x0000000000000000000000000000000000000000")return "";
    const own=walletByAddress(a);return own?`${own.label||"Eigene Wallet"} · ${teamShortAddress(a)}`:teamShortAddress(a);
  }
  function dao1BotClaimTotalsForNft(nftId){
    const groups=new Map();
    for(const r of transactionRows||[]){
      if(String(r.claim_nft_id??"")!==String(nftId))continue;
      for(const f of claimPayoutEntriesForTx(r)){
        const symbol=isWrappedAptmSymbol(f.token_symbol,f.token_name)?"wAPTM":String(f.token_symbol||"TOKEN");
        const key=`${lower(f.token_address||"")||f.source}|${symbol}`;
        const g=groups.get(key)||{amount:0,symbol,contract:f.token_address||null};g.amount+=Number(f.amount||0);groups.set(key,g);
      }
    }
    return [...groups.values()].filter(x=>x.amount>0);
  }
  function dao1MultiAssetText(groups){
    if(!groups?.length)return "–";
    return groups.map(g=>`${tokenAmount(g.amount,{address:g.contract,symbol:g.symbol})} ${escapeHtml(g.symbol)}`).join(" + ");
  }
  function dao1BotOverviewRows(){
    const by=new Map();
    for(const w of allProjectWalletOptions()){
      const address=walletAddress(w);if(!address)continue;
      for(const n of dao1TeamKnownNfts(address)){
        if(!dao1TeamIsBot(n))continue;
        const key=`${lower(n.contract)}|${n.id}|${lower(address)}`;
        if(!by.has(key))by.set(key,{...n,wallet:address,walletLabel:w.label||"Wallet"});
      }
    }
    return [...by.values()].sort((a,b)=>String(b.owned_from_at||"").localeCompare(String(a.owned_from_at||""))||Number(b.id)-Number(a.id));
  }
  function dao1CurrentBotRows(rows){
    const by=new Map();
    for(const n of rows||[]){
      if(n?.current===false||!dao1TeamIsBot(n))continue;
      const key=`${lower(n.contract||"")}|${String(n.id??"")}`;
      if(!by.has(key))by.set(key,n);
    }
    return [...by.values()];
  }
  function dao1BotOverviewTableHtml(rows,loading=false){
    const purchaseGroups=new Map(),claimGroups=new Map();
    for(const n of rows){
      if(n.purchase?.amount>0){const k=`${n.purchase.contract||""}|${n.purchase.symbol}`,g=purchaseGroups.get(k)||{amount:0,symbol:n.purchase.symbol,contract:n.purchase.contract};g.amount+=n.purchase.amount;purchaseGroups.set(k,g);}
      for(const c of dao1BotClaimTotalsForNft(n.id)){const k=`${c.contract||""}|${c.symbol}`,g=claimGroups.get(k)||{amount:0,symbol:c.symbol,contract:c.contract};g.amount+=c.amount;claimGroups.set(k,g);}
    }
    const current=dao1CurrentBotRows(rows), mining=current.filter(n=>n.subtype==="Mining-Bot").length,trading=current.filter(n=>n.subtype==="Trading-Bot").length;
    const historical=Math.max(0,(rows||[]).length-current.length);
    return `<div class="custom-token-card"><div class="chain-title">🤖 Bots</div><div class="note">Zentrale NFT-Basis, ergänzt um DAO1-spezifische Lifecycle-Daten. Die Summary zählt ausschließlich den eindeutigen aktuellen Bestand; historische bzw. zwischen eigenen Wallets transferierte Zuordnungen bleiben nur in der Detailtabelle sichtbar. Kaufpreis = Lizenz-/Bot-Kauf. Trading-Guthaben wird getrennt geführt und erst angezeigt, sobald Funding-Transaktion und Bot-ID on-chain eindeutig verknüpft sind. Claims bleiben je Währung getrennt.</div></div>
      <div class="project-summary" style="margin-top:12px"><div class="custom-token-card project-summary-box"><span class="field-label">Mining-Bots</span><strong>${mining}</strong><div class="note">aktueller Bestand</div></div><div class="custom-token-card project-summary-box"><span class="field-label">Trading-Bots</span><strong>${trading}</strong><div class="note">aktueller Bestand</div></div><div class="custom-token-card project-summary-box"><span class="field-label">Kaufpreise</span><strong>${dao1MultiAssetText([...purchaseGroups.values()])}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">Geclaimt</span><strong>${dao1MultiAssetText([...claimGroups.values()])}</strong></div>${historical?`<div class="custom-token-card project-summary-box"><span class="field-label">Historische/Transfer-Zuordnungen</span><strong>${historical}</strong><div class="note">nicht im aktuellen Bot-Bestand</div></div>`:''}</div>
      ${loading?'<div class="status info" style="margin-top:12px"><strong>Bot-Lifecycle wird ergänzt …</strong><div class="note">Kauftransaktionen werden on-chain geprüft.</div></div>':""}
      <div class="custom-token-card dao1-data-table-card" style="padding:0;overflow:hidden;margin-top:12px"><div class="chain-table-wrap project-data-table"><table><thead><tr><th>Typ</th><th>Bot</th><th>Name</th><th>Wallet</th><th>Erworben am</th><th>Kaufpreis</th><th>Trading-Guthaben</th><th>Geclaimt</th><th>Status</th></tr></thead><tbody>${rows.length?rows.map(n=>`<tr><td>${escapeHtml(n.subtype)}</td><td><strong>#${escapeHtml(n.id)}</strong></td><td><strong>${escapeHtml(n.name)}</strong></td><td>${escapeHtml(n.walletLabel)}<div class="meta">${teamShortAddress(n.wallet)}</div></td><td>${n.owned_from_at?dao1TeamDate(n.owned_from_at):"nicht ermittelt"}</td><td>${dao1TeamPurchaseText(n)}</td><td>${n.subtype==="Trading-Bot"?"noch nicht ermittelt":"–"}</td><td>${dao1MultiAssetText(dao1BotClaimTotalsForNft(n.id))}</td><td>${escapeHtml(dao1TeamBotStatus(n))}</td></tr>`).join(""):'<tr><td colspan="9" class="empty">Keine klassifizierten Bots im aktuellen NFT-Bestand.</td></tr>'}</tbody></table></div></div>`;
  }
  function dao1OverviewAssetLines(rows,empty="–"){
    const list=Array.isArray(rows)?rows:[]; if(!list.length)return `<span class="muted">${empty}</span>`;
    return list.slice().sort((a,b)=>String(a.symbol||"").localeCompare(String(b.symbol||""))).map(x=>`<div><strong>${tokenAmount(Number(x.amount||0),{address:x.address,symbol:x.symbol,summary:true})}</strong> ${escapeHtml(x.symbol||"TOKEN")}</div>`).join("");
  }
  async function dao1OverviewTeamCount(){
    try{
      await loadDAO1OwnedDidRoots(true);
      const [legacy,aptm]=await Promise.all([loadOldDao1TreeCache(),loadAptmdaoTreeCache()]);
      const own=dao1OwnWalletSet(), all=new Set(), prev=dao1TeamTreeMode;
      if(legacy?.edges){dao1TeamTreeMode="legacy";for(const r of legacyTreeRows(legacy.edges)){const w=lower(r.wallet);if(w&&!own.has(w))all.add(w);}}
      if(aptm?.edges){dao1TeamTreeMode="aptmdao";for(const r of legacyTreeRows(aptm.edges)){const w=lower(r.wallet);if(w&&!own.has(w))all.add(w);}}
      dao1TeamTreeMode=prev; return all.size;
    }catch(e){console.warn("DAO1 Übersicht Team-Summary",e);return null;}
  }
  function dao1OverviewNftStats(){
    const seen=new Map();
    for(const w of allProjectWalletOptions()){for(const n of dao1TeamKnownNfts(walletAddress(w))){const k=`${lower(n.contract)}|${n.id}`;if(!seen.has(k)||n.current)seen.set(k,n);}}
    const current=[...seen.values()].filter(n=>n.current);
    return {dids:current.filter(n=>n.subtype==="DID"||n.subtype==="APTMDAO NFT").length,memberships:current.filter(n=>n.subtype==="DAO / Membership").length};
  }
  function dao1OverviewSummaryHtml(rows,periods,teamCount){
    const currentBots=dao1CurrentBotRows(rows), mining=currentBots.filter(n=>n.subtype==="Mining-Bot").length,trading=currentBots.filter(n=>n.subtype==="Trading-Bot").length;
    const nfts=dao1OverviewNftStats(), wallets=allProjectWalletOptions().length;
    return `<div class="project-summary dao1-overview-summary" style="margin-top:0">
      <div class="custom-token-card project-summary-box"><span class="field-label">Wallet-Sicht</span><strong>${wallets}</strong><div class="note">DAO1/APTM-Wallet(s)</div></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Mining-Bots</span><strong>${mining}</strong><div class="note">aktueller eindeutiger Bestand</div></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Trading-Bots</span><strong>${trading}</strong><div class="note">aktueller eindeutiger Bestand</div></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">DIDs / Memberships</span><strong>${nfts.dids} / ${nfts.memberships}</strong><div class="note">aktueller Bestand</div></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Bot-Claims</span><strong style="font-size:1rem">${dao1OverviewAssetLines(periods?.rewards?.total)}</strong></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Referral-Rewards</span><strong style="font-size:1rem">${dao1OverviewAssetLines(periods?.referralRewards?.total)}</strong></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Team-Partner sichtbar</span><strong>${teamCount==null?'–':teamCount}</strong><div class="note">wallet-zentriert · 1 Wallet = 1 Partner</div></div>
    </div>`;
  }

  let dao1BotOverviewRun=0;
  async function renderDAO1BotOverview(){
    const el=document.getElementById("dao1-subtab-overview");if(!el)return;
    const run=++dao1BotOverviewRun;
    try{
      const wallets=allProjectWalletOptions();
      transactionRows=await loadAllApertumTransactionRows(wallets,null);transactionAssetFlows=await loadAllAssetFlowRows(wallets);
      const rows=dao1BotOverviewRows(), periods=dashboardRewardPeriods(transactionRows,transactionAssetFlows), teamCount=await dao1OverviewTeamCount();
      const summary=dao1OverviewSummaryHtml(rows,periods,teamCount);el.innerHTML=summary+dao1BotOverviewTableHtml(rows,true);
      let cursor=0;async function worker(){while(cursor<rows.length&&run===dao1BotOverviewRun){const n=rows[cursor++];try{const acq=await dao1TeamAcquisitionForNft(n,n.wallet);if(acq.at&&!n.owned_from_at)n.owned_from_at=acq.at;if(acq.txHash){n.acquisition_tx_hash=acq.txHash;n.acquisition_verified=true;}if(acq.purchase)n.purchase=acq.purchase;}catch(e){console.warn("DAO1 Übersicht Bot-Erwerb",n.id,e);}}}
      await Promise.all(Array.from({length:Math.min(5,rows.length)},worker));if(run===dao1BotOverviewRun)el.innerHTML=summary+dao1BotOverviewTableHtml(rows,false);
    }catch(e){console.warn("DAO1 Bot-Übersicht",e);el.innerHTML=`<div class="status warn"><strong>Bot-Übersicht konnte nicht geladen werden.</strong><div class="note">${escapeHtml(e?.message||e)}</div></div>`;}
  }

  function dao1TeamMembershipLabel(nfts){
    const memberships=nfts.filter(n=>n.subtype==="DAO / Membership");
    if(!memberships.length)return "keine bekannte Membership";
    return memberships.some(n=>n.current)?"aktiv":"historisch / nicht aktiv";
  }
  function dao1TeamIsBot(n){return n?.subtype==="Mining-Bot"||n?.subtype==="Trading-Bot";}
  function dao1TeamBotStatus(n){
    if(!dao1TeamIsBot(n))return n?.current?"aktuell":"historisch";
    // Ein abgeschlossener Bot wird erst nach eindeutigem Target-/Contract-Nachweis gesetzt.
    return n?.current?"laufend":"Status nicht ermittelt";
  }
  function dao1TeamPurchaseTotalsHtml(nfts){
    const typeStats=new Map(),paymentGroups=new Map();
    for(const n of nfts||[]){
      if(!dao1TeamIsBot(n))continue;
      const t=typeStats.get(n.subtype)||{total:0,priced:0};t.total++;
      const p=n?.purchase;
      if(p?.amount>0){
        t.priced++;
        const key=`${n.subtype}|${String(p.symbol||"TOKEN")}|${lower(p.contract||"")}`;
        const g=paymentGroups.get(key)||{subtype:n.subtype,symbol:String(p.symbol||"TOKEN"),contract:p.contract||"",amount:0};
        g.amount+=Number(p.amount||0);paymentGroups.set(key,g);
      }
      typeStats.set(n.subtype,t);
    }
    if(!typeStats.size)return "";
    const types=[...typeStats.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
    return `<div class="wt-team-purchase-totals"><div class="wt-team-purchase-totals-title">Bestand / Kaufpreis-Abdeckung</div>${types.map(([subtype,st])=>{const sums=[...paymentGroups.values()].filter(g=>g.subtype===subtype).map(g=>`${tokenAmount(g.amount,{address:g.contract,symbol:g.symbol})} ${escapeHtml(g.symbol)}`).join(" · ");return `<div class="wt-team-purchase-total-row"><span><strong>${escapeHtml(subtype)}: ${st.total}</strong> · davon ${st.priced} mit ermitteltem Kaufpreis</span><strong>${sums||"–"}</strong></div>`;}).join("")}</div>`;
  }
  function dao1TeamNftTableHtml(nfts,{emptyText="Für diese DID sind aktuell keine eindeutig zugeordneten Bots oder Memberships belegt.",showTotals=true}={}){
    if(!nfts.length)return `<div class="empty">${escapeHtml(emptyText)}</div>`;
    return `<div class="chain-table-wrap project-data-table"><table><thead><tr><th>Typ</th><th>NFT</th><th>Name</th><th>Erworben am</th><th>Erwerbsart</th><th>Kaufpreis</th><th>Status</th></tr></thead><tbody>${nfts.map(n=>`<tr><td>${escapeHtml(n.subtype)}</td><td>#${escapeHtml(n.id)}</td><td><strong>${escapeHtml(n.name)}</strong></td><td>${n.owned_from_at?dao1TeamDate(n.owned_from_at):"nicht ermittelt"}</td><td>${escapeHtml(dao1TeamAcquisitionText(n))}${dao1TeamSourceText(n)?`<div class="meta">von ${escapeHtml(dao1TeamSourceText(n))}</div>`:""}${n.current_wallet&&lower(n.current_wallet)!==lower(n.acquisition_wallet||"")?`<div class="meta">heute: ${escapeHtml(teamShortAddress(n.current_wallet))}</div>`:""}</td><td>${dao1TeamPurchaseText(n)}</td><td>${escapeHtml(dao1TeamBotStatus(n))}</td></tr>`).join("")}</tbody></table></div>${showTotals?dao1TeamPurchaseTotalsHtml(nfts):""}`;
  }
  function dao1TeamBotSummaryHtml(wallet,did){
    const a=lower(wallet||"");if(!a)return "";
    const cacheKey=`did:${dao1TeamTreeMode}:${Number(did)||0}:${a}`;
    const cached=dao1TeamPartnerDetailsCache.get(cacheKey);
    const nfts=(cached?.nfts||[]).filter(n=>dao1TeamNftMatchesMode(n,dao1TeamTreeMode,did));
    const counts=new Map();for(const n of nfts){if(!dao1TeamIsBot(n)||!n.current)continue;counts.set(n.subtype,(counts.get(n.subtype)||0)+1);}
    const attrs=`data-dao1-bot-summary="${a}" data-dao1-bot-summary-did="${Number(did)||0}"`;
    if(!counts.size)return `<div class="wt-team-node-bots" ${attrs}></div>`;
    return `<div class="wt-team-node-bots" ${attrs}>${[...counts.entries()].map(([t,c])=>`${escapeHtml(t)}: <strong>${c}</strong>`).join(" · ")}</div>`;
  }
  function dao1TeamCopyButtonHtml(wallet){
    const a=String(wallet||"");if(!/^0x[0-9a-fA-F]{40}$/.test(a))return "";
    return `<button type="button" class="team-copy-btn wt-team-copy-btn" data-dao1-copy-wallet="${escapeHtml(a)}" title="Wallet-Adresse kopieren" aria-label="Wallet-Adresse kopieren">⧉</button>`;
  }
  function dao1TeamNodeHtml(node,childrenMap,level=0,rootDid=0,seen=new Set()){
    const did=Number(node.child_id||node.did||rootDid), wallet=String(node.wallet||"");
    if(!did||seen.has(did))return "";
    const nextSeen=new Set(seen);nextSeen.add(did);
    const kids=(childrenMap.get(did)||[]).slice().sort((a,b)=>a.child_id-b.child_id);
    const collapsed=dao1TeamCollapsed.has(did);
    const root=dao1TeamRootList().find(r=>Number(r.did)===did);
    const alias=dao1TeamAlias(did),displayName=alias||root?.wallet?.label||"";
    return `<li class="wt-team-li"><div class="wt-team-node ${level===0?"root":""} ${root?"own-wallet":""}">
      <div class="wt-team-node-title"><span class="wt-team-depth-badge">${level===0?"Leader":`Linie ${level}`}</span><span>DID #${did}</span>${root?'<span class="wt-team-own-badge">MEINE DID</span>':""}</div>
      ${displayName?`<div class="wt-team-node-name"><b>${escapeHtml(displayName)}</b></div>`:""}
      <div class="wt-team-wallet-row"><div class="wt-team-node-meta">${escapeHtml(teamShortAddress(wallet||root?.wallet_address||"–"))}</div>${dao1TeamCopyButtonHtml(wallet||root?.wallet_address||"")}</div>
      ${dao1TeamBotSummaryHtml(wallet||root?.wallet_address||"",did)}
      ${(()=>{const mint=dao1TeamMintEdge(did);return mint?.block?`<div class="wt-team-node-mint" data-dao1-mint-block="${Number(mint.block)}">DID Mint: wird geladen …</div>`:`<div class="wt-team-node-mint">DID Mint: nicht ermittelt</div>`;})()}
      ${level?`<div class="wt-team-node-parent">Upline: DID #${Number(node.parent_id||0)}</div>`:""}
      <div class="wt-team-alias-row"><span class="wt-team-alias-label">Name</span><input class="wt-team-alias-input" data-dao1-team-alias="${did}" value="${escapeHtml(alias)}" placeholder="Name / Alias"></div>
      <div class="wt-team-node-actions">${kids.length?`<button type="button" class="wt-team-toggle-btn" data-dao1-team-toggle="${did}">${collapsed?`+ ${kids.length} Partner anzeigen`:`− ${kids.length} Partner`}</button>`:""}<button type="button" class="wt-team-details-btn" data-dao1-team-details="${did}">Details</button></div>
    </div>${kids.length&&!collapsed&&level<DAO1_TEAM_MAX_LEVELS?`<ul class="wt-team-branch-children">${kids.map(k=>dao1TeamNodeHtml(k,childrenMap,level+1,rootDid,nextSeen)).join("")}</ul>`:""}</li>`;
  }

  function dao1TeamForestHtml(st){
    const children=new Map();for(const e of st.edges){if(!children.has(Number(e.parent_id)))children.set(Number(e.parent_id),[]);children.get(Number(e.parent_id)).push(e);}
    const selected=selectedDAO1DidRoots();if(!selected.length)return "";
    // Bei „Alle DIDs“ eigene DIDs, die bereits unter einer anderen eigenen DID liegen,
    // nicht nochmals als zweiter Baum duplizieren.
    const ownSet=new Set(selected.map(r=>Number(r.did)));
    const roots=selected.filter(r=>{const edge=st.edges.find(e=>Number(e.child_id)===Number(r.did));return !(edge&&ownSet.has(Number(edge.parent_id)));});
    const blocks=roots.map(r=>{
      const synthetic={child_id:r.did,parent_id:0,wallet:r.wallet_address,did:r.did};
      const direct=(children.get(Number(r.did))||[]).length;
      return `<section class="wt-team-tree-section"><div class="wt-team-tree-heading">DID #${r.did}${dao1TeamAlias(r.did,r.wallet_address)?` · ${escapeHtml(dao1TeamAlias(r.did,r.wallet_address))}`:""} <span class="meta">· ${direct} direkte Partner</span></div><div class="wt-team-tree"><ul class="wt-team-hierarchy">${dao1TeamNodeHtml(synthetic,children,0,r.did)}</ul></div></section>`;
    }).join("");
    return `<div class="custom-token-card wt-team-tree-card" style="margin-top:12px"><div class="wt-team-tree-info"><b>Darstellung:</b> Leader oben, Team nach unten. Verbindungen stammen ausschließlich aus den verifizierten ${dao1TeamTreeMode==="legacy"?"DID→fid":"APTMDAO child→parent"}-Mint-Kanten. Maximal ${DAO1_TEAM_MAX_LEVELS} Ebenen.</div>${blocks||'<div class="empty">Für die gewählte DID wurden keine Downline-Kanten gefunden.</div>'}</div>`;
  }

  function dao1WalletUplineRows(node){
    const rows=[];
    for(const [system,dids] of [["legacy",node.dao1Dids],["aptmdao",node.aptmdaoDids]]){
      for(const did of [...dids].sort((a,b)=>a-b)){
        const rel=(node.relations||[]).find(r=>r.system===system&&Number(r.childDid)===Number(did));
        const rawParent=rel?.parentDid ?? dao1KnownParentDid(system,did);
        if(rawParent==null)continue;
        const parent=Number(rawParent);
        if(parent>=0 && Number.isFinite(parent))rows.push({system,did:Number(did),parentDid:parent});
      }
    }
    return rows;
  }
  function dao1WalletRelationLabel(node){
    const rows=dao1WalletUplineRows(node);
    if(!rows.length)return node.own?"Oberster dargestellter Knoten":"Upline nicht ermittelt";
    return rows.map(r=>`${r.system==="aptmdao"?"APTMDAO":"DAO1"} #${r.did} → Upline #${r.parentDid}`).join(" · ");
  }
  function dao1WalletUplineHtml(node){
    const rows=dao1WalletUplineRows(node);
    if(!rows.length)return `<div class="wt-team-node-parent">${node.own?"Oberster dargestellter Knoten":"Upline nicht ermittelt"}</div>`;
    return rows.map(r=>`<div class="wt-team-node-parent"><b>${r.system==="aptmdao"?"APTMDAO":"DAO1"}-Upline:</b> DID #${r.parentDid}</div>`).join("");
  }
  function dao1WalletRelevantDidSet(node){
    // Alle DIDs, die über unsere geladenen Downline-Graphen zu diesem Wallet führen,
    // sind in der kombinierten Wallet-Sicht relevant. APTMDAO bestimmt nur die
    // Position des Knotens, nicht das Verstecken einer ebenfalls eigenen DAO1-Beziehung.
    // Eine APTMDAO-DID unter fremder Upline ist nicht Bestandteil unseres Subtrees und
    // landet deshalb gar nicht in aptmdaoDids.
    return new Set([...node.dao1Dids,...node.aptmdaoDids].map(Number));
  }
  function dao1WalletAliasEditorHtml(node){
    if(node?.own)return "";
    const aptm=[...node.aptmdaoDids].sort((a,b)=>a-b),legacy=[...node.dao1Dids].sort((a,b)=>a-b);
    const did=aptm[0]||legacy[0];if(!did)return "";const mode=aptm.length?"aptmdao":"legacy",value=dao1TeamAliasFor(did,mode)||"";
    return `<label class="field-label" style="display:block;margin-top:7px">Name / Alias<input type="text" value="${escapeAttr(value)}" placeholder="Partnername" data-dao1-team-alias="${did}" data-dao1-team-alias-mode="${mode}" style="margin-top:4px;width:100%"></label>`;
  }
  function dao1PartnerBotCountHtml(node){
    if(node?.own)return "";const st=dao1PartnerBotStats.get(lower(node.wallet));
    if(!st)return `<div class="wt-team-node-parent">Bots: <span class="meta">werden geladen …</span></div>`;
    return `<div class="wt-team-node-parent"><b>Mining-Bots:</b> ${Number(st.mining||0)} · <b>Trading-Bots:</b> ${Number(st.trading||0)}</div>`;
  }
  function dao1WalletNodeHtml(node,graph,level=0,seen=new Set()){
    const key=lower(node?.wallet||"");if(!key||seen.has(key))return "";
    const nextSeen=new Set(seen);nextSeen.add(key);const kids=(graph.children.get(key)||[]).filter(k=>!nextSeen.has(k.wallet));
    const collapseKey=`wallet:${key}`,collapsed=dao1TeamCollapsed.has(collapseKey);const name=dao1WalletDisplayName(node);
    const badges=`${node.dao1Dids.size?'<span class="wt-team-depth-badge">DAO1</span>':""}${node.aptmdaoDids.size?'<span class="wt-team-depth-badge" style="margin-left:4px">APTMDAO</span>':""}`;
    return `<li class="wt-team-li">${node.own?dao1ExternalUplineHtml(node,graph):""}<div class="wt-team-node ${level===0?"root":""} ${node.own?"own-wallet":""}">
      <div class="wt-team-node-title"><span class="wt-team-depth-badge">${level===0?"Leader":`Linie ${level}`}</span>${badges}${node.own?'<span class="wt-team-own-badge">MEINE WALLET</span>':""}</div>
      <div class="wt-team-node-name"><b>${escapeHtml(name)}</b></div>
      <div class="wt-team-wallet-row"><div class="wt-team-node-meta"><code>${escapeHtml(teamShortAddress(key))}</code></div>${dao1TeamCopyButtonHtml(key)}</div>
      ${dao1WalletDidListHtml(node)}
      ${dao1WalletAliasEditorHtml(node)}
      ${dao1PartnerBotCountHtml(node)}
      ${dao1WalletUplineHtml(node)}
      <div class="wt-team-node-actions">${kids.length?`<button type="button" class="wt-team-toggle-btn" data-dao1-wallet-toggle="${key}">${collapsed?`+ ${kids.length} Partner anzeigen`:`− ${kids.length} Partner`}</button>`:""}<button type="button" class="wt-team-details-btn" data-dao1-wallet-details="${key}">Details</button></div>
    </div>${kids.length&&!collapsed&&level<DAO1_TEAM_MAX_LEVELS?`<ul class="wt-team-branch-children">${kids.map(k=>dao1WalletNodeHtml(k,graph,level+1,nextSeen)).join("")}</ul>`:""}</li>`;
  }
  function dao1ExternalUplineRelations(node,graph){
    if(!node?.own)return [];
    const seen=new Set(),rows=[];
    for(const r of node.relations||[]){
      if(!(Number(r.parentDid)>0) || !r.parentWallet || graph.own.has(lower(r.parentWallet)))continue;
      const k=`${r.system}|${Number(r.parentDid)}|${lower(r.parentWallet)}`;if(seen.has(k))continue;seen.add(k);rows.push(r);
    }
    return rows.sort((a,b)=>String(a.system).localeCompare(String(b.system))||Number(a.parentDid)-Number(b.parentDid));
  }
  function dao1ExternalUplineHtml(node,graph){
    const rows=dao1ExternalUplineRelations(node,graph);if(!rows.length)return "";
    return `<div class="wt-team-upline-wrap"><div class="wt-team-upline-label">DIREKTE UPLINE${rows.length>1?"S":""} DES WALLET-ROOTS</div><div class="wt-team-upline-row">${rows.map(r=>{const pn=graph.nodes.get(lower(r.parentWallet));const label=pn?dao1WalletDisplayName(pn):"Upline-Wallet";return `<div class="wt-team-node wt-team-upline-node"><div class="wt-team-node-title"><span class="wt-team-depth-badge">UPLINE</span><span class="wt-team-depth-badge" style="margin-left:4px">${r.system==="aptmdao"?"APTMDAO":"DAO1"}</span></div><div class="wt-team-node-name"><b>${escapeHtml(label)}</b></div><div class="wt-team-wallet-row"><div class="wt-team-node-meta"><code>${escapeHtml(teamShortAddress(r.parentWallet))}</code></div>${dao1TeamCopyButtonHtml(r.parentWallet)}</div><div class="wt-team-wallet-dids"><div class="wt-team-did-row ${r.system==="aptmdao"?"aptmdao":"dao1"}"><span>${r.system==="aptmdao"?"APTMDAO-DID":"DAO1-DID"}:</span><strong>#${Number(r.parentDid)}</strong></div></div><div class="wt-team-node-parent">Upline von ${r.system==="aptmdao"?"APTMDAO":"DAO1"} #${Number(r.childDid)}</div></div>`;}).join("")}</div><div class="wt-team-upline-connector">↓</div></div>`;
  }

  function dao1WalletForestHtml(){
    const graph=dao1BuildWalletGraph();
    let roots=[...graph.nodes.values()].filter(n=>n.own&&!graph.childWallets.has(n.wallet));
    // Sicherheitsfallback bei unvollständigem Parent-Wallet-Mapping: ausschließlich eigene
    // Wallets als Einstieg zeigen. Geladene Ancestors dienen nur zur Upline-Auflösung und
    // dürfen niemals als zusätzliche Team-Roots unterhalb der persönlichen Sicht erscheinen.
    if(!roots.length)roots=[...graph.nodes.values()].filter(n=>n.own);
    const partnerCount=[...graph.nodes.values()].filter(n=>!n.own&&!n.upstream&&n.primary).length;
    if(!roots.length)return '<div class="custom-token-card" style="margin-top:12px"><div class="empty">Keine eigenen DAO-Wallets mit DID erkannt.</div></div>';
    const blocks=roots.map(r=>`<section class="wt-team-tree-section"><div class="wt-team-tree"><ul class="wt-team-hierarchy">${dao1WalletNodeHtml(r,graph,0,new Set())}</ul></div></section>`).join("");
    return `<div class="custom-token-card wt-team-tree-card" style="margin-top:12px"><div class="wt-team-tree-info"><b>Wallet-zentrierte Darstellung:</b> 1 Wallet = 1 Knoten. DAO1 und APTMDAO bleiben on-chain getrennt, werden hier aber in einem gemeinsamen Baum über ihre belegten DID-Uplines verbunden. Eigene Wallets bleiben sichtbar, zählen jedoch nicht als Partner. Bei zwei belegten Beziehungen bestimmt APTMDAO die grafische Position.</div><div class="project-summary" style="margin-top:10px"><div class="custom-token-card project-summary-box"><span class="field-label">Eindeutige Partner-Wallets</span><strong>${partnerCount.toLocaleString("de-DE")}</strong></div></div>${blocks}</div>`;
  }
  function dao1WalletDetailsHtml(node,graph){
    const relevant=dao1WalletRelevantDidSet(node),r=node.primary,kids=(graph.children.get(node.wallet)||[]).length;
    return `<div class="wt-team-details-modal open" id="dao1TeamDetailsModal"><div class="wt-team-details-dialog"><div class="wt-team-details-head"><div><strong>${escapeHtml(dao1WalletDisplayName(node))}</strong><div class="meta">${escapeHtml(node.wallet)}</div></div><button type="button" class="wt-team-details-close" onclick="document.getElementById('dao1TeamDetailsModal')?.remove()">×</button></div><div class="wt-team-details-body"><div class="project-summary"><div class="custom-token-card project-summary-box"><span class="field-label">DAO1-DIDs</span><strong>${node.dao1Dids.size?[...node.dao1Dids].sort((a,b)=>a-b).map(x=>`#${x}`).join(", "):"–"}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">APTMDAO-DIDs</span><strong>${node.aptmdaoDids.size?[...node.aptmdaoDids].sort((a,b)=>a-b).map(x=>`#${x}`).join(", "):"–"}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">Upline / Hauptbeziehung</span><strong>${escapeHtml(dao1WalletRelationLabel(node))}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">Direkte Partner-Wallets</span><strong>${kids}</strong></div></div><h4 style="margin:18px 0 8px">Aktueller NFT-/Bot-Bestand dieses Wallets</h4><div data-dao1-wallet-assets data-relevant-dids="${[...relevant].join(",")}"><div class="status info"><strong>NFTs / Bots werden on-chain geladen …</strong></div></div><div class="note" style="margin-top:12px">Bots werden nicht anhand des heutigen Wallet-Inhalts einem Zweig zugerechnet. Bei neuen MinerBot-Käufen wird die im Kaufaufruf verwendete APTMDAO-DID ausgewertet; ältere Fälle verwenden nur belastbare historische Evidenz.</div></div></div></div>`;
  }

  function dao1TeamDetailsHtml(did,st){
    did=Number(did);const edge=dao1TeamMintEdge(did,st);const root=dao1TeamRootList().find(r=>Number(r.did)===did);
    const wallet=edge?.wallet||root?.wallet_address||"";const kids=st.edges.filter(e=>Number(e.parent_id)===did).length;
    const nfts=[],membership="wird bei Details geprüft";
    return `<div class="wt-team-details-modal open" id="dao1TeamDetailsModal"><div class="wt-team-details-dialog"><div class="wt-team-details-head"><div><strong>DID #${did}${dao1TeamAlias(did,wallet)?` · ${escapeHtml(dao1TeamAlias(did,wallet))}`:""}</strong><div class="meta">${escapeHtml(wallet||"Wallet nicht ermittelt")}</div></div><button type="button" class="wt-team-details-close" onclick="document.getElementById('dao1TeamDetailsModal')?.remove()">×</button></div><div class="wt-team-details-body"><div class="project-summary"><div class="custom-token-card project-summary-box"><span class="field-label">Upline</span><strong>${edge?`DID #${edge.parent_id}`:"Root / außerhalb Auswahl"}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">Direkte Partner</span><strong>${kids}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">DID Mint</span><strong data-dao1-mint-block="${Number(edge?.block||0)}">${edge?.block?"wird geladen …":"nicht ermittelt"}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">Membership</span><strong data-dao1-membership>${escapeHtml(membership)}</strong></div></div>${edge?`<div class="wt-team-tree-info" style="margin-top:12px"><b>Mint-Nachweis:</b> Block ${Number(edge.block||0).toLocaleString("de-DE")} · ${edge.tx_hash?`<a href="${EXPLORER}/tx/${edge.tx_hash}" target="_blank" rel="noopener">Transaktion öffnen</a>`:"–"}</div>`:""}<h4 style="margin:18px 0 8px">NFTs / Bots</h4><div data-dao1-partner-assets>${dao1TeamNftTableHtml(nfts)}</div><div class="note" style="margin-top:12px">Kaufdatum/-preis und Referral Rewards werden nur angezeigt, wenn sie aus den vorhandenen bzw. on-chain verifizierten Daten belastbar hervorgehen. Fremde Partner-Wallets werden nicht aufgrund von Annahmen klassifiziert.</div></div></div></div>`;
  }

  function dao1MergeWalletBotCandidates(rows){
    const by=new Map();
    for(const src of rows||[]){
      if(!src)continue;const key=`${lower(src.contract)}|${String(src.id)}`;const old=by.get(key);
      if(!old){by.set(key,{...src});continue;}
      // Historische Erwerbsdaten bleiben erhalten; Live-/Ownership-Daten dürfen dagegen
      // den heutigen Owner und current-Status aktualisieren. Kein first-wins-Dedup mehr.
      const merged={...src,...old};
      for(const k of ["owned_from_at","owned_from_block","acquisition_verified","acquisition_kind","acquisition_tx_hash","purchase","acquisition_wallet","source_wallet","assigned_system","assigned_did","assigned_parent_did","assignment_type"])if(old[k]!=null&&old[k]!==""&&old[k]!==false)merged[k]=old[k];
      if(src.current===true){merged.current=true;merged.current_wallet=lower(src.current_wallet||src.wallet||merged.current_wallet||"");}
      else if(old.current===true){merged.current=true;merged.current_wallet=lower(old.current_wallet||old.wallet||merged.current_wallet||"");}
      else merged.current=false;
      if(src.current_wallet)merged.current_wallet=lower(src.current_wallet);
      by.set(key,merged);
    }
    return [...by.values()];
  }

  function dao1BindDetailsModalEscape(modal){
    if(!modal)return;const esc=e=>{if(e.key==="Escape"&&modal.isConnected){modal.remove();document.removeEventListener("keydown",esc);}};
    document.addEventListener("keydown",esc,{passive:true});
  }
  function dao1BotStatsFromRows(rows,{currentOnly=false}={}){let mining=0,trading=0;for(const n of rows||[]){if(currentOnly&&n.current!==true)continue;const t=String(n.subtype||n.bot_type||n.name||"").toLowerCase();if(t.includes("trading"))trading++;else if(t.includes("min")||t.includes("solar"))mining++;}return {mining,trading,loadedAt:new Date().toISOString()};}
  function dao1CurrentBotRowsFromOwnership(wallet){
    const a=lower(wallet||"");if(!a)return [];
    const out=new Map();
    const projectWallet=projectWallets().find(w=>lower(walletAddress(w))===a);
    const walletId=projectWallet?String(projectWallet.dbId||projectWallet.id):"";
    if(walletId){
      for(const n of (window.getCachedNftsForWalletId?.(walletId)||[])){
        if(String(n?.chain||"")!==CHAIN_KEY||n?.possibleSpam||n?.userMarkedSpam)continue;
        const contract=lower(n?.tokenAddress||""),id=String(n?.tokenId??"");if(!contract||!id)continue;
        const cls=classificationFor(contract,id);
        const name=cls?.nft_name||n?.name||n?.collectionName||`NFT #${id}`;
        const subtype=dao1TeamProjectNftSubtype(contract,id,name,n?.collectionName||"");
        if(!["Mining-Bot","Trading-Bot"].includes(subtype))continue;
        out.set(`${contract}|${id}`,{id,contract,name,collection:n?.collectionName||"",subtype,current:true,current_wallet:a,owned_from_at:null,owned_from_block:0,acquisition_verified:false,acquisition_kind:null,acquisition_tx_hash:null,purchase:n?.purchaseEvidence?.purchase||null});
      }
    }
    for(const o of ownershipRows||[]){
      if(!o?.is_current)continue;
      const owner=lower(o.wallet_address||walletAddress(walletByDbId(o.wallet_id))||"");
      if(owner!==a)continue;
      const contract=lower(o.nft_contract||""),id=String(o.nft_id),key=`${contract}|${id}`;
      const cls=classificationFor(contract,id),existing=out.get(key);
      const name=existing?.name||cls?.nft_name||o.nft_name||nftMetaById.get(key)?.name||`NFT #${id}`;
      const subtype=existing?.subtype||dao1TeamProjectNftSubtype(contract,id,name,existing?.collection||"");
      if(!["Mining-Bot","Trading-Bot"].includes(subtype))continue;
      out.set(key,{...(existing||{}),id,contract,name,subtype,current:true,current_wallet:a,owned_from_at:o.owned_from_at||existing?.owned_from_at||null,owned_from_block:Number(o.owned_from_block||0)||Number(existing?.owned_from_block||0)||0,acquisition_verified:!!o.acquisition_verified,acquisition_kind:o.acquisition_kind||existing?.acquisition_kind||null,acquisition_tx_hash:o.acquisition_tx_hash||existing?.acquisition_tx_hash||null,purchase:existing?.purchase||null});
    }
    return [...out.values()];
  }
  async function dao1WalletHash(wallet){const bytes=new TextEncoder().encode(lower(wallet));const buf=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");}
  async function dao1LoadPartnerBotStatsCache(){
    if(dao1PartnerBotCacheLoaded||!sb||!getContext?.()?.currentUser)return;dao1PartnerBotCacheLoaded=true;
    // Lifecycle = Erwerbshistorie, nicht aktueller Bestand. Daraus duerfen keine
    // Bot-Anzahlen der Kachel abgeleitet werden. Der aktuelle Bestand wird gezielt
    // aus den ERC-721-Transfers der bekannten Bot-Contracts rekonstruiert.
    try{const {error}=await sb.from("dao_partner_bot_lifecycle_cache").select("wallet_address").eq("user_id",getContext().currentUser.id).eq("project_key",PROJECT_KEY).limit(1);if(error)throw error;}catch(e){console.warn("DAO Partner-Bot Statistik-Cache",e);}
  }
  function dao1PartnerBotDueFromState(hash,data){
    const age=data?.last_scanned_at?Date.now()-new Date(data.last_scanned_at).getTime():Infinity;
    return {due:!data||data.status!=="ok"||age>=86400000,hash};
  }
  async function dao1PrefetchPartnerBotScanStates(wallets){
    const uid=getContext?.()?.currentUser?.id;if(!uid||!wallets?.length)return;
    const pairs=await Promise.all(wallets.map(async wallet=>({wallet:lower(wallet),hash:await dao1WalletHash(wallet)})));
    const missing=pairs.filter(x=>!dao1PartnerBotScanStateCache.has(x.hash));if(!missing.length)return;
    try{
      const {data,error}=await sb.from("dao_partner_bot_scan_state").select("wallet_hash,last_scanned_at,status").eq("user_id",uid).eq("project_key",PROJECT_KEY).in("wallet_hash",missing.map(x=>x.hash));
      if(error)throw error;const by=new Map((data||[]).map(r=>[String(r.wallet_hash||""),r]));
      for(const x of missing)dao1PartnerBotScanStateCache.set(x.hash,by.get(x.hash)||null);
    }catch(e){console.warn("DAO Partner-Bot Scan-State Prefetch",e);}
  }
  async function dao1PartnerBotScanDue(wallet){
    const hash=await dao1WalletHash(wallet),uid=getContext?.()?.currentUser?.id;if(!uid)return {due:false,hash};
    if(dao1PartnerBotScanStateCache.has(hash))return dao1PartnerBotDueFromState(hash,dao1PartnerBotScanStateCache.get(hash));
    try{const {data,error}=await sb.from("dao_partner_bot_scan_state").select("last_scanned_at,status").eq("user_id",uid).eq("project_key",PROJECT_KEY).eq("wallet_hash",hash).maybeSingle();if(error)throw error;dao1PartnerBotScanStateCache.set(hash,data||null);return dao1PartnerBotDueFromState(hash,data||null);}catch(e){console.warn("DAO Partner-Bot Scan-State",e);return {due:true,hash};}
  }
  async function dao1SavePartnerBotScanState(hash,status,errorText=""){
    const uid=getContext?.()?.currentUser?.id;if(!uid)return;const now=new Date().toISOString();try{await sb.from("dao_partner_bot_scan_state").upsert({user_id:uid,project_key:PROJECT_KEY,wallet_hash:hash,last_scanned_at:now,status,last_error:errorText||null,updated_at:now},{onConflict:"user_id,project_key,wallet_hash"});dao1PartnerBotScanStateCache.set(hash,{last_scanned_at:now,status});}catch(e){console.warn("DAO Partner-Bot Scan-State speichern",e);}
  }
  async function dao1RefreshOnePartnerBotsCore(node){
    const wallet=lower(node.wallet),hadIdentity=dao1PartnerIdentityStats.has(wallet),hadStats=dao1PartnerBotStats.has(wallet);
    try{
      // Die Kachel braucht bei jedem frischen Seitenlauf den aktuellen NFT-Besitz. Das ist
      // bewusst unabhaengig vom 24h-Lifecycle-Scan: Transferhistorien der bekannten
      // Contracts sind gecacht/inkrementell und Kaufpreis-Evidenz wird hier nicht verlangt.
      // Identity und Bot-Bestand sind zwei unabhaengige aktuelle Bestandsfragen.
      // Besonders wichtig fuer Wallets mit alter + neuer DID: ein langsamer Legacy-DID-
      // Transferlauf darf weder Mining-/Trading-Bots noch APTMDAO-DID blockieren.
      const identityJob=hadIdentity?Promise.resolve():dao1TeamFetchPartnerIdentity(wallet);
      // Sofort aus der zentralen Ownership-Quelle zaehlen. Genau diese Quelle kennt auch
      // klassifizierte Trading-Bots des NFT-Bereichs; historische Kauf-/DID-Logik ist hier tabu.
      const centralCurrent=dao1CurrentBotRowsFromOwnership(wallet);
      if(centralCurrent.length){
        dao1PartnerBotStats.set(wallet,dao1BotStatsFromRows(centralCurrent,{currentOnly:true}));
        dao1PartnerRerenderIfVisible();
      }
      const nftJob=dao1TeamFetchPartnerNfts(wallet,"wallet");
      const fetched=(await nftJob).filter(n=>dao1TeamIsBot(n)&&!dao1TeamIsIdentityNft(n));
      let nfts=[...new Map([...centralCurrent,...fetched].map(n=>[`${lower(n.contract)}|${n.id}`,n])).values()];
      dao1PartnerBotStats.set(wallet,dao1BotStatsFromRows(nfts,{currentOnly:true}));
      dao1PartnerRerenderIfVisible();
      await identityJob;
      const due=await dao1PartnerBotScanDue(wallet);
      if(!due.due)return !hadIdentity||!hadStats;
      let cursor=0;async function worker(){while(cursor<nfts.length){const n=nfts[cursor++],acq=await dao1TeamAcquisitionForNft(n,wallet);if(acq.at&&!n.owned_from_at)n.owned_from_at=acq.at;if(acq.txHash){n.acquisition_tx_hash=acq.txHash;n.acquisition_verified=true;}if(acq.purchase)n.purchase=acq.purchase;if(acq.sourceWallet)n.source_wallet=acq.sourceWallet;if(acq.acquisitionKind)n.acquisition_kind=acq.acquisitionKind;const a=await dao1TeamResolveBotAssignment(n,wallet,acq);n.assigned_system=a.system;n.assigned_did=a.did;n.assignment_type=a.type;n.assigned_parent_did=a.parentDid||0;}}
      await Promise.all(Array.from({length:Math.min(2,nfts.length)},worker));await Promise.all(nfts.filter(n=>n.assigned_system&&n.assigned_did).map(n=>saveDAO1PartnerBotLifecycle(n,wallet)));await dao1SavePartnerBotScanState(due.hash,"ok");return true;
    }catch(e){
      try{const due=await dao1PartnerBotScanDue(wallet);await dao1SavePartnerBotScanState(due.hash,"error",String(e?.message||e).slice(0,500));}catch(_){}
      console.warn("DAO Partner-Bot Refresh",wallet,e);return false;
    }
  }

  async function dao1RefreshOnePartnerBots(node){
    const wallet=lower(node?.wallet||"");if(!wallet)return false;
    if(dao1PartnerBotRefreshInflight.has(wallet))return dao1PartnerBotRefreshInflight.get(wallet);
    const job=dao1RefreshOnePartnerBotsCore(node);dao1PartnerBotRefreshInflight.set(wallet,job);
    try{return await job;}finally{dao1PartnerBotRefreshInflight.delete(wallet);}
  }

  async function dao1EnsurePartnerBots(graph){
    if(dao1PartnerBotRefreshRunning)return;dao1PartnerBotRefreshRunning=true;try{await dao1LoadPartnerBotStatsCache();const partners=[...graph.nodes.values()].filter(n=>!n.own&&!n.upstream&&n.primary);await dao1PrefetchPartnerBotScanStates(partners.map(n=>n.wallet));let changed=false;for(let i=0;i<partners.length;i+=3){const batch=partners.slice(i,i+3);const r=await Promise.all(batch.map(dao1RefreshOnePartnerBots));changed=r.some(Boolean)||changed;if(changed&&document.getElementById("dao1TeamTreePanel"))renderDAO1TeamTreePanel();await new Promise(res=>setTimeout(res,0));}}finally{dao1PartnerBotRefreshRunning=false;}
  }

  function bindDAO1TeamTreeControls(st){
    const host=document.getElementById("dao1TeamTreePanel");if(!host)return;
    host.querySelectorAll("[data-dao1-team-alias]").forEach(inp=>inp.addEventListener("change",()=>saveDAO1TeamAlias(inp.dataset.dao1TeamAlias,inp.value,inp,inp.dataset.dao1TeamAliasMode||dao1TeamTreeMode)));
    host.querySelectorAll("[data-dao1-copy-wallet]").forEach(btn=>btn.addEventListener("click",async()=>{
      const wallet=btn.dataset.dao1CopyWallet||"";try{await navigator.clipboard.writeText(wallet);}catch(_){const ta=document.createElement("textarea");ta.value=wallet;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();}
      const old=btn.title;btn.title="Kopiert";btn.setAttribute("aria-label","Kopiert");setTimeout(()=>{btn.title=old;btn.setAttribute("aria-label","Wallet-Adresse kopieren");},1200);
    }));
    host.querySelectorAll("[data-dao1-wallet-toggle]").forEach(btn=>btn.addEventListener("click",()=>{const key=`wallet:${lower(btn.dataset.dao1WalletToggle||"")}`;dao1TeamCollapsed.has(key)?dao1TeamCollapsed.delete(key):dao1TeamCollapsed.add(key);renderDAO1TeamTreePanel();}));
    host.querySelectorAll("[data-dao1-wallet-details]").forEach(btn=>btn.addEventListener("click",async()=>{
      const wallet=lower(btn.dataset.dao1WalletDetails||""),graph=dao1BuildWalletGraph(),node=graph.nodes.get(wallet);if(!node)return;
      document.getElementById("dao1TeamDetailsModal")?.remove();document.body.insertAdjacentHTML("beforeend",dao1WalletDetailsHtml(node,graph));
      const modal=document.getElementById("dao1TeamDetailsModal");if(modal){modal.addEventListener("click",e=>{if(e.target===modal)modal.remove();});dao1BindDetailsModalEscape(modal);}
      const area=modal?.querySelector("[data-dao1-wallet-assets]");if(!area)return;
      try{
        // Bei eigenen Wallets hat der historische Ersterwerbsdatensatz Vorrang vor dem
        // heutigen Wallet-Snapshot. Nur so bleiben ursprüngliches Kauf-Wallet, Kauf-Tx und
        // Kaufpreis nach einem internen NFT-Transfer erhalten. Live/Current-Daten ergänzen
        // anschließend nur noch Bots, die in der Historie noch nicht vorhanden sind.
        const historicalOwn=node.own?dao1TeamOwnHistoricalBotCandidates():[];
        const centralCurrent=node.own?dao1CurrentBotRowsFromOwnership(wallet):[];
        const known=dao1TeamKnownNfts(wallet);
        // Single Source of Truth für eigene Wallets: zentraler NFT-/Ownership-Cache.
        // Der Team-Baum startet keine zweite NFT-Discovery. Nur für fremde Partner, die
        // nicht im User-NFT-Bestand liegen, bleibt die gezielte Partnerabfrage erlaubt.
        const live=node.own?[]:(await dao1TeamFetchPartnerNfts(wallet,"wallet")).map(n=>({...n,current_wallet:n.current?wallet:(n.current_wallet||"")}));
        // Reihenfolge ist absichtlich egal: der Merge kombiniert historische Erwerbsdaten
        // mit dem aktuellen Owner-Status, statt den ersten Datensatz je NFT zu behalten.
        let nfts=dao1MergeWalletBotCandidates([...historicalOwn,...centralCurrent,...known,...live].filter(n=>dao1TeamIsBot(n)&&!dao1TeamIsIdentityNft(n)));
        let cursor=0;async function worker(){while(cursor<nfts.length){const n=nfts[cursor++],acquisitionWallet=lower(n.acquisition_wallet||wallet),acq=await dao1TeamAcquisitionForNft(n,acquisitionWallet);if(acq.at&&!n.owned_from_at)n.owned_from_at=acq.at;if(acq.txHash){n.acquisition_tx_hash=acq.txHash;n.acquisition_verified=true;}if(acq.purchase)n.purchase=acq.purchase;if(acq.sourceWallet)n.source_wallet=acq.sourceWallet;if(acq.acquisitionKind)n.acquisition_kind=acq.acquisitionKind;const assignment=await dao1TeamResolveBotAssignment(n,acquisitionWallet,acq);n.assigned_system=assignment.system;n.assigned_did=assignment.did;n.assignment_type=assignment.type;n.assigned_parent_did=assignment.parentDid||0;}}
        await Promise.all(Array.from({length:Math.min(2,nfts.length)},worker));
        await Promise.all(nfts.filter(n=>n.assigned_system&&n.assigned_did).map(n=>saveDAO1PartnerBotLifecycle(n,lower(n.acquisition_wallet||wallet))));
        const relevant=dao1WalletRelevantDidSet(node);
        const related=nfts.filter(n=>n.assigned_did&&relevant.has(Number(n.assigned_did)));
        // Eigene Wallets: aktueller Bestand ausschließlich beim heutigen Owner. Bots, die
        // hier gekauft und später auf eine andere eigene Wallet übertragen wurden, bleiben
        // darunter als einklappbare Historie sichtbar. Bei fremden Partnern bleibt die
        // bestehende current-Information maßgebend.
        const current=(node.own?related:nfts).filter(n=>{
          if(!n.current)return false;
          const owner=lower(n.current_wallet||wallet);
          return !owner||owner===wallet;
        });
        // Erhaltene Transfers auf eigene Wallets gehören zum aktuellen Bestand, auch wenn
        // ihre ursprüngliche DID außerhalb des heutigen Knotens lag. Die historische
        // Zuordnung wird dadurch nicht umgeschrieben.
        if(node.own){
          for(const n of nfts){
            const owner=lower(n.current_wallet||"");
            if(n.current&&owner===wallet&&!current.some(x=>lower(x.contract)===lower(n.contract)&&String(x.id)===String(n.id)))current.push(n);
          }
        }
        const historical=node.own?related.filter(n=>lower(n.acquisition_wallet||"")===wallet&&(!n.current||lower(n.current_wallet||"")!==wallet)):[];
        area.innerHTML=dao1TeamNftTableHtml(current,{emptyText:"Auf diesem Wallet befinden sich aktuell keine zugeordneten Bots."})+
          (historical.length?`<details class="custom-token-card" style="margin-top:12px"><summary style="cursor:pointer;font-weight:800">Frühere Bots / übertragen (${historical.length})</summary><div class="note" style="margin:8px 0">Historische Käufe dieses Wallets, die heute nicht mehr hier liegen. Kaufdaten und Kaufpreise bleiben erhalten.</div>${dao1TeamNftTableHtml(historical,{showTotals:false})}</details>`:"");
      }catch(e){console.warn("DAO Wallet-Partnerdetails",e);area.innerHTML=`<div class="status warn"><strong>Partner-Bots konnten nicht geladen werden.</strong><div class="note">${escapeHtml(e?.message||e)}</div></div>`;}
    }));
    host.querySelectorAll("[data-dao1-team-toggle]").forEach(btn=>btn.addEventListener("click",()=>{const did=Number(btn.dataset.dao1TeamToggle);dao1TeamCollapsed.has(did)?dao1TeamCollapsed.delete(did):dao1TeamCollapsed.add(did);renderDAO1TeamTreePanel();}));
    host.querySelectorAll("[data-dao1-team-details]").forEach(btn=>btn.addEventListener("click",async()=>{
      const did=Number(btn.dataset.dao1TeamDetails);document.getElementById("dao1TeamDetailsModal")?.remove();document.body.insertAdjacentHTML("beforeend",dao1TeamDetailsHtml(did,st));
      const modal=document.getElementById("dao1TeamDetailsModal");hydrateDAO1TeamMintDates(modal,st);
      if(modal){
        modal.addEventListener("click",e=>{if(e.target===modal)modal.remove();});
        dao1BindDetailsModalEscape(modal);
      }
      const edge=dao1TeamMintEdge(did,st),root=dao1TeamRootList().find(r=>Number(r.did)===did),wallet=edge?.wallet||root?.wallet_address||"";
      const area=modal?.querySelector("[data-dao1-partner-assets]");if(!area||!wallet)return;
      area.innerHTML='<div class="status info"><strong>NFTs / Bots werden on-chain geladen …</strong></div>';
      try{
        let nfts=dao1TeamKnownNfts(wallet);
        // Bei EIGENEN DIDs zusätzlich alle historisch bekannten eigenen Bots einbeziehen.
        // Ein Bot kann nach dem Kauf auf eine andere Wallet verschoben worden sein; die
        // aktuelle DID-Wallet darf ihn deshalb nicht aus der Kandidatenmenge ausschließen.
        const historicalOwnBots=root?dao1TeamOwnHistoricalBotCandidates():[];
        // Nur bekannte Bot-Contracts werden gezielt nachgeladen; kein breiter Wallet-NFT-Scan.
        const live=await dao1TeamFetchPartnerNfts(wallet,dao1TeamTreeMode);
        const by=new Map([...nfts,...live,...historicalOwnBots].map(n=>[`${lower(n.contract)}|${n.id}`,n]));nfts=[...by.values()];
        const membershipSource=[...nfts];
        // Identitäts-NFTs und Membership-Zeilen gehören nicht in die Tabelle „NFTs / Bots“.
        // Die Membership wird ausschließlich in der separaten Kachel oben dargestellt.
        nfts=nfts.filter(n=>dao1TeamIsBot(n)&&!dao1TeamIsIdentityNft(n));
        let acqCursor=0;
        async function acqWorker(){
          while(acqCursor<nfts.length){
            const n=nfts[acqCursor++];
            if(!dao1TeamIsBot(n))continue;
            const acquisitionWallet=lower(n.acquisition_wallet||wallet);
            const acq=await dao1TeamAcquisitionForNft(n,acquisitionWallet);
            if(acq.at&&!n.owned_from_at)n.owned_from_at=acq.at;
            if(acq.txHash){n.acquisition_tx_hash=acq.txHash;n.acquisition_verified=true;}
            if(acq.purchase)n.purchase=acq.purchase;
            if(acq.sourceWallet)n.source_wallet=acq.sourceWallet;
            if(acq.acquisitionKind)n.acquisition_kind=acq.acquisitionKind;
            if(n.acquisition_kind==="transfer"&&walletByAddress(n.source_wallet))n.acquisition_kind="own_transfer";
            const assignment=await dao1TeamResolveBotAssignment(n,acquisitionWallet,acq);
            n.assigned_system=assignment.system;
            n.assigned_did=assignment.did;
            n.assignment_type=assignment.type;
            n.system_evidence=acq.systemEvidence||null;
            n.system_evidence_type=acq.systemEvidenceType||null;
          }
        }
        await Promise.all(Array.from({length:Math.min(2,nfts.length)},acqWorker));
        await Promise.all(nfts.filter(n=>dao1TeamIsBot(n)&&n.assigned_system&&n.assigned_did).map(n=>saveDAO1PartnerBotLifecycle(n,lower(n.acquisition_wallet||wallet))));
        nfts=nfts.filter(n=>dao1TeamNftMatchesMode(n,dao1TeamTreeMode,did));
        const detailCacheKey=`did:${dao1TeamTreeMode}:${did}:${lower(wallet)}`;
        dao1TeamPartnerDetailsCache.set(detailCacheKey,{nfts:[...nfts],loadedAt:Date.now()});
        area.innerHTML=dao1TeamNftTableHtml(nfts);
        const counts=new Map();for(const n of nfts){if(dao1TeamIsBot(n)&&n.current)counts.set(n.subtype,(counts.get(n.subtype)||0)+1);}
        document.querySelectorAll(`[data-dao1-bot-summary="${lower(wallet)}"][data-dao1-bot-summary-did="${did}"]`).forEach(el=>{el.innerHTML=[...counts.entries()].map(([t,c])=>`${escapeHtml(t)}: <strong>${c}</strong>`).join(" · ");});
        const membershipEl=modal?.querySelector("[data-dao1-membership]");if(membershipEl)membershipEl.textContent=dao1TeamMembershipLabel(membershipSource);
      }catch(e){console.warn("DAO1 Team Partnerdetails",e);area.innerHTML=`<div class="status warn"><strong>Partner-NFTs konnten nicht geladen werden.</strong><div class="note">${escapeHtml(e?.message||e)}</div></div>`;}
    }));
    hydrateDAO1TeamMintDates(host,st);
    // Sichtbare Bot-Zahlen ausschließlich aus vorhandenem Cache hydratisieren.
    // Kein Explorer-Scan beim Rendern/Scrollen des Trees; Live-Prüfung nur in den Details.
    queueMicrotask(()=>hydrateDAO1VisiblePartnerBotSummaries(host));
  }

  let dao1VisiblePartnerHydrationRun=0;
  async function hydrateDAO1VisiblePartnerBotSummaries(host){
    // Cache-first: das Rendern/Scrollen des Team-Baums darf keinen Explorer-Fächer auslösen.
    // Live-Discovery erfolgt gezielt beim Öffnen der Partnerdetails und wird danach persistent gecacht.
    ++dao1VisiblePartnerHydrationRun;
    for(const el of [...(host||document).querySelectorAll('[data-dao1-bot-summary]')]){
      const wallet=lower(el.dataset.dao1BotSummary||""),did=Number(el.dataset.dao1BotSummaryDid||0);
      const cached=dao1TeamPartnerDetailsCache.get(`did:${dao1TeamTreeMode}:${did}:${wallet}`);
      const nfts=(cached?.nfts||[]).filter(n=>dao1TeamNftMatchesMode(n,dao1TeamTreeMode,did));
      const counts=new Map();for(const n of nfts){if(dao1TeamIsBot(n)&&n.current)counts.set(n.subtype,(counts.get(n.subtype)||0)+1);}
      el.innerHTML=counts.size?[...counts.entries()].map(([t,c])=>`${escapeHtml(t)}: <strong>${c}</strong>`).join(" · "):"";
    }
  }


  function teamDiscoveryTableHtml(st,isOld){
    if(!st.edges.length)return "";
    if(!dao1TeamRootList().length)return `<div class="custom-token-card" style="margin-top:12px"><div class="note">Keine eigene ${isOld?"DAO1-DID":"APTMDAO-ID"}-Root aus dem aktuellen DAO-Wallet-/NFT-Bestand verfügbar.</div></div>`;
    const rows=legacyTreeRows(st.edges).slice(0,500);
    return `${dao1TeamForestHtml(st)}<details class="custom-token-card debug-frame" style="margin-top:12px"><summary style="cursor:pointer;font-weight:800">DEV / Diagnose · verifizierte child→parent-Kanten</summary><div class="chain-table-wrap project-data-table" style="margin-top:10px;max-height:620px;overflow:auto"><table><thead><tr><th>Root</th><th>Ebene</th><th>DID</th><th>Parent / fid</th><th>Wallet</th><th>Block</th><th>Mint-Tx</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>#${r.root_did}</strong></td><td>${r.level}</td><td><strong>#${r.child_id}</strong></td><td>#${r.parent_id}</td><td><code>${teamShortAddress(r.wallet)}</code></td><td>${Number(r.block||0).toLocaleString("de-DE")}</td><td>${r.tx_hash?`<a href="${EXPLORER}/tx/${r.tx_hash}" target="_blank" rel="noopener">${r.tx_hash.slice(0,12)}…</a>`:"–"}</td></tr>`).join("")}</tbody></table></div></details>`;
  }


  function setDAO1TeamTreeMode(mode,button){
    dao1TeamTreeMode=mode==="aptmdao"?"aptmdao":(mode==="legacy"?"legacy":"wallet");
    if(dao1TeamTreeMode!=="wallet"&&dao1TeamRootFilter!=="__all"&&!dao1TeamRootList().some(r=>String(r.did)===String(dao1TeamRootFilter)))dao1TeamRootFilter="__all";
    document.querySelectorAll("#dao1TeamTreeTabs .tab-btn").forEach(x=>x.classList.remove("active"));
    button?.classList.add("active");
    const rootArea=document.getElementById("dao1TeamRootArea");if(rootArea)rootArea.innerHTML=teamOwnedRootCardsHtml();
    renderDAO1TeamTreePanel();
    if((dao1TeamTreeMode==="legacy"||dao1TeamTreeMode==="wallet")&&dao1OwnedDidRoots.length&&!dao1TeamDiscovery.legacy.running&&!dao1TeamDiscovery.legacy.edges.length)scanOldDao1Tree({checkChain:true}).catch(e=>console.warn("DAO1 Team Auto-Discovery",e));
    if((dao1TeamTreeMode==="aptmdao"||dao1TeamTreeMode==="wallet")&&aptmdaoOwnedDidRoots.length&&!dao1TeamDiscovery.aptmdao.running&&!dao1TeamDiscovery.aptmdao.edges.length)scanAptmdaoTree({checkChain:true}).catch(e=>console.warn("APTMDAO Team Auto-Discovery",e));
  }


  async function renderDAO1TeamTab(){
    const el=document.getElementById("dao1TeamContent");if(!el)return;
    // Phase 5.79: DAO Team besitzt nur noch eine normale User-Ansicht.
    // Die beiden on-chain Graphen bleiben intern getrennt, werden in der UI aber
    // ausschließlich wallet-zentriert zusammengeführt (1 Wallet = 1 Partner).
    dao1TeamTreeMode="wallet";
    // Wichtig: nie vor dem ersten Rendern auf DB/RPC/NFT-Cache warten. Genau das
    // führte bisher zum komplett leeren Team-Tab.
    el.innerHTML=`<div class="custom-token-card">
      <div class="chain-title">🌳 DAO Team</div>
      <div class="note"><strong>1 Wallet = 1 Partner.</strong> Alle erreichbaren DAO1-/APTMDAO-DIDs eines Wallets werden in diesem Team-Baum zusammengefasst. Die beiden on-chain Graphen bleiben intern getrennt und belegbar; separate DAO1-/APTMDAO-Diagnoseansichten gehören nicht zur normalen User-Oberfläche.</div>
      <div id="dao1TeamRootArea"><div class="status info" style="margin-top:12px"><strong>Eigene DAO-Wallets / DIDs werden aus dem gespeicherten Ownership-Bestand ermittelt …</strong></div></div>
      <div id="dao1TeamTreePanel"></div>
    </div>`;
    renderDAO1TeamTreePanel();
    try{
      // Frisch aus Supabase laden, damit die Team-Ansicht nicht von der Reihenfolge
      // des allgemeinen DAO1-Initial-Ladevorgangs abhängt.
      if(!dao1TeamAliasesLoaded) await loadDAO1TeamAliases();
      await loadOwnershipCache();
      await loadDAO1OwnedDidRoots(false);
      const rootArea=document.getElementById("dao1TeamRootArea");
      if(rootArea)rootArea.innerHTML=teamOwnedRootCardsHtml();
      renderDAO1TeamTreePanel();

      // NFT-Cache nur als Hintergrund-Fallback. Er blockiert die Root-Anzeige nie.
      loadDAO1OwnedDidRoots(true).then(()=>{
        const a=document.getElementById("dao1TeamRootArea");if(a)a.innerHTML=teamOwnedRootCardsHtml();
        renderDAO1TeamTreePanel();
        if((dao1TeamTreeMode==="legacy"||dao1TeamTreeMode==="wallet") && dao1OwnedDidRoots.length && !dao1TeamDiscovery.legacy.running && !dao1TeamDiscovery.legacy.edges.length) scanOldDao1Tree({checkChain:true}).catch(e=>console.warn("DAO1 Team Auto-Discovery",e));
        if((dao1TeamTreeMode==="aptmdao"||dao1TeamTreeMode==="wallet") && aptmdaoOwnedDidRoots.length && !dao1TeamDiscovery.aptmdao.running && !dao1TeamDiscovery.aptmdao.edges.length) scanAptmdaoTree({checkChain:true}).catch(e=>console.warn("APTMDAO Team Auto-Discovery",e));
      }).catch(e=>console.warn("DAO1 DID-Root Fallback",e));

      if((dao1TeamTreeMode==="legacy"||dao1TeamTreeMode==="wallet") && dao1OwnedDidRoots.length && !dao1TeamDiscovery.legacy.running && !dao1TeamDiscovery.legacy.edges.length) scanOldDao1Tree({checkChain:true}).catch(e=>console.warn("DAO1 Team Auto-Discovery",e));
      if((dao1TeamTreeMode==="aptmdao"||dao1TeamTreeMode==="wallet") && aptmdaoOwnedDidRoots.length && !dao1TeamDiscovery.aptmdao.running && !dao1TeamDiscovery.aptmdao.edges.length) scanAptmdaoTree({checkChain:true}).catch(e=>console.warn("APTMDAO Team Auto-Discovery",e));
    }catch(e){
      const rootArea=document.getElementById("dao1TeamRootArea");
      if(rootArea)rootArea.innerHTML=`<div class="status warn" style="margin-top:12px"><strong>DID-Ownership konnte nicht geladen werden.</strong><div class="note" style="margin-top:4px">${escapeHtml(e?.message||String(e))}</div></div>`;
      renderDAO1TeamTreePanel();
    }
  }

  function renderDAO1TeamTreePanel(){
    const el=document.getElementById("dao1TeamTreePanel");if(!el)return;
    // Normale DAO-Team-Oberfläche ist seit Phase 5.79 ausschließlich wallet-zentriert.
    dao1TeamTreeMode="wallet";
    const rootArea=document.getElementById("dao1TeamRootArea");if(rootArea&&dao1AllOwnedDidRoots().length)rootArea.innerHTML=teamOwnedRootCardsHtml();
    const renderT0=performance.now();
    if(dao1TeamTreeMode==="wallet"){
      const graph=dao1BuildWalletGraph();
      const partners=[...graph.nodes.values()].filter(n=>!n.own&&!n.upstream&&n.primary);
      const dao1Partners=new Set(partners.filter(n=>n.dao1Dids.size).map(n=>n.wallet));
      const aptmPartners=new Set(partners.filter(n=>n.aptmdaoDids.size).map(n=>n.wallet));
      window.setDashboardProjectCacheStats?.("dao1",{updatedAt:new Date().toISOString(),teamPartners:partners.length,dao1Partners:dao1Partners.size,aptmdaoPartners:aptmPartners.size});
      const legacy=dao1TeamDiscovery.legacy,aptm=dao1TeamDiscovery.aptmdao;
      const running=legacy.running||aptm.running,error=legacy.error||aptm.error;
      el.innerHTML=`<div class="status ${error?"warn":"info"}" style="margin-top:12px"><strong>${running?"Teamdaten werden aktualisiert …":"Team-Baum"}</strong>${error?`<div class="note" style="margin-top:4px">${escapeHtml(error)}</div>`:""}<div class="note" style="margin-top:4px">Wallet-zentrierte Darstellung: DAO1 und APTMDAO bleiben als getrennte on-chain Graphen gespeichert; in der Anzeige werden die belegten DIDs je Wallet zusammengeführt. APTMDAO hat nur dann Vorrang, wenn diese Beziehung tatsächlich in deiner Downline liegt.</div></div>
        <div style="margin-top:10px"><button type="button" onclick="DAO1Project.discoverTeamTree()" ${running?"disabled":""}>${running?"Discovery läuft …":"Team on-chain aktualisieren"}</button></div>
        <div class="project-summary" style="margin-top:12px"><div class="custom-token-card project-summary-box"><span class="field-label">Partner-Wallets</span><strong>${partners.length.toLocaleString("de-DE")}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">davon DAO1-Bezug</span><strong>${dao1Partners.size.toLocaleString("de-DE")}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">davon APTMDAO-Bezug</span><strong>${aptmPartners.size.toLocaleString("de-DE")}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">Max. Ebenen</span><strong>${DAO1_TEAM_MAX_LEVELS}</strong></div></div>
        ${dao1WalletForestHtml()}<details class="custom-token-card debug-frame" style="margin-top:12px"><summary style="cursor:pointer;font-weight:800">DEV / Diagnose · getrennte on-chain Graphen</summary><div class="note" style="margin-top:8px">DAO1: ${(legacy.edges||[]).length.toLocaleString("de-DE")} Kanten · APTMDAO: ${(aptm.edges||[]).length.toLocaleString("de-DE")} Kanten. Die User-Ansicht verändert keine on-chain Beziehung, sondern dedupliziert ausschließlich die wallet-zentrierte Darstellung.</div></details>`;
      bindDAO1TeamTreeControls({edges:[]});window.applyDebugModeVisibility?.();queueMicrotask(()=>dao1EnsurePartnerBots(graph).catch(e=>console.warn("DAO Partner-Bots Hintergrund",e)));return;
    }
    const isOld=dao1TeamTreeMode==="legacy",st=teamDiscoveryState();
    try{const rows=legacyTreeRows(st.edges||[]),wallets=new Set(rows.map(r=>lower(r.wallet)).filter(Boolean)),patch={updatedAt:new Date().toISOString()};if(isOld){patch.dao1Partners=wallets.size;}else patch.aptmdaoPartners=wallets.size;window.setDashboardProjectCacheStats?.("dao1",patch);}catch(e){console.warn("DAO Team Dashboard-Summary",e);}
    const d=dao1OldTreeCacheDiag;
    const cacheDiagHtml=isOld?`<div class="custom-token-card debug-frame" style="margin-top:12px"><strong>DEBUG / DEV · DAO1 Tree Browser-Cache</strong><div class="note" style="margin-top:6px"><strong>${escapeHtml(d.source)}</strong> · lokal ${Number(d.localRows||0).toLocaleString("de-DE")} Rows · DB ${Number(d.dbRows||0).toLocaleString("de-DE")} Rows · Delta ${Number(d.deltaRows||0).toLocaleString("de-DE")} Rows</div><div class="note">Cache gesamt ${Number(d.totalCacheMs||0).toFixed(1)} ms · kompletter Lauf ${Number(d.scanMs||0).toFixed(1)} ms · Render ${Number(d.renderMs||0).toFixed(1)} ms</div><div class="note">${escapeHtml(d.note||"")}</div></div>`:`<div class="custom-token-card debug-frame" style="margin-top:12px"><strong>DEBUG / DEV · APTMDAO Tree Cache</strong><div class="note">${escapeHtml(aptmdaoTreeCacheDiag.source)} · lokal ${Number(aptmdaoTreeCacheDiag.localRows||0).toLocaleString("de-DE")} · DB ${Number(aptmdaoTreeCacheDiag.dbRows||0).toLocaleString("de-DE")} · RPC-Logs ${Number(aptmdaoTreeCacheDiag.rpcLogs||0).toLocaleString("de-DE")} · Änderungen ${Number(aptmdaoTreeCacheDiag.changedEdges||0).toLocaleString("de-DE")}</div></div>`;
    el.innerHTML=`<div class="custom-token-card" style="margin-top:12px"><div class="chain-title">${isOld?"DAO1 (alt) · Diagnose":"APTMDAO (neu) · Diagnose"}</div><div class="status ${st.error?"warn":"info"}" style="margin-top:10px"><strong>${st.status}</strong>${st.error?`<div class="note" style="margin-top:4px">${escapeHtml(st.error)}</div>`:""}</div><div style="margin-top:10px"><div class="custom-token-grid" style="grid-template-columns:minmax(260px,420px) auto;align-items:end">${teamRootSelectorHtml()}<div><button type="button" onclick="DAO1Project.discoverTeamTree()" ${st.running?"disabled":""}>${st.running?"Discovery läuft …":(isOld?"DAO1 on-chain aktualisieren":"APTMDAO on-chain aktualisieren")}</button></div></div></div></div>${cacheDiagHtml}${teamDiscoveryTableHtml(st,isOld)}`;
    dao1OldTreeCacheDiag.renderMs=performance.now()-renderT0;if(st.edges.length)bindDAO1TeamTreeControls(st);window.applyDebugModeVisibility?.();
  }

  async function discoverDAO1TeamTree(){
    if(dao1TeamTreeMode==="wallet")return Promise.all([dao1OwnedDidRoots.length?scanOldDao1Tree({checkChain:true}):Promise.resolve(),aptmdaoOwnedDidRoots.length?scanAptmdaoTree({checkChain:true}):Promise.resolve()]);
    if(dao1TeamTreeMode==="legacy")return scanOldDao1Tree({checkChain:true});
    return scanAptmdaoTree({checkChain:true});
  }

  function renderReferralRewardsTab(){
    const el=document.getElementById("dao1ReferralContent");if(!el)return;
    const sourceRows=tabWalletFilteredRows(transactionRows,referralFilterWallet);
    const rows=verifiedReferralRewards(sourceRows);
    const candidates=referralRewardCandidates(sourceRows);
    const payoutSummary=referralPayoutSummary(rows);
    el.innerHTML=`<div class="custom-token-card"><div class="chain-title">🤝 Referral Rewards</div><div class="note">Fachregel: Alle Auszahlungen, die dem DID zugeordnet sind, sind Referral Rewards. Sie werden ausschließlich für Wallet 0x239c…B47 ausgewertet und nicht mehr als Bot-Claims gezählt. Das Auszahlungsasset kann z. B. wUSDT oder wSOL sein.</div><div class="custom-token-grid" style="margin-top:10px;grid-template-columns:minmax(320px,520px)">${tabWalletFilterHtml("referrals",referralFilterWallet)}</div></div>
      <div class="project-summary" style="grid-template-columns:1fr">${payoutSummaryCardHtml("Auszahlungen",payoutSummary,"","Referral Rewards",rows.length)}</div>
      <div class="custom-token-card dao1-data-table-card" style="padding:0;overflow:hidden"><div class="chain-table-wrap project-data-table sticky-header dao1-transaction-table-wrap" style="margin:0;max-height:680px;overflow:auto"><table class="dao1-transaction-table"><thead><tr><th>Zeit</th><th>Wallet</th><th>Typ</th><th>DID</th><th>Auszahlung</th><th>Gas APTM</th><th>Tx</th></tr></thead><tbody>${rows.length?rows.map(r=>{const d=transactionClaimDescriptor(r);const flows=r._referralFlows||[];const value=flows.reduce((a,f)=>a+Number(f.value_usd||0),0);return `<tr><td>${r.tx_timestamp?new Date(r.tx_timestamp).toLocaleString("de-CH",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"–"}</td><td>${r.wallet_label||r.wallet_address||"–"}</td><td><strong>Referral Reward</strong></td><td><strong>${d?.name||"DID"}</strong>${d?.id?`<div class="meta">#${d.id} · DID</div>`:""}</td><td>${flows.length?flows.map(f=>`<strong>${flowDisplay(f)}</strong><div class="meta">${f.token_address||""}</div>`).join(""):"–"}</td><td>${value?usd(value):"–"}</td><td>${fmt(r.gas_aptm)}</td><td><a href="${EXPLORER}/tx/${r.tx_hash}" target="_blank" rel="noopener">${String(r.tx_hash||"").slice(0,12)}…</a></td></tr>`;}).join(""):`<tr><td colspan="8"><div class="empty">Keine Referral Rewards im geladenen Zeitraum gefunden.</div></td></tr>`}</tbody></table></div></div>
      ${candidates.length?`<div class="custom-token-card debug-frame"><strong>DEBUG / DEV · weitere wUSDT-Kandidaten (${candidates.length})</strong><div class="note">Nur Diagnose: Diese Zeilen sind keinem DID zugeordnet und werden nicht als Referral Reward summiert.</div></div>`:""}`;
    window.applyDebugModeVisibility?.();
  }

  function txVisibleRows(){
    let rows=[...transactionRows];
    if(txFilterFrom){
      const f=new Date(txFilterFrom+"T00:00:00").getTime();
      rows=rows.filter(r=>new Date(r.tx_timestamp).getTime()>=f);
    }
    if(txFilterTo){
      const t=new Date(txFilterTo+"T23:59:59.999").getTime();
      rows=rows.filter(r=>new Date(r.tx_timestamp).getTime()<=t);
    }
    if(txFilterKind==="claims")rows=rows.filter(r=>isClaimTxRow(r) && !isDidReferralRow(r));
    else if(txFilterKind==="referrals")rows=rows.filter(r=>isDidReferralRow(r) || verifiedReferralFlowsForTx(r).length>0);
    else if(txFilterKind!=="__all")rows=rows.filter(r=>r.direction===txFilterKind);

    if(txFilterClass!=="__all"){
      rows=rows.filter(r=>{
        const d=transactionClaimDescriptor(r);
        return d && d.subtype===txFilterClass;
      });
    }
    if(txFilterNft!=="__all"){
      rows=rows.filter(r=>String(r.claim_nft_id??"")===String(txFilterNft));
    }
    return rows;
  }

  function dao1IsoToDisplay(iso){
    const m=String(iso||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m?`${m[3]}.${m[2]}.${m[1]}`:"";
  }

  function dao1DisplayToIso(value){
    const m=String(value||"").match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if(!m)return null;
    const d=Number(m[1]),mo=Number(m[2]),y=Number(m[3]);
    const test=new Date(Date.UTC(y,mo-1,d));
    if(y<1000||y>9999||test.getUTCFullYear()!==y||test.getUTCMonth()!==mo-1||test.getUTCDate()!==d)return null;
    return `${m[3]}-${m[2]}-${m[1]}`;
  }

  function enforceDao1DateInput(el, kind, scope="tx"){
    if(!el)return;

    // Sichtbares Format TT.MM.JJJJ; insgesamt max. 8 Ziffern.
    const digits=String(el.value||"").replace(/\D/g,"").slice(0,8);
    let display=digits.slice(0,2);
    if(digits.length>2)display+=`.${digits.slice(2,4)}`;
    if(digits.length>4)display+=`.${digits.slice(4,8)}`;
    if(el.value!==display)el.value=display;

    if(!display){
      el.setCustomValidity("");
      if(scope==="mining"){
        if(kind==="from")miningFilterFrom="";
        if(kind==="to")miningFilterTo="";
        renderMining();
      }else{
        if(kind==="from")txFilterFrom="";
        if(kind==="to")txFilterTo="";
        renderTransactionHistory();
      }
      return;
    }

    // Während der Eingabe Filterwert noch nicht ändern.
    if(!/^\d{2}\.\d{2}\.\d{4}$/.test(display)){
      el.setCustomValidity("");
      return;
    }

    const iso=dao1DisplayToIso(display);
    if(!iso){
      el.setCustomValidity("Bitte ein gültiges Datum im Format TT.MM.JJJJ eingeben.");
      return;
    }
    el.setCustomValidity("");

    if(scope==="mining"){
      if(kind==="from")miningFilterFrom=iso;
      if(kind==="to")miningFilterTo=iso;
      renderMining();
      return;
    }
    if(kind==="from")txFilterFrom=iso;
    if(kind==="to")txFilterTo=iso;
    renderTransactionHistory();
  }

  function setDao1DateFromPicker(picker,kind,scope="tx"){
    if(!picker)return;
    const iso=String(picker.value||"");
    const visible=picker.closest(".dao1-date-field")?.querySelector(".dao1-date-text");
    if(visible)visible.value=dao1IsoToDisplay(iso);
    if(scope==="mining"){
      if(kind==="from")miningFilterFrom=iso;
      if(kind==="to")miningFilterTo=iso;
      renderMining();
    }else{
      if(kind==="from")txFilterFrom=iso;
      if(kind==="to")txFilterTo=iso;
      renderTransactionHistory();
    }
  }

  function openDao1DatePicker(button){
    const picker=button?.closest(".dao1-date-field")?.querySelector(".dao1-date-picker");
    if(!picker)return;
    if(typeof picker.showPicker==="function")picker.showPicker();
    else picker.click();
  }

  function dao1DateControl(value,kind,scope){
    return `<div class="dao1-date-field">
      <input class="dao1-date-text" type="text" inputmode="numeric" maxlength="10" placeholder="TT.MM.JJJJ"
        value="${dao1IsoToDisplay(value)}"
        oninput="DAO1Project.enforceDao1DateInput(this,'${kind}','${scope}')"
        onchange="DAO1Project.enforceDao1DateInput(this,'${kind}','${scope}')">
      <button type="button" class="secondary dao1-date-button" title="Datum wählen" onclick="DAO1Project.openDao1DatePicker(this)">📅</button>
      <input class="dao1-date-picker" type="date" min="1000-01-01" max="9999-12-31" value="${value||""}"
        onchange="DAO1Project.setDao1DateFromPicker(this,'${kind}','${scope}')">
    </div>`;
  }

  function renderTransactionControls(){
    const el=document.getElementById("dao1TransactionControls");
    if(!el)return;
    const wallets=allProjectWalletOptions();
    if(!txFilterWallet)txFilterWallet="__all";

    const classes=transactionFilterClasses();
    const nfts=transactionFilterNfts();
    if(txFilterClass!=="__all" && !classes.includes(txFilterClass))txFilterClass="__all";
    if(txFilterNft!=="__all" && !nfts.some(n=>n.id===String(txFilterNft)))txFilterNft="__all";

    el.innerHTML=`
      <div class="action-row" style="margin-bottom:10px">
        <button id="dao1TxScanBtn" onclick="DAO1Project.refreshTransactionHistory(true)">Daten aktualisieren</button>
        <button id="dao1TxRepriceBtn" class="secondary" onclick="DAO1Project.repriceCachedTransactionHistory()">Historische Preise neu berechnen</button>
        <button class="secondary" onclick="DAO1Project.exportTransactionsExcel()">Excel exportieren</button>
        <button class="secondary" onclick="DAO1Project.exportTransactionsPdf()">PDF / Drucken</button>
      </div>
      <div class="custom-token-grid" style="grid-template-columns:minmax(270px,1.2fr) minmax(140px,.55fr) minmax(140px,.55fr) minmax(160px,.65fr) minmax(190px,.75fr) minmax(240px,1fr)">
        <label><span class="field-label">Wallet</span><select onchange="DAO1Project.setTransactionFilter('wallet',this.value)">
          <option value="__all" ${txFilterWallet==="__all"?"selected":""}>Alle Apertum-Wallets</option>
          ${wallets.map(w=>`<option value="${w.id}" ${String(w.id)===String(txFilterWallet)?"selected":""}>${w.label} · ${walletAddress(w)}</option>`).join("")}
        </select></label>
        <label><span class="field-label">Von</span>${dao1DateControl(txFilterFrom,"from","tx")}</label>
        <label><span class="field-label">Bis</span>${dao1DateControl(txFilterTo,"to","tx")}</label>
        <label><span class="field-label">Typ</span><select onchange="DAO1Project.setTransactionFilter('kind',this.value)">
          <option value="__all" ${txFilterKind==="__all"?"selected":""}>Alle</option>
          <option value="claims" ${txFilterKind==="claims"?"selected":""}>Claims</option>
          <option value="referrals" ${txFilterKind==="referrals"?"selected":""}>Referral Rewards</option>
          <option value="eingang" ${txFilterKind==="eingang"?"selected":""}>Eingang</option>
          <option value="ausgang" ${txFilterKind==="ausgang"?"selected":""}>Ausgang</option>
          <option value="intern" ${txFilterKind==="intern"?"selected":""}>Intern</option>
        </select></label>
        <label><span class="field-label">NFT-Klassifizierung</span><select onchange="DAO1Project.setTransactionFilter('class',this.value)">
          <option value="__all" ${txFilterClass==="__all"?"selected":""}>Alle Klassifizierungen</option>
          ${classes.map(c=>`<option value="${c}" ${txFilterClass===c?"selected":""}>${c}</option>`).join("")}
        </select></label>
        <label><span class="field-label">NFT</span><select onchange="DAO1Project.setTransactionFilter('nft',this.value)">
          <option value="__all" ${txFilterNft==="__all"?"selected":""}>Alle NFTs (${nfts.length})</option>
          ${nfts.map(n=>`<option value="${n.id}" ${String(txFilterNft)===n.id?"selected":""}>${n.name}${String(n.name||"").includes("#"+n.id)?"":" · #"+n.id}${n.subtype?" · "+n.subtype:""}</option>`).join("")}
        </select></label>
      </div>
      <div class="note" style="margin-top:7px">Alle Filter wirken direkt auf Summary, Detailliste und Export. Historische NFTs bleiben berücksichtigt, sofern Claims zu ihnen gespeichert sind. „Daten aktualisieren“ synchronisiert neue Blockchain-Transaktionen. „Historische Preise neu berechnen“ verwendet dagegen ausschließlich die bereits gecachten TX-Blöcke und erneuert daraus APTM/USD-, USD- und Gas-USD-Werte; die Transaktionshistorie wird dabei nicht erneut vom Explorer geladen.</div>`;
    renderPriceJobLog();
  }

  async function setTransactionFilter(kind,value){
    if(kind==="wallet"){
      txFilterWallet=String(value||"");
      txFilterClass="__all";
      txFilterNft="__all";
      await refreshTransactionHistory(false);
      return;
    }
    if(kind==="from"){
      txFilterFrom=String(value||"");
      renderTransactionHistory();
      return;
    }
    if(kind==="to"){
      txFilterTo=String(value||"");
      renderTransactionHistory();
      return;
    }
    if(kind==="kind")txFilterKind=String(value||"__all");
    if(kind==="class"){
      txFilterClass=String(value||"__all");
      txFilterNft="__all";
    }
    if(kind==="nft")txFilterNft=String(value||"__all");
    renderTransactionControls();
    renderTransactionHistory();
  }

  function showMissingHistoricalPrices(kind){
    const rows=txVisibleRows().filter(r=>{
      if(kind==="claim"){
        if(r.claim_nft_id==null)return false;
        const payout=nativeClaimPayoutForTx(r);
        return !!payout && payout.value_usd==null;
      }
      return Number(r.gas_aptm||0)>0 && r.gas_usd==null;
    });
    if(!rows.length)return alert("Keine offenen historischen Kurswerte.");
    let box=document.getElementById("dao1MissingPricePanel");
    if(!box){
      box=document.createElement("div");
      box.id="dao1MissingPricePanel";
      box.className="custom-token-card";
      const host=document.getElementById("dao1TransactionHistory");
      (host||document.body).appendChild(box);
    }
    box.style.display="block";
    box.innerHTML=`
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
        <h3 style="margin:0">Historische Kurse ergänzen</h3>
        <button class="secondary" onclick="document.getElementById('dao1MissingPricePanel').style.display='none'">Schliessen</button>
      </div>
      <div class="note" style="margin:8px 0 12px">
        ${rows.length} Transaktion(en) ohne historischen ${kind==="claim"?"Claim-":"Gas-"}USD-Wert.
        Ein manuell eingetragener Kurs wird ausdrücklich als <strong>manuell</strong> gespeichert und im Export entsprechend gekennzeichnet.
      </div>
      <div style="overflow:auto">
        <table><thead><tr><th>Datum</th><th>Wallet</th><th>Block</th><th>Tx</th><th>NFT</th><th>${kind==="claim"?"Geclaimt APTM":"Gas APTM"}</th><th>APTM/USD manuell</th><th>USD-Wert</th><th></th></tr></thead>
        <tbody>${rows.map((r,i)=>{
          const qty=kind==="claim"?Number(nativeClaimPayoutForTx(r)?.amount||0):Number(r.gas_aptm||0);
          return `<tr>
            <td>${esc(r.tx_timestamp||"–")}</td><td>${esc(r.wallet_label||r.wallet_address||"–")}</td><td>${r.block_number||"–"}</td>
            <td><a href="${EXPLORER}/tx/${r.tx_hash}" target="_blank" rel="noopener">${esc(String(r.tx_hash||"").slice(0,12))}…</a></td>
            <td>${esc(r.claim_nft_name||r.claim_nft_id||"–")}</td><td>${fmt(qty)}</td>
            <td><input id="dao1ManualPrice${i}" type="number" min="0" step="0.00000001" placeholder="z.B. 1.85" style="min-width:120px"></td>
            <td id="dao1ManualUsd${i}">–</td>
            <td><button onclick="DAO1Project.saveManualHistoricalPrice('${kind}',${i},'${r.tx_hash}',${qty})">Speichern</button></td>
          </tr>`;
        }).join("")}</tbody></table>
      </div>`;
    rows.forEach((r,i)=>{
      const inp=document.getElementById(`dao1ManualPrice${i}`),out=document.getElementById(`dao1ManualUsd${i}`);
      const qty=kind==="claim"?Number(nativeClaimPayoutForTx(r)?.amount||0):Number(r.gas_aptm||0);
      inp?.addEventListener("input",()=>{const p=Number(inp.value);out.textContent=p>0?usd(qty*p):"–";});
    });
    box.scrollIntoView({behavior:"smooth",block:"start"});
  }

  async function saveManualHistoricalPrice(kind,index,txHash,qty){
    const input=document.getElementById(`dao1ManualPrice${index}`);
    const price=Number(input?.value);
    if(!Number.isFinite(price)||price<=0)return alert("Bitte einen gültigen APTM/USD-Kurs grösser 0 eingeben.");
    const row=txVisibleRows().find(r=>r.tx_hash===txHash);
    if(!row)return alert("Transaktion wurde nicht gefunden.");
    const userId=getContext?.().currentUser?.id;
    if(!userId)return alert("Nicht angemeldet.");
    const source=`Manuell · APTM/USD · ${new Date().toISOString()}`;
    const txPatch={
      aptm_usd:price,
      value_usd:Number(row.value_aptm||0)*price,
      gas_usd:Number(row.gas_aptm||0)*price,
      price_source:source,
      price_is_manual:true,
      updated_at:new Date().toISOString()
    };
    if(kind==="claim")txPatch.claim_reward_usd=Number(qty||0)*price;
    const walletId=String(row.wallet_id||walletIdForAddress(row.wallet_address));
    const {error}=await sb.from("project_transactions").update(txPatch)
      .eq("user_id",userId).eq("wallet_id",walletId).eq("tx_hash",txHash);
    if(error)return alert(`Speichern fehlgeschlagen: ${error.message}`);
    if(kind==="claim"){
      // Phase 6.21: sichtbarer Claim-USD-Wert wird im kanonischen Asset-Flow gepflegt.
      const flowPatch={price_usd:price,value_usd:Number(qty||0)*price,price_source:source,updated_at:new Date().toISOString()};
      const {error:fe}=await sb.from("project_transaction_asset_flows").update(flowPatch)
        .eq("user_id",userId).eq("wallet_id",walletId).eq("tx_hash",txHash)
        .eq("token_address","native").eq("token_symbol","APTM").eq("direction","eingang");
      if(fe)return alert(`Claim-Asset-Flow konnte nicht gespeichert werden: ${fe.message}`);
      const claimPatch={
        aptm_usd:price,reward_usd:Number(qty||0)*price,
        gas_usd:Number(row.gas_aptm||0)*price,
        price_source:source,price_is_manual:true,updated_at:new Date().toISOString()
      };
      const q=sb.from("project_nft_claims").update(claimPatch).eq("user_id",userId).eq("wallet_id",walletId).eq("tx_hash",txHash);
      const {error:ce}=await q;
      if(ce)console.warn("Manueller Claim-Kurs konnte nicht zusätzlich in project_nft_claims gespeichert werden:",ce);
    }
    await refreshTransactionHistory(false);
    showMissingHistoricalPrices(kind);
  }

  function renderTransactionHistory(){
    const summary=document.getElementById("dao1TransactionSummary");
    const table=document.getElementById("dao1TransactionTable");
    const rows=txVisibleRows();
    const claims=rows.filter(r=>r.claim_nft_id!=null);
    const claimAssetTotals=new Map();
    let claimedUsd=0;
    for(const r of claims){
      const payouts=claimPayoutEntriesForTx(r);
      for(const f of payouts){
        const sym=String(f.token_symbol||"TOKEN")||"TOKEN";
        claimAssetTotals.set(sym,(claimAssetTotals.get(sym)||0)+Number(f.amount||0));
        if(f.value_usd!=null)claimedUsd+=Number(f.value_usd||0);
      }
    }
    const claimAssetSummary=[...claimAssetTotals.entries()].map(([sym,val])=>`${fmt(val)} ${sym}`).join(" · ");
    const inAptm=rows.filter(r=>r.direction==="eingang").reduce((a,r)=>a+Number(r.value_aptm||0),0);
    const outAptm=rows.filter(r=>r.direction==="ausgang").reduce((a,r)=>a+Number(r.value_aptm||0),0);
    const gas=rows.reduce((a,r)=>a+Number(r.gas_aptm||0),0);
    const gasUsd=rows.reduce((a,r)=>a+Number(r.gas_usd||0),0);
    const claimUsdMissing=claims.filter(r=>{
      const payouts=claimPayoutEntriesForTx(r);
      return payouts.length && payouts.some(f=>f.value_usd==null);
    }).length;
    const gasUsdMissing=rows.filter(r=>Number(r.gas_aptm||0)>0 && r.gas_usd==null).length;
    const priceQuality=historicalPriceQualityCounts(rows);
    if(summary)summary.innerHTML=`<div class="project-summary">
      <div class="custom-token-card project-summary-box"><span class="field-label">Transaktionen</span><strong>${rows.length}</strong></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Claims</span><strong>${claims.length}</strong></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Claim-Auszahlungen</span><strong>${claimAssetSummary||"–"}</strong><div class="meta">${claimedUsd?usd(claimedUsd):"–"} · tatsächliche Auszahlungsassets${claimUsdMissing?` · <button class="secondary" style="padding:2px 6px;font-size:.75rem" onclick="DAO1Project.showMissingHistoricalPrices('claim')">${claimUsdMissing} ohne USD-Wert anzeigen</button>`:""}</div></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Normale Eingänge</span><strong>${fmt(inAptm)} APTM</strong></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Ausgang</span><strong>${fmt(outAptm)} APTM</strong></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Gas</span><strong>${fmt(gas)} APTM</strong><div class="meta">${gasUsd?usd(gasUsd):"–"} · historischer USD-Wert zum Transaktionszeitpunkt${gasUsdMissing?` · <button class="secondary" style="padding:2px 6px;font-size:.75rem" onclick="DAO1Project.showMissingHistoricalPrices('gas')">${gasUsdMissing} ohne Kurs anzeigen</button>`:""}</div></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Preisqualität</span><strong>${priceQuality.exact} exact</strong><div class="meta">${priceQuality.fallback} fallback · ${priceQuality.prelaunch} Pre-Launch (noch kein Marktpreis) · ${priceQuality.missing} ohne Preis · ${priceQuality.manual} manuell</div></div>
    </div>`;
    if(!table)return;
    if(!rows.length){table.innerHTML='<div class="empty">Keine Transaktionen für den gewählten Filter.</div>';return;}
    table.innerHTML=`<div class="custom-token-card dao1-data-table-card" style="padding:0;overflow:hidden">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border,#2b303b)">
        <div><strong>Transaktionen</strong><div class="meta">${rows.length.toLocaleString("de-DE")} Einträge im aktuellen Filter</div></div>
      </div>
      <div class="chain-table-wrap project-data-table sticky-header dao1-transaction-table-wrap" style="margin:0;max-height:680px;overflow:auto"><table class="chain-admin-table dao1-transaction-table" style="margin:0"><thead style="position:sticky;top:0;z-index:2"><tr>
      <th>Zeit</th>${txFilterWallet==="__all"?"<th>Wallet</th>":""}<th>Typ</th><th>Richtung</th><th>Methode</th><th>Assets</th><th>Claim / NFT</th><th>APTM/USD</th><th>USD</th><th>Gas APTM</th><th>Gas USD historisch</th><th>Tx</th>
    </tr></thead><tbody>${rows.map(r=>{
      const claim=r.claim_nft_id!=null;
      const currentSubtype=claim?currentSubtypeForClaim(r.claim_nft_id,r.claim_nft_subtype):"";
      const currentName=claim?currentNameForClaim(r.claim_nft_id,r.claim_nft_name):"";
      const usdVal=claim?claimPayoutUsdForTx(r):Number(r.value_usd||0);
      return `<tr>
        <td class="dao1-col-time">${r.tx_timestamp?new Date(r.tx_timestamp).toLocaleString("de-CH",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"–"}</td>${txFilterWallet==="__all"?`<td class="dao1-col-wallet"><code>${r.wallet_address||"–"}</code></td>`:""}<td class="dao1-col-type"><strong>${dao1TransactionType(r)}</strong></td><td class="dao1-col-direction">${r.direction||"–"}</td><td class="dao1-col-method">${r.method||"–"}</td>
        <td class="dao1-col-assets">${txAssetSummary(r)}</td>
        <td class="dao1-col-claim">${claim?`<strong>${currentName||"NFT"}</strong><div class="meta">#${r.claim_nft_id}${currentSubtype?" · "+currentSubtype:""} · Auszahlung siehe Assets</div>`:"–"}</td>
        <td class="dao1-col-price">${r.aptm_usd==null?`–<div class="meta">${historicalPriceQuality(r)==="prelaunch"?"Noch kein On-Chain-Marktpreis vorhanden":(r.price_source||"Kein belastbarer historischer Preis")}</div>`:`${fmt(r.aptm_usd)}<div class="meta">${historicalPriceQuality(r)} · ${r.price_source||"historischer Poolpreis"}</div>`}</td><td class="dao1-col-usd">${usdVal?usd(usdVal):"–"}</td>
        <td>${fmt(r.gas_aptm)}</td><td>${r.gas_usd==null?"–":usd(Number(r.gas_usd))}</td><td><a href="${EXPLORER}/tx/${r.tx_hash}" target="_blank" rel="noopener">${r.tx_hash.slice(0,12)}…</a></td>
      </tr>`;
    }).join("")}</tbody></table></div></div>`;
    if(document.getElementById("dao1-subtab-claims")?.style.display!=="none")renderClaimsTab();
    if(document.getElementById("dao1-subtab-referrals")?.style.display!=="none")renderReferralRewardsTab();
  }

  function xmlEsc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}
  function xCell(v){
    const isNum=typeof v==="number" && Number.isFinite(v);
    return `<Cell><Data ss:Type="${isNum?"Number":"String"}">${xmlEsc(v)}</Data></Cell>`;
  }

  function exportTransactionsExcel(){
    const rows=txVisibleRows();
    const wallet=allProjectWalletOptions().find(w=>String(w.id)===String(txFilterWallet));
    const walletLabel=txFilterWallet==="__all" ? "Alle Apertum-Wallets" : walletAddress(wallet);
    const headers=["Timestamp","Wallet","Richtung","Methode","Tx Hash","Block","From","To","APTM","Claim NFT","NFT Typ","Claim Auszahlung","APTM/USD historisch","Preisquelle","Kurs manuell","Wert USD","Gas APTM","Gas USD","Status"];
    let body=`<Row>${xCell("DAO1 / Apertum Transaktionshistorie")}</Row><Row>${xCell("Wallet")}${xCell(walletLabel)}</Row><Row>${xCell("Datumsbereich")}${xCell(`${txFilterFrom||"offen"} bis ${txFilterTo||"offen"}`)}</Row><Row>${xCell("Filter")}${xCell(`Typ: ${txFilterKind}; Klassifizierung: ${txFilterClass}; NFT: ${txFilterNft}`)}</Row><Row></Row>`;
    body+=`<Row>${headers.map(h=>xCell(h)).join("")}</Row>`;
    for(const r of rows){
      const claim=r.claim_nft_id!=null;
      const valUsd=claim?claimPayoutUsdForTx(r):Number(r.value_usd||0);
      const currentSubtype=claim?currentSubtypeForClaim(r.claim_nft_id,r.claim_nft_subtype):"";
      const currentName=claim?currentNameForClaim(r.claim_nft_id,r.claim_nft_name):"";
      const payoutText=claim?claimPayoutEntriesForTx(r).map(f=>`${fmt(Number(f.amount||0))} ${f.token_symbol||"TOKEN"}`).join(" · "):"";
      const values=[
        r.tx_timestamp,r.wallet_address,r.direction,r.method,r.tx_hash,Number(r.block_number||0),
        r.from_address,r.to_address,Number(r.value_aptm||0),claim?`${currentName||"NFT"} #${r.claim_nft_id}`:"",
        currentSubtype,payoutText,
        r.aptm_usd==null?"":Number(r.aptm_usd),r.price_source||"",r.price_is_manual?"JA":"NEIN",valUsd||0,Number(r.gas_aptm||0),
        r.gas_usd==null?"":Number(r.gas_usd),r.status
      ];
      body+=`<Row>${values.map(v=>xCell(v)).join("")}</Row>`;
    }
    const xml=`<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Apertum History"><Table>${body}</Table></Worksheet></Workbook>`;
    const blob=new Blob([xml],{type:"application/vnd.ms-excel"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`apertum-history-${txFilterFrom||"all"}-${txFilterTo||"all"}.xls`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function exportTransactionsPdf(){
    const rows=txVisibleRows();
    const wallet=allProjectWalletOptions().find(w=>String(w.id)===String(txFilterWallet));
    const walletLabel=txFilterWallet==="__all" ? "Alle Apertum-Wallets" : walletAddress(wallet);
    const claims=rows.filter(r=>r.claim_nft_id!=null);
    const claimTotals=new Map();
    let totalClaimUsd=0;
    for(const r of claims){
      for(const f of claimPayoutEntriesForTx(r)){
        const sym=String(f.token_symbol||"TOKEN")||"TOKEN";
        claimTotals.set(sym,(claimTotals.get(sym)||0)+Number(f.amount||0));
        if(f.value_usd!=null)totalClaimUsd+=Number(f.value_usd||0);
      }
    }
    const totalClaimText=[...claimTotals.entries()].map(([sym,val])=>`${fmt(val)} ${sym}`).join(" · ")||"–";
    const totalGas=rows.reduce((a,r)=>a+Number(r.gas_aptm||0),0);
    const totalGasUsd=rows.reduce((a,r)=>a+Number(r.gas_usd||0),0);
    const missingPrice=rows.filter(r=>{
      if(Number(r.gas_aptm||0)>0 && r.gas_usd==null)return true;
      if(r.claim_nft_id!=null){const payouts=claimPayoutEntriesForTx(r);return payouts.length && payouts.some(f=>f.value_usd==null);}
      return false;
    }).length;
    const w=window.open("","_blank");
    if(!w)return alert("Popup wurde blockiert.");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Apertum Transaktionshistorie</title><style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#111}h1{font-size:18px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:4px;vertical-align:top}th{background:#eee}code{font-size:9px}.meta{font-size:9px;color:#555}@page{size:A4 landscape;margin:10mm}
    </style></head><body><h1>DAO1 / Apertum Transaktionshistorie</h1>
    <p><strong>Wallet:</strong> ${xmlEsc(walletLabel)}<br><strong>Datumsbereich:</strong> ${xmlEsc(txFilterFrom||"offen")} bis ${xmlEsc(txFilterTo||"offen")}<br><strong>Filter:</strong> Typ ${xmlEsc(txFilterKind)}, Klassifizierung ${xmlEsc(txFilterClass)}, NFT ${xmlEsc(txFilterNft)}</p>
    <table style="margin-bottom:10px"><thead><tr><th>Transaktionen</th><th>Claims</th><th>Claim-Auszahlungen</th><th>Claim USD historisch</th><th>Gas APTM</th><th>Gas USD historisch</th><th>ohne historischen Preis</th></tr></thead><tbody><tr><td>${rows.length}</td><td>${claims.length}</td><td>${xmlEsc(totalClaimText)}</td><td>${usd(totalClaimUsd)}</td><td>${fmt(totalGas)}</td><td>${usd(totalGasUsd)}</td><td>${missingPrice}</td></tr></tbody></table>
    <table><thead><tr><th>Zeit</th><th>Wallet</th><th>Richtung</th><th>Methode</th><th>APTM</th><th>Claim / NFT</th><th>APTM/USD</th><th>USD</th><th>Gas APTM</th><th>Gas USD historisch</th><th>Tx Hash</th></tr></thead><tbody>
    ${rows.map(r=>{
      const claim=r.claim_nft_id!=null;
      const currentSubtype=claim?currentSubtypeForClaim(r.claim_nft_id,r.claim_nft_subtype):"";
      const currentName=claim?currentNameForClaim(r.claim_nft_id,r.claim_nft_name):"";
      const valUsd=claim?claimPayoutUsdForTx(r):Number(r.value_usd||0);
      const payoutText=claim?claimPayoutEntriesForTx(r).map(f=>`${fmt(Number(f.amount||0))} ${f.token_symbol||"TOKEN"}`).join(" · "):"";
      return `<tr><td>${xmlEsc(r.tx_timestamp)}</td><td><code>${xmlEsc(r.wallet_address)}</code></td><td>${xmlEsc(r.direction)}</td><td>${xmlEsc(r.method)}</td><td>${fmt(Number(r.value_aptm||0))}</td><td>${claim?`${xmlEsc(currentName||"NFT")} #${r.claim_nft_id}<div class="meta">${xmlEsc(currentSubtype)} · Reward ${xmlEsc(payoutText||"–")}</div>`:"–"}</td><td>${r.aptm_usd==null?"–":`${fmt(r.aptm_usd)}<div class="meta">${xmlEsc(r.price_source||"historischer Poolpreis")}</div>`}</td><td>${valUsd?usd(valUsd):"–"}</td><td>${fmt(r.gas_aptm)}</td><td>${r.gas_usd==null?"–":usd(Number(r.gas_usd))}</td><td><code>${xmlEsc(r.tx_hash)}</code></td></tr>`;
    }).join("")}
    <tr style="font-weight:bold;background:#eee"><td colspan="4">TOTAL</td><td>–</td><td>${xmlEsc(totalClaimText)} · ${claims.length} Claims</td><td>–</td><td>${usd(totalClaimUsd)}</td><td>${fmt(totalGas)}</td><td>${usd(totalGasUsd)}</td><td>–</td></tr>
    </tbody></table><script>window.onload=()=>window.print();<\/script></body></html>`);
    w.document.close();
  }

  async function getScanState(walletAddress){
    const {data,error}=await sb.from("project_scan_state")
      .select("*")
      .eq("project_key",PROJECT_KEY)
      .eq("chain_key",CHAIN_KEY)
      .eq("wallet_id",walletIdForAddress(walletAddress))
      .eq("scan_type",CLAIM_SCAN_TYPE)
      .maybeSingle();
    if(error && !/does not exist|schema cache/i.test(error.message||""))throw error;
    return data||null;
  }

  async function saveScanState(walletAddress,lastBlock){
    const ctx=getContext?.();
    if(!ctx?.currentUser)return;
    const row={
      user_id:ctx.currentUser.id,
      project_key:PROJECT_KEY,
      chain_key:CHAIN_KEY,
      wallet_id:walletIdForAddress(walletAddress),
      scan_type:CLAIM_SCAN_TYPE,
      last_scanned_block:Number(lastBlock||0),
      last_scanned_at:new Date().toISOString()
    };
    const {error}=await sb.from("project_scan_state").upsert(row,{onConflict:"user_id,project_key,chain_key,wallet_id,scan_type"});
    if(error)throw error;
  }

  async function loadCachedClaims(walletAddress,nftIds){
    const rows=[];
    let offset=0;
    while(true){
      let q=sb.from("project_nft_claims")
        .select("*")
        .eq("user_id",getContext?.().currentUser.id)
        .eq("project_key",PROJECT_KEY)
        .eq("chain_key",CHAIN_KEY)
        .eq("wallet_id",walletIdForAddress(walletAddress));
      if(nftIds?.length)q=q.in("nft_id",nftIds.map(Number));
      const {data,error}=await q.order("block_number",{ascending:true}).order("tx_hash",{ascending:true}).range(offset,offset+DB_PAGE_SIZE-1);
      if(error && !/does not exist|schema cache/i.test(error.message||""))throw error;
      const page=data||[];
      rows.push(...page);
      if(page.length<DB_PAGE_SIZE)break;
      offset+=DB_PAGE_SIZE;
    }
    return rows.map(hydratePrivateWalletAddress);
  }

  const CLAIM_DB_FIELDS = new Set([
    "user_id","project_key","chain_key","wallet_id",
    "nft_contract","nft_id","nft_name","nft_subtype",
    "tx_hash","block_number","tx_timestamp","param1","param2",
    "reward_aptm","gas_aptm","net_aptm",
    "aptm_usd","reward_usd","gas_usd","price_block","price_source","price_is_manual",
    "reward_asset_address","reward_asset_symbol","reward_asset_decimals",
    "reward_asset_amount","reward_asset_usd","reward_asset_price_source",
    "updated_at"
  ]);

  function claimRowForDatabase(row){
    const clean={};
    for(const [key,value] of Object.entries(row||{})){
      if(CLAIM_DB_FIELDS.has(key))clean[key]=value;
    }
    // Privacy-Schranke: Klartext-Walletadressen werden nur zur Laufzeit hydriert und
    // dürfen niemals zurück in den persistenten Claim-Cache geschrieben werden.
    delete clean.wallet_address;
    return clean;
  }

  async function saveClaimRows(rows){
    if(!rows.length)return;
    const safeRows=rows.map(claimRowForDatabase);
    const {error}=await sb.from("project_nft_claims").upsert(safeRows,{onConflict:"user_id,project_key,chain_key,tx_hash"});
    if(error)throw error;
  }

  async function fetchWalletTransactionsIncremental(address,status){
    const state=await getScanState(address);
    const fromBlock=state?.last_scanned_block
      ? Math.max(0,Number(state.last_scanned_block)-CLAIM_SCAN_BUFFER_BLOCKS)
      : null;

    // Explorer address history is paginated newest -> older. Stop as soon as we are below buffer start.
    let url=`${EXPLORER_API}/addresses/${address}/transactions`;
    const out=[];
    let page=0,maxSeen=Number(state?.last_scanned_block||0);
    while(url){
      page++;
      if(status)status.textContent=fromBlock==null
        ? `Wallet-Historie wird initial geladen… Seite ${page}`
        : `Neue Wallet-Daten ab Block ${fromBlock} werden geladen… Seite ${page}`;
      const j=await fetchJson(url,"Apertum Explorer · Wallet-Transaktionen");
      const items=j.items||[];
      fetched+=items.length;
      let oldest=Infinity;
      for(const t of items){
        const block=Number(t.block_number??t.block??0);
        if(Number.isFinite(block)){
          oldest=Math.min(oldest,block);
          maxSeen=Math.max(maxSeen,block);
        }
        if(fromBlock!=null && block<fromBlock)continue;
        out.push(t);
      }
      if(fromBlock!=null && Number.isFinite(oldest) && oldest<fromBlock)break;
      url=nextUrl(`${EXPLORER_API}/addresses/${address}/transactions`,j.next_page_params);
    }
    return {transactions:out,maxSeen,state,fromBlock};
  }

  function selectedNftsForMining(address){
    const all=nftIdsForWallet(address);
    const filtered=selectedNftClass==="__all"
      ? all
      : selectedNftClass==="__all_classified"
        ? all.filter(n=>n.classification)
        : all.filter(n=>n.classification?.subtype===selectedNftClass);

    if(selectedNftId==="__all")return filtered;
    const one=filtered.find(n=>n.key===selectedNftId);
    if(one)return [one];

    const manual=String(manualNftId||"").trim();
    if(/^\d+$/.test(manual)){
      return [{
        id:manual,
        key:`manual|${manual}`,
        contract:lower(DEFAULT_MINER_NFT_CONTRACT),
        name:`NFT #${manual}`,
        classification:null,
        current:false
      }];
    }
    return [];
  }


  function allKnownNftsForWallet(address){
    const all=nftIdsForWallet(address);
    return new Map(all.map(n=>[String(n.id),n]));
  }

  function uniqueKnownNftIdFromInput(input,nftMap){
    const matches=[...new Set(words(input||"").map(v=>v.toString()).filter(id=>nftMap.has(id)))];
    return matches.length===1?matches[0]:null;
  }

  function knownNewMinerNftIdFromInventory(nftMap){
    // Führende Quelle ist der vorhandene NFT-Bestand. Ein expliziter
    // "MinerBot MB1" wird vor generischen Apertum-Miner-Einträgen priorisiert.
    const current=[...nftMap.values()].filter(n=>!!n?.current);
    const exactMb1=current.filter(n=>{
      const name=String(n?.name||"").toLowerCase();
      const clsName=String(n?.classification?.nft_name||"").toLowerCase();
      return name.includes("minerbot mb1") || clsName.includes("minerbot mb1");
    });
    if(exactMb1.length===1)return String(exactMb1[0].id);

    const generic=current.filter(n=>{
      const name=String(n?.name||"").toLowerCase();
      const collection=String(n?.collectionName||"").toLowerCase();
      const subtype=String(n?.classification?.subtype||"").toLowerCase();
      return collection.includes("apertum miner")
        || (name.includes("apertum miner") && subtype==="mining-bot");
    });
    return generic.length===1?String(generic[0].id):null;
  }

  function collectKnownNftIdsFromValue(value,nftMap,out=new Set(),depth=0){
    if(depth>8 || value==null)return out;
    if(typeof value==="string"){
      const raw=value.trim();
      if(/^\d+$/.test(raw) && nftMap.has(raw))out.add(raw);
      if(/^0x[0-9a-f]+$/i.test(raw)){
        const hex=raw.slice(2);
        // ABI/Event-Wörter prüfen; bekannte NFT-IDs sind die einzige zulässige Referenz.
        for(let i=0;i+64<=hex.length;i+=64){
          try{
            const id=BigInt("0x"+hex.slice(i,i+64)).toString();
            if(nftMap.has(id))out.add(id);
          }catch{}
        }
        // Einzelnes Topic kann ebenfalls genau ein uint256 enthalten.
        if(hex.length<=64){
          try{const id=BigInt("0x"+(hex||"0")).toString();if(nftMap.has(id))out.add(id);}catch{}
        }
      }
      return out;
    }
    if(typeof value==="number" || typeof value==="bigint"){
      const id=String(value);if(nftMap.has(id))out.add(id);return out;
    }
    if(Array.isArray(value)){for(const x of value)collectKnownNftIdsFromValue(x,nftMap,out,depth+1);return out;}
    if(typeof value==="object"){for(const v of Object.values(value))collectKnownNftIdsFromValue(v,nftMap,out,depth+1);}
    return out;
  }

  async function resolveNewMinerNftId(t,nftMap){
    const direct=uniqueKnownNftIdFromInput(t?.raw_input||"",nftMap);
    if(direct)return direct;
    const hash=String(t?.tx_hash||"").toLowerCase();
    if(!/^0x[0-9a-f]{64}$/.test(hash))return null;
    const matches=new Set();
    try{
      const detail=await fetchJson(`${EXPLORER_API}/transactions/${hash}`,"Apertum Explorer · Miner Claim Detail");
      collectKnownNftIdsFromValue(detail?.raw_input||detail?.input||"",nftMap,matches);
      collectKnownNftIdsFromValue(detail?.decoded_input||detail?.decodedInput||null,nftMap,matches);
    }catch(e){console.warn("DAO1 neuer Miner · Tx-Detail NFT-Zuordnung",hash,e);}
    try{
      const logs=await fetchAll(`/transactions/${hash}/logs`);
      for(const log of logs||[]){
        collectKnownNftIdsFromValue(log?.topics||[],nftMap,matches);
        collectKnownNftIdsFromValue(log?.data||"",nftMap,matches);
        collectKnownNftIdsFromValue(log?.decoded||log?.decoded_event||null,nftMap,matches);
      }
    }catch(e){console.warn("DAO1 neuer Miner · Log NFT-Zuordnung",hash,e);}
    return matches.size===1?[...matches][0]:null;
  }

  function filterClaimsForSelectedNfts(rows,selectedNfts){
    const ids=new Set(selectedNfts.map(n=>String(n.id)));
    return (rows||[]).filter(r=>ids.has(String(r.nft_id)));
  }

  async function loadMiningRewards() {
    const status = document.getElementById("dao1MiningStatus");
    const btn = document.getElementById("dao1MiningBtn");
    if(btn?.disabled)return;
    const oldBtnText=btn?.textContent || "Mining-Auswertung starten";
    if(btn){
      btn.disabled=true;
      btn.textContent="Mining-Auswertung läuft…";
      btn.setAttribute("aria-busy","true");
    }
    const ctx=getContext?.();
    const wallet=projectWallets().find(w=>String(w.id)===String(selectedWalletId));
    const address=walletAddress(wallet);
    if (!address) {
      status.textContent = "Bitte eine Apertum-Wallet auswählen.";
      if(btn){btn.disabled=false;btn.textContent=oldBtnText;btn.removeAttribute("aria-busy");}
      return;
    }

    const selectedNfts=[...allKnownNftsForWallet(address).values()];
    const nftIds=selectedNfts.map(n=>String(n.id));
    const selectedNftMap=new Map(selectedNfts.map(n=>[String(n.id),n]));
    const allNftMap=allKnownNftsForWallet(address);

    try {
      status.textContent = "Wallet-Claim-Cache wird geprüft…";
      rewardRows = [];

      const txSync=await syncApertumTransactionCache(address,status);
      const scan={
        state:txSync.state,
        fromBlock:txSync.fromBlock,
        maxSeen:txSync.maxSeen,
        transactions:txSync.rows.map(r=>({
          hash:r.tx_hash,block_number:r.block_number,timestamp:r.tx_timestamp,
          raw_input:r.raw_input,input:r.raw_input,fee:{value:String(Math.round(Number(r.gas_aptm||0)*1e18))}
        }))
      };
      const claimCandidates=[];
      for(const t of scan.transactions){
        const input=String(t.raw_input||t.input||"");
        if(input.slice(0,10).toLowerCase()!==CLAIM_SELECTOR)continue;
        const ps=words(input);

        // Wallet scan is deliberately independent of the current NFT/classification filter.
        // For DAO1 claimReward the NFT id is encoded in one of the first two words.
        // Prefer a known wallet NFT id; otherwise retain the first plausible integer so the
        // claim is not lost merely because metadata/classification is still incomplete.
        const knownId=[ps[0],ps[1]]
          .filter(v=>v!=null)
          .map(v=>v.toString())
          .find(id=>allNftMap.has(id));
        const decodedId=knownId || ps[0]?.toString() || ps[1]?.toString();
        if(!decodedId || !/^\d+$/.test(decodedId))continue;
        const nft=allNftMap.get(String(decodedId)) || {
          id:String(decodedId),
          contract:lower(DEFAULT_MINER_NFT_CONTRACT),
          name:`NFT #${decodedId}`,
          classification:null
        };
        claimCandidates.push({
          nft,
          t,
          p1:ps[0]?.toString(),
          p2:ps[1]?.toString()
        });
      }

      // Historical prices required only for the newly fetched candidate range.
      if(claimCandidates.length){
        const blocks=claimCandidates.map(x=>Number(x.t.block_number??x.t.block)).filter(Number.isFinite);
        // Price enrichment is targeted and best-effort. A missing/slow RPC price lookup
        // must never prevent the actual claim from being persisted.
        let history=await ensurePricesForClaimBlocks(blocks,status);

        const claimRows=[];
        let done=0;
        for(const c of claimCandidates){
          done++;
          status.textContent=`Neue/überlappende Claims werden verarbeitet ${done}/${claimCandidates.length}…`;
          let logs;
          try{
            logs=await fetchAll(`/transactions/${c.t.hash}/logs`);
          }catch(e){
            console.warn("Claim-Logs übersprungen:",c.t.hash,e);
            continue;
          }
          const reward=rewardFromLogs(logs,address);
          const gas=feeAptm(c.t);
          const block=Number(c.t.block_number??c.t.block);
          const px=await priceForTransaction(block,c.t.timestamp,history);
          const ph=priceAtBlock(history,block);
          const price=px.price;
          claimRows.push({
            user_id:ctx.currentUser.id,
            project_key:PROJECT_KEY,
            chain_key:CHAIN_KEY,
            wallet_id:walletIdForAddress(address),
            nft_contract:c.nft?.contract||null,
            nft_id:Number(c.nft.id),
            nft_name:c.nft?.classification?.nft_name || c.nft?.name || `NFT #${c.nft.id}`,
            nft_subtype:c.nft?.classification?.subtype || null,
            tx_hash:c.t.hash,
            block_number:block,
            tx_timestamp:c.t.timestamp,
            param1:c.p1,
            param2:c.p2,
            reward_aptm:reward,
            gas_aptm:gas,
            net_aptm:reward-gas,
            aptm_usd:price,
            reward_usd:price==null?null:reward*price,
            gas_usd:price==null?null:gas*price,
            price_block:px.priceBlock||null,
            price_source:px.source||null,
            updated_at:new Date().toISOString()
          });
        }
        await saveClaimRows(claimRows);
      }

      // Scanstand wird zentral über project_transactions / transactions_wallet_v1 geführt.

      let cachedAll;
      try{
        cachedAll=await backfillCachedClaimPrices(address,null,status);
      }catch(e){
        console.warn("APTM Preis-Backfill:",e);
        cachedAll=await loadCachedClaims(address,null);
      }
      const cached=filterClaimsForSelectedNfts(cachedAll,selectedNfts);
      rewardRows=cached.map(r=>{
        const liveClass=currentProjectNftById(r.nft_id,r.nft_contract);
        const nft=selectedNftMap.get(String(r.nft_id)) || allNftMap.get(String(r.nft_id)) || {
          id:String(r.nft_id),
          name:r.nft_name || `NFT #${r.nft_id}`,
          classification:null
        };
        const liveName=liveClass?.nft_name || r.nft_name || nft.name || `NFT #${r.nft_id}`;
        const liveSubtype=liveClass?.subtype || r.nft_subtype || "";
        return {
          miner:{
            wallet_address:address,
            nft_id:Number(r.nft_id),
            label:`${wallet?.label||"Wallet"} · ${liveName}${liveSubtype?" · "+liveSubtype:""} · #${r.nft_id}`
          },
          timestamp:r.tx_timestamp,
          block:Number(r.block_number),
          tx:r.tx_hash,
          p1:r.param1,
          p2:r.param2,
          reward:Number(r.reward_aptm||0),
          gas:Number(r.gas_aptm||0),
          net:Number(r.net_aptm||0),
          price:r.aptm_usd==null?null:Number(r.aptm_usd),
          rewardUsd:r.reward_usd==null?null:Number(r.reward_usd),
          gasUsd:r.gas_usd==null?null:Number(r.gas_usd),
          syncBlock:r.price_block||null,
          nftId:String(r.nft_id),
          nftName:liveName,
          nftSubtype:liveSubtype || null
        };
      }).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));

      renderMining();

      const mode=scan.state
        ? `zentrale Wallet-Historie inkrementell ab Block ${scan.fromBlock} (Puffer ${CLAIM_SCAN_BUFFER_BLOCKS})`
        : "zentrale Wallet-Historie vollständig initialisiert";
      const missingUsd=rewardRows.filter(x=>x.price==null).length;
      status.textContent=`Wallet-Claim-Cache: ${cachedAll.length} Claim(s) · aktuelle Auswahl: ${rewardRows.length} Claim(s) für ${selectedNfts.length} NFT(s) · ${mode}.${missingUsd?` ${missingUsd} ausgewählte Claim(s) noch ohne historischen USD-Kurs.`:""}`;
    } catch (e) {
      console.error("DAO1 Mining-Auswertung:",e);
      const msg=String(e?.message||e||"Unbekannter Fehler");
      const help=/RPC/.test(msg)
        ? " Eine Apertum-RPC-Abfrage ist fehlgeschlagen. Preisabfragen werden normalerweise in kleinere Bereiche geteilt und übersprungen; bereits gespeicherte Claims/Kurse bleiben erhalten."
        : /Explorer/.test(msg)
          ? " Der Apertum Explorer war bei einer Abfrage nicht erreichbar. Erneut starten; durch den Claim-Cache wird nicht von vorne doppelt gespeichert."
          : " Bitte erneut versuchen.";
      status.innerHTML = `<span class="error">${msg}</span><div class="note" style="margin-top:6px">${help}</div>`;
    } finally {
      if(btn){
        btn.disabled=false;
        btn.textContent=oldBtnText;
        btn.removeAttribute("aria-busy");
      }
    }
  }


  function currentProjectNftById(id,contract=null){
    const sid=String(id??"");
    const c=contract?lower(contract):null;
    return projectNfts.find(n =>
      n.project_key===PROJECT_KEY &&
      n.chain_key===CHAIN_KEY &&
      String(n.nft_id)===sid &&
      n.enabled!==false &&
      (!c || lower(n.nft_contract)===c)
    ) || null;
  }

  function currentSubtypeForClaim(id,fallback="",contract=null){
    return currentProjectNftById(id,contract)?.subtype || fallback || "";
  }

  function currentNameForClaim(id,fallback="",contract=null){
    return currentProjectNftById(id,contract)?.nft_name || fallback || `NFT #${id}`;
  }

  function miningNftOptions(){
    const map=new Map();
    for(const x of rewardRows){
      const id=String(x.nftId || x.miner?.nft_id || "");
      if(!id)continue;
      if(!map.has(id))map.set(id,{
        id,
        name:x.nftName || x.miner?.label || `NFT #${id}`,
        subtype:x.nftSubtype || ""
      });
    }
    return [...map.values()].sort((a,b)=>
      String(a.name).localeCompare(String(b.name),"de",{numeric:true}) || Number(a.id)-Number(b.id)
    );
  }

  function renderMiningFilters(){
    const el=document.getElementById("dao1MiningFilters");
    if(!el)return;
    const allNfts=miningNftOptions();
    const classes=[...new Set(allNfts.map(n=>n.subtype).filter(Boolean))].sort();
    const nfts=miningFilterClass==="__all" ? allNfts : allNfts.filter(n=>n.subtype===miningFilterClass);
    if(miningFilterNft!=="__all" && !nfts.some(n=>n.id===String(miningFilterNft)))miningFilterNft="__all";
    el.innerHTML=`
      <div class="custom-token-card">
        <span class="field-label">Auswertung filtern</span>
        <div class="custom-token-grid" style="grid-template-columns:minmax(145px,.55fr) minmax(145px,.55fr) minmax(190px,.7fr) minmax(260px,1.1fr);margin-top:8px">
          <label><span class="field-label">Von</span>${dao1DateControl(miningFilterFrom,"from","mining")}</label>
          <label><span class="field-label">Bis</span>${dao1DateControl(miningFilterTo,"to","mining")}</label>
          <label><span class="field-label">NFT-Klassifizierung</span><select onchange="DAO1Project.setMiningClassFilter(this.value)">
            <option value="__all" ${miningFilterClass==="__all"?"selected":""}>Alle Klassifizierungen</option>
            ${classes.map(c=>`<option value="${c}" ${miningFilterClass===c?"selected":""}>${c}</option>`).join("")}
          </select></label>
          <label><span class="field-label">NFT</span><select onchange="DAO1Project.setMiningResultNft(this.value)">
            <option value="__all" ${miningFilterNft==="__all"?"selected":""}>Alle NFTs (${nfts.length})</option>
            ${nfts.map(n=>`<option value="${n.id}" ${String(miningFilterNft)===n.id?"selected":""}>${n.name}${String(n.name||"").includes("#"+n.id)?"":" · #"+n.id}${n.subtype?" · "+n.subtype:""}</option>`).join("")}
          </select></label>
        </div>
        <div class="action-row" style="margin-top:8px"><button class="secondary" onclick="DAO1Project.clearMiningFilters()">Filter zurücksetzen</button></div>
        <div class="note" style="margin-top:6px">Diese Filter wirken nur auf Anzeige und Summen. Der Wallet-Scan bleibt vollständig. Historische NFTs werden berücksichtigt, sofern sie in der Besitzhistorie der Wallet geführt werden bzw. Claims dazu gespeichert sind.</div>
      </div>`;
  }

  function filteredRewardRows(){
    let rows=[...rewardRows];
    if(miningFilterFrom){
      const fromMs=new Date(miningFilterFrom+"T00:00:00").getTime();
      rows=rows.filter(x=>new Date(x.timestamp).getTime()>=fromMs);
    }
    if(miningFilterTo){
      const toMs=new Date(miningFilterTo+"T23:59:59.999").getTime();
      rows=rows.filter(x=>new Date(x.timestamp).getTime()<=toMs);
    }
    if(miningFilterClass!=="__all")rows=rows.filter(x=>String(x.nftSubtype||"")===miningFilterClass);
    if(miningFilterNft!=="__all")rows=rows.filter(x=>String(x.nftId || x.miner?.nft_id || "")===String(miningFilterNft));
    return rows;
  }

  function setMiningDateFilter(which,value){
    if(which==="from")miningFilterFrom=String(value||"");
    if(which==="to")miningFilterTo=String(value||"");
    renderMining();
  }

  function setMiningClassFilter(value){
    miningFilterClass=String(value||"__all");
    miningFilterNft="__all";
    renderMining();
  }

  function setMiningResultNft(value){
    miningFilterNft=String(value||"__all");
    renderMining();
  }

  function clearMiningFilters(){
    miningFilterFrom=DAO1_DEFAULT_FROM;
    miningFilterTo=dao1TodayIso();
    miningFilterClass="__all";
    miningFilterNft="__all";
    renderMining();
  }

  function renderMining() {
    const summary = document.getElementById("dao1MiningSummary");
    const table = document.getElementById("dao1MiningTable");
    renderMiningFilters();
    const visibleRows=filteredRewardRows();
    const r = visibleRows.reduce((s,x)=>s+x.reward,0);
    const g = visibleRows.reduce((s,x)=>s+x.gas,0);
    const u = visibleRows.reduce((s,x)=>s+(x.rewardUsd||0),0);

    const byNft=new Map();
    for(const x of visibleRows){
      const key=String(x.nftId || x.miner?.nft_id || "");
      if(!byNft.has(key))byNft.set(key,{
        id:key,
        name:x.nftName || x.miner?.label || `NFT #${key}`,
        subtype:x.nftSubtype || "",
        claims:0,reward:0,gas:0,rewardUsd:0
      });
      const a=byNft.get(key);
      a.claims++; a.reward+=x.reward; a.gas+=x.gas; a.rewardUsd+=(x.rewardUsd||0);
    }

    if (summary) summary.innerHTML = `
      <div class="project-summary">
        <div class="custom-token-card project-summary-box"><span class="field-label">Claims</span><strong>${visibleRows.length}</strong><div class="meta">${visibleRows.length!==rewardRows.length?`von ${rewardRows.length}`:""}</div></div>
        <div class="custom-token-card project-summary-box"><span class="field-label">NFTs</span><strong>${byNft.size}</strong></div>
        <div class="custom-token-card project-summary-box"><span class="field-label">Rewards</span><strong>${fmt(r)} APTM</strong></div>
        <div class="custom-token-card project-summary-box"><span class="field-label">historischer USD-Wert</span><strong>${usd(u)}</strong></div>
        <div class="custom-token-card project-summary-box"><span class="field-label">Gas</span><strong>${fmt(g)} APTM</strong></div>
      </div>
      ${byNft.size>1 ? `<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">Aufschlüsselung je NFT</summary>
        <div class="chain-table-wrap project-data-table" style="margin-top:8px"><table class="chain-admin-table"><thead><tr><th>NFT</th><th>Typ</th><th>Claims</th><th>Reward APTM</th><th>Reward USD</th><th>Gas APTM</th></tr></thead><tbody>
        ${[...byNft.values()].map(a=>`<tr><td>${a.name} · #${a.id}</td><td>${a.subtype||"–"}</td><td>${a.claims}</td><td>${fmt(a.reward)}</td><td>${usd(a.rewardUsd)}</td><td>${fmt(a.gas)}</td></tr>`).join("")}
        </tbody></table></div></details>` : ""}`;

    if (!table) return;
    if (!rewardRows.length) {
      table.innerHTML = '<div class="empty">Noch keine Mining-Auswertung geladen.</div>';
      return;
    }
    if (!visibleRows.length) {
      table.innerHTML = '<div class="empty">Für den gewählten Datums-/NFT-Filter wurden keine Claims gefunden.</div>';
      return;
    }
    table.innerHTML = `<div class="chain-table-wrap project-data-table"><table class="chain-admin-table"><thead><tr><th>NFT</th><th>Zeit</th><th>Block</th><th>Reward APTM</th><th>APTM/USD</th><th>Reward USD</th><th>Gas APTM</th><th>Netto APTM</th><th>Tx</th></tr></thead><tbody>${visibleRows.map(x=>`<tr><td>${x.nftName || x.miner.label}<div class="meta">#${x.nftId || x.miner.nft_id}${x.nftSubtype?" · "+x.nftSubtype:""}</div></td><td>${x.timestamp}</td><td>${x.block}</td><td>${fmt(x.reward)}</td><td>${x.price == null ? "–" : fmt(x.price)}</td><td>${usd(x.rewardUsd)}</td><td>${fmt(x.gas)}</td><td>${fmt(x.net)}</td><td><a href="${EXPLORER}/tx/${x.tx}" target="_blank" rel="noopener">${x.tx.slice(0,12)}…</a></td></tr>`).join("")}</tbody></table></div>`;
  }

  async function repairNftOwnershipForWallet(wallet){
    await ensureLoaded();
    const ctx=getContext?.();
    if(!ctx?.currentUser||!wallet)return {nfts:0,checked:0,repaired:0,remaining:0,failed:0};
    await loadOwnershipCache();
    const walletId=String(wallet.dbId||wallet.id||"");
    if(!walletId)return {nfts:0,checked:0,repaired:0,remaining:0,failed:0};
    let rows=window.getCachedNftsForWalletId?.(walletId);
    if(!Array.isArray(rows)){
      const q=await sb.from("nft_cache").select("nfts").eq("user_id",ctx.currentUser.id).eq("wallet_id",walletId).maybeSingle();
      if(q.error)throw q.error; rows=Array.isArray(q.data?.nfts)?q.data.nfts:[];
    }
    const current=rows.filter(n=>String(n?.chain||"")===CHAIN_KEY)
      .filter(n=>!(n?.possibleSpam||n?.userMarkedSpam))
      .map(n=>({id:String(n?.tokenId??""),contract:lower(n?.tokenAddress||""),name:n?.name||n?.collectionName||`NFT #${n?.tokenId??""}`}))
      .filter(n=>n.id&&n.contract);
    const gaps=current.filter(n=>dao1OwnershipNeedsRepair(wallet,n));
    let repaired=0,failed=0,cursor=0;
    async function worker(){
      while(cursor<gaps.length){
        const n=gaps[cursor++];
        try{await discoverOwnershipForNft(n.id,n.contract,n.name);repaired++;}
        catch(e){failed++;console.warn("DAO1 NFT-Ownership Repair",wallet?.label||walletId,n,e);}
      }
    }
    await Promise.all(Array.from({length:Math.min(2,gaps.length)},worker));
    await loadOwnershipCache();
    const remaining=current.filter(n=>dao1OwnershipNeedsRepair(wallet,n)).length;
    await dao1SaveWalletBootstrapState(wallet,remaining||failed?"partial":"complete",remaining?`${remaining} offen`:`${gaps.length} geprüft`);
    if(!remaining&&!failed)dao1LegacyWalletReconcileDone=true;
    else dao1LegacyWalletReconcileDone=false;
    await dao1EnsureIntrinsicClassifications(current);
    await loadDAO1OwnedDidRoots(true).catch(()=>{});
    const overview=document.getElementById("dao1-subtab-overview");
    if(overview&&overview.style.display!=="none")await renderDAO1BotOverview();
    return {nfts:current.length,checked:gaps.length,repaired,remaining,failed};
  }

  async function refreshNftOwnershipForWallet(wallet){
    const ctx=getContext?.();
    if(!ctx?.currentUser||!wallet)return {nfts:0,ownership:0,failed:0};
    const walletId=String(wallet.dbId||wallet.id||"");
    if(!walletId)return {nfts:0,ownership:0,failed:0};
    const {data,error}=await sb.from("nft_cache").select("nfts").eq("user_id",ctx.currentUser.id).eq("wallet_id",walletId).maybeSingle();
    if(error)throw error;
    const nfts=(Array.isArray(data?.nfts)?data.nfts:[])
      .filter(n=>String(n.chain||"")===CHAIN_KEY)
      .filter(n=>!(n.possibleSpam||n.userMarkedSpam))
      .map(n=>({id:String(n.tokenId),contract:lower(n.tokenAddress),name:n.name||n.collectionName||`NFT #${n.tokenId}`}));
    let saved=0,failed=0;
    for(const n of nfts){
      try{saved+=await discoverOwnershipForNft(n.id,n.contract,n.name);}
      catch(e){failed++;console.warn("NFT Ownership",n,e);}
    }
    await loadOwnershipCache();
    return {nfts:nfts.length,ownership:saved,failed};
  }

  async function resolveNftPurchaseEvidence(input={}) {
    // Projektadapter fuer die zentrale NFT-Registry: DAO1/APTMDAO-spezifische
    // Zahlungslogik bleibt hier, der NFT-Tab speichert das Ergebnis am zentralen NFT-Datensatz.
    await ensureLoaded();
    const contract=lower(input.contract||input.tokenAddress||"");
    const id=String(input.id??input.tokenId??"");
    const wallet=lower(input.acquisitionWallet||input.wallet||"");
    if(!contract||!id||!/^0x[0-9a-f]{40}$/.test(wallet))return null;
    const nft={
      contract,id,
      owned_from_at:input.acquiredAt||null,
      owned_from_block:Number(input.acquiredBlock||0)||0,
      acquisition_tx_hash:lower(input.acquisitionTxHash||"" )||null,
      acquisition_kind:input.acquisitionKind||null
    };
    const acq=await dao1TeamAcquisitionForNft(nft,wallet);
    const txHash=acq?.txHash||nft.acquisition_tx_hash||null;
    // Resolver v3: Ein fehlender Same-Tx-Zahlungsfluss ist NICHT automatisch ein
    // endgültiger Negativbefund. Historisch existieren separate Kauf-/Mint-Batches;
    // solange dafür keine deterministische Verknüpfung vorliegt, bleibt der Preis offen.
    // Nur eine tatsächlich gefundene Zahlung gilt hier als final geprüft.
    const fullyChecked=!!acq?.purchase;
    return {
      purchase:acq?.purchase||null,
      acquisitionKind:acq?.acquisitionKind||null,
      acquisitionTxHash:txHash,
      purchaseTxHash:acq?.purchaseTxHash||null,
      purchaseWallet:acq?.purchaseWallet||null,
      acquiredAt:acq?.at||nft.owned_from_at||null,
      acquiredBlock:Number(acq?.block||nft.owned_from_block||0)||null,
      sourceWallet:acq?.sourceWallet||null,
      checked:fullyChecked,
      resolverVersion:3,
      status:acq?.purchase?"price_verified":"incomplete_no_deterministic_payment",
      checkedAt:fullyChecked?new Date().toISOString():null
    };
  }

  const DAO1_LIFECYCLE_STATUS=new Set(["complete","partial","failed","deferred"]);
  function dao1LifecyclePart(status,detail="",meta={}){
    const normalized=DAO1_LIFECYCLE_STATUS.has(status)?status:"failed";
    return {status:normalized,detail:String(detail||""),required:meta.required!==false,...meta};
  }
  function dao1AggregateLifecycle(parts){
    const required=Object.values(parts||{}).filter(p=>p?.required!==false);
    if(required.some(p=>p?.status==="failed"))return "failed";
    if(required.some(p=>p?.status==="partial"))return "partial";
    if(required.some(p=>p?.status==="deferred"))return "deferred";
    return "complete";
  }
  async function dao1RunLifecyclePart(parts,key,fn,{required=true,successStatus=null}={}){
    const started=performance.now();
    try{
      const result=await fn();
      const derived=typeof successStatus==="function"?successStatus(result):successStatus;
      const status=DAO1_LIFECYCLE_STATUS.has(derived)?derived:"complete";
      parts[key]=dao1LifecyclePart(status,"",{required,result,durationMs:Math.round(performance.now()-started)});
      return result;
    }catch(e){
      const message=e?.message||String(e);
      console.warn(`DAO1 Lifecycle ${key}`,e);
      parts[key]=dao1LifecyclePart("failed",message,{required,error:message,durationMs:Math.round(performance.now()-started)});
      return null;
    }
  }

  async function refreshWalletAfterSave(walletId){
    const lifecycleStarted=performance.now();
    await ensureLoaded();
    const ctx=getContext?.();
    const wallet=(ctx?.wallets||[]).find(w=>String(w.dbId||w.id||"")===String(walletId||""));
    const address=walletAddress(wallet);
    if(!wallet||!address)return {ok:false,status:"deferred",skipped:true,apertumHandled:false,parts:{wallet:dao1LifecyclePart("deferred","Wallet nicht persistent auflösbar")}};

    // Phase 6.02 / Audit P1: Jeder fachlich relevante Teiljob meldet einen expliziten
    // Lifecycle-Status. Der Gesamtstatus wird nur hier aggregiert und anschließend bis
    // zum zentralen Wallet-Erstaufbau propagiert. Optionale Anzeige-/Cache-Teile dürfen
    // den fachlichen DAO1-Abschluss nicht künstlich verschlechtern.
    const parts={};
    await dao1RunLifecyclePart(parts,"ownershipCache",()=>loadOwnershipCache());

    // Audit P3: Fresh-Build-Parität. Historische NFT-Kandidaten werden aus der
    // unabhängigen Wallet-Transferhistorie der bekannten DAO1/APTMDAO-Contracts
    // rekonstruiert. Ein bestehender project_nft_ownership-Altbestand ist dafür
    // ausdrücklich keine Voraussetzung.
    const historicalDiscovery=await dao1RunLifecyclePart(parts,"historicalNftDiscovery",()=>discoverHistoricalNftCandidatesForWallet(wallet,"Wallet gespeichert · "),{
      successStatus:r=>Number(r?.failedContracts||0)>0?"partial":"complete"
    });
    const ownership=await dao1RunLifecyclePart(parts,"nftOwnership",()=>refreshWalletNftsAndOwnership(wallet,"Wallet gespeichert · ",{
      historicalCandidates:historicalDiscovery?.candidates||[]
    }),{
      successStatus:r=>Number(r?.failed||0)>0?"partial":"complete"
    });
    const projectRelevant=Number(ownership?.nfts||0)>0 || Number(ownership?.historicalCandidates||0)>0 || lower(address)===REFERRAL_WALLET;

    const txSync=await dao1RunLifecyclePart(parts,"transactions",()=>syncApertumTransactionCache(address,null));

    // Asset-Flows sind nur für echte DAO1/APTMDAO-Wallets bzw. das Referral-Wallet
    // erforderlich. Für andere EVM-Wallets ist das bewusste Überspringen "deferred",
    // aber optional und verschlechtert den Lifecycle-Gesamtstatus nicht.
    let flowSync={skipped:true,flows:0};
    if(projectRelevant){
      // P4: Fresh-Build braucht vollständige Token-Flows, aber nicht deren komplette
      // historische USD-Bewertung. Claim-relevante Flows werden unmittelbar danach
      // gezielt bewertet; übrige Detailwerte bleiben cache-first/lazy.
      flowSync=await dao1RunLifecyclePart(parts,"assetFlows",()=>syncApertumTokenFlowCache(address,{deferValuation:true}));
    }else{
      parts.assetFlows=dao1LifecyclePart("deferred","Für diese EVM-Wallet kein DAO1/APTMDAO-Asset belegt.",{required:false});
    }

    let referralSync={skipped:true,flows:0,synthetic:0};
    if(lower(address)===REFERRAL_WALLET){
      referralSync=await dao1RunLifecyclePart(parts,"referralRewards",()=>syncTargetedReferralWusdt(address));
    }else{
      parts.referralRewards=dao1LifecyclePart("deferred","Kein DAO1-Referral-Wallet.",{required:false});
    }

    await dao1RunLifecyclePart(parts,"transactionReadModel",()=>loadTransactionRows(address,null),{required:projectRelevant});
    let claimSync={skipped:!projectRelevant};
    if(projectRelevant){
      claimSync=await dao1RunLifecyclePart(parts,"claims",()=>enrichTransactionsWithClaims(address,null,transactionJobToken,{assetFlowScanComplete:!flowSync?.skipped}),{
        successStatus:r=>r==null?"deferred":"complete"
      });
    }else{
      parts.claims=dao1LifecyclePart("deferred","Keine DAO1/APTMDAO-Claim-Quelle belegt.",{required:false});
    }

    await dao1RunLifecyclePart(parts,"didRoots",()=>loadDAO1OwnedDidRoots(true),{required:projectRelevant});
    const treeCaches=await dao1RunLifecyclePart(parts,"teamCaches",()=>Promise.all([loadOldDao1TreeCache(),loadAptmdaoTreeCache()]),{required:false});
    const [legacy,aptm]=Array.isArray(treeCaches)?treeCaches:[null,null];
    if(legacy?.edges)dao1TeamDiscovery.legacy.edges=legacy.edges;
    if(aptm?.edges)dao1TeamDiscovery.aptmdao.edges=aptm.edges;
    renderDAO1TeamTreePanel();

    await dao1RunLifecyclePart(parts,"dashboardSummary",()=>loadDashboardSummary(),{required:false});

    const consistencyCandidates=new Map();
    for(const n of (dao1CachedCurrentNftsForWallet(wallet)||[]))consistencyCandidates.set(nftOwnershipKey(n.contract,n.id),n);
    for(const n of (historicalDiscovery?.candidates||[])){
      const key=nftOwnershipKey(n.contract,n.id);
      if(!consistencyCandidates.has(key))consistencyCandidates.set(key,n);
    }
    const remaining=[...consistencyCandidates.values()].filter(n=>!dao1OwnershipLifecycleCovered(wallet,n)).length;
    if(remaining>0){
      parts.ownershipConsistency=dao1LifecyclePart("partial",`${remaining} Lifecycle-Ownership-Lücke(n) offen`,{required:true,remaining});
    }else{
      parts.ownershipConsistency=dao1LifecyclePart("complete","",{required:true,remaining:0});
    }

    let status=dao1AggregateLifecycle(parts);
    const stateRow=await dao1SaveWalletBootstrapState(wallet,status,status==="complete"?"wallet bootstrap":Object.entries(parts).filter(([,p])=>p?.required!==false&&p?.status!=="complete").map(([k,p])=>`${k}=${p.status}`).join(", "));
    if(!stateRow){
      // Der fachliche Aufbau kann vorhanden sein, aber ohne persistierten Abschlussstatus
      // ist der Lifecycle nicht beweisbar vollständig. Das wird als partial propagiert.
      parts.bootstrapState=dao1LifecyclePart("partial","wallet_refresh_state konnte nicht gespeichert werden",{required:true});
      status=dao1AggregateLifecycle(parts);
    }else{
      parts.bootstrapState=dao1LifecyclePart("complete","",{required:true});
    }

    console.info("DAO1 Fresh-Build Lifecycle-Timings",{
      wallet:wallet?.label||walletId,
      walletId:String(walletId||""),
      address:lower(address),
      status,
      totalMs:Math.round(performance.now()-lifecycleStarted),
      parts:Object.fromEntries(Object.entries(parts).map(([key,p])=>[key,{status:p?.status,required:p?.required!==false,durationMs:Number(p?.durationMs||0)}]))
    });
    return {
      ok:status==="complete",
      status,
      apertureHandled:true,
      parts,
      ownership,
      txSync,
      flowSync,
      referralSync,
      claimSync
    };
  }

  async function ensureLoaded() {
    await ensureMounted();
    if (!loaded) { await refreshConfig(); loaded = true; }
    updateVisibility();
    // Die Übersicht ist beim ersten Mount bereits sichtbar/aktiv, ohne dass
    // switchSubtab("overview") ausgeführt wird. Deshalb muss sie hier selbst
    // gerendert werden, sonst bleibt der alte Platzhalter bis zum ersten Klick stehen.
    const overview = document.getElementById("dao1-subtab-overview");
    if (overview && overview.style.display !== "none") await renderDAO1BotOverview();
  }

  function dashboardRewardPeriods(rows,flows){
    // Dashboard zeigt bewusst Originalmengen je Asset; keine USD-Umrechnung.
    // Identität intern = Chain + Contract (Fallback Symbol), damit gleichnamige Token nicht vermischt werden.
    const flowByTx=new Map();
    for(const f of (flows||[])){const k=`${String(f.wallet_id||"")}::${String(f.tx_hash||"").toLowerCase()}`;if(!flowByTx.has(k))flowByTx.set(k,[]);flowByTx.get(k).push(f);}
    const now=new Date(),year=now.getFullYear(),month=now.getMonth(),prevYear=year-1;
    const empty=()=>({total:new Map(),previousYear:new Map(),year:new Map(),month:new Map()});
    const bot=empty(),referral=empty();
    const keysFor=dt=>{const keys=["total"];if(dt.getFullYear()===prevYear)keys.push("previousYear");if(dt.getFullYear()===year){keys.push("year");if(dt.getMonth()===month)keys.push("month");}return keys;};
    const addAsset=(bucket,keys,flow)=>{const amount=Number(flow?.amount||0);if(!Number.isFinite(amount)||amount===0)return;const symbol=String(flow?.token_symbol||flow?.token_name||"TOKEN");const address=lower(flow?.token_address||"")||null;const assetId=address||`symbol:${symbol.toLowerCase()}`;for(const period of keys){const map=bucket[period],id=`${CHAIN_KEY}|${assetId}`,cur=map.get(id)||{chain:CHAIN_KEY,address,assetId,symbol,amount:0};cur.amount+=amount;map.set(id,cur);}};
    for(const r of (rows||[])){
      const dt=new Date(r.tx_timestamp||0);if(!Number.isFinite(dt.getTime()))continue;const keys=keysFor(dt);
      const txKey=`${String(r.wallet_id||"")}::${String(r.tx_hash||"").toLowerCase()}`,incoming=(flowByTx.get(txKey)||[]).filter(f=>f.direction==="eingang");
      const wallet=rowWalletAddress(r),isDid=wallet===REFERRAL_WALLET&&String(r.claim_nft_subtype||"").toUpperCase()==="DID";
      const isVerifiedReferral=wallet===REFERRAL_WALLET&&lower(r.to_address||"")===REFERRAL_REWARD_CONTRACT&&incoming.some(isVerifiedReferralFlow);
      if(isDid){for(const f of incoming)addAsset(referral,keys,f);continue;}
      if(isVerifiedReferral&&!isClaimTxRow(r)){for(const f of incoming.filter(isVerifiedReferralFlow))addAsset(referral,keys,f);continue;}
      if(isClaimTxRow(r)){for(const f of claimPayoutEntriesForTx(r))addAsset(bot,keys,f);}
    }
    const finish=b=>Object.fromEntries(Object.entries(b).map(([k,map])=>[k,[...map.values()].filter(x=>x.amount!==0)]));
    return {rewards:finish(bot),referralRewards:finish(referral)};
  }

  async function loadDashboardRewardCache(){
    const ctx=getContext?.();if(!ctx?.currentUser?.id)return null;
    const loadPaged=async(table)=>{
      const out=[];let offset=0;
      while(true){
        const {data,error}=await sb.from(table).select("*").eq("user_id",ctx.currentUser.id).eq("project_key",PROJECT_KEY).eq("chain_key",CHAIN_KEY).range(offset,offset+DB_PAGE_SIZE-1);
        if(error)throw error;const page=data||[];out.push(...page);if(page.length<DB_PAGE_SIZE)break;offset+=DB_PAGE_SIZE;
      }
      return out.map(hydratePrivateWalletAddress);
    };
    const [rows,flows]=await Promise.all([loadPaged("project_transactions"),loadPaged("project_transaction_asset_flows")]);
    return dashboardRewardPeriods(rows,flows);
  }

  async function loadDashboardPartnerBotActivities(){
    const ctx=getContext?.();if(!ctx?.currentUser?.id)return [];
    const own=dao1OwnWalletSet();
    try{const {data,error}=await sb.from("dao_partner_bot_lifecycle_cache").select("tree_system,partner_did,wallet_address,bot_id,bot_type,bot_name,acquired_at,acquisition_tx_hash,evidence_type").eq("user_id",ctx.currentUser.id).eq("project_key",PROJECT_KEY).not("acquired_at","is",null).order("acquired_at",{ascending:false}).limit(120);if(error)throw error;return (data||[]).filter(r=>r.evidence_type!=="unique_tree_wallet"&&!own.has(lower(r.wallet_address))).slice(0,40).map(r=>({date:r.acquired_at,project:r.tree_system==="aptmdao"?"APTMDAO":"DAO1",partner:dao1TeamAliasFor(r.partner_did,r.tree_system==="aptmdao"?"aptmdao":"legacy")||`${r.tree_system==="aptmdao"?"APTMDAO":"DID"} #${r.partner_did||"?"}`,what:`${r.bot_type||"Bot"} #${r.bot_id}`}));}catch(e){console.warn("DAO Partneraktivitäten Cache",e);return [];}
  }

  async function loadDashboardSummary(){
    // Absichtlich KEIN ensureLoaded(): Das Dashboard darf den vollständigen DAO1-Tab
    // (NFTs, Konfiguration, Transaktions-UI usw.) nicht als Nebeneffekt initialisieren.
    try{
      // Ownership zuerst laden: Root-DIDs dürfen weder von einem zuvor geöffneten DAO-Tab
      // noch von projectWallets()/aktuellen Balances abhängen. Erst danach werden die
      // Tree-Subcaches mit den erkannten Roots gelesen.
      await loadOwnershipCache({preferShared:true}).catch(e=>console.warn("DAO1 Dashboard Ownership",e));
      await loadDAO1OwnedDidRoots(true).catch(e=>console.warn("DAO1 Dashboard DID-Roots",e));
      const [cached,aptmCached,rewards,recentPartnerActivities]=await Promise.all([loadOldDao1TreeCache(),loadAptmdaoTreeCache(),loadDashboardRewardCache(),loadDashboardPartnerBotActivities()]);
      const patch={updatedAt:new Date().toISOString()};
      if(cached?.edges && dao1OwnedDidRoots.length){
        const previousMode=dao1TeamTreeMode;dao1TeamTreeMode="legacy";const rows=legacyTreeRows(cached.edges);dao1TeamTreeMode=previousMode;
        const ownWallets=dao1OwnWalletSet(),dao1PartnerWallets=new Set(rows.map(r=>lower(r.wallet)).filter(w=>w&&!ownWallets.has(w)));
        patch.dao1Partners=dao1PartnerWallets.size;
        let aptmPartnerWallets=new Set();
        if(aptmCached?.edges&&aptmdaoOwnedDidRoots.length){dao1TeamTreeMode="aptmdao";const aptmRows=legacyTreeRows(aptmCached.edges);dao1TeamTreeMode=previousMode;aptmPartnerWallets=new Set(aptmRows.map(r=>lower(r.wallet)).filter(w=>w&&!ownWallets.has(w)));patch.aptmdaoPartners=aptmPartnerWallets.size;}
        else patch.aptmdaoPartners=null;
        patch.teamPartners=new Set([...dao1PartnerWallets,...aptmPartnerWallets]).size;
        patch.updatedAt=cached.registryUpdatedAt||cached.state?.updated_at||patch.updatedAt;
      }
      if(rewards){patch.rewards=rewards.rewards;patch.referralRewards=rewards.referralRewards;}
      patch.recentPartnerActivities=recentPartnerActivities;
      // "davon aktiv" bleibt bewusst offen: Im aktuellen DAO1-Code existiert noch kein
      // belastbarer Contract-/Target-Proof, der "Bot läuft" vs. "Target erreicht" trennt.
      window.setDashboardProjectCacheStats?.("dao1",patch);
    }catch(e){console.warn("DAO1 Dashboard-Summary Cache",e);}
  }

  return { switchSubtab, setTeamTreeMode:setDAO1TeamTreeMode, saveTeamAlias:saveDAO1TeamAlias, setTeamRootFilter:setDAO1TeamRootFilter, discoverTeamTree:discoverDAO1TeamTree, configure, ensureMounted, refreshConfig, ensureLoaded, refreshWalletAfterSave, loadDashboardSummary, resolveNftPurchaseEvidence, updateVisibility, loadMiningRewards, addMiner, deleteMiner, selectWallet, selectNft, selectNftClass, discoverMinerNfts, useManualNft, saveNftClassification, setMiningDateFilter, setMiningClassFilter, setMiningResultNft, clearMiningFilters,
    refreshTransactionHistory, repriceCachedTransactionHistory, copyPriceJobLog, exportPriceJobLog, setTransactionFilter,setResultWalletFilter,setClaimNftFilter, enforceDao1DateInput, setDao1DateFromPicker, openDao1DatePicker, exportTransactionsExcel, exportTransactionsPdf, openNftTabForSelectedWallet, showMissingHistoricalPrices, saveManualHistoricalPrice,
    getAptmUsdtPairAddress: () => PAIR_ADDRESS,
    getAptmMarketStartBlock: () => APTM_MARKET_START_BLOCK,
    historicalAptmPriceAtBlock, refreshNftOwnershipForWallet, repairNftOwnershipForWallet, backfillNativeClaimAssetFlows, backfillNativeClaimAssetFlowPrices, classifyNftType };
})();
