(() => {
// WalletTracking · DAO1 Hilfe
// Eigenständiges Hilfe-Modul. Künftige Inhaltsänderungen sollen möglichst nur hier erfolgen.
const HELP_MODULE_BUILD="20260919-152652";
const HELP_MODULE_TIMESTAMP="19.09.2026 15:26:52 CEST";
function renderDAO1Help(){
  const el=document.getElementById("dao1HelpContent");
  if(!el)return;
  el.innerHTML=`<div class="custom-token-card"><h3 style="margin-top:0">DAO1 / Apertum · Hilfe</h3><p class="note">Diese Hilfe beschreibt ausschließlich die DAO1-/Apertum-Funktionen. Allgemeine WalletTracking-Funktionen stehen unter „❓ Hilfe / Handbuch“.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Übersicht</h3><p class="note">Die DAO1-Ansicht fasst die projektspezifischen Apertum-Daten der gespeicherten DAO1-Wallets zusammen. Die Bot-Übersicht verwendet den zentralen NFT-/Ownership-Bestand und ergänzt Mining-/Trading-Bots um Kaufdatum, verifizierten Kaufpreis, Claims je Währung sowie den Lifecycle-Status. Trading-Guthaben/Funding wird bewusst getrennt vom Lizenz-Kaufpreis geführt und erst angezeigt, wenn die Einzahlung on-chain eindeutig dem Bot zugeordnet werden kann. DIDs sind keine Bot-Käufe und erhalten keinen Kaufpreis. Projektfunktionen sind bewusst in eigene Unter-Tabs getrennt, damit Transaktionen, Claims, Referral Rewards, Liquidity Pools und Konfiguration unabhängig geprüft werden können.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Transaktionen</h3><p class="note">Die „Apertum Transaktionshistorie“ ist eine dauerhaft gespeicherte Historie. Standardmäßig wird ab 01.01.2025 bis heute gearbeitet; Datumsfilter können angepasst werden. „Daten aktualisieren“ ergänzt neue Blockchain-Daten und zugehörige Asset-Flows, ohne die bereits gespeicherte Historie bei jedem Öffnen vollständig neu aufzubauen. Historische USD-Werte verwenden die DAO1-/Apertum-Preislogik und vorhandene Preis-Caches.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Dashboard-Partner &amp; Rewards</h3><p class="note">Im Dashboard werden DAO1- und APTMDAO-Teampartner strikt getrennt ausgewiesen. Es gibt bewusst keine Addition oder projektweite Deduplizierung: dieselbe Person kann in beiden DAO-Versionen unterschiedliche Wallets und unterschiedliche DIDs verwenden. Die eigenen Root-DIDs zählen im jeweiligen Tree nicht als Partner. Rewards und Referral Rewards werden in Originaltoken/-menge dargestellt, nicht in USD.</p></div><div class="custom-token-card"><h3 style="margin-top:0">Bot-Claims</h3><p class="note">Claims werden als eigene DAO1-Transaktionsart ausgewertet und den bekannten Miner-/Bot-NFTs zugeordnet. Der Claim-Bereich besitzt einen NFT-Filter, damit einzelne Miner getrennt geprüft werden können. Neue Miner-/NFT-Zuordnungen sollen aus der On-Chain-Historie erkannt und anschließend in der Projektklassifikation sauber benannt werden.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Referral Rewards</h3><p class="note">Referral Rewards werden getrennt von normalen Bot-Claims ausgewiesen und nur dort gezählt, wo eine echte Referral-Struktur belegt ist. Dieselbe Trennung gilt im Dashboard: Bot-Claims erscheinen unter „Rewards“, DID-/verifizierte Referral-Auszahlungen unter „Referral Rewards“; die Originalmengen stammen aus denselben gespeicherten Asset-Flows wie im Detailtab. Fehlende Referral-Aktivität darf nicht als Claim oder anderer Reward-Typ geraten werden.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Team</h3><p class="note">Der Team-Bereich führt zwei strikt getrennte Untertabs: „Tree DAO1 (alt)“ und „Tree APTMDAO (neu)“. Partner, Ebenen, DIDs und Referral Rewards dürfen zwischen diesen Trees nicht zusammengeführt werden. DAO1 und APTMDAO besitzen eigenständige DID-Systeme. DIDs, Wallets, Partnernamen/Aliase und Tree-Beziehungen werden deshalb vollständig getrennt geführt. Eigene Tree-Roots werden automatisch aus den aktuell zu den DAO-Wallets gehörenden DID-NFTs ermittelt. Bei mehreren eigenen DIDs wird je DID ein eigener Root-Baum aufgebaut; der Root-Filter kann alle oder eine einzelne DID anzeigen. Ein DID-NFT kann auf ein anderes Wallet übertragen werden, die historische Tree-Kante wird dadurch nicht automatisch verändert. Beim alten Tree ist die Parent-Beziehung über das DID-Mint-Event <code>TokenMinted(to, tokenId, fid)</code> verifiziert; <code>fid</code> wird als Parent-ID verwendet. Der Button „Tree DAO1 on-chain ermitteln“ liest diese Kanten direkt von Apertum und zeigt nur dekodierbare, verifizierte Beziehungen. Beim neuen APTMDAO-Tree ist die Parent-Beziehung jetzt on-chain über den verifizierten NFT-Mint-Event belegt: topics[1] enthält die neue APTMDAO-ID, topics[2] die Parent-ID und topics[3] die Wallet. Der neue Graph besitzt einen eigenen globalen Supabase-/IndexedDB-Cache und wird mit 24 Block Overlap inkrementell aktualisiert. Der alte DAO1-Tree wird nach erfolgreicher Discovery als hierarchischer Baum analog zum TLN/VOW-Team dargestellt, bis maximal 20 Ebenen. Partnernamen werden je DAO-Version an deren DID gespeichert: <code>dao1:did:&lt;DID&gt;</code> beziehungsweise <code>aptmdao:did:&lt;DID&gt;</code>. Es erfolgt keine automatische Namensübernahme zwischen DAO1 und APTMDAO, auch nicht bei gleicher Wallet-Adresse. Zweige können ein-/ausgeklappt werden; die technische Kantentabelle bleibt nur als DEV/Diagnoseansicht. Details je Partner zeigen DID/Wallet und den Mint-Nachweis; Membership, NFTs/Bots, Kaufdatum, Kaufpreis und Referral-Zuordnung werden nur angezeigt, wenn sie on-chain belastbar belegt sind.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">NFTs &amp; Klassifikation</h3><p class="note">DAO1-NFTs können projektspezifisch klassifiziert werden, z. B. Mining-Bot, DID, Trading-Bot oder weitere Typen. Eine als „sicher“ klassifizierte NFT soll nicht gleichzeitig als Spam markiert werden können; vor einer Spam-Markierung muss die Sicher-Klassifikation entfernt werden. Besitzerhistorie und Wallet-Wechsel eines NFTs werden getrennt von der reinen NFT-Bezeichnung gespeichert.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Liquidity Pools</h3><p class="note">Beim Öffnen werden die zuletzt gespeicherten Supabase-Daten angezeigt. Aktuelle LP-Positionen, historische Add-/Remove-Ereignisse und Vergleichswerte werden nur über „Daten aktualisieren“ neu von Blockchain/Explorer ermittelt und anschließend wieder gecacht. Ein Tab-Wechsel allein soll keine unnötigen Blockchain-Scans auslösen.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Konfiguration</h3><p class="note">Hier werden DAO1-Projektassets, NFT-Typen und projektbezogene Klassifikationen gepflegt. Die Klassifikation steuert Darstellung, Filter und Auswertung, ersetzt aber nicht die zugrunde liegende On-Chain-Erkennung. Fehlende historische APTM-Kurse können – sofern vorgesehen – manuell ergänzt werden und bleiben als manuelle Werte erkennbar.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Caching &amp; Aktualisierung</h3><p class="note">Transaktions-, Claim-, NFT- und LP-Historien werden persistent gespeichert und inkrementell ergänzt. Bereits bekannte Historie soll nicht unnötig neu geladen werden. Neue Blockchain-Aktivität, Besitzerwechsel, Claims oder andere veränderliche Zustände müssen bei einer Aktualisierung trotzdem erkannt werden.</p><p class="note"><strong>APTM/wAPTM-Kurse:</strong> APTM und wAPTM werden 1:1 behandelt. Der USD-Kurs wird on-chain aus dem wAPTM/wUSDT-Referenzpool <code>0x38Ac…89b57</code> ermittelt. Der erste belastbare Marktpreis beginnt mit Pair-Erstellung und erster Liquidität in Block 88'356 am 18.02.2025 12:39:52 UTC. Für frühere Blöcke wird kein späterer Kurs zurückgerechnet, sondern „Noch kein On-Chain-Marktpreis vorhanden“ verwendet.</p></div>`;
}
window.renderDAO1Help=renderDAO1Help;
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>renderDAO1Help(),{once:true});
else renderDAO1Help();
})();

