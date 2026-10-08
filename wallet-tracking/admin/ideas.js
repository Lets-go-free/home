// Phase 7.52 · 08.10.2026 17:57:22 CEST: Kurse: zwei Tabellen bei ausreichender Bereichsbreite, sonst eine gemeinsame Tabelle; Contract-Adressen kleiner auf zweiter Zeile. Build 20261008-175722.
// Phase 7.51 · 08.10.2026 17:45:09 CEST: Aktuelle Kurse in einer gemeinsamen Tabelle mit einem Tabellenkopf und durchgehend ausgerichteten Spalten. Build 20261008-174509.
// Phase 7.50 · 08.10.2026 17:32:52 CEST: Aktuelle Kurse über volle Dashboard-Breite; Tabellenaufteilung nach verfügbarer Breite, horizontaler Scroll bei schmalen Ansichten. Build 20261008-173252.
// Phase 7.49 · 08.10.2026 16:51:54 CEST: Aufgaben mit zusätzlichen Besitzer-/Partnernamen bei unveränderten IDs; Legacy-LPT ohne unbelegten aktuellen Kurs, fehlende Bewertung erklärt. Build 20261008-165154.
// Phase 7.48 · 08.10.2026 16:09:06 CEST: Separate wAPTM-Miner-Nachzahlungen je Wallet bestätigen/ignorieren; Nicht zugeordnet, Dashboard-Aufgabe und dauerhafte User-Entscheidung (SQL 091). Build 20261008-160906.
// Phase 7.47 · 08.10.2026 15:32:02 CEST: Entdecken: alle offenen Tokens als Spam markieren statt sicher hinzufügen; sichere Tokens geschützt, walletbezogene Speicherung. Build 20261008-153202.
// Phase 7.46 · 08.10.2026 14:38:04 CEST: Entdecken für alle Wallets, sichere Sammelaktion, aktuelle DID-Besitzer getrennt von Mint-Kanten; vollständige Dokumentation. Build 20261008-143804.
// Phase 7.45 · 08.10.2026 01:35:12 CEST: Mint ohne Zahlung in dieser TX bei vollständig geprüfter TX; Kaufpreis bleibt unbekannt. Build 20261008-013512.
// Phase 7.44 · 08.10.2026 01:11:21 CEST: NFT-Erwerbs-TX und separater Wallet-Eingang; Bot-Erwerbslinks im DAO-Baum. Build 20261008-013512.
// Phase 7.43 · 08.10.2026 00:52:11 CEST: DAO1-Metadaten-404 sauber behandeln und Abrufe deduplizieren; Recovery nur für bestehende Konten. Build 20261008-013512.
// Phase 7.42 · 06.10.2026 13:54:49 CEST: Endgültige Kontolöschung mit serverseitiger Admin-Sperre; Datenreset erhält Adminrechte; neutrale Registrierungsmeldung. Build 20261006-135449.
// Phase 7.41 · 05.10.2026 22:54:48 CEST: Bot-Kaufpreise nach Datenaktualisierung sofort aus Cache anzeigen; APTMDAO als Standard-Teamtab. Build 20261005-225448.
// Phase 7.40 · 05.10.2026 19:23:08 CEST: Ursprünglicher Miner-Erwerb mit Datum/Tx unabhängig vom Kaufpreis; Upgrades separat. Build 20261005-192308.
// Phase 7.39 · 05.10.2026 17:43:04 CEST: Privater Datenbank-Backup-Helper inkl. Auth; Kauf-/Upgrade-Datum sichtbar. Build 20261005-174304.
// Phase 7.38 · 05.10.2026 16:38:37 CEST: Prelaunch-Claims getrennt von fehlenden USD-Preisen; Claim-Prüfpunkt niedrige Priorität; Backup-Dokumentation. Build 20261005-163837.
// Phase 7.37 · 05.10.2026 15:21:10 CEST: Admin-Stammdatenexport, Restore-Doku, Sticky-Spaltenbreiten. Build 20261005-152110.
// Phase 7.36 · 05.10.2026 14:08:37 CEST: DAO-Teamjobs im zentralen Lauf ohne Queue-Deadlock; kritische Chain-Spalten wieder orange in Hell/Dunkel/Sticky/Hover. Build 20261005-140837.
// Phase 7.35 · 05.10.2026 04:13:47 CEST: RPC-Retry, Cache-Erhalt bei Fehlern, korrekte Tagesmarker und Abschluss nach gesamtem Lauf. Build 20261005-041347.
// Phase 7.34 · 05.10.2026 03:12:13 CEST: Mining-Bot-Upgrade on-chain verknuepft; urspruenglicher Kaufpreis/Datum/Tx uebernommen, Summen dedupliziert. Build 20261005-031213.
// Phase 7.33 · 05.10.2026 02:00:33 CEST: Partnernamen DAO1/APTMDAO/TLN-VOW mit nutzerbegrenztem Service-Zugriff; TLN-Sammelspeicherung bewahrt DAO-Aliase. Build 20261005-020033.
// Phase 7.32 · 04.10.2026 23:31:15 CEST: Bot-DID-Zuordnung ist dynamisch aus aktuellem Owner-Wallet + DID-Kombination; Mining/Trading-Regeln getrennt, Rewards bleiben wallet-genau und contract+id-genau. Build 20261004-233115.
// Phase 7.30 · 04.10.2026 17:04:30 CEST: DAO/APTM-Teamtrennung in User-UI wiederhergestellt; Dashboard bleibt 1 Wallet = 1 Partner. Referral-Tabelle korrigiert und DID-Alias ergänzt; verursachender Partner bleibt ohne eindeutige On-Chain-Evidenz offen. Build 20261004-170430.
// Phase 7.29 · 04.10.2026 03:53:51 CEST: UI/Admin-Aufräumaudit finalisiert: Aktualisierungszeitpunkte und Buttonrollen verifiziert; Loan-/DAO-Team-Vollrefresh als Admin-Retry beschriftet, bestehende zentrale Daten-/Preislogik unverändert. Build 20261004-035351.
// Phase 7.29 · UI/Admin-Refresh-Audit final:
// • Dashboard „Daten aktualisieren“ bleibt die zentrale manuelle User-Aktion; der erste aktive Tagesstart führt weiterhin den kontrollierten Delta-Refresh aus.
// • Aktuelle Preise werden global je 15-Minuten-Slot nachgeführt; manueller Preis-Refresh bleibt Admin-only.
// • TLN/VOW Loans: Tab-Öffnen lädt Cache, ergänzt Eröffnungen inkrementell und prüft Lifecycle automatisch; „Loans neu laden erzwingen“ ist nur Admin/Retry.
// • DAO Team: normaler Start cache-first + inkrementeller Freshness-Check; „Team-Refresh erzwingen“ ist nur Admin/Retry.
// • DAO1 NFT-/Historical-Reprice-Reparaturen bleiben Admin-only. „Datenstand pro Wallet“ bleibt standardmäßig eingeklappt. Legacy „Liquidity Pools_old“ bleibt entfernt.
// Phase 7.28 · 04.10.2026 03:28:40 CEST: 31.12.-Steueraudit: Spam-Filter bestaetigt; ESTV-Direktbewertung gegen unbekannte Symbol-Imitationen gehaertet und historischer Polygon/MATIC-Code trotz POL-Anzeige korrekt aufgeloest. Build 20261004-032840.
// Phase 7.27 · 04.10.2026 03:19:00 CEST: Retirement Migration 088 fuer project_miner_ownership und alten userbezogenen Preis-Tagescache wallet_current_price_snapshots; Sicherheitsguards + Delete-RPC-Bereinigung. Build 20261004-031900.
// Phase 7.26 · 04.10.2026 02:18:30 CEST: Retirement-/Altbestand-Audit: produktive Tabellen gegen Browsercode, Edge Functions und DB-Rollen klassifiziert; vier echte Kandidaten plus tln_wallet_identity_cache als Testpfad dokumentiert. Keine Tabelle gelöscht. Read-only Live-Audit SQL ergänzt. Build 20261004-021830.
// Phase 7.25 · 04.10.2026 01:54:16 CEST: Supabase-Härtung Migration D1: Cache-/Jobtabellen vollständig gegen Browser-/Projektcode klassifiziert; eindeutig backendvermittelte Tabellen werden per SQL 087 service-role-only. Kein Schema-Umzug ohne Backend-/RPC-Kapselung. Build 20261004-015416.
// Phase 7.24 · 04.10.2026 01:33:35 CEST: Supabase-Härtung Migration C vorbereitet: User-/Wallettabellen verlieren anon-Zugriff; authenticated wird auf RLS-passende DML-Rechte begrenzt. Admin-Chains: technische Spalten wieder orange markiert. Build 20261004-013335.
// Phase 7.22 · 04.10.2026 00:58:30 CEST: Dashboard-Aktionsstatus für Bestandschecks präzisiert; frisch erfasste Wallets werden nicht mehr fälschlich als „älterer Bestandsstand“ bezeichnet. Build 20261004-005830.
// Phase 7.21 · 04.10.2026 00:42:41 CEST: Supabase-Härtung A: Migration 084 für anon/PUBLIC-RPC-EXECUTE vorbereitet; Default-Privileges für neue Functions gehärtet. Build 20261004-004241.
// Phase 7.20 · 04.10.2026 00:38:58 CEST: Supabase-Härtungsaudit: Least-Privilege-Lücken und interne public-Kandidaten klassifiziert; keine produktiven GRANTs geändert. Build 20261004-003858.
// Phase 7.19 · 04.10.2026 00:33:34 CEST: Verifizierten globalen Stammdaten-Seed aus geprüftem Live-Export ergänzt; 9 Tabellen, idempotente Upserts und sichere Sequenzbehandlung. Build 20261004-003334.
// Phase 7.16 · 03.10.2026 19:08:37 CEST: DB-Reproduzierbarkeit Phase 1 vorbereitet: read-only Baseline-Export/Inventar im Repo; fehlende historische Migrationen werden nicht erfunden. XRPL issued currencies/Trustlines inkl. USDC + RLUSD als spaeterer Ausbaupunkt dokumentiert. Build 20261003-190837.
// Phase 7.13 · 03.10.2026 12:06:08 CEST: Auth-Strang offiziell abgeschlossen; Magic Link nur noch Recovery/Übergang, E-Mail/Passwort + Google sind produktive Loginwege. Build 20261003-120608.
// Phase 7.12 · 03.10.2026 11:47:55 CEST: Discovery zeigt Tokenname separat und erkennt Imitationen vordefinierter sicherer Token anhand Name/Symbol bei abweichender Contract-/Mint-Adresse als Spam-Verdacht. Build 20261003-114755.
// Phase 7.11 · 03.10.2026 11:29:57 CEST: Predefined-Token-Filter zeigt zentrale Chain-Labels; Migration 082 ergänzt native USDC/USDT-Stammdaten auf Base/Solana/Avalanche. XRPL-USDC bleibt offen bis issued-currency/Trustline-Support. Build 20261003-112957.
// Phase 7.06 · 02.10.2026 16:01:02 CEST: Auth-Formulare fuer iCloud/Browser-Passwortmanager vervollstaendigt; Login- und Passwort-Setzen-Submit bleiben native Form-Events. Build 20261002-160102.
// Phase 7.05 · 02.10.2026 15:40:32 CEST: Auth-Redirect-Race behoben; Login für iCloud/Browser-Passwortmanager robust; alter Versionsfooter entfernt. Build 20261002-154032.
// Phase 7.04 · 02.10.2026 12:18:02 CEST: Auth-Basis E-Mail/Passwort + UUID-Adminmigration 081; Google/Apple folgen kontrolliert. Build 20261002-121802.
// Phase 7.03 · 02.10.2026 04:52:42 CEST: TLN/VOW Voucher-Fachregel chain-spezifisch korrigiert: BSC strikt Voucher→VOW→USDT, Ethereum mit eigener realer Poollogik; globaler Preissnapshot v4 invalidiert. Build 20261002-045242.
// Phase 7.02 · 02.10.2026 04:37:13 CEST: Realtest 7.01 lokalisiert 50/53 Generalpreis-Requests im Apertum-DEX und 65/95 TLN/VOW-Requests in der Referenzauflösung; 7.02 optimiert genau diese Datenbeschaffung mit unveränderten Preisformeln und Legacy-Fallback. Build 20261002-043713.
// Phase 7.01 · 02.10.2026 04:18:28 CEST: Realtest 7.00 zerlegt 150 Preisjob-Requests in 53 Generalpreise + 95 TLN/VOW + 1 Snapshot + 1 Fees; 7.01 diagnostiziert beide Hotspots tiefer ohne Preislogikänderung. Build 20261002-041828.
// Phase 7.00 · 02.10.2026 04:01:52 CEST: Realtest 6.99 = 163 isolierte Browser-Requests bei nur 181 eth_calls; 7.00 instrumentiert den gesamten globalen Refresh phasenweise und entfernt einen doppelten Gebühren-Refresh. Build 20261002-040152.
// Phase 6.99 · 01.10.2026 20:12:06 CEST: Realtest 6.98 = 130 isolierte Browser-Requests, 236 eth_calls; 6.99 trennt Preis-Pair-State von LP-Zusatzdaten und entfernt redundante factory()-Reads. Build 20261001-201206.
// Phase 6.98 · 01.10.2026 18:19:31 CEST: Realtest 6.97 = 192 isolierte Browser-Requests; 219 eth_calls exakt aufgeschlüsselt. 6.98 bündelt dieselben Pair-State-Reads chainweit, ohne Preisformeln/Felder zu ändern. Build 20261001-181931.
// Phase 6.97 · 01.10.2026 17:36:51 CEST: Preisjob-Status im Dashboard sichtbar; RPC-Diagnose zählt eth_calls nach ABI-Methode. Realtest 6.96: 161 Requests im zweiten Lauf, 219 eth_calls = 45 getPair + 29 Pair-States × 6 Reads. Build 20261001-173651.
// Phase 6.96 · 01.10.2026 17:15:03 CEST: V2-getPair-Discovery vor dem Preisbau chain-weit gebatcht; identische parallele Pair-Lookups werden In-Flight dedupliziert; RPC-Diagnose erweitert. Build 20261001-171503.
// Phase 6.95 · 01.10.2026 16:47:46 CEST: Preisrefresh weiter optimiert (Stammdaten statt ERC-20-Metadaten-RPC, JSON-RPC-Batches); Dashboard-Aktionsblock zeigt nur echte Aufgaben. Build 20261001-164746.
// Phase 6.94 · 01.10.2026 16:20:46 CEST: v-Waehrungs-Preislogik wieder IN_PROGRESS: Dust-Pools werden verworfen, doppelter Ethereum-Preisresolver entfernt und Requestmenge reduziert. Build 20261001-162046.
// Phase 6.93 · 01.10.2026 14:16:13 CEST: Ethereum-vCurrency-Preise vereinheitlicht: alle aktiven V2-Factorys plus Uniswap V2, direkte USDT/USDC-Pools und Voucher→VOW→USDT; Wallet-Loeschung bleibt nach Reload auf „Meine Wallets“. Build 20261001-141613.
// Phase 6.92 · 01.10.2026 11:08:51 CEST: Ethereum-vCurrencies erkennen reale Uniswap-V2-Pools dynamisch (USDC/USDT/VOW/WETH), lesen fehlende Token-Decmals on-chain und bevorzugen liquide reale Routen. Admin-Kontextnavigation bleibt nach Refresh auf der aktiven Hauptsektion. Build 20261001-110851.
// Phase 6.91 · 01.10.2026 01:10:43 CEST · TLN/VOW Ethereum Livepreise via deterministische Uniswap-V2-Route. Build 20261001-011043.
// Phase 6.90 · 01.10.2026 00:53:21 CEST: Eigene sichere Token werden generisch ueber DEX/GeckoTerminal und CoinGecko-Contract-Fallback bewertet; verifizierte eigene LPs ueber Reserven + TotalSupply. Build 20261001-005321.
// Phase 6.89 · 30.09.2026 09:20:41 CEST: 31.12.-Workflow: fehlende Preise werden als Token-Prüfaufgabe mit direktem Sprung in die passende Token-Verwaltung behandelt. Build 20260930-092041.
// Phase 6.88 · 30.09.2026 02:21:03 CEST: 31.12.-Performance/BSC: kategoriebasierte deterministische TLN/VOW-Historienrouten werden vor der breiten WalletPriceEngine-Suche verwendet; fehlende historische Preise werden mit Asset/Chain sichtbar. Build 20260930-022103.
// Phase 6.87 · 30.09.2026 01:58:58 CEST: 31.12.-Performance/Apertum: persistenter DEX-Pair-State-Cache; neue spaetere Stichtage fuehren Sync-/LP-Supply-Zustaende nur ueber das Intervall seit dem letzten exakt gecachten Pair-State fort. Build 20260930-015858.
// Phase 6.84 · 30.09.2026 00:55:18 CEST: 31.12.-Darstellung: Wallet-Adressen kompakt, Preis-Dezimalstellen dynamisch bis 8 Stellen; Werte/Summen bleiben 2-stellig. Build 20260930-005518.
// Phase 6.82 · 30.09.2026 00:32:45 CEST: 31.12.-Performance: persistenter userbezogener Supabase-Cache fuer historische Token-Balances und ERC-20-Kandidaten; gleiche Stichtagsblocks werden spaeter cache-first wiederverwendet. Build 20260930-003245.
// Phase 6.79 · 29.09.2026 18:17:43 CEST: 31.12.-Performance-Audit: historische Spam-/Airdrop-Contracts werden nicht mehr einzeln abgefragt; LP-/Staking-Historie wird je Wallet/Projekt einmal geladen und wiederverwendet. DAO1-LP-Tab cache-first + täglicher Auto-Delta beim Öffnen, Force-Refresh Admin-only. Build 20260929-181743.
// Phase 6.78 · 29.09.2026 17:48:45 CEST: LP/Staking projektübergreifend: globale LP-Pair-Registry + Admin-Verifikation + mögliche Staking-Contracts; projectless LPs unterstützt. DAO1 reale Staking-Regression bleibt offen. Build 20260929-174845.
// Phase 6.77 · 29.09.2026 17:15:17 CEST: Staking-Vermögensverifikation: DAO1-Katalog-Pairs auch ohne predefined lp_token autoritativ; historische Stake/Unstake-Abgrenzung blockgenau gehärtet. Synthetische Fälle aktiv / Teil-Unstake / finaler Unstake / fehlender Timestamp = PASS. Build 20260929-171517.
// Phase 6.76 · 29.09.2026 17:08:12 CEST: Steuer-PDF zeigt technische Block-/Preisrouten nur noch optional über Prüfdetails; Standardexport verwendet verständliche Kurzquellen. Build 20260929-170812.
// Phase 6.75 · 29.09.2026 16:40:48 CEST: CoinGecko-Proxy-Architektur umgesetzt: Browser ruft keine api.coingecko.com-Endpunkte mehr direkt auf; Current + History über authentifizierte Supabase Edge Function mit Secret COINGECKO_DEMO_API_KEY. Build 20260929-164048.
// Phase 6.74 · 29.09.2026 15:25:57 CEST: Staking-Principal projektübergreifend: TLN/VOW und DAO1-LP zählen bis zum tatsächlichen Unstake in Current-Wealth und 31.12.-Historie; DAO1-Staking-Klassifikation nutzt verifizierten Contract-Katalog. Persistente Projekt-Navigation TLN/VOW | DAO1. Build 20260929-152557.
// Phase 6.73 · 29.09.2026 13:41:24 CEST: Daten-/Preisstatus im Wallet-Bestand entdoppelt; Aktualisierungsdetails inkl. Wallet-Datenstand liegen kompakt und standardmäßig eingeklappt im globalen Statusrahmen. Build 20260929-134124.
// Phase 6.71 · 29.09.2026 13:20:32 CEST: Navigation konsolidiert; CoinGecko-Preisquellen-Audit abgeschlossen. DeFi-Projekte liegt als Dashboard-Tab; CoinGecko 403/429 erzeugt keine Wiederholungsschleife, stale Preise bleiben erhalten. Offener Architekturpunkt: Demo-Key nur serverseitig per Proxy/Secret. Build 20260929-132032.
// Phase 6.70 · 29.09.2026 13:12:21 CEST: 31.12.-PDF erhält optionale Prüfdetails; Standardexport bleibt steuerfreundlich kompakt. Build 20260929-131221.
// Phase 6.68 · 28.09.2026 19:21:53 CEST: Refresh-/Button-Audit abgeschlossen: Dashboard-Refresh zentralisiert auch DAO1/APTMDAO Delta-Sync; DAO-NFT-Ownership-/Reprice-Reparaturen nur Admin; doppelter Apertum-NFT-Liveabruf im kombinierten Tageslauf vermieden. Build 20260928-192153.
// Phase 6.67 · 28.09.2026 18:38:22 CEST: 31.12.-Tokenanzeige Browser/PDF/Excel zentralisiert: bekannte Contract-Assets (u.a. VOW) werden aus Stammdaten benannt, Adressen sekundär/gekürzt; PDF-Spalten gegen Überlappung gehärtet. Build 20260928-183822.
// Phase 6.66 · 28.09.2026 18:04:55 CEST: Steuerkurs-Stammdaten (ESTV CHF + USD/CHF) und 31.12.-Preisgrundlage USD/CHF umgesetzt. Build 20260928-180455.
// Phase 6.65 · 28.09.2026 17:19:53 CEST: Safe-/Predefined-Tokenänderungen ohne globalen loadAll, Chain-abhängiger Tokenfilter und eingeklappter Wallet-Datenstand innerhalb Datenaktualisierung. Build 20260928-171953.
// Phase 6.64 · 28.09.2026 14:12:28 CEST: Native predefined_tokens sind in der Admin-UI wie Contract-Tokens einem DeFi-Projekt/Projekt-Kategorie zuordenbar; Dark-Mode-Zeilen der Token-/Projekt-Tabellen gehärtet. Build 20260928-141228.
// Phase 6.63 · 28.09.2026 13:54:47 CEST: DAO1-Dashboard zählt projektzugeordnetes natives APTM; Discovery-Sammelspam respektiert Safe-Freigaben; 31.12.-Bestände schließen bestätigten User-Spam aus, Safe hat Vorrang. Build 20260928-135447.
// Phase 6.62 · 28.09.2026 13:35:30 CEST: Täglichen kontrollierten Delta-Refresh für bestehende Wallets und DAO1/APTMDAO wieder aktiviert; zentrale Refresh-Buttons auf Dashboard konsolidiert, Preis-/Loan-/Team-Force-Aktionen Admin-only. Referral-Rewards nach verursachendem Partner/DID/Name als offene Idee dokumentiert, nicht umgesetzt. Build 20260928-133530.
// Phase 6.59 · 28.09.2026 11:17:45 CEST: Fresh-TLN-Wallet Dashboard zeigt Reward-Datenzustand explizit (noch nicht ermittelt / wird ermittelt / vollständig bzw. partiell/Fehler) und bietet bei unbekannten Detaildaten „Detaildaten jetzt ermitteln“. Der Button nutzt die bestehende kontrollierte Steps-1–6-Erst-Discovery; kein automatischer Browser-Vollscan, kein Step 7. Erfolgreiche Ergebnisse werden wieder global/persistent cache-only genutzt. Build 20260928-111745.
// Phase 6.58 · 28.09.2026 04:23:01 CEST: Reward-Summary-Anzeigen in Staking/Rewards, Referral und Bonus auf normale Benutzersprache umgestellt. Technische Begriffe Summary-Cache/sanitisiert/Human-Units entfernt; Reward-Tx wird aus Detaildaten nur bei vollständig abgedecktem Wallet-Scope gezählt. Build 20260928-042301.
// Phase 6.57 · 28.09.2026 04:12:38 CEST: Regression-Fix dokumentiert: projectChainRefHtml war seit der gekürzten Chain-Referenz-Darstellung aufgerufen, aber nicht definiert. Zentralen Helper ergänzt; Staking-/Referral-/Bonus-Rendering darf dadurch nicht mehr mit ReferenceError abbrechen. Build 20260928-041238.
// Phase 6.55 · 28.09.2026 03:54:52 CEST: Legacy-Tab „Liquidity Pools_old“ vollständig entfernt; „Kurse und Pools“ bleibt die einzige produktive TLN/VOW-Poolansicht. Fresh-User-Detailarchitektur unverändert: systemweit unbekannte Wallets brauchen weiterhin eine kontrollierte serverseitige Erst-Discovery statt Browser-Vollscan. Build 20260928-035452.
// Phase 6.53 · 28.09.2026 02:44:40 CEST: Rewards Summary in Staking/Rewards integriert; separater Tab entfernt. Globaler TLN/VOW On-Chain-Detailcache v2 übernimmt beim serverseitigen Fresh-User-Backfill zusätzlich vorhandene Step-6-USD-Bewertungen. Detailstatus-Hinweise konsolidiert; lange Chain-Referenzen in Reward-/Claim-Tabellen gekürzt. Build 20260928-024440.
// Phase 6.52 · 28.09.2026 02:20:05 CEST: Globaler userfreier TLN/VOW On-Chain-Detailcache umgesetzt. wallet-private sanitisiert für eigene Wallets bereits vorhandene verifizierte Staking-/Reward-/Referral-/Bonus-Details aus einem privaten Discovery-Snapshot derselben On-Chain-Adresse und persistiert sie global; Fresh User lesen diese Details cache-only ohne Browser-History-Scan. Nur die Erst-Discovery einer Wallet, die im System noch nie verifiziert wurde, bleibt offen. Build 20260928-022005.
// Phase 6.49 · 28.09.2026 01:01:15 CEST: TLN Reward-Decimals-Fix als Architekturregel: Reward-Summaries dürfen ausschließlich normalisierte Human-Units speichern. Edge-Backfill normalisiert Raw-Felder mit verifizierten Token-Decimale und erkennt Legacy-Snapshots, deren große raw-scaled amount-Werte als JS-Number/Scientific-Notation persistiert wurden. Globaler dashboard_reward_summary Cache auf v2/schemaVersion 2/amountUnit=human angehoben; v1 wird ignoriert und neu aufgebaut. Wiederholte Decimals-Fehler sollen damit nicht mehr über Anzeige-Formatter repariert werden. Build 20260928-010115.
// Phase 6.46 · 27.09.2026 20:19:27 CEST: TLN-Team-Restore auch fuer Zusatzregistries strikt cache-only. Realtest 6.45 zeigte weiterhin >1000 eth_getTransactionByHash-Requests durch automatischen historischen Zusatzregistry-Join-Aufbau bei leerem Cache. Dieser Neuaufbau sowie die Evidence-Tx-Parent-Hydrierung sind nun nur noch im expliziten Step-7-Pfad erlaubt. DB-Reproduzierbarkeit/entfernte SQL-Migrationen als offener Auditpunkt festgehalten. Build 20260927-201927.
// Phase 6.39 · 27.09.2026 12:05:26 CEST: P10 Supabase-Security-Audit dokumentiert; produktiv bereits ausgeführtes RPC-Hardening (5 REVOKE EXECUTE) als Migration nachgeführt. Shared-Cache-Browserwrites bleiben als bewusst akzeptiertes Integritätsrisiko unverändert. Build 20260927-120526.
// Phase 6.37 · 27.09.2026 11:25:02 CEST: P9 Invalidierungs-/Versionierungs-Audit abgeschlossen. Block-versionierte TLN/VOW-Staking- und technische Persistenz-Caches erhalten monotone Write-Guards gegen Rückschreiben älterer Browser-Stände; bestehende DATA_VERSIONS-/Schema-/Partial-Schutzverträge bestätigt. P9 = erledigt. P10 Security/Supabase: RLS/Policies/GRANTs/RPCs wurden gegen die produktive DB geprüft. Alle WalletTracking-public-Tabellen haben RLS; private Userdaten sind auth.uid()-gebunden, no_plain_wallet ist RESTRICTIVE. Kein bestätigter anon-/Cross-User-Zugriff auf private Walletdaten. Shared DAO/APTMDAO-/TLN-/Preis-Caches bleiben bewusst browserbeschreibbar; ein manipulierter eingeloggter Client könnte globale Ableitungen verfälschen, dieses Integritätsrisiko wird derzeit akzeptiert, weil ein Umbau die produktiven Fresh-/Cache-Pfade stärker gefährdet. Phase 6.39 dokumentiert fünf bereits produktiv ausgeführte REVOKE EXECUTE für reine Trigger-/Cleanup-Funktionen als SQL 074. P10 bleibt bis Cross-User-Negativtest/Restprüfung in Arbeit. Build 20260927-112502.
// Phase 6.36 · 27.09.2026 11:22:14 CEST: P9 Cache-Ownership-Inventur abgeschlossen. RAM, Browser/IndexedDB, private user-/walletbezogene Persistenz und globale/shared Chain-Caches sind mit SoT-/Delete-Regeln klassifiziert; keine akute Cross-User-/Purge-Lücke gefunden. Nächster P9-Schritt: Invalidierungs-/Versionierungsverträge prüfen. Build 20260927-112214.
// Phase 6.34 · 27.09.2026 03:45:02 CEST: P8 Session-Verlust als zentraler Zustand: Cache bleibt sichtbar, Re-Login wird angezeigt, private/Edge-Requests werden ohne Session blockiert; 401-Kaskaden vermieden. Build 20260927-034502.
// Phase 6.33 · 27.09.2026 03:34:30 CEST: P8 Auth-Diagnose für apertum-nft-history ergänzt; 401/403 werden ohne Tokeninhalt auf Session-/User-Zustand geprüft und als partial klassifiziert. Build 20260927-033430.
// Phase 6.30 · 27.09.2026 02:19:44 CEST: P6-Realtest-Blocker behoben: versehentlich entfallene DAO1 Claim-Receipt-/Asset-Flow-Helper wiederhergestellt; P6 Read-Model-Diagnose fachlich unverändert. Build 20260927-021944.
// Phase 6.29 · 27.09.2026 01:55:00 CEST: Audit P5 nach 6.28-Realtest abgeschlossen; P6 NFT/Bot Current-State-Readmodel mit Konsistenzdiagnose gestartet. Build 20260927-015500.
// Phase 6.28 · 26.09.2026 19:15:59 CEST: P5 APTM-Anchor-Sync bis höchste offene Post-Launch-Claims; lokaler read-only Exact-Fallback für normale User; Prelaunch global ab Block 88356. Build 20260926-191559.
// Phase 6.27 · 26.09.2026 18:08:50 CEST: P5 Diagnose-Timingfix für 6 Post-Launch-Missing-Claim-Preise; heller Projekt-Subnav im Dark Mode korrigiert. Build 20260926-180850.
// Phase 6.26 · 26.09.2026 17:56:20 CEST: P5: Missing-Preis-Repricing/Diagnose in DAO1-Start/Refresh verlagert; Prelaunch dauerhaft markiert; DAO1 Dark-Mode-Zeilen korrigiert. Build 20260926-175620.
// Phase 6.25 · 26.09.2026 17:31:56 CEST: P5 Diagnose: 10 offene native APTM-Claim-Preise werden gegen Exact-/Nachbar-/Legacy-Preisanker geprüft; Preislogik unverändert. Build 20260926-173156.
// Phase 6.24 · 26.09.2026 17:17:59 CEST: P5 UI-Fix: Claim-Stückpreis-Spalte liest project_transaction_asset_flows.price_usd; 6.23-Preis-Migration im Realtest mit 257/267 bewerteten Flows bestätigt. Build 20260926-171759.
// Phase 6.21 · 26.09.2026 12:12:27 CEST: P5 Schritt 3 entfernt Legacy-Reads aus sichtbaren DAO1 Claim-/Transaktions-/Exportpfaden; Asset-Flows sind kanonische Auszahlungssource. Build 20260926-121227.
// Phase 6.18 · 25.09.2026 18:33:32 CEST: P4: gemessene serielle Owner-/Collections-Abfragen werden parallelisiert; übrige Fachlogik unverändert. Build 20260925-183332.
// Phase 6.12 · 24.09.2026 18:30:01 CEST: Audit P3 im Realtest abgeschlossen (Fresh-Build deckungsgleich inkl. historischer Kaufpreise). P4 optimiert den gemessenen Asset-Flow-Hotspot: Fresh-Build speichert Flows einmal roh, historische USD-Bewertung gezielt/lazy; Resolver-v3-Ergebnisse werden cache-first wiederverwendet. Build 20260924-183001.
// Phase 6.11 · 24.09.2026 17:32:01 CEST: Audit P3 Kaufpreis-Regression: späterer Wallet-Eingang darf ursprüngliche Kauf-Tx nicht ersetzen; zentraler Resolver v3 nutzt globale NFT-Lifecycle-Kauf-Evidenz. P4 6.10-Messung: assetFlows 606 s von 667 s DAO1. Build 20260924-173201.
// Phase 6.10 · 24.09.2026 16:30:30 CEST: P3-Retest präzisiert: Lifecycle complete, aber NFT-UI erst nach Hard-Refresh final; Kaufpreise weiter zu prüfen. 6.10 finalisiert NFT-Readmodel im selben Lauf und misst P4-Teiljobs. Build 20260924-163030.
// Phase 6.09 · 24.09.2026 14:22:47 CEST: Audit P3 Cache-Priorität korrigiert: frischer DB-Ownership-Stand darf nicht durch den älteren zentralen Shared-Cache derselben Session ersetzt werden. P3 bleibt bis Retest in Arbeit. Build 20260924-142247.
// Phase 6.08 · 24.09.2026 12:31:39 CEST: Audit P3 trennt Lifecycle-Besitzabdeckung vom strengeren Ownership-/Erwerbs-Repair; P3 bleibt bis Retest in Arbeit. Build 20260924-123139.
// Phase 6.04 · 23.09.2026 02:51:28 CEST: Audit P3 abgeschlossen: Fresh-Build-Parität für DAO1-NFT/Ownership wird aus unabhängiger Wallet-Transferhistorie aufgebaut; Legacy-Self-Heal ist kein automatischer Fresh-Build-Pfad mehr. P4 Performance Fresh-Import ist nächster Audit-Punkt. Build 20260923-025128.
// Phase 6.03 · 23.09.2026 01:44:44 CEST: Audit P2 abgeschlossen: finaler Fresh-Build-Snapshot nur bei Lifecycle complete; partial / deferred / failed werden vom Snapshot-Gate blockiert. P3 Fresh-Build-Parität ist nächster Audit-Punkt. Build 20260923-014444.
// Phase 6.01 · 23.09.2026 00:38:40 CEST: Lifecycle-/Architektur-Audit in bestehenden Admin-Audit-Tab integriert; Stabilitätsreihenfolge und Fresh-Build-Konsolidierung als nächster Schwerpunkt dokumentiert. Build 20260923-003840.
// Phase 6.00 · 23.09.2026 00:26:45 CEST: TLN Dashboard cache-only UUID-Fehler (local1 -> uuid) beim Fresh-Import behoben und als Lifecycle-Testpunkt dokumentiert. Build 20260923-002645.
// Phase 5.99 · 23.09.2026 00:15:00 CEST: Fresh-Build: frisch geladene DAO1-NFTs sofort verwenden; native Claim-Auszahlungen via Internal+RPC-Trace; historische APTM-Preise via getReserves vor Log-Fallback. Build 20260923-001500.
// Phase 5.98 · 22.09.2026 23:40:05 CEST: DAO1-Fresh-Import >10 Min analysiert/korrigiert: kein redundanter Claim-Tx-Detailscan nach vollständigem ERC-20-Walletscan; native Evidenz parallelisiert/gecacht. Build 20260922-234005.
// Phase 5.96 · 22.09.2026 21:35:26 CEST: Lifecycle-Testdoku ergänzt: sichtbarer Wallet-Erstaufbau, DAO1 Asset-Flows/Claim-Auszahlungen und Snapshot erst nach vollständigem Aufbau. Build 20260922-213526.
// Phase 5.94 Rebuild · 22.09.2026 14:03:48 CEST: Neues Doku-Kapitel „Zu testen“ mit Wallet hinzufügen, Wallet löschen und sämtliche Daten löschen. ZIP-Struktur korrigiert. Build 20260922-140348.
// Phase 5.94 · 22.09.2026 14:03:48 CEST: Userweite vollständige Datenlöschung umgesetzt: alle public-Zeilen mit user_id werden transaktional entfernt, globale Cache-Provenienz anonymisiert, Browserdaten gelöscht; Auth-Login bleibt bestehen. Build 20260922-140348.
// Phase 5.93 · 22.09.2026 12:15:22 CEST: RPC-Proxy-eth_call-Allowlist + SQL 072 für persistenten partial-Migrationsstatus; NFT-Datenmigration v4. Build 20260922-121522.
// Phase 5.92 · 22.09.2026 11:01:30 CEST: Serverseitiger APTMDAO-Metadata-Proxy über wallet-private; DATA_MIGRATIONS kennt complete/partial/failed und markiert technische Teilfehler nicht mehr als erfolgreich; APTMDAO eth_call für Owner/Parent freigegeben. Build 20260922-110130.
// Phase 5.91 · 22.09.2026 10:46:15 CEST: NFT-Metadatenresolver CORS-sicher: external_url/Explorer-UI nie als JSON fetchen; nur echte Metadata-/Token-URIs. Migration derselben NFT-Datenfamilie auf Version 2 erzwingt einmalige automatische Wiederholung. Build 20260922-104615.
// Phase 5.90 · 22.09.2026 03:44:20 CEST: Apertum-NFT-Namensresolver erweitert: echte DAO-Store-/Metadata-Namen werden zusätzlich aus Metadaten-Attributen und project_nfts priorisiert; generische MineBot-#-Namen bleiben Fallback. Automatische 5.90-Datenmigration prüft bestehende NFT-Caches erneut. Build 20260922-034420.
// Phase 5.89 · 22.09.2026 03:05:55 CEST: Release-Management/Data-Migrations-Runner eingeführt; relevante User-Mitteilungen als quittierungspflichtiges Popup; NFT-5.88-Normalisierung läuft automatisch einmal pro User/Datenversion; Dashboard-Vermögen vertikal responsiv. Build 20260922-030555.
// Phase 5.88 · 22.09.2026 02:20:48 CEST: NFT-Block abgeschlossen: Typfilter DID/MineBot/Hearts NFT/TradeBot, echte DAO-Store-/Metadata-Namen vor generischen Fallbacks, manueller Apertum-Refresh repariert offene Ownership-Lücken; APTMDAO #4533/#7315 zählen fachlich als DID. Build 20260922-022048.
// Phase 5.87 · 22.09.2026 01:36:51 CEST: DAO1 Legacy-Wallet-Self-Heal ergänzt: vor 5.82 hinzugefügte Wallets werden auf fehlende NFT-Ownership geprüft und gezielt vervollständigt; DID-Contract-Typisierung ist intrinsic. Build 20260922-013651.
// Phase 5.86 · 22.09.2026 01:06:00 CEST: DAO1 Übersicht bereinigt: Summary-Layout vereinheitlicht und Bot-Zählung auf eindeutigen aktuellen Bestand konsolidiert. Build 20260922-010600.
// Phase 5.84 · 22.09.2026 00:38:20 CEST: TLN/VOW Dashboard-Summary ist beim Start cache-only korrekt normalisiert; Projektübersichten verwenden zentrale summary_decimals. DAO1 Übersicht zeigt Summary-Kacheln analog TLN/VOW. Build 20260922-003820.
// Phase 5.62: DAO-Team: direkte Uplines TLN-artig, Ancestors aus Downline/Partnerzahl ausgeschlossen, Partner-Aliase + Bot-Zahlen in Karten; zentraler inkrementeller Partner-Bot-Refresh versorgt Team und Dashboard. Migration 068.
// Phase 5.59: Geräteübergreifende Wallet-/Team-Cache-Invalidierung, DAO-Upline im Browser-Cache und userbezogene UI-Einstellungen; Bonus/Geschenk-Kennzeichnung als offene Idee ergänzt.
// Phase 5.58: NFT-Kaufpreis-Resolver erweitert: neben ERC-20-Abgängen werden native APTM-Zahlungen aus tx.value und aus Internal Transactions derselben Erwerbs-Tx geprüft. Transfer/Mint ohne Kauf wird fachlich von ungeklärter Zahlung getrennt. Resolver-Version 2 erzwingt einmalige Neuanalyse alter negativer 5.57-Evidenz. DAO-Baum unverändert.\n// Phase 5.58: NFT-Kaufpreis-Discovery gehärtet: Entry-Tx bleibt bei jedem belegten Ersterwerb erhalten; alte Negativbefunde ohne konkrete Erwerbs-Tx werden erneut geprüft; nur vollständig geprüfte Tx darf als negativer Preisbefund gecacht werden. DAO-Baum bewusst unverändert.\n// Phase 5.56: Zentrale NFT-Registry wird beim App-Start aus Supabase geladen. Der NFT-Tab zeigt den on-chain belegten Kaufpreis als eigene Spalte; DAO1/APTMDAO-spezifische Zahlungsauflösung läuft über einen Projektadapter und schreibt persistente purchaseEvidence in den zentralen nft_cache. Bereits geprüfte historische Käufe werden nicht erneut analysiert; offene Fälle bleiben gezielt nachprüfbar. Der Baum bleibt in diesem Release bewusst unverändert.
// Phase 5.55: DID→Wallet-Auflösung im kombinierten DAO-Baum korrigiert: zentrale aktuelle Ownership/Root-Zuordnung hat Vorrang vor historischen/technischen Wallet-Adressen aus Tree-Events. Externe eigene Uplines werden projektspezifisch parallel dargestellt (DAO1 alt + APTMDAO neu); eigene Wallet-zu-eigene-Wallet-Kanten bleiben echte Baumkanten. Dadurch hängt #25924 weiterhin unter #21043, während für das Chris-Wallet gleichzeitig DAO1-Upline #18438 und APTMDAO-Upline #23 sichtbar sein können.
// Phase 5.54: Korrekturaudit 5.52: Root-DID-Parent-Kanten ergänzt, damit eigene Wallets nicht als falsche zweite Roots erscheinen. Bot-Kandidaten werden feldweise zusammengeführt: aktueller Owner aus Live/Ownership, historischer Erwerb/Kaufpreis aus Erwerbsevidenz. NFT-Copy-Icon transparent vereinheitlicht; frühester on-chain Besitzzeitpunkt wird nicht mehr wegen fehlendem Kaufnachweis unterdrückt.
// Phase 5.52: DAO-Team-Audit: eigene Wallets folgen jetzt ebenfalls ihren belegten DID-Uplines und werden zu einem gemeinsamen wallet-zentrierten Baum verbunden; eigene Wallets bleiben sichtbar, zählen aber nicht als Partner. Knoten zeigen DAO1/APTMDAO-DIDs kompakt getrennt. Wallet-Details trennen aktuellen Bot-Bestand von früher hier gekauften/übertragenen Bots; historischer Ersterwerb hat Vorrang, damit Kauf-Wallet/Kaufpreis bei internen Transfers erhalten bleiben. NFT-Wallet-Copy-Icon vereinheitlicht.
// Phase 5.51: Dashboard-Startnavigation vollständig synchronisiert (aktive Hauptnavigation + keine fremde Kontext-Tab-Leiste). NFT-Bestand zeigt Kauf/Mint-Wallet und aktuelles Wallet gekürzt mit Copy-Icon; ursprüngliches Wallet wird aus Ownership-/Transferhistorie ermittelt und bleibt bei späteren Walletwechseln erhalten.
// Phase 5.50: DAO-Team Root-/Startfix nach 5.49: eigene DAO1/APTMDAO-DIDs werden aus persistierter Ownership plus NFT-Cache über ALLE User-Wallets erkannt, unabhängig von aktuellen DAO-Assets/Dust. Dashboard lädt Ownership vor den Tree-Subcaches; damit kein 0-Partner-Zustand nur wegen Initialisierungsreihenfolge. Wallet-zentrierte Fachlogik aus 5.49 unverändert.
// Phase 5.49: DAO-Team auf wallet-zentrierte Standardansicht umgestellt: 1 Wallet = 1 Partner, mehrere DAO1/APTMDAO-DIDs pro Wallet werden in einem Knoten zusammengeführt; APTMDAO hat nur bei tatsächlich eigener APTMDAO-Downline Vorrang. Neue MinerBot-Käufe lesen die verwendete APTMDAO-DID direkt aus dem Kaufaufruf (Referenz #31722: DID #7315 → Upline #23). Eigene Wallets aus Letzte Partneraktivitäten ausgeschlossen. Phase 5.79 entfernt die separaten alten/neuen Tree-Tabs aus der normalen UI.
// Phase 5.48: DAO1-alt Abschlussfix: Eigene historisch verifizierte Bots dürfen für die DID-Zuordnung den persistierten ersten Besitzabschnitt als Erwerbsnachweis verwenden; ein erneut erkannter Kaufpreis ist dafür nicht zwingend. Fremde/live Bots brauchen weiterhin echten Kaufnachweis. Historische DID-Besitzlage am Bot-Erwerbsblock bleibt maßgeblich; APTMDAO-Logik unverändert.
// Phase 5.47: DAO1/APTMDAO Bot↔DID Abschlussfix. Eigene Bots werden DID-zentriert aus der vollständigen gespeicherten Ownership-Historie berücksichtigt, auch wenn Bot/DID später unabhängig auf andere Wallets verschoben wurden. Entscheidend bleibt die DID-Besitzlage auf der damaligen Erwerbs-Wallet am Bot-Erwerbsblock. Identitäts-NFTs/Membership werden nicht mehr in der Bot-Tabelle dupliziert.
// Phase 5.46: DAO1/APTMDAO Bot-Zuordnung final auf historischen Besitz zum Bot-Erwerbsblock umgestellt. Bot und DID werden unabhängig behandelt: maßgeblich ist, welche DID(s) derselben Wallet exakt beim Bot-Erwerb on-chain gehalten wurden. APTMDAO hat Vorrang, wenn genau eine APTMDAO-DID zu diesem Zeitpunkt gehalten wurde; sonst genau eine alte DAO1-DID; mehrere/keine DIDs bleiben unzugeordnet. Breiter Wallet-NFT-Scan entfernt; Bot-Kandidaten kommen nur aus bekannten Bot-Contracts und contract-gefilterter Transferhistorie. Persistente alte Fehlzuordnungen je Bot werden vor dem Speichern ersetzt.
// Phase 5.45: DAO1/APTMDAO Bot-Zuordnung korrigiert: problematische unique_tree_wallet-Fallback-Regel entfernt. APTMDAO ist opt-in und verlangt positiven Nachweis aus derselben Erwerbs-Tx oder dem APTMDAO-Manager; der gemeinsame MineBot-Contract allein ist kein Systembeweis. Altes DAO1 nutzt wieder die bewährte Legacy-Erwerbs-/Kaufpreislogik, solange kein positiver APTMDAO-Nachweis vorliegt. Persistente Altzeilen mit evidence_type=unique_tree_wallet werden für Dashboard-Partneraktivitäten ignoriert. Regressionstestfälle: Bot #31722 → APTMDAO #7315; #10295 und #37174 → DAO1 #21043.
// Phase 5.44: Hotfix nach 5.43: Beim DAO1/APTMDAO-Request-Umbau fehlten setDAO1TeamTreeMode, renderDAO1TeamTab und teamDiscoveryTableHtml, obwohl setTeamTreeMode weiter exportiert wurde. Die drei Tree-Funktionen sind wiederhergestellt; der cache-only Tree-Render und die begrenzte Detail-Live-Discovery aus 5.43 bleiben erhalten.
// Phase 5.43: DAO1/APTMDAO Partnerdetails: Explorer-Request-Fächer entfernt (Tx-Transfer- und Wallet-NFT-In-Flight/Result-Cache, Details max. 2 Erwerbsprüfungen parallel). Tree-Render ist strikt cache-only; Live-NFT-Prüfung nur beim Öffnen der Details. Identitäts-Contracts überschreiben alte Klassifizierungen, damit DIDs nie als Bots/Membership-Zeilen erscheinen. Eigene Roots laden beim Detailöffnen den aktuellen NFT-Bestand, damit neu gekaufte Bots ohne separaten NFT-Tab-Refresh erkannt werden. Bot ohne Tx-Systemevidenz darf nur bei genau einer DID derselben Wallet im aktiven Tree über "unique_tree_wallet" zugeordnet werden.
// Phase 5.42: Kursliste iconfrei beim Token, Chain über Native-Symbol; Token-Stammdaten/Symbol vor Contract-Fallback, Adressen kurz. DAO1/APTMDAO DID-Details strikt DID-zentriert: fremde DIDs nie als Bots; nur verifizierte Bots/Membership. DAO1 LP im Wallet bleibt frei, nur tatsächlich gestaktes LP gebunden. Fehlende TLN/VOW-Historienwerte werden als noch nicht persistiert kenntlich und über bestehende Step-6/Detailbewertung gezielt nachermittelt.
// Phase 5.41: Dashboard-Projektwerte in frei/gebunden/gesamt aufgesplittet; TLN/VOW-LP-Doppelzählung zwischen walletData und lp_position_cache verhindert; aktuelle Preise mit Asset-refreshedAt; DAO1/APTMDAO Partner-Bots tree-spezifisch über eindeutige Erwerbs-Tx-Evidenz getrennt; evidenzbasierter Partner-Bot-Lifecycle persistent (Migration 065) und als Cache-Quelle für letzte Partneraktivitäten. Unklare Bot-Zuordnungen werden keinem Tree geraten.
// Phase 5.40: Dashboard-Audit fortgesetzt: Preisrefresh stale-while-refresh (alter gültiger Snapshot bleibt sichtbar), Kursliste zweispaltig/kompakt, Reward-Assets periodenübergreifend zeilengleich, TLN Partner-Staking-TODO mit Ladezustand, gebundener Wert mit Projektaufschlüsselung, letzte bestätigte Partneraktivitäten aus Projektcaches. DAO1-Bot-Kauf-Aktivitäten bleiben bis zu einem belastbaren persistenten Partner-NFT-Eventcache offen.
// WalletTracking · Ideen / Umbau
// STABILITÄTSAUDIT 6.01 (verbindlicher nächster Schwerpunkt): Kein Rewrite. Kritisch sind Fresh-Build-Parität, ehrlicher Lifecycle-Abschlussstatus, DAO1 Payout-/Asset-Flow-Konsolidierung, NFT Read-Model und Fresh-Import-Performance. Neue große Funktions-/Chain-Erweiterungen erst nach Konsolidierung dieser Punkte. Audit wird im bestehenden Admin-Tab „Audit“ gepflegt; kein separates Audit-Dokument als führende Quelle.
// Phase 5.83 · 22.09.2026 00:14:45 CEST: TLN/VOW Referral-Rewards: Raw-Units-/Decimals-Regression in Summary, Partneransicht und DEV-Diagnose behoben; persistierte Alt-Snapshots werden über verifizierte Contract-Decimals normalisiert. Build 20260922-001445.
// Phase 5.82 · 22.09.2026 01:36:51 CEST: Chain-Logos über public.chains.icon_path zentralisiert; Standard-SVGs ergänzt. Wallet-Speichern verwendet gezielten Erstaufbau nur für die gespeicherte Wallet statt loadAll() über alle Wallets; DAO current-state targeted, TLN/VOW lazy/session-aware. Build 20260922-013651.
// Phase 5.81 · 21.09.2026 23:36:49 CEST: Einzelne Wallet vollständig löschen umgesetzt: serverseitig/transaktionaler Purge inkl. Snapshots, 31.12.-Beständen, Projekt-/History-/Cache-Daten und Invalidierung abgeleiteter User-Summaries; globale On-Chain-/Registry-Fakten bleiben erhalten. Userweite Funktion „Alle Daten löschen“ bleibt separat offen. Build 20260921-233649.
// Phase 5.39: Dashboard-Daten-Audit fortgesetzt: Hauptsummary in Vermögen/Rewards/Referral Rewards gruppiert; persistenter lp_position_cache wird beim Start cache-only für gebundene DAO1/TLN-LP-Werte gelesen; TLN-Team-Restore liefert verifizierte abgelaufene, noch gestakte Partnerpositionen an 'Was muss ich tun?'; Datenstand-Texte benutzerverständlich statt 'nicht instrumentiert'. Systemübersicht/Datenquellen/Ladezeitpunkte geprüft.
// Zentrale Arbeits- und Übergabeliste.
// Künftig sollen Inhalts-/Status-/Prioritätsänderungen nach Möglichkeit nur in dieser Datei erfolgen.
// Die Hauptseite lädt diese Datei bei jedem Seitenaufruf mit Cache-Buster neu.

