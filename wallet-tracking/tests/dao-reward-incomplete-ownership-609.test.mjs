import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const verify=source.slice(source.indexOf('async function verifyPendingCandidates('),source.indexOf('async function process('));
test('incomplete NFT transfer history is retryable, not a terminal negative proof',()=>{
  for(const reason of ['pagination-incomplete','missing-history','history-out-of-order'])
    assert.ok(verify.includes(`'${reason}'`),`${reason} must remain pending`);
  const guard=verify.indexOf('Historical NFT ownership evidence incomplete');
  const update=verify.indexOf("status:candidateStatus");
  assert.ok(guard>=0&&guard<update,'failure must happen before status update');
  assert.match(verify,/throw Error\(`/);
});
test('incomplete evidence is not silently marked verified or unverified',()=>{
  assert.match(verify,/\.eq\('status','pending'\)/);
  assert.match(verify,/const proof=await historicalNftOwnership/);
  assert.match(verify,/if\(\['pagination-incomplete','missing-history','history-out-of-order'\]\.includes\(proof.reason\)\)/);
});
