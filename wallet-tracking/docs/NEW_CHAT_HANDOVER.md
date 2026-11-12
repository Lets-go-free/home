# WalletTracking – Übergabe für neuen Chat (DAO-Reward-Job)

**Stand:** 12.11.2026 13:17:11 CET · **installierte App:** Phase 8.21, Build `20261112-100513` · **DAO-Live-Worker / automatischer DAO-Cron: deaktiviert**.

Im neuen Chat zuerst diese Datei und `docs/PROJECT_STATUS_OPEN_ITEMS.md` lesen. Die neuesten Erkenntnisse sind die Live-Nachträge zu 8.21. Die folgenden älteren Abschnitte gelten als historische Projektinformationen und dürfen nicht als aktueller DAO-Teststand missverstanden werden.

## Was zuletzt geschehen ist

## Live-Nachtrag 8.21 · 12.11.2026 13:17:11 CET · DAO-Jobtests (12.11.2026)

**Verifiziert in Supabase / Edge Function (nicht allgemeine Produktionsfreigabe):**
- Manuelle Aktualisierung kann im UI nur **für alle Wallets** gestartet werden; Test für alle Wallets durchgeführt. Danach `dao_bot_claim_reviews`: genau **25 `confirmed` auf 2 Wallets**, 25 unterschiedliche `(wallet_id,tx_hash)`; nach serverseitigem Batch per LEFT JOIN weiterhin **16 + 9**, `fehlende_transaktionsdaten=0`, `mit_nft_zuordnung=0`. Kein erkennbares Duplikat **in diesen 25 Einträgen**. Nicht getestet: komplett neue Wallet mit echten Nachzahlungen, die automatisch als neue Prüfkandidaten erscheint.
- Auszahlungsprovenienz: wAPTM `0x110ac02ba3384bc055c13a87766049a74517beda`, Absender `0x6d0539de11b95e18cb202a55098e3854b0313022`; alte MineBot-NFTs `0xa1b761890c36e356f49f9df8d495fcffa76857ad`, 16 + 9 historische individuelle NFTs. NFT-Migrationen an `0x1ad197d8f5ac4731d9fb3fe7a8ff0c6a21f84d0c`. Beispiel-Auszahlung On-Chain: ausschliesslich ERC-20-`transfer`, kein NFT-Identifier in Logs/Raw Trace; Einzelzuordnung nicht behaupten. Die Aussage „Nachzahlung für alte MineBots“ ist aus Anzahl/Zeitfolge/Nutzerkontext gut begründet, keine on-chain gesicherte 1:1-Bot-ID.
- Queue-RPC `wallettracking_dao_reward_claim_v2(p_day)` legt bei **jedem Aufruf** für alle verschlüsselten EVM-Wallets des Tages Queue-Einträge `ON CONFLICT DO NOTHING` an. Neue Benutzer/Wallets benötigen **keinen separaten Registrierungshook**; Aufnahme nur bei tatsächlichem Jobaufruf, nicht während deaktiviertem Cron. 8 Schritte und 3 Fehlversuche pro Wallet/Tag; 4-Minuten-Lease.
- `project_scan_state` am 11.11.: 12 Wallets, bei TX 4 `complete`, 5 `empty_verified`, 3 `partial`; bei Flows 6 `complete`, 5 `empty_verified`, 1 `partial`. Fünf leere Wallets je zwei Verarbeitungsschritte, am 11.11. `completed`, kein Fehler. `empty_verified` mit Block 0 wird beim nächsten Tag als `initial-history` wieder geprüft, mögliche **Effizienzoptimierung**, aber kein nachgewiesener Datenfehler.
- 12.11., erster `cron-multi-wallet-one`: `e8b5c835-0db2-4449-bbee-258e28b42bbb` → `staged`, 10 TX beobachtet, 1 Flow, 10 Kandidaten beobachtet, keine kanonischen Claims, keine Fehler; `Observed` bedeutet nicht neue Einträge.
- 12.11., drei manuelle `cron-multi-wallet-batch`-Aufrufe à 10 Schritten: **alle drei Batches ok, 0 Fehler, 0 neue kanonische Claims**. Batch 1: 7 staged / 3 partial; Batch 2: 1 staged / 9 partial; Batch 3: 1 staged / 9 partial. Drei historische Scans machten in jedem Durchlauf Fortschritte; `ecbc2543-98fe-4b67-bf24-141c7ff20b15` wurde bei Schritt 6 `staged`. `8b93754f-983d-4693-bafd-53267205a29c` und `8a3c5dc6-0610-482d-a327-3f3ba03db158` endeten jeweils bei Schritt **8 auf `partial`**, Transaktions- bzw. beide Scans noch offen; Checkpoints gespeichert. **Erst am nächsten Schweizer Kalendertag** fortsetzen; nicht zurücksetzen oder Schrittgrenze umgehen.
- `staged` bedeutet **nur Rohdatenimport abgeschlossen**, nicht alle Rewards verifiziert oder Tagesjob insgesamt `completed`. `cron-staged-one` kann einen kanonischen Claim schreiben und wurde in diesen Batch-Tests **nicht ausgeführt**. `DAO_REWARD_ENABLE_LIVE_WORKER` bleibt **aus**, DAO-Cron aus.