const ADMIN_IDEAS_MODULE_BUILD = "20260923-014444";
const ADMIN_IDEAS_MODULE_TIMESTAMP = "23.09.2026 01:44:44 CEST";
// Phase 5.33: Dashboard-Summary validiert und Start weiter entkoppelt. Apertum-native-Fehler behoben: interner Asset-Key "native" wird nie mehr als EVM-Adresse ABI-encodiert. TLN/BSC lp_position_cache wird beim Dashboard-Start walletübergreifend in einem Batch gelesen statt mit Einzelrequest pro Wallet. TLN "davon aktiv" zeigt bei unvollständig verifizierten Lifecycles keine scheinbar endgültige Zahl mehr, sondern bestätigte Aktive plus offene Partner; erst bei vollständiger Lifecycle-Abdeckung wird die Endzahl gesetzt. DAO1 Dashboard-Rewards werden gezielt aus vorhandenen project_transactions + project_transaction_asset_flows gelesen, ohne ensureLoaded()/vollständige DAO1-Tab-Initialisierung. Phase 5.35 ersetzt die frühere USD-Summary: Gesamt/Vorjahr/Jahr/Monat zeigen Originaltoken/-mengen; historische USD-Bewertungen sind dafür nicht erforderlich. DAO1 "aktiv" bleibt bewusst offen: aktueller Code enthält keinen belastbaren Bot-Target-/Completed-Contract-Proof. Reward-Zeilen der Projektkarten wieder als konsistente Kacheln gestaltet. Systemübersicht, Admin-Doku und Hilfe synchronisiert. Build 20260919-140811.
// Phase 5.30: TLN/VOW-Contracts werden aus der allgemeinen CoinGecko-/GeckoTerminal-Preisermittlung ausgeschlossen und ausschließlich über die bestehende zentrale Projekt-PriceEngine bewertet (BSC PancakeSwap / ETH Uniswap). Dashboard zeigt Contract-Adressen einheitlich nur verkürzt mit Copy-Funktion; vollständige Adressen werden nicht zusätzlich als Symbolzeile ausgegeben. Preisrouten/-berechnungen selbst unverändert.
// Phase 5.29: Dashboard-Gerüst wird unmittelbar nach Login sichtbar, bevor Chain-/DB-Konfiguration fertig geladen ist. TLN/VOW-Dashboardpreise zeigen tatsächliche DEX-Quelle (BSC PancakeSwap / ETH Uniswap) plus vorhandene Preisroute. DAO1 hat neu „Kurse und Pools“ als reine Sicht auf die bereits bestehende Apertum-Preislogik; keine neue Preisermittlung.
// Phase 5.27: Summary (Verlauf, Portfolio-Allokation und Bestands-Summary) aus „Übersicht & Analyse“ ins Dashboard verschoben. Globaler Wallet-Ansicht-Filter aktualisiert auch die Summary-Wallet-Auswahlen. Dashboard-Kursnamen lösen vordefinierte und eigene sichere Token robust über gepflegte Namen/Labels statt Contract-Adresse auf. Chart-Legende verwendet die aktuelle Theme-Textfarbe für lesbare Darstellung in Hell/Dunkel. Dashboard bleibt Startseite und cache-first. Systemübersicht/Hilfe geprüft.
// Phase 5.26: Dashboard-Finish: Native Coins werden bei Admin-Start als echte predefined_tokens-Stammdaten sichergestellt und sind damit für Dashboard-Flag sowie Anzeige-/Summary-Kommastellen editierbar. Kursliste zeigt den gepflegten Token-Namen statt einer Fallback-Adresse. Projekte und Administration sind getrennte Dashboard-Bereiche; Projektkarten besitzen Team-Partner gesamt/aktiv sowie Rewards Gesamt/Vorjahr/Jahr/Monat. Alle Projektwerte bleiben strikt cache-first; fehlende Werte starten keine Discovery/Chain-Abfrage. Sidebar-W entfernt und Einklapp-Pfeil kollisionsfrei positioniert. Systemübersicht/Hilfe geprüft.
// Phase 5.25: Dashboard als Cache-first-Startseite, Wallet-Besitzer/Personenfilter und Dashboard-Tokenflag ergänzt. TLN/VOW-Discovery sowie manuelle Snapshots, Discovery-, Gebühren- und NFT-Caches werden nicht mehr beim Login, sondern erst beim Öffnen des jeweiligen Bereichs initialisiert. Fach-/Discovery-Algorithmen unverändert; nur Auslösezeitpunkte verschoben. Systemübersicht und Hilfe synchronisiert.
// Phase 5.24: Team-Lifecycle-Restore fuer eigene Wallets korrigiert. Root Cause fuer fehlende eigene Stakings: Discovery-Result-Caches eigener Wallets liegen datenschutzkonform user_id/wallet_id-basiert in der privaten Staking-Cache-Tabelle, der Team-Restore las bisher aber nur den globalen scope_address-Cache. Eigene Projekt-Wallets werden jetzt ueber denselben technicalCacheScope wie die Projektansicht geladen; externe Partner bleiben im globalen Batch-Read. Zusaetzlich wird ein positiver historischer Lifecycle bei vorgemerkter Unstake-Nachpruefung nicht mehr optisch verworfen, sondern mit belegten Lots als unvollstaendig sichtbar gehalten. Alias-Abdeckung wird nach komplettem Identity-/Registry-Restore als matched/visible/stored/missing geloggt; fehlende Namen werden nicht erfunden. Staking-Discovery und Duration-Proof-Logik unveraendert. Systemuebersicht geprueft: Supabase-Datenquelle bleibt gleich, private/global Cache-Aufteilung des Restore-Pfads dokumentiert.
// Phase 5.23: Duration-Regression korrigiert. Fuer Legacy-v$/VOW 0x4857…d590 war die in 5.20-5.22 eingefuehrte Annahme eines individuellen Stored-End-Timestamps falsch und blockierte bereits verifizierte positive Strict-Caches sowie den Shared-Contract-Proof. Reihenfolge wieder korrekt: positiver positionsbezogener Strict-Cache → Shared Strict-Proof mit Fingerprint-/State-Validierung → exakt verifizierter historischer On-Chain Contract-Proof (367 Tage; !Minimum Staking Period unmittelbar vor der Grenze, Erfolg bei exakt 367 Tagen) mit erneutem Fingerprint-/Wallet-State-Abgleich → weitere bestehende Proof-Pfade → erst zuletzt Negativcache. Top-up-Anker bleibt letzter on-chain bestaetigter Top-up. Staking-Discovery unveraendert. Alias-Log bestaetigt 5 entschluesselte Referenzen und 5 sichtbare Matches; deshalb kein weiterer spekulativer Alias-Umbau. Systemuebersicht geprueft: Datenquelle/Ladezeitpunkt/Struktur unveraendert.
// Phase 5.22 (durch 5.23 bei Legacy-v$/VOW fachlich korrigiert): Bereinigungsrelease: Legacy-v$/VOW liest weiterhin zuerst den individuellen Stored-End-Timestamp positionsbezogen; bei temporaer fehlendem Live-Read ist nur ein zuvor aus genau diesem Stored-End-Strict-Proof erzeugter positionsbezogener Cache als Fallback erlaubt. Legacy-TLN-Alias-Referenzen werden vor team_alias_replace_all auf die von wallet-private erlaubten id:/wallet:-Formate kanonisiert; unbekannte Legacy-Keys bleiben lokal. Staking-Discovery unverändert. Systemübersicht geprüft: Datenquelle/Ladezeitpunkt/Struktur unverändert.
// Phase 5.21: Legacy-v$/VOW-Duration wieder vollständig positionsbezogen: 0x4857…d590 liest Start + individuellen End-/Unlock-Timestamp direkt über die bewährte Wallet-Mapping-Struct-Erkennung am konkreten Stake-Block, unabhängig von Shared-/Duration-/Negativcache; keine feste Tageszahl. Alias-Loader auf tatsächliche wallet-private-Antwort {ok,action,aliases} und kanonische id:/wallet:-Referenzen abgestimmt. Staking-Discovery unverändert. Systemübersicht geprüft.
// Phase 5.20: Legacy-v$/VOW-Duration-Priorität korrigiert: alter positionsbezogener Cache und Shared-Dauer dürfen den Stored-End-Read nicht mehr überholen; keine fest hinterlegte 367-Tage-Ersatzregel für 0x4857…d590. Bekannter Positions-Struct-Proof wird genutzt, um Start- und individuellen End-/Unlock-Timestamp direkt positionsbezogen aus dem Contract-Storage am Stake-Block zu lesen. 24-h-Negativcache greift erst danach. Staking-Discovery unverändert. Systemübersicht geprüft.
// Phase 5.17: Alias-Restore bindet historische verschluesselte Referenzen nach Identity-/Registry-Restore an sichtbare TLN-ID-Keys. Sichtbare Partner neuer SmartNode-Registries ohne kompatiblen Lifecycle erhalten nach Cache-first Render genau einen bestehenden Team-Lifecycle-Discovery-Pass; Staking-Erkennungslogik unveraendert. 20260922-110130/APP_VERSION mit Release synchronisiert. Systemuebersicht geprueft.
// Phase 5.16: Gerätewechsel-Restore korrigiert: CURRENT_WALLET lädt seinen vorhandenen persistenten Discovery-Snapshot nun ebenfalls, wenn kein Live-Discovery-Lauf im Speicher existiert. Nach Restore werden nur offene Lifecycles mit vollständig serverseitig vorhandener Contract-History einmalig cache-backed nachverifiziert; kein Wallet-History-/Receipt-/forceFresh-Fallback. Batch max. 3. Staking-Discovery unverändert. Systemübersicht geprüft.
// Phase 5.15: Gründliche Regression-Korrektur: verifizierter New-Registry-Referenzfall TLN-ID 990000017795 wird beim cache-only Restore mit nodeIdOf+nodeUserOf on-chain gegengeprüft und ohne History-/Staking-Scan an die bereits verifizierte Parent-TLN-ID 12415 angebunden; Alias-Referenzen werden kanonisch nach TLN-ID/Wallet gemappt und Mapping-Abdeckung ohne Klartextnamen diagnostiziert. Offene v$/VOW-Lifecycles werden nicht fälschlich als verifiziert markiert: Diagnose belegt vollständige Staking-Erkennung, aber noch fehlenden belastbaren Duration-Proof. Staking-Discovery unverändert. Systemübersicht geprüft.
// Phase 5.14: Normaler Team-Restore ist strikt cache-only und startet auf neuen Geraeten keine automatische Lifecycle-/Wallet-History-/Receipt-Nachverifikation mehr; offene Lifecycles bleiben sichtbar und werden nur ueber Step 7 aktualisiert. Dadurch kein browserlokaler Cache als Voraussetzung und kein Request-Sturm beim Geraetewechsel. Staking-Discovery unveraendert. Systemuebersicht geprueft.
// Phase 5.13: Zusatzregistry-Graph wird cache-first separat restauriert und bei leerem Registry-Cache einmalig aus verifizierten join(address)+nodeIdOf/nodeUserOf-Fakten aufgebaut; Alias-Referenzen werden prefix-unabhaengig ueber TLN-ID/Wallet aufgeloest; positive verifizierte v7-Lifecycles werden wiederverwendet, v7-Nullfunde bleiben ungueltig. Staking-Discovery unveraendert. Systemuebersicht geprueft.
// Phase 5.12: index.html Cache-Buster fuer discovery.js und ideas.js auf aktuellen Build angehoben, damit Browser/CDN die tatsaechlich geaenderte Team-Logik laden. Staking-Discovery unveraendert.
// Phase 5.11: Cache-Restore laedt verifizierte Identities neuer SmartNode-Registries separat, rekonstruiert deren join(address)-Parent-Kanten vor dem Forest-Build (Fix fuer fehlenden Partner Ernie / TLN-ID 990000017795). Alias-Loader akzeptiert kompatible wallet-private Response-Shapes, damit bestehende verschluesselte Namen wieder erscheinen. Staking-Discovery unveraendert. Systemuebersicht geprueft.
// Phase 5.09: TLN-Team Cache-Restore rekonstruiert Parent-Kanten neuer SmartNode-Registries aus persistierter join(address)-Evidenz; Partial-Lifecycle darf verifizierten Cache nicht mehr degradieren; Alias-Leerantwort erhält einen einmaligen sicheren Re-Read. Staking-Discovery fachlich unverändert. Systemübersicht geprüft: Team-Datenquelle ergänzt um Registry-Identity + join-Tx beim Restore.
// Phase 5.07: TLN-Team-Anzeige repariert: userbezogene Partnernamen werden rueckwaertskompatibel aus id:/wallet: sowie historischen nackten Referenzen gelesen; Details ist auch fuer eigene Wallets verfuegbar; erkannte, aber wegen offener Duration noch nicht voll verifizierte Partner-Stakings werden persistent gespeichert und beim Reload wieder gemergt. Systemübersicht geprüft: Datenquelle/Ladezeitpunkt unverändert.
// Phase 5.06: Nullfund-Verifikation im TLN-Team abgesichert: Ein Wallet darf nur noch als „kein Staking gefunden / verifiziert“ gelten, wenn mindestens ein relevanter Contract tatsächlich geprüft wurde und die komplette Contract-Coverage fehlerfrei ist. Alte team-lifecycle-v7-Ergebnisse werden durch Cache-Version v8 nicht mehr als verifiziert übernommen und bei Bedarf neu geprüft. Systemübersicht geprüft: Datenquelle/Ladezeitpunkt unverändert.
// Phase 5.05: Das Lifecycle-3er-Limit ist jetzt technisch nur noch Batch-Groesse: ein gestarteter Worker arbeitet den gesamten freigegebenen Partner-Backlog in fortlaufenden 3er-Batches ab; Fehler eines einzelnen Wallets stoppen die restliche Queue nicht. Sichtbarer Fortschritt zaehlt ueber alle Partner. Systemübersicht geprüft: Datenquelle/Ladezeitpunkt unverändert.
// Phase 5.04: TLN-Team Egress-First korrigiert: der Team-Slice-RPC erhält den definierten SmartNode-Contract statt an einer undefinierten Variable zu scheitern. Damit funktioniert der Supabase-Slice-Erstaufbau wieder ohne Globalgraph-Download. Performance/Egress-Messung bleibt nächster eigener TODO-Block.


// VERBINDLICHE SUPABASE-SCHEMA-/MIGRATIONSREGEL ab 24.09.2026:
// Neue Tabellen werden nicht automatisch in public angelegt. Vor CREATE TABLE ist zu entscheiden,
// ob direkter Browser/Data-API-Zugriff erforderlich ist. Interne Admin-/Job-/Cache-/Backend-only-
// Tabellen gehoeren vorzugsweise in ein nicht exponiertes internes Schema. Jede neue Tabelle in
// public bzw. einem exponierten Schema muss im selben Migrationsskript die minimal erforderlichen
// GRANTs fuer anon/authenticated/service_role sowie RLS + Policies explizit definieren. Keine
// pauschalen Grants; Least Privilege. Bestehende Tabellen werden nicht allein wegen der Supabase-
// Aenderung vom 30.10.2026 umgebaut. DB-Reset/Preview-Branch-Faehigkeit ist bei Migrationen mitzupruefen.

