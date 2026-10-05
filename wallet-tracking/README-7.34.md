# WalletTracking · Phase 7.34

Stand: 05.10.2026 03:12:13 CEST · Build 20261005-031213

## Änderung

Beim Upgrade eines alten MineBots auf einen neuen Apertum Miner werden beide NFTs anhand derselben erfolgreichen Upgrade-Transaktion verknüpft. Der neue Bot übernimmt den ursprünglichen Kaufpreis, das Kaufdatum und die Kauf-Tx. Die Upgrade-Tx und der Besitzbeginn des neuen NFTs bleiben separat sichtbar. Der alte Bot erscheint als migriert; seine Kauf- und Reward-Historie bleibt erhalten. Kaufpreissummen zählen den übernommenen Betrag nur einmal. Fehlt der alte Kaufpreis, bleibt er offen statt 0. Zusätzliche Zahlungen der Upgrade-Tx werden getrennt gespeichert und nicht als alter Kaufpreis ausgegeben. Mehrdeutige Alt-/Neu-Zuordnungen werden nicht geraten.

Kontrollfall aus dem Screenshot: MineBot #90270 → Apertum Miner #46489, Tx `0x47fa2a889a34e99208931afaaca0a1e1c45016e3b20bcc66804473438454c4f1`, Block 14772428.

Nachweis verlangt Erfolg, Methode `0x454b0608`, Upgrade-Contract `0x8c45ebe231b225c7179f5bb2bc19b008a1c01302`, einen alten MineBot-Ausgang und einen neuen Apertum-Miner-Mint an denselben Transaktionsabsender. Bei mehreren Alt-/Neu-NFTs wird keine Zuordnung aus der Reihenfolge angenommen.

Der alte Kaufpreis wird zuerst aus bereits vorhandener privater Kauf-Evidenz übernommen, sonst aus der belegten Transfer-/Kaufhistorie des alten NFTs vor dem Upgrade ermittelt. Gewährung zusätzlicher Rewards oder Vertragszahlungen während des Upgrades ist kein neuer Kaufpreis. Bei einem späteren tatsächlich belegten Kauf des neuen NFTs gilt dessen neue Zahlung. Claims werden nicht umgehängt oder doppelt gezählt. Die vorhandenen Ownership-Daten werden nicht überschrieben.

## Installation und produktiver Test

1. Die enthaltenen Website-Dateien an den jeweiligen Pfaden ersetzen. Voraussetzung ist der bereits installierte Stand 7.33. Für 7.34 sind weder eine neue SQL-Migration noch ein Edge-Function-Deployment nötig.
2. Seite neu laden und bei Bedarf Dashboard → Daten aktualisieren ausführen, damit #46489 im NFT-Bestand erscheint.
3. NFT-Tab öffnen: vorhandene v3-Kauf-Evidenz wird gezielt für Apertum Miner neu geprüft; bei #46489 müssen „Upgrade von #90270“, Upgrade-Tx und übernommener Kaufpreis mit ursprünglichem Datum/Kauf-Tx erscheinen. Ist der alte Kaufpreis nicht belegbar, erscheint „Kaufpreis des alten Bots offen“.
4. DAO1 → Bots / Teamdetails prüfen: der alte Bot bleibt historisch erhalten und trägt „migriert“, der neue Bot zählt als aktueller Bestand. Kaufpreissumme zählt den alten Betrag nur einmal.
5. Seite nochmals laden: die Verknüpfung wird aus dem vorhandenen privaten NFT-Cache wiederhergestellt.

## Technische Prüfung

`node tests/miner-upgrade-regression.mjs` im wallet-tracking-Verzeichnis.

Regressionen: Screenshot-Fakten #90270 → #46489; Erfolg-/Methode-/Contract-/Wallet-/Typ-/Eindeutigkeitsprüfung; ursprünglicher Betrag/Datum/Tx; keine Übernahme zusätzlicher Upgrade-Zahlungen; fehlender Preis bleibt offen; historische Kaufkette; spätere Wallet-Transfers und echter späterer Kauf; Nutzertrennung; Reload aus persistierter Evidenz; Summen ohne Doppelzählung; NFT-/DAO-HTML und gezielte Resolver-Invalidierung.

Explorer-API-Zugriff war hier nicht verfügbar (HTTP 403). Die Tests verwenden synthetische API-Objekte mit den belegten Screenshot-Fakten; produktiver Supabase-/Browsertest bleibt erforderlich. Monica-Realtest (DAO1 #21044, APTMDAO #7803, 9 Mining-Bots, 1 Trading-Bot) konnte hier ebenfalls nicht ausgeführt werden.

## Daten und Caches

Keine neuen Tabellen. Upgrade-Verknüpfung, ursprüngliche Kaufprovenienz und separate Upgrade-Zahlungskandidaten liegen in `nft_cache.nfts[].purchaseEvidence`; vorhandene User-RLS und Verschlüsselungsregeln für die jeweiligen Quellen bleiben bestehen. Öffentlich abgeleitete Transferdaten werden über bestehende Cache-Pfade geladen. Der ursprüngliche Kaufpreis erhält einen NFT-bezogenen Kostenbasis-Schlüssel, der Alt-/Neu-NFT in Summen verbindet. Nur der neue Miner-Contract benötigt Resolver v4; unveränderte v3-Evidenz anderer NFTs bleibt cachefähig. Ein offener Upgrade-Preis wird erneut übernommen, sobald die alte Kauf-Evidenz später vorhanden ist.
