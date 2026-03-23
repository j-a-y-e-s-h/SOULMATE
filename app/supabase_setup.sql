-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Profiles table: stores user profile data linked to auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  profile_data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- Enable Row Level Security
-- IMPORTANT: RLS must be enabled BEFORE any real users sign up.
-- All access is scoped to the authenticated user's own row only.
-- The service-role key (used only in Edge Functions / server-side) bypasses RLS;
-- the anon/public key always respects these policies.
alter table public.profiles enable row level security;

-- Policies: users can only access their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);
