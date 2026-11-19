// Generates the stand-alone Supabase Dashboard-compatible Edge Function.
// The browser/core source js/tln-reward-verification-core.js is canonical.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const corePath=path.join(root,'js/tln-reward-verification-core.js');
const edgePath=path.join(root,'supabase/functions/tln-vow-reward-refresh/index.ts');
const begin='// BEGIN GENERATED TLN VERIFICATION CORE – regenerate using tools/build-tln-reward-edge.mjs';
const end='// END GENERATED TLN VERIFICATION CORE';
const original=fs.readFileSync(edgePath,'utf8');
const start=original.indexOf(begin),finish=original.indexOf(end);
if(start<0||finish<start||original.indexOf(begin,start+begin.length)!==-1||original.indexOf(end,finish+end.length)!==-1)
  throw new Error('Generated core markers missing or ambiguous');
const canonical=fs.readFileSync(corePath,'utf8').trimEnd();
const generated=original.slice(0,start+begin.length)+'\n'+canonical+'\n'+original.slice(finish);
fs.writeFileSync(edgePath,generated);
console.log('Generated standalone TLN/VOW Edge core from canonical shared JS');
