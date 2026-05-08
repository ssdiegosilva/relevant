create or replace function public.add_xp(p_user_id uuid, p_amount integer, p_source text, p_source_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare new_total integer;
begin
  insert into xp_events(user_id, amount, source, source_id) values (p_user_id, p_amount, p_source, p_source_id);
  update profiles set total_xp = total_xp + p_amount, level = greatest(1, floor(ln(greatest(total_xp + p_amount, 1)) / ln(1.6))::int) where id = p_user_id
    returning total_xp into new_total;
end;
$$;

create or replace function public.touch_streak(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  user_tz text;
  today_local date;
  s record;
  this_monday date;
begin
  select coalesce(timezone, 'UTC') into user_tz from profiles where id = p_user_id;
  today_local := (now() at time zone user_tz)::date;
  this_monday := today_local - ((extract(dow from today_local)::int + 6) % 7);

  select * into s from streaks where user_id = p_user_id for update;
  if not found then
    insert into streaks(user_id, last_active_date, active_days_this_week, week_start_date)
      values (p_user_id, today_local, 1, this_monday);
    return;
  end if;

  if s.last_active_date is not null and s.last_active_date = today_local then
    return;
  end if;

  if s.week_start_date is null or s.week_start_date < this_monday then
    update streaks
      set active_days_this_week = 1,
          week_start_date = this_monday,
          last_active_date = today_local
      where user_id = p_user_id;
    perform add_xp(p_user_id, 10, 'active_day');
    return;
  end if;

  update streaks
    set active_days_this_week = active_days_this_week + 1,
        last_active_date = today_local
    where user_id = p_user_id;
  perform add_xp(p_user_id, 10, 'active_day');
end;
$$;

create or replace function public.unlock_achievement(p_user_id uuid, p_achievement_id text)
returns boolean language plpgsql security definer set search_path = public as $$
declare existing record; reward integer;
begin
  select 1 into existing from user_achievements where user_id = p_user_id and achievement_id = p_achievement_id;
  if found then return false; end if;

  insert into user_achievements(user_id, achievement_id) values (p_user_id, p_achievement_id);
  select xp_reward into reward from achievements where id = p_achievement_id;
  if reward is not null and reward > 0 then
    perform add_xp(p_user_id, reward, 'achievement', null);
  end if;
  return true;
end;
$$;
