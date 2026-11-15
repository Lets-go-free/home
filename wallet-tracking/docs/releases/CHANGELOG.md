## 8.52 · Live-Abnahme-Nachtrag 14.11.2026 21:39:51 CET (Dokumentation, kein neuer Build)
- 8.52-Migration installiert, kanonischen Erstclaim repariert und neu angelegten Claim mit exact-v13 bestätigt.
- 125 historische NFT-ID-Lücken (1+124) nach Gleichheits-/Wallet-Guards behoben; 2'078/2'078 damals konsistent.
- 377/377 verifizierte native APTM-Reto-Claims kanonisch übernommen. Abschlussaudit: 393 Kandidaten, 377 abgeschlossen, 16 nicht verifiziert, 0 verifizierte ohne Claim, 0 kanonische Abweichungen. DAO-Cron/Live-Worker bleiben deaktiviert.
- Kein weiterer App-Build, kein neuer Produktiv-SQL-Deploy. Details in 8.52-Release-Dokument und Status/TODO.

## 8.52 · 14.11.2026 20:49:27 CET
- DAO1 kanonische Reward-Felder bei neuen Claims atomar vervollständigt; bewachte Einzel-Reparatur ergänzt. Installation und Live-Test offen.

## 8.08 · 08.11.2026 22:45:54 CET · Build 20261108-224554

- Neue gemeinsame technische Metadaten-Funktion für alle aktuell unterstützten Chains, Master-/Custom-Token, Native-/Pool-Sonderfälle und dauerhaftes Konfliktprotokoll im internen Schema.
- Persönliche Anzeige-/Summary-Einstellungen eigener sicherer Token, strikt eigene Lese-/Schreibpfade; Namen und bestehende globale Werte geschützt. Browser, DAO und Bestandsjob verwenden zentrale Einheiten.
- 241 relevante lokale Tests bestanden. Breiter Lauf: 262/264, zwei bereits auf 8.07 reproduzierte alte Tests fehlerhaft; Details im Release. Kein 8.08-Live-Lauf, kein Cron.

> Live-Nachtrag 8.07 · 08.11.2026 22:23:00 CET: zwölf Apertum-ERC20-/LP-Token mit 18 technischen Dezimalstellen und unveränderten Anzeige-Einstellungen per Edge-Antwort und Live-SQL bestätigt. Zehn NULL-Werte ergänzt; natives APTM bleibt 18, ERC20-Prüfstatus dort nicht anwendbar. Andere Chains/eigene sichere Token neu als offener Umfang gemeldet; Bestandsdiagnose vor weiterer Umsetzung. Kein Cron. Führend: docs/PROJECT_STATUS_OPEN_ITEMS.md.

## 8.06 · 08.11.2026 21:45:35 CET · Build 20261108-214535

- Einzel-Claim-Pfad unterstützt bekannte wAPTM/wUSDT/wUSDC-Verträge, mehrere Transfers desselben Assets und technische Decimale per historischer Contract-Abfrage. Native Route bleibt native-only kompatibel.
- Eine gemeinsame Contract-/Quote-Regeldatei für Browser und Worker; Symbol-/Namens-Parität entfernt, zentrale Anker/Preisreuse TX-begrenzt. Keine neue Preisroute und keine Überschreibung vorhandener Bewertungen.
- ERC20-Einheiten exakt und getrennt von nativen APTM, Asset-Evidenz persistiert; DID-Identitäten und bestehende Transaktions-USD-Rewards vor falscher/doppelter Claim-Neuanlage geschützt.
- 198 DAO-/Reward-Tests inkl. PostgreSQL und vier vorhandene Preis-/Dashboard-Skripte bestanden. Live-Test offen, Referral/Gesamttagesqueue weiter offen, Cron aus.

### Live-Nachtrag 8.05 · 08.11.2026 20:29:33 CET