**Offene DAO-Prioritäten (verbindlich):**
1. Die zwei `partial`-Wallets am Folgetag mit geschütztem Staging fortsetzen und Vollständigkeit/Checkpointfortschritt auditieren; Status der übrigen Queue-Wallets nach Tageswechsel prüfen.
2. Für sämtliche Wallets **Staged-Kandidaten → kanonische Claims** prüfen: verifizierte positive Payouts, historische NFT-Ownership, richtige Legacy-/New-Miner-Klassifikation, fehlende/Null-Payouts, keine Duplikate, kein Überschreiben existierender Werte. Die früheren 231 Kandidaten / 17 Wei-Präzisionsabweichungen / 164 ergänzten Altclaims in 8.20 bleiben relevant; aktuelle Gesamtzahlen nach Import erneut **lesen**, nicht extrapolieren.
3. Exakte historische USD-Bewertung nach **applikationsweitem** Preisweg; kein nachträglicher Kurs-Fallback, keine Schätzwerte. Null-/unpriced Fälle explizit beibehalten.
4. DAO1 Referral/DID und APTMDAO (ältere und neue Miner, unterschiedliche Claim-Assets) Ende-zu-Ende durchtesten. Der aktuelle Server-Referral-Check ist spezifisch für das bereits bekannte Referral-Wallet; keine globale Fertigmeldung.
5. Neue echte DAO-Wallet mit Legacy-wAPTM-Nachzahlung: sowohl `Daten aktualisieren` (alle Wallets) als auch Server-Staging testen; `pending`-Review bis manuelle Entscheidung, `confirmed` einmal gezählt, `ignored` nicht gezählt. Bei aktuell keiner neuen DAO-Wallet Test **aufgeschoben**, nicht bestanden.
6. Erst danach `cron-staged-preview`, kontrollierte begrenzte Staged-Claim-Probe mit Backup/Audit der kanonischen Werte, Tagesabschluss und vollautomatischen E2E-Ablauf testen. Cron/Live-Worker nur nach ausdrücklicher Freigabe aktivieren.
7. Später Performance: Bei 5 `empty_verified` Wallets bleibt Block 0; wiederholte leere Explorer-Erstprüfung optimieren **ohne Aktivitäten zu übersehen**. Momentan zurückgestellt.

**Arbeitsregeln:** Pro Antwort nur die **eine nächste** ausführbare SQL-Abfrage oder ein Test; auf Nutzerresultat warten. Keine unkontrollierten Datenbank-Updates. SQL-Dateien `YYYYMMDDHHMMSS_beschreibung_version.sql` mit tatsächlichem Schweizer Zeitpunkt; ZIP-Updates nur geänderte Dateien unter `wallet-tracking/`; keine Versionsänderung für diese reine Dokumentationsnachführung.


