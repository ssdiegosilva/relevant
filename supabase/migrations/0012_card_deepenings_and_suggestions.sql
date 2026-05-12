-- Card suggestions: short next-step prompts the LLM offers per card,
-- shown as buttons the user can tap to go deeper. Generated alongside
-- the card itself.
alter table public.cards
  add column if not exists suggestions text[] default '{}';

-- Card deepenings: each row is an LLM-generated expansion of a card,
-- triggered by the user tapping a suggestion. Stored so the user can
-- scroll back through their exploration trail on a card.
create table if not exists public.card_deepenings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  prompt text not null,
  content text not null,
  suggestions text[] default '{}',
  created_at timestamptz not null default now()
);

create index if not exists card_deepenings_card_id_idx
  on public.card_deepenings(card_id, created_at);

create index if not exists card_deepenings_user_id_idx
  on public.card_deepenings(user_id, created_at desc);

-- RLS: user can only see/insert their own deepenings.
alter table public.card_deepenings enable row level security;

create policy "card_deepenings_select_own"
  on public.card_deepenings for select
  using (auth.uid() = user_id);

create policy "card_deepenings_insert_own"
  on public.card_deepenings for insert
  with check (auth.uid() = user_id);
