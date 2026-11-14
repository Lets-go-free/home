import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../supabase/functions/token-metadata/index.ts',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/migrations/20261114100432_token_metadata_chain_aliases_833.sql',import.meta.url),'utf8');
const aliases={arbitrum:'arb',avalanche:'avax',polygon:'matic',solana:'sol'};
for(const [ui,registry] of Object.entries(aliases)){
 test(`Edge mapping ${ui} -> ${registry} and SQL normalizer agree`,()=>{
  assert.match(src,new RegExp(`${ui}:'${registry}'`));
  assert.match(sql,new RegExp(`WHEN '${ui}' THEN '${registry}'`));
 });
}
test('keeps existing public token and metadata identifiers, does not update chain data',()=>{
 assert.match(src,/\.eq\('chain',chainKey\)/);
 assert.match(src,/p_chain:chainKey/);
 assert.match(src,/\.eq\('chain_key',configKey\)/);
 assert.doesNotMatch(sql,/UPDATE\s+(public\.)?(chains|predefined_tokens|safe_tokens)/i);
});
test('RPC checks and Solana mint proof remain active',()=>{
 const p=readFileSync(new URL('../supabase/functions/token-metadata/metadata.ts',import.meta.url),'utf8');
 assert.match(p,/eth_chainId/);
 assert.match(p,/getAccountInfo/);
 assert.match(p,/solana-mint-account/);
});
