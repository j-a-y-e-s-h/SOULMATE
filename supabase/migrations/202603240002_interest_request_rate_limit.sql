do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.interest_requests'::regclass
      and conname = 'interest_requests_from_user_id_to_user_id_key'
  ) then
    alter table public.interest_requests
      add constraint interest_requests_from_user_id_to_user_id_key
      unique (from_user_id, to_user_id);
  end if;
end
$$;

create index if not exists interest_requests_from_user_id_created_at_idx
  on public.interest_requests (from_user_id, created_at desc);

create or replace function public.enforce_interest_request_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent_request_count integer;
begin
  select count(*)
  into recent_request_count
  from public.interest_requests
  where from_user_id = new.from_user_id
    and created_at >= now() - interval '24 hours';

  if recent_request_count >= 20 then
    raise exception using
      errcode = 'P0001',
      message = 'INTEREST_REQUEST_RATE_LIMIT',
      detail = 'You can send up to 20 interest requests every 24 hours. Please try again later.';
  end if;

  return new;
end;
$$;

drop trigger if exists interest_requests_rate_limit_trigger on public.interest_requests;
create trigger interest_requests_rate_limit_trigger
before insert on public.interest_requests
for each row
execute function public.enforce_interest_request_rate_limit();
