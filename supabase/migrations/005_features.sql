-- Plan source, task contacts, user templates, notifications, reminders

alter table events add column if not exists plan_source text not null default 'template';

alter table tasks add column if not exists contact_name text;
alter table tasks add column if not exists contact_email text;
alter table tasks add column if not exists contact_phone text;

alter table templates add column if not exists user_id text;
alter table templates add column if not exists source_event_id uuid references events(id) on delete set null;

create table if not exists user_preferences (
  user_id text primary key,
  email_reminders boolean not null default true,
  reminder_days integer not null default 3,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  task_id uuid not null references tasks(id) on delete cascade,
  reminder_type text not null,
  sent_at timestamptz not null default now(),
  unique(user_id, task_id, reminder_type)
);

create index if not exists reminder_log_user_id_idx on reminder_log(user_id);
create index if not exists templates_user_id_idx on templates(user_id);
