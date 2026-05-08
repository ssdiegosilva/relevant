create or replace function public.on_card_interaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s_id uuid;
  total int;
  acted int;
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

  if new.action in ('studied','saved','skipped') then
    select session_id into s_id from public.cards where id = new.card_id;
    if s_id is not null then
      select count(*) into total from public.cards where session_id = s_id;
      select count(distinct ci.card_id) into acted
        from public.card_interactions ci
        where ci.card_id in (select id from public.cards where session_id = s_id)
          and ci.action in ('studied','saved','skipped');
      if total > 0 and acted >= total then
        update public.daily_sessions set completed_at = now()
          where id = s_id and completed_at is null;
      end if;
    end if;
  end if;

  return new;
end;
$$;
