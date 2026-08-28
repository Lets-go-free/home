
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
