## Phase 8.40 – Nullbestands-Token in Snapshot-Spalten ausblenden (14.11.2026 12:07:26 CET)
- Zeilen werden nur angezeigt, wenn ein aktueller positiver Bestand, ein positiver gestakter LP-Bestand oder ein positiver Bestand in einem geladenen angezeigten Snapshot vorliegt.
- Historische Token-Zeilen und zusätzliche Chain-Karten werden nicht länger durch ausschliessliche Nullbestände und gespeicherte Kurse erzeugt.
- Früher positiv gehaltene Token bleiben als «nur historisch» sichtbar, wenn der positive Stichtag in den angezeigten Snapshots liegt. Fehlende Daten bleiben «–» und werden nicht als Null angenommen.
- Die fünf neuesten automatischen Snapshot-Spalten und die Option «Alle Snapshots anzeigen» bleiben bestehen; sämtliche gespeicherten Positionen bleiben unverändert. Kein SQL und kein Edge-Deployment.
- Noch offen: Langfristige Verdichtung weiter beobachten und Bitcoin-Fallback bei tatsächlichem Provider-Ausfall nachweisen.

## Phase 8.39 – Fünf automatische Snapshot-Spalten als Standard (14.11.2026 12:00:00 CET)
- Unter «Wallet-Bestände» erscheinen **ohne manuelle Auswahl** die fünf neuesten verfügbaren automatischen Stichtage als historische Spalten in Summary und Wallet-Details, auch wenn die Verlaufsliste zugeklappt ist.
- Checkbox «Alle Snapshots anzeigen» im automatischen Bestandsverlauf blendet sämtliche verfügbaren archivierten Stichtage als Spalten ein; beim Abwählen wieder die fünf neuesten. Keine einzelne Tagesauswahl und keine Begrenzung auf vier Stichtage mehr.
- Gespeicherte Tages-/Wochen-/Monatsaufnahmen werden unverändert gelesen, keine Änderung der Verdichtungsregel (7 Tage täglich, danach wöchentlich, danach monatlich). Fehlende historische Wallet-Positionen bleiben «–».
- Historische Positionen werden nur für eingeblendete Tage in kleinen Gruppen mit der bestehenden benutzergebundenen RLS-Berechtigung abgefragt. Keine Datenänderungen, keine SQL-Migration und kein Edge-Deployment.
- Test: fünf Standardstichtage, «Alle»-Einblendung, Rückkehr auf fünf, Wiederverwendung bereits geladener Daten und Benutzerisolation bestanden. Live-Test im Browser offen.
- Weiter offen: tatsächlicher Bitcoin-Fallback-Einsatz bei HTTP 429 noch nicht nachgewiesen; langfristige Snapshot-Verdichtung beobachten.

## Phase 8.38 – Automatische historische Bestände in Snapshot-Spalten (14.11.2026 11:51:11 CET)
- Auswahl im automatischen Bestandsverlauf ergänzt. Maximal vier automatische Stichtage als zusätzliche Spalten in den Wallet- und Summary-Tabellen; historische Beträge aus dem vorhandenen Archiv, manuelle Snapshots unverändert.
- Fehlende historische Wallets/Token: „–“ statt Null; nur historisch vorhandene Tokens entsprechend gekennzeichnet. Kein SQL, keine Edge Function.
- Live-Test der Spaltenauswahl offen; Bitcoin-Fallback unter tatsächlichem HTTP 429 weiterhin nicht direkt nachgewiesen.

## Phase 8.37 – GoPlus-Cache und Rate-Limit-Steuerung (14.11.2026 11:16:58 CET)
- Ursache: GoPlus meldete `api-code-4029` (Anfragelimit erreicht); bisherige Einzel-Fallbacks erzeugten zusätzliche Requests.
- `token-risk` verwendet einen gemeinsamen, benutzerunabhängigen Cache pro EVM-Chain-ID und öffentlicher Contract-Adresse: erfolgreiche GoPlus-Bewertung 24 Stunden; nicht verfügbare Einzelergebnisse 15 Minuten (ausser bei 4029). Cachewerte sind Risikosignale, keine Freigabe.
- Serverseitige, transaktionsgesperrte GoPlus-Anfragefreigabe: mindestens 3 Sekunden Abstand zwischen Freigaben, 60 Minuten Cooldown bei `api-code-4029` oder HTTP 429. Maximal ein GoPlus-Batch pro Edge-Aufruf, keine automatischen Einzel-Retries bei Teilergebnissen. Die tatsächliche Verarbeitung kann bei hoher Last gedrosselt sein; nicht geprüfte Contracts bleiben als solche gekennzeichnet.
- Diagnose: `providerStatus` unterscheidet `ok`, `api-code-4029`, `api-code-4029-cooldown`, `request-throttled` und sonstige Providerfehler; Cache-Treffer `cacheStatus: hit`. Bekannter BscScan-Phishing-Contract bleibt als Warnsignal. Manuelle Spam-Bestätigung unverändert.
- Zugriff: JWT weiterhin Pflicht, Cache speichert ausschliesslich öffentliche Contract-Daten; Tabellen mit RLS ohne `anon`/`authenticated`-Zugriff, RPC nur für `service_role`. Bei Cache-/Gate-DB-Fehler keine unkontrollierten GoPlus-Anfragen.
- **Installation in dieser Reihenfolge:** SQL-Migration `20261114111546_token_risk_goplus_cache_837.sql` einmalig in Supabase ausführen, ZIP einspielen, anschliessend `token-risk/index.ts` neu deployen. Kein anderer Edge-Worker und keine Änderung an Wallets/DAO/Cron.
- Lokale Tests: Cache-Hit ohne zweiten Provider-Aufruf, API-Code 4029 und Abkühlzeit, Fail-Closed-Verhalten bestanden. Live-Abnahme offen (GoPlus-Limit kann noch aktiv sein).
- Danach: Bitcoin-Fallback 8.25 unter realem HTTP 429 prüfen, Snapshot-Betrieb weiter beobachten.

## Phase 8.36 – GoPlus-Provider-Diagnose (14.11.2026 11:05:55 CET)
- Live-Retest 8.35: Zwei BSC-Contracts lieferten `checked:false`, obwohl einer zuvor geprueft wurde und die direkte Browser-Abfrage fuer den zweiten `code=1` lieferte. Die Ursache ist noch nicht identifiziert; Netzwerkfehler, Rate-Limits, Zeitueberschreitungen und fehlende Datensaetze wurden bisher gleich behandelt.
- `token-risk` liefert nun `providerStatus` pro Contract (`http-429`, `http-403`, `timeout`, `network-error`, `invalid-json`, `api-code-*`, `missing-contract-result`, `ok`) ohne Geheimnisse oder unkontrollierte Provider-Nachrichten. Bei nicht verfuegbaren Daten bleibt `checked:false` und die manuelle Spam-Kennzeichnung unveraendert.
- Installation: Edge Function `token-risk/index.ts` neu deployen; keine SQL-Migration. Anschliessend Network-Response fuer `0xed019f84763497417c211107705742bbb061da9b` und `0x2ca0ce162ae5ca5fc1c735772b71b9cedcfd4681` pruefen; `providerStatus` mitteilen. Bitcoin-Fallback danach offen.

