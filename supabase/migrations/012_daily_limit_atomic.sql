-- ============================================================
-- Atomic daily corrections limit check + increment
-- Replaces the non-atomic read-then-write in access.ts
-- ============================================================

-- The caller passes the plan's daily limit (-1 = unlimited).
-- Uses FOR UPDATE to lock the profile row, preventing concurrent
-- requests from both seeing count < limit and both being allowed.
create or replace function check_and_increment_daily_limit(
  p_user_id  uuid,
  p_limit    int,    -- -1 for unlimited
  p_today    date    -- passed from app to avoid server TZ ambiguity
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_count      int;
  v_reset_date date;
begin
  -- Row-level lock ensures only one concurrent request can increment at a time
  select daily_corrections_count, daily_corrections_reset_date
    into v_count, v_reset_date
    from profiles
   where id = p_user_id
     for update;

  -- Reset counter when the calendar day changes
  if v_reset_date is null or v_reset_date < p_today then
    v_count := 0;
  end if;

  -- Unlimited plan: always allowed, still track for analytics
  if p_limit = -1 then
    update profiles
       set daily_corrections_count       = v_count + 1,
           daily_corrections_reset_date  = p_today
     where id = p_user_id;
    return jsonb_build_object('allowed', true, 'used', v_count + 1, 'limit', -1, 'reset_date', p_today);
  end if;

  -- At or over limit
  if v_count >= p_limit then
    -- Keep reset_date current so the UI shows the right date
    update profiles
       set daily_corrections_reset_date = p_today
     where id = p_user_id and (daily_corrections_reset_date is null or daily_corrections_reset_date < p_today);
    return jsonb_build_object('allowed', false, 'used', v_count, 'limit', p_limit, 'reset_date', p_today);
  end if;

  -- Under limit: increment
  update profiles
     set daily_corrections_count       = v_count + 1,
         daily_corrections_reset_date  = p_today
   where id = p_user_id;

  return jsonb_build_object('allowed', true, 'used', v_count + 1, 'limit', p_limit, 'reset_date', p_today);
end;
$$;