const ADMIN_IDEAS = [
  {status:"done",category:"Dashboard",priority:"low",title:"Aktuelle Kurse auf voller Breite",desc:"7.52: volle Breite; ab 1400 px Innenbreite zwei Tabellen, darunter eine gemeinsame Tabelle mit einem Tabellenkopf und gleichen Spaltenbreiten. Container-Query berücksichtigt Navigation und verfügbare Bereichsbreite. Contract-/Pooladressen klein auf zweiter Zeile, gekürzt und kopierbar. Nach zentraler Chain-Reihenfolge und innerhalb der Chain nach Tokenname sortiert. Horizontaler Scroll erhält alle Spalten. Keine Preis-/Request-/Discovery-Änderung. Safari-/Brave-Retest offen."},
  {status:"done",category:"Dashboard",priority:"medium",title:"Zusätzliche Namen in allen Wallet-/Partner-To-dos",desc:"7.49: TLN-IDs und alle bisherigen Kennungen bleiben unverändert, Besitzer-/Partnernamen kommen zusätzlich hinzu. Token-/Bestandschecks, Miner-Nachzahlungen und Partner-Stakings. Userbezogener RAM-Alias-Read lazy bei Aufgaben, dedupliziert; Alias-Save erneuert. Namespaces getrennt, keine neue Chain-Discovery. Lokale Regression bestanden, produktiver Retest offen."},
  {status:"open",category:"TLN/VOW / Preise",priority:"medium",title:"Legacy-LPT: belastbarer aktueller Bewertungsnachweis",desc:"BSC 0x30812dbe89b40b5b7ac1bc9134e82ebbc0b57995 ist historischer TLN-LPT, deaktivierte historische Stammdaten. Vorhandene ETH-Cross-Chain-Bewertung ist historisch und kein heutiger Handelskurs. CMC-DexScan-Screenshot zeigt nur ca. 0.08 USD Liquidität. 7.49 ergänzt Klassifikation/Hinweis und bewahrt aktuelle Projektpreisweitergabe; historische/Dust-Werte zählen nicht als aktueller Preis. Aktuelle Rücktausch-/Bewertungsbasis extern noch belegen."},
  {status:"done",category:"Entdecken",priority:"medium",title:"Alle Wallets und Spam-Sammelaktion",desc:"7.46: Alle Wallets default, Einzelwallet auswählbar. Gespeicherte Ergebnisse aggregiert; manuelle Scans sequenziell, Sperre je Wallet. 7.47 korrigiert die Anforderung: Alle entdeckten Tokens als Spam markieren, auch ohne vorherigen Verdacht. Sichere Tokens und bereits markierte Treffer ausgeschlossen; Anzahl nach Chain+Adresse dedupliziert. Bestätigung, danach ausschließlich walletbezogene Cache-Updates, kein Token-Insert und kein Chain-Refresh. Einzelaktion Als sicher hinzufügen bleibt. Spam-Updates verbleiben im Cache der ursprünglichen Wallet. Lokale Regression; produktiver Retest offen."},
  {status:"done",category:"DAO1 / Team",priority:"high",title:"Aktueller DID-Besitzer statt Mint-Wallet",desc:"7.46: Monica #21044 unter Carmen #18438 wurde mit historischer Mint-Wallet angezeigt; eigener Bestand und Explorer zeigen 0x568281…fe4940. Beide Tree-Systeme nutzen aktuelle Partnerbesitzer über ownerOf, dedupliziert im RAM (5 Min.), gezielt nur geladener persönlicher Graph; Fehler bleiben offen. Aktuelle Bot-/Wallet-Zuordnung und Details verwenden denselben Owner. Mint-Wallet und Parent bleiben historische Evidenz. Edge apertum-rpc-proxy deployen, kein SQL/Cache-Reset nötig. Produktiver Retest offen."},
  {status:"done",category:"DAO1 / Claims",priority:"medium",title:"Separate wAPTM-Bot-Auszahlung prüfen",desc:"7.48: Nur positive wAPTM-Eingänge von 0x6d0539…13022 als Kandidaten. Je Wallet aktuell angezeigte TXs bestätigen oder ignorieren; spätere TXs bleiben offen. Dauerhaft je User+Wallet+TX (SQL 091, RLS, Lösch-Cascade), keine automatische NFT-ID. Bestätigt unter Bot-Claims / Nicht zugeordnet, Summen asset-flow-first, offene Kandidaten unter Was muss ich tun? Lokale Regression bestanden, produktiver Retest offen."},
  {status:"done",category:"Dokumentation",priority:"medium",title:"Dokumentation 7.42 bis 7.46 nachführen",desc:"Audit, tatsächliche Systemübersicht mit Datenquellen/Ladezeitpunkten, Admin-Dokumentation samt Zu testen, Ideen/Umbau, Hilfen, README und Changelog aktualisiert. NFT-Anzeige vom User bestätigt. Restore-Test zurückgestellt; Kontolöschung/Admin-Negativtest und neue Funktionen produktiv weiter prüfen."},
  {status:"done",category:"NFT / Erwerb",priority:"medium",title:"Mint ohne Zahlung in dieser TX",desc:"Phase 7.45: „Mint ohne Zahlung in dieser TX“ bedeutet: erfolgreicher ERC-721-Mint dieses Bots an die Erwerbswallet, vollständige Token-/Internal-Transferlisten und TX-Details, kein positiver ERC-20- oder nativer Zahlungsfluss in dieser TX. Gas ist kein Kaufpreis. Frühere oder externe Zahlungen bleiben möglich; Kaufpreis bleibt nicht ermittelt, niemals automatisch 0. Bei Abruffehlern oder unvollständigen Daten bleibt die Prüfung offen. Referenzen Michaela #15541/#15542 und #120469/#120470. Keine ID-Sonderfälle. Lokale Fehler-/Zahlungs-/Paginationstests bestanden; User bestätigt NFT-Anzeige am 08.10.2026. Weitere Einzel-/Fehlerfälle offen."},
  {status:"done",category:"NFT / Transaktionen",priority:"medium",title:"Erwerbs-TX und Wallet-Transfer sichtbar",desc:"Phase 7.44: Erwerbs-/Mint-TX wird unter NFT beim Ersterwerb und bei Bots im DAO-Baum direkt beim Datum verlinkt, auch ohne Kaufpreis. Ein davon abweichender Wallet-Eingang erscheint unter „In diesem Wallet seit“ als Wallet-Transfer-TX. Identische TX werden dort nicht doppelt angezeigt; fehlende TX-Hashes werden nicht ergänzt oder geraten. Explorerlinks verwenden die konfigurierte Chain-URL. Lokale Regression bestanden; User bestätigt NFT-Anzeige am 08.10.2026."},
  {status:"done",category:"NFT / Fehlerbehandlung",priority:"medium",title:"DAO1-Metadaten-404 ohne falschen 502",desc:"Phase 7.43: NFT #120469 meldet reproduzierbar DAO1-Metadaten HTTP 404. Der alte Proxy wandelte dies in 502 um. Abruf jetzt über wallet-private mit strikter Allowlist; 404 als found:false, technische Fehler bleiben Fehler. Doppelte Abrufe zusammengeführt; bestätigte 404 fünf Minuten im RAM gemerkt. Besitz-/Kaufdaten bleiben erhalten. User bestätigt found:false/status:404 und keine Netzwerkfehler. Externe Metadatenquelle für #120469 weiterhin nicht repariert."},
  {status:"done",category:"Login",priority:"medium",title:"Recovery erstellt keine Konten",desc:"Phase 7.43: signInWithOtp verwendet shouldCreateUser:false. Übergang/Recovery ist damit auf bestehende Konten beschränkt. Versandmeldung bestätigt die Anforderung statt Zustellung."},
  {status:"done",category:"Security & Privacy",priority:"high",title:"Konto endgültig löschen · Admin-Sperre",desc:"Phase 7.42: eigene Daten und Auth-Konto in einer DB-Transaktion löschen. Explizite Bestätigung KONTO LÖSCHEN; Admin-Konten in UI, Edge und SQL geschützt, inklusive älterer Admin-E-Mail-Zuordnung. Datenreset erhält admins-Zeilen. SQL 090 und wallet-private deployen; produktiver Test mit normalem Testkonto und Admin-Negativtest noch offen. Storage-Dateien blockieren vor Datenänderung; vorhandene Backups bleiben getrennt."},
  {status:"done",category:"Login",priority:"medium",title:"Registrierungsmeldung bei bestehender Adresse",desc:"Phase 7.42: bestätigt nur die Verarbeitung der Registrierungsanfrage. Behauptet bei fehlender Sitzung weder ein neues Konto noch eine versandte Mail; verweist auf Anmelden/Passwort vergessen."},
  {status:"open",category:"DAO1 / Kontrolle",priority:"low",title:"Michaela · Trading-Bot separat zuordnen",desc:"Referenzwallet 0x5682810a3f03593bc94480df70fe036a8cfe4940 wird im aktuellen Test vom User Monica genannt. APTMDAO #7803 zeigt 9 Mining-Bots; Trading-Bot nach aktuellem Besitz und DAO1-/APTMDAO-Zweig separat prüfen. Keine fehlende Bot-Zuordnung allein aus diesem Tree-Screenshot ableiten."},
  {status:"done",category:"DAO1 / Anzeige",priority:"medium",title:"Bot-Preise nach Datenaktualisierung sofort anzeigen",desc:"Phase 7.41: User reproduzierte zweimal: nach Daten aktualisieren keine Preise, nach Seiten-Refresh vorhanden. Zentraler Lauf ergänzt fehlende/veraltete Kaufnachweise nach dem Ownership-Abgleich und baut NFT-/Botansicht vor dem Abschluss neu auf. Persistierte Kaufpreise haben Vorrang vor älteren Erwerbsergebnissen im Sitzungscache. Abschliessender Bot-Anzeigeaufbau ohne zusätzliche API-Aufrufe. Lokale Regression bestanden; User bestätigt Preise nach Aktualisierung ohne Seiten-Refresh."},
  {status:"done",category:"DAO1 / Team",priority:"low",title:"APTMDAO (neu) als Standardtab",desc:"Phase 7.41: Frischer DAO1-Team-Aufruf startet mit APTMDAO (neu). DAO1 (alt) bleibt auswählbar; die explizite Auswahl bleibt während der Sitzung erhalten."},
  {status:"done",category:"DAO1 / Mining-Bots",priority:"medium",title:"Ursprünglicher Erwerb ohne Kaufpreis",desc:"Phase 7.40: Original-Mint/Erwerbsdatum und Erwerbs-Tx werden unabhängig von einer Zahlung aus der alten NFT-Historie vor dem Upgrade gelesen und als originalAcquisition im bestehenden privaten NFT-Nachweis gespeichert. Neue Miner übernehmen diese Evidenz; Upgrade bleibt separat. Unvollständige Historie und HTTP-Fehler werden offen bezeichnet. Resolver v5 invalidiert vorhandene Upgrade-Evidenz einmal; keine Schemaänderung. Lokale Tests bestanden; produktive Datumsanzeige noch zu prüfen."},
  {status:"open",category:"DAO1 / NFT-Historie",priority:"medium",title:"apertum-nft-history HTTP 500",desc:"Screenshot vom 05.10.2026 zeigt HTTP 500 beim Abruf alter Bot-Historien aus dao1HistoricalPurchaseForNft → dao1InheritedMinerPurchase. Das kann Datums-/Preisergänzung blockieren. Aktueller User-Test 05.10.2026: kein Netzwerkfehler vorhanden; derzeit nicht reproduziert. Bei erneutem Auftreten Response-Body der fehlgeschlagenen Anfrage und Edge-Logs prüfen. Edge-Quellcode nicht im gelieferten Stand enthalten; keine Ursachenbehauptung und kein ungeprüftes Edge-Deployment. 7.40 kennzeichnet nicht verfügbare Erwerbshistorie und bewahrt vorhandene Nachweise."},
  {status:"in_progress",category:"Admin / Wiederherstellung",priority:"high",title:"Datenbank-Backup mit Auth und privaten Daten",desc:"Phase 7.39: Admin verlinkt read-only lokalen Helper für Struktur/Rollen und Daten aus public,auth,storage,supabase_migrations; privates Ziel außerhalb der Website, COPY-Coverage/SHA256 und Erfolgsmarker nur nach vollständigem Export. Verschlüsselungs-Masterkey, Provider-/Edge-Konfiguration und Storage-Dateien bleiben separat zu sichern. Lokale Fehlerfalltests bestanden; Mac-Backup und separate Schlüsselsicherung vom User als erledigt gemeldet; tatsächliche Wiederherstellbarkeit noch nicht getestet. Restore-Test vom User zurückgestellt."},
  {status:"done",category:"DAO1 / Mining-Bots",priority:"medium",title:"Kaufdatum und Upgrade-Datum getrennt sichtbar",desc:"Phase 7.39: Ursprüngliches Kaufdatum bleibt in NFT- und Botansicht ausdrücklich sichtbar; fehlende neue Datumsfelder werden aus vorhandenem Kaufnachweis des alten Bots ergänzt. Upgrade-Datum separat. Fehlt auch im ursprünglichen Kaufnachweis das Datum, steht Datum nicht ermittelt; Upgrade-Datum wird niemals als Kaufdatum verwendet. Kaufpreisübernahme vom User bestätigt; Datumsanzeige produktiv noch prüfen."},
  {status:"open",category:"DAO1 / Claims",priority:"low",title:"Legacy-Claim-Aufruf ohne nachgewiesene Auszahlung",desc:"Bot #10294, TX 0x3a5051e469cc325d67bbab63eaa95884a3fe109228d4b79bf8f75f014807f1e4 (28.06.2026): Explorer zeigt erfolgreiche Methode 0x86bb8f37, Static Calls und keine Logs/Auszahlung. Contract-ABI und vollständige Transfer-/Trace-Evidenz prüfen: Claim-Aufruf ohne Auszahlung oder andere Bot-Aktion? Keine Klassifikationsänderung ohne Beleg. Niedrige Priorität."},
  {status:"done",category:"DAO1 / Claims",priority:"medium",title:"Prelaunch-Auszahlungen: Status statt fehlender USD-Preis",desc:"Phase 7.38: native APTM/wAPTM-Auszahlungen vor Marktstart Block 88356 / 18.02.2025 12:39:52 UTC werden in Summary und Details als Prelaunch ausgewiesen. Menge bleibt erhalten; fehlende USD-Zähler berücksichtigen nur offene Nicht-Prelaunch-Fälle. Lokaler Regressionstest bestanden, produktive Anzeige noch zu prüfen."},
  {status:"done",category:"Admin / Wiederherstellung",priority:"high",title:"Admin-Stammdatenexport und Restore-Dokumentation",desc:'Phase 7.37: Admin → Dokumentation exportiert JSON oder idempotentes SQL über RPC 089, serverseitig UUID-Admin-geprüft. Neun globale Tabellen in einem konsistenten Snapshot; keine User-/Wallet-/Cache-Daten. DB-Struktur-Export weiterhin lokal über verlinkten CLI-Helper; keine Browser-DB-Zugangsdaten. Aktuelle Anleitung zentral in Admin-Dokumentation und Systemübersicht, Release-Berichte unter docs/releases. Historische Migrationen bleiben unvollständig, da im gelieferten Stand keine Git-Historie verfügbar ist. Baseline 04.10.2026 plus Folgemigrationen erhalten. Live-Export, frischer Struktur-Dump und Restore-Test bleiben offen.'},
  {status:"done",category:"Admin / Darstellung",priority:"high",title:"Überlappende Chain-Spalten",desc:'Phase 7.37: Sticky-Abstände folgen den tatsächlichen Zellbreiten über ResizeObserver. Eingabefelder der fixierten Spalten bleiben innerhalb der Zellen. Orange Markierung aus 7.36 bleibt erhalten. Visueller Safari-/Brave-Test nach Veröffentlichung offen.'},
  {status:"done",category:"Aktualisierung / Admin",priority:"high",title:"DAO-Team Queue-Deadlock und kritische Chain-Spalten",desc:'Phase 7.36: Zentrale Aktualisierung führt DAO1/APTMDAO-Team-Core-Schritte im bestehenden Hauptjob aus, statt einen Unterjob hinter sich selbst einzureihen. Eigenständige Team/Admin-Jobs bleiben seriell. Queue-Regression prüft Abschluss beider Trees, externe Serialisierung und Fehlerfreigabe. Kritische Chain-Felder sind wieder dezent orange markiert; Farben bleiben in Hell/Dunkel, Hover und fixierten Spalten erhalten. Supabase-Refresh-Token HTTP 400 separat offen: genaue Fehlerantwort fehlt; kein spekulativer Auth-Umbau. Produktiver Abschluss-/Farbtest nach Installation noch offen.'},
  {status:"done",category:"Cache / Fehlerbehandlung",priority:"high",title:"RPC-Fehler und zentraler Abschluss",desc:'Phase 7.35: Begrenzte EVM-RPC-Wiederholungen bei vorübergehenden Transportfehlern. Bestandsfehler erhalten den letzten gültigen Stand mit Veraltet-Hinweis. Fehlgeschlagene Tagesmarker bleiben erneut fällig und behalten Erfolgsdatum/Cursor. Fehler zeigen Wallet, Chain und Abrufart; NFT-Details nennen die betroffene Chain. Gesamtabschluss und vollständiger Snapshot erst nach DAO1/APTMDAO-Delta und Summary-Laden. Lokale Fehlerfall-Regressionsprüfung bestanden; produktiver Wiederholungstest nach Installation offen.'},
  {status:"done",category:"DAO1 / APTMDAO",priority:"high",title:"Mining-Bot Upgrade · Kaufpreis weiterführen",desc:'Phase 7.34: Beim Upgrade eines alten MineBots auf einen neuen Apertum Miner werden beide NFTs anhand derselben erfolgreichen Upgrade-Transaktion verknüpft. Der neue Bot übernimmt den ursprünglichen Kaufpreis, das Kaufdatum und die Kauf-Tx. Die Upgrade-Tx und der Besitzbeginn des neuen NFTs bleiben separat sichtbar. Der alte Bot erscheint als migriert; seine Kauf- und Reward-Historie bleibt erhalten. Kaufpreissummen zählen den übernommenen Betrag nur einmal. Fehlt der alte Kaufpreis, bleibt er offen statt 0. Zusätzliche Zahlungen der Upgrade-Tx werden getrennt gespeichert und nicht als alter Kaufpreis ausgegeben. Mehrdeutige Alt-/Neu-Zuordnungen werden nicht geraten. Kontrollfall #90270 → #46489. Datenquelle: bekannte Upgrade-Methode 0x454b0608 am Upgrade-Contract plus ERC-721-Transfers. Nutzung vorhandener globaler Transfer-Caches; verifizierte Verknüpfung und Kaufprovenienz persistent im userbezogenen nft_cache-JSON. Lokale Regression bestanden; produktiver Test nach Installation noch offen.'},
  {
    status: "done",
    category: "Security & Privacy",
    priority: "high",
    title: "Login · E-Mail/Passwort + Google OAuth",
    desc: `Phase 7.33: Partnernamen für DAO1, APTMDAO und TLN/VOW werden verschlüsselt über wallet-private gespeichert. Das Backend prüft die Anmeldung und begrenzt jeden Zugriff auf die angemeldete User-ID; direkte Browserrechte auf die Alias-Tabelle bleiben gesperrt. Die TLN-Sammelspeicherung verändert ausschließlich TLN-Referenzen und bewahrt DAO1-/APTMDAO-Namen. Phase 7.13 schließt den Auth-Umbau auf E-Mail + Passwort sowie Google OAuth offiziell ab. Eingeloggte Bestandsuser starten Google über Supabase linkIdentity; vor dem Redirect wird die vorhandene auth.users.id sessionlokal gemerkt und nach Rückkehr strikt auf Gleichheit geprüft. E-Mail + Passwort bleibt parallel bestehen; Magic Link ist ausschließlich ein klar gekennzeichneter Recovery-/Übergangsweg für bestehende Konten ohne Passwort und kein Standardlogin. Google-Provider und Manual Linking müssen im Supabase-Projekt konfiguriert sein. Der Verknüpfungsstatus wird angezeigt; „Google trennen“ ist nur möglich, wenn Supabase mindestens eine weitere Identität am selben User meldet. Die WalletTracking-User-ID und Daten bleiben beim Verknüpfen/Trennen unverändert. Realtests: bestehende Google-Verknüpfung, neuer Google-User, Login und Logout funktionieren. Apple-Login wird bewusst nicht angeboten. Kein Admin-Flag im Frontend/localStorage.`
  },
  {
    status: "in_progress",
    category: "Security & Privacy",
    priority: "high",
    title: "DB-Reproduzierbarkeit · verifizierte Supabase-Baseline",
    desc: `Phase 7.17 uebernimmt den am 04.10.2026 read-only exportierten und geprueften produktiven Live-Stand als verifizierte Baseline ins Repo (sql/baseline/verified). Verifiziert: 69 public-Tabellen, RLS auf allen 69 Tabellen, 218 Policies, 17 public-Functions und 4 Trigger; historical_dex_pair_state_cache aus Migration 080 ist produktiv vorhanden. Die Supabase-CLI-Migrationshistorie ist leer; fruehere Migrationen werden weder erfunden noch blind als applied markiert. Phase 7.18 ergaenzt den kontrollierten read-only Exporthelper. Phase 7.19 schliesst den Seed-Schritt ab: Der gepruefte Export wurde in sql/baseline/seeds/001-global-master-data.sql als deterministischer, idempotenter Upsert-Seed fuer genau neun globale Stammdatentabellen uebernommen. User-/Wallet-/Snapshot-/Cache-Daten sind ausgeschlossen; Sequenzen werden nie rueckwaerts gesetzt. Phase 7.20 dokumentiert den Haertungsaudit unter sql/hardening/: 60 public-Tabellen und 15 Sequenzen besitzen im verifizierten Live-Snapshot noch GRANT ALL fuer anon; neun public-Functions sind ebenfalls fuer anon ausfuehrbar. RLS bleibt auf allen 69 public-Tabellen aktiv, ersetzt aber keine Least-Privilege-GRANTs. Browserzugriffe wurden gegen den aktuellen Code inventarisiert; nicht direkt referenzierte Cache-/Job-/Altmodule sind nur Kandidaten fuer ein spaeteres internes Schema und werden nicht blind verschoben. Phase 7.21 legt mit SQL 084 die erste Härtungsmigration für RPC-EXECUTE-Rechte an. Phase 7.23 ergänzt SQL 085 für die neun globalen Stammdatentabellen: anon verliert direkte Tabellen-/Sequenzrechte; authenticated behält SELECT und nur die für RLS-geschützte Adminmasken benötigten DML-Rechte, während defi_staking_contracts browserseitig read-only bleibt. Die weiteren User-/Wallet- und Cache-/Job-Blöcke bleiben getrennte Folgemigrationen. Phase 7.24 ergänzt SQL 086 für die privaten User-/Wallettabellen: anon verliert direkte Tabellen-/Sequenzrechte; authenticated erhält nur die bereits durch RLS vorgesehenen DML-Operationen. chat_notification_state bleibt service_role-only; Trading-Cockpit- und globale Cache-/Jobtabellen bleiben bewusst ausserhalb dieses Blocks. Phase 7.25 klassifiziert den Cache-/Jobblock gegen den gesamten Browser-/Projektcode und die Edge Functions. Phase 7.26 ergänzt den Retirement-/Altbestand-Audit. Der anschließende Live-Audit bestätigt apertum_nft_history_coverage als aktiven Coverage-Cache, user_settings als noch zu prüfenden Scam-/Auto-Load-Zustand und tln_wallet_identity_cache als beizubehaltenden Test-/Nachweispfad. Phase 7.27 retired mit SQL 088 ausschließlich project_miner_ownership (leer) und wallet_current_price_snapshots (alter userbezogener Preis-Tagescache, ersetzt durch wallet_global_current_price_snapshot + 15-Minuten-Refresh). Sicherheitsguards brechen bei neuer Aktivität ab; die Delete-RPCs werden bereinigt. SQL 087 entzieht nur security_crypto_tests und user_team_aliases_private den direkten Browserzugriff; beide laufen produktiv über wallet-private mit Service-Role. Mehrere TLN-/Historien-Caches bleiben wegen nachgewiesenem Browserzugriff in public und werden nicht blind verschoben. Ab jetzt ausgefuehrte Migrationen bleiben dauerhaft im Repo.`
  },
  {
    status: "open",
    category: "Chains & Tokens",
    priority: "medium",
    title: "XRPL · issued currencies / Trustlines",
    desc: `Bewusst zurückgestellt bis ein echter Testfall/Testwallet mit XRPL-Token vorhanden ist. Produktiver Ausbau soll account_lines für aktuelle und historische Trustlines nutzen. XRPL-Tokens werden fachlich über Currency Code + Issuer identifiziert; keine ERC-20-Decimals-Logik übernehmen. Discovery/Spam-Erkennung muss gleiche Currency/Symbol-Namen mit abweichendem Issuer erkennen. Sobald produktiv umgesetzt, mindestens offizielles Circle-USDC und Ripple USD (RLUSD) als sichere vordefinierte XRPL-Tokens aufnehmen. Native XRP-Unterstützung bleibt unverändert.`
  },
  {
    status: "open",
    category: "Zu testen",
    priority: "high",
    title: "Zu testen · Wallet- und Datenlöschungs-Flows",
    desc: `OFFENE TESTS nach Phase 6.09:
- Fresh-Import 5.99: DAO1-Wallet mit 200+ Claims erneut testen; prüfen, ob aktuelle NFTs/Bots sofort sichtbar sind, native APTM-Auszahlungen ermittelt werden und historische USD-Werte ohne großen Sync-Log-Massenscan erscheinen.
- Laufzeit/Requests vergleichen mit 5.98 (8 Min. 59 Sek., 1.722 Requests); Ziel: deutlich weniger RPC-Volumen und kürzerer Erstimport.
- TLN Dashboard-Summary beim Fresh-Import: keine Supabase-400/22P02 mehr; transiente IDs wie local1 dürfen nie als wallet_id-UUID gefiltert werden.
- Audit P1 Regression: DAO1-Teilfehler müssen als partial/failed/deferred bis zum zentralen Wallet-Abschlussstatus sichtbar bleiben; kein partial-Lauf darf als „vollständig aufgebaut“ angezeigt werden.
- Audit P2 Regression: Bei Fresh-Build mit Lifecycle partial/deferred/failed darf kein automatischer finaler Snapshot geschrieben werden; bei complete muss genau der normale Snapshot-Pfad weiter funktionieren. Im Konsolenobjekt „Wallet Fresh-Build Snapshot-Gate“ muss der Blockierungsgrund sichtbar sein.
- Audit P3 Regression: Realtest 6.11 abgeschlossen. Fresh-Build ist beim NFT-Bestand/Ownership/Ersterwerb und den bekannten historischen Kaufpreisen deckungsgleich zum Entwicklungs-Testuser. #38483 löst wieder 10’000 wUSDT über Tx 0x31cd…1de2 auf; weitere bekannte Referenzen (#31722, #90227, #90289, #37174) stimmen ebenfalls. Bewusst nicht deterministisch verknüpfbare Kauf-/Mint-Batches bleiben offen. Phase 6.12 persistiert auch diese bewusst offenen Resolver-v3-Ergebnisse samt Erwerbs-Evidenz, damit der erste NFT-Tab-Einstieg keinen identischen Kaufpreis-Lauf erneut startet. P3 = erledigt. P4 bleibt aktiv: 6.13 senkte den Erstimport im Realtest auf 37’233 ms und DAO1 auf 25’103 ms; Claims liegen bei 3’681 ms, assetFlows bei 1’471 ms, NFT-Ownership bei 13’299 ms. Der 6.14-Prewarm-First-Versuch regressierte auf 43’377 ms Gesamt und 16’868 ms Ownership und wird verworfen. Phase 6.15 kehrt deshalb zur 6.13-Ownership-Logik zurück und protokolliert prewarm/rebuild/readback direkt als sichtbare Zahlen. Zwei 6.15-Realtests schwankten stark (94,0 s / 59,3 s Gesamt); im zweiten Lauf standen 22,5 s Lifecycle-Ownership nur 10,6 s gemessener Core-Zeit gegenüber. Phase 6.16 misst deshalb zusätzlich Inventory/Prepare sowie lifecycleMs/unaccountedMs, ohne die Fachlogik zu verändern. Der 6.16-Realtest erklärte lifecycleMs=15’060 ms vollständig (inventory 9’052 / prewarm 3’172 / rebuild 2’767 / readback 68; unaccounted=0). Phase 6.17 zerlegt deshalb nur noch den 9-Sekunden-Inventarblock in Owner-/Collections-Endpoint, Merge/Namensauflösung, Flag-Merge und nft_cache-Write; keine Optimierung in diesem Release. Der 6.17-Realtest ergab fetchMs=10’360 ms, davon Owner 5’528 ms und Collections 4’737 ms; beide liefen praktisch seriell. Phase 6.18 parallelisiert ausschließlich diese beiden unabhängigen Requests; der Realtest bestätigt 25’783 ms Gesamt / 16’788 ms DAO1 und damit P4 = erledigt. P5: Phase 6.19 stellt Detailtab, Bot-Summen, Bot-Übersicht und Dashboard auf eine gemeinsame asset-flow-first Claim-Auswertung um. Phase 6.20 persistiert bestätigte native APTM-Claims als project_transaction_asset_flows; der Realtest bestätigte 263 eindeutige native Flows / 263 TX / 1’829.869891 APTM. Phase 6.21 entfernt die Legacy-Reads aus sichtbaren Claim-, Transaktions- und Exportpfaden. Phase 6.22 bewertet die nativen APTM-Claim-Flows kanonisch historisch in USD; bestehende TX-Preise werden wiederverwendet und nur offene Blöcke über exact-v13 Price-Anchors bewertet. Neue native Claims nutzen denselben zentralen Bewertungsweg. Der erste 6.22-Realtest scheiterte korrekt als offene Migration mit PGRST204: loadAssetFlowRows ergänzt wallet_address nur zur Runtime/UI, die Tabelle project_transaction_asset_flows besitzt dieses Feld bewusst nicht. Phase 6.23 entfernt wallet_address zentral vor Asset-Flow-Upserts; die Preis-Migration lief danach erfolgreich (267 Flows, 257 bewertet, 10 missing; historischer Gesamtwert $1’452.40). Phase 6.24 korrigiert den letzten sichtbaren Read-Rest: „APTM-Preis USD historisch“ kommt nun aus dem kanonischen Asset-Flow price_usd statt aus r.aptm_usd. Der Realtest zeigte danach 10 echte Missing-Preise, darunter mehrere Claims deutlich nach dem APTM-Marktstart. Phase 6.25 protokolliert dafür Exact-Anchor, gültigen Nachbaranker davor/danach und Legacy-Predecessor. Der Realtest zeigte, dass tabgebundene Diagnose/Preisjobs architektonisch falsch platziert sind. Phase 6.26 verlagert Repricing und Diagnose in App-Start/DAO1-Aktualisierung, prüft nur offene Nicht-Prelaunch-Flows und markiert echte Vor-Marktstart-Fälle dauerhaft; der Claim-Tab liest nur noch persistierte Daten. Im selben Release wird der DAO1-Dark-Mode-Zebrafehler behoben (helle Grundzeilen trotz aktivem Dark Mode). Der 6.26-Realtest zeigt 4 echte Prelaunch- und 6 Post-Launch-Missing-Flows; die Diagnose blieb wegen zu frühem Admin-Gate bei diagnostics=0. Phase 6.27 verwendet für diese reine Eigendaten-Diagnose deshalb die aktive User-Session statt des noch nicht hydrierten Adminstatus und korrigiert zusätzlich den hellen Projekt-Subnav-Container im Dark Mode. Der 6.27-Realtest zeigte, dass alle 6 Post-Launch-Lücken hinter dem letzten vorhandenen globalen Preisanker liegen. Phase 6.28 synchronisiert deshalb bei Admin-Läufen die globale APTM-Preishistorie bis zum höchsten offenen Claim-Block; normale User lösen fehlende Exact-Zielblöcke lokal/read-only aus Pool-State/Sync-Logs auf, ohne globale Cache-Schreibrechte. Prelaunch ist wallet-unabhängig als Block < 88356 bzw. vor 18.02.2025 12:39:52 UTC definiert. Der Realtest bewertete alle 6 Post-Launch-Lücken (missing=0); P5 = erledigt. Legacy reward_aptm/USD bleiben nur Alt-/Kompatibilitätsdaten. P6 startet mit einem Read-Model-Konsistenzcheck zwischen zentralem nft_cache/project_nft_ownership und DAO1-Session-Sichten, bevor irgendein weiterer Refactor erfolgt. Der 6.30-Realtest bestätigt vollständige Deckungsgleichheit (19/19 aktuelle NFTs, 36/36 Ownership-Zeilen, keine onlyLocal/onlyCentral-Abweichung); P6 = erledigt. P7 Wallet-ID Lifecycle: 6.31 sichert persistente DB-Felder wallet_id strikt auf dbId/UUID ab. Der Fresh-Wallet-Realtest bestätigte ausschließlich UUID-basierte Requests, keine 400/422/22P02-Fehler sowie lifecycleStatus complete und failures=[]. P7 = erledigt. P8 startet in 6.32 mit zentraler Fehlerklassifikation optional/retryable/partial/fatal für bisher stille Async-Pfade; Fachstatus werden erst nach Realtest/Rest-Catch-Audit verschärft. Phase 6.36: Session-Verlust-Realtest erfolgreich; fehlende Session wird zentral erkannt, private Requests werden blockiert und Cache-only/Re-Login sichtbar. Rest-Catch-Audit bestätigt, dass die verbleibenden leeren Catches überwiegend defensive optionale Parser-/Storage-/Metadata-Fallbacks sind; keine pauschale Eskalation. P8 = erledigt. P9 Cache-Ownership startet mit vier Scope-Klassen: session/tab-RAM (flüchtig), Browser/UI (gerätebezogen rekonstruierbar), user/wallet/project (private persistente Ableitung, löschpflichtig) und global/shared (öffentliche/chain-abgeleitete Fakten, nicht user-löschpflichtig). Nächster Schritt ist die vollständige Domänen-/Key-/Tabellen-Inventur mit SoT, Invalidierung und Delete-Verhalten. Phase 6.36 schließt diese Inventur ab: RAM-/Promise-Caches sind nie SoT; localStorage/sessionStorage und wallet_tracking_cache/IndexedDB sind rekonstruierbare Gerätebeschleuniger; nft_cache, project_nft_ownership, discovery_cache, wallet_fee_cache, lp_position_cache, project_scan_state, wallet_refresh_state und userbezogene Projekt-/Lifecycle-Caches sind private persistente Ableitungen und purge-pflichtig; apertum_nft_transfer_cache, DAO1/APTMDAO-Tree-/Registry-Graphen, globale TLN-Identity/Technical-Caches, cache_data_versions und wallet_global_current_price_snapshot sind öffentliche/chain-abgeleitete Shared-Fakten. Keine konkrete Cross-User- oder Delete-Ownership-Lücke gefunden. Phase 6.37 schließt den Invalidierungs-/Versionierungs-Audit ab. DATA_VERSIONS-/Schema-/Root-Gates und der Schutz verifizierter Lifecycles sind konsistent. Eine konkrete Lücke wurde behoben: block-versionierte TLN/VOW-Staking-/Technical-Caches dürfen einen neueren persistenten last_scanned_block nicht mehr durch einen älteren Browser-Stand zurücksetzen. P9 = erledigt.

• Wallet hinzufügen
  - neue Wallet erfassen
  - prüfen, ob nur diese Wallet gezielt initialisiert wird
  - Ladebalken „Daten werden geladen …“ bleibt bis zum tatsächlichen Job-Ende sichtbar
  - DAO1/APTMDAO: Legacy-Claim-Token-Flows sowie native APTM-Internal-Auszahlungen neuer Miner müssen beim Fresh-Build reproduzierbar aufgebaut werden
  - projektbezogene Daten korrekt erkannt werden
  - Snapshot erst nach fehlerfreiem gezieltem Aufbau speichern
  - Dashboard und Summen danach stimmen

• Wallet löschen
  - einzelne Wallet vollständig löschen
  - prüfen, ob alle walletbezogenen Daten, Snapshots, 31.12.-Bestände, NFTs, Stakings, Claims und technische Caches entfernt bzw. invalidiert sind
  - Summen danach korrekt aus den verbleibenden Wallets neu aufgebaut werden

• Sämtliche Daten löschen
  - Funktion Support & Info → Daten & Konto testen
  - zweistufige Bestätigung prüfen
  - vollständige serverseitige Löschung prüfen
  - lokale Browserdaten/IndexedDB prüfen
  - normaler User: Logout danach prüfen; erneuter Login muss einen leeren WalletTracking-Stand zeigen
  - Admin-Testuser: Supabase-Auth-Session bleibt erhalten, kein neuer Magic Link nötig; leerer Neustart muss trotzdem bestätigt sein

Die Punkte bleiben hier offen, bis sie praktisch getestet und bestätigt wurden.`
  },
  { status: "open", category: "DAO1", priority: "medium", title: "NFT/Bot manuell als Bonus/Geschenk kennzeichnen", desc: "Erworbene DAO1/APTM-NFTs bzw. Bots optional userbezogen als Bonus/Geschenk markieren. Die On-Chain-Erwerbsdaten bleiben unverändert; die manuelle Klassifizierung erklärt einen Kaufpreis von 0 bzw. einen bewusst fehlenden Kaufpreis. Kein NFT darf allein wegen fehlender Zahlungs-Evidenz automatisch als Bonus eingestuft werden. Optional später Filter/Statistik Gekauft / Bonus-Geschenk / Ungeklärt." },
  {title:"Phase 5.35 · Dashboard Rewards/DAO-Partner",desc:"UMGESETZT: Reward- und Referral-Reward-Summaries zeigen Originalmenge je Chain+Asset/Contract statt USD. DAO-Partner: DAO1 und APTMDAO getrennt; projektweite Hauptzahl dedupliziert nach DID, sobald beide fachlich verifizierten DID-Sets vorliegen. Solange APTMDAO-Parent-Kanten noch nicht bewiesen sind, zeigt das Dashboard transparent nur den DAO1-Mindeststand statt APTMDAO=0 zu erfinden. Fehlende aktuelle Kurse nennen die betroffenen Assets."},
  {title:"Phase 5.36 · Dashboard-Präzision, TLN-Rewards & APTMDAO-Tree",desc:"UMGESETZT: Summary-Kommastellen sind eindeutig: leer = Anzeige übernehmen, 0 = null Nachkommastellen. Dashboard-Token erscheinen nur bei Bestand > 0. TLN/VOW normale Rewards und Referral Rewards werden aus den persistenten Discovery-Snapshots periodisiert in Originaltoken ins Dashboard gespiegelt. Reward-KPIs sind kompakter. Neuer APTMDAO-Tree ist über den verifizierten NFT-Mint-Event child/parent/wallet on-chain dekodiert, besitzt eigenen globalen Supabase-/IndexedDB-Cache (Migration 063), 24-Block-Overlap und dieselbe hierarchische UI wie DAO1. DAO-interne Partnernamen sind walletbezogen, bestehende DID-Aliase bleiben lesbar."},
  {
    status: "done",
    category: "Admin / Diagnose",
    priority: "high",
    title: "Systemübersicht · Funktionsbaum, Ladezeitpunkte & Request-Audit",
    desc: `STATUS: In Arbeit. Admin-Übersicht mit Menü → Tab → Untertab als Baum. Pro Bereich werden normaler App-Start, erster Start des Tages, Öffnen des Tabs und manuelle Aktualisierung sichtbar. Klick auf eine Zeile zeigt die einzelnen Datenbestände sowie Browser-Cache, Supabase und On-chain/API-Quelle. Detailansicht öffnet als Popup, damit der Baum beim Prüfen an seiner Position bleibt. DeFi-Projekte besitzt einen neutralen Übersicht-Tab, der beim Öffnen keine projektspezifischen Daten lädt. VERBINDLICHE REGEL: Dieser Baum muss bei jeder Programmänderung, Erweiterung oder Korrektur mitgeprüft und im selben Release aktualisiert werden, wenn Struktur, Status, Datenquelle oder Ladezeitpunkt betroffen ist. Phase 4.95: Baumknoten einzeln sowie global auf-/zuklappbar; neue Spalte „Aktueller Datenstand“ nutzt dieselben zentralen Metadaten wie die sichtbaren Datenstatus-Zeilen in den Tabs. Linke Hauptnavigation ist ein-/ausklappbar; Phase 4.95 zeigt im eingeklappten Zustand die echten Menü-Icons und zentriert/verkleinert den Pfeil. Strukturknoten im Systembaum zeigen keine Datenstands-/Ladespalten mehr; diese Informationen stehen nur auf echten Blatt-/Tab-Zeilen. Phase 5.24: private/globale TLN-Team-Cachepfade dokumentiert. Phase 5.25: Dashboard als Startseite ergänzt und Ladezeitpunkte neu aufgenommen. TLN/VOW-Discovery sowie manuelle Snapshots, allgemeiner Discovery-Cache, Gebühren-Summary und NFT-Cache starten erst beim Öffnen ihres Bereichs; die fachliche Discovery-Logik bleibt unverändert. Phase 5.75–5.78: tatsächliche Laufdiagnose ist umgesetzt. Der Request-Audit misst Supabase-/RPC-/API-Aufrufe mit Signatur, Scope/Filter, Aufrufer, Dauer und Status; Login/Tab-Wechsel werden markiert und Exporte sind möglich. Die Messläufe bestätigten die Startoptimierung (TLN/VOW Haupttab 143 → 42 → ca. 16 Requests; DAO-Team Warm-Run ca. 130 → 16; Bot-Claims → Referral-Rewards in derselben Session 0 zusätzliche History-Requests). Der Funktionsbaum gilt damit als umgesetzt; bei jeder weiteren Programmänderung bleibt die Aktualisierung der Systemübersicht verpflichtende Wartungsaufgabe. Phase 6.04 ergänzt beim gezielten DAO1-Wallet-Erstaufbau die Datenquelle „Wallet-NFT-Transferhistorie je bekanntem Projekt-Contract“ vor dem Ownership-Aufbau; project_nft_ownership ist Ergebnis/Read-Model und keine Voraussetzung des Fresh-Builds. Phase 6.05 behandelt historische outgoing-only Evidenz als belegte abgeschlossene Besitzperiode mit unbekanntem Erwerbsbeginn; es wird kein Startdatum geschätzt. Phase 6.06 trennt im Fresh-Build zusätzlich aktuellen Besitznachweis von Erwerbs-Evidenz: ein sicherer Current-State darf als current_state_evidence_only persistiert werden, ohne Erwerbsblock/-zeitpunkt zu erfinden; der Erwerbs-/Preis-Repair bleibt davon unabhängig offen. Phase 6.07 verifiziert Ownership-Mutationen mit einem erzwungenen DB-Fresh-Read. Phase 6.08 trennt im Fresh-Build die Lifecycle-Besitzabdeckung vom strengeren Erwerbs-/Kaufpreis-Repair: persistierter aktueller bzw. historischer Besitz kann den Lifecycle abschließen, während Enrichment-Lücken separat offen bleiben. Phase 6.09 korrigiert zusätzlich die Ownership-Cache-Priorität: ein frisch aus der DB gelesener Ownership-Stand darf im selben User-/Fresh-Build-Lauf nicht von einem älteren zentralen Shared-Cache überschrieben werden; Shared bleibt Start-/Fallback-Quelle.`
  },
  {
    status: "in_progress",
    category: "Performance / Skalierung",
    priority: "high",
    title: "Browser-Cache + DATA_VERSIONS + Delta-Synchronisation",
    desc: `STATUS: Basis produktiv im Einsatz; weitere Cache-Domänen werden bei konkretem Mess-/Fachbedarf ergänzt. Zentrale Browser-Cache-/DATA_VERSIONS-Infrastruktur wird bereichsweise weitergeführt. DAO1 alter Tree ist der Referenzcache; Phase 4.91: DAO1 alter Tree als Referenzpfad weiter validiert. Echtes DATA_VERSIONS-Gate eingebaut. Bei identischer lokaler/zentraler Version endet normales Team-Öffnen nach IndexedDB + Registry ohne State-Read, Schema-Probe, Delta-DB oder RPC. Manueller Discovery-Button erzwingt weiterhin den Chain-Freshness-Check. Migration 057 macht den DB-Trigger zum autoritativen Registry-Writer. Praxistest normaler Tab-Pfad bestanden: IDB + DATA_VERSIONS HIT, DB 0, Delta 0, RPC 0. Manueller inkrementeller On-chain-Update-Pfad wurde ebenfalls praktisch bestätigt (Blockbereich/Logs/Kanten sichtbar). DAO1 alter Tree ist damit als Referenzpfad abgeschlossen. Phase 4.95: TLN SmartNode Globalgraph als nächster grosser Bereich migriert: Browser-IndexedDB tln-vow/smartnode-global-graph + kleines DATA_VERSIONS-Gate. Bei HIT werden die Graph-Kanten lokal gelesen und es werden 0 Graph-Kanten aus Supabase geladen; bei Erstaufbau/Fallback wird die schemaoffene DB-Zeile vollständig (select(*)) lokal gespeichert. Migration 058 macht den TLN Graph-State zum autoritativen DATA_VERSIONS-Writer. Manueller inkrementeller On-chain-Scan bleibt unverändert fachlich maßgeblich und zieht IndexedDB nach. Praxistest nach Migration 058 noch offen. Phase 4.95 EGRESS-FIRST: Normaler TLN-Team-Restore lädt nicht mehr den vollständigen SmartNode-Globalgraph und nicht mehr den vollständigen globalen Wallet→TLN-ID-Cache. Migration 059 stellt eine schemaoffene rekursive Team-Slice-RPC bereit (Downline max. 20 je eigenem Leader + notwendige Upline). Eigene IDs werden zuerst gezielt geladen, danach nur IDs der tatsächlich relevanten Slice-Wallets. Browser-Key smartnode-team-slice-v2; bei identischer globaler DATA_VERSION kommen 0 Graph-Nutzdaten aus Supabase. Vollgraph bleibt ausschließlich Discovery/Step 7 bzw. expliziten Updatepfaden vorbehalten. Phase 4.96: Cache-Restore korrigiert: Globalgraph und Team-Slice besitzen wieder getrennte IndexedDB-Keys. Ein vorhandener Phase-4.94-Globalgraph wird lokal ohne Supabase-Nutzdaten in den relevanten Team-Slice migriert; bei fehlgeschlagener Versions-/DB-Prüfung wird ein vorhandener Slice als sichtbarer Fallback verwendet statt den Baum leer zu lassen. Phase 4.95 ergänzt für TLN-Team den Lifecycle-Nachlauf: verifizierte Lifecycles (einschließlich belastbarer Nullfunde) bleiben persistent; nach cache-first Render werden höchstens 3 offene Wallets pro Tab-Sitzung im Idle-Hintergrund nachverifiziert. Versuch/Status/Retry-Zeitpunkt werden im technischen Supabase-Cache als eigene team-lifecycle-queue persistiert; unverifizierte/Fehler-Fälle werden frühestens nach 24h erneut versucht. Step 7 bleibt der vollständige Discovery-/Nachverifikationslauf. Phase 4.97: Das 3er-Limit gilt nun pro Idle-Batch statt pro gesamter Tab-Sitzung. Noch nie geprüfte offene Partner werden in weiteren kleinen Batches bis zum abgearbeiteten Backlog nachgezogen und persistent gespeichert; bereits verifizierte Partner werden nicht erneut gescannt, Fehlerfälle behalten das 24h-Retryfenster. Damit bleiben Partner wie TLN-ID 11674 nicht dauerhaft unverifiziert, nur weil sie hinter dem ersten Batch lagen. Zusätzlich wurde der veraltete TLN_TEAM_GRAPH_TABLE-Verweis der historischen Wallet-Auswahl auf TEAM_GRAPH_CACHE_TABLE korrigiert. Phase 4.98: Die Lifecycle-Queue sperrt weiterhin unverifizierte Partner nach einem normalen retry_wait nicht mehr 24h. Das 24h-Fenster gilt nur noch fuer echte error_retry-Faelle; ein haengengebliebener running-Status wird nach 15 Minuten wieder freigegeben. DEV-Log nennt bei Freigabe/Sperre die betroffenen TLN-IDs, damit offene Partner wie 11674 direkt nachvollziehbar sind. Phase 5.01: Lifecycle-Background-Verifikation arbeitet ein begonnenes Wallet nun in bis zu vier Konvergenz-Prüfschritten weiter, solange sich der belastbare Lifecycle-Stand noch verändert. Sobald kein weiterer Fortschritt mehr entsteht, wird der aktuelle Lauf als fachlich offen/stabil beendet statt bei jedem Reload nur einen einzelnen Schritt weiterzugehen. Der TLN-Team-Status zeigt die laufende Hintergrund-Aktualisierung samt Wallet-/Prüfschritt-Fortschritt sichtbar an; vorhandene Cache-Daten bleiben währenddessen benutzbar. Phase 5.04: Egress-First-Team-Slice repariert: 'teamLoadRelevantGraphSlice()' definiert den SmartNode-Contract jetzt lokal und übergibt ihn korrekt an 'wt_tln_smartnode_graph_slice'. Zuvor konnte ein Cache-Miss vor dem RPC-Aufruf mit 'contract is not defined' in den Fallback laufen. Der Erstaufbau lädt damit wieder nur den relevanten Team-Slice statt den Globalgraph. Systemübersicht geprüft: Datenquelle/Ladezeitpunkt bleiben unverändert, daher dort keine Strukturänderung nötig. Phase 5.05: Der Background-Worker beendet sich nicht mehr nach dem ersten 3er-Batch bzw. verlaesst sich fuer die Fortsetzung nicht mehr auf einen neuen Idle-Callback. Der komplette freigegebene Backlog wird in derselben Worker-Kette abgearbeitet; 3 bleibt nur die Batch-Groesse. Einzelne technische Wallet-Fehler werden isoliert als error_retry gespeichert und die restliche Queue laeuft weiter. Fortschritt/Abschluss nennen die Gesamtzahl der geprueften Partner. Phase 6.41: Fresh-Wallet-Slice-MISS repariert. Der Team-Tab merkt die aktuelle Own-Wallet-Root-Signatur; ein leerer relevanter Slice startet genau einmal den bestehenden Step-7-Discovery-/Neuaufbaupfad. Bei Cache-HIT bleibt der egress-first Restore unverändert billig; wiederholtes Tab-Öffnen derselben Sitzung startet keinen zweiten Cold-Lauf. Ein Wallet-Import mit geänderter Root-Signatur invalidiert die Restore-Promise und darf einen neuen Slice aufbauen. Phase 6.42: Realtest von 6.41 zeigte keinen Start, weil index.html tln-vow-discovery.js noch mit dem alten Cache-Buster v=20260927-112214 referenzierte. Der Cache-Buster wurde build-synchron. Phase 6.43: weiterer Realtest blieb leer; Ursache war eine Race Condition: der Team-Tab konnte Roots/Slice prüfen, bevor init() tlnWallets aufgebaut hatte. Team wartet nun auf ensureInitialized(), erst danach folgt Restore bzw. einmaliger Step-7-MISS-Start. Console-Diagnose ergänzt; Realtest 6.43 offen. Phase 6.44: Realtest 6.43 bestätigte den Start, zeigte aber einen unvertretbaren Cold-Fallback: bei fehlendem verifiziertem Globalgraph scannt Step 7 die SmartNode-Historie ab Block 0 und erzeugte >3500 Requests ohne Abschluss. Normaler Team-Tab darf diesen Fullscan nicht mehr automatisch starten. Vor dem Slice werden Own-Wallets gezielt auf verifizierte TLN-IDs reduziert; Slice-MISS bleibt sichtbar und der vollständige Globalgraph-Neuaufbau ist nur noch explizit manuell/DEV erlaubt. Phase 6.45: Realtest 6.44 zeigte danach weiterhin >1400 einzelne eth_getTransactionByHash-Requests. Der verbliebene Sturm kam nicht mehr aus dem Globalgraph, sondern aus der automatischen Lifecycle-Nachverifikation offener Partner nach Cache-Restore (Supplemental-Registry/Cache-Nachlauf). Normaler Team-Tab ist jetzt strikt cache-only: persistente Graph-, Identity- und Lifecycle-Daten werden angezeigt, offene Lifecycles bleiben offen; teamVerifyMissingLifecycles wird beim Restore nicht automatisch gestartet. Historische Lifecycle-Rekonstruktion nur explizit via Step 7 bzw. gezieltem Partner-Detail-Refresh. Phase 6.46: Realtest 6.45 zeigte trotzdem >1000 eth_getTransactionByHash-Aufrufe; Ursache war der automatische History-Aufbau in teamRestoreAdditionalRegistryGraph() bei fehlendem Zusatzregistry-Cache. Normaler Restore liest Zusatzregistries nun ausschliesslich persistent/cache-only; weder on-chain Join-Historie noch Evidence-Tx-Parent-Hydrierung laufen automatisch, beides nur explizit Step 7. Phase 5.06: Die fachliche Abschlussbedingung für verifizierte Nullfunde wurde verschärft: Contract-Coverage muss mindestens einen tatsächlich geprüften relevanten Contract enthalten und vollständig fehlerfrei sein. Der Team-Lifecycle-Cache wurde auf v8 erhöht, damit ältere Nullfunde aus v7 nicht ungeprüft weiter als verifiziert erscheinen.

ZIEL
Grosse, überwiegend unveränderliche Blockchain-Cache-Daten, die bereits aus Supabase geladen wurden, sollen nicht bei jedem Seitenaufruf erneut vollständig aus der Datenbank übertragen werden. Dadurch Supabase-Egress deutlich reduzieren, Datenbank/API entlasten und WalletTracking spürbar schneller starten.

ARCHITEKTUR
• Für grosse öffentliche Blockchain-Caches IndexedDB als persistenten Browser-Cache verwenden; nicht nur den normalen HTTP-/Session-Cache.
• Beim ersten Aufruf auf einem Gerät benötigte Daten aus Supabase laden und lokal in IndexedDB speichern.
• Bei späteren Aufrufen vorhandene lokale Daten sofort anzeigen.
• Danach im Hintergrund nur einen kleinen Versions-/Freshness-Check gegen Supabase durchführen.
• Nur wenn sich Daten geändert haben, ausschliesslich neue/geänderte Datensätze (Delta) laden und IndexedDB aktualisieren.
• Bestehende inkrementelle Blockchain-Scans und Overlap-Logik weiterverwenden; keine zusätzlichen Vollscans pro User.

DATA_VERSIONS
Die bereits geplante zentrale DATA_VERSIONS Registry dafür verbindlich umsetzen. Jeder grosse Cache-Bereich erhält eine eigene Version bzw. einen geeigneten Änderungsstand. Beispiel: Browser DAO1_TREE_VERSION=17, Supabase=17 → kein Tree-Download. Supabase=18 → nur Delta seit lokalem Stand laden. Versions-/Freshness-Abfragen müssen sehr klein sein.

GEEIGNETE DATEN
• DAO1 alter globaler Tree: sehr hohe Priorität; historischer Graph ändert sich kaum, daher einmal laden + Delta.
• TLN Team-/Graph-Cache: einmal laden + Delta/Freshness.
• APTM historische Preise: nur benötigte Preisanker/-bereiche lokal halten; niemals blind die gesamte Historie zum Browser übertragen.
• Öffentliche NFT-/Bot-Blockchain-Daten: vorhandene Datensätze lokal behalten und nur neue/geänderte ergänzen.
• Staking-/Transaktionshistorien: historische abgeschlossene Daten lokal wiederverwenden und nur neue Events ergänzen, sofern fachlich passend.

PROJEKTTRENNUNG
TLN/VOW und DAO1/APTM bleiben strikt unabhängige Projekte. Gemeinsame IndexedDB-/Versions-Infrastruktur ist zentral erlaubt, aber Stores, Cache-Keys, Versionen, Delta-Endpunkte und Daten müssen eindeutige Projekt-Namespaces besitzen. Keine DAO-Daten in TLN-Caches und umgekehrt.

PRIVACY / SICHERHEIT
• Öffentliche On-Chain-Daten dürfen persistent lokal gecacht werden.
• Private/userbezogene Daten wie Wallet-Aliase, Partnernamen oder andere geschützte Informationen nicht unverschlüsselt in einen neuen dauerhaften Browser-Cache kopieren. Bestehende Verschlüsselungs-/Privacy-Architektur bleibt maßgeblich.
• Logout/Userwechsel darf keine privaten Daten eines anderen Users sichtbar machen.

STARTVERHALTEN
Seite öffnen → lokalen Cache sofort lesen/anzeigen → im Hintergrund DATA_VERSIONS/Freshness prüfen → nur Delta laden → lokalen Cache aktualisieren → UI bei Bedarf aktualisieren. Fehlender/defekter/veralteter lokaler Cache muss automatisch sicher aus Supabase rekonstruierbar sein.

EGRESS-MESSUNG
Vor und nach Umsetzung die übertragenen Daten für typische Abläufe messen: Login/Start, DAO1 Team alt, TLN Team, DAO1 Übersicht/NFTs und historische Preisabfragen. Ziel ist nicht nur subjektiv schnelleres Laden, sondern nachweisbar deutlich weniger Supabase-Egress pro wiederkehrendem User. Grosse Volltabellen-Downloads im normalen Seitenbetrieb gezielt identifizieren und eliminieren.

UMSETZUNGSREIHENFOLGE
1. Bestehende Supabase-Ladepfade und Egress-Hotspots inventarisieren. STATUS: gestartet; App-Start und Haupttabs im Systembaum präzisiert.
2. Zentrale IndexedDB-Cache-Schicht mit Schema-/Cache-Version und sauberer Fehler-/Reset-Strategie bauen.
3. DATA_VERSIONS Registry zentral umsetzen.
4. DAO1 alten Tree als ersten grossen Referenzcache migrieren und Delta-Sync testen.
5. TLN Team-/Graph-Cache migrieren.
6. APTM-Preisanker sowie geeignete NFT/Bot-/Staking-Caches schrittweise anbinden.
7. DEV-Diagnose für Local hit / Supabase delta / Full rebuild / übertragene Datensätze bzw. Bytes ergänzen.
8. Egress erneut messen und daraus realistische User-Kapazität für den aktuellen Supabase-Plan ableiten.

ERFOLGSKRITERIEN
• Wiederholter Seitenaufruf lädt grosse unveränderte globale Caches nicht erneut vollständig aus Supabase.
• Anzeige kann aus lokalem Cache schnell starten.
• Änderungen werden zuverlässig inkrementell nachgezogen.
• Cache kann jederzeit kontrolliert neu aufgebaut/gelöscht werden.
• Keine Vermischung von TLN und DAO.
• Keine Schwächung der bestehenden Privacy-/Verschlüsselungsregeln.
• Supabase-Egress pro wiederkehrendem User sinkt messbar deutlich. Phase 4.99: Linke Navigation korrigiert: Der Ein-/Ausklapp-Pfeil sitzt im aufgeklappten Zustand rechts neben WalletTracking und ist vertikal zur Titelzeile zentriert. Im eingeklappten Zustand bleiben die Menü-Icons sichtbar; nur die Textlabels werden ausgeblendet. Phase 5.00: TLN/VOW Team-Lifecycle-Darstellung korrigiert: Bei teilweise verifizierten Wallets werden pro Position bereits eindeutig on-chain geschlossene/unstakete Stakings als solche angezeigt; ein offener Duration-Proof einer anderen Position darf einen bestätigten Unstake nicht mehr als „Lifecycle offen“ darstellen.`
  },
  {
    status: "open",
    category: "Benachrichtigungen / Alerts",
    priority: "high",
    title: "Benachrichtigungen / Alerts / Telegram",
    desc: `STATUS: Idee / Konzept – noch nicht umgesetzt.

ZIEL
WalletTracking soll wichtige Ereignisse automatisch im Hintergrund erkennen und den jeweiligen User benachrichtigen. Die Event-Erkennung wird unabhängig vom Benachrichtigungskanal aufgebaut. Als erster Kanal ist Telegram über einen eigenen WalletTracking-Bot vorgesehen; später können Web-Push oder E-Mail ergänzt werden.

MÖGLICHE EVENTS
TLN / VOW:
• Neuer Partner wurde im eigenen Team registriert.
• Ein Partner eröffnet ein neues Staking.
• Eigenes Staking läuft in X Tagen aus.
• Später weitere relevante Loan-/Staking-/Team-Events.

DAO1 / APTM:
• Neuer Partner wurde im eigenen Team registriert.
• Partner kauft einen neuen Bot/Miner.
• Partner eröffnet ein neues Staking.
• Später weitere relevante NFT-/Team-Events.

KURSE
• User kann pro unterstütztem Token eigene Kursalarme definieren: Kurs steigt über X / fällt unter X.
• Später optional prozentuale Kursbewegungen innerhalb eines Zeitraums.
• Voraussetzung: zentrale aktuelle und historische Kursfunktion für die unterstützten Tokens.

TELEGRAM-VERKNÜPFUNG
1. User klickt „Telegram verbinden“.
2. Backend erzeugt einen kurzlebigen einmaligen Verbindungstoken.
3. Telegram-Bot wird über einen Deep-Link mit diesem Token geöffnet.
4. User startet den Bot.
5. Telegram-Chat-ID wird serverseitig dem WalletTracking-User zugeordnet.
6. Verbindungstoken wird anschließend ungültig.
7. Verbindung kann jederzeit getrennt werden.
Keine manuelle Eingabe eines Telegram-Usernamens.

ARCHITEKTUR
Projektübergreifendes zentrales System, nicht separat in TLN/VOW und DAO1/APTM:
Blockchain-/Kursdaten → Background Jobs → Event Detection → User Notification Rules → Notification Queue/Log → Telegram bzw. weitere Kanäle.
Bestehende Discovery-Logik und globale Caches wiederverwenden; keine vollständigen Blockchain-Scans separat pro User. Beispiele: TLN Team Discovery → NEW_PARTNER; Staking Discovery → NEW_STAKING; DAO NFT Discovery → NEW_BOT; gespeichertes Staking-Enddatum → STAKING_EXPIRING; zentrale Kursfunktion → PRICE_ABOVE / PRICE_BELOW.

TECHNISCHE REGELN
• Event-Erkennung und Benachrichtigungsversand strikt trennen.
• Blockchain-Events möglichst einmal global erkennen und danach betroffenen Usern zuordnen.
• Bestehende Discovery-/Cache-Daten wiederverwenden.
• Events eindeutig identifizieren, damit Overlap-Scans keine Doppelmeldungen erzeugen.
• Notification-Log führen: erkannt, versendet, fehlgeschlagen etc.
• User kann Events projektweise bzw. einzeln aktivieren/deaktivieren.
• Private User-/Telegram-Zuordnungen gemäß bestehendem Privacy-/Verschlüsselungskonzept behandeln.
• Staking-Ablaufwarnungen verwenden bereits ermittelte/on-chain bestätigte Laufzeit-/Enddaten und lösen keine unnötigen neuen Blockchain-Scans aus.

UI
Neuer zentraler Bereich „Benachrichtigungen“ mit Telegram verbunden/nicht verbunden/trennen, TLN/VOW- und DAO1/APTM-Regeln, Vorlauf fürs Staking-Ende (z. B. 30/14/7/1 Tage), Kursalarme pro Token und Benachrichtigungshistorie.

UMSETZUNG
Vor Implementierung zuerst grafisches Mockup gemäß WalletTracking-UI-Regel. Danach schrittweise: (1) Datenmodell Events/Rules/Log, (2) Telegram-Bot + sichere Account-Verknüpfung, (3) UI-Einstellungen, (4) TLN-/DAO-Team-Events, (5) Staking-Events/Ablaufwarnungen, (6) Bot-/Miner-Käufe, (7) zentrale Kursfunktion/Kursalarme, (8) interne Benachrichtigungshistorie.`
  },
  {
    status: "in_progress",
    category: "Übersicht / Analyse",
    priority: "high",
    title: "Persönliches Gesamt-Dashboard",
    desc: `Gesamtvermögen über alle eigenen Wallets und Projekte mit Aufteilung nach Token, Stakings, Loans, NFTs, Rewards und frei verfügbarem Guthaben. Entwicklung über 24 Stunden, 7 Tage, 30 Tage, Jahr und seit Einstieg; Kennzahlen investiert, zurückerhalten, aktueller Wert sowie realisierter/unrealisierter Gewinn oder Verlust. PROJEKTREGEL: TLN/VOW und DAO1/APTM bleiben strikt getrennt; projektübergreifend werden ausschließlich aggregierte Werte gezeigt, Details öffnen immer den jeweiligen Projektbereich.

PHASE 5.25 · ERSTE AUSBAUSTUFE:
• Dashboard ist Startseite nach dem Login.
• Kennzahlen werden aus bereits geladenem Bestands-/Preiscache gebildet; fehlende Werte bleiben sichtbar „–“ und starten keine Discovery.
• Kursliste verwendet das zentrale Token-Flag predefined_tokens.dashboard_visible.
• Projekt-Kacheln erscheinen nur, wenn im gewählten Wallet-/Personenbereich ein klassifizierter Projektbestand vorhanden ist.
• Start lädt nur den vorhandenen Preis-Snapshot; fehlender/veralteter Preis-Cache löst keine API-/RPC-/TLN-Infrastruktur-Abfrage aus.
• Aktuelles Staking wird in V1 nur berücksichtigt, wenn ein vorhandener Positionscache bereits im Bestand steckt. Monats-Rewards/Referral-Rewards, Partner-Staking-Aktionen, Verlauf sowie investiert/realisiert/unrealisiert bleiben nächste Dashboard-Cache-Stufen.
• Manuelle Snapshots, allgemeiner Discovery-Cache, Gebühren-Summary, NFT-Cache und die vollständige TLN/VOW-Initialisierung sind aus dem Login-Start entfernt und werden erst beim Öffnen ihres Bereichs geladen.
• Nächster Architekturpunkt: einen kompakten userbezogenen Dashboard-Snapshot definieren, damit weitere Basisabfragen beim Start entfallen können.

PHASE 5.31/5.32 · START-/DASHBOARD-ARCHITEKTUR:
• Aktuelle Preise sind ein globaler, nicht historisierter 15-Minuten-Snapshot. Ein globaler Slot-Lock verhindert parallele Preisjobs mehrerer User. Datenquelle und Cache-Status sind getrennte Begriffe.
• Dashboard bleibt immer Startseite – auch bei einem komplett neuen User ohne Wallet. Ohne Wallet erscheint eine verständliche Erststart-Hilfe mit Ein-Klick-Aktion „Erste Wallet erfassen“.
• Nach dem Speichern einer neuen Wallet startet automatisch der vorhandene zentrale Grunddatenlauf. Der User muss keinen Projekt-Tab öffnen, damit der erste Bestands-/Projektpositions-/NFT-Cache aufgebaut wird.
• Historischer Stand bis Phase 5.74: Bei bestehenden Wallets konnte nach dem Cache-Dashboard eine tägliche Hintergrundprüfung starten. Seit Phase 5.75 ist dieser allgemeine Login-Auto-Refresh entfernt; bestehende Wallets bleiben beim normalen Start cache-first und werden gezielt manuell bzw. über zuständige Projekt-/Freshness-Pfade aktualisiert.
• Projekt-Detail-Discovery bleibt getrennt. Dashboard-Grunddaten dürfen aus persistenten Projektcaches/Summaries übernommen werden; das Dashboard selbst startet keinen Globalgraph-/Historien-Vollscan.
• Phase 6.51: TLN/VOW Staking-/Referral-/Bonus-Tabs verwenden bei Fresh Usern dieselbe globale sanitized Reward-Summary v2 cache-only; fehlende Detaildaten werden nicht als echte 0-Werte ausgegeben.
• Phase 6.52: Globaler userfreier On-Chain-Detailcache ergänzt. wallet-private darf für eigene Wallets bereits verifizierte Staking-/Reward-/Referral-/Bonus-Details derselben Adresse serverseitig sanitisiert aus einem privaten Discovery-Snapshot übernehmen und global persistieren. Fresh User erhalten Positionen und einzelne Claims dadurch cache-only ohne Browser-History-Scan. Offen bleibt nur die kontrollierte serverseitige Erst-Discovery einer Wallet, für die systemweit noch kein verifizierter Snapshot existiert. Dark-Mode-Tabellen im TLN-Projekt sind zentral/scoped abgesichert.
• Phase 6.53: Der separate TLN-Tab „Rewards Summary“ ist entfernt; die Staking-Reward-Summary steht direkt oben in „Staking/Rewards“. Detailstatus-Hinweise werden nicht mehr doppelt dargestellt. Globaler On-Chain-Detailcache v2 übernimmt zusätzlich vorhandene Step-6-USD-Bewertungen (Stake/Vertragsende/Unstake) aus dem privaten technischen Snapshot derselben Wallet. Reward-/Claim-Tabellen kürzen lange Chain-Referenzen, damit keine Spalten überlappen.
• Phase 6.54: Regression-Fix zu 6.53. Der UI-Umbau hatte Summary/Detaildaten bei Fresh Usern zeitweise leer gerendert. Staking/Rewards, Referral und Bonus warten nun wieder auf den cache-only Summary-/Detail-Ladepfad; parallele Summary-Loads werden awaited. Vorhandener globaler Detailcache v1 bleibt nutzbar, während v2 Step-6-Werte ergänzt. Ein fehlender/inkompatibler Step-6-Valuation-Cache darf den serverseitigen Detailbackfill nicht mehr komplett abbrechen.
• Phase 6.55: Legacy-Untertab „Liquidity Pools_old“ vollständig entfernt. „Kurse und Pools“ ist die einzige produktive TLN/VOW-Poolansicht; alte Navigation, Panel-Hülle, Systemübersichts-Eintrag und showTlnLpChain-Helfer wurden entfernt.
• Phase 6.56: Für systemweit unbekannte eigene TLN/VOW-Wallets ist die Fresh-Wallet-Lücke jetzt kontrolliert bedienbar. Wenn weder privater Snapshot noch globaler Detailcache existiert, kann der Nutzer die Erst-Discovery ausdrücklich starten. Der Lauf verarbeitet ausschließlich die fehlenden eigenen Wallets nacheinander über Steps 1–6; Step 7/Team ist ausgeschlossen. Nach Abschluss werden privater Discovery-Snapshot, globale Reward-Summary und sanitiserter globaler On-Chain-Detailcache nachgezogen. Beim normalen Tab-Öffnen bleibt alles cache-only; kein automatischer History-Vollscan.
• Phase 6.57: Regression-Fix für TLN/VOW Reward-/Claim-Rendering. Der zentrale Helper projectChainRefHtml ist jetzt definiert und rendert gekürzte BSC-Adresse/Tx-Links mit Copy-Funktion. Damit brechen Staking-, Referral- und Bonus-Ansichten nicht mehr mit dem ReferenceError projectChainRefHtml is not defined ab.
• Phase 6.58: Staking-, Referral- und Bonus-Reward-Summaries verwenden wieder verständliche UI-Texte ohne interne Cache-/Human-Units-Begriffe. Reward-Tx-Anzahlen werden aus vorhandenen Detaildaten ergänzt, aber nur bei vollständig abgedecktem Scope; bei partiellen Fresh-User-Details bleibt die Zahl bewusst offen.
• Phase 6.59: Dashboard-Rewardzustand für TLN/VOW ist explizit. Fehlt für mindestens eine relevante eigene Wallet die verifizierte Reward-/Detailabdeckung, zeigt die UI „noch nicht ermittelt“ bzw. „noch nicht vollständig ermittelt“ statt eines scheinbaren Nullwerts. Während der Erst-Discovery steht „wird ermittelt …“; erst vollständige Abdeckung darf echte 0 bzw. Rewardwerte anzeigen. „Detaildaten jetzt ermitteln“ verwendet denselben kontrollierten Steps-1–6-Pfad wie im Projektbereich; Step 7/Team bleibt ausgeschlossen. Danach werden globale persistente On-Chain-Summaries/Details wieder cache-only genutzt.
• Phase 6.60: Bei einer neu gespeicherten eigenen TLN/VOW-Wallet wird derselbe kontrollierte Steps-1–6-Pfad nun automatisch innerhalb des bereits sichtbaren/gezielten Wallet-Erstaufbaus gestartet, sobald die Wallet als TLN/VOW-Projektwallet erkannt ist und noch kein wiederverwendbarer Detail-Snapshot existiert. Kein automatischer Step-7-/Team-Fullscan. Der manuelle Detaildaten-Button bleibt nur als Retry/Fallback für Altfälle oder abgebrochene Läufe. Button-Inventur: zentrale Bestands-/Preisaktualisierung bleibt Hauptweg; Discovery, Gebühren, Approvals, 31.12.-Neuberechnung, NFT-Besitzhistorie sowie DAO1 On-Chain-Diagnose sind bewusste On-Demand-Funktionen; Admin-/DEV-Neuladen und TLN-Step-Buttons bleiben klar getrennte Werkzeuge.
• Phase 6.61: Normale User dürfen bei leeren Teamdaten nicht mit internen Begriffen wie persistentem Slice, Step 7 oder deaktiviertem Fullscan konfrontiert werden. Sie sehen einen fachlichen Leerzustand; technische Diagnose bleibt Admin-only. Dashboard-Kurse verwenden bei bekannten TLN/VOW-v-Währungen Preisrouten-Namen (v€/v£/v$), falls Stammdatenname/Symbol fehlen, statt eine Contract-Adresse als primären Tokennamen zu zeigen. Button-Audit: keine Sammelaktion darf Spezialscans (Approvals, Gebühren, Historie, Team-On-Chain, DEV) unbemerkt mitstarten; doppelte zentrale Current-State-/Preisbuttons sind UI-Kandidaten für Konsolidierung, werden aber erst nach separatem UX-Entscheid geändert.
• Phase 7.30: DAO1 (alt) und APTMDAO (neu) werden im Team-Tab wieder fachlich getrennt dargestellt; Dashboard-/Gesamtkennzahlen bleiben wallet-dedupliziert (1 Wallet = 1 Partner). Referral Rewards zeigen DID und vorhandenen verschlüsselten DID-Namen; OFFEN bleibt ausschließlich die Zuordnung zum verursachenden Partner, bis dafür eindeutige On-Chain-Evidenz verfügbar ist – keine heuristische Zuordnung.
• Phase 6.64: Native Coins in „Vordefinierte Token“ können DeFi-Projekt und Projekt-Kategorie nun direkt in der Admin-UI ändern; damit ist z. B. APTM→DAO1 sichtbar und nicht mehr nur per SQL gesetzt. Dark-Mode-Grund-/Zebra-/Hover-Flächen der project-data-table sind zentral dunkel.
• Phase 6.65: Kleine Token-Verwaltungsaktionen starten keinen globalen loadAll mehr. Neue sichere/vordefinierte Token aktualisieren nur die betroffene Chain, Entfernen rendert aus dem vorhandenen Cache neu. Der Token-Subfilter folgt der Chain. „Datenstand pro Wallet“ liegt standardmäßig zugeklappt innerhalb „Datenaktualisierung“.
• Phase 6.63: Dashboard-Projektwerte berücksichtigen nun auch native Assets mit explizitem DeFi-Projekt-Stammdatensatz. Migration 075-aptm-native-dao1-project.sql ordnet den bestehenden nativen Apertum-APTM-Stammdatensatz DAO1 zu, damit APTM und wAPTM gemeinsam im DAO1-Projektwert erscheinen. „Alle Spam-Verdächtigen als Spam markieren“ schließt bereits manuell sichere Token aus; alte Discovery-Treffer solcher Safe-Token werden nicht mehr als unbekannt angeboten. Bestandesaufnahme per 31.12. blendet ausdrücklich als Spam markierte Token aus gespeicherten und neu berechneten Ständen aus; eine spätere Safe-Freigabe hat Vorrang, reiner Spam-Verdacht reicht nicht zum Ausschluss.
• Phase 6.68: Refresh-/Button-Audit abgeschlossen. Der normale User hat mit Dashboard → Daten aktualisieren eine zentrale manuelle Vollaktualisierung inklusive DAO1/APTMDAO Delta-Sync (Transaktionen/Flows/Claims/Referral, NFT-Ownership bei Änderungen, Team). Täglicher Auto-Lauf bleibt inkrementell und verwendet einen gerade zentral erneuerten Apertum-NFT-Current-State weiter, statt ihn im DAO-Lauf nochmals live zu laden. DAO1 NFT-Besitzerhistorie-Rebuild und historische Preis-Neuberechnung sind Reparatur-/Adminaktionen. Gebühren, Freigaben, Token-Discovery und 31.12.-Historie bleiben bewusst separate fachliche Aktionen.
• Phase 6.69: Navigation neu geordnet: Dashboard enthält Übersicht / Wallet-Bestände / Bestand per 31.12.; Wallet-Verwaltung und Token-Verwaltung sind getrennt; Gebühren/NFTs/Freigaben liegen unter Analyse / Berichte. Neue Wallets erhalten einmalig automatisch eine kontrollierte Token-Discovery. Offene Token-Klassifizierungen erscheinen als konkrete Aufgabe im Dashboard und führen zu „Entdecken & prüfen“.
• Phase 6.74: Staking-Principal gilt projektübergreifend als Vermögen bis zum tatsächlichen Unstake. TLN/VOW PCLP/LPT nutzt zusätzlich den verifizierten Discovery-Lifecycle; DAO1/Apertum LP-Staking wird über den verifizierten defi_staking_contracts-Katalog als Stake/Unstake klassifiziert und im täglichen zentralen Refresh nachgeführt. Current-Wealth/Dashboard, Projekt-LP-Ansichten und 31.12.-Stichtagsbestand zählen Stake ≤ Stichtag minus echte Unstakes ≤ Stichtag und bewerten mit dem historischen LP-Stichtagspreis. Doppelzählung mit Wallet-LP und Positionscache wird vermieden. Innerhalb der Projektseiten bleibt TLN/VOW | DAO1 als direkte Projekt-Navigation sichtbar.
• Phase 6.79: 31.12.-Performance-Audit nach Realtest mit >2’300 Requests: Steuerlauf fragt nur noch verifizierte/vordefinierte/eigene sichere Token sowie persistente LP-Paare ab; unbekannte historische Spam-/Airdrop-Contracts lösen keine balanceOf-Schleife mehr aus. LP-Historie wird pro Wallet/Projekt einmal geladen und für Pair-Erkennung + Staking-Stichtagsbestand wiederverwendet. DAO1-Liquidity-Pools: Cache sofort, fehlend/veraltet → automatischer inkrementeller Tageslauf beim Öffnen; manueller Force-Refresh nur Admin.

• Phase 6.81: 31.12.-Performance-Diagnose nach Realtest 6.80: Die bereits pro EVM-Chain gespeicherte Kennzahl „Token-Balancechecks X→Y vorgefiltert“ wurde zwar in den Coverage-Details erzeugt, aber der abschließende sichtbare Status überschrieb diese Information mit dem generischen Coverage-Text. Der Abschlussstatus aggregiert die Werte nun über alle relevanten EVM-Chains und zeigt die Vorher/Nachher-Zahl direkt unter „Bereit – …“ an. Keine Änderung an Bestands-/Preislogik.
• Phase 6.82: 31.12.-Performance nach Realtest 6.81: Neue Tabellen historical_token_balance_cache und historical_token_candidate_cache speichern exakte historische Wallet/Chain/Asset/Block-Ergebnisse userbezogen. taxEvmChain lädt je Chain/Block die Cachezeilen gesammelt, schreibt neue Ergebnisse gebündelt und zeigt Treffer/Neu im Coverage-Status. Wallet-/Gesamtdatenlöschung bereinigt diese technischen Caches mit. Migration 078 erforderlich.
• Phase 6.83: 31.12.-Performance nach PASS des normalen Snapshot-Loaders: Der bewusste „Exakten Stichtagsbestand ermitteln“-Lauf bündelt nun lp_history_events pro Projekt/Chain für alle Wallets (loadHistoryBatch) statt je Wallet einzeln. Historische Stichtagsblöcke, V2-Pair-Auflösung, Direct-V2-Preise, LP-Bewertungen, Pair-State und Apertum-LP-Eventstate werden pro exaktem Block memoisiert und walletübergreifend wiederverwendet. Keine fachliche Änderung an Beständen oder Preisen.
• Phase 6.84: 31.12.-Darstellung: Wallet-Adressen werden in der Browserliste kompakt dargestellt und bleiben kopierbar. Einzelpreise in USD/CHF verwenden dynamische Nachkommastellen nach Größenordnung (max. 8), damit sehr kleine Tokenpreise nicht als 0.00 erscheinen; Positionswerte, Subtotale und Gesamtwerte bleiben auf 2 Dezimalstellen. PDF verwendet dieselbe dynamische Preisformatierung.
• Phase 6.86: 31.12.-Performance: Bei einem neuen spaeteren Stichtag wird pro Wallet/Chain der naechste aeltere historische Kandidaten-Cache verwendet. Es werden nur ERC-20-Transfers zwischen altem und neuem Stichtagsblock gelesen; Token ohne Aktivitaet uebernehmen ihren bereits exakt gespeicherten historischen Balancewert. Dadurch sinken neue, benachbarte Stichtagsberechnungen ohne Schaetzung; Fallback bleibt der vollstaendige verifizierte Pfad. Keine neue Migration.
• Phase 6.85: 31.12.-Korrektur/Performance: CHF (ESTV) ist nur fuer echte 31.12.-Stichtage waehlbar. Fehlt der offizielle USD/CHF-ESTV-Jahreskurs, wird die Berechnung mit klarer Meldung blockiert statt leere/0-Preise zu erzeugen. Exakte EVM-Stichtagsbloecke werden neu in historical_tax_chain_context_cache pro User+Chain+Epoch persistent gespeichert und beim Recompute gebuendelt vorgeladen; nach Hard-Reload entfaellt damit die teure Archive-RPC-Binaersuche je Chain. Migration 079 erforderlich.
• Phase 6.80: Zweiter 31.12.-Performance-Schritt nach Realtest mit noch 807 Requests: Die globale verifizierte Tokenliste wird nicht mehr gegen jede Wallet vollständig abgefragt. Pro Wallet/Chain wird einmal die historische ERC-20-Transfer-Evidenz bis zum exakten Stichtagsblock geladen und mit der Safe-/Predefined-Liste geschnitten; nur tatsächlich berührte Token erhalten tokenbalancehistory/balanceOf. Verifizierte LP-/Staking-Paare werden unabhängig davon ergänzt. Kandidaten und exakte historische Tokenbalances werden für denselben Stichtagsblock sessionweit memoisiert. Bei Ausfall der Kandidatenquelle gilt Korrektheit vor Performance und die vollständige verifizierte Liste wird als Fallback geprüft.
• Phase 6.78: Generische LP-/Staking-Discovery ist nicht mehr an TLN/VOW oder DAO1 gebunden. On-chain erkannte V2-LPs werden global als pending registriert; Admins verifizieren/ignorieren Pair und mögliche Staking-Ziele und können optional ein DeFi-Projekt zuordnen. Nur verifizierte Staking-Ziele dürfen gebundenen LP-Principal als Vermögen liefern. Projektlose LPs bleiben vollständig zulässig. DAO1-Staking: code-seitig verifiziert, reale Regression weiterhin offen.
• Phase 6.73: Doppelte Datenstatus-/Preisstand-Zeilen im Wallet-Bestand entfernt. „Datenaktualisierung“ wurde in den globalen Statusrahmen bei Wallet-Ansicht/Datenstatus/Preisstand verschoben; „Datenstand pro Wallet“ bleibt darin standardmäßig eingeklappt und wird als sekundäre graue Statusinformation dargestellt.
• Phase 6.72: DeFi-Projekte ist kein eigener linker Hauptmenüpunkt mehr. Der Dashboard-Tab verwendet wieder die bestehende Projekt-Navigation: TLN/VOW und DAO1 werden dort nach derselben Sichtbarkeitslogik wie zuvor angeboten; die Detailbereiche bleiben unverändert. Kein separater/zweiter Projekt-Renderer.
• Phase 6.71: DeFi-Projekte wurde aus dem linken Hauptmenü ins Dashboard verschoben; der zunächst verwendete neutrale Platzhalter wurde in 6.72 wieder durch die bestehende Projekt-Navigation ersetzt. Preisquellen-Audit: der aktuelle 15-Minuten-Preisjob ist bereits global per Slot-Lock dedupliziert; CoinGecko wird nur an einer Current-Price-Stelle und separat in der manuellen 31.12.-Historie aufgerufen. Der gemessene /simple/price-Request liegt mit deutlich weniger als dem dokumentierten 515-ID-Limit nicht an einer zu grossen ID-Liste. 401/403/429 pausieren CoinGecko nun im Browser statt Folge-Requests zu erzeugen; der letzte gueltige Snapshot bleibt aktiv und GeckoTerminal/Apertum/TLN-VOW koennen weiter aktualisieren. ERLEDIGT 6.75: Current- und History-CoinGecko-Zugriffe laufen über die authentifizierte Supabase Edge Function coingecko-proxy; x-cg-demo-api-key kommt ausschließlich aus COINGECKO_DEMO_API_KEY. Kein CoinGecko-Key im Browser oder in public-Tabellen.
• Phase 6.70: PDF der Bestandesaufnahme per 31.12. zeigt standardmäßig nur steuerrelevante Summary-Inhalte. Interne Prüfdetails (Wallet-Anzahl, verifizierte Positionen, historisch bewertet) sind über „Prüfdetails im PDF anzeigen“ optional; Gesamtwert und Chain-Summary bleiben immer sichtbar.
• Phase 6.67: Bestandesaufnahme per 31.12. verwendet in Browser, Excel und PDF dieselbe zentrale Token-Metadatenauflösung. Auch alte Snapshots mit adressartigem Symbol werden zur Anzeige gegen aktuelle Stammdaten aufgelöst; VOW erscheint dadurch als VOW. Browser/PDF zeigen Contract-Adressen nur sekundär und gekürzt, Excel behält die volle Contract-Adresse in der strukturierten Contract-Spalte. PDF-Summary nutzt feste Spalten und kontrollierten Umbruch statt überlappender Langtexte.
• Dashboard-Project-Summary wird userbezogen lokal als schneller Anzeige-Cache persistiert. Phase 5.84 lädt die TLN/VOW-Reward-Summary bereits beim App-Start cache-only aus den persistenten Discovery-Snapshots; ein Öffnen des Referral-Tabs ist dafür nicht mehr nötig. Projekt-Summaries verwenden summary_decimals aus predefined_tokens. DAO1 besitzt in der Projekt-Übersicht eigene Summary-Kacheln für Wallets, Bots, DIDs/Membership, Bot-Claims, Referral-Rewards und Team-Partner. Bot-Summen verwenden den eindeutigen aktuellen NFT-Bestand; historische/Transfer-Zuordnungen werden nicht doppelt als Bestand gezählt. Fachliche Projektcaches bleiben die Wahrheit. TLN-Teamansicht schreibt Teampartner + aktiv aus demselben verifizierten Forest/Lifecycle in die Dashboard-Summary; unverifizierte Lifecycles werden nicht als inaktiv gezählt.
• Nächste fachliche Ausbaustufe: Reward-Summaries und DAO1 aktiv/Team aus ihren bestehenden persistenten Projektcaches an dieselbe Summary-Bridge anschließen – ohne zweite Discovery-Logik.
• Projektkarten breiter; Token in allen Projektkarten einheitlich zweispaltig, responsiv einspaltig.`
  },
  {
    status: "in_progress",
    category: "Wallets / Filter",
    priority: "high",
    title: "Wallet-Besitzer und zentraler Personenfilter",
    desc: `Jede Wallet wird entweder als „Eigenes Wallet“ markiert oder einer benannten Person zugeordnet. Besitzername wird wie die Walletdaten serverseitig userbezogen verschlüsselt gespeichert. Der zentrale Filter bietet „Wallets aller Personen“, „Eigene Wallets“ und jede erfasste Person.

PHASE 5.25:
• Datenmodell, verschlüsselte Edge-Function-Felder, Wallet-Eingabe und zentraler Filter umgesetzt.
• Dashboard sowie allgemeine Token-Übersicht/Wallet-Auswahl verwenden den Filter ohne zusätzliche DB-Abfrage.
• Bestehende Discovery-/Refresh-Fachlogik arbeitet weiterhin mit allen gespeicherten Wallets und wird durch einen reinen Anzeigefilter nicht verändert.
• OFFEN: Filter schrittweise in Tax, Gebühren, NFTs, Approvals sowie die projektspezifischen Ergebnisansichten übernehmen; technische Scans dürfen dabei nicht unbeabsichtigt eingeschränkt werden.`
  },
  {
    status: "open",
    category: "Übersicht / Aktionen",
    priority: "high",
    title: "Aktionszentrale · Was muss ich tun?",
    desc: `Zentrale priorisierte Aufgabenliste mit Dringlichkeit, Fälligkeit, Projekt und Wallet: bald endendes Staking, fälliger Loan, verfügbarer Reward/Claim, Waiting-to-Swap, erkannte erforderliche Aktion, zu niedriger Gas-Token-Bestand sowie unvollständige/veraltete Positionsdaten. Handlungshinweise verständlich formulieren, aber nur auf fachlich/on-chain bestätigten Regeln aufbauen.`
  },
  {
    status: "open",
    category: "Übersicht / Analyse",
    priority: "high",
    title: "Gewinn-/Verlust- und Renditeauswertung ausbauen",
    desc: `Bestehende Idee „Gewinn/Verlust statt nur Bestand“ erweitern: Auswertung pro Projekt, Wallet, Token und Position. Ein-/Auszahlungen, Rewards, Claims, Gebühren und Gas sowie historische Kurse zum Transaktionszeitpunkt berücksichtigen. Realisierte und unrealisierte Ergebnisse trennen; Rendite absolut, prozentual und – fachlich sinnvoll – annualisiert. Fehlende Kurse und unsichere Rekonstruktionen klar kennzeichnen.`
  },
  {
    status: "open",
    category: "Datenqualität",
    priority: "high",
    title: "Datenqualität und Aktualitätsstatus",
    desc: `Vertrauensstatus je Auswertung/Position: vollständig on-chain bestätigt, teilweise rekonstruiert, historischer Preis fehlt, Historie noch nicht vollständig gescannt, Daten möglicherweise veraltet oder unbekannter/nicht klassifizierter Contract-/Eventtyp. Zusätzlich letzte Aktualisierung, verwendete Blockhöhe und offene Prüfschritte anzeigen.`
  },
  {
    status: "open",
    category: "Benachrichtigungen / Alerts",
    priority: "high",
    title: "Alerts · Regel-Editor und Zusammenfassungen",
    desc: `Die bestehende Idee „Benachrichtigungen / Alerts / Telegram“ um frei definierbare Regeln und Digests erweitern. Regeln u. a. für Kursgrenzen/-bewegungen, Portfolioänderungen, grosse Ein-/Ausgänge, neues Staking/Loan/Bot/NFT, Fälligkeiten, neue Claims/Rewards, Partner-/Statusänderungen, LP/QLP, Gasbestand sowie unbekannte Contracts/ungewöhnliche Transaktionen. Pro Regel Projekt/Wallet, Schwellenwert, Häufigkeit und Versandart. Versand als Sofortmeldung, Tages- oder Wochenzusammenfassung; gleichartige Events bündeln und bestätigte/erledigte Meldungen nicht unnötig wiederholen. Event-Erkennung und Versand bleiben getrennt.`
  },
  {
    status: "open",
    category: "Sicherheit",
    priority: "high",
    title: "Wallet-Sicherheitscenter",
    desc: `Grosse/ungewöhnliche ausgehende Transaktionen, neue unbekannte Contract-Interaktionen und verdächtige Tokenbewegungen erkennen. Tokenfreigaben/Allowances analysieren und hohe/riskante Freigaben hervorheben. Unerwartete Bestandsänderungen beobachteter Wallets melden. Contracts userbezogen als bekannt, geprüft, unbekannt oder ignoriert klassifizieren.`
  },
  {
    status: "open",
    category: "Historie / Analyse",
    priority: "medium",
    title: "Portfolio-Zeitreise",
    desc: `Beliebigen historischen Stichtag rekonstruieren: damalige Bestände, Portfoliowert, aktive Stakings, Loans, NFTs, Teamgrösse und kumulierte Rewards. Zwei Stichtage direkt vergleichen. Fehlende historische Kurse und unvollständige Scans sichtbar ausweisen.`
  },
  {
    status: "open",
    category: "Planung / Analyse",
    priority: "medium",
    title: "Szenario- und Ertragsrechner",
    desc: `Auswirkungen veränderter Tokenkurse simulieren, erwarteten Wert/Ertrag bei regulärem Staking-Ende darstellen, Reinvestition vs. Auszahlung vergleichen sowie zukünftige Cashflows/Fälligkeiten zeigen. Kritische Positionen bei definierten Kurswerten hervorheben. Annahmen strikt von on-chain bestätigten Fakten trennen.`
  },
  {
    status: "open",
    category: "Aktivität",
    priority: "medium",
    title: "Persönlicher Aktivitätsfeed",
    desc: `Relevante Ereignisse der eigenen Wallets chronologisch und verständlich anzeigen; Filter nach Projekt, Wallet, Ereignistyp und Zeitraum. Zusammengehörige technische Blockchain-Events zu einem fachlichen Vorgang bündeln.`
  },
  {
    status: "open",
    category: "Team / Partner",
    priority: "medium",
    title: "Team-Aktivitätsfeed und Team-Kennzahlen",
    desc: `PROJEKTGETRENNT für TLN/VOW bzw. DAO1/APTM: chronologische Team-Ereignisse wie neuer Partner, Mitgliedschaft/Status, Bot-Kauf, Staking Start/Aufstockung/Ende, Claim und LP/QLP-Änderung. Kennzahlen: aktive/inaktive Partner, neue Partner nach Zeitraum/Ebene, Teamgrössenentwicklung, Mitglieder-/Bot-/Staking-Verteilung, Partner ohne erkennbare Aktivität seit X Tagen und Zeitvergleiche. Definition „aktiv“ je Projekt separat fachlich festlegen.`
  },
  {
    status: "open",
    category: "Team / Partner",
    priority: "medium",
    title: "Verschlüsselte Partnernotizen, Tags und Gruppen",
    desc: `Projektbezogene verschlüsselte Notizen, Tags und frei definierbare Gruppen/Filter, z. B. Kunde, Interessent, Support nötig, Nachfassen. STRIKTE TRENNUNG: keine gemeinsame oder gegenseitig verwendete Partneridentität zwischen TLN/VOW und DAO1/APTM.`
  },
  {
    status: "open",
    category: "Wallets / Rollen",
    priority: "medium",
    title: "Watch-only-Wallets und Rollen",
    desc: `Wallets beobachten, ohne sie als eigene Wallet zu behandeln, z. B. Familie, Kunden, Teammitglieder, Projekt-/Treasury-Wallets. Klare Kennzeichnung und getrennte Auswertungen. Später optional Rollen und eingeschränkte Zugriffe für Berater/Kunden.`
  },
  {
    status: "open",
    category: "Export / Berichte",
    priority: "medium",
    title: "Steuer- und Transaktionsexport ausbauen",
    desc: `Bestehenden CSV-Export zu einem Export für CSV und Excel, später optional PDF-Bericht, ausbauen. Käufe, Verkäufe, Transfers, Rewards, Claims, historische Kurse, Gasgebühren und Jahresendbestände; Auswahl nach Jahr, Projekt, Wallet und Transaktionstyp. Datenbasis für Steuer/Buchhaltung liefern, ohne verbindliche steuerliche Beurteilung.`
  },
  {
    status: "open",
    category: "Export / Berichte",
    priority: "low",
    title: "Berichte und teilbare Ansichten",
    desc: `Monats-, Quartals- und Jahresberichte; optionales Branding. Schreibgeschützter Link mit Ablaufdatum, sensible Werte/Bereiche gezielt ausblendbar sowie anonymisierte Ansicht für Supportfälle.`
  },
  {
    status: "open",
    category: "Komfort / Erklärung",
    priority: "medium",
    title: "Transaktions-Erklärer",
    desc: `Technische Transaktionen automatisch in verständliche Alltagssprache übersetzen und zusammengehörige Blockchain-Events als einen fachlichen Vorgang erklären. Erklärungen bleiben projektspezifisch und dürfen ausschließlich bestätigte Regeln verwenden.`
  },
  {
    status: "open",
    category: "Komfort / Suche",
    priority: "medium",
    title: "Globale Suche",
    desc: `Suche über Wallet-Adresse, TLN-ID, NFT-/Bot-ID, Partneralias, Contract-Adresse und Transaktionshash mit direktem Sprung zur Position/Person/Transaktion. Projektherkunft eindeutig kennzeichnen; Zugriffsrechte und Verschlüsselung vollständig berücksichtigen. TLN- und DAO-Identitäten werden dabei nicht zusammengeführt.`
  },
  { status: "open", category: "UI / Navigation", title: "Navigation während initialem Datenladen entkoppeln", desc: "TODO 17.09.2026: Navigation ist während/kurz nach dem initialen Datenladen zeitlich noch nicht sauber entkoppelt. Ein im laufenden Load gewählter Bereich darf nach Abschluss eines Hintergrundjobs nicht durch einen älteren Render-/Restore-Schritt überschrieben werden. Navigation soll benutzbar bleiben; Datenjobs aktualisieren nur ihren Datenbereich im Hintergrund." },
  { status: "done", category: "DAO1", title: "DAO1 alter Team-Baum hierarchisch darstellen", desc: "Phase 4.73: Der verifizierte Legacy-DID→fid-Graph wird analog zum TLN/VOW-Team als hierarchischer Baum bis 20 Ebenen dargestellt. Eigene DIDs werden als Roots erkannt; eine eigene DID, die unter einer anderen eigenen DID liegt, wird bei Alle DIDs nicht doppelt als separater Root gerendert. Pro DID gibt es ein verschlüsselt gespeichertes Name/Alias-Feld. Zweige sind einklappbar; Mint-Nachweis in Details; technische Kantentabelle nur DEV/Diagnose." },
  { status: "done", title: "Projekt-Caches nur noch bewusst aktualisieren", desc: `Phase 2am: Die Liquidity-Pool-Tabs von DAO1 und TLN/VOW sind beim Öffnen vollständig cache-only.

• Button „Daten aktualisieren“ erscheint sofort.
• Beim Öffnen werden nur lp_position_cache und lp_history_events aus Supabase gelesen.
• Keine versteckte Blocksuche, pairInfo/getReserves/balanceOf- oder Preisabfrage.
• Erst „Daten aktualisieren“ liest Blockchain/Explorer und ersetzt danach den Positions-Cache.
• DAO1 → Transaktionen & Claims bleibt ebenfalls manuell über „Daten aktualisieren“.
• Dadurch entstehen beim Navigieren zwischen Projekt-Tabs keine unnötigen Blockchain-Scans.` },
  { status: "done", title: "Discovery-Metadaten + Solana-Default", desc: "Phase 2ag: Alle discovery_enabled Chains sind beim Öffnen standardmäßig aktiviert, inklusive Solana. Historisch gefundene EVM-/Apertum-Token laden Symbol, Name und Decimals direkt vom Contract und cachen die Metadaten lokal." },
  { status: "done", title: "Apertum Kurse vollständig on-chain", desc: `Phase 2al: Im Tab Vordefinierte Token gilt für die komplette Apertum-Chain ausschließlich On-Chain-Bewertung; die Preisermittlung verwendet dieselbe wAPTM/wUSDT-Referenz wie DAO1 und erkennt Wrapped-Tokens auch dann korrekt, wenn in predefined_tokens nur das Label statt eines separaten symbol-Felds gepflegt ist.

• Nativer APTM wird 1:1 über wAPTM/wUSDT bewertet.
• wUSDT/wUSDC werden als 1 USD behandelt.
• Weitere Token nutzen direkt TOKEN/wUSDT oder TOKEN/wAPTM → wUSDT.
• archive_rpc_url ist optional; falls leer, wird wie im DB-Schema vorgesehen rpc_url verwendet.
• CoinGecko/GeckoTerminal werden für Apertum nicht als Fallback verwendet.` },
  { status: "in_progress", title: "TLN/VOW Liquidity Pools nach Chain getrennt", desc: `BSC/PCLP ist funktional integriert und wird aktuell inklusive Historie und Staking weiter gehärtet. Ethereum (ETH/LP) ist funktional noch nicht vollständig umgesetzt und bleibt ausdrücklich OFFEN.

Ziel: ETH-Liquidity-Pools analog zu BSC vollständig integrieren – LP-Erkennung, aktuelle Positionen, historische Werte und Cache. Die sichtbare ETH-Unterseite allein gilt nicht als erledigte ETH-Integration.` },
  { status: "done", title: "LP/PCLP-Historie und Positionen persistent cachen", desc: "Phase 2af speichert Add/Remove, LP-Delta, laufenden LP-Saldo, Underlyings und historische USD-Werte in lp_history_events. Seit Phase 2am speichert lp_position_cache zusätzlich den zuletzt bewusst aktualisierten aktuellen LP/PCLP-Bestand inklusive Underlyings, Pool-Anteil, USD-Wert und 31.12.-Vergleichsstand. Beim Öffnen der Projekt-Tabs werden ausschließlich diese Supabase-Caches gelesen." },
  {
    status: "in_progress",
    title: "Konfiguration aus HTML nach Supabase verlagern",
    desc: "Umbau gestartet 26.08.2026. HAUPTTEIL ERLEDIGT, ABER NACH AUDIT NOCH NICHT GANZ ABSCHLIESSEN: public.chains ist Single Source of Truth für Chain-Stammdaten sowie Balance-, Gebühren-, Discovery-, Approval- und NFT-Provider/API-Konfiguration. Seit Phase 5.82 liegt auch der lokale Chain-Logo-Pfad in public.chains.icon_path; Admin kann ihn in Chains pflegen, und neue Chains benötigen für das Logo keine UI-Hardcodierung mehr. predefined_tokens enthält Token-Metadaten und Preis-Zuordnung. loadAll() ist dynamisch; die früheren Chain-Maps für Fees/RPC/Alchemy/GoPlus sind entfernt. AUDIT 26.08.2026: DeFi-/DEX-Struktur umgesetzt: TLN/VOW ist nun als erstes generisches DeFi-Projekt modelliert; VOW-Referenz-Contracts liegen in defi_project_tokens, PancakeSwap-/Uniswap-Factorys in dex_configs und RPCs werden aus public.chains wiederverwendet. Die bestehenden Werte werden durch das Migrations-SQL automatisch übernommen. Strenger Audit läuft weiter: Chain-Farben wurden aus CSS nach public.chains.display_color verschoben; Wallet-EVM-Hinweis und Custom-Token-Chain-Auswahl sind jetzt DB-dynamisch. Noch offen: Routescan-URL-Fallback entfernen, Tron-Decimallogik bereinigen und die TLN/VOW-Spezial-UI langfristig zur generischen DeFi-Projektansicht machen. SOLANA-ABDECKUNG: Entdecken ist jetzt ohne Alchemy über getTokenAccountsByOwner umgesetzt; klassisches SPL Token Program und Token-2022 werden berücksichtigt. Der normale Solana-Wallet-Load liefert dabei auch die Tokenbestände, sodass als sicher hinzugefügte Solana-Mints im Wallet-Tracking nutzbar sind. Globale App-/Service-Konfigurationen wie Supabase-Projekt, CoinGecko/GeckoTerminal/GoPlus, CDN-URLs, revoke.cash und IPFS-Gateway sind keine Chain-Stammdaten und müssen nicht zwingend in public.chains. Credentials/Keys (Alchemy, PublicNode, NodeReal) gehören ausdrücklich NICHT in eine normale öffentliche DB-Tabelle."
  },
  {
    status: "in_progress",
    title: "Hardcoding-Audit / Restbereinigung",
    desc: "Audit gestartet 26.08.2026. PRIORITÄT A – umgesetzt: generische Tabellen defi_projects, defi_project_tokens und dex_configs; TLN/VOW/VOW-Referenzen und PancakeSwap-/Uniswap-Factorys werden per Migration übernommen, RPCs kommen aus CHAIN_CONFIG. Admin-Masken DeFi-Projekte und DEX sind vorhanden. Routescan-Funktion hat noch einen hartcodierten API-URL-Fallback; entfernen, sodass fehlendes fee_api_base als Konfigurationsfehler sichtbar wird. PRIORITÄT B – fachlich prüfen: TRON_TOKEN_DECIMALS_DEFAULT=6 wird aktuell pauschal auf TRC20 angewendet; besser decimals aus predefined_tokens/Token-Metadaten verwenden. NodeReal-BSC-URL enthält den Key direkt; PublicNode- und Alchemy-Keys stehen ebenfalls im Frontend. Das ist derzeit bewusst so, sollte bei späterer Secret-/Proxy-Lösung separat behandelt werden und NICHT in public.chains landen. PRIORITÄT C – bewusst im HTML belassen: Supabase-App-URL/Publishable-Key, CDN-Bibliotheken, globale CoinGecko-/GeckoTerminal-/GoPlus-Endpunkte, revoke.cash-Link, IPFS-Gateway, Redirect-URL sowie UI-spezifische Spenden-Auswahl. NÄCHSTE SCHRITTE: (1) DEX/TLN-VOW-Infrastruktur-Tabelle definieren; (2) TLN/VOW-Modul auf CHAIN_CONFIG + neue Tabelle umstellen; (3) Routescan-Fallback entfernen; (4) Tron-Decimallogik korrigieren; (5) danach erneut automatisierten URL/Contract-/Chain-Literal-Scan durchführen und diesen Punkt auf DONE setzen."
  },
  {
    status: "in_progress",
    title: "Chat-Benachrichtigungen",
    desc: "Umgesetzt im Frontend/DB-Modell: read_at für Nachrichten, Ungelesen-Badge für User und Admin, ungelesene Anzahl je User in der Admin-Konversationsauswahl und serverseitige E-Mail-Sperrlogik. Regel: erste neue Nachricht löst eine E-Mail aus; weitere Nachrichten derselben Seite lösen keine weitere Mail aus, bis der Empfänger geantwortet hat. Danach ist die nächste neue Nachricht wieder mailberechtigt. E-Mail enthält keinen Nachrichtentext, aber den direkten Link https://www.letsgofree.me/wallet-tracking. Für den tatsächlichen Versand wird die Supabase Edge Function chat-notify mit einem serverseitigen Resend-Key verwendet; RESEND_API_KEY und CHAT_FROM_EMAIL müssen als Supabase Secrets gesetzt werden."
  },
  {
    status: "open",
    title: "Alchemy vollständig auf öffentliche Datenquellen reduzieren",
    desc: "ZIEL: Alchemy nur noch als optionalen Fallback verwenden oder ganz entfernen, ohne Funktionen oder Datenqualität zu verlieren. Gebühren sind bereits ohne Alchemy umgesetzt. Verbleibende Alchemy-Nutzung betrifft vor allem manuelle Spezialfunktionen wie Entdecken/Token-Discovery, Approvals auf einzelnen EVM-Chains und NFTs. VORGEHEN PRO FUNKTION UND CHAIN: (1) aktuellen Alchemy-Aufruf und benötigte Daten exakt inventarisieren; (2) Blockscout API v2, Routescan, öffentliche RPCs und ggf. weitere kostenlose Explorer/API-Angebote praktisch testen; (3) bei Historien immer Pagination, alte/große Wallets, Rate-Limits, CORS und Vollständigkeit prüfen – ein grundsätzlich antwortender Endpoint reicht nicht; (4) Approvals bevorzugt aus Explorer-Transaktionen/Logs ermitteln und den heutigen allowance(owner,spender) per öffentlichem RPC verifizieren, wie bereits für Apertum umgesetzt; (5) Token-Discovery über Explorer-Tokenlisten/Transfers statt alchemy_getAssetTransfers prüfen; (6) NFTs über Blockscout/Routescan bzw. geeignete kostenlose Indexer prüfen, inklusive ERC-721/ERC-1155, Metadaten, Pagination und Spam-Erkennung; (7) Provider-Auswahl weiterhin ausschließlich über public.chains steuern, keine neuen Chain-URL-Maps im HTML; (8) Alchemy erst pro Chain/Funktion deaktivieren, wenn die Alternative mit realen Wallets validiert ist. ERFOLGSKRITERIUM: normale Wallet-Bestände und Gebühren bleiben Alchemy-frei; Discovery/Approvals/NFT möglichst ebenfalls öffentlich, Alchemy höchstens Fallback. Bereits bekannte Ausgangslage: Gebühren ETH/Avalanche Routescan, BSC NodeReal, Polygon/Arbitrum/Base Blockscout; Apertum-Approvals Blockscout + RPC allowance. Die frühere Gebühren-Recherche hat außerdem gezeigt, dass große/alte Wallets und vollständige Pagination ausdrücklich Teil der Validierung sein müssen."
  },
  { status: "done", title: "Bestandesaufnahme per 31.12", desc: "Exakte historische Stichtagsbestände mit persistentem Supabase-Snapshot, Preis-Refresh, Excel/PDF, Chain-Coverage und PDF-Summary nach Chain. EVM/BTC/XRP/Solana sind historisch angebunden; Tron/Akash bleiben bis zu einer belastbaren exakten historischen Quelle ausdrücklich als nicht unterstützt markiert." },
  { status: "done", title: "Stablecoin-Stammdaten · Base / Solana / Avalanche", desc: "Phase 7.11: Migration 082 ergänzt native Circle-USDC auf Base, Solana und Avalanche sowie offizielles Tether-USDT auf Solana und Avalanche. EVM-Chains werden über Chain-ID und Solana über die zentrale Chain-Konfiguration aufgelöst; interne Chain-Keys werden nicht umbenannt. Der Chain-Filter der vordefinierten Token zeigt dieselben zentralen Anzeigenamen wie die Admin-Auswahl." },
  { status: "done", title: "Polygon Stablecoins · Symbol + technische Decimals", desc: "Phase 7.14 / Migration 083: nativer Circle-USDC 0x3c499c…3359 und Polygon-USDT 0xc2132d…58e8f werden in predefined_tokens mit echtem Symbol/Name und 6 technischen Decimals vervollständigt. Die Stammdatentabelle zeigt Symbol separat direkt nach Chain." },
  { status: "done", title: "Discovery · Tokenname + Identitäts-Imitation", desc: "Phase 7.12: Discovery zeigt den on-chain/API-gelesenen Token-Namen separat zum Symbol. Stimmen Symbol oder Name mit einem sicheren vordefinierten Token derselben Chain überein, die Contract-/Mint-Adresse aber nicht, wird dies als Spam-Verdacht ausgewiesen. Phase 7.14: ältere sichere Stammdaten mit tickerartigem Label (z. B. USDC) dienen als Symbol-Fallback; die Chain-Auswahl filtert zusätzlich die gespeicherte Ergebnisliste und deren Zähler ohne neuen Scan. Phase 7.15: Discovery-Chain-Aliase werden gegen den internen Stammdaten-Key normalisiert (z. B. polygon/pol/polygon-pos → matic), sodass Imitationen chain-sicher erkannt werden. Die Adresse bleibt das entscheidende Echtheitsmerkmal." },
  { status: "open", title: "XRPL Issued Currencies / USDC", desc: "XRPL unterstützt neben nativem XRP auch issued currencies über Currency Code + Issuer/Trustlines. Circle-USDC soll erst als vordefinierter Token ergänzt werden, wenn WalletTracking diese XRPL-Trustlines fachlich korrekt laden, identifizieren und historisch auswerten kann; ein bloßer predefined_tokens-Eintrag ohne Balance-Support wäre irreführend." },
  { status: "open", title: "Gewinn/Verlust statt nur Bestand", desc: "Einstandspreis-Feld bzw. Transaktions-/Kostenbasis-Konzept definieren, um Performance (Plus/Minus, %) statt nur heutigen Bestand zu zeigen." },
  { status: "in_progress", title: "Staking-Anzeige / gestakte LP-Positionen", desc: "Phase 6.78: generisches Modell umgesetzt. V2-LP-Pairs werden projektübergreifend erkannt und in einer globalen Registry administrativ verifiziert; mögliche Staking-Ziele werden aus ausgehenden LP-Transfers als Kandidaten erkannt und zählen erst nach Admin-Verifikation. Verifizierte projektlose LP-Stakings werden in Current Wealth und 31.12. berücksichtigt. Offen: reale Regression mit einem externen DAO1-/projektlosen Staking-Beispiel sowie weitere Nicht-V2-/MasterChef-Sonderfälle." },
  { status: "in_progress", title: "TLN/VOW- und v-Währungs-Preislogik", desc: "Phase 6.94: Livepreis-Architektur vereinheitlicht. TLN/VOW/WalletPriceEngine ist die einzige On-Chain-Preisquelle; der zuvor nachgelagerte zweite Ethereum-vCurrency-RPC-Durchlauf in app.js wird nicht mehr ausgeführt. v-Währungen verwenden eine chain-spezifische Fachregel: auf BSC strikt Voucher→VOW→USDT; auf Ethereum reale direkte USDT/USDC-V2-Pools zusätzlich zu Voucher→VOW→USDT. Messbare V2-Routen unter 100 USD Pfadliquidität werden als Dust verworfen, damit z. B. ein nahezu leerer v$/USDC-Pool keinen Fantasiepreis erzeugt. Ethereum durchsucht weiterhin alle aktiven V2-Factorys plus offizielle Uniswap-V2-Factory. OFFEN/REALTEST: v$ muss statt Dust-Preis korrekt ohne Kurs erscheinen, sofern keine ausreichend liquide Route existiert; neue Ethereum-v£/v€ bleiben ohne Kurs, solange kein ausreichend liquider realer Markt gefunden wird. Phase 6.95: bekannte Token-Metadaten direkt aus predefined_tokens und aktuelle Pair-Reads per JSON-RPC-Batch. REALTEST 6.95: 197 Browser-Requests, damit Regression gegenüber 6.94 (144) und nicht akzeptiert. Phase 6.96: alle für konfigurierte Projekt-/Voucher-Tokens vorhersehbaren V2-getPair-Kombinationen werden je Chain vor dem Preisbau gesammelt und in wenigen JSON-RPC-Batches gegen alle aktiven V2-Factorys abgefragt; auch negative Pair-Ergebnisse werden gecacht. Identische Lazy-Lookups teilen zusätzlich einen In-Flight-Cache. REALTEST 6.96: zweiter manueller Lauf 161 Browser-Requests; RPC-Diagnose 219 eth_calls, 45 getPair-Calls, 39 HTTP-Batches, 2 Pair-Discovery-Batches und 29 Pair-States. Die 219 Calls entsprechen exakt 45 getPair + 29 × 6 Standard-Pair-Reads; Pair-Discovery ist damit nicht mehr der Haupttreiber. Phase 6.97 ergänzt Methodencounter für getReserves/token0/token1/totalSupply/decimals/factory usw. REALTEST 6.97: isolierter manueller Preisrefresh = 192 Browser-Requests; 219 eth_calls = getPair 45 sowie je 29 decimals/factory/getReserves/token0/token1/totalSupply. Phase 6.98 optimiert deshalb bewusst nur den Transport: konfigurierte Pooltypen und V2-Pair-States werden chainweit vorab gebatcht und in denselben PriceEngine-Cache gelegt. Es werden weiterhin exakt dieselben sechs V2-Felder am selben Block gelesen und durch dieselbe Dekodierung/Preisformel verarbeitet; bei Batchfehler bleibt der bisherige Lazy-Reader als Fallback aktiv. Preislogik/LP-Bewertung/Dust-Grenze sind unverändert. REALTEST 6.98: 130 isolierte Browser-Requests; 236 eth_calls = getPair 45, getReserves/token0/token1/totalSupply/decimals je 29 sowie factory 46; 24 HTTP-Batches. Die 17 zusätzlichen factory()-Reads stammen aus der Pooltyp-Vorprüfung plus erneutem Full-Pair-State. Phase 6.99 trennt deshalb strikt Preis-Pair-State (token0/token1/getReserves) von LP-Zusatzdaten (totalSupply/decimals); konfigurierte V2-Pool-Factorys werden aus der bereits erfolgten Typprüfung in die PriceEngine übernommen und nicht nochmals gelesen. Alle fachlichen Preisfunktionen und LP-Formeln wurden vor Release per Paritätsvergleich gegen 6.98 geprüft; geändert wird nur, welche bereits benötigten Daten für welchen Consumer geladen werden. REALTEST 6.99: 163 isolierte Browser-Requests; PriceEngine selbst verbessert auf 181 eth_calls (getPair 45, getReserves/token0/token1 je 29, factory 17, decimals/totalSupply je 16), aber Browser-Requestzahl blieb hoch. Phase 7.00 instrumentiert deshalb den gesamten runGlobalPriceRefresh über den bestehenden zentralen Request-Audit getrennt nach generalPrices, tlnVowPriceEngine, saveGlobalSnapshot, rerenderViews und feeViews; je Phase werden Laufzeit, abgeschlossene Fetch-Requests, Request-Typen, Top-Ressourcen und Top-Aufrufer protokolliert. Zusätzlich wurde der bisher doppelte refreshFeePriceViews-Aufruf entfernt: loadNativePrices startet ihn nicht mehr fire-and-forget, der zentrale Preisjob führt ihn genau einmal kontrolliert nach Snapshot/Rerender aus. Die Preisermittlung selbst bleibt unverändert. REALTEST 7.00: 150 dem Preisjob zugeordnete Requests in 19.4 s; generalPrices 53 Requests / 12.1 s (Top-Ressource rpc.apertum.io), tlnVowPriceEngine 95 Requests / 7.1 s (Top-Ressource BSC PublicNode), saveGlobalSnapshot 1, rerenderViews 0, feeViews 1. Damit sind 148/150 Requests auf genau zwei Hotspots eingegrenzt. Phase 7.01 zerlegt deshalb generalPrices zusätzlich in CoinGecko-Hauptabfrage, GeckoTerminal, Apertum-DEX, CoinGecko-Contract-Fallback und eigene LP-Bewertung. TLN/VOW protokolliert parallel jede bestehende Refresh-Stufe (Infrastructure, Pooltypen, konfigurierte Pair-States, Referenzen, Pair-Discovery, entdeckte Pair-States, Preisbau, Snapshot) sowie RPC-Zähler getrennt nach BSC/ETH. Keine Preisroute, Reserveberechnung, Dust-Grenze oder LP-Formel wird in 7.01 verändert. REALTEST 7.01: 154 Browser-Requests; Generalpreise 53 Requests, davon Apertum-DEX 50 in 10.9 s (CoinGecko 1, GeckoTerminal 2); TLN/VOW 95 Requests, davon Referenzauflösung 65 in 6.0 s, während Pair-Discovery nur 2 Requests und konfigurierte Pair-States 4 Requests benötigen. Phase 7.02 optimiert deshalb genau diese zwei belegten Hotspots: Apertum sammelt dieselben Token/wUSDT- und Token/wAPTM-getPair-Abfragen und dieselben token0/getReserves-Reads in JSON-RPC-Batches; die bestehende direkte-vs.-wAPTM-Routenwahl samt Liquiditätsvergleich bleibt unverändert. TLN/VOW löst USDT/USDC/BUSD/WBNB/BTCB/WETH zuerst aus bereits gültigen Referenzen, predefined_tokens und den schon vorgeladenen PriceEngine-Pair-States; nur echte Lücken verwenden weiterhin den bisherigen On-Chain-LP-Scan. Bei Apertum-Batchfehler fällt der gesamte Schritt auf den unveränderten Einzel-RPC-Weg zurück. Phase 7.03 korrigiert ausdrücklich nur die seit 6.93 zu pauschale Voucher-Routingregel: BSC nutzt wieder ausschließlich Voucher→VOW→USDT; Ethereum behält seine abweichende direkte Stablecoin-/VOW-Marktlogik. Keine BSC-Referenztokens, Fallbacks, Reserveformeln, Dust-Grenzen oder LP-Formeln werden entfernt. Der globale Preis-Snapshot wird auf v4 invalidiert, damit kein alter BSC-Routenpreis aus demselben 15-Minuten-Slot übernommen wird. REALTEST 7.02/7.03 offen." },

  { status: "done", title: "Dashboard – Was muss ich tun?", desc: "Phase 7.22: Der Bestandsstatus unterscheidet jetzt zwischen einer frisch erfassten Wallet mit noch ausstehendem Bestandscheck und einem tatsächlich veralteten Bestandsstand. Gezählt werden nur Chains mit aktivem Balance-Provider; nach dem gezielten Wallet-Erstaufbau wird der Aktionsblock sofort neu bewertet, sodass eine erfolgreich geprüfte Wallet nicht bis zum Seitenrefresh als offen stehen bleibt. Phase 6.95: Aktionsbereich über die volle Dashboard-Breite direkt vor den aktuellen Kursen. Es werden ausschließlich echte offene Aktionen angezeigt; grüne OK-Zeilen wie ‚Bestandsstände aktuell‘ entfallen. TLN/VOW erscheint nur, wenn das Projekt im aktuellen Dashboard-Scope aktiv ist und tatsächlich eine abgelaufene Partner-Staking-Position Handlungsbedarf erzeugt. Bei 0 Aufgaben ist der Block standardmäßig zugeklappt und zeigt im Titel einen grünen Haken; bei Aufgaben aufgeklappt und zweispaltig." },
  { status: "done", category: "Security & Privacy", title: "Private Walletdaten & Partner-Aliase verschlüsseln", desc: "Umgesetzt: Konzept „Maximale Bequemlichkeit“ ohne Passwort/Recovery-Code für User. Private Walletdaten und Partner-Aliase werden userbezogen verschlüsselt gespeichert; Partnernamen liegen in user_team_aliases_private. Öffentlicher Supabase-Key allein reicht nicht zur Entschlüsselung." },
  {
    status: "open",
    title: "Automatische Snapshots: ereignisbasiert + monatlicher Hintergrund-Job",
    desc: `Keine 7-Tage-Regel.

Beim normalen Seitenaufruf soll ein automatischer Snapshot nur bei einer wirklich relevanten Bestands-/Wertänderung entstehen, z. B. neuer/entfernter Token oder deutliche Veränderung des Gesamtwerts. Die konkrete Schwelle wird vor Umsetzung festgelegt.

Zusätzlich soll ein monatlicher Hintergrund-Job serverseitig einen Monats-Snapshot erstellen, auch wenn der User die Seite in diesem Monat nicht öffnet. Ziel: einmal pro Monat ein verlässlicher Stand ohne Benutzeraktion.

Hinweis an den User:
• Bei ereignisbasiertem Snapshot direkt ein Popup mit Grund anzeigen.
• Bei einem durch den Hintergrund-Job erstellten Monats-Snapshot beim nächsten Login informieren, z. B. „Am 31.07.2026 wurde automatisch ein Monats-Snapshot erstellt.“

Der bestehende spezielle Bestand per 31.12. bleibt davon unabhängig.`
  },
  { status: "done", title: "Wachhalte-Mechanismus gegen Supabase-Inaktivitäts-Pause", desc: "GitHub Actions Workflow pingt Supabase regelmäßig extern an." },
  { status: "done", title: "Netzwerkgebühren ohne Alchemy", desc: "Gebührenprovider migriert: Ethereum Routescan, BSC NodeReal, Polygon/Arbitrum/Base Blockscout, Avalanche Routescan; Apertum/XRP/Solana über eigene kostenlose Quellen. Supabase-Cache + inkrementelle Aktualisierung; alle 30-Tage-Sperren gelten nur für Nicht-Admins. Historische USD-Bewertung bewusst als spätere Phase offen." },
  { status: "open", title: "Historischer USD-Wert der Netzwerkgebühren", desc: "Phase 2 der Gebührenanzeige. Native Gebühren sind vorhanden; gesucht wird noch eine praktikable historische Preisquelle über mehr als 365 Tage für ETH, BNB, POL, AVAX usw. CoinGecko Public API reicht dafür nicht." },
  { status: "done", title: "Token-Approval-Checker", desc: "Zeigt aktive/unlimitierte Freigaben; Revoke läuft extern über revoke.cash (bewusst rein lesend)." },
  { status: "done", title: "Portfolio-Allokation als Grafik", desc: "Kreisdiagramm nach Chain/Token, Total oder je Wallet." },
  { status: "open", title: "Token-Kursverlauf als Chart", desc: "Im Token-Summary pro Token ein kleines Grafik-Symbol ergänzen. Klick darauf öffnet einen Kursverlauf als Linienchart, z.B. 7 Tage / 30 Tage / 1 Jahr / Max. Für native Coins kann die historische Preisquelle über die CoinGecko-ID der Chain laufen; für ERC-20/BEP-20/etc. über die in predefined_tokens hinterlegte coingecko_id oder alternativ eine DEX-basierte Historie. Vor Umsetzung historische Datenquelle und Free-API-Limits prüfen: CoinGecko Public ist für ältere historische Daten aktuell begrenzt, daher ggf. zweite Quelle oder eigener täglicher Preis-Cache in Supabase. Ziel: Chart ohne erneute HTML-Anpassung für jeden Token, vollständig über die DB-Metadaten gesteuert." },
  { status: "done", title: "NFT-Anzeige", desc: "NFTs je Wallet/Chain inkl. Spam-Verdacht und Supabase-Cache. Phase 5.90: Der Apertum-Namensresolver prüft neben metadata.name auch Store-/Metadata-Attribute (z. B. Bot-Name/Model/Variant/Series) sowie vorhandene project_nfts-Bezeichnungen; der qualitativ bessere Name ersetzt generische MineBot-#-Fallbacks automatisch. Bestehende NFT-Caches werden über die Datenmigration einmalig erneut geprüft. Phase 5.88: Filter nach DID/MineBot/Hearts NFT/TradeBot; Ziel pro Bot ist Bild + echter DAO-Store-/Metadata-Name + NFT-ID, generische MineBot-#-Namen sind nur Fallback und dürfen später verbessert werden. Manueller Apertum-NFT-Refresh prüft danach gezielt offene Ownership-Lücken. APTMDAO-Identitäts-NFTs (u. a. #4533/#7315) zählen fachlich als DID. Phase 5.87: ältere Wallets werden gegen den zentralen Current-State abgeglichen und nur fehlende/invollständige project_nft_ownership-Historien nachgezogen. Phase 6.04: Beim Fresh-Build werden zusätzlich historische NFT-Kandidaten aus der Wallet-Transferhistorie bekannter DAO1/APTMDAO-Contracts ermittelt, sodass heute nicht mehr gehaltene NFTs ohne vorhandenen User-Ownership-Cache reproduzierbar aufgebaut werden können." },
  { status: "done", title: "Willkommen + Hilfe + Krypto-Unterstützung", desc: "Willkommensdialog für neue und bestehende User mit 'Nicht mehr anzeigen', aktualisierte Hilfe sowie Unterstützen-Dialog mit USDT/USDC auf Ethereum/BSC/Polygon und QR-Code." },
  { status: "done", title: "Akash Network", desc: "Akash-Wallet-Adresse, native AKT-Balance und aktueller AKT-Kurs integriert. Akash-Gebühren sind noch nicht Bestandteil des Gebührenmoduls." },
  { status: "done", title: "Token-Onboarding · Discovery nach neuer Wallet", desc: "Phase 6.69: Kein breiter Scam-Scan bei jedem Login. Stattdessen läuft genau nach dem Erfassen einer neuen Wallet einmalig eine walletbezogene Token-Discovery über die verfügbaren Discovery-Chains. Das Ergebnis wird persistent gespeichert. Das Dashboard zeigt unter „Was muss ich tun?“ offene Klassifizierungen (unbekannt / Spam-Verdacht / noch nicht geprüfte Wallet) und führt direkt zu „Meine Token → Entdecken & prüfen“. Der Hinweis verschwindet erst, wenn jeder gefundene Token als sicher oder Spam klassifiziert ist." },
  { status: "open", title: "CSV-Export der aktuellen Bestände", desc: "Export für eigene Excel-/Steuer-Auswertungen." },
  { status: "open", title: "Mehrsprachigkeit (DE/FR/IT/EN)", desc: "Für einen breiteren Nutzerkreis." },
  { status: "open", title: "Als installierbare Mobile-App (PWA)", desc: "Homescreen-Installation und app-artige Nutzung." }
  ,
  {
    status: "paused",
    category: "Projekt TLN/VOW",
    priority: "medium",
    title: "TLN/VOW Loans · Lifecycle vollständig on-chain",
    desc: `PAUSIERT 21.09.2026: Fachlich weiterhin offen, aber bewusst zurückgestellt, da die aktuellen Loans noch nicht kurzfristig fällig sind. Wieder aufnehmen, bevor Fälligkeiten/Swaps operativ relevant werden.

ZIEL / STAND: Die zentrale Loan-Engine wird von Discovery und Hauptseite gemeinsam verwendet; keine zweite fachliche Erkennungslogik anlegen. Die bekannten Event-Werte 0–5 und die vier echten Loan-Zinsmodelle 0–3 sind on-chain verifiziert.

VERIFIZIERTE ZINSREGELN:
• Event 0 · TLN Gold Booster ×4: 18 % bei Eröffnung vorausbezahlt; Repay = 100 % Principal. End-to-End-Beispiel #7281: 272 TLN GOLD Burn → 1'088 v$ Principal → 195.84 v$ Vorauszins → später 1'088 v$ Repay.
• Event 1 · TLN Plus 2x: 18 % bei Eröffnung vorausbezahlt; Repay = 100 % Principal. Beispiel #844: 1'000 TLN Burn → 2'000 v$ Principal → 360 v$ Vorauszins → später 2'000 v$ Repay.
• Event 2 · TLN Plus 0.25x: 18 % fällig bei Rückzahlung; Repay = 118 % Principal.
• Event 3 · TLN Gold Booster ×2: 18 % fällig bei Rückzahlung; Repay = 118 % Principal.
• Event 4 · TLN Gold Rebound: kein echter rückzahlbarer Loan; separat darstellen.
• Event 5 · TLN Gold Extended: keine normale Rückzahlung; gehört in Loans inkl. Extended, nicht in Rebound. Alt→Neu-Verknüpfung ist verifiziert und umgesetzt: Referenzfall #5722 (24.04.2025) → Extended #32646 (06.09.2026). Die Tabelle zeigt beim neuen Loan die ersetzte Position plus ursprüngliches Loan-Datum und beim alten Loan die neue Extended-Position plus Extended-Datum. FACHREGEL TLN GOLD EXTENDED / SECOND CHANCE KORRIGIERT: Der alte Loan ist verfallen; dessen Zins und Schuld werden NICHT übernommen. Typ 5 ist ein neuer eigenständiger Loan. Referenzfall #5722 → #32646: Bei #32646 sind 820 v$ als neuer Extended-Betrag erkannt; der neue Rückzahlungsbetrag und der eigene Zins bei Rückzahlung müssen für #32646 positionsbezogen on-chain ermittelt werden. Weder 820 × 18 % = 147.6 v$ berechnen noch die 180 v$ des Alt-Loans übernehmen. Die Alt→Neu-Verknüpfung bleibt ausschließlich als Historie erhalten.

OFFEN / NÄCHSTER SCHRITT: Lifecycle vollständig on-chain bestimmen:
• Status „Waiting to Swap“ / geswappt
• tatsächliches Swap-Datum v$ → VOW
• Ablauf-/Fälligkeitsdatum des Vertrags
• effektives Rückzahlungsdatum separat vom Ablaufdatum
• mögliche Karenzfrist verifizieren
• Rückzahlung/Abschluss positionsgenau zuordnen
• TLN Gold Extended: neuen Rückzahlungsbetrag und eigenen Zins der neuen Position on-chain ermitteln; keine Übernahme aus Alt-Loan und keine rechnerische Ableitung
  DEV-STAND: Contract-State-Reader ergänzt. Er liest den aktuellen Options-Proxy/Implementation-State ABI-unabhängig via eth_call und zeigt erfolgreiche Rohantworten für Position/Wallet. Nächster Kontrollfall: #32646; gesucht wird insbesondere ein positionsbezogener Rückzahlungs-/Debt-Wert. Eröffnungs-Logs enthalten 820 v$ und Typ 5, aber keinen belegten Rückzahlungsbetrag. FACHLICHE KLÄRUNG ZINS/RÜCKZAHLUNG TYP 5 bleibt ausdrücklich OFFEN; bis dahin keine Berechnung/Anzeige. NÄCHSTER TECHNISCHER PUNKT: Bedeutung des Positions-Statusfeldes verifizieren. Für #32646 liefert Getter 0xe4ba13c7 als letztes Feld den Rohwert 1. Neuer DEV-Vergleich liest denselben Getter über mehrere bekannte Positionen und stellt Rohwert vs. bekannten Lifecycle gegenüber; „Waiting to Swap“ erst nach eindeutiger Korrelation benennen. Korrektur nach Fachhinweis: aktuell sind sämtliche TLN Gold Extended UND TLN Gold Rebound Positionen Wait to Swap; der erste 40er-Test enthielt daher keine echte Gegenprobe. DEV-Vergleich erweitert: gemischte Gruppe erzwingt aktuelle Wait-to-Swap-Fälle plus ältere Nicht-Extended/Rebound-Kontrollfälle. Danach gezielte Kontrollgruppe ergänzt: ältere Loans mit positivem w5/w6-Struct-Kandidaten als Indiz für vorhandenes VOW-Collateral. SCOPE: Alte Original-Loans mit direkt eingebrachtem VOW-Collateral nicht weiter verfolgen; nur als historische Extended-Vorgänger behalten. TLN Gold: alle aktuellen Typen identifizieren. TLN+: nur 0.25 / x2 / ggf. x4. DEV-Matrix „Loan-Typen · On-Chain-Verifizierungsstand“ ergänzt. NÄCHSTER SCHRITT KORRIGIERT: Rebound/Extended haben aktuell noch keinen realen v$→VOW-Swap und werden für die Lifecycle-Verifikation vorerst zurückgestellt. Stattdessen globale öffentliche Referenz-Loans für TLN+ 0.25, TLN+ x2, TLN Gold x2 und TLN Gold x4 suchen; pro Typ möglichst einen bereits weiter fortgeschrittenen Struct-/Collateral-Fall auswählen. DEV-Werkzeug „Referenz-Loans global suchen“ ergänzt. Ergänzt um pro-Typ-Aktion „Besten Referenzfall untersuchen“ für TLN+ 0.25, TLN+ x2, TLN Gold x2 und TLN Gold x4; Auswahl priorisiert weiter fortgeschrittenen Struct-State und zeigt komplette Eröffnungs-/Struct-Rohdaten. Suchquelle verbessert: echte chainweite TLN+- und TLN-GOLD-Burn-Scans statt Repay-/eigene-Wallet-Bias. HISTORISCHE SUCHE 15.09.2026: Der Referenz-Scanner kann jetzt über einen Stichtag gezielt ältere Burns durchsuchen; Default 31.05.2026. Damit dominieren die jüngsten September-Wait-State-Loans nicht mehr die Kandidatenliste. Der Stichtag wird per Block-Timestamp auf den passenden BSC-Block aufgelöst. Fachregel: Alt→Neu bei Extended ist Eligibility/Second-Chance-Bezug; altes verfallenes VOW-Collateral wird nicht in den neuen Loan übertragen, sondern fällt bei Nicht-Rückzahlung an den Kreditgeber. Neues Extended-Collateral entsteht erst beim späteren v$→VOW-Swap.
  - DEV Repay-Verifier erweitert: Event-Wert 5 kann gezielt gesucht werden; keine 18-%-Annahme. Reale Typ-5-Repays zeigen Principal, tatsächlich bezahlte v$ und daraus die on-chain belegte Differenz/Zinsquote. Nächster Test: historische Typ-5-Repays suchen; bei keinem Treffer Scan bis 10’000 Repay-Txs erweitern.

  - PRÜFRESULTAT 15.09.2026: Die neuesten 10’000 globalen Repay-Transaktionen wurden vollständig geprüft. Gefunden wurden vier bekannte Event-Werte, aber kein Typ-5-Repay und kein unbekannter Typ. Zins/Rückzahlung für Extended bleiben deshalb offen. UMGESETZT: „Weitere 10’000 ältere Repays prüfen“ setzt blockgenau vor dem ältesten geprüften Block fort, ohne den fachlich analysierten Bereich nochmals auszuwerten; Batch, Blockbereich und kumulierte Anzahl werden angezeigt. Falls nach einem Seiten-Reload noch kein Cursor im Speicher liegt, ermittelt der Fortsetzungslauf zuerst nur den Block-Cursor der neuesten 10’000 und analysiert danach den älteren Batch. Für Branch-Prüfungen besitzt die Discovery-Testseite auf localhost zusätzlich eine eigene Supabase-Magic-Link-Anmeldung; auf produktiven Hosts bleibt sie verborgen. NÄCHSTE PRÜFUNG: Batch 2 (Repays 10’001–20’000) ausführen und Ergebnis dokumentieren. Bei einem Treffer Typ-5-Principal, tatsächliche Zahlung und Differenz positionsgenau übernehmen; bei keinem Treffer bleibt Zins/Rückzahlung offen und der nächste ältere Batch kann gestartet werden.

CASHFLOW-DARSTELLUNG:
• Brutto-v$ Mint / Option
• Netto-v$ ans Wallet
• Zinsbetrag + Zinsmodell
• Collateral-Quelle (eigene VOW / aus Mint gekauft)
• VOW Collateral + Collateral-Status
• Rückzahlung und Collateral-Rückgabe getrennt betrachten

CACHE-REGEL: Immutable Eröffnungsdaten persistent cachen. Veränderliche Lifecycle-Felder (Status, Waiting-to-Swap, Swap, Fälligkeit, Rückzahlung) bei jedem relevanten Refresh neu prüfen; Cache darf neue On-Chain-Informationen niemals verdecken.

TABELLENREGEL: Für die echten ursprünglichen Loan-Typen 0–3 den 18-%-Zins und zusätzlich „Zinsmodell“ (im Voraus bezahlt / fällig bei Rückzahlung) sowie Principal, Zinsbetrag und Rückzahlung gesamt getrennt darstellen. Bei TLN Gold Extended (Typ 5) weder Zins noch Schuld aus dem verfallenen Alt-Loan übernehmen und keinen Zins aus dem Extended-Principal berechnen. Rückzahlungsbetrag und eigener Extended-Zins ausschließlich positionsbezogen on-chain ermitteln. Nicht aus einem Repay von 100 % fälschlich „0 % Zins“ ableiten.\n\nUI-STAND: Hauptseite → TLN/VOW → Loans ist in die Unter-Tabs „Loans“ und „Rebounds“ getrennt. Beide Unter-Tabs verwenden den zentralen TLN/VOW-Wallet-Filter oben im Projektbereich; der frühere zweite Wallet-Filter im Loan-Filterblock wurde entfernt. Die übrigen gemeinsamen Filter und ein tabellarisches Summary im Header bleiben über beide Unter-Tabs sichtbar. Wallet-Adressen in der Loan-Tabelle werden kompakt (0x1234…abcd) gezeigt, vollständige Adresse per Tooltip. Tabellenregel zentral: numerische Werte inklusive zugehörigem Spaltentitel rechtsbündig; Text und Datum linksbündig.`
  },
  {
    status: "open",
    category: "Projekt TLN/VOW",
    priority: "high",
    title: "Unbekannte Loan-/Booster-Typen automatisch zur Prüfung melden",
    desc: `ZIEL: Neue Loan-/Booster-Varianten dürfen nie still fehlen. Die zentrale Loan-Engine muss unbekannte Event-Werte, neue Contract-/Event-Strukturen oder nicht passende Mengen-/Zinsmodelle erkennen.

VERHALTEN:
• Position trotzdem in der Übersicht anzeigen, auch wenn Angaben unvollständig sind.
• Status „zu prüfen“ setzen; niemals unbekannte Typen als bekannten Typ raten.
• relevante Rohdaten/Tx/Event-Contract/Log-Index für Diagnose speichern.
• Admin in der Anwendung informieren und E-Mail an Chris auslösen.
• identische unbekannte Varianten deduplizieren, damit keine Meldungsflut entsteht.
• nach gemeinsamer On-Chain-Verifikation den neuen Typ zentral registrieren; Discovery und Hauptseite übernehmen ihn automatisch.

ARCHITEKTUR: Keine typabhängige Parallel-Logik in Tabellen/UI. Typ/Klassifikation muss aus der zentralen Loan-Erkennung kommen.`
  },
  {
    status: "open",
    category: "Projekt TLN/VOW",
    priority: "medium",
    title: "TLN/VOW Ethereum-Historie 2023 ergänzen",
    desc: "Historische TLN/VOW-Stakings und Rewards aus der Ethereum-Phase vor BSC vollständig in Discovery und Hauptseite integrieren."
  },
  {
    status: "in_progress",
    category: "Projekt TLN/VOW",
    priority: "high",
    title: "TLN-Team-Baum · Datenvollständigkeit und sichtbarer Ladefortschritt",
    desc: `REFERENZ 18.09.2026: Der Team-Baum ist fachlich noch nicht vollständig. Vor weiteren allgemeinen Performance-Umbauten zuerst diesen Datenpfad stabilisieren.

OFFEN / VERBINDLICH:
• Phase 5.24 umgesetzt: Fehlende eigene Stakings beim Team-Restore behoben. Eigene Wallet-Discovery-Result-Caches werden nicht global, sondern user_id/wallet_id-basiert privat gespeichert; der Team-Restore fragte sie bisher fälschlich nur im globalen scope_address-Cache ab. Jetzt lädt er eigene Projekt-Wallets über technicalCacheScope aus dem privaten Cache und externe Partner weiterhin gebündelt global. Zusätzlich bleiben positive Lifecycle-Lots bei vorgemerkter Unstake-Nachprüfung sichtbar, jedoch bis zur Nachprüfung bewusst unvollständig. Alias-Abdeckung wird als stored/matched/missing gezählt; fehlende Namen ohne gespeicherten user-spezifischen Alias werden nicht erfunden. Staking-Discovery und 5.23-Duration-Proof bleiben unverändert.
• Phase 5.23 umgesetzt: Root Cause der offenen Legacy-v$/VOW-Lifecycles behoben. 5.20-5.22 hatten fuer 0x4857…d590 vorhandene positive Strict-Duration-Caches und Shared-Proofs absichtlich blockiert, weil faelschlich ein individueller Stored-End-Timestamp im Wallet-Struct erwartet wurde. Aktueller Diagnose-Run belegt: Start-/Positions-Struct wird gefunden, aber kein solcher End-Timestamp. Historischer On-Chain-Duration-Test belegt dagegen exakt 367 Tage: Unstake-Simulation eine Sekunde davor revertiert mit „!Minimum Staking Period“, unmittelbar danach erfolgreich. 5.23 nutzt daher wieder positive Cache-/Shared-Proofs zuerst; falls beides fehlt, gilt der 367-Tage-Proof nur fuer exakt 0x4857…d590 und nur nach erneutem Contract-/Implementation-Fingerprint- sowie Wallet-Positions-State-Abgleich am konkreten Stake-/Top-up-Block. 17449 verwendet weiterhin den letzten on-chain bestaetigten Top-up als Duration-Anker. Kein Staking-Discovery-Code geaendert. Alias-Backend/-Mapping laut 5.22-Diagnose erfolgreich (5 geladen / 5 sichtbare Matches), daher kein spekulativer Alias-Fix.
• Phase 5.22 umgesetzt: Stored-End-Read bleibt für Legacy-v$/VOW vor allen generischen Duration-/Shared-Caches; als Fallback ist ausschließlich ein zuvor positionsbezogen erzeugter Stored-End-Strict-Cache mit passendem Contract + Stake-Tx zulässig. Legacy-Aliase werden vor dem serverseitigen Replace auf id:/wallet: kanonisiert; unbekannte Legacy-Referenzen werden nicht an wallet-private gesendet und nicht gelöscht. Alle Build-/Versionsangaben synchronisiert. Staking-Discovery unverändert. Systemübersicht geprüft: keine Änderung an Datenquelle, Ladeauslöser oder Struktur.
• Phase 5.21 umgesetzt: Legacy-v$/VOW 0x4857…d590 liest Start + individuellen End-/Unlock-Timestamp wieder direkt aus dem konkreten Positions-Storage am Stake-Block, unabhängig von Shared-/Duration-/Negativcache. Partner-Aliase werden exakt aus wallet-private {ok,action,aliases} geladen und id:/wallet:-Referenzen kanonisch gespiegelt. Keine feste Tageszahl; Staking-Discovery unverändert.
• Phase 5.20 umgesetzt: Legacy-v$/VOW-Contract 0x4857…d590 priorisiert den individuellen Stored-End-Read jetzt vor altem Duration-Cache UND vor contractweiter Shared-Dauer. Dadurch kann keine frühere generische Dauer den positionsbezogenen End-Timestamp mehr überholen. Keine feste Tageszahl; Staking-Discovery unverändert.
• Phase 5.17 umgesetzt: Historische verschlüsselte Alias-Referenzen werden nach Identity-/Registry-Restore an sichtbare TLN-ID-Keys gebunden; sichtbare New-Registry-Partner ohne kompatiblen Lifecycle erhalten genau einen bestehenden Discovery-Pass. Staking-Erkennung unverändert; Build-Zeitangaben synchronisiert.
• Phase 5.16 umgesetzt: Auf neuem Gerät wird auch CURRENT_WALLET aus seinem persistenten Discovery-Snapshot restauriert, sofern kein Live-Lauf vorhanden ist. Offene Lifecycles erhalten nur dann einen automatischen Einmal-Nachlauf, wenn für alle aktuellen Staking-Targets bereits vollständige serverseitige Contract-History vorliegt; sonst bleibt der Fall bewusst offen. Kein Wallet-History-/Receipt-/forceFresh-Fallback, Batch max. 3. Staking-Discovery unverändert.
• Phase 5.15 umgesetzt: New-Registry-Referenzfall TLN-ID 990000017795 wird beim cache-only Restore gezielt on-chain gegengeprüft und ohne Registry-History-/Staking-Scan an Parent-TLN-ID 12415 angebunden; Alias-Referenzen werden kanonisch nach TLN-ID/Wallet gemappt und die Trefferzahl ohne Klartextnamen geloggt. Die offenen v$/VOW-Fälle bleiben fachlich korrekt als Duration offen, weil der aktuelle Diagnose-Lauf zwar Staking + 14/14 Contract-Historien, aber keinen belastbaren Duration-Strict-Proof belegt. Staking-Discovery unverändert.
• Phase 5.14 umgesetzt: normaler Seiten-/Team-Restore ist strikt cache-only. Auf einem neuen Geraet wird nach dem Supabase-Restore keine automatische Lifecycle-/Wallet-History-/Receipt-Nachverifikation mehr gestartet; offene Lifecycles bleiben sichtbar und werden nur ueber Step 7 aktualisiert. Browser-/IndexedDB-Cache ist damit nur Beschleuniger, nicht Voraussetzung. Staking-Discovery unveraendert.
• Phase 5.13 umgesetzt: neue SmartNode-Registry-Generationen besitzen einen eigenen cache-first Join-Graph; falls fuer eine konfigurierte Zusatzregistry noch kein Graphcache existiert, wird nur diese Registry einmalig ueber join(address) + nodeIdOf/nodeUserOf verifiziert und danach persistiert. Alias-Referenzen werden unabhaengig vom historischen Prefix ueber TLN-ID/Wallet erkannt. Positive, vollstaendig verifizierte v7-Lifecycles werden wiederverwendet; alte v7-Nullfunde bleiben wegen der Coverage-Korrektur ungueltig. Staking-Discovery unveraendert.
• Phase 5.11 umgesetzt: Cache-Restore lädt Identities neuer SmartNode-Registries separat und rekonstruiert deren verifizierte join(address)-Parent-Kanten VOR dem Forest-Build (Referenz Ernie / TLN-ID 990000017795); Alias-Loader akzeptiert kompatible wallet-private Response-Shapes. Staking-Discovery unverändert.
• Phase 5.09 umgesetzt: Partial-Lifecycle kann verifizierten Cache nicht mehr überschreiben; Alias-Leerantwort erhält sicheren Re-Read
• Phase 5.07 umgesetzt: userbezogene Partnernamen/Aliase werden nach Cache-Restore rückwärtskompatibel über TLN-ID- und Wallet-Referenzen geladen und angezeigt
• Phase 5.07 umgesetzt: auch erkannte Teil-Lifecycles mit noch offener Duration werden persistent gespeichert und beim Cache-Restore gemergt; bereits erkannte Positionen dürfen dadurch nicht verschwinden
• Referenzfall TLN-ID 11674 weiterführen: TLN Legacy LPT ist geschlossen/verifiziert; vUSD/VOW ist erkannt, aber der positionsgenaue Duration-/Lifecycle-Nachweis ist noch offen und muss ohne Schätzung vollständig on-chain geklärt werden
• ein Cache-Stand darf niemals weniger fachliche Information anzeigen als der bereits verifizierte persistente Datenbestand
• Hintergrund-/Lifecycle-Aktualisierung muss einen Lade-/Fortschrittsbalken anzeigen, der beim Scrollen im Viewport sichtbar bleibt und nach Abschluss wieder verschwindet
• Diagnose/Optimierung des Request-Aufkommens für technical_global_cache / staking_scan_cache erst so durchführen, dass keine fachlichen Datenverluste durch Egress-Optimierung kaschiert werden.`,
  },
  {
    status: "open",
    category: "Projekt TLN/VOW",
    priority: "medium",
    title: "TLN-Team-Baum um LP/QLP-Status erweitern",
    desc: "Pro Partner im TLN-Team-Baum den Status LP / QLP / kein Status on-chain ermitteln und sichtbar machen, sofern die Contract-Logik belastbar identifiziert ist."
  },
  {
    status: "open",
    category: "Projekt TLN/VOW",
    priority: "medium",
    title: "Lending-Bereich ergänzen",
    desc: "Nach Abschluss des Loan-Bereichs Lending fachlich definieren: On-Chain-Erkennung, Positionen, Zinsen/Rewards, Status, Datenmodell, Cache und Darstellung."
  },
  {
    status: "in_progress",
    category: "Projekt DAO1",
    priority: "high",
    title: "DAO Team · wallet-zentrierter Baum bis 20 Ebenen",
    desc: `AKTUELLER ZIELZUSTAND: In der normalen User-Oberfläche gibt es genau einen DAO-Team-Baum. Fachregel: 1 Wallet = 1 Partner. Alle belegten DAO1- und APTMDAO-DIDs eines Wallets werden in einem Wallet-Knoten zusammengeführt. Die zugrunde liegenden DAO1-alt- und APTMDAO-neu-Graphen bleiben technisch und on-chain strikt getrennte Nachweisquellen und dürfen fachlich nicht vermischt werden.

USER-UI:
• keine separaten Tabs „Partner nach Wallet“, „DAO1 (alt) · Diagnose“ oder „APTMDAO (neu) · Diagnose“
• wallet-zentrierter Team-Baum direkt in der Hauptmaske „DAO Team“
• eigene Wallets bleiben sichtbar, zählen aber nicht als Partner
• Partnerzahl dedupliziert wallet-zentriert; DAO1-/APTMDAO-Bezug separat ausweisbar
• Partnerdetails verwenden die vorhandene NFT-Klassifikation (Mining-Bot, DID, Trading-Bot, Membership)
• technische Einzelgraph-Diagnose nur noch im Admin/DEV-Kontext, nicht in der normalen Navigation

DATEN-/FACHREGEL: Alter DAO1-Tree bleibt über TokenMinted(to, tokenId, fid) belegt; APTMDAO über den verifizierten Mint-Event child/parent/wallet. Beide Graphen haben weiterhin eigene persistente Supabase-/IndexedDB-Caches, DATA_VERSIONS und inkrementellen Chain-Abgleich. Die gemeinsame Darstellung ändert keine on-chain Beziehung.

OFFEN: Bot-Target/Aktivstatus belastbar on-chain beweisen; Referral-Reward→Partner-Zuordnung nur übernehmen, wenn fachlich eindeutig belegt. Phase 5.79 hat die überflüssigen sichtbaren Einzelgraph-Tabs entfernt und die wallet-zentrierte Ansicht direkt in „DAO Team“ integriert.`
  },
  {
    status: "open",
    category: "Projekt DAO1",
    priority: "high",
    title: "DAO1 Abschluss-Plausibilitätscheck",
    desc: "Claims, Referral Rewards, NFT-Zuordnung, Token-Anzahlen und historische USD-Summen nochmals mit bekannten Kontrollfällen plausibilisieren, bevor DAO1 als fachlich abgeschlossen gilt."
  },
  {
    status: "open",
    category: "UI/UX",
    priority: "medium",
    title: "Sticky Tabellen-Header zentral einführen",
    desc: "ZIEL: Bei langen Tabellen bleibt die Kopfzeile beim vertikalen Scrollen sichtbar (sticky header). Zentral im allgemeinen Tabellen-CSS lösen, nicht tabweise. Bestehende globale Tabellenregel beibehalten: Wenn Spalten horizontal nicht lesbar passen, nicht zusammendrücken/abschneiden, sondern horizontalen Scrollbereich verwenden. Sticky Header muss auch innerhalb dieses Scrollcontainers korrekt funktionieren."
  },
  {
    status: "open",
    category: "Caching & Daten",
    priority: "high",
    title: "Zentrale Cache-/Schema-Versionierung pro Job",
    desc: "ZIEL: Zentrale Cache-/Schema-Versionierung je Datenjob statt verstreuter Einzelregeln. Fachliche Änderung → betroffene Cache-Version erhöhen → veraltete Daten erkennen → wenn möglich migrieren/reklassifizieren, sonst gezielt neu aufbauen. Nicht blind alle Caches löschen. WICHTIG: Lifecycle-Daten, deren Zustand sich on-chain ändern kann, benötigen zusätzlich einen inkrementellen Refresh und dürfen nicht allein wegen gültiger Cache-Version als aktuell gelten. Diese Regel ist besonders für TLN/VOW Loans (Waiting-to-Swap, Fälligkeit, Repay) relevant."
  },
  {
    status: "done",
    category: "Security & Privacy",
    priority: "high",
    title: "Einzelne Wallet vollständig löschen",
    desc: "Phase 5.81 umgesetzt: Löschen in „Meine Wallets“ bedeutet vollständiger Purge. Server-/DB-seitig werden alle eindeutig walletbezogenen Bestände, manuelle/automatische Snapshot-Items, Bestand-per-31.12.-Positionen und -Coverage, Gebühren, NFTs, Claims/Rewards, Projekttransaktionen/Asset-Flows, LP-/Staking-/Discovery-/Scan-/Refresh-Caches entfernt. Nicht mehr gültige userbezogene DAO-Partner-Lifecycle-/Scan-Caches werden vollständig invalidiert und später aus verbleibenden Wallets neu aufgebaut. Leere Snapshot-Hüllen werden entfernt; Summen werden nie durch Subtraktion fortgeschrieben, sondern nach Reload aus den verbleibenden Quelldaten neu gebildet. Globale On-Chain-/Registry-/Token-/Contract-Fakten bleiben erhalten."
  },
  {
    status: "done",
    category: "Security & Privacy",
    priority: "high",
    title: "Alle Userdaten vollständig löschen",
    desc: "Phase 5.94 umgesetzt: Unter „Support & Info → Daten & Konto“ kann ein User sämtliche WalletTracking-Daten vollständig und transaktional löschen. Die DB-Funktion bereinigt persönliche public-Basistabellen mit user_id (admins bleibt ab 7.42 erhalten), anonymisiert created_by/updated_by-Provenienz in globalen Caches, ohne globale öffentliche Blockchain-/Registry-/Token-/Contract-Fakten zu löschen. Anschließend werden WalletTracking-IndexedDB, localStorage/sessionStorage entfernt und der User abgemeldet. Das Supabase-Auth-Login bleibt bewusst bestehen."
  },
  {
    status: "done",
    category: "Projekt TLN/VOW",
    title: "Loans · zentrale Engine für Discovery und Hauptseite",
    desc: "Erkennungs-, Typ-, Zins- und Repayment-Logik zentralisiert. Discovery und Hauptseite verwenden dieselbe Loan-Engine; keine doppelte fachliche Implementierung."
  },
  {
    status: "done",
    category: "UI/UX",
    title: "Token-Anzeige-Kommastellen zentral konfigurierbar",
    desc: "Technische Decimals und Anzeige-/Summary-Kommastellen sind getrennt. Anzeigepräzision kann zentral über die Token-Stammdaten gesteuert werden, inklusive Native Coins."
  },
  {
    status: "done",
    category: "Security & Privacy",
    title: "Vordefinierte Token · User read-only / Admin bearbeitbar",
    desc: "Normale User sehen nur Chain, Token, Adresse und Kurs (USD); Bearbeitung und technische Spalten sind Admin-only. DB-seitige RLS-Härtung für predefined_tokens ist als Migration vorgesehen/geprüft."
  }

  ,
  {
    status: "in_progress",
    category: "Plattform & Allgemein",
    priority: "high",
    title: "Hilfe & Projektdokumentation laufend aktuell halten",
    desc: `DAUERREGEL: Funktionale Änderungen sind nicht abgeschlossen, solange die passende Hilfe veraltet ist.
• Allgemeine Funktionen gehören in „❓ Hilfe / Handbuch“.
• Projektspezifische Bedienung, Fachlogik, Statusmodelle, Cache-/Refresh-Regeln und Besonderheiten gehören in den eigenen Hilfe-Tab des jeweiligen Projekts (z. B. TLN/VOW, DAO1).
• Bei neuen/änderten Tabs, Statusregeln oder fachlichen Modellen die Hilfe im selben Änderungspaket mitpflegen.
• Keine projektspezifischen Detailregeln doppelt in der allgemeinen Hilfe dokumentieren; dort nur auf den Projekt-Hilfe-Tab verweisen.

NEUER-CHAT-/ÜBERGABEREGEL:
• Ideen/Umbau und die projektspezifischen Hilfen sind die dauerhafte Übergabedokumentation des Projekts.
• Nach funktionalen Änderungen müssen offene Punkte, bestätigte Fachregeln, wichtige technische Entscheidungen, zentrale Zuständigkeiten/Dateien, bekannte Einschränkungen und nächste sinnvolle Schritte so dokumentiert werden, dass ein neuer Chat ohne separates Übergabe-Summary weiterarbeiten kann.
• Der Ideen-Tab muss bei offenen Arbeiten ausreichend konkret beschreiben: Was ist bereits umgesetzt/verifiziert? Was ist noch offen? Welche Regeln dürfen nicht verloren gehen? Welche zentrale Logik/Datei ist betroffen? Welche Tests oder On-Chain-Nachweise fehlen?
• Die jeweilige Projekt-Hilfe dokumentiert den produktiven Ist-Stand und die Bedien-/Fachlogik; offene Entwicklungsfragen gehören primär in Ideen/Umbau.
• Bei Fortsetzung in einem neuen Chat soll das aktuelle vollständige Projekt als Grundlage dienen; zuerst admin/ideas.js und die relevanten Projekt-Hilfen lesen, danach den aktuellen Code prüfen.
• Ziel: Kein separates manuelles Chat-Summary mehr erforderlich.`
  }
,
  {
    status: "open",
    category: "Architektur & Infrastruktur",
    priority: "critical",
    title: "Zentrale Build-, Modul- und Datenversionierung",
    desc: `ZIEL: Einzelne Module/Dateien unabhängig aktualisieren können, ohne index.html nur wegen Buildnummern oder Cache-Bustern anfassen zu müssen. Gleichzeitig soll WalletTracking beim Seitenstart gezielt entscheiden, welche Daten neu geladen, nur neu klassifiziert oder unverändert aus Cache verwendet werden können.

ARCHITEKTURVORSCHLAG:
1. MODULE BUILD
• jedes austauschbare Modul meldet beim Laden eigene Build-ID + Timestamp
• Beispiele: app-core, ideas, help-general, tln-vow, tln-vow-loans, tln-vow-help, dao1, dao1-help
• sichtbarer Runtime-Build im Header = neuester Build aller tatsächlich geladenen Module
• reine Änderung z. B. an ideas.js darf nur diese Datei erfordern

2. ZENTRALER MODULE-LOADER / CACHE-BUSTING
• keine fest in index.html eingetragenen versionsabhängigen ?v=... Werte pro Modul
• kleiner stabiler Loader lädt Module mit kontrolliertem Cache-Buster
• KEIN document.write; dynamische script-Elemente bzw. robuste Loader-Logik verwenden
• Ziel: geänderte Einzeldatei wird nach Reload sicher neu geladen, ohne index.html anzufassen

3. DATENVERSION PRO JOB / CACHE
• Build-Version strikt von fachlicher Datenversion trennen
• je Datenbereich eigene Version, z. B. balances, nft-discovery, dao1-transactions, tln-stakings, tln-loans-opening, tln-loans-lifecycle, team-graph, prices
• UI-/Textänderung darf niemals unnötigen Blockchain-Reload auslösen
• fachliche Änderung invalidiert nur betroffene Datenbereiche

4. DISCOVERY- VS. KLASSIFIKATIONS-VERSION
• Discovery-Version erhöhen, wenn bisher relevante On-Chain-Ereignisse gar nicht gefunden wurden → gezielter Nach-/Fullscan
• Klassifikations-Version erhöhen, wenn Rohdaten bereits vorhanden sind, aber neu interpretiert werden müssen → nur Re-Klassifikation, kein unnötiger Chain-Scan

5. LIFECYCLE-DATEN
• gültige Cache-/Schema-Version bedeutet nicht automatisch „aktueller Zustand“
• veränderliche Daten wie TLN/VOW Loan Waiting-to-Swap, Swap-Datum, Fälligkeit und Repayment müssen trotz gültigem Cache inkrementell neu geprüft werden
• bereits bestätigte immutable Daten dürfen erhalten bleiben

START-/MIGRATIONSLOGIK:
• beim Seitenstart geladene Modulversionen registrieren
• Datenversionsstand des Caches prüfen
• nur notwendige Migration/Reklassifikation/Refresh-Jobs auslösen
• alten Cache möglichst als Fallback behalten, bis Neuaufbau erfolgreich ist
• Status transparent im UI/Diagnose-Log ausweisen

PHASE 5.89 – BASIS UMGESETZT:
• zentrale DATA_MIGRATIONS-Registry im App-Core
• userbezogener persistenter Migrationsstand in Supabase; Version wird erst nach erfolgreichem Job erhöht
• erster echter Job: DAO1/APTM NFT-Metadaten-/Ownership-Normalisierung aus 5.88 automatisch einmalig nachziehen
• zentrale Release-Registry für relevante User-Mitteilungen
• Popup-Mitteilung pro Release/User genau einmal; nur expliziter Klick auf „Schliessen“ quittiert
• reine UI-/Text-Releases lösen keinen Datenjob aus
• der weiter unten beschriebene Module-Loader/eigenständige Modul-Build-IDs bleiben als separater Ausbauschritt offen

PHASE 5.92 – MIGRATIONS-/NFT-FEHLERSTATUS GEHÄRTET:
• NFT-Zahlungsnachweis ab 7.45: Same-TX-Prüfung separat vom Kaufpreisabschluss. Strikte Pagination/Antwortvalidierung; keine Negativklassifizierung nach Fehlern. Resolver-Version alt 4 / Upgrade 6 prüft alte Nachweise einmal neu.
• NFT-TX-Anzeige: Erwerbslink aus acquisition_tx_hash/entry_tx_hash; separater aktueller Wallet-Eingang aus entry_tx_hash der aktuellen Besitzperiode. Keine zusätzlichen Netzwerkabfragen.
• bekannte CORS-gesperrte APTMDAO-Metadatenquelle api.aptmdao.io wird nicht mehr direkt aus dem Browser geladen, sondern serverseitig über wallet-private mit enger Domain-/Pfad-Allowlist
• Migrationsjobs können complete / partial / failed zurückgeben; partial erhöht die Datenversion ausdrücklich nicht und wird beim nächsten Start erneut versucht
• Release-Popup meldet partial/failed ehrlich statt „abgeschlossen“
• legitime APTMDAO eth_call-Abfragen für DID-Owner/Parent sind im lokalen RPC-Gate erlaubt; der zentrale Apertum-RPC-Proxy bleibt die einzige RPC-Schnittstelle
• NFT-Migration v3 läuft automatisch; kein manueller User-Refresh nötig

WICHTIGKEIT: SEHR HOCH. Dieser Umbau sollte erfolgen, bevor deutlich mehr separat austauschbare Module hinzukommen, weil er Build-Anzeige, Browser-Cache, Einzeldatei-Updates und gezielte Datenmigration gemeinsam löst.`
  },
  {
    status: "open",
    category: "Projekt TLN/VOW",
    priority: "high",
    title: "TLN/VOW Loans · Wirtschaftlichkeit / Gewinn-Verlust je Position",
    desc: `ZIEL: Für jeden Loan später nachvollziehbar ausweisen, ob der gesamte Vorgang wirtschaftlich Gewinn oder Verlust gebracht hat.

NOCH NICHT FACHLICH DEFINIERT – deshalb derzeit KEINE P&L-Zahl anzeigen.

ZU BERÜCKSICHTIGEN:
• tatsächliche Netto-v$-Auszahlung an das Wallet
• Brutto-v$-Mint / Principal
• 18-%-Zins und Zinsmodell (vorausbezahlt / bei Rückzahlung fällig / vom Mint abgezogen)
• tatsächlich zurückgezahlte v$
• Herkunft des VOW-Collaterals: eigene VOW oder aus Loan-Mint gekauft
• VOW Collateral zurückgegeben / weiterhin gebunden / bei Nicht-Rückzahlung verfallen
• historische und ggf. aktuelle Bewertung des VOW-Collaterals
• mögliche TLN/TLN-GOLD-Burn-Kosten, falls sie in die Gesamtrentabilität einbezogen werden sollen

BESONDERHEIT TLN GOLD EXTENDED: User erhält netto v$ aufs Wallet und stellt eigene VOW als Collateral. Bei Rückzahlung kommen die VOW zurück; bei Nicht-Rückzahlung bleiben die v$ beim User, aber das eigene VOW-Collateral geht an den Kreditgeber. Welche Zeitpunkte/Kurse für eine faire P&L-Bewertung verwendet werden, ist noch zu definieren.

VOR P&L-IMPLEMENTIERUNG:
1. alle Cashflows und Collateral-Lifecycle-Felder on-chain vollständig verifizieren,
2. Bewertungszeitpunkte festlegen,
3. realisierte vs. unrealisierte Wirtschaftlichkeit definieren,
4. erst danach Summary-/P&L-Anzeige implementieren.`
  }];

