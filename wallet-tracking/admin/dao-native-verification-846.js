/* WalletTracking 8.46 – exclusively manual, browser-driven DAO payout verification.
   Uses the previously live-tested 8.45 endpoint unchanged. This is NOT a cron/worker. */
(() => {
  'use strict';
  const WALLET = '8a3c5dc6-0610-482d-a327-3f3ba03db158';
  const MODE = 'verify-native-payout-multi-batch-845';
  const MAX_CALLS = 25; // upper bound per manual start; at most 300 verified per run
  const MAX_PER_CALL = 12;
  let active = false, stopRequested = false, runId = 0;
  let verified = 0, calls = 0, initialUser = null;
  const el = id => document.getElementById(id);
  const write = (message, isError = false) => {
    const node = el('daoNativeDrainStatus');
    if (!node) return;
    node.textContent = message;
    node.style.color = isError ? 'var(--danger, #b3261e)' : '';
  };
  const render = () => {
    const start = el('daoNativeDrainStart'), stop = el('daoNativeDrainStop');
    if (start) start.disabled = active;
    if (stop) stop.disabled = !active || stopRequested;
    const count = el('daoNativeDrainCount');
    if (count) count.textContent = `${verified} in diesem Durchlauf verifiziert · ${calls} Server-Aufrufe`;
  };
  const finish = (message, isError = false) => {
    active = false; stopRequested = false;
    render(); write(message, isError);
  };
  async function start() {
    if (active) return;
    if (!window.isSecureContext || !window.navigator.onLine) {
      write('HTTPS und eine aktive Internetverbindung sind erforderlich.', true); return;
    }
    if (typeof sb === 'undefined' || !isAdmin || !currentUser?.id) {
      write('Nur mit angemeldetem Admin-Konto möglich.', true); return;
    }
    if (!window.confirm('Native DAO-Auszahlungen dieser Test-Wallet seriell verifizieren? Maximal 25 Server-Aufrufe, keine kanonischen Claims oder Rewards. Den Tab geöffnet lassen.')) return;
    active = true; stopRequested = false; verified = 0; calls = 0;
    initialUser = currentUser.id;
    const myRun = ++runId;
    render(); write('Verifikation gestartet. Browser-Tab geöffnet lassen.');
    while (active && myRun === runId && calls < MAX_CALLS) {
      if (stopRequested) { finish(`Auf Wunsch angehalten: ${verified} verifiziert in ${calls} Aufrufen.`); return; }
      if (!isAdmin || !currentUser?.id || currentUser.id !== initialUser) {
        finish('Angehalten: Admin-Sitzung wurde gewechselt oder beendet.', true); return;
      }
      // A valid signed-in session is a prerequisite to any external call.
      try {
        const {data: sessionData,error: sessionError} = await sb.auth.getSession();
        if (sessionError || !sessionData?.session?.access_token) throw new Error('Admin-Sitzung nicht verfügbar');
        write(`Aufruf ${calls + 1}/${MAX_CALLS} läuft · ${verified} verifiziert. Tab geöffnet lassen.`);
        // The already deployed endpoint authenticates the JWT and independently verifies each TX.
        const {data,error} = await sb.functions.invoke('dao-reward-refresh', {
          body: {mode: MODE, walletId: WALLET}
        });
        calls++;
        if (error) {
          let details = String(error.message || error);
          if (typeof error.context?.json === 'function') {
            try { const body = await error.context.json(); details = body?.error || details; } catch (_) { /* keep message */ }
          }
          throw new Error(details);
        }
        if (!data || data.ok !== true || data.mode !== MODE || data.walletId !== WALLET) {
          throw new Error(`Unerwartete Server-Antwort: ${String(data?.stopped || data?.error || 'unbekannt')}`);
        }
        const checked = Number(data.checked), passed = Number(data.verified);
        if (!Number.isInteger(checked) || !Number.isInteger(passed) ||
            checked < 0 || checked > MAX_PER_CALL || passed < 0 || passed > checked ||
            !Array.isArray(data.results) || data.results.length !== checked ||
            data.results.filter(r => r.status === 'verified').length !== passed ||
            data.claimsCreated !== 0 || data.referralPosting !== 'disabled') {
          throw new Error('Widersprüchliche Server-Zähler oder Schutzfelder');
        }
        verified += passed;
        render();
        if (!['batch_complete', 'no_pending', 'time_budget'].includes(data.stopped) || passed !== checked) {
          finish(`Angehalten bei Aufruf ${calls}: ${data.stopped}. ${verified} verifiziert. Bitte Ergebnis prüfen.`, true); return;
        }
        if (data.stopped === 'no_pending') {
          finish(`Keine weiteren Kandidaten ausgewählt. ${verified} Auszahlungen in ${calls} Aufrufen verifiziert. Bitte abschliessend die Datenbank prüfen.`); return;
        }
        if (checked === 0) {
          finish('Angehalten: Kein Fortschritt. Bitte den Kandidatenstatus prüfen.', true); return;
        }
        if (stopRequested) { finish(`Auf Wunsch angehalten: ${verified} Auszahlungen in ${calls} Aufrufen verifiziert.`); return; }
      } catch (error) {
        finish(`Verarbeitung gestoppt nach ${calls} Aufrufen (${verified} verifiziert): ${String(error?.message || error)}. Keine automatische Wiederholung.`, true); return;
      }
    }
    if (myRun === runId) finish(`Sicherheitsgrenze von ${MAX_CALLS} Aufrufen erreicht (${verified} verifiziert). Für Fortsetzung erneut manuell starten und vorher Ergebnis prüfen.`);
  }
  window.startDaoNativeDrain846 = start;
  window.stopDaoNativeDrain846 = () => {
    if (!active) return;
    stopRequested = true;
    write('Stopp angefordert: Der laufende Server-Aufruf wird noch abgeschlossen.');
    render();
  };
  window.addEventListener('beforeunload', event => {
    if (active) { event.preventDefault(); event.returnValue = ''; }
  });
  window.addEventListener('pagehide', () => { runId++; active = false; stopRequested = true; });
  window.addEventListener('DOMContentLoaded', render);
})();
