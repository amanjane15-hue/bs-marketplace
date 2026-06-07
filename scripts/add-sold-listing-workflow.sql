-- Part 2: Add listing fields
alter table public.listings
add column if not exists listing_status text not null default 'active';

alter table public.listings
add column if not exists sold_at timestamptz;

alter table public.listings
add column if not exists sold_to uuid references auth.users(id);

alter table public.listings
add column if not exists sold_by uuid references auth.users(id);

alter table public.listings
drop constraint if exists listings_status_check;

alter table public.listings
add constraint listings_status_check
check (
  listing_status in ('active', 'sold')
);

-- Consistency constraint
alter table public.listings
drop constraint if exists listings_sale_state_check;

alter table public.listings
add constraint listings_sale_state_check
check (
  (
    listing_status = 'active'
    and sold_at is null
    and sold_to is null
    and sold_by is null
  )
  or
  (
    listing_status = 'sold'
    and sold_at is not null
    and sold_by = user_id
    and (
      sold_to is null
      or sold_to <> user_id
    )
  )
);


-- Part 3: Create seller sale event history
create table if not exists public.listing_sale_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid references auth.users(id) on delete set null,
  action text not null,
  created_at timestamptz not null default now()
);

alter table public.listing_sale_events
drop constraint if exists listing_sale_events_action_check;

alter table public.listing_sale_events
add constraint listing_sale_events_action_check
check (
  action in ('mark_sold', 'restore_listing')
);

alter table public.listing_sale_events enable row level security;

-- Read policy
drop policy if exists listing_sale_events_select_related
on public.listing_sale_events;

create policy listing_sale_events_select_related
on public.listing_sale_events
for select
to authenticated
using (
  seller_id = auth.uid()
  or buyer_id = auth.uid()
  or public.is_admin()
);

grant select on public.listing_sale_events to authenticated;


-- Part 4: Create secure mark-sold RPC
create or replace function public.mark_listing_sold(
  p_listing_id uuid,
  p_buyer_id uuid default null
)
returns public.listings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_listing public.listings;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if v_listing.id is null then
    raise exception 'Listing not found';
  end if;

  if v_listing.user_id <> v_user_id then
    raise exception 'Only the listing owner can mark it as sold';
  end if;

  if v_listing.listing_status = 'sold' then
    raise exception 'Listing is already sold';
  end if;

  if p_buyer_id = v_user_id then
    raise exception 'Seller cannot be selected as buyer';
  end if;

  if p_buyer_id is not null
     and not exists (
       select 1
       from public.conversations c
       where c.listing_id = p_listing_id
         and c.seller_id = v_user_id
         and c.buyer_id = p_buyer_id
     ) then
    raise exception 'Selected buyer must have an existing conversation for this listing';
  end if;

  update public.listings
  set
    listing_status = 'sold',
    sold_at = now(),
    sold_to = p_buyer_id,
    sold_by = v_user_id
  where id = p_listing_id
  returning * into v_listing;

  insert into public.listing_sale_events (
    listing_id,
    seller_id,
    buyer_id,
    action
  )
  values (
    p_listing_id,
    v_user_id,
    p_buyer_id,
    'mark_sold'
  );

  return v_listing;
end;
$$;

revoke all
on function public.mark_listing_sold(uuid, uuid)
from public, anon, authenticated;

grant execute
on function public.mark_listing_sold(uuid, uuid)
to authenticated;


-- Part 5: Create secure restore RPC
create or replace function public.restore_sold_listing(
  p_listing_id uuid
)
returns public.listings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_listing public.listings;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if v_listing.id is null then
    raise exception 'Listing not found';
  end if;

  if v_listing.user_id <> v_user_id then
    raise exception 'Only the listing owner can restore it';
  end if;

  if v_listing.listing_status <> 'sold' then
    raise exception 'Listing is not sold';
  end if;

  insert into public.listing_sale_events (
    listing_id,
    seller_id,
    buyer_id,
    action
  )
  values (
    p_listing_id,
    v_user_id,
    v_listing.sold_to,
    'restore_listing'
  );

  update public.listings
  set
    listing_status = 'active',
    sold_at = null,
    sold_to = null,
    sold_by = null
  where id = p_listing_id
  returning * into v_listing;

  return v_listing;
end;
$$;

revoke all
on function public.restore_sold_listing(uuid)
from public, anon, authenticated;

grant execute
on function public.restore_sold_listing(uuid)
to authenticated;


-- Part 6: Protect direct API updates
create or replace function public.protect_listing_sale_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    old.listing_status is distinct from new.listing_status
    or old.sold_at is distinct from new.sold_at
    or old.sold_to is distinct from new.sold_to
    or old.sold_by is distinct from new.sold_by
  ) and current_user not in ('postgres', 'service_role') then
    raise exception 'Use the secure sale workflow to update listing sale status';
  end if;

  return new;
end;
$$;

drop trigger if exists listings_protect_sale_fields on public.listings;

create trigger listings_protect_sale_fields
before update on public.listings
for each row
execute function public.protect_listing_sale_fields();


-- Part 7: Block new conversations for sold listings
create or replace function public.prevent_conversation_for_unavailable_listing()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.listings l
    where l.id = new.listing_id
      and l.listing_status = 'active'
      and l.moderation_status = 'active'
  ) then
    raise exception 'This listing is no longer available';
  end if;

  return new;
end;
$$;

drop trigger if exists conversations_prevent_unavailable_listing
on public.conversations;

create trigger conversations_prevent_unavailable_listing
before insert on public.conversations
for each row
execute function public.prevent_conversation_for_unavailable_listing();


-- Part 8: Database-level listing visibility
drop policy if exists listings_sale_visibility_guard_anon
on public.listings;

create policy listings_sale_visibility_guard_anon
on public.listings
as restrictive
for select
to anon
using (
  listing_status = 'active'
);

drop policy if exists listings_sale_visibility_guard_authenticated
on public.listings;

create policy listings_sale_visibility_guard_authenticated
on public.listings
as restrictive
for select
to authenticated
using (
  listing_status = 'active'
  or user_id = auth.uid()
  or public.is_admin()
);


-- Part 9: Add indexes
create index if not exists listings_status_created_at_idx
on public.listings (listing_status, created_at desc);

create index if not exists listing_sale_events_listing_created_idx
on public.listing_sale_events (listing_id, created_at desc);
