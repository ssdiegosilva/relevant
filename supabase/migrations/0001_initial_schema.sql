create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text,
  role text,
  experience_years smallint check (experience_years between 0 and 60),
  interests text[] default '{}',
  goals text,
  total_xp integer not null default 0,
  level smallint not null default 1,
  timezone text not null default 'America/Sao_Paulo',
  push_token text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users on delete cascade,
  notifications_enabled boolean not null default true,
  daily_goal_cards smallint not null default 3 check (daily_goal_cards between 1 and 10),
  preferred_study_time time not null default '20:00',
  card_language text not null default 'en',
  updated_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  parent_id uuid references public.topics(id) on delete set null,
  description text,
  aliases text[] default '{}',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.topic_embeddings (
  topic_id uuid primary key references public.topics(id) on delete cascade,
  embedding vector(1536) not null
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  description text not null,
  context text,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now()
);

create table public.daily_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  card_count smallint not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  session_id uuid not null references public.daily_sessions(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  title text not null check (length(title) <= 200),
  content text not null,
  card_type text not null check (card_type in ('concept','example','best_practice','pitfall','news')),
  difficulty smallint not null check (difficulty between 1 and 5),
  estimated_minutes smallint not null check (estimated_minutes between 1 and 30),
  source text not null,
  content_hash text not null,
  created_at timestamptz not null default now()
);

create table public.card_embeddings (
  card_id uuid primary key references public.cards(id) on delete cascade,
  embedding vector(1536) not null
);

create table public.card_topics (
  card_id uuid not null references public.cards(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  primary key (card_id, topic_id)
);

create table public.card_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  action text not null check (action in ('viewed','studied','saved','skipped','deepened','rated')),
  rating smallint check (rating between 1 and 5),
  time_spent_sec integer,
  created_at timestamptz not null default now()
);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  amount integer not null,
  source text not null,
  source_id uuid,
  created_at timestamptz not null default now()
);

create table public.streaks (
  user_id uuid primary key references auth.users on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  active_days_this_week smallint not null default 0,
  week_start_date date
);

create table public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  xp_reward integer not null default 0
);

create table public.user_achievements (
  user_id uuid not null references auth.users on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table public.generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  session_id uuid references public.daily_sessions(id) on delete set null,
  model text not null,
  prompt_tokens integer,
  completion_tokens integer,
  cost_usd numeric(10,6),
  latency_ms integer,
  status text not null check (status in ('success','error')),
  error_message text,
  created_at timestamptz not null default now()
);

create index cards_user_created_idx on public.cards (user_id, created_at desc);
create index cards_session_idx on public.cards (session_id);
create index card_topics_card_idx on public.card_topics (card_id);
create index card_topics_topic_idx on public.card_topics (topic_id);
create index card_interactions_user_card_idx on public.card_interactions (user_id, card_id, created_at desc);
create index xp_events_user_idx on public.xp_events (user_id, created_at desc);
create index challenges_user_idx on public.challenges (user_id, created_at desc);
create index daily_sessions_user_idx on public.daily_sessions (user_id, created_at desc);
create index profiles_interests_gin on public.profiles using gin (interests);
create index generation_logs_user_idx on public.generation_logs (user_id, created_at desc);

create index card_embeddings_hnsw on public.card_embeddings using hnsw (embedding vector_cosine_ops);
create index topic_embeddings_hnsw on public.topic_embeddings using hnsw (embedding vector_cosine_ops);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