## Phase 8.35 – GoPlus-Teilantworten pro Contract nachpruefen (14.11.2026 10:49:00 CET)
- Bei GoPlus-Sammelantworten mit fehlenden Contract-Eintraegen folgt eine einmalige, begrenzte Einzelabfrage je fehlender Adresse (maximal 10 Zusatzanfragen, Gruppen zu 3). Auch HTTP-200-Teilantworten werden nicht als Vollstaendigkeit missverstanden.
- Nur `code=1` und ein nichtleerer Datensatz fuer die exakt angefragte Adresse gelten als geprueft; Felder wie `is_open_source=0` bleiben Warnhinweise, kein Betrugsbeweis.
- Fehlen auch nach Einzelabfrage Daten, bleibt `checked:false` / «GoPlus nicht verfuegbar». Bekannte Phishing-Labels und manuelle Spam-Markierung unveraendert.
- Edge Function `token-risk/index.ts` neu deployen; keine SQL-Migration. Lokale Regressionstests und Live-Test des BSC-Contracts `0xed019f84763497417c211107705742bbb061da9b` nach Deployment erforderlich.
- Offen danach: Bitcoin-Fallback bei echtem HTTP 429, Snapshot-Monitoring.

## Phase 8.34 – Token-Risiko-Chain-Aliase (14.11.2026 10:34:28 CET)
- `token-risk`: `arb`/`arbitrum`, `avax`/`avalanche`, `matic`/`polygon`/`pol` korrekt zugeordnet; Fehlerantworten für Adressen, unbekannte Chains und nicht unterstützte Non-EVM-Prüfungen getrennt.
- Manuelle Spam-Bestätigung unverändert; GoPlus-Ausfall ist weiterhin keine Freigabe.
- Edge-Deployment `token-risk/index.ts` erforderlich. Keine SQL-Migration. Tests lokal; authentifizierter Live-Retest offen.
- Danach offener Bitcoin-Fallback-Livetest und historische Snapshot-Kontrolle.

#### Phase 8.33 – Vereinheitlichte Chain-Aliase (14.11.2026 10:04:32 CET)
- Technische Token-Metadaten: UI-Schlüssel `arbitrum`, `avalanche`, `polygon`, `solana` werden nur für `public.chains` zu `arb`, `avax`, `matic`, `sol` normalisiert; Original-Keys in Token-/Cache-Tabellen bleiben erhalten.
- SQL-Migration und `token-metadata/index.ts` erforderlich. Live-Tests Polygon WETH, Avalanche WETH.e und Solana-Mint offen. Sicherheits-/Bitcoin-Fallback-Retest weiterhin offen.

## Phase 8.32 – Arbitrum-Metadaten-Alias (13.11.2026 14:49:48 CET)
- Ursache `unknown-chain`: UI-/Token-Key `arbitrum`, Datenbank-Registry `public.chains.chain_key = arb` (EVM Chain-ID 42161).
- Edge Function `token-metadata/index.ts` liest Konfiguration über `arb`, behält `arbitrum` für vorhandene Stammdaten und Metadaten-Cache bei. Die Chain-ID wird vor `eth_call` verifiziert; Arbitrum-RPC-Fallback verwendet den registrierten Key.
- SQL-Migration: `wallettracking_metadata_address` erkennt den Alias, ohne `chains`, `predefined_tokens` oder historische Werte umzubenennen.
- Deployment: **zuerst SQL-Migration einmalig ausführen**, danach `token-metadata/index.ts` neu deployen. Test: Arbitrum WETH `0x82af49447d8a07e3bd95bd0d56f35241523fbab1` via Admin → Vordefinierte Token → Prüfen. Erwartete technische Dezimalstellen: 18, verifiziert on-chain.
- Kein Eingriff in Preise, Wallet-Bestände, Rewards, DAO-Jobs oder Cron. Token-Sicherheitsprüfung bleibt getrennt. Danach Bitcoin-Fallback- und Snapshot-Retest fortsetzen.

### Phase 8.31 – Risikosignale und Metadaten-Diagnose (13.11.2026)
- Neue authentifizierte `token-risk` Edge Function (GoPlus, bei BSC best-effort Explorer-Label, fehlende Prüfbarkeit sichtbar); dokumentierter BSC `Fake_Phishing1123827`-Contract als Verdacht. Technische Dezimalstellen ≠ Sicherheitsfreigabe.
- `token-metadata` liefert verständliche Diagnose beim Einzelaufruf und lesenden Arbitrum-RPC-Fallback. Beide Edge Functions nach ZIP-Installation neu deployen. Keine SQL.
- Details, Grenzen, Tests: `docs/releases/8.31-token-risk-metadata-diagnostics.md`. Danach Bitcoin-Fallback und Snapshot-Historie prüfen.

### Phase 8.30 – Automatische Batch-Verarbeitung technischer Token-Metadaten (13.11.2026)
- Admin → Vordefinierte Token: Der bestehende Sammel-Button prüft nach einem Klick alle Token in seriellen, vom vorhandenen `token-metadata`-Dienst gelieferten Batches zu je maximal zwölf Einträgen; kein erneutes Klicken pro Batch mehr nötig.
- Laufende Zähler für geprüft, bestätigt, Pooladressen, Konflikte und offene/fehlgeschlagene Ergebnisse, dazu verarbeitete Batches; Abschlussmeldung.
- Bei Request-/Netzwerkfehler bleibt der Cursor für die nächste Wiederaufnahme erhalten. Wiederholte/ungültige Cursors und maximal 200 Batches stoppen sicher; es gibt keinen unbeschränkten Aufruf-Loop.
- Auch der persönliche Button „Technische Metadaten prüfen“ verwendet den gleichen Ablauf. Einzel-Token-„Prüfen“ bleibt verfügbar.
- Keine neuen SQL-Migrationen oder Edge-Function-Änderungen. Datenbank-Konfliktregeln, Rate-Limits, Preise und Walletbestände unverändert. Keine stillschweigend angenommenen Dezimalstellen.
- Live-Abnahme: mindestens eine Tokenliste mit mehr als 12 Einträgen vollständig durchlaufen lassen, Fortschrittsanzeige und abschliessende offene Token prüfen.
- Nach Live-Abnahme: Bitcoin-Fallback 8.25 und Bestandsverlaufs-Retention 8.27 weiter prüfen.


### Phase 8.29 – Token-Metadaten gezielt prüfen (13.11.2026)
- In Admin → Vordefinierte Token erscheint bei technischen Dezimalstellen „offen“/„Konflikt“ ein Knopf **Prüfen** pro Token.
- Umgeht die 12er-Paginierung des Sammelimports und fordert eine erneute serverseitige Prüfung des konkreten Contracts an.
- `token-metadata` akzeptiert `refresh:true` nur mit Admin-JWT oder Service-Role und meldet Status/Grund zurück. Keine geratenen Token-Dezimalstellen, kein Schreiben von Kursen oder Beständen.
- Diagnose XAUt (`0x68749665ff8d2d112fa859aa293f07a622782f38`) und DSYNC (`0xf94e7d0710709388bce3161c32b4eea56d3f91cc`): technische Werte derzeit unverified; Live-Bestätigung nach Deployment offen.
- **Deployment nötig:** `supabase/functions/token-metadata`; reine ZIP-Installation aktualisiert diese Funktion nicht.

## Phase 8.28 – Token-Promotion / Dashboard-Kursflag (13.11.2026 10:19:50 CET)

- Sichere Token werden beim Übernehmen in `predefined_tokens` umgehend zur technischen ERC20-Metadatenauflösung an den vorhandenen Dienst `token-metadata` gegeben. Bei nicht erreichbarem Provider bleibt die Übernahme bestehen und ein Hinweis erklärt den manuellen Admin-Nachtest.
- «In der Dashboard-Kursübersicht anzeigen» auch für allgemeine, nicht projektgebundene Token aktivierbar/deaktivierbar. Gehaltene allgemeine Token sind bei vorhandenem Preis und Bestand > 1 USD oder explizitem «immer anzeigen» weiterhin sichtbar, sofern das Kurs-Flag eingeschaltet ist.
- Projekt-Token benötigen unverändert eine Beteiligung am betreffenden Projekt. Keine erfundenen Preise oder Dezimalstellen.
- Live-Abnahme: Ethereum XAUD und DSYNC auf technisches Dezimalstellenresultat und Flag-Persistenz prüfen. Der bestehende `token-metadata`-Dienst muss installiert sein.
- Nach Abschluss wieder zu Bitcoin-Fallback-Livetest und Snapshot-Kontrolle zurückkehren.

