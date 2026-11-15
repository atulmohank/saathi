-- Circle code for passcode sign-in, and a throttle stamp for the page-load scheduler check.
alter table care_circles add column if not exists code text;
alter table care_circles add column if not exists last_tick_at timestamptz;
create unique index if not exists care_circles_code_idx on care_circles (code);
alter table care_circles drop constraint if exists care_circles_code_format;
alter table care_circles add constraint care_circles_code_format check (code is null or code ~ '^[A-Z0-9]{4,8}$');
update care_circles set code = 'DEMO' where is_demo and code is null;
grant all privileges on all tables in schema public to service_role;
