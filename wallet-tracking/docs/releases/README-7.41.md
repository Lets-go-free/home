# WalletTracking 7.41 · 05.10.2026 22:54:48 CEST

## Installation und Test
Nur die gelieferten Dateien ersetzen/veröffentlichen, danach die Seite einmal neu laden. Keine SQL-Migration und kein Edge-Deployment.

1. DAO1 → Team öffnen: APTMDAO (neu) ist aktiv; DAO1 (alt) bleibt auswählbar.
2. „Daten aktualisieren“ vollständig abschliessen lassen. Danach die Bot-Kaufpreise prüfen, ohne die Seite neu zu laden.
3. Den Aktualisierungslauf ein zweites Mal wiederholen. Bekannte Kaufpreise sollen sichtbar bleiben. Ungeklärte Preise bleiben offen.

## Korrektur
Der zentrale Lauf baute die DAO1-Bot-Ansicht nicht abschliessend neu auf. Ein älteres Erwerbsergebnis im Sitzungscache konnte zudem einen inzwischen gespeicherten Kaufnachweis übergehen. Nach dem Current-State-/Ownership-Abgleich werden beim manuellen Lauf jetzt nur fehlende/veraltete zentrale NFT-Nachweise ergänzt. Die automatische Tagesprüfung startet dadurch keine neue Kaufpreis-Historienermittlung. Die NFT-Ansicht wird neu aufgebaut; der abschliessende DAO1-Bot-Anzeigeaufbau nutzt ausschliesslich gespeicherte Sitzung-/NFT-Evidenz, ohne weiteren Historien- oder RPC-Abruf. Persistierte Preise haben Vorrang vor älteren Sitzungsergebnissen. Ein neuer Anzeigeaufbau verhindert, dass ein vorher gestarteter langsamer Lauf später die Ansicht überschreibt.

DAO1-Team startet bei einer frischen Sitzung mit APTMDAO (neu). Die explizite Wahl DAO1 (alt) bleibt innerhalb der Sitzung erhalten.

## Prüfung und offene Punkte
Lokale Regression: fehlender Sitzungspreis übernimmt neuen gespeicherten Preis; verifizierter Preis bleibt erhalten; abschliessender Bot-Anzeigeaufbau ohne API-Aufruf; zentraler Abschluss erfolgt erst nach NFT-/DAO1-Anzeige. Bestehende Miner-/Prelaunch-/RPC-/Snapshot-/Job-/Backup-/Export-/Alias-Tests sowie JS-Syntax geprüft. Produktiver Doppeltest bleibt erforderlich.

Der zuvor beobachtete apertum-nft-history HTTP 500 ist im aktuellen User-Test nicht aufgetreten. Ohne Backend-Evidenz keine Behauptung einer serverseitigen Behebung. Backup/Schlüsselsicherung vom User erledigt gemeldet; Restore-Test weiterhin zurückgestellt.