- Migration/Deployment erfolgt, Einzel-Claim-Aufruf meldet no_eligible_claim und keine Neuanlage. Alle drei Importströme im vollständigen Delta-Modus ohne neuere Ereignisblöcke.
- Separate SQL-Kontrolle: Referenzbestand unverändert 395 / 388 / 4 / 3 / 0 offene zusätzliche Payouts / 0 blockierte Pipeline-Fälle. Beobachtungszähler sind keine Insert-Zahlen.
- Neue native Claim-Neuanlage noch nicht live bewiesen. Nächste Analyse 8.06: ERC20-Payouts im begrenzten Einzelpfad, gleiche zentrale Preislogik. Tagesjob/Cron weiterhin nicht freigegeben.

## 8.05 · 08.11.2026 13:25:24 CET · Build 20261108-132524

- Manueller Einzel-Claim-Pfad: eine Rohimport-Seite je Strom, danach höchstens ein neuer nativer Claim mit getrennten Owner-/Payout-Belegen und bestehendem zentralem Preisanker. Historische 388/4/3-Referenzen geschützt.
- Gemeinsame TX-begrenzbare exact-v13-Ankernutzung; keine neue Preisroute. Blockierungsgründe/Prüfzeit, 24h-Retry oder explizite manuelle Neuprüfung; atomare Claim-Neuanlage/Preisergänzung/Abschluss.
- 173 lokale Tests inkl. PostgreSQL bestanden, Live-Lauf offen. Kein Tagesqueue-Abschluss, DAO-Cron bleibt aus; Token-/Referral-/Gesamtpipeline weiter offen.

### Live-Nachtrag 8.04 · 08.11.2026 13:13:35 CET

- Alle vier frühen nativen Auszahlungen live als verified bestätigt; Rawbeträge dauerhaft gespeichert, Preis-Ausnahme und USD NULL erhalten, canonical_existing_verified bleibt false.
- Wiederholung checked=0/results leer; separate SQL-Prüfung bestätigt je einen Protokolleintrag. Zusätzliche pending-Payout-Prüfungen abgeschlossen.
- Nächster Schwerpunkt: neuer Claim im serverseitigen inkrementellen Gesamtprozess, keine neue Klassifikation bereits geklärter historischer Fälle. DAO-Cron bleibt deaktiviert, Phase/Build unverändert.

## 8.04 · 08.11.2026 13:02:39 CET · Build 20261108-130239

- Kontrollierter Admin-Test für maximal vier offene native Payouts: bestehende TX-/Flow-/Betragsevidenz unabhängig vom USD-Kurs, atomar und wiederholbar. Keine neuen Rewards/Preise oder canonical_existing-Kennzeichnungen.
- Exakte Grenze 1'000 Wei ohne rundende Division; fehlende/mehrdeutige Belege bleiben Review, negative und bereits verifizierte Fälle geschützt.
- Neue service-only SQL-Funktion, später index.ts deployen; Helper aus 8.03 unverändert. 151 lokale Tests inkl. PostgreSQL bestanden, Live-Test offen. DAO-Cron bleibt aus.

### Live-Nachtrag 8.03 · 08.11.2026 12:49:07 CET

- Drei Null-Reward-TXs vollständig geprüft und dauerhaft als no_payout_evidence bestätigt; SQL-Persistenz und erneute manuelle Prüfung erfolgreich. Automatischer 24h-Wiederanlauf bleibt separat offen.
- Vier pending-Payouts live den frühen positiven unpriced_before_exact_anchor-Claims zugeordnet; USD NULL, Auszahlung noch nicht verifiziert.
- Nächste Entwicklung: kontrollierter positiver Payout-Prüfpfad, danach inkrementelle Gesamtpipeline. DAO-Cron bleibt aus; Phase/Build unverändert.

## 8.03 · 08.11.2026 12:41:04 CET · Build 20261108-124104