// Phase 4.74: DAO1 Team alt zeigt das on-chain DID-Mint-Datum direkt im Baum. Partner-Details verwenden
// vorhandene Ownership-Daten für Membership und NFTs/Bots; unbekannte Kaufpreise werden nicht geschätzt.

// Phase 4.75: Der alte DAO1-Team-Graph wird nach dem ersten Vollscan global in Supabase
// persistiert. Folgeläufe laden den Baum sofort aus dem Cache und scannen nur ab
// last_verified_block - 24 bis zum aktuellen Apertum-Block. Migration 054 erforderlich.

// Phase 4.76: DAO1-Team-Partnerdetails werden beim Öffnen on-chain angereichert.
// Aktuelle DAO1 Miner/Bots fremder Partner-Wallets werden über den Apertum-NFT-Bestand
// ermittelt. Kaufdatum und Kaufpreis stammen, soweit beweisbar, aus dem NFT-Eingang und
// einer Zahlung derselben Transaktion. Nicht belegbare Werte bleiben "nicht ermittelt".
// Partnernamen verwenden weiterhin wallet-private; bei einem fehlerhaften Einzel-Save
// wird sicher auf list + replace_all des verschlüsselten Alias-Bestands zurückgefallen.

// Phase 4.77: DAO1-Teamdetails zeigen Kaufpreis-Totals je Bot-Typ/Token (nur verifizierte Beträge),
// Bot-Anzahlen in Baumkacheln, Wallet-Copy analog TLN und ESC/Backdrop zum Schliessen des Detaildialogs.
// Bot-Status: aktuelle Bots werden als "laufend" angezeigt; "abgeschlossen" erst nach verifiziertem Target-/Contract-Nachweis.

