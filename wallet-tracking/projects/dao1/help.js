// Phase 5.62: DAO-Team lädt Partner-Bots zentral/persistent für Team und Dashboard; Partnerkarten zeigen Mining-/Trading-Bot-Zahlen, direkte Uplines und editierbare Aliase; ESC schließt Details.
// Phase 5.60: Direkte DAO1-/APTMDAO-Uplines werden oberhalb der eigenen Wallet angezeigt; weiter geladene Ancestors dienen nur zur Auflösung und werden nicht als zusätzliche Team-Bäume gerendert.
// Phase 5.58: Der zentrale DAO1/APTMDAO-Kaufpreisadapter wertet ERC-20-Abgänge, direkten nativen APTM-Value und ausgehende native Internal Transactions derselben Erwerbs-Tx aus. Nur eindeutige Zahlungs-Evidenz wird als Kaufpreis gespeichert; Transfer/Mint bleibt ohne erfundenen Preis.\n// Phase 5.58: DAO1-Ownership speichert die Erwerbs-Tx auch bei Wallet-Eingang ohne bereits verifizierten Kauf. Dadurch kann die zentrale NFT-Registry fehlende historische Kaufpreise nachträglich auflösen; negative Preisbefunde ohne Tx bleiben offen.\n// Phase 5.56: DAO1/APTMDAO stellt der zentralen NFT-Registry nur noch den projektspezifischen Kaufpreis-Resolver bereit. Kaufpreis-Evidenz wird zentral im nft_cache persistiert und im NFT-Tab angezeigt; bereits geprüfte Fälle werden nicht erneut on-chain analysiert.
// Phase 5.55: Im wallet-zentrierten DAO-Baum ist die zentrale aktuelle NFT-/Ownership-Registry autoritativ für DID→Wallet. Tree-Event-Adressen sind nur Fallback und dürfen eine bekannte aktuelle DID-Zuordnung nicht überschreiben. Ein eigenes Wallet kann gleichzeitig eine DAO1- und eine APTMDAO-Upline haben; beide werden getrennt oberhalb des eigenen Einstiegsknotens gezeigt. Beziehungen zwischen zwei eigenen Wallets bleiben normale Baumkanten (z. B. DAO1 #25924 unter #21043).
(() => {
// WalletTracking · DAO1 Hilfe
// Eigenständiges Hilfe-Modul. Künftige Inhaltsänderungen sollen möglichst nur hier erfolgen.
const HELP_MODULE_BUILD="20260920-031933";
const HELP_MODULE_TIMESTAMP="20.09.2026 12:18:01 CEST";
function renderDAO1Help(){
  const el=document.getElementById("dao1HelpContent");
  if(!el)return;
  el.innerHTML=`<div class="custom-token-card"><h3 style="margin-top:0">DAO1 / Apertum · Hilfe</h3><p class="note">Diese Hilfe beschreibt ausschließlich die DAO1-/Apertum-Funktionen. Allgemeine WalletTracking-Funktionen stehen unter „❓ Hilfe / Handbuch“.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Übersicht</h3><p class="note">Die DAO1-Ansicht fasst die projektspezifischen Apertum-Daten der gespeicherten DAO1-Wallets zusammen. Die Bot-Übersicht verwendet den zentralen NFT-/Ownership-Bestand und ergänzt Mining-/Trading-Bots um Kaufdatum, verifizierten Kaufpreis, Claims je Währung sowie den Lifecycle-Status. Trading-Guthaben/Funding wird bewusst getrennt vom Lizenz-Kaufpreis geführt und erst angezeigt, wenn die Einzahlung on-chain eindeutig dem Bot zugeordnet werden kann. DIDs sind keine Bot-Käufe und erhalten keinen Kaufpreis. Projektfunktionen sind bewusst in eigene Unter-Tabs getrennt, damit Transaktionen, Claims, Referral Rewards, Liquidity Pools und Konfiguration unabhängig geprüft werden können.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Transaktionen</h3><p class="note">Die „Apertum Transaktionshistorie“ ist eine dauerhaft gespeicherte Historie. Standardmäßig wird ab 01.01.2025 bis heute gearbeitet; Datumsfilter können angepasst werden. „Daten aktualisieren“ ergänzt neue Blockchain-Daten und zugehörige Asset-Flows, ohne die bereits gespeicherte Historie bei jedem Öffnen vollständig neu aufzubauen. Historische USD-Werte verwenden die DAO1-/Apertum-Preislogik und vorhandene Preis-Caches.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Dashboard-Partner &amp; Rewards</h3><p class="note">DAO1- und APTMDAO-Bezüge bleiben separat auswertbar, die übergreifende Partnerzahl folgt aber der wallet-zentrierten Regel: <strong>1 Wallet = 1 Partner</strong>. Hat dasselbe Partner-Wallet in beiden eigenen Downlines eine DID, wird es in der Gesamtzahl nur einmal gezählt; die separaten DAO1-/APTMDAO-Zahlen können dieses Wallet jeweils enthalten. Eigene Wallets zählen nicht als Partner und werden auch aus „Letzte Partneraktivitäten“ ausgeschlossen. Rewards und Referral Rewards werden in Originaltoken/-menge dargestellt, nicht in USD.</p></div><div class="custom-token-card"><h3 style="margin-top:0">Bot-Claims</h3><p class="note">Claims werden als eigene DAO1-Transaktionsart ausgewertet und den bekannten Miner-/Bot-NFTs zugeordnet. Der Claim-Bereich besitzt einen NFT-Filter, damit einzelne Miner getrennt geprüft werden können. Neue Miner-/NFT-Zuordnungen sollen aus der On-Chain-Historie erkannt und anschließend in der Projektklassifikation sauber benannt werden.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Referral Rewards</h3><p class="note">Referral Rewards werden getrennt von normalen Bot-Claims ausgewiesen und nur dort gezählt, wo eine echte Referral-Struktur belegt ist. Dieselbe Trennung gilt im Dashboard: Bot-Claims erscheinen unter „Rewards“, DID-/verifizierte Referral-Auszahlungen unter „Referral Rewards“; die Originalmengen stammen aus denselben gespeicherten Asset-Flows wie im Detailtab. Fehlende Referral-Aktivität darf nicht als Claim oder anderer Reward-Typ geraten werden.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Team</h3><p class="note">Die Standardansicht ist wallet-zentriert: <strong>1 Wallet = 1 Knoten/Partner</strong>. Ein Wallet kann mehrere DAO1- und/oder APTMDAO-DIDs besitzen; diese werden im gleichen Wallet-Knoten visuell getrennt angezeigt, ohne die zugrunde liegenden on-chain Graphen zu vermischen. Auch mehrere eigene Wallets werden anhand ihrer belegten DID-Upline in denselben Baum eingehängt; sie bleiben als „MEINE WALLET“ sichtbar, zählen aber nicht als Partner. Nur tatsächlich unverbundene eigene Strukturen bleiben separate Roots. Die alten separaten DAO1-/APTMDAO-Trees bleiben als Diagnoseansichten erhalten. Ist dieselbe Partner-Wallet in deiner DAO1- und APTMDAO-Downline vorhanden, bestimmt die APTMDAO-Beziehung die Position im kombinierten Baum. Hat ein alter DAO1-Partner im neuen APTMDAO eine andere Upline gewählt, bleibt er nur über seine für dich relevante DAO1-Beziehung in deinem Baum; fremde APTMDAO-Bots werden dadurch nicht deinem Zweig zugerechnet. Eigene Wallets zeigen ihre DAO1-/APTMDAO-DIDs sowie – soweit aus dem Tree bekannt – die jeweilige eigene Upline. Beim cache-first Laden werden neben Root und Downline auch die Parent-/Upline-Kanten der eigenen DIDs aus dem lokalen Browser-Graph gelesen, damit die direkte Upline nach einem Gerätewechsel nicht am eigenen Root abgeschnitten wird. Weiter oberhalb geladene Ancestors dienen nur der technischen Auflösung; in der normalen Teamansicht werden ausschließlich die direkten DAO1-/APTMDAO-Uplines oberhalb der eigenen Wallet gezeigt und keine zusätzlichen Ancestor-Team-Bäume erzeugt. Beim alten Tree ist <code>TokenMinted(to, tokenId, fid)</code> der Parent-Nachweis; beim APTMDAO-Tree liefern Mint-Events child, parent und wallet. Neue Apertum-Miner-Käufe tragen die verwendete APTMDAO-DID zusätzlich direkt im Kaufaufruf. Der verifizierte Referenzfall MinerBot #31722 verwendet DID #7315; deren Parent/Upline ist DID #23. Diese direkte Kauf-DID-Evidenz hat Vorrang vor der historischen Ownership-Heuristik. Für ältere Bots bleibt die historisch belegte Besitzlage am Erwerbsblock der Fallback. Bot und DID dürfen unabhängig transferiert werden. Partnerdetails scannen weiterhin nicht den gesamten NFT-Bestand, sondern nur bekannte Bot-Contracts über contract-gefilterte Transferhistorien. In der Wallet-Detailansicht werden nur Bots des heutigen Owners als aktueller Bestand geführt; Bots, die auf diesem Wallet gekauft und später übertragen wurden, erscheinen getrennt unter „Frühere Bots / übertragen“. Kauf-Wallet, Kauf-Tx und belegter Kaufpreis bleiben historisch am Bot erhalten.</p></div>
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

// Phase 5.38: DAO1 und APTMDAO sind auch bei Partnernamen strikt getrennt.
// Referenzen: dao1:did:<DID> bzw. aptmdao:did:<DID>. Keine automatische Übernahme,
// Addition oder Deduplizierung zwischen den beiden Trees. wallet-private erzeugt den
// verpflichtenden reference_hash aus der vollständigen namespaced Referenz.
// Dokumentationsstand: 19.09.2026 17:04:54 CEST · Phase 5.38 · Build 20260919-170454

// Phase 5.42: DAO1/APTMDAO Partner-Bots werden bei gemeinsam verwendetem Bot-Contract nur mit eindeutiger Erwerbs-Tx-Evidenz dem jeweiligen Tree zugeordnet. Evidenzbasierte Bot-Lifecycles werden userbezogen in dao_partner_bot_lifecycle_cache gespeichert; unklare Fälle bleiben unzugeordnet.
// Dokumentationsstand: 19.09.2026 22:16:56 CEST · Phase 5.43 · Build 20260919-221656

// Phase 5.42: Partnerdetails sind DID-zentriert. DID-NFTs derselben Wallet werden nicht als Assets einer DID angezeigt; nur eindeutig dem DAO-System belegte Mining-/Trading-Bots sowie Memberships. LP in Wallet gilt ohne Lock als frei verfügbar; nur tatsächlich gestaktes LP als gebunden.

// Phase 5.43: Team-Tree-Rendering bleibt Explorer-frei/cache-only. Partnerdetails laden den Wallet-NFT-Bestand gezielt einmal, deduplizieren parallele gleiche Requests und prüfen Erwerbe mit maximal zwei Workern. Identitäts-NFTs werden vor Erwerbsabfragen entfernt. Neue Bots eigener Roots werden dadurch auch ohne vorheriges Öffnen des NFT-Tabs entdeckt; bei fehlender Erwerbs-Tx-Systemevidenz ist eine Zuordnung nur erlaubt, wenn die Wallet im aktiven Tree eindeutig genau einer DID gehört.

// Phase 5.46: Bot→DID historisch über Besitz am Erwerbsblock; keine breite Wallet-NFT-Paginierung mehr.

// Phase 5.47: Eigene historische Bots werden auch nach späteren Wallet-Transfers zur DID-Ermittlung herangezogen; Zuordnung erfolgt über Erwerbs-Wallet + DID-Besitz am Erwerbsblock. Identitäts-NFTs werden aus der Bot-Tabelle ausgeschlossen.
// Phase 5.48: DAO1-alt: Für eigene Bots kann der persistierte historisch verifizierte erste Besitzabschnitt als Erwerbsnachweis dienen; Kaufpreis-Erkennung ist für die DID-Zuordnung nicht zwingend. Fremde/live Bots benötigen weiterhin Kaufnachweis. Historische DID-Besitzlage am Erwerbsblock bleibt maßgeblich.
// Dokumentationsstand: 20.09.2026 00:30:18 CEST · Phase 5.48 · Build 20260920-003018

// Phase 5.49: Wallet-zentrierter DAO-Team-Baum; 1 Wallet = 1 Partner. APTMDAO-Priorität nur bei belegter eigener Downline. Neuer MinerBot-Kauf liest APTMDAO-DID direkt aus Kaufinput; Referenz #31722 → DID #7315 → Parent #23. Eigene Wallets aus Partneraktivitäten ausgeschlossen.
// Historischer Stand Phase 5.49: 20.09.2026 02:55:41 CEST · Build 20260920-025541

// Phase 5.50: Root-Erkennung nach wallet-zentriertem Umbau gehärtet. project_nft_ownership ist Primärquelle; nft_cache-Fallback läuft über alle User-Wallets statt nur aktuelle DAO-Projektwallets. Dashboard lädt Ownership vor dem Tree-Cache.
// Dokumentationsstand: 20.09.2026 03:19:33 CEST · Phase 5.50 · Build 20260920-031933

// Phase 5.52: Gemeinsamer Wallet-Baum über verbundene eigene Wallets; aktueller Bot-Bestand strikt nach heutigem Owner, frühere/übertragene Bots separat; historische Erwerbsevidenz bleibt erhalten.

// Phase 5.54: Parent-Kante eigener DIDs wird in den Walletgraph aufgenommen (#25924 → #21043). Walletdetails zeigen den heutigen NFT-/Bot-Bestand nach Owner; historische Kaufdaten bleiben separat erhalten.

// Phase 5.54: NFT-/Ownership-Ermittlung ist für eigene Wallets zentralisiert: NFT-Tab, DAO-Baum und Dashboard lesen denselben Ownership-/NFT-Cache; der Team-Baum startet für eigene Wallets keine zweite NFT-Discovery. Der kombinierte DAO-Walletgraph lädt DAO1-alt und APTMDAO vollständig als getrennte Quellen, lädt die belegte Upline-Kette oberhalb eigener DIDs zur Parent-/Wallet-Auflösung, rendert davon in der normalen Ansicht aber nur die direkten Uplines; weitere eigene Wallets werden anhand ihrer DID-Parent-Kante analog TLN in denselben Baum gehängt. DAO1-only-Partner benötigen keine APTMDAO-DID. Historische Kauf-/Preis-Evidenz bleibt am zentralen NFT-Datensatz.

/* Phase 5.63 · 21.09.2026 01:43:10 CEST
 * Nach dem Speichern einer eigenen Wallet werden DAO1/APTMDAO NFT-Ownership,
 * Transaktionen/Claims und DID-Roots gezielt für diese Wallet nachgeführt. Ein
 * manueller Projekt-Refresh ist für den Erstaufbau nicht erforderlich.
 */

/* Phase 5.64 · 21.09.2026 02:08:16 CEST
   Wallet-zentrierter Team-Baum: fremde Partner-Wallets werden fuer beide Identity-Contracts
   gezielt auf aktuell gehaltene DAO1- und APTMDAO-DIDs geprueft. Dadurch bleibt eine zweite
   DID sichtbar, auch wenn ihre Kante im geladenen persoenlichen Tree-Slice noch fehlt.
   Bot-Anzahlen in Partnerkarten stammen ausschliesslich aus dem aktuellen ERC-721-Bestand
   der bekannten Bot-Contracts; Kaufpreis, Kauf-Tx und Lifecycle-Zuordnung sind keine
   Voraussetzung fuer die Anzahl. Membership-Ablaufdaten bleiben offen, bis die konkrete
   on-chain Expiry-Quelle fuer DAO1 und APTMDAO verifiziert ist.
*/


/* Phase 5.65 · 21.09.2026 02:38:12 CEST
   Partnerkarten verwenden fuer DAO1-/APTMDAO-DIDs und aktuelle Mining-/Trading-Bot-Anzahlen
   zuerst den aktuellen ERC-721-Walletbestand. Historische Erwerbs-, Kaufpreis- und DID-Zuordnung
   werden nachgelagert ermittelt und blockieren die Bestandsanzeige nicht.
*/


/* Phase 5.66 · 21.09.2026 03:22:39 CEST
   Korrektur 5.64/5.65: Partnerkarten verwenden keinen breiten Explorer-/address/nft-Snapshot mehr.
   Aktuelle DAO1-/APTMDAO-DIDs und Bot-Bestaende werden ausschliesslich contract-gezielt aus
   ERC-721-Transferhistorien der bekannten Identity-/Bot-Contracts rekonstruiert. Der bekannte
   Miner-Contract zaehlt aktuelle Token unabhaengig von Kaufpreis oder Einzelklassifikation als Mining-Bots.
   Historische Kauf-/Lifecycle-Aufbereitung bleibt nachgelagert und blockiert die Kachel nicht.
*/