- DAO: Internal-TX-Prüfer akzeptiert Blockscout `success=true` ohne `status`; explizite Fehler, Widersprüche und fehlende Erfolgsbelege bleiben Review.
- Echte vollständige 17-Aufrufe-Antwort als Regression-Fixture; sechs neue Tests, insgesamt 137 lokale DAO-/Reward-Tests inkl. PostgreSQL bestanden.
- Keine SQL-Migration, index.ts unverändert; nur Hilfsmodul erneut deployen. Korrigierter Drei-TX-Live-Test steht aus, DAO-Cron bleibt deaktiviert.

## 8.02 · 08.11.2026 11:16:25 CET · Build 20261108-111625

- DAO1/APTMDAO: `no_payout_evidence` als allgemeiner wiederprüfbarer Auszahlungsstatus nach vollständiger TX-lokaler Explorer-Prüfung; unbekannte/unvollständige Daten bleiben Review.
- Coverage, zehn letzte Versuche, SQL-Zeilensperre/CAS, geschützte Revalidierung nach 24h und begrenzter Admin-Drei-TX-Test. Keine Änderung kanonischer Rewards/Preise/NFTs.
- Inkrementelle Queue bleibt bei `pending`-Payout-Rest `partial`; 131 lokale DAO-/Reward-Tests inklusive PostgreSQL bestanden. Live-Abnahme offen, DAO-Cron bleibt aus.
- Zentrale Status-/Übergabedokumentation, Admin-Systemübersicht/-Doku/Ideen und DAO-Hilfe nachgeführt; Browser-Cache-Timestamps aktualisiert.

# Änderungshistorie

- 7.68: Täglicher serverseitiger Wallet-Bestandsjob für alle 12 aktivierten Chains, verschlüsselte Wallet-Adressen, Service-only Job-Queue, sichere Fehlerbehandlung und atomare automatische Snapshots. Browser prüft beim ersten Öffnen pro Sitzung erneut live; LP-/Staking-Projektcaches bleiben getrennt. Handelsjob-Secret aus historischer Repository-SQL entfernt; Rotation weiterhin erforderlich. Installation mit gesonderter Freigabe nach beobachtetem manuellem Edge-Test.

- 7.55: Projekt-Token aus der Dashboard-Kursübersicht ausblenden; standardmäßig sichtbar, weiterhin nur bei vorhandenem Projekt. Release-READMEs unter docs/releases archiviert; Usertests APTM-24h und Entdecken bestätigt. Neue globale Admin-Option predefined_tokens.dashboard_price_visible (SQL 093, DEFAULT true); nur Kursübersicht gefiltert, Projekt-Kacheln/Bestände/Bewertung erhalten. Keine neue Tabelle/keine neuen Refresh-Jobs. Dokumentation vollständig nachgeführt; Cleanup-Helfer mit Inhaltsprüfung.

- 7.54: APTM/wAPTM: aufgelöste Bewertungsroute direkt übergeben, globalen Preissnapshot auf v6 erneuert. Belegte Claims ohne NFT-ID speichern und als Nicht zugeordnet anzeigen. Aktuelle LPT-Kursermittlung auf Userentscheid eingestellt; historische Bewertungen erhalten. SQL 092 erlaubt NULL-NFT-ID; Schlüssel, RLS/Grants und kanonische Flows unverändert. Audit, Systemübersicht, Ideen und Hilfen aktualisiert; bestätigte Usertests nachgeführt, verbleibende produktive Tests ausdrücklich offen.

- 7.53: Bestehende historische Block-/V2-/LP-Funktionen wiederverwendet, Apertum-Sync-Events erhalten; optionale Pool-/Routenbindung ohne Änderung bisheriger Aufrufer.  24-Stunden-Vergleich für DEX-Kurse über dieselbe aktuelle Bewertungsroute; globaler Cache, ehrliche Lücken und Referenzkennzeichnung. V2-/V3-/LP-Replay, Block-/Pool-/Decimals-Deduplizierung; nur zentraler Preisjob und bestehender globaler Snapshot v5. Kein aktueller Preiswechsel/keine langfristige Historie/neue Tabelle. CoinGecko bleibt; – mit Ursache bei fehlendem Nachweis, 0 % bei USD-Modellreferenz erklärt. Dokumentation und Regressionen ergänzt, produktive Archive-Abdeckung offen. Kein SQL/Edge-Deployment.

