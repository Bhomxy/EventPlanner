-- Per-event currency for budget tracking

alter table events add column if not exists currency text not null default 'USD';
