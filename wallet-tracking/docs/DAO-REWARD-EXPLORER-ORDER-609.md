# DAO Reward-Import – Prüfung der Explorer-Seitenreihenfolge

Stand: 2026-11-02, Version 6.09.

Der unveröffentlichte `dao-reward-refresh`-Worker prüft jetzt, dass alle von Blockscout gelieferten Blockchain-Blocknummern innerhalb einer Seite und über Seitengrenzen hinweg absteigend sortiert sind. Die älteste Blocknummer einer vollständig geschriebenen Seite wird mit dem Seiten-Checkpoint gespeichert. Beim Wiederanlauf wird diese Grenze erneut geprüft. Ein leerer Datensatz mit trotzdem vorhandenem `next_page_params` wird als Fehler behandelt.

Die Prüfung verhindert, dass bei offensichtlich inkonsistenten Seiten der Server-Rohdaten-Cursor als verifiziert abgeschlossen wird. Sie ist **keine** Garantie einer lückenlosen, gegen Explorer-Reorgs oder verspätetes Indexing abgesicherten Blockchain-Historie und ersetzt keine echten Blockfenster / unabhängigen RPC-Abgleich. Der Worker bleibt nicht produktiv aktivierbar, da Claim-/Referral-Anreicherung und historische Bewertung noch fehlen.

Es gibt keine Datenbankmigration. Bereits vorhandene Checkpoints ohne `oldestBlock` werden weiter gelesen; bei ihnen beginnt die zusätzliche Reihenfolgeprüfung erst mit der ersten neu eingelesenen Seite.

Tests: `node --test tests/dao-reward-explorer-order-609.test.mjs`.
