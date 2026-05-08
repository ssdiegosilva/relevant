alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.topics enable row level security;
alter table public.topic_embeddings enable row level security;
alter table public.challenges enable row level security;
alter table public.daily_sessions enable row level security;
alter table public.cards enable row level security;
alter table public.card_embeddings enable row level security;
alter table public.card_topics enable row level security;
alter table public.card_interactions enable row level security;
alter table public.xp_events enable row level security;
alter table public.streaks enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.generation_logs enable row level security;

create policy "profiles self read" on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "settings self all" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "challenges self all" on public.challenges for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sessions self all" on public.daily_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cards self read" on public.cards for select using (auth.uid() = user_id);
create policy "cards self update" on public.cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cards self delete" on public.cards for delete using (auth.uid() = user_id);

create policy "card_embeddings self read" on public.card_embeddings for select
  using (exists (select 1 from public.cards c where c.id = card_id and c.user_id = auth.uid()));

create policy "card_topics self read" on public.card_topics for select
  using (exists (select 1 from public.cards c where c.id = card_id and c.user_id = auth.uid()));

create policy "interactions self all" on public.card_interactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "xp self read" on public.xp_events for select using (auth.uid() = user_id);

create policy "streaks self read" on public.streaks for select using (auth.uid() = user_id);

create policy "topics public read" on public.topics for select using (true);

create policy "topic_embeddings public read" on public.topic_embeddings for select using (true);

create policy "achievements public read" on public.achievements for select using (true);

create policy "user_achievements self read" on public.user_achievements for select using (auth.uid() = user_id);

create policy "logs self read" on public.generation_logs for select using (auth.uid() = user_id);
