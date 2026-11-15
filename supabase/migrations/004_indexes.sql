-- Indexes for the hot queries (dashboard load, elder view, scheduler tick, audit page).
-- dose_events(scheduled_at, status) and (medicine_id, scheduled_at) already exist (001).
create index if not exists medicines_elder_idx on medicines (elder_id) where active;
create index if not exists members_circle_idx on members (circle_id);
create index if not exists elders_circle_idx on elders (circle_id);
create index if not exists appointments_elder_starts_idx on appointments (elder_id, starts_at);
create index if not exists appointments_starts_pending_idx on appointments (starts_at) where not (reminded_24h and reminded_2h);
create index if not exists change_proposals_elder_idx on change_proposals (elder_id, created_at desc);
create index if not exists tasks_circle_open_idx on tasks (circle_id, created_at desc) where not done;
create index if not exists email_outbox_circle_idx on email_outbox (circle_id, created_at desc);
create index if not exists dose_events_pending_late_idx on dose_events (scheduled_at) where status = 'pending' and resolved_by is null;
