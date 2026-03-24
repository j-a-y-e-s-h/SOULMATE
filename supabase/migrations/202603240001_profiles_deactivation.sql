alter table public.profiles
  add column if not exists is_active boolean;

update public.profiles
set is_active = true
where is_active is null;

alter table public.profiles
  alter column is_active set default true;

alter table public.profiles
  alter column is_active set not null;

alter table public.profiles
  add column if not exists deactivated_at timestamptz;

alter table public.profiles
  alter column deactivated_at set default null;

create index if not exists profiles_active_idx
  on public.profiles (is_active)
  where is_active = true;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Authenticated users can read any profile" on public.profiles;
drop policy if exists "Authenticated users can read active profiles" on public.profiles;
create policy "Authenticated users can read active profiles"
  on public.profiles
  for select
  using (auth.role() = 'authenticated' and is_active = true);
