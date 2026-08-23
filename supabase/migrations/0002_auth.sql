create table users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table polls
  add column owner_id uuid references users(id) on delete set null;

create index polls_owner_id_idx on polls(owner_id);

create table auth_sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index auth_sessions_user_id_idx on auth_sessions(user_id);
create index auth_sessions_expires_at_idx on auth_sessions(expires_at);