- 7.52: Kurse: zwei Tabellen bei ausreichender Bereichsbreite, sonst eine gemeinsame Tabelle; Contract-Adressen kleiner auf zweiter Zeile. Ab 1400 px verfügbarer Innenbreite zwei Tabellen, darunter eine gemeinsame Tabelle. Adressen gekürzt/kopierbar, Datenquelle ohne lange Inline-Contracts. Sortierung und Preislogik unverändert. Dokumentation aktualisiert; kein SQL/Edge-Deployment.

- 7.51: Aktuelle Kurse in einer gemeinsamen Tabelle mit einem Tabellenkopf und durchgehend ausgerichteten Spalten. Sortierung nach zentraler Chain-Reihenfolge, innerhalb der Chain nach Tokenname. Die bisherige Halbierung der Kursliste entfällt; volle Breite und horizontaler Scroll bleiben. Preislogik/Datenabrufe unverändert; kein SQL/Edge-Deployment. Dokumentation aktualisiert.

- 7.50: Aktuelle Kurse über volle Dashboard-Breite; Tabellenaufteilung nach verfügbarer Breite, horizontaler Scroll bei schmalen Ansichten. Keine Änderung an Preisquellen, Filtern oder Ladezeitpunkten; kein SQL/Edge-Deployment. Dokumentation nachgeführt.

- 7.49: Zusätzliche Besitzer-/Partnernamen für alle Wallet-/Partner-Aufgaben; TLN-ID und bisherige Kennungen bleiben immer sichtbar. Userbezogener lazy Alias-RAM, deduplizierte Reads/Save-Refresh, namespaces getrennt. Legacy-LPT-Klassifikation auch bei deaktivierten historischen Stammdaten; Erklärung ohne geprüften aktuellen Projektkurs. Historische/Dust-Werte sind kein heutiger Preis; aktueller Bewertungsnachweis bleibt offen. Dokumentation und Regressionen ergänzt. Kein neues SQL/Edge-Deployment.

- 7.48: Separate wAPTM-Nachzahlungen nur mit exaktem Token-/Senderfilter als Kandidaten. Je Wallet bestätigen/ignorieren für aktuell angezeigte TXs; dauerhafte User+Wallet+TX-Entscheidung, neue Eingänge weiter offen. Bestätigt in Bot-Claims unter Nicht zugeordnet und in kanonischen Summen; Dashboard-Prüfaufgabe nach Walletfilter. SQL 091 (13 Statements) vor Veröffentlichung erforderlich, kein neues Edge-Deployment. RLS/kein anon/keine Klartext-Wallets; Wallet-/Daten-/Kontolöschung per Cascade. Dokumentation vollständig aktualisiert, lokale Regressionen bestanden; Live-Supabase-Verifikation offen.

- 7.47: Korrigierte Anforderung: sichere Sammelaktion aus 7.46 ersetzt durch Alle entdeckten Tokens als Spam markieren. Auch ohne Verdacht, bereits sichere Tokens ausgeschlossen, Umfang ausgewählte Wallets/Chains. Bestätigung mit eindeutiger Tokenzahl; Speicherung je Wallet, Teilfehler bleiben offen; keine Safe-Token-Inserts/Chain-Refreshs. Einzelne sichere Freigabe bleibt. Dokumentation und Regression angepasst; kein zusätzliches SQL/Edge-Deployment.

- 7.46: Entdecken für alle Wallets default; sichere Sammelaktion; walletbezogene Spam-Persistenz. Aktuelle DID-Partnerbesitzer über getrennte ownerOf-Prüfung, historische Graph-Caches bleiben erhalten; apertum-rpc-proxy deployen, kein SQL. Dokumentation vollständig nachgeführt; separate wAPTM-Auszahlung wartet auf bestätigte Quelle.
- 7.45: Mint ohne Zahlung in dieser TX nur nach vollständiger Prüfung; unbekannter Kaufpreis bleibt offen.
- 7.44: Erwerbs-TX und abweichender Wallet-Transfer verlinkt, auch ohne Kaufpreis.
- 7.43: Externe NFT-Metadaten-404 korrekt behandeln; Recovery erzeugt keine Konten.
- 7.42: Endgültige Kontolöschung mit Admin-Sperre (SQL 090 und wallet-private); Registrierungsmeldung bestätigt nur Anfrage.

