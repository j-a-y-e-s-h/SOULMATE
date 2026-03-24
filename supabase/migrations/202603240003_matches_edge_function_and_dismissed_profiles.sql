drop policy if exists "Participants can create a match" on public.matches;

create table if not exists public.dismissed_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dismissed_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint dismissed_profiles_user_pair_key unique (user_id, dismissed_user_id),
  constraint dismissed_profiles_not_self check (user_id <> dismissed_user_id)
);

create index if not exists dismissed_profiles_user_id_created_at_idx
  on public.dismissed_profiles (user_id, created_at desc);

alter table public.dismissed_profiles enable row level security;

drop policy if exists "Users can view their own dismissed profiles" on public.dismissed_profiles;
create policy "Users can view their own dismissed profiles"
  on public.dismissed_profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own dismissed profiles" on public.dismissed_profiles;
create policy "Users can create their own dismissed profiles"
  on public.dismissed_profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own dismissed profiles" on public.dismissed_profiles;
create policy "Users can delete their own dismissed profiles"
  on public.dismissed_profiles
  for delete
  using (auth.uid() = user_id);
