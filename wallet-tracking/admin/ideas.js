// Phase 5.62: DAO-Team: direkte Uplines TLN-artig, Ancestors aus Downline/Partnerzahl ausgeschlossen, Partner-Aliase + Bot-Zahlen in Karten; zentraler inkrementeller Partner-Bot-Refresh versorgt Team und Dashboard. Migration 068.
// Phase 5.59: Geräteübergreifende Wallet-/Team-Cache-Invalidierung, DAO-Upline im Browser-Cache und userbezogene UI-Einstellungen; Bonus/Geschenk-Kennzeichnung als offene Idee ergänzt.
// Phase 5.58: NFT-Kaufpreis-Resolver erweitert: neben ERC-20-Abgängen werden native APTM-Zahlungen aus tx.value und aus Internal Transactions derselben Erwerbs-Tx geprüft. Transfer/Mint ohne Kauf wird fachlich von ungeklärter Zahlung getrennt. Resolver-Version 2 erzwingt einmalige Neuanalyse alter negativer 5.57-Evidenz. DAO-Baum unverändert.\n// Phase 5.58: NFT-Kaufpreis-Discovery gehärtet: Entry-Tx bleibt bei jedem belegten Ersterwerb erhalten; alte Negativbefunde ohne konkrete Erwerbs-Tx werden erneut geprüft; nur vollständig geprüfte Tx darf als negativer Preisbefund gecacht werden. DAO-Baum bewusst unverändert.\n// Phase 5.56: Zentrale NFT-Registry wird beim App-Start aus Supabase geladen. Der NFT-Tab zeigt den on-chain belegten Kaufpreis als eigene Spalte; DAO1/APTMDAO-spezifische Zahlungsauflösung läuft über einen Projektadapter und schreibt persistente purchaseEvidence in den zentralen nft_cache. Bereits geprüfte historische Käufe werden nicht erneut analysiert; offene Fälle bleiben gezielt nachprüfbar. Der Baum bleibt in diesem Release bewusst unverändert.
// Phase 5.55: DID→Wallet-Auflösung im kombinierten DAO-Baum korrigiert: zentrale aktuelle Ownership/Root-Zuordnung hat Vorrang vor historischen/technischen Wallet-Adressen aus Tree-Events. Externe eigene Uplines werden projektspezifisch parallel dargestellt (DAO1 alt + APTMDAO neu); eigene Wallet-zu-eigene-Wallet-Kanten bleiben echte Baumkanten. Dadurch hängt #25924 weiterhin unter #21043, während für das Chris-Wallet gleichzeitig DAO1-Upline #18438 und APTMDAO-Upline #23 sichtbar sein können.
// Phase 5.54: Korrekturaudit 5.52: Root-DID-Parent-Kanten ergänzt, damit eigene Wallets nicht als falsche zweite Roots erscheinen. Bot-Kandidaten werden feldweise zusammengeführt: aktueller Owner aus Live/Ownership, historischer Erwerb/Kaufpreis aus Erwerbsevidenz. NFT-Copy-Icon transparent vereinheitlicht; frühester on-chain Besitzzeitpunkt wird nicht mehr wegen fehlendem Kaufnachweis unterdrückt.
// Phase 5.52: DAO-Team-Audit: eigene Wallets folgen jetzt ebenfalls ihren belegten DID-Uplines und werden zu einem gemeinsamen wallet-zentrierten Baum verbunden; eigene Wallets bleiben sichtbar, zählen aber nicht als Partner. Knoten zeigen DAO1/APTMDAO-DIDs kompakt getrennt. Wallet-Details trennen aktuellen Bot-Bestand von früher hier gekauften/übertragenen Bots; historischer Ersterwerb hat Vorrang, damit Kauf-Wallet/Kaufpreis bei internen Transfers erhalten bleiben. NFT-Wallet-Copy-Icon vereinheitlicht.
// Phase 5.51: Dashboard-Startnavigation vollständig synchronisiert (aktive Hauptnavigation + keine fremde Kontext-Tab-Leiste). NFT-Bestand zeigt Kauf/Mint-Wallet und aktuelles Wallet gekürzt mit Copy-Icon; ursprüngliches Wallet wird aus Ownership-/Transferhistorie ermittelt und bleibt bei späteren Walletwechseln erhalten.
// Phase 5.50: DAO-Team Root-/Startfix nach 5.49: eigene DAO1/APTMDAO-DIDs werden aus persistierter Ownership plus NFT-Cache über ALLE User-Wallets erkannt, unabhängig von aktuellen DAO-Assets/Dust. Dashboard lädt Ownership vor den Tree-Subcaches; damit kein 0-Partner-Zustand nur wegen Initialisierungsreihenfolge. Wallet-zentrierte Fachlogik aus 5.49 unverändert.
// Phase 5.49: DAO-Team auf wallet-zentrierte Standardansicht umgestellt: 1 Wallet = 1 Partner, mehrere DAO1/APTMDAO-DIDs pro Wallet werden in einem Knoten zusammengeführt; APTMDAO hat nur bei tatsächlich eigener APTMDAO-Downline Vorrang. Neue MinerBot-Käufe lesen die verwendete APTMDAO-DID direkt aus dem Kaufaufruf (Referenz #31722: DID #7315 → Upline #23). Eigene Wallets aus Letzte Partneraktivitäten ausgeschlossen; alte/new Tree-Tabs bleiben als Diagnose.
// Phase 5.48: DAO1-alt Abschlussfix: Eigene historisch verifizierte Bots dürfen für die DID-Zuordnung den persistierten ersten Besitzabschnitt als Erwerbsnachweis verwenden; ein erneut erkannter Kaufpreis ist dafür nicht zwingend. Fremde/live Bots brauchen weiterhin echten Kaufnachweis. Historische DID-Besitzlage am Bot-Erwerbsblock bleibt maßgeblich; APTMDAO-Logik unverändert.
// Phase 5.47: DAO1/APTMDAO Bot↔DID Abschlussfix. Eigene Bots werden DID-zentriert aus der vollständigen gespeicherten Ownership-Historie berücksichtigt, auch wenn Bot/DID später unabhängig auf andere Wallets verschoben wurden. Entscheidend bleibt die DID-Besitzlage auf der damaligen Erwerbs-Wallet am Bot-Erwerbsblock. Identitäts-NFTs/Membership werden nicht mehr in der Bot-Tabelle dupliziert.
// Phase 5.46: DAO1/APTMDAO Bot-Zuordnung final auf historischen Besitz zum Bot-Erwerbsblock umgestellt. Bot und DID werden unabhängig behandelt: maßgeblich ist, welche DID(s) derselben Wallet exakt beim Bot-Erwerb on-chain gehalten wurden. APTMDAO hat Vorrang, wenn genau eine APTMDAO-DID zu diesem Zeitpunkt gehalten wurde; sonst genau eine alte DAO1-DID; mehrere/keine DIDs bleiben unzugeordnet. Breiter Wallet-NFT-Scan entfernt; Bot-Kandidaten kommen nur aus bekannten Bot-Contracts und contract-gefilterter Transferhistorie. Persistente alte Fehlzuordnungen je Bot werden vor dem Speichern ersetzt.
// Phase 5.45: DAO1/APTMDAO Bot-Zuordnung korrigiert: problematische unique_tree_wallet-Fallback-Regel entfernt. APTMDAO ist opt-in und verlangt positiven Nachweis aus derselben Erwerbs-Tx oder dem APTMDAO-Manager; der gemeinsame MineBot-Contract allein ist kein Systembeweis. Altes DAO1 nutzt wieder die bewährte Legacy-Erwerbs-/Kaufpreislogik, solange kein positiver APTMDAO-Nachweis vorliegt. Persistente Altzeilen mit evidence_type=unique_tree_wallet werden für Dashboard-Partneraktivitäten ignoriert. Regressionstestfälle: Bot #31722 → APTMDAO #7315; #10295 und #37174 → DAO1 #21043.
// Phase 5.44: Hotfix nach 5.43: Beim DAO1/APTMDAO-Request-Umbau fehlten setDAO1TeamTreeMode, renderDAO1TeamTab und teamDiscoveryTableHtml, obwohl setTeamTreeMode weiter exportiert wurde. Die drei Tree-Funktionen sind wiederhergestellt; der cache-only Tree-Render und die begrenzte Detail-Live-Discovery aus 5.43 bleiben erhalten.
// Phase 5.43: DAO1/APTMDAO Partnerdetails: Explorer-Request-Fächer entfernt (Tx-Transfer- und Wallet-NFT-In-Flight/Result-Cache, Details max. 2 Erwerbsprüfungen parallel). Tree-Render ist strikt cache-only; Live-NFT-Prüfung nur beim Öffnen der Details. Identitäts-Contracts überschreiben alte Klassifizierungen, damit DIDs nie als Bots/Membership-Zeilen erscheinen. Eigene Roots laden beim Detailöffnen den aktuellen NFT-Bestand, damit neu gekaufte Bots ohne separaten NFT-Tab-Refresh erkannt werden. Bot ohne Tx-Systemevidenz darf nur bei genau einer DID derselben Wallet im aktiven Tree über "unique_tree_wallet" zugeordnet werden.
// Phase 5.42: Kursliste iconfrei beim Token, Chain über Native-Symbol; Token-Stammdaten/Symbol vor Contract-Fallback, Adressen kurz. DAO1/APTMDAO DID-Details strikt DID-zentriert: fremde DIDs nie als Bots; nur verifizierte Bots/Membership. DAO1 LP im Wallet bleibt frei, nur tatsächlich gestaktes LP gebunden. Fehlende TLN/VOW-Historienwerte werden als noch nicht persistiert kenntlich und über bestehende Step-6/Detailbewertung gezielt nachermittelt.
// Phase 5.41: Dashboard-Projektwerte in frei/gebunden/gesamt aufgesplittet; TLN/VOW-LP-Doppelzählung zwischen walletData und lp_position_cache verhindert; aktuelle Preise mit Asset-refreshedAt; DAO1/APTMDAO Partner-Bots tree-spezifisch über eindeutige Erwerbs-Tx-Evidenz getrennt; evidenzbasierter Partner-Bot-Lifecycle persistent (Migration 065) und als Cache-Quelle für letzte Partneraktivitäten. Unklare Bot-Zuordnungen werden keinem Tree geraten.
// Phase 5.40: Dashboard-Audit fortgesetzt: Preisrefresh stale-while-refresh (alter gültiger Snapshot bleibt sichtbar), Kursliste zweispaltig/kompakt, Reward-Assets periodenübergreifend zeilengleich, TLN Partner-Staking-TODO mit Ladezustand, gebundener Wert mit Projektaufschlüsselung, letzte bestätigte Partneraktivitäten aus Projektcaches. DAO1-Bot-Kauf-Aktivitäten bleiben bis zu einem belastbaren persistenten Partner-NFT-Eventcache offen.
// WalletTracking · Ideen / Umbau
// Phase 5.39: Dashboard-Daten-Audit fortgesetzt: Hauptsummary in Vermögen/Rewards/Referral Rewards gruppiert; persistenter lp_position_cache wird beim Start cache-only für gebundene DAO1/TLN-LP-Werte gelesen; TLN-Team-Restore liefert verifizierte abgelaufene, noch gestakte Partnerpositionen an 'Was muss ich tun?'; Datenstand-Texte benutzerverständlich statt 'nicht instrumentiert'. Systemübersicht/Datenquellen/Ladezeitpunkte geprüft.
// Zentrale Arbeits- und Übergabeliste.
// Künftig sollen Inhalts-/Status-/Prioritätsänderungen nach Möglichkeit nur in dieser Datei erfolgen.
// Die Hauptseite lädt diese Datei bei jedem Seitenaufruf mit Cache-Buster neu.

