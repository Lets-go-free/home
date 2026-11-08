# WalletTracking – verbindlicher Entwicklungsstatus und offene Punkte

**Dokumentationsstand:** 08.11.2026 12:41:04 CET (Europe/Zurich) · **aktuelle sichtbare App-Phase:** 8.03, Build 20261108-124104.

Diese Datei ist die zusammengeführte Arbeits- und Übergabeübersicht. Status hier beschreibt belegte Live-Tests, nicht eine pauschale Produktivfreigabe. Bestehende Fach- und Release-Dokumentation bleibt gültig.

## DAO1/APTMDAO – zuletzt live bestätigt

- Test-Wallet: `0x239c5822a0d2A67E629D7A3b5C8180721E228B47` auf Apertum; Datenbank mit 395 Claim-Kandidaten.
- Historischer Transaktionsscan abgeschlossen (gespeicherter oberer Block 15'670'355); Token-Flows und Referral-wUSDT-Scans ebenfalls als `complete` gespeichert. Checkpoints, Cursorfortsetzung, Idempotenz und inkrementeller Delta-Modus manuell getestet. `complete` bezieht sich auf die Explorer-Paginierung, **nicht** auf unabhängig verifizierte Vollständigkeit bis zum aktuellen Chain-Tip.
- 388 vorhandene Claims: `canonical_existing_verified=true`; darunter 284 und nach präzisem Dezimalvergleich weitere 4 per Guard gekennzeichnet. Zweiter Aufruf: `newlyMarked=0`, `markedAfter=388`. Native Auszahlungen stimmen mit dem kanonisch gespeicherten Betrag innerhalb 0.000000000000001 APTM überein; keine Neuanlage von Reward-Buchungen.
- 4 frühe positive APTM-Claims bei Blöcken 60'731, 72'665, 81'698, 81'700: `audit_classification=unpriced_before_exact_anchor` und `audit_classified_at` **dauerhaft in Supabase verifiziert**. Zentraler exakter Preisanker beginnt erst bei Block 88'356. Kein Ersatzkurs, USD-Wert bleibt `NULL`; Klassifikation ist unabhängig von Auszahlungs-Verifikation.
- 3 Transaktionen mit Reward=0, Methode `0x86bb8f37`, Erfolg `status=ok`, aber **0 erfasste Asset-Flows**: Blöcke 403'915 (Bot 37174), 10'791'488 (Bot 10295), 11'254'937 (Bot 10294). **Nicht** als on-chain sicher auszahlungslos behaupten: Speicherung/Abdeckung der Flows zuerst prüfen.
- Rohdaten-Import und Klassifikation liefen kontrolliert/manuell; produktiver DAO-Rewards-Worker und Cron bleiben deaktiviert (`DAO_REWARD_ENABLE_LIVE_WORKER=false`). Kein vollständiger End-to-End-Live-Test neuer Rewards/Referral/Bot-Zuordnung.

## Phase 8.03 – Internal-TX-Erfolgsprüfung korrigiert

- 8.02-Migration durch User erfolgreich ausgeführt, Worker mit beiden Dateien deployt. Manueller Test `recheck-zero-payout-test-wallet`: 3 `needs_review`, 0 `verified`, 0 `no_payout_evidence`, 4 weitere pending-Payouts. Bei allen drei Prüfungen Abbruch am ersten internen Aufruf mit `internal-outcome-incomplete`.
- Ursache anhand der vom User gelieferten vollständigen Explorer-Antwort für TX `0x62864a66dd096ddd6941a1f9c600229e52b1f10a45f93b632bb9755a3b16cbd2` belegt: 17 Aufrufe, jeweils `success=true`, `error=null`, `value=0`, kein Feld `status`, `next_page_params=null`. Der 8.02-Parser verlangte fälschlich zusätzlich einen Erfolgsstatus.
- 8.03 akzeptiert boolesches `success=true` ohne zusätzlichen `status` oder alternativ einen expliziten Erfolgsstatus. Fehler, `success=false`, ungültige/unklare Erfolgswerte und widersprüchliche Statusfelder bleiben `needs_review`. Positiver nativer Eingang verhindert weiterhin negative Klassifikation.
- Sechs neue Regressionstests; insgesamt 137 lokale DAO-/Reward-Tests inkl. PostgreSQL bestanden. Echte Internal-TX-Antwort als Fixture erhalten; umgebende TX-/Token-Responses im Test kontrolliert, kein neuer unabhängiger Live-End-to-End-Nachweis.
- Änderung nur im Hilfsmodul `payout-coverage.ts`; keine Migration und kein geänderter `index.ts`. Tatsächlicher 8.03-Live-Status aller drei Fälle offen. DAO-Cron und Live-Worker bleiben aus.

