# Änderungshistorie

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