// Phase 4.78: Team-Kacheln laden Mining-/Trading-Bot-Anzahlen für die aktuell sichtbaren
// Partner automatisch im Hintergrund. Partner-NFTs verwenden project_nfts und explizite
// NFT-/Collection-Metadaten für dieselbe Bot-Typisierung wie eigene Wallets. Kaufpreise
// werden nur aus eindeutig zuordenbaren ausgehenden ERC-20-Zahlungen der Erwerbs-Tx gezeigt.

// Bot-Erwerb: In Team-Details wird neben Kaufpreis auch die on-chain ermittelte Erwerbsart angezeigt.
// Ein NFT-Transfer ohne verifizierte Zahlung erhält keinen erfundenen Kaufpreis; die Quellwallet wird angezeigt.
// "Bonus" wird nur verwendet, wenn ein eigener on-chain Nachweis dafür existiert.

// Phase 4.81: Ein NFT-Mint ohne ERC-20-Zahlung in derselben Tx gilt nicht als kostenloser Bot.
// Anzeige deshalb "Mint / Kaufprüfung offen"; echte Kaufpreise bleiben nur bei verifiziertem Zahlungsfluss.
// Bekannte Discovery-Testfälle: #90068, #90067, #90066, #90065, #89908; #90054 dient als Referenzfall.

// Phase 4.82: TLN/VOW und DAO1/APTM sind strikt getrennte Projekte. DAO1-Partnernamen verwenden ausschließlich dao1:did:<DID>; kein TLN-id:- oder Wallet-Fallback. wallet-private muss diesen Namespace serverseitig explizit akzeptieren.
// Phase 4.83: Historische APTM-Preise bleiben DAO1-spezifisch. aptm_price_history ist nur der globale Block-Fallback-Cache und speichert künftig höchstens den letzten Sync je Pool+Block. Exakte Transaktions-/Claim-Bewertungen verwenden aptm_price_anchors je target_block; Coverage verhindert wiederholte RPC-Scans.

// Phase 4.85: Der globale Legacy-DAO1-Tree-Cache ist auf eine spezialisierte Kantenstruktur verschlankt: child_id ist global eindeutig; redundante Konstanten (chain_key, contract_address, source) werden aus der Kantentabelle entfernt. created_by/updated_by bleiben bewusst erhalten, weil die bestehenden RLS-Policies damit INSERT/UPDATE absichern. Parent- und Block-Indizes bleiben kompakt für Baumaufbau bzw. inkrementelle Discovery. Der separate Graph-State behält Chain/Contract zur Cache-Identität.
// DAO1-Namen/Aliase: verschlüsselte Speicherung mit Referenz dao1:did:<DID>. TLN/VOW-Referenzen werden dafür ausdrücklich nicht verwendet.