- 7.41: Gespeicherte Bot-Kaufpreise nach Datenaktualisierung ohne Seiten-Refresh anzeigen; Sitzungscache übernimmt neue Nachweise; APTMDAO (neu) als Team-Standard.

- 7.40: Original-Erwerbsdatum und Tx unabhängig vom Kaufpreis aus alter Bot-Historie; Resolver v5; HTTP-500-Historienfehler als offener Prüfpunkt.

- 7.39: Read-only Datenbank-Backup-Helper inkl. Auth und privaten Daten; ursprüngliches Kaufdatum und Upgrade-Datum getrennt.
- 7.38: Prelaunch-Auszahlungen separat von offenen USD-Preisen; Claim-Prüfpunkt mit niedriger Priorität.

- 7.37: Admin-Stammdatenexport (Migration 089), tatsächliche Sticky-Spaltenbreiten, zentrale Restore-Dokumentation.
- 7.36: Queue-Deadlock korrigiert; orange technische Chain-Spalten.
- 7.35: RPC-Retry, Bestandserhalt bei Fehlern, Abschlussstatus und sichere Snapshots.
- 7.34: Mining-Bot-Upgrade übernimmt historischen Kaufpreis; keine Doppelzählung.
- 7.33: Nutzerbegrenzte private Partnernamen; Edge wallet-private muss aktualisiert sein.

Detaillierte ursprüngliche Release-Berichte liegen hier zur Nachvollziehbarkeit. Die aktuelle Betriebs-/Restore-Anleitung steht in Admin → Dokumentation.
## 8.52 · Nachtrag 15.11.2026 · Schritte 53–70 (nur Dokumentation)
- Globaler `exact-v13`-Audit nach letztem Batch: 2454/2454 konsistent, 0 Abweichungen.
- Reto-Bestand endgültig geklärt: 377/377 verifizierte Claims kanonisch abgeschlossen; 16 weitere Claim-Versuche bereits als `failed_transaction` klassifiziert; 0 weiter verarbeitbar.
- Beispielhafter Explorer-Abgleich: `NothingToClaim()` / `status=error`, keine internen oder Token-Auszahlungen. 8.42-Audit-Klassifikation der 16 Fälle bereits vorhanden; kein SQL-/Code-Deploy oder Reward-Write erforderlich.
- DAO-Cron und Live-Worker deaktiviert. Allgemeine DAO-Pipeline weiter offen.

## 8.53 · 15.11.2026 16:07:37 CET · Build 20261115-160737
- DAO Miner `RewardClaimed`-Event: strikte read-only Einzel-Preview mit Historien-, Payout-, NFT- und Wallet-Guards, ohne neuen DB-Write. Vier neue Parser-Regressionen. Zwei Edge-Dateien gemeinsam deployen, danach nur einen Admin-Preview testen.
- 73 zusätzliche unzugeordnete Mining-Claims mit nativen APTM-Flows entdeckt; ein Pilot-Payout live verifiziert und persistiert, NFT-Eigentum belegt. 377 kanonische Reto-Claims, 16 Fehl-TXs und 2'454 `exact-v13`-Konsistenz nicht verändert. DAO-Cron/Live-Worker deaktiviert.

