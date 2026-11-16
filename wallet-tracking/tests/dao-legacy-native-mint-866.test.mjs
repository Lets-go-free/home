import assert from 'node:assert/strict'
import {verifyLegacyNativeMint866,NATIVE_MINTED_TOPIC_866} from '../supabase/functions/dao-reward-refresh/legacy-native-mint-866.js'

const wallet='0x39180b13f5bd24432f01535ceb2c069fd2adf937'
const precompile='0x0200000000000000000000000000000000000001'
const pad=hex=>`0x${hex.slice(2).padStart(64,'0')}`
const sender1='0xdb330f9a9c4cd2ab4f8e6965bbff8af225b3da60'
const sender2='0xa1b761890c36e356f49f9df8d495fcffa76857ad'
const call=(sender,raw)=>({type:'CALL',from:sender,to:precompile,
 input:'0x4f5aaaba'+pad(wallet).slice(2)+pad(raw).slice(2),value:'0x0'})
// Mirrors two successful nested Native Minter calls observed in block 11448516.
const trace={type:'CALL',calls:[
 {type:'CALL',calls:[call(sender1,'0x0241028dafdc3dbf')]},
 {type:'CALL',calls:[call(sender2,'0x4820de085da694ec')]}
]}
const logs=[
 {address:{hash:precompile},topics:[NATIVE_MINTED_TOPIC_866,pad(sender1),pad(wallet)],data:pad('0x0241028dafdc3dbf')},
 {address:{hash:precompile},topics:[NATIVE_MINTED_TOPIC_866,pad(sender2),pad(wallet)],data:pad('0x4820de085da694ec')}
]
const ok=verifyLegacyNativeMint866(trace,logs,wallet)
assert.equal(ok.status,'verified')
assert.equal(ok.mintCalls,2)
assert.equal(ok.mintEvents,2)
assert.equal(ok.amountRaw,'5359811966623994539')
assert.equal(ok.amountAptm,'5.359811966623994539')
assert.equal(verifyLegacyNativeMint866(trace,logs.slice(0,1),wallet).reason,'mint-call-event-mismatch')
assert.equal(verifyLegacyNativeMint866(trace,[],wallet).status,'needs_review')
assert.equal(verifyLegacyNativeMint866({calls:[]},[],wallet).status,'no_evidence')
assert.equal(verifyLegacyNativeMint866(trace,logs,'0x0000000000000000000000000000000000000001').status,'needs_review')
assert.equal(verifyLegacyNativeMint866(trace,[...logs,logs[0]],wallet).status,'needs_review')
console.log('8.66: legacy Native Minter strict evidence tests passed')
