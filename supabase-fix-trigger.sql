-- ============================================================
-- FIX: Drop and recreate the trigger with proper error handling
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- Recreate function with exception handling so auth signup never fails
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email)
  )
  on conflict (user_id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
exception
  when others then
    -- Log the error but never block auth signup
    raise warning 'handle_new_user error: % %', sqlerrm, sqlstate;
    return new;
end;
$$;

-- Recreate trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Also ensure RLS policies allow the trigger (security definer
-- runs as the function owner, but let's be explicit)
-- ============================================================

-- Drop and recreate profiles policy to be safe
drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Drop and recreate user_settings policy
drop policy if exists "Users manage own settings" on public.user_settings;
create policy "Users manage own settings" on public.user_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Verify tables exist (run these selects to confirm)
-- ============================================================
select 'profiles' as table_name, count(*) from public.profiles
union all
select 'user_settings', count(*) from public.user_settings;
