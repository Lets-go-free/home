# WalletTracking – verbindlicher Entwicklungsstatus und offene Punkte

**Dokumentationsstand:** 08.11.2026 11:16:25 CET (Europe/Zurich) · **aktuelle sichtbare App-Phase:** 8.02, Build 20261108-111625.

Diese Datei ist die zusammengeführte Arbeits- und Übergabeübersicht. Status hier beschreibt belegte Live-Tests, nicht eine pauschale Produktivfreigabe. Bestehende Fach- und Release-Dokumentation bleibt gültig.

## DAO1/APTMDAO – zuletzt live bestätigt

- Test-Wallet: `0x239c5822a0d2A67E629D7A3b5C8180721E228B47` auf Apertum; Datenbank mit 395 Claim-Kandidaten.
- Historischer Transaktionsscan abgeschlossen (gespeicherter oberer Block 15'670'355); Token-Flows und Referral-wUSDT-Scans ebenfalls als `complete` gespeichert. Checkpoints, Cursorfortsetzung, Idempotenz und inkrementeller Delta-Modus manuell getestet. `complete` bezieht sich auf die Explorer-Paginierung, **nicht** auf unabhängig verifizierte Vollständigkeit bis zum aktuellen Chain-Tip.
- 388 vorhandene Claims: `canonical_existing_verified=true`; darunter 284 und nach präzisem Dezimalvergleich weitere 4 per Guard gekennzeichnet. Zweiter Aufruf: `newlyMarked=0`, `markedAfter=388`. Native Auszahlungen stimmen mit dem kanonisch gespeicherten Betrag innerhalb 0.000000000000001 APTM überein; keine Neuanlage von Reward-Buchungen.
- 4 frühe positive APTM-Claims bei Blöcken 60'731, 72'665, 81'698, 81'700: `audit_classification=unpriced_before_exact_anchor` und `audit_classified_at` **dauerhaft in Supabase verifiziert**. Zentraler exakter Preisanker beginnt erst bei Block 88'356. Kein Ersatzkurs, USD-Wert bleibt `NULL`; Klassifikation ist unabhängig von Auszahlungs-Verifikation.
- 3 Transaktionen mit Reward=0, Methode `0x86bb8f37`, Erfolg `status=ok`, aber **0 erfasste Asset-Flows**: Blöcke 403'915 (Bot 37174), 10'791'488 (Bot 10295), 11'254'937 (Bot 10294). **Nicht** als on-chain sicher auszahlungslos behaupten: Speicherung/Abdeckung der Flows zuerst prüfen.
- Rohdaten-Import und Klassifikation liefen kontrolliert/manuell; produktiver DAO-Rewards-Worker und Cron bleiben deaktiviert (`DAO_REWARD_ENABLE_LIVE_WORKER=false`). Kein vollständiger End-to-End-Live-Test neuer Rewards/Referral/Bot-Zuordnung.

## Phase 8.02 – implementiert, Live-Abnahme offen

