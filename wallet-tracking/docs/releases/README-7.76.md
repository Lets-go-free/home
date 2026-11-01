# WalletTracking 7.76 · APTM historische Bewertung (Sicherheitskorrektur)

## Gültigkeit in der gesamten Anwendung
Die bestehende gemeinsame historische Preisfunktion `window.DAO1Project.historicalAptmPriceAtBlock(block)` wird bereits durch `taxHistoricalPrice("apertum","native",...,block)` der allgemeinen Wallet-/Stichtagsbewertung verwendet. Wrapped APTM (`wAPTM`) erbt dort die 1:1-Preisroute. DAO1-Transaktionen, Claims, Rewards und historische Bewertungen verwenden dieselbe Zielblock-Anchor-Funktion `ensureExactPriceAnchors` über `priceForTransaction` beziehungsweise `historicalAptmPriceAtBlock`. Es gibt keine neue zweite Bewertungsformel. Live-Kurse und 24h-Vergleiche bleiben weiterhin eigene Zeitpunkte derselben Poolroute; eine lückenlose Konsistenz aller bereits persistierten USD-Werte ist ohne produktive Nachbewertung nicht nachgewiesen.

## Änderungen
- Historienbereich in `loadCachedPrices()` wird vollständig in stabil sortierten 500er-Seiten geladen. Keine unbemerkte Supabase-Limit-Abschneidung mehr. Bei API-Fehlern wird die gesamte Abfrage verworfen statt ein Teilresultat als vollständig zu behandeln.
- Legacy-Predecessor-Pfad für leere Anker entfernt: ein alter nicht verifizierter Cachepreis darf kein exakter Zielblockpreis werden. Die Diagnosefunktion `revalidateNullCachedAnchors` nutzt nun zuerst historische Poolreserven, dann verifizierte Sync-Log-Suche. Bei Suchlimit wird kein neuer Anker erzeugt.
- `priceForTransaction` verwendet keine beliebige Historien-Vorgängerzeile mehr, wenn die exakte Zielblock-Anchor-Map fehlt. Fehlende Nachweise bleiben ohne Wert.
- Bestehende Daten, Preisanker und manuelle Preise werden **nicht** pauschal überschrieben. Keine SQL-Migration, kein Edge-Deployment.

## Offene fachliche Prüfung / nicht als gelöst markieren
- 1'863 vorhandene Anker, davon 20 ohne Preis: unabhängige On-Chain-Stichprobe der abweichenden Pool-State-Anker und Klärung von Prelaunch/Gaps.
- Vorhandene `parser_version=1`-Anker werden weiterhin gelesen. Die historische Korrektheit eines bestehenden Ankers ist damit **nicht** automatisch neu bestätigt. Erst nach On-Chain-Verifikation gezielte Korrektur und kontrollierte Nachbewertung der abhängigen Claims/Flows.
- APTM-Preishistorie mit 553'604 Reihen bleibt unverändert. Der bereits auf 46 MB optimierte Index bleibt unverändert. 46 MB freier Tabellenplatz werden vorerst nicht per VACUUM FULL freigegeben.
- Vollständige Integrationstests gegen Supabase/RPC und Cross-User-Regression stehen aus.

## Prüfung nach dem Einspielen
1. DAO1: historischer APTM-Preis einer bekannten Claim-TX gegenüber vorher kontrollieren; keine automatische Änderung manuell gesetzter Preise.
2. Historische Bewertung in Wallet-/Stichtagsansicht für denselben Apertum-Block kontrollieren; für `wAPTM` 1:1 derselbe APTM-Stückpreis.
3. DAO1 Claims/Rewards und Transaktionshistorie öffnen; Preisquellen und USD-Summen prüfen; vor allem fehlende historische Preise müssen explizit fehlend bleiben.
4. Sehr grosse Preisbereichs-Abfrage und Supabase-API-Fehler testen (kein still abgeschnittenes Ergebnis).
5. Anderen Benutzer, Reload, Monats-/Jahresende sowie Dashboard-Kursanzeige auf unverändertes Verhalten prüfen.

## Installation
Nur die im Update-ZIP enthaltenen Dateien ersetzen; keine SQL-Skripte. Auf dem Server veröffentlichen, dann Safari-Cache umgehen/neu laden. `APP_VERSION` und `BUILD_ID` auf der Startseite prüfen. Bestehende Datenbank nicht bereinigen.
