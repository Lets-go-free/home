-- WalletTracking Reward Worker: read-only schema check, single SELECT / single resultset.
-- Safe for the only current test database. No sensitive rows, addresses or keys returned.
WITH desired(tab) AS (
 VALUES ('project_transactions'),('project_transaction_asset_flows'),('project_scan_state'),
        ('dao_bot_claim_reviews'),('wallet_reward_refresh_attempts'),('wallets')
), columns AS (
 SELECT c.table_name, jsonb_agg(jsonb_build_object('name',c.column_name,'type',c.data_type,'nullable',c.is_nullable) ORDER BY c.ordinal_position) AS definition
 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name IN (SELECT tab FROM desired)
 GROUP BY c.table_name
), constraints AS (
 SELECT t.relname AS table_name, jsonb_agg(pg_get_constraintdef(con.oid) ORDER BY con.conname) AS keys
 FROM pg_constraint con JOIN pg_class t ON t.oid=con.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace
 WHERE n.nspname='public' AND t.relname IN (SELECT tab FROM desired) AND con.contype IN ('p','u')
 GROUP BY t.relname
), functions AS (
 SELECT jsonb_agg(p.proname ORDER BY p.proname) AS names
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('wallettracking_reward_claim','wallettracking_reward_finish')
)
SELECT jsonb_pretty(jsonb_build_object(
 'schema', (SELECT jsonb_object_agg(d.tab,jsonb_build_object('exists',c.definition IS NOT NULL,'columns',coalesce(c.definition,'[]'::jsonb),'unique_keys',coalesce(k.keys,'[]'::jsonb))) FROM desired d LEFT JOIN columns c ON c.table_name=d.tab LEFT JOIN constraints k ON k.table_name=d.tab),
 'reward_functions',coalesce((SELECT names FROM functions),'[]'::jsonb),
 'checked_at_utc',now()
)) AS reward_schema_audit;