## Empfohlener nächster einzelner Schritt

Am **nächsten Schweizer Kalendertag** zunächst **eine rein lesende SQL-Abfrage** zur Tagesqueue und zum Checkpoint-Status der zwei `partial`-Wallets ausgeben; danach einen begrenzten `cron-multi-wallet-one` oder `cron-multi-wallet-batch` nur mit bewusster Freigabe durch den Nutzer ausführen. Kein `cron-staged-one` unkontrolliert ausführen, da die kanonische Claim-Daten ändern kann. Bei einer Fortsetzung am selben Tag werden Schritt 8/8 nicht erneut ausgewählt.

## Weitere Projekt-TODOs ausserhalb DAO (nicht erledigt)

- VOW: zukünftiger Burn-Tab (vUSD/v$; 24h / 7 Tage / 30 Tage / gesamt; ETH→BSC-Bridging darf nicht als Burn gezählt werden). Erst nach DAO.
- VOW: Liste letzter Stakings aller Wallets und Tokenpaare, ohne Laufzeit/Ablaufdatum.
- Login: iCloud-Passwörter-Erweiterung in Chrome auf macOS bietet WalletTracking-Login nicht an; zurückgestellt.
- XRPL: issued currencies / Trustlines via `account_lines` später; aktuell nur native XRP.
- Weitere ältere offene Aufgaben im zentralen Statusdokument, insbesondere Preis- und Datenqualitätsprüfungen.

---

## Historische Übergabe (älterer Stand, zur Orientierung)

# Übergabe WalletTracking

Phase 8.08 · Build 20261108-224554 · 08.11.2026 22:45:54 CET

Zuerst README.md, docs/PROJECT_STATUS_OPEN_ITEMS.md und docs/releases/8.08-cross-chain-token-metadata.md vollständig lesen.

8.08 erweitert technische Metadaten auf alle zwölf aktuell unterstützten Chains und eigene sichere Token. Gemeinsame neue Edge Function token-metadata für Browser, DAO-Claim-Pfad und täglichen Bestandsjob. Globale öffentliche Contract-/Mint-Metadaten liegen in wallettracking_internal.token_metadata (nicht über die Data API exponiert, RLS aktiv, keine Client-Tabellenrechte). Keine User-ID, Wallet-Adresse oder private Safe-Token-Bezeichnung in diesem Cache. Bekannte Masterwerte in predefined_tokens werden gespiegelt; nichtleere technische Werte, Namen und Bezeichnungen bleiben geschützt. Persönliche Anzeige- und Summary-Dezimalstellen bleiben separat bei safe_tokens und werden nur für die eigene Liste geladen.

## Abruf und Wiederverwendung

