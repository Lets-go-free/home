# Phase 2av – Cache-Versionierung + Admin-Dokumentation

Stand: 28.08.2026 20:00:17 CEST

## Migration
- **NEU: 019-cache-data-versioning.sql** – einmal nach 018 ausführen.
- **001–018 NICHT erneut ausführen**, wenn bereits erfolgreich ausgeführt.

## Änderungen
- Neuer Admin-Tab **📚 Dokumentation** mit verbindlichen Abläufen und Regeln.
- `wallet_refresh_state.data_version` verhindert, dass fachlich veraltete Caches wegen Tageslimit/Activity-Check übersprungen werden.
- Versionsprüfung steht vor Tageslimit und Activity-Check.
- Alte Cache-Daten werden nicht vorsorglich gelöscht; sie bleiben bis zum erfolgreichen Neuaufbau als Fallback.
- TLN/VOW BSC LP/Staking: Soll-Version **v6**, neuer Scan-Typ **`lp_history_v6_legacy_discovery`**. Dadurch wird bei bestehenden Wallets einmalig die vollständige Legacy-LP-Discovery neu initialisiert.
- Danach wieder inkrementelle Aktualisierung.

## Phase 2au – zentraler Refresh, Activity-Check, LP-Walletfilter und Spam-Entscheid (28.08.2026, 21:25:20 CEST)

- Zentraler Button **„Daten aktualisieren“**: pro Wallet sequentiell Bestände → TLN/VOW LP/Staking → NFTs. **Entdecken und Gebühren bleiben ausschließlich manuell.**
- Automatisch wird pro Wallet/Chain/Datentyp höchstens **1× pro lokalem Kalendertag geprüft**. Der Status liegt geräteübergreifend in `public.wallet_refresh_state`.
- EVM-Activity-Check: wenn der konfigurierte Discovery-Provider Alchemy ist, werden seit dem letzten Cursor native/ERC-20/ERC-721/ERC-1155-Aktivitäten geprüft. Nur vom User ausdrücklich als Spam bestätigte Token werden ignoriert. Ein bloßer System-**Spamverdacht** wird nicht automatisch als Spam behandelt.
- Wenn keine relevante Aktivität vorliegt, bleibt der vorhandene Datenstand bestehen; die UI zeigt dennoch **„geprüft … keine relevante Aktivität“**. Ohne sicheren Activity-Indexer wird vorsichtshalber normal aktualisiert.
- Neue Wallets haben noch keinen Refresh-State und werden deshalb beim nächsten automatischen Lauf vollständig berücksichtigt – unabhängig davon, ob andere Wallets heute schon geprüft wurden.
- Projekt-TLN/VOW: beim Öffnen wird BSC für noch nicht heute geprüfte Wallets automatisch nachgezogen; danach nur Cache. Manuelle Projekt-Aktualisierung bleibt jederzeit möglich. Nach BSC-LP/Staking-Refresh wird die Token-Übersicht ebenfalls neu berechnet.
- Liquidity Pools: neuer Walletfilter **Alle Wallets / einzelnes Wallet**. In der Auswahl erscheinen nur Wallets mit aktuellen oder historischen LP-/Staking-Positionen.
- Entdecken: Spam-Verdachte sind standardmäßig sichtbar. Pro Token entscheidet der User **Als sicher hinzufügen** oder **Als Spam markieren**. Zusätzlich gibt es **„Alle Spam-Verdachte als Spam markieren“**; bestätigter Spam ist standardmäßig ausgeblendet.
- Neuer sichtbarer Bereich **Datenstand pro Wallet** für Bestände, TLN/VOW LP/Staking und NFTs.

### Migrationen – aktueller Stand

- `001`–`016`: bestehende Migrationen; **nicht erneut ausführen**, wenn bereits produktiv ausgeführt.
- `017-bsc-tln-vow-staking.sql`: bestehende Staking-Migration; **nicht erneut ausführen**, falls bereits ausgeführt.
- **NEU: `018-wallet-refresh-state.sql` einmalig nach 017 ausführen.** Sie legt nur den geräteübergreifenden Refresh-/Activity-Status an.

> Phase 2au setzt den bestehenden Phase-2at-Code fort; insbesondere Legacy-LP-/Staking-Discovery und die bisherigen RPC-Revert-Fixes bleiben erhalten.

## Phase 2at – historische TLN/VOW-LP-/Staking-Discovery integriert (28.08.2026, 20:06:38 CEST)