## Phase 8.27 – Aufbewahrung automatischer Bestandsverläufe (13.11.2026 09:59:58 CET)

- SQL-Korrektur für `wallettracking_compact_balance_history(date)` am 13.11.2026 vom Benutzer bereits erfolgreich in Supabase ausgeführt; Migration für Git-Projekt nachgeliefert.
- **Retention:** Alter 0–6 Tage täglich, Alter 7–365 Tage neuester Wert je ISO-Woche, ab 366 Tagen neuester Wert je Kalendermonat. Manuelle Snapshots unangetastet.
- **Live:** Snapshot-/Archivierungs-Trigger nach Fix am 13.11. wieder aktiv; frühere Bestandsverlaufslücke 02.–12.11.2026 bleibt, keine künstliche Rekonstruktion aus aktuellen Beständen.
- **Offen:** Bitcoin-Fallback Phase 8.25 bei realem 429 kontrollieren; tägliche Archivierung künftig weiter beobachten; Verdichtung langfristig anhand echter historischer Daten verifizieren.
- **Arbeitsregel:** Jede Scriptänderung ausschliesslich als versioniertes ZIP mit geänderten Projektdateien ausliefern, auch wenn SQL zuvor direkt in Supabase getestet wurde.

## Phase 8.26 – Wallet-Verwaltung kompakt (13.11.2026 08:11:57 CET)

Wallet-Eingaben standardmaessig eingeklappt, nur Wallet-Namen sichtbar; je Wallet und alle gemeinsam auf-/zuklappbar. Keine SQL-/Edge-Änderungen. Browser-Livetest am 13.11.2026 bestätigt.

## Phase 8.24 – Referral-DID Cache-first (12.11.2026 17:02:17 CET)

Historische DID-Transferdaten werden je DID innerhalb einer Seiteninstanz nur einmal geladen; weitere Tab-Wechsel verwenden die vorhandenen Daten. Historisch gehaltene DIDs aus `project_nft_ownership` bleiben Kandidaten, selbst wenn die DID inzwischen umgezogen ist. Die persistente NFT-Transferhistorie liegt weiterhin serverseitig; keine Klartext-Wallet-Adressen oder DID-Namen im Browser-Storage. Neue Seiteninstanzen fragen den Server-Cache erneut ab. Vollstaendiges inkrementelles On-Chain-Nachladen ist damit **nicht** neu implementiert und bleibt an die bestehende Edge-Cache-Strategie gebunden. Keine SQL-Migration, kein Eingriff in Reward-Betraege, NFT-Zuordnungen oder historische Preise. DAO-Cron und Live-Worker bleiben deaktiviert. Live-Retest der DID-Anzeige offen.

## Release 8.23 · 12.11.2026 16:55:21 CET · 20261112-165521

**Referral DID-/Namensanzeige (nur Browser-Code):** Bei Contract-Withdrawals ohne explizit transaktionsbelegte DID wird die ERC-721-Transferhistorie der im Account bekannten DAO1-DIDs über bestehende `apertum-nft-history`-Funktion geladen. Zuordnung ausschliesslich bei genau einer DID, deren letzte gültige Besitzer-Transferposition vor dem Auszahlungsblock auf die betreffende Wallet zeigt. Gespeicherter DID-Alias aus `team_alias_list`, sonst `DID #<ID>`. Bei mehrfachen DIDs, unvollständiger Transferkette oder fehlendem History-Zugriff keine geratenen Namen/IDs. Historische DID-Ownership ist **kein Nachweis für die wirtschaftliche Entstehung des Rewards**.
**Live-Kontrollfälle:** 9 Auszahlungen Wallet `4c16c7a8…` → DID 21043; 8 Auszahlungen Wallet `0f49c5a3…` → DID 18438 (2 NFT-Transfers pro DID im Explorer und Cache). Weiterhin UI-Test, Cache-Verfügbarkeit und Mehrfach-DID-Regressionsprüfung nötig. **Keine SQL-Migration / keine Edge-Function-Änderung; bestehende Rewards, Preise, NFT-Claims und Scans unverändert. DAO-Cron und Live-Worker OFF.**

## Release 8.22 · 12.11.2026 16:21:40 CET · 20261112-162140

**DAO1/APTMDAO-Referral-Auswertung (Code vorbereitet; noch keine produktive Freigabe):**
- Feste Referral-Empfänger-Wallet entfernt. Server- und Browser-Klassifikation verwenden weiter einen **erfolgreichen Contract-Aufruf** an `0xcd40…f856` und einen **tatsächlich eingehenden wUSDT-Flow vom selben Contract**; DID-markierte Transaktionen bleiben ein gesonderter, beleggebundener Pfad. Beliebige wUSDT-Eingänge oder blosses `withdraw` sind kein ausreichender Nachweis für die wirtschaftliche Referral-Herkunft; Vertragssemantik und neue Wallets sind weiterhin live zu validieren.
- Gezielter wUSDT-Transfer-Import auch für weitere registrierte Apertum-Wallets; bei fehlender eigener TX nur echte erfolgreiche Explorer-TX-Details für Contract-Kandidaten nachladen. Kein pauschales Referral-Posting, keine Aktualisierung vorhandener Claims, Preise oder NFT-Zuordnungen. Roh-Import folgt bestehenden Idempotenz-/Checkpoint-Regeln.
- Server-Referral-Audit ist walletübergreifend. Der staged-Abschluss prüft jetzt einen wirklich `complete`/`empty_verified` Referral-Scan-Checkpoint, statt allein aufgrund einer bestimmten Wallet oder bisher leerer Eingangsflows Vollständigkeit anzunehmen. DAO-Tageslimite bleiben unverändert.
- Anzeige «DID / Name»: bevorzugt ausdrücklich an der TX belegte DID und gespeicherten Alias. Ohne TX-DID wird eine einzelne **aktuell** zugeordnete Wallet-DID als solche gekennzeichnet; bei mehreren DIDs «nicht eindeutig» statt willkürlicher Zuordnung. Historische DID-Zuordnung nicht aus aktuellem Besitzer erfunden.
- **Noch offen / Live-Abnahme:** Deployment der aktualisierten Edge Function, Browser- und Server-Gegenprobe für alle Wallets (insbesondere `0f49c5a3…` mit 8 möglichen Contract-Auszahlungen); Referral-Contract-Semantik und DID-Transaktionen prüfen, Schutz gegen Doppelzählung über Wallets, USD-Preise unabhängig über zentralen Preisweg, historische Scans fertigstellen. Keine SQL-Migration. **DAO-Cron und DAO-Live-Worker OFF**, Freigabe nur ausdrücklich nach E2E-Audit.

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

## Release 8.21 · 12.11.2026 10:05:13 CET · 20261112-100513
- Legacy-MineBot-Nachzahlungen: Server-Staging stellt für positive wAPTM-Eingänge vom bekannten Absender eine fehlende Transaction-ID insert-only bereit. Vorhandene ältere Flows werden beim nächsten Staging-Lauf ebenfalls erkannt. Browser-Vollrefresh bestehendes Verhalten beibehalten. Beliebige Nutzer-/Wallet-ID, keine Wallet-Whitelist.
- Bestätigte Einträge als „Miner-Nachzahlung (bestätigt) · Alte MineBots“ bezeichnet, ohne behauptete NFT-ID. Erst manuell bestätigte Zahlungen zählen als Claims; ignorierte bleiben ignoriert.
- Edge Function muss für die Job-Verarbeitung neu deployed werden; DAO Live/Auto-Cron bleibt OFF. Funktion ist kein produktionsreifer vollständiger Reward-Worker.
- Validierung gegen reale Supabase-/Explorer-Daten nach Deployment offen. Keine Migration erforderlich.

