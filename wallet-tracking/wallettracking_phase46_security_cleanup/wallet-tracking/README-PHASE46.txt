WalletTracking – Security Phase 46

Reihenfolge:

1) 046a komplett auf einmal ausführen (Without RLS).
   Genau 1 Resultset.
   Noch keine Klartextwerte werden gelöscht.

2) Neue wallet-tracking/projects/dao1/dao1.js deployen.
   DAO1 kurz testen: NFT-Bestand, Transaktionen, Claim-Ansicht, ggf. Scan.

3) Neue supabase/functions/wallet-private/index.ts deployen.
   wallet_list migriert ab jetzt Legacy-Wallets des jeweils angemeldeten Users automatisch.
   Keine fremden User-Daten werden gelesen oder zurückgegeben.

4) 046b komplett auf einmal ausführen (Without RLS).
   Genau 1 Resultset.
   DAO1-wallet_address wird genullt und durch restrictive RLS gegen Wiedereintrag geschützt.

5) 046c komplett auf einmal ausführen (Without RLS).
   Genau 1 Resultset.
   Nur aggregierter Reststatus der Wallet-Verschlüsselung.

Wichtig:
Die 5 Partner-Alias-Zeilen sind korrekt verschlüsselt. Der frühere 045-FAIL war nur ein
Audit-Namensfehler: die reale Spalte heißt reference_hash, nicht reference_hmac.