- Neue Funktion token-metadata besteht aus index.ts und metadata.ts im selben Funktionsverzeichnis. resolve benötigt User-JWT oder den bestehenden serverseitigen Service-Key. Der Request liefert nur Chain/Adresse; technische Werte, Quelle und fremde User-IDs aus dem Request werden ignoriert. Historischer Block nur bei internem Service-Aufruf zulässig. Keine Preise, Rewards, Wallet-Entschlüsselung, Scan-Cursor oder Queue-Schreibvorgänge.
- EVM: konfigurierte RPC-Chain-ID prüfen, decimals() strikt als 32-Byte-ABI-Wert auswerten, 0–36 zulässig. Name/Symbol optional (String oder bytes32), kein Symbol als Identitätsbeweis. Vorhandene gültige Werte werden wiederverwendet; ein fehlender Wert wird nie als 18 geraten. Archive-/Alchemy-Endpunkt nur bei vorübergehend fehlendem RPC, niemals zur Überdeckung einer falschen Chain oder widersprüchlichen Antwort. Bereits konfigurierte projektweite Alchemy-Secrets wiederverwenden.
- Apertum: Explorer-Token-Metadaten zuerst, Antwortadresse/Token-Typ soweit geliefert prüfen; bei fehlenden Daten EVM-RPC. Zwölf Token/LPs mit 18 und unveränderte Anzeige-Werte sind aus 8.07 live bestätigt. Die alte 8.07-Apertum-Adminroute bleibt kompatibel; der neue DAO-Claim-Pfad verwendet den gemeinsamen Dienst. Aktuelle Stammdaten und zentraler Cache werden vor Wiederverwendung auf Widersprüche geprüft.
- Solana: konfigurierte RPC bzw. Alchemy-Archive-Konfiguration (bei leerem rpc_url) verwenden, getAccountInfo/jsonParsed am initialisierten Mint. Token-Program/Token-2022-Owner und Mint-Typ prüfen. Mint-Adressen bleiben gross-/kleinschreibungssensitiv; Token-Account-Skala muss zum zentralen Mint-Wert passen. Keine EVM-Adressnormalisierung auf Solana/Tron anwenden.
- Tron: decimals() über die konfigurierte /wallet/triggerconstantcontract-API mit sichtbaren Base58-Adressen. Erfolgsflag und ABI-Wert prüfen, kein universeller 6-Fallback bei TRC20-Beständen.
- Native Einheiten: explizite Protokollwerte für die aktuell unterstützten Chain-/Symbol-Kombinationen (BTC 8, XRP/TRX/AKT 6, SOL 9, bekannte EVM-Coins 18). Unbekannte zukünftige Protokolle erhalten keinen Typ-Default. Insbesondere AKT/uakt erhält 6, obwohl die ursprüngliche Native-Importfunktion Akash bislang offen liess. Für benannte Cosmos-Denoms sind passende base-/display-Einheiten und Exponent aus Bank-Metadaten erforderlich.
- V3-Pooladressen werden nur nach fehlender/revertierender decimals()-Funktion UND strukturell passenden slot0/fee/token0/token1-Antworten als not_applicable / v3_pool markiert. Technische Dezimalstellen bleiben dort NULL, UI zeigt Pool statt eines fehlenden Tokenwerts; normale ERC20-LP-Token behalten echte Contract-Decimale. Keine Erkennung allein anhand LP-Label. Pool-/Fungible-Token-Widersprüche erzeugen Konflikt.

## Persistenz und Konflikte

Service-only Speicher-/Lese-RPCs begrenzen technische Metadaten nach Chain+normalisierter Contract-/Mint-Adresse. Nur EVM-Adressen werden kleingeschrieben. Zeilen-/Advisory-Locks, Vergleich vorhandener Master-/Cachewerte, sticky conflict, Originalwert und beobachteter Wert sowie Quelle/Prüfzeit und zehn letzte Beobachtungen. Widersprüche werden nicht automatisch überschrieben oder aufgelöst. Fehlerhafte Providerantworten bleiben unavailable. Ein neuer Abruffehler löscht keinen bereits bestätigten Cachewert; refreshFailed weist auf den fehlgeschlagenen Refresh hin. Unmittelbare automatische Wiederholungen eines unavailable-Werts frühestens nach 60 Sekunden; manuelle Admin-Prüfung darf gezielt neu lesen. Ein bestätigter Contract-Wert braucht keinen RPC pro Claim. Zentrale aktuelle Metadaten sind keine Behauptung historisch unveränderter Contract-Eigenschaften; bestehende Payout-/Flow-Skalen müssen weiterhin übereinstimmen.

predefined_tokens bekommt nur fehlende technische Werte/Namen/Bezeichnungen ergänzt. Keine Neuanlage globaler Token-Definitionen für private Custom-Token. enabled/historical_only, bestehende Anzeige-Dezimalstellen, Preise und Zuordnungen unverändert. Reine technische Cache-Ergebnisse geben einen Token nicht automatisch als DAO-Reward-Asset oder sicheren Bestand frei. Die bekannte DAO-Contract-Whitelist bleibt bestehen. Alte 8.07-Felder/Funktionen bleiben erhalten, ausgeführte Migrationen werden nicht gelöscht.

