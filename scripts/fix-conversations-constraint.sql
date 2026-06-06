alter table public.conversations
drop constraint if exists conversations_unique_listing_participants;

alter table public.conversations
add constraint conversations_unique_listing_participants
unique (listing_id, buyer_id, seller_id);
