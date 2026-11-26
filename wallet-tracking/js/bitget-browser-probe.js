(() => {
  'use strict';
  const button = document.getElementById('bitgetBrowserProbe');
  const output = document.getElementById('bitgetBrowserProbeResult');
  if (!button || !output) return;
  const base = 'https://api.bitget.com';
  const probes = [
    ['Öffentlicher Zeit-Endpunkt', '/api/v2/public/time', false],
    ['Classic Konto (CORS)', '/api/v2/spot/account/info', true],
    ['UTA Konto (CORS)', '/api/v3/account/info', true]
  ];
  async function probe(path, signedShape) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const headers = signedShape ? {
        'ACCESS-KEY': 'wallettracking-invalid-test-key',
        'ACCESS-SIGN': 'invalid-test-signature',
        'ACCESS-TIMESTAMP': String(Date.now()),
        'ACCESS-PASSPHRASE': 'invalid-test-passphrase',
        'Content-Type': 'application/json', 'locale': 'en-US'
      } : {};
      const response = await fetch(base + path, {method:'GET', mode:'cors', credentials:'omit', cache:'no-store', redirect:'error', referrerPolicy:'no-referrer', headers, signal:controller.signal});
      let code = '';
      try { const data = await response.json(); if (/^\d{5}$/.test(String(data.code))) code = String(data.code); } catch (_) {}
      return {readable:true, status:response.status, code};
    } catch (error) {
      return {readable:false, reason:error.name === 'AbortError' ? 'Zeitlimit' : 'Browser/Netzwerk/CORS blockiert oder Anfrage fehlgeschlagen'};
    } finally { clearTimeout(timeout); }
  }
  button.addEventListener('click', async () => {
    button.disabled = true;
    const lines = ['Browser-Test läuft (keine echten Zugangsdaten).'];
    output.textContent = lines.join('\n');
    try {
      for (const [label, path, signedShape] of probes) {
        const r = await probe(path, signedShape);
        lines.push(label + ': ' + (r.readable ? 'Antwort lesbar, HTTP ' + r.status + (r.code ? ', Bitget ' + r.code : '') : r.reason));
        output.textContent = lines.join('\n');
      }
      lines.push('Lesbare Fehlerantworten zeigen CORS-Kompatibilität dieser Antwort, nicht erfolgreiche Anmeldung. Nicht lesbare Antworten beweisen allein kein CORS-Verbot.');
      output.textContent = lines.join('\n');
    } finally { button.disabled = false; }
  });
})();
