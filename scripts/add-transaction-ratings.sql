-- scripts/add-transaction-ratings.sql

-- Part 1: Create transaction_ratings table
create table if not exists public.transaction_ratings (
  id uuid primary key default gen_random_uuid(),

  listing_id uuid not null
    references public.listings(id)
    on delete cascade,

  reviewer_id uuid not null
    references auth.users(id)
    on delete cascade,

  reviewee_id uuid not null
    references auth.users(id)
    on delete cascade,

  rating smallint not null,

  review_text text,

  rating_direction text not null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

-- Rating constraint
alter table public.transaction_ratings
drop constraint if exists transaction_ratings_rating_check;

alter table public.transaction_ratings
add constraint transaction_ratings_rating_check
check (
  rating between 1 and 5
);

-- Review length constraint
alter table public.transaction_ratings
drop constraint if exists transaction_ratings_review_text_length_check;

alter table public.transaction_ratings
add constraint transaction_ratings_review_text_length_check
check (
  review_text is null
  or char_length(trim(review_text)) between 1 and 500
);

-- Direction constraint
alter table public.transaction_ratings
drop constraint if exists transaction_ratings_direction_check;

alter table public.transaction_ratings
add constraint transaction_ratings_direction_check
check (
  rating_direction in (
    'buyer_to_seller',
    'seller_to_buyer'
  )
);

-- Prevent self-rating
alter table public.transaction_ratings
drop constraint if exists transaction_ratings_no_self_rating_check;

alter table public.transaction_ratings
add constraint transaction_ratings_no_self_rating_check
check (
  reviewer_id <> reviewee_id
);

-- Prevent duplicate reviews
create unique index if not exists
transaction_ratings_unique_transaction_direction_idx
on public.transaction_ratings (
  listing_id,
  reviewer_id,
  reviewee_id
);

-- Add indexes
create index if not exists transaction_ratings_reviewee_created_idx
on public.transaction_ratings (
  reviewee_id,
  created_at desc
);

create index if not exists transaction_ratings_listing_idx
on public.transaction_ratings (
  listing_id
);

-- Enable RLS
alter table public.transaction_ratings
enable row level security;

-- Part 2: Block direct inserts and updates
revoke all
on public.transaction_ratings
from anon, authenticated;

grant select
on public.transaction_ratings
to anon, authenticated;

-- Part 3: Public read policy
drop policy if exists transaction_ratings_select_public
on public.transaction_ratings;

create policy transaction_ratings_select_public
on public.transaction_ratings
for select
to anon, authenticated
using (true);

-- Part 4: Create secure submit-rating RPC
create or replace function public.submit_transaction_rating(
  p_listing_id uuid,
  p_rating smallint,
  p_review_text text default null
)
returns public.transaction_ratings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_listing public.listings;
  v_reviewee_id uuid;
  v_direction text;
  v_rating public.transaction_ratings;
  v_review_text text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5 stars';
  end if;

  v_review_text := nullif(trim(coalesce(p_review_text, '')), '');

  if v_review_text is not null
     and char_length(v_review_text) > 500 then
    raise exception 'Review cannot exceed 500 characters';
  end if;

  select *
  into v_listing
  from public.listings
  where id = p_listing_id;

  if v_listing.id is null then
    raise exception 'Listing not found';
  end if;

  if v_listing.listing_status <> 'sold' then
    raise exception 'Ratings are only available after a completed sale';
  end if;

  if v_listing.sold_to is null then
    raise exception 'A buyer must be selected before ratings are enabled';
  end if;

  if v_listing.sold_by is null then
    raise exception 'Seller information is missing';
  end if;

  if v_user_id = v_listing.sold_to then
    v_reviewee_id := v_listing.sold_by;
    v_direction := 'buyer_to_seller';

  elsif v_user_id = v_listing.sold_by then
    v_reviewee_id := v_listing.sold_to;
    v_direction := 'seller_to_buyer';

  else
    raise exception 'Only the buyer or seller can rate this transaction';
  end if;

  if v_user_id = v_reviewee_id then
    raise exception 'You cannot rate yourself';
  end if;

  insert into public.transaction_ratings (
    listing_id,
    reviewer_id,
    reviewee_id,
    rating,
    review_text,
    rating_direction
  )
  values (
    p_listing_id,
    v_user_id,
    v_reviewee_id,
    p_rating,
    v_review_text,
    v_direction
  )
  on conflict (
    listing_id,
    reviewer_id,
    reviewee_id
  )
  do update set
    rating = excluded.rating,
    review_text = excluded.review_text,
    updated_at = now()
  returning * into v_rating;

  return v_rating;
end;
$$;

revoke all
on function public.submit_transaction_rating(uuid, smallint, text)
from public, anon, authenticated;

grant execute
on function public.submit_transaction_rating(uuid, smallint, text)
to authenticated;

-- Part 5: Create rating summary RPC
create or replace function public.get_profile_rating_summary(
  p_user_id uuid
)
returns table (
  average_rating numeric,
  total_ratings bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(round(avg(r.rating)::numeric, 1), 0),
    count(*)
  from public.transaction_ratings r
  where r.reviewee_id = p_user_id;
$$;

revoke all
on function public.get_profile_rating_summary(uuid)
from public;

grant execute
on function public.get_profile_rating_summary(uuid)
to anon, authenticated;

-- Part 6: Create public reviews RPC
create or replace function public.get_profile_reviews(
  p_user_id uuid,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  listing_id uuid,
  reviewer_id uuid,
  reviewer_name text,
  reviewer_avatar_url text,
  rating smallint,
  review_text text,
  rating_direction text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.listing_id,
    r.reviewer_id,
    coalesce(p.display_name, 'Student'),
    p.avatar_url,
    r.rating,
    r.review_text,
    r.rating_direction,
    r.created_at,
    r.updated_at
  from public.transaction_ratings r
  left join public.profiles p
    on p.user_id = r.reviewer_id
  where r.reviewee_id = p_user_id
  order by r.updated_at desc
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$$;

revoke all
on function public.get_profile_reviews(uuid, integer, integer)
from public;

grant execute
on function public.get_profile_reviews(uuid, integer, integer)
to anon, authenticated;
