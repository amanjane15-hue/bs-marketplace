-- Create table
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references auth.users(id)
    on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid
    references auth.users(id)
    on delete set null
);

-- Add constraints
alter table public.support_requests
drop constraint if exists support_requests_subject_length_check;

alter table public.support_requests
add constraint support_requests_subject_length_check
check (
  char_length(trim(subject)) between 3 and 120
);

alter table public.support_requests
drop constraint if exists support_requests_message_length_check;

alter table public.support_requests
add constraint support_requests_message_length_check
check (
  char_length(trim(message)) between 10 and 2000
);

alter table public.support_requests
drop constraint if exists support_requests_status_check;

alter table public.support_requests
add constraint support_requests_status_check
check (
  status in (
    'open',
    'resolved'
  )
);

-- Add indexes
create index if not exists support_requests_user_created_idx
on public.support_requests (
  user_id,
  created_at desc
);

create index if not exists support_requests_status_created_idx
on public.support_requests (
  status,
  created_at desc
);

-- Enable RLS and lock down table
alter table public.support_requests
enable row level security;

revoke all
on public.support_requests
from public, anon, authenticated;

-- Secure RPC for submission
create or replace function public.submit_support_request(
  p_subject text,
  p_message text
)
returns table (
  id uuid,
  subject text,
  message text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_subject text;
  v_message text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_subject := trim(p_subject);
  v_message := trim(p_message);

  if char_length(v_subject) < 3 or char_length(v_subject) > 120 then
    raise exception 'Subject must be between 3 and 120 characters';
  end if;

  if char_length(v_message) < 10 or char_length(v_message) > 2000 then
    raise exception 'Message must be between 10 and 2000 characters';
  end if;

  return query
  insert into public.support_requests (
    user_id,
    subject,
    message
  )
  values (
    v_user_id,
    v_subject,
    v_message
  )
  returning
    support_requests.id,
    support_requests.subject,
    support_requests.message,
    support_requests.status,
    support_requests.created_at;
end;
$$;

revoke all
on function public.submit_support_request(text, text)
from public, anon, authenticated;

grant execute
on function public.submit_support_request(text, text)
to authenticated;

notify pgrst, 'reload schema';
