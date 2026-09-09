-- ============================================================
-- FIX: workout_sessions.program_day_id should store the day
-- number (1-6) as an integer, not a UUID FK to program_days.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Drop the old column and re-add as plain integer (no FK)
alter table public.workout_sessions
  drop column if exists program_day_id;

alter table public.workout_sessions
  add column program_day_id integer;

-- Recreate the index
drop index if exists workout_sessions_user_id_date_idx;
create index on public.workout_sessions(user_id, date);
create index on public.workout_sessions(user_id, program_day_id);

-- Verify
select column_name, data_type
from information_schema.columns
where table_name = 'workout_sessions'
  and table_schema = 'public'
order by ordinal_position;
