-- WalletTracking Phase 5.93: DATA_MIGRATIONS-Status "partial" persistent erlauben.
-- Einmal im Supabase SQL Editor ausführen. Idempotent wiederholbar.

alter table public.user_data_migrations
  drop constraint if exists user_data_migrations_status_check;

alter table public.user_data_migrations
  add constraint user_data_migrations_status_check
  check (status in ('pending','running','complete','partial','failed'));
