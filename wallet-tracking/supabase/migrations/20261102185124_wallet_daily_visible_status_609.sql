-- WalletTracking 6.09: benutzergebundener Lesestatus des täglichen Wallet-Bestandsjobs.
-- Keine Mutation an Beständen, Rewards, Wallet-Adressen oder historischen Snapshots.
-- Die Jobtabellen bleiben für anon/authenticated direkt gesperrt.
CREATE OR REPLACE FUNCTION public.wallettracking_own_daily_balance_status()
RETURNS TABLE(wallet_id uuid, scan_day date, state text, completed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT a.wallet_id, a.scan_day, a.state,
         CASE WHEN a.state = 'completed' THEN a.updated_at ELSE NULL END AS completed_at
  FROM public.wallet_daily_refresh_attempts a
  WHERE a.user_id = (SELECT auth.uid())
    AND a.scan_day = (now() AT TIME ZONE 'Europe/Zurich')::date
    AND EXISTS (SELECT 1 FROM public.wallets w
                WHERE w.id = a.wallet_id AND w.user_id = (SELECT auth.uid()));
$$;
REVOKE ALL ON FUNCTION public.wallettracking_own_daily_balance_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wallettracking_own_daily_balance_status() TO authenticated, service_role;
