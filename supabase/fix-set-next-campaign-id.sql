-- Clean migration: drops all generate_campaign_id overloads, recreates with 3 params
-- Run this entire block in Supabase SQL Editor

-- 1) Drop any existing overloads of generate_campaign_id
do $$
begin
  drop function if exists public.generate_campaign_id(text) cascade;
  drop function if exists public.generate_campaign_id(text, text, text) cascade;
exception when others then null;
end $$;

drop function if exists public.back_campaign_id(text) cascade;
drop function if exists public.set_next_campaign_id(integer, text, text) cascade;

-- 2) Ensure campaign_counter table exists and is seeded
create table if not exists public.campaign_counter (
  id integer primary key default 1 check (id = 1),
  current_value integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.campaign_counter (id, current_value)
select 1, coalesce((
  select cr.campaign_id
  from public.campaign_registry as cr
  order by cr.generated_at desc, cr.id desc
  limit 1
), 0)
on conflict (id) do nothing;

-- 3) Add full_id column to registry
alter table if exists public.campaign_registry
  add column if not exists full_id text;

-- 4) RLS + policies
alter table public.campaign_counter enable row level security;
drop policy if exists campaign_counter_select on public.campaign_counter;
create policy campaign_counter_select on public.campaign_counter
  for select to anon, authenticated using (true);

-- 5) Realtime publications
do $$
begin
  alter publication supabase_realtime add table public.campaign_counter;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.campaign_registry;
exception when duplicate_object then null;
end $$;

-- 6) New RPCs with correct signatures
create function public.generate_campaign_id(
  p_generated_by text,
  p_date_stamp text default null,
  p_campaign_name text default null
)
returns public.campaign_registry
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registry public.campaign_registry;
  v_generated_by text;
  v_next_campaign_id integer;
  v_full_id text;
begin
  v_generated_by := nullif(btrim(p_generated_by), '');
  if v_generated_by is null then
    raise exception 'A user name is required';
  end if;

  update public.campaign_counter
  set current_value = current_value + 1,
      updated_at = now()
  where id = 1
  returning current_value into v_next_campaign_id;

  if v_next_campaign_id is null then
    raise exception 'Campaign counter is not initialised';
  end if;

  if v_next_campaign_id > 9999 then
    raise exception 'Campaign ID must be between 0001 and 9999';
  end if;

  v_full_id := format('%s_%s_%s',
    coalesce(nullif(btrim(p_date_stamp), ''), to_char(now(), 'YYYYMMDD')),
    coalesce(nullif(btrim(p_campaign_name), ''), 'nama-campaign'),
    lpad(v_next_campaign_id::text, 4, '0')
  );

  insert into public.campaign_registry (
    campaign_id, action, generated_by, note, full_id
  )
  values (
    v_next_campaign_id, 'generated', v_generated_by, null, v_full_id
  )
  returning * into v_registry;

  return v_registry;
end;
$$;

create function public.back_campaign_id(
  p_generated_by text
)
returns public.campaign_registry
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registry public.campaign_registry;
  v_generated_by text;
  v_next_campaign_id integer;
begin
  v_generated_by := nullif(btrim(p_generated_by), '');
  if v_generated_by is null then
    raise exception 'A user name is required';
  end if;

  update public.campaign_counter
  set current_value = greatest(current_value - 1, 1),
      updated_at = now()
  where id = 1
  returning current_value into v_next_campaign_id;

  if v_next_campaign_id is null then
    raise exception 'Campaign counter is not initialised';
  end if;

  insert into public.campaign_registry (
    campaign_id, action, generated_by, note
  )
  values (
    v_next_campaign_id, 'manual_set', v_generated_by, 'Stepped back one Campaign ID'
  )
  returning * into v_registry;

  return v_registry;
end;
$$;

create function public.set_next_campaign_id(
  p_next_campaign_id integer,
  p_generated_by text,
  p_note text default null
)
returns public.campaign_registry
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registry public.campaign_registry;
  v_generated_by text;
begin
  v_generated_by := nullif(btrim(p_generated_by), '');
  if v_generated_by is null then
    raise exception 'A user name is required';
  end if;

  if p_next_campaign_id < 1 or p_next_campaign_id > 9999 then
    raise exception 'Campaign ID must be between 0001 and 9999';
  end if;

  update public.campaign_counter
  set current_value = p_next_campaign_id,
      updated_at = now()
  where id = 1;

  insert into public.campaign_registry (
    campaign_id, action, generated_by, note
  )
  values (
    p_next_campaign_id, 'manual_set', v_generated_by, nullif(btrim(p_note), '')
  )
  returning * into v_registry;

  return v_registry;
end;
$$;

grant execute on function public.generate_campaign_id(text, text, text) to anon, authenticated;
grant execute on function public.back_campaign_id(text) to anon, authenticated;
grant execute on function public.set_next_campaign_id(integer, text, text) to anon, authenticated;

-- Folder scan backup
create table if not exists public.campaign_folder_scans (
  id bigserial primary key,
  scanned_by text not null,
  folder_name text not null,
  campaign_id text not null,
  campaign_name text,
  folder_date text,
  manager text,
  scanned_at timestamptz not null default now(),
  unique (scanned_by, folder_name, campaign_id)
);

alter table public.campaign_folder_scans enable row level security;
drop policy if exists campaign_folder_scans_all on public.campaign_folder_scans;
create policy campaign_folder_scans_all on public.campaign_folder_scans
  for all to anon, authenticated using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table public.campaign_folder_scans;
exception when duplicate_object then null;
end $$;

create function public.save_folder_scan(
  p_scanned_by text,
  p_folder_name text,
  p_entries jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_entry jsonb;
begin
  if p_scanned_by is null or p_scanned_by = '' then
    raise exception 'User name is required';
  end if;

  for v_entry in select * from jsonb_array_elements(p_entries)
  loop
    insert into public.campaign_folder_scans (
      scanned_by, folder_name, campaign_id, campaign_name, folder_date, manager
    )
    values (
      p_scanned_by,
      p_folder_name,
      v_entry->>'campaign_id',
      v_entry->>'campaign_name',
      v_entry->>'folder_date',
      v_entry->>'manager'
    )
    on conflict (scanned_by, folder_name, campaign_id) do nothing;
    if found then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.save_folder_scan(text, text, jsonb) to anon, authenticated;

-- Load previous scans for a user
create function public.load_folder_scans(
  p_scanned_by text
)
returns setof public.campaign_folder_scans
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select * from public.campaign_folder_scans
  where scanned_by = p_scanned_by
  order by scanned_at desc;
end;
$$;

grant execute on function public.load_folder_scans(text) to anon, authenticated;