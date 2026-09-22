-- WalletTracking Phase 5.89: userbezogenes Release-Management + DATA_MIGRATIONS
-- Einmal im Supabase SQL Editor ausführen.

create table if not exists public.user_data_migrations (
  user_id uuid not null references auth.users(id) on delete cascade,
  migration_key text not null,
  data_version integer not null default 0,
  status text not null default 'pending' check (status in ('pending','running','complete','failed')),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  last_error text,
  details jsonb,
  primary key (user_id, migration_key)
);

create table if not exists public.user_release_acknowledgements (
  user_id uuid not null references auth.users(id) on delete cascade,
  release_key text not null,
  acknowledged_at timestamptz not null default now(),
  primary key (user_id, release_key)
);

alter table public.user_data_migrations enable row level security;
alter table public.user_release_acknowledgements enable row level security;

drop policy if exists "user_data_migrations_self_select" on public.user_data_migrations;
create policy "user_data_migrations_self_select" on public.user_data_migrations for select to authenticated using (auth.uid() = user_id);
drop policy if exists "user_data_migrations_self_insert" on public.user_data_migrations;
create policy "user_data_migrations_self_insert" on public.user_data_migrations for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "user_data_migrations_self_update" on public.user_data_migrations;
create policy "user_data_migrations_self_update" on public.user_data_migrations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_release_ack_self_select" on public.user_release_acknowledgements;
create policy "user_release_ack_self_select" on public.user_release_acknowledgements for select to authenticated using (auth.uid() = user_id);
drop policy if exists "user_release_ack_self_insert" on public.user_release_acknowledgements;
create policy "user_release_ack_self_insert" on public.user_release_acknowledgements for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "user_release_ack_self_update" on public.user_release_acknowledgements;
create policy "user_release_ack_self_update" on public.user_release_acknowledgements for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.user_data_migrations to authenticated;
grant select, insert, update on public.user_release_acknowledgements to authenticated;
