-- WalletTracking
-- 031-discovery-cache-admin-cooldown-bypass.sql
-- Normale User behalten die 30-Tage-Sperre.
-- Admins dürfen passend zur UI jederzeit erneut scannen.
-- Reine Findings-/Spam-Updates gelten nicht als neuer Scan.

begin;

create or replace function public.enforce_discovery_cache_cooldown()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := false;
begin
  begin
    v_is_admin := coalesce(public.is_admin(auth.uid()), false);
  exception when others then
    v_is_admin := false;
  end;

  if tg_op = 'INSERT' then
    new.next_scan_at := new.scanned_at + interval '30 days';
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.scanned_at is not distinct from old.scanned_at then
      new.next_scan_at := old.next_scan_at;
      new.updated_at := now();
      return new;
    end if;

    if v_is_admin then
      new.next_scan_at := new.scanned_at + interval '30 days';
      new.updated_at := now();
      return new;
    end if;

    if now() < old.next_scan_at then
      raise exception
        'Discovery-Scan für diese Wallet erst wieder ab % möglich.',
        old.next_scan_at
        using errcode = 'P0001';
    end if;

    new.next_scan_at := new.scanned_at + interval '30 days';
    new.updated_at := now();
    return new;
  end if;

  return new;
end;
$$;

commit;

select t.tgname as trigger_name,p.proname as function_name
from pg_trigger t join pg_proc p on p.oid=t.tgfoid
where t.tgrelid='public.discovery_cache'::regclass and not t.tgisinternal
order by t.tgname;
