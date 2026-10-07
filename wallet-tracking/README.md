# WalletTracking 7.45 · 08.10.2026 01:35:12 CEST

## Update installieren
Gelieferte Dateien im Verzeichnis wallet-tracking ersetzen/veröffentlichen und Seite neu laden. Kein Edge-Deployment, kein SQL und keine neuen Secrets für 7.45. Daten aktualisieren führt die einmalige Prüfung alter NFT-Zahlungsnachweise durch. Bestehende SQL-/Edge-Voraussetzungen aus früheren Releases bleiben erforderlich.

## Erwerb ohne Zahlung
„Mint ohne Zahlung in dieser TX“ bedeutet: erfolgreicher ERC-721-Mint dieses Bots an die Erwerbswallet, vollständige Token-/Internal-Transferlisten und TX-Details, kein positiver ERC-20- oder nativer Zahlungsfluss in dieser TX. Gas ist kein Kaufpreis. Frühere oder externe Zahlungen bleiben möglich; Kaufpreis bleibt nicht ermittelt, niemals automatisch 0. Bei Abruffehlern oder unvollständigen Daten bleibt die Prüfung offen.

NFT zeigt den Hinweis beim Erwerb, DAO-Baum/Bot-Tabelle in Erwerbsart. Kaufpreis bleibt „nicht ermittelt“. Gefundene historische Zahlungen und Upgrade-Kaufpreise haben Vorrang. Same-TX-Abschluss wird separat als sameTxPaymentCheckComplete / mintWithoutPayment gespeichert; checked bleibt der Kaufpreisnachweis. Keine NFTs/Tx-IDs werden hardcodiert. Positive Zahlungen von Dritten verhindern ebenfalls die Negativklassifizierung. Strikte Transferpagination bricht bei Limit oder fehlendem items-Array ab; Fehlerantworten aus toleranten Claim-Caches werden nicht für den Abschlussnachweis benutzt. Fehlende/ungültige Beträge und fehlende TX-Erfolgsdaten bleiben unvollständig.

Resolver-Versionen: reguläre NFTs 4, Upgrade-NFTs 6. Bestehende zentrale Nachweise werden einmal neu geprüft; kein permanenter Scan beim NFT-Öffnen. Speicherung weiter im privaten NFT-Cache, keine neue Tabelle. Keine globale Schema-/Grant-Änderung.

## Verifikation
Lokale Regression mit screenshot-abgeleiteten synthetischen Daten für #15541/#15542 und #120469/#120470; Zahlungen, unbekannte Werte, fehlerhafte/abgebrochene Pagination, fehlende Internals/TX-Details, NFT-/DAO-Darstellung und Trennung vom Kaufpreis. Bestehende Regressionen und JS-Syntax geprüft. Produktive API-Roundtrips hier nicht geprüft.

Produktiver Test: nach Veröffentlichung neu laden, Daten aktualisieren, die vier Bots unter NFT und im DAO-Detail prüfen. Erwartet: „Mint ohne Zahlung in dieser TX“ bei vollständigem Abruf, Kaufpreis nicht ermittelt, Erwerbs-TX weiterhin verlinkt. Vorhandene Kaufpreise müssen erhalten bleiben. Fehler bleiben offen, niemals als gratis klassifiziert.

## Noch offen
- Übrige ungeklärte Bot-Kaufpreise anhand eigener Erwerbs-TX prüfen; separate Zahlung nicht heuristisch zuordnen.
- Externe Metadaten #120469 fehlen (404 produktiv bestätigt, technische Behandlung funktioniert).
- Vollständiger Konto-Löschtest samt Admin-Negativtest und Neu-/Alt-Wallet-Importvergleich noch nicht abschließend belegt.
- Michaela: Trading-Bot im alten DAO1-Zweig separat kontrollieren.
- Legacy-Claim #10294 ohne Auszahlung: niedrige Priorität.
- Restore-Test weiter zurückgestellt; Backup und Master-Key gesichert.

## Dokumentation
Diese README.md wird künftig aktualisiert. Ältere README-7.xx.md sind Release-Historie und für die App nicht erforderlich. SQL-/Baseline-Dokumentation in sql/ und technische Dokumentation in docs/ bleiben separat erhalten. Nutzerhilfe und Systemübersicht stehen in der App.
