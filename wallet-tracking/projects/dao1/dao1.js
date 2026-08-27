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
          <div class="chain-title">⛏️ Apertum Mining Rewards</div>
          <div class="note" style="margin-bottom:10px">Apertum-NFTs können projektweit klassifiziert werden (z. B. Mining-Bot, Trading-Bot, DID). Für die Claim-Auswertung wird zuerst nach Klassifizierung gefiltert und danach die NFT gewählt. Historische APTM-Kurse kommen bevorzugt aus <code>aptm_price_history</code>; fehlende Pool-Syncs können von Admins on-chain ergänzt und zentral gespeichert werden.</div>
          <div id="dao1MinerSelector"></div>
          <div id="dao1AdminMinerEditor" style="display:none"></div>
          <div class="action-row" style="margin-top:10px">
            <button onclick="DAO1Project.loadMiningRewards()">Mining-Auswertung laden</button>
          </div>
          <div id="dao1MiningStatus" class="status" style="margin-top:10px"></div>
          <div id="dao1MiningSummary" style="margin-top:10px"></div>
          <div id="dao1MiningTable" style="margin-top:10px"></div>
        </div>`;
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
        <summary style="cursor:pointer;font-weight:700">🏷️ DAO1 NFT-Klassifizierung</summary>
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
    renderMinerSelector();
    renderNftClassification();
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
      <div class="note" style="margin-bottom:10px">Die Klassifizierung gehört zur NFT selbst und bleibt deshalb auch nach einem Wallet-Transfer erhalten.</div>
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
        const inst=await fetchJson(`${EXPLORER_API}/tokens/${m.contract}/instances/${m.id}`);
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
    const el = document.getElementById("dao1MinerSelector");
    const wallets = projectWallets();
    if (!el) return;
    if (!wallets.length) {
      el.innerHTML = '<div class="empty">Keine DAO1/Apertum-Wallet mit aktuellem oder historischem Projektbestand gefunden.</div>';
      return;
    }
    if (!wallets.some(w => String(w.id) === String(selectedWalletId))) selectedWalletId = String(wallets[0].id);
    const wallet = wallets.find(w => String(w.id) === String(selectedWalletId));
    const address = walletAddress(wallet);
    const allNfts = nftIdsForWallet(address);

    const classOptions=[
      ["Mining-Bot","Mining-Bot"],
      ["Trading-Bot","Trading-Bot"],
      ["DID","DID"],
      ["DAO / Membership","DAO / Membership"],
      ["Sonstige","Sonstige"],
      ["__all_classified","Alle klassifizierten"],
      ["__all","Alle NFTs"]
    ];
    const nfts=selectedNftClass==="__all"
      ? allNfts
      : selectedNftClass==="__all_classified"
        ? allNfts.filter(n=>n.classification)
        : allNfts.filter(n=>n.classification?.subtype===selectedNftClass);

    const validKeys=new Set(nfts.map(n=>String(n.key)));
    if(selectedNftId!=="__all" && !validKeys.has(String(selectedNftId))) selectedNftId = nfts.length ? "__all" : "";

    el.innerHTML = `
      <div class="action-row" style="margin-top:4px;margin-bottom:12px">
        <button class="secondary" onclick="DAO1Project.discoverMinerNfts()">NFT-Bestand / Besitzerhistorie aktualisieren</button>
      </div>

      <div class="custom-token-grid" style="grid-template-columns:minmax(260px,1.4fr) minmax(190px,.8fr) minmax(260px,1.2fr);margin-top:4px">
        <label><span class="field-label">Apertum Wallet</span>
          <select id="dao1WalletSelect" onchange="DAO1Project.selectWallet(this.value)">
            ${wallets.map(w=>`<option value="${w.id}" ${String(w.id)===String(selectedWalletId)?"selected":""}>${w.label} · ${walletAddress(w)}</option>`).join("")}
          </select>
        </label>
        <label><span class="field-label">Klassifizierung</span>
          <select id="dao1NftClassSelect" onchange="DAO1Project.selectNftClass(this.value)">
            ${classOptions.map(([v,l])=>`<option value="${v}" ${v===selectedNftClass?"selected":""}>${l}</option>`).join("")}
          </select>
        </label>
        <label><span class="field-label">Apertum NFT</span>
          <select id="dao1NftSelect" onchange="DAO1Project.selectNft(this.value)">
            ${nfts.length ? `<option value="__all" ${selectedNftId==="__all"?"selected":""}>Alle (${nfts.length})</option>` + nfts.map(n=>`<option value="${n.key}" ${String(n.key)===String(selectedNftId)?"selected":""}>${n.name || ("NFT #"+n.id)}${String(n.name||"").includes("#"+n.id)?"":" · #"+n.id}${n.current?" · aktuell":" · historisch"}</option>`).join("") : '<option value="">– keine NFT für diesen Filter –</option>'}
          </select>
        </label>
      </div>

      <div class="action-row" style="margin-top:10px;align-items:end">
        <label style="min-width:220px"><span class="field-label">NFT-ID manuell</span><input id="dao1ManualNft" type="number" min="0" placeholder="z. B. 38483" value="${manualNftId}"></label>
        <button class="secondary" onclick="DAO1Project.useManualNft()">Manuelle NFT verwenden</button>
      </div>

      <div class="note" style="margin-top:8px">Für APTM-Claims ist standardmäßig <strong>Mining-Bot</strong> gewählt. Mit <strong>Alle</strong> werden alle NFTs der gewählten Klassifizierung in einem Durchgang ausgewertet. Wallet-Transaktionen werden dabei nur einmal geladen und anschließend nach NFT gruppiert.</div>
      ${message ? `<div class="status" style="margin-top:8px">${message}</div>` : ""}`;
  }

  async function fetchPagedUrl(initialUrl, maxPages=500) {
    let url=initialUrl, out=[], pages=0;
    while(url && pages<maxPages){
      pages++;
      const j=await fetchJson(url);
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
      const instance=await fetchJson(`${EXPLORER_API}/tokens/${nftContract}/instances/${nftId}`);
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

  async function fetchJson(url) {
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
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
      const j = await fetchJson(url);
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

  async function rpc(method, params) {
    const r = await fetch(RPC_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    return j.result;
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

  async function syncPriceHistory(minBlock, maxBlock) {
    const ctx = getContext?.();
    if (!ctx?.isAdmin) return [];
    const meta = await poolMeta();
    const from = Math.max(0, minBlock - 50000);
    const logs = await rpc("eth_getLogs", [{ fromBlock: hexBlock(from), toBlock: hexBlock(maxBlock), address: PAIR_ADDRESS, topics: [SYNC_TOPIC] }]);
    const rows = [];
    for (const l of logs || []) {
      const raw = String(l.data || "").replace(/^0x/, "");
      if (raw.length < 128) continue;
      const a = BigInt("0x" + raw.slice(0,64));
      const b = BigInt("0x" + raw.slice(64,128));
      const aptmRaw = meta.aptmIs0 ? a : b;
      const usdtRaw = meta.aptmIs0 ? b : a;
      const aptmDecimals = meta.aptmIs0 ? meta.d0 : meta.d1;
      const usdtDecimals = meta.aptmIs0 ? meta.d1 : meta.d0;
      const reserveAptm = Number(aptmRaw)/10**aptmDecimals;
      const reserveUsdt = Number(usdtRaw)/10**usdtDecimals;
      if (!(reserveAptm > 0 && reserveUsdt > 0)) continue;
      rows.push({
        project_key: PROJECT_KEY,
        chain_key: CHAIN_KEY,
        pool_address: lower(PAIR_ADDRESS),
        block_number: parseInt(l.blockNumber,16),
        log_index: parseInt(l.logIndex,16),
        tx_hash: l.transactionHash,
        reserve_aptm: reserveAptm,
        reserve_usdt: reserveUsdt,
        aptm_usd: reserveUsdt/reserveAptm
      });
    }
    if (rows.length) {
      const { error } = await sb.from("aptm_price_history").upsert(rows, { onConflict: "pool_address,block_number,log_index", ignoreDuplicates: true });
      if (error) console.warn("APTM Preis-Cache speichern:", error);
    }
    return rows;
  }


  async function getScanState(walletAddress){
    const {data,error}=await sb.from("project_scan_state")
      .select("*")
      .eq("project_key",PROJECT_KEY)
      .eq("chain_key",CHAIN_KEY)
      .eq("wallet_address",lower(walletAddress))
      .eq("scan_type","claims")
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
      scan_type:"claims",
      last_scanned_block:Number(lastBlock||0),
      last_scanned_at:new Date().toISOString()
    };
    const {error}=await sb.from("project_scan_state").upsert(row,{onConflict:"user_id,project_key,chain_key,wallet_address,scan_type"});
    if(error)throw error;
  }

  async function loadCachedClaims(walletAddress,nftIds){
    let q=sb.from("project_nft_claims")
      .select("*")
      .eq("user_id",getContext?.().currentUser.id)
      .eq("project_key",PROJECT_KEY)
      .eq("chain_key",CHAIN_KEY)
      .eq("wallet_address",lower(walletAddress));
    if(nftIds?.length)q=q.in("nft_id",nftIds.map(Number));
    const {data,error}=await q.order("block_number",{ascending:true});
    if(error && !/does not exist|schema cache/i.test(error.message||""))throw error;
    return data||[];
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
      const j=await fetchJson(url);
      const items=j.items||[];
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

  async function loadMiningRewards() {
    const status = document.getElementById("dao1MiningStatus");
    const ctx=getContext?.();
    const wallet=projectWallets().find(w=>String(w.id)===String(selectedWalletId));
    const address=walletAddress(wallet);
    if (!address) { status.textContent = "Bitte eine Apertum-Wallet auswählen."; return; }

    const selectedNfts=selectedNftsForMining(address);
    if(!selectedNfts.length){
      status.textContent="Für diesen Filter ist keine NFT ausgewählt.";
      return;
    }
    const nftIds=selectedNfts.map(n=>String(n.id));
    const nftMap=new Map(selectedNfts.map(n=>[String(n.id),n]));

    try {
      status.textContent = "Claim-Cache wird geprüft…";
      rewardRows = [];

      const scan=await fetchWalletTransactionsIncremental(address,status);
      const claimCandidates=[];
      for(const t of scan.transactions){
        const input=String(t.raw_input||t.input||"");
        if(input.slice(0,10).toLowerCase()!==CLAIM_SELECTOR)continue;
        const ps=words(input);
        const matched=nftIds.find(id=>{
          const n=BigInt(id);
          return ps[0]===n || ps[1]===n;
        });
        if(!matched)continue;
        claimCandidates.push({
          nft:nftMap.get(String(matched)),
          t,
          p1:ps[0]?.toString(),
          p2:ps[1]?.toString()
        });
      }

      // Historical prices required only for the newly fetched candidate range.
      if(claimCandidates.length){
        const blocks=claimCandidates.map(x=>Number(x.t.block_number??x.t.block)).filter(Number.isFinite);
        const minBlock=Math.min(...blocks),maxBlock=Math.max(...blocks);
        let history=[];
        try{history=await loadCachedPrices(minBlock,maxBlock);}catch(e){console.warn(e);}
        if(!history.length || !priceAtBlock(history,minBlock)){
          status.textContent="Historischer APTM-Preisbereich fehlt – Pool-Syncs werden ergänzt…";
          await syncPriceHistory(minBlock,maxBlock);
          try{history=await loadCachedPrices(minBlock,maxBlock);}catch{}
        }

        const claimRows=[];
        let done=0;
        for(const c of claimCandidates){
          done++;
          status.textContent=`Neue/überlappende Claims werden verarbeitet ${done}/${claimCandidates.length}…`;
          const logs=await fetchAll(`/transactions/${c.t.hash}/logs`);
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

      if(scan.maxSeen)await saveScanState(address,scan.maxSeen);

      const cached=await loadCachedClaims(address,nftIds);
      rewardRows=cached.map(r=>{
        const nft=nftMap.get(String(r.nft_id)) || {
          id:String(r.nft_id),
          name:r.nft_name || `NFT #${r.nft_id}`,
          classification:r.nft_subtype?{subtype:r.nft_subtype}:null
        };
        return {
          miner:{
            wallet_address:address,
            nft_id:Number(r.nft_id),
            label:`${wallet?.label||"Wallet"} · ${r.nft_name || nft.name || "NFT"}${r.nft_subtype?" · "+r.nft_subtype:""} · #${r.nft_id}`
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
          nftName:r.nft_name || nft.name || `NFT #${r.nft_id}`,
          nftSubtype:r.nft_subtype || nft.classification?.subtype || null
        };
      }).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));

      renderMining();

      const mode=scan.state
        ? `inkrementell ab Block ${scan.fromBlock} (Puffer ${CLAIM_SCAN_BUFFER_BLOCKS})`
        : "vollständiger Initialscan";
      status.textContent=`${rewardRows.length} gespeicherte Claims für ${selectedNfts.length} NFT(s) · ${mode}.`;
    } catch (e) {
      console.error(e);
      status.innerHTML = `<span class="error">${e.message}</span>`;
    }
  }

  function renderMining() {
    const summary = document.getElementById("dao1MiningSummary");
    const table = document.getElementById("dao1MiningTable");
    const r = rewardRows.reduce((s,x)=>s+x.reward,0);
    const g = rewardRows.reduce((s,x)=>s+x.gas,0);
    const u = rewardRows.reduce((s,x)=>s+(x.rewardUsd||0),0);

    const byNft=new Map();
    for(const x of rewardRows){
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
        <div class="custom-token-card project-summary-box"><span class="field-label">Claims</span><strong>${rewardRows.length}</strong></div>
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
    table.innerHTML = `<div class="chain-table-wrap"><table class="chain-admin-table"><thead><tr><th>NFT</th><th>Zeit</th><th>Block</th><th>Reward APTM</th><th>APTM/USD</th><th>Reward USD</th><th>Gas APTM</th><th>Netto APTM</th><th>Tx</th></tr></thead><tbody>${rewardRows.map(x=>`<tr><td>${x.nftName || x.miner.label}<div class="meta">#${x.nftId || x.miner.nft_id}${x.nftSubtype?" · "+x.nftSubtype:""}</div></td><td>${x.timestamp}</td><td>${x.block}</td><td>${fmt(x.reward)}</td><td>${x.price == null ? "–" : fmt(x.price)}</td><td>${usd(x.rewardUsd)}</td><td>${fmt(x.gas)}</td><td>${fmt(x.net)}</td><td><a href="${EXPLORER}/tx/${x.tx}" target="_blank" rel="noopener">${x.tx.slice(0,12)}…</a></td></tr>`).join("")}</tbody></table></div>`;
  }

  async function ensureLoaded() {
    await ensureMounted();
    if (!loaded) { await refreshConfig(); loaded = true; }
    updateVisibility();
    renderMining();
  }

  return { configure, ensureMounted, refreshConfig, ensureLoaded, updateVisibility, loadMiningRewards, addMiner, deleteMiner, selectWallet, selectNft, selectNftClass, discoverMinerNfts, useManualNft, saveNftClassification };
})();
