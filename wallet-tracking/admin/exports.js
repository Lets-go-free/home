// Phase 7.55 · 09.10.2026 00:31:46 CEST: Projekt-Token aus der Dashboard-Kursübersicht ausblenden; standardmäßig sichtbar, weiterhin nur bei vorhandenem Projekt. Release-READMEs unter docs/releases archiviert; Usertests APTM-24h und Entdecken bestätigt. Build 20261009-003146.
// Phase 7.42 · 06.10.2026 13:54:49 CEST: Endgültige Kontolöschung mit serverseitiger Admin-Sperre; Datenreset erhält Adminrechte; neutrale Registrierungsmeldung. Build 20261006-135449.
// Phase 7.39 · 05.10.2026 17:43:04 CEST: Privater Datenbank-Backup-Helper inkl. Auth; Kauf-/Upgrade-Datum sichtbar. Build 20261005-174304.
// Phase 7.38 · 05.10.2026 16:38:37 CEST: Prelaunch-Claims getrennt von fehlenden USD-Preisen; Claim-Prüfpunkt niedrige Priorität; Backup-Dokumentation. Build 20261005-163837.
/* Phase 7.37: Admin-only master data export; shared UI and offline SQL formatter. */
(function(global){
  'use strict';
  const keys={chains:['chain_key'],defi_projects:['project_key'],defi_project_tokens:['project_key','chain_key','role','contract_address'],defi_staking_contracts:['project_key','chain_key','contract_address'],dex_configs:['chain_key','dex_key'],predefined_tokens:['chain','address'],project_nfts:['project_key','chain_key','nft_contract','nft_id'],tax_asset_prices:['tax_year','asset_code'],tax_fx_rates:['tax_year','from_currency','to_currency']};
  const ident=value=>'"'+String(value).replace(/"/g,'""')+'"';
  const literal=value=>"'"+String(value).replace(/'/g,"''")+"'";
  function validate(data){
    if(data?.format!=='wallettracking-master-data-v1'||!data.exported_at||!data.tables)throw Error('Unbekanntes Exportformat.');
    const names=Object.keys(data.tables);
    if(names.length!==Object.keys(keys).length||names.some(t=>!Object.hasOwn(keys,t)))throw Error('Unvollständiger Export oder nicht freigegebene Tabelle.');
    for(const [table,k] of Object.entries(keys)){
      const block=data.tables[table];
      if(!Array.isArray(block.columns)||!Array.isArray(block.rows)||block.count!==block.rows.length)throw Error(`Ungültige Daten: ${table}`);
      if(new Set(block.columns).size!==block.columns.length||!k.every(c=>block.columns.includes(c)))throw Error(`Ungültige Spalten: ${table}`);
      const seen=new Set();
      for(const row of block.rows){
        if(!row||typeof row!=='object'||Array.isArray(row)||k.some(c=>row[c]===null||row[c]===undefined))throw Error(`Fehlender Schlüssel: ${table}`);
        if(Object.keys(row).some(c=>!block.columns.includes(c)))throw Error(`Unbekannte Spalte: ${table}`);
        const id=JSON.stringify(k.map(c=>row[c]));if(seen.has(id))throw Error(`Doppelter Schlüssel: ${table}`);seen.add(id);
      }
    }
    return data;
  }
  function makeSql(data){
    validate(data);
    const out=[`-- WalletTracking Stammdaten ${data.exported_at}`, '-- Nur globale Stammdaten; kompatible Baseline erforderlich. Keine Löschungen.', 'BEGIN;', "SET LOCAL standard_conforming_strings = on;"];
    for(const [table,k] of Object.entries(keys)){
      const {columns,rows}=data.tables[table];
      if(!rows.length){out.push(`-- public.${table}: 0 Zeilen`);continue;}
      const sorted=[...rows].sort((a,b)=>JSON.stringify(k.map(c=>a[c])).localeCompare(JSON.stringify(k.map(c=>b[c]))));
      const updates=columns.filter(c=>!k.includes(c)&&c!=='id').map(c=>`${ident(c)} = EXCLUDED.${ident(c)}`);
      const cols=columns.map(ident).join(', ');
      out.push(`INSERT INTO public.${ident(table)} (${cols})\nSELECT ${cols} FROM jsonb_populate_recordset(NULL::public.${ident(table)}, ${literal(JSON.stringify(sorted))}::jsonb)\nON CONFLICT (${k.map(ident).join(', ')}) ${updates.length?'DO UPDATE SET '+updates.join(', '):'DO NOTHING'};`);
      if(columns.includes('id'))out.push(`DO $sequence$ DECLARE seq text; top_id bigint; BEGIN\nseq := pg_get_serial_sequence(${literal('public.'+table)}, 'id');\nIF seq IS NOT NULL THEN SELECT MAX(id) INTO top_id FROM public.${ident(table)}; IF top_id IS NOT NULL THEN EXECUTE format('SELECT setval(%L, greatest(%s, (SELECT last_value FROM %s)), true)', seq, top_id, seq); END IF; END IF;\nEND $sequence$;`);
    }
    out.push('COMMIT;');return out.join('\n\n')+'\n';
  }
  function download(name,text,type){
    const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function exportData(format){
    if(typeof isAdmin==='undefined'||!isAdmin)return;
    const status=document.getElementById('adminExportStatus');
    const buttons=document.querySelectorAll('[data-master-export]');buttons.forEach(b=>b.disabled=true);
    if(status)status.textContent='Stammdaten werden aus der Datenbank gelesen…';
    try{
      const {data,error}=await sb.rpc('wallettracking_export_master_data');
      if(error)throw Error(error.message+' (Migration 089 und Admin-Anmeldung prüfen.)');
      validate(data);
      const stamp=new Date(data.exported_at).toISOString().replace(/[-:]/g,'').replace('T','-').slice(0,15);
      download(`wt-master-data-${stamp}-UTC.${format}`,format==='sql'?makeSql(data):JSON.stringify(data,null,2),format==='sql'?'text/plain':'application/json');
      if(status)status.textContent='Export erstellt: '+Object.entries(data.tables).map(([t,b])=>`${t}: ${b.count}`).join(' · ')+'. Stand: '+new Date(data.exported_at).toLocaleString('de-CH')+'. JSON und SQL je Klick aus einem neuen Snapshot.';
    }catch(e){if(status)status.textContent='Export fehlgeschlagen: '+e.message;}
    finally{buttons.forEach(b=>b.disabled=false);}
  }
  function render(){return `<div class="custom-token-card"><h3>Export &amp; Wiederherstellung</h3>
<p>Aktuelle globale Stammdaten direkt aus der Datenbank exportieren. Jeder Klick liest alle neun freigegebenen Tabellen in einem konsistenten Snapshot. Keine Wallets, privaten Namen, Snapshots oder Caches. Exportdateien können Provider-URLs mit darin gespeicherten Schlüsseln enthalten: lokal aufbewahren und vor Aufnahme ins öffentliche Repository prüfen.</p>
<button type="button" data-master-export onclick="WTAdminExports.exportData('json')">Stammdaten als JSON</button>
<button type="button" data-master-export onclick="WTAdminExports.exportData('sql')">Stammdaten als SQL</button>
<p id="adminExportStatus" class="meta" role="status">Migration 089 erforderlich. Export erfolgt nur auf Klick; keine automatischen Exportjobs.</p>
<h4>Datenbank-Backup inklusive persönlicher Daten und Auth-Nutzer</h4>
<p><a class="button" href="./_wt-db-backup.command" download>Datenbank-Backup-Helper herunterladen</a></p>
<p>Im lokalen, bereits verknüpften <code>wallet-tracking</code>-Ordner speichern und per Doppelklick ausführen. OrbStack/Docker muss laufen. Der Browser lädt den Helper herunter; er führt keine Datenbankbefehle aus und erhält keine Datenbank-Zugangsdaten. Der Export ist read-only und umfasst alle Nutzer des Projekts.</p>
<p>Standardziel: <code>~/Documents/WalletTracking-Backups/&lt;Zeitstempel&gt;/</code> außerhalb von Git und Website. Enthalten: Anwendungsstruktur, Rollen, Daten aus <code>public</code> (Wallets, verschlüsselte Partnernamen, Snapshots/Caches/Stammdaten), <code>auth</code> (Nutzer, UUIDs, Passwort-Hashes, Login-Verknüpfungen), <code>storage</code> (nur Metadaten), <code>supabase_migrations</code> sowie eine Strukturreferenz für verwaltete Schemas. Der Helper prüft erwartete COPY-Abschnitte und SHA256-Prüfsummen und schreibt erst danach <code>BACKUP-COMPLETE.txt</code>. Fehler führen zu Teildateien ohne Erfolgsmarker. Ein Dump der Daten ist ein Snapshot; die separat erstellten Strukturdateien sind kein gemeinsamer Zeitpunkt-Snapshot.</p>
<p><strong>Zusätzlich separat sichern:</strong> den vorhandenen Edge-Secret-Wert <code>WALLET_ENCRYPTION_MASTER_KEY_V1</code> in einem geschützten Passwortmanager aufbewahren. Ohne exakt denselben Schlüssel sind verschlüsselte Walletdaten/Partnernamen trotz Datenbackup nicht lesbar. Keinen Ersatzschlüssel erzeugen. Der Helper exportiert keine Secrets. Falls der ursprüngliche Wert nicht mehr verfügbar ist, bleibt dieser Wiederherstellungspunkt offen. Ebenso Google-OAuth-/Redirect-Konfiguration, Edge-Secrets und gegebenenfalls tatsächlich verwendete Storage-Dateien separat sichern. Datenbankdaten ersetzen keine Plattformkonfiguration. Supabase-Vault-/Spaltenverschlüsselung kann zusätzlich den ursprünglichen Plattform-Schlüssel benötigen.</p>
<p>Den ganzen Backup-Ordner privat aufbewahren und auf ein zweites geschütztes Medium kopieren. Keine dieser Datendateien ins öffentliche Repository oder auf die Website laden. <code>managed-schema-reference.sql</code> dient der Prüfung und darf nicht blind über Supabase-verwaltete Schemas importiert werden. Restore-Test ist ausdrücklich zurückgestellt; der User hat die Backup-Schritte am 05.10.2026 als durchgeführt bestätigt; ein erfolgreicher Restore bleibt ungetestet.</p>
<h4>Datenbankstruktur sichern</h4><p>Für einen frischen vollständigen Struktur-Dump den <a href="./_wt-db-baseline.command" download>Baseline-Helper herunterladen</a>, im lokalen wallet-tracking-Ordner speichern und dort ausführen. Supabase CLI, verknüpftes Projekt und OrbStack/Docker sind erforderlich. Der Browser startet keine lokalen Programme. Der Helper liest Schema, Rollen und Migrationsliste; er verändert die Datenbank nicht. Alternativ: <a href="./_wt-db-seed-export.command" download>CLI-Stammdatenexport</a>.</p>
<h4>Wiederherstellung</h4><ol><li>Neue separate Supabase-Testumgebung vorbereiten. Die bestehende Produktion bleibt unangetastet.</li><li>Verifizierte Baseline unter sql/baseline/verified verwenden. Stand 04.10.2026; ältere Migrationen 074–083 sind darin bereits enthalten. Spätere Migrationen 084–093 in Reihenfolge prüfen/anwenden. Einen neu erzeugten Dump zuerst gegen den tatsächlichen Migrationsstand prüfen; bereits enthaltene Migrationen nicht blind nochmals ausführen. Rollen-Dump auf Zielumgebung prüfen.</li><li>Aktuellen SQL-Stammdatenexport in die kompatible Struktur einspielen. Er ergänzt/aktualisiert anhand stabiler Schlüssel; zusätzliche vorhandene Datensätze werden nicht gelöscht. JSON ist ein Kontroll-/Austauschformat, kein automatischer Import. Explizite IDs setzen eine leere bzw. kompatible Ziel-DB voraus.</li><li>Edge Functions, Secrets, Google-/E-Mail-Auth, Redirect-URLs und Storage separat einrichten. Private Daten und Auth-Nutzer benötigen eine separate geeignete Sicherung; Stammdatenexport und Baseline enthalten sie nicht.</li><li>Admin-Rechte mit passender Ziel-UUID prüfen, Exportvergleich durchführen und Login, Walletimport/-löschung, Aktualisierung und Michaela-Kontrollwallet testen.</li></ol>
<p><strong>Status:</strong> Eine vollständige Restore-Automatik und ein erfolgreicher Restore-Test sind noch nicht vorhanden. Fehlende historische SQL-Dateien werden nur aus nachweisbarer Git-Historie rekonstruiert; die vorhandene Baseline ist der technische Ausgangsstand. Alle vorhandenen Migrationen bleiben dauerhaft erhalten.</p>
<h4>Exportdateien ablegen</h4><div style="overflow-x:auto"><table><thead><tr><th>Export</th><th>Ablage relativ zu wallet-tracking/</th><th>Ins Repository?</th></tr></thead><tbody><tr><td>Geprüftes Stammdaten-SQL</td><td><code>sql/baseline/seeds/</code></td><td>Ja, nach Prüfung</td></tr><tr><td>Ungeprüfte JSON-/SQL-Exporte</td><td><code>_backups/stammdaten/&lt;Zeitstempel&gt;/</code></td><td>Nein</td></tr><tr><td>Neue Struktur-/Rollen-Dumps</td><td><code>_backups/db/&lt;Zeitstempel&gt;/</code></td><td>Nein, zunächst prüfen</td></tr><tr><td>Verifizierte Struktur-Baseline</td><td><code>sql/baseline/verified/</code></td><td>Ja, nach Prüfung</td></tr><tr><td>Private Daten oder Auth-Sicherungen</td><td><code>Separater geschützter Backup-Ordner außerhalb der Website</code></td><td>Nein</td></tr></tbody></table></div><p>Beispiel für einen aktuellen Admin-Export: <code>_backups/stammdaten/20261005-153414/</code>. Im Git-Repository <code>_backups/</code> über die <code>.gitignore</code> ausschließen, die für diesen Ordner gilt. Im Repository-Root <code>home/.gitignore</code> lautet die Zeile <code>/wallet-tracking/_backups/</code>. Bereits erfasste Backups müssen zusätzlich aus dem Git-Index entfernt werden. Diese Dokumentation ändert die .gitignore nicht automatisch. Provider-URLs können Zugangsschlüssel enthalten; vor Veröffentlichung prüfen. Rohsicherungen zusätzlich außerhalb des Website-Verzeichnisses sichern. .gitignore verhindert keine Veröffentlichung durch andere Upload- oder Deployment-Werkzeuge. Die vorhandenen CLI-Helper schreiben weiterhin in ihre bisherigen generated-Verzeichnisse; deren Rohdateien ebenfalls vor Commit/Veröffentlichung prüfen oder in den Backup-Ordner verschieben. Erst geprüfte Seeds bzw. verifizierte Strukturdateien übernehmen.</p>
<h4>Dokumentation und Diagnose-Dateien</h4><p>Diese Dokumentation und die Systemübersicht beschreiben den aktuellen Betrieb. Release-Historie: <a href="./docs/releases/CHANGELOG.md">Änderungshistorie</a>; Originalberichte 7.33–7.44 unter docs/releases/. Aktuelle Anleitung in README.md, chronologische Kurzfassung in CHANGELOG.md, historische Detailberichte in README-7.xx.md. Nach Update 7.55 <a href="./_wt-docs-cleanup.command" download>Cleanup-Helfer herunterladen</a> beziehungsweise im lokalen wallet-tracking-Ordner einmal ausführen. Er archiviert bekannte Root-READMEs, entfernt nur identische Duplikate und bewahrt abweichende Inhalte. ZIP entpacken allein entfernt keine alten Dateien. SQL-Anleitungen bleiben bei ihren Wiederherstellungsdateien. Temporäre polygon-rpc-test.html und README-polygon-rpc-test.md können entfernt werden. TLN-Diagnoseseiten und tests/*.mjs bleiben für offene Prüfungen; eine Admin-Zugangssperre für separate HTML-Diagnoseseiten ist noch nicht umgesetzt.</p></div>`;}
  global.WTAdminExports={keys,validate,makeSql,exportData,render};
})(typeof window!=='undefined'?window:globalThis);