## Release 8.20 · 12.11.2026 07:59:11 CET · 20261112-075911
Browser-seitige DAO1-Native-Claim-Flows erhalten den Rohbetrag direkt aus der ursprünglichen erfolgreichen Explorer-Internal-Transaction bzw. Wallet-Receipt-Log; exakte `BigInt`-Werte für `amount_raw` und `amount` (Dezimalstring). Ohne Originalrohbeleg kein neuer nativer Flow aus gerundetem Legacy-Claim. Historische 164 bereits kanonische Claims wurden vom User in Supabase ergänzt (APTM/native/18, Mengen/Preise unverändert und geprüft), unabhängig von diesem Release. 231 Staged-Kandidaten weiterhin nicht synchronisiert; bei `d82b6059…` 17 Rohbetrags-/Legacy-Number-Abweichungen. Die drei Staged-Wallets nicht automatisch vollenden; vor Markierung unabhängige On-Chain-Provenienz, eindeutige Claim-/NFT-Zuordnung und gesonderte Prüfung des Null-Reward-Claims erforderlich. Keine SQL-Migration; DAO-Cron/Live-Worker aus.

## Release 8.19 · 11.11.2026 06:37:58 CET · 20261111-063758
Manueller DAO1-Queue-Batch: fest maximal zehn Staging-Schritte mit 65-Sekunden-Startbudget, gleicher `v2`-Lease/Checkpoint-Logik wie Einzelmodus, Fehler pro Wallet sicher abschliessen und ggf. weiteren Schritt bearbeiten. Keine kanonischen Claim-/Referral-Buchungen, keine SQL-Migration, kein Cron. Tageswechsel-Fortsetzung (`resume-history`) am 11.11.2026 live bestaetigt, Batch-Livetest offen. Interne Gegenparteien weiterhin nur fuer **neue** Imports datensparsam behandelt. DAO-Live-Worker aus.

## Release 8.18 · 10.11.2026 22:33:32 CET · 20261110-223332
Browser und Edge Function verwenden für neue DAO1-ERC20-Rohflows nun dieselbe Regel zur Gegenpartei: Eigene Wallet-zu-Wallet-Transfers speichern `counterparty_address=NULL`, externe Absender/Empfänger (einschliesslich Null-Adresse) bleiben für Audit und Referral-Nachweis erhalten. Alle weiteren Scan-, Claim-, NFT- und Reward-Regeln unverändert. Bestandsdaten nicht umgeschrieben; 29 bestehende NULL-Fälle nicht pauschal reparieren. Weitere offene Prüfung: Nachweis der 13 eingehenden Transfers über ERC20-Logs, Echt-Test neuer Cross-Wallet-Flows und historische Fortsetzung am Tageswechsel. Keine Aktivierung automatischer DAO-Jobs.

## Release 8.17 · 10.11.2026 20:03:18 CET · 20261110-200318
Bestätigter 8.16-HTTP-500: `reward_running` fehlte in DB-CHECK; manuell live bereits behoben, jetzt als reproduzierbare Migration enthalten. Strukturierte Supabase-Fehler erscheinen nicht mehr als `[object Object]`; ungenutzte, nicht deklarierte Browser-Variable `fetched` im DAO1-Inkrementalscan entfernt. Historische DAO-Server-Cursor werden in `project_scan_state.last_scan_message` persistiert; neuer Tageslauf noch nicht live verifiziert. Raw-Staging- und Staged-Claim-Phase für leeres Wallet manuell geprüft; reale Claim-/Referral-Fälle und APTMDAO weiter offen. Keine Preise, NFT-Klassifikation, Rewards oder TLN/VOW geändert. Cron und Live-Worker aus.

## Release 8.16 · 10.11.2026 06:41:13 CET · 20261110-064113
DAO1 staged-Reward-Einzelphase implementiert. Live-Abnahme offen: erst Preview, dann einmaliger schreibender Test. APTMDAO und vollständige Referral-E2E-Verarbeitung nicht freigegeben, Cron und Live-Worker aus.

## Release 8.14 · 09.11.2026 21:18:27 CET · 20261109-211827
Geschützte DAO1-Multi-Wallet-Staging-Queue: Lease-Token, begrenzte Schritte und Fehlversuche, nur manueller Test. Keine automatische Reward-Verbuchung oder Cron-Aktivierung. Siehe `docs/releases/8.14-dao-multi-wallet-queue.md`.

## Release 8.13 · 09.11.2026 20:53:16 CET · 20261109-205316
Einzelwallet-Cron-Probelauf `cron-test-wallet-one` mit eigenem DAO-Secret, nur bei Testimport-Freigabe und deaktiviertem Live-Worker. Schreibt optional Rohdaten und höchstens einen belegten Claim; keine Reward-Doppelbuchung oder Queue-Abschluss. Kein Cron aktiviert. Siehe `docs/releases/8.13-dao-fixed-wallet-cron-rehearsal.md`.

## Release 8.12 · 09.11.2026 20:19:02 CET · 20261109-201902
Dedicated DAO cron secret `DAO_REWARD_CRON_SECRET` replaces the previous accidental reuse of the wallet-daily-refresh credential. New fixed modes `cron-auth-check` (read-only) and `cron-stage-one` (single bounded raw staging pass, only after explicit `DAO_REWARD_ENABLE_LIVE_WORKER=true`). All other cron modes denied. No SQL migration; no cron or secrets created automatically. DAO canonical claim/Referral finalization and end-to-end completion are **not** production-ready. See `docs/releases/8.12-dao-cron-auth-preparation.md`.

## Release 8.11 · 09.11.2026 17:12:22 CET · 20261109-171222
Historische DAO1-NFT-Zuordnung in gemeinsame SQL-RPC für Browser und Edge Function überführt; 125 Fälle als Prüfziel, Live-Backfill noch offen. Beträge, Preise und Rewards unverändert. DAO-Cron bleibt deaktiviert. Siehe `docs/releases/8.11-historical-nft-claims.md`.

# WalletTracking – verbindlicher Entwicklungsstatus und offene Punkte

**Dokumentationsstand:** 12.11.2026 13:17:11 CET (Europe/Zurich) · **aktuelle sichtbare App-Phase:** 8.21, Build 20261112-100513. Technischer DAO-Cron weiterhin aus.

Diese Datei ist die zusammengeführte Arbeits- und Übergabeübersicht. Status hier beschreibt belegte Live-Tests, nicht eine pauschale Produktivfreigabe. Bestehende Fach- und Release-Dokumentation bleibt gültig.

## Phase 8.10 – Referral-Audit Timeout-Korrektur (Live-Abnahme offen)

Die 8.09-Audit-Auswertung lief auf HTTP 504 nach 150 Sekunden. In `dao-reward-refresh` wurden die mehrfachen per-TX-Batch-Queries durch zwei parallel und vollständig seitenweise eingelesene Ströme ersetzt (Transaktionen und eingehende Token-Flows). Beide Datenstromabfragen haben ein 30-Sekunden-Budget, unvollständige Ergebnisse werden als Fehler gemeldet statt als Teilsumme. Die Klassifikation, Reward-Werte und NFT-Ownership-Logik bleiben unverändert. DAO-Live-Worker und Cron bleiben deaktiviert. Live-Audit muss nach Deployment erneut ausgeführt werden.

## Phase 8.09 – DAO1-Referral serverseitig / NFT-Zuordnung Diagnose (lokal implementiert, Live-Test offen)

