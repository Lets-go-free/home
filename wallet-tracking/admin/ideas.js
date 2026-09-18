// WalletTracking · Ideen / Umbau
// Zentrale Arbeits- und Übergabeliste.
// Künftig sollen Inhalts-/Status-/Prioritätsänderungen nach Möglichkeit nur in dieser Datei erfolgen.
// Die Hauptseite lädt diese Datei bei jedem Seitenaufruf mit Cache-Buster neu.

const ADMIN_IDEAS_MODULE_BUILD = "20260918-145031";
const ADMIN_IDEAS_MODULE_TIMESTAMP = "18.09.2026 14:50:31 CEST";
// Phase 5.03: TLN-Team-Aliase fallen ID→Wallet-Key zurück; Lifecycle-Positionen werden cache-/scanübergreifend verlustfrei gemergt; vUSD/VOW 0x43e4…264e nutzt die verifizierte 367-Tage-Contract-Regel. Performance/Egress-Optimierung bleibt nächster eigener TODO-Block.

const ADMIN_IDEAS = [
  {
    status: "in_progress",
    category: "Admin / Diagnose",
    priority: "high",
    title: "Systemübersicht · Funktionsbaum und Ladezeitpunkte",
    desc: `STATUS: In Arbeit. Admin-Übersicht mit Menü → Tab → Untertab als Baum. Pro Bereich werden normaler App-Start, erster Start des Tages, Öffnen des Tabs und manuelle Aktualisierung sichtbar. Klick auf eine Zeile zeigt die einzelnen Datenbestände sowie Browser-Cache, Supabase und On-chain/API-Quelle. Detailansicht öffnet als Popup, damit der Baum beim Prüfen an seiner Position bleibt. DeFi-Projekte besitzt einen neutralen Übersicht-Tab, der beim Öffnen keine projektspezifischen Daten lädt. VERBINDLICHE REGEL: Dieser Baum muss bei jeder Programmänderung, Erweiterung oder Korrektur mitgeprüft und im selben Release aktualisiert werden, wenn Struktur, Status, Datenquelle oder Ladezeitpunkt betroffen ist. Phase 4.95: Baumknoten einzeln sowie global auf-/zuklappbar; neue Spalte „Aktueller Datenstand“ nutzt dieselben zentralen Metadaten wie die sichtbaren Datenstatus-Zeilen in den Tabs. Linke Hauptnavigation ist ein-/ausklappbar; Phase 4.95 zeigt im eingeklappten Zustand die echten Menü-Icons und zentriert/verkleinert den Pfeil. Strukturknoten im Systembaum zeigen keine Datenstands-/Ladespalten mehr; diese Informationen stehen nur auf echten Blatt-/Tab-Zeilen. Nächster Ausbau: tatsächliche Laufdiagnose/Requests/Rows/Bytes mitschreiben und Soll gegen letzten Ist-Lauf vergleichen.`
  },
  {
    status: "in_progress",
    category: "Performance / Skalierung",
    priority: "high",
    title: "PRIORITÄT NÄCHSTER SCHRITT · Browser-Cache + DATA_VERSIONS + Delta-Synchronisation",
    desc: `STATUS: In Arbeit – zentrale Browser-Cache-/DATA_VERSIONS-Infrastruktur wird schrittweise umgesetzt. DAO1 alter Tree ist der Referenzcache; Phase 4.91: DAO1 alter Tree als Referenzpfad weiter validiert. Echtes DATA_VERSIONS-Gate eingebaut. Bei identischer lokaler/zentraler Version endet normales Team-Öffnen nach IndexedDB + Registry ohne State-Read, Schema-Probe, Delta-DB oder RPC. Manueller Discovery-Button erzwingt weiterhin den Chain-Freshness-Check. Migration 057 macht den DB-Trigger zum autoritativen Registry-Writer. Praxistest normaler Tab-Pfad bestanden: IDB + DATA_VERSIONS HIT, DB 0, Delta 0, RPC 0. Manueller inkrementeller On-chain-Update-Pfad wurde ebenfalls praktisch bestätigt (Blockbereich/Logs/Kanten sichtbar). DAO1 alter Tree ist damit als Referenzpfad abgeschlossen. Phase 4.95: TLN SmartNode Globalgraph als nächster grosser Bereich migriert: Browser-IndexedDB tln-vow/smartnode-global-graph + kleines DATA_VERSIONS-Gate. Bei HIT werden die Graph-Kanten lokal gelesen und es werden 0 Graph-Kanten aus Supabase geladen; bei Erstaufbau/Fallback wird die schemaoffene DB-Zeile vollständig (select(*)) lokal gespeichert. Migration 058 macht den TLN Graph-State zum autoritativen DATA_VERSIONS-Writer. Manueller inkrementeller On-chain-Scan bleibt unverändert fachlich maßgeblich und zieht IndexedDB nach. Praxistest nach Migration 058 noch offen. Phase 4.95 EGRESS-FIRST: Normaler TLN-Team-Restore lädt nicht mehr den vollständigen SmartNode-Globalgraph und nicht mehr den vollständigen globalen Wallet→TLN-ID-Cache. Migration 059 stellt eine schemaoffene rekursive Team-Slice-RPC bereit (Downline max. 20 je eigenem Leader + notwendige Upline). Eigene IDs werden zuerst gezielt geladen, danach nur IDs der tatsächlich relevanten Slice-Wallets. Browser-Key smartnode-team-slice-v2; bei identischer globaler DATA_VERSION kommen 0 Graph-Nutzdaten aus Supabase. Vollgraph bleibt ausschließlich Discovery/Step 7 bzw. expliziten Updatepfaden vorbehalten. Phase 4.96: Cache-Restore korrigiert: Globalgraph und Team-Slice besitzen wieder getrennte IndexedDB-Keys. Ein vorhandener Phase-4.94-Globalgraph wird lokal ohne Supabase-Nutzdaten in den relevanten Team-Slice migriert; bei fehlgeschlagener Versions-/DB-Prüfung wird ein vorhandener Slice als sichtbarer Fallback verwendet statt den Baum leer zu lassen. Phase 4.95 ergänzt für TLN-Team den Lifecycle-Nachlauf: verifizierte Lifecycles (einschließlich belastbarer Nullfunde) bleiben persistent; nach cache-first Render werden höchstens 3 offene Wallets pro Tab-Sitzung im Idle-Hintergrund nachverifiziert. Versuch/Status/Retry-Zeitpunkt werden im technischen Supabase-Cache als eigene team-lifecycle-queue persistiert; unverifizierte/Fehler-Fälle werden frühestens nach 24h erneut versucht. Step 7 bleibt der vollständige Discovery-/Nachverifikationslauf. Phase 4.97: Das 3er-Limit gilt nun pro Idle-Batch statt pro gesamter Tab-Sitzung. Noch nie geprüfte offene Partner werden in weiteren kleinen Batches bis zum abgearbeiteten Backlog nachgezogen und persistent gespeichert; bereits verifizierte Partner werden nicht erneut gescannt, Fehlerfälle behalten das 24h-Retryfenster. Damit bleiben Partner wie TLN-ID 11674 nicht dauerhaft unverifiziert, nur weil sie hinter dem ersten Batch lagen. Zusätzlich wurde der veraltete TLN_TEAM_GRAPH_TABLE-Verweis der historischen Wallet-Auswahl auf TEAM_GRAPH_CACHE_TABLE korrigiert. Phase 4.98: Die Lifecycle-Queue sperrt weiterhin unverifizierte Partner nach einem normalen retry_wait nicht mehr 24h. Das 24h-Fenster gilt nur noch fuer echte error_retry-Faelle; ein haengengebliebener running-Status wird nach 15 Minuten wieder freigegeben. DEV-Log nennt bei Freigabe/Sperre die betroffenen TLN-IDs, damit offene Partner wie 11674 direkt nachvollziehbar sind. Phase 5.01: Lifecycle-Background-Verifikation arbeitet ein begonnenes Wallet nun in bis zu vier Konvergenz-Prüfschritten weiter, solange sich der belastbare Lifecycle-Stand noch verändert. Sobald kein weiterer Fortschritt mehr entsteht, wird der aktuelle Lauf als fachlich offen/stabil beendet statt bei jedem Reload nur einen einzelnen Schritt weiterzugehen. Der TLN-Team-Status zeigt die laufende Hintergrund-Aktualisierung samt Wallet-/Prüfschritt-Fortschritt sichtbar an; vorhandene Cache-Daten bleiben währenddessen benutzbar.

ZIEL
Grosse, überwiegend unveränderliche Blockchain-Cache-Daten, die bereits aus Supabase geladen wurden, sollen nicht bei jedem Seitenaufruf erneut vollständig aus der Datenbank übertragen werden. Dadurch Supabase-Egress deutlich reduzieren, Datenbank/API entlasten und WalletTracking spürbar schneller starten.

ARCHITEKTUR
• Für grosse öffentliche Blockchain-Caches IndexedDB als persistenten Browser-Cache verwenden; nicht nur den normalen HTTP-/Session-Cache.
• Beim ersten Aufruf auf einem Gerät benötigte Daten aus Supabase laden und lokal in IndexedDB speichern.
• Bei späteren Aufrufen vorhandene lokale Daten sofort anzeigen.
• Danach im Hintergrund nur einen kleinen Versions-/Freshness-Check gegen Supabase durchführen.
• Nur wenn sich Daten geändert haben, ausschliesslich neue/geänderte Datensätze (Delta) laden und IndexedDB aktualisieren.
• Bestehende inkrementelle Blockchain-Scans und Overlap-Logik weiterverwenden; keine zusätzlichen Vollscans pro User.

DATA_VERSIONS
Die bereits geplante zentrale DATA_VERSIONS Registry dafür verbindlich umsetzen. Jeder grosse Cache-Bereich erhält eine eigene Version bzw. einen geeigneten Änderungsstand. Beispiel: Browser DAO1_TREE_VERSION=17, Supabase=17 → kein Tree-Download. Supabase=18 → nur Delta seit lokalem Stand laden. Versions-/Freshness-Abfragen müssen sehr klein sein.

GEEIGNETE DATEN
• DAO1 alter globaler Tree: sehr hohe Priorität; historischer Graph ändert sich kaum, daher einmal laden + Delta.
• TLN Team-/Graph-Cache: einmal laden + Delta/Freshness.
• APTM historische Preise: nur benötigte Preisanker/-bereiche lokal halten; niemals blind die gesamte Historie zum Browser übertragen.
• Öffentliche NFT-/Bot-Blockchain-Daten: vorhandene Datensätze lokal behalten und nur neue/geänderte ergänzen.
• Staking-/Transaktionshistorien: historische abgeschlossene Daten lokal wiederverwenden und nur neue Events ergänzen, sofern fachlich passend.

PROJEKTTRENNUNG
TLN/VOW und DAO1/APTM bleiben strikt unabhängige Projekte. Gemeinsame IndexedDB-/Versions-Infrastruktur ist zentral erlaubt, aber Stores, Cache-Keys, Versionen, Delta-Endpunkte und Daten müssen eindeutige Projekt-Namespaces besitzen. Keine DAO-Daten in TLN-Caches und umgekehrt.

PRIVACY / SICHERHEIT
• Öffentliche On-Chain-Daten dürfen persistent lokal gecacht werden.
• Private/userbezogene Daten wie Wallet-Aliase, Partnernamen oder andere geschützte Informationen nicht unverschlüsselt in einen neuen dauerhaften Browser-Cache kopieren. Bestehende Verschlüsselungs-/Privacy-Architektur bleibt maßgeblich.
• Logout/Userwechsel darf keine privaten Daten eines anderen Users sichtbar machen.

STARTVERHALTEN
Seite öffnen → lokalen Cache sofort lesen/anzeigen → im Hintergrund DATA_VERSIONS/Freshness prüfen → nur Delta laden → lokalen Cache aktualisieren → UI bei Bedarf aktualisieren. Fehlender/defekter/veralteter lokaler Cache muss automatisch sicher aus Supabase rekonstruierbar sein.

EGRESS-MESSUNG
Vor und nach Umsetzung die übertragenen Daten für typische Abläufe messen: Login/Start, DAO1 Team alt, TLN Team, DAO1 Übersicht/NFTs und historische Preisabfragen. Ziel ist nicht nur subjektiv schnelleres Laden, sondern nachweisbar deutlich weniger Supabase-Egress pro wiederkehrendem User. Grosse Volltabellen-Downloads im normalen Seitenbetrieb gezielt identifizieren und eliminieren.

UMSETZUNGSREIHENFOLGE
1. Bestehende Supabase-Ladepfade und Egress-Hotspots inventarisieren. STATUS: gestartet; App-Start und Haupttabs im Systembaum präzisiert.
2. Zentrale IndexedDB-Cache-Schicht mit Schema-/Cache-Version und sauberer Fehler-/Reset-Strategie bauen.
3. DATA_VERSIONS Registry zentral umsetzen.
4. DAO1 alten Tree als ersten grossen Referenzcache migrieren und Delta-Sync testen.
5. TLN Team-/Graph-Cache migrieren.
6. APTM-Preisanker sowie geeignete NFT/Bot-/Staking-Caches schrittweise anbinden.
7. DEV-Diagnose für Local hit / Supabase delta / Full rebuild / übertragene Datensätze bzw. Bytes ergänzen.
8. Egress erneut messen und daraus realistische User-Kapazität für den aktuellen Supabase-Plan ableiten.

ERFOLGSKRITERIEN
• Wiederholter Seitenaufruf lädt grosse unveränderte globale Caches nicht erneut vollständig aus Supabase.
• Anzeige kann aus lokalem Cache schnell starten.
• Änderungen werden zuverlässig inkrementell nachgezogen.
• Cache kann jederzeit kontrolliert neu aufgebaut/gelöscht werden.
• Keine Vermischung von TLN und DAO.
• Keine Schwächung der bestehenden Privacy-/Verschlüsselungsregeln.
• Supabase-Egress pro wiederkehrendem User sinkt messbar deutlich. Phase 4.99: Linke Navigation korrigiert: Der Ein-/Ausklapp-Pfeil sitzt im aufgeklappten Zustand rechts neben WalletTracking und ist vertikal zur Titelzeile zentriert. Im eingeklappten Zustand bleiben die Menü-Icons sichtbar; nur die Textlabels werden ausgeblendet. Phase 5.00: TLN/VOW Team-Lifecycle-Darstellung korrigiert: Bei teilweise verifizierten Wallets werden pro Position bereits eindeutig on-chain geschlossene/unstakete Stakings als solche angezeigt; ein offener Duration-Proof einer anderen Position darf einen bestätigten Unstake nicht mehr als „Lifecycle offen“ darstellen.`
  },
  {
    status: "open",
    category: "Benachrichtigungen / Alerts",
    priority: "high",
    title: "Benachrichtigungen / Alerts / Telegram",
    desc: `STATUS: Idee / Konzept – noch nicht umgesetzt.

ZIEL
WalletTracking soll wichtige Ereignisse automatisch im Hintergrund erkennen und den jeweiligen User benachrichtigen. Die Event-Erkennung wird unabhängig vom Benachrichtigungskanal aufgebaut. Als erster Kanal ist Telegram über einen eigenen WalletTracking-Bot vorgesehen; später können Web-Push oder E-Mail ergänzt werden.

MÖGLICHE EVENTS
TLN / VOW:
• Neuer Partner wurde im eigenen Team registriert.
• Ein Partner eröffnet ein neues Staking.
• Eigenes Staking läuft in X Tagen aus.
• Später weitere relevante Loan-/Staking-/Team-Events.

DAO1 / APTM:
• Neuer Partner wurde im eigenen Team registriert.
• Partner kauft einen neuen Bot/Miner.
• Partner eröffnet ein neues Staking.
• Später weitere relevante NFT-/Team-Events.

KURSE
• User kann pro unterstütztem Token eigene Kursalarme definieren: Kurs steigt über X / fällt unter X.
• Später optional prozentuale Kursbewegungen innerhalb eines Zeitraums.
• Voraussetzung: zentrale aktuelle und historische Kursfunktion für die unterstützten Tokens.

TELEGRAM-VERKNÜPFUNG
1. User klickt „Telegram verbinden“.
2. Backend erzeugt einen kurzlebigen einmaligen Verbindungstoken.
3. Telegram-Bot wird über einen Deep-Link mit diesem Token geöffnet.
4. User startet den Bot.
5. Telegram-Chat-ID wird serverseitig dem WalletTracking-User zugeordnet.
6. Verbindungstoken wird anschließend ungültig.
7. Verbindung kann jederzeit getrennt werden.
Keine manuelle Eingabe eines Telegram-Usernamens.

ARCHITEKTUR
Projektübergreifendes zentrales System, nicht separat in TLN/VOW und DAO1/APTM:
Blockchain-/Kursdaten → Background Jobs → Event Detection → User Notification Rules → Notification Queue/Log → Telegram bzw. weitere Kanäle.
Bestehende Discovery-Logik und globale Caches wiederverwenden; keine vollständigen Blockchain-Scans separat pro User. Beispiele: TLN Team Discovery → NEW_PARTNER; Staking Discovery → NEW_STAKING; DAO NFT Discovery → NEW_BOT; gespeichertes Staking-Enddatum → STAKING_EXPIRING; zentrale Kursfunktion → PRICE_ABOVE / PRICE_BELOW.

TECHNISCHE REGELN
• Event-Erkennung und Benachrichtigungsversand strikt trennen.
• Blockchain-Events möglichst einmal global erkennen und danach betroffenen Usern zuordnen.
• Bestehende Discovery-/Cache-Daten wiederverwenden.
• Events eindeutig identifizieren, damit Overlap-Scans keine Doppelmeldungen erzeugen.
• Notification-Log führen: erkannt, versendet, fehlgeschlagen etc.
• User kann Events projektweise bzw. einzeln aktivieren/deaktivieren.
• Private User-/Telegram-Zuordnungen gemäß bestehendem Privacy-/Verschlüsselungskonzept behandeln.
• Staking-Ablaufwarnungen verwenden bereits ermittelte/on-chain bestätigte Laufzeit-/Enddaten und lösen keine unnötigen neuen Blockchain-Scans aus.

UI
Neuer zentraler Bereich „Benachrichtigungen“ mit Telegram verbunden/nicht verbunden/trennen, TLN/VOW- und DAO1/APTM-Regeln, Vorlauf fürs Staking-Ende (z. B. 30/14/7/1 Tage), Kursalarme pro Token und Benachrichtigungshistorie.

UMSETZUNG
Vor Implementierung zuerst grafisches Mockup gemäß WalletTracking-UI-Regel. Danach schrittweise: (1) Datenmodell Events/Rules/Log, (2) Telegram-Bot + sichere Account-Verknüpfung, (3) UI-Einstellungen, (4) TLN-/DAO-Team-Events, (5) Staking-Events/Ablaufwarnungen, (6) Bot-/Miner-Käufe, (7) zentrale Kursfunktion/Kursalarme, (8) interne Benachrichtigungshistorie.`
  },
  {
    status: "open",
    category: "Übersicht / Analyse",
    priority: "high",
    title: "Persönliches Gesamt-Dashboard",
    desc: `Gesamtvermögen über alle eigenen Wallets und Projekte mit Aufteilung nach Token, Stakings, Loans, NFTs, Rewards und frei verfügbarem Guthaben. Entwicklung über 24 Stunden, 7 Tage, 30 Tage, Jahr und seit Einstieg; Kennzahlen investiert, zurückerhalten, aktueller Wert sowie realisierter/unrealisierter Gewinn oder Verlust. PROJEKTREGEL: TLN/VOW und DAO1/APTM bleiben strikt getrennt; projektübergreifend werden ausschließlich aggregierte Werte gezeigt, Details öffnen immer den jeweiligen Projektbereich.`
  },
  {
    status: "open",
    category: "Übersicht / Aktionen",
    priority: "high",
    title: "Aktionszentrale · Was muss ich tun?",
    desc: `Zentrale priorisierte Aufgabenliste mit Dringlichkeit, Fälligkeit, Projekt und Wallet: bald endendes Staking, fälliger Loan, verfügbarer Reward/Claim, Waiting-to-Swap, erkannte erforderliche Aktion, zu niedriger Gas-Token-Bestand sowie unvollständige/veraltete Positionsdaten. Handlungshinweise verständlich formulieren, aber nur auf fachlich/on-chain bestätigten Regeln aufbauen.`
  },
  {
    status: "open",
    category: "Übersicht / Analyse",
    priority: "high",
    title: "Gewinn-/Verlust- und Renditeauswertung ausbauen",
    desc: `Bestehende Idee „Gewinn/Verlust statt nur Bestand“ erweitern: Auswertung pro Projekt, Wallet, Token und Position. Ein-/Auszahlungen, Rewards, Claims, Gebühren und Gas sowie historische Kurse zum Transaktionszeitpunkt berücksichtigen. Realisierte und unrealisierte Ergebnisse trennen; Rendite absolut, prozentual und – fachlich sinnvoll – annualisiert. Fehlende Kurse und unsichere Rekonstruktionen klar kennzeichnen.`
  },
  {
    status: "open",
    category: "Datenqualität",
    priority: "high",
    title: "Datenqualität und Aktualitätsstatus",
    desc: `Vertrauensstatus je Auswertung/Position: vollständig on-chain bestätigt, teilweise rekonstruiert, historischer Preis fehlt, Historie noch nicht vollständig gescannt, Daten möglicherweise veraltet oder unbekannter/nicht klassifizierter Contract-/Eventtyp. Zusätzlich letzte Aktualisierung, verwendete Blockhöhe und offene Prüfschritte anzeigen.`
  },
  {
    status: "open",
    category: "Benachrichtigungen / Alerts",
    priority: "high",
    title: "Alerts · Regel-Editor und Zusammenfassungen",
    desc: `Die bestehende Idee „Benachrichtigungen / Alerts / Telegram“ um frei definierbare Regeln und Digests erweitern. Regeln u. a. für Kursgrenzen/-bewegungen, Portfolioänderungen, grosse Ein-/Ausgänge, neues Staking/Loan/Bot/NFT, Fälligkeiten, neue Claims/Rewards, Partner-/Statusänderungen, LP/QLP, Gasbestand sowie unbekannte Contracts/ungewöhnliche Transaktionen. Pro Regel Projekt/Wallet, Schwellenwert, Häufigkeit und Versandart. Versand als Sofortmeldung, Tages- oder Wochenzusammenfassung; gleichartige Events bündeln und bestätigte/erledigte Meldungen nicht unnötig wiederholen. Event-Erkennung und Versand bleiben getrennt.`
  },
  {
    status: "open",
    category: "Sicherheit",
    priority: "high",
    title: "Wallet-Sicherheitscenter",
    desc: `Grosse/ungewöhnliche ausgehende Transaktionen, neue unbekannte Contract-Interaktionen und verdächtige Tokenbewegungen erkennen. Tokenfreigaben/Allowances analysieren und hohe/riskante Freigaben hervorheben. Unerwartete Bestandsänderungen beobachteter Wallets melden. Contracts userbezogen als bekannt, geprüft, unbekannt oder ignoriert klassifizieren.`
  },
  {
    status: "open",
    category: "Historie / Analyse",
    priority: "medium",
    title: "Portfolio-Zeitreise",
    desc: `Beliebigen historischen Stichtag rekonstruieren: damalige Bestände, Portfoliowert, aktive Stakings, Loans, NFTs, Teamgrösse und kumulierte Rewards. Zwei Stichtage direkt vergleichen. Fehlende historische Kurse und unvollständige Scans sichtbar ausweisen.`
  },
  {
    status: "open",
    category: "Planung / Analyse",
    priority: "medium",
    title: "Szenario- und Ertragsrechner",
    desc: `Auswirkungen veränderter Tokenkurse simulieren, erwarteten Wert/Ertrag bei regulärem Staking-Ende darstellen, Reinvestition vs. Auszahlung vergleichen sowie zukünftige Cashflows/Fälligkeiten zeigen. Kritische Positionen bei definierten Kurswerten hervorheben. Annahmen strikt von on-chain bestätigten Fakten trennen.`
  },
  {
    status: "open",
    category: "Aktivität",
    priority: "medium",
    title: "Persönlicher Aktivitätsfeed",
    desc: `Relevante Ereignisse der eigenen Wallets chronologisch und verständlich anzeigen; Filter nach Projekt, Wallet, Ereignistyp und Zeitraum. Zusammengehörige technische Blockchain-Events zu einem fachlichen Vorgang bündeln.`
  },
  {
    status: "open",
    category: "Team / Partner",
    priority: "medium",
    title: "Team-Aktivitätsfeed und Team-Kennzahlen",
    desc: `PROJEKTGETRENNT für TLN/VOW bzw. DAO1/APTM: chronologische Team-Ereignisse wie neuer Partner, Mitgliedschaft/Status, Bot-Kauf, Staking Start/Aufstockung/Ende, Claim und LP/QLP-Änderung. Kennzahlen: aktive/inaktive Partner, neue Partner nach Zeitraum/Ebene, Teamgrössenentwicklung, Mitglieder-/Bot-/Staking-Verteilung, Partner ohne erkennbare Aktivität seit X Tagen und Zeitvergleiche. Definition „aktiv“ je Projekt separat fachlich festlegen.`
  },
  {
    status: "open",
    category: "Team / Partner",
    priority: "medium",
    title: "Verschlüsselte Partnernotizen, Tags und Gruppen",
    desc: `Projektbezogene verschlüsselte Notizen, Tags und frei definierbare Gruppen/Filter, z. B. Kunde, Interessent, Support nötig, Nachfassen. STRIKTE TRENNUNG: keine gemeinsame oder gegenseitig verwendete Partneridentität zwischen TLN/VOW und DAO1/APTM.`
  },
  {
    status: "open",
    category: "Wallets / Rollen",
    priority: "medium",
    title: "Watch-only-Wallets und Rollen",
    desc: `Wallets beobachten, ohne sie als eigene Wallet zu behandeln, z. B. Familie, Kunden, Teammitglieder, Projekt-/Treasury-Wallets. Klare Kennzeichnung und getrennte Auswertungen. Später optional Rollen und eingeschränkte Zugriffe für Berater/Kunden.`
  },
  {
    status: "open",
    category: "Export / Berichte",
    priority: "medium",
    title: "Steuer- und Transaktionsexport ausbauen",
    desc: `Bestehenden CSV-Export zu einem Export für CSV und Excel, später optional PDF-Bericht, ausbauen. Käufe, Verkäufe, Transfers, Rewards, Claims, historische Kurse, Gasgebühren und Jahresendbestände; Auswahl nach Jahr, Projekt, Wallet und Transaktionstyp. Datenbasis für Steuer/Buchhaltung liefern, ohne verbindliche steuerliche Beurteilung.`
  },
  {
    status: "open",
    category: "Export / Berichte",
    priority: "low",
    title: "Berichte und teilbare Ansichten",
    desc: `Monats-, Quartals- und Jahresberichte; optionales Branding. Schreibgeschützter Link mit Ablaufdatum, sensible Werte/Bereiche gezielt ausblendbar sowie anonymisierte Ansicht für Supportfälle.`
  },
  {
    status: "open",
    category: "Komfort / Erklärung",
    priority: "medium",
    title: "Transaktions-Erklärer",
    desc: `Technische Transaktionen automatisch in verständliche Alltagssprache übersetzen und zusammengehörige Blockchain-Events als einen fachlichen Vorgang erklären. Erklärungen bleiben projektspezifisch und dürfen ausschließlich bestätigte Regeln verwenden.`
  },
  {
    status: "open",
    category: "Komfort / Suche",
    priority: "medium",
    title: "Globale Suche",
    desc: `Suche über Wallet-Adresse, TLN-ID, NFT-/Bot-ID, Partneralias, Contract-Adresse und Transaktionshash mit direktem Sprung zur Position/Person/Transaktion. Projektherkunft eindeutig kennzeichnen; Zugriffsrechte und Verschlüsselung vollständig berücksichtigen. TLN- und DAO-Identitäten werden dabei nicht zusammengeführt.`
  },
  { status: "open", category: "UI / Navigation", title: "Navigation während initialem Datenladen entkoppeln", desc: "TODO 17.09.2026: Navigation ist während/kurz nach dem initialen Datenladen zeitlich noch nicht sauber entkoppelt. Ein im laufenden Load gewählter Bereich darf nach Abschluss eines Hintergrundjobs nicht durch einen älteren Render-/Restore-Schritt überschrieben werden. Navigation soll benutzbar bleiben; Datenjobs aktualisieren nur ihren Datenbereich im Hintergrund." },
  { status: "done", category: "DAO1", title: "DAO1 alter Team-Baum hierarchisch darstellen", desc: "Phase 4.73: Der verifizierte Legacy-DID→fid-Graph wird analog zum TLN/VOW-Team als hierarchischer Baum bis 20 Ebenen dargestellt. Eigene DIDs werden als Roots erkannt; eine eigene DID, die unter einer anderen eigenen DID liegt, wird bei Alle DIDs nicht doppelt als separater Root gerendert. Pro DID gibt es ein verschlüsselt gespeichertes Name/Alias-Feld. Zweige sind einklappbar; Mint-Nachweis in Details; technische Kantentabelle nur DEV/Diagnose." },
  { status: "done", title: "Projekt-Caches nur noch bewusst aktualisieren", desc: `Phase 2am: Die Liquidity-Pool-Tabs von DAO1 und TLN/VOW sind beim Öffnen vollständig cache-only.

• Button „Daten aktualisieren“ erscheint sofort.
• Beim Öffnen werden nur lp_position_cache und lp_history_events aus Supabase gelesen.
• Keine versteckte Blocksuche, pairInfo/getReserves/balanceOf- oder Preisabfrage.
• Erst „Daten aktualisieren“ liest Blockchain/Explorer und ersetzt danach den Positions-Cache.
• DAO1 → Transaktionen & Claims bleibt ebenfalls manuell über „Daten aktualisieren“.
• Dadurch entstehen beim Navigieren zwischen Projekt-Tabs keine unnötigen Blockchain-Scans.` },
  { status: "done", title: "Discovery-Metadaten + Solana-Default", desc: "Phase 2ag: Alle discovery_enabled Chains sind beim Öffnen standardmäßig aktiviert, inklusive Solana. Historisch gefundene EVM-/Apertum-Token laden Symbol, Name und Decimals direkt vom Contract und cachen die Metadaten lokal." },
  { status: "done", title: "Apertum Kurse vollständig on-chain", desc: `Phase 2al: Im Tab Vordefinierte Token gilt für die komplette Apertum-Chain ausschließlich On-Chain-Bewertung; die Preisermittlung verwendet dieselbe wAPTM/wUSDT-Referenz wie DAO1 und erkennt Wrapped-Tokens auch dann korrekt, wenn in predefined_tokens nur das Label statt eines separaten symbol-Felds gepflegt ist.

• Nativer APTM wird 1:1 über wAPTM/wUSDT bewertet.
• wUSDT/wUSDC werden als 1 USD behandelt.
• Weitere Token nutzen direkt TOKEN/wUSDT oder TOKEN/wAPTM → wUSDT.
• archive_rpc_url ist optional; falls leer, wird wie im DB-Schema vorgesehen rpc_url verwendet.
• CoinGecko/GeckoTerminal werden für Apertum nicht als Fallback verwendet.` },
  { status: "in_progress", title: "TLN/VOW Liquidity Pools nach Chain getrennt", desc: `BSC/PCLP ist funktional integriert und wird aktuell inklusive Historie und Staking weiter gehärtet. Ethereum (ETH/LP) ist funktional noch nicht vollständig umgesetzt und bleibt ausdrücklich OFFEN.

Ziel: ETH-Liquidity-Pools analog zu BSC vollständig integrieren – LP-Erkennung, aktuelle Positionen, historische Werte und Cache. Die sichtbare ETH-Unterseite allein gilt nicht als erledigte ETH-Integration.` },
  { status: "done", title: "LP/PCLP-Historie und Positionen persistent cachen", desc: "Phase 2af speichert Add/Remove, LP-Delta, laufenden LP-Saldo, Underlyings und historische USD-Werte in lp_history_events. Seit Phase 2am speichert lp_position_cache zusätzlich den zuletzt bewusst aktualisierten aktuellen LP/PCLP-Bestand inklusive Underlyings, Pool-Anteil, USD-Wert und 31.12.-Vergleichsstand. Beim Öffnen der Projekt-Tabs werden ausschließlich diese Supabase-Caches gelesen." },
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
  { status: "done", category: "Security & Privacy", title: "Private Walletdaten & Partner-Aliase verschlüsseln", desc: "Umgesetzt: Konzept „Maximale Bequemlichkeit“ ohne Passwort/Recovery-Code für User. Private Walletdaten und Partner-Aliase werden userbezogen verschlüsselt gespeichert; Partnernamen liegen in user_team_aliases_private. Öffentlicher Supabase-Key allein reicht nicht zur Entschlüsselung." },
  {
    status: "open",
    title: "Automatische Snapshots: ereignisbasiert + monatlicher Hintergrund-Job",
    desc: `Keine 7-Tage-Regel.

Beim normalen Seitenaufruf soll ein automatischer Snapshot nur bei einer wirklich relevanten Bestands-/Wertänderung entstehen, z. B. neuer/entfernter Token oder deutliche Veränderung des Gesamtwerts. Die konkrete Schwelle wird vor Umsetzung festgelegt.

Zusätzlich soll ein monatlicher Hintergrund-Job serverseitig einen Monats-Snapshot erstellen, auch wenn der User die Seite in diesem Monat nicht öffnet. Ziel: einmal pro Monat ein verlässlicher Stand ohne Benutzeraktion.

Hinweis an den User:
• Bei ereignisbasiertem Snapshot direkt ein Popup mit Grund anzeigen.
• Bei einem durch den Hintergrund-Job erstellten Monats-Snapshot beim nächsten Login informieren, z. B. „Am 31.07.2026 wurde automatisch ein Monats-Snapshot erstellt.“

Der bestehende spezielle Bestand per 31.12. bleibt davon unabhängig.`
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
  ,
  {
    status: "in_progress",
    category: "Projekt TLN/VOW",
    priority: "critical",
    title: "TLN/VOW Loans · Lifecycle vollständig on-chain",
    desc: `ZIEL / STAND: Die zentrale Loan-Engine wird von Discovery und Hauptseite gemeinsam verwendet; keine zweite fachliche Erkennungslogik anlegen. Die bekannten Event-Werte 0–5 und die vier echten Loan-Zinsmodelle 0–3 sind on-chain verifiziert.

VERIFIZIERTE ZINSREGELN:
• Event 0 · TLN Gold Booster ×4: 18 % bei Eröffnung vorausbezahlt; Repay = 100 % Principal. End-to-End-Beispiel #7281: 272 TLN GOLD Burn → 1'088 v$ Principal → 195.84 v$ Vorauszins → später 1'088 v$ Repay.
• Event 1 · TLN Plus 2x: 18 % bei Eröffnung vorausbezahlt; Repay = 100 % Principal. Beispiel #844: 1'000 TLN Burn → 2'000 v$ Principal → 360 v$ Vorauszins → später 2'000 v$ Repay.
• Event 2 · TLN Plus 0.25x: 18 % fällig bei Rückzahlung; Repay = 118 % Principal.
• Event 3 · TLN Gold Booster ×2: 18 % fällig bei Rückzahlung; Repay = 118 % Principal.
• Event 4 · TLN Gold Rebound: kein echter rückzahlbarer Loan; separat darstellen.
• Event 5 · TLN Gold Extended: keine normale Rückzahlung; gehört in Loans inkl. Extended, nicht in Rebound. Alt→Neu-Verknüpfung ist verifiziert und umgesetzt: Referenzfall #5722 (24.04.2025) → Extended #32646 (06.09.2026). Die Tabelle zeigt beim neuen Loan die ersetzte Position plus ursprüngliches Loan-Datum und beim alten Loan die neue Extended-Position plus Extended-Datum. FACHREGEL TLN GOLD EXTENDED / SECOND CHANCE KORRIGIERT: Der alte Loan ist verfallen; dessen Zins und Schuld werden NICHT übernommen. Typ 5 ist ein neuer eigenständiger Loan. Referenzfall #5722 → #32646: Bei #32646 sind 820 v$ als neuer Extended-Betrag erkannt; der neue Rückzahlungsbetrag und der eigene Zins bei Rückzahlung müssen für #32646 positionsbezogen on-chain ermittelt werden. Weder 820 × 18 % = 147.6 v$ berechnen noch die 180 v$ des Alt-Loans übernehmen. Die Alt→Neu-Verknüpfung bleibt ausschließlich als Historie erhalten.

OFFEN / NÄCHSTER SCHRITT: Lifecycle vollständig on-chain bestimmen:
• Status „Waiting to Swap“ / geswappt
• tatsächliches Swap-Datum v$ → VOW
• Ablauf-/Fälligkeitsdatum des Vertrags
• effektives Rückzahlungsdatum separat vom Ablaufdatum
• mögliche Karenzfrist verifizieren
• Rückzahlung/Abschluss positionsgenau zuordnen
• TLN Gold Extended: neuen Rückzahlungsbetrag und eigenen Zins der neuen Position on-chain ermitteln; keine Übernahme aus Alt-Loan und keine rechnerische Ableitung
  DEV-STAND: Contract-State-Reader ergänzt. Er liest den aktuellen Options-Proxy/Implementation-State ABI-unabhängig via eth_call und zeigt erfolgreiche Rohantworten für Position/Wallet. Nächster Kontrollfall: #32646; gesucht wird insbesondere ein positionsbezogener Rückzahlungs-/Debt-Wert. Eröffnungs-Logs enthalten 820 v$ und Typ 5, aber keinen belegten Rückzahlungsbetrag. FACHLICHE KLÄRUNG ZINS/RÜCKZAHLUNG TYP 5 bleibt ausdrücklich OFFEN; bis dahin keine Berechnung/Anzeige. NÄCHSTER TECHNISCHER PUNKT: Bedeutung des Positions-Statusfeldes verifizieren. Für #32646 liefert Getter 0xe4ba13c7 als letztes Feld den Rohwert 1. Neuer DEV-Vergleich liest denselben Getter über mehrere bekannte Positionen und stellt Rohwert vs. bekannten Lifecycle gegenüber; „Waiting to Swap“ erst nach eindeutiger Korrelation benennen. Korrektur nach Fachhinweis: aktuell sind sämtliche TLN Gold Extended UND TLN Gold Rebound Positionen Wait to Swap; der erste 40er-Test enthielt daher keine echte Gegenprobe. DEV-Vergleich erweitert: gemischte Gruppe erzwingt aktuelle Wait-to-Swap-Fälle plus ältere Nicht-Extended/Rebound-Kontrollfälle. Danach gezielte Kontrollgruppe ergänzt: ältere Loans mit positivem w5/w6-Struct-Kandidaten als Indiz für vorhandenes VOW-Collateral. SCOPE: Alte Original-Loans mit direkt eingebrachtem VOW-Collateral nicht weiter verfolgen; nur als historische Extended-Vorgänger behalten. TLN Gold: alle aktuellen Typen identifizieren. TLN+: nur 0.25 / x2 / ggf. x4. DEV-Matrix „Loan-Typen · On-Chain-Verifizierungsstand“ ergänzt. NÄCHSTER SCHRITT KORRIGIERT: Rebound/Extended haben aktuell noch keinen realen v$→VOW-Swap und werden für die Lifecycle-Verifikation vorerst zurückgestellt. Stattdessen globale öffentliche Referenz-Loans für TLN+ 0.25, TLN+ x2, TLN Gold x2 und TLN Gold x4 suchen; pro Typ möglichst einen bereits weiter fortgeschrittenen Struct-/Collateral-Fall auswählen. DEV-Werkzeug „Referenz-Loans global suchen“ ergänzt. Ergänzt um pro-Typ-Aktion „Besten Referenzfall untersuchen“ für TLN+ 0.25, TLN+ x2, TLN Gold x2 und TLN Gold x4; Auswahl priorisiert weiter fortgeschrittenen Struct-State und zeigt komplette Eröffnungs-/Struct-Rohdaten. Suchquelle verbessert: echte chainweite TLN+- und TLN-GOLD-Burn-Scans statt Repay-/eigene-Wallet-Bias. HISTORISCHE SUCHE 15.09.2026: Der Referenz-Scanner kann jetzt über einen Stichtag gezielt ältere Burns durchsuchen; Default 31.05.2026. Damit dominieren die jüngsten September-Wait-State-Loans nicht mehr die Kandidatenliste. Der Stichtag wird per Block-Timestamp auf den passenden BSC-Block aufgelöst. Fachregel: Alt→Neu bei Extended ist Eligibility/Second-Chance-Bezug; altes verfallenes VOW-Collateral wird nicht in den neuen Loan übertragen, sondern fällt bei Nicht-Rückzahlung an den Kreditgeber. Neues Extended-Collateral entsteht erst beim späteren v$→VOW-Swap.
  - DEV Repay-Verifier erweitert: Event-Wert 5 kann gezielt gesucht werden; keine 18-%-Annahme. Reale Typ-5-Repays zeigen Principal, tatsächlich bezahlte v$ und daraus die on-chain belegte Differenz/Zinsquote. Nächster Test: historische Typ-5-Repays suchen; bei keinem Treffer Scan bis 10’000 Repay-Txs erweitern.

  - PRÜFRESULTAT 15.09.2026: Die neuesten 10’000 globalen Repay-Transaktionen wurden vollständig geprüft. Gefunden wurden vier bekannte Event-Werte, aber kein Typ-5-Repay und kein unbekannter Typ. Zins/Rückzahlung für Extended bleiben deshalb offen. UMGESETZT: „Weitere 10’000 ältere Repays prüfen“ setzt blockgenau vor dem ältesten geprüften Block fort, ohne den fachlich analysierten Bereich nochmals auszuwerten; Batch, Blockbereich und kumulierte Anzahl werden angezeigt. Falls nach einem Seiten-Reload noch kein Cursor im Speicher liegt, ermittelt der Fortsetzungslauf zuerst nur den Block-Cursor der neuesten 10’000 und analysiert danach den älteren Batch. Für Branch-Prüfungen besitzt die Discovery-Testseite auf localhost zusätzlich eine eigene Supabase-Magic-Link-Anmeldung; auf produktiven Hosts bleibt sie verborgen. NÄCHSTE PRÜFUNG: Batch 2 (Repays 10’001–20’000) ausführen und Ergebnis dokumentieren. Bei einem Treffer Typ-5-Principal, tatsächliche Zahlung und Differenz positionsgenau übernehmen; bei keinem Treffer bleibt Zins/Rückzahlung offen und der nächste ältere Batch kann gestartet werden.

CASHFLOW-DARSTELLUNG:
• Brutto-v$ Mint / Option
• Netto-v$ ans Wallet
• Zinsbetrag + Zinsmodell
• Collateral-Quelle (eigene VOW / aus Mint gekauft)
• VOW Collateral + Collateral-Status
• Rückzahlung und Collateral-Rückgabe getrennt betrachten

CACHE-REGEL: Immutable Eröffnungsdaten persistent cachen. Veränderliche Lifecycle-Felder (Status, Waiting-to-Swap, Swap, Fälligkeit, Rückzahlung) bei jedem relevanten Refresh neu prüfen; Cache darf neue On-Chain-Informationen niemals verdecken.

TABELLENREGEL: Für die echten ursprünglichen Loan-Typen 0–3 den 18-%-Zins und zusätzlich „Zinsmodell“ (im Voraus bezahlt / fällig bei Rückzahlung) sowie Principal, Zinsbetrag und Rückzahlung gesamt getrennt darstellen. Bei TLN Gold Extended (Typ 5) weder Zins noch Schuld aus dem verfallenen Alt-Loan übernehmen und keinen Zins aus dem Extended-Principal berechnen. Rückzahlungsbetrag und eigener Extended-Zins ausschließlich positionsbezogen on-chain ermitteln. Nicht aus einem Repay von 100 % fälschlich „0 % Zins“ ableiten.\n\nUI-STAND: Hauptseite → TLN/VOW → Loans ist in die Unter-Tabs „Loans“ und „Rebounds“ getrennt. Beide Unter-Tabs verwenden den zentralen TLN/VOW-Wallet-Filter oben im Projektbereich; der frühere zweite Wallet-Filter im Loan-Filterblock wurde entfernt. Die übrigen gemeinsamen Filter und ein tabellarisches Summary im Header bleiben über beide Unter-Tabs sichtbar. Wallet-Adressen in der Loan-Tabelle werden kompakt (0x1234…abcd) gezeigt, vollständige Adresse per Tooltip. Tabellenregel zentral: numerische Werte inklusive zugehörigem Spaltentitel rechtsbündig; Text und Datum linksbündig.`
  },
  {
    status: "open",
    category: "Projekt TLN/VOW",
    priority: "high",
    title: "Unbekannte Loan-/Booster-Typen automatisch zur Prüfung melden",
    desc: `ZIEL: Neue Loan-/Booster-Varianten dürfen nie still fehlen. Die zentrale Loan-Engine muss unbekannte Event-Werte, neue Contract-/Event-Strukturen oder nicht passende Mengen-/Zinsmodelle erkennen.

VERHALTEN:
• Position trotzdem in der Übersicht anzeigen, auch wenn Angaben unvollständig sind.
• Status „zu prüfen“ setzen; niemals unbekannte Typen als bekannten Typ raten.
• relevante Rohdaten/Tx/Event-Contract/Log-Index für Diagnose speichern.
• Admin in der Anwendung informieren und E-Mail an Chris auslösen.
• identische unbekannte Varianten deduplizieren, damit keine Meldungsflut entsteht.
• nach gemeinsamer On-Chain-Verifikation den neuen Typ zentral registrieren; Discovery und Hauptseite übernehmen ihn automatisch.

ARCHITEKTUR: Keine typabhängige Parallel-Logik in Tabellen/UI. Typ/Klassifikation muss aus der zentralen Loan-Erkennung kommen.`
  },
  {
    status: "open",
    category: "Projekt TLN/VOW",
    priority: "medium",
    title: "TLN/VOW Ethereum-Historie 2023 ergänzen",
    desc: "Historische TLN/VOW-Stakings und Rewards aus der Ethereum-Phase vor BSC vollständig in Discovery und Hauptseite integrieren."
  },
  {
    status: "in_progress",
    category: "Projekt TLN/VOW",
    priority: "high",
    title: "TLN-Team-Baum · Datenvollständigkeit und sichtbarer Ladefortschritt",
    desc: `REFERENZ 18.09.2026: Der Team-Baum ist fachlich noch nicht vollständig. Vor weiteren allgemeinen Performance-Umbauten zuerst diesen Datenpfad stabilisieren.

OFFEN / VERBINDLICH:
• userbezogene Partnernamen/Aliase müssen nach Cache-Restore für alle bekannten TLN-IDs/Wallets zuverlässig geladen und angezeigt werden
• pro Partner müssen alle bereits erkannten Staking-Positionen aus Discovery-/Lifecycle-Daten erhalten bleiben; Cache-Restore darf keine Positionen reduzieren oder verlieren
• Referenzfall TLN-ID 11674 weiterführen: TLN Legacy LPT ist geschlossen/verifiziert; vUSD/VOW ist erkannt, aber der positionsgenaue Duration-/Lifecycle-Nachweis ist noch offen und muss ohne Schätzung vollständig on-chain geklärt werden
• ein Cache-Stand darf niemals weniger fachliche Information anzeigen als der bereits verifizierte persistente Datenbestand
• Hintergrund-/Lifecycle-Aktualisierung muss einen Lade-/Fortschrittsbalken anzeigen, der beim Scrollen im Viewport sichtbar bleibt und nach Abschluss wieder verschwindet
• Diagnose/Optimierung des Request-Aufkommens für technical_global_cache / staking_scan_cache erst so durchführen, dass keine fachlichen Datenverluste durch Egress-Optimierung kaschiert werden.`,
  },
  {
    status: "open",
    category: "Projekt TLN/VOW",
    priority: "medium",
    title: "TLN-Team-Baum um LP/QLP-Status erweitern",
    desc: "Pro Partner im TLN-Team-Baum den Status LP / QLP / kein Status on-chain ermitteln und sichtbar machen, sofern die Contract-Logik belastbar identifiziert ist."
  },
  {
    status: "open",
    category: "Projekt TLN/VOW",
    priority: "medium",
    title: "Lending-Bereich ergänzen",
    desc: "Nach Abschluss des Loan-Bereichs Lending fachlich definieren: On-Chain-Erkennung, Positionen, Zinsen/Rewards, Status, Datenmodell, Cache und Darstellung."
  },
  {
    status: "open",
    category: "Projekt DAO1",
    priority: "high",
    title: "DAO1 Team-Baum bis 20 Ebenen",
    desc: `ZIEL: Im DAO1-Projekt zwei strikt getrennte Team-Bäume der eigenen Partner bis maximal 20 Ebenen tief darstellen: „Tree DAO1 (alt)“ und „Tree APTMDAO (neu)“. Die beiden Strukturen dürfen fachlich und technisch nicht vermischt oder zusammengeführt werden.

ANZEIGE PRO PARTNER:
• Partner/Wallet bzw. vorhandene DAO1-Identität
• Ebene im jeweiligen Tree
• Tree-Zugehörigkeit ist strikt DAO1 alt ODER APTMDAO neu; keine tree-übergreifende Aggregation
• sichtbar kennzeichnen, ob eine DAO1-Mitgliedschaft vorhanden ist
• Mitgliedschaft wird über einen eigenen Membership-NFT-Typ erkannt, nicht aus TLN-Daten abgeleitet
• Klick auf „Details“ zeigt die NFTs dieses Partners; vorhandene NFT-Klassifikation (z. B. Mining-Bot, DID, Trading-Bot, Membership) wiederverwenden

REFERENZ: UI, Auf-/Zuklappen, Navigation und Detailidee können vom bestehenden TLN-Team-Baum übernommen werden. Die Datenquelle, Partnerbeziehungen und Membership-/NFT-Erkennung müssen jedoch DAO1-/Apertum-spezifisch sein.

STAND 16.09.2026: Alter DAO1-Tree: Parent-Beziehung on-chain verifiziert über DID-Event TokenMinted(to, tokenId, fid); fid ist die Parent-ID. Ein manueller On-Chain-Discovery-Scan ist im Team-Tab eingebaut und zeigt ausschließlich dekodierbare Kanten. Neuer APTMDAO-Tree: NFT- und Manager-Contract sind getrennt hinterlegt; Parent-Kanten bleiben bis zur eindeutigen Dekodierung der Manager-Event-ABI gesperrt. OFFEN: APTMDAO-Parent-Event final dekodieren; danach persistente Cache-Strategie, Membership-/Bot-Details und Referral-Reward→Partner-Zuordnung ergänzen.`
  },
  {
    status: "open",
    category: "Projekt DAO1",
    priority: "high",
    title: "DAO1 Abschluss-Plausibilitätscheck",
    desc: "Claims, Referral Rewards, NFT-Zuordnung, Token-Anzahlen und historische USD-Summen nochmals mit bekannten Kontrollfällen plausibilisieren, bevor DAO1 als fachlich abgeschlossen gilt."
  },
  {
    status: "open",
    category: "UI/UX",
    priority: "medium",
    title: "Sticky Tabellen-Header zentral einführen",
    desc: "ZIEL: Bei langen Tabellen bleibt die Kopfzeile beim vertikalen Scrollen sichtbar (sticky header). Zentral im allgemeinen Tabellen-CSS lösen, nicht tabweise. Bestehende globale Tabellenregel beibehalten: Wenn Spalten horizontal nicht lesbar passen, nicht zusammendrücken/abschneiden, sondern horizontalen Scrollbereich verwenden. Sticky Header muss auch innerhalb dieses Scrollcontainers korrekt funktionieren."
  },
  {
    status: "open",
    category: "Caching & Daten",
    priority: "high",
    title: "Zentrale Cache-/Schema-Versionierung pro Job",
    desc: "ZIEL: Zentrale Cache-/Schema-Versionierung je Datenjob statt verstreuter Einzelregeln. Fachliche Änderung → betroffene Cache-Version erhöhen → veraltete Daten erkennen → wenn möglich migrieren/reklassifizieren, sonst gezielt neu aufbauen. Nicht blind alle Caches löschen. WICHTIG: Lifecycle-Daten, deren Zustand sich on-chain ändern kann, benötigen zusätzlich einen inkrementellen Refresh und dürfen nicht allein wegen gültiger Cache-Version als aktuell gelten. Diese Regel ist besonders für TLN/VOW Loans (Waiting-to-Swap, Fälligkeit, Repay) relevant."
  },
  {
    status: "open",
    category: "Security & Privacy",
    priority: "high",
    title: "Wallet vollständig löschen / Alle Daten löschen",
    desc: "Wallet-Löschung mit Bestätigung und vollständigem Purge aller walletbezogenen DB-/Cache-Daten. Zusätzlich userweite Funktion „Alle Daten löschen“ vorsehen."
  },
  {
    status: "done",
    category: "Projekt TLN/VOW",
    title: "Loans · zentrale Engine für Discovery und Hauptseite",
    desc: "Erkennungs-, Typ-, Zins- und Repayment-Logik zentralisiert. Discovery und Hauptseite verwenden dieselbe Loan-Engine; keine doppelte fachliche Implementierung."
  },
  {
    status: "done",
    category: "UI/UX",
    title: "Token-Anzeige-Kommastellen zentral konfigurierbar",
    desc: "Technische Decimals und Anzeige-/Summary-Kommastellen sind getrennt. Anzeigepräzision kann zentral über die Token-Stammdaten gesteuert werden, inklusive Native Coins."
  },
  {
    status: "done",
    category: "Security & Privacy",
    title: "Vordefinierte Token · User read-only / Admin bearbeitbar",
    desc: "Normale User sehen nur Chain, Token, Adresse und Kurs (USD); Bearbeitung und technische Spalten sind Admin-only. DB-seitige RLS-Härtung für predefined_tokens ist als Migration vorgesehen/geprüft."
  }

  ,
  {
    status: "in_progress",
    category: "Plattform & Allgemein",
    priority: "high",
    title: "Hilfe & Projektdokumentation laufend aktuell halten",
    desc: `DAUERREGEL: Funktionale Änderungen sind nicht abgeschlossen, solange die passende Hilfe veraltet ist.
• Allgemeine Funktionen gehören in „❓ Hilfe / Handbuch“.
• Projektspezifische Bedienung, Fachlogik, Statusmodelle, Cache-/Refresh-Regeln und Besonderheiten gehören in den eigenen Hilfe-Tab des jeweiligen Projekts (z. B. TLN/VOW, DAO1).
• Bei neuen/änderten Tabs, Statusregeln oder fachlichen Modellen die Hilfe im selben Änderungspaket mitpflegen.
• Keine projektspezifischen Detailregeln doppelt in der allgemeinen Hilfe dokumentieren; dort nur auf den Projekt-Hilfe-Tab verweisen.

NEUER-CHAT-/ÜBERGABEREGEL:
• Ideen/Umbau und die projektspezifischen Hilfen sind die dauerhafte Übergabedokumentation des Projekts.
• Nach funktionalen Änderungen müssen offene Punkte, bestätigte Fachregeln, wichtige technische Entscheidungen, zentrale Zuständigkeiten/Dateien, bekannte Einschränkungen und nächste sinnvolle Schritte so dokumentiert werden, dass ein neuer Chat ohne separates Übergabe-Summary weiterarbeiten kann.
• Der Ideen-Tab muss bei offenen Arbeiten ausreichend konkret beschreiben: Was ist bereits umgesetzt/verifiziert? Was ist noch offen? Welche Regeln dürfen nicht verloren gehen? Welche zentrale Logik/Datei ist betroffen? Welche Tests oder On-Chain-Nachweise fehlen?
• Die jeweilige Projekt-Hilfe dokumentiert den produktiven Ist-Stand und die Bedien-/Fachlogik; offene Entwicklungsfragen gehören primär in Ideen/Umbau.
• Bei Fortsetzung in einem neuen Chat soll das aktuelle vollständige Projekt als Grundlage dienen; zuerst admin/ideas.js und die relevanten Projekt-Hilfen lesen, danach den aktuellen Code prüfen.
• Ziel: Kein separates manuelles Chat-Summary mehr erforderlich.`
  }
,
  {
    status: "open",
    category: "Architektur & Infrastruktur",
    priority: "critical",
    title: "Zentrale Build-, Modul- und Datenversionierung",
    desc: `ZIEL: Einzelne Module/Dateien unabhängig aktualisieren können, ohne index.html nur wegen Buildnummern oder Cache-Bustern anfassen zu müssen. Gleichzeitig soll WalletTracking beim Seitenstart gezielt entscheiden, welche Daten neu geladen, nur neu klassifiziert oder unverändert aus Cache verwendet werden können.

ARCHITEKTURVORSCHLAG:
1. MODULE BUILD
• jedes austauschbare Modul meldet beim Laden eigene Build-ID + Timestamp
• Beispiele: app-core, ideas, help-general, tln-vow, tln-vow-loans, tln-vow-help, dao1, dao1-help
• sichtbarer Runtime-Build im Header = neuester Build aller tatsächlich geladenen Module
• reine Änderung z. B. an ideas.js darf nur diese Datei erfordern

2. ZENTRALER MODULE-LOADER / CACHE-BUSTING
• keine fest in index.html eingetragenen versionsabhängigen ?v=... Werte pro Modul
• kleiner stabiler Loader lädt Module mit kontrolliertem Cache-Buster
• KEIN document.write; dynamische script-Elemente bzw. robuste Loader-Logik verwenden
• Ziel: geänderte Einzeldatei wird nach Reload sicher neu geladen, ohne index.html anzufassen

3. DATENVERSION PRO JOB / CACHE
• Build-Version strikt von fachlicher Datenversion trennen
• je Datenbereich eigene Version, z. B. balances, nft-discovery, dao1-transactions, tln-stakings, tln-loans-opening, tln-loans-lifecycle, team-graph, prices
• UI-/Textänderung darf niemals unnötigen Blockchain-Reload auslösen
• fachliche Änderung invalidiert nur betroffene Datenbereiche

4. DISCOVERY- VS. KLASSIFIKATIONS-VERSION
• Discovery-Version erhöhen, wenn bisher relevante On-Chain-Ereignisse gar nicht gefunden wurden → gezielter Nach-/Fullscan
• Klassifikations-Version erhöhen, wenn Rohdaten bereits vorhanden sind, aber neu interpretiert werden müssen → nur Re-Klassifikation, kein unnötiger Chain-Scan

5. LIFECYCLE-DATEN
• gültige Cache-/Schema-Version bedeutet nicht automatisch „aktueller Zustand“
• veränderliche Daten wie TLN/VOW Loan Waiting-to-Swap, Swap-Datum, Fälligkeit und Repayment müssen trotz gültigem Cache inkrementell neu geprüft werden
• bereits bestätigte immutable Daten dürfen erhalten bleiben

START-/MIGRATIONSLOGIK:
• beim Seitenstart geladene Modulversionen registrieren
• Datenversionsstand des Caches prüfen
• nur notwendige Migration/Reklassifikation/Refresh-Jobs auslösen
• alten Cache möglichst als Fallback behalten, bis Neuaufbau erfolgreich ist
• Status transparent im UI/Diagnose-Log ausweisen

WICHTIGKEIT: SEHR HOCH. Dieser Umbau sollte erfolgen, bevor deutlich mehr separat austauschbare Module hinzukommen, weil er Build-Anzeige, Browser-Cache, Einzeldatei-Updates und gezielte Datenmigration gemeinsam löst.`
  },
  {
    status: "open",
    category: "Projekt TLN/VOW",
    priority: "high",
    title: "TLN/VOW Loans · Wirtschaftlichkeit / Gewinn-Verlust je Position",
    desc: `ZIEL: Für jeden Loan später nachvollziehbar ausweisen, ob der gesamte Vorgang wirtschaftlich Gewinn oder Verlust gebracht hat.

NOCH NICHT FACHLICH DEFINIERT – deshalb derzeit KEINE P&L-Zahl anzeigen.

ZU BERÜCKSICHTIGEN:
• tatsächliche Netto-v$-Auszahlung an das Wallet
• Brutto-v$-Mint / Principal
• 18-%-Zins und Zinsmodell (vorausbezahlt / bei Rückzahlung fällig / vom Mint abgezogen)
• tatsächlich zurückgezahlte v$
• Herkunft des VOW-Collaterals: eigene VOW oder aus Loan-Mint gekauft
• VOW Collateral zurückgegeben / weiterhin gebunden / bei Nicht-Rückzahlung verfallen
• historische und ggf. aktuelle Bewertung des VOW-Collaterals
• mögliche TLN/TLN-GOLD-Burn-Kosten, falls sie in die Gesamtrentabilität einbezogen werden sollen

BESONDERHEIT TLN GOLD EXTENDED: User erhält netto v$ aufs Wallet und stellt eigene VOW als Collateral. Bei Rückzahlung kommen die VOW zurück; bei Nicht-Rückzahlung bleiben die v$ beim User, aber das eigene VOW-Collateral geht an den Kreditgeber. Welche Zeitpunkte/Kurse für eine faire P&L-Bewertung verwendet werden, ist noch zu definieren.

VOR P&L-IMPLEMENTIERUNG:
1. alle Cashflows und Collateral-Lifecycle-Felder on-chain vollständig verifizieren,
2. Bewertungszeitpunkte festlegen,
3. realisierte vs. unrealisierte Wirtschaftlichkeit definieren,
4. erst danach Summary-/P&L-Anzeige implementieren.`
  }];

const ADMIN_IDEA_STATUS_META = {
  open: { label: "Offen", color: "#9aa0ac" },
  in_progress: { label: "In Umsetzung", color: "#3b82f6" },
  clarifying: { label: "In Abklärung", color: "#f0b90b" },
  done: { label: "Umgesetzt", color: "#46c878" },
  reverted: { label: "Umgesetzt, dann zurückgebaut", color: "var(--danger)" },
  paused: { label: "Pausiert", color: "#8247e5" }
};

const ADMIN_IDEA_CATEGORY_ORDER = [
  "Projekt TLN/VOW",
  "Projekt DAO1",
  "Caching & Daten",
  "UI/UX",
  "Security & Privacy",
  "Architektur & Infrastruktur",
  "Blockchain & Provider",
  "Analyse & Export",
  "Chat & Support",
  "Plattform & Allgemein"
];

let adminIdeasFilterState = { category: "all", status: "all", priority: "all", search: "", showDone: false };

const ADMIN_IDEA_PRIORITY_META = {
  critical: { label: "Sehr hoch", rank: 0, color: "var(--danger)" },
  high: { label: "Hoch", rank: 1, color: "#f59e0b" },
  medium: { label: "Mittel", rank: 2, color: "#3b82f6" },
  low: { label: "Niedrig", rank: 3, color: "#9aa0ac" }
};

function adminIdeaPriority(idea){
  if(idea?.priority && ADMIN_IDEA_PRIORITY_META[idea.priority])return idea.priority;
  if(idea?.status==="in_progress")return "high";
  if(idea?.status==="clarifying")return "high";
  if(idea?.status==="open")return "medium";
  return "low";
}

function adminIdeaCategory(idea){
  if(idea?.category)return idea.category;
  const t=`${idea?.title||""} ${idea?.desc||""}`.toLowerCase();
  if(/dao1|apertum/.test(t))return "Projekt DAO1";
  if(/tln\/vow|staking|v-währung|vow\b|liquidity pools nach chain/.test(t))return "Projekt TLN/VOW";
  if(/cache|snapshot|datenversion|historie persistent|schema-version/.test(t))return "Caching & Daten";
  if(/verschlüssel|privacy|security|rls|wallet-bezeichnung/.test(t))return "Security & Privacy";
  if(/hardcoding|konfiguration aus html|supabase|architektur|secret|proxy/.test(t))return "Architektur & Infrastruktur";
  if(/alchemy|netzwerkgebühr|akasha?|chain|rpc|provider/.test(t))return "Blockchain & Provider";
  if(/export|gewinn\/verlust|allokation|chart|kursverlauf|csv|pdf|excel/.test(t))return "Analyse & Export";
  if(/chat|benachrichtigung|support/.test(t))return "Chat & Support";
  if(/mehrsprach|pwa|willkommen|hilfe|mobile/.test(t))return "Plattform & Allgemein";
  if(/nft|tabelle|anzeige|ui|layout/.test(t))return "UI/UX";
  return "Plattform & Allgemein";
}

function setAdminIdeasFilter(key,value){
  if(!(key in adminIdeasFilterState))return;
  adminIdeasFilterState[key]=String(value??"");
  renderAdminIdeas();
}

function renderAdminIdeas() {
  const el = document.getElementById("adminIdeasList");
  if(!el)return;

  const configDiag = chainConfigStatus.source === "Supabase public.chains"
    ? `<div class="custom-token-card" style="margin-bottom:12px;border-color:var(--safe)">
        <strong>⚙️ Chain-Konfiguration: Supabase ✓</strong>
        <div class="meta">${chainConfigStatus.count} aktive Chains aus <code>public.chains</code> geladen · ${chainConfigStatus.loadedAt ? new Date(chainConfigStatus.loadedAt).toLocaleString("de-CH") : "–"}</div>
        <div class="meta">HTML-Fallback für Chain-Metadaten: <strong>entfernt</strong></div>
      </div>`
    : `<div class="custom-token-card" style="margin-bottom:12px;border-color:var(--danger)">
        <strong>⚙️ Chain-Konfiguration: ${escapeAttr(chainConfigStatus.source)}</strong>
      </div>`;

  const rows = ADMIN_IDEAS.map((idea,index)=>({...idea,_index:index,_category:adminIdeaCategory(idea),_priority:adminIdeaPriority(idea)}));
  const categories=[...new Set(rows.map(x=>x._category))].sort((a,b)=>{
    const ai=ADMIN_IDEA_CATEGORY_ORDER.indexOf(a),bi=ADMIN_IDEA_CATEGORY_ORDER.indexOf(b);
    return (ai<0?999:ai)-(bi<0?999:bi)||a.localeCompare(b,"de");
  });

  const statusValue=adminIdeasFilterState.status||"all";
  const categoryValue=adminIdeasFilterState.category||"all";
  const priorityValue=adminIdeasFilterState.priority||"all";
  const showDone=!!adminIdeasFilterState.showDone;
  const search=String(adminIdeasFilterState.search||"").trim().toLowerCase();

  const visible=rows.filter(idea=>{
    if(!showDone&&["done","reverted"].includes(idea.status))return false;
    if(categoryValue!=="all"&&idea._category!==categoryValue)return false;
    if(priorityValue!=="all"&&idea._priority!==priorityValue)return false;
    if(statusValue==="active"&&!["open","in_progress","clarifying","paused"].includes(idea.status))return false;
    if(statusValue!=="all"&&statusValue!=="active"&&idea.status!==statusValue)return false;
    if(search&&!`${idea.title} ${idea.desc} ${idea._category}`.toLowerCase().includes(search))return false;
    return true;
  });

  const statusOrder={in_progress:0,clarifying:1,open:2,paused:3,done:4,reverted:5};
  visible.sort((a,b)=>(ADMIN_IDEA_PRIORITY_META[a._priority]?.rank??99)-(ADMIN_IDEA_PRIORITY_META[b._priority]?.rank??99)||(statusOrder[a.status]??99)-(statusOrder[b.status]??99)||a.title.localeCompare(b.title,"de"));

  const countStatus=(status)=>rows.filter(x=>x.status===status).length;
  const activeCount=rows.filter(x=>["open","in_progress","clarifying","paused"].includes(x.status)).length;

  const controls=`
    <div class="custom-token-card" style="margin-bottom:14px">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;align-items:end">
        <label><span class="field-label">Kategorie</span>
          <select onchange="setAdminIdeasFilter('category',this.value)">
            <option value="all"${categoryValue==="all"?" selected":""}>Alle Kategorien</option>
            ${categories.map(c=>`<option value="${escapeAttr(c)}"${categoryValue===c?" selected":""}>${escapeAttr(c)}</option>`).join("")}
          </select>
        </label>
        <label><span class="field-label">Status</span>
          <select onchange="setAdminIdeasFilter('status',this.value)">
            <option value="all"${statusValue==="all"?" selected":""}>Alle offenen Status</option>
            <option value="active"${statusValue==="active"?" selected":""}>Aktiv / offen</option>
            ${Object.entries(ADMIN_IDEA_STATUS_META)
              .filter(([key])=>showDone||!["done","reverted"].includes(key))
              .map(([key,m])=>`<option value="${key}"${statusValue===key?" selected":""}>${escapeAttr(m.label)}</option>`).join("")}
          </select>
        </label>
        <label><span class="field-label">Wichtigkeit</span>
          <select onchange="setAdminIdeasFilter('priority',this.value)">
            <option value="all"${priorityValue==="all"?" selected":""}>Alle Wichtigkeiten</option>
            ${Object.entries(ADMIN_IDEA_PRIORITY_META).map(([key,m])=>`<option value="${key}"${priorityValue===key?" selected":""}>${escapeAttr(m.label)}</option>`).join("")}
          </select>
        </label>
        <label><span class="field-label">Suche</span>
          <input type="search" value="${escapeAttr(adminIdeasFilterState.search||"")}" placeholder="Titel, Beschreibung …"
            oninput="setAdminIdeasFilter('search',this.value)">
        </label>
      </div>
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:12px">
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer">
          <input type="checkbox" ${showDone?"checked":""} onchange="setAdminIdeasFilter('showDone',this.checked)">
          <span><strong>Erledigte anzeigen</strong> <span class="meta">(${countStatus("done")} umgesetzt${countStatus("reverted")?` · ${countStatus("reverted")} zurückgebaut`:""})</span></span>
        </label>
        <button class="secondary" onclick="adminIdeasFilterState={category:'all',status:'all',priority:'all',search:'',showDone:false};renderAdminIdeas()">Filter zurücksetzen</button>
      </div>
    </div>`;

  const summary=`
    <div class="summary" style="margin-bottom:14px">
      <div class="metric">Gesamt<b>${rows.length}</b></div>
      <div class="metric">Aktiv / offen<b>${activeCount}</b></div>
      <div class="metric">In Umsetzung<b>${countStatus("in_progress")}</b></div>
      <div class="metric">Umgesetzt<b>${countStatus("done")}</b></div>
      <div class="metric">Gefiltert<b>${visible.length}</b></div>
    </div>`;

  const groups=categories.map(category=>{
    const items=visible.filter(x=>x._category===category);
    if(!items.length)return "";
    return `
      <div style="margin:18px 0 8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <h3 style="margin:0">${escapeAttr(category)}</h3>
        <span class="badge">${items.length}</span>
      </div>
      ${items.map(idea=>{
        const sm=ADMIN_IDEA_STATUS_META[idea.status]||{label:idea.status||"–",color:"#9aa0ac"};
        const isDone=idea.status==="done";
        return `<div class="custom-token-card" style="margin-bottom:10px;border-left:4px solid ${sm.color}">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
            <div style="min-width:220px;flex:1">
              <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
                <strong>${escapeAttr(idea.title)}</strong>
                <span class="badge" style="background:${sm.color}22;color:${sm.color}">${escapeAttr(sm.label)}</span>
                ${(()=>{const pm=ADMIN_IDEA_PRIORITY_META[idea._priority]||ADMIN_IDEA_PRIORITY_META.low;return `<span class="badge" style="background:${pm.color}18;color:${pm.color}">Wichtigkeit: ${escapeAttr(pm.label)}</span>`;})()}
                <span class="badge" style="background:rgba(148,163,184,.12);color:var(--muted)">${escapeAttr(idea._category)}</span>
              </div>
              <div class="meta idea-desc" style="margin-top:7px;white-space:pre-line;line-height:1.45">${escapeAttr(idea.desc)}</div>
            </div>
          </div>
        </div>`;
      }).join("")}`;
  }).join("");

  el.innerHTML=configDiag+controls+summary+(groups||`<div class="empty">Keine Ideen/TODOs entsprechen den gewählten Filtern.</div>`);
}


window.renderAdminIdeas = renderAdminIdeas;
window.setAdminIdeasFilter = setAdminIdeasFilter;
window.adminIdeasFilterState = adminIdeasFilterState;

// Phase 4.76 / DAO1 Team: Partner-NFT/Bot-Anreicherung ist on-demand umgesetzt.
// TODO Ausbau: historischen (nicht mehr aktuellen) NFT-Bestand fremder Partner global
// und inkrementell cachen, sobald dafür ein verifizierter serverseitiger Public-Chain-Cache
// bereitsteht. Keine fremden Wallet-Adressen in user-private Klartexttabellen speichern.

// Phase 4.77 / DAO1 Bot-Lifecycle TODO:
// Target/Fortschritt der Mining-/Trading-Bots on-chain eindeutig dekodieren. Status "abgeschlossen" erst setzen,
// wenn Target und Zielerreichung aus Contract-State/Event beweisbar sind; keine Ableitung nur aus Ownership/Transfer.

// Phase 4.78 umgesetzt: sichtbare DAO1-Partnerkacheln laden Bot-Anzahlen ohne Details-Klick;
// Trading-/Mining-Typisierung für Partner an Own-Wallet-Logik + explizite Metadaten angeglichen;
// Kaufpreis-Ermittlung gruppiert ERC-20-Flows je Token und vermeidet willkürliche Auswahl;
// zentraler Datenjob sperrt Navigation und zeigt sofort Ladehinweis + Aktivitätsbalken.

// Phase 4.79 / DAO1 Bot-Lifecycle: zentrale NFT-Basis auch für DAO1-Übersicht.
// Umgesetzt: DID-Kaufpreis wird ignoriert; Bot-Übersicht mit Typ/ID/Name/Wallet/Kaufdatum/
// verifiziertem Kaufpreis/Claims je Asset/Status. Trading-Funding bleibt strikt getrennt.
// TODO Discovery: Funding-Call/Event + Bot-ID-Verknüpfung für Trading-Bots on-chain verifizieren;
// fehlende Einzelkaufpreise (u.a. bekannte Testfälle #10676/#90068/#90067/#90066/#90065/#89908)
// anhand Erwerbs-Tx/Receipt/Kaufcontract dekodieren, ohne Schätzung oder ID-Hardcoding.

// Phase 4.80 / DAO1 Bot-Erwerb: Erwerbsart aus ERC-721-Transferkette ableiten.
// Kauf (verifizierte Zahlung), Mint, NFT-Transfer und Transfer zwischen eigenen Wallets getrennt anzeigen.
// Quellwallet bei Transfers sichtbar machen; "Bonus" niemals allein aus Transfer ableiten.
// Offene Discovery: Trading-Funding je Bot-ID (inkl. Nachladungen/mehrere Währungen), Target/Progress/Abschlussstatus.

// Phase 4.81 / DAO1 Bot-Lifecycle: ältere Mint+Kauf-Pfade weiter dekodieren.
// Kein Kaufpreis aus NFT-Metadaten schätzen. Mint allein beweist weder Gratis/Bonus noch Kauf.
// Trading-Funding, Nachladungen, Target/Fortschritt und Abschlussstatus anschließend on-chain verifizieren.

// Phase 4.82: TLN/VOW und DAO1/APTM sind strikt getrennte Projekte. DAO1-Partnernamen verwenden ausschließlich dao1:did:<DID>; kein TLN-id:- oder Wallet-Fallback. wallet-private muss diesen Namespace serverseitig explizit akzeptieren.
// Phase 4.82 Analyse: DAO1 Bot-Lifecycle bleibt auf zentralem NFT-Bestand aufgebaut. Offene Discovery: ältere Mint+Kauf-Transaktionen (u.a. #90068/#90067/#90066/#90065/#89908) vollständig dekodieren; Trading-Funding/Nachladungen je Bot-ID und Währung; Target/Fortschritt/Abschlussstatus. Keine Schätzung.