const ADMIN_IDEA_STATUS_META = {
  open: { label: "Offen", color: "#9aa0ac" },
  in_progress: { label: "In Umsetzung", color: "#3b82f6" },
  clarifying: { label: "In Abklärung", color: "#f0b90b" },
  done: { label: "Umgesetzt", color: "#46c878" },
  reverted: { label: "Umgesetzt, dann zurückgebaut", color: "var(--danger)" },
  paused: { label: "Pausiert", color: "#8247e5" }
};

const ADMIN_IDEA_CATEGORY_ORDER = [
  "Projekt TLN/VOW",
  "Projekt DAO1",
  "Caching & Daten",
  "UI/UX",
  "Security & Privacy",
  "Architektur & Infrastruktur",
  "Blockchain & Provider",
  "Analyse & Export",
  "Chat & Support",
  "Plattform & Allgemein"
];

let adminIdeasFilterState = { category: "all", status: "all", priority: "all", search: "", showDone: false };

const ADMIN_IDEA_PRIORITY_META = {
  critical: { label: "Sehr hoch", rank: 0, color: "var(--danger)" },
  high: { label: "Hoch", rank: 1, color: "#f59e0b" },
  medium: { label: "Mittel", rank: 2, color: "#3b82f6" },
  low: { label: "Niedrig", rank: 3, color: "#9aa0ac" }
};

