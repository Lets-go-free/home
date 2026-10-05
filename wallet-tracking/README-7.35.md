# WalletTracking · Phase 7.35

Stand: 05.10.2026 04:13:47 CEST · Build 20261005-041347

## Änderungen

- EVM-RPC-Einzelreads und Batches: höchstens drei Versuche bei Timeout, Netzwerkfehler, HTTP 408/429/5xx; Pausen 500/1500 ms und frischer Timeout pro Versuch. Sonstige HTTP- oder JSON-RPC-Fachfehler werden nicht wiederholt. Kein Wechsel zu einem unkonfigurierten Ersatzanbieter.
- Fehlgeschlagene Bestandsabrufe erhalten vorhandene gültige Werte und kennzeichnen sie als veraltet. Ohne gültigen Vorbestand bleibt ein Fehler sichtbar.
- Hinweise enthalten Wallet, Chain und Abrufart; NFT-Fehler verwenden die Chain aus dem Detailfehler. Bestands-Datenstand wird pro Chain angezeigt.
- Fehlgeschlagene Refresh-States speichern last_result=failed im vorhandenen Textfeld. Erfolgsdatum, Cursor und Datenversion bleiben erhalten. Das Tageslimit/Activity-Abkürzungen verhindern keinen erneuten Versuch. Projekt-/NFT-Fehler erhalten ebenfalls Fehlermarker.
- Gesamtabschluss erst nach DAO1/APTMDAO-Delta und Dashboard-Summaries. Gemeldete DAO-Teilfehler werden gesammelt. Neuer vollständiger Snapshot nur nach fehlerfreiem Gesamtprozess; Button-Freigabe auch bei unerwartetem Fehler.
- Snapshot-Ersetzung schreibt zuerst den neuen vollständigen Bestand. Der alte Cache wird erst nach erfolgreichem Schreiben entfernt; Schreibfehler werden im Gesamtstatus gemeldet.
- Hilfe, Systemübersicht und Ideen/Umbau aktualisiert.

## Installation

Nur die Dateien dieses ZIPs im bestehenden wallet-tracking-Verzeichnis ersetzen. Seite neu laden und „Daten aktualisieren“ starten. Keine neue SQL-Migration und kein Edge-Function-Deployment für 7.35 erforderlich. Frühere notwendige Deployments (insbesondere wallet-private aus 7.33) bleiben Voraussetzung.

## Prüfung

Lokale Regression mit simulierten Antworten: 529-Erholung, nicht wiederholtes 401, Timeout-Abbruch nach drei Versuchen, Batch-Reihenfolge, Cache-Erhalt und Erholung, Fehlermarker/Cursor, erneuter automatischer Abruf trotz fehlender Aktivität, DAO-Fehler und Abschluss-/Snapshot-Reihenfolge. Bestehende Mining-Upgrade-/Alias-Regressionsprüfungen und JS-Syntax prüfen. Live-Provider und produktiver Supabase-Lauf hier nicht getestet; Monica-Kontrollwallet und Alt-/Neuimport nach Installation weiterhin offen.

Ein RPC-Timeout kann durch Wiederholungen länger dauern (Einzelread bis etwa 47 Sekunden, Batch bis etwa 62 Sekunden). Kein unbegrenzter Wiederholungslauf.
