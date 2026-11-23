import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync(new URL('../supabase/migrations/20261122225306_tln_vow_daily_reward_jobs_disabled_975.sql',import.meta.url),'utf8');
const direct=fs.readFileSync(new URL('../supabase/migrations/20261122115628_tln_vow_direct_claim_daily_disabled_957.sql',import.meta.url),'utf8');
const edge=fs.readFileSync(new URL('../supabase/functions/tln-vow-reward-refresh/index.ts',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

assert.match(direct,/cron\.schedule\('tln-vow-direct-claims-daily', '10 3 \* \* \*'/);
assert.match(sql,/cron\.schedule\('tln-vow-bonus-claims-daily', '15 3 \* \* \*'/);
assert.match(sql,/cron\.schedule\('tln-vow-referral-claims-daily', '20 3 \* \* \*'/);
assert.match(sql,/perform cron\.alter_job\(v_bonus_job, active := false\)/);
assert.match(sql,/perform cron\.alter_job\(v_referral_job, active := false\)/);
assert.match(sql,/raise exception 'A daily TLN\/VOW claim job is already active/);
assert.match(sql,/'tln_vow_reward_refresh_auth'/);
assert.match(sql,/'tln_vow_trade_sync_url'/);
assert.match(sql,/"mode":"daily-bonus-claim-cycle","commit":true/);
assert.match(sql,/"mode":"referral-claim-finalize","commit":true/);
assert.match(edge,/if\(mode==='daily-bonus-claim-cycle'\)/);
assert.match(edge,/if\(mode==='referral-claim-finalize'\)/);
assert.match(edge,/if\(mode==='direct-claim-finalize'\|\|mode==='daily-direct-claim-cycle'\)/);
assert.ok(Number(html.match(/window\.APP_VERSION="([0-9.]+)"/)?.[1])>=9.75);
console.log('9.75 daily schedule is off and uses three existing finalizers');