## Eigene sichere Token und Browser

safe_tokens erhält nullable display_decimals und summary_decimals mit 0–18-Constraints. Leere Felder erben den vorhandenen Stammdaten-/Formatstandard. Eine persönliche Anzeige-Einstellung überschreibt die globale Darstellung nur für diesen User; leere persönliche Summary folgt dann der persönlichen Anzeige. Technische Skalierung wird dadurch nie verändert. Vorhandene globale Anzeige-Werte werden nicht auf private Listen kopiert. Eigene Bezeichnungen bleiben bestehen.

Neue read-only RPC wallettracking_list_own_safe_tokens bindet die interne technische Information nur an auth.uid()s eigene Einträge. Bestehende Safe-Token-RLS bleibt aktiv; Browser speichert persönliche Änderungen zusätzlich mit eigener User-ID und Datensatz-ID. Andere User-Listen werden weder enumeriert noch in den technischen Cache kopiert. Beim Accountwechsel werden manuelle Metadaten-Batch-Fortsetzungen zurückgesetzt.

Unter „Eigene sichere Token“ sind technische Werte/Pool/Konflikt und persönliche Anzeige-/Summary-Eingaben sichtbar. Dort prüft ein Button nur die eigene Liste. Im vordefinierten Bereich gibt es einen Admin-Button für den Katalog. Es sind jeweils höchstens zwölf Contracts pro Aufruf und vier parallele Provider-Anfragen; nextAfter wird beim nächsten manuellen Klick fortgesetzt, keine automatische Dauer-Schleife. refresh-catalog erfordert echten Admin-JWT und verarbeitet globale Definitionen plus eigene sichere Token; refresh-own benötigt User-JWT und ist nur dessen eigene Liste. Keine Request-User-ID und kein Katalogzugriff allein durch den internen Service-Key. Ergebnisse zählen verified/not_applicable/conflict/unavailable; fehlende Providerdaten bleiben sichtbar offen.

Browser-Metadaten für aktuelle/historische Preise, positive EVM-Bestände, Tron, sichere Solana-Mints und DAO-Receipt-Token verwenden den gemeinsamen Resolver. Aktuelle EVM-Nullbestände benötigen keine Metadaten. Unklare positive Bestände oder widersprüchliche Skalen führen zu einem offenen Fehler und keinem geratenen Betrag. Historische gespeicherte Flows/Rewards/Preise werden nicht umgeschrieben. Es wird keine neue Preisroute eingeführt.

## Hintergrund-Integration

DAO-Claim-Treiber verwendet den neuen Dienst und übergibt weiterhin die nachgewiesene technische Skala an den bestehenden 8.07-Finalizer. Auszahlungsbelege, NFT-Ownership und zentraler exakter Preisweg bleiben getrennt geprüft; kein Preis-/NFT-/Reward-Backfill in diesem Release.

wallet-daily-refresh liest den internen technischen Cache in begrenzten 200er-Paketen und löst fehlende Skalen positiver sicherer Token über denselben Dienst auf. Keine separate RPC-decimals-Fallbackberechnung; Konflikte stoppen die betroffene Chain statt falsche Mengen zu speichern. Native Einheiten und vorhandene Snapshot-/Retry-Logik bleiben erhalten; Solana-Mint-/Tron-Adressen werden jetzt auch im Job korrekt case-sensitiv erhalten. Bereits verifizierte V3-Pools werden aus ERC20-Beständen ausgeschlossen. Der separat vorhandene Wallet-Bestandscron wird nicht neu konfiguriert. DAO-Cron und DAO_REWARD_ENABLE_LIVE_WORKER bleiben deaktiviert; es wird kein Metadaten-Cron angelegt.

