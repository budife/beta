-- Replace the Campaign Counter RPCs.
-- The latest registry activity is the current pointer. A manual set to 0314
-- means the next Generate call creates 0315, regardless of older high IDs.
-- Run this entire file in Supabase SQL Editor to replace both existing RPCs.

drop function if exists public.generate_campaign_id(text);

drop function if exists public.set_next_campaign_id(integer, text, text);

create function public.generate_campaign_id(
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

  perform pg_advisory_xact_lock(hashtext('campaign-registry'));

  select coalesce((
    select cr.campaign_id + 1
    from public.campaign_registry as cr
    order by cr.generated_at desc, cr.id desc
    limit 1
  ), 1)
  into v_next_campaign_id;

  if v_next_campaign_id > 9999 then
    raise exception 'Campaign ID must be between 0001 and 9999';
  end if;

  insert into public.campaign_registry (
    campaign_id,
    action,
    generated_by,
    note
  )
  values (
    v_next_campaign_id,
    'generated',
    v_generated_by,
    null
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

  perform pg_advisory_xact_lock(hashtext('campaign-registry'));

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

revoke all on function public.set_next_campaign_id(integer, text, text) from public;
revoke all on function public.generate_campaign_id(text) from public;
grant execute on function public.set_next_campaign_id(integer, text, text) to anon, authenticated;
grant execute on function public.generate_campaign_id(text) to anon, authenticated;
