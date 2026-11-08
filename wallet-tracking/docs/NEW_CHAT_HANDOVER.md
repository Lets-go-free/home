# Übergabe WalletTracking

Phase 8.04 · Build 20261108-130239. Live-Nachtrag 08.11.2026 13:13:35 CET. Zuerst README.md, docs/PROJECT_STATUS_OPEN_ITEMS.md und docs/releases/8.04-dao-pending-native-payouts.md lesen.

Historischer Prüfbestand mit 395 Kandidaten: 388 kanonisch vorhandene Claims gekennzeichnet. Drei Null-Reward-TXs (Blöcke 403915, 10791488, 11254937) dauerhaft und erneut als no_payout_evidence geprüft; vollständige Explorer-Coverage mit 17/7/7 internen Aufrufen, kein erkennbarer Eingang. Kein endgültiges On-Chain-Nullurteil.

8.04-Migration und index.ts-Deployment erfolgreich. Die vier frühen positiven Claims in Blöcken 60731, 72665, 81698, 81700 sind jetzt payout_status=verified. Rawmengen 4650944472418586884 zweimal / 4031915382788697322 zweimal; native, 18 Decimals. Separater SQL-Test bestätigt exakte Persistenz, je einen Protokolleintrag, audit_classification=unpriced_before_exact_anchor, canonical_existing_verified=false und USD NULL. Wiederholung checked=0, results leer, pendingPayoutChecks=0, keine zusätzlichen Protokolleinträge. Mengen/Preise/NFTs nicht überschrieben. Fachliche Preis-Ausnahme und Payout-Verifikation bleiben getrennt.

151 lokale DAO-/Reward-Tests inkl. PostgreSQL bestanden. Historische Sonderfälle müssen nicht nochmals neu klassifiziert werden. pendingPayoutChecks=0 bezieht sich auf die zusätzliche Prüfung ausserhalb bereits kanonisch markierter Fälle; kein Beweis vollständiger Owner-/Bot-/Referral-/Queue-Verarbeitung.

Nächster Schwerpunkt 8.05: vorhandenen serverseitigen inkrementellen Prozess auf fehlende Schritte für einen neuen Claim analysieren, anschliessend konkrete Ergänzung und kontrollierten manuellen End-to-End-Lauf entwickeln. Import/Checkpoint, Wallet-/Owner-/Bot-Zuordnung, native/Token-Payouts, kanonische Neuanlage/Deduplication und zentrale historische Bewertung müssen zusammen funktionieren. Keine zweite Preislogik, keine Reward-Snapshots. Vollständige Referral-/Token-/Queue-Verarbeitung und echter automatischer 24h-Recheck bleiben offen; TLN/VOW-Job separat offen.

DAO_REWARD_ENABLE_LIVE_WORKER=false, kein DAO-Cron. Nur nächste SQL-Abfrage bzw. nächsten Test auf einmal; nach Analyse erst auf los implementieren, kleine Update-ZIPs, echte Schweizer Zeit, alle relevanten Dokumentationsstellen nachführen. Chrome/Apple-Passwortmanager offen.
