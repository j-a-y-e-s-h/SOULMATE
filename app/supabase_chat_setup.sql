-- Run this in your Supabase SQL Editor AFTER supabase_setup.sql
-- Dashboard > SQL Editor > New query

-- ─────────────────────────────────────────────
-- 0. PROFILES — allow reading other users' profiles
-- ─────────────────────────────────────────────
-- The default policy in supabase_setup.sql restricts reads to own row only.
-- For a matrimony app, authenticated users need to see other users' profiles
-- (to display matches, discover, search, etc.). Add this broader read policy:
create policy "Authenticated users can read any profile"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Note: The existing "Users can view own profile" policy is a subset of the above
-- and can remain in place (Supabase applies policies with OR logic on SELECT).


-- ─────────────────────────────────────────────
-- 1. INTEREST REQUESTS
-- ─────────────────────────────────────────────
create table if not exists public.interest_requests (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users on delete cascade not null,
  to_user_id   uuid references auth.users on delete cascade not null,
  message      text not null default '',
  status       text not null default 'pending'
                check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz default now(),
  -- Prevent duplicate pending requests from the same sender
  unique (from_user_id, to_user_id)
);

alter table public.interest_requests enable row level security;

-- Sender can see requests they sent
create policy "Users can view sent interest requests"
  on public.interest_requests for select
  using (auth.uid() = from_user_id);

-- Recipient can see requests they received
create policy "Users can view received interest requests"
  on public.interest_requests for select
  using (auth.uid() = to_user_id);

-- Anyone authenticated can send an interest (insert where from = self)
create policy "Users can send interest requests"
  on public.interest_requests for insert
  with check (auth.uid() = from_user_id);

-- Only recipient can update status (accept/decline)
create policy "Recipient can respond to interest requests"
  on public.interest_requests for update
  using (auth.uid() = to_user_id);

-- Sender can delete (withdraw) their own pending request
create policy "Sender can withdraw interest request"
  on public.interest_requests for delete
  using (auth.uid() = from_user_id);


-- ─────────────────────────────────────────────
-- 2. MATCHES
-- ─────────────────────────────────────────────
create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  user1_id   uuid references auth.users on delete cascade not null,
  user2_id   uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  -- Enforce canonical ordering: user1_id < user2_id prevents duplicate rows
  unique (user1_id, user2_id),
  check (user1_id < user2_id)
);

alter table public.matches enable row level security;

-- Both users in a match can see it
create policy "Users can view their own matches"
  on public.matches for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Only the system (service role via Edge Function) should insert matches.
-- For client-side simplicity during development, allow authenticated insert
-- where the caller is one of the two participants.
create policy "Participants can create a match"
  on public.matches for insert
  with check (auth.uid() = user1_id or auth.uid() = user2_id);


-- ─────────────────────────────────────────────
-- 3. MESSAGES
-- ─────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid references public.matches on delete cascade not null,
  sender_id  uuid references auth.users on delete cascade not null,
  content    text not null,
  read       boolean not null default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

-- Both matched users can read messages in their match
create policy "Matched users can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.matches
      where id = match_id
        and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

-- Only the sender can insert (and must be in the match)
create policy "Sender can insert messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches
      where id = match_id
        and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

-- Recipient can mark messages as read
create policy "Recipient can mark messages read"
  on public.messages for update
  using (
    auth.uid() != sender_id
    and exists (
      select 1 from public.matches
      where id = match_id
        and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );


-- ─────────────────────────────────────────────
-- 4. REALTIME — enable publications
-- ─────────────────────────────────────────────
-- Run these separately if the tables aren't already in the publication:
-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.interest_requests;
-- alter publication supabase_realtime add table public.matches;