function adminIdeaPriority(idea){
  if(idea?.priority && ADMIN_IDEA_PRIORITY_META[idea.priority])return idea.priority;
  if(idea?.status==="in_progress")return "high";
  if(idea?.status==="clarifying")return "high";
  if(idea?.status==="open")return "medium";
  return "low";
}

function adminIdeaCategory(idea){
  if(idea?.category)return idea.category;
  const t=`${idea?.title||""} ${idea?.desc||""}`.toLowerCase();
  if(/dao1|apertum/.test(t))return "Projekt DAO1";
  if(/tln\/vow|staking|v-währung|vow\b|liquidity pools nach chain/.test(t))return "Projekt TLN/VOW";
  if(/cache|snapshot|datenversion|historie persistent|schema-version/.test(t))return "Caching & Daten";
  if(/verschlüssel|privacy|security|rls|wallet-bezeichnung/.test(t))return "Security & Privacy";
  if(/hardcoding|konfiguration aus html|supabase|architektur|secret|proxy/.test(t))return "Architektur & Infrastruktur";
  if(/alchemy|netzwerkgebühr|akasha?|chain|rpc|provider/.test(t))return "Blockchain & Provider";
  if(/export|gewinn\/verlust|allokation|chart|kursverlauf|csv|pdf|excel/.test(t))return "Analyse & Export";
  if(/chat|benachrichtigung|support/.test(t))return "Chat & Support";
  if(/mehrsprach|pwa|willkommen|hilfe|mobile/.test(t))return "Plattform & Allgemein";
  if(/nft|tabelle|anzeige|ui|layout/.test(t))return "UI/UX";
  return "Plattform & Allgemein";
}

