alter table users
  add column if not exists language_code text,
  add column if not exists country_flag text;

create index if not exists idx_users_language_code on users (language_code);
