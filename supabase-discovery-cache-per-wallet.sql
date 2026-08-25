-- ============================================================
-- Discovery-Cache: manuelle Scam-Markierung erlauben,
-- ohne den 30-Tage-Cooldown neu zu starten.
--
-- Hintergrund:
-- Der bestehende Trigger sperrt bisher jedes UPDATE innerhalb
-- der 30 Tage. Für reine Änderungen an "findings" (z.B.
-- userMarkedScam true/false) soll das erlaubt sein.
-- Nur ein echter neuer Scan darf scanned_at/next_scan_at ändern.
-- ============================================================

create or replace function public.enforce_discovery_cache_cooldown()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then

    -- Wenn nur das gespeicherte Ergebnis bearbeitet wird
    -- (z.B. manuelle Scam-Markierung), Zeitstempel unverändert lassen.
    if new.findings is distinct from old.findings
       and new.wallet_label is not distinct from old.wallet_label
       and new.selected_chains is not distinct from old.selected_chains
       and new.scan_notes is not distinct from old.scan_notes
       and new.scanned_at is not distinct from old.scanned_at
       and new.next_scan_at is not distinct from old.next_scan_at
    then
      new.scanned_at := old.scanned_at;
      new.next_scan_at := old.next_scan_at;
      new.updated_at := now();
      return new;
    end if;

    -- Jeder echte neue Scan bleibt innerhalb der 30 Tage gesperrt.
    if old.scanned_at + interval '30 days' > now() then
      raise exception
        'Discovery-Scan für diese Wallet erst wieder ab % möglich.',
        old.scanned_at + interval '30 days';
    end if;
  end if;

  -- INSERT oder erlaubter neuer Scan:
  new.scanned_at := now();
  new.next_scan_at := now() + interval '30 days';
  new.updated_at := now();

  return new;
end;
$$;
