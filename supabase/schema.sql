-- Lingo Loop 스키마
-- Supabase SQL Editor에 이 파일 전체를 붙여 넣고 Run 하세요.
-- 다시 실행해도 됩니다.
-- 브라우저에는 anon 키만 넣고, service_role 키는 절대 넣지 마세요.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  goal integer not null default 20 check (goal > 0 and goal <= 240),
  field text not null default 'Data engineering',
  level text not null default '중급',
  study_time text not null default '20:30',
  remind boolean not null default false,
  last_reminder date,
  created_at timestamptz not null default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  minutes integer not null check (minutes > 0 and minutes <= 1440),
  topic text not null,
  type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  field text,
  question text,
  original text not null,
  corrected text not null,
  note text,
  changed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  question integer not null default 0,
  correct boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists logs_user_created_idx on public.logs (user_id, created_at);
create index if not exists scripts_user_created_idx on public.scripts (user_id, created_at);
create index if not exists reviews_user_created_idx on public.reviews (user_id, created_at);

alter table public.profiles enable row level security;
alter table public.logs enable row level security;
alter table public.scripts enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "logs_own" on public.logs;
create policy "logs_own"
  on public.logs
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "scripts_own" on public.scripts;
create policy "scripts_own"
  on public.scripts
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reviews_own" on public.reviews;
create policy "reviews_own"
  on public.reviews
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.profiles from anon;
revoke all on public.logs from anon;
revoke all on public.scripts from anon;
revoke all on public.reviews from anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.logs to authenticated;
grant select, insert, update, delete on public.scripts to authenticated;
grant select, insert, update, delete on public.reviews to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이 브라우저의 localStorage 기록을 처음 로그인할 때 한 번만 옮깁니다.
-- 계정에 학습 기록이 이미 있으면 아무것도 바꾸지 않고 false를 반환합니다.
create or replace function public.import_local_backup(payload jsonb)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  profile jsonb := coalesce(payload -> 'profile', '{}'::jsonb);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from public.logs where user_id = auth.uid())
     or exists (select 1 from public.scripts where user_id = auth.uid())
     or exists (select 1 from public.reviews where user_id = auth.uid()) then
    return false;
  end if;

  insert into public.logs (user_id, date, minutes, topic, type)
  select auth.uid(),
         (item ->> 'date')::date,
         least(greatest((item ->> 'minutes')::integer, 1), 1440),
         coalesce(nullif(item ->> 'topic', ''), '학습'),
         coalesce(nullif(item ->> 'type', ''), '직접 기록')
  from jsonb_array_elements(coalesce(payload -> 'logs', '[]'::jsonb)) as item
  where coalesce(item ->> 'date', '') <> ''
    and coalesce(item ->> 'minutes', '') ~ '^[0-9]+$';

  insert into public.scripts (user_id, date, field, question, original, corrected, note, changed)
  select auth.uid(),
         (item ->> 'date')::date,
         item ->> 'field',
         item ->> 'question',
         coalesce(item ->> 'original', ''),
         coalesce(item ->> 'corrected', ''),
         item ->> 'note',
         coalesce((item ->> 'changed')::boolean, false)
  from jsonb_array_elements(coalesce(payload -> 'scripts', '[]'::jsonb)) as item
  where coalesce(item ->> 'date', '') <> '';

  insert into public.reviews (user_id, date, question, correct)
  select auth.uid(),
         (item ->> 'date')::date,
         coalesce((item ->> 'question')::integer, 0),
         coalesce((item ->> 'correct')::boolean, false)
  from jsonb_array_elements(coalesce(payload -> 'reviews', '[]'::jsonb)) as item
  where coalesce(item ->> 'date', '') <> '';

  insert into public.profiles (id, goal, field, level, study_time, remind, last_reminder)
  values (
    auth.uid(),
    least(greatest(coalesce((profile ->> 'goal')::integer, 20), 1), 240),
    coalesce(nullif(profile ->> 'field', ''), 'Data engineering'),
    coalesce(nullif(profile ->> 'level', ''), '중급'),
    coalesce(nullif(left(profile ->> 'time', 5), ''), '20:30'),
    coalesce((profile ->> 'remind')::boolean, false),
    nullif(profile ->> 'lastReminder', '')::date
  )
  on conflict (id) do update set
    goal = excluded.goal,
    field = excluded.field,
    level = excluded.level,
    study_time = excluded.study_time,
    remind = excluded.remind,
    last_reminder = excluded.last_reminder;

  return true;
end;
$$;

revoke all on function public.import_local_backup(jsonb) from public;
grant execute on function public.import_local_backup(jsonb) to authenticated;

-- 아이디 로그인에 쓰는 @id.lingoloop.app 계정은 가입 메일 없이 바로 확정합니다.
create or replace function public.auto_confirm_id_login()
returns trigger
language plpgsql
as $$
begin
  if new.email ilike '%@id.lingoloop.app' and new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists auto_confirm_id_login on auth.users;
create trigger auto_confirm_id_login
  before insert on auth.users
  for each row execute function public.auto_confirm_id_login();

update auth.users
set email_confirmed_at = now()
where email ilike '%@id.lingoloop.app'
  and email_confirmed_at is null;
