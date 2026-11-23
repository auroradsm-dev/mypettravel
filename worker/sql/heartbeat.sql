-- Keep alive for the free Supabase project.
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- The Worker calls ping() every hour. Each call WRITES a timestamp, which is
-- real database activity, and returns the previous one so the Worker can tell
-- when the database was unreachable for a while (it was paused and is back).
--
-- Security: the table has row level security on and no policies, so nobody can
-- read or write it directly. ping() runs as its owner (security definer) and can
-- only ever update this one timestamp, so letting the public anon key call it
-- is harmless.

create table if not exists public.heartbeat (
  id int primary key check (id = 1),
  last_ping timestamptz not null default now()
);

alter table public.heartbeat enable row level security;
revoke all on table public.heartbeat from anon, authenticated;

create or replace function public.ping()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  previous timestamptz;
begin
  select last_ping into previous from heartbeat where id = 1;
  insert into heartbeat (id, last_ping) values (1, now())
  on conflict (id) do update set last_ping = excluded.last_ping;
  return previous;
end;
$$;

revoke execute on function public.ping() from public;
grant execute on function public.ping() to anon;

-- Check it works: the first call returns null, the next ones the previous time.
select public.ping();
