-- WalletTracking 8.93: repair incorrect single-address guard in 8.91 reconciliation.
-- SQL Editor/service-role installation. Replaces only the contract predicate;
-- does not execute the reconciliation or modify any claim, flow, price or candidate.
BEGIN;
DO $migration$
DECLARE
  v_function text;
  v_old constant text := 'lower(v_tx.to_address) IS DISTINCT FROM ''0x2096bd2e860b450498a7c908708757a1eb306416''';
  v_new constant text := '(v_tx.to_address IS NULL OR lower(v_tx.to_address) NOT IN (
      ''0x2096bd2e860b450498a7c908708757a1eb306416'',
      ''0xdb330f9a9c4cd2ab4f8e6965bbff8af225b3da60'',
      ''0xa1b761890c36e356f49f9df8d495fcffa76857ad''))';
BEGIN
  SELECT pg_catalog.pg_get_functiondef('public.wallettracking_dao_reconcile_existing_native_891(boolean)'::regprocedure)
    INTO v_function;
  IF v_function IS NULL OR
     (length(v_function)-length(replace(v_function,v_old,'')))<>length(v_old) THEN
    RAISE EXCEPTION 'Unexpected 8.91 reconciliation function; migration stopped without changes';
  END IF;
  EXECUTE replace(v_function,v_old,v_new);
END $migration$;
COMMIT;