- Allgemeiner Auszahlungsstatus `no_payout_evidence` für beide Claim-Selektoren (DAO1/APTMDAO), strikt getrennt von NFT-Besitz, `canonical_existing_verified` und `audit_classification`. Kein Backfill der drei bekannten Fälle ohne Einzelprüfung.
- Vor negativer Einstufung: TX-Hash/Block/Selector/Erfolg/Absender/Empfänger gegen TX-Details prüfen; sämtliche transaktionsbezogenen Token- und Internal-Seiten lesen. Maximal zehn Seiten je Strom / 5'000 Einträge; API-Fehler, ungültige oder fehlende Pagination, unbekannte Token oder unklare Internals bleiben `needs_review`. Auch fremde/proxyseitige positive Eingänge und widersprechende persistierte Flows verhindern negative Klassifikation.
- Prüfabdeckung und zehn letzte Versuche dauerhaft am Kandidaten gespeichert. `needs_review` und `no_payout_evidence` nach mindestens 24 Stunden erneut prüfbar, neue `pending` zuerst; insgesamt maximal 20 pro Worker-Aufruf. Spätere belastbare persistierte Zahlungen können `verified` ergeben; unvollständige Nachprüfung führt zurück zu `needs_review`. Verifizierte/kanonisch markierte Kandidaten werden geschützt, Row-Lock und Zeitstempelvergleich verhindern veraltete Überschreibungen.
- Auszahlungsprüfung funktioniert unabhängig vom NFT-Prüfstatus. Noch offene `pending`-Payouts halten die inkrementelle Queue auf `partial`, damit der nächste Abschnitt am selben Tag bearbeitbar bleibt. `staged` ist weiterhin kein abgeschlossener Reward-Job.
- Kontrollierter Admin-Testmodus für maximal drei Null-Reward-TXs der fest hinterlegten Testwallet vorbereitet. Lokal synthetische Fixtures der drei bekannten Blöcke geprüft; **keine neue Aussage über deren Live-Status**. Vollständigkeit gilt für Explorer-Indexdaten, nicht als unabhängig verifizierter On-Chain-Negativnachweis.
- Neue SQL-Migration: `20261108111030_dao_no_payout_evidence_802.sql`; 131 lokale DAO-/Reward-Tests einschliesslich PostgreSQL-Ausführung bestanden. Keine neue Supabase-/Explorer-Live-Prüfung. DAO-Cron und `DAO_REWARD_ENABLE_LIVE_WORKER` bleiben deaktiviert.

## Unmittelbar nächster Schritt

Nur die neue 8.02-Migration vollständig im Supabase SQL Editor ausführen (atomare DDL-Transaktion, keine SELECT-Resultsets). Danach Rückmeldung auswerten; weitere Test-/Deploy-Anweisung erst in der nächsten Antwort. Nicht die alten Migrationen erneut ausführen.

## Danach weiter offen – DAO-Reward-Pipeline

- Drei Null-Reward-TXs mit dem vorbereiteten begrenzten Admin-Modus tatsächlich prüfen; erwartete `no_payout_evidence` nur bei vollständigem Belegabruf, sonst `needs_review`. Wiederholungs-/Revalidierungsresultate live verifizieren.
- Einen neuen DAO1/APTMDAO-Claim Ende-zu-Ende durch den serverseitigen inkrementellen Job prüfen: Wallet/Owner/NFT/Bot-Identität, native APTM und relevante Token (alte wAPTM, neue wUSDT/wUSDC), separate Referral-wUSDT-Evidenz, zentrale historische Preisermittlung, Dublettensicherheit, User-Isolation, Teilfehler und vollständige Queue-Abarbeitung.
- Fehlende zukünftige Flows aus gezieltem TX-Nachweis kontrolliert in den bestehenden kanonischen Import übernehmen; 8.02 protokolliert solche positiven Funde zunächst als Review, statt neue Beträge zu erfinden. Atomare kanonische Verarbeitung, feste bestätigte Blockfenster/unabhängige Coverage, faire Wiederholungssteuerung und verbleibende Preis-/Referral-Schritte fehlen weiterhin.
- Erst nach bestandenem manuellen/produktnahen Test DAO-Cron separat vom Wallet-Bestandsjob aktivieren. Geplante Fenster Schweizer Zeit: Bestände 01:00–04:00, DAO 04:05–05:30, TLN/VOW 05:35–07:00. Keine stillschweigende Aktivierung.

## Weitere offene WalletTracking-Aufgaben (nach Themen)

### Rewards / TLN / VOW
- Separaten **täglichen, inkrementellen TLN/VOW-Reward-Job** entwickeln; Staking-, Referral- und Bonus-Evidenz sowie historische Zuordnung und partieller Wiederanlauf. Rewards anhand TX-Zeit und bestehender Auswertung, **keine Reward-Snapshots**.
- Liste **letzte Stakings** über sämtliche Wallets (unabhängig vom Team), Token-Paare gemischt, Paar explizit anzeigen; Laufzeit und Ablaufdatum für diese Liste nicht erforderlich.
- Kompakte Staking-Übersicht mit Start/Ablauf/Unstake/Top-up/LP und zugeordneten Rewards sowie gesondert „abgelaufen, noch nicht unstaked“.
- VOW/v$-Handel (BSC/ETH, 24 h/7 d/30 d) und 30-Minuten-Job/Cache weiterhin End-to-End und Aktualisierungszeitpunkte überprüfen; ETH-v$-Preis darf abweichend sein, **kein Stablecoin-Ersatzpfad**.
- XRPL-Unterstützung über XRP-Bestand hinaus: Trustlines/issued currencies via `account_lines` offen.

