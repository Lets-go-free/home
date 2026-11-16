/* WalletTracking 8.69 – manually triggered, browser-driven, read-only
   historical Native Minter audit. No cron, queue, server writes or claim import. */
(() => {
  'use strict';
  const WALLET = '8a3c5dc6-0610-482d-a327-3f3ba03db158';
  const MODE = 'admin-legacy-native-mint-preview-866';
  const PROOF_BUILD = '868-field-diagnostics';
  const START_OFFSET = 30; // first 30 individually verified in 8.68
  const TOTAL_CANDIDATES = 76;
  const VERIFIED_FIRST_30_RAW = 90576417951299766898n;
  const MAX_CALLS = 10;
  const MAX_PER_CALL = 5;
  let active = false, stopRequested = false, runId = 0;
  let currentOffset = START_OFFSET, checked = 0, calls = 0, rawTotal = 0n;
  let initialUser = null;
  const el = id => document.getElementById(id);
  const formatAptm = raw => `${raw / 10n ** 18n}.${String(raw % (10n ** 18n)).padStart(18, '0')}`;
  const status = (message, failed = false) => {
    const node = el('daoLegacyMintDrainStatus');
    if (!node) return;
    node.textContent = message;
    node.style.color = failed ? 'var(--danger, #b3261e)' : '';
  };
  const render = () => {
    const start = el('daoLegacyMintDrainStart'), stop = el('daoLegacyMintDrainStop');
    if (start) start.disabled = active;
    if (stop) stop.disabled = !active || stopRequested;
    const summary = el('daoLegacyMintDrainCount');
    if (summary) summary.textContent =
      `${checked} von ${TOTAL_CANDIDATES - START_OFFSET} verbleibenden geprüft · ${calls}/${MAX_CALLS} Aufrufe · ${formatAptm(rawTotal)} APTM neu geprüft`;
  };
  const finish = (message, failed = false) => {
    active = false; stopRequested = false; render(); status(message, failed);
  };
  async function start() {
    if (active) return;
    if (!window.isSecureContext || !window.navigator.onLine) {
      status('HTTPS und eine aktive Internetverbindung sind erforderlich.', true); return;
    }
    if (typeof sb === 'undefined' || !isAdmin || !currentUser?.id) {
      status('Nur mit angemeldetem Admin-Konto möglich.', true); return;
    }
    if (!window.confirm('Die letzten 46 historischen DAO-Transaktionen nur lesend prüfen? Höchstens 10 sequenzielle Aufrufe. Keine Claims oder Datenänderungen. Den Browser-Tab geöffnet lassen.')) return;
    active = true; stopRequested = false; checked = 0; calls = 0;
    currentOffset = START_OFFSET; rawTotal = 0n; initialUser = currentUser.id;
    const myRun = ++runId;
    render(); status('Historische Native-Minter-Prüfung gestartet. Browser-Tab geöffnet lassen.');
    while (active && myRun === runId && calls < MAX_CALLS) {
      if (stopRequested) { finish(`Manuell gestoppt bei Offset ${currentOffset}; ${checked} verifiziert.`); return; }
      if (!isAdmin || currentUser?.id !== initialUser) {
        finish('Gestoppt: Admin-Sitzung geändert.', true); return;
      }
      try {
        const {data: sessionData, error: sessionError} = await sb.auth.getSession();
        if (sessionError || !sessionData?.session?.access_token) throw Error('Admin-Sitzung fehlt');
        status(`Prüfe Offset ${currentOffset} · Aufruf ${calls + 1}/${MAX_CALLS}…`);
        const {data, error} = await sb.functions.invoke('dao-reward-refresh', {
          body: {mode: MODE, walletId: WALLET, offset: currentOffset}
        });
        calls++;
        if (error) throw Error(String(error.message || error));
        if (!data || data.ok !== true || data.mode !== MODE || data.proofBuild !== PROOF_BUILD ||
            data.walletId !== WALLET || data.offset !== currentOffset ||
            data.claimsCreated !== 0 || data.stopped !== 'completed' ||
            !Array.isArray(data.results) || !Number.isInteger(data.checked) ||
            data.checked < 1 || data.checked > MAX_PER_CALL ||
            data.selected !== data.checked || data.results.length !== data.checked ||
            data.nextOffset !== currentOffset + data.checked || typeof data.hasMore !== 'boolean') {
          throw Error(`Unerwartete oder unvollständige Server-Antwort bei Offset ${currentOffset}`);
        }
        let batchRaw = 0n;
        for (const row of data.results) {
          if (row.status !== 'verified' || row.reason !== 'matched-native-minter-call-and-event' ||
              !/^[1-9][0-9]*$/.test(String(row.amountRaw)) ||
              !Number.isInteger(row.mintCalls) || row.mintCalls < 1 ||
              row.mintCalls !== row.mintEvents || row.asset !== 'native' || row.decimals !== 18) {
            throw Error(`Nicht verifizierter oder widersprüchlicher Kandidat bei Offset ${currentOffset}`);
          }
          batchRaw += BigInt(row.amountRaw);
        }
        const next = data.nextOffset;
        if (next > TOTAL_CANDIDATES || (data.hasMore === false && next !== TOTAL_CANDIDATES)) {
          throw Error(`Unerwartete Pagination bei Offset ${currentOffset}`);
        }
        rawTotal += batchRaw; checked += data.checked; currentOffset = next;
        render();
        if (!data.hasMore) {
          finish(`Abgeschlossen: 76 von 76 verifiziert, davon 46 in diesem Durchlauf (0 Abweichungen). Neue 46: ${formatAptm(rawTotal)} APTM; alle 76 zusammen: ${formatAptm(VERIFIED_FIRST_30_RAW + rawTotal)} APTM. Keine Datenänderungen.`);
          return;
        }
      } catch (err) {
        finish(`Sofort gestoppt bei Offset ${currentOffset}: ${String(err?.message || err)}. Bereits geprüfte ${checked}, kein automatischer Retry und keine Datenänderungen.`, true);
        return;
      }
    }
    if (myRun === runId) finish(`Sicherheitsgrenze erreicht bei Offset ${currentOffset} (${checked} geprüft). Keine automatische Fortsetzung.`, true);
  }
  window.startDaoLegacyMintDrain869 = start;
  window.stopDaoLegacyMintDrain869 = () => {
    if (!active) return;
    stopRequested = true;
    status('Stopp angefordert. Der laufende Server-Aufruf wird noch abgeschlossen.');
    render();
  };
  window.addEventListener('beforeunload', event => {
    if (active) { event.preventDefault(); event.returnValue = ''; }
  });
  window.addEventListener('pagehide', () => { runId++; active = false; stopRequested = true; });
  window.addEventListener('DOMContentLoaded', render);
})();