- Die erfolgreich isoliert getestete Legacy-Discovery ist jetzt in die produktive BSC-TLN/VOW-LP-Logik integriert.
- BSC-LP-Historie wird nicht mehr nur gegen heute als `lp_token` klassifizierte LP-Adressen gesucht. Beim ersten neuen Discovery-Lauf werden die ERC-20-Transfers jeder BSC-Wallet betrachtet und über `token0()` / `token1()` als mögliche V2-LPs geprüft.
- Ein entdeckter V2-LP wird dem TLN/VOW-Projekt zugeordnet, wenn mindestens eines seiner Underlyings als aktivierter TLN/VOW-Projekt-Token in `predefined_tokens` geführt wird. Normale USDT/WBNB- oder andere Fremd-LPs werden dadurch nicht übernommen.
- Kandidaten werden zuerst nur leichtgewichtig über `token0()` / `token1()` geprüft. Erst bei Projekt-Treffer werden vollständige Pair-Daten (`getReserves`, `totalSupply`, `factory`, Metadaten) geladen.
- Bereits konfigurierte aktuelle LPs und bereits gecachte historische LPs bleiben ebenfalls Teil des Pair-Universums.
- Neuer Scan-Typ `lp_history_v5_legacy_discovery`: Bestehende BSC-Wallets werden dadurch einmal vollständig historisch neu geprüft; anschließend arbeitet der Scan wieder inkrementell mit Block-Overlap.
- Gefundene Legacy-LPs laufen durch dieselbe bekannte Staking-Contract-Klassifizierung und erscheinen damit als `Stake` / `Unstake` in Historie und Staking-Positionen.
- Legacy-Staking wird auch bei der 31.12.-Ermittlung berücksichtigt: Ein durch die TLN/VOW-Historie bestätigter LP gilt dafür als Projekt-LP, auch wenn seine LP-Adresse heute nicht mehr als `lp_token` geführt wird.
- Aktuell gestakte Legacy-LPs werden über den vorhandenen Positions-Cache weiterhin in den wirtschaftlichen Gesamtbestand bzw. die Token-Übersicht eingerechnet.
- **Keine neue SQL-Migration.** Falls `017-bsc-tln-vow-staking.sql` bereits ausgeführt wurde, **nicht erneut ausführen**.

## Phase 2as – LP-Wallet-Historie sichtbar und Scan-Status pro Wallet (28.08.2026, 19:20:37 CEST)

- Im Liquidity-Pools-Tab wird für jede Wallet mit Chain-Adresse ein eigener **LP-Scan-Status** angezeigt: Wallet, Chain, Adresse, Status, letzter Scan, letzter Block, Anzahl Historien-Ereignisse, historische Pools und Positionszeilen.
- Die Wallet-Liste für den LP-Scan hängt **nicht** vom aktuellen TLN/VOW-Tokenbestand ab. Auch Wallets mit heutigem Bestand 0 werden einbezogen.
- Existieren in `lp_history_events` historische LP-Ereignisse, aber kein `lp_position_cache` mehr, wird der Pool trotzdem als **„nur Historie“** mit aktuellem Bestand 0 angezeigt. Damit können alte LP-Wallets nicht allein wegen eines fehlenden Positions-Caches verschwinden.
- Der Scan-Status wird aus `project_scan_state` gelesen; dafür wurde lediglich die bestehende Engine-Lesefunktion erweitert. **Keine neue SQL-Migration**.
- Admin-Ideenstatus korrigiert: **TLN/VOW Liquidity Pools nach Chain getrennt** bleibt `in_progress`, weil ETH funktional noch nicht vollständig umgesetzt ist.
- Falls `017-bsc-tln-vow-staking.sql` bereits ausgeführt wurde, **nicht erneut ausführen**.


## Phase 2ar – LP-Ladepfad gehärtet (28.08.2026, 19:15:38 CEST)

- V2-Pool-Kernreads melden jetzt Pool-Adresse und konkrete Funktion (`token0`, `token1`, `getReserves`, `totalSupply`, `decimals`, `factory`) statt eines anonymen RPC-Reverts.
- `factory()`/Pooltyp-Erkennung enthält ebenfalls Contract-/Chain-Kontext.
- Ein einzelner defekter Pool bleibt auf seine Tabellenzeile begrenzt und stoppt die übrigen Pools nicht.
- Sind für TLN/VOW auf einer Chain keine `lp_token`-Pools konfiguriert, wird kein ungefilterter Wallet-ERC20-Vollscan ab Block 0 gestartet.
- Leere Pool-Konfiguration wird im UI ausdrücklich angezeigt.
- Keine neue SQL-Migration; `017` bleibt der aktuelle Migrationsstand.

# Phase 2aq – zusätzlicher execution-reverted-Fix

Stand: **28.08.2026, 19:12:53 Uhr CEST**

