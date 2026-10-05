# Polygon-RPC-Vergleich · Diagnose für WalletTracking 7.35

Nur polygon-rpc-test.html ins vorhandene wallet-tracking-Verzeichnis kopieren. Die App-Dateien bleiben unverändert. Aufrufen: https://www.letsgofree.me/wallet-tracking/polygon-rpc-test.html

„Vergleich starten“ klicken. Währenddessen keine App-Aktualisierung ausführen. Danach die Ergebnistabelle als Screenshot oder den Ergebnistext senden. Die vorbelegte Wallet ist die Adresse aus dem gemeldeten Fehler; andere Wallets können eingegeben werden.

Pro Anbieter: Chain-ID (137), nativer POL-Bestand, kleiner Batch mit USDC-/USDT-Bestand. Maximal 9 RPC-HTTP-Anfragen; keine Wiederholungen. Timeout je Anfrage 15 Sekunden. Gleiche Anfragekörper an PublicNode mit bisherigem Zugangspfad, PublicNode ohne Pfad und dRPC. Keine Signaturen, Transaktionen oder Datenbankschreibzugriffe. Die vorhandene öffentlich ausgelieferte app.js wird gelesen, um den bereits verwendeten PublicNode-Pfad für den Vergleich wiederzuverwenden. Er wird nicht in der Ergebnisanzeige ausgegeben.

Der Test liest bei latest; Bestände können sich zwischen Anfragen verändern. Kein Test von Archive-Funktionen, vollständigen Stablecoin-Listen oder großen App-Batches. Erfolg belegt nur die getesteten aktuellen Reads zu diesem Zeitpunkt. Ein Browser-Netzwerkfehler kann auch CORS/Verbindungsprobleme bedeuten.

Die direkten Tests aus der Codex-Umgebung lieferten am 05.10.2026 bei allen drei Varianten für Chain-ID und nativen Bestand HTTP 403 mit gleichem Fehlertext „error code: 1010“. Das ist kein Beleg für denselben Fehler wie im User-Browser (529/Timeout). Deshalb diese Browser-Diagnose vor einer produktiven RPC-Umstellung.

Alternative laut offizieller Polygon-Dokumentation: https://docs.polygon.technology/pos/reference/rpc-endpoints/ → https://polygon.drpc.org

Nach Abschluss kann die Testdatei von der Website entfernt werden. Keine SQL-Migration, kein Edge-Deployment und keine neue App-Version erforderlich.
