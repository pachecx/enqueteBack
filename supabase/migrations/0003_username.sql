alter table users
  add column if not exists username text;

alter table users
  alter column email drop not null;

create unique index if not exists users_username_unique_idx
  on users (lower(username))
  where username is not null;
