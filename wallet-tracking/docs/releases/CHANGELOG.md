# Änderungshistorie

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