const ADMIN_IDEAS_MODULE_BUILD = "20260919-152652";
const ADMIN_IDEAS_MODULE_TIMESTAMP = "19.09.2026 18:26:27 CEST";
// Phase 5.33: Dashboard-Summary validiert und Start weiter entkoppelt. Apertum-native-Fehler behoben: interner Asset-Key "native" wird nie mehr als EVM-Adresse ABI-encodiert. TLN/BSC lp_position_cache wird beim Dashboard-Start walletübergreifend in einem Batch gelesen statt mit Einzelrequest pro Wallet. TLN "davon aktiv" zeigt bei unvollständig verifizierten Lifecycles keine scheinbar endgültige Zahl mehr, sondern bestätigte Aktive plus offene Partner; erst bei vollständiger Lifecycle-Abdeckung wird die Endzahl gesetzt. DAO1 Dashboard-Rewards werden gezielt aus vorhandenen project_transactions + project_transaction_asset_flows gelesen, ohne ensureLoaded()/vollständige DAO1-Tab-Initialisierung. Phase 5.35 ersetzt die frühere USD-Summary: Gesamt/Vorjahr/Jahr/Monat zeigen Originaltoken/-mengen; historische USD-Bewertungen sind dafür nicht erforderlich. DAO1 "aktiv" bleibt bewusst offen: aktueller Code enthält keinen belastbaren Bot-Target-/Completed-Contract-Proof. Reward-Zeilen der Projektkarten wieder als konsistente Kacheln gestaltet. Systemübersicht, Admin-Doku und Hilfe synchronisiert. Build 20260919-140811.
// Phase 5.30: TLN/VOW-Contracts werden aus der allgemeinen CoinGecko-/GeckoTerminal-Preisermittlung ausgeschlossen und ausschließlich über die bestehende zentrale Projekt-PriceEngine bewertet (BSC PancakeSwap / ETH Uniswap). Dashboard zeigt Contract-Adressen einheitlich nur verkürzt mit Copy-Funktion; vollständige Adressen werden nicht zusätzlich als Symbolzeile ausgegeben. Preisrouten/-berechnungen selbst unverändert.
// Phase 5.29: Dashboard-Gerüst wird unmittelbar nach Login sichtbar, bevor Chain-/DB-Konfiguration fertig geladen ist. TLN/VOW-Dashboardpreise zeigen tatsächliche DEX-Quelle (BSC PancakeSwap / ETH Uniswap) plus vorhandene Preisroute. DAO1 hat neu „Kurse und Pools“ als reine Sicht auf die bereits bestehende Apertum-Preislogik; keine neue Preisermittlung.
// Phase 5.27: Summary (Verlauf, Portfolio-Allokation und Bestands-Summary) aus „Übersicht & Analyse“ ins Dashboard verschoben. Globaler Wallet-Ansicht-Filter aktualisiert auch die Summary-Wallet-Auswahlen. Dashboard-Kursnamen lösen vordefinierte und eigene sichere Token robust über gepflegte Namen/Labels statt Contract-Adresse auf. Chart-Legende verwendet die aktuelle Theme-Textfarbe für lesbare Darstellung in Hell/Dunkel. Dashboard bleibt Startseite und cache-first. Systemübersicht/Hilfe geprüft.
// Phase 5.26: Dashboard-Finish: Native Coins werden bei Admin-Start als echte predefined_tokens-Stammdaten sichergestellt und sind damit für Dashboard-Flag sowie Anzeige-/Summary-Kommastellen editierbar. Kursliste zeigt den gepflegten Token-Namen statt einer Fallback-Adresse. Projekte und Administration sind getrennte Dashboard-Bereiche; Projektkarten besitzen Team-Partner gesamt/aktiv sowie Rewards Gesamt/Vorjahr/Jahr/Monat. Alle Projektwerte bleiben strikt cache-first; fehlende Werte starten keine Discovery/Chain-Abfrage. Sidebar-W entfernt und Einklapp-Pfeil kollisionsfrei positioniert. Systemübersicht/Hilfe geprüft.
// Phase 5.25: Dashboard als Cache-first-Startseite, Wallet-Besitzer/Personenfilter und Dashboard-Tokenflag ergänzt. TLN/VOW-Discovery sowie manuelle Snapshots, Discovery-, Gebühren- und NFT-Caches werden nicht mehr beim Login, sondern erst beim Öffnen des jeweiligen Bereichs initialisiert. Fach-/Discovery-Algorithmen unverändert; nur Auslösezeitpunkte verschoben. Systemübersicht und Hilfe synchronisiert.
// Phase 5.24: Team-Lifecycle-Restore fuer eigene Wallets korrigiert. Root Cause fuer fehlende eigene Stakings: Discovery-Result-Caches eigener Wallets liegen datenschutzkonform user_id/wallet_id-basiert in der privaten Staking-Cache-Tabelle, der Team-Restore las bisher aber nur den globalen scope_address-Cache. Eigene Projekt-Wallets werden jetzt ueber denselben technicalCacheScope wie die Projektansicht geladen; externe Partner bleiben im globalen Batch-Read. Zusaetzlich wird ein positiver historischer Lifecycle bei vorgemerkter Unstake-Nachpruefung nicht mehr optisch verworfen, sondern mit belegten Lots als unvollstaendig sichtbar gehalten. Alias-Abdeckung wird nach komplettem Identity-/Registry-Restore als matched/visible/stored/missing geloggt; fehlende Namen werden nicht erfunden. Staking-Discovery und Duration-Proof-Logik unveraendert. Systemuebersicht geprueft: Supabase-Datenquelle bleibt gleich, private/global Cache-Aufteilung des Restore-Pfads dokumentiert.
// Phase 5.23: Duration-Regression korrigiert. Fuer Legacy-v$/VOW 0x4857…d590 war die in 5.20-5.22 eingefuehrte Annahme eines individuellen Stored-End-Timestamps falsch und blockierte bereits verifizierte positive Strict-Caches sowie den Shared-Contract-Proof. Reihenfolge wieder korrekt: positiver positionsbezogener Strict-Cache → Shared Strict-Proof mit Fingerprint-/State-Validierung → exakt verifizierter historischer On-Chain Contract-Proof (367 Tage; !Minimum Staking Period unmittelbar vor der Grenze, Erfolg bei exakt 367 Tagen) mit erneutem Fingerprint-/Wallet-State-Abgleich → weitere bestehende Proof-Pfade → erst zuletzt Negativcache. Top-up-Anker bleibt letzter on-chain bestaetigter Top-up. Staking-Discovery unveraendert. Alias-Log bestaetigt 5 entschluesselte Referenzen und 5 sichtbare Matches; deshalb kein weiterer spekulativer Alias-Umbau. Systemuebersicht geprueft: Datenquelle/Ladezeitpunkt/Struktur unveraendert.
// Phase 5.22 (durch 5.23 bei Legacy-v$/VOW fachlich korrigiert): Bereinigungsrelease: Legacy-v$/VOW liest weiterhin zuerst den individuellen Stored-End-Timestamp positionsbezogen; bei temporaer fehlendem Live-Read ist nur ein zuvor aus genau diesem Stored-End-Strict-Proof erzeugter positionsbezogener Cache als Fallback erlaubt. Legacy-TLN-Alias-Referenzen werden vor team_alias_replace_all auf die von wallet-private erlaubten id:/wallet:-Formate kanonisiert; unbekannte Legacy-Keys bleiben lokal. Staking-Discovery unverändert. Systemübersicht geprüft: Datenquelle/Ladezeitpunkt/Struktur unverändert.
// Phase 5.21: Legacy-v$/VOW-Duration wieder vollständig positionsbezogen: 0x4857…d590 liest Start + individuellen End-/Unlock-Timestamp direkt über die bewährte Wallet-Mapping-Struct-Erkennung am konkreten Stake-Block, unabhängig von Shared-/Duration-/Negativcache; keine feste Tageszahl. Alias-Loader auf tatsächliche wallet-private-Antwort {ok,action,aliases} und kanonische id:/wallet:-Referenzen abgestimmt. Staking-Discovery unverändert. Systemübersicht geprüft.
// Phase 5.20: Legacy-v$/VOW-Duration-Priorität korrigiert: alter positionsbezogener Cache und Shared-Dauer dürfen den Stored-End-Read nicht mehr überholen; keine fest hinterlegte 367-Tage-Ersatzregel für 0x4857…d590. Bekannter Positions-Struct-Proof wird genutzt, um Start- und individuellen End-/Unlock-Timestamp direkt positionsbezogen aus dem Contract-Storage am Stake-Block zu lesen. 24-h-Negativcache greift erst danach. Staking-Discovery unverändert. Systemübersicht geprüft.
// Phase 5.17: Alias-Restore bindet historische verschluesselte Referenzen nach Identity-/Registry-Restore an sichtbare TLN-ID-Keys. Sichtbare Partner neuer SmartNode-Registries ohne kompatiblen Lifecycle erhalten nach Cache-first Render genau einen bestehenden Team-Lifecycle-Discovery-Pass; Staking-Erkennungslogik unveraendert. BUILD_ID/APP_VERSION mit Release synchronisiert. Systemuebersicht geprueft.
// Phase 5.16: Gerätewechsel-Restore korrigiert: CURRENT_WALLET lädt seinen vorhandenen persistenten Discovery-Snapshot nun ebenfalls, wenn kein Live-Discovery-Lauf im Speicher existiert. Nach Restore werden nur offene Lifecycles mit vollständig serverseitig vorhandener Contract-History einmalig cache-backed nachverifiziert; kein Wallet-History-/Receipt-/forceFresh-Fallback. Batch max. 3. Staking-Discovery unverändert. Systemübersicht geprüft.
// Phase 5.15: Gründliche Regression-Korrektur: verifizierter New-Registry-Referenzfall TLN-ID 990000017795 wird beim cache-only Restore mit nodeIdOf+nodeUserOf on-chain gegengeprüft und ohne History-/Staking-Scan an die bereits verifizierte Parent-TLN-ID 12415 angebunden; Alias-Referenzen werden kanonisch nach TLN-ID/Wallet gemappt und Mapping-Abdeckung ohne Klartextnamen diagnostiziert. Offene v$/VOW-Lifecycles werden nicht fälschlich als verifiziert markiert: Diagnose belegt vollständige Staking-Erkennung, aber noch fehlenden belastbaren Duration-Proof. Staking-Discovery unverändert. Systemübersicht geprüft.
// Phase 5.14: Normaler Team-Restore ist strikt cache-only und startet auf neuen Geraeten keine automatische Lifecycle-/Wallet-History-/Receipt-Nachverifikation mehr; offene Lifecycles bleiben sichtbar und werden nur ueber Step 7 aktualisiert. Dadurch kein browserlokaler Cache als Voraussetzung und kein Request-Sturm beim Geraetewechsel. Staking-Discovery unveraendert. Systemuebersicht geprueft.
// Phase 5.13: Zusatzregistry-Graph wird cache-first separat restauriert und bei leerem Registry-Cache einmalig aus verifizierten join(address)+nodeIdOf/nodeUserOf-Fakten aufgebaut; Alias-Referenzen werden prefix-unabhaengig ueber TLN-ID/Wallet aufgeloest; positive verifizierte v7-Lifecycles werden wiederverwendet, v7-Nullfunde bleiben ungueltig. Staking-Discovery unveraendert. Systemuebersicht geprueft.
// Phase 5.12: index.html Cache-Buster fuer discovery.js und ideas.js auf aktuellen Build angehoben, damit Browser/CDN die tatsaechlich geaenderte Team-Logik laden. Staking-Discovery unveraendert.
// Phase 5.11: Cache-Restore laedt verifizierte Identities neuer SmartNode-Registries separat, rekonstruiert deren join(address)-Parent-Kanten vor dem Forest-Build (Fix fuer fehlenden Partner Ernie / TLN-ID 990000017795). Alias-Loader akzeptiert kompatible wallet-private Response-Shapes, damit bestehende verschluesselte Namen wieder erscheinen. Staking-Discovery unveraendert. Systemuebersicht geprueft.
// Phase 5.09: TLN-Team Cache-Restore rekonstruiert Parent-Kanten neuer SmartNode-Registries aus persistierter join(address)-Evidenz; Partial-Lifecycle darf verifizierten Cache nicht mehr degradieren; Alias-Leerantwort erhält einen einmaligen sicheren Re-Read. Staking-Discovery fachlich unverändert. Systemübersicht geprüft: Team-Datenquelle ergänzt um Registry-Identity + join-Tx beim Restore.
// Phase 5.07: TLN-Team-Anzeige repariert: userbezogene Partnernamen werden rueckwaertskompatibel aus id:/wallet: sowie historischen nackten Referenzen gelesen; Details ist auch fuer eigene Wallets verfuegbar; erkannte, aber wegen offener Duration noch nicht voll verifizierte Partner-Stakings werden persistent gespeichert und beim Reload wieder gemergt. Systemübersicht geprüft: Datenquelle/Ladezeitpunkt unverändert.
// Phase 5.06: Nullfund-Verifikation im TLN-Team abgesichert: Ein Wallet darf nur noch als „kein Staking gefunden / verifiziert“ gelten, wenn mindestens ein relevanter Contract tatsächlich geprüft wurde und die komplette Contract-Coverage fehlerfrei ist. Alte team-lifecycle-v7-Ergebnisse werden durch Cache-Version v8 nicht mehr als verifiziert übernommen und bei Bedarf neu geprüft. Systemübersicht geprüft: Datenquelle/Ladezeitpunkt unverändert.
// Phase 5.05: Das Lifecycle-3er-Limit ist jetzt technisch nur noch Batch-Groesse: ein gestarteter Worker arbeitet den gesamten freigegebenen Partner-Backlog in fortlaufenden 3er-Batches ab; Fehler eines einzelnen Wallets stoppen die restliche Queue nicht. Sichtbarer Fortschritt zaehlt ueber alle Partner. Systemübersicht geprüft: Datenquelle/Ladezeitpunkt unverändert.
// Phase 5.04: TLN-Team Egress-First korrigiert: der Team-Slice-RPC erhält den definierten SmartNode-Contract statt an einer undefinierten Variable zu scheitern. Damit funktioniert der Supabase-Slice-Erstaufbau wieder ohne Globalgraph-Download. Performance/Egress-Messung bleibt nächster eigener TODO-Block.

