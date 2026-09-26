// Phase 6.23 · 26.09.2026 13:13:03 CEST: P5: 6.22-Preis-Migration korrigiert; wallet_address ist nur Runtime-Hydrierung und wird vor project_transaction_asset_flows-Upserts entfernt. Build 20260926-131303.
// Phase 6.21 · 26.09.2026 12:12:27 CEST: P5: sichtbare Claim-, Transaktions- und Exportpfade lesen Auszahlungen ausschliesslich aus kanonischen Asset-Flows. Build 20260926-121227.
// Phase 6.18 · 25.09.2026 18:33:32 CEST: P4: Current-NFT-Inventar lädt unabhängige Owner-/Collections-Quellen parallel; Fachlogik unverändert. Build 20260925-183332.
// Phase 6.12 · 24.09.2026 18:30:01 CEST: P3 Realtest abgeschlossen; Kaufpreisresolver-v3-Stand wird evidenzgebunden persistent vorgewärmt. P4: Asset-Flow-Fresh-Build ohne doppelte Seitenpersistenz/komplette USD-Vollbewertung. Build 20260924-183001.
// Phase 6.11 · 24.09.2026 17:32:01 CEST: Kaufpreisresolver v3 bewahrt historische Kauf-Tx trotz späterem Walletwechsel; separate Kauf-/Mint-Batches bleiben ohne deterministische Verknüpfung offen. Build 20260924-173201.
// Phase 6.10 · 24.09.2026 16:30:30 CEST: Fresh-Build finalisiert Ownership-/Ersterwerbs-/Kaufpreis-Readmodel ohne Hard-Refresh; früheste eigene Entry-Tx bleibt Preisbasis; P4 misst Teiljobzeiten. Build 20260924-163030.
// Phase 6.09 · 24.09.2026 14:22:47 CEST: Ownership-Cache-Priorität korrigiert; frischer DB-Read bleibt im Fresh-Build autoritativ und wird nicht mehr vom älteren Shared-Cache überschrieben. Build 20260924-142247.
// Phase 6.08 · 24.09.2026 12:31:39 CEST: Lifecycle-Besitzabdeckung wird getrennt vom strengeren Ownership-/Erwerbs-Repair bewertet. Build 20260924-123139.
// Phase 6.04 · 23.09.2026 02:51:28 CEST: DAO1-Hilfe ergänzt Fresh-Build-Parität: aktuelle und historische NFT-/Ownership-Daten werden reproduzierbar aus Current State plus unabhängiger Wallet-Transferhistorie aufgebaut; Legacy-Self-Heal ist vom automatischen Fresh-Build entkoppelt. Build 20260923-025128.
// Phase 6.03 · 23.09.2026 01:44:44 CEST: DAO1-Hilfe ergänzt die Wirkung des Lifecycle-Status auf das zentrale Fresh-Build-Snapshot-Gate: nur complete darf einen finalen automatischen Snapshot erzeugen. Build 20260923-014444.
// Phase 5.93 · 22.09.2026 12:15:22 CEST: RPC-Proxy-eth_call-Allowlist + SQL 072 für persistenten partial-Migrationsstatus; NFT-Datenmigration v4. Build 20260922-121522.
// Phase 5.92 · 22.09.2026 11:01:30 CEST: APTMDAO-Metadaten serverseitig über wallet-private; Migrationen kennen partial/failed; APTMDAO ownerOf/Parent eth_call im RPC-Gate freigegeben. Build 20260922-110130.
// Phase 5.91 · 22.09.2026 10:46:15 CEST: DAO-NFT-Metadatenabrufe überspringen Explorer-Webseiten/external_url-UI-Links und verwenden nur echte Metadata-/Token-URIs; die automatische Datenmigration wird als Version 2 einmalig erneut ausgeführt. Build 20260922-104615.
// Phase 5.90 · 22.09.2026 03:44:20 CEST: DAO-NFT-Namensauflösung erweitert: Store-/Metadata-Attribute und project_nfts werden für echte Botnamen priorisiert; generische MineBot-#-Namen bleiben Fallback. Bestehende Apertum-NFT-Caches werden per Datenmigration erneut geprüft. Build 20260922-034420.
// Phase 5.88 · 22.09.2026 02:20:48 CEST: APTMDAO-Identitäts-NFTs (#4533/#7315 etc.) zählen als DID; NFT-Refresh repariert offene Ownership-Lücken; Bot-Metadaten bevorzugen echte Store-Namen vor MineBot-#-Fallback. Build 20260922-022048.
// Phase 5.87 · 22.09.2026 01:36:51 CEST: Self-Heal für ältere Wallet-Erstaufbauten: Current-State-NFTs werden gegen project_nft_ownership geprüft; nur echte Lücken werden nachgezogen. Bekannter DAO1-DID-Contract zählt ohne manuelle Klassifikation. Build 20260922-013651.
// Phase 5.86 · 22.09.2026 01:06:00 CEST: DAO1 Übersicht und Bot-Summary zählen Mining-/Trading-Bots konsistent nur im eindeutigen aktuellen Bestand; historische/Transfer-Zuordnungen bleiben separat in der Detailtabelle. Build 20260922-010600.
// Phase 5.84 · 22.09.2026 00:38:20 CEST: DAO1 Übersicht zeigt Summary-Kacheln analog TLN/VOW; Summen bleiben tokengetrennt und cache-basiert. Build 20260922-003820.
// Phase 5.82 · 21.09.2026 23:57:38 CEST: Wallet-Speichern nutzt den bestehenden gezielten DAO1/APTMDAO-Erstaufbau weiter; allgemeine Bestände werden nur für diese Wallet aktualisiert, kein globales loadAll(). Build 20260921-235738.
// Phase 5.80 · 21.09.2026 18:15:39 CEST: DAO-Dokumentation bereinigt; Cache-/Request-Audit ist abgeschlossen, 24h Partner-Current-State Warm-Run praktisch bestätigt. Build 20260921-181539.
// Phase 5.79: DAO Team hat nur noch eine normale wallet-zentrierte Ansicht; separate DAO1-alt/APTMDAO-neu Tabs entfernt, Graphen bleiben intern getrennt und im DEV-Nachweis sichtbar.
// Phase 5.78 · 21.09.2026 17:29:35 CEST: DAO-Team nutzt zusätzlich einen 24h-IndexedDB-Current-State-Cache für fremde Partner-Wallet+NFT-Contracts; History/DID/Kaufpreis bleiben getrennt. Build 20260921-172935.
// Phase 5.62: DAO-Team lädt Partner-Bots zentral/persistent für Team und Dashboard; Partnerkarten zeigen Mining-/Trading-Bot-Zahlen, direkte Uplines und editierbare Aliase; ESC schließt Details.
// Phase 5.60: Direkte DAO1-/APTMDAO-Uplines werden oberhalb der eigenen Wallet angezeigt; weiter geladene Ancestors dienen nur zur Auflösung und werden nicht als zusätzliche Team-Bäume gerendert.
// Phase 5.58: Der zentrale DAO1/APTMDAO-Kaufpreisadapter wertet ERC-20-Abgänge, direkten nativen APTM-Value und ausgehende native Internal Transactions derselben Erwerbs-Tx aus. Nur eindeutige Zahlungs-Evidenz wird als Kaufpreis gespeichert; Transfer/Mint bleibt ohne erfundenen Preis.\n// Phase 5.58: DAO1-Ownership speichert die Erwerbs-Tx auch bei Wallet-Eingang ohne bereits verifizierten Kauf. Dadurch kann die zentrale NFT-Registry fehlende historische Kaufpreise nachträglich auflösen; negative Preisbefunde ohne Tx bleiben offen.\n// Phase 5.56: DAO1/APTMDAO stellt der zentralen NFT-Registry nur noch den projektspezifischen Kaufpreis-Resolver bereit. Kaufpreis-Evidenz wird zentral im nft_cache persistiert und im NFT-Tab angezeigt; bereits geprüfte Fälle werden nicht erneut on-chain analysiert.
// Phase 5.55: Im wallet-zentrierten DAO-Baum ist die zentrale aktuelle NFT-/Ownership-Registry autoritativ für DID→Wallet. Tree-Event-Adressen sind nur Fallback und dürfen eine bekannte aktuelle DID-Zuordnung nicht überschreiben. Ein eigenes Wallet kann gleichzeitig eine DAO1- und eine APTMDAO-Upline haben; beide werden getrennt oberhalb des eigenen Einstiegsknotens gezeigt. Beziehungen zwischen zwei eigenen Wallets bleiben normale Baumkanten (z. B. DAO1 #25924 unter #21043).
(() => {
// WalletTracking · DAO1 Hilfe
// Eigenständiges Hilfe-Modul. Künftige Inhaltsänderungen sollen möglichst nur hier erfolgen.
const HELP_MODULE_BUILD="20260923-014444";
const HELP_MODULE_TIMESTAMP="23.09.2026 01:44:44 CEST";
function renderDAO1Help(){
  const el=document.getElementById("dao1HelpContent");
  if(!el)return;
  el.innerHTML=`<div class="custom-token-card"><h3 style="margin-top:0">DAO1 / Apertum · Hilfe</h3><p class="note">Diese Hilfe beschreibt ausschließlich die DAO1-/Apertum-Funktionen. Allgemeine WalletTracking-Funktionen stehen unter „❓ Hilfe / Handbuch“.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Übersicht</h3><p class="note"><strong>Cache-Verhalten Phase 5.80:</strong> Der DAO-Initialload übernimmt aktuelle NFT- und Ownership-Daten aus der bereits zentral geladenen Registry. Bot-Claims und Referral-Rewards teilen dieselbe History innerhalb der Session. Der aktuelle Bot-Bestand fremder Team-Wallets wird 24 Stunden browserseitig wiederverwendet; historische NFT-/DID-/Kaufpreis-Aufbereitung blockiert den Current State nicht.</p><p class="note"><strong>Statusbegriffe:</strong> „Besitzhistorie offen“ bedeutet, dass der aktuelle NFT-Bestand bekannt ist, aber Transfer-/Ownership-Historie noch nicht vollständig persistiert wurde. „Kaufpreis-Prüfung offen“ betrifft ausschließlich die wirtschaftliche Zahlungs-Evidenz und ist keine Aussage über DID-/Membership-/Bot-Klassifikation.</p><p class="note">Die DAO1-Ansicht fasst die projektspezifischen Apertum-Daten der gespeicherten DAO1-Wallets zusammen. Die Übersicht zeigt analog TLN/VOW sofort Summary-Kacheln für Wallets, Mining-/Trading-Bots, DIDs/Memberships, Bot-Claims, Referral-Rewards und wallet-zentrierte Team-Partner. Mining-/Trading-Bot-Summen zählen nur den eindeutigen aktuellen Bestand; historische oder zwischen eigenen Wallets transferierte Zuordnungen bleiben in der Detailtabelle sichtbar, zählen aber nicht nochmals zum Bestand; unterschiedliche Token werden nie addiert und verwenden die zentral gepflegten Anzeige-/Summary-Nachkommastellen. Die Bot-Übersicht verwendet den zentralen NFT-/Ownership-Bestand und ergänzt Mining-/Trading-Bots um Kaufdatum, verifizierten Kaufpreis, Claims je Währung sowie den Lifecycle-Status. Trading-Guthaben/Funding wird bewusst getrennt vom Lizenz-Kaufpreis geführt und erst angezeigt, wenn die Einzahlung on-chain eindeutig dem Bot zugeordnet werden kann. DIDs sind keine Bot-Käufe und erhalten keinen Kaufpreis. Projektfunktionen sind bewusst in eigene Unter-Tabs getrennt, damit Transaktionen, Claims, Referral Rewards, Liquidity Pools und Konfiguration unabhängig geprüft werden können.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Transaktionen</h3><p class="note">Die „Apertum Transaktionshistorie“ ist eine dauerhaft gespeicherte Historie. Standardmäßig wird ab 01.01.2025 bis heute gearbeitet; Datumsfilter können angepasst werden. „Daten aktualisieren“ ergänzt neue Blockchain-Daten und zugehörige Asset-Flows, ohne die bereits gespeicherte Historie bei jedem Öffnen vollständig neu aufzubauen. Historische USD-Werte verwenden die DAO1-/Apertum-Preislogik und vorhandene Preis-Caches.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Dashboard-Partner &amp; Rewards</h3><p class="note">DAO1- und APTMDAO-Bezüge bleiben separat auswertbar, die übergreifende Partnerzahl folgt aber der wallet-zentrierten Regel: <strong>1 Wallet = 1 Partner</strong>. Hat dasselbe Partner-Wallet in beiden eigenen Downlines eine DID, wird es in der Gesamtzahl nur einmal gezählt; die separaten DAO1-/APTMDAO-Zahlen können dieses Wallet jeweils enthalten. Eigene Wallets zählen nicht als Partner und werden auch aus „Letzte Partneraktivitäten“ ausgeschlossen. Rewards und Referral Rewards werden in Originaltoken/-menge dargestellt, nicht in USD.</p></div><div class="custom-token-card"><h3 style="margin-top:0">Bot-Claims</h3><p class="note">Claims werden als eigene DAO1-Transaktionsart ausgewertet und den bekannten Miner-/Bot-NFTs zugeordnet. Phase 6.19 vereinheitlicht die sichtbare Auszahlung: Asset, Menge und historischer USD-Wert stammen primär aus den gespeicherten project_transaction_asset_flows. Phase 6.20 zieht auch bestätigte native APTM-Claims in dieses kanonische Flow-Modell nach; bestehende native Claim-Caches werden einmalig ohne Blockchain-Vollscan migriert. Phase 6.21 entfernt den Legacy-Read-Fallback aus sichtbaren Claim-, Transaktions- und Exportpfaden. Phase 6.22 bewertet native APTM-Claim-Flows direkt mit dem historischen APTM/USD-Kurs der Claim-TX: vorhandene TX-Preise werden wiederverwendet, nur offene Blöcke nutzen die bestehende exact-v13 Price-Anchor-Engine. Phase 6.23 korrigiert den Persistenz-Hotfix dafür: das nur zur Runtime ergänzte wallet_address wird vor dem Asset-Flow-Upsert entfernt; fehlgeschlagene Preis-Migrationen werden automatisch erneut versucht. Neue native Claims laufen künftig durch denselben zentralen Bewertungsweg. Alte claim_reward_aptm/-usd-Felder bleiben nur noch als Alt-/Kompatibilitätsdaten bestehen. Der Claim-Bereich besitzt einen NFT-Filter, damit einzelne Miner getrennt geprüft werden können. Neue Miner-/NFT-Zuordnungen sollen aus der On-Chain-Historie erkannt und anschließend in der Projektklassifikation sauber benannt werden.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Referral Rewards</h3><p class="note">Referral Rewards werden getrennt von normalen Bot-Claims ausgewiesen und nur dort gezählt, wo eine echte Referral-Struktur belegt ist. Dieselbe Trennung gilt im Dashboard: Bot-Claims erscheinen unter „Rewards“, DID-/verifizierte Referral-Auszahlungen unter „Referral Rewards“; die Originalmengen stammen aus denselben gespeicherten Asset-Flows wie im Detailtab. Fehlende Referral-Aktivität darf nicht als Claim oder anderer Reward-Typ geraten werden.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Team</h3><p class="note">Die Standardansicht ist wallet-zentriert: <strong>1 Wallet = 1 Knoten/Partner</strong>. Ein Wallet kann mehrere DAO1- und/oder APTMDAO-DIDs besitzen; diese werden im gleichen Wallet-Knoten visuell getrennt angezeigt, ohne die zugrunde liegenden on-chain Graphen zu vermischen. Auch mehrere eigene Wallets werden anhand ihrer belegten DID-Upline in denselben Baum eingehängt; sie bleiben als „MEINE WALLET“ sichtbar, zählen aber nicht als Partner. Nur tatsächlich unverbundene eigene Strukturen bleiben separate Roots. Separate DAO1-/APTMDAO-Tree-Ansichten sind aus der normalen User-Oberfläche entfernt; die beiden Graphen bleiben intern getrennt und sind nur noch als technische DEV-/Nachweisgrundlage verfügbar. Ist dieselbe Partner-Wallet in deiner DAO1- und APTMDAO-Downline vorhanden, bestimmt die APTMDAO-Beziehung die Position im kombinierten Baum. Hat ein alter DAO1-Partner im neuen APTMDAO eine andere Upline gewählt, bleibt er nur über seine für dich relevante DAO1-Beziehung in deinem Baum; fremde APTMDAO-Bots werden dadurch nicht deinem Zweig zugerechnet. Eigene Wallets zeigen ihre DAO1-/APTMDAO-DIDs sowie – soweit aus dem Tree bekannt – die jeweilige eigene Upline. Beim cache-first Laden werden neben Root und Downline auch die Parent-/Upline-Kanten der eigenen DIDs aus dem lokalen Browser-Graph gelesen, damit die direkte Upline nach einem Gerätewechsel nicht am eigenen Root abgeschnitten wird. Weiter oberhalb geladene Ancestors dienen nur der technischen Auflösung; in der normalen Teamansicht werden ausschließlich die direkten DAO1-/APTMDAO-Uplines oberhalb der eigenen Wallet gezeigt und keine zusätzlichen Ancestor-Team-Bäume erzeugt. Beim alten Tree ist <code>TokenMinted(to, tokenId, fid)</code> der Parent-Nachweis; beim APTMDAO-Tree liefern Mint-Events child, parent und wallet. Neue Apertum-Miner-Käufe tragen die verwendete APTMDAO-DID zusätzlich direkt im Kaufaufruf. Der verifizierte Referenzfall MinerBot #31722 verwendet DID #7315; deren Parent/Upline ist DID #23. Diese direkte Kauf-DID-Evidenz hat Vorrang vor der historischen Ownership-Heuristik. Für ältere Bots bleibt die historisch belegte Besitzlage am Erwerbsblock der Fallback. Bot und DID dürfen unabhängig transferiert werden. Partnerdetails scannen weiterhin nicht den gesamten NFT-Bestand, sondern nur bekannte Bot-Contracts über contract-gefilterte Transferhistorien. In der Wallet-Detailansicht werden nur Bots des heutigen Owners als aktueller Bestand geführt; Bots, die auf diesem Wallet gekauft und später übertragen wurden, erscheinen getrennt unter „Frühere Bots / übertragen“. Kauf-Wallet, Kauf-Tx und belegter Kaufpreis bleiben historisch am Bot erhalten.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">NFTs &amp; Klassifikation</h3><p class="note">DAO1-NFTs können projektspezifisch klassifiziert werden, z. B. Mining-Bot, DID, Trading-Bot oder weitere Typen. APTMDAO-Identitäts-NFTs werden in der User-Sicht ebenfalls als DID gezählt. Der zentrale NFT-Tab kann nach DID, MineBot, Hearts NFT und TradeBot filtern. Für Apertum-Bots ist das Ziel immer Bild + echter DAO-Store-/Metadata-Name (z. B. Nebula/Solar) + NFT-ID; ein generischer Name wie MineBot #12345 ist nur Fallback und darf bei einer späteren Metadatenprüfung verbessert werden. Eine als „sicher“ klassifizierte NFT soll nicht gleichzeitig als Spam markiert werden können; vor einer Spam-Markierung muss die Sicher-Klassifikation entfernt werden. Besitzerhistorie und Wallet-Wechsel eines NFTs werden getrennt von der reinen NFT-Bezeichnung gespeichert.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Liquidity Pools</h3><p class="note">Beim Öffnen werden die zuletzt gespeicherten Supabase-Daten angezeigt. Aktuelle LP-Positionen, historische Add-/Remove-Ereignisse und Vergleichswerte werden nur über „Daten aktualisieren“ neu von Blockchain/Explorer ermittelt und anschließend wieder gecacht. Ein Tab-Wechsel allein soll keine unnötigen Blockchain-Scans auslösen.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Konfiguration</h3><p class="note">Hier werden DAO1-Projektassets, NFT-Typen und projektbezogene Klassifikationen gepflegt. Die Klassifikation steuert Darstellung, Filter und Auswertung, ersetzt aber nicht die zugrunde liegende On-Chain-Erkennung. Fehlende historische APTM-Kurse können – sofern vorgesehen – manuell ergänzt werden und bleiben als manuelle Werte erkennbar.</p></div>
          <div class="custom-token-card"><h3 style="margin-top:0">Caching &amp; Aktualisierung</h3><p class="note">Transaktions-, Claim-, NFT- und LP-Historien werden persistent gespeichert und inkrementell ergänzt. Bereits bekannte Historie soll nicht unnötig neu geladen werden. Apertum-NFT-Metadaten werden ausschließlich über echte Metadata-/Token-URIs geladen; Explorer-Webseiten und external_url-Verweise auf UI-Seiten werden nicht als JSON gefetcht. Für <code>api.aptmdao.io/nft/&lt;ID&gt;</code> erfolgt der Abruf wegen Browser-CORS serverseitig über <code>wallet-private</code> mit enger Allowlist. Ein technischer Abruffehler setzt die automatische Datenmigration auf „teilweise“ statt fälschlich auf „abgeschlossen“. Beim manuellen Apertum-NFT-Refresh wird nach dem Current-State-Abgleich gezielt geprüft, ob für aktuelle NFTs noch Ownership-/Erwerbslücken bestehen; nur diese Lücken werden erneut aufgebaut. Partielle oder fehlgeschlagene Ownership-Prüfungen gelten nicht als dauerhaft erledigt. Beim gezielten Wallet-Bootstrap werden erforderliche Teiljobs als complete, partial, failed oder deferred bewertet und zu einem DAO1-Gesamtstatus zusammengeführt; optionale Anzeige-/Teamcache-Aktualisierungen verschlechtern den fachlichen Abschluss nicht. Dieser Gesamtstatus steuert das zentrale Fresh-Build-Snapshot-Gate: nur complete darf einen finalen automatischen Referenz-Snapshot schreiben; partial, deferred und failed bleiben ohne finalen Snapshot. Für einen neuen User werden historische NFT-Kandidaten aus den Wallet-Transferhistorien der bekannten DAO1/APTMDAO-Contracts ermittelt und anschließend in project_nft_ownership aufgebaut; ein alter User-Cache ist dafür keine Voraussetzung. Phase 6.06 trennt dabei Besitzabdeckung und Erwerbs-Evidenz: Ist ein NFT im aktuellen zentralen NFT-Bestand sicher der Wallet zugeordnet, darf eine current_state_evidence_only-Periode den aktuellen Besitz persistent abbilden, auch wenn der ursprüngliche Eingang nicht mehr rekonstruierbar ist. Das Erwerbsdatum bleibt in diesem Fall offen; der Repair-/Kaufpreis-Pfad darf später bessere Evidence nachziehen. Nach Ownership-Mutationen erzwingt Phase 6.07 vor der Konsistenzprüfung einen neuen DB-Readback. Phase 6.08 trennt dabei den Lifecycle-Abschluss vom strengeren Historien-/Kaufpreis-Repair: Persistierte aktuelle oder historische Besitz-Evidenz reicht für die Lifecycle-Abdeckung; fehlender Erwerbsbeginn oder Kaufpreis bleibt sichtbar offen und kann später nachgezogen werden. Phase 6.09 verhindert zudem, dass ein nach Ownership-Mutationen frisch aus Supabase gelesener Ownership-Stand später im selben Lauf durch einen älteren zentralen Shared-Cache ersetzt wird. Phase 6.10 übernimmt diesen finalen Stand anschließend auch direkt in das zentrale NFT-Readmodel: maßgeblich für „Erstmals erworben“ ist die früheste eigene Besitz-Evidenz, deren Entry-Tx wird für die Kaufpreisprüfung verwendet und die NFT-Ansicht wird im selben Lauf neu gerendert. Phase 6.11 korrigiert dabei die Kaufpreisquelle: Enthält der spätere Wallet-Eingang keine Zahlung, prüft der zentrale Resolver die globale NFT-Lifecycle-Kette rückwärts auf eine frühere eindeutige Kauf-Tx dieses NFT. Ein verifizierter historischer Kauf bleibt dadurch bei einem späteren Walletwechsel erhalten. Separate Kauf- und Mint-Batches werden ohne deterministischen On-Chain-Link bewusst nicht automatisch zusammengeführt oder auf mehrere gemintete Bots verteilt. Der 6.11-Realtest bestätigte damit die Fresh-Build-Parität zum Entwicklungs-Testuser. Phase 6.12 persistiert auch bewusst offene Resolver-v3-Ergebnisse mit ihrer konkreten Erwerbs-Evidenz, sodass der NFT-Tab beim ersten Öffnen den fertigen Stand cache-first zeigt und identische offene Fälle nicht erneut lädt. Gleichzeitig schreibt der Fresh-Build ERC-20-Asset-Flows nur einmal roh; die vollständige historische USD-Bewertung wird aus dem blockierenden Erstaufbau entfernt und nur für benötigte Claims/Detailansichten gezielt nachgezogen. Der 6.12-Realtest senkte assetFlows dadurch auf 1,7 Sekunden und den gesamten Erstimport auf rund 85 Sekunden. Phase 6.13 optimiert die verbleibenden Mess-Hotspots ohne Fachlogikänderung: Claim-TX-Markierungen werden batchweise gespeichert und mehrere Ownership-Rebuilds nach dem gemeinsamen Prewarm begrenzt parallel ausgeführt. Der 6.13-Realtest erreichte 37,2 Sekunden Gesamtzeit; der 6.14-Versuch, im Ownership-Rebuild stärker auf vorgewärmte Historien zu setzen, war mit 43,4 Sekunden langsamer und wurde verworfen. Phase 6.15 verwendet deshalb wieder exakt die 6.13-Ownership-Logik und ergänzt ausschließlich direkt sichtbare Feintimings für Prewarm, Rebuild und DB-Readback. Phase 6.16 ergänzt ohne Logikänderung die zuvor fehlenden Zeiten für den aktuellen NFT-Inventarabgleich und die Vorbereitung vor dem Prewarm sowie lifecycleMs/unaccountedMs. Der 6.16-Realtest erklärte den Ownership-Lifecycle vollständig: 15,1 Sekunden gesamt, davon 9,1 Sekunden Current-NFT-Inventar, 3,2 Sekunden Prewarm, 2,8 Sekunden Rebuild und 0,1 Sekunden Readback. Phase 6.17 zerlegt deshalb ausschließlich den 9-Sekunden-Inventarblock weiter in Owner-/Collections-Endpoint, Merge/Namensauflösung, Flag-Merge und nft_cache-Write; die Fachlogik bleibt unverändert. Phase 6.18 nutzt den Messbefund aus dem Realtest: Owner-Endpoint (5,5 s) und Collections-Endpoint (4,7 s) sind unabhängig und werden deshalb parallel gestartet; Merge, Namensauflösung, Ownership- und Kaufpreislogik bleiben unverändert. Neue Blockchain-Aktivität, Besitzerwechsel, Claims oder andere veränderliche Zustände müssen bei einer Aktualisierung trotzdem erkannt werden.</p><p class="note"><strong>APTM/wAPTM-Kurse:</strong> APTM und wAPTM werden 1:1 behandelt. Der USD-Kurs wird on-chain aus dem wAPTM/wUSDT-Referenzpool <code>0x38Ac…89b57</code> ermittelt. Der erste belastbare Marktpreis beginnt mit Pair-Erstellung und erster Liquidität in Block 88'356 am 18.02.2025 12:39:52 UTC. Für frühere Blöcke wird kein späterer Kurs zurückgerechnet, sondern „Noch kein On-Chain-Marktpreis vorhanden“ verwendet.</p></div>`;
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

/* Phase 5.63 / 5.87
 * Nach dem Speichern einer eigenen Wallet werden DAO1/APTMDAO NFT-Ownership,
 * Transaktionen/Claims und DID-Roots gezielt für diese Wallet nachgeführt. Ein
 * manueller Projekt-Refresh ist für den Erstaufbau nicht erforderlich.
 * Für Wallets, die vor diesem gezielten Erstaufbau hinzugefügt wurden, prüft
 * Phase 5.87 beim ersten DAO-Aufruf den vorhandenen zentralen NFT-Current-State
 * gegen project_nft_ownership. Nur fehlende oder unvollständige Ownership-
 * Historien werden gezielt rekonstruiert; der Status wird in wallet_refresh_state
 * persistiert, damit vollständige Wallets nicht erneut breit geprüft werden.
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

/* Phase 5.67 · 21.09.2026 03:28:09 CEST
   wallet-private wird vor privaten DAO-Team-/Alias-Zugriffen gegen die aktuelle Supabase-Session abgesichert.
   401/403 löst genau einen Session-Refresh + Retry aus; Fehler verlassen den Datenjob weiterhin über finally.
*/

/* Phase 5.68 · 21.09.2026 03:37:37 CEST
   Partner-Bot-Refresh: fehlender dao1TeamIsIdentityNft-Helper ergänzt. Identity-Contracts werden
   vor der Bot-Auswertung sicher ausgeschlossen; ein ReferenceError darf die Partnerkarten nicht
   mehr dauerhaft auf „Bots: werden geladen …“ lassen. Login: Enter im E-Mail-Feld sendet denselben
   Magic-Link wie der Button. Datenquellen/DB-Schema unverändert.
*/


/* Phase 5.69 · 21.09.2026 03:51:12 CEST
   Partner-Identity und aktueller Bot-Bestand werden unabhaengig und contractweise geladen.
   Ein langsamer DAO1-Legacy-DID-Lauf darf APTMDAO-DID oder Bot-Zahlen nicht mehr blockieren.
   Bereits abgeschlossene Bot-Contracts aktualisieren die Kachel sofort; historische Kauf-/Lifecycle-
   Aufbereitung bleibt nachgelagert. Referenzfall zur Verifikation: Michaela 0x568281…fe4940 ->
   DAO1 #21044 + APTMDAO #7803 + 9 Mining-Bots + 1 Trading-Bot.
*/

/* Phase 5.71 · 21.09.2026 11:39:58 CEST
   Normaler DAO-Team-Start ist weiterhin Cache-first, fuehrt bei vorhandenen Roots aber automatisch einen inkrementellen Chain-Freshness-Check fuer DAO1-alt und APTMDAO aus. Ist die Chain unveraendert, endet der Lauf ohne Delta-Scan; bei neuen Bloecken wird nur ab letztem bestaetigten Block mit Overlap nachgezogen. Dadurch darf ein veralteter Tree-Cache nicht erst durch „Beide Trees on-chain aktualisieren“ korrigiert werden. Referenzwallet Monica 0x568281…fe4940: DAO1 #21044, APTMDAO #7803, 9 Mining-Bots; Trading-Bot-Zuordnung bleibt separat offen.
   Build 20260921-113958.
*/

/* Phase 5.71 · 21.09.2026 11:39:58 CEST
   DAO Wallet-Partnerdetails: dao1TeamOwnHistoricalBotCandidates ist jetzt definiert und nutzt project_nft_ownership als zentrale historische Quelle eigener Bots. Der bisherige ReferenceError beim Öffnen der Details entfällt. Trading-Bot-Klassifikation bleibt separat zu verifizieren.
   Build 20260921-113958.
*/

/* Phase 5.72 · 21.09.2026 11:57:19 CEST
   Aktuelle Mining-/Trading-Bot-Zahlen im DAO-Team verwenden die zentrale aktuelle NFT-/Ownership-Klassifikation. Kaufpreis, historische DID-Zuordnung und ownerOf@Block beeinflussen den heutigen Bestand nicht. Referenz Monica: 9 Mining-Bots + 1 Trading-Bot.
   Build 20260921-115719.
*/

/* Phase 5.73 · 21.09.2026 12:22:50 CEST
   DAO-Team/NFT: aktueller Bot-Bestand nutzt denselben zentralen nft_cache wie der NFT-Tab.
   Trading-Bot-Contracts werden nur bei eindeutiger Bot-Typ-Evidenz aus dem zentralen Cache übernommen;
   Kaufpreis-/DID-Historie entscheidet nicht über den Bestand. Summen trennen Bot-Anzahl und Kaufpreis-Abdeckung.
   Referenz Monica: DAO1 #21044, APTMDAO #7803, 9 Mining-Bots + 1 Trading-Bot.
   Build 20260921-122250. */


/* Phase 5.74 · 21.09.2026 13:48:40 CEST
   Historischer Planstand Phase 5.74: Cache-/Request-Audit. Dieser Punkt ist seit Phase 5.80 abgeschlossen; die folgenden Regeln bleiben als Architekturvorgabe bestehen.
   - Aktueller NFT-/Bot-Bestand bleibt zentrale Current-State-Quelle für NFT-Tab, Team-Karten und Partnerdetails.
   - Partner-Bot-Historie/Kaufpreis/DID-Zuordnung sind History und dürfen den aktuellen Bestand nicht blockieren.
   - Neue Partner: relevanten Bot-/NFT-Verlauf einmal vollständig aufbauen; danach inkrementell ab persistiertem Scan-Cursor mit Overlap.
   - DAO1-/APTMDAO-Tree-Caches beim normalen Start nur inkrementell gegen DATA_VERSIONS/Graph-State/letzten Block prüfen; große Graphen innerhalb eines Laufs wiederverwenden.
   - Historisches ownerOf@Block benötigt einen gezielten erlaubten eth_call-Pfad bzw. geeigneten Archive-RPC und persistenten Ergebnis-Cache; kein Einfluss auf Current State.
   Regression: Monica 0x568281…fe4940 = DAO1 #21044, APTMDAO #7803, 9 Mining-Bots, 1 Trading-Bot.
   Build 20260921-134840. */

/* Phase 5.75 · 21.09.2026 14:13:07 CEST: DAO Dashboard/Initialload teilt zentrale NFT-/Ownership-RAM-Daten; Tx-/Flow-Historie untertab-lazy; historische Metadaten nachgelagert; identische Tree-Scans in-flight dedupliziert. Fachlogik unverändert. Regression nach Deployment: Monica 0x568281…fe4940 = DAO1 #21044, APTMDAO #7803, 9 Mining-Bots, 1 Trading-Bot. Build 20260921-170817. */