Die bereits vorhandene Browser-Klassifikation verifizierter DID-/Contract-Referral-Auszahlungen ist serverseitig jetzt als **lesende Auswertung aus kanonischen Transaktionen/Flows** in `dao-reward-refresh` implementiert. Kein neuer Reward-Post, kein eigener Summen-Speicher, keine Änderung der bestehenden Werte. Zusätzlicher Admin-Audit `audit-referrals-test-wallet`. Für nicht zugeordnete Bot-Claims ist der lesende `audit-nft-candidates-test-wallet` ergänzt. Die tatsächliche Ursache der fehlenden NFT-Zuordnung bleibt bis zum Live-Diagnoseergebnis offen; historische NFT-Ownership darf nicht durch aktuelle Inventardaten ersetzt werden. DAO-Cron/Live-Worker **bleiben aus**. Keine SQL-Migration. 16 gezielte Tests bestanden. Details `docs/releases/8.09-dao-server-referrals-nft-audit.md`.

## DAO1/APTMDAO – zuletzt live bestätigt

- Test-Wallet: `0x239c5822a0d2A67E629D7A3b5C8180721E228B47` auf Apertum; Datenbank mit 395 Claim-Kandidaten.
- Historischer Transaktionsscan abgeschlossen (gespeicherter oberer Block 15'670'355); Token-Flows und Referral-wUSDT-Scans ebenfalls als `complete` gespeichert. Checkpoints, Cursorfortsetzung, Idempotenz und inkrementeller Delta-Modus manuell getestet. `complete` bezieht sich auf die Explorer-Paginierung, **nicht** auf unabhängig verifizierte Vollständigkeit bis zum aktuellen Chain-Tip.
- 388 vorhandene Claims: `canonical_existing_verified=true`; darunter 284 und nach präzisem Dezimalvergleich weitere 4 per Guard gekennzeichnet. Zweiter Aufruf: `newlyMarked=0`, `markedAfter=388`. Native Auszahlungen stimmen mit dem kanonisch gespeicherten Betrag innerhalb 0.000000000000001 APTM überein; keine Neuanlage von Reward-Buchungen.
- 4 frühe positive APTM-Claims bei Blöcken 60'731, 72'665, 81'698, 81'700: `audit_classification=unpriced_before_exact_anchor` und `audit_classified_at` **dauerhaft in Supabase verifiziert**. Zentraler exakter Preisanker beginnt erst bei Block 88'356. Kein Ersatzkurs, USD-Wert bleibt `NULL`; Klassifikation ist unabhängig von Auszahlungs-Verifikation. 8.04-Live-Test und separate SQL-Abfrage bestätigen inzwischen `payout_status=verified`, exakt gespeicherte Raw-Mengen 4650944472418586884 (zweimal) und 4031915382788697322 (zweimal), je einen Protokolleintrag, unverändertes `canonical_existing_verified=false` und USD NULL. Vorhandene Claim-Mengen 4.650944472418587 / 4.031915382788697 bleiben unangetastet; Abweichungen zum Rawbetrag 116 / 322 Wei liegen innerhalb der begrenzten Toleranz. Wiederholung: checked=0, results leer, pendingPayoutChecks=0; keine erneuten Protokolleinträge laut SQL-Kontrolle.
- 3 Transaktionen mit Reward=0 bei Blöcken 403'915 (Bot 37174), 10'791'488 (Bot 10295), 11'254'937 (Bot 10294): nach 8.03 **live als `no_payout_evidence` klassifiziert**, TX-/Token-/Internal-Coverage vollständig, keine Token-Transfers und 17/7/7 interne Aufrufe ohne erkannten Eingang. Dauerhafte Speicherung separat per SQL bestätigt: `payout_checked_at` 08.11.2026 12:45:20–12:45:21 CET, zu diesem Zeitpunkt je zwei Protokolleinträge und passender letzter Status. Anschliessende erneute manuelle Prüfung ebenfalls erfolgreich (`noPayoutEvidenceClaims=3`, `payoutsNeedingReview=0`, `verifiedPayoutClaims=0`, `pendingPayoutChecks=4`, keine konkurrierenden Skips). Explorer-indexierter Negativbefund, kein endgültiges On-Chain-Nullurteil.
- Rohdaten-Import und Klassifikation liefen kontrolliert/manuell; produktiver DAO-Rewards-Worker und Cron bleiben deaktiviert (`DAO_REWARD_ENABLE_LIVE_WORKER=false`). Kein vollständiger End-to-End-Live-Test neuer Rewards/Referral/Bot-Zuordnung.

## Phase 8.08 – chainübergreifende Metadaten und private Anzeige-Einstellungen implementiert, Live-Prüfung offen

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


Details/Quellen/Deployment: docs/releases/8.08-cross-chain-token-metadata.md. Historische Abschnitte darunter sind früherer Entwicklungsstand.

## Live-Nachtrag 8.07 · 08.11.2026 22:23:00 CET

8.07-Migration und Edge-Deployment laut User abgeschlossen. Admin-Test refresh-apertum-token-decimals: checked=12, alle zwölf ERC20-/LP-Contracts verified, storedDecimals=observedDecimals=18, Quelle apertum-explorer-token-metadata, nextAfter=null. Zehn zuvor fehlende technische Werte ergänzt; ANOUBIS/PUGLORD vorhandene 18 bestätigt. Separate Live-SQL-Abfrage bestätigt Speicherung in predefined_tokens und unveränderte Anzeige-Dezimalstellen aller 13 Apertum-Zeilen. Prüfzeit 08.11.2026 22:20:03.874794–22:20:04.433249 CET (SQL liefert UTC). Auch gewrappte wBTC/wUSDT/wUSDC haben auf Apertum 18 technische Decimale. Natives APTM weiterhin technisch 18 / Anzeige 2; decimals_status=unverified, source/checked_at NULL, weil kein ERC20-Contract geprüft wurde. Das ist kein fehlender technischer Wert und keine negative Prüfung. Keine belegten Konflikte. Cache-Wiederverwendung ohne Explorer/RPC noch nicht separat live getestet; neue kanonische ERC20-Claim-Buchung ebenfalls weiterhin offen. DAO-Cron/Live-Worker aus.

Neue Nutzer-Rückmeldung: Token anderer Chains sowie „Eigene sichere Token“ haben ebenfalls fehlende Kommastellen. 8.07 löst nur Apertum/predefined_tokens, nicht die vollständige chainübergreifende Erfassung. Codeprüfung: safe_tokens lädt/speichert bisher user_id, chain, address, label; der verifizierte Schema-Baseline-Stand enthält keine technischen oder Anzeige-Dezimalfelder. Technische Custom-Metadaten werden vor allem im Browser-Cache gehalten; eine vorhandene Live-Schema-Erweiterung ist noch nicht ausgeschlossen. Andere EVM-Pfade enthalten weiterhin angenommene 18-Fallbacks. Nächste Analyse muss technische Skalierung und persönliche Anzeige-Einstellung unterscheiden: zentral wiederverwendbare technische Metadaten nach Chain+Contract/Mint, userbezogene Safe-Listen/Anzeigepräferenzen nicht globalisieren. Chain-native Metadatenquelle je Plattform verwenden; keine EVM-Regel für Solana/Tron erzwingen und keine Werte raten. Bestehende technische Werte/Konfliktschutz und User-Isolation erhalten. Vor Umsetzung nur eine lesende Bestandsabfrage über predefined_tokens und safe_tokens zeigen; keine neue Migration/Cron-Aktivierung freigegeben.

Die folgenden Release-Abschnitte beschreiben den ursprünglichen Implementierungsstand; der Live-Nachtrag oben führt den Abnahmestand.

## Phase 8.07 – Apertum-Abruf und Speicherung live bestätigt

