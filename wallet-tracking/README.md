# WalletTracking · Phase 7.52


## Update 7.52
Kurse: zwei Tabellen bei ausreichender Bereichsbreite, sonst eine gemeinsame Tabelle; Contract-Adressen kleiner auf zweiter Zeile. Container-Query ab 1400 px Innenbreite; bei weniger Platz gleiche Spalten in einer gemeinsamen Tabelle. Adressen gekürzt und kopierbar. Chain-/Tokensortierung, Preisquellen, Filter und Ladezeitpunkte bleiben. Kein neues SQL/Edge-Deployment. Zu testen: Safari/Brave, breite/schmale Fenster, Navigation ein-/ausgeklappt, Hell/Dunkel, Adresskopieren. Browser-Retest offen.

## Update 7.51
Aktuelle Kurse in einer gemeinsamen Tabelle mit einem Tabellenkopf und durchgehend ausgerichteten Spalten. Volle Breite und horizontaler Scroll bleiben. Sortierung nach zentraler Chain-Reihenfolge, innerhalb der Chain nach Tokenname. Filter, Kursquellen und Datenabrufe unverändert. Kein neues SQL/Edge-Deployment. Zu testen: Safari/Brave, breite/schmale Fenster, Navigation ein-/ausgeklappt, Hell/Dunkel.

## Update 7.50
Aktuelle Kurse über volle Dashboard-Breite; Tabellenaufteilung nach verfügbarer Breite, horizontaler Scroll bei schmalen Ansichten. Preislogik und Datenabrufe unverändert. Kein neues SQL/Edge-Deployment. Zu testen: Safari/Brave, schmale/breite Fenster, Navigation ein-/ausgeklappt, Hell/Dunkel.

## Update 7.49
Namen in „Was muss ich tun?“ sind ausschließlich zusätzliche Angaben: TLN-IDs und andere Kennungen bleiben erhalten. Besitzer und gespeicherter Partneralias werden dedupliziert ergänzt, einschließlich Token-/Bestandschecks, Miner-Nachzahlungen und Partner-Stakings. Userbezogener Alias-RAM lazy beim ersten Dashboard mit Aufgaben, ein deduplizierter wallet-private-Read; nach Alias-Save erneuert. Keine RPC-/Team-Discovery für Namen; TLN/DAO/APTMDAO-Namensräume bleiben getrennt.

Legacy-LPT auf BSC: vorhandene deaktivierte historical_only-Stammdaten werden zur Klassifikation gelesen, nicht für neue Balance-/Discovery-Scans aktiviert. Die vorhandene Cross-Chain-Formel ist historisch. Aktueller verifizierter Projektpreis wird weitergegeben; ohne diesen bleibt der Preis offen mit Erklärung. Historische Bewertung und BSC-Dust-DEX-Kurs werden nicht als aktueller Wert übernommen. Aktueller Rücktausch-/Bewertungsnachweis bleibt offen.

Installation: geänderte Webdateien übernehmen, veröffentlichen und neu laden. Kein zusätzliches SQL/Edge-Deployment. SQL 091 aus 7.48 bleibt Voraussetzung für die Bot-Claim-Entscheidungen.

Zu testen: zusätzliche Namen bei erhaltenen TLN-IDs 17265/11674/11283; Besitzer+Partner zugleich; fehlende Namen/Sonderzeichen; gleiche TLN-/DAO-ID; Walletfilter, Aliasänderung und Userwechsel. LPT-Hinweis nach Preisrefresh, keine historische/Dust-Preisübernahme. Wallet hinzufügen/löschen, sämtliche Daten löschen und Account-/Admin-Negativtest; Restore zurückgestellt. Lokale Regressionen bestanden, produktiver Retest offen.


Separate wAPTM-Nachzahlungen: positiver Eingang nur vom Sender `0x6d0539de11b95e18cb202a55098e3854b0313022` und Tokencontract `0x110ac02ba3384bc055c13a87766049a74517beda`. Je Wallet bestätigen/ignorieren, nur aktuell angezeigte TXs. Offen unter „Was muss ich tun?“ und Bot-Claims mit Datum/Betrag/TX. Bestätigt unter NFT „Nicht zugeordnet“ und in Claim-/Dashboard-Summen; ignorierte und offene Zahlungen zählen nicht. Keine vermutete Einzelbot-ID.

