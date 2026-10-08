# WalletTracking 7.43 · 08.10.2026 00:52:11 CEST

## Installation
1. Edge Function `wallet-private` mit der gelieferten `index.ts` neu deployen.
2. Gelieferte Frontend-Dateien ersetzen/veröffentlichen und Seite neu laden.
Keine neue SQL-Migration und keine Änderung an Secrets. SQL 090 aus 7.42 bleibt erforderlich für die Kontolöschung.

## Korrektur
Bei NFT #120469 wurde für die Metadaten-URI `https://api.dao1.ai/miner/120469` ein Upstream-404 als HTTP 502 durch nft-metadata-proxy ausgegeben. Die URI stammt aus den NFT-/Contract-/Indexer-Daten; ein anderer richtiger Endpunkt ist nicht belegt. Statt einer geratenen Ersatz-URL wird jetzt der vorhandene authentifizierte Abruf wallet-private/nft_metadata_fetch auch für genau DAO1 /miner/<ID> freigegeben. Die externe Quelle wird dadurch nicht repariert; zusätzliche Namen, Bilder oder Kaufpreise werden nicht behauptet.

Ein echter 404 liefert HTTP 200 mit found:false/status:404 und null-Metadaten. NFT-Besitz, bekannte Namen/Bilder, Erwerbsdatum und Kaufpreis bleiben erhalten. Parallele Abrufe derselben URL werden zusammengeführt; bestätigte 404 werden fünf Minuten ausschließlich im RAM gemerkt. Nach Ablauf oder Seiten-Neuladen wird bei Bedarf erneut geprüft. 5xx, Timeout und ungültiges JSON bleiben Fehler und werden nicht als fehlende Metadaten zwischengespeichert. HTTPS-Domain/Pfad-Allowlist, keine URL-Credentials/Ports/Query/Fragment, keine Redirects, Timeout und Größenlimit bleiben serverseitig.

Recovery verwendet shouldCreateUser:false und legt keine neuen Konten mehr an. Die Statusmeldung bestätigt nur die Link-Anforderung.

## Prüfung
Lokale Regression: DAO1/APTM erlaubte Pfade, fremde Hosts/Pfade und URL-Varianten abgewiesen, 404 vs 503/ungültiges JSON, parallele Abfragen, Cache-Ablauf, Daten bleiben erhalten, Recovery-Option. Bestehende Regressionen und JS-Syntax geprüft. Livezugriff auf externe DAO1-Metadaten hier nicht möglich; Fehlerursache anhand der User-Screenshots und des vorhandenen Codes geprüft.

Produktiver Test: nach Deployment neu laden, Daten manuell aktualisieren. Für diesen DAO1-404 darf kein nft-metadata-proxy/502 mehr erscheinen; wallet-private soll found:false/status:404 liefern. Lauf muss enden und Navigation freigeben. Bot samt bestehenden Daten bleibt sichtbar. Andere echte Serverfehler müssen weiterhin erkennbar sein.

## Stand
User bestätigt, dass die Aktualisierung trotz Metadaten-404 endet und Navigation freigibt. Der externe fehlende Metadateneintrag bleibt offen. Backup/Schlüssel gesichert; Restore-Test weiterhin zurückgestellt. Kontolöschung und Admin-Sperre aus 7.42 bleiben unverändert.
