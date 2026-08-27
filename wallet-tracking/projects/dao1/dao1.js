window.DAO1Project = (() => {
  const PROJECT_KEY = "dao1";
  const PROJECT_NAME = "DAO1";
  const CHAIN_KEY = "apertum";
  const CLAIM_SELECTOR = "0x86bb8f37";
  const SYSTEM_ADDRESS = "0x0200000000000000000000000000000000000001";
  const PAIR_ADDRESS = "0x38AcBfA5108D3c76d6cEa4D380182E832A289b57";
  const SYNC_TOPIC = "0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1";
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
  let transactionRows = [];
  let txFilterWallet = "";
  let txFilterFrom = "";
  let txFilterTo = "";
  let txFilterKind = "__all";
  let txFilterClass = "__all";
  let txFilterNft = "__all";
  let transactionJobToken = 0;
  const DB_PAGE_SIZE = 1000;
  let miningFilterFrom = "";
  let miningFilterTo = "";
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
        <div class="custom-token-card">
          <div class="chain-title">DAO1 · Apertum</div>
          <div class="note">Projektansicht für DAO1-spezifische Assets und Apertum-Mining. Der Tab erscheint nur, wenn ein DAO1-Asset aktuell oder in einem Snapshot vorhanden ist.</div>
        </div>
        <div id="dao1AssetSummary" class="custom-token-card"><span class="loading">Projekt-Konfiguration wird geladen…</span></div>
        <div class="custom-token-card">
          <div class="chain-title">📒 Apertum Transaktionshistorie</div>
          <div class="note" style="margin-bottom:10px">Zentrale, dauerhaft gespeicherte Apertum-Historie. Ein Wallet-Wechsel liest ausschließlich bereits gespeicherte Daten aus Supabase. Erst „Apertum-Historie aktualisieren“ lädt neue Blockchain-Daten; dabei werden nur noch nicht verarbeitete Claims angereichert. Der Status zeigt jederzeit, ob geladen, gespeichert, angereichert oder vollständig bereit ist.</div>
          <div id="dao1TransactionControls"></div>
          <div id="dao1TransactionStatus" class="status" style="margin-top:10px"></div>
          <div id="dao1TransactionSummary" style="margin-top:10px"></div>
          <div id="dao1TransactionTable" style="margin-top:10px"></div>
        </div>
        </div>
`;
      app.appendChild(panel);
    }
    mounted = true;
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
    if(!txFilterWallet && projectWallets()[0]) txFilterWallet=String(projectWallets()[0].id);
    try{
      const tw=projectWallets().find(w=>String(w.id)===String(txFilterWallet));
      transactionRows=tw?await loadTransactionRows(walletAddress(tw),null):[];
      renderTransactionHistory();
      if(tw)await showTransactionReadyStatus(walletAddress(tw),transactionRows,"db");
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
      <div class="chain-table-wrap"><table class="chain-admin-table dao1-nft-class-table" style="table-layout:fixed;width:100%">
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
    ownershipRows = data || [];
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
    const transfers=(await fetchPagedUrl(url)).filter(isNonSpamNftTransfer);
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
      const ts=t.timestamp||null;
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

    // Cache only ownership periods involving one of this user's tracked EVM wallets.
    const tracked=new Set((ctx.wallets||[]).map(w=>lower(walletAddress(w))).filter(Boolean));
    const ownPeriods=periods.filter(p=>tracked.has(lower(p.wallet_address)));
    if(!ownPeriods.length)return 0;

    await sb.from("project_nft_ownership")
      .delete()
      .eq("user_id",ctx.currentUser.id)
      .eq("project_key",PROJECT_KEY)
      .eq("nft_contract",nftContract)
      .eq("nft_id",Number(nftId));

    const {error}=await sb.from("project_nft_ownership").insert(ownPeriods);
    if(error) throw error;
    return ownPeriods.length;
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
    miners = data || [];
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
    const { error } = await sb.from("project_miners").insert({ user_id: ctx.currentUser.id, project_key: PROJECT_KEY, chain_key: CHAIN_KEY, wallet_address: wallet, nft_id: nft, label: label || `Miner #${nft}`, enabled: true });
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
    const { data, error } = await sb.from("aptm_price_history").select("*").eq("pool_address", lower(PAIR_ADDRESS)).lte("block_number", maxBlock).order("block_number", { ascending: true }).order("log_index", { ascending: true });
    if (error) throw error;
    return data || [];
  }
  function priceAtBlock(history, block) {
    let best = null;
    for (const p of history) { if (Number(p.block_number) <= block) best = p; else break; }
    return best;
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
    if(error)console.warn("APTM Preis-Cache speichern:",error);
  }

  async function fetchSyncLogsAdaptive(fromBlock,toBlock,status,depth=0){
    if(fromBlock>toBlock)return [];
    try{
      if(status)status.textContent=`Historische APTM-Kurse: Pool-Syncs ${fromBlock}–${toBlock}…`;
      return await rpc("eth_getLogs",[{
        fromBlock:hexBlock(fromBlock),
        toBlock:hexBlock(toBlock),
        address:PAIR_ADDRESS,
        topics:[SYNC_TOPIC]
      }]);
    }catch(e){
      const span=toBlock-fromBlock+1;
      // A timeout/range limit must not abort the whole mining scan.
      // Recursively split until small chunks; below that leave this price gap unresolved.
      if(span<=500 || depth>=12){
        console.warn(`APTM Preis-Chunk ${fromBlock}-${toBlock} übersprungen:`,e);
        return [];
      }
      const mid=Math.floor((fromBlock+toBlock)/2);
      const left=await fetchSyncLogsAdaptive(fromBlock,mid,status,depth+1);
      const right=await fetchSyncLogsAdaptive(mid+1,toBlock,status,depth+1);
      return [...left,...right];
    }
  }

  async function syncPriceRangeChunked(minBlock,maxBlock,status){
    const ctx=getContext?.();
    if(!ctx?.isAdmin)return [];
    const meta=await poolMeta();
    const rows=[];
    // Fixed moderate top-level chunks; adaptive splitter handles slow RPC ranges.
    const CHUNK=10000;
    for(let from=Math.max(0,minBlock);from<=maxBlock;from+=CHUNK){
      const to=Math.min(maxBlock,from+CHUNK-1);
      const logs=await fetchSyncLogsAdaptive(from,to,status);
      const part=(logs||[]).map(l=>priceRowFromSyncLog(l,meta)).filter(Boolean);
      rows.push(...part);
      await savePriceRows(part);
    }
    return rows;
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

  async function ensurePricesForClaimBlocks(claimBlocks,status){
    if(!claimBlocks.length)return [];
    const minBlock=Math.min(...claimBlocks),maxBlock=Math.max(...claimBlocks);
    let history=[];
    try{history=await loadCachedPrices(minBlock,maxBlock);}catch(e){console.warn("APTM Preis-Cache:",e);}

    const windows=missingPriceWindows(history,claimBlocks);
    for(const [from,to] of windows){
      try{
        await syncPriceRangeChunked(from,to,status);
      }catch(e){
        // Price enrichment is best-effort. Claims must still be saved.
        console.warn(`Historischer APTM-Preis ${from}-${to} konnte nicht ergänzt werden:`,e);
      }
    }
    try{history=await loadCachedPrices(minBlock,maxBlock);}catch(e){console.warn("APTM Preis-Cache neu laden:",e);}
    return history;
  }

  async function backfillCachedClaimPrices(walletAddress,nftIds,status){
    const claims=await loadCachedClaims(walletAddress,nftIds);
    const missing=claims.filter(r=>r.aptm_usd==null);
    if(!missing.length)return claims;
    const blocks=missing.map(r=>Number(r.block_number)).filter(Number.isFinite);
    const history=await ensurePricesForClaimBlocks(blocks,status);
    const updates=[];
    for(const r of missing){
      const ph=priceAtBlock(history,Number(r.block_number));
      if(!ph)continue;
      const price=Number(ph.aptm_usd);
      updates.push({
        ...r,
        aptm_usd:price,
        reward_usd:Number(r.reward_aptm||0)*price,
        gas_usd:Number(r.gas_aptm||0)*price,
        price_block:ph.block_number,
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

  async function getTransactionScanState(address){
    const {data,error}=await sb.from("project_scan_state")
      .select("*")
      .eq("user_id",getContext?.().currentUser.id)
      .eq("project_key",PROJECT_KEY)
      .eq("chain_key",CHAIN_KEY)
      .eq("wallet_address",lower(address))
      .eq("scan_type",TX_SCAN_TYPE)
      .maybeSingle();
    if(error)throw error;
    return data||null;
  }

  async function saveTransactionScanState(address,lastBlock){
    const ctx=getContext?.();
    const row={
      user_id:ctx.currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
      wallet_address:lower(address),scan_type:TX_SCAN_TYPE,
      last_scanned_block:Number(lastBlock||0),last_scanned_at:new Date().toISOString()
    };
    const {error}=await sb.from("project_scan_state")
      .upsert(row,{onConflict:"user_id,project_key,chain_key,wallet_address,scan_type"});
    if(error)throw error;
  }

  async function saveTransactionRows(rows){
    if(!rows.length)return;
    const {error}=await sb.from("project_transactions")
      .upsert(rows,{onConflict:"user_id,project_key,chain_key,wallet_address,tx_hash"});
    if(error)throw error;
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
      if(address)q=q.eq("wallet_address",lower(address));
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
    return rows;
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
    const lastAt=state?.last_scanned_at ? new Date(state.last_scanned_at).toLocaleString("de-DE") : "noch kein Scan";
    const lastBlock=state?.last_scanned_block ? Number(state.last_scanned_block).toLocaleString("de-DE") : "–";
    return {claimCalls:claimCalls.length,enriched:enriched.length,pending,missingPrice,lastAt,lastBlock};
  }

  async function showTransactionReadyStatus(address,rows,source="db"){
    let state=null;
    try{state=await getTransactionScanState(address);}catch(e){console.warn("Tx scan state:",e);}
    const x=transactionStatusSnapshot(rows,state);
    const sourceText=source==="db" ? "Nur gespeicherte Daten geladen – keine Blockchain-Abfrage." : "Blockchain-Aktualisierung abgeschlossen.";
    setTransactionStatus("ready",`Bereit – ${rows.length.toLocaleString("de-DE")} Transaktionen, ${x.enriched.toLocaleString("de-DE")} angereicherte Claims.`,
      `${sourceText} Letzter Scan: ${x.lastAt} · letzter Block: ${x.lastBlock} · offene Claim-Anreicherungen: ${x.pending} · Claims ohne historischen USD-Kurs: ${x.missingPrice}`);
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
          wallet_address:lower(address),
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
          const walletRows=await loadTransactionRows(address,null);
          if(job!==transactionJobToken)return;
          await enrichTransactionsWithClaims(address,null,job);
        }
        if(job!==transactionJobToken)return;
        transactionRows=await loadTransactionRows(selectedAll?null:walletAddress(targets[0]),null);
        renderTransactionControls();
        renderTransactionHistory();
        if(selectedAll){
          const claims=transactionRows.filter(r=>r.claim_nft_id!=null).length;
          setTransactionStatus("ready",`Bereit – ${transactionRows.length.toLocaleString("de-DE")} Transaktionen aus ${targets.length} Wallets, ${claims.toLocaleString("de-DE")} Claims.`,
            "Blockchain-Aktualisierung für alle ausgewählten Apertum-Wallets abgeschlossen.");
        }else{
          await showTransactionReadyStatus(walletAddress(targets[0]),transactionRows,"scan");
        }
      }else{
        setTransactionStatus("db",selectedAll?"Gespeicherte Daten aller Apertum-Wallets werden geladen…":"Gespeicherte Wallet-Daten werden geladen…",
          "Keine Blockchain-Abfrage und keine Claim-Anreicherung.");
        transactionRows=await loadTransactionRows(selectedAll?null:walletAddress(targets[0]),null);
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
      if(scan && btn && job===transactionJobToken){btn.disabled=false;btn.textContent="Apertum-Historie aktualisieren";}
    }
  }

  async function enrichTransactionsWithClaims(address,status=null,jobToken=transactionJobToken){
    const txs=await loadTransactionRows(address,null);
    const allClaimTxs=txs.filter(t=>t.selector===CLAIM_SELECTOR);
    const claimTxs=allClaimTxs.filter(t=>t.claim_nft_id==null);
    if(!claimTxs.length){
      setTransactionStatus("ready",`Keine neuen Claims anzureichern.`,`${allClaimTxs.length.toLocaleString("de-DE")} Claim-Transaktionen sind bereits verarbeitet.`);
      return;
    }
    setTransactionStatus("loading",`${claimTxs.length.toLocaleString("de-DE")} neue Claim(s) werden angereichert…`,`Bereits verarbeitet: ${(allClaimTxs.length-claimTxs.length).toLocaleString("de-DE")}.`);
    const nftMap=allKnownNftsForWallet(address);
    const claimRows=[];
    const blocks=[];
    for(let i=0;i<claimTxs.length;i++){
      if(jobToken!==transactionJobToken)return;
      const t=claimTxs[i];
      if(i===0 || (i+1)%10===0 || i+1===claimTxs.length){
        setTransactionStatus("loading",`Claims werden angereichert ${i+1}/${claimTxs.length}…`,`NFT-Zuordnung und Reward werden aus Transaktion/Logs ermittelt.`);
      }
      const ps=words(t.raw_input||"");
      const knownId=[ps[0],ps[1]].filter(v=>v!=null).map(v=>v.toString()).find(id=>nftMap.has(id));
      const decodedId=knownId || ps[0]?.toString() || ps[1]?.toString();
      if(!decodedId || !/^\d+$/.test(decodedId))continue;
      const nft=nftMap.get(String(decodedId))||{
        id:String(decodedId),contract:lower(DEFAULT_MINER_NFT_CONTRACT),
        name:`NFT #${decodedId}`,classification:null
      };
      let logs=[];
      try{logs=await fetchAll(`/transactions/${t.tx_hash}/logs`);}catch(e){console.warn("Claim logs:",e);continue;}
      const reward=rewardFromLogs(logs,address);
      blocks.push(Number(t.block_number));
      claimRows.push({
        user_id:getContext?.().currentUser.id,project_key:PROJECT_KEY,chain_key:CHAIN_KEY,
        wallet_address:lower(address),nft_contract:nft.contract||null,nft_id:Number(decodedId),
        nft_name:nft.classification?.nft_name || nft.name || `NFT #${decodedId}`,
        nft_subtype:nft.classification?.subtype||null,tx_hash:t.tx_hash,
        block_number:Number(t.block_number),tx_timestamp:t.tx_timestamp,
        param1:ps[0]?.toString(),param2:ps[1]?.toString(),
        reward_aptm:reward,gas_aptm:Number(t.gas_aptm||0),
        net_aptm:reward-Number(t.gas_aptm||0),aptm_usd:null,reward_usd:null,gas_usd:null,
        price_block:null,updated_at:new Date().toISOString()
      });
    }
    if(claimRows.length){
      if(jobToken!==transactionJobToken)return;
      setTransactionStatus("loading",`Historische APTM-Kurse werden ergänzt…`,`${claimRows.length.toLocaleString("de-DE")} neue Claim(s) werden bewertet.`);
      const history=await ensurePricesForClaimBlocks(blocks,document.getElementById("dao1TransactionStatus"));
      for(const r of claimRows){
        const ph=priceAtBlock(history,Number(r.block_number));
        if(ph){
          r.aptm_usd=Number(ph.aptm_usd);
          r.reward_usd=Number(r.reward_aptm||0)*r.aptm_usd;
          r.gas_usd=Number(r.gas_aptm||0)*r.aptm_usd;
          r.price_block=ph.block_number;
        }
      }
      await saveClaimRows(claimRows);
      for(let ri=0;ri<claimRows.length;ri++){
        if(jobToken!==transactionJobToken)return;
        const r=claimRows[ri];
        if(ri===0 || (ri+1)%25===0 || ri+1===claimRows.length)setTransactionStatus("db",`Claim-Anreicherungen werden gespeichert ${ri+1}/${claimRows.length}…`);
        const tx=txs.find(t=>t.tx_hash===r.tx_hash);
        const {error}=await sb.from("project_transactions")
          .update({
            claim_nft_id:r.nft_id,
            claim_nft_name:r.nft_name,
            claim_nft_subtype:r.nft_subtype,
            claim_reward_aptm:r.reward_aptm,
            aptm_usd:r.aptm_usd,
            value_usd:r.aptm_usd==null?null:Number(tx?.value_aptm||0)*r.aptm_usd,
            gas_usd:r.gas_usd,
            claim_reward_usd:r.reward_usd,
            updated_at:new Date().toISOString()
          })
          .eq("user_id",getContext?.().currentUser.id)
          .eq("wallet_address",lower(address))
          .eq("tx_hash",r.tx_hash);
        if(error)console.warn("Tx Claim enrichment:",error);
      }
      setTransactionStatus("ready",`${claimRows.length.toLocaleString("de-DE")} neue Claim(s) angereichert und gespeichert.`);
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

  function renderTransactionControls(){
    const el=document.getElementById("dao1TransactionControls");
    if(!el)return;
    const wallets=allProjectWalletOptions();
    if(!txFilterWallet && wallets[0])txFilterWallet=String(wallets[0].id);

    const classes=transactionFilterClasses();
    const nfts=transactionFilterNfts();
    if(txFilterClass!=="__all" && !classes.includes(txFilterClass))txFilterClass="__all";
    if(txFilterNft!=="__all" && !nfts.some(n=>n.id===String(txFilterNft)))txFilterNft="__all";

    el.innerHTML=`
      <div class="action-row" style="margin-bottom:10px">
        <button id="dao1TxScanBtn" onclick="DAO1Project.refreshTransactionHistory(true)">Apertum-Historie aktualisieren</button>
        <button class="secondary" onclick="DAO1Project.exportTransactionsExcel()">Excel exportieren</button>
        <button class="secondary" onclick="DAO1Project.exportTransactionsPdf()">PDF / Drucken</button>
      </div>
      <div class="custom-token-grid" style="grid-template-columns:minmax(270px,1.2fr) minmax(140px,.55fr) minmax(140px,.55fr) minmax(160px,.65fr) minmax(190px,.75fr) minmax(240px,1fr)">
        <label><span class="field-label">Wallet</span><select onchange="DAO1Project.setTransactionFilter('wallet',this.value)">
          <option value="__all" ${txFilterWallet==="__all"?"selected":""}>Alle Apertum-Wallets</option>
          ${wallets.map(w=>`<option value="${w.id}" ${String(w.id)===String(txFilterWallet)?"selected":""}>${w.label} · ${walletAddress(w)}</option>`).join("")}
        </select></label>
        <label><span class="field-label">Von</span><input type="date" value="${txFilterFrom}" onchange="DAO1Project.setTransactionFilter('from',this.value)"></label>
        <label><span class="field-label">Bis</span><input type="date" value="${txFilterTo}" onchange="DAO1Project.setTransactionFilter('to',this.value)"></label>
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
      <div class="note" style="margin-top:7px">Alle Filter wirken direkt auf Summary, Detailliste und Export. Historische NFTs bleiben berücksichtigt, sofern Claims zu ihnen gespeichert sind. Blockchain-Daten werden ausschließlich über „Apertum-Historie aktualisieren“ nachgeladen.</div>`;
  }

  async function setTransactionFilter(kind,value){
    if(kind==="wallet"){
      txFilterWallet=String(value||"");
      txFilterClass="__all";
      txFilterNft="__all";
      await refreshTransactionHistory(false);
      return;
    }
    if(kind==="from")txFilterFrom=String(value||"");
    if(kind==="to")txFilterTo=String(value||"");
    if(kind==="kind")txFilterKind=String(value||"__all");
    if(kind==="class"){
      txFilterClass=String(value||"__all");
      txFilterNft="__all";
    }
    if(kind==="nft")txFilterNft=String(value||"__all");
    renderTransactionControls();
    renderTransactionHistory();
  }

  function renderTransactionHistory(){
    const summary=document.getElementById("dao1TransactionSummary");
    const table=document.getElementById("dao1TransactionTable");
    const rows=txVisibleRows();
    const claims=rows.filter(r=>r.claim_nft_id!=null);
    const claimedAptm=claims.reduce((a,r)=>a+Number(r.claim_reward_aptm||0),0);
    const claimedUsd=claims.reduce((a,r)=>a+Number(r.claim_reward_usd||0),0);
    const inAptm=rows.filter(r=>r.direction==="eingang").reduce((a,r)=>a+Number(r.value_aptm||0),0);
    const outAptm=rows.filter(r=>r.direction==="ausgang").reduce((a,r)=>a+Number(r.value_aptm||0),0);
    const gas=rows.reduce((a,r)=>a+Number(r.gas_aptm||0),0);
    if(summary)summary.innerHTML=`<div class="project-summary">
      <div class="custom-token-card project-summary-box"><span class="field-label">Transaktionen</span><strong>${rows.length}</strong></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Claims</span><strong>${claims.length}</strong></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Geclaimt</span><strong>${fmt(claimedAptm)} APTM</strong><div class="meta">${claimedUsd?usd(claimedUsd):"historischer USD-Wert noch nicht vollständig"}</div></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Normale Eingänge</span><strong>${fmt(inAptm)} APTM</strong></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Ausgang</span><strong>${fmt(outAptm)} APTM</strong></div>
      <div class="custom-token-card project-summary-box"><span class="field-label">Gas</span><strong>${fmt(gas)} APTM</strong></div>
    </div>`;
    if(!table)return;
    if(!rows.length){table.innerHTML='<div class="empty">Keine Transaktionen für den gewählten Filter.</div>';return;}
    table.innerHTML=`<details><summary style="cursor:pointer;font-weight:700;padding:10px 0">Detailliste anzeigen (${rows.length} Transaktionen)</summary>
      <div class="chain-table-wrap" style="margin-top:8px"><table class="chain-admin-table"><thead><tr>
      <th>Zeit</th>${txFilterWallet==="__all"?"<th>Wallet</th>":""}<th>Richtung</th><th>Methode</th><th>APTM</th><th>Claim / NFT</th><th>APTM/USD</th><th>USD</th><th>Gas APTM</th><th>Tx</th>
    </tr></thead><tbody>${rows.map(r=>{
      const claim=r.claim_nft_id!=null;
      const currentSubtype=claim?currentSubtypeForClaim(r.claim_nft_id,r.claim_nft_subtype):"";
      const currentName=claim?currentNameForClaim(r.claim_nft_id,r.claim_nft_name):"";
      const amount=Number(r.value_aptm||0)+(claim?Number(r.claim_reward_aptm||0):0);
      const usdVal=claim?Number(r.claim_reward_usd||0):Number(r.value_usd||0);
      return `<tr>
        <td>${r.tx_timestamp||"–"}</td>${txFilterWallet==="__all"?`<td><code>${r.wallet_address}</code></td>`:""}<td>${r.direction||"–"}</td><td>${r.method||"–"}</td>
        <td>${fmt(amount)}</td>
        <td>${claim?`<strong>${currentName||"NFT"}</strong><div class="meta">#${r.claim_nft_id}${currentSubtype?" · "+currentSubtype:""} · Reward ${fmt(r.claim_reward_aptm)} APTM</div>`:"–"}</td>
        <td>${r.aptm_usd==null?"–":fmt(r.aptm_usd)}</td><td>${usdVal?usd(usdVal):"–"}</td>
        <td>${fmt(r.gas_aptm)}</td><td><a href="${EXPLORER}/tx/${r.tx_hash}" target="_blank" rel="noopener">${r.tx_hash.slice(0,12)}…</a></td>
      </tr>`;
    }).join("")}</tbody></table></div></details>`;
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
    const headers=["Timestamp","Wallet","Richtung","Methode","Tx Hash","Block","From","To","APTM","Claim NFT","NFT Typ","Claim Reward APTM","APTM/USD historisch","Wert USD","Gas APTM","Gas USD","Status"];
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
        r.aptm_usd==null?"":Number(r.aptm_usd),valUsd||0,Number(r.gas_aptm||0),
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
    const w=window.open("","_blank");
    if(!w)return alert("Popup wurde blockiert.");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Apertum Transaktionshistorie</title><style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#111}h1{font-size:18px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:4px;vertical-align:top}th{background:#eee}code{font-size:9px}.meta{font-size:9px;color:#555}@page{size:A4 landscape;margin:10mm}
    </style></head><body><h1>DAO1 / Apertum Transaktionshistorie</h1>
    <p><strong>Wallet:</strong> ${xmlEsc(walletLabel)}<br><strong>Datumsbereich:</strong> ${xmlEsc(txFilterFrom||"offen")} bis ${xmlEsc(txFilterTo||"offen")}<br><strong>Filter:</strong> Typ ${xmlEsc(txFilterKind)}, Klassifizierung ${xmlEsc(txFilterClass)}, NFT ${xmlEsc(txFilterNft)}<br><strong>Transaktionen:</strong> ${rows.length}</p>
    <table><thead><tr><th>Zeit</th><th>Wallet</th><th>Richtung</th><th>Methode</th><th>APTM</th><th>Claim / NFT</th><th>APTM/USD</th><th>USD</th><th>Gas</th><th>Tx Hash</th></tr></thead><tbody>
    ${rows.map(r=>{
      const claim=r.claim_nft_id!=null;
      const currentSubtype=claim?currentSubtypeForClaim(r.claim_nft_id,r.claim_nft_subtype):"";
      const currentName=claim?currentNameForClaim(r.claim_nft_id,r.claim_nft_name):"";
      const amt=Number(r.value_aptm||0)+(claim?Number(r.claim_reward_aptm||0):0);
      const valUsd=claim?Number(r.claim_reward_usd||0):Number(r.value_usd||0);
      return `<tr><td>${xmlEsc(r.tx_timestamp)}</td><td><code>${xmlEsc(r.wallet_address)}</code></td><td>${xmlEsc(r.direction)}</td><td>${xmlEsc(r.method)}</td><td>${fmt(amt)}</td><td>${claim?`${xmlEsc(currentName||"NFT")} #${r.claim_nft_id}<div class="meta">${xmlEsc(currentSubtype)} · Reward ${fmt(r.claim_reward_aptm)} APTM</div>`:"–"}</td><td>${r.aptm_usd==null?"–":fmt(r.aptm_usd)}</td><td>${valUsd?usd(valUsd):"–"}</td><td>${fmt(r.gas_aptm)}</td><td><code>${xmlEsc(r.tx_hash)}</code></td></tr>`;
    }).join("")}
    </tbody></table><script>window.onload=()=>window.print();<\/script></body></html>`);
    w.document.close();
  }

  async function getScanState(walletAddress){
    const {data,error}=await sb.from("project_scan_state")
      .select("*")
      .eq("project_key",PROJECT_KEY)
      .eq("chain_key",CHAIN_KEY)
      .eq("wallet_address",lower(walletAddress))
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
      wallet_address:lower(walletAddress),
      scan_type:CLAIM_SCAN_TYPE,
      last_scanned_block:Number(lastBlock||0),
      last_scanned_at:new Date().toISOString()
    };
    const {error}=await sb.from("project_scan_state").upsert(row,{onConflict:"user_id,project_key,chain_key,wallet_address,scan_type"});
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
        .eq("wallet_address",lower(walletAddress));
      if(nftIds?.length)q=q.in("nft_id",nftIds.map(Number));
      const {data,error}=await q.order("block_number",{ascending:true}).order("tx_hash",{ascending:true}).range(offset,offset+DB_PAGE_SIZE-1);
      if(error && !/does not exist|schema cache/i.test(error.message||""))throw error;
      const page=data||[];
      rows.push(...page);
      if(page.length<DB_PAGE_SIZE)break;
      offset+=DB_PAGE_SIZE;
    }
    return rows;
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
          const ph=priceAtBlock(history,block);
          const price=ph?Number(ph.aptm_usd):null;
          claimRows.push({
            user_id:ctx.currentUser.id,
            project_key:PROJECT_KEY,
            chain_key:CHAIN_KEY,
            wallet_address:lower(address),
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
            price_block:ph?.block_number||null,
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
          <label><span class="field-label">Von</span><input type="date" value="${miningFilterFrom}" onchange="DAO1Project.setMiningDateFilter('from',this.value)"></label>
          <label><span class="field-label">Bis</span><input type="date" value="${miningFilterTo}" onchange="DAO1Project.setMiningDateFilter('to',this.value)"></label>
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
    miningFilterFrom="";
    miningFilterTo="";
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
        <div class="chain-table-wrap" style="margin-top:8px"><table class="chain-admin-table"><thead><tr><th>NFT</th><th>Typ</th><th>Claims</th><th>Reward APTM</th><th>Reward USD</th><th>Gas APTM</th></tr></thead><tbody>
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
    table.innerHTML = `<div class="chain-table-wrap"><table class="chain-admin-table"><thead><tr><th>NFT</th><th>Zeit</th><th>Block</th><th>Reward APTM</th><th>APTM/USD</th><th>Reward USD</th><th>Gas APTM</th><th>Netto APTM</th><th>Tx</th></tr></thead><tbody>${visibleRows.map(x=>`<tr><td>${x.nftName || x.miner.label}<div class="meta">#${x.nftId || x.miner.nft_id}${x.nftSubtype?" · "+x.nftSubtype:""}</div></td><td>${x.timestamp}</td><td>${x.block}</td><td>${fmt(x.reward)}</td><td>${x.price == null ? "–" : fmt(x.price)}</td><td>${usd(x.rewardUsd)}</td><td>${fmt(x.gas)}</td><td>${fmt(x.net)}</td><td><a href="${EXPLORER}/tx/${x.tx}" target="_blank" rel="noopener">${x.tx.slice(0,12)}…</a></td></tr>`).join("")}</tbody></table></div>`;
  }

  async function ensureLoaded() {
    await ensureMounted();
    if (!loaded) { await refreshConfig(); loaded = true; }
    updateVisibility();
  }

  return { configure, ensureMounted, refreshConfig, ensureLoaded, updateVisibility, loadMiningRewards, addMiner, deleteMiner, selectWallet, selectNft, selectNftClass, discoverMinerNfts, useManualNft, saveNftClassification, setMiningDateFilter, setMiningClassFilter, setMiningResultNft, clearMiningFilters,
    refreshTransactionHistory, setTransactionFilter, exportTransactionsExcel, exportTransactionsPdf, openNftTabForSelectedWallet };
})();