Zusätzliche Korrektur zu 2ao/2ap: In `projects/tln-vow/tln-vow.js` wurden ERC-20-Metadaten bisher gemeinsam über `Promise.all(name(), symbol(), decimals())` gelesen. Bei älteren oder projektspezifischen Token kann bereits ein optionales `name()` mit `execution reverted` antworten und dadurch die komplette TLN/VOW-Aktualisierung abbrechen.

Neu:
- `name()`, `symbol()` und `decimals()` werden einzeln und fehlertolerant gelesen;
- `name()`/`symbol()` sind optional und bekommen einen Anzeige-Fallback;
- `decimals()` verwendet im Fehlerfall 18 als Fallback;
- auch `pair.symbol()` ist nur noch optional;
- die eigentlichen LP-Kernreads (`token0`, `token1`, `getReserves`, `totalSupply`, `decimals`, `factory`) bleiben verbindlich.

**Keine neue SQL-Migration.** Falls `017-bsc-tln-vow-staking.sql` bereits ausgeführt wurde, nichts erneut ausführen.


## Phase 2ap – automatische Live-Aktualisierung 1× täglich

- Beim Login wird weiterhin zuerst der letzte automatisierte Supabase-Snapshot angezeigt.
- Eine automatische Live-Aktualisierung startet nur, wenn dieser Cache noch nicht vom aktuellen lokalen Kalendertag stammt.
- Ist heute bereits erfolgreich live aktualisiert worden, erfolgt beim erneuten Login keine weitere automatische Blockchain-Abfrage.
- Weitere Aktualisierungen am selben Tag erfolgen ausschließlich über „Jetzt live aktualisieren“.
- Der erfolgreiche manuelle Live-Lauf ersetzt ebenfalls den automatisierten Cache-Snapshot und gilt damit als heutiger Stand.
- Keine neue SQL-Migration erforderlich. Migrationen `001` bis `017` nicht erneut ausführen, sofern bereits erfolgt.

# Wallet Tracking

Stand: **28.08.2026, 19:09 Uhr (Europe/Paris)** · **Phase 2ap**

## Phase 2ao – RPC-Fix TLN/VOW BSC LP/Staking

Korrektur zu Phase 2an: Der LP-Engine war versehentlich für **alle** JSON-RPC-Aufrufe an `archiveRpc()` gekoppelt. Dadurch liefen auch aktuelle `balanceOf`, `token0`, `token1`, `getReserves`, `totalSupply` und `factory`-Reads über den Archive-Endpunkt. Bei einzelnen BSC-Contracts führte das zu `execution reverted`, obwohl die isolierte Testseite mit dem normalen BSC-RPC funktionierte.

Neu gilt:

- aktuelle LP-/Staking-Reads → normaler `public.chains.rpc_url` über `configuredRpcUrl()`;
- historische `eth_call`-Reads → Archive-/History-RPC;
- historisches `execution reverted` bei einem Block, an dem Pool/Contract noch nicht verfügbar war, wird als **historisch nicht verfügbar** behandelt und bricht den gesamten Lauf nicht ab.

**Keine neue SQL-Migration für Phase 2ao.** Falls `017-bsc-tln-vow-staking.sql` bereits ausgeführt wurde, **nicht erneut ausführen**.

---

# Wallet Tracking

Aktueller Stand: **28.08.2026, 18:39 Uhr CEST · Phase 2an**

## Wichtiger Migrationsstand

### Bereits vorhanden / nicht erneut ausführen

Die im Paket enthaltenen Migrationen `001` bis `016` gehören zum bisherigen Stand. Wenn sie in der produktiven Supabase-Datenbank bereits ausgeführt wurden, **nicht erneut ausführen**.

Insbesondere:

- `014-lp-history-cache.sql` – bestehender generischer LP/PCLP-Eventcache.
- `016-lp-position-cache.sql` – bestehender LP/PCLP-Positionscache.

### Neu auszuführen

- **`017-bsc-tln-vow-staking.sql`** – einmalig **nach 016** ausführen.

`017` erweitert die bestehende Architektur; es legt keine konkurrierende zweite LP-Historie an.

## Phase 2an – TLN/VOW BSC LP-Staking

### Korrektur der Aktionserkennung

Ein Transfer eines LP-Tokens an einen beliebigen Smart Contract ist **nicht automatisch ein Stake**.

Neue Reihenfolge:

1. LP-Mint + Token-Zufluss in den Pool → `Add Liquidity`.
2. LP-Burn + Token-Abfluss aus dem Pool → `Remove Liquidity`.
3. Normaler LP-Transfer an/von einer Gegenadresse, die in `defi_staking_contracts` mit `classify_transfers = true` bestätigt ist → `Stake` / `Unstake`.
4. Alle anderen normalen LP-Transfers → `Versenden` / `Empfangen`.

