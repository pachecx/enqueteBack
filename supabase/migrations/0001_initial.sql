create type poll_type as enum ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DATE_SELECTION');
create type poll_status as enum ('OPEN', 'CLOSED');
create type date_selection_mode as enum ('ONE_DAY', 'MULTIPLE_DAYS');

create table polls (
  id uuid primary key,
  slug text not null unique,
  question text not null,
  type poll_type not null,
  month integer,
  year integer,
  date_mode date_selection_mode,
  status poll_status not null default 'OPEN',
  admin_token_hash text not null unique,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint polls_date_fields_check check (
    (type = 'DATE_SELECTION' and month between 1 and 12 and year > 0 and date_mode is not null)
    or (type <> 'DATE_SELECTION' and month is null and year is null and date_mode is null)
  )
);

create table poll_options (
  id uuid primary key,
  poll_id uuid not null references polls(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
create index poll_options_poll_id_idx on poll_options(poll_id);

create table votes (
  id uuid primary key,
  poll_id uuid not null references polls(id) on delete cascade,
  voter_token_hash text not null,
  created_at timestamptz not null default now(),
  constraint votes_poll_voter_unique unique (poll_id, voter_token_hash)
);
create index votes_poll_id_idx on votes(poll_id);

create table vote_options (
  id uuid primary key,
  vote_id uuid not null references votes(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  constraint vote_options_vote_option_unique unique (vote_id, option_id)
);

create table vote_days (
  id uuid primary key,
  vote_id uuid not null references votes(id) on delete cascade,
  date date not null,
  constraint vote_days_vote_date_unique unique (vote_id, date)
);
create index vote_days_date_idx on vote_days(date);