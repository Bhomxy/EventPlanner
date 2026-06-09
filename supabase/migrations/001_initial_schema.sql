-- EventPlanner initial schema

create type event_type as enum (
  'meetup',
  'hackathon',
  'workshop',
  'conference',
  'bootcamp',
  'other'
);

create type event_status as enum (
  'planning',
  'ready',
  'completed',
  'archived'
);

create type checklist_category as enum (
  'venue',
  'volunteers',
  'marketing',
  'sponsors',
  'logistics',
  'speakers',
  'catering',
  'other'
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  type event_type not null default 'other',
  date date,
  location text,
  audience_size integer,
  goal text,
  notes text,
  plan_summary text,
  status event_status not null default 'planning',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  category checklist_category not null default 'other',
  title text not null,
  description text,
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists events_user_id_idx on events(user_id);
create index if not exists checklist_items_event_id_idx on checklist_items(event_id);

alter table users enable row level security;
alter table events enable row level security;
alter table checklist_items enable row level security;

create policy "Users read own profile"
  on users for select
  using (clerk_id = (auth.jwt() ->> 'sub'));

create policy "Users read own events"
  on events for select
  using (user_id = (auth.jwt() ->> 'sub'));

create policy "Users insert own events"
  on events for insert
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy "Users update own events"
  on events for update
  using (user_id = (auth.jwt() ->> 'sub'));

create policy "Users delete own events"
  on events for delete
  using (user_id = (auth.jwt() ->> 'sub'));

create policy "Users read checklist items for own events"
  on checklist_items for select
  using (
    exists (
      select 1 from events
      where events.id = checklist_items.event_id
        and events.user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy "Users insert checklist items for own events"
  on checklist_items for insert
  with check (
    exists (
      select 1 from events
      where events.id = checklist_items.event_id
        and events.user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy "Users update checklist items for own events"
  on checklist_items for update
  using (
    exists (
      select 1 from events
      where events.id = checklist_items.event_id
        and events.user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy "Users delete checklist items for own events"
  on checklist_items for delete
  using (
    exists (
      select 1 from events
      where events.id = checklist_items.event_id
        and events.user_id = (auth.jwt() ->> 'sub')
    )
  );
