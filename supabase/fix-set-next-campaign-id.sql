-- Atomic single-row campaign counter.
-- The counter row is the single source of truth; it is atomically
-- incremented/decremented by the RPCs below, never recomputed from the
-- registry on every click. Realtime broadcasts the row so every open tab
-- stays in sync without a refresh.
-- Run this entire file in Supabase SQL Editor to replace the existing RPCs.

create table if not exists public.campaign_counter (
  id integer primary key default 1 check (id = 1),
  current_value integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Seed the counter once from the current registry state so existing data is preserved.
insert into public.campaign_counter (id, current_value)
select 1, coalesce((
  select cr.campaign_id
  from public.campaign_registry as cr
  order by cr.generated_at desc, cr.id desc
  limit 1
), 0)
on conflict (id) do nothing;

-- Add full_id column to store the complete generated ID (YYYYMMDD_name_XXXX)
alter table if exists public.campaign_registry
  add column if not exists full_id text;
alter table public.campaign_counter enable row level security;
drop policy if exists campaign_counter_select on public.campaign_counter;
create policy campaign_counter_select on public.campaign_counter
  for select to anon, authenticated
  using (true);

-- Publish counter and registry changes through Realtime.
do $$
begin
  alter publication supabase_realtime add table public.campaign_counter;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.campaign_registry;
exception
  when duplicate_object then null;
end $$;

drop function if exists public.generate_campaign_id(text);
drop function if exists public.back_campaign_id(text);
drop function if exists public.set_next_campaign_id(integer, text, text);

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
    campaign_id,
    action,
    generated_by,
    note,
    full_id
  )
  values (
    v_next_campaign_id,
    'generated',
    v_generated_by,
    null,
    v_full_id
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
    campaign_id,
    action,
    generated_by,
    note
  )
  values (
    v_next_campaign_id,
    'manual_set',
    v_generated_by,
    'Stepped back one Campaign ID'
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
    campaign_id,
    action,
    generated_by,
    note
  )
  values (
    p_next_campaign_id,
    'manual_set',
    v_generated_by,
    nullif(btrim(p_note), '')
  )
  returning * into v_registry;

  return v_registry;
end;
$$;

revoke all on function public.generate_campaign_id(text) from public;
revoke all on function public.back_campaign_id(text) from public;
revoke all on function public.set_next_campaign_id(integer, text, text) from public;
grant execute on function public.generate_campaign_id(text) to anon, authenticated;
grant execute on function public.back_campaign_id(text) to anon, authenticated;
grant execute on function public.set_next_campaign_id(integer, text, text) to anon, authenticated;