## 8.54 · 15.11.2026 16:21:31 CET · Build 20261115-162131
- 8.53 Preview für genau eine Reto-Claim-TX live `ready=true`, keine Datenänderungen.
- 8.54: Streng bewachte, service-role-only und auf eine Pilot-TX fest begrenzte NFT-Identitätszuordnung. Frischer Blockchain-Event-/Ownership-Preview vor SQL-Commit. Ausschliesslich Kandidaten-NFT-Felder und Status, kein kanonischer Claim/Reward/Preis-Write. SQL-Installation und Edge-Live-Test offen.
- Version/Build/Dokumentation/TODO/Regressionen aktualisiert. DAO-Cron und Live-Worker bleiben deaktiviert.

## 8.55 · 15.11.2026 16:27:00 CET · Build 20261115-162700
- 8.54-Live-Test scheiterte ohne erfolgreichen Write: Kandidatentabelle hat kein `updated_at`. Neue Migration ersetzt nur die bestehende 8.54-Funktion ohne diese Spaltenreferenz; Guard- und Transaktionslogik unverändert, kein Edge-Deploy. Historische Migration 8.54 bleibt erhalten.
- Doku/TODO/Version und gezielter Regressionstest ergänzt. Nur SQL 8.55 installieren, danach Rückmeldung abwarten. DAO-Cron/Live-Worker AUS.

