-- Technical metadata is internal, globally reusable public on-chain information.
-- No wallet/user/label associations in this cache; personal display fields stay in safe_tokens.
BEGIN;
CREATE SCHEMA IF NOT EXISTS wallettracking_internal;
REVOKE ALL ON SCHEMA wallettracking_internal FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS wallettracking_internal.token_metadata(
 chain text NOT NULL,address text NOT NULL,decimals integer,observed_decimals integer,
 status text NOT NULL CHECK(status IN ('verified','conflict','not_applicable','unavailable')),
 kind text NOT NULL,source text NOT NULL,symbol text,name text,checked_at timestamptz NOT NULL DEFAULT now(),
 last_error text,history jsonb NOT NULL DEFAULT '[]',PRIMARY KEY(chain,address),
 CHECK(decimals IS NULL OR decimals BETWEEN 0 AND 36),CHECK(observed_decimals IS NULL OR observed_decimals BETWEEN 0 AND 36));
ALTER TABLE wallettracking_internal.token_metadata ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON wallettracking_internal.token_metadata FROM PUBLIC,anon,authenticated;
ALTER TABLE public.safe_tokens ADD COLUMN IF NOT EXISTS display_decimals smallint,
 ADD COLUMN IF NOT EXISTS summary_decimals smallint;
DO $fn$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='safe_tokens_display_digits_808' AND conrelid='public.safe_tokens'::regclass) THEN
 ALTER TABLE public.safe_tokens ADD CONSTRAINT safe_tokens_display_digits_808 CHECK(display_decimals BETWEEN 0 AND 18),
 ADD CONSTRAINT safe_tokens_summary_digits_808 CHECK(summary_decimals BETWEEN 0 AND 18);END IF;
