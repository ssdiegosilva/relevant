-- Backfill: mark sessions as completed where every card already has a studied/saved/skipped interaction.
-- This catches sessions created before the auto-complete trigger was added.

update public.daily_sessions ds
set completed_at = now()
where ds.completed_at is null
  and exists (
    select 1 from public.cards c where c.session_id = ds.id
  )
  and (
    select count(*) from public.cards c where c.session_id = ds.id
  ) <= (
    select count(distinct ci.card_id)
    from public.card_interactions ci
    join public.cards c on c.id = ci.card_id
    where c.session_id = ds.id
      and ci.action in ('studied', 'saved', 'skipped')
  );