Damit wird auch der bekannte Fehlfall
`0xe6fdd9b8b742bb5aa07016a0b69c10e1defaa714394e8822ffe75e21482075e2`
nicht mehr aufgrund einer pauschalen Smart-Contract-Heuristik als Stake eingestuft.

### Staking-Contract-Katalog

`public.defi_staking_contracts` enthält verständliche Bezeichnungen für bekannte TLN/VOW-Ziele, u. a.:

- BTCB / VOW LP Staking
- VOW / v$ LP Staking
- VOW / USDT LP Staking
- USDC / v$ LP Staking
- vPound / vEuro LP Staking
- vEuro / VOW LP Staking
- vPound / VOW LP Staking
- PC LP VOW/v$ (Legacy)
- PC LP TLN+ (Legacy)
- Higher Value Stake (Legacy)
- Original LPT (Legacy)

Der gemeinsame `TLN Protocol Staking Reward (shared)`-Contract ist ebenfalls hinterlegt, aber bewusst **nicht** als automatische Stake-Gegenadresse aktiviert.

### Kein erfundener Lock-Zeitraum

Die frühere Testseite verwendete vorläufig 367 Tage. Phase 2an übernimmt diese Zahl **nicht** als feste Contract-Regel. Eine Lock-Dauer wird erst angezeigt, wenn `lock_days` im Contract-Katalog verifiziert hinterlegt wurde.

## Caching – aktueller Arbeitsstand

Das endgültige Abruf-/Cache-Konzept wird separat nochmals festgelegt. Phase 2an schafft dafür bereits eine saubere Basis:

- `defi_staking_contracts`: langlebige Konfiguration, pro Session aus Supabase lesbar.
- `lp_history_events`: unveränderliche LP-Chronologie mit `add`, `remove`, `send`, `receive`, `stake`, `unstake`.
- `project_scan_state`: inkrementeller Scanstand. Für TLN/VOW BSC wird neu `lp_history_v4_staking` verwendet; dadurch erfolgt einmalig ein sauberer Rückscan, danach wieder inkrementell mit Sicherheits-Overlap.
- `lp_position_cache`: trennt `current_wallet_lp` und `current_staked_lp`; `current_lp` bleibt der wirtschaftliche Gesamtbestand. Dasselbe gilt für den gespeicherten Stichtag.

### Wann Blockchain-Aufrufe erfolgen

Im TLN/VOW-Liquidity-Tab bleibt das vorhandene Prinzip erhalten:

- normales Öffnen → nur Supabase-Caches;
- `Daten aktualisieren` → Blockchain-/Explorer-Aufrufe, neue Historie und Positionen speichern.

## Sichtbare Integration

### TLN/VOW → Liquidity Pools → BSC

Neu sichtbar:

- LP in Wallet
- LP gestakt
- LP gesamt
- aktuelle Underlyings und USD-Wert auf Basis des wirtschaftlichen Gesamtbestands
- Stichtag: Wallet / gestakt / gesamt
- gemeinsame LP-/Staking-Historie mit Aktion und Gegenstelle
- separate BSC-Staking-Positionsliste mit Staking-Bezeichnung und Contract

### Normale Token-Übersicht

Nach einer Live-Aktualisierung werden gecachte offene TLN/VOW-BSC-Staking-PCLP zum Wallet-LP-Bestand addiert. In der Tokenzeile wird der gestakte Anteil separat ausgewiesen.

### Bestandesaufnahme per 31.12

Für TLN/VOW-BSC-LP-Token wird der historische Wallet-Bestand um die am Stichtag laut gecachter Stake-/Unstake-Historie noch offenen gestakten LP ergänzt. Die historische LP-Bewertung verwendet anschließend den wirtschaftlichen Gesamtbestand.

## Dateien

- `index.html` – App-Shell, Version Phase 2an.
- `js/app.js` – Integration in Token-Übersicht, Projekt-LP-Tab und 31.12.-Bestand.
- `js/lp-engine.js` – generische LP-Eventerkennung und LP-Bewertung.
- `js/staking-engine.js` – neue generische Staking-Klassifizierung / Lots.
- `projects/tln-vow/tln-vow.js` – bestehende TLN/VOW-Preis-/Poollogik unverändert als Projektmodul.
- `sql/017-bsc-tln-vow-staking.sql` – neue einmalige Migration.

> `tln-vow-lp-test.html` bleibt als frühere isolierte Testdatei im Paket. Maßgeblich für Phase 2an ist die integrierte Logik in `js/app.js`, `js/lp-engine.js` und `js/staking-engine.js`.