const ADMIN_IDEAS = [
  { status: "open", category: "DAO1", priority: "medium", title: "NFT/Bot manuell als Bonus/Geschenk kennzeichnen", desc: "Erworbene DAO1/APTM-NFTs bzw. Bots optional userbezogen als Bonus/Geschenk markieren. Die On-Chain-Erwerbsdaten bleiben unverändert; die manuelle Klassifizierung erklärt einen Kaufpreis von 0 bzw. einen bewusst fehlenden Kaufpreis. Kein NFT darf allein wegen fehlender Zahlungs-Evidenz automatisch als Bonus eingestuft werden. Optional später Filter/Statistik Gekauft / Bonus-Geschenk / Ungeklärt." },
  {title:"Phase 5.35 · Dashboard Rewards/DAO-Partner",desc:"UMGESETZT: Reward- und Referral-Reward-Summaries zeigen Originalmenge je Chain+Asset/Contract statt USD. DAO-Partner: DAO1 und APTMDAO getrennt; projektweite Hauptzahl dedupliziert nach DID, sobald beide fachlich verifizierten DID-Sets vorliegen. Solange APTMDAO-Parent-Kanten noch nicht bewiesen sind, zeigt das Dashboard transparent nur den DAO1-Mindeststand statt APTMDAO=0 zu erfinden. Fehlende aktuelle Kurse nennen die betroffenen Assets."},
  {title:"Phase 5.36 · Dashboard-Präzision, TLN-Rewards & APTMDAO-Tree",desc:"UMGESETZT: Summary-Kommastellen sind eindeutig: leer = Anzeige übernehmen, 0 = null Nachkommastellen. Dashboard-Token erscheinen nur bei Bestand > 0. TLN/VOW normale Rewards und Referral Rewards werden aus den persistenten Discovery-Snapshots periodisiert in Originaltoken ins Dashboard gespiegelt. Reward-KPIs sind kompakter. Neuer APTMDAO-Tree ist über den verifizierten NFT-Mint-Event child/parent/wallet on-chain dekodiert, besitzt eigenen globalen Supabase-/IndexedDB-Cache (Migration 063), 24-Block-Overlap und dieselbe hierarchische UI wie DAO1. DAO-interne Partnernamen sind walletbezogen, bestehende DID-Aliase bleiben lesbar."},
  {
    status: "in_progress",
    category: "Admin / Diagnose",
    priority: "high",
    title: "Systemübersicht · Funktionsbaum und Ladezeitpunkte",
    desc: `STATUS: In Arbeit. Admin-Übersicht mit Menü → Tab → Untertab als Baum. Pro Bereich werden normaler App-Start, erster Start des Tages, Öffnen des Tabs und manuelle Aktualisierung sichtbar. Klick auf eine Zeile zeigt die einzelnen Datenbestände sowie Browser-Cache, Supabase und On-chain/API-Quelle. Detailansicht öffnet als Popup, damit der Baum beim Prüfen an seiner Position bleibt. DeFi-Projekte besitzt einen neutralen Übersicht-Tab, der beim Öffnen keine projektspezifischen Daten lädt. VERBINDLICHE REGEL: Dieser Baum muss bei jeder Programmänderung, Erweiterung oder Korrektur mitgeprüft und im selben Release aktualisiert werden, wenn Struktur, Status, Datenquelle oder Ladezeitpunkt betroffen ist. Phase 4.95: Baumknoten einzeln sowie global auf-/zuklappbar; neue Spalte „Aktueller Datenstand“ nutzt dieselben zentralen Metadaten wie die sichtbaren Datenstatus-Zeilen in den Tabs. Linke Hauptnavigation ist ein-/ausklappbar; Phase 4.95 zeigt im eingeklappten Zustand die echten Menü-Icons und zentriert/verkleinert den Pfeil. Strukturknoten im Systembaum zeigen keine Datenstands-/Ladespalten mehr; diese Informationen stehen nur auf echten Blatt-/Tab-Zeilen. Phase 5.24: private/globale TLN-Team-Cachepfade dokumentiert. Phase 5.25: Dashboard als Startseite ergänzt und Ladezeitpunkte neu aufgenommen. TLN/VOW-Discovery sowie manuelle Snapshots, allgemeiner Discovery-Cache, Gebühren-Summary und NFT-Cache starten erst beim Öffnen ihres Bereichs; die fachliche Discovery-Logik bleibt unverändert. Nächster Ausbau: tatsächliche Laufdiagnose/Requests/Rows/Bytes mitschreiben und Soll gegen letzten Ist-Lauf vergleichen.`
  },
  {
    status: "in_progress",
    category: "Performance / Skalierung",
    priority: "high",
    title: "PRIORITÄT NÄCHSTER SCHRITT · Browser-Cache + DATA_VERSIONS + Delta-Synchronisation",
    desc: `STATUS: In Arbeit – zentrale Browser-Cache-/DATA_VERSIONS-Infrastruktur wird schrittweise umgesetzt. DAO1 alter Tree ist der Referenzcache; Phase 4.91: DAO1 alter Tree als Referenzpfad weiter validiert. Echtes DATA_VERSIONS-Gate eingebaut. Bei identischer lokaler/zentraler Version endet normales Team-Öffnen nach IndexedDB + Registry ohne State-Read, Schema-Probe, Delta-DB oder RPC. Manueller Discovery-Button erzwingt weiterhin den Chain-Freshness-Check. Migration 057 macht den DB-Trigger zum autoritativen Registry-Writer. Praxistest normaler Tab-Pfad bestanden: IDB + DATA_VERSIONS HIT, DB 0, Delta 0, RPC 0. Manueller inkrementeller On-chain-Update-Pfad wurde ebenfalls praktisch bestätigt (Blockbereich/Logs/Kanten sichtbar). DAO1 alter Tree ist damit als Referenzpfad abgeschlossen. Phase 4.95: TLN SmartNode Globalgraph als nächster grosser Bereich migriert: Browser-IndexedDB tln-vow/smartnode-global-graph + kleines DATA_VERSIONS-Gate. Bei HIT werden die Graph-Kanten lokal gelesen und es werden 0 Graph-Kanten aus Supabase geladen; bei Erstaufbau/Fallback wird die schemaoffene DB-Zeile vollständig (select(*)) lokal gespeichert. Migration 058 macht den TLN Graph-State zum autoritativen DATA_VERSIONS-Writer. Manueller inkrementeller On-chain-Scan bleibt unverändert fachlich maßgeblich und zieht IndexedDB nach. Praxistest nach Migration 058 noch offen. Phase 4.95 EGRESS-FIRST: Normaler TLN-Team-Restore lädt nicht mehr den vollständigen SmartNode-Globalgraph und nicht mehr den vollständigen globalen Wallet→TLN-ID-Cache. Migration 059 stellt eine schemaoffene rekursive Team-Slice-RPC bereit (Downline max. 20 je eigenem Leader + notwendige Upline). Eigene IDs werden zuerst gezielt geladen, danach nur IDs der tatsächlich relevanten Slice-Wallets. Browser-Key smartnode-team-slice-v2; bei identischer globaler DATA_VERSION kommen 0 Graph-Nutzdaten aus Supabase. Vollgraph bleibt ausschließlich Discovery/Step 7 bzw. expliziten Updatepfaden vorbehalten. Phase 4.96: Cache-Restore korrigiert: Globalgraph und Team-Slice besitzen wieder getrennte IndexedDB-Keys. Ein vorhandener Phase-4.94-Globalgraph wird lokal ohne Supabase-Nutzdaten in den relevanten Team-Slice migriert; bei fehlgeschlagener Versions-/DB-Prüfung wird ein vorhandener Slice als sichtbarer Fallback verwendet statt den Baum leer zu lassen. Phase 4.95 ergänzt für TLN-Team den Lifecycle-Nachlauf: verifizierte Lifecycles (einschließlich belastbarer Nullfunde) bleiben persistent; nach cache-first Render werden höchstens 3 offene Wallets pro Tab-Sitzung im Idle-Hintergrund nachverifiziert. Versuch/Status/Retry-Zeitpunkt werden im technischen Supabase-Cache als eigene team-lifecycle-queue persistiert; unverifizierte/Fehler-Fälle werden frühestens nach 24h erneut versucht. Step 7 bleibt der vollständige Discovery-/Nachverifikationslauf. Phase 4.97: Das 3er-Limit gilt nun pro Idle-Batch statt pro gesamter Tab-Sitzung. Noch nie geprüfte offene Partner werden in weiteren kleinen Batches bis zum abgearbeiteten Backlog nachgezogen und persistent gespeichert; bereits verifizierte Partner werden nicht erneut gescannt, Fehlerfälle behalten das 24h-Retryfenster. Damit bleiben Partner wie TLN-ID 11674 nicht dauerhaft unverifiziert, nur weil sie hinter dem ersten Batch lagen. Zusätzlich wurde der veraltete TLN_TEAM_GRAPH_TABLE-Verweis der historischen Wallet-Auswahl auf TEAM_GRAPH_CACHE_TABLE korrigiert. Phase 4.98: Die Lifecycle-Queue sperrt weiterhin unverifizierte Partner nach einem normalen retry_wait nicht mehr 24h. Das 24h-Fenster gilt nur noch fuer echte error_retry-Faelle; ein haengengebliebener running-Status wird nach 15 Minuten wieder freigegeben. DEV-Log nennt bei Freigabe/Sperre die betroffenen TLN-IDs, damit offene Partner wie 11674 direkt nachvollziehbar sind. Phase 5.01: Lifecycle-Background-Verifikation arbeitet ein begonnenes Wallet nun in bis zu vier Konvergenz-Prüfschritten weiter, solange sich der belastbare Lifecycle-Stand noch verändert. Sobald kein weiterer Fortschritt mehr entsteht, wird der aktuelle Lauf als fachlich offen/stabil beendet statt bei jedem Reload nur einen einzelnen Schritt weiterzugehen. Der TLN-Team-Status zeigt die laufende Hintergrund-Aktualisierung samt Wallet-/Prüfschritt-Fortschritt sichtbar an; vorhandene Cache-Daten bleiben währenddessen benutzbar. Phase 5.04: Egress-First-Team-Slice repariert: 'teamLoadRelevantGraphSlice()' definiert den SmartNode-Contract jetzt lokal und übergibt ihn korrekt an 'wt_tln_smartnode_graph_slice'. Zuvor konnte ein Cache-Miss vor dem RPC-Aufruf mit 'contract is not defined' in den Fallback laufen. Der Erstaufbau lädt damit wieder nur den relevanten Team-Slice statt den Globalgraph. Systemübersicht geprüft: Datenquelle/Ladezeitpunkt bleiben unverändert, daher dort keine Strukturänderung nötig. Phase 5.05: Der Background-Worker beendet sich nicht mehr nach dem ersten 3er-Batch bzw. verlaesst sich fuer die Fortsetzung nicht mehr auf einen neuen Idle-Callback. Der komplette freigegebene Backlog wird in derselben Worker-Kette abgearbeitet; 3 bleibt nur die Batch-Groesse. Einzelne technische Wallet-Fehler werden isoliert als error_retry gespeichert und die restliche Queue laeuft weiter. Fortschritt/Abschluss nennen die Gesamtzahl der geprueften Partner. Phase 5.06: Die fachliche Abschlussbedingung für verifizierte Nullfunde wurde verschärft: Contract-Coverage muss mindestens einen tatsächlich geprüften relevanten Contract enthalten und vollständig fehlerfrei sein. Der Team-Lifecycle-Cache wurde auf v8 erhöht, damit ältere Nullfunde aus v7 nicht ungeprüft weiter als verifiziert erscheinen.

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
    status: "in_progress",
    category: "Übersicht / Analyse",
    priority: "high",
    title: "Persönliches Gesamt-Dashboard",
    desc: `Gesamtvermögen über alle eigenen Wallets und Projekte mit Aufteilung nach Token, Stakings, Loans, NFTs, Rewards und frei verfügbarem Guthaben. Entwicklung über 24 Stunden, 7 Tage, 30 Tage, Jahr und seit Einstieg; Kennzahlen investiert, zurückerhalten, aktueller Wert sowie realisierter/unrealisierter Gewinn oder Verlust. PROJEKTREGEL: TLN/VOW und DAO1/APTM bleiben strikt getrennt; projektübergreifend werden ausschließlich aggregierte Werte gezeigt, Details öffnen immer den jeweiligen Projektbereich.

PHASE 5.25 · ERSTE AUSBAUSTUFE:
• Dashboard ist Startseite nach dem Login.
• Kennzahlen werden aus bereits geladenem Bestands-/Preiscache gebildet; fehlende Werte bleiben sichtbar „–“ und starten keine Discovery.
• Kursliste verwendet das zentrale Token-Flag predefined_tokens.dashboard_visible.
• Projekt-Kacheln erscheinen nur, wenn im gewählten Wallet-/Personenbereich ein klassifizierter Projektbestand vorhanden ist.
• Start lädt nur den vorhandenen Preis-Snapshot; fehlender/veralteter Preis-Cache löst keine API-/RPC-/TLN-Infrastruktur-Abfrage aus.
• Aktuelles Staking wird in V1 nur berücksichtigt, wenn ein vorhandener Positionscache bereits im Bestand steckt. Monats-Rewards/Referral-Rewards, Partner-Staking-Aktionen, Verlauf sowie investiert/realisiert/unrealisiert bleiben nächste Dashboard-Cache-Stufen.
• Manuelle Snapshots, allgemeiner Discovery-Cache, Gebühren-Summary, NFT-Cache und die vollständige TLN/VOW-Initialisierung sind aus dem Login-Start entfernt und werden erst beim Öffnen ihres Bereichs geladen.
• Nächster Architekturpunkt: einen kompakten userbezogenen Dashboard-Snapshot definieren, damit weitere Basisabfragen beim Start entfallen können.

PHASE 5.31/5.32 · START-/DASHBOARD-ARCHITEKTUR:
• Aktuelle Preise sind ein globaler, nicht historisierter 15-Minuten-Snapshot. Ein globaler Slot-Lock verhindert parallele Preisjobs mehrerer User. Datenquelle und Cache-Status sind getrennte Begriffe.
• Dashboard bleibt immer Startseite – auch bei einem komplett neuen User ohne Wallet. Ohne Wallet erscheint eine verständliche Erststart-Hilfe mit Ein-Klick-Aktion „Erste Wallet erfassen“.
• Nach dem Speichern einer neuen Wallet startet automatisch der vorhandene zentrale Grunddatenlauf. Der User muss keinen Projekt-Tab öffnen, damit der erste Bestands-/Projektpositions-/NFT-Cache aufgebaut wird.
• Bei bestehenden Wallets startet nach dem sofort sichtbaren Cache-Dashboard höchstens 1× täglich je Wallet/Datentyp eine asynchrone Hintergrundprüfung, sofern der Refresh-State dies verlangt.
• Projekt-Detail-Discovery bleibt getrennt. Dashboard-Grunddaten dürfen aus persistenten Projektcaches/Summaries übernommen werden; das Dashboard selbst startet keinen Globalgraph-/Historien-Vollscan.
• Dashboard-Project-Summary wird userbezogen lokal als schneller Anzeige-Cache persistiert. Fachliche Projektcaches bleiben die Wahrheit. TLN-Teamansicht schreibt Teampartner + aktiv aus demselben verifizierten Forest/Lifecycle in die Dashboard-Summary; unverifizierte Lifecycles werden nicht als inaktiv gezählt.
• Nächste fachliche Ausbaustufe: Reward-Summaries und DAO1 aktiv/Team aus ihren bestehenden persistenten Projektcaches an dieselbe Summary-Bridge anschließen – ohne zweite Discovery-Logik.
• Projektkarten breiter; Token in allen Projektkarten einheitlich zweispaltig, responsiv einspaltig.`
  },
  {
    status: "in_progress",
    category: "Wallets / Filter",
    priority: "high",
    title: "Wallet-Besitzer und zentraler Personenfilter",
    desc: `Jede Wallet wird entweder als „Eigenes Wallet“ markiert oder einer benannten Person zugeordnet. Besitzername wird wie die Walletdaten serverseitig userbezogen verschlüsselt gespeichert. Der zentrale Filter bietet „Wallets aller Personen“, „Eigene Wallets“ und jede erfasste Person.

PHASE 5.25:
• Datenmodell, verschlüsselte Edge-Function-Felder, Wallet-Eingabe und zentraler Filter umgesetzt.
• Dashboard sowie allgemeine Token-Übersicht/Wallet-Auswahl verwenden den Filter ohne zusätzliche DB-Abfrage.
• Bestehende Discovery-/Refresh-Fachlogik arbeitet weiterhin mit allen gespeicherten Wallets und wird durch einen reinen Anzeigefilter nicht verändert.
• OFFEN: Filter schrittweise in Tax, Gebühren, NFTs, Approvals sowie die projektspezifischen Ergebnisansichten übernehmen; technische Scans dürfen dabei nicht unbeabsichtigt eingeschränkt werden.`
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
• Phase 5.24 umgesetzt: Fehlende eigene Stakings beim Team-Restore behoben. Eigene Wallet-Discovery-Result-Caches werden nicht global, sondern user_id/wallet_id-basiert privat gespeichert; der Team-Restore fragte sie bisher fälschlich nur im globalen scope_address-Cache ab. Jetzt lädt er eigene Projekt-Wallets über technicalCacheScope aus dem privaten Cache und externe Partner weiterhin gebündelt global. Zusätzlich bleiben positive Lifecycle-Lots bei vorgemerkter Unstake-Nachprüfung sichtbar, jedoch bis zur Nachprüfung bewusst unvollständig. Alias-Abdeckung wird als stored/matched/missing gezählt; fehlende Namen ohne gespeicherten user-spezifischen Alias werden nicht erfunden. Staking-Discovery und 5.23-Duration-Proof bleiben unverändert.
• Phase 5.23 umgesetzt: Root Cause der offenen Legacy-v$/VOW-Lifecycles behoben. 5.20-5.22 hatten fuer 0x4857…d590 vorhandene positive Strict-Duration-Caches und Shared-Proofs absichtlich blockiert, weil faelschlich ein individueller Stored-End-Timestamp im Wallet-Struct erwartet wurde. Aktueller Diagnose-Run belegt: Start-/Positions-Struct wird gefunden, aber kein solcher End-Timestamp. Historischer On-Chain-Duration-Test belegt dagegen exakt 367 Tage: Unstake-Simulation eine Sekunde davor revertiert mit „!Minimum Staking Period“, unmittelbar danach erfolgreich. 5.23 nutzt daher wieder positive Cache-/Shared-Proofs zuerst; falls beides fehlt, gilt der 367-Tage-Proof nur fuer exakt 0x4857…d590 und nur nach erneutem Contract-/Implementation-Fingerprint- sowie Wallet-Positions-State-Abgleich am konkreten Stake-/Top-up-Block. 17449 verwendet weiterhin den letzten on-chain bestaetigten Top-up als Duration-Anker. Kein Staking-Discovery-Code geaendert. Alias-Backend/-Mapping laut 5.22-Diagnose erfolgreich (5 geladen / 5 sichtbare Matches), daher kein spekulativer Alias-Fix.
• Phase 5.22 umgesetzt: Stored-End-Read bleibt für Legacy-v$/VOW vor allen generischen Duration-/Shared-Caches; als Fallback ist ausschließlich ein zuvor positionsbezogen erzeugter Stored-End-Strict-Cache mit passendem Contract + Stake-Tx zulässig. Legacy-Aliase werden vor dem serverseitigen Replace auf id:/wallet: kanonisiert; unbekannte Legacy-Referenzen werden nicht an wallet-private gesendet und nicht gelöscht. Alle Build-/Versionsangaben synchronisiert. Staking-Discovery unverändert. Systemübersicht geprüft: keine Änderung an Datenquelle, Ladeauslöser oder Struktur.
• Phase 5.21 umgesetzt: Legacy-v$/VOW 0x4857…d590 liest Start + individuellen End-/Unlock-Timestamp wieder direkt aus dem konkreten Positions-Storage am Stake-Block, unabhängig von Shared-/Duration-/Negativcache. Partner-Aliase werden exakt aus wallet-private {ok,action,aliases} geladen und id:/wallet:-Referenzen kanonisch gespiegelt. Keine feste Tageszahl; Staking-Discovery unverändert.
• Phase 5.20 umgesetzt: Legacy-v$/VOW-Contract 0x4857…d590 priorisiert den individuellen Stored-End-Read jetzt vor altem Duration-Cache UND vor contractweiter Shared-Dauer. Dadurch kann keine frühere generische Dauer den positionsbezogenen End-Timestamp mehr überholen. Keine feste Tageszahl; Staking-Discovery unverändert.
• Phase 5.17 umgesetzt: Historische verschlüsselte Alias-Referenzen werden nach Identity-/Registry-Restore an sichtbare TLN-ID-Keys gebunden; sichtbare New-Registry-Partner ohne kompatiblen Lifecycle erhalten genau einen bestehenden Discovery-Pass. Staking-Erkennung unverändert; Build-Zeitangaben synchronisiert.
• Phase 5.16 umgesetzt: Auf neuem Gerät wird auch CURRENT_WALLET aus seinem persistenten Discovery-Snapshot restauriert, sofern kein Live-Lauf vorhanden ist. Offene Lifecycles erhalten nur dann einen automatischen Einmal-Nachlauf, wenn für alle aktuellen Staking-Targets bereits vollständige serverseitige Contract-History vorliegt; sonst bleibt der Fall bewusst offen. Kein Wallet-History-/Receipt-/forceFresh-Fallback, Batch max. 3. Staking-Discovery unverändert.
• Phase 5.15 umgesetzt: New-Registry-Referenzfall TLN-ID 990000017795 wird beim cache-only Restore gezielt on-chain gegengeprüft und ohne Registry-History-/Staking-Scan an Parent-TLN-ID 12415 angebunden; Alias-Referenzen werden kanonisch nach TLN-ID/Wallet gemappt und die Trefferzahl ohne Klartextnamen geloggt. Die offenen v$/VOW-Fälle bleiben fachlich korrekt als Duration offen, weil der aktuelle Diagnose-Lauf zwar Staking + 14/14 Contract-Historien, aber keinen belastbaren Duration-Strict-Proof belegt. Staking-Discovery unverändert.
• Phase 5.14 umgesetzt: normaler Seiten-/Team-Restore ist strikt cache-only. Auf einem neuen Geraet wird nach dem Supabase-Restore keine automatische Lifecycle-/Wallet-History-/Receipt-Nachverifikation mehr gestartet; offene Lifecycles bleiben sichtbar und werden nur ueber Step 7 aktualisiert. Browser-/IndexedDB-Cache ist damit nur Beschleuniger, nicht Voraussetzung. Staking-Discovery unveraendert.
• Phase 5.13 umgesetzt: neue SmartNode-Registry-Generationen besitzen einen eigenen cache-first Join-Graph; falls fuer eine konfigurierte Zusatzregistry noch kein Graphcache existiert, wird nur diese Registry einmalig ueber join(address) + nodeIdOf/nodeUserOf verifiziert und danach persistiert. Alias-Referenzen werden unabhaengig vom historischen Prefix ueber TLN-ID/Wallet erkannt. Positive, vollstaendig verifizierte v7-Lifecycles werden wiederverwendet; alte v7-Nullfunde bleiben wegen der Coverage-Korrektur ungueltig. Staking-Discovery unveraendert.
• Phase 5.11 umgesetzt: Cache-Restore lädt Identities neuer SmartNode-Registries separat und rekonstruiert deren verifizierte join(address)-Parent-Kanten VOR dem Forest-Build (Referenz Ernie / TLN-ID 990000017795); Alias-Loader akzeptiert kompatible wallet-private Response-Shapes. Staking-Discovery unverändert.
• Phase 5.09 umgesetzt: Partial-Lifecycle kann verifizierten Cache nicht mehr überschreiben; Alias-Leerantwort erhält sicheren Re-Read
• Phase 5.07 umgesetzt: userbezogene Partnernamen/Aliase werden nach Cache-Restore rückwärtskompatibel über TLN-ID- und Wallet-Referenzen geladen und angezeigt
• Phase 5.07 umgesetzt: auch erkannte Teil-Lifecycles mit noch offener Duration werden persistent gespeichert und beim Cache-Restore gemergt; bereits erkannte Positionen dürfen dadurch nicht verschwinden
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

STAND 16.09.2026: Alter DAO1-Tree: Parent-Beziehung on-chain verifiziert über DID-Event TokenMinted(to, tokenId, fid); fid ist die Parent-ID. Ein manueller On-Chain-Discovery-Scan ist im Team-Tab eingebaut und zeigt ausschließlich dekodierbare Kanten. Neuer APTMDAO-Tree: Parent-Kanten sind in Phase 5.36 on-chain über den NFT-Mint-Event verifiziert (child, parent, wallet). Eigener globaler Supabase-/IndexedDB-Cache mit DATA_VERSIONS und 24-Block-Overlap ist umgesetzt. OFFEN bleiben Bot-Target/Aktivstatus und eine belastbare Referral-Reward→Partner-Zuordnung.`
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


// Phase 5.39 / Dashboard-Daten-Audit gestartet (19.09.2026):
// - Kursliste: Bestand > USD 1 automatisch; Flag = „immer anzeigen“, auch bei Bestand 0.
// - Projekt-Token nur bei belegter Projektbeteiligung; Projektkarten werden nicht mehr nur aus positivem Tokenbestand abgeleitet.
// - TLN/VOW Dashboard-Summary liest persistente Discovery-Snapshots und trennt Staking-, Referral- und Bonus-Rewards.
// - DAO1/APTMDAO Partnerzahlen und Aliase bleiben strikt getrennt.
// - APTMDAO Alias-Persistenz: reference_hash serverseitig verpflichtend aus vollständigem Namespace-HMAC.
// Audit offen: Aktuelles Staking/gebundener Wert gegen positionsgenaue Projektcaches verifizieren; DAO Bot-Target/Aktivstatus on-chain beweisen.

// Phase 5.54 erledigt: DAO-NFT-Ermittlung zentralisiert; kombinierter DAO1/APTMDAO-Walletgraph zeigt DAO1-only-Downline und belegte Uplines oberhalb eigener Wallets, eigene Wallets bleiben echte Knoten ohne Partnerzählung. Kaufpreis-Evidence-Cache bleibt zentrale Grundlage; offene/unbelegte Preise werden nicht erfunden.

/* Phase 5.63 · 21.09.2026 01:43:10 CEST
 * - Eigene Wallet speichern: projektbezogener Erstaufbau muss ohne manuellen Refresh laufen.
 * - DAO-Team: direkte Uplines an jeder eigenen Wallet grafisch anbinden.
 * - Dashboard-To-dos projektweise gruppieren; Details standardmäßig zuklappen.
 */

/* Phase 5.64 · 21.09.2026 02:08:16 CEST
   DAO-Team: Partner-Identity wird wallet-zentriert fuer DAO1 und APTMDAO aus aktuellem
   ERC-721-Besitz ergaenzt. Partner-Bot-Anzahlen = aktueller Bestand, unabhaengig von
   Kaufpreis-/Lifecycle-Evidenz. Membership getrennt nach DAO1/APTMDAO mit Ablaufdatum
   anzeigen, sobald die jeweilige on-chain Expiry-Quelle belastbar verifiziert ist;
   unbekannt darf nie als fehlende Membership dargestellt werden.
*/


/* Phase 5.65 · 21.09.2026 02:38:12 CEST
   5.64-Korrektur: Partner-DID und Bot-Kachel lesen zuerst einen aktuellen ERC-721-NFT-Snapshot
   des Wallets. Kauf-/Lifecycle-Historie laeuft davon getrennt und darf die Kachel nicht blockieren.
   TODO: Partner projektbezogen als inaktiv markieren (userbezogen, historisch sichtbar, optisch heller).
   TODO Dashboard/DAO: eigene relevante Wallets ohne belegte APTMDAO-DID unter
   „Registration APTMDAO offen“ anzeigen; unbekannt/nicht geladen darf nicht als fehlend gelten.
*/


/* Phase 5.66 · 21.09.2026 03:22:39 CEST
   Korrektur 5.64/5.65: Partnerkarten verwenden keinen breiten Explorer-/address/nft-Snapshot mehr.
   Aktuelle DAO1-/APTMDAO-DIDs und Bot-Bestaende werden ausschliesslich contract-gezielt aus
   ERC-721-Transferhistorien der bekannten Identity-/Bot-Contracts rekonstruiert. Der bekannte
   Miner-Contract zaehlt aktuelle Token unabhaengig von Kaufpreis oder Einzelklassifikation als Mining-Bots.
   Historische Kauf-/Lifecycle-Aufbereitung bleibt nachgelagert und blockiert die Kachel nicht.
*/

/* Phase 5.67 · 21.09.2026 03:28:09 CEST
   Fix: private Supabase-Zugriffe erhalten zentrale Session-Prüfung und einmaligen 401/403-Refresh/Retry.
   DAO-Team-Jobs bleiben bei abgelaufenem JWT nicht in der globalen Navigationssperre hängen; runDataJob-finally bleibt Freigabegarantie.
   Datenquellen/Projektstruktur unverändert; Systemübersicht geprüft.
*/

/* Phase 5.68 · 21.09.2026 03:37:37 CEST
   Fehlerkorrektur: dao1TeamIsIdentityNft ist wieder definiert und wird zentral anhand der bekannten
   DAO1-/APTMDAO-Identity-Contracts bzw. Identity-Subtypen ausgewertet. Partner-Bot-Refresh kann damit
   die Bestandsauswertung erreichen. Login-Link kann nach E-Mail-Eingabe zusätzlich per Enter gesendet werden.
   Bestehende TODOs „Partner projektbezogen inaktiv“ und „Registration APTMDAO offen“ bleiben offen.
*/


/* Phase 5.69 · 21.09.2026 03:51:12 CEST
   5.68-Nachkorrektur: Partner-Identity und Bot-Bestand sind technisch getrennte aktuelle
   Bestandsabfragen. Teilresultate werden sofort gerendert, damit ein langsamer Identity-/Bot-Contract
   andere bekannte Werte nicht auf „werden geladen …“ festhaelt. Bestehende TODOs bleiben offen.
*/

/* Phase 5.71 · 21.09.2026 11:39:58 CEST
   Korrigiert: DAO-Team-Caches werden beim automatischen Erstladen inkrementell gegen die Chain geprueft; der manuelle Button „Beide Trees on-chain aktualisieren“ ist nicht mehr Voraussetzung fuer neue Partner-/DID-Kanten. Referenzname korrigiert: 0x568281…fe4940 = Monica. Offen: 1 Trading-Bot bei Monica fachlich/contractseitig eindeutig zuordnen.
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