function setAdminIdeasFilter(key,value){
  if(!(key in adminIdeasFilterState))return;
  adminIdeasFilterState[key]=String(value??"");
  renderAdminIdeas();
}

function renderAdminIdeas() {
  const el = document.getElementById("adminIdeasList");
  if(!el)return;

  const configDiag = chainConfigStatus.source === "Supabase public.chains"
    ? `<div class="custom-token-card" style="margin-bottom:12px;border-color:var(--safe)">
        <strong>⚙️ Chain-Konfiguration: Supabase ✓</strong>
        <div class="meta">${chainConfigStatus.count} aktive Chains aus <code>public.chains</code> geladen · ${chainConfigStatus.loadedAt ? new Date(chainConfigStatus.loadedAt).toLocaleString("de-CH") : "–"}</div>
        <div class="meta">HTML-Fallback für Chain-Metadaten: <strong>entfernt</strong></div>
      </div>`
    : `<div class="custom-token-card" style="margin-bottom:12px;border-color:var(--danger)">
        <strong>⚙️ Chain-Konfiguration: ${escapeAttr(chainConfigStatus.source)}</strong>
      </div>`;

  const rows = ADMIN_IDEAS.map((idea,index)=>({...idea,_index:index,_category:adminIdeaCategory(idea),_priority:adminIdeaPriority(idea)}));
  const categories=[...new Set(rows.map(x=>x._category))].sort((a,b)=>{
    const ai=ADMIN_IDEA_CATEGORY_ORDER.indexOf(a),bi=ADMIN_IDEA_CATEGORY_ORDER.indexOf(b);
    return (ai<0?999:ai)-(bi<0?999:bi)||a.localeCompare(b,"de");
  });

  const statusValue=adminIdeasFilterState.status||"all";
  const categoryValue=adminIdeasFilterState.category||"all";
  const priorityValue=adminIdeasFilterState.priority||"all";
  const showDone=!!adminIdeasFilterState.showDone;
  const search=String(adminIdeasFilterState.search||"").trim().toLowerCase();

  const visible=rows.filter(idea=>{
    if(!showDone&&["done","reverted"].includes(idea.status))return false;
    if(categoryValue!=="all"&&idea._category!==categoryValue)return false;
    if(priorityValue!=="all"&&idea._priority!==priorityValue)return false;
    if(statusValue==="active"&&!["open","in_progress","clarifying","paused"].includes(idea.status))return false;
    if(statusValue!=="all"&&statusValue!=="active"&&idea.status!==statusValue)return false;
    if(search&&!`${idea.title} ${idea.desc} ${idea._category}`.toLowerCase().includes(search))return false;
    return true;
  });

  const statusOrder={in_progress:0,clarifying:1,open:2,paused:3,done:4,reverted:5};
  visible.sort((a,b)=>(ADMIN_IDEA_PRIORITY_META[a._priority]?.rank??99)-(ADMIN_IDEA_PRIORITY_META[b._priority]?.rank??99)||(statusOrder[a.status]??99)-(statusOrder[b.status]??99)||a.title.localeCompare(b.title,"de"));

  const countStatus=(status)=>rows.filter(x=>x.status===status).length;
  const activeCount=rows.filter(x=>["open","in_progress","clarifying","paused"].includes(x.status)).length;

  const controls=`
    <div class="custom-token-card" style="margin-bottom:14px">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;align-items:end">
        <label><span class="field-label">Kategorie</span>
          <select onchange="setAdminIdeasFilter('category',this.value)">
            <option value="all"${categoryValue==="all"?" selected":""}>Alle Kategorien</option>
            ${categories.map(c=>`<option value="${escapeAttr(c)}"${categoryValue===c?" selected":""}>${escapeAttr(c)}</option>`).join("")}
          </select>
        </label>
        <label><span class="field-label">Status</span>
          <select onchange="setAdminIdeasFilter('status',this.value)">
            <option value="all"${statusValue==="all"?" selected":""}>Alle offenen Status</option>
            <option value="active"${statusValue==="active"?" selected":""}>Aktiv / offen</option>
            ${Object.entries(ADMIN_IDEA_STATUS_META)
              .filter(([key])=>showDone||!["done","reverted"].includes(key))
              .map(([key,m])=>`<option value="${key}"${statusValue===key?" selected":""}>${escapeAttr(m.label)}</option>`).join("")}
          </select>
        </label>
        <label><span class="field-label">Wichtigkeit</span>
          <select onchange="setAdminIdeasFilter('priority',this.value)">
            <option value="all"${priorityValue==="all"?" selected":""}>Alle Wichtigkeiten</option>
            ${Object.entries(ADMIN_IDEA_PRIORITY_META).map(([key,m])=>`<option value="${key}"${priorityValue===key?" selected":""}>${escapeAttr(m.label)}</option>`).join("")}
          </select>
        </label>
        <label><span class="field-label">Suche</span>
          <input type="search" value="${escapeAttr(adminIdeasFilterState.search||"")}" placeholder="Titel, Beschreibung …"
            oninput="setAdminIdeasFilter('search',this.value)">
        </label>
      </div>
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:12px">
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer">
          <input type="checkbox" ${showDone?"checked":""} onchange="setAdminIdeasFilter('showDone',this.checked)">
          <span><strong>Erledigte anzeigen</strong> <span class="meta">(${countStatus("done")} umgesetzt${countStatus("reverted")?` · ${countStatus("reverted")} zurückgebaut`:""})</span></span>
        </label>
        <button class="secondary" onclick="adminIdeasFilterState={category:'all',status:'all',priority:'all',search:'',showDone:false};renderAdminIdeas()">Filter zurücksetzen</button>
      </div>
    </div>`;

  const summary=`
    <div class="summary" style="margin-bottom:14px">
      <div class="metric">Gesamt<b>${rows.length}</b></div>
      <div class="metric">Aktiv / offen<b>${activeCount}</b></div>
      <div class="metric">In Umsetzung<b>${countStatus("in_progress")}</b></div>
      <div class="metric">Umgesetzt<b>${countStatus("done")}</b></div>
      <div class="metric">Gefiltert<b>${visible.length}</b></div>
    </div>`;

  const groups=categories.map(category=>{
    const items=visible.filter(x=>x._category===category);
    if(!items.length)return "";
    return `
      <div style="margin:18px 0 8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <h3 style="margin:0">${escapeAttr(category)}</h3>
        <span class="badge">${items.length}</span>
      </div>
      ${items.map(idea=>{
        const sm=ADMIN_IDEA_STATUS_META[idea.status]||{label:idea.status||"–",color:"#9aa0ac"};
        const isDone=idea.status==="done";
        return `<div class="custom-token-card" style="margin-bottom:10px;border-left:4px solid ${sm.color}">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
            <div style="min-width:220px;flex:1">
              <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
                <strong>${escapeAttr(idea.title)}</strong>
                <span class="badge" style="background:${sm.color}22;color:${sm.color}">${escapeAttr(sm.label)}</span>
                ${(()=>{const pm=ADMIN_IDEA_PRIORITY_META[idea._priority]||ADMIN_IDEA_PRIORITY_META.low;return `<span class="badge" style="background:${pm.color}18;color:${pm.color}">Wichtigkeit: ${escapeAttr(pm.label)}</span>`;})()}
                <span class="badge" style="background:rgba(148,163,184,.12);color:var(--muted)">${escapeAttr(idea._category)}</span>
              </div>
              <div class="meta idea-desc" style="margin-top:7px;white-space:pre-line;line-height:1.45">${escapeAttr(idea.desc)}</div>
            </div>
          </div>
        </div>`;
      }).join("")}`;
  }).join("");

  el.innerHTML=configDiag+controls+summary+(groups||`<div class="empty">Keine Ideen/TODOs entsprechen den gewählten Filtern.</div>`);
}


