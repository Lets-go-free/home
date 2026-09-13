(() => {
// WalletTracking · DAO1 Hilfe
// Eigenständiges Hilfe-Modul. Künftige Inhaltsänderungen sollen möglichst nur hier erfolgen.
const HELP_MODULE_BUILD="20260913-180715";
const HELP_MODULE_TIMESTAMP="13.09.2026 18:07:15 CEST";
function renderDAO1Help(){
  const el=document.getElementById("dao1HelpContent");
  if(!el)return;
  el.innerHTML=`<div class="custom-token-card"><h3 style="margin-top:0">DAO1 / Apertum · Hilfe</h3><p class="note">Diese Hilfe beschreibt ausschließlich die DAO1-/Apertum-Funktionen. Allgemeine WalletTracking-Funktionen stehen unter „❓ Hilfe / Handbuch“.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Übersicht</h3><p class="note">Die DAO1-Ansicht fasst die projektspezifischen Apertum-Daten der gespeicherten DAO1-Wallets zusammen. Projektfunktionen sind bewusst in eigene Unter-Tabs getrennt, damit Transaktionen, Claims, Referral Rewards, Liquidity Pools und Konfiguration unabhängig geprüft werden können.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Transaktionen</h3><p class="note">Die „Apertum Transaktionshistorie“ ist eine dauerhaft gespeicherte Historie. Standardmäßig wird ab 01.01.2025 bis heute gearbeitet; Datumsfilter können angepasst werden. „Daten aktualisieren“ ergänzt neue Blockchain-Daten und zugehörige Asset-Flows, ohne die bereits gespeicherte Historie bei jedem Öffnen vollständig neu aufzubauen. Historische USD-Werte verwenden die DAO1-/Apertum-Preislogik und vorhandene Preis-Caches.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Bot-Claims</h3><p class="note">Claims werden als eigene DAO1-Transaktionsart ausgewertet und den bekannten Miner-/Bot-NFTs zugeordnet. Der Claim-Bereich besitzt einen NFT-Filter, damit einzelne Miner getrennt geprüft werden können. Neue Miner-/NFT-Zuordnungen sollen aus der On-Chain-Historie erkannt und anschließend in der Projektklassifikation sauber benannt werden.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Referral Rewards</h3><p class="note">Referral Rewards werden getrennt von normalen Bot-Claims ausgewiesen und nur dort gezählt, wo eine echte Referral-Struktur belegt ist. Fehlende Referral-Aktivität darf nicht als Claim oder anderer Reward-Typ geraten werden.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">NFTs &amp; Klassifikation</h3><p class="note">DAO1-NFTs können projektspezifisch klassifiziert werden, z. B. Mining-Bot, DID, Trading-Bot oder weitere Typen. Eine als „sicher“ klassifizierte NFT soll nicht gleichzeitig als Spam markiert werden können; vor einer Spam-Markierung muss die Sicher-Klassifikation entfernt werden. Besitzerhistorie und Wallet-Wechsel eines NFTs werden getrennt von der reinen NFT-Bezeichnung gespeichert.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Liquidity Pools</h3><p class="note">Beim Öffnen werden die zuletzt gespeicherten Supabase-Daten angezeigt. Aktuelle LP-Positionen, historische Add-/Remove-Ereignisse und Vergleichswerte werden nur über „Daten aktualisieren“ neu von Blockchain/Explorer ermittelt und anschließend wieder gecacht. Ein Tab-Wechsel allein soll keine unnötigen Blockchain-Scans auslösen.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Konfiguration</h3><p class="note">Hier werden DAO1-Projektassets, NFT-Typen und projektbezogene Klassifikationen gepflegt. Die Klassifikation steuert Darstellung, Filter und Auswertung, ersetzt aber nicht die zugrunde liegende On-Chain-Erkennung. Fehlende historische APTM-Kurse können – sofern vorgesehen – manuell ergänzt werden und bleiben als manuelle Werte erkennbar.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Caching &amp; Aktualisierung</h3><p class="note">Transaktions-, Claim-, NFT- und LP-Historien werden persistent gespeichert und inkrementell ergänzt. Bereits bekannte Historie soll nicht unnötig neu geladen werden. Neue Blockchain-Aktivität, Besitzerwechsel, Claims oder andere veränderliche Zustände müssen bei einer Aktualisierung trotzdem erkannt werden.</p></div>`;
}
window.renderDAO1Help=renderDAO1Help;
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>renderDAO1Help(),{once:true});
else renderDAO1Help();
})();
