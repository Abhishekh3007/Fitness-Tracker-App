-- ============================================================
-- GYM APP — SUPABASE SCHEMA
-- Run this in the Supabase SQL editor
-- ============================================================

-- profiles
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text,
  height numeric,
  age integer,
  starting_weight numeric,
  target_weight numeric,
  current_weight numeric,
  preferred_units text default 'kg' check (preferred_units in ('kg', 'lbs')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users manage own profile" on profiles
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- programs (static, seeded once)
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- program_days
create table if not exists program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade not null,
  day_number integer not null,
  day_name text not null,
  training_type text not null,
  description text
);

-- program_exercises
create table if not exists program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid references program_days(id) on delete cascade not null,
  exercise_name text not null,
  sets integer not null,
  rep_min integer not null,
  rep_max integer not null,
  order_index integer not null,
  notes text  
);

-- program_cardio
create table if not exists program_cardio (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid references program_days(id) on delete cascade not null,
  cardio_type text not null,
  duration_min integer not null,
  duration_max integer,
  intensity text,
  notes text
);

-- workout_sessions
create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  program_day_id uuid references program_days(id),
  date date not null,
  started_at timestamptz,
  completed_at timestamptz,
  duration integer,
  status text default 'in_progress' check (status in ('in_progress','completed','skipped')),
  notes text,
  created_at timestamptz default now()
);
alter table workout_sessions enable row level security;
create policy "Users manage own sessions" on workout_sessions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on workout_sessions(user_id, date);

-- exercise_logs
create table if not exists exercise_logs (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid references workout_sessions(id) on delete cascade not null,
  program_exercise_id uuid references program_exercises(id),
  exercise_name text not null,
  set_number integer not null,
  target_reps integer,
  weight numeric,
  actual_reps integer,
  rpe numeric,
  completed boolean default false,
  notes text,
  created_at timestamptz default now()
);
alter table exercise_logs enable row level security;
create policy "Users manage own exercise logs" on exercise_logs
  using (
    exists (
      select 1 from workout_sessions ws
      where ws.id = exercise_logs.workout_session_id
        and ws.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workout_sessions ws
      where ws.id = exercise_logs.workout_session_id
        and ws.user_id = auth.uid()
    )
  );
create index on exercise_logs(workout_session_id);

-- cardio_logs
create table if not exists cardio_logs (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid references workout_sessions(id) on delete cascade not null,
  cardio_type text not null,
  duration integer,
  distance numeric,
  intensity text,
  completed boolean default false,
  notes text,
  created_at timestamptz default now()
);
alter table cardio_logs enable row level security;
create policy "Users manage own cardio logs" on cardio_logs
  using (
    exists (
      select 1 from workout_sessions ws
      where ws.id = cardio_logs.workout_session_id
        and ws.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workout_sessions ws
      where ws.id = cardio_logs.workout_session_id
        and ws.user_id = auth.uid()
    )
  );

-- weight_logs
create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  weight numeric not null,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table weight_logs enable row level security;
create policy "Users manage own weight logs" on weight_logs
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on weight_logs(user_id, date);

-- nutrition_logs
create table if not exists nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  water numeric,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table nutrition_logs enable row level security;
create policy "Users manage own nutrition logs" on nutrition_logs
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on nutrition_logs(user_id, date);

-- recovery_logs
create table if not exists recovery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  sleep_hours numeric,
  sleep_quality integer check (sleep_quality between 1 and 10),
  energy integer check (energy between 1 and 10),
  soreness integer check (soreness between 1 and 10),
  stress integer check (stress between 1 and 10),
  notes text,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table recovery_logs enable row level security;
create policy "Users manage own recovery logs" on recovery_logs
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on recovery_logs(user_id, date);

-- user_settings
create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  theme text default 'dark' check (theme in ('light','dark','system')),
  weight_unit text default 'kg' check (weight_unit in ('kg','lbs')),
  preferred_units text default 'metric' check (preferred_units in ('metric','imperial')),
  calorie_target numeric,
  protein_target numeric,
  notifications_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table user_settings enable row level security;
create policy "Users manage own settings" on user_settings
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile + settings on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (user_id, name)
  values (new.id, new.raw_user_meta_data->>'name')
  on conflict (user_id) do nothing;

  insert into user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
