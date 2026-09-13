(() => {
// WalletTracking · Allgemeine Hilfe
// Eigenständiges Hilfe-Modul. Künftige Inhaltsänderungen sollen möglichst nur hier erfolgen.
const HELP_MODULE_BUILD="20260913-180715";
const HELP_MODULE_TIMESTAMP="13.09.2026 18:07:15 CEST";
function renderGeneralHelp(){
  const el=document.getElementById("generalHelpContent");
  if(!el)return;
  el.innerHTML=`<div class="section-title">❓ Hilfe / Handbuch</div>

      <div class="custom-token-card">
        <h3 style="margin-top:0">Schnellstart</h3>
        <p class="note"><strong>1.</strong> Unter „Meine Wallets“ die eigenen Wallets erfassen. <strong>2.</strong> In „Wallet-Tracking · Token-Übersicht“ mit „Daten aktualisieren“ Bestände und projektübergreifende Daten aktualisieren. <strong>3.</strong> „Preise aktualisieren“ erneuert davon getrennt die aktuellen Kurse und USD-Werte. <strong>4.</strong> Unbekannte Token bei Bedarf unter „Entdecken“ prüfen und als eigene sichere Token übernehmen. <strong>5.</strong> Für projektspezifische Funktionen das jeweilige DeFi-Projekt öffnen und dort den Unter-Tab „Hilfe“ verwenden.</p>
      </div>

      <div class="custom-token-card"><h3 style="margin-top:0">📊 Wallet-Tracking &amp; Aktualisierung</h3><p class="note">Beim Login wird zuerst der zuletzt gespeicherte Stand angezeigt. Automatische Live-Prüfungen werden pro Wallet und Datentyp begrenzt; manuelle Aktualisierungen bleiben möglich. „Daten aktualisieren“ erneuert Bestände und die dafür vorgesehenen Datenjobs. „Preise aktualisieren“ erneuert ausschließlich aktuelle Kurse und daraus berechnete USD-Werte – ohne automatisch Discovery-, Staking-, Reward-, Team- oder historische Stichtagsdaten neu aufzubauen. Leere Ergebnisse gelten als gültiger Zustand, wenn der betreffende Datenjob erfolgreich abgeschlossen wurde.</p></div>

      <div class="custom-token-card"><h3 style="margin-top:0">💾 Cache &amp; Datenstand</h3><p class="note">WalletTracking arbeitet bewusst mit persistenten Caches, damit bereits bekannte Blockchain-Historien nicht bei jedem Öffnen vollständig neu geladen werden. Fachlich unveränderliche Historie wird inkrementell ergänzt. Daten, deren Zustand sich später ändern kann, müssen trotz Cache erneut geprüft werden. Eine gültige Cache-Version bedeutet deshalb nicht automatisch, dass ein veränderlicher On-Chain-Status für immer aktuell bleibt.</p></div>

      <div class="custom-token-card"><h3 style="margin-top:0">💰 Kurse</h3><p class="note">Die aktuelle Kursaktualisierung wird zentral über „Preise aktualisieren“ gesteuert. Anzeige-Kommastellen sind von den technischen Token-Decimalseinstellungen getrennt und werden zentral aus den Token-Stammdaten verwendet. Historische Bewertungen, etwa für einen Stichtag oder eine Transaktionshistorie, verwenden die jeweils dafür vorgesehene historische Preislogik.</p></div>

      <div class="custom-token-card"><h3 style="margin-top:0">🧾 Bestandesaufnahme per 31.12.</h3><p class="note">Wähle Stichtag, Zeitzone und eine Wallet oder „Alle Wallets“. „Neu berechnen“ ermittelt den historischen Bestand und speichert den verifizierten Jahresstand dauerhaft. „Nur Kurse aktualisieren“ verändert bereits bestätigte Bestandsmengen nicht. Positionen ohne historischen Kurs bleiben sichtbar und werden nicht stillschweigend aus der Historie entfernt. PDF-/Excel-Exporte dokumentieren die verfügbaren Werte und Quellen.</p></div>

      <div class="custom-token-card"><h3 style="margin-top:0">💸 Gebühren · 🖼️ NFTs · 🔓 Freigaben</h3><p class="note"><strong>Gebühren:</strong> werden walletbezogen gespeichert und gezielt aktualisiert. <strong>NFTs:</strong> werden über die vorgesehenen Wallet-/Projektjobs geladen; Spam-/Sicher-Klassifikationen bleiben getrennt von der eigentlichen On-Chain-Erkennung. <strong>Freigaben:</strong> zeigen Token-Approvals rein lesend an; ein Widerruf erfolgt extern mit der eigenen Wallet.</p></div>

      <div class="custom-token-card"><h3 style="margin-top:0">⚙️ Verwaltung</h3><p class="note"><strong>Meine Wallets:</strong> eigene Wallets verwalten. <strong>Vordefinierte Token:</strong> normale Benutzer sehen die freigegebenen Stammdaten nur lesend; Bearbeitung und technische Verwaltungsfelder sind Admin-Funktionen. <strong>Eigene sichere Token:</strong> persönliche Ergänzungen. <strong>Entdecken:</strong> durchsucht bei Bedarf auch historische Aktivitäten nach früher gehaltenen Token/Positionen.</p></div>

      <div class="custom-token-card"><h3 style="margin-top:0">🔐 Datenschutz</h3><p class="note">Private Walletdaten und persönliche Partner-Aliase werden userbezogen verschlüsselt gespeichert. Öffentliche Blockchain-Daten bleiben naturgemäß öffentlich. Die Anwendung soll private Namen/Zuordnungen nicht unnötig in globale oder öffentliche Caches übernehmen.</p></div>

      <div class="custom-token-card"><h3 style="margin-top:0">📋 Chain-Abdeckung</h3><p class="note">Die Tabelle zeigt, welche allgemeinen Funktionen pro Chain technisch vorgesehen sind. Die konkrete Abdeckung eines einzelnen Laufs kann davon abweichen und wird beim jeweiligen Ergebnis ausgewiesen.</p><div id="helpChainCoverage"></div></div>

      <div class="custom-token-card"><h3 style="margin-top:0">🏦 Projekte</h3><p class="note"><strong>Projektspezifische Bedienung und Fachlogik gehören nicht in dieses allgemeine Handbuch.</strong> Öffne TLN/VOW, DAO1 oder ein anderes DeFi-Projekt und dort den eigenen Unter-Tab „Hilfe“. Dort werden projektspezifische Tabs, Datenquellen, Cache-/Refresh-Regeln, Statusmodelle und Besonderheiten dokumentiert.</p></div>

      <div class="custom-token-card"><h3 style="margin-top:0">💬 Support</h3><p class="note">Wenn Daten fehlen oder eine Abfrage fehlschlägt, sende möglichst Projekt/Chain, Wallet-Bezeichnung, betroffene Funktion sowie die sichtbare Fehlermeldung oder Tx. Private Keys und Seed-Phrases gehören niemals in den Chat.</p></div>`;
}
window.renderGeneralHelp=renderGeneralHelp;
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>renderGeneralHelp(),{once:true});
else renderGeneralHelp();
})();
