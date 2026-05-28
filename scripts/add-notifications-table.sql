-- Notifications table for user notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  title text,
  body text,
  link text,
  read_at timestamptz null,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications_insert_auth" on public.notifications for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_delete_own" on public.notifications for delete using (user_id = auth.uid());

grant select, insert, update, delete on public.notifications to authenticated;

-- End notifications migration
