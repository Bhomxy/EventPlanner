-- Public share links for events

alter table events add column if not exists share_token text unique;