**Installation 7.48:** Zuerst `sql/091-dao-bot-claim-reviews.sql` im Supabase SQL Editor komplett ausführen (**13 Statements in Reihenfolge**, BEGIN/COMMIT, keine SELECT-Resultsets). Danach geänderte Webdateien veröffentlichen, Seite neu laden und Daten aktualisieren. Kein neues Edge-Deployment. `apertum-rpc-proxy` aus 7.46 bleibt Voraussetzung für die DID-Korrektur.

Entscheidungen gespeichert in `dao_bot_claim_reviews`, je User/Wallet/TX, FK auf vorhandene Transaktion, RLS auth.uid(), kein anon-Zugriff, keine Klartext-Walletadresse/-namen. Löschung via bestehende Transaktions-/Auth-Cascades; Blockchain-Daten bleiben unverändert. Erstread je User-/Wallet-Scope, erneuter cache-only Read beim Claims-/Referral-Öffnen und Dashboard-Summary. Kein zusätzlicher Explorer-/RPC-Scan; neue Zahlungen über vorhandenen Tages-/manuellen Delta-Sync.

**Zu testen 7.48:** Bestätigen/ignorieren je Wallet, Abbrechen, neue TX nach Bestätigung, Reload, Nicht zugeordnet, Claim-/Dashboard-Summen und Personenfilter; Wallet hinzufügen/löschen, sämtliche Daten löschen, Kontolöschung und Admin-Sperre. Lokale Regressionen bestanden; produktiver Supabase-/RLS-/Cascade-Test offen. Restore-Test zurückgestellt.

Entdecken startet mit Alle Wallets. Scans und Sperren bleiben walletbezogen. Die Sammelaktion markiert alle offenen entdeckten Tokens als Spam, auch ohne Verdacht; bereits sichere Tokens bleiben ausgeschlossen. Anzahl dedupliziert je Chain/Adresse, Speicherung je Wallet. Einzelaktion Als sicher hinzufügen bleibt erhalten. 7.47 ersetzt die sichere Sammelaktion aus 7.46.

DAO1/APTMDAO: aktuelle DID-Partnerbesitzer getrennt über ownerOf(latest), maximal vier parallele Aufrufe pro System und fünf Minuten RAM-Cache. Mint-Wallet und Parent bleiben unverändert im historischen Graph-Cache. Aktuelle Details, Bots und Partnerzahlen verwenden den aktuellen Owner; bei Fehlern bleibt dieser offen.

Installation 7.47: geänderte Dateien übernehmen und veröffentlichen, Seite neu laden. Kein zusätzliches Edge-Deployment. Voraussetzung aus 7.46: **supabase/functions/apertum-rpc-proxy/index.ts deployen**, falls noch nicht erledigt. Keine SQL-Migration, keine Wallet löschen/neu hinzufügen, keine historischen Graph-Caches leeren. Danach Seite neu laden und Daten aktualisieren. Ohne neuen Proxy kann die Legacy-Besitzerprüfung nicht laufen.

Zu testen: Entdecken Alle/Einzelwallet, gemischte Scan-Sperren, Chainfilter, Spam-Sammelaktionen und einzelne sichere Freigabe; Monica DAO1 #21044 → Carmen #18438 auf 0x568281…fe4940, APTMDAO #7803 → Chris #7315; 9 Mining-Bots und 1 Trading-Bot getrennt zugeordnet; Besitzerwechsel/RPC-Fehler. Wallet hinzufügen/löschen, sämtliche Daten löschen, normale Kontolöschung und Admin-Negativtest bleiben Teil des End-to-End-Audits. Restore-Test zurückgestellt.

7.48: Separate wAPTM-Auszahlungen werden manuell bestätigt. Company-Absender und einzelne Bot-Zuordnung bleiben extern unbestätigt; gewöhnliche Token-Transfers werden nicht ungeprüft gezählt.

