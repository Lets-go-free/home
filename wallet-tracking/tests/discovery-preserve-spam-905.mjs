import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('js/app.js','utf8');
const start=source.indexOf('function mergeDiscoveryManualSpamMarks(');
const end=source.indexOf('\nasync function detectPotentialLpStakingTargets',start);
assert.ok(start>=0&&end>start,'merge function must be present');
const ctx=vm.createContext({});
vm.runInContext(source.slice(start,end),ctx);
const merge=ctx.mergeDiscoveryManualSpamMarks;
const old=[
  {chain:'bsc',address:'0xABC',symbol:'MANUELL',risk:['GoPlus: Contract nicht verifiziert'],userMarkedScam:true},
  {chain:'eth',address:'0xDEF',userMarkedScam:true},
  {chain:'bsc',address:'0xNO',userMarkedScam:false}
];
const incoming=[{chain:'bsc',address:'0xabc',symbol:'MANUELL',amount:10,risk:[]}];
const first=merge(incoming,old);
assert.equal(first[0].userMarkedScam,true,'existing manual spam classification survives fresh scan');
assert.equal(first[0].amount,10,'fresh balances remain authoritative');
assert.equal(first[1]._retainedSpamMarker,true,'temporarily missing marked token leaves a hidden marker');
assert.equal(first[1].userMarkedScam,true);
const second=merge([{chain:'eth',address:'0xdef',symbol:'BACK',risk:[]}],first);
assert.equal(second[0].userMarkedScam,true,'manual mark survives absence and rediscovery');
assert.equal(second[0]._retainedSpamMarker,undefined,'rediscovered token is visible again');
assert.equal(merge([{chain:'bsc',address:'0xNO'}],old).find(f=>f.address==='0xNO').userMarkedScam,undefined,
  'tokens never manually marked must not become marked');
assert.match(source,/Sicherheitsprüfung für diese Chain nicht unterstützt/);
console.log('PASS manual spam marking survives discovery rescans and temporary absence');
