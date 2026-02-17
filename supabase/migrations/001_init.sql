create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint unique not null,
  username text,
  first_name text,
  last_name text,
  referral_code text unique not null,
  referrer_id uuid references users(id),
  steps bigint not null default 0,
  sandwiches bigint not null default 0,
  coffee bigint not null default 0,
  premium_until timestamptz,
  next_available_at timestamptz not null default now(),
  daily_free_count int not null default 0,
  daily_free_reset_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into config (key, value)
values
  ('cooldown_ms', '28800000'::jsonb),
  ('max_free_actions_per_day', '3'::jsonb),
  ('steps_per_wake', '1'::jsonb),
  ('sandwich_per_ref_action', '1'::jsonb),
  ('coffee_per_ref2_action', '1'::jsonb)
on conflict (key) do nothing;

create table if not exists ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  kind text not null,
  delta_steps bigint default 0,
  delta_sandwiches bigint default 0,
  delta_coffee bigint default 0,
  meta jsonb default '{}'::jsonb,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  description text not null,
  payload jsonb not null,
  reward jsonb not null,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  mission_id uuid not null references missions(id),
  status text not null,
  completed_at timestamptz,
  unique(user_id, mission_id)
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  provider text not null,
  status text not null,
  amount numeric,
  currency text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  effects jsonb not null default '{}'::jsonb,
  price jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists user_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  item_id uuid not null references items(id),
  quantity int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index if not exists idx_users_steps on users (steps desc);
create index if not exists idx_users_referrer_id on users (referrer_id);
create index if not exists idx_ledger_user_created on ledger (user_id, created_at);
create index if not exists idx_missions_active on missions (is_active);
create index if not exists idx_user_missions_user_status on user_missions (user_id, status);

create or replace function get_user_rank(p_user_id uuid)
returns table(rank bigint)
language sql
stable
as $$
  select r.rank from (
    select id, rank() over (order by steps desc) as rank
    from users
  ) r
  where r.id = p_user_id;
$$;
