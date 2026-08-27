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

  let sb = null;
  let getContext = null;
  let mounted = false;
  let loaded = false;
  let projectRefs = [];
  let miners = [];
  let rewardRows = [];

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
          <div class="note" style="margin-bottom:10px">Miner-Zuordnungen werden aus <code>project_miners</code> gelesen. Historische APTM-Kurse kommen bevorzugt aus <code>aptm_price_history</code>; fehlende Pool-Syncs können von Admins on-chain ergänzt und zentral gespeichert werden.</div>
          <div id="dao1AdminMinerEditor"></div>
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
    el.innerHTML = `<span class="field-label">DAO1 Projekt-Konfiguration</span>${refs || '<div class="empty">Noch keine DAO1-Projektassets in Supabase konfiguriert.</div>'}`;
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

  async function loadMiningRewards() {
    const status = document.getElementById("dao1MiningStatus");
    if (!miners.length) { status.textContent = "Keine Miner-Zuordnungen vorhanden."; return; }
    try {
      status.textContent = "Claim-Transaktionen werden ermittelt…";
      rewardRows = [];
      const claimCandidates = [];
      for (const miner of miners) {
        const txs = await fetchAll(`/addresses/${miner.wallet_address}/transactions`);
        for (const t of txs) {
          const input = String(t.raw_input || t.input || "");
          if (input.slice(0,10).toLowerCase() !== CLAIM_SELECTOR) continue;
          const ps = words(input);
          const nft = BigInt(miner.nft_id);
          if (ps[0] !== nft && ps[1] !== nft) continue;
          claimCandidates.push({ miner, t, p1: ps[0]?.toString(), p2: ps[1]?.toString() });
        }
      }
      if (!claimCandidates.length) { status.textContent = "Keine passenden claimReward()-Calls gefunden."; renderMining(); return; }
      const blocks = claimCandidates.map(x => Number(x.t.block_number ?? x.t.block)).filter(Number.isFinite);
      const minBlock = Math.min(...blocks), maxBlock = Math.max(...blocks);
      let history = [];
      try { history = await loadCachedPrices(minBlock, maxBlock); } catch (e) { console.warn(e); }
      if (!history.length || !priceAtBlock(history, minBlock)) {
        status.textContent = "Historischer APTM-Preisbereich fehlt – Pool-Syncs werden ergänzt…";
        await syncPriceHistory(minBlock, maxBlock);
        try { history = await loadCachedPrices(minBlock, maxBlock); } catch {}
      }
      let done = 0;
      for (const c of claimCandidates) {
        done++; status.textContent = `Claims werden ausgewertet ${done}/${claimCandidates.length}…`;
        const logs = await fetchAll(`/transactions/${c.t.hash}/logs`);
        const reward = rewardFromLogs(logs, c.miner.wallet_address);
        const gas = feeAptm(c.t);
        const block = Number(c.t.block_number ?? c.t.block);
        const ph = priceAtBlock(history, block);
        const price = ph ? Number(ph.aptm_usd) : null;
        rewardRows.push({ miner: c.miner, timestamp: c.t.timestamp, block, tx: c.t.hash, p1: c.p1, p2: c.p2, reward, gas, net: reward-gas, price, rewardUsd: price == null ? null : reward*price, gasUsd: price == null ? null : gas*price, syncBlock: ph?.block_number || null });
      }
      rewardRows.sort((a,b) => new Date(a.timestamp)-new Date(b.timestamp));
      renderMining();
      status.textContent = `${rewardRows.length} Claims ausgewertet.`;
    } catch (e) {
      console.error(e);
      status.innerHTML = `<span class="error">${e.message}</span>`;
    }
  }

  function renderMining() {
    const summary = document.getElementById("dao1MiningSummary");
    const table = document.getElementById("dao1MiningTable");
    const r = rewardRows.reduce((s,x)=>s+x.reward,0), g = rewardRows.reduce((s,x)=>s+x.gas,0), u = rewardRows.reduce((s,x)=>s+(x.rewardUsd||0),0);
    if (summary) summary.innerHTML = `<div class="project-summary"><div class="custom-token-card project-summary-box"><span class="field-label">Claims</span><strong>${rewardRows.length}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">Rewards</span><strong>${fmt(r)} APTM</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">historischer USD-Wert</span><strong>${usd(u)}</strong></div><div class="custom-token-card project-summary-box"><span class="field-label">Gas</span><strong>${fmt(g)} APTM</strong></div></div>`;
    if (!table) return;
    if (!rewardRows.length) { table.innerHTML = '<div class="empty">Noch keine Mining-Auswertung geladen.</div>'; return; }
    table.innerHTML = `<div class="chain-table-wrap"><table class="chain-admin-table"><thead><tr><th>Miner</th><th>Zeit</th><th>Block</th><th>Reward APTM</th><th>APTM/USD</th><th>Reward USD</th><th>Gas APTM</th><th>Netto APTM</th><th>Tx</th></tr></thead><tbody>${rewardRows.map(x=>`<tr><td>${x.miner.label || "#"+x.miner.nft_id}</td><td>${x.timestamp}</td><td>${x.block}</td><td>${fmt(x.reward)}</td><td>${x.price == null ? "–" : fmt(x.price)}</td><td>${usd(x.rewardUsd)}</td><td>${fmt(x.gas)}</td><td>${fmt(x.net)}</td><td><a href="${EXPLORER}/tx/${x.tx}" target="_blank" rel="noopener">${x.tx.slice(0,12)}…</a></td></tr>`).join("")}</tbody></table></div>`;
  }

  async function ensureLoaded() {
    await ensureMounted();
    if (!loaded) { await refreshConfig(); loaded = true; }
    updateVisibility();
    renderMining();
  }

  return { configure, ensureMounted, refreshConfig, ensureLoaded, updateVisibility, loadMiningRewards, addMiner, deleteMiner };
})();
