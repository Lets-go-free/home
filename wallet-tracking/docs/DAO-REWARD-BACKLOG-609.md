# DAO-Reward-Import: dauerhafte historische Prüfliste (6.09)

## Zweck

Der bisherige Worker begrenzte historische NFT-Besitzprüfungen auf 20 pro Lauf und brach dann die Verarbeitung ab. Neu werden eindeutige Kandidaten **vor** der Aktualisierung des Rohdaten-Cursors in `dao_reward_claim_candidates` als ausstehend gesichert. Ein späterer Worker-Aufruf kann 20 ausstehende Einträge prüfen, ohne die gesamte Blockchain-Historie erneut aufrollen zu müssen.

## Daten und Sicherheitsbedingungen

- Keine Änderungen an bestehenden Claim-Zuordnungen, historischen USD-Preisen oder Reward-Summaries.
- `ownership_verified` bedeutet **nur** historisch belegten NFT-Besitz, **nicht** einen vollständig validierten oder bezahlten Claim.
- `unverified` bedeutet keine bestätigte Zuordnung; die Ursache wird in `proof_reason` festgehalten. Solche Fälle müssen bei Bedarf gezielt nachgeprüft werden.
- Die Tabelle enthält nur IDs, Transaktionshash, NFT-Vertrag und NFT-ID, **keine entschlüsselten Wallet-Adressen**; Zugriff ausschliesslich für `service_role`.
- `ON CONFLICT DO NOTHING` verhindert Doppelanlage bei Wiederholung oder Überlappung. Bestehende Werte werden nicht überschrieben.
- Die beiden eigenen Rohdaten-Cursor `reward_server_raw_transactions_v1` und `reward_server_raw_flows_v1` bleiben getrennt von der Browser-Discovery.
- Kein automatischer Cron wird eingerichtet.

## Installation

Migration `20261102064018_dao_claim_candidate_backlog_609.sql` einmalig in Supabase ausführen. Das Update enthält den neuen Edge-Function-Code, dieser soll **noch nicht produktiv deployt** werden. Datenbank-Migration allein startet keinen Job.

## Noch offen

- Cursor-/Explorer-Historie in ausdrücklich begrenzten Blockintervallen nachholen (bei sehr grossen Erstimports ist die vorhandene Explorer-Paginierung weiterhin begrenzt).
- Vollständige Claim-Parameter-/Auszahlungsprüfung, historische Preise und verifizierte Zuordnung zu den Reward-Summaries.
- DAO-Referral-Klassifikation vervollständigen und vollständigen TLN/VOW-Worker entwickeln.
- End-to-End-Tests an der bestehenden Testkunden-Datenbank und anschliessend kontrollierte Cron-Aktivierung.
