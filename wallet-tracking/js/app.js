// ---- Supabase: Auth + Datenbank ----
const SUPABASE_URL = "https://cfnxuesibpnlgyklzqkj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mz_vXAY0Z6sm7iXMg_bjyQ_beZDiQ1N";
const REDIRECT_URL = "https://letsgofree.me/wallet-tracking/";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let isAdmin = false;
let defiProjectsCache = [];
let predefinedTokenProject = {};


async function checkIsAdmin() {
  try {
    const { data, error } = await sb.from("admins").select("email").eq("email", currentUser.email).maybeSingle();
    if (error) { console.error(error); return false; }
    return !!data;
  } catch (e) {
    return false;
  }
}

async function sendMagicLink() {
  const email = document.getElementById("authEmail").value.trim();
  const statusEl = document.getElementById("authStatus");
  if (!email) { statusEl.textContent = "Bitte E-Mail-Adresse eingeben."; return; }
  statusEl.textContent = "Sende Login-Link...";
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: REDIRECT_URL }
  });
  statusEl.textContent = error
    ? "Fehler: " + error.message
    : "Link verschickt - check dein E-Mail-Postfach und klick auf den Link.";
}

const WELCOME_META_KEY = "wallet_tracking_welcome_dismissed_v1";
const DONATION_EVM_ADDRESS = "0x76882e6Fc045391Ba4F19d8a15eA4D8699Ff7382";

function maybeShowWelcomeModal() {
  if (!currentUser?.user_metadata?.[WELCOME_META_KEY]) {
    document.getElementById("welcomeModal")?.classList.add("open");
  }
}
function closeWelcomeModal() { document.getElementById("welcomeModal")?.classList.remove("open"); }
function welcomeGoToHelp() { closeWelcomeModal(); showTab("help"); }
async function dismissWelcomeForever(btn) {
  if (btn) { btn.disabled = true; btn.textContent = "Wird gespeichert…"; }
  const merged = { ...(currentUser?.user_metadata || {}), [WELCOME_META_KEY]: true };
  const { data, error } = await sb.auth.updateUser({ data: merged });
  if (error) {
    console.error("Willkommens-Hinweis speichern:", error);
    if (btn) { btn.disabled = false; btn.textContent = "Nicht mehr anzeigen"; }
    alert("Die Einstellung konnte nicht gespeichert werden. Bitte später nochmals versuchen.");
    return;
  }
  if (data?.user) currentUser = data.user;
  closeWelcomeModal();
}

function openDonationModal() {
  document.getElementById("donationModal")?.classList.add("open");
  renderDonationQr();
}
function closeDonationModal() { document.getElementById("donationModal")?.classList.remove("open"); }
function renderDonationQr() {
  const chain = document.getElementById("donationChain")?.value || "bsc";
  const token = document.getElementById("donationToken")?.value || "USDT";
  const chainLabel = { bsc:"BNB Smart Chain (BSC)", eth:"Ethereum", matic:"Polygon" }[chain] || chain;
  const qr = document.getElementById("donationQr");
  const note = document.getElementById("donationSelectionNote");
  if (note) note.innerHTML = `<strong>${token}</strong> über <strong>${chainLabel}</strong>`;
  if (!qr) return;
  qr.innerHTML = "";
  if (typeof QRCode === "undefined") { qr.innerHTML = '<span style="color:#111;font-size:.75rem;text-align:center">QR-Code konnte nicht geladen werden.</span>'; return; }
  new QRCode(qr, { text:DONATION_EVM_ADDRESS, width:180, height:180, correctLevel:QRCode.CorrectLevel.M });
}
async function copyDonationAddress() {
  const status = document.getElementById("donationCopyStatus");
  try {
    await navigator.clipboard.writeText(DONATION_EVM_ADDRESS);
    if (status) status.textContent = "Kopiert ✓";
  } catch (_) {
    if (status) status.textContent = "Bitte Adresse manuell kopieren.";
  }
}

async function logout() {
  await sb.auth.signOut();
  location.reload();
}

async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  sb.auth.onAuthStateChange((event, newSession) => {
    if (newSession && !currentUser) {
      onLoggedIn(newSession);
    }
  });
  if (session) {
    await onLoggedIn(session);
  }
}

async function onLoggedIn(session) {
  currentUser = session.user;
  document.getElementById("authGate").style.display = "none";
  document.getElementById("appContent").style.display = "none";
  document.getElementById("userEmailLabel").textContent = "Eingeloggt als " + currentUser.email;
  document.getElementById("heroUserActions").style.display = "block";

  // Chain-Konfiguration ist zwingend. Ohne public.chains wird NICHT mit versteckten
  // HTML-Fallbacks weitergearbeitet.
  try {
    await loadChainConfigFromDb();
  } catch (e) {
    console.error(e);
    const gate = document.getElementById("authGate");
    if (gate) {
      gate.style.display = "block";
      gate.innerHTML = `<div class="auth-card"><h2>Konfigurationsfehler</h2>
        <div class="error">${escapeAttr(e.message || String(e))}</div>
        <p class="note">Das Dashboard benötigt die Chain-Konfiguration aus Supabase und startet ohne diese Daten bewusst nicht.</p></div>`;
    }
    return;
  }

  document.getElementById("appContent").style.display = "block";

  isAdmin = await checkIsAdmin();
  document.getElementById("adminNavGroup").style.display = isAdmin ? "block" : "none";
  document.getElementById("userChatTabBtn").style.display = isAdmin ? "none" : "inline-block";
  document.getElementById("adminChatTabBtn").style.display = isAdmin ? "inline-block" : "none";
  document.getElementById("feesTabBtn").style.display = "inline-block";
  document.getElementById("adminAddPredefinedTokenCard").style.display = isAdmin ? "block" : "none";
  if (isAdmin) {
    document.getElementById("newPredefChain").innerHTML = Object.keys(CHAIN_META).map(c => `<option value="${c}">${CHAIN_META[c].label}</option>`).join("");
  }
  setupChatRealtime();
  await updateChatUnreadBadge();

  loadTokenMetaCache();
  await loadDefiProjectsCache();
  await loadPredefinedTokensFromDb();
  await loadWalletsFromDb();
  await loadCustomSafeTokensFromDb();
  await loadSnapshotsFromDb();

  if (window.WalletLPEngine) {
    window.WalletLPEngine.configure(() => ({
      chainConfig: CHAIN_CONFIG,
      predefinedTokenSymbols, predefinedTokenNames, predefinedTokenDecimals,
      currentPrice: priceForToken,
      historicalPrice: taxHistoricalPrice,
      sb, currentUser
    }));
  }

  if (window.DAO1Project) {
    window.DAO1Project.configure({
      sb,
      getContext: () => ({
        currentUser,
        isAdmin,
        wallets,
        walletData,
        snapshots,
        chainMeta: CHAIN_META,
        chainConfig: CHAIN_CONFIG,
        predefinedTokenProject,
        predefinedTokenCategory,
        normalizeAddress,
        dustThreshold: DUST_THRESHOLD,
        lpEngine: window.WalletLPEngine,
        priceForToken, taxHistoricalPrice, taxEvmBlockByTime,
        refreshApertumNftsForWallet
      })
    });
    await window.DAO1Project.ensureMounted();
    await window.DAO1Project.refreshConfig();
  }

  activeChainFilter = new Set(Object.keys(CHAIN_META)); // Chain-Filter IMMER mit allen Chains starten
  renderChainFilter();
  renderWalletInputs();
  renderTaxWalletSelect();
  renderEvmWalletChainsNote();
  renderCustomChainSelect();
  renderCustomTokenList();
  renderSafeTokenTable();
  renderSnapshotManager();
  renderChartWalletSelect();
  renderChartChainSelect();
  renderAllocWalletSelect();
  renderResults();
  activeDiscoveryChains = new Set(discoveryChains());
  renderDiscoveryChainFilter();
  renderDiscoveryWalletSelect();
  await loadDiscoveryCacheFromDb();
  activeFeesChains = new Set(feeChains());
  renderFeesChainFilter();
  renderFeesWalletSelect();
  await renderFeesSummary();
  activeApprovalsChains = new Set(approvalsChains());
  renderApprovalsChainFilter();
  renderApprovalsWalletSelect();
  activeNftChains = new Set(nftChains());
  renderNftChainFilter();
  renderNftWalletSelect();
  await loadNftCacheFromDb();

  // Zuerst letzten automatischen Snapshot sofort anzeigen, damit die Seite ohne
  // Wartezeit gefüllt ist. Danach werden die Bestände automatisch kostenlos live
  // aktualisiert (native Coins + vordefinierte/eigene sichere Token).
  const cachedAt = await loadFromAutomatedCache();
  if (cachedAt) {
    await loadNativePrices();
    renderResults();
    renderSafeTokenTable();
    renderCustomTokenList();
    renderAllocationChart();
    renderCacheStatusNote("Bestände vom " + fmtSnapshotDateTime(cachedAt) + " – Live-Aktualisierung startet…");
  } else {
    renderCacheStatusNote("Noch kein gespeicherter Stand – Live-Aktualisierung startet…");
  }

  showTab(wallets.length === 0 ? "wallets" : "tracking");
  maybeShowWelcomeModal();

  // Projektpreise im Hintergrund laden. Sobald sie da sind, werden alle Preisansichten
  // nochmals gerendert; dadurch ersetzen Projektpreise automatisch CoinGecko/GeckoTerminal
  // bei exakt derselben Contract-Adresse.
  if (window.TLNVOWProject) {
    window.TLNVOWProject.ensureLoaded().then(() => {
      renderResults();
      renderSafeTokenTable();
      renderCustomTokenList();
      renderAllocationChart();
    }).catch(e => console.warn("TLN/VOW-Projektpreise:", e));
  }

  // Nicht blockierend: Snapshot ist bereits sichtbar, Live-Daten kommen danach.
  if (wallets.length > 0) {
    loadAll({ automatic: true }).catch(e => {
      console.error("Automatische Live-Aktualisierung:", e);
      renderCacheStatusNote("Automatische Live-Aktualisierung fehlgeschlagen – letzter gespeicherter Stand bleibt sichtbar.");
    });
  }
}


// ---- Bestandesaufnahme per 31.12: historische Bestände ----
let taxRows = [];
let taxCoverage = [];
const taxPriceCache = new Map();

let taxSnapshotLoaded = false;

function taxSnapshotWalletId(row){
  const w=wallets.find(x=>String(x.dbId||x.id)===String(row.wallet_id));
  return w?.dbId||w?.id||row.wallet_id||null;
}
async function loadTaxSnapshot(date,walletSel="__all"){
  if(!currentUser||!date)return false;
  let q=sb.from("year_end_positions").select("*").eq("snapshot_date",date).order("wallet_label").order("chain_key").order("symbol");
  if(walletSel!=="__all")q=q.eq("wallet_id",walletSel);
  const {data,error}=await q;
  if(error){if(error.code!=="PGRST205")console.warn("Gespeicherte Bestandesaufnahme:",error);return false;}
  if(!data?.length)return false;
  taxRows=data.map(r=>({wallet:r.wallet_label,wallet_address:r.wallet_address,chain:r.chain_key,asset:r.asset_key,symbol:r.symbol,amount:r.amount==null?null:Number(r.amount),decimals:r.decimals,block:r.block_ref,price_usd:r.price_usd==null?null:Number(r.price_usd),value_usd:r.value_usd==null?null:Number(r.value_usd),price_source:r.price_source,status:r.status,balance_source:r.balance_source,error:r.error_message||null,wallet_id:r.wallet_id}));
  let cq=sb.from("year_end_coverage").select("*").eq("snapshot_date",date);
  if(walletSel!=="__all")cq=cq.eq("wallet_scope",walletSel);
  else cq=cq.eq("wallet_scope","__all");
  const cr=await cq; taxCoverage=(cr.data||[]).map(c=>({chain:c.chain_key,status:c.status,scope:c.scope,detail:c.detail}));
  taxSnapshotLoaded=true;renderTaxResults(date,document.getElementById("taxTimezone")?.value||"Europe/Zurich");
  document.getElementById("taxExcelBtn").disabled=false;document.getElementById("taxPdfBtn").disabled=false;
  taxSetStatus("ready",`Gespeicherte Bestandesaufnahme vom ${date} geladen.`,`Keine Blockchain-Abfragen erforderlich. Mit „Neu berechnen“ kann der Stichtag vollständig aktualisiert werden.`);
  return true;
}
async function saveTaxSnapshot(date,tz,walletSel){
  if(!currentUser||!date)return;
  const selected=walletSel==="__all"?wallets:wallets.filter(w=>String(w.id)===String(walletSel));
  const ids=new Set(selected.map(w=>String(w.dbId||w.id)));
  await sb.from("year_end_positions").delete().eq("snapshot_date",date).in("wallet_id",[...ids]);
  const payload=taxRows.filter(r=>{const w=selected.find(x=>x.label===r.wallet&&walletAddressForChain(x,r.chain)===r.wallet_address);return !!w?.dbId;}).map(r=>{
    const w=selected.find(x=>x.label===r.wallet&&walletAddressForChain(x,r.chain)===r.wallet_address);
    return {user_id:currentUser.id,snapshot_date:date,timezone:tz,wallet_id:w.dbId,wallet_label:r.wallet,wallet_address:r.wallet_address,chain_key:r.chain,asset_key:r.asset||"native",symbol:r.symbol||null,decimals:r.decimals??null,amount:r.amount??null,block_ref:r.block??null,price_usd:r.price_usd??null,value_usd:r.value_usd??null,balance_source:r.balance_source||null,price_source:r.price_source||null,status:r.status||"verifiziert",error_message:r.error||null,calculated_at:new Date().toISOString()};
  });
  if(payload.length){const {error}=await sb.from("year_end_positions").upsert(payload,{onConflict:"user_id,snapshot_date,wallet_id,chain_key,asset_key"});if(error)throw error;}
  const scope=walletSel==="__all"?"__all":String(walletSel);
  await sb.from("year_end_coverage").delete().eq("snapshot_date",date).eq("wallet_scope",scope);
  const cp=taxCoverage.map(c=>({user_id:currentUser.id,snapshot_date:date,wallet_scope:scope,chain_key:c.chain,status:c.status,scope:c.scope||null,detail:c.detail||null,calculated_at:new Date().toISOString()}));
  if(cp.length){const {error}=await sb.from("year_end_coverage").upsert(cp,{onConflict:"user_id,snapshot_date,wallet_scope,chain_key"});if(error)throw error;}
  taxSnapshotLoaded=true;
}
async function refreshTaxPricesOnly(){
  const date=document.getElementById("taxDate")?.value,walletSel=document.getElementById("taxWalletSelect")?.value||"__all";if(!date)return;
  if(!taxRows.length && !(await loadTaxSnapshot(date,walletSel)))return alert("Für diesen Stichtag ist noch keine gespeicherte Bestandesaufnahme vorhanden.");
  const btn=document.getElementById("taxPriceRefreshBtn");btn.disabled=true;btn.textContent="Kurse werden aktualisiert…";taxPriceCache.clear();
  try{for(let i=0;i<taxRows.length;i++){const r=taxRows[i];if(r.status!=="verifiziert"||!(Number(r.amount)>0))continue;const asset=r.asset==="native"?"native":{address:r.asset,symbol:r.symbol,decimals:r.decimals,coingeckoId:predefinedTokenCoinGeckoIds[r.chain+"|"+normalizeAddress(r.asset,r.chain)]||null};const hp=await taxHistoricalPrice(r.chain,asset,date,r.block);if(hp){r.price_usd=hp.price;r.value_usd=Number(r.amount)*hp.price;r.price_source=hp.source;}}
    await saveTaxSnapshot(date,document.getElementById("taxTimezone")?.value||"Europe/Zurich",walletSel);renderTaxResults(date,document.getElementById("taxTimezone")?.value||"");taxSetStatus("ready","Historische Kurse aktualisiert.","Gespeicherte Bestände wurden nicht erneut von der Blockchain geladen.");
  }catch(e){taxSetStatus("error",e.message||String(e));}finally{btn.disabled=false;btn.textContent="Nur Kurse aktualisieren";}
}

function taxEligibleChains(){
  return Object.keys(CHAIN_CONFIG).filter(c=>{
    const t=CHAIN_CONFIG[c]?.walletType;
    return t==="evm" || t==="btc" || t==="xrp" || t==="sol";
  });
}

function renderTaxWalletSelect(){
  const el=document.getElementById("taxWalletSelect");
  if(!el)return;
  const current=el.value;
  el.innerHTML='<option value="__all">Alle Wallets</option>'+wallets.map(w=>`<option value="${w.id}">${escapeAttr(w.label)}</option>`).join("");
  if(current==="__all" || wallets.some(w=>String(w.id)===String(current)))el.value=current;
  else el.value="__all";
  const date=document.getElementById("taxDate");
  if(date && !date.value){const y=new Date().getFullYear()-1;date.value=`${y}-12-31`;}
  if(date&&!date.dataset.snapshotBound){date.dataset.snapshotBound="1";date.addEventListener("change",()=>loadTaxSnapshot(date.value,el.value));el.addEventListener("change",()=>loadTaxSnapshot(date.value,el.value));setTimeout(()=>loadTaxSnapshot(date.value,el.value),0);}
}

function taxSetStatus(kind,text,detail=""){
  const el=document.getElementById("taxStatus");
  if(!el)return;
  const icon=kind==="ready"?"✅":kind==="error"?"❌":"⏳";
  el.innerHTML=`<strong>${icon} ${escapeAttr(text)}</strong>${detail?`<div class="meta" style="margin-top:4px">${escapeAttr(detail)}</div>`:""}`;
}

function zonedEndOfDayEpoch(dateStr,tz){
  const [y,m,d]=dateStr.split("-").map(Number);
  let guess=Date.UTC(y,m-1,d,23,59,59);
  if(tz==="UTC")return Math.floor(guess/1000);
  const fmt=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
  for(let i=0;i<3;i++){
    const parts=Object.fromEntries(fmt.formatToParts(new Date(guess)).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
    const represented=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second));
    const target=Date.UTC(y,m-1,d,23,59,59);
    guess+=target-represented;
  }
  return Math.floor(guess/1000);
}

function taxChainWallets(selectedWallets,chain){
  return selectedWallets.filter(w=>walletAddressForChain(w,chain));
}

function taxCoverageSet(chain,status,detail="",scope=""){
  const existing=taxCoverage.find(x=>x.chain===chain);
  const row={chain,status,detail,scope};
  if(existing)Object.assign(existing,row); else taxCoverage.push(row);
}

let taxRoutescanLastCall=0;
async function taxRoutescanThrottle(){
  const wait=Math.max(0,525-(Date.now()-taxRoutescanLastCall));
  if(wait)await new Promise(r=>setTimeout(r,wait));
  taxRoutescanLastCall=Date.now();
}

function routescanBase(chain){
  const id=CHAIN_CONFIG[chain]?.evmChainId;
  if(!id)throw new Error("EVM Chain-ID fehlt in public.chains.");
  return `https://api.routescan.io/v2/network/mainnet/evm/${id}/etherscan/api`;
}

async function routescanCall(chain,params){
  await taxRoutescanThrottle();
  const qs=new URLSearchParams(params);
  const res=await fetch(`${routescanBase(chain)}?${qs.toString()}`,{headers:{"accept":"application/json"}});
  if(!res.ok)throw new Error(`Routescan HTTP ${res.status}`);
  const j=await res.json();
  if(String(j.status)==="0" && !/no transactions|no records/i.test(String(j.message||"")+" "+String(j.result||""))){
    throw new Error(`Routescan: ${typeof j.result==="string"?j.result:(j.message||"Abfrage fehlgeschlagen")}`);
  }
  return j.result;
}

const taxRoutescanUnavailable = new Set();

async function taxEvmBlockByTime(chain,targetEpoch){
  // Free source first. Unsupported Routescan networks are remembered for this page session.
  if (!taxRoutescanUnavailable.has(chain)) {
    try {
      const r = await routescanCall(chain,{
        module:"block",action:"getblocknobytime",
        timestamp:String(targetEpoch),closest:"before"
      });
      const n=Number(typeof r==="object"?(r.blockNumber??r.block_number??r.result):r);
      if(Number.isFinite(n)&&n>0)return {block:n,source:"Routescan getblocknobytime"};
      throw new Error("ungültige Blockantwort");
    } catch(e) {
      console.warn(`${CHAIN_META[chain]?.label||chain}: kostenlose Stichtagsblock-Abfrage fehlgeschlagen; Archive-Fallback.`,e);
      taxRoutescanUnavailable.add(chain);
    }
  }

  const latestHex=await archiveRpc(chain,"eth_blockNumber",[]);
  let low=0, high=Number(BigInt(latestHex)), best=0;
  while(low<=high){
    const mid=Math.floor((low+high)/2);
    const b=await archiveRpc(chain,"eth_getBlockByNumber",[taxBlockHex(mid),false]);
    if(!b){high=mid-1;continue;}
    const ts=Number(BigInt(b.timestamp));
    if(ts<=targetEpoch){best=mid;low=mid+1;} else high=mid-1;
  }
  if(!best)throw new Error("Historischer Stichtagsblock konnte nicht bestimmt werden.");
  return {block:best,source:"Alchemy Archive"};
}

async function taxEvmNativeBalance(chain,address,block){
  if(!taxRoutescanUnavailable.has(chain)){
    try{
      const r=await routescanCall(chain,{
        module:"account",action:"balancehistory",
        address,blockno:String(block)
      });
      const raw=typeof r==="object"?(r.balance??r.Balance??r.result):r;
      if(raw!=null && /^\d+$/.test(String(raw))){
        return {amount:Number(BigInt(String(raw)))/1e18,source:`Routescan balancehistory @ Block ${block}`};
      }
      throw new Error("Historischer Native-Bestand nicht lesbar.");
    }catch(e){
      console.warn(`${CHAIN_META[chain]?.label||chain}: kostenlose Native-Balance fehlgeschlagen; Archive-Fallback.`,e);
      taxRoutescanUnavailable.add(chain);
    }
  }
  const raw=await archiveRpc(chain,"eth_getBalance",[address,taxBlockHex(block)]);
  return {amount:Number(BigInt(raw||"0x0"))/1e18,source:`Alchemy eth_getBalance @ Block ${block}`};
}

async function taxEvmTokenBalance(chain,address,token,block){
  const decimals=await taxTokenDecimalsCurrent(chain,token);
  if(!taxRoutescanUnavailable.has(chain)){
    try{
      const r=await routescanCall(chain,{
        module:"account",action:"tokenbalancehistory",
        contractaddress:token.address,address,blockno:String(block)
      });
      const raw=typeof r==="object"?(r.balance??r.Balance??r.result):r;
      if(raw!=null && /^\d+$/.test(String(raw))){
        return {amount:Number(BigInt(String(raw)))/Math.pow(10,decimals),decimals,source:`Routescan tokenbalancehistory @ Block ${block}`};
      }
      throw new Error("Historischer Token-Bestand nicht lesbar.");
    }catch(e){
      console.warn(`${CHAIN_META[chain]?.label||chain}: kostenlose Token-Balance fehlgeschlagen; Archive-Fallback.`,e);
      taxRoutescanUnavailable.add(chain);
    }
  }
  const ownerArg=String(address).toLowerCase().replace(/^0x/,"").padStart(64,"0");
  const raw=await archiveRpc(chain,"eth_call",[{to:token.address,data:"0x70a08231"+ownerArg},taxBlockHex(block)]);
  return {amount:Number(BigInt(raw||"0x0"))/Math.pow(10,decimals),decimals,source:`Alchemy ERC-20 balanceOf @ Block ${block}`};
}

async function historicalErc20Candidates(chain,address,targetBlock=null){
  const found=new Set();
  // Alchemy: Transferhistorie findet auch vollständig verkaufte Token/LPs.
  if(CHAIN_CONFIG[chain]?.discoveryProvider==="alchemy"){
    for(const direction of ["fromAddress","toAddress"]){
      let pageKey=null,pages=0;
      do{
        const q={fromBlock:"0x0",toBlock:targetBlock!=null?taxBlockHex(targetBlock):"latest",category:["erc20"],withMetadata:false,excludeZeroValue:false,maxCount:"0x3e8"};
        q[direction]=address;if(pageKey)q.pageKey=pageKey;
        const r=await alchemyRpc(chain,"alchemy_getAssetTransfers",[q],"discovery");
        for(const t of (r?.transfers||[])){const a=t.rawContract?.address;if(a&&/^0x[0-9a-f]{40}$/i.test(a))found.add(normalizeAddress(a,chain));}
        pageKey=r?.pageKey||null;pages++;
      }while(pageKey&&pages<100);
    }
  }
  // Blockscout-v2-kompatible Explorer (Apertum u.a.): Wallet-Token-Transfers paginieren.
  const base=String(CHAIN_CONFIG[chain]?.discoveryApiBase||CHAIN_CONFIG[chain]?.balanceApiBase||"").replace(/\/$/,"");
  if(base && CHAIN_CONFIG[chain]?.discoveryProvider!=="alchemy"){
    try{
      let url=`${base}/addresses/${address}/token-transfers?type=ERC-20`,pages=0;
      while(url&&pages++<200){const res=await fetch(url);if(!res.ok)break;const j=await res.json();for(const t of (j.items||[])){const a=t.token?.address;if(a&&/^0x[0-9a-f]{40}$/i.test(a)){if(targetBlock==null||Number(t.block_number||0)<=Number(targetBlock))found.add(normalizeAddress(a,chain));}}const np=j.next_page_params;url=np?`${base}/addresses/${address}/token-transfers?type=ERC-20&${new URLSearchParams(np)}`:null;}
    }catch(e){console.warn("Historische Token-Kandidaten",chain,e);}
  }
  return [...found];
}

function taxTokenUniverse(chain){
  const m=new Map();
  const add=(address,symbol,decimals,label)=>{
    if(!address)return;
    const a=normalizeAddress(address,chain);
    if(!/^0x[0-9a-f]{40}$/i.test(a))return;
    const old=m.get(a)||{};
    const key=chain+"|"+a;
    m.set(a,{
      address:a,
      symbol:symbol||old.symbol||predefinedTokenSymbols[key]||label||a.slice(0,8)+"…",
      decimals:Number.isFinite(Number(decimals))?Number(decimals):(Number.isFinite(Number(old.decimals))?Number(old.decimals):undefined),
      label:label||old.label||predefinedTokenLabels[key]||symbol||"",
      coingeckoId:predefinedTokenCoinGeckoIds[key]||old.coingeckoId||null
    });
  };
  (SAFE_ADDRESSES[chain]||[]).forEach(a=>{
    const k=chain+"|"+a;
    add(a,predefinedTokenSymbols[k],predefinedTokenDecimals[k],predefinedTokenLabels[k]);
  });
  customSafeTokens.filter(t=>t.chain===chain).forEach(t=>add(t.address,null,null,t.label));
  snapshots.forEach(s=>s.items.filter(it=>it.chain===chain && !it.is_native && it.address).forEach(it=>add(it.address,it.symbol,it.decimals,it.symbol)));
  return [...m.values()];
}

async function taxTokenDecimalsCurrent(chain,token){
  const known=Number(token?.decimals);
  if(Number.isFinite(known) && known>=0 && known<=255)return known;
  const key=chain+"|"+normalizeAddress(token?.address||"",chain);
  const predefined=Number(predefinedTokenDecimals[key]);
  if(Number.isFinite(predefined) && predefined>=0 && predefined<=255)return predefined;
  // Avoid Routescan proxy eth_call here: some Routescan chains return HTTP 500 for proxy calls.
  // Unknown decimals are explicitly a metadata limitation; ERC-20 default 18 is used only for
  // the raw-unit conversion and surfaced through the balance source.
  return 18;
}

function taxDateForCoinGecko(dateStr){
  const [y,m,d]=dateStr.split("-");
  return `${d}-${m}-${y}`;
}

async function taxCoinGeckoPrice(id,dateStr){
  if(!id)return null;
  const key=`${id}|${dateStr}`;
  if(taxPriceCache.has(key))return taxPriceCache.get(key);
  const url=`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/history?date=${taxDateForCoinGecko(dateStr)}&localization=false`;
  for(let attempt=0;attempt<3;attempt++){
    try{
      if(attempt)await new Promise(r=>setTimeout(r,1200*attempt));
      const res=await fetch(url);
      if(!res.ok){
        if((res.status===429 || res.status>=500) && attempt<2)continue;
        throw new Error(`CoinGecko HTTP ${res.status}`);
      }
      const j=await res.json();
      const p=Number(j?.market_data?.current_price?.usd);
      const out=Number.isFinite(p)&&p>0?{price:p,source:`CoinGecko Tageskurs · ${dateStr}`} : null;
      taxPriceCache.set(key,out);
      return out;
    }catch(e){
      if(attempt===2){
        console.warn("Historischer CoinGecko-Preis:",id,e);
        taxPriceCache.set(key,null);
        return null;
      }
    }
  }
  return null;
}

function taxNativeCoinGeckoId(chain){
  if(CHAIN_META[chain]?.coingeckoId)return CHAIN_META[chain].coingeckoId;
  const cfg=CHAIN_CONFIG[chain]||{};
  const chainId=Number(cfg.evmChainId);
  const byEvmId={
    1:"ethereum",
    56:"binancecoin",
    137:"polygon-ecosystem-token",
    42161:"ethereum",
    8453:"ethereum",
    43114:"avalanche-2"
  };
  if(byEvmId[chainId])return byEvmId[chainId];
  if(cfg.walletType==="btc")return "bitcoin";
  if(cfg.walletType==="xrp")return "ripple";
  if(cfg.walletType==="sol")return "solana";
  return null;
}

const taxDexFactoryCache=new Map(),taxProjectReferenceCache=new Map();
const taxV2Iface=new ethers.Interface(["function getPair(address,address) view returns (address)","function token0() view returns (address)","function getReserves() view returns (uint112 reserve0,uint112 reserve1,uint32 blockTimestampLast)"]);
function taxPredefinedBySymbol(chain,symbol){
  const wanted=String(symbol||"").toUpperCase();
  for(const [k,sym] of Object.entries(predefinedTokenSymbols)){if(!k.startsWith(chain+"|"))continue;if(String(sym||"").toUpperCase()!==wanted)continue;const a=k.slice(chain.length+1);return {address:a,symbol:sym,decimals:predefinedTokenDecimals[k],coingeckoId:predefinedTokenCoinGeckoIds[k]||null};}
  return null;
}
async function taxDexFactory(chain){
  if(taxDexFactoryCache.has(chain))return taxDexFactoryCache.get(chain);
  const {data,error}=await sb.from("dex_configs").select("factory_address,version").eq("chain_key",chain).eq("enabled",true);
  const r=!error?(data||[]).find(x=>String(x.version||"").toLowerCase()==="v2"):null,out=r?.factory_address?normalizeAddress(r.factory_address,chain):null;taxDexFactoryCache.set(chain,out);return out;
}
async function taxProjectReference(project,chain){
  const k=project+"|"+chain;if(taxProjectReferenceCache.has(k))return taxProjectReferenceCache.get(k);
  const {data,error}=await sb.from("defi_project_tokens").select("contract_address,role").eq("project_key",project).eq("chain_key",chain).eq("enabled",true);
  const r=!error?(data||[]).find(x=>String(x.role||"").toLowerCase()==="reference"):null,out=r?.contract_address?normalizeAddress(r.contract_address,chain):null;taxProjectReferenceCache.set(k,out);return out;
}
async function taxV2Pair(chain,a,b,block){
  const f=await taxDexFactory(chain);if(!f)return null;
  // Apertum: Factory/Pair-Metadaten werden aktuell gelesen; ob der Pool am Stichtag schon
  // existierte, entscheidet anschließend der letzte Sync <= Stichtagsblock. Das vermeidet
  // unzuverlässige historische eth_call-Zustände des öffentlichen Apertum-RPC.
  const callBlock=chain==="apertum"?"latest":taxBlockHex(block);
  const raw=await archiveRpc(chain,"eth_call",[{to:f,data:taxV2Iface.encodeFunctionData("getPair",[a,b])},callBlock]),[pair]=taxV2Iface.decodeFunctionResult("getPair",raw);
  return !pair||/^0x0{40}$/i.test(pair)?null:normalizeAddress(pair,chain);
}
const taxApertumSyncCache=new Map();
async function taxApertumLastSync(pair,block){
  const key=`${normalizeAddress(pair,"apertum")}|${Number(block)}`;if(taxApertumSyncCache.has(key))return taxApertumSyncCache.get(key);
  const syncTopic="0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1",step=50000;
  for(let to=Number(block);to>=0;to-=step){const from=Math.max(0,to-step+1);let logs=[];try{logs=await archiveRpc("apertum","eth_getLogs",[{address:pair,fromBlock:taxBlockHex(from),toBlock:taxBlockHex(to),topics:[syncTopic]}]);}catch(e){console.warn("Apertum Sync-Logs",pair,from,to,e);continue;}if(logs?.length){const l=logs[logs.length-1],x=String(l.data||"").replace(/^0x/,"");if(x.length>=128){const out={r0:BigInt("0x"+x.slice(0,64)),r1:BigInt("0x"+x.slice(64,128)),block:Number(BigInt(l.blockNumber))};taxApertumSyncCache.set(key,out);return out;}}}
  taxApertumSyncCache.set(key,null);return null;
}
async function taxDirectV2Price(chain,base,quote,block,bd,qd){
  const pair=await taxV2Pair(chain,base,quote,block);if(!pair)return null;
  const token0Block=chain==="apertum"?"latest":taxBlockHex(block);
  const t0raw=await archiveRpc(chain,"eth_call",[{to:pair,data:taxV2Iface.encodeFunctionData("token0",[])},token0Block]);
  let r0,r1,sourceBlock=block;
  if(chain==="apertum"&&Number.isFinite(Number(block))){const st=await taxApertumLastSync(pair,Number(block));if(!st)return null;r0=st.r0;r1=st.r1;sourceBlock=st.block;}
  else{const rr=await archiveRpc(chain,"eth_call",[{to:pair,data:taxV2Iface.encodeFunctionData("getReserves",[])},taxBlockHex(block)]);[r0,r1]=taxV2Iface.decodeFunctionResult("getReserves",rr);}
  const [t0]=taxV2Iface.decodeFunctionResult("token0",t0raw),is0=normalizeAddress(t0,chain)===normalizeAddress(base,chain);
  const rb=Number(is0?r0:r1)/10**Number(bd),rq=Number(is0?r1:r0)/10**Number(qd);return rb>0&&rq>0?{price:rq/rb,pair,sourceBlock}:null;
}
async function taxApertumLpStateFromEvents(pair,block){
  const syncTopic="0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1";
  const transferTopic="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const zeroTopic="0x"+"0".repeat(64),step=50000;let sync=null,supply=0n;
  for(let from=0;from<=block;from+=step){const to=Math.min(block,from+step-1);let logs=[];try{logs=await archiveRpc("apertum","eth_getLogs",[{address:pair,fromBlock:taxBlockHex(from),toBlock:taxBlockHex(to),topics:[[syncTopic,transferTopic]]}]);}catch(e){console.warn("Apertum LP Logbereich",from,to,e);continue;}for(const l of logs||[]){const t0=String(l.topics?.[0]||"").toLowerCase();if(t0===syncTopic){const x=String(l.data||"").replace(/^0x/,"");if(x.length>=128)sync={r0:BigInt("0x"+x.slice(0,64)),r1:BigInt("0x"+x.slice(64,128)),block:Number(BigInt(l.blockNumber))};}else if(t0===transferTopic&&l.topics?.length>=3){const f=String(l.topics[1]).toLowerCase(),t=String(l.topics[2]).toLowerCase(),v=BigInt(l.data||"0x0");if(f===zeroTopic)supply+=v;if(t===zeroTopic)supply-=v;}}}
  return sync&&supply>0n?{...sync,supply}:null;
}
async function taxV2LpHistoricalPrice(chain,asset,block,dateStr){
  const pair=normalizeAddress(asset.address,chain),iface=new ethers.Interface(["function token0() view returns (address)","function token1() view returns (address)","function getReserves() view returns (uint112,uint112,uint32)","function totalSupply() view returns (uint256)"]);
  let a0,a1,r0,r1,supply;
  // Apertum: historische Reserven/LP-Supply eventbasiert, weil der öffentliche RPC bei alten
  // getReserves()-eth_calls unzuverlässige Nullzustände liefern kann.
  if(chain==="apertum"){
    [a0,a1]=await Promise.all(["token0","token1"].map(fn=>archiveRpc(chain,"eth_call",[{to:pair,data:iface.encodeFunctionData(fn,[])},"latest"])));
    const st=await taxApertumLpStateFromEvents(pair,block);if(!st)return null;r0=st.r0;r1=st.r1;supply=st.supply;
  }else{
    let rr,ts;[a0,a1,rr,ts]=await Promise.all(["token0","token1","getReserves","totalSupply"].map(fn=>archiveRpc(chain,"eth_call",[{to:pair,data:iface.encodeFunctionData(fn,[])},taxBlockHex(block)])));[r0,r1]=iface.decodeFunctionResult("getReserves",rr);[supply]=iface.decodeFunctionResult("totalSupply",ts);
  }
  const [t0]=iface.decodeFunctionResult("token0",a0),[t1]=iface.decodeFunctionResult("token1",a1);
  const mk=t=>{const a=normalizeAddress(t,chain),k=chain+"|"+a;return {address:a,symbol:predefinedTokenSymbols[k]||a.slice(0,8)+"…",decimals:predefinedTokenDecimals[k]??18,coingeckoId:predefinedTokenCoinGeckoIds[k]||null};};
  const x0=mk(t0),x1=mk(t1),d0=await taxTokenDecimalsCurrent(chain,x0),d1=await taxTokenDecimalsCurrent(chain,x1),lpd=await taxTokenDecimalsCurrent(chain,asset);
  const [p0,p1]=await Promise.all([taxHistoricalPrice(chain,x0,dateStr,block),taxHistoricalPrice(chain,x1,dateStr,block)]);if(!p0||!p1)return null;
  const q0=Number(r0)/10**d0,q1=Number(r1)/10**d1,lp=Number(supply)/10**lpd;if(!(lp>0))return null;
  return {price:(q0*p0.price+q1*p1.price)/lp,source:`V2 LP historisch · ${chain==="apertum"?"Sync/Transfer-Events":"Reserven + TotalSupply"} · ${pair} · Block ${block}`};
}

async function taxTlnVowHistoricalPrice(chain,asset,block,dateStr=""){
  if(!asset?.address)return null;const a=normalizeAddress(asset.address,chain),k=chain+"|"+a;if(predefinedTokenProject[k]!=="tln_vow")return null;
  const cat=String(predefinedTokenCategory[k]||""),vow=await taxProjectReference("tln_vow",chain),usdt=taxPredefinedBySymbol(chain,"USDT");if(!vow||!usdt)return null;
  if(["lp_token","lp"].includes(cat))return await taxV2LpHistoricalPrice(chain,asset,block,dateStr);
  const bd=await taxTokenDecimalsCurrent(chain,asset),vd=await taxTokenDecimalsCurrent(chain,{address:vow,decimals:predefinedTokenDecimals[chain+"|"+vow]??18}),ud=await taxTokenDecimalsCurrent(chain,usdt);
  const vu=await taxDirectV2Price(chain,vow,usdt.address,block,vd,ud);if(!vu)return null;
  if(a===vow)return {price:vu.price,source:`Uniswap V2 VOW/USDT · ${vu.pair} · Block ${block}`};
  if(["voucher_currency","v_currency"].includes(cat)){const leg=await taxDirectV2Price(chain,a,vow,block,bd,vd);return leg?{price:leg.price*vu.price,source:`TLN/VOW ${asset.symbol||"v-Währung"}/VOW → VOW/USDT · Pools ${leg.pair}, ${vu.pair} · Block ${block}`}:null;}
  if(["defi_token","tln_vow_token"].includes(cat)){const leg=await taxDirectV2Price(chain,a,vow,block,bd,vd);if(leg)return {price:leg.price*vu.price,source:`TLN/VOW ${asset.symbol||"Token"}/VOW → VOW/USDT · Pools ${leg.pair}, ${vu.pair} · Block ${block}`};const d=await taxDirectV2Price(chain,a,usdt.address,block,bd,ud);return d?{price:d.price,source:`TLN/VOW ${asset.symbol||"Token"}/USDT · ${d.pair} · Block ${block}`}:null;}
  return null;
}
async function taxApertumWrappedPrice(chain,asset,block,dateStr=""){
  if(chain!=="apertum"||!asset?.address)return null;
  const a=normalizeAddress(asset.address,chain),sym=String(asset.symbol||predefinedTokenSymbols[chain+"|"+a]||"").toUpperCase(),metaName=String(predefinedTokenNames[chain+"|"+a]||predefinedTokenLabels[chain+"|"+a]||"").toUpperCase();
  if(sym==="WUSDT"||sym==="USDT"||sym==="WUSDC"||sym==="USDC"||metaName.includes("WUSDT")||metaName.includes("WRAPPED USDT")||metaName.includes("WUSDC")||metaName.includes("WRAPPED USDC"))return {price:1,source:"Apertum Stablecoin-Parität · 1 USD"};
  const aptm=await taxHistoricalPrice(chain,"native",dateStr,block,true);
  if((sym==="WAPTM"||metaName.includes("WAPTM")||metaName.includes("WRAPPED APTM"))&&aptm)return {price:aptm.price,source:`wAPTM/APTM 1:1 · ${aptm.source}`};
  const u=taxPredefinedBySymbol(chain,"WUSDT")||taxPredefinedBySymbol(chain,"USDT"),wa=taxPredefinedBySymbol(chain,"WAPTM");if(!u)return null;
  const bd=await taxTokenDecimalsCurrent(chain,asset),ud=await taxTokenDecimalsCurrent(chain,u),direct=await taxDirectV2Price(chain,a,u.address,block,bd,ud);if(direct)return {price:direct.price,source:`Apertum DEX ${sym||"Token"}/wUSDT · ${direct.pair} · Block ${block}`};
  if(wa&&aptm){const wd=await taxTokenDecimalsCurrent(chain,wa),via=await taxDirectV2Price(chain,a,wa.address,block,bd,wd);if(via)return {price:via.price*aptm.price,source:`Apertum DEX ${sym||"Token"}/wAPTM → APTM/USD · ${via.pair} · Block ${block}`};}
  return null;
}


async function taxHistoricalPrice(chain,asset,dateStr,block=null,skipWrapped=false){
  if(chain==="apertum"&&asset==="native"&&block!=null){
    try{const {data,error}=await sb.from("aptm_price_history").select("block_number,aptm_usd").eq("chain_key","apertum").lte("block_number",Number(block)).order("block_number",{ascending:false}).limit(1).maybeSingle();if(!error&&data&&Number(data.aptm_usd)>0)return {price:Number(data.aptm_usd),source:`Apertum DEX APTM/wUSDT · Block ${data.block_number}`};}catch{}
    try{const wa=taxPredefinedBySymbol("apertum","WAPTM"),u=taxPredefinedBySymbol("apertum","WUSDT")||taxPredefinedBySymbol("apertum","USDT");if(wa&&u){const wd=await taxTokenDecimalsCurrent("apertum",wa),ud=await taxTokenDecimalsCurrent("apertum",u),d=await taxDirectV2Price("apertum",wa.address,u.address,Number(block),wd,ud);if(d)return {price:d.price,source:`Apertum DEX wAPTM/wUSDT · letzter Sync Block ${d.sourceBlock} (≤ ${block})`};}}catch(e){console.warn("APTM On-Chain-Historie",e);}
  }
  if(block!=null&&asset!=="native"){try{const t=await taxTlnVowHistoricalPrice(chain,asset,block,dateStr);if(t)return t;if(!skipWrapped){const a=await taxApertumWrappedPrice(chain,asset,block,dateStr);if(a)return a;}if(asset?.address&&window.WalletLPEngine){const pi=await window.WalletLPEngine.pairInfo(chain,asset.address);if(pi){const lp=await taxV2LpHistoricalPrice(chain,{...asset,decimals:pi.decimals},block,dateStr);if(lp)return lp;}}}catch(e){console.warn("Historischer DEX-/LP-Preis:",chain,asset?.symbol,e);}}
  if(chain==="apertum")return null; // Apertum wird bewusst vollständig on-chain bewertet; kein CoinGecko-Fallback.
  const id=asset==="native"?taxNativeCoinGeckoId(chain):(asset?.coingeckoId||null);return dateStr?taxCoinGeckoPrice(id,dateStr):null;
}


async function taxEvmChain(chain,selectedWallets,targetEpoch,dateStr){
  const ws=taxChainWallets(selectedWallets,chain);
  if(!ws.length)return;
  taxSetStatus("loading",`${CHAIN_META[chain]?.label||chain}: historischer Block via Routescan…`);
  let bi;
  try{bi=await taxEvmBlockByTime(chain,targetEpoch);}
  catch(e){taxCoverageSet(chain,"fehlgeschlagen",e.message,"EVM");return;}

  let tokens=taxTokenUniverse(chain);
  // Zusätzlich alle bis zum Stichtag jemals transferierten ERC-20-Contracts aufnehmen.
  // So erscheinen auch vollständig verkaufte Token und entfernte LP-Positionen.
  const histMap=new Map(tokens.map(t=>[normalizeAddress(t.address,chain),t]));
  for(const w of ws){
    const wa=walletAddressForChain(w,chain);
    for(const a of await historicalErc20Candidates(chain,wa,bi.block)){if(!histMap.has(a)){const k=chain+"|"+a;histMap.set(a,{address:a,symbol:predefinedTokenSymbols[k]||a.slice(0,8)+"…",decimals:predefinedTokenDecimals[k],label:predefinedTokenLabels[k]||"",coingeckoId:predefinedTokenCoinGeckoIds[k]||null});}}
  }
  tokens=[...histMap.values()];
  let verified=0,errors=0,priceMissing=0;
  for(let wi=0;wi<ws.length;wi++){
    const w=ws[wi],address=walletAddressForChain(w,chain);
    taxSetStatus("loading",`${CHAIN_META[chain]?.label||chain}: ${w.label}…`,`Block ${bi.block} · Wallet ${wi+1}/${ws.length}`);
    try{
      const nativeBalance=await taxEvmNativeBalance(chain,address,bi.block);
        const amount=nativeBalance.amount;
      if(amount>0){
        const hp=await taxHistoricalPrice(chain,"native",dateStr,bi.block);
        if(!hp)priceMissing++;
        taxRows.push({wallet:w.label,wallet_address:address,chain,block:bi.block,block_timestamp:targetEpoch,asset:"native",
          symbol:NATIVE_SYMBOL[chain]||chain.toUpperCase(),amount,price_usd:hp?.price??null,value_usd:hp?amount*hp.price:null,
          price_source:hp?.source||null,status:"verifiziert",balance_source:nativeBalance.source});
        verified++;
      }
    }catch(e){errors++;taxRows.push({wallet:w.label,wallet_address:address,chain,block:bi.block,asset:"native",symbol:NATIVE_SYMBOL[chain]||chain.toUpperCase(),status:"nicht verifizierbar",error:e.message,balance_source:"Routescan balancehistory"});}
    for(const token of tokens){
      try{
        const b=await taxEvmTokenBalance(chain,address,token,bi.block);
        if(b.amount>0){
          const hp=await taxHistoricalPrice(chain,token,dateStr,bi.block);
          if(!hp)priceMissing++;
          taxRows.push({wallet:w.label,wallet_address:address,chain,block:bi.block,block_timestamp:targetEpoch,asset:token.address,
            symbol:token.symbol,amount:b.amount,decimals:b.decimals,price_usd:hp?.price??null,value_usd:hp?b.amount*hp.price:null,
            price_source:hp?.source||null,status:"verifiziert",balance_source:b.source});
          verified++;
        }
      }catch(e){
        // Unknown/deployed-later token can be skipped; true Routescan/history errors are surfaced once in coverage.
        if(/rate|limit|histor|unsupported|not available|error/i.test(String(e.message||"")))errors++;
      }
    }
  }
  const detail=`${ws.length} Wallet(s) geprüft · ${verified} positive Position(en) am Stichtag${priceMissing?` · ${priceMissing} ohne historischen Kurs`:""}${errors?` · ${errors} Abfragefehler`:""} · Preise: APTM-Pool bzw. CoinGecko-Tageshistorie, soweit ID vorhanden`;
  taxCoverageSet(chain,errors?"teilweise":"berücksichtigt",detail,"EVM exakt · kostenlose Quelle → Alchemy Archive-Fallback");
}

async function taxBitcoinWallet(chain,w,targetEpoch,dateStr){
  const address=walletAddressForChain(w,chain);
  if(!address)return null;
  let url=`https://blockstream.info/api/address/${encodeURIComponent(address)}/txs`;
  let balanceSat=0,lastSeen=null,pages=0;
  while(url && pages<2000){
    pages++;
    const res=await fetch(url);
    if(!res.ok)throw new Error(`Blockstream HTTP ${res.status}`);
    const txs=await res.json();
    if(!Array.isArray(txs)||!txs.length)break;
    for(const tx of txs){
      const ts=Number(tx?.status?.block_time||0);
      if(!tx?.status?.confirmed || !ts || ts>targetEpoch)continue;
      for(const v of tx.vout||[])if(v?.scriptpubkey_address===address)balanceSat+=Number(v.value||0);
      for(const vin of tx.vin||[])if(vin?.prevout?.scriptpubkey_address===address)balanceSat-=Number(vin.prevout.value||0);
    }
    lastSeen=txs[txs.length-1]?.txid;
    if(txs.length<25||!lastSeen)break;
    url=`https://blockstream.info/api/address/${encodeURIComponent(address)}/txs/chain/${lastSeen}`;
  }
  const amount=balanceSat/1e8;
  const hp=amount>0?await taxHistoricalPrice(chain,"native",dateStr):null;
  return {amount,hp,pages,source:`Blockstream komplette bestätigte Tx-Historie bis Stichtag (${pages} Seite(n))`};
}

async function taxBitcoinChain(chain,selectedWallets,targetEpoch,dateStr){
  const ws=taxChainWallets(selectedWallets,chain);
  if(!ws.length)return;
  let verified=0,errors=0,priceMissing=0;
  for(let i=0;i<ws.length;i++){
    const w=ws[i],address=walletAddressForChain(w,chain);
    taxSetStatus("loading",`${CHAIN_META[chain]?.label||"Bitcoin"}: ${w.label} wird rekonstruiert…`,`Wallet ${i+1}/${ws.length} · vollständige bestätigte Transaktionshistorie`);
    try{
      const r=await taxBitcoinWallet(chain,w,targetEpoch,dateStr);
      if(r?.amount>0){
        if(!r.hp)priceMissing++;
        taxRows.push({wallet:w.label,wallet_address:address,chain,asset:"native",symbol:NATIVE_SYMBOL[chain]||"BTC",
          amount:r.amount,price_usd:r.hp?.price??null,value_usd:r.hp?r.amount*r.hp.price:null,price_source:r.hp?.source||null,
          status:"verifiziert",balance_source:r.source});
        verified++;
      }
    }catch(e){errors++;taxRows.push({wallet:w.label,wallet_address:address,chain,asset:"native",symbol:NATIVE_SYMBOL[chain]||"BTC",status:"nicht verifizierbar",error:e.message,balance_source:"Blockstream Tx-Rekonstruktion"});}
  }
  taxCoverageSet(chain,errors?"teilweise":"berücksichtigt",`${ws.length} Wallet(s) geprüft · ${verified} positive BTC-Bestände${priceMissing?` · ${priceMissing} ohne Kurs`:""}${errors?` · ${errors} Fehler`:""}`,"BTC exakt · bestätigte Blockstream-Transaktionshistorie");
}

const XRP_EPOCH_OFFSET=946684800;
async function xrplCall(method,params){
  const res=await fetch("https://s2.ripple.com/",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({method,params:[params]})});
  if(!res.ok)throw new Error(`XRPL HTTP ${res.status}`);
  const j=await res.json();
  const r=j?.result;
  if(!r)throw new Error("XRPL: leere Antwort");
  if(r.status==="error")throw new Error(r.error_message||r.error||"XRPL-Fehler");
  return r;
}
async function xrplLedgerByTime(targetEpoch){
  const cur=await xrplCall("ledger",{ledger_index:"validated",transactions:false,expand:false});
  let hi=Number(cur.ledger_index||cur.ledger?.ledger_index),lo=32570,best=lo;
  if(!Number.isFinite(hi))throw new Error("XRPL letzter Ledger nicht lesbar");
  while(lo<=hi){
    const mid=Math.floor((lo+hi)/2);
    const r=await xrplCall("ledger",{ledger_index:mid,transactions:false,expand:false});
    const close=Number(r.ledger?.close_time??r.close_time)+XRP_EPOCH_OFFSET;
    if(!Number.isFinite(close))throw new Error("XRPL Ledger-Zeit nicht lesbar");
    if(close<=targetEpoch){best=mid;lo=mid+1;} else hi=mid-1;
  }
  return best;
}
async function taxXrpChain(chain,selectedWallets,targetEpoch,dateStr){
  const ws=taxChainWallets(selectedWallets,chain);
  if(!ws.length)return;
  taxSetStatus("loading",`${CHAIN_META[chain]?.label||"XRP"}: Stichtags-Ledger wird bestimmt…`,"Ripple Full-History Server s2.ripple.com");
  let ledger;
  try{ledger=await xrplLedgerByTime(targetEpoch);}catch(e){taxCoverageSet(chain,"fehlgeschlagen",e.message,"XRP nativ");return;}
  let verified=0,errors=0,priceMissing=0;
  for(const w of ws){
    const address=walletAddressForChain(w,chain);
    try{
      const r=await xrplCall("account_info",{account:address,ledger_index:ledger,strict:true});
      const amount=Number(r.account_data?.Balance||0)/1e6;
      if(amount>0){
        const hp=await taxHistoricalPrice(chain,"native",dateStr);
        if(!hp)priceMissing++;
        taxRows.push({wallet:w.label,wallet_address:address,chain,asset:"native",symbol:NATIVE_SYMBOL[chain]||"XRP",amount,
          block:ledger,price_usd:hp?.price??null,value_usd:hp?amount*hp.price:null,price_source:hp?.source||null,status:"verifiziert",
          balance_source:`XRPL account_info @ Ledger ${ledger}`});
        verified++;
      }
    }catch(e){
      if(/actNotFound|Account not found/i.test(e.message||""))continue;
      errors++;taxRows.push({wallet:w.label,wallet_address:address,chain,asset:"native",symbol:NATIVE_SYMBOL[chain]||"XRP",block:ledger,status:"nicht verifizierbar",error:e.message,balance_source:`XRPL account_info @ Ledger ${ledger}`});
    }
  }
  taxCoverageSet(chain,errors?"teilweise":"berücksichtigt",`${ws.length} Wallet(s) geprüft · ${verified} positive XRP-Bestände${priceMissing?` · ${priceMissing} ohne Kurs`:""}${errors?` · ${errors} Fehler`:""}`,"XRP nativ exakt · Full-History Ledger");
}

async function solRpcTax(chain,method,params){
  return solanaRpc(chain,method,params);
}
async function taxSolTargetSlot(chain,address,targetEpoch){
  const cur=await solRpcTax(chain,"getSlot",[{commitment:"finalized"}]);let lo=0,hi=Number(cur),best=0,guard=0;
  while(lo<=hi&&guard++<64){const mid=Math.floor((lo+hi)/2);let bt=null;try{bt=await solRpcTax(chain,"getBlockTime",[mid]);}catch{}
    if(bt==null){lo=mid+1;continue;}
    if(Number(bt)<=targetEpoch){best=mid;lo=mid+1;}else hi=mid-1;
  }
  if(!best)throw new Error("Solana Stichtags-Slot konnte nicht bestimmt werden.");
  return {slot:best,accountDidNotExist:false};
}
async function taxSolNativeWallet(chain,w,targetEpoch,dateStr){
  const address=walletAddressForChain(w,chain);if(!address)return null;const t=await taxSolTargetSlot(chain,address,targetEpoch);if(t.accountDidNotExist)return {chain,address,amount:0,slot:null,source:"Alchemy Solana History · vor Stichtag keine Wallet-Aktivität"};
  const r=await solRpcTax(chain,"getBalance",[address,{commitment:"finalized",slot:t.slot}]),amount=Number(r?.value||0)/1e9,hp=amount>0?await taxHistoricalPrice(chain,"native",dateStr):null;return {chain,address,amount,hp,slot:t.slot,source:`Alchemy Solana Account Archive · getBalance @ Slot ${t.slot}`};
}
async function taxSolanaChains(selectedWallets,targetEpoch,dateStr){
  const chains=Object.keys(CHAIN_CONFIG).filter(c=>CHAIN_CONFIG[c]?.walletType==="sol");
  for(const chain of chains){const ws=taxChainWallets(selectedWallets,chain);if(!ws.length)continue;let verified=0,errors=0,priceMissing=0;
    for(const w of ws){const address=walletAddressForChain(w,chain);try{taxSetStatus("loading",`Solana: ${w.label} · historischer Slot und Bestände…`);const r=await taxSolNativeWallet(chain,w,targetEpoch,dateStr);
      if(r?.amount>0){if(!r.hp)priceMissing++;taxRows.push({wallet:w.label,wallet_address:r.address,chain,asset:"native",symbol:NATIVE_SYMBOL[chain]||"SOL",amount:r.amount,block:r.slot,price_usd:r.hp?.price??null,value_usd:r.hp?r.amount*r.hp.price:null,price_source:r.hp?.source||null,status:"verifiziert",balance_source:r.source});verified++;}
      if(r?.slot!=null){let pageKey=null;do{const cfg={slot:r.slot,pageLimit:1000};if(pageKey)cfg.pageKey=pageKey;const tr=await solRpcTax(chain,"getTokenAccountsByOwnerAtSlot",[address,{},cfg]),vals=tr?.value||tr?.accounts||[];
        for(const x of vals){const info=x?.account?.data?.parsed?.info||x?.data?.parsed?.info||{},mint=info.mint||x?.mint,ta=info.tokenAmount||x?.tokenAmount||{},amount=Number(ta.uiAmountString??ta.uiAmount??0);if(!mint||!(amount>0))continue;const k=chain+"|"+normalizeAddress(mint,chain),tok={address:mint,symbol:predefinedTokenSymbols[k]||x?.symbol||String(mint).slice(0,6)+"…",decimals:Number(ta.decimals??predefinedTokenDecimals[k]??0),coingeckoId:predefinedTokenCoinGeckoIds[k]||null},hp=await taxHistoricalPrice(chain,tok,dateStr,r.slot);if(!hp)priceMissing++;taxRows.push({wallet:w.label,wallet_address:address,chain,asset:mint,symbol:tok.symbol,amount,decimals:tok.decimals,block:r.slot,price_usd:hp?.price??null,value_usd:hp?amount*hp.price:null,price_source:hp?.source||null,status:"verifiziert",balance_source:`Alchemy getTokenAccountsByOwnerAtSlot @ Slot ${r.slot}`});verified++;}pageKey=tr?.pageKey||null;}while(pageKey);}
    }catch(e){errors++;taxRows.push({wallet:w.label,wallet_address:address,chain,asset:"native",symbol:NATIVE_SYMBOL[chain]||"SOL",status:"nicht verifizierbar",error:e.message,balance_source:"Alchemy Solana Account Archive"});}}
    taxCoverageSet(chain,errors?"teilweise":"berücksichtigt",`${ws.length} Wallet(s) geprüft · ${verified} positive SOL/SPL-Position(en)${priceMissing?` · ${priceMissing} ohne Kurs`:""}${errors?` · ${errors} Fehler`:""}`,"SOL + SPL/Token-2022 · Alchemy historischer Slot");
  }
}


function renderTaxCoverage(){
  const rows=[...taxCoverage].sort((a,b)=>(CHAIN_CONFIG[a.chain]?.sortOrder||999)-(CHAIN_CONFIG[b.chain]?.sortOrder||999));
  if(!rows.length)return "";
  const cls=s=>s==="berücksichtigt"?"safe":s==="teilweise"?"":"unsafe";
  return `<div class="custom-token-card" style="margin-top:12px"><div class="chain-title">Berücksichtigte Chains / Abdeckung</div>
    <div class="chain-table-wrap"><table class="chain-admin-table"><thead><tr><th>Chain</th><th>Status</th><th>Abdeckung</th><th>Details</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td><strong>${escapeAttr(CHAIN_META[r.chain]?.label||r.chain)}</strong></td><td><span class="badge ${cls(r.status)}">${escapeAttr(r.status)}</span></td><td>${escapeAttr(r.scope||"–")}</td><td>${escapeAttr(r.detail||"–")}</td></tr>`).join("")}
    </tbody></table></div></div>`;
}

async function runTaxSnapshot(){
  const btn=document.getElementById("taxRunBtn");
  const date=document.getElementById("taxDate")?.value;
  const tz=document.getElementById("taxTimezone")?.value||"Europe/Zurich";
  const walletSel=document.getElementById("taxWalletSelect")?.value||"__all";
  if(!date)return alert("Bitte Stichtag wählen.");
  const targetEpoch=zonedEndOfDayEpoch(date,tz);
  const selectedWallets=walletSel==="__all"?wallets:wallets.filter(w=>String(w.id)===String(walletSel));
  taxRows=[];taxCoverage=[];taxPriceCache.clear();
  btn.disabled=true;btn.textContent="Stichtagsbestand wird ermittelt…";
  document.getElementById("taxExcelBtn").disabled=true;
  document.getElementById("taxPdfBtn").disabled=true;
  try{
    const configured=Object.keys(CHAIN_CONFIG);
    // Declare every chain that is relevant to the selected wallet(s).
    for(const chain of configured){
      if(!taxChainWallets(selectedWallets,chain).length)continue;
      const type=CHAIN_CONFIG[chain]?.walletType;
      if(!["evm","btc","xrp","sol"].includes(type)){
        taxCoverageSet(chain,"nicht unterstützt","Für diese Chain ist noch keine exakte historische Stichtagslogik implementiert.",type||"–");
      }
    }
    for(const chain of configured.filter(c=>CHAIN_CONFIG[c]?.walletType==="evm" && taxChainWallets(selectedWallets,c).length)){
      await taxEvmChain(chain,selectedWallets,targetEpoch,date);
    }
    for(const chain of configured.filter(c=>CHAIN_CONFIG[c]?.walletType==="btc" && taxChainWallets(selectedWallets,c).length)){
      await taxBitcoinChain(chain,selectedWallets,targetEpoch,date);
    }
    for(const chain of configured.filter(c=>CHAIN_CONFIG[c]?.walletType==="xrp" && taxChainWallets(selectedWallets,c).length)){
      await taxXrpChain(chain,selectedWallets,targetEpoch,date);
    }
    await taxSolanaChains(selectedWallets,targetEpoch,date);

    renderTaxResults(date,tz);
    await saveTaxSnapshot(date,tz,walletSel);
    document.getElementById("taxExcelBtn").disabled=taxRows.length===0;
    document.getElementById("taxPdfBtn").disabled=taxRows.length===0;
    const ok=taxRows.filter(r=>r.status==="verifiziert").length,bad=taxRows.filter(r=>r.status!=="verifiziert").length;
    const covered=taxCoverage.filter(r=>r.status==="berücksichtigt").length,partial=taxCoverage.filter(r=>r.status==="teilweise").length;
    const omitted=taxCoverage.length-covered-partial;
    taxSetStatus("ready",`Bereit – ${ok} verifizierte Position(en)${bad?`, ${bad} nicht verifizierbar`:""}.`,
      `${covered}/${taxCoverage.length} relevante Chain(s) vollständig berücksichtigt · ${partial} teilweise · ${omitted} nicht berücksichtigt. Keine Bestände wurden geschätzt.`);
  }catch(e){
    console.error("Bestandesaufnahme per 31.12:",e);taxSetStatus("error",e.message||String(e));
  }finally{btn.disabled=false;btn.textContent="Exakten Stichtagsbestand ermitteln";}
}

function renderTaxResults(date="",tz=""){
  const summary=document.getElementById("taxSummary"),out=document.getElementById("taxResults");
  if(!summary||!out)return;
  const ok=taxRows.filter(r=>r.status==="verifiziert"),bad=taxRows.filter(r=>r.status!=="verifiziert");
  const priced=ok.filter(r=>r.price_usd!=null),unpriced=ok.filter(r=>r.price_usd==null);
  const usdTotal=priced.reduce((a,r)=>a+Number(r.value_usd||0),0);
  const covered=taxCoverage.filter(r=>r.status==="berücksichtigt").map(r=>CHAIN_META[r.chain]?.label||r.chain);
  const partial=taxCoverage.filter(r=>r.status==="teilweise").map(r=>CHAIN_META[r.chain]?.label||r.chain);
  const failed=taxCoverage.filter(r=>!["berücksichtigt","teilweise"].includes(r.status)).map(r=>CHAIN_META[r.chain]?.label||r.chain);
  summary.innerHTML=`<div class="project-summary">
    <div class="custom-token-card project-summary-box"><span class="field-label">Verifizierte Positionen</span><strong>${ok.length}</strong></div>
    <div class="custom-token-card project-summary-box"><span class="field-label">Historischer Kurs vorhanden</span><strong>${priced.length}</strong><div class="meta">${unpriced.length} ohne Kurs</div></div>
    <div class="custom-token-card project-summary-box"><span class="field-label">USD-Wert soweit verifiziert</span><strong>${usdTotal?fmtUsd(usdTotal):"–"}</strong></div>
    <div class="custom-token-card project-summary-box"><span class="field-label">Chains berücksichtigt</span><strong>${covered.length}</strong><div class="meta">${escapeAttr(covered.join(", ")||"–")}</div></div>
    <div class="custom-token-card project-summary-box"><span class="field-label">Chains teilweise</span><strong>${partial.length}</strong><div class="meta">${escapeAttr(partial.join(", ")||"–")}</div></div>
    <div class="custom-token-card project-summary-box"><span class="field-label">Chains nicht berücksichtigt</span><strong>${failed.length}</strong><div class="meta">${escapeAttr(failed.join(", ")||"–")}</div></div>
    <div class="custom-token-card project-summary-box"><span class="field-label">Positionen nicht verifizierbar</span><strong>${bad.length}</strong></div>
  </div>${renderTaxCoverage()}`;
  if(!taxRows.length){out.innerHTML='<div class="empty">Keine Positionen gefunden oder keine Chain konnte verifiziert werden.</div>';return;}
  out.innerHTML=`<details><summary style="cursor:pointer;font-weight:700;padding:10px 0">Stichtagspositionen anzeigen (${taxRows.length})</summary>
    <div class="chain-table-wrap"><table class="chain-admin-table"><thead><tr><th>Wallet</th><th>Chain</th><th>Asset</th><th>Bestand</th><th>Preis USD</th><th>Wert USD</th><th>Block/Ledger</th><th>Status / Quelle</th></tr></thead><tbody>
    ${taxRows.map(r=>`<tr><td>${escapeAttr(r.wallet)}<div class="meta">${escapeAttr(r.wallet_address||"")}</div></td><td>${escapeAttr(CHAIN_META[r.chain]?.label||r.chain)}</td><td><strong>${escapeAttr(r.symbol||"–")}</strong><div class="meta">${r.asset&&r.asset!=="native"?escapeAttr(r.asset):"nativ"}</div></td><td>${r.amount==null?"–":fmt(r.amount)}</td><td>${r.price_usd==null?"–":fmtUsd(r.price_usd)}</td><td>${r.value_usd==null?"–":fmtUsd(r.value_usd)}</td><td>${r.block||"–"}</td><td>${r.status==="verifiziert"?'<span class="badge safe">verifiziert</span>':'<span class="badge unsafe">nicht verifizierbar</span>'}<div class="meta">${escapeAttr(r.error||r.balance_source||"")}${r.price_source?` · Preis: ${escapeAttr(r.price_source)}`:""}</div></td></tr>`).join("")}
    </tbody></table></div></details>`;
}

function taxXmlCell(v){
  const num=typeof v==="number"&&Number.isFinite(v);
  const esc=String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  return `<Cell><Data ss:Type="${num?"Number":"String"}">${esc}</Data></Cell>`;
}

function exportTaxExcel(){
  const date=document.getElementById("taxDate")?.value||"";
  const tz=document.getElementById("taxTimezone")?.value||"";
  let body=`<Row>${taxXmlCell("Wallet Tracking – Bestandesaufnahme per 31.12")}</Row><Row>${taxXmlCell("Stichtag")}${taxXmlCell(date)}</Row><Row>${taxXmlCell("Zeitzone")}${taxXmlCell(tz)}</Row><Row>${taxXmlCell("Qualitätsregel")}${taxXmlCell("Keine Bestände geschätzt; Coverage je Chain separat ausgewiesen.")}</Row><Row></Row>`;
  body+=`<Row>${["CHAIN COVERAGE","STATUS","ABDECKUNG","DETAIL"].map(taxXmlCell).join("")}</Row>`;
  for(const c of taxCoverage)body+=`<Row>${[CHAIN_META[c.chain]?.label||c.chain,c.status,c.scope,c.detail].map(taxXmlCell).join("")}</Row>`;
  body+=`<Row></Row>`;
  const heads=["Wallet","Wallet-Adresse","Chain","Symbol","Asset/Contract","Bestand","Preis USD","Wert USD","Block/Ledger","Bestandsquelle","Preisquelle","Status","Fehler"];
  body+=`<Row>${heads.map(taxXmlCell).join("")}</Row>`;
  for(const r of taxRows)body+=`<Row>${[r.wallet,r.wallet_address,r.chain,r.symbol,r.asset,r.amount??"",r.price_usd??"",r.value_usd??"",r.block??"",r.balance_source||"",r.price_source||"",r.status,r.error||""].map(taxXmlCell).join("")}</Row>`;
  const xml=`<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Stichtag"><Table>${body}</Table></Worksheet></Workbook>`;
  const blob=new Blob([xml],{type:"application/vnd.ms-excel"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`bestandesaufnahme-31-12-${date}.xls`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function exportTaxPdf(){
  const date=document.getElementById("taxDate")?.value||"",tz=document.getElementById("taxTimezone")?.value||"",w=window.open("","_blank");if(!w)return alert("Popup wurde blockiert.");
  const ok=taxRows.filter(r=>r.status==="verifiziert"),priced=ok.filter(r=>r.price_usd!=null&&r.value_usd!=null),unpriced=ok.filter(r=>r.price_usd==null||r.value_usd==null),total=priced.reduce((s,r)=>s+Number(r.value_usd||0),0),quality=unpriced.length?`Bewertet: ${priced.length}/${ok.length} · ${unpriced.length} ohne Kurs`:`Vollständig bewertet: ${priced.length}/${ok.length}`;
  const cov=taxCoverage.map(c=>`<tr><td><b>${escapeAttr(CHAIN_META[c.chain]?.label||c.chain)}</b></td><td>${escapeAttr(c.status)}</td><td>${escapeAttr(c.scope||"")}</td><td>${escapeAttr(c.detail||"")}</td></tr>`).join("");
  const walletNames=[...new Set(taxRows.map(r=>r.wallet))].sort((a,b)=>a.localeCompare(b,"de"));
  const grouped=new Map();for(const r of ok){const k=r.chain+"|"+(r.asset||r.symbol),x=grouped.get(k)||{chain:r.chain,symbol:r.symbol,asset:r.asset,amount:0,value:0,priced:true,price:r.price_usd};x.amount+=Number(r.amount||0);if(r.value_usd==null)x.priced=false;else x.value+=Number(r.value_usd||0);if(x.price==null&&r.price_usd!=null)x.price=r.price_usd;grouped.set(k,x);}
  const chainKeys=[...new Set([...grouped.values()].map(x=>x.chain))].sort((a,b)=>(CHAIN_CONFIG[a]?.sortOrder||999)-(CHAIN_CONFIG[b]?.sortOrder||999));
  const chainSummary=chainKeys.map(chain=>{const ar=[...grouped.values()].filter(x=>x.chain===chain),sum=ar.filter(x=>x.priced).reduce((q,x)=>q+x.value,0),rows=ar.map(x=>`<tr><td><b>${escapeAttr(x.symbol||"–")}</b><small>${x.asset&&x.asset!=="native"?escapeAttr(x.asset):"nativ"}</small></td><td class="n">${fmt(x.amount)}</td><td class="n">${x.price==null?"–":fmtUsd(x.price)}</td><td class="n">${x.priced?fmtUsd(x.value):"–"}</td></tr>`).join("");return `<h2>${escapeAttr(CHAIN_META[chain]?.label||chain)}</h2><table><thead><tr><th>Token</th><th>Gesamtbestand</th><th>Kurs USD</th><th>Wert USD</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="3">SUBTOTAL ${escapeAttr(CHAIN_META[chain]?.label||chain)}</td><td class="n">${fmtUsd(sum)}</td></tr></tfoot></table>`}).join("");
  const walletSections=walletNames.map(name=>{const wr=taxRows.filter(r=>r.wallet===name),wp=wr.filter(r=>r.value_usd!=null),sum=wp.reduce((s,r)=>s+Number(r.value_usd||0),0),addr=[...new Set(wr.map(r=>r.wallet_address).filter(Boolean))].join(" · ");const rows=wr.map(r=>`<tr><td>${escapeAttr(CHAIN_META[r.chain]?.label||r.chain)}</td><td><b>${escapeAttr(r.symbol||"")}</b><small>${escapeAttr(r.asset||"")}</small></td><td class="n">${r.amount==null?"–":fmt(r.amount)}</td><td class="n">${r.price_usd==null?"–":fmtUsd(r.price_usd)}</td><td class="n">${r.value_usd==null?"–":fmtUsd(r.value_usd)}</td><td>${r.block||"–"}</td><td>${escapeAttr(r.status)}<small>${escapeAttr(r.error||r.balance_source||"")}${r.price_source?`<br>Preis: ${escapeAttr(r.price_source)}`:""}</small></td></tr>`).join("");return `<section class="wallet-page"><h1>${escapeAttr(name)}</h1><div class="address">${escapeAttr(addr)}</div><div class="wallet-summary">Wallet-Wert bewerteter Positionen: <b>${fmtUsd(sum)}</b> · ${wp.length}/${wr.filter(r=>r.status==="verifiziert").length} Positionen bewertet</div><table><thead><tr><th>Chain</th><th>Asset</th><th>Bestand</th><th>Preis USD</th><th>Wert USD</th><th>Block / Slot / Ledger</th><th>Status / Quellen</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="4">SUMME WALLET</td><td class="n">${fmtUsd(sum)}</td><td colspan="2"></td></tr></tfoot></table></section>`;}).join("");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Bestandesaufnahme ${date}</title><style>@page{size:A4 landscape;margin:15mm}body{font:9px Arial;color:#18202a;margin:0}h1{font-size:22px;margin:0 0 5px}h2{margin:14px 0 5px}.summary-page,.chain-summary-page{page-break-after:always}.wallet-page{break-before:page;page-break-before:always}.head{border-bottom:3px solid;padding-bottom:9px}.cards{display:flex;gap:8px;margin:12px 0}.card{border:1px solid #ccd2d9;border-radius:6px;padding:8px;min-width:150px}.card b{display:block;font-size:14px}table{border-collapse:collapse;width:100%;margin:8px 0}thead{display:table-header-group}tr{page-break-inside:avoid}th,td{border:1px solid #c8ced5;padding:4px;vertical-align:top}th,tfoot td{background:#eef1f4;font-weight:bold}.n{text-align:right;white-space:nowrap}small,.address{display:block;color:#666;font-size:7px;word-break:break-all}.wallet-summary{margin:10px 0;padding:8px;border:1px solid #ccd2d9;border-radius:6px}tfoot td{border-top:2px solid #18202a;font-size:10px}</style></head><body><section class="summary-page"><div class="head"><h1>Bestandesaufnahme per 31.12</h1><p><b>Stichtag:</b> ${escapeAttr(date)} · ${escapeAttr(tz)} &nbsp; <b>Erstellt:</b> ${new Date().toLocaleString("de-CH")}</p></div><div class="cards"><div class="card">Wallets<b>${walletNames.length}</b></div><div class="card">Verifizierte Positionen<b>${ok.length}</b></div><div class="card">Historisch bewertet<b>${priced.length}/${ok.length}</b></div><div class="card">Gesamtwert<b>${fmtUsd(total)}</b></div></div><h2>Chain-Abdeckung dieses Laufs</h2><table><thead><tr><th>Chain</th><th>Status</th><th>Abdeckung</th><th>Details</th></tr></thead><tbody>${cov}</tbody></table><p>${escapeAttr(quality)}. Bestände werden nicht geschätzt; Positionen ohne Kurs sind nicht in USD-Summen enthalten.</p></section><section class="chain-summary-page"><h1>Summary nach Chain</h1><p>Tokenbestände sind über alle ausgewählten Wallets je Chain zusammengefasst.</p>${chainSummary}<table><tfoot><tr><td>GESAMTSUMME – bewertete Positionen</td><td class="n">${fmtUsd(total)}</td></tr></tfoot></table></section>${walletSections}<script>window.onload=()=>window.print();<\/script></body></html>`);w.document.close();
}


function showTab(name) {
  // TLN/VOW ist nur erreichbar, wenn ein passender Projekt-Token im Summary-Bestand liegt.
  if (name === "tlnvow" && !hasTlnVowTokenInSummary()) name = "tracking";

  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  const panel = document.getElementById("tab-" + name);
  if (panel) panel.classList.add("active");
  if (name === "predefined") { ensurePredefinedNames(); loadApertumCurrentPrices().then(()=>renderSafeTokenTable()).catch(e=>console.warn("Apertum On-Chain-Kurse",e)); }
  if (name === "admin" && !document.querySelector(".admin-tab-panel.active")) showAdminTab("customtokens");
  if (name === "chat") {
    const userView = document.getElementById("userChatView");
    const adminView = document.getElementById("adminChatView");
    if (userView) userView.style.display = isAdmin ? "none" : "block";
    if (adminView) adminView.style.display = isAdmin ? "block" : "none";
    if (isAdmin) renderAdminChatUserSelect(); else loadOwnChat();
  }
  if (name === "tax") renderTaxWalletSelect();
  if (name === "help") renderHelpChainCoverage();
  if (name === "nfts") onNftWalletChange();
  if (name === "fees") { renderFeesSummary(); onFeesWalletChange(); }
  if (name === "discovery") {
    renderDiscoveryCacheState();
    if (lastDiscoveryFindings.length > 0) renderDiscoveryResults(lastDiscoveryFindings);
  }
  if (name === "tlnvow" && window.TLNVOWProject) {
    window.TLNVOWProject.ensureLoaded();
  }
  if (name === "dao1" && window.DAO1Project) {
    window.DAO1Project.ensureLoaded();
  }
}

function showAdminTab(name) {
  document.querySelectorAll(".admin-tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll("[data-admin-tab]").forEach(b => b.classList.toggle("active", b.dataset.adminTab === name));
  document.querySelectorAll("[data-open-admin]").forEach(b => b.classList.toggle("active", b.dataset.openAdmin === name));
  const panel = document.getElementById("admintab-" + name);
  if (panel) panel.classList.add("active");
  if (name === "customtokens") renderAdminCustomTokens();
  if (name === "chains") loadAdminChains();
  if (name === "coverage") renderAdminChainCoverage();
  if (name === "defiprojects") loadAdminDefiProjects();
  if (name === "dex") loadAdminDexConfigs();
  if (name === "hardcoding") renderHardcodingAudit();
  if (name === "ideas") renderAdminIdeas();
}




function coverageCell(enabled, provider, implementedProviders, notApplicable=false) {
  if (notApplicable) return `<span class="badge">— nicht vorgesehen</span>`;
  if (!enabled) return `<span class="badge danger">❌ deaktiviert</span>${provider ? `<div class="note">${escapeAttr(provider)}</div>` : ""}`;
  const ok = !!provider && implementedProviders.includes(provider);
  return `${ok ? '<span class="badge safe">✅ aktiv</span>' : '<span class="badge warn">⚠️ prüfen</span>'}<div class="note">${escapeAttr(provider || "kein Provider")}</div>`;
}

function renderAdminChainCoverage(){
  if(!isAdmin)return;
  const el=document.getElementById("adminChainCoverageList");
  if(!el)return;
  const balanceProviders=["rpc","evm_rpc","blockstream","mempool","xrpscan","solana_rpc","solana_publicnode","trongrid","akash_rest","apertum_explorer","blockscout"];
  const feeProviders=["routescan","nodereal","blockscout","xrpscan","solana_publicnode","apertum_explorer","mempool","tronscan"];
  const discoveryProviders=["alchemy","wallet_data"];
  const approvalProviders=["goplus","blockscout"];
  const nftProviders=["alchemy","blockscout"];
  const rows=Object.keys(CHAIN_CONFIG).sort((a,b)=>(CHAIN_CONFIG[a]?.sortOrder||100)-(CHAIN_CONFIG[b]?.sortOrder||100)).map(chain=>{
    const c=CHAIN_CONFIG[chain]||{}, meta=CHAIN_META[chain]||{};
    const wt=c.walletType||"";
    const approvalsNA=["btc","bitcoin","xrp","solana","tron","akash"].includes(wt);
    const nftNA=["btc","bitcoin","akash"].includes(wt);
    return `<tr>
      <td class="sticky-col-1"><strong>${escapeAttr(chain)}</strong></td>
      <td class="sticky-col-2">${escapeAttr(meta.label||chain)}</td>
      <td>${coverageCell(true,c.balanceProvider,balanceProviders)}</td>
      <td>${coverageCell(c.feesEnabled,c.feeProvider,feeProviders)}</td>
      <td>${coverageCell(c.discoveryEnabled,c.discoveryProvider,discoveryProviders,wt==="btc"||wt==="bitcoin")}</td>
      <td>${coverageCell(c.approvalsEnabled,c.approvalsProvider,approvalProviders,approvalsNA)}</td>
      <td>${coverageCell(c.nftEnabled,c.nftProvider,nftProviders,nftNA)}</td>
    </tr>`;
  }).join("");
  el.innerHTML=`<div class="chain-table-wrap"><table class="chain-admin-table" style="min-width:1150px"><thead><tr>
    <th class="sticky-col-1">Chain-Key</th><th class="sticky-col-2">Anzeigename</th><th>Bestände</th><th>Gebühren</th><th>Entdecken</th><th>Freigaben</th><th>NFTs</th>
  </tr></thead><tbody>${rows}</tbody></table></div>`;
}

function yearEndCoverageLabel(chain,c){const wt=c.walletType||"";if(wt==="evm")return "✓ exakt · historischer Block";if(wt==="btc")return "✓ exakt · UTXO-Stichtag";if(wt==="xrp")return "✓ XRP nativ · Full-History Ledger";if(wt==="sol")return "✓ SOL + SPL/Token-2022 · historischer Slot";if(wt==="tron")return "Noch nicht unterstützt";return "Noch nicht unterstützt";}
function renderHelpChainCoverage(){const el=document.getElementById("helpChainCoverage");if(!el)return;const balanceProviders=["rpc","evm_rpc","blockstream","mempool","xrpscan","solana_rpc","solana_publicnode","trongrid","akash_rest","apertum_explorer","blockscout"],feeProviders=["routescan","nodereal","blockscout","xrpscan","solana_publicnode","apertum_explorer","mempool","tronscan"];const rows=Object.keys(CHAIN_CONFIG).sort((a,b)=>(CHAIN_CONFIG[a]?.sortOrder||100)-(CHAIN_CONFIG[b]?.sortOrder||100)).map(chain=>{const c=CHAIN_CONFIG[chain]||{},m=CHAIN_META[chain]||{};return `<tr><td><strong>${escapeAttr(m.label||chain)}</strong></td><td>${coverageCell(true,c.balanceProvider,balanceProviders)}</td><td>${coverageCell(c.feesEnabled,c.feeProvider,feeProviders)}</td><td>${escapeAttr(yearEndCoverageLabel(chain,c))}</td></tr>`}).join("");el.innerHTML=`<div class="chain-table-wrap"><table class="chain-admin-table"><thead><tr><th>Chain</th><th>Aktueller Bestand</th><th>Gebühren</th><th>Bestand per 31.12.</th></tr></thead><tbody>${rows}</tbody></table></div>`;}
function switchProjectSubtab(project,name,button){document.querySelectorAll(`#tab-${project} .project-subtab-panel`).forEach(x=>x.style.display="none");const p=document.getElementById(`${project}-subtab-${name}`);if(p)p.style.display="block";document.querySelectorAll(`#tab-${project} .project-subtabs .tab-btn`).forEach(x=>x.classList.remove("active"));button?.classList.add("active");}

function adminSimpleInput(value,key,type="text",extra=""){
  if(type==="checkbox") return `<input data-field="${key}" type="checkbox" ${value!==false?"checked":""}>`;
  return `<input data-field="${key}" type="${type}" value="${escapeAttr(value??"")}" ${extra}>`;
}
function adminSelect(value,key,options){
  return `<select data-field="${key}">${options.map(([v,l])=>`<option value="${escapeAttr(v)}" ${String(value??"")===v?"selected":""}>${escapeAttr(l)}</option>`).join("")}</select>`;
}
function readAdminRow(root,fields){
  const out={};
  fields.forEach(([k,type])=>{
    const el=root.querySelector(`[data-field="${k}"]`);
    if(!el)return;
    if(type==="checkbox")out[k]=el.checked;
    else if(type==="number")out[k]=el.value===""?null:Number(el.value);
    else out[k]=el.value.trim()||null;
  });
  return out;
}

async function loadAdminDefiProjects(){
  if(!isAdmin)return;
  await loadDefiProjectsCache();
  const [{data:projects,error:pErr},{data:tokens,error:tErr}]=await Promise.all([
    sb.from("defi_projects").select("*").order("sort_order",{ascending:true}),
    sb.from("defi_project_tokens").select("*").order("project_key").order("chain_key")
  ]);
  const pEl=document.getElementById("adminDefiProjectsList");
  const tEl=document.getElementById("adminDefiProjectTokensList");
  if(pErr){pEl.innerHTML=`<div class="error">${escapeAttr(pErr.message)}</div>`;return;}
  if(tErr){tEl.innerHTML=`<div class="error">${escapeAttr(tErr.message)}</div>`;return;}

  pEl.innerHTML=`<div class="chain-table-wrap"><table class="chain-admin-table" style="min-width:900px"><thead><tr>
    <th>Projekt-Key</th><th>Name</th><th>Beschreibung</th><th>Sortierung</th><th>Aktiv</th><th>Aktion</th>
  </tr></thead><tbody>${(projects||[]).map(p=>`<tr data-defi-project="${escapeAttr(p.project_key)}">
    <td>${adminSimpleInput(p.project_key,"project_key","text","disabled")}</td>
    <td>${adminSimpleInput(p.name,"name")}</td>
    <td>${adminSimpleInput(p.description,"description")}</td>
    <td>${adminSimpleInput(p.sort_order,"sort_order","number")}</td>
    <td>${adminSimpleInput(p.enabled,"enabled","checkbox")}</td>
    <td><button onclick="saveDefiProject('${escapeAttr(p.project_key)}')">💾</button> <button class="remove" onclick="deleteDefiProject('${escapeAttr(p.project_key)}')">Löschen</button></td>
  </tr>`).join("")}</tbody></table></div>`;

  const projectOpts=(projects||[]).map(p=>[p.project_key,p.name]);
  const chainOpts=Object.keys(CHAIN_META).map(c=>[c,CHAIN_META[c].label]);
  tEl.innerHTML=`<div class="chain-table-wrap"><table class="chain-admin-table" style="min-width:1200px"><thead><tr>
    <th>Projekt</th><th>Chain</th><th>Rolle</th><th>Symbol</th><th>Contract</th><th>Aktiv</th><th>Aktion</th>
  </tr></thead><tbody>${(tokens||[]).map(t=>`<tr data-defi-token="${t.id}">
    <td>${adminSelect(t.project_key,"project_key",projectOpts)}</td>
    <td>${adminSelect(t.chain_key,"chain_key",chainOpts)}</td>
    <td>${adminSimpleInput(t.role,"role")}</td>
    <td>${adminSimpleInput(t.symbol,"symbol")}</td>
    <td>${adminSimpleInput(t.contract_address,"contract_address")}</td>
    <td>${adminSimpleInput(t.enabled,"enabled","checkbox")}</td>
    <td><button onclick="saveDefiProjectToken('${t.id}')">💾</button> <button class="remove" onclick="deleteDefiProjectToken('${t.id}')">Löschen</button></td>
  </tr>`).join("")}</tbody></table></div>`;
}
function addDefiProjectRow(){
  const key=prompt("Projekt-Key (z.B. projekt_xyz):");
  if(!key)return;
  const name=prompt("Anzeigename:",key)||key;
  sb.from("defi_projects").insert({project_key:key.trim().toLowerCase(),name,enabled:true,sort_order:100}).then(({error})=>{
    if(error)alert(error.message);else loadAdminDefiProjects();
  });
}
async function saveDefiProject(key){
  const root=document.querySelector(`[data-defi-project="${CSS.escape(key)}"]`);
  const row=readAdminRow(root,[["name","text"],["description","text"],["sort_order","number"],["enabled","checkbox"]]);
  const {error}=await sb.from("defi_projects").update(row).eq("project_key",key);
  if(error)alert(error.message);else{await loadDefiProjectsCache();await loadAdminDefiProjects();renderSafeTokenTable();}
}
async function deleteDefiProject(key){
  if(!confirm(`Projekt "${key}" inkl. Projekt-Referenzen wirklich löschen?`))return;
  const {error}=await sb.from("defi_projects").delete().eq("project_key",key);
  if(error)alert(error.message);else loadAdminDefiProjects();
}
async function addDefiProjectTokenRow(){
  await loadDefiProjectsCache();
  if(!defiProjectsCache.length){alert("Bitte zuerst ein DeFi-Projekt anlegen.");return;}
  const project_key=defiProjectsCache[0].project_key;
  const chain_key=Object.keys(CHAIN_META)[0];
  const {error}=await sb.from("defi_project_tokens").insert({project_key,chain_key,role:"reference",symbol:"",contract_address:"",enabled:true});
  if(error)alert(error.message);else loadAdminDefiProjects();
}
async function saveDefiProjectToken(id){
  const root=document.querySelector(`[data-defi-token="${CSS.escape(String(id))}"]`);
  const row=readAdminRow(root,[["project_key","text"],["chain_key","text"],["role","text"],["symbol","text"],["contract_address","text"],["enabled","checkbox"]]);
  const {error}=await sb.from("defi_project_tokens").update(row).eq("id",id);
  if(error)alert(error.message);else loadAdminDefiProjects();
}
async function deleteDefiProjectToken(id){
  if(!confirm("Projekt-Token/Referenz löschen?"))return;
  const {error}=await sb.from("defi_project_tokens").delete().eq("id",id);
  if(error)alert(error.message);else loadAdminDefiProjects();
}

async function loadAdminDexConfigs(){
  if(!isAdmin)return;
  const {data,error}=await sb.from("dex_configs").select("*").order("chain_key").order("dex_key");
  const el=document.getElementById("adminDexConfigsList");
  if(error){el.innerHTML=`<div class="error">${escapeAttr(error.message)}</div>`;return;}
  const chainOpts=Object.keys(CHAIN_META).map(c=>[c,CHAIN_META[c].label]);
  el.innerHTML=`<div class="chain-table-wrap"><table class="chain-admin-table" style="min-width:1500px"><thead><tr>
    <th>Chain</th><th>DEX-Key</th><th>Name</th><th>Protokoll</th><th>Version</th><th>Factory</th><th>Router optional</th><th>Aktiv</th><th>Aktion</th>
  </tr></thead><tbody>${(data||[]).map(d=>`<tr data-dex="${d.id}">
    <td>${adminSelect(d.chain_key,"chain_key",chainOpts)}</td>
    <td>${adminSimpleInput(d.dex_key,"dex_key")}</td>
    <td>${adminSimpleInput(d.name,"name")}</td>
    <td>${adminSimpleInput(d.protocol,"protocol")}</td>
    <td>${adminSelect(d.version,"version",[["v2","V2"],["v3","V3"]])}</td>
    <td>${adminSimpleInput(d.factory_address,"factory_address")}</td>
    <td>${adminSimpleInput(d.router_address,"router_address")}</td>
    <td>${adminSimpleInput(d.enabled,"enabled","checkbox")}</td>
    <td><button onclick="saveDexConfig('${d.id}')">💾</button> <button class="remove" onclick="deleteDexConfig('${d.id}')">Löschen</button></td>
  </tr>`).join("")}</tbody></table></div>`;
}
async function addDexConfigRow(){
  const chain_key=Object.keys(CHAIN_META)[0];
  const {error}=await sb.from("dex_configs").insert({chain_key,dex_key:"new_dex",name:"Neue DEX",protocol:"",version:"v2",factory_address:"",enabled:true});
  if(error)alert(error.message);else loadAdminDexConfigs();
}
async function saveDexConfig(id){
  const root=document.querySelector(`[data-dex="${CSS.escape(String(id))}"]`);
  const row=readAdminRow(root,[["chain_key","text"],["dex_key","text"],["name","text"],["protocol","text"],["version","text"],["factory_address","text"],["router_address","text"],["enabled","checkbox"]]);
  const {error}=await sb.from("dex_configs").update(row).eq("id",id);
  if(error)alert(error.message);else loadAdminDexConfigs();
}
async function deleteDexConfig(id){
  if(!confirm("DEX-Konfiguration löschen?"))return;
  const {error}=await sb.from("dex_configs").delete().eq("id",id);
  if(error)alert(error.message);else loadAdminDexConfigs();
}


const HARDCODING_AUDIT_ITEMS = [
  {severity:"open", area:"Routescan", item:"fee_api_base Fallback", detail:"Routescan darf keine Chain-URL mehr selbst konstruieren. Fehlende fee_api_base soll als Konfigurationsfehler sichtbar werden."},
  {severity:"open", area:"Tron", item:"TRC20 Decimals", detail:"TRON_TOKEN_DECIMALS_DEFAULT=6 ist chain-/token-spezifischer Fallback. Decimals sollen aus predefined_tokens bzw. Token-Metadaten kommen."},
  {severity:"review", area:"Wallet-Maske", item:"EVM-Chain-Hinweis", detail:"Der sichtbare Hilfetext nennt Ethereum/BSC/Polygon/Arbitrum/Base/Avalanche/Apertum statisch. Darstellung sollte aus wallet_type=evm generiert werden."},
  {severity:"review", area:"Eigene sichere Token", item:"Chain-Auswahl", detail:"Die Auswahl enthält noch feste Chain-Optionen. Sie sollte aus public.chains erzeugt werden."},
  {severity:"review", area:"DeFi-Projekt UI", item:"Projektmodule", detail:"DAO1 und TLN/VOW besitzen jetzt eigene Unter-Tabs inklusive projektspezifischer Hilfe. Daten bleiben generisch in Supabase; die Modulnamen DAO1Project/TLNVOWProject sind bewusst projektspezifische Implementierung und können bei weiteren Projekten in ein gemeinsames Framework überführt werden."},
  {severity:"keep", area:"Liquidity Pools", item:"Generischer DB-Cache", detail:"lp_history_events speichert unveränderliche Add-/Remove-Historie projekt- und chainübergreifend; project_scan_state hält den inkrementellen Wallet-Scanstand. Aktuelle LP-Balance, Reserven und Pool-Anteil bleiben bewusst live."},
  {severity:"keep", area:"Services", item:"Globale API-/App-URLs", detail:"CoinGecko, GeckoTerminal, GoPlus, Supabase-App-URL, CDN, revoke.cash und IPFS sind globale Services und keine Chain-Stammdaten."},
  {severity:"keep", area:"Credentials", item:"Frontend-Keys", detail:"Alchemy/PublicNode/NodeReal nicht in public.chains verschieben. Später separat über Proxy/Secret-Strategie lösen."}
];

function renderHardcodingAudit(){
  const el=document.getElementById("adminHardcodingAudit");
  if(!el || !isAdmin)return;
  const badge=i=>i.severity==="open"
    ? '<span class="badge unsafe">offen</span>'
    : i.severity==="review"
      ? '<span class="badge" style="background:rgba(240,185,11,.15);color:#f0b90b">prüfen</span>'
      : '<span class="badge safe">bewusst belassen</span>';
  el.innerHTML=`<table><thead><tr><th>Status</th><th>Bereich</th><th>Fund</th><th>Bewertung / nächster Schritt</th></tr></thead><tbody>
    ${HARDCODING_AUDIT_ITEMS.map(i=>`<tr><td>${badge(i)}</td><td>${escapeAttr(i.area)}</td><td>${escapeAttr(i.item)}</td><td>${escapeAttr(i.detail)}</td></tr>`).join("")}
  </tbody></table>`;
}

const ADMIN_CHAIN_FIELDS = [
  {k:"chain_key", l:"Chain-Key", critical:true, type:"text", sticky:1},
  {k:"label", l:"Anzeigename", type:"text", sticky:2},
  {k:"native_symbol", l:"Natives Symbol", type:"text", sticky:3},
  {k:"coingecko_id", l:"CoinGecko-ID", type:"text"},
  {k:"wallet_type", l:"Wallet-Typ", critical:true, type:"select", options:["evm","btc","xrp","sol","tron","akash"]},
  {k:"evm_chain_id", l:"EVM Chain-ID", critical:true, type:"number"},
  {k:"explorer_url_template", l:"Explorer-URL ({address})", critical:true, type:"text", cls:"xwide-input"},
  {k:"geckoterminal_network", l:"GeckoTerminal Network", type:"text"},
  {k:"display_color", l:"Anzeigefarbe", critical:false, type:"color"},
  {k:"rpc_url", l:"RPC-/REST-Endpunkt", critical:true, type:"text", cls:"xwide-input"},
  {k:"archive_rpc_provider", l:"Historie-Provider", critical:false, type:"text"},
  {k:"archive_rpc_url", l:"Historie-/Archive-RPC", critical:false, type:"text", cls:"xwide-input"},
  {k:"balance_provider", l:"Balance-Provider", critical:true, type:"text"},
  {k:"balance_api_base", l:"Balance API-Basis", critical:true, type:"text", cls:"xwide-input"},
  {k:"fees_enabled", l:"Gebühren aktiv", critical:true, type:"checkbox"},
  {k:"discovery_enabled", l:"Discovery aktiv", critical:false, type:"checkbox"},
  {k:"approvals_enabled", l:"Freigaben aktiv", critical:false, type:"checkbox"},
  {k:"nft_enabled", l:"NFT aktiv", critical:false, type:"checkbox"},
  {k:"discovery_provider", l:"Discovery-Provider", critical:true, type:"text"},
  {k:"discovery_api_base", l:"Discovery API-Basis", critical:true, type:"text", cls:"xwide-input"},
  {k:"approvals_provider", l:"Freigaben-Provider", critical:true, type:"text"},
  {k:"approvals_api_base", l:"Freigaben API-Basis", critical:true, type:"text", cls:"xwide-input"},
  {k:"nft_provider", l:"NFT-Provider", critical:true, type:"text"},
  {k:"nft_api_base", l:"NFT API-Basis", critical:true, type:"text", cls:"xwide-input"},
  {k:"fee_provider", l:"Gebühren-Provider", critical:true, type:"text"},
  {k:"fee_api_base", l:"Gebühren API-Basis", critical:true, type:"text", cls:"xwide-input"},
  {k:"fee_finality_blocks", l:"Fee Finality", critical:true, type:"number"},
  {k:"fee_overlap_blocks", l:"Fee Overlap", critical:true, type:"number"},
  {k:"sort_order", l:"Sortierung", type:"number"},
  {k:"enabled", l:"Aktiv", critical:true, type:"checkbox"}
];

function chainStickyClass(field) {
  return field.sticky ? ` sticky-col-${field.sticky}` : "";
}

function chainCellControl(field, row, isNew=false) {
  const val = row?.[field.k];
  const disabled = (!isNew && field.k === "chain_key") ? "disabled" : "";
  if (field.type === "checkbox") {
    return `<input data-chain-field="${field.k}" type="checkbox" ${val !== false ? "checked" : ""}>`;
  }
  if (field.type === "select") {
    return `<select data-chain-field="${field.k}" ${disabled}>${field.options.map(o =>
      `<option value="${escapeAttr(o)}" ${String(val||"")===o?"selected":""}>${escapeAttr(o)}</option>`).join("")}</select>`;
  }
  const colorStyle = field.type === "color" ? 'style="min-width:54px;width:54px;height:34px;padding:2px"' : "";
  return `<input data-chain-field="${field.k}" class="${field.cls||""}" type="${field.type}" value="${escapeAttr(val ?? (field.type==="color" ? "#6b7280" : ""))}" ${colorStyle} ${disabled}>`;
}

function chainTableHeader() {
  return `<thead><tr>${ADMIN_CHAIN_FIELDS.map(f =>
    `<th class="${f.critical?"critical-cell ":""}${chainStickyClass(f)}">${escapeAttr(f.l)}${f.critical?' ⚠':''}</th>`
  ).join("")}<th>Aktion</th></tr></thead>`;
}

function chainTableRow(row={}, isNew=false) {
  const id = isNew ? "new" : String(row.chain_key);
  return `<tr data-chain-editor="${escapeAttr(id)}">
    ${ADMIN_CHAIN_FIELDS.map(f => `<td class="${f.critical?"critical-cell ":""}${chainStickyClass(f)}">${chainCellControl(f,row,isNew)}</td>`).join("")}
    <td><div class="chain-admin-save">
      <button onclick="saveAdminChain('${escapeAttr(id)}', ${isNew})">💾 Speichern</button>
      ${isNew?'<button class="secondary" onclick="closeNewChainEditor()">✕</button>':""}
    </div></td>
  </tr>`;
}

async function loadAdminChains() {
  const el = document.getElementById("adminChainsList");
  if (!el || !isAdmin) return;
  el.innerHTML = '<div class="note">Chains werden geladen…</div>';
  const {data,error} = await sb.from("chains").select("*").order("sort_order",{ascending:true});
  if (error) { el.innerHTML = `<div class="error">${escapeAttr(error.message)}</div>`; return; }

  el.innerHTML = `<div class="chain-table-wrap">
    <table class="chain-admin-table">
      ${chainTableHeader()}
      <tbody>${(data||[]).map(r=>chainTableRow(r,false)).join("")}</tbody>
    </table>
  </div>`;
}

function openNewChainEditor() {
  const el=document.getElementById("adminChainEditor");
  if (!el) return;
  el.style.display="block";
  el.innerHTML=`<div class="chain-table-wrap">
    <table class="chain-admin-table">
      ${chainTableHeader()}
      <tbody>${chainTableRow({enabled:true,sort_order:100},true)}</tbody>
    </table>
  </div>`;
}
function closeNewChainEditor() {
  const el=document.getElementById("adminChainEditor");
  if (el) { el.style.display="none"; el.innerHTML=""; }
}

function readChainEditor(id) {
  const root=document.querySelector(`[data-chain-editor="${CSS.escape(String(id))}"]`);
  if (!root) throw new Error("Chain-Editor nicht gefunden.");
  const out={};
  ADMIN_CHAIN_FIELDS.forEach(f=>{
    const input=root.querySelector(`[data-chain-field="${f.k}"]`);
    if (!input) return;
    if (f.type==="checkbox") out[f.k]=input.checked;
    else if (f.type==="number") out[f.k]=input.value===""?null:Number(input.value);
    else out[f.k]=input.value.trim() || null;
  });
  return out;
}

async function saveAdminChain(id,isNew=false) {
  if (!isAdmin) return;
  try {
    const row=readChainEditor(id);
    if (isNew && !row.chain_key) throw new Error("Chain-Key ist erforderlich.");
    if (!row.label) throw new Error("Anzeigename ist erforderlich.");
    if (!row.native_symbol) throw new Error("Natives Symbol ist erforderlich.");
    let q;
    if (isNew) q=sb.from("chains").insert(row);
    else {
      delete row.chain_key;
      q=sb.from("chains").update(row).eq("chain_key",id);
    }
    const {error}=await q;
    if (error) throw error;
    closeNewChainEditor();
    await loadChainConfigFromDb();
    activeChainFilter = new Set(Object.keys(CHAIN_META));
    await loadAdminChains();
    alert("Chain-Konfiguration gespeichert.");
  } catch(e) {
    alert("Speichern fehlgeschlagen: "+(e.message||e));
  }
}

// Rein statische Übersicht, keine DB-Anbindung nötig - hier einfach die Liste pflegen.
const ADMIN_IDEAS = [
  { status: "done", title: "Discovery-Metadaten + Solana-Default", desc: "Phase 2ag: Alle discovery_enabled Chains sind beim Öffnen standardmäßig aktiviert, inklusive Solana. Historisch gefundene EVM-/Apertum-Token laden Symbol, Name und Decimals direkt vom Contract und cachen die Metadaten lokal." },
  { status: "done", title: "Apertum Kurse vollständig on-chain", desc: "Phase 2ai: Im Tab Vordefinierte Token gilt für die komplette Apertum-Chain ausschließlich On-Chain-Bewertung. Nativer APTM wird 1:1 über wAPTM/wUSDT bewertet; Token nutzen direkt TOKEN/wUSDT oder TOKEN/wAPTM → wUSDT. CoinGecko/GeckoTerminal werden für Apertum nicht als Fallback verwendet." },
  { status: "done", title: "TLN/VOW Liquidity Pools nach Chain getrennt", desc: "Phase 2ai: Eigene Unter-Tabs für BNB Smart Chain (BSC/PCLP) und Ethereum (ETH/LP). LP-Cache-Fehler eines Providers lassen vorhandene Cache-Daten und Live-Bestände sichtbar und schreiben den Scanstand nicht fälschlich weiter." },
  { status: "done", title: "LP/PCLP-Historie persistent cachen", desc: "Phase 2af: generischer Supabase-Cache lp_history_events für DAO1/Apertum und TLN/VOW auf BSC/Ethereum. Erster Lauf liest die historische ERC-20-Transferhistorie; Folge-Läufe beginnen am gespeicherten project_scan_state mit Reorg-Überlappung. Add/Remove, LP-Delta, laufender LP-Saldo, Underlyings sowie historische USD-Werte werden dauerhaft gespeichert. Aktuelle LP-Balance, Reserven und Pool-Anteil bleiben live." },
  {
    status: "in_progress",
    title: "Konfiguration aus HTML nach Supabase verlagern",
    desc: "Umbau gestartet 26.08.2026. HAUPTTEIL ERLEDIGT, ABER NACH AUDIT NOCH NICHT GANZ ABSCHLIESSEN: public.chains ist Single Source of Truth für Chain-Stammdaten sowie Balance-, Gebühren-, Discovery-, Approval- und NFT-Provider/API-Konfiguration. predefined_tokens enthält Token-Metadaten und Preis-Zuordnung. loadAll() ist dynamisch; die früheren Chain-Maps für Fees/RPC/Alchemy/GoPlus sind entfernt. AUDIT 26.08.2026: DeFi-/DEX-Struktur umgesetzt: TLN/VOW ist nun als erstes generisches DeFi-Projekt modelliert; VOW-Referenz-Contracts liegen in defi_project_tokens, PancakeSwap-/Uniswap-Factorys in dex_configs und RPCs werden aus public.chains wiederverwendet. Die bestehenden Werte werden durch das Migrations-SQL automatisch übernommen. Strenger Audit läuft weiter: Chain-Farben wurden aus CSS nach public.chains.display_color verschoben; Wallet-EVM-Hinweis und Custom-Token-Chain-Auswahl sind jetzt DB-dynamisch. Noch offen: Routescan-URL-Fallback entfernen, Tron-Decimallogik bereinigen und die TLN/VOW-Spezial-UI langfristig zur generischen DeFi-Projektansicht machen. SOLANA-ABDECKUNG: Entdecken ist jetzt ohne Alchemy über getTokenAccountsByOwner umgesetzt; klassisches SPL Token Program und Token-2022 werden berücksichtigt. Der normale Solana-Wallet-Load liefert dabei auch die Tokenbestände, sodass als sicher hinzugefügte Solana-Mints im Wallet-Tracking nutzbar sind. Globale App-/Service-Konfigurationen wie Supabase-Projekt, CoinGecko/GeckoTerminal/GoPlus, CDN-URLs, revoke.cash und IPFS-Gateway sind keine Chain-Stammdaten und müssen nicht zwingend in public.chains. Credentials/Keys (Alchemy, PublicNode, NodeReal) gehören ausdrücklich NICHT in eine normale öffentliche DB-Tabelle."
  },
  {
    status: "in_progress",
    title: "Hardcoding-Audit / Restbereinigung",
    desc: "Audit gestartet 26.08.2026. PRIORITÄT A – umgesetzt: generische Tabellen defi_projects, defi_project_tokens und dex_configs; TLN/VOW/VOW-Referenzen und PancakeSwap-/Uniswap-Factorys werden per Migration übernommen, RPCs kommen aus CHAIN_CONFIG. Admin-Masken DeFi-Projekte und DEX sind vorhanden. Routescan-Funktion hat noch einen hartcodierten API-URL-Fallback; entfernen, sodass fehlendes fee_api_base als Konfigurationsfehler sichtbar wird. PRIORITÄT B – fachlich prüfen: TRON_TOKEN_DECIMALS_DEFAULT=6 wird aktuell pauschal auf TRC20 angewendet; besser decimals aus predefined_tokens/Token-Metadaten verwenden. NodeReal-BSC-URL enthält den Key direkt; PublicNode- und Alchemy-Keys stehen ebenfalls im Frontend. Das ist derzeit bewusst so, sollte bei späterer Secret-/Proxy-Lösung separat behandelt werden und NICHT in public.chains landen. PRIORITÄT C – bewusst im HTML belassen: Supabase-App-URL/Publishable-Key, CDN-Bibliotheken, globale CoinGecko-/GeckoTerminal-/GoPlus-Endpunkte, revoke.cash-Link, IPFS-Gateway, Redirect-URL sowie UI-spezifische Spenden-Auswahl. NÄCHSTE SCHRITTE: (1) DEX/TLN-VOW-Infrastruktur-Tabelle definieren; (2) TLN/VOW-Modul auf CHAIN_CONFIG + neue Tabelle umstellen; (3) Routescan-Fallback entfernen; (4) Tron-Decimallogik korrigieren; (5) danach erneut automatisierten URL/Contract-/Chain-Literal-Scan durchführen und diesen Punkt auf DONE setzen."
  },
  {
    status: "in_progress",
    title: "Chat-Benachrichtigungen",
    desc: "Umgesetzt im Frontend/DB-Modell: read_at für Nachrichten, Ungelesen-Badge für User und Admin, ungelesene Anzahl je User in der Admin-Konversationsauswahl und serverseitige E-Mail-Sperrlogik. Regel: erste neue Nachricht löst eine E-Mail aus; weitere Nachrichten derselben Seite lösen keine weitere Mail aus, bis der Empfänger geantwortet hat. Danach ist die nächste neue Nachricht wieder mailberechtigt. E-Mail enthält keinen Nachrichtentext, aber den direkten Link https://www.letsgofree.me/wallet-tracking. Für den tatsächlichen Versand wird die Supabase Edge Function chat-notify mit einem serverseitigen Resend-Key verwendet; RESEND_API_KEY und CHAT_FROM_EMAIL müssen als Supabase Secrets gesetzt werden."
  },
  {
    status: "open",
    title: "Alchemy vollständig auf öffentliche Datenquellen reduzieren",
    desc: "ZIEL: Alchemy nur noch als optionalen Fallback verwenden oder ganz entfernen, ohne Funktionen oder Datenqualität zu verlieren. Gebühren sind bereits ohne Alchemy umgesetzt. Verbleibende Alchemy-Nutzung betrifft vor allem manuelle Spezialfunktionen wie Entdecken/Token-Discovery, Approvals auf einzelnen EVM-Chains und NFTs. VORGEHEN PRO FUNKTION UND CHAIN: (1) aktuellen Alchemy-Aufruf und benötigte Daten exakt inventarisieren; (2) Blockscout API v2, Routescan, öffentliche RPCs und ggf. weitere kostenlose Explorer/API-Angebote praktisch testen; (3) bei Historien immer Pagination, alte/große Wallets, Rate-Limits, CORS und Vollständigkeit prüfen – ein grundsätzlich antwortender Endpoint reicht nicht; (4) Approvals bevorzugt aus Explorer-Transaktionen/Logs ermitteln und den heutigen allowance(owner,spender) per öffentlichem RPC verifizieren, wie bereits für Apertum umgesetzt; (5) Token-Discovery über Explorer-Tokenlisten/Transfers statt alchemy_getAssetTransfers prüfen; (6) NFTs über Blockscout/Routescan bzw. geeignete kostenlose Indexer prüfen, inklusive ERC-721/ERC-1155, Metadaten, Pagination und Spam-Erkennung; (7) Provider-Auswahl weiterhin ausschließlich über public.chains steuern, keine neuen Chain-URL-Maps im HTML; (8) Alchemy erst pro Chain/Funktion deaktivieren, wenn die Alternative mit realen Wallets validiert ist. ERFOLGSKRITERIUM: normale Wallet-Bestände und Gebühren bleiben Alchemy-frei; Discovery/Approvals/NFT möglichst ebenfalls öffentlich, Alchemy höchstens Fallback. Bereits bekannte Ausgangslage: Gebühren ETH/Avalanche Routescan, BSC NodeReal, Polygon/Arbitrum/Base Blockscout; Apertum-Approvals Blockscout + RPC allowance. Die frühere Gebühren-Recherche hat außerdem gezeigt, dass große/alte Wallets und vollständige Pagination ausdrücklich Teil der Validierung sein müssen."
  },
  { status: "done", title: "Bestandesaufnahme per 31.12", desc: "Exakte historische Stichtagsbestände mit persistentem Supabase-Snapshot, Preis-Refresh, Excel/PDF, Chain-Coverage und PDF-Summary nach Chain. EVM/BTC/XRP/Solana sind historisch angebunden; Tron/Akash bleiben bis zu einer belastbaren exakten historischen Quelle ausdrücklich als nicht unterstützt markiert." },
  { status: "open", title: "Gewinn/Verlust statt nur Bestand", desc: "Einstandspreis-Feld bzw. Transaktions-/Kostenbasis-Konzept definieren, um Performance (Plus/Minus, %) statt nur heutigen Bestand zu zeigen." },
  { status: "clarifying", title: "Staking-Anzeige / gestakte LP-Positionen", desc: "Gestakte LP-Token liegen im Staking-/Farm-Contract und nicht im Wallet. Für TLN/VOW wurden einzelne Contracts/Pools bereits untersucht; für eine allgemeine Anzeige fehlt noch ein belastbares Modell pro Staking-Contract (Contract-Adresse, Stake-/Unstake-Events bzw. View-Funktionen, LP-Zuordnung)." },
  { status: "done", title: "TLN/VOW- und v-Währungs-Preislogik", desc: "On-chain umgesetzt: v_currency über direkten v/VOW-Pool und VOW/USDT; tln_vow_token bevorzugt TOKEN/VOW→VOW/USDT, sonst TOKEN/USDT; VOW selbst direkt VOW/USDT. Zuordnung erfolgt über Contract-Adressen und Supabase-Kategorien." },
  { status: "open", title: "Wallet-Bezeichnungen verschlüsseln (Stufe 1)", desc: "Nur Labels verschlüsseln, nicht öffentliche Blockchain-Adressen. Vor Umsetzung Schlüsselverwaltung und Auswirkungen auf Suche/Sortierung klären." },
  {
    status: "paused",
    title: "Automatisierte monatliche Snapshots (1. jedes Monats)",
    desc: "Geplant als Supabase Edge Function + pg_cron, unabhängig vom Browser. Code/Migrationen wurden vorbereitet, Deployment aber pausiert. Vor Wiederaufnahme prüfen, ob die inzwischen hinzugekommenen Chains (u.a. Akash) und aktuelle Preislogik vollständig im Snapshot-Job berücksichtigt werden."
  },
  { status: "done", title: "Wachhalte-Mechanismus gegen Supabase-Inaktivitäts-Pause", desc: "GitHub Actions Workflow pingt Supabase regelmäßig extern an." },
  { status: "done", title: "Netzwerkgebühren ohne Alchemy", desc: "Gebührenprovider migriert: Ethereum Routescan, BSC NodeReal, Polygon/Arbitrum/Base Blockscout, Avalanche Routescan; Apertum/XRP/Solana über eigene kostenlose Quellen. Supabase-Cache + inkrementelle Aktualisierung; alle 30-Tage-Sperren gelten nur für Nicht-Admins. Historische USD-Bewertung bewusst als spätere Phase offen." },
  { status: "open", title: "Historischer USD-Wert der Netzwerkgebühren", desc: "Phase 2 der Gebührenanzeige. Native Gebühren sind vorhanden; gesucht wird noch eine praktikable historische Preisquelle über mehr als 365 Tage für ETH, BNB, POL, AVAX usw. CoinGecko Public API reicht dafür nicht." },
  { status: "done", title: "Token-Approval-Checker", desc: "Zeigt aktive/unlimitierte Freigaben; Revoke läuft extern über revoke.cash (bewusst rein lesend)." },
  { status: "done", title: "Portfolio-Allokation als Grafik", desc: "Kreisdiagramm nach Chain/Token, Total oder je Wallet." },
  { status: "open", title: "Token-Kursverlauf als Chart", desc: "Im Token-Summary pro Token ein kleines Grafik-Symbol ergänzen. Klick darauf öffnet einen Kursverlauf als Linienchart, z.B. 7 Tage / 30 Tage / 1 Jahr / Max. Für native Coins kann die historische Preisquelle über die CoinGecko-ID der Chain laufen; für ERC-20/BEP-20/etc. über die in predefined_tokens hinterlegte coingecko_id oder alternativ eine DEX-basierte Historie. Vor Umsetzung historische Datenquelle und Free-API-Limits prüfen: CoinGecko Public ist für ältere historische Daten aktuell begrenzt, daher ggf. zweite Quelle oder eigener täglicher Preis-Cache in Supabase. Ziel: Chart ohne erneute HTML-Anpassung für jeden Token, vollständig über die DB-Metadaten gesteuert." },
  { status: "done", title: "NFT-Anzeige", desc: "NFTs je Wallet/Chain inkl. Spam-Verdacht und Supabase-Cache." },
  { status: "done", title: "Willkommen + Hilfe + Krypto-Unterstützung", desc: "Willkommensdialog für neue und bestehende User mit 'Nicht mehr anzeigen', aktualisierte Hilfe sowie Unterstützen-Dialog mit USDT/USDC auf Ethereum/BSC/Polygon und QR-Code." },
  { status: "done", title: "Akash Network", desc: "Akash-Wallet-Adresse, native AKT-Balance und aktueller AKT-Kurs integriert. Akash-Gebühren sind noch nicht Bestandteil des Gebührenmoduls." },
  { status: "reverted", title: "Automatischer Scam-Hinweis beim Login", desc: "War umgesetzt und wurde wieder entfernt, weil die damaligen API-Abfragen das Tageskontingent stark belasteten. Manueller Entdecken-Tab bleibt der Ersatz." },
  { status: "open", title: "CSV-Export der aktuellen Bestände", desc: "Export für eigene Excel-/Steuer-Auswertungen." },
  { status: "open", title: "Mehrsprachigkeit (DE/FR/IT/EN)", desc: "Für einen breiteren Nutzerkreis." },
  { status: "open", title: "Als installierbare Mobile-App (PWA)", desc: "Homescreen-Installation und app-artige Nutzung." }
];

function renderAdminIdeas() {
  const el = document.getElementById("adminIdeasList");
  const configDiag = chainConfigStatus.source === "Supabase public.chains"
    ? `<div class="custom-token-card" style="margin-bottom:12px;border-color:var(--safe)">
        <strong>⚙️ Chain-Konfiguration: Supabase ✓</strong>
        <div class="meta">${chainConfigStatus.count} aktive Chains aus <code>public.chains</code> geladen · ${chainConfigStatus.loadedAt ? new Date(chainConfigStatus.loadedAt).toLocaleString("de-CH") : "–"}</div>
        <div class="meta">HTML-Fallback für Chain-Metadaten: <strong>entfernt</strong></div>
      </div>`
    : `<div class="custom-token-card" style="margin-bottom:12px;border-color:var(--danger)">
        <strong>⚙️ Chain-Konfiguration: ${escapeAttr(chainConfigStatus.source)}</strong>
      </div>`;
  const statusMeta = {
    open: { label: "Offen", color: "#9aa0ac" },
    in_progress: { label: "In Umsetzung", color: "#3b82f6" },
    clarifying: { label: "In Abklärung", color: "#f0b90b" },
    done: { label: "Umgesetzt", color: "#46c878" },
    reverted: { label: "Umgesetzt, dann zurückgebaut", color: "var(--danger)" },
    paused: { label: "Code fertig, Deployment pausiert", color: "#8247e5" }
  };
  el.innerHTML = configDiag + ADMIN_IDEAS.map(idea => {
    const s = statusMeta[idea.status];
    return `<div class="custom-token-row" style="align-items:flex-start">
      <div>
        <div><strong>${escapeAttr(idea.title)}</strong> <span class="badge" style="background:${s.color}22;color:${s.color}">${s.label}</span></div>
        <div class="meta" style="margin-top:4px">${escapeAttr(idea.desc)}</div>
      </div>
    </div>`;
  }).join("");
}

// ---- Admin: eigene sichere Token aller User einsehen/übernehmen/ignorieren ----
let adminAllCustomTokens = []; // rohe Zeilen aus der DB (alle User)

async function loadAdminCustomTokens() {
  const { data, error } = await sb.from("safe_tokens").select("*").order("created_at", { ascending: false });
  if (error) { console.error(error); adminAllCustomTokens = []; return; }
  adminAllCustomTokens = data || [];
}

async function renderAdminCustomTokens() {
  const el = document.getElementById("adminCustomTokensList");
  el.innerHTML = `<div class="status">Lade...</div>`;
  await loadAdminCustomTokens();

  const statusFilter = document.getElementById("adminTokenStatusFilter").value;
  let rows = adminAllCustomTokens;
  if (statusFilter !== "all") {
    rows = rows.filter(r => (r.admin_status || "pending") === statusFilter);
  }

  if (rows.length === 0) {
    el.innerHTML = `<div class="empty">Keine Einträge mit diesem Status.</div>`;
    return;
  }

  el.innerHTML = rows.map(r => {
    const chainMeta = CHAIN_META[r.chain];
    const alreadyPredefined = (SAFE_ADDRESSES[r.chain] || []).includes(normalizeAddress(r.address, r.chain));
    const status = r.admin_status || "pending";
    const statusBadge = status === "promoted" ? '<span class="badge safe">übernommen</span>'
      : status === "ignored" ? '<span class="badge unsafe">ignoriert</span>'
      : '<span class="badge unsafe" style="background:rgba(240,185,11,0.15);color:#f0b90b">ausstehend</span>';

    return `<div class="custom-token-row" style="align-items:flex-start;flex-wrap:wrap">
      <div style="flex:1;min-width:220px">
        <div><span class="dot ${chainMeta ? chainMeta.dot : ''}" style="margin-right:6px"></span>${chainMeta ? chainMeta.label : r.chain} ${statusBadge} ${alreadyPredefined ? '<span class="note" style="display:inline">(bereits vordefiniert)</span>' : ''}</div>
        <div class="meta">User-Label: "${escapeAttr(r.label)}" · ${r.address}</div>
      </div>
      ${status === "pending" ? `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input type="text" id="admin-label-${r.id}" value="${escapeAttr(r.label)}" style="width:160px" placeholder="Label für vordefinierte Liste" />
          <button onclick="adminPromoteToken('${r.id}','${r.chain}','${r.address}')">Als vordefiniert übernehmen</button>
          <button class="remove" onclick="adminIgnoreToken('${r.id}')">Ignorieren</button>
        </div>
      ` : ''}
    </div>`;
  }).join("");
}

async function adminIgnoreToken(id) {
  const { error } = await sb.from("safe_tokens").update({ admin_status: "ignored" }).eq("id", id);
  if (error) { alert("Fehler: " + error.message); return; }
  renderAdminCustomTokens();
}

async function adminPromoteToken(id, chain, address) {
  const labelInput = document.getElementById("admin-label-" + id);
  const label = labelInput ? labelInput.value.trim() : "";
  if (!label) { alert("Bitte ein Label eingeben."); return; }

  const { error: insertError } = await sb.from("predefined_tokens")
    .upsert({ chain, address: address.toLowerCase(), label }, { onConflict: "chain,address" });
  if (insertError) { alert("Fehler beim Übernehmen: " + insertError.message); return; }

  const { error: updateError } = await sb.from("safe_tokens").update({ admin_status: "promoted" }).eq("id", id);
  if (updateError) { alert("Fehler beim Markieren: " + updateError.message); return; }

  await loadPredefinedTokensFromDb(); // damit die neue Liste sofort überall greift
  renderSafeTokenTable();
  renderAdminCustomTokens();
}

// ---- Alchemy: EVM-Daten (ersetzt Moralis) ----
// WICHTIG: Hier den API-Key deiner Alchemy-App eintragen.
// Da diese Seite statisch auf GitHub Pages läuft, ist ein Frontend-Key grundsätzlich sichtbar.
// Testversion: API-Key wird im Request-Pfad verwendet. Deshalb die Domain-Allowlist in Alchemy auf deine Website beschränken.
const ALCHEMY_API_KEY = "alch_UMCNBKNtoimHNHHPBk7kV";

function configuredAlchemyBase(chain, purpose="discovery") {
  const cfg = CHAIN_CONFIG[chain] || {};
  const base = purpose === "approvals" ? cfg.approvalsApiBase : cfg.discoveryApiBase;
  const provider = purpose === "approvals" ? cfg.approvalsProvider : cfg.discoveryProvider;
  if (provider !== "alchemy" || !base) {
    throw new Error(`${CHAIN_META[chain]?.label || chain}: ${purpose}-Provider/API-Basis ist in public.chains nicht als Alchemy konfiguriert`);
  }
  return base.replace(/\/+$/, "");
}

function configuredNftBase(chain) {
  const cfg = CHAIN_CONFIG[chain] || {};
  if (!cfg.nftProvider || !cfg.nftApiBase) {
    throw new Error(`${CHAIN_META[chain]?.label || chain}: NFT-Provider/API-Basis fehlt in public.chains`);
  }
  return cfg.nftApiBase.replace(/\/+$/, "");
}

function assertAlchemyConfigured() {
  if (!ALCHEMY_API_KEY || ALCHEMY_API_KEY.startsWith("HIER_")) {
    throw new Error("Alchemy API-Key fehlt – bitte ALCHEMY_API_KEY im HTML eintragen.");
  }
}

let archiveRpcQueue = Promise.resolve();
let archiveRpcLastCall = 0;

function configuredArchiveRpcUrl(chain) {
  const cfg = CHAIN_CONFIG[chain] || {};
  if (!cfg.archiveRpcUrl) {
    throw new Error(`${CHAIN_META[chain]?.label || chain}: kein Historie-/Archive-RPC konfiguriert`);
  }
  const base = cfg.archiveRpcUrl.replace(/\/+$/, "");
  if (String(cfg.archiveRpcProvider || "").toLowerCase() === "alchemy") {
    assertAlchemyConfigured();
    return `${base}/${encodeURIComponent(ALCHEMY_API_KEY)}`;
  }
  return base;
}

function archiveRpc(chain, method, params) {
  const run = async () => {
    // Free-Alchemy has a low throughput ceiling. Historical requests are intentionally serialized.
    const wait = Math.max(0, 220 - (Date.now() - archiveRpcLastCall));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    archiveRpcLastCall = Date.now();

    const url = configuredArchiveRpcUrl(chain);
    const delays = [0, 800, 1800, 3500];
    let lastError = null;

    for (let attempt = 0; attempt < delays.length; attempt++) {
      if (delays[attempt]) await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc:"2.0", id:1, method, params })
        });
        if (!res.ok) {
          let detail = "";
          try { detail = await res.text(); } catch (_) {}
          if ((res.status === 429 || res.status >= 500) && attempt < delays.length - 1) continue;
          throw new Error(`${CHAIN_META[chain]?.label || chain}: Archive-RPC HTTP ${res.status}${detail ? " – " + detail.slice(0,180) : ""}`);
        }
        const data = await res.json();
        if (data.error) throw new Error(`${CHAIN_META[chain]?.label || chain}: ${data.error.message || "Archive-RPC Fehler"}`);
        return data.result;
      } catch (e) {
        lastError = e;
        if (attempt === delays.length - 1) throw e;
      }
    }
    throw lastError || new Error("Archive-RPC fehlgeschlagen");
  };
  archiveRpcQueue = archiveRpcQueue.then(run, run);
  return archiveRpcQueue;
}

function taxBlockHex(block) {
  return "0x" + Number(block).toString(16);
}

async function alchemyRpc(chain, method, params, purpose="discovery") {
  assertAlchemyConfigured();
  const base = configuredAlchemyBase(chain, purpose);
  const url = `${base}/${encodeURIComponent(ALCHEMY_API_KEY)}`;
  const delays = [0, 600, 1500];
  let lastNetworkError = null;

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt]) await new Promise(resolve => setTimeout(resolve, delays[attempt]));
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
      });
    } catch (e) {
      lastNetworkError = e;
      continue;
    }
    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch (_) {}
      if ((res.status === 429 || res.status >= 500) && attempt < delays.length - 1) continue;
      throw new Error(`${CHAIN_META[chain]?.label || chain}: Alchemy HTTP ${res.status}${detail ? " – " + detail.slice(0, 180) : ""}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(`${CHAIN_META[chain]?.label || chain}: ${method}: ${data.error.message || "Alchemy RPC-Fehler"}`);
    return data.result;
  }
  throw new Error(`${CHAIN_META[chain]?.label || chain}: Netzwerkfehler bei ${method} nach 3 Versuchen (${lastNetworkError?.message || lastNetworkError || "Load failed"})`);
}

async function alchemyRpcBatch(chain, calls, purpose="discovery") {
  if (!calls.length) return [];
  assertAlchemyConfigured();

  // Große Wallet-Historien erzeugen sehr viele Receipt-/TX-Abfragen.
  // Browser (insb. Safari/iOS) können bei großen JSON-RPC-Batches mit "Load failed"
  // abbrechen. Deshalb intern immer in kleine Pakete aufteilen.
  const MAX_CALLS_PER_HTTP_BATCH = 10;
  if (calls.length > MAX_CALLS_PER_HTTP_BATCH) {
    const allRows = [];
    for (let offset = 0; offset < calls.length; offset += MAX_CALLS_PER_HTTP_BATCH) {
      if (offset > 0) await new Promise(resolve => setTimeout(resolve, 200));
      const part = calls.slice(offset, offset + MAX_CALLS_PER_HTTP_BATCH);
      const rows = await alchemyRpcBatch(chain, part, purpose);
      allRows.push(...rows);
    }
    return allRows;
  }

  const base = configuredAlchemyBase(chain, purpose);
  const url = `${base}/${encodeURIComponent(ALCHEMY_API_KEY)}`;
  const payload = calls.map((c, i) => ({
    jsonrpc: "2.0",
    id: i + 1,
    method: c.method,
    params: c.params
  }));

  // Bei älteren/aktiven Wallets laufen viele Requests nacheinander.
  // Kurzzeitige Browser-/Netzwerkabbrüche automatisch bis zu 3x wiederholen.
  const delays = [0, 500, 1200];
  let lastNetworkError = null;

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt]) await new Promise(resolve => setTimeout(resolve, delays[attempt]));

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      lastNetworkError = e;
      continue;
    }

    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch (_) {}

      // Rate-Limit / temporäre Serverfehler ebenfalls nochmals versuchen.
      if ((res.status === 429 || res.status >= 500) && attempt < delays.length - 1) {
        continue;
      }

      throw new Error(`${CHAIN_META[chain]?.label || chain}: Alchemy Batch HTTP ${res.status}${detail ? " – " + detail.slice(0, 180) : ""}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error(`${CHAIN_META[chain]?.label || chain}: Unerwartete Alchemy-Batch-Antwort`);
    }

    const byId = new Map(data.map(x => [x.id, x]));
    return payload.map(p => {
      const x = byId.get(p.id);
      if (!x) return null;
      if (x.error) return { __error: x.error.message || "RPC-Fehler" };
      return x.result;
    });
  }

  throw new Error(
    `${CHAIN_META[chain]?.label || chain}: Netzwerkfehler bei RPC-Batch nach 3 Versuchen (${lastNetworkError?.message || lastNetworkError || "Load failed"})`
  );
}

async function fetchAlchemyOutgoingTxHashes(chain, address, onProgress) {
  const hashes = new Set();
  let pageKey = null;
  let page = 0;
  let truncated = false;

  do {
    page++;
    if (onProgress) onProgress(page);
    const filter = {
      fromBlock: "0x0",
      toBlock: "latest",
      fromAddress: address,
      category: ["external", "erc20", "erc721", "erc1155"],
      excludeZeroValue: false,
      maxCount: "0x64" // 100 statt 1000: kleinere Antworten für alte/aktive Wallets
    };
    if (pageKey) filter.pageKey = pageKey;
    let result;
    try {
      result = await alchemyRpc(chain, "alchemy_getAssetTransfers", [filter], "approvals");
    } catch (e) {
      // Einige Netzwerke unterstützen nicht jede NFT-Kategorie. Für Gebühren/Approvals
      // reicht als Fallback die externe + ERC20-Historie.
      filter.category = ["external", "erc20"];
      result = await alchemyRpc(chain, "alchemy_getAssetTransfers", [filter], "approvals");
    }
    (result.transfers || []).forEach(t => { if (t.hash) hashes.add(t.hash); });
    pageKey = result.pageKey || null;
    if (pageKey) await new Promise(resolve => setTimeout(resolve, 150));
  } while (pageKey && page < FEES_MAX_PAGES);

  if (pageKey) truncated = true;
  return { hashes: [...hashes], truncated };
}

// Zentrale Chain-Konfiguration.
// Single Source of Truth: public.chains in Supabase.
// Im HTML gibt es absichtlich KEINE Chain-Metadaten als Fallback mehr.
const CHAIN_META = {};
const CHAIN_CONFIG = {};
const NATIVE_SYMBOL = {};
const GECKOTERMINAL_NETWORK = {};
let chainConfigStatus = { source: "nicht geladen", count: 0, loadedAt: null };

async function loadChainConfigFromDb() {
  const { data, error } = await sb.from("chains")
    .select("chain_key,label,native_symbol,coingecko_id,wallet_type,explorer_url_template,geckoterminal_network,sort_order,enabled,evm_chain_id,rpc_url,archive_rpc_url,archive_rpc_provider,balance_provider,fee_provider,fee_api_base,fee_finality_blocks,fee_overlap_blocks,fees_enabled,discovery_enabled,approvals_enabled,nft_enabled,discovery_provider,discovery_api_base,approvals_provider,approvals_api_base,nft_provider,nft_api_base,balance_api_base,display_color")
    .eq("enabled", true)
    .order("sort_order", { ascending: true });

  if (error) {
    chainConfigStatus = { source: "FEHLER", count: 0, loadedAt: new Date().toISOString(), error: error.message };
    throw new Error("Chain-Konfiguration konnte nicht aus Supabase geladen werden: " + error.message);
  }
  if (!Array.isArray(data) || data.length === 0) {
    chainConfigStatus = { source: "FEHLER", count: 0, loadedAt: new Date().toISOString(), error: "Keine aktiven Chains" };
    throw new Error("Chain-Konfiguration aus Supabase ist leer. Bitte Tabelle public.chains prüfen.");
  }

  for (const obj of [CHAIN_META, CHAIN_CONFIG, NATIVE_SYMBOL, GECKOTERMINAL_NETWORK]) {
    Object.keys(obj).forEach(k => delete obj[k]);
  }

  data.forEach(row => {
    const key = String(row.chain_key || "").trim();
    if (!key) return;

    CHAIN_META[key] = {
      label: row.label || key,
      dot: key, // reine Darstellungs-Klasse; keine Chain-Daten im HTML nötig
      coingeckoId: row.coingecko_id || null
    };
    CHAIN_CONFIG[key] = {
      walletType: row.wallet_type || null,
      explorerUrlTemplate: row.explorer_url_template || null,
      sortOrder: Number(row.sort_order || 100),
      evmChainId: row.evm_chain_id == null ? null : Number(row.evm_chain_id),
      rpcUrl: row.rpc_url || null,
      archiveRpcUrl: row.archive_rpc_url || null,
      archiveRpcProvider: row.archive_rpc_provider || null,
      balanceProvider: row.balance_provider || null,
      balanceApiBase: row.balance_api_base || null,
      displayColor: row.display_color || "#6b7280",
      feeProvider: row.fee_provider || null,
      feeApiBase: row.fee_api_base || null,
      feeFinalityBlocks: row.fee_finality_blocks == null ? null : Number(row.fee_finality_blocks),
      feeOverlapBlocks: row.fee_overlap_blocks == null ? null : Number(row.fee_overlap_blocks),
      feesEnabled: row.fees_enabled === true,
      discoveryEnabled: row.discovery_enabled === true,
      approvalsEnabled: row.approvals_enabled === true,
      nftEnabled: row.nft_enabled === true,
      discoveryProvider: row.discovery_provider || null,
      discoveryApiBase: row.discovery_api_base || null,
      approvalsProvider: row.approvals_provider || null,
      approvalsApiBase: row.approvals_api_base || null,
      nftProvider: row.nft_provider || null,
      nftApiBase: row.nft_api_base || null
    };
    NATIVE_SYMBOL[key] = row.native_symbol || key.toUpperCase();
    if (row.geckoterminal_network) {
      GECKOTERMINAL_NETWORK[key] = row.geckoterminal_network;
    }
  });

  chainConfigStatus = {
    source: "Supabase public.chains",
    count: Object.keys(CHAIN_META).length,
    loadedAt: new Date().toISOString()
  };
  return true;
}


// ---- Chain-Filter (Wallet-Tracking-Tab) - standardmässig sind alle Chains aktiv ----
let activeChainFilter = new Set();

function renderChainFilter() {
  const el = document.getElementById("chainFilterContainer");
  if (!el) return;
  el.innerHTML = Object.keys(CHAIN_META).map(chain => {
    const meta = CHAIN_META[chain];
    const checked = activeChainFilter.has(chain) ? "checked" : "";
    return `<label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;cursor:pointer">
      <input type="checkbox" ${checked} onchange="toggleChainFilter('${chain}', this.checked)" style="width:auto" />
      <span class="dot" style="background:${escapeAttr(CHAIN_CONFIG[meta.dot]?.displayColor || "#6b7280")}"></span> ${meta.label}
    </label>`;
  }).join("");
}

function toggleChainFilter(chain, isChecked) {
  if (isChecked) activeChainFilter.add(chain);
  else activeChainFilter.delete(chain);
  renderResults();
}

function setAllChainFilter(selectAll) {
  activeChainFilter = selectAll ? new Set(Object.keys(CHAIN_META)) : new Set();
  renderChainFilter();
  renderResults();
}

// ---- Navigation "Gehe zu Wallet" ----
function renderWalletNav() {
  const el = document.getElementById("walletNav");
  if (el) {
    const current = el.value;
    el.innerHTML = `<option value="">– auswählen –</option>` +
      wallets.map(w => `<option value="${w.id}">${escapeAttr(w.label)}</option>`).join("");
    if (wallets.some(w => w.id === current)) el.value = current;
  }
  renderDiscoveryWalletSelect();
  renderChartWalletSelect();
  renderAllocWalletSelect();
  renderFeesWalletSelect();
  renderApprovalsWalletSelect();
  renderNftWalletSelect();
}

function goToWallet(id) {
  if (!id) return;
  const el = document.getElementById("wallet-block-" + id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}


// RPC-Endpunkt (PublicNode, kein Key nötig) pro EVM-Chain - für native Balance und Token-Checks
// Kostenloser PublicNode/Allnodes-Token - hebt die Archiv-Sperre auf (nötig für den
// Discovery-Scan über weiter zurückliegende Blöcke) und erhöht generell die Rate-Limits.
// Kostenloser PublicNode/Allnodes-Token - hebt die Archiv-Sperre auf (nötig für den
// Discovery-Scan über weiter zurückliegende Blöcke) und erhöht generell die Rate-Limits.
// PublicNode scheint pro Chain einen eigenen Token zu vergeben statt eines einzigen
// chain-übergreifenden Tokens - darum eine Map statt einer einzelnen Konstante.
// Kostenloser PublicNode/Allnodes-Token - hebt die Archiv-Sperre auf (nötig für den
// Discovery-Scan über weiter zurückliegende Blöcke) und erhöht generell die Rate-Limits.
// Ein einziger Token gilt chain-übergreifend (bestätigt: ETH und BSC haben denselben Wert geliefert).
const PUBLICNODE_TOKEN = "a39e5bb34dbfbaa3dbd07f8e2d5292c769941030dc99ca5b8776b76e3df78b36";
function publicnodeToken(chain) {
  return PUBLICNODE_TOKEN;
}

function configuredRpcUrl(chain) {
  const base = CHAIN_CONFIG[chain]?.rpcUrl;
  if (!base) throw new Error(`${CHAIN_META[chain]?.label || chain}: RPC-/REST-Endpunkt fehlt in public.chains`);
  // PublicNode-Zugangstoken ist ein Credential, keine Chain-Konfiguration.
  // Ist in rpc_url bereits ein individueller Pfad hinterlegt, bleibt er unverändert.
  if (base.includes("publicnode.com") && PUBLICNODE_TOKEN && !base.endsWith(PUBLICNODE_TOKEN)) {
    return base.replace(/\/+$/, "") + "/" + publicnodeToken(chain);
  }
  return base;
}


// Holt Name/Dezimalstellen direkt vom Contract für vordefinierte Token, die noch nie
// eine Wallet mit Bestand hatten (darum bisher nicht im Cache) - unabhängig vom Bestand.
async function ensurePredefinedNames() {
  for (const chain of Object.keys(CHAIN_CONFIG).filter(c => CHAIN_CONFIG[c]?.walletType === "evm" && CHAIN_CONFIG[c]?.rpcUrl)) {
    const missing = (SAFE_ADDRESSES[chain] || []).filter(a =>
      !tokenMetaCache[chain + "|" + a] && !predefinedTokenLabels[chain + "|" + a]
    );
    if (missing.length === 0) continue;

    const calls = [];
    const plan = [];
    missing.forEach((addr, idx) => {
      calls.push({ to: addr, data: "0x313ce567" }); plan.push({ idx, type: "decimals" });
      calls.push({ to: addr, data: "0x95d89b41" }); plan.push({ idx, type: "symbol" });
    });

    let results;
    try {
      results = await evmRpcBatch(configuredRpcUrl(chain), calls);
    } catch (e) {
      continue; // Netzwerkfehler - Namen bleiben unbekannt, nächster Tab-Aufruf versucht's erneut
    }

    const perToken = missing.map(() => ({}));
    results.forEach((hex, i) => {
      const { idx, type } = plan[i];
      perToken[idx][type] = hex;
    });

    missing.forEach((addr, idx) => {
      const decHex = perToken[idx].decimals;
      const decimals = decHex && decHex !== "0x" ? parseInt(decHex, 16) : 18;
      const symbol = decodeAbiString(perToken[idx].symbol) || (addr.slice(0, 8) + "…");
      tokenMetaCache[chain + "|" + addr] = { decimals, symbol };
    });
  }
  saveTokenMetaCache();
  renderSafeTokenTable();
}


// Vordefinierte sichere Token kommen jetzt aus Supabase (Tabelle predefined_tokens),
// nicht mehr fest im Code - siehe loadPredefinedTokensFromDb().
let SAFE_ADDRESSES = {};
let predefinedTokenLabels = {}; // Key "chain|adresse" -> Label
let predefinedTokenCategory = {}; // Key "chain|adresse" -> "v_currency" | "lp_token" | "tln_vow_token" | null

// Adressen case-sensitiv normalisieren - EVM/Apertum-Adressen sind Hex (Gross-/Klein-
// schreibung egal), Tron-Adressen sind Base58 und GROSS-/KLEINSCHREIBUNG IST RELEVANT.
function normalizeAddress(address, chain) {
  const value = address.trim();
  return CHAIN_CONFIG[chain]?.walletType === "evm" ? value.toLowerCase() : value;
}

async function refreshPredefinedTokens() {
  await loadPredefinedTokensFromDb();
  renderSafeTokenTable();
  loadAll(); // neue/geänderte vordefinierte Token sollen sofort im Wallet-Tracking berücksichtigt werden
}

async function loadDefiProjectsCache(){
  const {data,error}=await sb.from("defi_projects").select("*").eq("enabled",true).order("sort_order",{ascending:true});
  if(error){ console.error(error); defiProjectsCache=[]; return; }
  defiProjectsCache=data||[];
  const sel=document.getElementById("newPredefDefiProject");
  if(sel){
    const current=sel.value;
    sel.innerHTML='<option value="">– keines –</option>'+defiProjectsCache.map(p=>`<option value="${escapeAttr(p.project_key)}">${escapeAttr(p.name)}</option>`).join("");
    if(defiProjectsCache.some(p=>p.project_key===current)) sel.value=current;
  }
}

async function addPredefinedToken() {
  const chain = document.getElementById("newPredefChain").value;
  const addressRaw = document.getElementById("newPredefAddress").value.trim();
  const label = document.getElementById("newPredefLabel").value.trim();
  const defiProjectKey = document.getElementById("newPredefDefiProject").value || null;
  const defiCategory = document.getElementById("newPredefDefiCategory").value || null;

  if (!addressRaw || !label) { alert("Bitte Adresse und Label ausfüllen."); return; }
  const address = normalizeAddress(addressRaw, chain);

  const { error } = await sb.from("predefined_tokens").insert({
    chain, address, label,
    defi_project_key: defiProjectKey,
    defi_category: defiCategory
  });
  if (error) { alert("Fehler beim Hinzufügen: " + error.message); return; }

  document.getElementById("newPredefAddress").value = "";
  document.getElementById("newPredefLabel").value = "";
  document.getElementById("newPredefDefiProject").value = "";
  document.getElementById("newPredefDefiCategory").value = "";
  await refreshPredefinedTokens();
}

// Case-insensitiver Adress-Abgleich für UPDATE/DELETE-Abfragen (ausser Tron, dort ist
// Gross-/Kleinschreibung bewusst relevant) - die Adresse im Code ist normalisiert
// (kleingeschrieben), in der DB steht teils noch die Original-Schreibweise, darum darf
// hier kein exaktes .eq() auf die Adresse verwendet werden, sonst wird still nichts gefunden.
function matchAddressQuery(query, chain, address) {
  return chain === "tron" ? query.eq("address", address) : query.ilike("address", address);
}

async function updatePredefinedTokenLabel(chain, address, newLabel) {
  newLabel = newLabel.trim();
  if (!newLabel) return;
  const { error } = await matchAddressQuery(sb.from("predefined_tokens").update({ label: newLabel }).eq("chain", chain), chain, address);
  if (error) { alert("Fehler beim Speichern: " + error.message); return; }
  predefinedTokenLabels[chain + "|" + address] = newLabel;
}

async function deletePredefinedToken(chain, address, label) {
  if (!confirm(`"${label}" (${chain}) wirklich aus der vordefinierten Liste löschen? Betrifft ALLE User.`)) return;
  const { error } = await matchAddressQuery(sb.from("predefined_tokens").delete().eq("chain", chain), chain, address);
  if (error) { alert("Fehler beim Löschen: " + error.message); return; }
  await refreshPredefinedTokens();
}

async function loadPredefinedTokensFromDb() {
  const { data, error } = await sb.from("predefined_tokens").select("*");
  if (error) { console.error(error); return; }
  const addresses = {};
  const labels = {};
  const categories = {}; // "chain|adresse" -> generische DeFi-Kategorie
  const projects = {}; // "chain|adresse" -> project_key
  const coinGeckoIds = {};
  const symbols = {};
  const names = {};
  const decimals = {};
  const seen = new Set(); // Dedupe für den Fall, dass dieselbe Adresse mit unterschiedlicher
                           // Gross-/Kleinschreibung mehrfach in der DB steht (case-sensitiver PK)
  data.forEach(row => {
    if (row.enabled === false) return;
    const chain = row.chain;
    const address = normalizeAddress(row.address, chain);
    const dedupeKey = chain + "|" + address;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    addresses[chain] = addresses[chain] || [];
    addresses[chain].push(address);
    if (row.label) labels[dedupeKey] = row.label;
    categories[dedupeKey] = row.defi_category || null;
    projects[dedupeKey] = row.defi_project_key || null;
    if (row.coingecko_id) coinGeckoIds[dedupeKey] = row.coingecko_id;
    if (row.symbol) symbols[dedupeKey] = row.symbol;
    if (row.name) names[dedupeKey] = row.name;
    if (row.decimals !== null && row.decimals !== undefined) decimals[dedupeKey] = Number(row.decimals);
  });
  SAFE_ADDRESSES = addresses;
  predefinedTokenLabels = labels;
  predefinedTokenCategory = categories;
  predefinedTokenProject = projects;
  predefinedTokenCoinGeckoIds = coinGeckoIds;
  predefinedTokenSymbols = symbols;
  predefinedTokenNames = names;
  predefinedTokenDecimals = decimals;
}

// Apertum: Balance-Abfrage über die öffentliche Blockscout-Explorer-API (CORS-freundlich für Browser-Zugriffe)
function isSafeTokenAddress(address, chain) {
  if (!address) return false;
  const a = normalizeAddress(address, chain);
  if ((SAFE_ADDRESSES[chain] || []).includes(a)) return true;
  return customSafeTokens.some(t => t.chain === chain && t.address === a);
}

// ---- Eigene sichere Token (Supabase-gestützt, an den Account gebunden) ----
let customSafeTokens = [];

async function loadCustomSafeTokensFromDb() {
  const { data, error } = await sb.from("safe_tokens").select("*").order("created_at");
  if (error) { console.error(error); customSafeTokens = []; return; }
  customSafeTokens = data.map(row => ({ dbId: row.id, chain: row.chain, address: row.address, label: row.label }));
}

async function addCustomSafeToken() {
  const chain = document.getElementById("customChain").value;
  const rawAddress = document.getElementById("customAddress").value.trim();
  const address = normalizeAddress(rawAddress, chain);
  const label = document.getElementById("customLabel").value.trim();

  const walletType = CHAIN_CONFIG[chain]?.walletType;
  const isValidEvm = walletType === "evm" && /^0x[0-9a-fA-F]{40}$/.test(address);
  const isValidTron = walletType === "tron" && /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
  const isValidSolana = walletType === "sol" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  if (!address || (!isValidEvm && !isValidTron && !isValidSolana)) {
    alert(walletType === "tron"
      ? "Bitte eine gültige Tron-Token-Adresse eingeben."
      : walletType === "sol"
        ? "Bitte eine gültige Solana Mint-Adresse eingeben."
        : "Bitte eine gültige EVM-Contract-Adresse eingeben (0x... mit 40 Hex-Zeichen).");
    return;
  }
  if (customSafeTokens.some(t => t.chain === chain && t.address === address)) {
    alert("Dieser Token ist für diese Chain bereits erfasst.");
    return;
  }

  const { data, error } = await sb.from("safe_tokens").insert({
    user_id: currentUser.id,
    chain,
    address,
    label: label || address
  }).select().single();

  if (error) {
    alert("Fehler beim Speichern: " + error.message);
    return;
  }

  customSafeTokens.push({ dbId: data.id, chain, address, label: label || address });
  document.getElementById("customAddress").value = "";
  document.getElementById("customLabel").value = "";
  renderCustomTokenList();
  renderSafeTokenTable();
  loadAll(); // neuer Token soll sofort im Wallet-Tracking berücksichtigt werden, nicht erst nach manuellem Neuladen
  renderResults();
}

async function removeCustomSafeToken(chain, address) {
  const t = customSafeTokens.find(t => t.chain === chain && t.address === address);
  if (t && t.dbId) {
    await sb.from("safe_tokens").delete().eq("id", t.dbId);
  }
  customSafeTokens = customSafeTokens.filter(t => !(t.chain === chain && t.address === address));
  renderCustomTokenList();
  renderSafeTokenTable();
  loadAll(); // Entfernter Token soll sofort aus dem Wallet-Tracking verschwinden, falls dort ein Bestand angezeigt war
}

function renderCustomChainSelect(){
  const el=document.getElementById("customChain");
  if(!el)return;
  const current=el.value;
  const chains=Object.keys(CHAIN_CONFIG).filter(c=>{
    const type=CHAIN_CONFIG[c]?.walletType;
    return type==="evm" || type==="tron" || type==="sol";
  });
  el.innerHTML=chains.map(c=>`<option value="${escapeAttr(c)}">${escapeAttr(CHAIN_META[c]?.label||c)}</option>`).join("");
  if(chains.includes(current))el.value=current;
}

function renderCustomTokenList() {
  const el = document.getElementById("customTokenList");
  if (customSafeTokens.length === 0) {
    el.innerHTML = `<div class="empty">Noch keine eigenen Token erfasst.</div>`;
    return;
  }
  el.innerHTML = customSafeTokens.map(t => {
    const p = priceForToken(t.chain, t.address);
    const priceHtml = p
      ? `<div style="margin-top:4px">${fmtPrice(p.price)}<span class="price-source">${p.source}</span></div>`
      : `<div style="margin-top:4px;color:var(--muted);font-size:0.78rem">Kein Kurs gefunden</div>`;
    return `
    <div class="custom-token-row">
      <div>
        <div>${escapeAttr(t.label)} <span class="badge safe">sicher</span></div>
        <div class="meta">${t.chain.toUpperCase()} · ${t.address}</div>
        ${priceHtml}
      </div>
      <button class="remove" onclick="removeCustomSafeToken('${t.chain}','${t.address}')">Entfernen</button>
    </div>
  `;
  }).join("");
}

function renderSafeTokenTable() {
  const el = document.getElementById("safeTokenTable");
  const rows = [];

  // Native Coins zuerst - eine Zeile pro Chain
  Object.keys(CHAIN_META).forEach(chain => {
    rows.push({ chain, address: null, label: (NATIVE_SYMBOL[chain] || chain.toUpperCase()) + " (nativ)", isNative: true });
  });

  Object.keys(SAFE_ADDRESSES).forEach(chain => {
    (SAFE_ADDRESSES[chain] || []).forEach(address => {
      let label = predefinedTokenLabels[chain + "|" + address] || null;
      if (!label) {
        const cached = tokenMetaCache[chain + "|" + address];
        label = cached ? cached.symbol : null;
      }
      rows.push({ chain, address, label });
    });
  });

  // Filter-Dropdowns befüllen (Auswahl dabei erhalten)
  populateSelectPreserving("predefChainFilter", Object.keys(CHAIN_META).sort(), c => c.toUpperCase(), "Alle Chains");
  const distinctLabels = [...new Set(rows.map(r => r.label).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  populateSelectPreserving("predefTokenFilter", distinctLabels, l => l, "Alle Token");

  // Filter anwenden
  const chainFilter = document.getElementById("predefChainFilter").value;
  const tokenFilter = document.getElementById("predefTokenFilter").value;
  const textFilter = document.getElementById("predefTextFilter").value.trim().toLowerCase();

  let filtered = rows;
  if (chainFilter) filtered = filtered.filter(r => r.chain === chainFilter);
  if (tokenFilter) filtered = filtered.filter(r => r.label === tokenFilter);
  if (textFilter) {
    filtered = filtered.filter(r =>
      (r.label || "").toLowerCase().includes(textFilter) ||
      (r.address || "").toLowerCase().includes(textFilter)
    );
  }

  if (rows.length === 0) {
    el.innerHTML = `<div class="empty">Keine vordefinierten Token hinterlegt.</div>`;
    return;
  }
  if (filtered.length === 0) {
    el.innerHTML = `<div class="empty">Keine Token gefunden, die zu den Filtern passen.</div>`;
    return;
  }

  filtered.sort((a, b) => {
    const chainCompare = a.chain.localeCompare(b.chain);
    if (chainCompare !== 0) return chainCompare;
    return (a.label || "").localeCompare(b.label || "");
  });

  const DEFI_CATEGORY_LABELS = { voucher_currency:"Voucher-Währung", lp_token:"LP Token", defi_token:"DeFi-Token" };

  el.innerHTML = `<table><thead><tr><th>Chain</th><th>Token</th><th>Adresse</th><th style="text-align:right">Kurs (USD)</th><th>DeFi-Projekt</th><th>Projekt-Kategorie</th>${isAdmin ? '<th></th>' : ''}</tr></thead><tbody>
    ${filtered.map(r => {
      let p;
      if (r.isNative) {
        const np = nativePrices[r.chain];
        p = np ? { price: np.price, source: np.source || "CoinGecko" } : null;
      } else {
        p = priceForToken(r.chain, r.address);
      }
      const priceCell = p
        ? `${fmtPrice(p.price)}<span class="price-source">${p.source}</span>`
        : '<span style="color:var(--muted)">–</span>';

      const categoryKey = r.chain + "|" + (r.address || "");
      const category = predefinedTokenCategory[categoryKey] || "";
      const projectKey = predefinedTokenProject[categoryKey] || "";
      const projectName = defiProjectsCache.find(p=>p.project_key===projectKey)?.name || projectKey;
      const projectCell = r.isNative ? '<span style="color:var(--muted)">–</span>' :
        (isAdmin
          ? `<select onchange="setPredefinedTokenDefi('${r.chain}','${r.address}','defi_project_key',this.value)">
              <option value="" ${projectKey===""?"selected":""}>– keines –</option>
              ${defiProjectsCache.map(p=>`<option value="${escapeAttr(p.project_key)}" ${projectKey===p.project_key?"selected":""}>${escapeAttr(p.name)}</option>`).join("")}
            </select>`
          : (projectKey ? escapeAttr(projectName) : '<span style="color:var(--muted)">–</span>'));
      const categoryCell = r.isNative ? '<span style="color:var(--muted)">–</span>' :
        (isAdmin
          ? `<select onchange="setPredefinedTokenDefi('${r.chain}','${r.address}','defi_category',this.value)">
              <option value="" ${category===""?"selected":""}>– keine –</option>
              <option value="voucher_currency" ${category==="voucher_currency"?"selected":""}>Voucher-Währung</option>
              <option value="lp_token" ${category==="lp_token"?"selected":""}>LP Token</option>
              <option value="defi_token" ${category==="defi_token"?"selected":""}>DeFi-Token</option>
            </select>`
          : (category ? escapeAttr(DEFI_CATEGORY_LABELS[category] || category) : '<span style="color:var(--muted)">–</span>'));

      const labelCell = (isAdmin && !r.isNative)
        ? `<input type="text" value="${escapeAttr(r.label || "")}" style="font-size:0.85rem;padding:4px 6px" onblur="updatePredefinedTokenLabel('${r.chain}','${r.address}', this.value)" onkeydown="if(event.key==='Enter') this.blur()" />`
        : (r.label ? escapeAttr(r.label) : '<span style="color:var(--muted)">unbekannt (noch kein Bestand gefunden)</span>');

      const deleteCell = (isAdmin && !r.isNative)
        ? `<button class="remove" onclick="deletePredefinedToken('${r.chain}','${r.address}','${escapeAttr(r.label || r.address)}')">Löschen</button>`
        : "";

      return `<tr>
      <td><span class="dot" style="margin-right:6px;background:${escapeAttr(CHAIN_CONFIG[r.chain]?.displayColor || "#6b7280")}"></span>${r.chain.toUpperCase()}</td>
      <td>${labelCell}</td>
      <td style="font-size:0.78rem;word-break:break-all">${r.isNative ? '<span style="color:var(--muted)">– (nativ)</span>' : r.address}</td>
      <td style="text-align:right">${priceCell}</td>
      <td>${projectCell}</td>
      <td>${categoryCell}</td>
      ${isAdmin ? `<td>${deleteCell}</td>` : ""}
    </tr>`;
    }).join("")}
  </tbody></table>`;
}

async function setPredefinedTokenDefi(chain,address,field,value){
  const dbValue=value||null;
  const {error}=await matchAddressQuery(sb.from("predefined_tokens").update({[field]:dbValue}).eq("chain",chain),chain,address);
  if(error){ alert("Fehler beim Speichern: "+error.message); return; }
  const key=chain+"|"+address;
  if(field==="defi_project_key") predefinedTokenProject[key]=dbValue;
  if(field==="defi_category") predefinedTokenCategory[key]=dbValue;
  updateTlnVowTabVisibility();
  window.DAO1Project?.updateVisibility?.();
}

// Befüllt ein <select> mit Optionen und behält die bisherige Auswahl bei, falls sie noch existiert
function populateSelectPreserving(selectId, values, labelFn, placeholderLabel) {
  const el = document.getElementById(selectId);
  if (!el) return;
  const current = el.value;
  el.innerHTML = `<option value="">${placeholderLabel}</option>` +
    values.map(v => `<option value="${escapeAttr(v)}">${escapeAttr(labelFn(v))}</option>`).join("");
  if (values.includes(current)) el.value = current;
}

// ---- Live-Kurse: native Coins + möglichst viele Token ----
let nativePrices = {}; // chainKey -> {price, change24h}
let tokenPrices = {}; // "chain|adresse" -> {price, change24h, source}

// Preis-/Token-Metadaten der vordefinierten Token kommen ab Phase 1 aus Supabase.
// Schlüssel ist immer "chain|contract", nie nur das Kürzel – dadurch bleiben gleichnamige
// Token auf unterschiedlichen Chains eindeutig.
let predefinedTokenCoinGeckoIds = {}; // "chain|adresse" -> CoinGecko-ID
let predefinedTokenSymbols = {};      // "chain|adresse" -> Symbol
let predefinedTokenNames = {};        // "chain|adresse" -> Name
let predefinedTokenDecimals = {};     // "chain|adresse" -> decimals

// GeckoTerminal (dieselbe Firma wie CoinGecko, DEX-basierte Kurse) als Ergänzung für alle
// anderen sicheren Token - deckt auch kleinere/eigene Token ab, sofern sie irgendwo auf
// einer DEX gehandelt werden. Kein API-Key nötig, kostenlos. LP-Token und Token ohne
// eigenen Handelsplatz liefern hier bewusst keinen Kurs (kein Rätselraten).

async function apertumCurrentDirectPrice(base,quote,bd,qd){
  const chain="apertum",pair=await taxV2Pair(chain,base,quote,null);if(!pair)return null;
  const iface=new ethers.Interface(["function token0() view returns (address)","function getReserves() view returns (uint112,uint112,uint32)"]);
  const [t0raw,rr]=await Promise.all([
    archiveRpc(chain,"eth_call",[{to:pair,data:iface.encodeFunctionData("token0",[])},"latest"]),
    archiveRpc(chain,"eth_call",[{to:pair,data:iface.encodeFunctionData("getReserves",[])},"latest"])
  ]);
  const [t0]=iface.decodeFunctionResult("token0",t0raw),[r0,r1]=iface.decodeFunctionResult("getReserves",rr),is0=normalizeAddress(t0,chain)===normalizeAddress(base,chain);
  const rb=Number(is0?r0:r1)/10**Number(bd),rq=Number(is0?r1:r0)/10**Number(qd);
  return rb>0&&rq>0?{price:rq/rb,pair,baseReserve:rb,quoteReserve:rq}:null;
}
async function loadApertumCurrentPrices(){
  const chain="apertum",u=taxPredefinedBySymbol(chain,"WUSDT")||taxPredefinedBySymbol(chain,"USDT"),wa=taxPredefinedBySymbol(chain,"WAPTM");
  if(!u||!wa)return;
  const ud=await taxTokenDecimalsCurrent(chain,u),wd=await taxTokenDecimalsCurrent(chain,wa);
  const aptmLeg=await apertumCurrentDirectPrice(wa.address,u.address,wd,ud);
  const aptm=aptmLeg?.price;if(!(aptm>0))return;
  // Apertum ist vollständig on-chain: auch der native APTM-Kurs kommt 1:1 über wAPTM/wUSDT.
  nativePrices[chain]={price:aptm,change24h:undefined,source:`Apertum DEX wAPTM/wUSDT · ${aptmLeg.pair}`};
  tokenPrices[chain+"|"+normalizeAddress(u.address,chain)]={price:1,source:"Apertum DEX · Stablecoin 1 USD"};
  tokenPrices[chain+"|"+normalizeAddress(wa.address,chain)]={price:aptm,source:`Apertum DEX wAPTM/wUSDT · ${aptmLeg.pair}`};
  const addresses=[...new Set([...(SAFE_ADDRESSES[chain]||[]),...Object.keys(predefinedTokenSymbols).filter(k=>k.startsWith(chain+"|")).map(k=>k.slice(chain.length+1))])];
  for(const addr of addresses){
    const key=chain+"|"+addr,sym=String(predefinedTokenSymbols[key]||"").toUpperCase();
    if(["WUSDT","USDT","WUSDC","USDC"].includes(sym)){tokenPrices[key]={price:1,source:"Apertum DEX · Stablecoin 1 USD"};continue;}
    if(sym==="WAPTM"){tokenPrices[key]={price:aptm,source:`Apertum DEX wAPTM/wUSDT · ${aptmLeg.pair}`};continue;}
    const asset={address:addr,decimals:predefinedTokenDecimals[key]};const bd=await taxTokenDecimalsCurrent(chain,asset);
    try{
      const direct=await apertumCurrentDirectPrice(addr,u.address,bd,ud);
      const via=await apertumCurrentDirectPrice(addr,wa.address,bd,wd);
      const directLiquidity=direct?direct.quoteReserve:0,viaLiquidity=via?via.quoteReserve*aptm:0;
      if(direct&&directLiquidity>=viaLiquidity)tokenPrices[key]={price:direct.price,source:`Apertum DEX ${sym||"Token"}/wUSDT · ${direct.pair}`};
      else if(via)tokenPrices[key]={price:via.price*aptm,source:`Apertum DEX ${sym||"Token"}/wAPTM → wUSDT · ${via.pair} · ${aptmLeg.pair}`};
    }catch(e){console.warn("Apertum Live-Kurs",sym||addr,e);}
  }
}

async function loadNativePrices() {
  const ids = [...new Set(
    Object.entries(CHAIN_META).filter(([chain])=>chain!=="apertum").map(([,m]) => m.coingeckoId)
      .concat(Object.entries(predefinedTokenCoinGeckoIds).filter(([key])=>!key.startsWith("apertum|")).map(([,id])=>id))
      .filter(Boolean)
  )].join(",");

  const alreadyPriced = {}; // "chain|adresse" -> true, deckt USDT/USDC ab (kein Doppel-Fetch via GeckoTerminal)

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    const prices = {};
    Object.keys(CHAIN_META).forEach(chain => {
      if(chain === "apertum") return; // Apertum: ausschließlich On-Chain-Kurse
      const id = CHAIN_META[chain].coingeckoId;
      if (data[id] && typeof data[id].usd === "number") {
        prices[chain] = {
          price: data[id].usd,
          change24h: typeof data[id].usd_24h_change === "number" ? data[id].usd_24h_change : undefined
        };
      }
    });
    nativePrices = prices;

    const tPrices = {};
    Object.keys(SAFE_ADDRESSES).forEach(chain => {
      if(chain === "apertum") return; // Apertum: kein CoinGecko-Fallback
      (SAFE_ADDRESSES[chain] || []).forEach(address => {
        const tokenKey = chain + "|" + address;
        const cgId = predefinedTokenCoinGeckoIds[tokenKey];
        if (cgId && data[cgId] && typeof data[cgId].usd === "number") {
          const key = chain + "|" + address;
          tPrices[key] = {
            price: data[cgId].usd,
            change24h: typeof data[cgId].usd_24h_change === "number" ? data[cgId].usd_24h_change : undefined,
            source: "CoinGecko"
          };
          alreadyPriced[key] = true;
        }
      });
    });
    tokenPrices = tPrices;
  } catch (e) {
    // Kurse sind ein Zusatz - falls das fehlschlägt, laufen Bestände trotzdem normal weiter
    nativePrices = {};
    tokenPrices = {};
  }

  await loadTokenPricesViaGeckoTerminal(alreadyPriced);
  await loadApertumCurrentPrices();
  if(document.getElementById("tab-predefined")?.classList.contains("active")) renderSafeTokenTable();

  // Gebühren-Ansichten können bereits sichtbar sein, während die Kursabfrage noch
  // im Hintergrund läuft. Nach Abschluss nur die betroffenen Ansichten neu rendern
  // (kein Browser-Reload, damit keine neue Lade-Schleife/API-Abfragen entstehen).
  refreshFeePriceViews().catch(e => console.warn("Gebühren-Kursansicht aktualisieren:", e));
}

async function refreshFeePriceViews() {
  if (!currentUser) return;
  await renderFeesSummary();
  const select = document.getElementById("feesWalletSelect");
  const walletId = select ? select.value : "";
  if (!walletId) return;
  const w = wallets.find(x => String(x.id) === String(walletId));
  if (!w) return;
  const rows = await loadFeeCacheForWallet(walletId);
  if (!rows.length) return;
  const results = rows.map(r => ({
    chain:r.chain, totalFee:Number(r.total_fee_native || 0), txCount:Number(r.tx_count || 0),
    cached:true, cachedAt:r.last_scanned_at, source:r.data_source
  }));
  renderFeesResults(w, results);
}

async function loadTokenPricesViaGeckoTerminal(alreadyPriced) {
  // Alle Chains parallel abfragen statt nacheinander - das war der Haupt-Geschwindigkeitsverlust.
  const chainJobs = Object.keys(GECKOTERMINAL_NETWORK).filter(chain=>chain!=="apertum").map(async chain => {
    const network = GECKOTERMINAL_NETWORK[chain];
    const list = (SAFE_ADDRESSES[chain] || [])
      .concat(customSafeTokens.filter(t => t.chain === chain).map(t => t.address))
      .filter((addr, idx, arr) => arr.indexOf(addr) === idx) // Duplikate raus
      .filter(addr => !alreadyPriced[chain + "|" + addr]);

    if (list.length === 0) return;

    // Innerhalb einer Chain bleiben Batches sequenziell (kommt praktisch nie vor,
    // da selten >30 Token pro Chain), aber die Chains selbst laufen jetzt parallel.
    for (let i = 0; i < list.length; i += 30) {
      const batch = list.slice(i, i + 30);
      try {
        const res = await fetch(`https://api.geckoterminal.com/api/v2/simple/networks/${network}/token_price/${batch.join(",")}`);
        if (!res.ok) continue;
        const data = await res.json();
        const attrs = data && data.data && data.data.attributes;
        if (!attrs || !attrs.token_prices) continue;
        Object.keys(attrs.token_prices).forEach(addr => {
          const price = parseFloat(attrs.token_prices[addr]);
          if (!isFinite(price)) return;
          const changeRaw = attrs.h24_price_change_percentage ? attrs.h24_price_change_percentage[addr] : undefined;
          const change = changeRaw !== undefined ? parseFloat(changeRaw) : undefined;
          const key = chain + "|" + normalizeAddress(addr, chain);
          tokenPrices[key] = {
            price,
            change24h: isFinite(change) ? change : undefined,
            source: "GeckoTerminal (DEX)"
          };
        });
      } catch (e) {
        // Fehler bei einer Chain sollen die anderen nicht blockieren
      }
    }
  });
  await Promise.all(chainJobs);
}



function fmtUsd(n) {
  return "$" + Number(n).toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPrice(n) {
  return "$" + Number(n).toLocaleString('de-CH', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
}

// ---- Wallet-Verwaltung (Supabase-gestützt) ----
let walletCounter = 0;
let wallets = [];
let walletData = {}; // id -> { eth:{native, tokens}|{error}, bsc:{...}, matic:{...}, btc:{...}, xrp:{...}, sol:{...} }

function newWallet(label, evm, btc, xrp, sol, tron, akash, dbId) {
  walletCounter++;
  return {
    id: dbId || ("local" + walletCounter), dbId: dbId || null,
    label: label || ("Wallet " + walletCounter),
    evm: evm || "", btc: btc || "", xrp: xrp || "", sol: sol || "", tron: tron || "", akash: akash || ""
  };
}

// Zentrale Sortierung nach Wallet-Bezeichnung (alphabetisch) - nach jeder Änderung
// aufgerufen, damit ALLE Stellen (Liste, "Gehe zu Wallet", Details je Wallet,
// Discovery-Dropdown) automatisch konsistent sortiert bleiben.
function sortWalletsByLabel() {
  wallets.sort((a, b) => a.label.localeCompare(b.label, "de"));
}

async function loadWalletsFromDb() {
  const { data, error } = await sb.from("wallets").select("*").order("created_at");
  if (error) { console.error(error); wallets = []; return; }
  wallets = data.map(row => newWallet(row.label, row.evm_address, row.btc_address, row.xrp_address, row.sol_address, row.tron_address, row.akash_address, row.id));
  sortWalletsByLabel();
}

function addWallet() {
  wallets.push(newWallet());
  sortWalletsByLabel();
  renderWalletInputs();
}

async function removeWallet(id) {
  const w = wallets.find(w => w.id === id);
  if (w && w.dbId) {
    await sb.from("wallets").delete().eq("id", w.dbId);
  }
  wallets = wallets.filter(w => w.id !== id);
  delete walletData[id];
  renderWalletInputs();
  renderResults();
}

function updateWalletField(id, field, value) {
  const w = wallets.find(w => w.id === id);
  if (w) w[field] = value;
  updateAllValidationIcons();
}

async function saveWallet(id) {
  const w = wallets.find(w => w.id === id);
  if (!w) return;
  const statusEl = document.getElementById("saveStatus-" + id);

  const invalidFields = ["evm", "btc", "xrp", "sol", "tron", "akash"].filter(f => w[f] && !isValidAddressFormat(f, w[f]));
  if (invalidFields.length > 0) {
    alert("Ungültiges Adressformat bei: " + invalidFields.join(", ") + ". Bitte korrigieren, bevor du speicherst.");
    return;
  }

  const dupeFields = ["evm", "btc", "xrp", "sol", "tron", "akash"].filter(f => findDuplicateWalletLabels(f, w[f], id).length > 0);
  if (dupeFields.length > 0) {
    if (!confirm("Diese Wallet hat dieselbe Adresse wie eine andere erfasste Wallet (" + dupeFields.join(", ") + "). Trotzdem speichern?")) {
      return;
    }
  }

  if (statusEl) statusEl.textContent = "Speichere...";

  const payload = {
    user_id: currentUser.id,
    label: w.label,
    evm_address: w.evm,
    btc_address: w.btc,
    xrp_address: w.xrp,
    sol_address: w.sol,
    tron_address: w.tron,
    akash_address: w.akash
  };

  if (w.dbId) {
    const { error } = await sb.from("wallets").update(payload).eq("id", w.dbId);
    if (statusEl) statusEl.textContent = error ? "Fehler: " + error.message : "Gespeichert.";
  } else {
    const { data, error } = await sb.from("wallets").insert(payload).select().single();
    if (error) {
      if (statusEl) statusEl.textContent = "Fehler: " + error.message;
    } else {
      w.dbId = data.id;
      w.id = data.id;
      if (statusEl) statusEl.textContent = "Gespeichert.";
    }
  }
  sortWalletsByLabel();
  renderWalletInputs();
  loadAll();
}

// Format-Validierung pro Chain (Länge/Präfix/Zeichensatz) - rein strukturell, keine
// Checksum-Prüfung, aber fängt Tippfehler und falsch eingefügte Adressen zuverlässig ab.
function isValidAddressFormat(field, value) {
  if (!value) return true; // leer = nichts zu prüfen
  const v = value.trim();
  switch (field) {
    case "evm":
      return /^0x[0-9a-fA-F]{40}$/.test(v);
    case "tron":
      return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(v);
    case "sol":
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v);
    case "xrp":
      return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(v);
    case "btc":
      return /^(bc1[0-9a-z]{25,62}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/i.test(v);
    case "akash":
      return /^akash1[02-9ac-hj-np-z]{38}$/.test(v);
    default:
      return true;
  }
}

// Prüft, ob eine Wallet-Adresse in einem anderen Wallet-Eintrag doppelt vorkommt.
// EVM-Adressen werden gross-/kleinschreibungsunabhängig verglichen (Standard bei EVM),
// alle anderen (Tron, Bitcoin, XRP, Solana) exakt - dort ist Gross-/Kleinschreibung relevant.
function walletFieldsMatch(field, a, b) {
  if (!a || !b) return false;
  if (field === "evm") return a.trim().toLowerCase() === b.trim().toLowerCase();
  return a.trim() === b.trim();
}

function findDuplicateWalletLabels(field, value, excludeId) {
  if (!value) return [];
  return wallets.filter(w => w.id !== excludeId && walletFieldsMatch(field, w[field], value)).map(w => w.label);
}

function renderValidationIconInner(field, value, walletId) {
  if (!value) return "";
  if (!isValidAddressFormat(field, value)) {
    return `<span style="color:var(--danger);font-size:0.75rem;display:block;margin-top:3px">✗ Ungültiges Adressformat</span>`;
  }
  const dupes = findDuplicateWalletLabels(field, value, walletId);
  if (dupes.length > 0) {
    return `<span style="color:var(--danger);font-size:0.75rem;display:block;margin-top:3px">✗ Doppelt (auch bei: ${escapeAttr(dupes.join(", "))})</span>`;
  }
  return `<span style="color:#46c878;font-size:0.75rem;display:block;margin-top:3px">✓ eindeutig</span>`;
}

// Leichte Update-Funktion (nur die Icon-Spans, nicht die ganzen Eingabefelder neu rendern) -
// sonst würde bei jedem Tastenanschlag der Fokus aus dem Eingabefeld springen.
function updateAllValidationIcons() {
  ["evm", "btc", "xrp", "sol", "tron", "akash"].forEach(field => {
    wallets.forEach(w => {
      const el = document.getElementById(`dup-${w.id}-${field}`);
      if (el) el.innerHTML = renderValidationIconInner(field, w[field], w.id);
    });
  });
}

function renderEvmWalletChainsNote(){
  const el=document.getElementById("evmWalletChainsNote");
  if(!el)return;
  const labels=Object.keys(CHAIN_CONFIG)
    .filter(c=>CHAIN_CONFIG[c]?.walletType==="evm")
    .map(c=>CHAIN_META[c]?.label||c);
  el.textContent=labels.length
    ? `EVM-Adresse gilt für: ${labels.join(", ")} – sie ist bei allen diesen EVM-Chains dieselbe Adresse.`
    : "Aktuell sind keine EVM-Chains konfiguriert.";
}

function renderWalletInputs() {
  const container = document.getElementById("walletInputsContainer");
  container.innerHTML = wallets.map(w => `
    <div class="wallet-input-card">
      <div class="wallet-input-head">
        <input type="text" value="${escapeAttr(w.label)}" oninput="updateWalletField('${w.id}','label',this.value)" />
        <button class="remove" onclick="removeWallet('${w.id}')">Entfernen</button>
      </div>
      <div class="field-grid">
        <div>
          <span class="field-label">EVM-Adresse</span>
          <input type="text" value="${escapeAttr(w.evm)}" oninput="updateWalletField('${w.id}','evm',this.value)" placeholder="0x..." />
          <div id="dup-${w.id}-evm">${renderValidationIconInner("evm", w.evm, w.id)}</div>
        </div>
        <div>
          <span class="field-label">Bitcoin-Adresse</span>
          <input type="text" value="${escapeAttr(w.btc)}" oninput="updateWalletField('${w.id}','btc',this.value)" placeholder="bc1... / 1... / 3..." />
          <div id="dup-${w.id}-btc">${renderValidationIconInner("btc", w.btc, w.id)}</div>
        </div>
        <div>
          <span class="field-label">XRP-Adresse</span>
          <input type="text" value="${escapeAttr(w.xrp)}" oninput="updateWalletField('${w.id}','xrp',this.value)" placeholder="r..." />
          <div id="dup-${w.id}-xrp">${renderValidationIconInner("xrp", w.xrp, w.id)}</div>
        </div>
        <div>
          <span class="field-label">Solana-Adresse</span>
          <input type="text" value="${escapeAttr(w.sol)}" oninput="updateWalletField('${w.id}','sol',this.value)" placeholder="Base58-Adresse" />
          <div id="dup-${w.id}-sol">${renderValidationIconInner("sol", w.sol, w.id)}</div>
        </div>
        <div>
          <span class="field-label">Tron-Adresse</span>
          <input type="text" value="${escapeAttr(w.tron)}" oninput="updateWalletField('${w.id}','tron',this.value)" placeholder="T..." />
          <div id="dup-${w.id}-tron">${renderValidationIconInner("tron", w.tron, w.id)}</div>
        </div>
        <div>
          <span class="field-label">Akash-Adresse</span>
          <input type="text" value="${escapeAttr(w.akash)}" oninput="updateWalletField('${w.id}','akash',this.value)" placeholder="akash1..." />
          <div id="dup-${w.id}-akash">${renderValidationIconInner("akash", w.akash, w.id)}</div>
        </div>
      </div>
      <div class="action-row" style="margin:10px 0 0;align-items:center">
        <button onclick="saveWallet('${w.id}')">Speichern</button>
        <span id="saveStatus-${w.id}" class="note" style="margin:0"></span>
      </div>
    </div>
  `).join("");
}

function escapeAttr(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// ---- Datenabruf ----

// EVM-Bestände werden in Phase 1 vollständig über kostenlose öffentliche RPCs geladen.
// Kein Etherscan/Moralis/Alchemy wird für das normale Wallet-Tracking benötigt.

// Generische EVM-RPC-Hilfsfunktionen (für gezielte Balance-Abfrage bekannter Token-Adressen)
async function evmRpcCall(rpcUrl, method, params) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error("RPC HTTP " + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
  } catch (e) {
    if (e && e.name === "AbortError") throw new Error("RPC Timeout");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

function decodeAbiString(hex) {
  if (!hex || hex === "0x") return "";
  try {
    const data = hex.slice(2);
    const lengthHex = data.slice(64, 128);
    const length = parseInt(lengthHex, 16);
    const strHex = data.slice(128, 128 + length * 2);
    const bytes = new Uint8Array(strHex.length / 2);
    for (let i = 0; i < strHex.length; i += 2) {
      bytes[i / 2] = parseInt(strHex.substr(i, 2), 16);
    }
    const str = new TextDecoder("utf-8").decode(bytes);
    return str.replace(/\0/g, "").trim();
  } catch (e) {
    return "";
  }
}

async function fetchNativeViaRpc(rpcUrl, address) {
  const result = await evmRpcCall(rpcUrl, "eth_getBalance", [address, "latest"]);
  return Number(BigInt(result)) / 1e18;
}

// Bündelt mehrere eth_call-Anfragen in einer einzigen HTTP-Anfrage (JSON-RPC Batch),
// statt für jeden Token einzeln zum Server zu gehen - das ist der Haupt-Geschwindigkeitshebel.
async function evmRpcBatch(rpcUrl, calls) {
  if (calls.length === 0) return [];

  // Kleine Batches sind bei öffentlichen RPCs stabiler als ein sehr großer Request.
  const MAX_CALLS = 40;
  if (calls.length > MAX_CALLS) {
    const all = [];
    for (let i = 0; i < calls.length; i += MAX_CALLS) {
      const part = await evmRpcBatch(rpcUrl, calls.slice(i, i + MAX_CALLS));
      all.push(...part);
      if (i + MAX_CALLS < calls.length) await new Promise(r => setTimeout(r, 80));
    }
    return all;
  }

  const body = calls.map((c, i) => ({
    jsonrpc: "2.0",
    id: i,
    method: "eth_call",
    params: [{ to: c.to, data: c.data }, "latest"]
  }));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!res.ok) throw new Error("RPC HTTP " + res.status);
    const data = await res.json();
    const arr = Array.isArray(data) ? data : [data];
    const byId = {};
    arr.forEach(d => { byId[d.id] = d; });
    return calls.map((c, i) => {
      const d = byId[i];
      if (!d || d.error) return null;
      return d.result;
    });
  } catch (e) {
    if (e && e.name === "AbortError") throw new Error("RPC Timeout");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

// Cache für Dezimalstellen/Symbol pro Chain+Adresse - diese ändern sich nie,
// darum werden sie nur einmal abgefragt statt für jede Wallet neu. Wird dauerhaft
// in localStorage gespeichert: nach dem allerersten Laden entfällt dieser Abruf
// bei jedem weiteren Seitenaufruf komplett, auch nach einem Browser-Neustart.
const TOKEN_META_CACHE_KEY = "tokenMetaCache";
const TOKEN_META_CACHE_VERSION_KEY = "tokenMetaCacheVersion";
const TOKEN_META_CACHE_VERSION = 3; // hochzählen, wenn sich das Cache-Format/die Dekodierung ändert
let tokenMetaCache = {};

function loadTokenMetaCache() {
  try {
    const storedVersion = localStorage.getItem(TOKEN_META_CACHE_VERSION_KEY);
    if (storedVersion !== String(TOKEN_META_CACHE_VERSION)) {
      // Alter/fehlerhafter Cache (z.B. falsch dekodierte Sonderzeichen) - verwerfen und neu aufbauen
      localStorage.removeItem(TOKEN_META_CACHE_KEY);
      localStorage.setItem(TOKEN_META_CACHE_VERSION_KEY, String(TOKEN_META_CACHE_VERSION));
      tokenMetaCache = {};
      return;
    }
    const raw = localStorage.getItem(TOKEN_META_CACHE_KEY);
    tokenMetaCache = raw ? JSON.parse(raw) : {};
  } catch (e) {
    tokenMetaCache = {};
  }
}

function saveTokenMetaCache() {
  try {
    localStorage.setItem(TOKEN_META_CACHE_KEY, JSON.stringify(tokenMetaCache));
  } catch (e) {
    // localStorage evtl. nicht verfügbar - dann gilt der Cache nur für diese Sitzung
  }
}

// Lädt ERC-20-Metadaten auch für historisch gefundene Token ohne aktuellen Bestand.
// Dadurch zeigt Discovery nicht nur die Contract-Adresse, sondern Symbol/Name/Decimals.
async function fetchEvmTokenMetadata(chain, addresses) {
  const unique=[...new Set((addresses||[]).map(a=>normalizeAddress(a,chain)).filter(a=>/^0x[0-9a-f]{40}$/i.test(a)))];
  const out={};
  for(let start=0;start<unique.length;start+=30){
    const chunk=unique.slice(start,start+30),calls=[],plan=[];
    chunk.forEach((a,idx)=>{
      const k=chain+"|"+a,cached=tokenMetaCache[k]||{};
      if(cached.symbol&&cached.name&&Number.isFinite(Number(cached.decimals))){out[a]=cached;return;}
      calls.push({to:a,data:"0x313ce567"});plan.push({idx,type:"decimals"});
      calls.push({to:a,data:"0x95d89b41"});plan.push({idx,type:"symbol"});
      calls.push({to:a,data:"0x06fdde03"});plan.push({idx,type:"name"});
    });
    if(!calls.length)continue;
    try{
      const results=await evmRpcBatch(configuredRpcUrl(chain),calls),per=chunk.map(()=>({}));
      results.forEach((hex,i)=>{const x=plan[i];per[x.idx][x.type]=hex;});
      chunk.forEach((a,idx)=>{
        const k=chain+"|"+a,old=tokenMetaCache[k]||{},x=per[idx];
        const dec=x.decimals&&x.decimals!=="0x"?parseInt(x.decimals,16):Number(old.decimals);
        const meta={decimals:Number.isFinite(dec)?dec:(predefinedTokenDecimals[k]??18),symbol:decodeAbiString(x.symbol)||old.symbol||predefinedTokenSymbols[k]||a.slice(0,8)+"…",name:decodeAbiString(x.name)||old.name||predefinedTokenNames[k]||null};
        tokenMetaCache[k]=meta;out[a]=meta;
      });
      saveTokenMetaCache();
    }catch(e){console.warn("Token-Metadaten",chain,e);}
  }
  unique.forEach(a=>{if(!out[a]&&tokenMetaCache[chain+"|"+a])out[a]=tokenMetaCache[chain+"|"+a];});
  return out;
}

// Prüft gezielt die Balance der sicheren + selbst erfassten Token für eine Chain,
// gebündelt in möglichst wenigen Anfragen (kein Auto-Discovery unbekannter Token,
// siehe Erklärung im Chat).
async function fetchKnownTokenBalances(rpcUrl, address, chain) {
  const list = (SAFE_ADDRESSES[chain] || []).map(a => ({ address: a, label: null }))
    .concat(customSafeTokens.filter(t => t.chain === chain).map(t => ({ address: t.address, label: t.label })));

  const seen = new Set();
  const unique = list.filter(t => {
    if (seen.has(t.address)) return false;
    seen.add(t.address);
    return true;
  });
  if (unique.length === 0) return [];

  // Balance IMMER abfragen, Dezimalstellen/Symbol nur für noch nicht gecachte Token -
  // alles zusammen in einer einzigen Anfrage (ein Netzwerk-Umlauf statt zwei).
  const balanceData = "0x70a08231" + address.toLowerCase().replace("0x", "").padStart(64, "0");
  const calls = [];
  const plan = []; // parallel zu calls: was die jeweilige Antwort bedeutet

  unique.forEach((t, idx) => {
    calls.push({ to: t.address, data: balanceData });
    plan.push({ idx, type: "balance" });

    const cacheKey = chain + "|" + t.address;
    if (!tokenMetaCache[cacheKey]) {
      calls.push({ to: t.address, data: "0x313ce567" });
      plan.push({ idx, type: "decimals" });
      calls.push({ to: t.address, data: "0x95d89b41" });
      plan.push({ idx, type: "symbol" });
    }
  });

  const results = await evmRpcBatch(rpcUrl, calls);

  const perToken = unique.map(() => ({}));
  results.forEach((hex, i) => {
    const { idx, type } = plan[i];
    perToken[idx][type] = hex;
  });

  const withBalance = [];
  let cacheChanged = false;
  unique.forEach((t, idx) => {
    const hex = perToken[idx].balance;
    if (!hex || hex === "0x") return;
    const raw = BigInt(hex);
    if (raw <= 0n) return;

    const cacheKey = chain + "|" + t.address;
    if (!tokenMetaCache[cacheKey]) {
      const decHex = perToken[idx].decimals;
      const decimals = decHex && decHex !== "0x" ? parseInt(decHex, 16) : 18;
      const symbol = t.label || decodeAbiString(perToken[idx].symbol) || (t.address.slice(0, 8) + "…");
      tokenMetaCache[cacheKey] = { decimals, symbol };
      cacheChanged = true;
    }
    const meta = tokenMetaCache[cacheKey];
    withBalance.push({
      symbol: meta.symbol,
      address: t.address,
      amount: Number(raw) / Math.pow(10, meta.decimals)
    });
  });
  if (cacheChanged) saveTokenMetaCache();

  return withBalance;
}

async function fetchEvmAddressInfo(chain, rpcUrl, address) {
  // Nativer Coin + ausschließlich vordefinierte/eigene sichere Token.
  const [native, tokens] = await Promise.all([
    fetchNativeViaRpc(rpcUrl, address),
    fetchKnownTokenBalances(rpcUrl, address, chain)
  ]);
  return { native, tokens };
}

function configuredBalanceBase(chain) {
  const cfg = CHAIN_CONFIG[chain] || {};
  const base = cfg.balanceApiBase || cfg.rpcUrl;
  if (!cfg.balanceProvider || !base) {
    throw new Error(`${CHAIN_META[chain]?.label || chain}: Balance-Provider/API-Basis fehlt in public.chains`);
  }
  return base.replace(/\/+$/, "");
}

async function fetchBitcoinBalance(chain, address) {
  const base = configuredBalanceBase(chain);
  const res = await fetch(`${base}/address/${address}`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  const funded = data.chain_stats.funded_txo_sum + data.mempool_stats.funded_txo_sum;
  const spent = data.chain_stats.spent_txo_sum + data.mempool_stats.spent_txo_sum;
  return (funded - spent) / 1e8;
}

async function fetchXrpBalance(chain, address) {
  const base = configuredBalanceBase(chain);
  const res = await fetch(`${base}/account/${address}`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  if (data.xrpBalance === undefined) throw new Error("Keine Balance gefunden");
  return parseFloat(data.xrpBalance);
}

const SOLANA_TOKEN_PROGRAMS = [
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
];

async function solanaRpc(chain,method,params){
  const cfg=CHAIN_CONFIG[chain]||{};
  if(String(cfg.archiveRpcProvider||"").toLowerCase()!=="alchemy"||!cfg.archiveRpcUrl)throw new Error(`${CHAIN_META[chain]?.label||chain}: Alchemy-Solana-RPC ist in public.chains nicht konfiguriert.`);
  return archiveRpc(chain,method,params);
}


async function fetchSolanaAddressInfo(chain, address) {
  const [balanceResult, ...tokenResults] = await Promise.all([
    solanaRpc(chain, "getBalance", [address]),
    ...SOLANA_TOKEN_PROGRAMS.map(programId =>
      solanaRpc(chain, "getTokenAccountsByOwner", [
        address,
        { programId },
        { encoding:"jsonParsed", commitment:"confirmed" }
      ]).catch(e => {
        console.warn("Solana Token-Programm konnte nicht gelesen werden:", programId, e);
        return { value:[] };
      })
    )
  ]);

  const native = Number(balanceResult?.value || 0) / 1e9;
  const byMint = new Map();

  tokenResults.forEach(result => {
    (result?.value || []).forEach(row => {
      const info = row?.account?.data?.parsed?.info;
      const mint = info?.mint;
      const ta = info?.tokenAmount;
      if (!mint || !ta) return;

      const amount = ta.uiAmount !== null && ta.uiAmount !== undefined
        ? Number(ta.uiAmount)
        : Number(ta.uiAmountString || 0);
      if (!Number.isFinite(amount) || amount <= 0) return;

      const previous = byMint.get(mint);
      if (previous) {
        previous.amount += amount;
      } else {
        byMint.set(mint, {
          address: mint,
          symbol: mint.slice(0, 6) + "…" + mint.slice(-4),
          name: null,
          decimals: Number(ta.decimals || 0),
          amount
        });
      }
    });
  });

  return { native, tokens:[...byMint.values()] };
}

async function fetchSolanaBalance(chain, address) {
  const result = await solanaRpc(chain, "getBalance", [address]);
  return Number(result?.value || 0) / 1e9;
}

// ---- Tron (native TRX, vorerst ohne TRC20-Token) ----
// ---- Tron: nativer TRX-Bestand + sichere TRC20-Token (z.B. USDT-TRC20) ----
// Bekannte TRC20-Dezimalstellen - TronGrid liefert nur den rohen Betrag, keine Dezimalstellen.
// Deckt aktuell die grossen Stablecoins ab (alle 6 Dezimalstellen, Branchenstandard).
const TRON_TOKEN_DECIMALS_DEFAULT = 6;


async function fetchAkashBalance(chain, address) {
  // Akash Mainnet REST/LCD (Cosmos SDK Bank-Modul). AKT ist on-chain als uakt
  // mit 6 Dezimalstellen denominiert.
  const base = configuredBalanceBase(chain);
  const res = await fetch(`${base}/cosmos/bank/v1beta1/balances/${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  const balance = (data.balances || []).find(b => b.denom === "uakt");
  return balance ? Number(balance.amount || 0) / 1e6 : 0;
}

async function fetchTronAddressInfo(chain, address) {
  const base = configuredBalanceBase(chain);
  const res = await fetch(`${base}/v1/accounts/${address}`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Unbekannter Fehler");
  const account = (data.data || [])[0];
  const native = account && account.balance ? account.balance / 1e6 : 0;

  // Volle Liste (nicht vorab gefiltert) - so kann sowohl die normale Ansicht (nur sichere
  // Token, siehe chainRows) als auch die "Entdecken"-Funktion (auch unsichere Token) darauf zugreifen.
  const tokens = [];
  const trc20List = (account && account.trc20) || [];
  trc20List.forEach(entry => {
    const contractAddress = Object.keys(entry)[0];
    const rawStr = entry[contractAddress];
    if (!contractAddress || !rawStr) return;

    const raw = BigInt(rawStr);
    if (raw <= 0n) return;

    const normalizedContract = normalizeAddress(contractAddress, "tron");
    if (!isSafeTokenAddress(normalizedContract, "tron")) return;
    const custom = customSafeTokens.find(t => t.chain === "tron" && t.address === normalizedContract);
    const label = predefinedTokenLabels["tron|" + normalizedContract] || (custom ? custom.label : null) || (contractAddress.slice(0, 8) + "…");
    tokens.push({
      symbol: label,
      address: normalizedContract,
      amount: Number(raw) / Math.pow(10, TRON_TOKEN_DECIMALS_DEFAULT)
    });
  });

  return { native, tokens };
}

// ---- Apertum (EVM, chain-id 2786) ----
// Der kostenlose Blockscout-Explorer liefert die Wallet-Tokenliste; fürs normale
// Tracking übernehmen wir daraus ausschließlich vordefinierte/eigene sichere Token.
async function fetchApertumAddressInfo(chain, address) {
  const base = configuredBalanceBase(chain);
  const [balRes, tokRes] = await Promise.all([
    fetch(`${base}/addresses/${address}`),
    fetch(`${base}/addresses/${address}/tokens?type=ERC-20`)
  ]);
  if (!balRes.ok) throw new Error("HTTP " + balRes.status + " (Balance)");
  const balData = await balRes.json();
  const native = balData.coin_balance ? Number(BigInt(balData.coin_balance)) / 1e18 : 0;

  let tokens = [];
  if (tokRes.ok) {
    const tokData = await tokRes.json();
    tokens = (tokData.items || [])
      .filter(item => item.token)
      .map(item => {
        const decimals = parseInt(item.token.decimals || "18", 10);
        const raw = BigInt(item.value || "0");
        return {
          symbol: item.token.symbol || item.token.name || "?",
          address: (item.token.address || "").toLowerCase(),
          amount: Number(raw) / Math.pow(10, decimals)
        };
      })
      .filter(t => t.amount >= DUST_THRESHOLD && isSafeTokenAddress(t.address, chain));
  }
  return { native, tokens };
}

function walletAddressForChain(wallet, chain) {
  const type = CHAIN_CONFIG[chain]?.walletType;
  const fields = { evm:"evm", btc:"btc", xrp:"xrp", sol:"sol", tron:"tron", akash:"akash" };
  const field = fields[type];
  return field ? wallet?.[field] : null;
}

async function loadWalletChain(wallet, chain, preserveCachedOnError = false) {
  walletData[wallet.id] = walletData[wallet.id] || {};
  const previous = walletData[wallet.id][chain];
  const cfg = CHAIN_CONFIG[chain] || {};
  const address = walletAddressForChain(wallet, chain);

  if (!address) {
    delete walletData[wallet.id][chain];
    return { ok:true, skipped:true };
  }

  try {
    let native = 0;
    let tokens = [];

    switch (cfg.balanceProvider) {
      case "evm_rpc": {
        const r = await fetchEvmAddressInfo(chain, configuredRpcUrl(chain), address);
        native = r.native; tokens = r.tokens || [];
        break;
      }
      case "blockscout": {
        const r = await fetchApertumAddressInfo(chain, address);
        native = r.native; tokens = r.tokens || [];
        break;
      }
      case "blockstream":
        native = await fetchBitcoinBalance(chain, address);
        break;
      case "xrpscan":
        native = await fetchXrpBalance(chain, address);
        break;
      case "solana_rpc": {
        const r = await fetchSolanaAddressInfo(chain, address);
        native = r.native; tokens = r.tokens || [];
        break;
      }
      case "trongrid": {
        const r = await fetchTronAddressInfo(chain, address);
        native = r.native; tokens = r.tokens || [];
        break;
      }
      case "akash_rest":
        native = await fetchAkashBalance(chain, address);
        break;
      default:
        throw new Error(`Balance-Provider "${cfg.balanceProvider || "–"}" ist nicht implementiert`);
    }

    walletData[wallet.id][chain] = {
      native,
      nativeSymbol: NATIVE_SYMBOL[chain] || chain.toUpperCase(),
      tokens
    };
    return { ok:true };
  } catch (err) {
    if (preserveCachedOnError && previous && !previous.error) {
      walletData[wallet.id][chain] = previous;
    } else {
      walletData[wallet.id][chain] = { error:err.message };
    }
    return { ok:false, error:err.message };
  }
}

async function loadAll(options = {}) {
  const automatic = !!options.automatic;
  const btn = document.getElementById("loadBtn");
  if (btn) btn.disabled = true;
  renderCacheStatusNote(automatic ? "Prüfe Bestände live…" : "Lade Bestände live…");

  // Externe Preise + Projektpreise parallel laden. Bei identischer Contract-Adresse
  // gewinnt priceForToken() anschließend immer der Projektpreis.
  const priceJob = Promise.all([
    loadNativePrices().catch(e => console.warn("Preisabruf:", e)),
    window.TLNVOWProject ? window.TLNVOWProject.ensureLoaded().catch(e => console.warn("TLN/VOW:", e)) : Promise.resolve()
  ]);

  const chainJobs = [];
  const configuredChains = Object.keys(CHAIN_CONFIG).filter(chain => !!CHAIN_CONFIG[chain]?.balanceProvider);
  wallets.forEach(w => {
    configuredChains.forEach(chain => {
      chainJobs.push(loadWalletChain(w, chain, automatic));
    });
  });

  const results = await Promise.all(chainJobs);
  await priceJob;

  // V2-LP/PCLP in normalen Token-Beständen erkennen und mit Underlyings/Pool-Anteil bewerten.
  if(window.WalletLPEngine){
    for(const w of wallets){for(const chain of Object.keys(walletData[w.id]||{})){const cd=walletData[w.id]?.[chain];if(!cd?.tokens||!w.evm)continue;for(const t of cd.tokens){try{const p=await window.WalletLPEngine.pairInfo(chain,t.address);if(!p)continue;const pos=(await window.WalletLPEngine.positions(chain,w.evm,[t.address]))[0];if(pos)t.lpInfo=pos;}catch{}}}}
  }

  renderResults();
  renderSafeTokenTable();
  renderCustomTokenList();
  renderAllocationChart();
  if (btn) btn.disabled = false;

  const failures = results.filter(r => r && r.ok === false);

  // Den automatischen Snapshot nur ersetzen, wenn ALLE tatsächlich abgefragten
  // Chains erfolgreich waren. So bleibt der letzte vollständige Stand als Fallback erhalten.
  if (failures.length === 0) {
    await createSnapshot(true);
    renderCacheStatusNote(automatic ? "Bestände gerade eben automatisch live aktualisiert." : "Gerade eben live aktualisiert.");
  } else {
    const failedCount = failures.length;
    renderCacheStatusNote(
      `Live-Aktualisierung teilweise fehlgeschlagen (${failedCount} Abfrage${failedCount === 1 ? "" : "n"}). ` +
      `Für betroffene Chains bleibt der letzte gespeicherte Stand sichtbar.`
    );
  }

  return { failures };
}

// ---- Rendering ----
function badge(safe) {
  return safe
    ? `<span class="badge safe">sicher</span>`
    : `<span class="badge unsafe">ungeprüft</span>`;
}

function fmt(n) {
  return Number(n).toLocaleString('de-CH', { maximumFractionDigits: 6 });
}

// Nur noch echte Nullen/Rundungsrauschen gelten als Staub - Token mit z.B. 18
// Dezimalstellen können einen realen, aber winzigen Bestand haben (bis zur 18. Stelle),
// der nicht fälschlich ausgeblendet werden soll.
const DUST_THRESHOLD = 1e-25;

// Kurs für Token-Zeilen anhand des Symbols (nur exaktes USDT/USDC, siehe oben)
function priceForToken(chain, address) {
  if (!address) return null;
  const normalized = normalizeAddress(address, chain);

  // Projektpreise haben Vorrang – Zuordnung AUSSCHLIESSLICH über Contract-Adresse.
  // Kein Symbol-/Namens-Matching.
  if (window.TLNVOWProject) {
    const projectPrice = window.TLNVOWProject.getPrice(chain, normalized);
    if (projectPrice) return projectPrice;
  }

  const key = chain + "|" + normalized;
  return tokenPrices[key] || null;
}

function chainRows(chainData, chainKey) {
  if (!chainData) return null;
  if (chainData.error) return { error: chainData.error };
  const rows = [];
  if (chainData.native !== null && chainData.native !== undefined && chainData.native >= DUST_THRESHOLD) {
    const p = nativePrices[chainKey];
    rows.push({
      symbol: chainData.nativeSymbol + " (nativ)",
      amount: chainData.native,
      safe: true,
      isNative: true,
      price: p ? p.price : undefined,
      change24h: p ? p.change24h : undefined,
      source: p ? "CoinGecko" : undefined,
      usdValue: p ? chainData.native * p.price : undefined
    });
  }
  (chainData.tokens || []).forEach(t => {
    const safe = isSafeTokenAddress(t.address, chainKey);
    if (t.amount >= DUST_THRESHOLD && safe) {
      const p = priceForToken(chainKey, t.address);
      rows.push({
        symbol: t.symbol,
        amount: t.amount,
        safe,
        isNative: false,
        address: t.address,
        price: p ? p.price : undefined,
        change24h: p ? p.change24h : undefined,
        source: t.lpInfo ? `${t.lpInfo.lpLabel} · ${t.lpInfo.t0.symbol}/${t.lpInfo.t1.symbol}` : (p ? p.source : undefined),
        lpInfo: t.lpInfo || null,
        price: t.lpInfo && t.amount>0 && t.lpInfo.usd!=null ? t.lpInfo.usd/t.amount : (p ? p.price : undefined),
        usdValue: t.lpInfo?.usd != null ? t.lpInfo.usd : (p ? t.amount * p.price : undefined)
      });
    }
  });
  return { rows };
}

function fmtChange(pct) {
  if (pct === undefined || pct === null || isNaN(pct)) {
    return '<span style="color:var(--muted)">–</span>';
  }
  const positive = pct >= 0;
  const color = positive ? "#46c878" : "var(--danger)";
  const sign = positive ? "+" : "";
  return `<span style="color:${color}">${sign}${pct.toFixed(2)}%</span>`;
}

// ---- Snapshots (Token-Bestand zu einem Zeitpunkt) ----
let snapshots = []; // [{id, createdAt, visible, items: [...]}]

async function loadSnapshotsFromDb() {
  const { data: snapRows, error: e1 } = await sb.from("snapshots").select("*").eq("is_automated", false).order("created_at", { ascending: false });
  if (e1) { console.error(e1); snapshots = []; return; }
  const { data: itemRows, error: e2 } = await sb.from("snapshot_items").select("*");
  if (e2) console.error(e2);
  const byId = {};
  (itemRows || []).forEach(it => {
    byId[it.snapshot_id] = byId[it.snapshot_id] || [];
    byId[it.snapshot_id].push(it);
  });
  const prevVisibility = {};
  snapshots.forEach(s => { prevVisibility[s.id] = s.visible; });
  snapshots = (snapRows || []).map(s => ({
    id: s.id,
    createdAt: s.created_at,
    visible: prevVisibility.hasOwnProperty(s.id) ? prevVisibility[s.id] : true,
    items: byId[s.id] || []
  }));
}

// ---- Automatisierter Tages-Cache (Bestände) ----
// Rekonstruiert walletData je Wallet + Chain aus dem automatisierten Snapshot, statt live abzufragen.
// Gibt den Zeitstempel des Snapshots zurück (für die "zuletzt geladen"-Anzeige) oder null,
// falls noch kein Cache existiert (z.B. beim allerersten Login).
async function loadFromAutomatedCache() {
  const { data: snap, error: e1 } = await sb.from("snapshots").select("*").eq("user_id", currentUser.id).eq("is_automated", true).maybeSingle();
  if (e1) { console.error(e1); return null; }
  if (!snap) return null;

  const { data: items, error: e2 } = await sb.from("snapshot_items").select("*").eq("snapshot_id", snap.id);
  if (e2) { console.error(e2); return null; }

  // Snapshot-Items wieder den aktuell geladenen Wallet-Objekten zuordnen.
  // Primär über die stabile DB-ID, zusätzlich über das gespeicherte Wallet-Label als
  // Fallback (z.B. falls eine Wallet zwischenzeitlich neu gespeichert wurde).
  const byWalletChain = {};
  wallets.forEach(w => { byWalletChain[w.id] = {}; });

  (items || []).forEach(it => {
    const matchingWallet = wallets.find(w =>
      (w.dbId && String(w.dbId) === String(it.wallet_id)) ||
      (it.wallet_label && w.label === it.wallet_label)
    );
    if (!matchingWallet) return;

    const walletKey = matchingWallet.id;
    byWalletChain[walletKey] = byWalletChain[walletKey] || {};
    const entry = byWalletChain[walletKey][it.chain] =
      byWalletChain[walletKey][it.chain] || { native: null, nativeSymbol: null, tokens: [] };

    if (it.is_native) {
      entry.native = Number(it.amount);
      entry.nativeSymbol = (it.symbol || "").replace(" (nativ)", "");
    } else {
      entry.tokens.push({ symbol: it.symbol, address: it.address, amount: Number(it.amount) });
    }
  });

  walletData = byWalletChain;
  return snap.created_at;
}

function renderCacheStatusNote(text) {
  const el = document.getElementById("cacheStatusNote");
  if (el) el.textContent = text;
}

function buildCurrentSnapshotItems() {
  const items = [];
  wallets.forEach(w => {
    if (!w.dbId) return; // ungespeicherte Wallet (noch keine DB-ID) - nicht in den Snapshot aufnehmen,
                          // sonst gibt's später keine zuverlässige Zuordnung mehr möglich
    Object.keys(CHAIN_META).forEach(chain => {
      const result = chainRows((walletData[w.id] || {})[chain], chain);
      if (!result || result.error) return;
      result.rows.forEach(r => {
        items.push({
          wallet_id: w.dbId,
          wallet_label: w.label,
          chain,
          symbol: r.symbol,
          address: r.isNative ? null : (r.address || null),
          is_native: !!r.isNative,
          amount: r.amount,
          price_usd: r.price !== undefined ? r.price : null, // Kurs ZUM ZEITPUNKT des Snapshots, nicht live nachträglich
          user_id: currentUser.id
        });
      });
    });
  });
  return items;
}

// isAutomated=false (Standard): manueller Snapshot, bleibt dauerhaft, taucht in der Verwaltung
// und der Verlauf-Grafik auf. isAutomated=true: interner Tages-Cache, ersetzt sich selbst bei
// jedem echten Neuladen, taucht NICHT in der normalen Snapshot-Liste/Grafik auf.
async function createSnapshot(isAutomated) {
  isAutomated = !!isAutomated;

  if (!isAutomated) {
    const unsaved = wallets.filter(w => !w.dbId);
    if (unsaved.length > 0) {
      const proceed = confirm(
        `Diese Wallet(s) sind noch nicht gespeichert und werden im Snapshot fehlen: ${unsaved.map(w => w.label).join(", ")}.\n\n` +
        `Zuerst auf "Speichern" klicken (im Tab "Meine Wallets") und danach den Snapshot erstellen? Trotzdem jetzt fortfahren?`
      );
      if (!proceed) return;
    }
  }

  const items = buildCurrentSnapshotItems();

  if (items.length === 0) {
    if (!isAutomated) alert("Keine Bestände gefunden, die gespeichert werden können. Erst 'Alle laden' ausführen und warten, bis Daten da sind.");
    return;
  }

  if (isAutomated) {
    // alten Cache-Snapshot ersetzen statt anzuhäufen
    await sb.from("snapshots").delete().eq("user_id", currentUser.id).eq("is_automated", true);
  }

  const { data: snap, error: snapErr } = await sb.from("snapshots").insert({ user_id: currentUser.id, is_automated: isAutomated }).select().single();
  if (snapErr) { if (!isAutomated) alert("Fehler beim Erstellen des Snapshots: " + snapErr.message); return; }

  const rows = items.map(it => ({ ...it, snapshot_id: snap.id }));
  const { error: itemsErr } = await sb.from("snapshot_items").insert(rows);
  if (itemsErr) { if (!isAutomated) alert("Fehler beim Speichern der Snapshot-Daten: " + itemsErr.message); return; }

  if (!isAutomated) {
    await loadSnapshotsFromDb();
    renderSnapshotManager();
    renderResults();
  }
}

async function deleteSnapshot(id) {
  if (!confirm("Diesen Snapshot unwiderruflich löschen?")) return;
  await sb.from("snapshots").delete().eq("id", id);
  snapshots = snapshots.filter(s => s.id !== id);
  renderSnapshotManager();
  renderResults();
}

function toggleSnapshotVisible(id, isVisible) {
  const s = snapshots.find(s => s.id === id);
  if (s) s.visible = isVisible;
  renderResults();
}

function setAllSnapshotsVisible(visible) {
  snapshots.forEach(s => { s.visible = visible; });
  renderSnapshotManager();
  renderResults();
}

function fmtSnapshotDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-CH') + ", " + d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function renderSnapshotManager() {
  const el = document.getElementById("snapshotManagerList");
  if (!el) return;
  if (snapshots.length === 0) {
    el.innerHTML = `<div class="empty">Noch keine Snapshots erstellt.</div>`;
    return;
  }
  const actions = `<div class="action-row" style="margin-bottom:10px">
    <button class="secondary" style="padding:4px 10px;font-size:0.78rem" onclick="setAllSnapshotsVisible(true)">Alle einblenden</button>
    <button class="secondary" style="padding:4px 10px;font-size:0.78rem" onclick="setAllSnapshotsVisible(false)">Alle ausblenden</button>
  </div>`;
  el.innerHTML = actions + snapshots.map(s => `
    <div class="custom-token-row">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin:0">
        <input type="checkbox" ${s.visible ? "checked" : ""} onchange="toggleSnapshotVisible('${s.id}', this.checked)" style="width:auto" />
        ${fmtSnapshotDateTime(s.createdAt)}
      </label>
      <button class="remove" onclick="deleteSnapshot('${s.id}')">Löschen</button>
    </div>
  `).join("");
}

// ---- Verlauf-Grafik (ein Token über Zeit, Snapshots + aktueller Bestand) ----
let snapshotChartInstance = null;

function renderChartWalletSelect() {
  const el = document.getElementById("chartWalletSelect");
  if (!el) return;
  const current = el.value;
  el.innerHTML = `<option value="">Total (alle Wallets)</option>` +
    wallets.map(w => `<option value="${w.id}">${escapeAttr(w.label)}</option>`).join("");
  if (current === "" || wallets.some(w => w.id === current)) el.value = current;
}

// Ermittelt genau die Chain/Token-Kombinationen, die auch in der Summary-Tabelle
// auftauchen würden (aktueller Bestand > 0 ODER in irgendeinem Snapshot vorhanden) -
// unabhängig vom Chain-Sichtbarkeits-Filter oben, damit die Grafik-Auswahl stabil bleibt.
function computeAvailableChartOptions() {
  const options = [];
  Object.keys(CHAIN_META).forEach(chain => {
    const found = {}; // key -> {label, isNative}

    wallets.forEach(w => {
      const cd = (walletData[w.id] || {})[chain];
      if (!cd || cd.error) return;
      if (cd.native !== null && cd.native !== undefined && cd.native > 0) {
        found.native = { label: (NATIVE_SYMBOL[chain] || chain.toUpperCase()) + " (nativ)", isNative: true };
      }
      (cd.tokens || []).forEach(t => {
        if (t.amount <= 0 || !isSafeTokenAddress(t.address, chain)) return;
        found[(t.address || "").toLowerCase()] = { label: t.symbol, isNative: false };
      });
    });

    snapshots.forEach(s => {
      s.items.filter(it => it.chain === chain).forEach(it => {
        const key = it.is_native ? "native" : (it.address || "").toLowerCase();
        if (!found[key]) {
          found[key] = { label: it.is_native ? (NATIVE_SYMBOL[chain] || chain.toUpperCase()) + " (nativ)" : it.symbol, isNative: it.is_native };
        }
      });
    });

    Object.keys(found).forEach(key => {
      options.push({ chain, key, label: found[key].label, isNative: found[key].isNative });
    });
  });
  return options;
}

function renderChartChainSelect() {
  const el = document.getElementById("chartChainSelect");
  if (!el) return;
  const available = computeAvailableChartOptions();
  const chainsWithData = Object.keys(CHAIN_META).filter(c => available.some(o => o.chain === c));
  el.innerHTML = `<option value="">– Chain wählen –</option>` +
    chainsWithData.map(c => `<option value="${c}">${CHAIN_META[c].label}</option>`).join("");
  if (chainsWithData.length === 0) {
    el.innerHTML = `<option value="">Keine Bestände/Snapshots vorhanden</option>`;
  }
}

function populateChartTokenSelect() {
  const chain = document.getElementById("chartChainSelect").value;
  const tokenSelect = document.getElementById("chartTokenSelect");
  if (!chain) {
    tokenSelect.innerHTML = `<option value="">– zuerst Chain wählen –</option>`;
    tokenSelect.disabled = true;
    document.getElementById("snapshotChartContainer").innerHTML = "";
    return;
  }
  const available = computeAvailableChartOptions().filter(o => o.chain === chain);
  const options = [`<option value="">– Token wählen –</option>`];
  available.forEach(o => {
    const value = o.isNative ? "native" : o.key;
    options.push(`<option value="${value}">${escapeAttr(o.label)}</option>`);
  });

  tokenSelect.innerHTML = options.join("");
  tokenSelect.disabled = false;
  document.getElementById("snapshotChartContainer").innerHTML = "";
}

function generateSnapshotChart() {
  const walletId = document.getElementById("chartWalletSelect").value;
  const chain = document.getElementById("chartChainSelect").value;
  const tokenVal = document.getElementById("chartTokenSelect").value;
  const container = document.getElementById("snapshotChartContainer");

  if (!chain || !tokenVal) {
    container.innerHTML = "";
    return;
  }

  const matchWallet = walletId ? wallets.find(w => w.id === walletId) : null;
  const isNative = tokenVal === "native";
  const key = isNative ? "native" : tokenVal.toLowerCase();

  // Historische Punkte aus ALLEN Snapshots (unabhängig von deren Ein-/Ausblenden-Status
  // in der Tabellen-Ansicht), chronologisch aufsteigend sortiert.
  const sortedSnaps = snapshots.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const points = sortedSnaps.map(s => ({
    label: fmtSnapshotDateTime(s.createdAt),
    value: snapshotValueForKey(s, chain, key, matchWallet) || 0
  }));

  // Aktueller Live-Bestand als letzter Punkt
  let currentVal = 0;
  const wallets_ = matchWallet ? [matchWallet] : wallets;
  wallets_.forEach(w => {
    const cd = (walletData[w.id] || {})[chain];
    if (!cd) return;
    if (isNative) {
      currentVal += cd.native || 0;
    } else {
      const t = (cd.tokens || []).find(t => (t.address || "").toLowerCase() === key);
      if (t) currentVal += t.amount;
    }
  });
  points.push({ label: "Jetzt", value: currentVal });

  if (points.length < 2) {
    container.innerHTML = `<div class="empty">Zu wenig Datenpunkte (mind. 1 Snapshot nötig, um einen Verlauf zu zeigen).</div>`;
    return;
  }

  const tokenLabel = isNative
    ? (NATIVE_SYMBOL[chain] || chain.toUpperCase()) + " (nativ)"
    : (document.getElementById("chartTokenSelect").selectedOptions[0].textContent);
  const walletLabel = matchWallet ? matchWallet.label : "Total (alle Wallets)";

  container.innerHTML = `<canvas id="snapshotChartCanvas" height="90"></canvas>`;
  const ctx = document.getElementById("snapshotChartCanvas").getContext("2d");
  if (snapshotChartInstance) snapshotChartInstance.destroy();
  snapshotChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: points.map(p => p.label),
      datasets: [{
        label: `${tokenLabel} · ${CHAIN_META[chain].label} · ${walletLabel}`,
        data: points.map(p => p.value),
        borderColor: "#6c8cff",
        backgroundColor: "rgba(108,140,255,0.15)",
        fill: true,
        tension: 0.2,
        pointRadius: 4,
        pointBackgroundColor: "#6c8cff"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#e8e9ec" } },
        tooltip: { callbacks: { label: (ctx) => fmt(ctx.parsed.y) } }
      },
      scales: {
        x: { ticks: { color: "#9aa0ac" }, grid: { color: "#2a2e38" } },
        y: { ticks: { color: "#9aa0ac", callback: (v) => fmt(v) }, grid: { color: "#2a2e38" } }
      }
    }
  });
}

// ---- Portfolio-Allokation (Kreisdiagramm, nach USD-Wert) ----
let allocationChartInstance = null;
const ALLOC_COLORS = ["#6c8cff", "#f0b90b", "#8247e5", "#28a0f0", "#0052ff", "#e84142", "#00c2a8", "#ff060a", "#f7931a", "#14f195", "#46c878", "#ff6b6b", "#9aa0ac"];

function renderAllocWalletSelect() {
  const el = document.getElementById("allocWalletSelect");
  if (!el) return;
  const current = el.value;
  el.innerHTML = `<option value="">Total (alle Wallets)</option>` +
    wallets.map(w => `<option value="${w.id}">${escapeAttr(w.label)}</option>`).join("");
  if (current === "" || wallets.some(w => w.id === current)) el.value = current;
}

function renderAllocationChart() {
  const container = document.getElementById("allocationChartContainer");
  if (!container) return;
  const walletId = document.getElementById("allocWalletSelect").value;
  const groupBy = document.getElementById("allocGroupSelect").value; // "chain" | "token"
  const targetWallets = walletId ? wallets.filter(w => w.id === walletId) : wallets;

  const totals = {}; // key -> {label, value}
  let hasAnyValue = false;

  targetWallets.forEach(w => {
    Object.keys(CHAIN_META).forEach(chain => {
      const result = chainRows((walletData[w.id] || {})[chain], chain);
      if (!result || result.error) return;
      result.rows.forEach(r => {
        const key = groupBy === "chain" ? chain : r.symbol.replace(" (nativ)", "");
        const label = groupBy === "chain" ? CHAIN_META[chain].label : key;
        if (!totals[key]) totals[key] = { label, value: 0 };
        if (r.usdValue !== undefined) {
          totals[key].value += r.usdValue;
          hasAnyValue = true;
        } else {
          totals["_unknown"] = totals["_unknown"] || { label: "Unbekannt (kein Kurs)", value: 0 };
          // ohne Kurs kann kein USD-Wert beigetragen werden - Menge lässt sich nicht sinnvoll mit anderen mischen,
          // wird nur als Hinweis separat ausgewiesen (0 USD, taucht nicht im Kreis auf, aber im Hinweistext).
        }
      });
    });
  });

  if (!hasAnyValue) {
    container.innerHTML = `<div class="empty">Keine Bestände mit bekanntem Kurs vorhanden.</div>`;
    return;
  }

  const entries = Object.entries(totals).filter(([k, v]) => k !== "_unknown" && v.value > 0).sort((a, b) => b[1].value - a[1].value);

  container.innerHTML = `<canvas id="allocationChartCanvas"></canvas>`;
  const ctx = document.getElementById("allocationChartCanvas").getContext("2d");
  if (allocationChartInstance) allocationChartInstance.destroy();
  allocationChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: entries.map(([k, v]) => v.label),
      datasets: [{
        data: entries.map(([k, v]) => v.value),
        backgroundColor: entries.map((_, i) => ALLOC_COLORS[i % ALLOC_COLORS.length]),
        borderColor: "#171a21",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { color: "#e8e9ec", boxWidth: 12, padding: 10 } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = entries.reduce((s, [, v]) => s + v.value, 0);
              const pct = total > 0 ? (ctx.parsed / total * 100).toFixed(1) : "0";
              return ` ${ctx.label}: ${fmtUsd(ctx.parsed)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function visibleSnapshots() {
  return snapshots.filter(s => s.visible).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Prüft, ob für eine Chain (+ optional ein bestimmtes Wallet) überhaupt Snapshot-Daten
// existieren - damit eine Chain-Karte nicht ausgeblendet wird, nur weil der AKTUELLE
// Bestand 0 ist, obwohl ein Snapshot noch etwas zeigen würde.
// Ordnet eine Snapshot-Position einer Wallet zu - zuerst über die DB-ID (stabiler Normalfall),
// falls die nicht passt zusätzlich über den Wallet-Namen (Fallback, falls eine Wallet
// zwischenzeitlich neu gespeichert wurde und dadurch eine neue ID bekommen hat - der Name
// bleibt in dem Fall meist gleich, die ID aber nicht mehr).
function snapshotItemBelongsToWallet(it, matchWallet) {
  if (!matchWallet) return true;
  if (matchWallet.dbId && it.wallet_id === matchWallet.dbId) return true;
  return it.wallet_label === matchWallet.label;
}

function hasVisibleSnapshotDataForChain(chain, matchWallet) {
  return visibleSnapshots().some(s => s.items.some(it => it.chain === chain && snapshotItemBelongsToWallet(it, matchWallet)));
}

// ---- Bestands-Tabelle. wallet+chain optional: nur bei Angabe werden Snapshot-Spalten
// (fixierte Hauptspalten, seitlich scrollbar) angehängt - Summary bleibt unverändert. ----
const SNAPSHOT_COL_WIDTHS = { token: 260, amount: 140, price: 140, change: 90, value: 150, snap: 190 };

function rowKey(row) {
  return row.isNative ? "native" : (row.address || "").toLowerCase();
}

// Summiert den Bestand eines Tokens in einem Snapshot - entweder für EIN Wallet (matchWallet
// gesetzt) oder über ALLE Wallets summiert (matchWallet null, für die Summary-Tabelle).
function snapshotValueForKey(snap, chain, key, matchWallet) {
  const items = snap.items.filter(it => it.chain === chain && snapshotItemBelongsToWallet(it, matchWallet));
  const matching = items.filter(it => (it.is_native ? "native" : (it.address || "").toLowerCase()) === key);
  if (matching.length === 0) return null;
  return matching.reduce((sum, it) => sum + Number(it.amount), 0);
}

// Historischer USD-Kurs, der zusammen mit dem Snapshot gespeichert wurde.
// Bei einer Summary können mehrere Wallet-Zeilen zum selben Token existieren;
// da sie zum selben Snapshot-Zeitpunkt entstanden sind, genügt der erste
// vorhandene Kurswert. Alte Snapshots ohne price_usd liefern null.
function snapshotPriceForKey(snap, chain, key, matchWallet) {
  const items = snap.items.filter(it =>
    it.chain === chain &&
    snapshotItemBelongsToWallet(it, matchWallet) &&
    (it.is_native ? "native" : (it.address || "").toLowerCase()) === key
  );
  const priced = items.find(it => it.price_usd !== null && it.price_usd !== undefined && isFinite(Number(it.price_usd)));
  return priced ? Number(priced.price_usd) : null;
}

// Hängt an jede Zeile die Werte aus den sichtbaren Snapshots an (r.snapshotValues) und ergänzt
// Zeilen für Token, die aktuell 0 Bestand haben, aber in einem Snapshot vorkamen.
// matchWallet: ein Wallet-Objekt (Einzelwallet-Ansicht) oder null (Summary, über alle Wallets).
function attachSnapshotColumns(rows, chain, matchWallet) {
  const snaps = visibleSnapshots();
  if (snaps.length === 0) return rows;

  rows.forEach(r => {
    r.snapshotValues = {};
    r.snapshotPrices = {};
    snaps.forEach(s => {
      r.snapshotValues[s.id] = snapshotValueForKey(s, chain, rowKey(r), matchWallet);
      r.snapshotPrices[s.id] = snapshotPriceForKey(s, chain, rowKey(r), matchWallet);
    });
  });

  const presentKeys = new Set(rows.map(rowKey));
  const extraKeys = new Set();
  const extraRows = [];
  snaps.forEach(s => {
    s.items
      .filter(it => it.chain === chain && snapshotItemBelongsToWallet(it, matchWallet))
      .forEach(it => {
        const key = it.is_native ? "native" : (it.address || "").toLowerCase();
        if (presentKeys.has(key) || extraKeys.has(key)) return;
        extraKeys.add(key);
        const p = it.is_native ? nativePrices[chain] : priceForToken(chain, it.address);
        const extraRow = {
          symbol: it.symbol + " (aktuell 0)",
          amount: 0, safe: true, isNative: it.is_native, address: it.address,
          price: p ? p.price : undefined, usdValue: 0, isHistoricalOnly: true,
          snapshotValues: {},
          snapshotPrices: {}
        };
        snaps.forEach(s2 => {
          extraRow.snapshotValues[s2.id] = snapshotValueForKey(s2, chain, key, matchWallet);
          extraRow.snapshotPrices[s2.id] = snapshotPriceForKey(s2, chain, key, matchWallet);
        });
        extraRows.push(extraRow);
      });
  });
  return rows.concat(extraRows);
}

function renderTable(rows, skipHeader) {
  if (!rows || rows.length === 0) return null;
  const snaps = visibleSnapshots();
  const hasSnaps = snaps.length > 0 && rows.some(r => r.snapshotValues);

  if (!hasSnaps) {
    return `<table class="balance-table">
      <colgroup>
        <col class="col-token"><col class="col-amount"><col class="col-price"><col class="col-change"><col class="col-value">
      </colgroup>
      ${skipHeader ? "" : '<thead><tr><th>Token</th><th style="text-align:right">Anzahl</th><th style="text-align:right">Kurs (USD)</th><th style="text-align:right">24h %</th><th style="text-align:right">Wert (USD)</th></tr></thead>'}
      <tbody>
      ${rows.map(r => `<tr class="${r.isNative ? 'native-row' : ''}">
        <td>${r.symbol} ${badge(r.safe)}</td>
        <td class="num">${fmt(r.amount)}</td>
        <td class="num">${r.price !== undefined ? fmtPrice(r.price) + (r.source ? `<span class="price-source">${r.source}</span>` : "") : '<span style="color:var(--muted)">–</span>'}</td>
        <td class="num">${fmtChange(r.change24h)}</td>
        <td class="num">${r.usdValue !== undefined ? fmtUsd(r.usdValue) : '<span style="color:var(--muted)">–</span>'}</td>
      </tr>`).join("")}
    </tbody></table>`;
  }

  const w = SNAPSHOT_COL_WIDTHS;
  const sticky = `position:sticky;left:0px;background:var(--card);z-index:2;`;

  const colgroup = `<colgroup>
    <col style="width:${w.token}px"><col style="width:${w.amount}px"><col style="width:${w.price}px"><col style="width:${w.change}px"><col style="width:${w.value}px">
    ${snaps.map(() => `<col style="width:${w.snap}px">`).join("")}
  </colgroup>`;

  const headerRow = skipHeader ? "" : `<thead><tr>
    <th style="${sticky}">Token</th>
    <th style="text-align:right">Anzahl</th>
    <th style="text-align:right">Kurs (USD)</th>
    <th style="text-align:right">24h %</th>
    <th style="text-align:right">Wert (USD)</th>
    ${snaps.map(s => `<th style="text-align:right;white-space:normal">${fmtSnapshotDateTime(s.createdAt)}<span class="price-source">Anzahl · Kurs damals</span></th>`).join("")}
  </tr></thead>`;

  const bodyRows = rows.map(r => {
    const snapCells = snaps.map(s => {
      const amt = r.snapshotValues ? r.snapshotValues[s.id] : null;
      const historicalPrice = r.snapshotPrices ? r.snapshotPrices[s.id] : null;
      const amountHtml = amt !== null && amt !== undefined ? fmt(amt) : '<span style="color:var(--muted)">–</span>';
      const priceHtml = historicalPrice !== null && historicalPrice !== undefined
        ? fmtPrice(historicalPrice)
        : '<span style="color:var(--muted)">–</span>';
      return `<td class="num">
        <div>${amountHtml}</div>
        <span class="price-source">Kurs: ${priceHtml}</span>
      </td>`;
    }).join("");
    const mutedStyle = r.isHistoricalOnly ? "opacity:0.6;" : "";
    return `<tr class="${r.isNative ? 'native-row' : ''}" style="${mutedStyle}">
      <td style="${sticky}${mutedStyle}">${r.symbol}${r.isHistoricalOnly ? '' : ' ' + badge(r.safe)}</td>
      <td class="num" style="${mutedStyle}">${fmt(r.amount)}</td>
      <td class="num" style="${mutedStyle}">${r.price !== undefined ? fmtPrice(r.price) + (r.source ? `<span class="price-source">${r.source}</span>` : "") : '<span style="color:var(--muted)">–</span>'}</td>
      <td class="num" style="${mutedStyle}">${fmtChange(r.change24h)}</td>
      <td class="num" style="${mutedStyle}">${r.usdValue !== undefined ? fmtUsd(r.usdValue) : '<span style="color:var(--muted)">–</span>'}</td>
      ${snapCells}
    </tr>`;
  }).join("");

  return `<div style="overflow-x:auto"><table class="balance-table" style="width:max-content;min-width:100%">${colgroup}${headerRow}<tbody>${bodyRows}</tbody></table></div>`;
}

// Eine einzige Spaltenüberschrift-Zeile pro Wallet, mit dem Wallet-Namen anstelle von
// "Token" - spart die sonst pro Chain-Karte wiederholte Kopfzeile. Lange Wallet-Namen
// brechen dank normaler Tabellenzelle von selbst um, statt die Spalten zu überlagern.
function renderWalletHeader(walletLabel) {
  const snaps = visibleSnapshots();
  const w = SNAPSHOT_COL_WIDTHS;
  const titleStyle = "font-size:1.05rem;font-weight:700;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.3;text-transform:none;color:var(--text);";

  if (snaps.length === 0) {
    return `<table class="balance-table" style="margin-bottom:2px">
      <colgroup><col class="col-token"><col class="col-amount"><col class="col-price"><col class="col-change"><col class="col-value"></colgroup>
      <thead><tr>
        <th style="${titleStyle}">💼 ${escapeAttr(walletLabel)}</th>
        <th style="text-align:right">Anzahl</th>
        <th style="text-align:right">Kurs (USD)</th>
        <th style="text-align:right">24h %</th>
        <th style="text-align:right">Wert (USD)</th>
      </tr></thead>
    </table>`;
  }

  const colgroup = `<colgroup>
    <col style="width:${w.token}px"><col style="width:${w.amount}px"><col style="width:${w.price}px"><col style="width:${w.change}px"><col style="width:${w.value}px">
    ${snaps.map(() => `<col style="width:${w.snap}px">`).join("")}
  </colgroup>`;
  const sticky = `position:sticky;left:0px;background:var(--card2);z-index:2;`;

  return `<div style="overflow-x:auto"><table class="balance-table" style="width:max-content;min-width:100%;margin-bottom:2px">
    ${colgroup}
    <thead><tr>
      <th style="${sticky}${titleStyle}">💼 ${escapeAttr(walletLabel)}</th>
      <th style="text-align:right">Anzahl</th>
      <th style="text-align:right">Kurs (USD)</th>
      <th style="text-align:right">24h %</th>
      <th style="text-align:right">Wert (USD)</th>
      ${snaps.map(s => `<th style="text-align:right;white-space:normal">${fmtSnapshotDateTime(s.createdAt)}<span class="price-source">Anzahl · Kurs damals</span></th>`).join("")}
    </tr></thead>
  </table></div>`;
}

function explorerUrlForWallet(chain, wallet) {
  const cfg = CHAIN_CONFIG[chain];
  if (!cfg || !cfg.explorerUrlTemplate || !cfg.walletType) return null;

  const fieldByWalletType = {
    evm: "evm",
    btc: "btc",
    xrp: "xrp",
    sol: "sol",
    tron: "tron",
    akash: "akash"
  };
  const field = fieldByWalletType[cfg.walletType];
  const address = field ? wallet?.[field] : null;
  if (!address) return null;

  return cfg.explorerUrlTemplate.replace("{address}", encodeURIComponent(address));
}


// TLN/VOW-Tab nur anzeigen, wenn die aktuelle Gesamtübersicht tatsächlich
// mindestens einen gehaltenen TLN/VOW-klassifizierten Token enthält.
// Zuordnung ausschließlich über Chain + Contract-Adresse, nie über Symbol/Name.
function hasTlnVowTokenInSummary() {
  for (const chain of Object.keys(CHAIN_META)) {
    const totals = {};

    for (const w of wallets) {
      const cd = (walletData[w.id] || {})[chain];
      if (!cd || cd.error) continue;

      for (const token of (cd.tokens || [])) {
        if (!token.address || Number(token.amount) <= 0) continue;
        if (!isSafeTokenAddress(token.address, chain)) continue;

        const address = normalizeAddress(token.address, chain);
        const key = chain + "|" + address;
        totals[key] = (totals[key] || 0) + Number(token.amount);
      }
    }

    for (const [key, amount] of Object.entries(totals)) {
      // Gleiche Sichtbarkeitsschwelle wie in der Summary.
      if (amount < DUST_THRESHOLD) continue;

      // Wert der Kategorie ist egal: v_currency, lp_token oder tln_vow_token
      // zählen alle. Entscheidend ist nur, dass die TLN/VOW-Spalte nicht leer ist.
      const category = predefinedTokenCategory[key];
      const project = predefinedTokenProject[key];
      if (project === "tln_vow" && category) return true;
    }
  }
  return false;
}

function updateDefiProjectsNavGroupVisibility() {
  const group = document.getElementById("defiProjectsNavGroup");
  if (!group) return false;
  const anyVisible = [...group.querySelectorAll(".tab-btn")].some(btn => btn.style.display !== "none");
  group.style.display = anyVisible ? "flex" : "none";
  return anyVisible;
}

function updateTlnVowTabVisibility() {
  const btn = document.getElementById("tlnVowTabBtn");
  const visible = hasTlnVowTokenInSummary();

  if (btn) btn.style.display = visible ? "inline-block" : "none";
  updateDefiProjectsNavGroupVisibility();

  // Falls der User gerade im Projekt-Tab ist und der letzte passende Bestand
  // verschwindet, automatisch zurück zum Wallet-Tracking.
  const panel = document.getElementById("tab-tlnvow");
  if (!visible && panel && panel.classList.contains("active")) {
    showTab("tracking");
  }

  return visible;
}

function renderResults() {
  // --- Details je Wallet ---
  const resultsContainer = document.getElementById("resultsContainer");
  if (wallets.length === 0) {
    resultsContainer.innerHTML = `<div class="empty">Keine Wallets erfasst.</div>`;
  } else {
    resultsContainer.innerHTML = wallets.map(w => {
      const data = walletData[w.id] || {};
      const chainCards = Object.keys(CHAIN_META).filter(chain => activeChainFilter.has(chain)).map(chain => {
        const meta = CHAIN_META[chain];
        const hasSnapshotData = hasVisibleSnapshotDataForChain(chain, w);
        let result = chainRows(data[chain], chain);

        // Wichtig: Wenn beim Seitenstart noch kein aktueller Chain-Datensatz vorhanden ist,
        // aber ein sichtbarer Snapshot Werte für dieses Wallet enthält, trotzdem eine
        // Detailkarte erzeugen. Früher wurde hier sofort return "" ausgeführt; dadurch war
        // die Summary sichtbar, die Detailansicht je Wallet aber leer.
        if (!result) {
          if (!hasSnapshotData) return "";
          result = { rows: [] };
        }

        if (!result.error && result.rows.length === 0 && !hasSnapshotData) return "";

        let body;
        if (result.error) {
          body = `<div class="error">Fehler beim Laden: ${result.error}</div>`;
        } else {
          body = renderTable(attachSnapshotColumns(result.rows, chain, w), true) || '<div class="empty">Keine aktuellen Bestände, aber Snapshot-Daten vorhanden.</div>';
        }
        const explorerUrl = explorerUrlForWallet(chain, w);
        const explorerLink = explorerUrl ? ` <a href="${explorerUrl}" target="_blank" rel="noopener" style="font-size:0.72rem;color:var(--accent);font-weight:400;margin-left:6px">Auf Explorer ansehen ↗</a>` : "";
        return `<div class="chain-card">
          <div class="chain-title"><span class="dot" style="background:${escapeAttr(CHAIN_CONFIG[meta.dot]?.displayColor || "#6b7280")}"></span> ${meta.label}${explorerLink}</div>
          ${body}
        </div>`;
      }).join("");

      return `<div class="wallet-block" id="wallet-block-${w.id}">
        ${renderWalletHeader(w.label)}
        ${chainCards || '<div class="empty">Keine Bestände gefunden.</div>'}
      </div>`;
    }).join("");
  }

  renderWalletNav();
  renderChartChainSelect(); // Verfügbare Chains/Token für die Grafik hängen von Bestand+Snapshots ab, hier immer aktuell halten

  // --- Summary über alle Wallets, pro Chain aggregiert ---
  const summaryContainer = document.getElementById("summaryContainer");
  const summaryCards = Object.keys(CHAIN_META).filter(chain => activeChainFilter.has(chain)).map(chain => {
    const meta = CHAIN_META[chain];
    const totals = {}; // key -> {symbol, amount, safe, isNative}
    let hadError = false;

    wallets.forEach(w => {
      const cd = (walletData[w.id] || {})[chain];
      if (!cd) return;
      if (cd.error) { hadError = true; return; }
      if (cd.native !== null && cd.native !== undefined && cd.native > 0) {
        const key = "native";
        totals[key] = totals[key] || { symbol: cd.nativeSymbol + " (nativ)", amount: 0, safe: true, isNative: true };
        totals[key].amount += cd.native;
      }
      (cd.tokens || []).forEach(t => {
        if (t.amount <= 0) return;
        const safe = isSafeTokenAddress(t.address, chain);
        const key = (t.address || t.symbol).toLowerCase();
        totals[key] = totals[key] || { symbol: t.symbol, amount: 0, safe, isNative: false, address: t.address };
        totals[key].amount += t.amount;
      });
    });

    // Erst NACH dem Aufsummieren über alle Wallets filtern - eine Summe kann trotz
    // einzelner Mini-Beträge unter der Sichtbarkeitsschwelle liegen.
    const rows = Object.values(totals).filter(r => r.safe && r.amount >= DUST_THRESHOLD);
    const p = nativePrices[chain];
    rows.forEach(r => {
      if (r.isNative && p) {
        r.price = p.price;
        r.change24h = p.change24h;
        r.source = "CoinGecko";
        r.usdValue = r.amount * p.price;
      } else if (!r.isNative) {
        const tp = priceForToken(chain, r.address);
        if (tp) {
          r.price = tp.price;
          r.change24h = tp.change24h;
          r.source = tp.source;
          r.usdValue = r.amount * tp.price;
        }
      }
    });

    if (rows.length === 0 && !hadError && !hasVisibleSnapshotDataForChain(chain, null)) return ""; // keine Bestände -> gar nicht anzeigen

    const sortedRows = rows.sort((a, b) => b.amount - a.amount);
    let body = renderTable(attachSnapshotColumns(sortedRows, chain, null)) || '<div class="empty">Keine aktuellen Bestände, aber Snapshot-Daten vorhanden.</div>';
    if (hadError) {
      body += `<div class="error" style="margin-top:6px">Hinweis: Bei mindestens einem Wallet trat auf dieser Chain ein Fehler auf — Summe ist unvollständig.</div>`;
    }

    return `<div class="chain-card">
      <div class="chain-title"><span class="dot" style="background:${escapeAttr(CHAIN_CONFIG[meta.dot]?.displayColor || "#6b7280")}"></span> ${meta.label} — Total</div>
      ${body}
    </div>`;
  }).join("");

  summaryContainer.innerHTML = summaryCards || '<div class="empty">Keine Bestände gefunden.</div>';
  updateTlnVowTabVisibility();
  window.DAO1Project?.updateVisibility?.();
}

// ============================================================

async function lpWalletTransfersSince(chain,address,fromBlock=0){
  const out=[],seen=new Set(),add=(x)=>{const k=`${x.contract}|${x.tx_hash}|${x.block_number}`;if(!seen.has(k)){seen.add(k);out.push(x);}};
  const minBlock=Math.max(0,Number(fromBlock||0));
  if(CHAIN_CONFIG[chain]?.discoveryProvider==="alchemy"){
    for(const direction of ["fromAddress","toAddress"]){
      let pageKey=null,pages=0;
      do{
        const q={fromBlock:taxBlockHex(minBlock),toBlock:"latest",category:["erc20"],withMetadata:false,excludeZeroValue:false,maxCount:"0x3e8"};
        q[direction]=address;if(pageKey)q.pageKey=pageKey;
        const r=await alchemyRpc(chain,"alchemy_getAssetTransfers",[q],"discovery");
        for(const t of (r?.transfers||[])){const a=t.rawContract?.address,b=t.blockNum?Number(BigInt(t.blockNum)):0,h=t.hash;if(a&&h&&b>=minBlock)add({contract:normalizeAddress(a,chain),tx_hash:h,block_number:b});}
        pageKey=r?.pageKey||null;pages++;
      }while(pageKey&&pages<100);
    }
    return out;
  }
  const base=String(CHAIN_CONFIG[chain]?.discoveryApiBase||CHAIN_CONFIG[chain]?.balanceApiBase||"").replace(/\/$/,"");
  if(base){
    let url=`${base}/addresses/${address}/token-transfers?type=ERC-20`,pages=0,done=false;
    while(url&&!done&&pages++<200){
      const res=await fetch(url);if(!res.ok)throw new Error(`${chain}: Explorer HTTP ${res.status}`);const j=await res.json();
      for(const t of (j.items||[])){const b=Number(t.block_number||0);if(b<minBlock){done=true;continue;}const a=t.token?.address,h=t.transaction_hash||t.tx_hash;if(a&&h)add({contract:normalizeAddress(a,chain),tx_hash:h,block_number:b});}
      const np=j.next_page_params;url=(!done&&np)?`${base}/addresses/${address}/token-transfers?type=ERC-20&${new URLSearchParams(np)}`:null;
    }
  }
  return out;
}

function lpPairBelongsToProject(pair,chain,projectKey){
  const k0=chain+'|'+normalizeAddress(pair.t0.address,chain),k1=chain+'|'+normalizeAddress(pair.t1.address,chain);
  return predefinedTokenProject[k0]===projectKey||predefinedTokenProject[k1]===projectKey;
}

async function syncProjectLpHistory(projectKey,chain,walletAddress){
  if(!window.WalletLPEngine)return {events:[],scanned:0,newEvents:0,pairs:[]};
  const engine=window.WalletLPEngine,cached=await engine.loadHistory(projectKey,chain,walletAddress).catch(()=>[]);
  const cachedPairs=new Set(cached.map(r=>normalizeAddress(r.pair_address,chain)).filter(Boolean));
  let last=0;try{last=await engine.getScanState(projectKey,chain,walletAddress,"lp_history_v2");}catch{}
  const latest=await engine.latestBlock(chain),from=last>0?Math.max(0,last-50):0;
  let transfers=[],syncWarning=null;
  try{transfers=await lpWalletTransfersSince(chain,walletAddress,from);}
  catch(e){
    // Ein Discovery-/Explorer-Ausfall darf den vorhandenen LP-Cache nicht unbrauchbar machen.
    // Aktuelle Positionen und bereits gecachte Historie bleiben sichtbar; Scanstand wird nicht fortgeschrieben.
    syncWarning=e?.message||String(e);
  }
  const pairMap=new Map();
  for(const a of cachedPairs){const p=await engine.pairInfo(chain,a);if(p&&lpPairBelongsToProject(p,chain,projectKey))pairMap.set(a,p);}
  for(const t of transfers){
    const a=normalizeAddress(t.contract,chain);if(pairMap.has(a))continue;
    const p=await engine.pairInfo(chain,a);if(p&&lpPairBelongsToProject(p,chain,projectKey))pairMap.set(a,p);
  }
  let newEvents=0,earliestFailedBlock=null;const done=new Set(cached.map(r=>`${normalizeAddress(r.pair_address,chain)}|${String(r.tx_hash).toLowerCase()}|${r.event_type}`));
  for(const t of transfers){
    const pair=pairMap.get(normalizeAddress(t.contract,chain));if(!pair)continue;
    const txKey=`${pair.address}|${String(t.tx_hash).toLowerCase()}`;
    if([...done].some(k=>k.startsWith(txKey+'|')))continue;
    try{
      const ev=await engine.historyEventFromReceipt(chain,pair,walletAddress,t.tx_hash,t.block_number);if(!ev)continue;
      const k=`${pair.address}|${String(t.tx_hash).toLowerCase()}|${ev.event_type}`;if(done.has(k))continue;
      await engine.saveHistory(projectKey,chain,walletAddress,pair,ev);done.add(k);newEvents++;
    }catch(e){earliestFailedBlock=earliestFailedBlock==null?Number(t.block_number):Math.min(earliestFailedBlock,Number(t.block_number));console.warn("LP-History Event",chain,t.tx_hash,e);}
  }
  // Bei einem transienten Receipt/RPC-Fehler den Scanstand bewusst VOR dem fehlgeschlagenen
  // Block stehen lassen. Beim nächsten Öffnen wird dieser Bereich erneut versucht und kein
  // historisches LP-Ereignis geht durch einen vorzeitig fortgeschriebenen Cache-Stand verloren.
  if(!syncWarning){
    const safeScannedBlock=earliestFailedBlock==null?latest:Math.max(0,earliestFailedBlock-1);
    await engine.setScanState(projectKey,chain,walletAddress,safeScannedBlock,"lp_history_v2");
  }
  return {events:await engine.loadHistory(projectKey,chain,walletAddress),scanned:latest,newEvents,pairs:[...pairMap.values()],warning:syncWarning};
}

async function renderProjectLpTab(projectKey,chains,targetId,dateStr="2025-12-31"){
  const el=document.getElementById(targetId);if(!el||!window.WalletLPEngine)return;
  el.innerHTML='<div class="status"><span class="loading">LP/PCLP-Cache wird synchronisiert…</span></div>';
  const rows=[],history=[];const targetEpoch=Math.floor(new Date(dateStr+'T23:59:59Z').getTime()/1000);let cacheNew=0,cacheErrors=[],cacheWarnings=[];
  for(const chain of chains){let block=null;try{block=(await taxEvmBlockByTime(chain,targetEpoch)).block;}catch{}
    for(const w of wallets){
      const wa=walletAddressForChain(w,chain);if(!wa)continue;
      let sync={events:[],pairs:[]};try{sync=await syncProjectLpHistory(projectKey,chain,wa);cacheNew+=sync.newEvents||0;if(sync.warning)cacheWarnings.push(`${CHAIN_META[chain]?.label||chain}/${w.label}: ${sync.warning}`);}catch(e){cacheErrors.push(`${CHAIN_META[chain]?.label||chain}/${w.label}: ${e.message}`);console.warn("LP-Cache Sync",chain,wa,e);try{sync.events=await window.WalletLPEngine.loadHistory(projectKey,chain,wa);}catch{}}
      const currentCandidates=(walletData[w.id]?.[chain]?.tokens||[]).map(t=>t.address).filter(Boolean);
      const candidates=new Set([...currentCandidates,...sync.events.map(e=>e.pair_address),...(sync.pairs||[]).map(p=>p.address)].map(a=>normalizeAddress(a,chain)));
      for(const a of candidates){
        let pair=null;try{pair=await window.WalletLPEngine.pairInfo(chain,a);}catch{}if(!pair||!lpPairBelongsToProject(pair,chain,projectKey))continue;
        let cur=null;try{cur=(await window.WalletLPEngine.positions(chain,wa,[a]))[0]||null;}catch{}
        let histBal=0,histPrice=null;if(block){try{histBal=(await taxEvmTokenBalance(chain,wa,{address:a,decimals:pair.decimals},block)).amount;if(histBal>DUST_THRESHOLD)histPrice=await taxV2LpHistoricalPrice(chain,{address:a,decimals:pair.decimals,symbol:window.WalletLPEngine.label(chain)},block,dateStr);}catch(e){console.warn('LP historisch',chain,a,e);}}
        if(cur||histBal>DUST_THRESHOLD||sync.events.some(e=>normalizeAddress(e.pair_address,chain)===a))rows.push({chain,w,pair,cur,histBal,histPrice});
      }
      const running=new Map();
      for(const e of [...sync.events].sort((a,b)=>Number(a.block_number)-Number(b.block_number)||Number(a.log_index||0)-Number(b.log_index||0))){const k=normalizeAddress(e.pair_address,chain),saldo=(running.get(k)||0)+Number(e.lp_delta||0);running.set(k,saldo);history.push({...e,chain,w,running_balance:saldo});}
    }
  }
  const f=n=>Number(n||0).toLocaleString('de-CH',{maximumFractionDigits:8}),u=n=>n==null?'–':'$'+Number(n).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2}),dt=x=>x?new Date(x).toLocaleString('de-CH'):'–';
  const currentTable=`<div class="chain-table-wrap"><table><thead><tr><th>Wallet</th><th>Chain</th><th>Pool</th><th>aktuell LP</th><th>aktuelle Underlyings</th><th>aktuell USD</th><th>${dateStr} LP</th><th>${dateStr} USD</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${escapeAttr(r.w.label)}</td><td>${escapeAttr(CHAIN_META[r.chain]?.label||r.chain)}</td><td><strong>${window.WalletLPEngine.label(r.chain)} ${escapeAttr(r.pair.t0.symbol)}/${escapeAttr(r.pair.t1.symbol)}</strong><div class="meta">${r.pair.address}</div></td><td>${r.cur?f(r.cur.balance):'0'}</td><td>${r.cur?`<div>${f(r.cur.amount0)} ${escapeAttr(r.pair.t0.symbol)}</div><div>${f(r.cur.amount1)} ${escapeAttr(r.pair.t1.symbol)}</div><div class="meta">Pool-Anteil ${(r.cur.share*100).toLocaleString('de-CH',{maximumFractionDigits:6})}%</div>`:'–'}</td><td>${u(r.cur?.usd)}</td><td>${f(r.histBal)}</td><td>${r.histPrice?u(r.histBal*r.histPrice.price):'–'}</td></tr>`).join(''):'<tr><td colspan="8">Keine aktuellen oder historischen LP-Positionen gefunden.</td></tr>'}</tbody></table></div>`;
  const hrows=[...history].sort((a,b)=>Number(b.block_number)-Number(a.block_number)||Number(b.log_index||0)-Number(a.log_index||0));
  const historyTable=`<h3 style="margin-top:22px">Add-/Remove-Liquidity-Historie</h3><div class="chain-table-wrap lp-history-scroll"><table class="lp-history-table"><colgroup><col class="lp-col-time"><col class="lp-col-wallet"><col class="lp-col-chain"><col class="lp-col-action"><col class="lp-col-pool"><col class="lp-col-delta"><col class="lp-col-balance"><col class="lp-col-underlying"><col class="lp-col-usd"></colgroup><thead><tr><th>Zeit</th><th>Wallet</th><th>Chain</th><th>Aktion</th><th>Pool</th><th>LP Δ</th><th>LP-Saldo</th><th>Underlying</th><th>historischer USD-Wert</th></tr></thead><tbody>${hrows.length?hrows.map(e=>`<tr><td>${dt(e.tx_timestamp)}<div class="meta">Block ${e.block_number}</div></td><td>${escapeAttr(e.w.label)}</td><td>${escapeAttr(CHAIN_META[e.chain]?.label||e.chain)}</td><td>${e.event_type==='add'?'<span class="badge safe">Add</span>':'<span class="badge danger">Remove</span>'}</td><td><strong>${escapeAttr(e.lp_label||window.WalletLPEngine.label(e.chain))} ${escapeAttr(e.token0_symbol||'Token0')}/${escapeAttr(e.token1_symbol||'Token1')}</strong><div class="meta lp-address">${e.pair_address}</div></td><td>${Number(e.lp_delta)>0?'+':''}${f(e.lp_delta)}</td><td>${f(e.running_balance)}</td><td><div>${f(e.amount0)} ${escapeAttr(e.token0_symbol||'')}</div><div>${f(e.amount1)} ${escapeAttr(e.token1_symbol||'')}</div></td><td><strong>${u(e.value_usd)}</strong>${e.price_source?`<div class="meta lp-price-source">${escapeAttr(e.price_source)}</div>`:''}</td></tr>`).join(''):'<tr><td colspan="9">Noch keine Add-/Remove-Liquidity-Ereignisse im Cache.</td></tr>'}</tbody></table></div>`;
  el.innerHTML=`<div class="custom-token-card"><div class="chain-title">Liquidity Pools</div><div class="note">Aktuelle LP-Bestände, Reserven und Pool-Anteile werden live gelesen. <strong>Add-/Remove-Historie und historische USD-Werte werden dauerhaft in Supabase gecached</strong>; nach dem ersten Vollscan werden nur neue Blockchain-Bereiche synchronisiert. Auf BSC heißen V2-LP-Token <strong>PCLP</strong>.</div>${cacheNew?`<div class="success" style="margin-top:8px">${cacheNew} neue LP-Historien-Ereignis(se) im DB-Cache gespeichert.</div>`:''}${cacheWarnings.length?`<div class="note" style="margin-top:8px"><strong>LP-Historie momentan nicht nachladbar:</strong> vorhandener Cache und Live-Bestände bleiben sichtbar. ${escapeAttr(cacheWarnings.join(' · '))}</div>`:''}${cacheErrors.length?`<div class="error" style="margin-top:8px">Cache teilweise nicht aktualisiert: ${escapeAttr(cacheErrors.join(' · '))}</div>`:''}</div>${currentTable}${historyTable}`;
}
window.renderProjectLpTab=renderProjectLpTab;
window.showTlnLpChain=function(chain,btn){
  const b=document.getElementById("tlnvowLpBscContent"),e=document.getElementById("tlnvowLpEthContent");
  if(b)b.style.display=chain==="bsc"?"block":"none";if(e)e.style.display=chain==="eth"?"block":"none";
  document.querySelectorAll("#tlnvow-subtab-liquidity .project-subtabs .tab-btn").forEach(x=>x.classList.toggle("active",x===btn));
  return renderProjectLpTab("tln_vow",[chain],chain==="bsc"?"tlnvowLpBscContent":"tlnvowLpEthContent");
};

// "Entdecken" - findet Token, die eine Wallet hält, aber die
// noch nicht auf der sicheren Liste stehen. Läuft nur auf Klick.
// ============================================================

// ---- Discovery: Wallet-Pflichtauswahl + Chain-Filter ----
function discoveryChains() { return Object.keys(CHAIN_CONFIG).filter(c => CHAIN_CONFIG[c]?.discoveryEnabled === true); }
let activeDiscoveryChains = new Set();

function renderDiscoveryChainFilter() {
  const el = document.getElementById("discoveryChainContainer");
  if (!el) return;
  el.innerHTML = discoveryChains().map(chain => {
    const meta = CHAIN_META[chain];
    const checked = activeDiscoveryChains.has(chain) ? "checked" : "";
    return `<label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;cursor:pointer">
      <input type="checkbox" ${checked} onchange="toggleDiscoveryChain('${chain}', this.checked)" style="width:auto" />
      <span class="dot" style="background:${escapeAttr(CHAIN_CONFIG[meta.dot]?.displayColor || "#6b7280")}"></span> ${meta.label}
    </label>`;
  }).join("");
}

function toggleDiscoveryChain(chain, isChecked) {
  if (isChecked) activeDiscoveryChains.add(chain);
  else activeDiscoveryChains.delete(chain);
}

function setAllDiscoveryChains(selectAll) {
  activeDiscoveryChains = selectAll ? new Set(discoveryChains()) : new Set();
  renderDiscoveryChainFilter();
}

// ---- Gebühren-Auswertung ----
// Gebühren ohne Alchemy: ETH/Avalanche via Routescan, BSC via NodeReal/BSCTrace,
// Polygon/Arbitrum/Base via Blockscout. Alle EVM-Gebühren werden in Supabase
// inkrementell gecacht; Phase 1 speichert/zeigt nur die native Coin-/Token-Gebühr.
let activeFeesChains = new Set();
const FEES_MAX_PAGES = 50;
const FEE_COOLDOWN_DAYS = 30;

// Credential/Endpoint-Ausnahme: NodeReal-Key bleibt bewusst im Frontend.
// Welche Chain NodeReal verwendet, kommt dagegen aus public.chains.fee_provider.
const NODEREAL_BSC_URL = "https://bsc-mainnet.nodereal.io/v1/65ef2c8e97554306a0c34579410ea31b";

function feeChains() {
  return Object.keys(CHAIN_CONFIG).filter(chain => {
    const c = CHAIN_CONFIG[chain];
    return c?.feesEnabled === true && !!c?.feeProvider;
  });
}

function configuredFeeBase(chain) {
  const base = CHAIN_CONFIG[chain]?.feeApiBase;
  if (!base) throw new Error(`${CHAIN_META[chain]?.label || chain}: Gebühren API-Basis fehlt in public.chains`);
  return base.replace(/\/+$/, "");
}
let feeCaches = new Map(); // key walletId|chain -> DB row

function feeCacheKey(walletId, chain) { return String(walletId) + "|" + chain; }
function sleepMs(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function bigIntSafe(v) { try { return BigInt(v ?? 0); } catch { return 0n; } }
function weiToDecimalString(wei) {
  const x = bigIntSafe(wei), d = 1000000000000000000n;
  const whole = x / d;
  const frac = (x % d).toString().padStart(18, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}
function decimalStringToWei(v) {
  const s = String(v ?? "0").trim();
  if (!s || !/^[-+]?\d+(\.\d+)?$/.test(s)) return 0n;
  const neg = s.startsWith("-");
  const clean = s.replace(/^[-+]/, "");
  const [a, b = ""] = clean.split(".");
  const out = BigInt(a || "0") * 1000000000000000000n + BigInt((b + "0".repeat(18)).slice(0, 18));
  return neg ? -out : out;
}
function normalizeTxTimestamp(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string" && !/^\d+$/.test(v)) {
    const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString();
  }
  let n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < 1e12) n *= 1000;
  const d = new Date(n); return isNaN(d.getTime()) ? null : d.toISOString();
}

function renderFeesChainFilter() {
  const el = document.getElementById("feesChainContainer");
  if (!el) return;
  el.innerHTML = feeChains().map(chain => {
    const meta = CHAIN_META[chain];
    const checked = activeFeesChains.has(chain) ? "checked" : "";
    return `<label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;cursor:pointer">
      <input type="checkbox" ${checked} onchange="toggleFeesChain('${chain}', this.checked)" style="width:auto" />
      <span class="dot" style="background:${escapeAttr(CHAIN_CONFIG[meta.dot]?.displayColor || "#6b7280")}"></span> ${meta.label}
    </label>`;
  }).join("");
}
function toggleFeesChain(chain, isChecked) { if (isChecked) activeFeesChains.add(chain); else activeFeesChains.delete(chain); }
function setAllFeesChains(selectAll) { activeFeesChains = selectAll ? new Set(feeChains()) : new Set(); renderFeesChainFilter(); }
function renderFeesWalletSelect() {
  const el = document.getElementById("feesWalletSelect");
  if (!el) return;
  const current = el.value;
  el.innerHTML = `<option value="">– Wallet wählen –</option>` + wallets.map(w => `<option value="${w.id}">${escapeAttr(w.label)}</option>`).join("");
  if (wallets.some(w => String(w.id) === String(current))) el.value = current;
}


function currentGasCoinPrice(chain) {
  const p = nativePrices && nativePrices[chain] ? Number(nativePrices[chain].price) : NaN;
  return Number.isFinite(p) ? p : null;
}
function formatUsdPrice(v) {
  if (!Number.isFinite(Number(v))) return "–";
  const n=Number(v);
  return n >= 100 ? "$"+n.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})
    : n >= 1 ? "$"+n.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:4})
    : "$"+n.toLocaleString("de-CH",{minimumFractionDigits:4,maximumFractionDigits:8});
}
async function loadAllFeeCaches() {
  if (!currentUser) return [];
  const { data, error } = await sb.from("wallet_fee_cache").select("*").eq("user_id", currentUser.id);
  if (error) { console.error("Gebühren-Summary laden:", error); return []; }
  for (const row of (data||[])) feeCaches.set(feeCacheKey(row.wallet_id,row.chain),row);
  return data||[];
}
async function renderFeesSummary() {
  const el=document.getElementById("feesSummary"); if(!el||!currentUser)return;
  const rows=await loadAllFeeCaches();
  const walletIds=new Set(wallets.map(w=>String(w.id)));
  const ownRows=rows.filter(r=>walletIds.has(String(r.wallet_id)));
  if(!ownRows.length){el.innerHTML=`<div class="custom-token-card"><h3 style="margin:0 0 8px">Gesamtübersicht aller Wallets</h3><div class="note">Noch keine gespeicherten Gebühren vorhanden.</div></div>`;return;}
  const sums=new Map();
  for(const r of ownRows){
    const x=sums.get(r.chain)||{fee:0,tx:0,latest:null};
    x.fee+=Number(r.total_fee_native||0); x.tx+=Number(r.tx_count||0);
    if(r.last_scanned_at&&(!x.latest||r.last_scanned_at>x.latest))x.latest=r.last_scanned_at;
    sums.set(r.chain,x);
  }
  const body=feeChains().filter(c=>sums.has(c)).map(c=>{
    const x=sums.get(c), sym=NATIVE_SYMBOL[c]||c.toUpperCase(), price=currentGasCoinPrice(c);
    return `<tr><td><span class="dot" style="background:${escapeAttr(CHAIN_CONFIG[CHAIN_META[c].dot]?.displayColor || "#6b7280")}"></span> ${CHAIN_META[c].label}</td><td class="num">${x.tx}</td><td class="num">${fmt(x.fee)} ${sym}</td><td class="num">${formatUsdPrice(price)}</td><td><span class="note">${x.latest?new Date(x.latest).toLocaleString("de-CH"):"–"}</span></td></tr>`;
  }).join("");
  el.innerHTML=`<div class="custom-token-card"><h3 style="margin:0 0 10px">Gesamtübersicht aller Wallets</h3><table><thead><tr><th>Chain</th><th style="text-align:right">Anzahl Tx</th><th style="text-align:right">Gebühren (nativ)</th><th style="text-align:right">Aktueller Coin-Kurs</th><th>Letzter Stand</th></tr></thead><tbody>${body}</tbody></table><div class="note" style="margin-top:8px">Der aktuelle Coin-Kurs dient nur als Anhaltspunkt und wird nicht zur historischen Bewertung der Gebühren verwendet.</div></div>`;
}
async function loadFeeCacheForWallet(walletId) {
  if (!currentUser || !walletId) return [];
  const { data, error } = await sb.from("wallet_fee_cache").select("*")
    .eq("user_id", currentUser.id).eq("wallet_id", String(walletId));
  if (error) { console.error("Gebühren-Cache laden:", error); return []; }
  for (const row of (data || [])) feeCaches.set(feeCacheKey(walletId, row.chain), row);
  return data || [];
}
function feeNextAllowedDate(cache) {
  if (!cache || !cache.last_scanned_at) return null;
  const d = new Date(cache.last_scanned_at);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + FEE_COOLDOWN_DAYS);
  return d;
}
function feeScanAllowed(cache) { return isAdmin || !feeNextAllowedDate(cache) || Date.now() >= feeNextAllowedDate(cache).getTime(); }

async function onFeesWalletChange() {
  const select = document.getElementById("feesWalletSelect");
  const walletId = select ? select.value : "";
  const info = document.getElementById("feesCacheInfo");
  if (!walletId) { if (info) info.textContent = ""; return; }
  const w = wallets.find(x => String(x.id) === String(walletId));
  if (!w) return;
  const rows = await loadFeeCacheForWallet(walletId);
  if (rows.length) {
    const results = rows.map(r => ({ chain:r.chain, totalFee:Number(r.total_fee_native || 0), txCount:Number(r.tx_count || 0), cached:true, cachedAt:r.last_scanned_at, source:r.data_source }));
    renderFeesResults(w, results);
    const newest = rows.map(r => r.last_scanned_at).filter(Boolean).sort().pop();
    if (info) info.textContent = newest ? `Gespeicherter Gebührenstand geladen · letzte Aktualisierung ${new Date(newest).toLocaleString("de-CH")}` : "Gespeicherter Gebührenstand geladen.";
  } else {
    if (info) info.textContent = "Noch kein gespeicherter EVM-Gebührenstand für diese Wallet.";
  }
}

async function currentSafeBlock(chain) {
  const latestHex = await evmRpcCall(configuredRpcUrl(chain), "eth_blockNumber", []);
  const latest = Number(bigIntSafe(latestHex));
  const lag = Number(CHAIN_CONFIG[chain]?.feeFinalityBlocks || 0);
  return Math.max(0, latest - lag);
}

function routescanFeeWei(tx) {
  const used = bigIntSafe(tx.gasUsed ?? tx.receipt?.gasUsed ?? tx.gas?.used);
  const price = bigIntSafe(tx.effectiveGasPrice ?? tx.gasPrice ?? tx.receipt?.effectiveGasPrice ?? tx.gas?.price);
  if (used && price) return used * price;
  for (const k of ["fee", "txFee", "transactionFee"]) {
    if (tx[k] !== undefined && tx[k] !== null) { const b = bigIntSafe(tx[k]); if (b) return b; }
  }
  return 0n;
}

async function fetchRoutescanFeeTransactions(chain, address, startBlock, endBlock, onProgress) {
  let next = null, page = 0;
  const out = [];
  do {
    page++; if (onProgress) onProgress(page);
    const cfg = CHAIN_CONFIG[chain] || {};
    const chainId = cfg.evmChainId;
    if (!chainId) throw new Error("EVM Chain-ID fehlt in public.chains für " + chain);
    const base = cfg.feeApiBase || `https://api.routescan.io/v2/network/mainnet/evm/${chainId}`;
    const u = new URL(`${base.replace(/\/+$/, "")}/address/${address}/transactions`);
    u.searchParams.set("categories", "evm_tx"); u.searchParams.set("direction", "sent"); u.searchParams.set("sort", "asc"); u.searchParams.set("limit", "100");
    // Beim Initialscan keine Blockfilter mitsenden: genau dieser Modus wurde mit alten Wallets
    // erfolgreich gegen Routescan validiert. Den sicheren Head filtern wir danach lokal.
    // Erst bei inkrementellen Scans verwenden wir einen begrenzten Blockbereich.
    if (startBlock !== null && startBlock !== undefined) {
      u.searchParams.set("blockNumberFrom", String(startBlock));
      if (endBlock !== null && endBlock !== undefined) {
        u.searchParams.set("blockNumberTo", String(endBlock + 1)); // API: obere Grenze exklusiv
      }
    }
    if (next) u.searchParams.set("next", next);
    const res = await fetch(u);
    if (!res.ok) throw new Error("Routescan HTTP " + res.status);
    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error("Unerwartete Routescan-Antwort");
    for (const tx of data.items) {
      const hash = tx.id || tx.txHash || tx.hash || tx.transactionHash || "";
      const block = Number(tx.blockNumber ?? tx.block ?? 0) || 0;
      if (!hash || !block || block > endBlock) continue;
      const feeWei = routescanFeeWei(tx);
      if (feeWei === 0n && bigIntSafe(tx.gasUsed ?? tx.receipt?.gasUsed ?? tx.gas?.used) > 0n) throw new Error("Routescan: Fee-Feld fehlt bei " + hash);
      out.push({ tx_hash:hash.toLowerCase(), block_number:block, fee_native:weiToDecimalString(feeWei), tx_timestamp:normalizeTxTimestamp(tx.timestamp ?? tx.createdAt ?? tx.timeStamp) });
    }
    next = data?.link?.nextToken || null;
    if (next) await sleepMs(520);
    if (page > 5000) throw new Error("Routescan Sicherheitsabbruch nach 5000 Seiten");
  } while (next);
  return out;
}

async function fetchBlockscoutFeeTransactions(chain, address, startBlock, endBlock, onProgress) {
  const base = CHAIN_CONFIG[chain]?.feeApiBase;
  if (!base) throw new Error("Blockscout API-Basis fehlt in public.chains für " + chain);
  const addrLower = address.toLowerCase();
  let nextParams = null, page = 0;
  const out = [];
  do {
    page++; if (onProgress) onProgress(page);
    const u = new URL(`${base}/api/v2/addresses/${address}/transactions`);
    u.searchParams.set("filter", "from");
    if (nextParams) Object.entries(nextParams).forEach(([k,v]) => { if (v !== null && v !== undefined) u.searchParams.set(k, String(v)); });
    const res = await fetch(u);
    if (!res.ok) throw new Error(`Blockscout HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error("Unerwartete Blockscout-Antwort");
    let reachedOldRange = false;
    for (const tx of data.items) {
      const from = String(tx.from?.hash ?? tx.from_address ?? tx.from ?? "").toLowerCase();
      if (from && from !== addrLower) continue;
      const hash = String(tx.hash ?? tx.transaction_hash ?? "");
      const block = Number(tx.block_number ?? tx.blockNumber ?? 0) || 0;
      if (!hash || !block) continue;
      if (endBlock !== null && endBlock !== undefined && block > endBlock) continue;
      if (startBlock !== null && startBlock !== undefined && block < startBlock) { reachedOldRange = true; continue; }
      let feeWei = 0n;
      const feeObj = tx.fee;
      if (feeObj && typeof feeObj === "object") feeWei = bigIntSafe(feeObj.value);
      else feeWei = bigIntSafe(feeObj);
      if (!feeWei) {
        const used = bigIntSafe(tx.gas_used ?? tx.gasUsed);
        const price = bigIntSafe(tx.effective_gas_price ?? tx.effectiveGasPrice ?? tx.gas_price ?? tx.gasPrice);
        if (used && price) feeWei = used * price;
      }
      out.push({ tx_hash:hash.toLowerCase(), block_number:block, fee_native:weiToDecimalString(feeWei), tx_timestamp:normalizeTxTimestamp(tx.timestamp) });
    }
    nextParams = reachedOldRange && startBlock !== null && startBlock !== undefined ? null : (data.next_page_params || null);
    if (nextParams) await sleepMs(180);
    if (page > 5000) throw new Error("Blockscout Sicherheitsabbruch nach 5000 Seiten");
  } while (nextParams);
  return out;
}

async function nodeRealRpc(method, params) {
  const res = await fetch(NODEREAL_BSC_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({jsonrpc:"2.0", method, params:[params], id:1})
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`NodeReal lieferte keine JSON-Antwort (HTTP ${res.status})`); }
  if (!res.ok) throw new Error(`NodeReal HTTP ${res.status}`);
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.result || {};
}
async function fetchNodeRealRange(address, fromBlock, toBlock, onProgress, progressState) {
  let pageKey = null;
  const out = [];
  do {
    progressState.page++; if (onProgress) onProgress(progressState.page);
    const p = { category:["external"], fromAddress:address, order:"asc", maxCount:"0x3E8" };
    if (fromBlock !== null && fromBlock !== undefined) p.fromBlock = "0x" + Number(fromBlock).toString(16);
    if (toBlock !== null && toBlock !== undefined) p.toBlock = "0x" + Number(toBlock).toString(16);
    if (pageKey) p.pageKey = pageKey;
    const r = await nodeRealRpc("nr_getAssetTransfers", p);
    const txs = Array.isArray(r.transfers) ? r.transfers : [];
    for (const tx of txs) {
      if (String(tx.from || "").toLowerCase() !== address.toLowerCase()) continue;
      const block = Number(bigIntSafe(tx.blockNum));
      if (toBlock !== null && block > toBlock) continue;
      const feeWei = bigIntSafe(tx.gasUsed || 0) * bigIntSafe(tx.gasPrice || 0);
      out.push({ tx_hash:String(tx.hash || "").toLowerCase(), block_number:block, fee_native:weiToDecimalString(feeWei), tx_timestamp:normalizeTxTimestamp(tx.blockTimestamp ?? tx.blockTimeStamp) });
    }
    pageKey = r.pageKey || r.PageKey || null;
    if (pageKey) await sleepMs(250);
  } while (pageKey);
  return out;
}
async function fetchBscFeeTransactions(address, startBlock, endBlock, onProgress) {
  const progressState = {page:0};
  if (startBlock === null || startBlock === undefined) {
    // Vollscan: ohne Blockfilter, damit NodeReal nicht automatisch auf 100k Blöcke begrenzt.
    const all = await fetchNodeRealRange(address, null, null, onProgress, progressState);
    return all.filter(tx => tx.block_number <= endBlock);
  }
  const out = [];
  let from = startBlock;
  while (from <= endBlock) {
    const to = Math.min(endBlock, from + 99999); // NodeReal erlaubt max. 100k Blockspanne
    out.push(...await fetchNodeRealRange(address, from, to, onProgress, progressState));
    from = to + 1;
  }
  return out;
}

async function loadExistingFeeHashes(walletId, chain, startBlock) {
  const hashes = new Set();
  let from = 0;
  const pageSize = 1000;
  while (true) {
    let q = sb.from("wallet_fee_transactions").select("tx_hash,block_number")
      .eq("user_id", currentUser.id).eq("wallet_id", String(walletId)).eq("chain", chain)
      .order("block_number", {ascending:true}).range(from, from + pageSize - 1);
    if (startBlock !== null && startBlock !== undefined) q = q.gte("block_number", startBlock);
    const { data, error } = await q;
    if (error) throw new Error("Supabase TX-Hash-Abgleich: " + error.message);
    for (const row of (data || [])) hashes.add(String(row.tx_hash || "").toLowerCase());
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return hashes;
}

async function insertNewFeeTransactions(walletId, chain, txs) {
  for (let i=0; i<txs.length; i+=500) {
    const rows = txs.slice(i, i+500).map(tx => ({ user_id:currentUser.id, wallet_id:String(walletId), chain, ...tx }));
    const { error } = await sb.from("wallet_fee_transactions").upsert(rows, {onConflict:"user_id,wallet_id,chain,tx_hash"});
    if (error) throw new Error("Supabase Gebühren-TX speichern: " + error.message);
  }
}
async function upsertFeeCache(walletId, chain, totalWei, txCount, lastScannedBlock, source) {
  const row = {
    user_id:currentUser.id,
    wallet_id:String(walletId),
    chain,
    total_fee_native:weiToDecimalString(totalWei),
    tx_count:txCount,
    last_scanned_block:lastScannedBlock,
    last_scanned_at:new Date().toISOString(),
    data_source:source,
    updated_at:new Date().toISOString()
  };
  const { data, error } = await sb.from("wallet_fee_cache")
    .upsert(row, {onConflict:"user_id,wallet_id,chain"})
    .select().single();
  if (error) throw new Error("Supabase Gebühren-Cache speichern: " + error.message);
  feeCaches.set(feeCacheKey(walletId, chain), data || row);
  return data || row;
}

async function storedFeeTransactionCount(walletId, chain) {
  const { count, error } = await sb.from("wallet_fee_transactions")
    .select("id", { count:"exact", head:true })
    .eq("user_id", currentUser.id).eq("wallet_id", String(walletId)).eq("chain", chain);
  if (error) throw new Error("Supabase Gebühren-TX Count: " + error.message);
  return Number(count || 0);
}

async function scanCachedEvmFees(chain, wallet, onProgress) {
  let cache = feeCaches.get(feeCacheKey(wallet.id, chain)) || null;

  if (cache) {
    const storedCount = await storedFeeTransactionCount(wallet.id, chain);
    const cacheCount = Number(cache.tx_count || 0);
    if (storedCount !== cacheCount || (cacheCount === 0 && storedCount === 0)) {
      cache = null;
      feeCaches.delete(feeCacheKey(wallet.id, chain));
    }
  }

  if (!feeScanAllowed(cache)) {
    const next = feeNextAllowedDate(cache);
    return {
      chain,
      totalFee:Number(cache.total_fee_native || 0),
      txCount:Number(cache.tx_count || 0),
      cached:true,
      cachedAt:cache.last_scanned_at,
      source:cache.data_source,
      note:`Nächste Aktualisierung ab ${next.toLocaleString("de-CH")}`
    };
  }

  const safeHead = await currentSafeBlock(chain);
  const startBlock = cache && cache.last_scanned_block !== null && cache.last_scanned_block !== undefined
    ? Math.max(0, Number(cache.last_scanned_block) - Number(CHAIN_CONFIG[chain]?.feeOverlapBlocks || 0))
    : null;

  const provider = CHAIN_CONFIG[chain]?.feeProvider;
  let txs;
  if (provider === "routescan") txs = await fetchRoutescanFeeTransactions(chain, wallet.evm, startBlock, safeHead, onProgress);
  else if (provider === "nodereal") txs = await fetchBscFeeTransactions(wallet.evm, startBlock, safeHead, onProgress);
  else if (provider === "blockscout") txs = await fetchBlockscoutFeeTransactions(chain, wallet.evm, startBlock, safeHead, onProgress);
  else throw new Error("Kein EVM-Gebührenprovider in public.chains konfiguriert für " + chain);

  const unique = new Map();
  for (const tx of txs) if (tx.tx_hash) unique.set(tx.tx_hash, tx);

  const existing = cache ? await loadExistingFeeHashes(wallet.id, chain, startBlock) : new Set();
  const candidates = cache
    ? [...unique.values()].filter(tx => !existing.has(tx.tx_hash))
    : [...unique.values()];

  await insertNewFeeTransactions(wallet.id, chain, candidates);

  const addedWei = candidates.reduce((sum, tx) => sum + decimalStringToWei(tx.fee_native), 0n);
  const oldWei = cache ? decimalStringToWei(cache.total_fee_native) : 0n;
  const oldCount = cache ? Number(cache.tx_count || 0) : 0;
  const source = CHAIN_CONFIG[chain]?.feeProvider || "unbekannt";
  const saved = await upsertFeeCache(wallet.id, chain, oldWei + addedWei, oldCount + candidates.length, safeHead, source);

  return {
    chain,
    totalFee:Number(saved.total_fee_native || 0),
    txCount:Number(saved.tx_count || 0),
    cached:false,
    cachedAt:saved.last_scanned_at,
    source,
    note:candidates.length ? `${candidates.length} neue TX hinzugefügt` : "Keine neuen TX"
  };
}

// Alle unterstützten EVM-Gebühren laufen jetzt ohne Alchemy über inkrementelle Provider.

// XRP: xrpscan.com liefert die Gebühr direkt in Drops.
async function fetchBitcoinFees(chain,address,onProgress){
  const base=(configuredFeeBase(chain)||"https://mempool.space/api").replace(/\/$/,"");
  let after="", page=0, totalSat=0n, txCount=0;
  const seen=new Set();
  while(true){
    page++; if(onProgress)onProgress(page);
    const url=`${base}/address/${encodeURIComponent(address)}/txs/chain${after?`/${encodeURIComponent(after)}`:""}`;
    const res=await fetch(url); if(!res.ok)throw new Error(`Bitcoin Gebühren-API HTTP ${res.status}`);
    const txs=await res.json(); if(!Array.isArray(txs)||!txs.length)break;
    for(const tx of txs){
      if(!tx?.txid||seen.has(tx.txid))continue; seen.add(tx.txid);
      const outgoing=(tx.vin||[]).some(v=>String(v?.prevout?.scriptpubkey_address||"")===String(address));
      if(!outgoing)continue;
      totalSat+=bigIntSafe(tx.fee); txCount++;
    }
    if(txs.length<25)break;
    after=txs[txs.length-1]?.txid||""; if(!after)break;
    if(page>20000)throw new Error("Bitcoin Pagination Sicherheitslimit erreicht");
  }
  return {totalFee:Number(totalSat)/1e8,txCount,source:"mempool.space"};
}

async function fetchTronFees(chain,address,onProgress){
  const base=(configuredFeeBase(chain)||"https://apilist.tronscanapi.com/api").replace(/\/$/,"");
  let start=0,page=0,totalSun=0n,txCount=0;
  const limit=50;
  while(true){
    page++; if(onProgress)onProgress(page);
    const qs=new URLSearchParams({sort:"-timestamp",count:"true",limit:String(limit),start:String(start),fromAddress:address,confirm:"0"});
    const res=await fetch(`${base}/transaction?${qs}`); if(!res.ok)throw new Error(`TRON Gebühren-API HTTP ${res.status}`);
    const json=await res.json(); const txs=Array.isArray(json?.data)?json.data:[];
    for(const tx of txs){
      const fee=tx?.cost?.fee ?? tx?.fee ?? 0;
      totalSun+=bigIntSafe(fee); txCount++;
    }
    if(txs.length<limit)break;
    start+=limit;
    // Tronscan begrenzt start+limit auf 10'000. Nicht stillschweigend unvollständig rechnen.
    if(start+limit>10000)throw new Error("TRON-Historie überschreitet das 10'000-Transaktionslimit von Tronscan; vollständige Gebührenberechnung benötigt eine zeitbasierte Pagination-Erweiterung.");
  }
  return {totalFee:Number(totalSun)/1e6,txCount,source:"Tronscan"};
}

async function fetchXrpFees(chain, address, onProgress) {
  let marker=null,totalFeeDrops=0,txCount=0,page=0;
  do {
    page++; if (onProgress) onProgress(page);
    const base=configuredFeeBase(chain);
    const url=`${base}/account/${address}/transactions`+(marker?`?marker=${encodeURIComponent(marker)}`:"");
    const res=await fetch(url); if(!res.ok) throw new Error("HTTP "+res.status);
    const data=await res.json();
    (data.transactions||[]).forEach(tx=>{ if(tx.Account===address){ const fee=parseFloat(tx.Fee||"0"); if(isFinite(fee)){totalFeeDrops+=fee;txCount++;} } });
    marker=data.marker||null;
  } while(marker&&page<FEES_MAX_PAGES);
  return {totalFee:totalFeeDrops/1e6,txCount,truncated:!!marker&&page>=FEES_MAX_PAGES,source:"xrpscan"};
}

const SOLANA_FEES_MAX_PAGES = 20;
async function fetchSolanaFees(chain,address,onProgress){
  let rpcUrl=configuredFeeBase(chain);
  if(rpcUrl.includes("publicnode.com")&&PUBLICNODE_TOKEN&&!rpcUrl.endsWith(PUBLICNODE_TOKEN)){
    rpcUrl=rpcUrl.replace(/\/+$/,"")+"/"+publicnodeToken(chain);
  }
  let before,totalFeeLamports=0,txCount=0,page=0;
  while(page<SOLANA_FEES_MAX_PAGES){
    page++; if(onProgress)onProgress(page);
    const params=before?[address,{limit:1000,before}]:[address,{limit:1000}];
    const res=await fetch(rpcUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"getSignaturesForAddress",params})});
    const data=await res.json(); if(data.error)throw new Error(data.error.message);
    const sigs=data.result||[]; if(sigs.length===0)break;
    for(let i=0;i<sigs.length;i+=20){
      const chunk=sigs.slice(i,i+20),batchBody=chunk.map((x,idx)=>({jsonrpc:"2.0",id:idx,method:"getTransaction",params:[x.signature,{maxSupportedTransactionVersion:0}]}));
      const bres=await fetch(rpcUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(batchBody)}),bdata=await bres.json();
      const arr=Array.isArray(bdata)?bdata:[bdata];
      arr.forEach(r=>{const tx=r&&r.result;if(!tx||!tx.meta)return;const keys=tx.transaction&&tx.transaction.message&&tx.transaction.message.accountKeys;if(!keys||!keys.length)return;const payer=typeof keys[0]==="string"?keys[0]:(keys[0].pubkey||"");if(payer===address){totalFeeLamports+=tx.meta.fee||0;txCount++;}});
    }
    before=sigs[sigs.length-1].signature;if(sigs.length<1000)break;
  }
  return {totalFee:totalFeeLamports/1e9,txCount,truncated:page>=SOLANA_FEES_MAX_PAGES,source:"publicnode-solana"};
}

async function fetchApertumFees(chain,address,onProgress){
  let nextParams=null,totalFeeWei=0n,txCount=0,page=0;const addrLower=address.toLowerCase();
  do{
    page++;if(onProgress)onProgress(page);let url=`${configuredFeeBase(chain)}/addresses/${address}/transactions`;if(nextParams)url+="?"+new URLSearchParams(nextParams).toString();
    const res=await fetch(url);if(!res.ok)throw new Error("HTTP "+res.status);const data=await res.json();
    (data.items||[]).forEach(tx=>{const fromAddr=((tx.from&&tx.from.hash)||tx.from_address||"").toLowerCase();if(fromAddr!==addrLower)return;let feeWei=null;try{if(tx.fee&&tx.fee.value)feeWei=BigInt(tx.fee.value);else if(tx.gas_used&&tx.gas_price)feeWei=BigInt(tx.gas_used)*BigInt(tx.gas_price);}catch(e){}if(feeWei!==null){totalFeeWei+=feeWei;txCount++;}});
    nextParams=data.next_page_params||null;
  }while(nextParams&&page<FEES_MAX_PAGES);
  return {totalFee:Number(totalFeeWei)/1e18,txCount,truncated:!!nextParams&&page>=FEES_MAX_PAGES,source:"apertum-explorer"};
}

// ---- Token-Approval-Checker (nur lesend, Revoke passiert extern über revoke.cash) ----
function approvalsChains() { return Object.keys(CHAIN_CONFIG).filter(c => CHAIN_CONFIG[c]?.approvalsEnabled === true); }
let activeApprovalsChains = new Set();

function renderApprovalsChainFilter() {
  const el = document.getElementById("approvalsChainContainer");
  if (!el) return;
  el.innerHTML = approvalsChains().map(chain => {
    const meta = CHAIN_META[chain];
    const checked = activeApprovalsChains.has(chain) ? "checked" : "";
    return `<label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;cursor:pointer">
      <input type="checkbox" ${checked} onchange="toggleApprovalsChain('${chain}', this.checked)" style="width:auto" />
      <span class="dot" style="background:${escapeAttr(CHAIN_CONFIG[meta.dot]?.displayColor || "#6b7280")}"></span> ${meta.label}
    </label>`;
  }).join("");
}
function toggleApprovalsChain(chain, isChecked) {
  if (isChecked) activeApprovalsChains.add(chain);
  else activeApprovalsChains.delete(chain);
}
function setAllApprovalsChains(selectAll) {
  activeApprovalsChains = selectAll ? new Set(approvalsChains()) : new Set();
  renderApprovalsChainFilter();
}

function renderApprovalsWalletSelect() {
  const el = document.getElementById("approvalsWalletSelect");
  if (!el) return;
  const current = el.value;
  el.innerHTML = `<option value="">– Wallet wählen –</option>` +
    wallets.map(w => `<option value="${w.id}">${escapeAttr(w.label)}</option>`).join("");
  if (wallets.some(w => w.id === current)) el.value = current;
}

// "Unlimitiert" ist bei ERC20-Freigaben keine feste Zahl, sondern Konvention - Wallets/Dapps
// setzen dafür meist den maximal möglichen uint256-Wert. Alles über 2^255 wird hier als
// praktisch unlimitiert behandelt (deckt auch leicht abweichende "Fast-Maximalwerte" ab).
const APPROVAL_UNLIMITED_THRESHOLD = 2n ** 255n;

async function genericRpcCall(url, method, params) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ jsonrpc:"2.0", id:1, method, params })
  });
  if (!res.ok) throw new Error("RPC HTTP " + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "RPC-Fehler");
  return data.result;
}

async function fetchBlockscoutApprovalPairs(chain, address, onProgress) {
  const base = CHAIN_CONFIG[chain]?.approvalsApiBase;
  if (!base) throw new Error("Freigaben API-Basis fehlt in public.chains");
  const ownerLower = address.toLowerCase();
  const pairs = new Map();
  let nextParams = null;
  let page = 0;

  // Blockscout liefert die ausgehenden Transaktionen der Wallet. Für jede Transaktion
  // lesen wir die Logs und suchen ERC-20 Approval(address,address,uint256).
  do {
    page++;
    if (onProgress) onProgress(page);
    let url = `${base.replace(/\/+$/,"")}/addresses/${address}/transactions`;
    if (nextParams) url += "?" + new URLSearchParams(nextParams).toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error("Blockscout HTTP " + res.status);
    const data = await res.json();

    const outgoing = (data.items || []).filter(tx => {
      const fromAddr = ((tx.from && tx.from.hash) || tx.from_address || "").toLowerCase();
      return fromAddr === ownerLower && tx.hash;
    });

    // Begrenzte Parallelität, um den Explorer nicht unnötig zu belasten.
    for (let i=0; i<outgoing.length; i+=8) {
      const chunk=outgoing.slice(i,i+8);
      const logRows=await Promise.all(chunk.map(async tx=>{
        const lr=await fetch(`${base.replace(/\/+$/,"")}/transactions/${tx.hash}/logs`);
        if(!lr.ok) return [];
        const ld=await lr.json();
        return (ld.items || []).map(log=>({log,tx}));
      }));
      logRows.flat().forEach(({log,tx})=>{
        const topics=log.topics || [];
        if(topics.length<3) return;
        const topic0=String(topics[0]||"").toLowerCase();
        if(!topic0.startsWith("0x8c5be1e5")) return;
        const owner="0x"+String(topics[1]).slice(-40).toLowerCase();
        if(owner!==ownerLower) return;
        const spender="0x"+String(topics[2]).slice(-40);
        const token=((log.address && (log.address.hash || log.address)) || "").toLowerCase();
        if(!/^0x[0-9a-f]{40}$/.test(token)) return;
        pairs.set(token+"|"+spender.toLowerCase(), {
          token, spender,
          blockNumber: tx.block_number || tx.blockNumber || null,
          timestamp: tx.timestamp || null
        });
      });
    }

    nextParams = data.next_page_params || null;
  } while (nextParams && page < FEES_MAX_PAGES);

  return [...pairs.values()];
}

async function fetchBlockscoutApprovalsForChain(chain,address,onProgress) {
  const cfg=CHAIN_CONFIG[chain]||{};
  const rpcUrl=cfg.rpcUrl;
  if(!rpcUrl) throw new Error("RPC-URL für aktuelle Allowance fehlt in public.chains");

  const pairs=await fetchBlockscoutApprovalPairs(chain,address,onProgress);
  if(!pairs.length) return [];

  const ownerArg=address.toLowerCase().replace(/^0x/,"").padStart(64,"0");
  const active=[];

  // Aktuelle allowance() direkt on-chain prüfen. Damit verschwinden historisch
  // widerrufene Approvals aus der Anzeige.
  for(let i=0;i<pairs.length;i+=10){
    const chunk=pairs.slice(i,i+10);
    const rows=await Promise.all(chunk.map(async p=>{
      const spenderArg=p.spender.toLowerCase().replace(/^0x/,"").padStart(64,"0");
      const data="0xdd62ed3e"+ownerArg+spenderArg;
      try {
        const rawHex=await genericRpcCall(rpcUrl,"eth_call",[{to:p.token,data},"latest"]);
        const raw=BigInt(rawHex||"0x0");
        if(raw<=0n) return null;

        // Symbol/Decimals über Standard-ERC20 eth_call. Fehlende Metadaten sind kein Abbruchgrund.
        let decimals=18, symbol=null;
        try {
          const d=await genericRpcCall(rpcUrl,"eth_call",[{to:p.token,data:"0x313ce567"},"latest"]);
          if(d) decimals=Number(BigInt(d));
        } catch(_){}
        try {
          const sym=await genericRpcCall(rpcUrl,"eth_call",[{to:p.token,data:"0x95d89b41"},"latest"]);
          if(sym && sym.length>=130){
            const len=Number(BigInt("0x"+sym.slice(66,130)));
            const hex=sym.slice(130,130+len*2);
            symbol=new TextDecoder().decode(new Uint8Array(hex.match(/.{1,2}/g).map(b=>parseInt(b,16))));
          }
        } catch(_){}

        return {
          chain,
          tokenSymbol:symbol || (p.token.slice(0,8)+"…"),
          tokenAddress:p.token,
          spenderAddress:p.spender,
          spenderLabel:null,
          valueFormatted:String(Number(raw)/Math.pow(10,decimals)),
          isUnlimited:raw > APPROVAL_UNLIMITED_THRESHOLD,
          usdAtRisk:null,
          timestamp:p.timestamp || null
        };
      } catch(e) {
        return null;
      }
    }));
    active.push(...rows.filter(Boolean));
  }
  return active;
}

async function fetchAlchemyApprovalsForChain(chain, address, onProgress) {
  const ownerLower = address.toLowerCase();
  const history = await fetchAlchemyOutgoingTxHashes(chain, address, onProgress);
  const approvalPairs = new Map(); // token|spender -> letzter gefundener Block
  const chunkSize = 50;

  // Approval-Events aus den Receipts der Wallet-Transaktionen auslesen.
  // topic0 beginnt für ERC20 Approval(address,address,uint256) mit 0x8c5be1e5.
  for (let offset = 0; offset < history.hashes.length; offset += chunkSize) {
    const chunk = history.hashes.slice(offset, offset + chunkSize);
    const receipts = await alchemyRpcBatch(chain, chunk.map(h => ({ method: "eth_getTransactionReceipt", params: [h] })), "approvals");
    receipts.forEach(receipt => {
      if (!receipt || receipt.__error) return;
      (receipt.logs || []).forEach(log => {
        const topics = log.topics || [];
        if (topics.length < 3 || !(topics[0] || "").toLowerCase().startsWith("0x8c5be1e5")) return;
        const owner = "0x" + topics[1].slice(-40).toLowerCase();
        if (owner !== ownerLower) return;
        const spender = "0x" + topics[2].slice(-40);
        const token = (log.address || "").toLowerCase();
        if (!token) return;
        approvalPairs.set(token + "|" + spender.toLowerCase(), { token, spender, blockNumber: receipt.blockNumber });
      });
    });
  }

  const pairs = [...approvalPairs.values()];
  if (!pairs.length) return [];

  // Aktuelle Allowance + Token-Metadaten abfragen. Alte, bereits auf 0 gesetzte Freigaben
  // werden dadurch nicht mehr angezeigt.
  const calls = [];
  pairs.forEach(p => {
    const ownerArg = address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const spenderArg = p.spender.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    calls.push({ method: "eth_call", params: [{ to: p.token, data: "0xdd62ed3e" + ownerArg + spenderArg }, "latest"] });
    calls.push({ method: "alchemy_getTokenMetadata", params: [p.token] });
  });
  const rows = await alchemyRpcBatch(chain, calls, "approvals");

  // Block-Zeitstempel nur für aktive Freigaben nachladen.
  const active = [];
  for (let i = 0; i < pairs.length; i++) {
    const rawAllowance = rows[i * 2];
    const meta = rows[i * 2 + 1];
    if (!rawAllowance || rawAllowance.__error) continue;
    let raw;
    try { raw = BigInt(rawAllowance); } catch (e) { continue; }
    if (raw <= 0n) continue;
    const decimals = meta && !meta.__error && Number.isFinite(Number(meta.decimals)) ? Number(meta.decimals) : 18;
    const valueFormatted = Number(raw) / Math.pow(10, decimals);
    active.push({ ...pairs[i], raw, meta: meta && !meta.__error ? meta : {}, valueFormatted });
  }

  const uniqueBlocks = [...new Set(active.map(a => a.blockNumber).filter(Boolean))];
  const blockRows = await alchemyRpcBatch(chain, uniqueBlocks.map(b => ({ method: "eth_getBlockByNumber", params: [b, false] })), "approvals");
  const blockTs = new Map();
  uniqueBlocks.forEach((b, i) => {
    const row = blockRows[i];
    if (row && !row.__error && row.timestamp) blockTs.set(b, Number(BigInt(row.timestamp)) * 1000);
  });

  return active.map(a => ({
    chain,
    tokenSymbol: a.meta.symbol || (a.token.slice(0, 8) + "…"),
    tokenAddress: a.token,
    spenderAddress: a.spender,
    spenderLabel: null,
    valueFormatted: String(a.valueFormatted),
    isUnlimited: a.raw > APPROVAL_UNLIMITED_THRESHOLD,
    usdAtRisk: null,
    timestamp: blockTs.has(a.blockNumber) ? new Date(blockTs.get(a.blockNumber)).toISOString() : null
  }));
}

async function fetchApprovalsForChain(chain,address,onProgress){
  const provider=CHAIN_CONFIG[chain]?.approvalsProvider;
  if(provider==="alchemy") return fetchAlchemyApprovalsForChain(chain,address,onProgress);
  if(provider==="blockscout") return fetchBlockscoutApprovalsForChain(chain,address,onProgress);
  throw new Error(`Freigaben-Provider "${provider||"–"}" ist nicht implementiert`);
}

async function runApprovalsCheck() {
  const btn = document.getElementById("approvalsBtn");
  const status = document.getElementById("approvalsStatus");
  const walletId = document.getElementById("approvalsWalletSelect").value;

  if (!walletId) { status.textContent = "Bitte zuerst eine Wallet auswählen."; return; }
  if (activeApprovalsChains.size === 0) { status.textContent = "Bitte mindestens eine Chain auswählen."; return; }

  const w = wallets.find(x => x.id === walletId);
  if (!w || !w.evm) { status.textContent = "Diese Wallet hat keine EVM-Adresse erfasst."; return; }

  btn.disabled = true;
  btn.textContent = "Scan läuft…";
  let allApprovals = [];

  try {
    for (const chain of approvalsChains().filter(c => activeApprovalsChains.has(c))) {
      status.textContent = `Prüfe Freigaben für ${w.label} auf ${CHAIN_META[chain].label}...`;
      try {
        const found = await fetchApprovalsForChain(chain, w.evm, (page) => {
          status.textContent = `Prüfe Freigaben für ${w.label} auf ${CHAIN_META[chain].label}... (Seite ${page})`;
        });
        allApprovals = allApprovals.concat(found);
      } catch (e) {
        allApprovals.push({ chain, error: e.message });
      }
    }

    renderApprovalsResults(w, allApprovals);
    status.textContent = "Fertig.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Freigaben prüfen";
  }
}

function renderApprovalsResults(wallet, approvals) {
  const el = document.getElementById("approvalsResults");
  const errors = approvals.filter(a => a.error);
  const valid = approvals.filter(a => !a.error);

  if (valid.length === 0 && errors.length === 0) {
    el.innerHTML = `<div class="empty">Keine aktiven Freigaben gefunden - sauber!</div>`;
    return;
  }

  const unlimitedCount = valid.filter(a => a.isUnlimited).length;
  const revokeUrl = `https://revoke.cash/address/${wallet.evm}`;

  const errorNote = errors.length > 0
    ? `<div class="error" style="margin-bottom:10px">Fehler bei: ${errors.map(e => CHAIN_META[e.chain].label + " (" + e.error + ")").join(", ")}</div>`
    : "";

  el.innerHTML = `
    <div class="custom-token-card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <h3 style="margin:0">${escapeAttr(wallet.label)} — ${valid.length} aktive Freigabe(n)${unlimitedCount > 0 ? `, ${unlimitedCount} davon unlimitiert` : ""}</h3>
        <a href="${revokeUrl}" target="_blank" rel="noopener"><button class="secondary">Alle auf revoke.cash ansehen ↗</button></a>
      </div>
      ${errorNote}
      <table>
        <thead><tr><th>Chain</th><th>Token</th><th>An (Spender)</th><th style="text-align:right">Freigabe</th><th style="text-align:right">USD-Risiko</th><th>Datum</th></tr></thead>
        <tbody>
          ${valid.map(a => {
            const meta = CHAIN_META[a.chain];
            const spenderText = a.spenderLabel ? escapeAttr(a.spenderLabel) : (a.spenderAddress || "").slice(0, 10) + "…";
            const dt = a.timestamp ? new Date(a.timestamp).toLocaleDateString("de-CH") : "–";
            return `<tr style="${a.isUnlimited ? 'background:rgba(255,107,107,0.08)' : ''}">
              <td><span class="dot" style="background:${escapeAttr(CHAIN_CONFIG[meta.dot]?.displayColor || "#6b7280")}"></span> ${meta.label}</td>
              <td>${escapeAttr(a.tokenSymbol)}</td>
              <td style="font-size:0.78rem" title="${a.spenderAddress || ''}">${spenderText}</td>
              <td class="num">${a.isUnlimited ? '<span style="color:var(--danger);font-weight:700">⚠ Unlimitiert</span>' : fmt(parseFloat(a.valueFormatted || "0"))}</td>
              <td class="num">${a.usdAtRisk ? fmtUsd(parseFloat(a.usdAtRisk)) : '<span style="color:var(--muted)">–</span>'}</td>
              <td style="font-size:0.78rem">${dt}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
      <div class="note" style="margin-top:10px">Zum Widerrufen: Link oben in deiner Wallet-App öffnen (siehe Hinweis oben), dort verbinden und "Revoke" pro Freigabe klicken.</div>
    </div>
  `;
}

// ---- NFTs (nur auf Knopfdruck, via Alchemy) ----
function nftChains() { return Object.keys(CHAIN_CONFIG).filter(c => CHAIN_CONFIG[c]?.nftEnabled === true); }
let activeNftChains = new Set();

function renderNftChainFilter() {
  const el = document.getElementById("nftChainContainer");
  if (!el) return;
  el.innerHTML = nftChains().map(chain => {
    const meta = CHAIN_META[chain];
    const checked = activeNftChains.has(chain) ? "checked" : "";
    return `<label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;cursor:pointer">
      <input type="checkbox" ${checked} onchange="toggleNftChain('${chain}', this.checked)" style="width:auto" />
      <span class="dot" style="background:${escapeAttr(CHAIN_CONFIG[meta.dot]?.displayColor || "#6b7280")}"></span> ${meta.label}
    </label>`;
  }).join("");
}
function toggleNftChain(chain, isChecked) {
  if (isChecked) activeNftChains.add(chain);
  else activeNftChains.delete(chain);
}
function setAllNftChains(selectAll) {
  activeNftChains = selectAll ? new Set(nftChains()) : new Set();
  renderNftChainFilter();
}

function renderNftWalletSelect() {
  const el = document.getElementById("nftWalletSelect");
  if (!el) return;
  const current = el.value;
  el.innerHTML = `<option value="all">Alle Wallets</option>` +
    wallets.map(w => `<option value="${w.id}">${escapeAttr(w.label)}</option>`).join("");
  if (current === "all" || wallets.some(w => w.id === current)) el.value = current;
}

async function fetchNftsForChain(chain, address, onProgress) {
  assertAlchemyConfigured();
  if (CHAIN_CONFIG[chain]?.nftProvider !== "alchemy") throw new Error("NFT-Provider ist nicht Alchemy");
  const base = configuredNftBase(chain);
  const nfts = [];
  let pageKey = null;
  let page = 0;

  do {
    page++;
    if (onProgress) onProgress(page);
    const qs = new URLSearchParams({ owner: address, withMetadata: "true", pageSize: "100" });
    if (pageKey) qs.set("pageKey", pageKey);
    const res = await fetch(`${base}/${encodeURIComponent(ALCHEMY_API_KEY)}/getNFTsForOwner?${qs.toString()}`, {
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) throw new Error("Alchemy NFT HTTP " + res.status);
    const data = await res.json();
    (data.ownedNfts || []).forEach(n => {
      const contract = n.contract || {};
      const image = n.image || {};
      nfts.push({
        chain,
        tokenAddress: contract.address,
        tokenId: n.tokenId,
        name: n.name || (n.raw && n.raw.metadata && n.raw.metadata.name) || contract.name || "Unbenannt",
        image: normalizeNftImageUrl(image.cachedUrl || image.thumbnailUrl || image.originalUrl || (n.raw && n.raw.metadata && n.raw.metadata.image)),
        collectionName: (n.collection && n.collection.name) || (contract.openSeaMetadata && contract.openSeaMetadata.collectionName) || contract.name,
        possibleSpam: contract.isSpam === true || contract.isSpam === "true" || (contract.spamClassifications || []).length > 0,
        contractType: n.tokenType || contract.tokenType
      });
    });
    pageKey = data.pageKey || null;
  } while (pageKey && page < FEES_MAX_PAGES);

  return nfts;
}

// IPFS-Links (ipfs://...) funktionieren nicht direkt im <img>-Tag - über ein öffentliches Gateway umleiten.
function normalizeNftImageUrl(url) {
  if (!url) return null;
  let u = String(url).trim();
  if (!u) return null;
  if (u.startsWith("ipfs://ipfs/")) u = "ipfs://" + u.slice("ipfs://ipfs/".length);
  if (u.startsWith("ipfs://")) return "https://ipfs.io/ipfs/" + u.slice("ipfs://".length);
  if (u.startsWith("ar://")) return "https://arweave.net/" + u.slice(5);
  if (u.startsWith("//")) return "https:" + u;
  return u;
}

function nftMetadataImage(meta) {
  if (!meta || typeof meta !== "object") return null;
  return normalizeNftImageUrl(
    meta.image ||
    meta.image_url ||
    meta.imageUrl ||
    meta.image_uri ||
    meta.imageUri ||
    meta.animation_url ||
    null
  );
}

function blockscoutNftSpam(obj) {
  const token=obj?.token || {};
  const flags=[obj?.is_spam,obj?.isSpam,obj?.spam,token?.is_spam,token?.isSpam,token?.spam];
  if(flags.some(v=>v===true || v===1 || String(v).toLowerCase()==="true")) return true;
  const rep=String(obj?.reputation || token?.reputation || "").toLowerCase();
  return ["spam","scam","malicious","suspicious"].includes(rep);
}

async function enrichApertumNft(chain, nft) {
  if (!nft?.tokenAddress || nft?.tokenId == null) return nft;
  if (nft.image && nft.name && nft.name !== "Unbenannt") return nft;
  try {
    const base=configuredNftBase(chain);
    const url=`${base}/tokens/${nft.tokenAddress}/instances/${encodeURIComponent(String(nft.tokenId))}`;
    const res=await fetch(url);
    if(!res.ok) return nft;
    const inst=await res.json();
    const meta=inst?.metadata || {};
    const token=inst?.token || {};
    return {
      ...nft,
      name: meta.name || inst?.name || nft.name || token.name || token.symbol || `NFT #${nft.tokenId}`,
      collectionName: nft.collectionName || token.name || token.symbol || null,
      image: nft.image || normalizeNftImageUrl(inst?.image_url) || nftMetadataImage(meta),
      possibleSpam: !!(nft.possibleSpam || blockscoutNftSpam(inst))
    };
  } catch(e) {
    console.warn("Apertum NFT-Metadaten konnten nicht ergänzt werden:", nft.tokenAddress, nft.tokenId, e);
    return nft;
  }
}

// Apertum: eigene Blockscout-API (Alchemy wird dafür hier nicht verwendet).
function apertureNftFromOwnedItem(chain, item) {
  const token=item?.token || {};
  const meta=item?.metadata || {};
  const tokenAddress=token.address || token.address_hash || item.token_address || item.token_address_hash || "";
  const tokenId=item.id ?? item.token_id ?? item.tokenId ?? "";
  const collectionName=token.name || token.symbol || item.collection_name || null;
  return {
    chain,
    tokenAddress,
    tokenId:String(tokenId),
    name:meta.name || item.name || (collectionName ? `${collectionName} #${tokenId}` : `NFT #${tokenId}`),
    image:normalizeNftImageUrl(item.image_url || item.media_url) || nftMetadataImage(meta),
    collectionName,
    possibleSpam:blockscoutNftSpam(item) || blockscoutNftSpam(token),
    contractType:token.type || item.token_type || item.type
  };
}

async function fetchApertumOwnedNfts(chain,address,onProgress){
  const base=configuredNftBase(chain);
  let nextParams=null,page=0;
  const out=[];
  do{
    page++;
    if(onProgress)onProgress(page,"Besitz");
    let url=`${base}/addresses/${address}/nft`;
    if(nextParams)url+="?"+new URLSearchParams(nextParams).toString();
    const res=await fetch(url);
    if(!res.ok)throw new Error("HTTP "+res.status+" (/nft)");
    const data=await res.json();
    for(const item of (data.items||[])){
      let nft=apertureNftFromOwnedItem(chain,item);
      if(!nft.image || !nft.name || nft.name==="Unbenannt") nft=await enrichApertumNft(chain,nft);
      out.push(nft);
    }
    nextParams=data.next_page_params||null;
  }while(nextParams && page<FEES_MAX_PAGES);
  return out;
}

async function fetchApertumCollectionNfts(chain,address,onProgress){
  let nextParams=null,page=0;
  const out=[];
  do{
    page++;
    if(onProgress)onProgress(page,"Collections");
    const base=configuredNftBase(chain);
    let url=`${base}/addresses/${address}/nft/collections`;
    if(nextParams)url+="?"+new URLSearchParams(nextParams).toString();
    const res=await fetch(url);
    if(!res.ok)throw new Error("HTTP "+res.status+" (/nft/collections)");
    const data=await res.json();
    for(const coll of (data.items||[])){
      const collectionName=coll.token && (coll.token.name || coll.token.symbol);
      const collectionSpam=blockscoutNftSpam(coll) || blockscoutNftSpam(coll.token||{});
      for(const inst of (coll.token_instances||[])){
        const meta=inst.metadata||{};
        let nft={
          chain,
          tokenAddress:coll.token && (coll.token.address || coll.token.address_hash),
          tokenId:String(inst.id),
          name:meta.name || inst.name || (collectionName ? `${collectionName} #${inst.id}` : `NFT #${inst.id}`),
          image:normalizeNftImageUrl(inst.image_url) || nftMetadataImage(meta),
          collectionName,
          possibleSpam:!!(collectionSpam || blockscoutNftSpam(inst)),
          contractType:coll.token && coll.token.type
        };
        if(!nft.image || !nft.name || nft.name==="Unbenannt")nft=await enrichApertumNft(chain,nft);
        out.push(nft);
      }
    }
    nextParams=data.next_page_params||null;
  }while(nextParams && page<FEES_MAX_PAGES);
  return out;
}

async function fetchApertumNfts(chain,address,onProgress){
  let owned=[],collections=[],errors=[];
  try{
    owned=await fetchApertumOwnedNfts(chain,address,onProgress);
  }catch(e){
    errors.push(e);
    console.warn("Apertum NFT Owner-Endpoint:",e);
  }

  // Collections is kept as a supplement because some Apertum/Blockscout
  // installations index metadata differently between both endpoints.
  try{
    collections=await fetchApertumCollectionNfts(chain,address,onProgress);
  }catch(e){
    errors.push(e);
    console.warn("Apertum NFT Collections-Endpoint:",e);
  }

  if(!owned.length && !collections.length && errors.length) throw errors[0];

  const merged=new Map();
  for(const nft of [...owned,...collections]){
    const key=`${lowerAddressForNft(nft.tokenAddress)}|${String(nft.tokenId)}`;
    const old=merged.get(key);
    if(!old){
      merged.set(key,nft);
    }else{
      merged.set(key,{
        ...old,
        name:(old.name && !/^NFT #/.test(old.name)) ? old.name : nft.name,
        image:old.image || nft.image,
        collectionName:old.collectionName || nft.collectionName,
        possibleSpam:!!(old.possibleSpam || nft.possibleSpam),
        contractType:old.contractType || nft.contractType
      });
    }
  }
  return [...merged.values()];
}

function lowerAddressForNft(v){ return String(v||"").toLowerCase(); }

// ---- NFT-Cache in Supabase: Live-Abfrage nur auf Knopfdruck ----
let nftCaches = new Map(); // wallet_id -> DB-Zeile
let lastNftFindings = [];

function nftKey(n) {
  return `${n.chain}|${normalizeAddress(n.tokenAddress || "", n.chain)}|${String(n.tokenId)}`;
}
function isNftSpam(n) {
  if (n.userMarkedSpam) return true;
  if (n.userMarkedSafe) return false;
  return !!n.possibleSpam;
}

async function loadNftCacheFromDb() {
  if (!currentUser) return;
  const { data, error } = await sb.from("nft_cache").select("*").eq("user_id", currentUser.id);
  if (error) {
    console.error("NFT-Cache:", error);
    return;
  }
  nftCaches = new Map();
  (data || []).forEach(row => nftCaches.set(String(row.wallet_id), row));
  onNftWalletChange();
}

function cachedNftsForSelection() {
  const walletId = document.getElementById("nftWalletSelect")?.value || "";
  const rows = walletId === "all"
    ? [...nftCaches.values()]
    : (nftCaches.get(String(walletId)) ? [nftCaches.get(String(walletId))] : []);
  return rows.flatMap(r => Array.isArray(r.nfts) ? r.nfts : []);
}

function onNftWalletChange() {
  lastNftFindings = cachedNftsForSelection();
  renderNftResults(lastNftFindings, []);
  const info = document.getElementById("nftCacheInfo");
  if (!info) return;
  const walletId = document.getElementById("nftWalletSelect")?.value || "";
  const rows = walletId === "all" ? [...nftCaches.values()] : [nftCaches.get(String(walletId))].filter(Boolean);
  if (!rows.length) {
    info.textContent = "Für diese Auswahl sind noch keine NFTs in Supabase gespeichert.";
  } else {
    const latest = rows.map(r => new Date(r.refreshed_at)).filter(d => !isNaN(d)).sort((a,b)=>b-a)[0];
    info.textContent = `Gespeicherter NFT-Stand${latest ? " · zuletzt aktualisiert " + latest.toLocaleString("de-CH") : ""}. Live-Abfrage nur über „NFTs jetzt aktualisieren“.`;
  }
}

async function saveNftCacheForWallet(w, nfts, chains) {
  const payload = {
    user_id: currentUser.id,
    wallet_id: String(w.dbId || w.id),
    wallet_label: w.label,
    selected_chains: chains,
    nfts,
    refreshed_at: new Date().toISOString()
  };
  const { data, error } = await sb.from("nft_cache")
    .upsert(payload, { onConflict: "user_id,wallet_id" }).select().single();
  if (error) throw new Error("NFT-Cache konnte nicht gespeichert werden: " + error.message);
  nftCaches.set(String(w.dbId || w.id), data);
}

async function refreshApertumNftsForWallet(wallet,onProgress=null){
  if(!currentUser||!wallet?.evm)throw new Error("Apertum-Wallet fehlt.");const chain="apertum",found=await fetchApertumNfts(chain,wallet.evm,p=>onProgress?.(p));found.forEach(n=>{n.walletLabel=wallet.label;n.walletId=String(wallet.dbId||wallet.id);});
  const old=nftCaches.get(String(wallet.dbId||wallet.id)),flags=new Map(((old&&old.nfts)||[]).map(n=>[nftKey(n),{spam:!!n.userMarkedSpam,safe:!!n.userMarkedSafe}]));found.forEach(n=>{const f=flags.get(nftKey(n));if(f?.spam)n.userMarkedSpam=true;if(f?.safe)n.userMarkedSafe=true;});
  const others=((old&&old.nfts)||[]).filter(n=>String(n.chain||"")!==chain);await saveNftCacheForWallet(wallet,others.concat(found),[...new Set([...(old?.selected_chains||[]),chain])]);return found;
}

async function runNftLoad() {
  const btn = document.getElementById("nftBtn");
  const status = document.getElementById("nftStatus");
  const walletId = document.getElementById("nftWalletSelect").value;

  if (activeNftChains.size === 0) { status.textContent = "Bitte mindestens eine Chain auswählen."; return; }

  const targetWallets = walletId === "all"
    ? wallets.filter(w => !!w.evm)
    : (wallets.find(x => String(x.id) === String(walletId) && x.evm)
        ? [wallets.find(x => String(x.id) === String(walletId))] : []);

  if (targetWallets.length === 0) { status.textContent = "Keine Wallet mit EVM-Adresse gefunden."; return; }

  btn.disabled = true;
  btn.textContent = "NFTs werden aktualisiert…";
  const errors = [];

  for (const w of targetWallets) {
    let walletNfts = [];
    for (const chain of nftChains().filter(c => activeNftChains.has(c))) {
      status.textContent = `Lade NFTs für ${w.label} auf ${CHAIN_META[chain].label}...`;
      try {
        const nftProvider = CHAIN_CONFIG[chain]?.nftProvider;
        let found;
        if (nftProvider === "blockscout") {
          found = await fetchApertumNfts(chain, w.evm, page => status.textContent = `Lade NFTs für ${w.label} auf ${CHAIN_META[chain].label}... (Seite ${page})`);
        } else if (nftProvider === "alchemy") {
          found = await fetchNftsForChain(chain, w.evm, page => status.textContent = `Lade NFTs für ${w.label} auf ${CHAIN_META[chain].label}... (Seite ${page})`);
        } else {
          throw new Error(`NFT-Provider "${nftProvider || "–"}" ist nicht implementiert`);
        }
        found.forEach(n => { n.walletLabel = w.label; n.walletId = String(w.dbId || w.id); });

        // vorhandene manuelle Spam-Markierungen über Contract + Token-ID übernehmen
        const old = nftCaches.get(String(w.dbId || w.id));
        const oldMap = new Map(((old && old.nfts) || []).map(n => [nftKey(n), {
          spam:!!n.userMarkedSpam,
          safe:!!n.userMarkedSafe
        }]));
        found.forEach(n => {
          const flags=oldMap.get(nftKey(n));
          if(flags?.spam)n.userMarkedSpam=true;
          if(flags?.safe)n.userMarkedSafe=true;
        });
        walletNfts = walletNfts.concat(found);
      } catch (e) {
        errors.push(`${w.label} / ${CHAIN_META[chain].label}: ${e.message}`);
      }
    }
    try {
      await saveNftCacheForWallet(w, walletNfts, [...activeNftChains]);
    } catch(e) {
      errors.push(`${w.label}: ${e.message}`);
    }
  }

  lastNftFindings = cachedNftsForSelection();
  renderNftResults(lastNftFindings, errors);
  onNftWalletChange();
  status.textContent = errors.length ? "Aktualisierung mit Hinweisen abgeschlossen." : "NFTs aktualisiert und in Supabase gespeichert.";
  btn.disabled = false;
  btn.textContent = "NFTs jetzt aktualisieren";
}

async function setNftUserSpam(walletId, chain, tokenAddress, tokenId, marked) {
  const cache = nftCaches.get(String(walletId));
  if (!cache) return;
  const key = `${chain}|${normalizeAddress(tokenAddress || "", chain)}|${String(tokenId)}`;
  const updated = (cache.nfts || []).map(n =>
    nftKey(n) === key ? { ...n, userMarkedSpam: !!marked } : n
  );
  const { data, error } = await sb.from("nft_cache")
    .update({ nfts: updated })
    .eq("user_id", currentUser.id)
    .eq("wallet_id", String(walletId))
    .select().single();
  if (error) {
    alert("Spam-Markierung konnte nicht gespeichert werden: " + error.message);
    return;
  }
  nftCaches.set(String(walletId), data);
  lastNftFindings = cachedNftsForSelection();
  renderNftResults(lastNftFindings, []);
}


async function setNftUserSafe(walletId, chain, tokenAddress, tokenId, marked) {
  const cache=nftCaches.get(String(walletId));
  if(!cache)return;
  const key=`${chain}|${normalizeAddress(tokenAddress||"",chain)}|${String(tokenId)}`;
  const updated=(cache.nfts||[]).map(n =>
    nftKey(n)===key ? {...n,userMarkedSafe:!!marked,userMarkedSpam:marked?false:!!n.userMarkedSpam} : n
  );
  const {data,error}=await sb.from("nft_cache")
    .update({nfts:updated})
    .eq("user_id",currentUser.id)
    .eq("wallet_id",String(walletId))
    .select().single();
  if(error){
    alert("Spam-Ausnahme konnte nicht gespeichert werden: "+error.message);
    return;
  }
  nftCaches.set(String(walletId),data);
  lastNftFindings=cachedNftsForSelection();
  renderNftResults(lastNftFindings,[]);
}

function renderNftResults(nfts, errors = []) {
  const el = document.getElementById("nftResults");
  const errorNote = errors.length > 0 ? `<div class="error" style="margin-bottom:12px">Fehler bei: ${errors.join(", ")}</div>` : "";

  const oldToggle = document.getElementById("nftHideSpamToggle");
  const hideSpam = oldToggle ? oldToggle.checked : true;
  const spamCount = nfts.filter(isNftSpam).length;
  const visible = hideSpam ? nfts.filter(n => !isNftSpam(n)) : nfts;

  const filterBar = `<div class="custom-token-card" style="margin-bottom:14px">
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.85rem">
      <input type="checkbox" id="nftHideSpamToggle" style="width:auto" onchange="renderNftResults(lastNftFindings, [])" ${hideSpam ? "checked" : ""} />
      Spam-verdächtige NFTs ausblenden (${spamCount} von ${nfts.length})
    </label>
  </div>`;

  if (nfts.length === 0) {
    el.innerHTML = errorNote + `<div class="empty">Keine gespeicherten NFTs für diese Auswahl vorhanden.</div>`;
    return;
  }
  if (visible.length === 0) {
    el.innerHTML = errorNote + filterBar + `<div class="empty">Alle gespeicherten NFTs sind als Spam-verdächtig markiert und ausgeblendet.</div>`;
    return;
  }

  el.innerHTML = `${errorNote}${filterBar}
    <div class="note" style="margin-bottom:12px">${visible.length} von ${nfts.length} NFT(s) angezeigt</div>
    <div class="nft-grid">
      ${visible.map(n => {
        const meta = CHAIN_META[n.chain] || {dot:"",label:n.chain};
        const spam = isNftSpam(n);
        return `<div class="nft-card">
          ${n.image ? `<img src="${n.image}" loading="lazy" onerror="this.style.display='none'">` : `<div style="aspect-ratio:1;background:var(--card2);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:0.75rem">Kein Bild</div>`}
          <div class="nft-info">
            <div class="nft-name" title="${escapeAttr(n.name)}">${escapeAttr(n.name)}</div>
            <div class="nft-id">${n.collectionName ? escapeAttr(n.collectionName) + " · " : ""}#${escapeAttr(String(n.tokenId))}</div>
            <div class="nft-id" style="margin-top:3px;display:flex;align-items:center;gap:5px">
              <span class="dot ${meta.dot}" style="width:7px;height:7px"></span> ${meta.label} · ${escapeAttr(n.walletLabel || "")}
            </div>
            ${spam ? `<div style="margin-top:5px"><span class="badge unsafe">⚠ ${n.userMarkedSpam ? "Manuell als Spam markiert" : "Spam-Verdacht"}</span></div>` : ""}
            ${n.userMarkedSafe && n.possibleSpam ? `<div style="margin-top:5px"><span class="badge safe">✓ Spam-Verdacht manuell ignoriert</span></div>` : ""}
            <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
              <button class="${n.userMarkedSpam ? "secondary" : "remove"}" style="padding:6px 8px;font-size:.72rem"
                onclick="setNftUserSpam('${escapeAttr(String(n.walletId || ""))}','${n.chain}','${escapeAttr(n.tokenAddress || "")}','${escapeAttr(String(n.tokenId))}',${n.userMarkedSpam ? "false" : "true"})">
                ${n.userMarkedSpam ? "Spam-Markierung entfernen" : "Als Spam markieren"}
              </button>
              ${n.possibleSpam && !n.userMarkedSpam ? `<button class="secondary" style="padding:6px 8px;font-size:.72rem"
                onclick="setNftUserSafe('${escapeAttr(String(n.walletId || ""))}','${n.chain}','${escapeAttr(n.tokenAddress || "")}','${escapeAttr(String(n.tokenId))}',${n.userMarkedSafe ? "false" : "true"})">
                ${n.userMarkedSafe ? "Spam-Verdacht wieder beachten" : "Spam-Verdacht ignorieren"}
              </button>` : ""}
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>`;
}

// ---- Chat (User <-> Admin) ----

const CHAT_NOTIFICATION_FUNCTION = "chat-notify";

function setChatUnreadBadge(id,count){
  const el=document.getElementById(id);
  if(!el)return;
  const n=Number(count||0);
  el.textContent=n>99?"99+":String(n);
  el.style.display=n>0?"inline-flex":"none";
}

async function updateChatUnreadBadge(){
  if(!currentUser)return;
  try{
    if(isAdmin){
      const {count,error}=await sb.from("chat_messages")
        .select("id",{count:"exact",head:true})
        .eq("sender_type","user")
        .is("read_at",null);
      if(error)throw error;
      setChatUnreadBadge("adminChatUnreadBadge",count||0);
    }else{
      const {count,error}=await sb.from("chat_messages")
        .select("id",{count:"exact",head:true})
        .eq("user_id",currentUser.id)
        .eq("sender_type","admin")
        .is("read_at",null);
      if(error)throw error;
      setChatUnreadBadge("userChatUnreadBadge",count||0);
    }
  }catch(e){
    console.warn("Chat-Ungelesen-Zähler:",e);
  }
}

async function markCurrentChatRead(userId=null){
  try{
    const {error}=await sb.rpc("mark_chat_read",{p_user_id:isAdmin?userId:currentUser.id});
    if(error)throw error;
    await updateChatUnreadBadge();
  }catch(e){
    console.warn("Chat als gelesen markieren:",e);
  }
}

async function triggerChatEmailNotification(messageId){
  if(!messageId)return;
  try{
    const {error}=await sb.functions.invoke(CHAT_NOTIFICATION_FUNCTION,{
      body:{message_id:messageId}
    });
    if(error)throw error;
  }catch(e){
    // Nachricht ist bereits gespeichert. Ein Mailfehler darf den Chat nicht blockieren.
    console.warn("Chat-E-Mail-Benachrichtigung konnte nicht ausgelöst werden:",e);
  }
}

// Realtime-Abo: läuft einmal pro Login, unabhängig davon, welcher Tab gerade offen ist -
// so kommt eine neue Nachricht auch an, wenn man den Chat-Tab gerade nicht anschaut.
let chatRealtimeChannel = null;

function setupChatRealtime() {
  if (chatRealtimeChannel) sb.removeChannel(chatRealtimeChannel); // altes Abo aufräumen, falls schon vorhanden

  if (isAdmin) {
    // Admins: auf ALLE neuen Nachrichten reagieren (kein Filter), da unklar ist, welcher
    // User als nächstes schreibt.
    chatRealtimeChannel = sb.channel("chat-admin-" + currentUser.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, async (payload) => {
        await updateChatUnreadBadge();
        renderAdminChatUserSelect();
        const selectedUserId = document.getElementById("adminChatUserSelect") ? document.getElementById("adminChatUserSelect").value : "";
        if (selectedUserId && payload.new.user_id === selectedUserId) loadAdminChat();
      })
      .subscribe();
  } else {
    // Normale User: nur auf die eigene Konversation gefiltert (RLS würde ohnehin nichts
    // anderes durchlassen, aber der Filter spart unnötige Events).
    chatRealtimeChannel = sb.channel("chat-user-" + currentUser.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `user_id=eq.${currentUser.id}` }, async () => {
        await updateChatUnreadBadge();
        const chatPanel=document.getElementById("tab-chat");
        if(chatPanel?.classList.contains("active")) loadOwnChat();
      })
      .subscribe();
  }
}

function renderChatBubble(msg, isOwnSide) {
  const isAdmin = msg.sender_type === "admin";
  const align = isOwnSide ? "flex-end" : "flex-start";
  const bg = isAdmin ? "var(--card2)" : "var(--accent)";
  const color = isAdmin ? "var(--text)" : "#fff";
  const dt = new Date(msg.created_at);
  const dtStr = dt.toLocaleDateString("de-CH") + ", " + dt.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
  return `<div style="align-self:${align};max-width:75%;">
    <div style="background:${bg};color:${color};padding:8px 12px;border-radius:12px;font-size:0.9rem;white-space:pre-wrap;word-break:break-word">${escapeAttr(msg.message)}</div>
    <div class="note" style="margin:2px 4px 0;font-size:0.68rem">${isAdmin ? "Support" : "Du"} · ${dtStr}</div>
  </div>`;
}

async function loadOwnChat() {
  const el = document.getElementById("chatMessagesContainer");
  const { data, error } = await sb.from("chat_messages").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: true });
  if (error) { el.innerHTML = `<div class="error">Fehler beim Laden: ${error.message}</div>`; return; }
  if (!data || data.length === 0) {
    el.innerHTML = `<div class="empty">Noch keine Nachrichten - schreib uns gern etwas!</div>`;
  } else {
    el.innerHTML = data.map(m => renderChatBubble(m, m.sender_type === "user")).join("");
    el.scrollTop = el.scrollHeight;
  }
  await markCurrentChatRead();
}

async function sendChatMessage() {
  const input = document.getElementById("chatMessageInput");
  const text = input.value.trim();
  if (!text) return;
  const { data, error } = await sb.from("chat_messages").insert({
    user_id: currentUser.id,
    sender_type: "user",
    sender_email: currentUser.email,
    message: text
  }).select("id").single();
  if (error) { alert("Fehler beim Senden: " + error.message); return; }
  input.value = "";
  loadOwnChat();
  triggerChatEmailNotification(data?.id);
}

// ---- Chat: Admin-Seite ----
async function renderAdminChatUserSelect() {
  const el = document.getElementById("adminChatUserSelect");
  const current = el.value;
  const { data, error } = await sb.from("chat_messages").select("user_id, sender_email, sender_type, read_at").eq("sender_type", "user");
  if (error) { console.error(error); return; }
  const users = {};
  (data || []).forEach(r => {
    if(!users[r.user_id]) users[r.user_id]={email:r.sender_email||r.user_id,unread:0};
    if(!r.read_at) users[r.user_id].unread++;
  });
  el.innerHTML = `<option value="">– auswählen –</option>` +
    Object.entries(users).map(([uid, info]) => `<option value="${uid}">${escapeAttr(info.email)}${info.unread?` (${info.unread})`:""}</option>`).join("");
  if (Object.keys(users).some(uid => uid === current)) el.value = current;
  await updateChatUnreadBadge();
}

async function loadAdminChat() {
  const userId = document.getElementById("adminChatUserSelect").value;
  const el = document.getElementById("adminChatMessagesContainer");
  const inputRow = document.getElementById("adminChatInputRow");
  if (!userId) { el.innerHTML = ""; inputRow.style.display = "none"; return; }

  const { data, error } = await sb.from("chat_messages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  if (error) { el.innerHTML = `<div class="error">Fehler beim Laden: ${error.message}</div>`; return; }
  el.innerHTML = (data || []).map(m => renderChatBubble(m, m.sender_type === "admin")).join("") || `<div class="empty">Noch keine Nachrichten.</div>`;
  el.scrollTop = el.scrollHeight;
  inputRow.style.display = "flex";
  await markCurrentChatRead(userId);
  await renderAdminChatUserSelect();
}

async function sendAdminChatMessage() {
  const userId = document.getElementById("adminChatUserSelect").value;
  if (!userId) return;
  const input = document.getElementById("adminChatMessageInput");
  const text = input.value.trim();
  if (!text) return;
  const { data, error } = await sb.from("chat_messages").insert({
    user_id: userId,
    sender_type: "admin",
    sender_email: currentUser.email,
    message: text
  }).select("id").single();
  if (error) { alert("Fehler beim Senden: " + error.message); return; }
  input.value = "";
  loadAdminChat();
  triggerChatEmailNotification(data?.id);
}

async function calculateFeesForWallet(w, status, results) {
  await loadFeeCacheForWallet(w.id);
  for (const chain of feeChains().filter(c => activeFeesChains.has(c))) {
    if (status) status.textContent=`Berechne Gebühren für ${w.label} auf ${CHAIN_META[chain].label}...`;
    const onProgress=page=>{if(status)status.textContent=`Berechne Gebühren für ${w.label} auf ${CHAIN_META[chain].label}... (Seite ${page})`;};

    try {
      const cfg = CHAIN_CONFIG[chain] || {};
      const provider = cfg.feeProvider;

      let r;
      if (cfg.walletType === "evm" && ["routescan","nodereal","blockscout"].includes(provider)) {
        if (!w.evm) { results.push({chain,error:"Keine EVM-Adresse bei dieser Wallet erfasst"}); continue; }
        r = await scanCachedEvmFees(chain,w,onProgress);
      } else {
        const cache=feeCaches.get(feeCacheKey(w.id,chain))||null;
        if(!feeScanAllowed(cache)){
          const next=feeNextAllowedDate(cache);
          r={totalFee:Number(cache.total_fee_native||0),txCount:Number(cache.tx_count||0),cached:true,cachedAt:cache.last_scanned_at,source:cache.data_source,note:`Nächste Aktualisierung ab ${next.toLocaleString("de-CH")}`};
        } else if(provider==="mempool"){
          if(!w.btc){results.push({chain,error:"Keine Bitcoin-Adresse bei dieser Wallet erfasst"});continue;}
          r=await fetchBitcoinFees(chain,w.btc,onProgress);
        } else if(provider==="tronscan"){
          if(!w.tron){results.push({chain,error:"Keine TRON-Adresse bei dieser Wallet erfasst"});continue;}
          r=await fetchTronFees(chain,w.tron,onProgress);
        } else if(provider==="xrpscan"){
          if(!w.xrp){results.push({chain,error:"Keine XRP-Adresse bei dieser Wallet erfasst"});continue;}
          r=await fetchXrpFees(chain,w.xrp,onProgress);
        } else if(provider==="solana_publicnode"){
          if(!w.sol){results.push({chain,error:"Keine Solana-Adresse bei dieser Wallet erfasst"});continue;}
          r=await fetchSolanaFees(chain,w.sol,onProgress);
        } else if(provider==="apertum_explorer"){
          if(!w.evm){results.push({chain,error:"Keine EVM-Adresse bei dieser Wallet erfasst"});continue;}
          r=await fetchApertumFees(chain,w.evm,onProgress);
        } else {
          results.push({chain,error:`Gebührenprovider "${provider||"–"}" ist nicht implementiert`});
          continue;
        }

        if(!r.cached){
          const saved=await upsertFeeCache(w.id,chain,decimalStringToWei(r.totalFee),Number(r.txCount||0),null,r.source||provider||"direkte API");
          r.cachedAt=saved.last_scanned_at;
        }
      }
      results.push({chain,...r});
    } catch(e) {
      results.push({chain,error:e.message});
    }
  }
}
async function runFeesCalculation() {
  const btn=document.getElementById("feesBtn"),status=document.getElementById("feesStatus"),resultsEl=document.getElementById("feesResults");
  const walletId=document.getElementById("feesWalletSelect").value;
  if(!walletId){status.textContent="Bitte zuerst eine Wallet auswählen.";return;}
  if(activeFeesChains.size===0){status.textContent="Bitte mindestens eine Chain auswählen.";return;}
  const w=wallets.find(x=>String(x.id)===String(walletId));if(!w){status.textContent="Wallet nicht gefunden.";return;}
  btn.disabled=true;resultsEl.innerHTML="";const results=[];
  try{
    await calculateFeesForWallet(w,status,results);
    renderFeesResults(w,results); status.textContent="Fertig.";
    await renderFeesSummary();
    const info=document.getElementById("feesCacheInfo");if(info)info.textContent=isAdmin?"Admin: Aktualisierung ohne 30-Tage-Sperre.":"Gebührenstand gespeichert. Eine erneute Aktualisierung ist für normale Benutzer nach 30 Tagen möglich.";
  }finally{btn.disabled=false;}
}

async function runAllFeesCalculation(){
  const btn=document.getElementById("feesAllBtn"),single=document.getElementById("feesBtn"),status=document.getElementById("feesStatus"),resultsEl=document.getElementById("feesResults");
  if(activeFeesChains.size===0){status.textContent="Bitte mindestens eine Chain auswählen.";return;}
  btn.disabled=true;single.disabled=true;resultsEl.innerHTML="";
  try{
    for(let i=0;i<wallets.length;i++){
      const w=wallets[i],results=[];
      status.textContent=`Wallet ${i+1}/${wallets.length}: ${w.label}...`;
      await calculateFeesForWallet(w,status,results);
      if(String(document.getElementById("feesWalletSelect").value)===String(w.id)) renderFeesResults(w,results);
      await renderFeesSummary();
      if(i<wallets.length-1) await sleepMs(250);
    }
    status.textContent=`Fertig. ${wallets.length} Wallet${wallets.length===1?"":"s"} geprüft.`;
  }finally{btn.disabled=false;single.disabled=false;}
}

function renderFeesResults(wallet,results){
  const el=document.getElementById("feesResults");
  if(!results||results.length===0){el.innerHTML="";return;}
  if(results.every(r=>r.error)){el.innerHTML=`<div class="error">Alle Abfragen sind fehlgeschlagen. Bitte später nochmal versuchen.</div>`;return;}
  el.innerHTML=`<div class="custom-token-card"><h3 style="margin:0 0 10px">${escapeAttr(wallet.label)} — Gebühren-Total</h3>
    <table><thead><tr><th>Chain</th><th style="text-align:right">Anzahl Tx</th><th style="text-align:right">Gebühren (nativ)</th><th style="text-align:right">Aktueller Coin-Kurs</th><th>Quelle / Stand</th></tr></thead><tbody>
    ${results.map(r=>{
      if(r.error)return `<tr><td><span class="dot" style="background:${escapeAttr(CHAIN_CONFIG[CHAIN_META[r.chain].dot]?.displayColor || "#6b7280")}"></span> ${CHAIN_META[r.chain].label}</td><td colspan="4" class="error" style="text-align:left">Fehler: ${escapeAttr(r.error)}</td></tr>`;
      const nativeSym=NATIVE_SYMBOL[r.chain]||r.chain.toUpperCase(), source=r.source||"bisherige API", when=r.cachedAt?new Date(r.cachedAt).toLocaleString("de-CH"):"live", price=currentGasCoinPrice(r.chain);
      return `<tr><td><span class="dot" style="background:${escapeAttr(CHAIN_CONFIG[CHAIN_META[r.chain].dot]?.displayColor || "#6b7280")}"></span> ${CHAIN_META[r.chain].label}${r.truncated?' <span class="badge unsafe">gekürzt</span>':''}${r.cached?' <span class="badge safe">Cache</span>':''}</td><td class="num">${r.txCount}</td><td class="num">${fmt(r.totalFee)} ${nativeSym}</td><td class="num">${formatUsdPrice(price)}</td><td><span class="note">${escapeAttr(source)} · ${escapeAttr(when)}${r.note?'<br>'+escapeAttr(r.note):''}</span></td></tr>`;
    }).join("")}</tbody></table>
    <div class="note" style="margin-top:10px">Phase 1: Es werden nur die tatsächlich bezahlten Netzwerkgebühren im nativen Coin angezeigt. Der aktuelle Coin-Kurs ist lediglich ein Anhaltspunkt; für die spätere historische USD-Bewertung wird der jeweilige Kurs zum Transaktionszeitpunkt benötigt. ${isAdmin?"Admins können jederzeit aktualisieren.":`Eine erneute Gebührenabfrage ist nach ${FEE_COOLDOWN_DAYS} Tagen möglich.`}</div></div>`;
}

function renderDiscoveryWalletSelect() {
  const el = document.getElementById("discoveryWalletSelect");
  if (!el) return;
  const current = el.value;
  el.innerHTML = `<option value="">– Wallet wählen –</option>` +
    wallets.map(w => `<option value="${w.id}">${escapeAttr(w.label)}</option>`).join("");
  if (wallets.some(w => w.id === current)) el.value = current;
}

// Erkennt typische Phishing-/Airdrop-Scam-Muster im Token-Namen oder -Symbol
// (z.B. "Visit claim-rewards.xyz", "$1000 USDT Bonus" o.ä.) - eine der häufigsten
// Betrugsmaschen bei unaufgeforderten Token-Airdrops. Läuft zusätzlich zur GoPlus-Prüfung.
function isLikelyScamName(text) {
  if (!text) return false;
  return /https?:\/\/|www\.|\.(com|io|net|org|xyz|app|finance|claim|airdrop|site|click|link|gift|bonus|vip|top)\b|visit |claim now|reward|bonus|voucher/i.test(text);
}

// Alchemy Token API: liest alle ERC20-Bestände einer Wallet auf der gewählten Chain.
// Die Scam-Einschätzung erfolgt weiterhin über Namens-Heuristik + GoPlus; Moralis-spezifische
// possible_spam-Daten gibt es hier nicht mehr.
async function discoverEvmTokens(chain, address) {
  const result = await alchemyRpc(chain, "alchemy_getTokenBalances", [address, "erc20"]);
  const balances = (result && result.tokenBalances) || [];
  const nonZero = balances; // aktuelle 0-Bestände bleiben Kandidaten; Historie ergänzt weitere Contracts.

  const known = new Set(
    (SAFE_ADDRESSES[chain] || []).concat(customSafeTokens.filter(t => t.chain === chain).map(t => t.address))
  );
  const unknown = nonZero.filter(t => t.contractAddress && !known.has(t.contractAddress.toLowerCase()));

  // Metadaten gebündelt in Alchemy laden.
  const metas = await alchemyRpcBatch(chain, unknown.map(t => ({ method: "alchemy_getTokenMetadata", params: [t.contractAddress] })));
  const found = [];
  unknown.forEach((t, i) => {
    const addr = t.contractAddress.toLowerCase();
    const meta = metas[i] && !metas[i].__error ? metas[i] : {};
    const decimals = Number.isFinite(Number(meta.decimals)) ? Number(meta.decimals) : 18;
    let raw;
    try { raw = BigInt(t.tokenBalance || "0x0"); } catch (e) { return; }
    const amount = Number(raw) / Math.pow(10, decimals);
    if (!isFinite(amount) || amount < 0) return;
    const nameScamFlag = isLikelyScamName(meta.symbol) || isLikelyScamName(meta.name);
    found.push({
      chain, address: addr,
      symbol: meta.symbol || (addr.slice(0, 8) + "…"),
      name: meta.name,
      amount,
      nameScamFlag,
      alchemySpam: false,
      historical: amount < DUST_THRESHOLD
    });
  });
  return found;
}

// GoPlus Security: kostenlose Risiko-Einschätzung für EVM-Token (kein Key nötig).
// Kein hartes Urteil, nur Signale - Apertum/Tron werden von GoPlus nicht abgedeckt.

async function checkGoPlusRisk(chain, addresses) {
  const chainId = CHAIN_CONFIG[chain]?.evmChainId ? String(CHAIN_CONFIG[chain].evmChainId) : null;
  if (!chainId || addresses.length === 0) return {};
  try {
    const res = await fetch(`https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${addresses.join(",")}`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.result || {};
  } catch (e) {
    return {};
  }
}

function riskFlags(info) {
  if (!info) return [];
  const flags = [];
  if (info.is_honeypot === "1") flags.push("Honeypot");
  if (info.is_blacklisted === "1") flags.push("gelistet als bösartig");
  if (info.cannot_sell_all === "1") flags.push("evtl. nicht verkaufbar");
  if (info.is_mintable === "1") flags.push("beliebig nachprägbar");
  if (info.is_open_source === "0") flags.push("Contract nicht verifiziert");
  return flags;
}


// ---- Discovery-Cache (Supabase): Nicht-Admins max. 1 Scan pro Wallet alle 30 Tage; Admins ohne Sperre ----
const DISCOVERY_COOLDOWN_DAYS = 30;
let discoveryCaches = new Map(); // wallet_id -> Cache-Zeile
let discoveryCache = null;       // Cache der aktuell ausgewählten Wallet

function currentDiscoveryWalletId() {
  const select = document.getElementById("discoveryWalletSelect");
  return select ? String(select.value || "") : "";
}

function getDiscoveryCacheForWallet(walletId) {
  if (!walletId) return null;
  return discoveryCaches.get(String(walletId)) || null;
}

function discoveryNextAllowedDate(cache = discoveryCache) {
  if (!cache || !cache.next_scan_at) return null;
  const d = new Date(cache.next_scan_at);
  return isNaN(d.getTime()) ? null : d;
}

function discoveryScanAllowed(cache = discoveryCache) {
  if (isAdmin) return true;
  const next = discoveryNextAllowedDate(cache);
  return !next || Date.now() >= next.getTime();
}

function formatDiscoveryDate(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("de-CH") + ", " + d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

async function loadDiscoveryCacheFromDb() {
  if (!currentUser) return;
  const { data, error } = await sb
    .from("discovery_cache")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("scanned_at", { ascending: false });

  if (error) {
    console.error("Discovery-Cache:", error);
    discoveryCaches = new Map();
    discoveryCache = null;
    renderDiscoveryCacheState("Discovery-Cache konnte nicht geladen werden.");
    return;
  }

  discoveryCaches = new Map();
  (data || []).forEach(row => {
    if (row.wallet_id !== null && row.wallet_id !== undefined) {
      discoveryCaches.set(String(row.wallet_id), row);
    }
  });

  onDiscoveryWalletChange();
}

function onDiscoveryWalletChange() {
  const walletId = currentDiscoveryWalletId();
  discoveryCache = getDiscoveryCacheForWallet(walletId);

  if (discoveryCache) {
    lastDiscoveryFindings = Array.isArray(discoveryCache.findings) ? discoveryCache.findings : [];
    // Chain-Auswahl ist eine Scan-Einstellung, kein Bestandteil des gespeicherten Ergebnisses.
    // Jeder neue Seiten-/Wallet-Aufruf startet mit allen aktuell aktivierten Discovery-Chains.
    activeDiscoveryChains = new Set(discoveryChains());
    renderDiscoveryChainFilter();
  } else {
    lastDiscoveryFindings = [];
  }

  renderDiscoveryCacheState();
  renderDiscoveryResults(lastDiscoveryFindings);
}

function renderDiscoveryCacheState(extraMessage) {
  const btn = document.getElementById("discoveryBtn");
  const info = document.getElementById("discoveryCacheInfo");
  if (!btn || !info) return;

  const walletId = currentDiscoveryWalletId();
  if (!walletId) {
    btn.disabled = false;
    btn.textContent = "Scan starten";
    info.textContent = extraMessage || "Bitte zuerst eine Wallet auswählen.";
    return;
  }

  discoveryCache = getDiscoveryCacheForWallet(walletId);
  if (!discoveryCache) {
    btn.disabled = false;
    btn.textContent = "Scan starten";
    info.textContent = extraMessage || "Für diese Wallet gibt es noch keinen gespeicherten Discovery-Scan.";
    return;
  }

  const allowed = discoveryScanAllowed(discoveryCache);
  const scanned = formatDiscoveryDate(discoveryCache.scanned_at);
  const next = formatDiscoveryDate(discoveryCache.next_scan_at);
  const walletText = discoveryCache.wallet_label ? ` · Wallet: ${discoveryCache.wallet_label}` : "";

  btn.disabled = !allowed;
  btn.textContent = allowed ? "Discovery aktualisieren" : "Scan noch gesperrt";
  info.textContent = extraMessage ||
    (isAdmin
      ? `Gespeicherter Scan: ${scanned}${walletText}. Admin: Aktualisierung ohne 30-Tage-Sperre.`
      : `Gespeicherter Scan: ${scanned}${walletText}. ${allowed ? "Ein neuer Scan ist jetzt möglich." : `Nächster Scan ab ${next}.`}`);
}

async function saveDiscoveryCache(w, findings, scanNotes) {
  const scannedAt = new Date();
  const nextAt = new Date(scannedAt.getTime() + DISCOVERY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  const walletId = String(w.dbId || w.id);

  const payload = {
    user_id: currentUser.id,
    wallet_id: walletId,
    wallet_label: w.label,
    selected_chains: [...activeDiscoveryChains],
    findings,
    scan_notes: scanNotes || [],
    scanned_at: scannedAt.toISOString(),
    next_scan_at: nextAt.toISOString()
  };

  const { data, error } = await sb
    .from("discovery_cache")
    .upsert(payload, { onConflict: "user_id,wallet_id" })
    .select()
    .single();

  if (error) throw new Error("Discovery-Ergebnis konnte nicht gespeichert werden: " + error.message);

  discoveryCaches.set(walletId, data);
  discoveryCache = data;
  renderDiscoveryCacheState();
}

async function runDiscoveryScan() {
  const btn = document.getElementById("discoveryBtn");
  const status = document.getElementById("discoveryStatus");
  const resultsEl = document.getElementById("discoveryResults");
  const walletId = document.getElementById("discoveryWalletSelect").value;

  if (!walletId) {
    status.textContent = "Bitte zuerst eine Wallet auswählen.";
    return;
  }
  if (activeDiscoveryChains.size === 0) {
    status.textContent = "Bitte mindestens eine Chain auswählen.";
    return;
  }

  const w = wallets.find(x => x.id === walletId);
  if (!w) { status.textContent = "Wallet nicht gefunden."; return; }

  btn.disabled = true;
  resultsEl.innerHTML = "";

  const allFindings = []; // {walletLabel, chain, address, symbol, name, amount, risk: [] | null, nameScamFlag}
  const scanNotes = [];

  // Chains mit discovery_provider=wallet_data: volle Tokenliste liegt bereits im normalen Wallet-Load vor.
  discoveryChains().filter(c => activeDiscoveryChains.has(c) && CHAIN_CONFIG[c]?.discoveryProvider === "wallet_data").forEach(chain => {
    const cd = (walletData[w.id] || {})[chain];
    if (!cd || cd.error) return;
    (cd.tokens || []).forEach(t => {
      if (!isSafeTokenAddress(t.address, chain) && t.amount >= DUST_THRESHOLD) {
        const nameScamFlag = isLikelyScamName(t.symbol) || isLikelyScamName(t.name);
        allFindings.push({ walletLabel: w.label, chain, address: t.address, symbol: t.symbol, name: t.name, amount: t.amount, risk: null, nameScamFlag });
      }
    });
  });

  // EVM-Chains: Alchemy Token API pro Chain
  if (w.evm) {
    for (const chain of discoveryChains().filter(c => activeDiscoveryChains.has(c) && CHAIN_CONFIG[c]?.discoveryProvider === "alchemy")) {
      status.textContent = `Durchsuche ${w.label} auf ${CHAIN_META[chain].label}...`;
      try {
        const found = await discoverEvmTokens(chain, w.evm);
        found.forEach(f => allFindings.push({ walletLabel: w.label, ...f, risk: null }));
      } catch (e) {
        scanNotes.push(`${CHAIN_META[chain].label}: Scan fehlgeschlagen (${e.message}).`);
      }
    }
  }

  // Historische Kandidaten + generische V2-LP-Erkennung.
  if(w.evm){
    for(const chain of discoveryChains().filter(c=>activeDiscoveryChains.has(c))){
      try{
        const hist=await historicalErc20Candidates(chain,w.evm,null);
        const unknown=hist.filter(a=>!isSafeTokenAddress(a,chain));
        const metas=await fetchEvmTokenMetadata(chain,unknown);
        const knownFinding=new Set(allFindings.filter(f=>f.chain===chain).map(f=>f.address.toLowerCase()));
        for(const a of unknown){if(knownFinding.has(a))continue;const k=chain+"|"+a,m=metas[a]||tokenMetaCache[k]||{};allFindings.push({walletLabel:w.label,chain,address:a,symbol:predefinedTokenSymbols[k]||m.symbol||a.slice(0,8)+"…",name:predefinedTokenNames[k]||m.name||null,decimals:predefinedTokenDecimals[k]??m.decimals,amount:0,risk:null,nameScamFlag:false,historical:true});}
      }catch(e){scanNotes.push(`${CHAIN_META[chain]?.label||chain}: historische Kandidaten unvollständig (${e.message}).`);}
    }
    if(window.WalletLPEngine){for(const f of allFindings){if(!CHAIN_CONFIG[f.chain]?.evmChainId)continue;try{const p=await window.WalletLPEngine.pairInfo(f.chain,f.address);if(p){f.isLp=true;f.lpLabel=window.WalletLPEngine.label(f.chain);f.symbol=`${f.lpLabel} ${p.t0.symbol}/${p.t1.symbol}`;f.name=`${p.t0.symbol}/${p.t1.symbol} Liquidity Pool`;}}catch{}}}
  }

  // GoPlus-Risiko-Check, gebündelt pro Chain
  status.textContent = "Prüfe Risiko-Signale...";
  const byChain = {};
  allFindings.forEach(f => {
    if (!CHAIN_CONFIG[f.chain]?.evmChainId) return;
    byChain[f.chain] = byChain[f.chain] || new Set();
    byChain[f.chain].add(f.address);
  });
  for (const chain of Object.keys(byChain)) {
    const addrs = [...byChain[chain]];
    const result = await checkGoPlusRisk(chain, addrs);
    allFindings.forEach(f => {
      if (f.chain === chain && result[f.address.toLowerCase()]) {
        f.risk = riskFlags(result[f.address.toLowerCase()]);
      }
    });
  }

  lastDiscoveryFindings = allFindings;
  renderDiscoveryResults(allFindings);
  const scamCount = allFindings.filter(f => isFindingScam(f)).length;
  let statusText = `Fertig. ${allFindings.length} unbekannte(r) Token gefunden` + (scamCount > 0 ? `, davon ${scamCount} als möglicher Scam markiert.` : ".");
  if (scanNotes.length > 0) statusText += " Hinweis: " + scanNotes.join(" ");

  try {
    await saveDiscoveryCache(w, allFindings, scanNotes);
    statusText += " Ergebnis in Supabase gespeichert.";
  } catch (e) {
    console.error(e);
    statusText += " Achtung: " + e.message;
  }

  status.textContent = statusText;
  renderDiscoveryCacheState();
}

// Fasst GoPlus-Risiko-Flags + Namens-Heuristik zu einer einzigen Scam-Einschätzung zusammen
function isFindingScamSuspect(f) {
  if (f.nameScamFlag) return true;
  if (f.risk && f.risk.length > 0) return true;
  return false;
}
function isFindingScam(f) { return !!f.userMarkedScam || isFindingScamSuspect(f); }

window.historicalErc20Candidates = historicalErc20Candidates;
let lastDiscoveryFindings = [];
let discoveryHideSuspect = true;
let discoveryHideMarkedScam = true;

function renderDiscoveryResults(findings) {
  const el = document.getElementById("discoveryResults");
  if (findings.length === 0) {
    el.innerHTML = `<div class="empty">Keine unbekannten Token gefunden - alles, was deine Wallets halten, steht bereits auf der sicheren Liste (oder es gibt nichts Nennenswertes).</div>`;
    return;
  }

  const suspectEl=document.getElementById("hideScamSuspectToggle"), markedEl=document.getElementById("hideMarkedScamToggle");
  if(suspectEl) discoveryHideSuspect=suspectEl.checked;
  if(markedEl) discoveryHideMarkedScam=markedEl.checked;
  const visible = findings.filter(f => !(discoveryHideMarkedScam && f.userMarkedScam) && !(discoveryHideSuspect && isFindingScamSuspect(f)));
  const suspectCount=findings.filter(f=>isFindingScamSuspect(f)).length, markedCount=findings.filter(f=>f.userMarkedScam).length;
  const filterBar = `<div class="custom-token-card" style="margin-bottom:14px;display:flex;gap:22px;flex-wrap:wrap">
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.85rem">
      <input type="checkbox" id="hideScamSuspectToggle" style="width:auto" onchange="discoveryHideSuspect=this.checked;renderDiscoveryResults(lastDiscoveryFindings)" ${discoveryHideSuspect ? "checked" : ""} />
      Scam-Verdacht ausblenden (${suspectCount} von ${findings.length})
    </label>
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.85rem">
      <input type="checkbox" id="hideMarkedScamToggle" style="width:auto" onchange="discoveryHideMarkedScam=this.checked;renderDiscoveryResults(lastDiscoveryFindings)" ${discoveryHideMarkedScam ? "checked" : ""} />
      Als Scam markierte ausblenden (${markedCount} von ${findings.length})
    </label>
  </div>`;

  if (visible.length === 0) {
    el.innerHTML = filterBar + `<div class="empty">Alle gefundenen Token werden durch die aktiven Scam-Filter ausgeblendet.</div>`;
    return;
  }

  el.innerHTML = filterBar + visible.map(f => {
    const meta = CHAIN_META[f.chain];
    const scam = isFindingScam(f);
    let riskHtml = "";
    if (scam) {
      const reasons = [];
      if (f.userMarkedScam) reasons.push("vom Benutzer als Scam markiert");
      if (f.nameScamFlag) reasons.push("verdächtiger Name/Symbol (Phishing-Muster)");
      if (f.risk && f.risk.length > 0) reasons.push(...f.risk);
      riskHtml = `<span class="badge unsafe" style="background:rgba(255,107,107,0.18);color:var(--danger);font-weight:700">⚠ VERDACHT AUF SCAM: ${reasons.join(", ")}</span>`;
    } else if (f.risk === null) {
      riskHtml = `<span class="badge unsafe">kein Risiko-Check verfügbar</span>`;
    } else {
      riskHtml = `<span class="badge safe">keine Warnung</span>`;
    }
    return `<div class="custom-token-row" style="align-items:flex-start;${scam ? 'border-color:var(--danger)' : ''}">
      <div>
        <div><span class="dot" style="margin-right:6px;background:${escapeAttr(CHAIN_CONFIG[f.chain]?.displayColor || "#6b7280")}"></span>${escapeAttr(f.symbol)}${f.name && f.name !== f.symbol ? ' <span class="note" style="display:inline">(' + escapeAttr(f.name) + ')</span>' : ''} · ${f.historical && Number(f.amount)<DUST_THRESHOLD ? '<span class="badge">historisch gehalten</span>' : fmt(f.amount)} · <span class="note" style="display:inline">${escapeAttr(f.walletLabel)}</span></div>
        <div class="meta">${meta.label} · ${f.address}</div>
        <div style="margin-top:6px">${riskHtml}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        ${scam && f.userMarkedScam
          ? `<button class="secondary" onclick="setDiscoveryUserScam('${f.chain}','${f.address}',false)">Scam-Markierung entfernen</button>`
          : `<button class="remove" onclick="setDiscoveryUserScam('${f.chain}','${f.address}',true)">Als Scam markieren</button>`}
        ${scam ? '' : `<button onclick="addDiscoveredToken('${f.chain}','${f.address}','${escapeAttr(f.symbol)}')">Als sicher hinzufügen</button>`}
      </div>
    </div>`;
  }).join("");
}


async function setDiscoveryUserScam(chain, address, marked) {
  const normAddr = normalizeAddress(address, chain);
  let changed = false;

  lastDiscoveryFindings = lastDiscoveryFindings.map(f => {
    if (f.chain === chain && normalizeAddress(f.address, chain) === normAddr) {
      changed = true;
      return { ...f, userMarkedScam: !!marked };
    }
    return f;
  });

  if (!changed) return;

  renderDiscoveryResults(lastDiscoveryFindings);

  // Den aktuellen wallet-spezifischen Discovery-Cache aktualisieren.
  // Dies ist KEIN neuer Scan und darf deshalb den 30-Tage-Cooldown nicht neu starten.
  const walletId = currentDiscoveryWalletId();
  const cache = getDiscoveryCacheForWallet(walletId);
  if (!cache) return;

  const updatedCache = {
    ...cache,
    findings: lastDiscoveryFindings
  };

  const { data, error } = await sb
    .from("discovery_cache")
    .update({ findings: lastDiscoveryFindings })
    .eq("user_id", currentUser.id)
    .eq("wallet_id", String(walletId))
    .select()
    .single();

  if (error) {
    console.error("Scam-Markierung speichern:", error);
    alert("Die Scam-Markierung konnte nicht gespeichert werden: " + error.message);
    return;
  }

  discoveryCaches.set(String(walletId), data || updatedCache);
  discoveryCache = data || updatedCache;
  renderDiscoveryCacheState();
}

async function addDiscoveredToken(chain, address, symbol) {
  document.getElementById("customChain").value = chain;
  document.getElementById("customAddress").value = address;
  document.getElementById("customLabel").value = symbol;
  await addCustomSafeToken();

  // Aus der lokalen Discovery-Anzeige entfernen; der gespeicherte Monats-Scan bleibt
  // als historisches Ergebnis unverändert und wird beim nächsten Scan ersetzt.
  lastDiscoveryFindings = lastDiscoveryFindings.filter(f =>
    !(f.chain === chain && normalizeAddress(f.address, chain) === normalizeAddress(address, chain))
  );
  showTab("custom");
}

// ---- Initialisierung ----
// Alles Weitere (Wallets/Token laden, rendern) passiert erst nach erfolgreichem
// Login in initAuth() -> onLoggedIn(), siehe oben.
initAuth();