Fehlende technische Apertum-Dezimalstellen werden über die Explorer-Token-Metadaten ermittelt, in predefined_tokens gespeichert und von Browser und DAO-Worker wiederverwendet. Ein vorhandener gültiger Wert benötigt keinen RPC-Aufruf pro Claim. display_decimals und summary_decimals bleiben unverändert. Kein pauschaler 18-Fallback für die geänderten Apertum-Konvertierungen. NULL, leere Werte, boolesche Werte und ungültige Skalen werden nicht als 0 akzeptiert; technische 0 ist zulässig.

Vorhandene technische Werte werden niemals automatisch überschrieben. Eine abweichende Beobachtung markiert decimals_status=conflict und speichert Originalwert, zuletzt beobachteten Wert, Quelle und Prüfzeit. Konflikte bleiben gesperrt und benötigen eine gesonderte geprüfte Admin-Korrektur; wiederholte Abrufe löschen sie nicht. Noch kein eigener Konflikt-Auflösungsdialog. Pro Session gespeicherte Browserwerte werden beim erneuten Laden der Stammdaten aktualisiert.

Primärquelle ist https://explorer.apertum.io/api/v2/tokens/<Contract>. Antwortadresse/Token-Typ werden geprüft, soweit geliefert. Dezimalstellen 0–36 strikt validieren. Nur fehlende Explorer-Metadaten eines Claim-Tokens benötigen den bisherigen chain-geprüften decimals()-RPC am Claim-Block. Eine widersprechende Contract-Adresse wird nicht durch einen Fallback verdeckt. Zentrale Explorer-Metadaten sind aktuelle Contract-Metadaten, keine Behauptung eines historischen eth_call-Nachweises. Diese tatsächliche Quelle wird auch in claim_pipeline_asset_evidence protokolliert. Bestehende historische Flow-Skalen werden nicht rückwirkend umgeschrieben; Abweichungen zwischen Payout/Flows und zentralen Einheiten blockieren den Claim wie bisher.

Browser-Live-/historische Preis-Metadaten, bekannte Token-Bestände, Apertum-Explorer-Bestände und DAO-Receipt-Token-Metadaten verwenden denselben Resolver. Der DAO-Rohimport akzeptiert vollständige Transfer-Metadaten weiterhin, verwirft jedoch den bisherigen geratenen 18-Fallback; fehlende/ungültige Skalen halten den Import offen. Bekannte technische Konflikte blockieren die anschliessende kanonische ERC20-Verarbeitung. Unregistrierte Custom-Token dürfen Metadaten temporär nutzen, erzeugen aber keine neuen globalen Stammdatenzeilen und werden dadurch nicht als Reward-Assets freigegeben.

Zwei begrenzte Metadaten-Modi in der bestehenden dao-reward-refresh-Funktion: resolve-apertum-token-decimals prüft einen echten User-JWT und verarbeitet einen Contract. refresh-apertum-token-decimals ist Admin-only, erfordert das bestehende Test-Import-Flag und ausgeschalteten Live-Worker; höchstens 20 Katalog-Contracts je Aufruf, vier parallele Explorer-Anfragen, after/nextAfter bei weiteren Contracts. Kein Request akzeptiert technische Werte oder Quellen vom Browser. Globale Schreib-RPC und kanonische Abschluss-RPC bleiben service-only; vorhandene browserlesbare Token-Stammdatentabelle wird erweitert, keine neue exponierte Job-Tabelle.

8.06 ist laut User installiert/deployt; allgemeiner Einzel-Claim-Test lieferte no_eligible_claim und claimsCreated=0. Alle Rohströme complete/incremental-delta, keine neueren Ereignisblöcke. Das ist kein Live-Beweis einer neuen ERC20-Claim-Buchung. Live-SQL bestätigt 13 Apertum-Stammdaten: APTM/ANOUBIS/PUGLORD mit 18 technischen Dezimalstellen, zehn ERC20-/LP-Zeilen mit NULL. Ihre Werte werden in 8.07 dynamisch abgerufen, nicht geraten oder vorab als live ergänzt behauptet.

208 lokale DAO-/Reward-Tests inklusive PostgreSQL und vier Preis-/Dashboard-Regressionsskripte bestanden. Geprüft: NULL ergänzen, 0/6/18/36, Wiederverwendung ohne Netzwerk, ungültige Antworten, Contract-/Chain-Konflikte, RPC-Fallback, Authentifizierung, Batchlimit/Fortsetzung, Konfliktschutz, unveränderte Anzeige-/Summarywerte, korrekte Claim-Quelle, atomare kanonische ERC20-Speicherung und Wiederholung. 8.07-Live-Ausführung offen. DAO-Cron/LIVE_WORKER bleiben deaktiviert; Referral, neue Miner-Zuordnung, vollständiger Tagesabschluss, neue echte Claims und TLN/VOW-Job bleiben offen.

## Phase 8.06 – installiert, inkrementeller Leerlauf live bestätigt

- Allgemeine Admin-Route process-next-claim-test-wallet für dieselbe feste Testwallet, JWT/Admin-Gates/Test-Flag/Live-Worker-aus und ein Claim je Aufruf. Alte native Route bleibt kompatibel und wird nicht stillschweigend für ERC20 geöffnet.
- Whitelist aus bestehenden Projekt-Stammdaten: wAPTM 0x110ac02ba3384bc055c13a87766049a74517beda; wUSDT 0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f; wUSDC 0xd979f41e12a69aa82f04866444ea91e8e8faefd9. Asset-Policy ist eine physische JS-Datei für Browser und Worker. Stablecoin-Parität unverändert, jetzt per Contract statt Symbol/Name; aktuelle/historische Apertum- und DAO-Bewertung nutzen dieselbe Regel, andere Chains bleiben unverändert.
- Technische Decimale 0–36 per eth_call decimals() am konkreten Claim-Block, RPC-Chain-ID gegen chains.evm_chain_id prüfen, Archive-RPC bevorzugen. Keine Nutzung von display_decimals und kein pauschaler 18-Fallback. Fehlendes/defektes RPC blockiert; kein Quote-/Preis-Fallback.
- Ein ERC20-Asset mit mehreren positiven Transfers zulässig, insgesamt maximal 100 belegte Flows. Gleiche TX/Block/Contract/Decimals, genaue Raw-Summe, eindeutige kanonische Log-Keys und Auszahlungs-Absender gleich Claim-Contract erforderlich. Gemischte Assets, interne/self-Flows, falsche Sender und unbekannte Token blockieren. Legacy-NFTs nur aus dem bekannten alten MineBot-Vertrag mit historischem Owner; bekannte DID-Verträge keine Bot-Claims.
- Gemeinsame kanonische Abschluss-RPC für native/ERC20, alter Native-Aufruf bleibt Wrapper mit ERC20 gesperrt. Stable-Quote wird aus gemeinsamer Policy geliefert und SQL-seitig auf registriertes Asset/1 USD geprüft. wAPTM übernimmt bestehende exakte Zielanker, keine neue Kursroute. 7.87-Preisreuse in gemeinsame optional TX-begrenzte Implementierung ausgelagert, alter Aufruf bleibt Wrapper. Keine anderen TX-Preisfelder verändern.
- Exakte SQL-Raw-Normalisierung für alle technischen Decimale; ERC20 reward_asset_* separat, reward_aptm NULL / net_aptm 0 und Gas als APTM separat. Originale Claim-Mengen/Preise/NFT-Zuordnung werden nicht überschrieben. Technische Asset-Evidenz am Kandidaten persistiert. Konfliktierende/partielle Preise blockieren. Vorhandene Transaktions-USD-Rewards ebenfalls vor doppelter Neuanlage geschützt.
- 198 lokale DAO-/Reward-Tests inkl. PostgreSQL und vier bestehende Preis-/Dashboard-Regressionsskripte bestanden. Migration 20261108213404_dao_erc20_single_claim_pipeline_806.sql vorbereitet; noch keine 8.06-Live-Abnahme. Neue Datei asset-policy.js beim späteren Edge-Deployment neben index.ts hinzufügen, bestehendes payout-coverage.ts behalten. Browser lädt genau dieselbe Repo-Datei.

