-- ============================================================
-- 1. Add missing indexes on unindexed foreign key columns
-- ============================================================

create index if not exists dismissed_profiles_dismissed_user_id_idx
  on public.dismissed_profiles (dismissed_user_id);

create index if not exists interest_requests_to_user_id_idx
  on public.interest_requests (to_user_id);

create index if not exists matches_user2_id_idx
  on public.matches (user2_id);

create index if not exists messages_match_id_idx
  on public.messages (match_id);

create index if not exists messages_sender_id_idx
  on public.messages (sender_id);

-- ============================================================
-- 2. profiles — fix auth re-init + merge duplicate SELECT policies
-- ============================================================

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Authenticated users can read active profiles" on public.profiles;
create policy "Profiles are readable by owner or authenticated users"
  on public.profiles
  for select
  using (
    (select auth.uid()) = id
    or ((select auth.role()) = 'authenticated' and is_active = true)
  );

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using ((select auth.uid()) = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles
  for delete
  using ((select auth.uid()) = id);

-- ============================================================
-- 3. interest_requests — fix auth re-init + merge duplicate SELECT policies
-- ============================================================

drop policy if exists "Users can view sent interest requests" on public.interest_requests;
drop policy if exists "Users can view received interest requests" on public.interest_requests;
create policy "Users can view their interest requests"
  on public.interest_requests
  for select
  using (
    (select auth.uid()) = from_user_id
    or (select auth.uid()) = to_user_id
  );

drop policy if exists "Users can send interest requests" on public.interest_requests;
create policy "Users can send interest requests"
  on public.interest_requests
  for insert
  with check ((select auth.uid()) = from_user_id);

drop policy if exists "Recipient can respond to interest requests" on public.interest_requests;
create policy "Recipient can respond to interest requests"
  on public.interest_requests
  for update
  using ((select auth.uid()) = to_user_id);

drop policy if exists "Sender can withdraw interest request" on public.interest_requests;
create policy "Sender can withdraw interest request"
  on public.interest_requests
  for delete
  using ((select auth.uid()) = from_user_id);

-- ============================================================
-- 4. matches — fix auth re-init
-- ============================================================

drop policy if exists "Users can view their own matches" on public.matches;
create policy "Users can view their own matches"
  on public.matches
  for select
  using (
    (select auth.uid()) = user1_id
    or (select auth.uid()) = user2_id
  );

-- ============================================================
-- 5. messages — fix auth re-init + merge duplicate UPDATE policies
-- ============================================================

drop policy if exists "Matched users can view messages" on public.messages;
create policy "Matched users can view messages"
  on public.messages
  for select
  using (
    exists (
      select 1 from public.matches
      where matches.id = messages.match_id
        and (
          matches.user1_id = (select auth.uid())
          or matches.user2_id = (select auth.uid())
        )
    )
  );

drop policy if exists "Sender can insert messages" on public.messages;
create policy "Sender can insert messages"
  on public.messages
  for insert
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from public.matches
      where matches.id = messages.match_id
        and (
          matches.user1_id = (select auth.uid())
          or matches.user2_id = (select auth.uid())
        )
    )
  );

drop policy if exists "Match users can soft-delete messages" on public.messages;
drop policy if exists "Recipient can mark messages read" on public.messages;
create policy "Match participants can update messages"
  on public.messages
  for update
  using (
    exists (
      select 1 from public.matches
      where matches.id = messages.match_id
        and (
          matches.user1_id = (select auth.uid())
          or matches.user2_id = (select auth.uid())
        )
    )
  );

-- ============================================================
-- 6. dismissed_profiles — fix auth re-init
-- ============================================================

drop policy if exists "Users can view their own dismissed profiles" on public.dismissed_profiles;
create policy "Users can view their own dismissed profiles"
  on public.dismissed_profiles
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own dismissed profiles" on public.dismissed_profiles;
create policy "Users can create their own dismissed profiles"
  on public.dismissed_profiles
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own dismissed profiles" on public.dismissed_profiles;
create policy "Users can delete their own dismissed profiles"
  on public.dismissed_profiles
  for delete
  using ((select auth.uid()) = user_id);
