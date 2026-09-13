-- Complete setup for the Strava integration.
-- The existing public.activities table is a leftover schema
-- (uuid id, user_id, distance, timestamp). Rename it, then create ours.

create table if not exists public.strava_athletes (
  athlete_id bigint primary key,
  firstname text,
  lastname text,
  scope text,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  sync_error text
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activities'
      and column_name = 'user_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activities'
      and column_name = 'athlete_id'
  ) then
    if to_regclass('public.activities_legacy') is null then
      alter table public.activities rename to activities_legacy;
    else
      drop table public.activities;
    end if;
  end if;
end $$;

create table if not exists public.activities (
  strava_activity_id bigint primary key,
  athlete_id bigint not null,
  type text,
  name text,
  start_date date not null,
  distance_in_k numeric,
  moving_time integer,
  total_elevation_gain numeric
);

create index if not exists activities_athlete_id_idx on public.activities (athlete_id);
create index if not exists activities_start_date_idx on public.activities (start_date);
create index if not exists activities_type_idx on public.activities (type);

alter table public.strava_athletes enable row level security;
alter table public.activities enable row level security;

drop policy if exists "Activities are publicly readable" on public.activities;
create policy "Activities are publicly readable"
  on public.activities
  for select
  to anon, authenticated
  using (true);
