# Quelle des globalen Stammdaten-Seeds

- Exportzeitpunkt: 04.10.2026 00:30:40 CEST
- Quelle: produktives, verknüpftes Supabase-Projekt
- Exportmodus: read-only
- Rohdump SHA-256: `040bcbc9b2af12eefeefbec768feaf51f32587b06d5980e45990b28fa3d62387`
- Finaler Seed SHA-256: `d802c7286f0702ba1173d3fef6351b53019afd4e89e21bec5ecb9c7c4acc5a9d`
- Allowlist vollständig: ja
- Fremde Tabellen im Dump: nein
- Fehlende Allowlist-Tabellen: keine

Der geprüfte Export enthielt genau die neun freigegebenen Tabellen. Die Transformation in `001-global-master-data.sql` ersetzt den nicht-idempotenten pg_dump-INSERT durch deterministische Upserts.
