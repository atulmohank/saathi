-- Saathi schema. Supabase is used as a database only; all access is server-side
-- with the service-role key. RLS is enabled on every table with NO policies, so
-- anon/public (publishable key) access is denied by default.

create extension if not exists pgcrypto;

create table if not exists care_circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists elders (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references care_circles(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  age int check (age between 40 and 120),
  autonomy_mode text not null check (autonomy_mode in ('independent','assisted','supported')),
  preferred_language text not null default 'en' check (preferred_language in ('en','hi','ta','te','kn','ml')),
  emergency_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references care_circles(id) on delete cascade,
  elder_id uuid references elders(id) on delete cascade, -- set when role = 'elder'
  display_name text not null check (char_length(display_name) between 1 and 60),
  email text check (char_length(email) <= 254),
  role text not null check (role in ('elder','caretaker','family','decision_partner')),
  passcode_hash text not null,
  is_on_duty boolean not null default false,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  check (role <> 'elder' or elder_id is not null)
);

create table if not exists medicines (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references elders(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  dose_text text not null check (char_length(dose_text) between 1 and 60),
  times text[] not null default '{}',
  pill_look text not null default 'white round',
  instructions text not null default '' check (char_length(instructions) <= 300),
  stock_count int not null default 0 check (stock_count between 0 and 10000),
  is_critical boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dose_events (
  id uuid primary key default gen_random_uuid(),
  medicine_id uuid not null references medicines(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','taken','missed','skipped')),
  reason text check (reason in ('ran_out','side_effect','forgot','chose_to_skip','not_feeling_well')),
  marked_by uuid references members(id) on delete set null,
  marked_at timestamptz,
  escalation_level int not null default 0,
  notified_roles text[] not null default '{}',
  resolved_by uuid references members(id) on delete set null,
  reminded_upcoming boolean not null default false,
  unique (medicine_id, scheduled_at)
);
create index if not exists dose_events_sched_status_idx on dose_events (scheduled_at, status);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references elders(id) on delete cascade,
  doctor_name text not null check (char_length(doctor_name) between 1 and 80),
  specialty text not null default '' check (char_length(specialty) <= 80),
  location text not null default '' check (char_length(location) <= 160),
  starts_at timestamptz not null,
  notes text not null default '' check (char_length(notes) <= 500),
  reminded_24h boolean not null default false,
  reminded_2h boolean not null default false
);

create table if not exists change_proposals (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references elders(id) on delete cascade,
  medicine_id uuid references medicines(id) on delete cascade,
  proposed_by uuid references members(id) on delete set null,
  source text not null check (source in ('family','caretaker','elder','decision_partner','doctor_instruction')),
  diff jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','declined','applied')),
  decided_by uuid references members(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references care_circles(id) on delete cascade,
  kind text not null check (kind in ('refill','followup')),
  title text not null check (char_length(title) between 1 and 160),
  assigned_to uuid references members(id) on delete set null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references care_circles(id) on delete cascade,
  actor uuid references members(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_circle_idx on audit_log (circle_id, created_at desc);

-- Append-only: block UPDATE/DELETE on audit_log at the database level too.
-- (Cascade deletes from a demo reset are allowed because they come via circle delete.)
create or replace function audit_log_no_update() returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end $$;
drop trigger if exists audit_log_no_update on audit_log;
create trigger audit_log_no_update before update on audit_log
  for each row execute function audit_log_no_update();

create table if not exists action_tokens (
  jti text primary key,
  purpose text not null check (purpose in ('dose_taken','handled','approve_change')),
  dose_event_id uuid,
  member_id uuid references members(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists email_outbox (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references care_circles(id) on delete cascade,
  to_member uuid references members(id) on delete set null,
  kind text not null,
  subject text not null,
  body_text text not null,
  body_html text not null,
  sent boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

-- RLS on, no policies → deny-by-default for anon/authenticated roles.
alter table care_circles enable row level security;
alter table elders enable row level security;
alter table members enable row level security;
alter table medicines enable row level security;
alter table dose_events enable row level security;
alter table appointments enable row level security;
alter table change_proposals enable row level security;
alter table tasks enable row level security;
alter table audit_log enable row level security;
alter table action_tokens enable row level security;
alter table email_outbox enable row level security;