window.renderAdminIdeas = renderAdminIdeas;
window.setAdminIdeasFilter = setAdminIdeasFilter;
window.adminIdeasFilterState = adminIdeasFilterState;

// Phase 4.76 / DAO1 Team: Partner-NFT/Bot-Anreicherung ist on-demand umgesetzt.
// TODO Ausbau: historischen (nicht mehr aktuellen) NFT-Bestand fremder Partner global
// und inkrementell cachen, sobald dafür ein verifizierter serverseitiger Public-Chain-Cache
// bereitsteht. Keine fremden Wallet-Adressen in user-private Klartexttabellen speichern.

// Phase 4.77 / DAO1 Bot-Lifecycle TODO:
// Target/Fortschritt der Mining-/Trading-Bots on-chain eindeutig dekodieren. Status "abgeschlossen" erst setzen,
// wenn Target und Zielerreichung aus Contract-State/Event beweisbar sind; keine Ableitung nur aus Ownership/Transfer.

// Phase 4.78 umgesetzt: sichtbare DAO1-Partnerkacheln laden Bot-Anzahlen ohne Details-Klick;
// Trading-/Mining-Typisierung für Partner an Own-Wallet-Logik + explizite Metadaten angeglichen;
// Kaufpreis-Ermittlung gruppiert ERC-20-Flows je Token und vermeidet willkürliche Auswahl;
// zentraler Datenjob sperrt Navigation und zeigt sofort Ladehinweis + Aktivitätsbalken.