## Phase 8.05 – Einzel-Claim-Pfad implementiert, Leerlauf live bestätigt

- Analyse: bisheriger manueller Rohimport endete vor Ownership/Payout/Preis/kanonischer Speicherung; allgemeine Worker-Prüflisten konnten alte Fälle erneut behandeln. Neue geschützte Admin-Route `process-next-native-claim-test-wallet` verbindet die vorhandenen Bausteine für genau einen neuen nativen Claim; feste Testwallet, Admin-JWT, Test-Import-Flag und deaktivierter Live-Worker bleiben Pflicht.
- Höchstens eine Rohdaten-Seite je Strom. Bei unvollständigem TX-/Flow-/Referral-Import Status import_partial, kein kanonischer Claim. Nach vollständigem Import SQL-Auswahl höchstens eines neuen Kandidaten: canonical_existing, Preis-Ausnahmen, no_payout_evidence, bereits gespeicherte NFT-Claims und vorhandene positive Transaktions-Rewards ausgeschlossen. Kein Kandidat ergibt legitim no_eligible_claim, nicht automatisch ein Fehler.
- Historischen Owner-Nachweis bei bekannten NFT-Kandidaten und bestehenden Payout-Verifier wiederverwenden. Neue Miner ohne ID bleiben unassigned_miner; Legacy ohne belegten Owner blockiert. Noch nicht unterstützte zugeordnete neue Miner und ERC20-Fälle blockieren ebenfalls, keine erfundene Zuordnung.
- Serverseitige service-only Abschluss-RPC sperrt Kandidaten und verwendet vorhandene Locks/Unique-Keys. Eindeutige erfolgreiche Claim-TX, passender Block, genau ein belegter nativer Flow mit Originalbetrag/18 Decimals und keine zusätzlichen eingehenden Assets erforderlich. Höchstens eine neue project_nft_claims-Zeile. Native Menge exakt per Raw×10^-18 normalisieren, bestehende Preise/Rewards/NFT-Daten nicht überschreiben.
- Bestehende exact-v13-Anker-RPC erhält eine gemeinsame scoped-Implementierung; unveränderter alter Aufruf delegiert an dieselbe Logik. Einzel-Claim-Pfad ergänzt nur fehlende Flow-Preisfelder genau dieser TX aus vorhandenem exaktem Zielanker. Keine neue Preisberechnung, keine Nachbarblock-/Predecessor-Route. Fehlender Anker, fehlende Ownership und uneindeutige Belege bleiben sichtbar blocked.
- Drei neue interne Kandidatenfelder claim_pipeline_status/reason/checked_at; pending, blocked oder completed. Blockierte Fälle nach 24h erneut auswählbar, optional manueller retryBlocked=true ohne Wartezeit; neue pending zuerst. Wiederholung vollständiger Claims erstellt nichts erneut. Abschlussfehler rollen Preisergänzung/Claim-Neuanlage/Abschlussstatus zurück; vorgelagerte Rohdaten-/Payout-Schritte sind absichtlich separat dauerhaft und wiederholbar.
- Migration `20261108132000_dao_single_native_claim_pipeline_805.sql`, danach index.ts aktualisieren, vorhandenes Hilfsmodul beibehalten. 173 lokale DAO-/Reward-Tests inkl. PostgreSQL bestanden. Leerlauf live bestätigt; neue native Claim-Neuanlage weiterhin nicht live geprüft. Der tägliche Job bleibt staged statt completed; neue Route verändert die Tagesqueue nicht. DAO-Cron und Live-Worker aus.

### 8.05-Live-Nachtrag · 08.11.2026 20:29:33 CET

8.05-Migration und index.ts-Deployment sind erfolgt. Der manuelle Einzel-Claim-Aufruf ergab no_eligible_claim / claimsCreated=0. TX-, Flow- und Referral-Import jeweils complete, incremental-delta, newBlocksObserved=false und upToDate=true bezogen auf die jeweilige Explorer-Ereignisliste. Gelesene Ereignisse: 36 TXs, 16 Flows, ein gezielter Referral-Flow und 36 beobachtete native Claim-Flows/Kandidaten; das sind Beobachtungszähler, keine bestätigten DB-Neuanlagen. Obere Ereignisblöcke unverändert 15'670'355 / 14'896'984 / 13'390'295. Kein Beweis einer unabhängigen Prüfung bis zum aktuellen Chain-Tip.

Separate Live-SQL-Kontrolle danach bestätigt exakt: 395 Kandidaten, 388 canonical_existing_verified, vier frühe payout-verifizierte Preis-Ausnahmen, drei no_payout_evidence, null offene zusätzliche Payouts und null pipeline-blocked. Damit sind inkrementeller Leerlauf und Schutz des Referenzbestands live belegt. Ein tatsächlich neuer Claim inklusive kanonischer Neuanlage ist durch diesen Lauf ausdrücklich noch nicht live geprüft.

## Phase 8.04 – begrenzte positive Payout-Prüfung live bestätigt

- Neuer Admin-Modus `check-pending-native-payouts-test-wallet`: echter Admin-JWT, `DAO_REWARD_ENABLE_TEST_IMPORT=true`, Live-Worker aus und genau eine serverseitig festgelegte registrierte Testwallet. Keine vom Request wählbaren User, Wallets, TXs oder Batchgrössen; maximal vier Kandidaten.
- Service-only RPC `wallettracking_dao_check_pending_native_payouts` prüft nur `payout_status=pending` und nicht kanonisch gekennzeichnete Kandidaten. Beide Claim-Selektoren unterstützt; bei New-Miner-Selector nur der bereits im bisherigen Abgleich verifizierte Miner-Vertrag. Eindeutige erfolgreiche TX, gleicher Block, genau ein positiver nativer `claim-native:<tx>`-Flow mit 18 Decimals und keine widersprüchlichen/zusätzlichen eingehenden Assets.
- Bestehende positive APTM-Menge mit Original-Wei vergleichen. Dieselbe fachliche Toleranz von 1e-15 APTM = 1'000 Wei, als exakte Ganzzahl-/Dezimaldifferenz ohne potenziell rundende Division. 1'000 Wei akzeptiert, 1'001 Wei abgelehnt. Historische Preise bleiben unabhängig; USD NULL blockiert keine Payout-Verifikation.
- Atomare Ausführung mit Kandidaten-Zeilensperren, Lese-Sperren der geprüften vorhandenen TX-/Flow-Zeilen und Wiederverwendung der 8.02-Persistenz-/History-RPC. Fehler im Batch rollen alle Payout-Schreibvorgänge dieses Aufrufs zurück. Wiederholungen prüfen nur verbleibende pending-Fälle; verified, no_payout_evidence und canonical_existing bleiben unangetastet. Review-Fälle werden von diesem speziellen Modus nicht automatisch wiederholt.
- Fehlende/ungültige/mehrdeutige Belege: needs_review mit Grund und Protokoll. Dieser Pass schreibt keine Flows/Claims/Preise/NFTs, keine canonical_existing-Kennzeichnung, keine Scan-Cursor oder Queue; nur Payout-Kandidaten-Metadaten. Positive Existenzprüfung ist nicht vollständige neue TX-Coverage; `payout_coverage.complete=false` bleibt dafür ehrlich.
- Migration `20261108125822_dao_pending_native_payout_checks_804.sql` und index.ts-Deployment abgeschlossen; Helper aus 8.03 beibehalten. 151 lokale Tests inkl. PostgreSQL bestanden. Live: checked=4, verifiedPayoutClaims=4, payoutsNeedingReview=0, pendingPayoutChecks=0. Anschliessende Wiederholung checked=0 / results leer; separate SQL-Persistenzprüfung erfolgreich, USD NULL / Preis-Ausnahme / canonical_existing=false erhalten. Keine vollständige Tagesjob-Freigabe; DAO-Cron bleibt aus.

