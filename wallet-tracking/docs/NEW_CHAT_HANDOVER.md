# Übergabe WalletTracking – neuer Chat

Wir setzen **WalletTracking Phase 8.01 · Build 20261108-105729** fort. Bitte zuerst `README.md`, `docs/PROJECT_STATUS_OPEN_ITEMS.md` und die DAO-Release-Dokumentation lesen. Die Statusdatei bündelt den live bestätigten Stand und die offenen Aufgaben.

**DAO1/APTMDAO:** Der historische Einzel-Wallet-Import ist abgeschlossen. Von 395 Claim-Kandidaten sind **388** mit passendem nativen Auszahlungsnachweis als bestehende Claims gekennzeichnet, inklusive geprüftem Wiederholungsschutz. **Vier** frühere positive APTM-Claims sind dauerhaft als `unpriced_before_exact_anchor` erfasst (vor zentralem Preisanker Block 88'356, USD `NULL`). **Drei** erfolgreiche Null-Reward-TXs haben keine erfassten Asset-Flows; das ist noch kein endgültiger On-Chain-Negativbeweis.

**Als Nächstes:** Phase 8.02: `no_payout_evidence` als allgemeinen, dauerhaft nutzbaren und revalidierbaren Status für zukünftige DAO1/APTMDAO-Claims entwickeln, strikt getrennt von der USD-Preis-Klassifizierung. Die drei Null-Reward-TXs als Tests nutzen; keine kanonischen Beträge, Preise, Wallets oder NFT-Zuordnungen überschreiben. Danach inkrementelle End-to-End-Reward-Verarbeitung (Claims/Referral/Bot-Ownership) prüfen. `DAO_REWARD_ENABLE_LIVE_WORKER=false`, DAO-Cron bleibt aus. TLN/VOW-Reward-Job weiter offen.

**Arbeitsregeln:** Nur geänderte Dateien im `wallet-tracking/`-ZIP; Release- und Migrationsnamen mit echtem Schweizer Zeitstempel; sichtbare Phase/Build ist verbindlich. Dokumentation/offene Aufgaben fortschreiben. **Immer nur die nächste SQL-Abfrage oder den nächsten Test auf einmal senden.** Apple-Passwortmanager in Chrome/macOS bleibt ein offener Fehler (Safari funktioniert).