END $fn$;
CREATE OR REPLACE FUNCTION public.wallettracking_metadata_address(p_chain text,p_address text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$
 SELECT CASE WHEN p_address='native' OR c.wallet_type='evm' THEN lower(btrim(p_address)) ELSE btrim(p_address) END
 FROM public.chains c WHERE c.chain_key=p_chain;
$fn$;
REVOKE ALL ON FUNCTION public.wallettracking_metadata_address(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_metadata_address(text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.wallettracking_get_token_metadata(p_chain text,p_address text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE a text;m wallettracking_internal.token_metadata%ROWTYPE;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required';END IF;
 a:=public.wallettracking_metadata_address(p_chain,p_address);
 SELECT * INTO m FROM wallettracking_internal.token_metadata WHERE chain=p_chain AND address=a;
 IF NOT FOUND THEN RETURN NULL;END IF;RETURN to_jsonb(m)-'history';
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_get_token_metadata(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_get_token_metadata(text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.wallettracking_record_token_metadata(p_chain text,p_address text,p_observation jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE a text;d integer;st text;k text;src text;conflict boolean:=false;existing integer;matches integer;
 m wallettracking_internal.token_metadata%ROWTYPE;h jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required';END IF;
 a:=public.wallettracking_metadata_address(p_chain,p_address);
 st:=p_observation->>'status';k:=p_observation->>'kind';src:=p_observation->>'source';
 IF a IS NULL OR a='' OR length(a)>200 OR st IS NULL OR st NOT IN ('verified','not_applicable','unavailable')
  OR k IS NULL OR k NOT IN ('native','erc20','spl_mint','trc20','cosmos_denom','v3_pool','unknown')
  OR src IS NULL OR src NOT IN ('existing-predefined-token','apertum-explorer-token-metadata','evm-decimals-call','solana-mint-account','tron-constant-contract','cosmos-denom-metadata','native-protocol-units','evm-v3-pool-probe','provider-unavailable') THEN RAISE EXCEPTION 'Invalid metadata observation';END IF;
 IF st='verified' THEN
  IF jsonb_typeof(p_observation->'decimals') IS DISTINCT FROM 'number' OR (p_observation->>'decimals') !~ '^(0|[1-9][0-9]?)$' THEN RAISE EXCEPTION 'Invalid technical decimals';END IF;
  d:=(p_observation->>'decimals')::integer;IF d<0 OR d>36 THEN RAISE EXCEPTION 'Invalid technical decimals';END IF;
 ELSIF p_observation->>'decimals' IS NOT NULL THEN RAISE EXCEPTION 'Unexpected technical decimals';END IF;
 IF st='not_applicable' AND (k<>'v3_pool' OR src<>'evm-v3-pool-probe') THEN RAISE EXCEPTION 'Invalid pool proof';END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_chain||'|'||a,808));
 SELECT * INTO m FROM wallettracking_internal.token_metadata WHERE chain=p_chain AND address=a FOR UPDATE;
 -- Lock master rows as well; existing technical values are never replaced.
 PERFORM 1 FROM public.predefined_tokens WHERE chain=p_chain AND public.wallettracking_metadata_address(chain,address)=a FOR UPDATE;
 SELECT count(*),min(decimals) INTO matches,existing FROM public.predefined_tokens WHERE chain=p_chain AND public.wallettracking_metadata_address(chain,address)=a;
 IF matches>1 THEN RAISE EXCEPTION 'Ambiguous token master rows';END IF;
 conflict:=m.status='conflict' OR EXISTS(SELECT 1 FROM public.predefined_tokens WHERE chain=p_chain AND public.wallettracking_metadata_address(chain,address)=a AND decimals_status='conflict');
 conflict:=COALESCE(conflict,false) OR (st='verified' AND ((m.decimals IS NOT NULL AND m.decimals<>d) OR (existing IS NOT NULL AND existing<>d)))
  OR (st='not_applicable' AND (m.decimals IS NOT NULL OR existing IS NOT NULL))
  OR (st='verified' AND m.status='not_applicable');
 conflict:=COALESCE(conflict,false);
 h:=COALESCE(m.history,'[]'::jsonb)||jsonb_build_array(jsonb_build_object('at',clock_timestamp(),'status',CASE WHEN conflict THEN 'conflict' ELSE st END,'decimals',d,'source',src));
 SELECT COALESCE(jsonb_agg(value ORDER BY ord),'[]') INTO h FROM jsonb_array_elements(h) WITH ORDINALITY x(value,ord) WHERE ord>jsonb_array_length(h)-10;
 IF st='unavailable' AND m.status IN ('verified','not_applicable','conflict') THEN
  UPDATE wallettracking_internal.token_metadata SET last_error=left(p_observation->>'reason',200),history=h WHERE chain=p_chain AND address=a;
  RETURN (to_jsonb(m)-'history')||jsonb_build_object('refreshFailed',true,'reason',p_observation->>'reason');
 END IF;
 INSERT INTO wallettracking_internal.token_metadata(chain,address,decimals,observed_decimals,status,kind,source,symbol,name,checked_at,last_error,history)
 VALUES(p_chain,a,COALESCE(m.decimals,existing,d),d,CASE WHEN conflict THEN 'conflict' ELSE st END,k,src,
  NULLIF(left(p_observation->>'symbol',100),''),NULLIF(left(p_observation->>'name',200),''),clock_timestamp(),left(p_observation->>'reason',200),h)
 ON CONFLICT(chain,address) DO UPDATE SET decimals=excluded.decimals,observed_decimals=excluded.observed_decimals,
  status=excluded.status,kind=excluded.kind,source=excluded.source,symbol=COALESCE(excluded.symbol,token_metadata.symbol),name=COALESCE(excluded.name,token_metadata.name),
  checked_at=excluded.checked_at,last_error=excluded.last_error,history=excluded.history RETURNING * INTO m;
 UPDATE public.predefined_tokens SET decimals=CASE WHEN st='verified' AND NOT conflict THEN COALESCE(decimals,d) ELSE decimals END,
  decimals_status=CASE WHEN conflict THEN 'conflict' ELSE st END,decimals_source=src,decimals_observed=d,decimals_checked_at=m.checked_at,
  symbol=CASE WHEN m.status='verified' THEN COALESCE(NULLIF(symbol,''),m.symbol) ELSE symbol END,
  name=CASE WHEN m.status='verified' THEN COALESCE(NULLIF(name,''),m.name) ELSE name END,
  label=CASE WHEN m.status='verified' THEN COALESCE(NULLIF(label,''),m.name,m.symbol) ELSE label END
 WHERE chain=p_chain AND public.wallettracking_metadata_address(chain,address)=a;
 RETURN to_jsonb(m)-'history';
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_record_token_metadata(text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_record_token_metadata(text,text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.wallettracking_token_metadata_batch(p_user uuid,p_after text DEFAULT '',p_own_only boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE result jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required';END IF;
 SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.key),'[]') INTO result FROM (
  SELECT chain,address,chain||'|'||address AS key FROM (
   SELECT chain,public.wallettracking_metadata_address(chain,address) address FROM public.predefined_tokens WHERE NOT p_own_only
   UNION SELECT chain,public.wallettracking_metadata_address(chain,address) FROM public.safe_tokens WHERE user_id=p_user
  ) all_tokens WHERE address IS NOT NULL AND chain||'|'||address>COALESCE(p_after,'') ORDER BY chain||'|'||address LIMIT 13
 ) x;RETURN result;
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_token_metadata_batch(uuid,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_token_metadata_batch(uuid,text,boolean) TO service_role;
-- Existing per-user RLS is required; never expose private safe lists through metadata RPCs.
DO $fn$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.safe_tokens'::regclass AND relrowsecurity) THEN RAISE EXCEPTION 'safe_tokens RLS required';END IF;
END $fn$;
CREATE OR REPLACE FUNCTION public.wallettracking_get_token_metadata_for_tokens(p_tokens jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE result jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required';END IF;
 IF jsonb_typeof(p_tokens)<>'array' OR jsonb_array_length(p_tokens)>200 THEN RAISE EXCEPTION 'Bounded token array required';END IF;
 SELECT COALESCE(jsonb_agg(to_jsonb(m)-'history'),'[]') INTO result FROM wallettracking_internal.token_metadata m
 WHERE EXISTS(SELECT 1 FROM jsonb_to_recordset(p_tokens) AS t(chain text,address text)
  WHERE t.chain=m.chain AND public.wallettracking_metadata_address(t.chain,t.address)=m.address);
 RETURN result;
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_get_token_metadata_for_tokens(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_get_token_metadata_for_tokens(jsonb) TO service_role;
-- Authenticated users may read only metadata attached to their own private list.
CREATE OR REPLACE FUNCTION public.wallettracking_list_own_safe_tokens()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR auth.role() IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'User session required';END IF;
 SELECT COALESCE(jsonb_agg(to_jsonb(s)||jsonb_build_object('technical_decimals',CASE WHEN m.status='verified' THEN m.decimals ELSE NULL END,
  'technical_status',m.status,'technical_source',m.source,'metadata_symbol',m.symbol,'metadata_name',m.name) ORDER BY s.created_at),'[]') INTO result
 FROM public.safe_tokens s LEFT JOIN wallettracking_internal.token_metadata m ON m.chain=s.chain
  AND m.address=public.wallettracking_metadata_address(s.chain,s.address) WHERE s.user_id=auth.uid();
 RETURN result;
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_list_own_safe_tokens() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wallettracking_list_own_safe_tokens() TO authenticated;
COMMIT;