## Phase 8.02 – Basis implementiert, vollständige Live-Abnahme offen

- Allgemeiner Auszahlungsstatus `no_payout_evidence` für beide Claim-Selektoren (DAO1/APTMDAO), strikt getrennt von NFT-Besitz, `canonical_existing_verified` und `audit_classification`. Kein Backfill der drei bekannten Fälle ohne Einzelprüfung.
- Vor negativer Einstufung: TX-Hash/Block/Selector/Erfolg/Absender/Empfänger gegen TX-Details prüfen; sämtliche transaktionsbezogenen Token- und Internal-Seiten lesen. Maximal zehn Seiten je Strom / 5'000 Einträge; API-Fehler, ungültige oder fehlende Pagination, unbekannte Token oder unklare Internals bleiben `needs_review`. Auch fremde/proxyseitige positive Eingänge und widersprechende persistierte Flows verhindern negative Klassifikation.
- Prüfabdeckung und zehn letzte Versuche dauerhaft am Kandidaten gespeichert. `needs_review` und `no_payout_evidence` nach mindestens 24 Stunden erneut prüfbar, neue `pending` zuerst; insgesamt maximal 20 pro Worker-Aufruf. Spätere belastbare persistierte Zahlungen können `verified` ergeben; unvollständige Nachprüfung führt zurück zu `needs_review`. Verifizierte/kanonisch markierte Kandidaten werden geschützt, Row-Lock und Zeitstempelvergleich verhindern veraltete Überschreibungen.
- Auszahlungsprüfung funktioniert unabhängig vom NFT-Prüfstatus. Noch offene `pending`-Payouts halten die inkrementelle Queue auf `partial`, damit der nächste Abschnitt am selben Tag bearbeitbar bleibt. `staged` ist weiterhin kein abgeschlossener Reward-Job.
- Kontrollierter Admin-Testmodus für maximal drei Null-Reward-TXs der fest hinterlegten Testwallet vorbereitet. Lokal synthetische Fixtures der drei bekannten Blöcke geprüft; **keine neue Aussage über deren Live-Status**. Vollständigkeit gilt für Explorer-Indexdaten, nicht als unabhängig verifizierter On-Chain-Negativnachweis.
- 8.02-Migration `20261108111030_dao_no_payout_evidence_802.sql` erfolgreich live ausgeführt; der erste manuelle Drei-TX-Test ist oben unter 8.03 dokumentiert. Die damaligen 131 lokalen Tests sind durch insgesamt 137 Tests in 8.03 ergänzt. DAO-Cron und `DAO_REWARD_ENABLE_LIVE_WORKER` bleiben deaktiviert.

## Unmittelbar nächster Schritt

In der bestehenden Edge Function `dao-reward-refresh` nur die vorhandene Datei `payout-coverage.ts` durch die ZIP-Version ersetzen und deployen. Keine neue Edge Function und keine SQL-Ausführung; `index.ts` bleibt auf 8.02. Nach Deployment Rückmeldung abwarten, erst danach erneute Drei-TX-Prüfung anleiten. DAO-Cron bleibt aus.

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
