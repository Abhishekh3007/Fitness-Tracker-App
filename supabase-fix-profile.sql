-- ============================================================
-- FIX: Add the profile goal used by the dashboard and settings
-- Run this once in the Supabase SQL Editor
-- ============================================================

alter table public.profiles
  add column if not exists goal text default 'fat_loss';

alter table public.profiles
  drop constraint if exists profiles_goal_check;

alter table public.profiles
  add constraint profiles_goal_check
  check (goal in ('fat_loss', 'muscle_gain', 'maintenance'));

-- Refresh PostgREST's schema cache so the new column is available immediately.
notify pgrst, 'reload schema';