import assert from 'node:assert/strict';
import fs from 'node:fs';

const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const capture=edge.slice(edge.indexOf('async function captureStakingCallIdentities('),edge.indexOf('async function ',edge.indexOf('async function captureStakingCallIdentities(')+20));
assert.ok(capture.includes("category:['external']"),'external wallet calls are fetched');
assert.ok(capture.includes('allowed.has(to)'),'only registered contracts are staged');
assert.ok(capture.includes("kind:'staking_contract_call'"),'call-only events are identified');
assert.ok(capture.includes("'pagination_incomplete'"),'incomplete pagination must fail closed');
assert.ok(capture.includes("'stage_event_budget_exceeded'"),'call count must be bounded');
assert.ok(edge.includes('const newCalls=calls.filter((e:any)=>!existing.has(e.hash))'),
  'calls already represented by ERC20 transactions must not be duplicated');
assert.ok(edge.includes("if(event?.kind==='staking_contract_call')"),'receipt verifier handles calls separately');
assert.ok(edge.includes("throw new RpcDiagnosticError('staged_receipt','contract_call_mismatch')"),
  'call evidence must be bound to a matching on-chain transaction');
assert.ok(edge.includes('transferLogsMatched:matchedIndexes.size'),
  'call-only events must not inflate verified ERC20 transfer counts');
assert.ok(edge.includes('directContractCalls:inspection.directContractCalls'));
assert.ok(edge.includes('reward_classification_verified:false'));
console.log('9.44: registered direct staking calls without ERC20 transfers are staged and verified fail-closed');
