-- WalletTracking: userbezogene UI-Einstellungen (geräteübergreifend)
create table if not exists public.user_ui_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light','dark')),
  font_scale integer not null default 100 check (font_scale between 85 and 125),
  updated_at timestamptz not null default now()
);
alter table public.user_ui_preferences enable row level security;
drop policy if exists "user_ui_preferences_select_own" on public.user_ui_preferences;
create policy "user_ui_preferences_select_own" on public.user_ui_preferences for select using (auth.uid() = user_id);
drop policy if exists "user_ui_preferences_insert_own" on public.user_ui_preferences;
create policy "user_ui_preferences_insert_own" on public.user_ui_preferences for insert with check (auth.uid() = user_id);
drop policy if exists "user_ui_preferences_update_own" on public.user_ui_preferences;
create policy "user_ui_preferences_update_own" on public.user_ui_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
