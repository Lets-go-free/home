# Übergabe WalletTracking

Code: **Phase 8.04 · Build 20261108-130239**. Zuerst README.md, docs/PROJECT_STATUS_OPEN_ITEMS.md und docs/releases/8.04-dao-pending-native-payouts.md lesen.

Letzter Live-Stand unverändert: historischer Import mit 395 Kandidaten, 388 kanonisch gekennzeichnet. Drei Null-Reward-TXs dauerhaft und erneut als no_payout_evidence geprüft (17/7/7 interne Aufrufe, kein erkennbarer Eingang). Vier verbleibende payout_status=pending sind die frühen positiven Claims in Blöcken 60731, 72665, 81698, 81700; audit_classification=unpriced_before_exact_anchor, USD NULL, Mengen erhalten. Noch keine unabhängige Payout-Verifikation für diese vier.

8.04 implementiert kontrollierten Admin-Modus check-pending-native-payouts-test-wallet. Höchstens vier pending-Kandidaten, serverseitig festgelegte Testwallet, Admin-JWT + Test-Import-Flag + deaktivierter Live-Worker. SQL prüft native vorhandene Zahlungsbelege und exakten Betrag unabhängig von USD, 1'000 Wei Toleranz, keine rundende Division. Keine Reward-/Preis-/NFT-/canonical_existing-Änderungen. Unklare Fälle werden needs_review; verified/negative/kanonisch markierte Fälle ausgeschlossen, wiederholter Aufruf ohne Rest ergibt checked=0. Keine Gesamtpipeline und kein automatischer Cron.

Nächster Schritt nur SQL-Migration 20261108125822_dao_pending_native_payout_checks_804.sql ausführen. Erst nach Rückmeldung vorhandene Edge Function index.ts aktualisieren/deployen; payout-coverage.ts aus 8.03 beibehalten. Danach genau einen manuellen Test anleiten. 151 lokale DAO-/Reward-Tests inkl. PostgreSQL bestanden; kein 8.04-Live-Test bisher.

DAO_REWARD_ENABLE_LIVE_WORKER=false, DAO-Cron aus. Vollständige inkrementelle Claim-/Referral-/Bot-/Preis-Pipeline, echter 24h-Recheck und TLN/VOW-Job bleiben offen; Chrome/Apple-Passwortmanager offen. Pro Antwort nur nächste SQL-Abfrage oder nächsten Test, kleine ZIPs, echte Schweizer Zeit, Dokumentation nachführen.