### Wallet-Bestände / Betrieb
- Nächtlichen Wallet-Bestandsjob inklusive Fehlertransparenz, Retry, vollständigen Snapshots und Mehrbenutzer-/Cold-Start-Fällen produktiv nachtesten (früher 5 Wallets veraltet/fehlende Snapshots). `wallet_daily_balance_history` und Snapshot-Retention prüfen: letzte 7 Tage täglich, Tage 8–365 wöchentlich, ältere monatlich; manuelle Snapshots dauerhaft und unverändert.
- Fresh-User/Wallet: initiale TLN/VOW-Discovery serverseitig/kontrolliert statt grossem Browser-Scan; rein on-chain globale Caches wiederverwenden.
- Server-Jobs/Preis- und Cache-Synchronisation über Laufgrenzen, Fehlerfälle und Lösch-/RLS-Szenarien prüfen; Preisfindung muss applikationsweit dieselbe zentrale Logik verwenden.

### Sicherheit / Datenbank / Deployment
- Supabase-Schema/RLS/Functions/Trigger/Grants und historische Migrationen für reproduzierbaren Aufbau als verifizierte Baseline vervollständigen; ausgeführte Migrationen nie löschen. Browser-Tabellen nur bei nachgewiesenem Bedarf in API-exponiertem Schema, interne Jobs/Caches in nicht exponiertem Schema; RLS/User-Isolation und „Alle Daten löschen“ prüfen.
- Google-Login für bestehende Admin-Accounts später kontrolliert verknüpfen (gleiche `auth.users.id`), Admin-Rechte möglichst an UUID statt E-Mail binden; Auth-/Recovery-End-to-End mit weiteren Usern testen.
- **Offener UI-Fehler:** Apple-Passwortmanager findet den WalletTracking-Login in **Chrome auf macOS** nicht, trotz installierter und autorisierter iCloud-Passwörter-Erweiterung und Tests mit `letsgofree.me` sowie `www.letsgofree.me`; Safari funktioniert. Browser-/Formular-/Extension-Kombination später gezielt prüfen; nicht als behoben dokumentieren.
- Alle Wallets-/Nutzerfilter, Preisdezimalstellen, Dark Mode DAO-Tabellen, technische orange Admin-Chain-Spalten, Löschung auf „Meine Wallets“ belassen und Aufgaben-/Export-/Admin-Oberflächen beim nächsten Gesamtretest prüfen.

## Verbindliche Arbeitsregeln

- App-sichtbare Phase/Build **alleinige** Release-Version. ZIP nur geänderte/neue Dateien mit `wallet-tracking/`-Pfaden, Name `wt-update-<Phase>-<YYYYMMDD-HHMMSS>.zip` mit **echter Schweizer Zeit**. SQL-Migration `YYYYMMDDHHMMSS_beschreibung_versionsnummer.sql` mit tatsächlichem 14-stelligem Schweizer Zeitstempel.
- **Pro Antwort immer nur die nächste auszuführende SQL-Abfrage oder den nächsten Test zeigen.** Auf Rückmeldung warten, erst dann Folgeschritt; keine mehrteiligen SQL-Testlisten. Bei mehreren Resultsets ausdrücklich warnen, dass Supabase eventuell nur das letzte prominent zeigt.
- Bestehende, verifizierte Reward-Mengen, zentrale historische Preise, Bot-/NFT-Zuordnung und Bestandsdaten nicht ohne belastbaren Beleg überschreiben. Kein automatischer Cron ohne Abnahmetests. Jede Release-Dokumentation und diese Statusdatei nachführen.
- Ein ausgeteiltes Dokumentations-ZIP aktualisiert **nicht** automatisch GitHub oder Supabase; es muss eingespielt und committed werden.
