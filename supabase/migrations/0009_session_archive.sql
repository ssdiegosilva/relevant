alter table public.daily_sessions add column if not exists archived_at timestamptz;

create index if not exists daily_sessions_user_active_idx
  on public.daily_sessions (user_id, created_at desc)
  where completed_at is null and archived_at is null;
