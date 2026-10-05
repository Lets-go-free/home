import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const base=fs.mkdtempSync(path.join(os.tmpdir(),'wt-backup-test-'));
try{
 const project=path.join(base,'project'),bin=path.join(base,'bin');fs.mkdirSync(path.join(project,'supabase','.temp'),{recursive:true});fs.mkdirSync(bin);
 fs.writeFileSync(path.join(project,'supabase','config.toml'),'# test\n');fs.writeFileSync(path.join(project,'supabase','.temp','project-ref'),'test-project\n');
 const script=path.join(project,'_wt-db-backup.command');fs.copyFileSync(new URL('../_wt-db-backup.command',import.meta.url),script);
 const cli=`#!/bin/bash
printf '%s\\n' "$*" >> "$MOCK_CALLS"
if [ "$1" = --version ]; then echo test-cli; exit 0; fi
if [ "$1" = migration ]; then echo 'Local | Remote | Time'; exit 0; fi
if [ "\${MOCK_MODE:-}" = failure ]; then exit 1; fi
OUTFILE=''; DATA=0
while [ $# -gt 0 ]; do
 case "$1" in --file) OUTFILE="$2"; shift;; --data-only) DATA=1;; esac
 shift
done
if [ "$DATA" = 1 ]; then
 { echo 'COPY public.wallets (id) FROM stdin;'; echo '\\.'; echo 'COPY public.user_team_aliases_private (id) FROM stdin;'; echo '\\.';
 if [ "\${MOCK_MODE:-}" != missing-auth ]; then echo 'COPY auth.users (id) FROM stdin;'; echo '\\.'; echo 'COPY auth.identities (id) FROM stdin;'; echo '\\.'; fi; } > "$OUTFILE"
else echo '-- fake structure/roles' > "$OUTFILE"; fi
`;
 fs.writeFileSync(path.join(bin,'supabase'),cli,{mode:0o700});
 for(const mode of ['success','failure','missing-auth']){
  const output=path.join(base,mode),calls=path.join(base,mode+'.calls');
  const result=spawnSync('bash',[script],{cwd:project,env:{...process.env,PATH:bin+path.delimiter+process.env.PATH,WT_BACKUP_DIR:output,MOCK_MODE:mode,MOCK_CALLS:calls},encoding:'utf8'});
  const folder=fs.readdirSync(output).map(n=>path.join(output,n))[0];
  if(mode==='success'){
   assert.equal(result.status,0,result.stdout+result.stderr);assert.ok(fs.existsSync(path.join(folder,'BACKUP-COMPLETE.txt')));
   const c=fs.readFileSync(calls,'utf8');assert.match(c,/--data-only --use-copy --schema public,auth,storage,supabase_migrations/);
   assert.doesNotMatch(c,/db reset|db push|migration up|--db-url|--password/);
   const check=spawnSync('shasum',['-a','256','-c','SHA256SUMS.txt'],{cwd:folder,encoding:'utf8'});assert.equal(check.status,0,check.stdout+check.stderr);
   assert.match(fs.readFileSync(path.join(folder,'RESTORE-NOTES.txt'),'utf8'),/ORIGINAL WALLET_ENCRYPTION_MASTER_KEY_V1/);
   assert.equal(fs.statSync(folder).mode&0o077,0,'private directory');
  }else{assert.notEqual(result.status,0);assert.ok(!fs.existsSync(path.join(folder,'BACKUP-COMPLETE.txt')));assert.match(result.stdout,/Keine bestätigte vollständige Sicherung/);}
 }
 const inside=spawnSync('bash',[script],{cwd:project,env:{...process.env,PATH:bin+path.delimiter+process.env.PATH,WT_BACKUP_DIR:path.join(project,'bad'),MOCK_CALLS:path.join(base,'inside.calls')},encoding:'utf8'});
 assert.notEqual(inside.status,0);assert.match(inside.stdout,/außerhalb/);assert.ok(!fs.existsSync(path.join(base,'inside.calls')),'rejected before connecting');
 console.log('PASS: read-only dump arguments, private external destination, coverage including auth/private tables, verified hashes, success marker, export failure, missing Auth and forbidden website destination. Mock CLI only; live Mac export and restore pending.');
}finally{fs.rmSync(base,{recursive:true,force:true});}
