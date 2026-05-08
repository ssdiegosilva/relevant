create or replace function public.on_card_interaction()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.action = 'studied' then
    perform public.add_xp(new.user_id, 10, 'card_studied', new.card_id);
    perform public.touch_streak(new.user_id);

    if not exists (select 1 from public.user_achievements where user_id = new.user_id and achievement_id = 'first-card') then
      perform public.unlock_achievement(new.user_id, 'first-card');
    end if;

    if (
      select count(*)
      from public.card_interactions ci
      where ci.user_id = new.user_id
        and ci.action = 'studied'
        and ci.created_at::date = (now() at time zone (select coalesce(timezone, 'UTC') from public.profiles where id = new.user_id))::date
    ) >= 3 then
      perform public.unlock_achievement(new.user_id, 'daily-3');
    end if;
  elsif new.action = 'deepened' then
    perform public.add_xp(new.user_id, 5, 'card_deepened', new.card_id);
  end if;
  return new;
end;
$$;

drop trigger if exists card_interaction_after_insert on public.card_interactions;
create trigger card_interaction_after_insert
after insert on public.card_interactions
for each row execute function public.on_card_interaction();