## 8.56 · 15.11.2026 16:35:45 CET · Build 20261115-163545
- 8.55-Korrektur live bestätigt; genau ein zusätzlicher Reto-Miner-Claim (NFT #37084) durch Event, Ownership, Auszahlung, NFT-Zuordnung und 8.52-Finalizer kanonisch übernommen. SQL-Audit in beiden Tabellen konsistent, global 2'455/2'455 `exact-v13` ohne Abweichung. 72 weitere Miner + 76 Legacy bleiben offen.
- Neue admin-authentifizierte read-only Drei-Kandidaten-Preview mit Event-, Payout-, Eigentums-, Coverage- und Preis-Guards; keine SQL-Migration, keinerlei DB-Writes. Edge-Deployment und Live-Test offen. DAO-Cron/Live-Worker AUS.

## 8.57 · 15.11.2026 16:45:00 CET · Build 20261115-164500
- 8.56 Read-only-Preview live: drei Kandidaten wegen mehrfacher RewardClaimed-Events blockiert, keine DB-Änderung. Explorer zeigt mehrere Collection-IDs pro NFT/Staker.
- 8.57 ergänzt strikte Aggregation aller vollständigen TX-lokalen RewardClaimed-Events zu einem NFT-Claim, exakte Wei-Summe und Payout-/Flow-Gleichheit; Misch-IDs, Index-Duplikate, fehlende Historie bleiben blockiert. Keine SQL-/Reward-/Claim-Writes. Live-Retest und Deployment offen; DAO-Cron/Live-Worker aus.

## 8.58 · 15.11.2026 17:52:45 CET · Build 20261115-175245
- 8.57-Live-Vorschau 3/3 bereit; 499/500/500 Events pro TX belegen die gleiche NFT und mehrere Collection-IDs. Erste Auszahlung 54.477996600093324995 APTM erfolgreich verifiziert; SQL bestätigt 1 unveränderten exact-v13-Flow und noch 0 kanonische Claims.
- Neue eng auf die erste TX begrenzte Admin-Route `admin-miner-multi-nft-assign-858` und SQL-Funktion: vollständige paginierte Event-Summe, einzigartige Log-Indizes/Collections, identischer Staker/NFT, retraceter nativer Payout, unveränderter historischer Flow, Eigentumsintervall und kompletter Transfernachweis; SQL-Reprüfung mit Sperren. Nur Kandidaten-NFT-Zuordnung; kein Canonical/Reward/Preis-Write. DAO-Cron und Live-Worker deaktiviert.
- Abnahme bewusst schrittweise: zuerst SQL-Migration, dann Edge, danach genau ein Live-Assign-Test; keine automatische Batch-Aktivierung.

## 8.59 · 15.11.2026 18:17:55 CET · Build 20261115-181755
- Zweiter Multi-Event-Claim aus 8.58 erfolgreich kanonisch übernommen, Reward/Flow exakt identisch; global 2'456/2'456 `exact-v13` Claims konsistent, 0 Abweichungen.
- Nachfolgende 71 unassigned Miner kontrolliert geprüft: die ältesten drei 3/3 read-only bereit (500/500/237 Events). Erste weitere Auszahlung (50.945303137912696144 APTM) via 8.43 Explorer-Trace verifiziert, SQL bestätigt candidate-only verified.
- 8.59 installiert noch nichts automatisch: neue streng auf TX `0xed7beb78…` begrenzte Admin-Route und eigene SQL-NFT-Zuordnung (500 Events, Collections 33387–33886, NFT #37084). Keine Canonical-/Reward-/Preis-Writes; DAO-Cron/Live-Worker bleiben aus.

## 8.60 · 15.11.2026 18:29:07 CET · Build 20261115-182907
- 8.59-Pilot live abgeschlossen: NFT #37084 und 50.945303137912696144 APTM, ein kanonischer Claim; globale Kontrolle 2'457/2'457 exact-v13 konsistent.
- `admin-miner-page-preview-860`: schrittweise Read-only-Abnahme der 70 übrigen Miner mit stabil sortiertem Block/Hash-Fortsetzungspunkt. Maximal drei überprüfte Kandidaten und höchstens vier Datenbank-Kandidaten je Aufruf; keine Schreibzugriffe. Wiederverwendung derselben strikten 8.57-Event-Aggregation und 8.56-Payout-/Ownership-Evidenz.
- Response mit `continuation` (Block/Hash), `hasMore`, kompakter Collection-Spanne und Event-Anzahl; Zeitbudget darf keinen ungeprüften Kandidaten überspringen. Keine SQL-Migration, keine generische NFT-/Claim-Schreibroute, DAO-Cron/Live-Worker AUS.

## 8.61 · 15.11.2026 19:06:27 CET · Build 20261115-190627
- 8.60-Live-Preview erfolgreich über zwei Seiten: jeweils 3/3 Miner bereit, strikt aufsteigende Block/Hash-Reihenfolge und gültiger Cursor, kein Write.
- Neue allgemeine, manuelle Einzel-NFT-Zuordnung ohne hartcodierte Transaktions-ID, NFT-ID, Eventzahl oder Betrag. Routen `admin-miner-nft-preview-861` (reines Read-only) und `admin-miner-nft-assign-861` (erst nach Payout verified, genau eine Kandidaten-NFT-Zuordnung).
- SQL-Funktion `wallettracking_dao_assign_multi_miner_nft_861`: service_role-only, verschlossene Transaktions-/Wallet-Scope, exakter nativer Payout, unveränderter exact-v13-Flow, historische NFT-Eigentümerschaft und komplette Transfer-Coverage mit Sperren. Explorer-Events werden in Edge vollständig revalidiert. Kein automatischer Claim-/Reward-/Preis-Write und keine Batch-Freigabe; Cron/Live-Worker AUS.
- Stufenweise Installation und Live-Abnahme: zuerst SQL, dann Edge, dann eine Payout-Verifikation, Read-only-NFT-Preview, guarded NFT-Assign und erst danach separater kanonischer Finalizer.

## 8.62 · 15.11.2026 19:11:12 CET · Build 20261115-191112
- 8.61-SQL-Installationsversuch fehlgeschlagen (SQLSTATE 42601, `OR` nach `COMMIT`). Ursache: verdoppelter SQL-Suffix hinter dem gültigen Funktionsblock in der ausgelieferten Migrationsdatei. Kein Daten- oder Schema-Write erfolgt.
- Neue korrigierte 8.62-Migration installiert dieselbe generische, service_role-geschützte Funktion. Zur Sicherung künftiger Projekt-Replays wurde die **nicht erfolgreich ausgeführte** 8.61-Quellmigration im Archiv ebenfalls korrigiert. Keine Änderung der Edge-Guards, Preis-/Reward-/Claim-Tabellen oder Jobs.
- Nächster Schritt nur 8.62 SQL installieren, danach Edge-Deploy separat. DAO-Cron/Live-Worker AUS.

