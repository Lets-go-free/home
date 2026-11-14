import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const load=p=>readFileSync(new URL(p,base),'utf8');
const risk=load('supabase/functions/token-risk/index.ts');
const browser=load('js/app.js');
const head=risk.match(/const chainIds:Record<string,string>=({[\s\S]*?});/);
assert.ok(head,'Chain-ID mapping must exist');
const map=Object.fromEntries([...head[1].matchAll(/([a-z]+):'([0-9]+)'/g)].map(m=>[m[1],m[2]]));
for(const [a,b,id] of [['arb','arbitrum','42161'],['avax','avalanche','43114'],['matic','polygon','137']]){
 assert.equal(map[a],id);assert.equal(map[b],id);
}
assert.equal(map.eth,'1');assert.equal(map.bsc,'56');assert.equal(map.base,'8453');
assert.match(risk,/error:'Invalid addresses'/);
assert.match(risk,/error:'Unsupported chain',reason:'unknown-chain'/);
assert.match(risk,/status:'unsupported'/);
assert.match(risk,/auth\.getUser/);
assert.match(risk,/Fake_Phishing1123827/);
assert.match(browser,/Sicherheitsdienst nicht verfügbar/);
assert.match(browser,/Sicherheitsprüfung für diese Chain nicht unterstützt/);
assert.match(browser,/Als Spam markieren/);
console.log('8.34: Chain-/Fehler-/Spam-Regressionsprüfungen bestanden');
