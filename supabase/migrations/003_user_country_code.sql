alter table users
  add column if not exists country_code text;

create index if not exists idx_users_country_code on users (country_code);