## Phase 8.03 – Internal-TX-Erfolgsprüfung korrigiert

- 8.02-Migration durch User erfolgreich ausgeführt, Worker mit beiden Dateien deployt. Manueller Test `recheck-zero-payout-test-wallet`: 3 `needs_review`, 0 `verified`, 0 `no_payout_evidence`, 4 weitere pending-Payouts. Bei allen drei Prüfungen Abbruch am ersten internen Aufruf mit `internal-outcome-incomplete`.
- Ursache anhand der vom User gelieferten vollständigen Explorer-Antwort für TX `0x62864a66dd096ddd6941a1f9c600229e52b1f10a45f93b632bb9755a3b16cbd2` belegt: 17 Aufrufe, jeweils `success=true`, `error=null`, `value=0`, kein Feld `status`, `next_page_params=null`. Der 8.02-Parser verlangte fälschlich zusätzlich einen Erfolgsstatus.
- 8.03 akzeptiert boolesches `success=true` ohne zusätzlichen `status` oder alternativ einen expliziten Erfolgsstatus. Fehler, `success=false`, ungültige/unklare Erfolgswerte und widersprüchliche Statusfelder bleiben `needs_review`. Positiver nativer Eingang verhindert weiterhin negative Klassifikation.
- Sechs neue Regressionstests; insgesamt 137 lokale DAO-/Reward-Tests inkl. PostgreSQL bestanden. Echte Internal-TX-Antwort als Fixture erhalten; umgebende TX-/Token-Responses im Test kontrolliert, kein neuer unabhängiger Live-End-to-End-Nachweis.
- Änderung nur im Hilfsmodul `payout-coverage.ts`; keine Migration und kein geänderter `index.ts`. Deployment, Drei-TX-Live-Prüfung, SQL-Persistenz und erneute manuelle Prüfung sind inzwischen bestätigt; Details oben. DAO-Cron und Live-Worker bleiben aus.

## Phase 8.02 – Basis implementiert, vollständige Live-Abnahme offen

- Allgemeiner Auszahlungsstatus `no_payout_evidence` für beide Claim-Selektoren (DAO1/APTMDAO), strikt getrennt von NFT-Besitz, `canonical_existing_verified` und `audit_classification`. Kein Backfill der drei bekannten Fälle ohne Einzelprüfung.
- Vor negativer Einstufung: TX-Hash/Block/Selector/Erfolg/Absender/Empfänger gegen TX-Details prüfen; sämtliche transaktionsbezogenen Token- und Internal-Seiten lesen. Maximal zehn Seiten je Strom / 5'000 Einträge; API-Fehler, ungültige oder fehlende Pagination, unbekannte Token oder unklare Internals bleiben `needs_review`. Auch fremde/proxyseitige positive Eingänge und widersprechende persistierte Flows verhindern negative Klassifikation.
- Prüfabdeckung und zehn letzte Versuche dauerhaft am Kandidaten gespeichert. `needs_review` und `no_payout_evidence` nach mindestens 24 Stunden erneut prüfbar, neue `pending` zuerst; insgesamt maximal 20 pro Worker-Aufruf. Spätere belastbare persistierte Zahlungen können `verified` ergeben; unvollständige Nachprüfung führt zurück zu `needs_review`. Verifizierte/kanonisch markierte Kandidaten werden geschützt, Row-Lock und Zeitstempelvergleich verhindern veraltete Überschreibungen.
- Auszahlungsprüfung funktioniert unabhängig vom NFT-Prüfstatus. Noch offene `pending`-Payouts halten die inkrementelle Queue auf `partial`, damit der nächste Abschnitt am selben Tag bearbeitbar bleibt. `staged` ist weiterhin kein abgeschlossener Reward-Job.
- Kontrollierter Admin-Testmodus für maximal drei Null-Reward-TXs der fest hinterlegten Testwallet vorbereitet. Lokal synthetische Fixtures geprüft; die drei echten Fälle sind inzwischen live als no_payout_evidence geprüft und dauerhaft bestätigt (siehe oben). Vollständigkeit gilt für Explorer-Indexdaten, nicht als unabhängig verifizierter On-Chain-Negativnachweis.
- 8.02-Migration `20261108111030_dao_no_payout_evidence_802.sql` erfolgreich live ausgeführt; der erste manuelle Drei-TX-Test ist oben unter 8.03 dokumentiert. Die damaligen 131 lokalen Tests sind durch insgesamt 137 Tests in 8.03 ergänzt. DAO-Cron und `DAO_REWARD_ENABLE_LIVE_WORKER` bleiben deaktiviert.

## Unmittelbar nächster Schritt

Nur `supabase/migrations/20261108222813_cross_chain_token_metadata_808.sql` vollständig im Supabase SQL Editor ausführen. Mehrere DDL-/Funktionsanweisungen in einer atomaren Transaktion; keine separaten SELECT-Resultsets. Keine Provider-Abfrage und kein Cron beim Ausführen. Erst nach Rückmeldung Deployment anleiten.

## Danach weiter offen – DAO-Reward-Pipeline

- Vier frühe positive Payouts mit 8.04 live, dauerhaft und wiederholungssicher bestätigt. USD bleibt NULL, Preis-Ausnahme erhalten, keine canonical_existing-Kennzeichnung. Dieser Prüfschritt ist abgeschlossen.
- Drei Null-Reward-TXs einschliesslich dauerhaftem Status und manuell erzwungener Neuprüfung abgeschlossen. Automatische Wiederaufnahme nach echter 24h-Wartezeit sowie späterer positiver Evidenz noch nicht live getestet; lokale Tests decken diese Übergänge ab. Die vier frühen positiven Payouts sind inzwischen durch 8.04 bestätigt; weitere Zuordnungs-/Pipeline-Schritte bleiben separat zu prüfen.
- 8.06-Migration/Deployment und allgemeine Einzel-Claim-Route live prüfen; bei fehlendem echtem Kandidaten nur Leerlauf belegbar. Echte neue native und ERC20-Neuanlage live noch offen. Technische RPC-Metadaten müssen am Claim-Block abrufbar sein; andernfalls blockiert der Claim korrekt.
- Nativer Einzel-Claim-Pfad 8.05: Leerlauf live bestätigt, tatsächliche neue Claim-Neuanlage noch live prüfen; keine historischen Referenzfälle künstlich zurücksetzen. Fehlende zentrale Anker bleiben echte Blockierung. Anschliessend den manuellen Pfad in die vollständige inkrementelle Tagesqueue integrieren.
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
- **8.25 Bitcoin-Fallback lokal vorbereitet (Deployment/Live-Test offen):** täglicher BTC-Bestandsjob verwendet bei transienten Blockstream-Fehlern einmalig mempool.space; SQL-Archivierungsfehler `pg_catalog.coalesce` am 12.11. live behoben, am 13.11. vier von sechs Usern mit Abschluss. Ein User mit BTC HTTP 429 nach drei Versuchen, anderer User nach dem Job um drei Wallets erweitert. Historische Lücken / Retention weiterhin separat prüfen.
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

## Bereits vorhandene lokale Testlücken

Erwartungen des historischen Docs-Cleanup-Tests und veralteter Snapshot-Testmock wie im 8.08-Release beschrieben korrigieren; beide Fehler bestehen bereits im 8.07-Baseline-Lauf. Keine Behauptung eines fehlerfreien kompletten tests/*.mjs-Laufs.