Dokumentation: Admin → Systemübersicht, Audit, Dokumentation, Ideen/Umbau; allgemeine und DAO1-Hilfe; docs/releases/CHANGELOG.md. Historische SQL-Migrationen erhalten.

## Erwerb ohne Zahlung
„Mint ohne Zahlung in dieser TX“ bedeutet: erfolgreicher ERC-721-Mint dieses Bots an die Erwerbswallet, vollständige Token-/Internal-Transferlisten und TX-Details, kein positiver ERC-20- oder nativer Zahlungsfluss in dieser TX. Gas ist kein Kaufpreis. Frühere oder externe Zahlungen bleiben möglich; Kaufpreis bleibt nicht ermittelt, niemals automatisch 0. Bei Abruffehlern oder unvollständigen Daten bleibt die Prüfung offen.

NFT zeigt den Hinweis beim Erwerb, DAO-Baum/Bot-Tabelle in Erwerbsart. Kaufpreis bleibt „nicht ermittelt“. Gefundene historische Zahlungen und Upgrade-Kaufpreise haben Vorrang. Same-TX-Abschluss wird separat als sameTxPaymentCheckComplete / mintWithoutPayment gespeichert; checked bleibt der Kaufpreisnachweis. Keine NFTs/Tx-IDs werden hardcodiert. Positive Zahlungen von Dritten verhindern ebenfalls die Negativklassifizierung. Strikte Transferpagination bricht bei Limit oder fehlendem items-Array ab; Fehlerantworten aus toleranten Claim-Caches werden nicht für den Abschlussnachweis benutzt. Fehlende/ungültige Beträge und fehlende TX-Erfolgsdaten bleiben unvollständig.

Resolver-Versionen: reguläre NFTs 4, Upgrade-NFTs 6. Bestehende zentrale Nachweise werden einmal neu geprüft; kein permanenter Scan beim NFT-Öffnen. Speicherung weiter im privaten NFT-Cache, keine neue Tabelle. Keine globale Schema-/Grant-Änderung.

## Verifikation
Lokale Regression mit screenshot-abgeleiteten synthetischen Daten für #15541/#15542 und #120469/#120470; Zahlungen, unbekannte Werte, fehlerhafte/abgebrochene Pagination, fehlende Internals/TX-Details, NFT-/DAO-Darstellung und Trennung vom Kaufpreis. Bestehende Regressionen und JS-Syntax geprüft. Produktive API-Roundtrips hier nicht geprüft.

Produktiver Test: nach Veröffentlichung neu laden, Daten aktualisieren, die vier Bots unter NFT und im DAO-Detail prüfen. Erwartet: „Mint ohne Zahlung in dieser TX“ bei vollständigem Abruf, Kaufpreis nicht ermittelt, Erwerbs-TX weiterhin verlinkt. Vorhandene Kaufpreise müssen erhalten bleiben. Fehler bleiben offen, niemals als gratis klassifiziert.

## Noch offen
- Übrige ungeklärte Bot-Kaufpreise anhand eigener Erwerbs-TX prüfen; separate Zahlung nicht heuristisch zuordnen.
- Externe Metadaten #120469 fehlen (404 produktiv bestätigt, technische Behandlung funktioniert).
- Vollständiger Konto-Löschtest samt Admin-Negativtest und Neu-/Alt-Wallet-Importvergleich noch nicht abschließend belegt.
- Monica: Trading-Bot im alten DAO1-Zweig separat kontrollieren.
- Legacy-Claim #10294 ohne Auszahlung: niedrige Priorität.
- Restore-Test weiter zurückgestellt; Backup und Master-Key gesichert.

## Dokumentation
Diese README.md wird künftig aktualisiert. Ältere README-7.xx.md sind Release-Historie und für die App nicht erforderlich. SQL-/Baseline-Dokumentation in sql/ und technische Dokumentation in docs/ bleiben separat erhalten. Nutzerhilfe und Systemübersicht stehen in der App.
