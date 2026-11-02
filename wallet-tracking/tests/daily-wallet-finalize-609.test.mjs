import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const sql=readFileSync(new URL('../supabase/migrations/20261102214434_wallet_daily_finalize_retry_609.sql',import.meta.url),'utf8');
const worker=readFileSync(new URL('../supabase/functions/wallet-daily-refresh/index.ts',import.meta.url),'utf8');
const complete=sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.wallettracking_daily_complete'),sql.indexOf('CREATE OR REPLACE FUNCTION public.wallettracking_daily_finalize('));
assert(!complete.includes('INSERT INTO public.snapshots'));
assert(complete.includes("state='completed'"));
assert(sql.includes('CREATE OR REPLACE FUNCTION public.wallettracking_daily_finalize_next'));
assert(sql.includes("a.state='completed'"));
assert(sql.includes('wallettracking_capture_balance_history')===false); // existing trigger retained
assert(worker.includes('wallettracking_daily_finalize_fail'));
assert(worker.includes('JSON.stringify({message:o.message'));
assert(worker.includes('snapshot:await finalize(day)'));
console.log('Daily finalize separation: 7 checks passed');
