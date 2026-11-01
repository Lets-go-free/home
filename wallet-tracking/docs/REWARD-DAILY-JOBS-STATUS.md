# Reward-Worker – Status 6.09

## Technischer Zwischenstand

- Der DAO-Worker importiert nur rohe Transaktionen und ERC-20-Flows.
- Nach einem vollständigen Rohimport ist der Queue-Status `staged`, **nicht** `completed`.
- Der Status `completed` ist ausschliesslich für vollständig klassifizierte und verifizierte Rewards reserviert.
- Die bestehenden Browser-Scan-Cursor werden vom Worker nicht verändert.
- Die fachlich zwingende native APTM-/Internal-Transaction-Erkennung, NFT-Zuordnung und historische Preisbewertung sind serverseitig noch nicht implementiert.
- `dao-reward-refresh` und `tln-vow-reward-refresh` **nicht produktiv deployen oder per Cron starten**.

## Installation

SQL-Migration nach Einspielen des ZIP im Supabase SQL Editor ausführen. Die SQL-Datei enthält DDL und die Definition einer Funktion; keine SELECT-Abfragen/Resultsets. Die Funktion ist nur für `service_role` ausführbar.

## Akzeptanzkriterien vor Aktivierung

1. Claim-Kandidaten: Legacy `0x86bb8f37`, neuer Miner `0x19da4078`.
2. tatsächliche ERC-20- und native APTM-Auszahlungen verifizieren, einschliesslich interner Miner-Transfers.
3. NFT-/Bot-Zuordnung aus Wallet-spezifischem persistentem Cache und historischer Ownership.
4. DAO-Referral-Rewards anhand Contract und eingehendem Token-Flow, nicht Symbol.
5. historische Preisermittlung über applikationsweit einheitliche Preisquelle.
6. mit bestehendem Browser-Resultat walletweise vergleichen, inklusive Monica 9 Mining + 1 Trading.
7. vollständige Wiederholbarkeit, fehlende Logs dürfen Cursor nicht als fachlich verarbeitet markieren.
8. erst danach Cron-Fenster DAO 04:05–05:30 und TLN 05:35–07:00 Europe/Zurich aktivieren.

## Blockscout-Schnittstelle / Verifikation

Der DAO-Staging-Worker prüft die Blocknummer jedes Transaktions-/ERC-20-Events.
Wenn ein Token-Transfer keine `block_number` liefert, muss die Blocknummer anhand
`/api/v2/transactions/{tx_hash}` nachgeladen werden. Transaktionsdetails werden
für wiederholte Hashes zwischengespeichert. Ein fehlender oder ungültiger Block
ist ein **Lauffehler**, kein Grund, den Scan-Cursor fortzuschreiben. Die
beiden Rohimport-Cursor bleiben getrennt von den kanonischen Reward-Cursorn.

**Produktivfreigabe unverändert ausstehend:** vollständige NFT-/Bot-Claim-
Zuordnung, native Auszahlungen, Preisbewertung und TLN/VOW-Reward-Worker.
Die Edge Function und Reward-Crons nicht aktivieren.

## Folgeprüfung: native Betragspräzision

Blockscout-v2-Felder `transaction.value` und `transaction.fee.value` werden
als **Wei-Ganzzahlstrings** interpretiert und vor Speicherung mit BigInt in
exakte APTM-Dezimalstrings umgerechnet. Keine Umrechnung grosser Wei-Zahlen
über JavaScript `Number` (Rundungsgefahr). Fehlerhafte bzw. bereits als
Dezimalbetrag gelieferte Werte führen absichtlich zu einem Scan-Fehler.
Automatischer Regressionstest: `tests/dao-reward-wei-precision.test.mjs`.

Dies ist eine Korrektur am Rohimport, **keine** Fertigstellung der DAO-Claims,
der NFT-Zuordnung oder des TLN/VOW-Reward-Jobs. Reward-Crons weiterhin aus.