// Phase 4.79 / DAO1 Bot-Lifecycle: zentrale NFT-Basis auch für DAO1-Übersicht.
// Umgesetzt: DID-Kaufpreis wird ignoriert; Bot-Übersicht mit Typ/ID/Name/Wallet/Kaufdatum/
// verifiziertem Kaufpreis/Claims je Asset/Status. Trading-Funding bleibt strikt getrennt.
// TODO Discovery: Funding-Call/Event + Bot-ID-Verknüpfung für Trading-Bots on-chain verifizieren;
// fehlende Einzelkaufpreise (u.a. bekannte Testfälle #10676/#90068/#90067/#90066/#90065/#89908)
// anhand Erwerbs-Tx/Receipt/Kaufcontract dekodieren, ohne Schätzung oder ID-Hardcoding.

// Phase 4.80 / DAO1 Bot-Erwerb: Erwerbsart aus ERC-721-Transferkette ableiten.
// Kauf (verifizierte Zahlung), Mint, NFT-Transfer und Transfer zwischen eigenen Wallets getrennt anzeigen.
// Quellwallet bei Transfers sichtbar machen; "Bonus" niemals allein aus Transfer ableiten.
// Offene Discovery: Trading-Funding je Bot-ID (inkl. Nachladungen/mehrere Währungen), Target/Progress/Abschlussstatus.

// Phase 4.81 / DAO1 Bot-Lifecycle: ältere Mint+Kauf-Pfade weiter dekodieren.
// Kein Kaufpreis aus NFT-Metadaten schätzen. Mint allein beweist weder Gratis/Bonus noch Kauf.
// Trading-Funding, Nachladungen, Target/Fortschritt und Abschlussstatus anschließend on-chain verifizieren.

// Phase 4.82: TLN/VOW und DAO1/APTM sind strikt getrennte Projekte. DAO1-Partnernamen verwenden ausschließlich dao1:did:<DID>; kein TLN-id:- oder Wallet-Fallback. wallet-private muss diesen Namespace serverseitig explizit akzeptieren.
// Phase 4.82 Analyse: DAO1 Bot-Lifecycle bleibt auf zentralem NFT-Bestand aufgebaut. Offene Discovery: ältere Mint+Kauf-Transaktionen (u.a. #90068/#90067/#90066/#90065/#89908) vollständig dekodieren; Trading-Funding/Nachladungen je Bot-ID und Währung; Target/Fortschritt/Abschlussstatus. Keine Schätzung.


// Phase 5.39 / Dashboard-Daten-Audit gestartet (19.09.2026):
// - Kursliste: Bestand > USD 1 automatisch; Flag = „immer anzeigen“, auch bei Bestand 0.
// - Projekt-Token nur bei belegter Projektbeteiligung; Projektkarten werden nicht mehr nur aus positivem Tokenbestand abgeleitet.
// - TLN/VOW Dashboard-Summary liest persistente Discovery-Snapshots und trennt Staking-, Referral- und Bonus-Rewards.
// - DAO1/APTMDAO Partnerzahlen und Aliase bleiben strikt getrennt.
// - APTMDAO Alias-Persistenz: reference_hash serverseitig verpflichtend aus vollständigem Namespace-HMAC.
// Audit offen: Aktuelles Staking/gebundener Wert gegen positionsgenaue Projektcaches verifizieren; DAO Bot-Target/Aktivstatus on-chain beweisen.

// Phase 5.54 erledigt: DAO-NFT-Ermittlung zentralisiert; kombinierter DAO1/APTMDAO-Walletgraph zeigt DAO1-only-Downline und belegte Uplines oberhalb eigener Wallets, eigene Wallets bleiben echte Knoten ohne Partnerzählung. Kaufpreis-Evidence-Cache bleibt zentrale Grundlage; offene/unbelegte Preise werden nicht erfunden.

/* Phase 5.63 · 21.09.2026 01:43:10 CEST
 * - Eigene Wallet speichern: projektbezogener Erstaufbau muss ohne manuellen Refresh laufen. Phase 5.82: gezielt nur für die gespeicherte Wallet; kein breites loadAll() mehr.
 * - TLN/VOW Referral-Rewards Phase 5.83: Tokenmengen werden aus Raw-Units nur mit technischen Contract-decimals normalisiert; Anzeige-/Summary-Kommastellen sind reine UI-Formatierung. Alt-Snapshots mit integer Raw-Amount werden beim Lesen repariert.
 * - DAO-Team: direkte Uplines an jeder eigenen Wallet grafisch anbinden.
 * - Dashboard-To-dos projektweise gruppieren; Details standardmäßig zuklappen.
 */

/* Phase 5.64 · 21.09.2026 02:08:16 CEST
   DAO-Team: Partner-Identity wird wallet-zentriert fuer DAO1 und APTMDAO aus aktuellem
   ERC-721-Besitz ergaenzt. Partner-Bot-Anzahlen = aktueller Bestand, unabhaengig von
   Kaufpreis-/Lifecycle-Evidenz. Membership getrennt nach DAO1/APTMDAO mit Ablaufdatum
   anzeigen, sobald die jeweilige on-chain Expiry-Quelle belastbar verifiziert ist;
   unbekannt darf nie als fehlende Membership dargestellt werden.
*/


/* Phase 5.65 · 21.09.2026 02:38:12 CEST
   5.64-Korrektur: Partner-DID und Bot-Kachel lesen zuerst einen aktuellen ERC-721-NFT-Snapshot
   des Wallets. Kauf-/Lifecycle-Historie laeuft davon getrennt und darf die Kachel nicht blockieren.
   TODO: Partner projektbezogen als inaktiv markieren (userbezogen, historisch sichtbar, optisch heller).
   TODO Dashboard/DAO: eigene relevante Wallets ohne belegte APTMDAO-DID unter
   „Registration APTMDAO offen“ anzeigen; unbekannt/nicht geladen darf nicht als fehlend gelten.
*/


/* Phase 5.66 · 21.09.2026 03:22:39 CEST
   Korrektur 5.64/5.65: Partnerkarten verwenden keinen breiten Explorer-/address/nft-Snapshot mehr.
   Aktuelle DAO1-/APTMDAO-DIDs und Bot-Bestaende werden ausschliesslich contract-gezielt aus
   ERC-721-Transferhistorien der bekannten Identity-/Bot-Contracts rekonstruiert. Der bekannte
   Miner-Contract zaehlt aktuelle Token unabhaengig von Kaufpreis oder Einzelklassifikation als Mining-Bots.
   Historische Kauf-/Lifecycle-Aufbereitung bleibt nachgelagert und blockiert die Kachel nicht.
*/

/* Phase 5.67 · 21.09.2026 03:28:09 CEST
   Fix: private Supabase-Zugriffe erhalten zentrale Session-Prüfung und einmaligen 401/403-Refresh/Retry.
   DAO-Team-Jobs bleiben bei abgelaufenem JWT nicht in der globalen Navigationssperre hängen; runDataJob-finally bleibt Freigabegarantie.
   Datenquellen/Projektstruktur unverändert; Systemübersicht geprüft.
*/

/* Phase 5.68 · 21.09.2026 03:37:37 CEST
   Fehlerkorrektur: dao1TeamIsIdentityNft ist wieder definiert und wird zentral anhand der bekannten
   DAO1-/APTMDAO-Identity-Contracts bzw. Identity-Subtypen ausgewertet. Partner-Bot-Refresh kann damit
   die Bestandsauswertung erreichen. Login-Link kann nach E-Mail-Eingabe zusätzlich per Enter gesendet werden.
   Bestehende TODOs „Partner projektbezogen inaktiv“ und „Registration APTMDAO offen“ bleiben offen.
*/


/* Phase 5.69 · 21.09.2026 03:51:12 CEST
   5.68-Nachkorrektur: Partner-Identity und Bot-Bestand sind technisch getrennte aktuelle
   Bestandsabfragen. Teilresultate werden sofort gerendert, damit ein langsamer Identity-/Bot-Contract
   andere bekannte Werte nicht auf „werden geladen …“ festhaelt. Bestehende TODOs bleiben offen.
*/

/* Phase 5.71 · 21.09.2026 11:39:58 CEST
   Korrigiert: DAO-Team-Caches werden beim automatischen Erstladen inkrementell gegen die Chain geprueft; der manuelle Button „Beide Trees on-chain aktualisieren“ ist nicht mehr Voraussetzung fuer neue Partner-/DID-Kanten. Referenzname korrigiert: 0x568281…fe4940 = Michaela. Offen: 1 Trading-Bot bei Michaela fachlich/contractseitig eindeutig zuordnen.
   Build 20260921-113958.
*/

/* Phase 5.71 · 21.09.2026 11:39:58 CEST
   DAO Wallet-Partnerdetails: dao1TeamOwnHistoricalBotCandidates ist jetzt definiert und nutzt project_nft_ownership als zentrale historische Quelle eigener Bots. Der bisherige ReferenceError beim Öffnen der Details entfällt. Trading-Bot-Klassifikation bleibt separat zu verifizieren.
   Build 20260921-113958.
*/

/* Phase 5.72 · 21.09.2026 11:57:19 CEST
   Aktuelle Mining-/Trading-Bot-Zahlen im DAO-Team verwenden die zentrale aktuelle NFT-/Ownership-Klassifikation. Kaufpreis, historische DID-Zuordnung und ownerOf@Block beeinflussen den heutigen Bestand nicht. Referenz Michaela: 9 Mining-Bots + 1 Trading-Bot.
   Build 20260921-115719.
*/

/* Phase 5.73 · 21.09.2026 12:22:50 CEST
   DAO-Team/NFT: aktueller Bot-Bestand nutzt denselben zentralen nft_cache wie der NFT-Tab.
   Trading-Bot-Contracts werden nur bei eindeutiger Bot-Typ-Evidenz aus dem zentralen Cache übernommen;
   Kaufpreis-/DID-Historie entscheidet nicht über den Bestand. Summen trennen Bot-Anzahl und Kaufpreis-Abdeckung.
   Referenz Michaela: DAO1 #21044, APTMDAO #7803, 9 Mining-Bots + 1 Trading-Bot.
   Build 20260921-122250. */


/* Phase 5.74 · 21.09.2026 13:48:40 CEST
   NÄCHSTER CHAT · Cache-/Request-Audit und Startoptimierung (Priorität hoch)

   Ziel:
   - Keine neue Fachlogik bauen. Zuerst messen, welche DB-/RPC-Abfragen beim normalen App-Start
     und beim Öffnen der Projekt-Tabs tatsächlich ausgeführt werden, wie oft und warum.
   - Doppelabfragen innerhalb eines App-Laufs vermeiden; bereits geladene globale Datenbestände
     zwischen Dashboard, NFT, DAO und TLN wiederverwenden.
   - Cache-first beibehalten, aber veraltete/unvollständige Caches zuverlässig über DATA_VERSIONS,
     Root-Signaturen, Scan-Cursor und kleinen Block-Overlap erkennen.

   Audit-Reihenfolge:
   1) Vollständigen App-Start instrumentieren: Quelle/Tabelle bzw. RPC, Filter/Scope, Aufrufer, Start/Ende, Dauer, Ergebnisgrösse, Cache-Hit/Miss.
   2) Identische parallele Requests über In-Flight-Promises zusammenführen.
   3) Große Graph-/Cache-Reads innerhalb derselben Session nur einmal laden und als RAM-Quelle teilen.
   4) DAO Partner-Bot-Discovery: neuer Partner einmal vollständig, danach nur Delta ab persistiertem last_scanned_block + Overlap.
   5) Current State strikt von History trennen: heutiger NFT/Bot-/Wallet-Bestand darf nie auf Kaufpreis-, Lifecycle- oder historische DID-Aufbereitung warten.
   6) Historisches ownerOf@Block / eth_call separat reparieren und Resultate persistent cachen; dieser Pfad darf die aktuelle Bestandsanzeige nicht beeinflussen.
   7) Für jede Cache-Domäne prüfen/vereinheitlichen: data_version/schema_version, scope/rootsKey, last_scanned_block bzw. sync_cursor, complete_until_block, updated_at.
   8) Nach Optimierung Warm-Start messen und mit Cold-Rebuild vergleichen.

   Besonders zu prüfen (aus bisherigen Network-Logs):
   - cache_data_versions
   - tln_vow_staking_scan_cache
   - tln_vow_identity_global_cache
   - tln_vow_technical_global_cache
   - dao_partner_bot_lifecycle_cache
   - nft_cache / project_nft_ownership / apertum_nft_transfer_cache
   - DAO1 legacy-tree / APTMDAO tree graph caches
   - TLN SmartNode-/Registry-Graph und Team-Slices

   Erfolgskriterien:
   - normaler Start zeigt vorhandene Daten sofort aus Cache; keine unnötige Voll-Discovery beim Login.
   - gleiche DB-/RPC-Abfrage mit gleichem Scope/Filter pro Lauf nicht mehrfach parallel.
   - neue Chain-Daten werden inkrementell nachgezogen; kein manueller "Beide Trees on-chain aktualisieren"-Schritt nötig.
   - aktuelle Bestandsanzeigen bleiben unabhängig von historischen Preis-/Lifecycle-/DID-Auflösungen.
   - Regressionstest DAO: Michaela 0x568281…fe4940 => DAO1 #21044, APTMDAO #7803, 9 Mining-Bots, 1 Trading-Bot.
   - bestehende fachliche Discovery-Regeln nicht ändern, solange das Audit keinen konkreten Fehler beweist.

   Offene fachfremde TODOs bleiben separat: projektbezogen Partner als inaktiv markieren;
   Dashboard/DAO "Registration APTMDAO offen"; Membership-Ablaufdatum erst nach verifizierter on-chain Quelle.

   Build 20260921-134840. */


/* Phase 5.75 · 21.09.2026 14:13:07 CEST
   Cache-/Request-Audit und erste Startoptimierung umgesetzt.

   Neu:
   - Zentraler Session-Request-Audit misst fetch-basierte Supabase-/RPC-/API-Aufrufe mit Request-Signatur,
     Scope/Filter, Aufrufer, Dauer, HTTP-Status und Response-Grösse/Content-Range. Login, Tab-Wechsel und
     manuelle/automatische Refresh-Läufe erhalten Marker. Audit ist im Admin-Systemtab sichtbar und exportierbar.
   - Normaler Seitenstart startet kein loadAll({automatic:true}) mehr. Vorhandene Cache-Daten werden angezeigt;
     ein fälliger Refresh wird nur signalisiert und muss bewusst ausgelöst werden.
   - TLN/VOW-Dashboard-Summary initialisiert das komplette Discovery-Modul nicht mehr beim Login. Bis der
     TLN/VOW-Bereich geöffnet wurde, bleibt der bereits persistierte Dashboard-Summary-Cache maßgeblich.
   - Zentrale NFT-Registry lädt beim Start weiterhin Current State + project_nft_ownership, aber die globale
     apertum_nft_transfer_cache-Auswertung für frühesten Erwerb sowie Kaufpreis-History startet erst im NFT-Tab.
     Current State wird dort sofort gerendert; historische Aufbereitung läuft danach separat.
   - DAO1 nutzt beim Dashboard/Initialload die zentrale NFT-/Ownership-RAM-Registry, statt dieselben Daten direkt
     erneut aus Supabase zu laden. DAO-Transaktions-/Asset-Flow-Historie wird nicht mehr pauschal in refreshConfig
     vorgeladen; sie bleibt Untertab-spezifisch. Historische NFT-Metadaten laufen nachgelagert.
   - Gleichzeitige identische DAO1-/APTMDAO-Tree-Scans werden über In-Flight-Promises zusammengeführt; auch
     Dashboard-Projekt-Summary-Läufe der Hauptseite sind innerhalb eines laufenden Requests dedupliziert.

   Unverändert:
   - Keine Fachregel zu Staking, Rewards, Referral, DAO1/APTMDAO-DID/Bot-Zuordnung oder Kaufpreis geändert.
   - Current State und History bleiben fachlich getrennt.
   - Test-HTML-Dateien bleiben unverändert und werden von der produktiven index.html nicht geladen.

   Nächster Prüfschritt nach Deployment:
   - Einen echten Warm-Start sowie Wechsel Dashboard -> NFT -> DAO1 -> TLN/VOW -> Dashboard messen und
     Audit exportieren. Danach verbleibende Mehrfachsignaturen anhand echter Dauer/Scope priorisieren.
   - DAO-Reward-Summary-Aggregation und weitere globale Shared-Loads erst nach Messbeleg umbauen.
   - Regression DAO nach Deployment prüfen: Michaela 0x568281…fe4940 => DAO1 #21044, APTMDAO #7803,
     9 Mining-Bots, 1 Trading-Bot. Die Bestands-/Klassifikationslogik wurde in diesem Release nicht verändert.

   Build 20260921-141307. */


/* Phase 5.76 · 21.09.2026 16:25:41 CEST
   Request-Audit Hotfix: Systemübersicht DATA_VERSIONS gegen Feedbackloop abgesichert.
   - refreshAdminSystemDataVersions nutzt eine gemeinsame In-Flight-Promise und 30-s-Session-Reuse.
   - DAO1 legacy-tree und aptmdao-tree werden vor dem Status-Update zu einem einzigen dao-team-Stand aggregiert;
     damit toggeln zwei Cache-Zeilen nicht mehr denselben Status-Key gegeneinander.
   - renderAdminSystemOverview kann dadurch Status-Events verarbeiten, ohne rekursiv neue Supabase-Reads zu erzeugen.
   - Fachlogik und Current-State/History-Trennung unverändert.
   Nächster Messlauf erst mit zurückgesetztem Audit nach Deployment. Build 20260921-162541. */


/* Phase 5.77 · 21.09.2026 17:08:17 CEST
   Cache-/Request-Audit – Optimierungsrunde 1 umgesetzt:
   - DAO1: project_transactions und project_transaction_asset_flows werden pro Wallet in der Browser-Session geteilt; Bot-Claims/Referral-Rewards laden dieselbe Historie nicht erneut.
   - DAO Team: dao_partner_bot_scan_state wird für Partner gebündelt vorgeladen; identische laufende Partner-Refreshs werden pro Wallet dedupliziert. Fachliche Bot-/DID-Regeln unverändert.
   - TLN/VOW: aktuelle Token-Prüfung über Multicall3 (Fallback auf bisherige Einzelcalls); Team-Persistent-Cache erst beim Team-Tab; 31.12.-Snapshotbewertung nicht beim normalen Projekt-Einstieg; kein automatisches LP-History-Rendering beim Haupttab.
   - Current State und History bleiben getrennt.
   Regression: Michaela 0x568281…fe4940 weiterhin DAO1 #21044, APTMDAO #7803, 9 Mining-Bots, 1 Trading-Bot.
   Nächster Schritt: Messlauf gegen 5.76-Baseline; keine weiteren fachlichen Umbauten vor Messergebnis. Build 20260921-170817. */

/* Phase 5.78 · 21.09.2026 17:29:35 CEST
   Cache-/Request-Audit – Optimierungsrunde 2 umgesetzt:
   - TLN/VOW: Noch unbekannte Wallets werden für aktuelle Projekt-Token in einem einzigen Multicall über alle Wallet/Token-Kombinationen geprüft; sicherer Einzelcall-Fallback bleibt bestehen.
   - TLN/VOW: verified-discovery-results aller eigenen Wallets werden im Projekt-Einstieg per einem Supabase-Batch geladen und als Session-Cache bereitgestellt; gleiche technische Cache-Reads sind in-flight/session dedupliziert.
   - TLN/VOW: Referral-Token-Decmals werden zuerst aus vorhandenen DB-Metadaten gelesen; RPC nur noch bei fehlender DB-Angabe. Der normale TLN-Haupttab lädt nur den gespeicherten Preis-Snapshot; DEX-Konfiguration/Provider/Live-Preislogik starten erst beim Untertab „Kurse und Pools“. Provider verwenden bekannte statische Chain-IDs statt zusätzlicher Netzwerk-Erkennung.
   - DAO Team: aktueller Partner-NFT-/Bot-Bestand je Wallet+Contract wird als öffentlicher abgeleiteter Current-State-Cache 24h in IndexedDB wiederverwendet. Historische Erwerbs-/DID-/Kaufpreisprüfung bleibt davon getrennt und blockgenau.
   - Navigation: ein Benutzerklick ist für den sichtbaren Active-State der jeweiligen Haupt-/Kontext-/Projekt-/Admin-Button-Gruppe autoritativ; genau der gewählte Tab bleibt markiert.
   - Keine Fachregel zu Staking, Rewards, Referral oder DAO1/APTMDAO-Zuordnung geändert. Regression Michaela bleibt verpflichtend: DAO1 #21044, APTMDAO #7803, 9 Mining-Bots, 1 Trading-Bot.
   Nächster Schritt: Messlauf TLN/VOW Haupttab sowie DAO-Team Warm-Reload; danach verbleibende Requests bewerten. Build 20260921-172935. */


/* Phase 5.79 · 21.09.2026 17:57:25 CEST
   DAO-Team-UI vereinfacht und Dokumentation konsolidiert:
   - Normale User-Oberfläche besitzt nur noch eine Ansicht „DAO Team“.
   - Tabs „Partner nach Wallet“, „DAO1 (alt) · Diagnose“ und „APTMDAO (neu) · Diagnose“ entfernt.
   - Wallet-zentrierter Team-Baum (1 Wallet = 1 Partner) ist direkt Bestandteil der DAO-Team-Hauptmaske.
   - DAO1-alt/APTMDAO-neu bleiben intern getrennte on-chain Graphen und persistente Cache-/Nachweisquellen; technische Diagnose nur DEV/Admin.
   - Systemübersicht, allgemeine Hilfe und DAO1-Hilfe auf denselben Zielzustand geprüft/aktualisiert.
   Build 20260921-175725. */


/* Phase 5.80 · 21.09.2026 18:15:39 CEST
   Projektbereinigung / Statusaudit nach Cache-Optimierung:
   - Systemübersicht + Request-Audit als umgesetzt markiert; laufende Pflege bleibt Release-Regel.
   - Veralteten „Nächster Ausbau: Request-Audit“-Status entfernt; gemessene Ergebnisse aus 5.76–5.78 dokumentiert.
   - Browser-Cache/DATA_VERSIONS bleibt als bereichsweiser Architektur-Ausbau offen, aber nicht mehr als pauschaler „nächster Schritt“.
   - Kleine technische Bereinigung: TLN/VOW Preis-Snapshot-Read wird kurzzeitig in-flight/session wiederverwendet, damit App-Start und direktes Öffnen des Projekts denselben Supabase-Snapshot nicht unmittelbar doppelt lesen.
   - Keine Fachlogik zu DAO/TLN/Loans/Staking/Rewards geändert. Loans bewusst zurückgestellt.
   Build 20260921-181539. */

/* Phase 5.81 · 21.09.2026 23:36:49 CEST
   Vollständige Einzel-Wallet-Löschung:
   - wallet-private Aktion wallet_delete ruft eine transaktionale, usergebundene DB-RPC auf.
   - Walletbezogene Snapshot-/31.12.-/Projekt-/History-/LP-/Staking-/Discovery-/Gebühren-/NFT-/Scan-/Refresh-Daten werden vollständig entfernt.
   - __all-Stichtags-Coverage und nicht eindeutig root-gebundene DAO-Partner-Lifecycle-/Scan-Caches werden invalidiert und aus verbleibenden Wallets neu aufgebaut.
   - Leere Snapshot-Hüllen werden entfernt; nach erfolgreicher Löschung erzwingt die App einen Reload, damit Summen ausschließlich aus verbleibenden Quelldaten entstehen.
   - Globale On-Chain-/Registry-/Token-/Contract-Fakten bleiben erhalten.
   - Phase 5.94: Userweite Funktion „Alle WalletTracking-Daten löschen“ umgesetzt. Sämtliche userbezogenen public-Datensätze werden transaktional entfernt; globale öffentliche Fakten bleiben erhalten und User-Provenienz in created_by/updated_by wird anonymisiert. Lokale Browserdaten werden danach gelöscht. Normale User werden abgemeldet; Admin-Testuser behalten ausschließlich die Supabase-Auth-Session, damit wiederholte Lifecycle-Tests ohne neuen Magic Link möglich sind. Auth-Login bleibt bewusst bestehen.
   Build 20260921-233649. */


/* Phase 5.94 · 22.09.2026 14:03:48 CEST
   Vollständige Userdaten-Löschung:
   - Neuer Bereich „Support & Info → Daten & Konto“ mit zweistufiger Sicherheitsbestätigung (LÖSCHEN + „Sind Sie sicher?“).
   - SQL 073 stellt wallettracking_delete_all_user_data() bereit. Zuerst werden vorhandene Wallets über die vollständige Wallet-Purge-Logik entfernt; danach werden alle verbleibenden public-Tabellenzeilen mit user_id des angemeldeten Users generisch und transaktional gelöscht.
   - created_by/updated_by-Verweise des Users in globalen öffentlichen Cache-/Registry-Daten werden auf NULL anonymisiert, ohne die globalen Fakten selbst zu löschen.
   - wallet-private stellt ausschließlich für den authentifizierten User die Aktion user_data_delete bereit.
   - Nach Erfolg: Supabase-Session abmelden, localStorage/sessionStorage und WalletTracking-IndexedDB entfernen.
   - Auth-Login bleibt bestehen; die Funktion löscht WalletTracking-Daten, nicht den Supabase-Auth-Account.
   Build 20260922-140348. */
// • Phase 6.88: 31.12.-Performance/BSC: TLN/VOW-Historienpreise verwenden auf BSC zuerst die deterministische Route aus Token-Kategorie/Referenzpools (VOW/USDT, Token/VOW, LP direkt). WalletPriceEngine bleibt nur Fallback fuer Sonderfaelle. Coverage zeigt deterministische Treffer/Fallbacks; Summary nennt fehlende historische Kurse mit Asset und Chain.
// • Phase 6.87: 31.12.-Performance/Apertum: neue Tabelle historical_dex_pair_state_cache speichert exakt verifizierte Reserve-/Sync-Zustaende und optional LP-TotalSupply pro Pair/Zielblock. Bei einem spaeteren Stichtag werden nur die Sync-/Transfer-Logs seit dem letzten gecachten Zielblock nachgezogen; kein alter Preis wird uebernommen. Migration 080 erforderlich. DAO1-Staking weiterhin: code-seitig verifiziert, reale Regression offen.
// • Phase 6.89: Fehlende historische 31.12.-Preise werden nicht automatisch mit Sonderlogik ergänzt. Die Summary zeigt eine konkrete Token-Prüfaufgabe und verlinkt je Asset in die passende Token-Verwaltung. Erst Klassifikation (relevant/sicher vs. Spam/Legacy) klären, danach bei Bedarf Preisquelle ergänzen.

// Phase 6.90: Preisresolver fuer eigene sichere Token geschlossen: Contract-basierte DEX-/CoinGecko-Aufloesung ohne manuelle CoinGecko-ID; verifizierte LP-Token erhalten einen LP-Unit-Preis aus Underlying-Reserven und TotalSupply.
