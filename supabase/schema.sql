-- MELBOURNE '27 — Supabase schema
-- Run in Supabase Dashboard → SQL Editor.

-- One JSON document per user holding all app data.
create table if not exists public.app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

create policy "own state - select" on public.app_state for select using (auth.uid() = user_id);
create policy "own state - insert" on public.app_state for insert with check (auth.uid() = user_id);
create policy "own state - update" on public.app_state for update using (auth.uid() = user_id);
create policy "own state - delete" on public.app_state for delete using (auth.uid() = user_id);

-- Private bucket for attachments (task files, banner image).
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "own files - read" on storage.objects for select
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files - write" on storage.objects for insert
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files - delete" on storage.objects for delete
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
