import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../supabase/migrations/',import.meta.url);
for(const name of [
 '20261115190509_dao_general_single_miner_assignment_861.sql',
 '20261115191059_dao_general_single_miner_assignment_fix_862.sql'
]){
 test(`migration ${name} has exactly one valid function block ending at COMMIT`,()=>{
  const sql=readFileSync(new URL(name,base),'utf8').trim();
  assert.equal((sql.match(/CREATE OR REPLACE FUNCTION/g)||[]).length,1);
  assert.equal((sql.match(/^BEGIN;$/gm)||[]).length,1);
  assert.equal((sql.match(/^COMMIT;$/gm)||[]).length,1);
  assert.match(sql,/END \$fn\$;\s+REVOKE ALL ON FUNCTION/);
  assert.ok(sql.endsWith('COMMIT;'),'no extra SQL after transaction commit');
  assert.match(sql,/p_tx !~ '\^0x\[0-9a-f\]\{64\}\$'/);
  assert.match(sql,/p_event_count<1 OR p_event_count>1000/);
  assert.match(sql,/wallettracking_dao_assign_multi_miner_nft_861/);
  assert.match(sql,/TO service_role;/);
  assert.doesNotMatch(sql,/INSERT INTO|DELETE FROM|updated_at=now\(\)/i);
 });
}
