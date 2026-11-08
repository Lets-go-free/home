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
