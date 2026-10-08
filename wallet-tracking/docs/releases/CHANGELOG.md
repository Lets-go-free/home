# Änderungshistorie

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
