window.DAO1Project = (() => {
  const PROJECT_KEY = "dao1";
  const PROJECT_NAME = "DAO1";
  const CHAIN_KEY = "apertum";
  const CLAIM_SELECTOR = "0x86bb8f37";
  const SYSTEM_ADDRESS = "0x0200000000000000000000000000000000000001";
  const PAIR_ADDRESS = "0x38AcBfA5108D3c76d6cEa4D380182E832A289b57";
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

  let sb = null;
  let getContext = null;
  let mounted = false;
  let loaded = false;
  let projectRefs = [];
  let miners = [];
  let rewardRows = [];
  let ownershipRows = [];
  let selectedWalletId = "";
  let selectedNftId = "";
  let manualNftId = "";
  let nftMetaById = new Map();
  let currentApertumNfts = [];
  let projectNfts = [];
  let selectedNftClass = "Mining-Bot";
  const CLAIM_SCAN_BUFFER_BLOCKS = 250;
  const CLAIM_SCAN_TYPE = "claims_wallet_v2";
  const TX_SCAN_TYPE = "transactions_wallet_v1";
  const TOKEN_FLOW_SCAN_TYPE = "token_flows_wallet_v1";
  let transactionRows = [];
  let transactionAssetFlows = [];
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

    const app = document.getElementById("appContent");
    if (app && !document.getElementById("tab-dao1")) {
      const panel = document.createElement("div");
      panel.id = "tab-dao1";
      panel.className = "tab-panel";
      panel.innerHTML = `
        <div class="project-subtabs"><button class="tab-btn active" onclick="DAO1Project.switchSubtab('overview',this)">Übersicht</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('transactions',this)">Transaktionen</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('claims',this)">Claims</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('referrals',this)">Referral Rewards</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('liquidity',this); renderProjectLpTab('dao1',['apertum'],'dao1LpContent','2025-12-31',false)">Liquidity Pools</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('config',this)">Konfiguration</button><button class="tab-btn" onclick="DAO1Project.switchSubtab('help',this)">Hilfe</button></div>
        <div id="dao1-subtab-overview" class="project-subtab-panel"><div class="custom-token-card"><div class="chain-title">DAO1 · Apertum</div><div class="note">Projektübersicht für DAO1-spezifische Assets auf Apertum. Detailfunktionen sind in die Unter-Tabs gegliedert.</div></div></div>
        <div id="dao1-subtab-claims" class="project-subtab-panel" style="display:none"><div id="dao1ClaimsContent"></div></div>
        <div id="dao1-subtab-referrals" class="project-subtab-panel" style="display:none"><div id="dao1ReferralContent"></div></div>
        <div id="dao1-subtab-liquidity" class="project-subtab-panel" style="display:none"><div id="dao1LpContent"></div></div>
        <div id="dao1-subtab-config" class="project-subtab-panel" style="display:none"><div id="dao1AssetSummary" class="custom-token-card"><span class="loading">Projekt-Konfiguration wird geladen…</span></div></div>
        <div id="dao1-subtab-transactions" class="project-subtab-panel" style="display:none"><div class="custom-token-card"><div class="chain-title">📒 Apertum Transaktionshistorie</div><div class="note" style="margin-bottom:10px">Zentrale, dauerhaft gespeicherte Apertum-Historie. Wallet-Wechsel lesen den Cache; erst „Daten aktualisieren“ lädt neue Blockchain-Daten, aktualisiert NFTs/Besitzerhistorie und reichert neue Claims an.</div><div id="dao1TransactionControls"></div><div id="dao1TransactionStatus" class="status" style="margin-top:10px"></div>
        <div id="dao1PriceJobPanel" class="custom-token-card debug-frame" style="display:block;margin-top:10px;padding:10px 12px">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><strong>⏱️ Historische Preis-Neuberechnung · Diagnose-Log</strong><button type="button" class="secondary" onclick="DAO1Project.copyPriceJobLog()">Log kopieren</button><button type="button" class="secondary" onclick="DAO1Project.exportPriceJobLog()">Log als TXT exportieren</button><span id="dao1PriceJobLogState" class="meta">Eigenes Log-Fenster wie in Discovery; vollständig kopier- und exportierbar.</span></div>
          <div id="dao1PriceJobMetrics" style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:8px" class="meta">Noch kein historischer Preisjob in dieser Sitzung.</div>
          <textarea id="dao1PriceJobLog" readonly spellcheck="false" style="width:100%;min-height:260px;max-height:420px;resize:vertical;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.45;background:var(--card,#111);color:inherit;border:1px solid rgba(128,128,128,.25);border-radius:8px;padding:10px;box-sizing:border-box">Bereit.</textarea>
        </div><div id="dao1TransactionSummary" style="margin-top:10px"></div><div id="dao1TransactionTable" style="margin-top:10px"></div></div></div>
        <div id="dao1-subtab-help" class="project-subtab-panel" style="display:none"><div class="custom-token-card"><h3 style="margin-top:0">DAO1 / Apertum · Hilfe</h3><p class="note"><strong>Liquidity Pools:</strong> Beim Öffnen werden ausschließlich die zuletzt gespeicherten Supabase-Daten angezeigt. Aktuelle LP-Positionen, 31.12.-Vergleich und Add-/Remove-Historie werden nur über „Daten aktualisieren“ neu von Blockchain/Explorer ermittelt und danach wieder gecached.</p><p class="note"><strong>Transaktionen &amp; Claims:</strong> „Daten aktualisieren“ synchronisiert neue Transaktionen, Claims, historische APTM-Kurse sowie NFT-Bestand und Besitzerhistorie. Filter und Exporte arbeiten danach aus dem gespeicherten Bestand.</p><p class="note"><strong>Konfiguration:</strong> Hier werden DAO1-Projektassets und NFTs klassifiziert. Die Klassifizierung steuert Filter und Bezeichnungen, nicht die Erkennung der Blockchain-Transaktionen. Fehlende historische APTM-Kurse können manuell ergänzt werden und bleiben als manuell gekennzeichnet.</p></div></div>
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
    if(name==="transactions" || name==="claims" || name==="referrals"){
      await refreshTransactionHistory(false);
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
    await loadOwnershipCache();
    await enrichHistoricalNftNames();
    const walletsNow=projectWallets();
    if(!walletsNow.some(w=>String(w.id)===String(selectedWalletId))) selectedWalletId=String(walletsNow[0]?.id||"");
    await loadCurrentApertumNfts();
    renderMinerSelector();
    renderNftClassification();
    renderAssetSummary();
    renderMiningFilters();
    renderTransactionControls();
    if(!txFilterWallet) txFilterWallet="__all";
    try{
      const wallets=allProjectWalletOptions();
      if(txFilterWallet==="__all"){
        transactionRows=await loadAllApertumTransactionRows(wallets,null);
        transactionAssetFlows=await loadAllAssetFlowRows(wallets);
      }else{
        const tw=projectWallets().find(w=>String(w.id)===String(txFilterWallet));
        transactionRows=tw?await loadTransactionRows(walletAddress(tw),null):[];
        transactionAssetFlows=tw?await loadAssetFlowRows(walletAddress(tw)):[];
      }
      renderTransactionHistory();
    }catch(e){console.warn("Transaction cache init:",e);setTransactionStatus("error",e.message||String(e));}
    updateVisibility();
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

  function projectWallets() {
    const ctx = getContext?.();
    return (ctx?.wallets || []).filter(walletHasProjectAsset);
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
      <div class="chain-table-wrap dao1-data-table"><table class="chain-admin-table dao1-nft-class-table" style="table-layout:fixed;width:100%">
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

  async function loadOwnershipCache() {
    const ctx = getContext?.();
    if (!sb || !ctx?.currentUser) return;
    const { data, error } = await sb.from("project_nft_ownership")
      .select("*")
      .eq("user_id", ctx.currentUser.id)
      .eq("project_key", PROJECT_KEY)
      .order("owned_from_block", { ascending: true });
    if (error) {
      ownershipRows = [];
      if (!/does not exist|schema cache/i.test(error.message || "")) console.warn("NFT Ownership Cache:", error);
      return;
    }
    ownershipRows = (data || []).map(hydratePrivateWalletAddress);
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

  async function loadCurrentApertumNfts() {
    const ctx=getContext?.();
    const wallet=projectWallets().find(w=>String(w.id)===String(selectedWalletId));
    if(!ctx?.currentUser || !wallet){ currentApertumNfts=[]; return; }
    const walletId=String(wallet.dbId || wallet.id);
    const {data,error}=await sb.from("nft_cache")
      .select("nfts")
      .eq("user_id",ctx.currentUser.id)
      .eq("wallet_id",walletId)
      .maybeSingle();
    if(error){ console.warn("DAO1 NFT-Cache:",error); currentApertumNfts=[]; return; }
    currentApertumNfts=(Array.isArray(data?.nfts)?data.nfts:[])
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

  async function refreshWalletNftsAndOwnership(wallet,statusPrefix=""){
    const ctx=getContext?.(),address=walletAddress(wallet);if(!ctx?.currentUser||!address)return {nfts:0,ownership:0,failed:0};
    if(typeof ctx.refreshApertumNftsForWallet==="function")await ctx.refreshApertumNftsForWallet(wallet,p=>setTransactionStatus("loading",`${statusPrefix}${wallet.label}: Apertum-NFTs werden aktualisiert…`,`Explorer-Seite ${p}`));
    const prev=selectedWalletId;selectedWalletId=String(wallet.id);await loadCurrentApertumNfts();let saved=0,failed=0;for(const n of currentApertumNfts){try{saved+=await discoverOwnershipForNft(n.id,n.contract,n.name);}catch(e){failed++;console.warn("NFT Ownership",n,e);}}selectedWalletId=prev;await loadOwnershipCache();return {nfts:currentApertumNfts.length,ownership:saved,failed};
  }

  async function discoverMinerNfts() {
    const ctx=getContext?.();
    const wallet=projectWallets().find(w=>String(w.id)===String(selectedWalletId));
    const address=walletAddress(wallet);
    if(!ctx?.currentUser || !address) return;

    await loadCurrentApertumNfts();
    renderMinerSelector("Aktueller Apertum-NFT-Bestand wurde aus dem NFT-Tab übernommen. Besitzerhistorien werden für die sichtbaren NFTs ergänzt…");

    let saved=0, failed=0;
    // Keep this bounded: process all non-spam current Apertum NFTs, but histories individually.
    for(const n of currentApertumNfts){
      try{ saved += await discoverOwnershipForNft(n.id,n.contract,n.name); }
      catch(e){ failed++; console.warn("NFT Ownership",n,e); }
    }
    await loadOwnershipCache();
    renderMinerSelector(`${currentApertumNfts.length} aktuelle nicht-spamverdächtige Apertum-NFT(s) übernommen; ${saved} Besitzabschnitt(e) gespeichert${failed?`, ${failed} Historie(n) nicht abrufbar`:""}.`);
    renderNftClassification();
  }


  async function fetchWalletNftTransfersForOwnership(address,nftContract,nftId){
    const out=[];
    const contract=lower(nftContract),wantedId=String(nftId);
    const candidates=[
      `${EXPLORER_API}/addresses/${address}/token-transfers?type=ERC-721%2CERC-1155`,
      `${EXPLORER_API}/addresses/${address}/token-transfers`
    ];
    let lastError=null;
    for(const initial of candidates){
      try{
        const rows=await fetchPagedUrl(initial,500);
        for(const t of rows){
          const token=t?.token||{};
          const c=lower(token.address||token.address_hash||t.token_address||t.token_address_hash||"");
          if(c!==contract)continue;
          const id=transferTokenId(t);
          if(String(id)!==wantedId)continue;
          if(isNonSpamNftTransfer(t))out.push(t);
        }
        if(out.length)break;
      }catch(e){lastError=e;}
    }
    if(!out.length&&lastError)console.warn("Apertum Wallet-NFT-Transferfallback:",address,nftContract,nftId,lastError);
    return out;
  }

  function nftTransferDedupeKey(t){
    const hash=String(t?.transaction_hash||t?.tx_hash||H(t?.transaction)||"").toLowerCase();
    return `${Number(t?.block_number||0)}|${Number(t?.log_index||0)}|${hash}|${lower(H(t?.from))}|${lower(H(t?.to))}`;
  }


  async function dao1ApertumRpc(method,params=[]){
    const cfg=getContext?.().chainConfig?.[CHAIN_KEY]||{};
    const url=String(cfg.rpcUrl||cfg.rpc_url||"").trim();
    if(!url)throw new Error("Apertum RPC fehlt in Chain-Konfiguration.");
    const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
    const j=await res.json();
    if(!res.ok||j?.error)throw new Error(j?.error?.message||`Apertum RPC HTTP ${res.status}`);
    return j.result;
  }

  function dao1TopicAddress(topic){
    const t=String(topic||"");
    return t.length>=42?lower("0x"+t.slice(-40)):"";
  }

  async function fetchErc721TransferLogsForNft(nftContract,nftId){
    const transferTopic=ethers.id("Transfer(address,address,uint256)");
    const tokenTopic="0x"+BigInt(String(nftId)).toString(16).padStart(64,"0");
    const latestHex=await dao1ApertumRpc("eth_blockNumber",[]);
    const latest=Number(BigInt(latestHex));
    const out=[];
    const STEP=1000000;
    for(let from=0;from<=latest;from+=STEP){
      const to=Math.min(latest,from+STEP-1);
      try{
        const logs=await dao1ApertumRpc("eth_getLogs",[{
          address:nftContract,
          fromBlock:"0x"+from.toString(16),
          toBlock:"0x"+to.toString(16),
          topics:[transferTopic,null,null,tokenTopic]
        }]);
        for(const l of (logs||[]))out.push(l);
      }catch(e){
        // Manche RPCs erlauben kleinere Bereiche. In diesem Fall denselben 1M-Bereich in 100k teilen.
        for(let sf=from;sf<=to;sf+=100000){
          const st=Math.min(to,sf+99999);
          const logs=await dao1ApertumRpc("eth_getLogs",[{
            address:nftContract,
            fromBlock:"0x"+sf.toString(16),
            toBlock:"0x"+st.toString(16),
            topics:[transferTopic,null,null,tokenTopic]
          }]);
          for(const l of (logs||[]))out.push(l);
        }
      }
    }
    const blockTs=new Map();
    const rows=[];
    for(const l of out){
      const block=Number(BigInt(l.blockNumber||"0x0"));
      if(!blockTs.has(block)){
        try{
          const b=await dao1ApertumRpc("eth_getBlockByNumber",[l.blockNumber,false]);
          blockTs.set(block,b?.timestamp?new Date(Number(BigInt(b.timestamp))*1000).toISOString():null);
        }catch{blockTs.set(block,null);}
      }
      rows.push({
        from:dao1TopicAddress(l.topics?.[1]),
        to:dao1TopicAddress(l.topics?.[2]),
        block_number:block,
        log_index:Number(BigInt(l.logIndex||"0x0")),
        timestamp:blockTs.get(block),
        transaction_hash:String(l.transactionHash||"").toLowerCase(),
        token:{address:nftContract},
        token_id:String(nftId)
      });
    }
    return rows;
  }

  async function discoverOwnershipForNft(nftId, nftContract=DEFAULT_MINER_NFT_CONTRACT, knownName="") {
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

    // Dritte Quelle: direkter ERC-721 Transfer-Event-Scan für genau Contract + Token-ID.
    // Nur wenn Explorer-/Wallet-Historie weniger als 2 Transfers liefert; damit bleibt der
    // normale Refresh schnell, Walletwechsel werden aber vollständig rekonstruierbar.
    if(transferMap.size<2){
      try{
        const direct=await fetchErc721TransferLogsForNft(nftContract,nftId);
        for(const t of direct)transferMap.set(nftTransferDedupeKey(t),t);
      }catch(e){console.warn("Apertum direkter NFT-Transfer-Log-Fallback",nftContract,nftId,e);}
    }
    const transfers=[...transferMap.values()];
    const chronological=[...transfers].sort((a,b)=>{
      const ba=Number(a.block_number||0), bb=Number(b.block_number||0);
      if(ba!==bb)return ba-bb;
      return Number(a.log_index||0)-Number(b.log_index||0);
    });
    const periods=[];
    let current=null;
    for(const t of chronological){
      const from=lower(H(t.from)), to=lower(H(t.to));
      const block=Number(t.block_number||0);
      const ts=t.timestamp||t.block_timestamp||t.blockTimeStamp||null;
      if(current && from===lower(current.wallet_address)){
        current.owned_to_block=block;
        current.owned_to_at=ts;
        current.is_current=false;
        periods.push(current);
        current=null;
      }
      if(to && to!=="0x0000000000000000000000000000000000000000"){
        current={
          user_id:ctx.currentUser.id, project_key:PROJECT_KEY, chain_key:CHAIN_KEY,
          nft_contract:nftContract, nft_id:Number(nftId), nft_name:nftName,
          wallet_address:to, owned_from_block:block, owned_from_at:ts,
          owned_to_block:null, owned_to_at:null, is_current:true
        };
      }
    }
    if(current) periods.push(current);
    if(!periods.length) return 0;

    // User-Eigentum ist walletübergreifend: alle eigenen Apertum/EVM-Wallets bilden
    // eine gemeinsame Eigentümersphäre. Ein Transfer Wallet A -> Wallet B ist KEIN Neuerwerb.
    const trackedWallets=(ctx.wallets||[]).filter(w=>walletAddress(w));
    const tracked=new Set(trackedWallets.map(w=>lower(walletAddress(w))).filter(Boolean));
    const ownPeriods=periods.filter(p=>tracked.has(lower(p.wallet_address))).map(p=>{
      const walletId=walletIdForAddress(p.wallet_address);
      const {wallet_address:_privateWalletAddress,...rest}=p;
      return {...rest,wallet_id:walletId};
    });
    if(!ownPeriods.length)return 0;

    // Deterministischer Neuaufbau aus der vollständigen NFT-Transferhistorie.
    // Alte Cache-Perioden dürfen keinen falschen Ersterwerb konservieren.
    const rebuilt=ownPeriods.sort((a,b)=>Number(a.owned_from_block||0)-Number(b.owned_from_block||0));

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

  async function fetchWithRetry(url, options={}, label="Netzwerk", attempts=3) {
    let lastError=null;
    for(let i=1;i<=attempts;i++){
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),30000);
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
    const min=Math.max(0,Number(minBlock||0)),max=Math.max(min,Number(maxBlock||0));
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

  async function savePriceRows(rows){
    if(!rows.length)return;
    const {error}=await sb.from("aptm_price_history")
      .upsert(rows,{onConflict:"pool_address,block_number,log_index",ignoreDuplicates:true});
    if(error){console.warn("APTM Preis-Cache speichern:",error);throw error;}
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
    const from=Math.max(0,Number(fromBlock||0)),to=Math.max(from,Number(toBlock||0));
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
    const min=Math.max(0,Number(minBlock||0)),max=Math.max(min,Number(maxBlock||0));
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
          if(part.length)await savePriceRows(part);
          await savePriceCoverage(from,to,part.length);
          rows.push(...part);
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

  async function ensureExactPriceAnchors(blocks,status){
    const targets=[...new Set((blocks||[]).map(Number).filter(Number.isFinite))].sort((a,b)=>a-b);
    const map=new Map();
    if(!targets.length)return map;

    const cached=await loadCachedPriceAnchors(targets);
    const validCached=cached.filter(r=>r?.aptm_usd!=null && r?.sync_block!=null);
    const nullCached=cached.filter(r=>r?.aptm_usd==null || r?.sync_block==null);
    for(const r of validCached)map.set(Number(r.target_block),r);
    if(activePriceJobLog){activePriceJobLog.anchorHits+=validCached.length;priceJobLog(`Anchor-Cache: ${validCached.length}/${targets.length} gültige Zielblöcke · ${nullCached.length} leere Anchor(s) werden neu geprüft`);}

    if(nullCached.length && getContext?.()?.isAdmin){
      const repaired=await revalidateNullCachedAnchors(nullCached,status);
      await savePriceAnchors(repaired);
      for(const r of repaired)map.set(Number(r.target_block),r);
      if(activePriceJobLog)priceJobLog(`Leere Anchor-Revalidierung: ${repaired.filter(r=>r.aptm_usd!=null).length}/${repaired.length} mit Preis wiederhergestellt`);
    }else{
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
    const clusters=splitAnchorClusters(missing);
    if(activePriceJobLog)priceJobLog(`${missing.length} neue Zielblöcke · ${clusters.length} lokale Anchor-Cluster`);
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
        source:`Noch kein Marktpreis vorhanden (Pre-Launch) · ${PRICE_PRELAUNCH_TAG}`,
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
    return String(t.method || t.method_name || t.decoded_input?.method_call || "").trim()
      || (String(t.raw_input||t.input||"").slice(0,10).toLowerCase()===CLAIM_SELECTOR ? "claimReward" : "Transfer/Call");
  }


  function tokenTransferTxHash(t){
    return String(t?.transaction_hash || t?.tx_hash || H(t?.transaction) || t?.hash || "").toLowerCase();
  }

  function tokenTransferAddress(t){
    return lower(H(t?.token) || t?.token_address || t?.address || "");
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
    const a=lower(address),from=lower(H(t?.from)),to=lower(H(t?.to));
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
    const a=lower(address),from=lower(H(t?.from)),to=lower(H(t?.to));
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
    const BATCH=500;
    for(let i=0;i<rows.length;i+=BATCH){
      const {error}=await sb.from("project_transaction_asset_flows")
        .upsert(rows.slice(i,i+BATCH),{onConflict:"user_id,project_key,chain_key,wallet_id,flow_key"});
      if(error)throw error;
    }
  }

  async function loadAssetFlowRows(address=null){
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
    return rows.map(hydratePrivateWalletAddress);
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

  function flowDisplay(f){
    const amount=Number(f?.amount||0);
    const symbol=String(f?.token_symbol||"TOKEN")||"TOKEN";
    return `${fmt(amount)} ${symbol}`;
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
    const aptmBlocks=[...new Set(rows.filter(r=>isWrappedAptmSymbol(r.token_symbol,r.token_name)).map(r=>Number(r.block_number)).filter(Number.isFinite))];
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
      }else if(isWrappedAptmSymbol(r.token_symbol,r.token_name)&&history){
        const px=await priceForTransaction(Number(r.block_number),r.tx_timestamp,history);
        if(px.price!=null){
          r.price_usd=Number(px.price);
          r.value_usd=amount*Number(px.price);
          r.price_source=`wAPTM/APTM 1:1 · ${px.source}`;
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
          console.warn("DAO1 Asset-Flow Preis nicht ermittelbar",r.token_symbol,r.token_address,r.block_number,e);
        }
      }
    }
    return rows;
  }

  async function syncApertumTokenFlowCache(address){
    const ctx=getContext?.();
    const state=await getTokenFlowScanState(address);
    const fromBlock=state?.last_scanned_block?Math.max(0,Number(state.last_scanned_block)-CLAIM_SCAN_BUFFER_BLOCKS):null;
    const base=`${EXPLORER_API}/addresses/${address}/token-transfers?type=ERC-20`;
    let url=base,page=0,maxSeen=Number(state?.last_scanned_block||0),fetched=0;
    const rows=[];
    while(url){
      page++;
      setTransactionStatus("loading",`ERC-20 Asset-Flows werden geladen · Seite ${page}…`,
        fromBlock==null?`${fetched.toLocaleString("de-DE")} Token-Transfers bisher.`:`Ab Block ${fromBlock.toLocaleString("de-DE")} inkl. Sicherheitspuffer.`);
      const j=await fetchJson(url,"Apertum Explorer · ERC-20 Token-Transfers");
      const items=j.items||[];
      fetched+=items.length;
      let oldest=Infinity;
      for(let ix=0;ix<items.length;ix++){
        const t=items[ix];
        const block=Number(t.block_number??t.block??0);
        if(Number.isFinite(block)){oldest=Math.min(oldest,block);maxSeen=Math.max(maxSeen,block);}
        if(fromBlock!=null&&block<fromBlock)continue;
        const tokenAddress=tokenTransferAddress(t);
        const txHash=tokenTransferTxHash(t);
        if(!tokenAddress||!txHash)continue;
        const decimals=tokenTransferDecimals(t);
        const raw=tokenTransferRawValue(t);
        rows.push({
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
      if(fromBlock!=null&&Number.isFinite(oldest)&&oldest<fromBlock)break;
      url=nextUrl(base,j.next_page_params);
    }
    await valueAssetFlows(rows);
    await saveAssetFlowRows(rows);

    // ERC-20-Eingänge können existieren, obwohl die Wallet nicht from/to der Basis-TX ist.
    // Solche Events werden als Transaktionszeile ergänzt, damit Rewards nicht unsichtbar bleiben.
    const existing=await loadTransactionRows(address,null);
    const existingHashes=new Set(existing.map(r=>String(r.tx_hash||"").toLowerCase()));
    const synthetic=[];
    const byTx=new Map();
    for(const f of rows){
      if(existingHashes.has(String(f.tx_hash).toLowerCase()))continue;
      if(!byTx.has(f.tx_hash))byTx.set(f.tx_hash,f);
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
    }
    if(synthetic.length)await saveTransactionRows(synthetic);
    if(maxSeen)await saveTokenFlowScanState(address,maxSeen);
    return {flows:rows.length,synthetic:synthetic.length,maxSeen};
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
    const {error}=await sb.from("project_transactions")
      .upsert(rows,{onConflict:"user_id,project_key,chain_key,wallet_id,tx_hash"});
    if(error)throw error;
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

  async function loadTransactionRows(address=null,status=null){
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
    return rows.map(hydratePrivateWalletAddress);
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
    const claimCalls=rows.filter(r=>r.selector===CLAIM_SELECTOR);
    const enriched=claimCalls.filter(r=>r.claim_nft_id!=null);
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

  async function enrichTransactionHistoricalPrices(address,jobToken=transactionJobToken){
    const txs=await loadTransactionRows(address,null);
    const pending=txs.filter(r=>!r.price_is_manual && Number(r.block_number)>0 && (
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
          aptm_usd:null,value_usd:null,gas_usd:null,claim_reward_usd:r.claim_reward_aptm==null?r.claim_reward_usd:null,
          price_source:px.source,updated_at:new Date().toISOString()
        });
        continue;
      }
      const price=Number(px.price);
      priceRows.push({
        user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
        wallet_id:walletIdForAddress(address),tx_hash:r.tx_hash,
        aptm_usd:price,value_usd:Number(r.value_aptm||0)*price,gas_usd:Number(r.gas_aptm||0)*price,
        claim_reward_usd:r.claim_reward_aptm==null?r.claim_reward_usd:Number(r.claim_reward_aptm||0)*price,
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
        const rows=allRows.filter(r=>!String(r.price_source||"").includes(PRICE_SOURCE_TAG) && !String(r.price_source||"").includes(PRICE_MISSING_TAG));
        totalRows+=allRows.length;
        if(!rows.length){
          setTransactionStatus("ready",`Wallet ${wi+1}/${targets.length}: historische Preise bereits aktuell.`,`Preisrevision ${PRICE_SOURCE_TAG}; ${allRows.length.toLocaleString("de-DE")} gecachte TX mussten nicht erneut geprüft werden.`);
          continue;
        }

        const blocks=[...new Set(rows.map(r=>Number(r.block_number)).filter(Number.isFinite))];
        if(!activePriceJobLog)priceJobStart(rows.length,blocks.length);
        priceJobLog(`Wallet ${wi+1}/${targets.length} · ${rows.length} veraltete TX · ${blocks.length} Preisblöcke`);
        setTransactionStatus("loading",`Wallet ${wi+1}/${targets.length}: historische Poolpreise werden geprüft…`,
          `${rows.length.toLocaleString("de-DE")} gecachte Transaktionen · ${blocks.length.toLocaleString("de-DE")} unterschiedliche TX-Blöcke.`);
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
              aptm_usd:null,value_usd:null,gas_usd:null,claim_reward_usd:r.claim_reward_aptm==null?r.claim_reward_usd:null,
              price_source:(missingDiag.reason==="genesis_reached"?`Noch kein Marktpreis vorhanden (Pre-Launch) · ${PRICE_PRELAUNCH_TAG}`:px.source),updated_at:new Date().toISOString()
            });
            if(r.claim_nft_id!=null){
              totalClaims++;
              claimPatches.push({
                user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
                wallet_id:walletIdForAddress(address),tx_hash:r.tx_hash,nft_contract:r.claim_nft_contract||null,nft_id:Number(r.claim_nft_id),
                aptm_usd:null,reward_usd:null,gas_usd:null,price_block:null,
                price_source:(missingDiag.reason==="genesis_reached"?`Noch kein Marktpreis vorhanden (Pre-Launch) · ${PRICE_PRELAUNCH_TAG}`:px.source),updated_at:new Date().toISOString()
              });
            }
            continue;
          }
          const price=Number(px.price);
          txPatches.push({
            user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
            wallet_id:walletIdForAddress(address),tx_hash:r.tx_hash,
            aptm_usd:price,value_usd:Number(r.value_aptm||0)*price,gas_usd:Number(r.gas_aptm||0)*price,
            claim_reward_usd:r.claim_reward_aptm==null?r.claim_reward_usd:Number(r.claim_reward_aptm||0)*price,
            price_source:px.source,updated_at:new Date().toISOString()
          });
          if(r.claim_nft_id!=null){
            totalClaims++;
            claimPatches.push({
              user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
              wallet_id:walletIdForAddress(address),tx_hash:r.tx_hash,nft_contract:r.claim_nft_contract||null,nft_id:Number(r.claim_nft_id),
              aptm_usd:price,reward_usd:Number(r.claim_reward_aptm||0)*price,gas_usd:Number(r.gas_aptm||0)*price,
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
          await syncApertumTransactionCache(address,null);
          if(job!==transactionJobToken)return;
          await syncApertumTokenFlowCache(address);
          if(job!==transactionJobToken)return;
          const walletRows=await loadTransactionRows(address,null);
          if(job!==transactionJobToken)return;
          await enrichTransactionsWithClaims(address,null,job);
          if(job!==transactionJobToken)return;
          await backfillCachedClaimPrices(address,null,document.getElementById("dao1TransactionStatus"));
          if(job!==transactionJobToken)return;
          await enrichTransactionHistoricalPrices(address,job);
          if(job!==transactionJobToken)return;
          setTransactionStatus("loading",`Wallet ${i+1}/${targets.length}: ${w.label} · NFTs werden aktualisiert…`,"Apertum NFT-Bestand und Besitzerhistorie werden mit demselben Voll-Scan aktualisiert.");
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
            `Blockchain-, NFT-Bestands- und Besitzerhistorien-Aktualisierung abgeschlossen. Preisqualität ${PRICE_SOURCE_TAG}: ${quality.exact.toLocaleString("de-DE")} exact · ${quality.fallback.toLocaleString("de-DE")} fallback · ${quality.prelaunch.toLocaleString("de-DE")} Pre-Launch · ${quality.missing.toLocaleString("de-DE")} ohne Preis · ${quality.manual.toLocaleString("de-DE")} manuell · ${distinctPrices.toLocaleString("de-DE")} unterschiedliche APTM/USD-Werte.`);
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

  async function enrichTransactionsWithClaims(address,status=null,jobToken=transactionJobToken){
    const txs=await loadTransactionRows(address,null);
    const allClaimTxs=txs.filter(t=>t.selector===CLAIM_SELECTOR);
    // v21: Auch bereits erkannte Claims werden neu angereichert, wenn noch keine generische
    // Reward-Asset-Klassifizierung vorhanden ist. Die TX-Menge ist klein und kommt aus Cache.
    const cachedClaims=await loadCachedClaims(address,null);
    const claimByHash=new Map(cachedClaims.map(c=>[String(c.tx_hash||"").toLowerCase(),c]));
    const claimTxs=allClaimTxs.filter(t=>{
      const c=claimByHash.get(String(t.tx_hash||"").toLowerCase());
      return t.claim_nft_id==null || !c?.reward_asset_symbol;
    });
    if(!claimTxs.length){
      setTransactionStatus("ready",`Keine neuen Claims anzureichern.`,`${allClaimTxs.length.toLocaleString("de-DE")} Claim-Transaktionen sind bereits assetgenau verarbeitet.`);
      return;
    }
    setTransactionStatus("loading",`${claimTxs.length.toLocaleString("de-DE")} Claim(s) werden assetgenau angereichert…`,
      `Auszahlungen werden aus ERC-20 Asset-Flows gelesen; native Legacy-APTM bleiben als Fallback.`);
    const nftMap=allKnownNftsForWallet(address);
    const allFlows=await loadAssetFlowRows(address);
    const flowsByTx=new Map();
    for(const f of allFlows){
      const h=String(f.tx_hash||"").toLowerCase();
      if(!flowsByTx.has(h))flowsByTx.set(h,[]);
      flowsByTx.get(h).push(f);
    }
    const claimRows=[];
    for(let i=0;i<claimTxs.length;i++){
      if(jobToken!==transactionJobToken)return;
      const t=claimTxs[i];
      if(i===0 || (i+1)%10===0 || i+1===claimTxs.length){
        setTransactionStatus("loading",`Claims werden angereichert ${i+1}/${claimTxs.length}…`,`NFT + tatsächliches Auszahlungsasset werden zugeordnet.`);
      }
      const ps=words(t.raw_input||"");
      const knownId=[ps[0],ps[1]].filter(v=>v!=null).map(v=>v.toString()).find(id=>nftMap.has(id));
      const decodedId=knownId || ps[0]?.toString() || ps[1]?.toString();
      if(!decodedId || !/^\d+$/.test(decodedId))continue;
      const nft=nftMap.get(String(decodedId))||{
        id:String(decodedId),contract:lower(DEFAULT_MINER_NFT_CONTRACT),
        name:`NFT #${decodedId}`,classification:null
      };

      const incoming=(flowsByTx.get(String(t.tx_hash||"").toLowerCase())||[])
        .filter(f=>f.direction==="eingang")
        .sort((a,b)=>Number(b.value_usd||0)-Number(a.value_usd||0));
      const primary=incoming[0]||null;

      // Legacy-native APTM nur verwenden, wenn in dieser Claim-TX kein ERC-20-Reward gefunden wurde.
      let legacyAptm=0;
      if(!primary){
        try{
          const logs=await fetchAll(`/transactions/${t.tx_hash}/logs`);
          legacyAptm=rewardFromLogs(logs,address);
        }catch(e){console.warn("Claim legacy reward logs:",e);}
      }

      const rewardAmount=primary?Number(primary.amount||0):Number(legacyAptm||0);
      const rewardSymbol=primary?String(primary.token_symbol||"TOKEN"):"APTM";
      const rewardUsd=primary?.value_usd==null?null:Number(primary.value_usd);
      const rewardPrice=primary?.price_usd==null?null:Number(primary.price_usd);
      const rewardSource=primary?.price_source||null;
      const legacyRewardAptm=primary
        ? (isWrappedAptmSymbol(primary.token_symbol,primary.token_name)?rewardAmount:null)
        : rewardAmount;

      claimRows.push({
        user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
        wallet_id:walletIdForAddress(address),nft_contract:nft.contract||null,nft_id:Number(decodedId),
        nft_name:nft.classification?.nft_name || nft.name || `NFT #${decodedId}`,
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
        aptm_usd:null,reward_usd:rewardUsd,gas_usd:null,
        price_block:null,
        price_source:null,updated_at:new Date().toISOString()
      });
    }

    if(claimRows.length){
      await saveClaimRows(claimRows);
      for(let ri=0;ri<claimRows.length;ri++){
        if(jobToken!==transactionJobToken)return;
        const r=claimRows[ri];
        const tx=txs.find(t=>t.tx_hash===r.tx_hash);
        const {error}=await sb.from("project_transactions")
          .update({
            claim_nft_id:r.nft_id,
            claim_nft_name:r.nft_name,
            claim_nft_subtype:r.nft_subtype,
            // Legacy-Feld nur noch für native/wAPTM-kompatible Rewards.
            claim_reward_aptm:r.reward_aptm,
            claim_reward_usd:r.reward_asset_usd,
            updated_at:new Date().toISOString()
          })
          .eq("user_id",getContext?.().currentUser.id)
          .eq("wallet_id",walletIdForAddress(address))
          .eq("tx_hash",r.tx_hash);
        if(error)console.warn("Tx Claim asset enrichment:",error);
      }
      setTransactionStatus("ready",`${claimRows.length.toLocaleString("de-DE")} Claim(s) assetgenau angereichert und gespeichert.`);
    }
  }

  function transactionClaimDescriptor(r){
    if(r.claim_nft_id==null)return null;
    const subtype=currentSubtypeForClaim(r.claim_nft_id,r.claim_nft_subtype);
    const name=currentNameForClaim(r.claim_nft_id,r.claim_nft_name);
    return {id:String(r.claim_nft_id),subtype,name};
  }

  function transactionFilterNfts(){
    const map=new Map();
    for(const r of transactionRows){
      const d=transactionClaimDescriptor(r);
      if(!d)continue;
      if(txFilterClass!=="__all" && d.subtype!==txFilterClass)continue;
      if(!map.has(d.id))map.set(d.id,d);
    }
    return [...map.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),"de",{numeric:true}) || Number(a.id)-Number(b.id));
  }

  function transactionFilterClasses(){
    return [...new Set(transactionRows.map(r=>transactionClaimDescriptor(r)?.subtype).filter(Boolean))].sort();
  }

  function dao1TransactionType(r){
    if(r?.claim_nft_id!=null || String(r?.selector||"").toLowerCase()===CLAIM_SELECTOR)return "Claim (Bot)";
    const own=new Set(allProjectWalletOptions().map(w=>lower(walletAddress(w))).filter(Boolean));
    const referralFlows=incomingAssetFlowsForTx(r).filter(f=>String(f.token_symbol||"").toUpperCase()==="WUSDT"&&!own.has(lower(f.counterparty_address||"")));
    if(referralFlows.length)return "Referral Reward?";
    if(assetFlowsForTx(r).length)return "Token-Transfer";
    if(r?.direction==="intern")return "Interner Transfer";
    if(r?.direction==="eingang")return "Eingang";
    if(r?.direction==="ausgang")return "Ausgang";
    return r?.method&&r.method!=="Transfer"?"Contract Call":"Transaktion";
  }

  function referralRewardCandidates(){
    const own=new Set(allProjectWalletOptions().map(w=>lower(walletAddress(w))).filter(Boolean));
    const out=[];
    for(const r of transactionRows){
      if(r.claim_nft_id!=null || String(r.selector||"").toLowerCase()===CLAIM_SELECTOR)continue;
      const flows=incomingAssetFlowsForTx(r).filter(f=>String(f.token_symbol||"").toUpperCase()==="WUSDT" && !own.has(lower(f.counterparty_address||"")));
      if(flows.length)out.push({...r,_referralFlows:flows});
    }
    return out;
  }


  function renderClaimsTab(){
    const el=document.getElementById("dao1ClaimsContent");if(!el)return;
    const rows=transactionRows.filter(r=>r.claim_nft_id!=null || String(r.selector||"").toLowerCase()===CLAIM_SELECTOR);
    const flowCount=rows.reduce((a,r)=>a+incomingAssetFlowsForTx(r).length,0);
    const totalUsd=rows.reduce((a,r)=>a+incomingAssetFlowsForTx(r).reduce((x,f)=>x+Number(f.value_usd||0),0),0);
    el.innerHTML=`<div class="custom-token-card"><div class="chain-title">⛏️ Bot Claims</div><div class="note">Claims werden über die Claim-Transaktion erkannt; die tatsächliche Auszahlung kommt aus den zugehörigen ERC-20 Asset-Flows. Dadurch sind wAPTM, wUSDT und weitere Wrapped Tokens möglich.</div></div>
      <div class="project-summary"><div class="custom-token-card project-summary-box"><span class="field-label">Claims</span><strong>${rows.length.toLocaleString("de-DE")}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">Asset-Flows</span><strong>${flowCount.toLocaleString("de-DE")}</strong><div class="meta">${totalUsd?usd(totalUsd):"USD noch nicht für alle Assets verfügbar"}</div></div></div>
      <div class="custom-token-card dao1-data-table-card" style="padding:0;overflow:hidden"><div class="chain-table-wrap dao1-data-table dao1-transaction-table-wrap" style="margin:0;max-height:680px;overflow:auto"><table class="dao1-transaction-table"><thead><tr><th>Zeit</th><th>Wallet</th><th>Typ</th><th>NFT</th><th>Auszahlung</th><th>USD historisch</th><th>Gas APTM</th><th>Tx</th></tr></thead><tbody>${rows.map(r=>{const d=transactionClaimDescriptor(r);const flows=incomingAssetFlowsForTx(r);const flowUsd=flows.reduce((a,f)=>a+Number(f.value_usd||0),0);return `<tr><td>${r.tx_timestamp?new Date(r.tx_timestamp).toLocaleString("de-CH",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"–"}</td><td>${r.wallet_label||r.wallet_address||"–"}</td><td>Claim (Bot)</td><td><strong>${d?.name||"NFT"}</strong>${r.claim_nft_id!=null?`<div class="meta">#${r.claim_nft_id}${d?.subtype?" · "+d.subtype:""}</div>`:""}</td><td>${flows.length?flows.map(f=>`<strong>${flowDisplay(f)}</strong><div class="meta">${f.token_address||""}</div>`).join(""):(r.claim_reward_aptm!=null?`${fmt(r.claim_reward_aptm)} APTM <span class="meta">(Legacy)</span>`:"–")}</td><td>${flowUsd?usd(flowUsd):(r.claim_reward_usd==null?"–":usd(Number(r.claim_reward_usd)))}</td><td>${fmt(r.gas_aptm)}</td><td><a href="${EXPLORER}/tx/${r.tx_hash}" target="_blank" rel="noopener">${String(r.tx_hash||"").slice(0,12)}…</a></td></tr>`;}).join("")}</tbody></table></div></div>`;
  }

  function renderReferralRewardsTab(){
    const el=document.getElementById("dao1ReferralContent");if(!el)return;
    const candidates=referralRewardCandidates();
    const total=candidates.reduce((a,r)=>a+(r._referralFlows||[]).reduce((x,f)=>x+Number(f.amount||0),0),0);
    el.innerHTML=`<div class="custom-token-card"><div class="chain-title">🤝 Referral Rewards</div><div class="note">Referral Rewards werden in wUSDT ausgezahlt. Der Asset-Flow ist jetzt vollständig erfasst; die endgültige Sender-/Contract-Regel wird noch verifiziert, damit normale wUSDT-Eingänge nicht fälschlich als Referral Reward zählen.</div></div>
      <div class="project-summary"><div class="custom-token-card project-summary-box"><span class="field-label">wUSDT-Kandidaten</span><strong>${candidates.length.toLocaleString("de-DE")}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">Summe Kandidaten</span><strong>${fmt(total)} wUSDT</strong><div class="meta">Noch nicht als verifizierte Referral-Summe gewertet</div></div></div>
      <div class="custom-token-card debug-frame"><strong>DEBUG / DEV · wUSDT Referral-Kandidaten (${candidates.length})</strong><div class="note">Eingehende wUSDT-Asset-Flows, die keine Bot-Claims und keine internen Wallet-Transfers sind. Sender/Contract daraus verifizieren.</div><div class="chain-table-wrap dao1-data-table dao1-transaction-table-wrap" style="margin-top:8px;max-height:520px;overflow:auto"><table class="dao1-transaction-table"><thead><tr><th>Zeit</th><th>Wallet</th><th>Von</th><th>Methode</th><th>wUSDT</th><th>USD</th><th>Tx</th></tr></thead><tbody>${candidates.map(r=>{const flows=r._referralFlows||[];const amount=flows.reduce((a,f)=>a+Number(f.amount||0),0);const value=flows.reduce((a,f)=>a+Number(f.value_usd||0),0);return `<tr><td>${r.tx_timestamp?new Date(r.tx_timestamp).toLocaleString("de-CH",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"–"}</td><td>${r.wallet_label||r.wallet_address||"–"}</td><td>${flows.map(f=>`<code>${f.counterparty_address||"–"}</code>`).join("<br>")}</td><td>${r.method||"–"}</td><td>${fmt(amount)}</td><td>${value?usd(value):"–"}</td><td><a href="${EXPLORER}/tx/${r.tx_hash}" target="_blank" rel="noopener">${String(r.tx_hash||"").slice(0,12)}…</a></td></tr>`;}).join("")}</tbody></table></div></div>`;
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
    if(txFilterKind==="claims")rows=rows.filter(r=>r.claim_nft_id!=null);
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
      if(kind==="claim")return r.claim_nft_id!=null && r.claim_reward_usd==null;
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
          const qty=kind==="claim"?Number(r.claim_reward_aptm||0):Number(r.gas_aptm||0);
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
      const qty=kind==="claim"?Number(r.claim_reward_aptm||0):Number(r.gas_aptm||0);
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
    const {error}=await sb.from("project_transactions").update(txPatch)
      .eq("user_id",userId).eq("wallet_id",String(row.wallet_id||walletIdForAddress(row.wallet_address))).eq("tx_hash",txHash);
    if(error)return alert(`Speichern fehlgeschlagen: ${error.message}`);
    if(kind==="claim"){
      const claimPatch={
        aptm_usd:price,reward_usd:Number(qty||0)*price,
        gas_usd:Number(row.gas_aptm||0)*price,
        price_source:source,price_is_manual:true,updated_at:new Date().toISOString()
      };
      const q=sb.from("project_nft_claims").update(claimPatch).eq("user_id",userId).eq("wallet_id",String(row.wallet_id||walletIdForAddress(row.wallet_address))).eq("tx_hash",txHash);
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
    const claimedAptm=claims.reduce((a,r)=>a+Number(r.claim_reward_aptm||0),0);
    const claimedUsd=claims.reduce((a,r)=>a+Number(r.claim_reward_usd||0),0);
    const claimAssetTotals=new Map();
    for(const r of claims){
      const flows=incomingAssetFlowsForTx(r);
      for(const f of flows){
        const sym=String(f.token_symbol||"TOKEN")||"TOKEN";
        claimAssetTotals.set(sym,(claimAssetTotals.get(sym)||0)+Number(f.amount||0));
      }
    }
    const claimAssetSummary=[...claimAssetTotals.entries()].map(([sym,val])=>`${fmt(val)} ${sym}`).join(" · ");
    const inAptm=rows.filter(r=>r.direction==="eingang").reduce((a,r)=>a+Number(r.value_aptm||0),0);
    const outAptm=rows.filter(r=>r.direction==="ausgang").reduce((a,r)=>a+Number(r.value_aptm||0),0);
    const gas=rows.reduce((a,r)=>a+Number(r.gas_aptm||0),0);
    const gasUsd=rows.reduce((a,r)=>a+Number(r.gas_usd||0),0);
    const claimUsdMissing=claims.filter(r=>r.claim_reward_usd==null).length;
    const gasUsdMissing=rows.filter(r=>Number(r.gas_aptm||0)>0 && r.gas_usd==null).length;
    const priceQuality=historicalPriceQualityCounts(rows);
    if(summary)summary.innerHTML=`<div class="project-summary">
      <div class="custom-token-card project-summary-box"><span class="field-label">Transaktionen</span><strong>${rows.length}</strong></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Claims</span><strong>${claims.length}</strong></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Claim-Auszahlungen</span><strong>${claimAssetSummary||(`${fmt(claimedAptm)} APTM`)}</strong><div class="meta">${claimedUsd?usd(claimedUsd):"–"} · tatsächliche Auszahlungsassets${claimUsdMissing?` · <button class="secondary" style="padding:2px 6px;font-size:.75rem" onclick="DAO1Project.showMissingHistoricalPrices('claim')">${claimUsdMissing} ohne USD-Wert anzeigen</button>`:""}</div></div>
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
      <div class="chain-table-wrap dao1-data-table dao1-transaction-table-wrap" style="margin:0;max-height:680px;overflow:auto"><table class="chain-admin-table dao1-transaction-table" style="margin:0"><thead style="position:sticky;top:0;z-index:2"><tr>
      <th>Zeit</th>${txFilterWallet==="__all"?"<th>Wallet</th>":""}<th>Typ</th><th>Richtung</th><th>Methode</th><th>Assets</th><th>Claim / NFT</th><th>APTM/USD</th><th>USD</th><th>Gas APTM</th><th>Gas USD historisch</th><th>Tx</th>
    </tr></thead><tbody>${rows.map(r=>{
      const claim=r.claim_nft_id!=null;
      const currentSubtype=claim?currentSubtypeForClaim(r.claim_nft_id,r.claim_nft_subtype):"";
      const currentName=claim?currentNameForClaim(r.claim_nft_id,r.claim_nft_name):"";
      const amount=Number(r.value_aptm||0)+(claim?Number(r.claim_reward_aptm||0):0);
      const usdVal=claim?Number(r.claim_reward_usd||0):Number(r.value_usd||0);
      return `<tr>
        <td class="dao1-col-time">${r.tx_timestamp?new Date(r.tx_timestamp).toLocaleString("de-CH",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"–"}</td>${txFilterWallet==="__all"?`<td class="dao1-col-wallet"><code>${r.wallet_address||"–"}</code></td>`:""}<td class="dao1-col-type"><strong>${dao1TransactionType(r)}</strong></td><td class="dao1-col-direction">${r.direction||"–"}</td><td class="dao1-col-method">${r.method||"–"}</td>
        <td class="dao1-col-assets">${txAssetSummary(r)}</td>
        <td class="dao1-col-claim">${claim?`<strong>${currentName||"NFT"}</strong><div class="meta">#${r.claim_nft_id}${currentSubtype?" · "+currentSubtype:""} · Auszahlung siehe Assets</div>`:"–"}</td>
        <td class="dao1-col-price">${r.aptm_usd==null?`–<div class="meta">${historicalPriceQuality(r)==="prelaunch"?"Noch kein Marktpreis vorhanden (Pre-Launch)":(r.price_source||"Kein belastbarer historischer Preis")}</div>`:`${fmt(r.aptm_usd)}<div class="meta">${historicalPriceQuality(r)} · ${r.price_source||"historischer Poolpreis"}</div>`}</td><td class="dao1-col-usd">${usdVal?usd(usdVal):"–"}</td>
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
    const headers=["Timestamp","Wallet","Richtung","Methode","Tx Hash","Block","From","To","APTM","Claim NFT","NFT Typ","Claim Reward APTM","APTM/USD historisch","Preisquelle","Kurs manuell","Wert USD","Gas APTM","Gas USD","Status"];
    let body=`<Row>${xCell("DAO1 / Apertum Transaktionshistorie")}</Row><Row>${xCell("Wallet")}${xCell(walletLabel)}</Row><Row>${xCell("Datumsbereich")}${xCell(`${txFilterFrom||"offen"} bis ${txFilterTo||"offen"}`)}</Row><Row>${xCell("Filter")}${xCell(`Typ: ${txFilterKind}; Klassifizierung: ${txFilterClass}; NFT: ${txFilterNft}`)}</Row><Row></Row>`;
    body+=`<Row>${headers.map(h=>xCell(h)).join("")}</Row>`;
    for(const r of rows){
      const claim=r.claim_nft_id!=null;
      const amt=Number(r.value_aptm||0)+(claim?Number(r.claim_reward_aptm||0):0);
      const valUsd=claim?Number(r.claim_reward_usd||0):Number(r.value_usd||0);
      const currentSubtype=claim?currentSubtypeForClaim(r.claim_nft_id,r.claim_nft_subtype):"";
      const currentName=claim?currentNameForClaim(r.claim_nft_id,r.claim_nft_name):"";
      const values=[
        r.tx_timestamp,r.wallet_address,r.direction,r.method,r.tx_hash,Number(r.block_number||0),
        r.from_address,r.to_address,amt,claim?`${currentName||"NFT"} #${r.claim_nft_id}`:"",
        currentSubtype,claim?Number(r.claim_reward_aptm||0):0,
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
    const totalClaim=claims.reduce((a,r)=>a+Number(r.claim_reward_aptm||0),0);
    const totalClaimUsd=claims.reduce((a,r)=>a+Number(r.claim_reward_usd||0),0);
    const totalGas=rows.reduce((a,r)=>a+Number(r.gas_aptm||0),0);
    const totalGasUsd=rows.reduce((a,r)=>a+Number(r.gas_usd||0),0);
    const missingPrice=rows.filter(r=>(r.claim_nft_id!=null||Number(r.gas_aptm||0)>0)&&r.aptm_usd==null).length;
    const w=window.open("","_blank");
    if(!w)return alert("Popup wurde blockiert.");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Apertum Transaktionshistorie</title><style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#111}h1{font-size:18px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:4px;vertical-align:top}th{background:#eee}code{font-size:9px}.meta{font-size:9px;color:#555}@page{size:A4 landscape;margin:10mm}
    </style></head><body><h1>DAO1 / Apertum Transaktionshistorie</h1>
    <p><strong>Wallet:</strong> ${xmlEsc(walletLabel)}<br><strong>Datumsbereich:</strong> ${xmlEsc(txFilterFrom||"offen")} bis ${xmlEsc(txFilterTo||"offen")}<br><strong>Filter:</strong> Typ ${xmlEsc(txFilterKind)}, Klassifizierung ${xmlEsc(txFilterClass)}, NFT ${xmlEsc(txFilterNft)}</p>
    <table style="margin-bottom:10px"><thead><tr><th>Transaktionen</th><th>Claims</th><th>Claim APTM</th><th>Claim USD historisch</th><th>Gas APTM</th><th>Gas USD historisch</th><th>ohne historischen Preis</th></tr></thead><tbody><tr><td>${rows.length}</td><td>${claims.length}</td><td>${fmt(totalClaim)}</td><td>${usd(totalClaimUsd)}</td><td>${fmt(totalGas)}</td><td>${usd(totalGasUsd)}</td><td>${missingPrice}</td></tr></tbody></table>
    <table><thead><tr><th>Zeit</th><th>Wallet</th><th>Richtung</th><th>Methode</th><th>APTM</th><th>Claim / NFT</th><th>APTM/USD</th><th>USD</th><th>Gas APTM</th><th>Gas USD historisch</th><th>Tx Hash</th></tr></thead><tbody>
    ${rows.map(r=>{
      const claim=r.claim_nft_id!=null;
      const currentSubtype=claim?currentSubtypeForClaim(r.claim_nft_id,r.claim_nft_subtype):"";
      const currentName=claim?currentNameForClaim(r.claim_nft_id,r.claim_nft_name):"";
      const amt=Number(r.value_aptm||0)+(claim?Number(r.claim_reward_aptm||0):0);
      const valUsd=claim?Number(r.claim_reward_usd||0):Number(r.value_usd||0);
      return `<tr><td>${xmlEsc(r.tx_timestamp)}</td><td><code>${xmlEsc(r.wallet_address)}</code></td><td>${xmlEsc(r.direction)}</td><td>${xmlEsc(r.method)}</td><td>${fmt(amt)}</td><td>${claim?`${xmlEsc(currentName||"NFT")} #${r.claim_nft_id}<div class="meta">${xmlEsc(currentSubtype)} · Reward ${fmt(r.claim_reward_aptm)} APTM</div>`:"–"}</td><td>${r.aptm_usd==null?"–":`${fmt(r.aptm_usd)}<div class="meta">${xmlEsc(r.price_source||"historischer Poolpreis")}</div>`}</td><td>${valUsd?usd(valUsd):"–"}</td><td>${fmt(r.gas_aptm)}</td><td>${r.gas_usd==null?"–":usd(Number(r.gas_usd))}</td><td><code>${xmlEsc(r.tx_hash)}</code></td></tr>`;
    }).join("")}
    <tr style="font-weight:bold;background:#eee"><td colspan="4">TOTAL</td><td>${fmt(totalClaim)}</td><td>${claims.length} Claims</td><td>–</td><td>${usd(totalClaimUsd)}</td><td>${fmt(totalGas)}</td><td>${usd(totalGasUsd)}</td><td>–</td></tr>
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

  async function saveClaimRows(rows){
    if(!rows.length)return;
    const {error}=await sb.from("project_nft_claims").upsert(rows,{onConflict:"user_id,project_key,chain_key,tx_hash"});
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
        <div class="chain-table-wrap dao1-data-table" style="margin-top:8px"><table class="chain-admin-table"><thead><tr><th>NFT</th><th>Typ</th><th>Claims</th><th>Reward APTM</th><th>Reward USD</th><th>Gas APTM</th></tr></thead><tbody>
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
    table.innerHTML = `<div class="chain-table-wrap dao1-data-table"><table class="chain-admin-table"><thead><tr><th>NFT</th><th>Zeit</th><th>Block</th><th>Reward APTM</th><th>APTM/USD</th><th>Reward USD</th><th>Gas APTM</th><th>Netto APTM</th><th>Tx</th></tr></thead><tbody>${visibleRows.map(x=>`<tr><td>${x.nftName || x.miner.label}<div class="meta">#${x.nftId || x.miner.nft_id}${x.nftSubtype?" · "+x.nftSubtype:""}</div></td><td>${x.timestamp}</td><td>${x.block}</td><td>${fmt(x.reward)}</td><td>${x.price == null ? "–" : fmt(x.price)}</td><td>${usd(x.rewardUsd)}</td><td>${fmt(x.gas)}</td><td>${fmt(x.net)}</td><td><a href="${EXPLORER}/tx/${x.tx}" target="_blank" rel="noopener">${x.tx.slice(0,12)}…</a></td></tr>`).join("")}</tbody></table></div>`;
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

  async function ensureLoaded() {
    await ensureMounted();
    if (!loaded) { await refreshConfig(); loaded = true; }
    updateVisibility();
  }

  return { switchSubtab, configure, ensureMounted, refreshConfig, ensureLoaded, updateVisibility, loadMiningRewards, addMiner, deleteMiner, selectWallet, selectNft, selectNftClass, discoverMinerNfts, useManualNft, saveNftClassification, setMiningDateFilter, setMiningClassFilter, setMiningResultNft, clearMiningFilters,
    refreshTransactionHistory, repriceCachedTransactionHistory, copyPriceJobLog, exportPriceJobLog, setTransactionFilter, enforceDao1DateInput, setDao1DateFromPicker, openDao1DatePicker, exportTransactionsExcel, exportTransactionsPdf, openNftTabForSelectedWallet, showMissingHistoricalPrices, saveManualHistoricalPrice,
    getAptmUsdtPairAddress: () => PAIR_ADDRESS,
    historicalAptmPriceAtBlock, refreshNftOwnershipForWallet };
})();