## Belegter Stand und Tests

- 8.07 live: zwölf Apertum-ERC20-/LP-Contracts verified / technische 18, Quelle Explorer, zehn vorherige NULL ergänzt, alle 13 Anzeige-Einstellungen unverändert. Proof per JSON und separater SQL-Persistenz. Natives APTM war von diesem ERC20-Test ausgenommen (technisch bereits 18).
- Nutzer-Diagnose: weitere fehlende Stammdaten auf BSC/ETH/Tron, AKT native; eigene ATOM/LPT/LCX beziehen Werte allenfalls aus Stammdaten, ZIG hat keine globale Zuordnung. Diese Werte sind vor dem Live-Abruf nicht geraten oder schon als ergänzt markiert.
- 241 relevante lokale Tests bestanden: DAO/Rewards inklusive PostgreSQL, Provideradapter, echtes SQL für Cache/Füllung/Konflikte/Pools/History/RLS/User-Isolation, HTTP-Handler/JWT/Admin-Gates/Continuation, Browser-Konvertierung/Cache/Präferenzen und täglicher Bestandsjob. Providerantworten lokal kontrolliert; 8.08-Live-Abruf/Benutzeroberfläche/Job-Integration noch offen.
- Breiter Lauf über alle tests/*.mjs: 264 Tests, 262 bestanden; zwei bereits vorhandene Fehler in docs-cleanup-regression.mjs (Erwartung an die historische Archivliste) und rpc-refresh-regression.mjs (veralteter Snapshot-Mock ohne sb.rpc). Beide Fehler separat mit unverändertem 8.07-app.js/alten Hilfsdateien reproduziert. createSnapshot ist bytegleich zu 8.07. Kein Snapshot-/Cleanup-Fix in diesem Release. Vier Preis-/Dashboard-Regressionsskripte sowie übrige breite Tests bestanden.


## Nächster Schritt

Nur `supabase/migrations/20261108222813_cross_chain_token_metadata_808.sql` vollständig im Supabase SQL Editor ausführen. Mehrere DDL-/Funktionsanweisungen in einer atomaren Transaktion; keine separaten SELECT-Resultsets. Keine Provider-Abfrage und kein Cron beim Ausführen. Erst nach Rückmeldung Deployment anleiten.

## Spätere Deployment-Reihenfolge (noch kein auszuführender Test)

Zuerst die neue Edge Function token-metadata mit index.ts UND metadata.ts (beide Dateien derselben Funktion) bereitstellen. Danach bestehende dao-reward-refresh/index.ts aktualisieren, asset-policy.js und payout-coverage.ts beibehalten. Anschliessend wallet-daily-refresh/index.ts aktualisieren. Erst danach die Webdateien austauschen. Die beiden neuen TS-Dateien nicht in asset-policy.js einfügen und keine separate Funktion metadata anlegen. Bestehende Supabase-/Alchemy-Konfiguration wird verwendet; kein neues Cron-Secret.

Die Browser-/Worker-Integration braucht die neue Funktion; Web-/Workerdateien deshalb nicht vor deren Deployment aktivieren. Laufenden DAO-Worker/Cron ausgeschaltet lassen. Nach Deployment jeweils nur den nächsten einzelnen manuellen Metadaten-Batch/SQL-/UI-Test anleiten; keine vollständige Testserie auf einmal.

DAO-Referenz zuletzt unverändert 395/388/4/3/0/0. Echte native/ERC20-Neuanlage, Referral, neue Miner-Zuordnung und vollständige inkrementelle Tagesqueue offen. Historische Referenzfälle nicht zurücksetzen. Separater TLN/VOW-Reward-Job, späterer VOW-Burn-Tab (Bridge-Transfers unterscheiden) und Apple-Passwortmanager Chrome offen. Pro Antwort nur nächste SQL-Abfrage oder nächsten Test; kleine ZIPs und echte Schweizer Zeitstempel.
