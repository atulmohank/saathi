-- Newer Supabase projects don't auto-grant table privileges to the API roles.
-- The app talks to Postgres only as service_role (server-side). anon/authenticated
-- get nothing; RLS (no policies) is a second layer of deny.
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

revoke all on all tables in schema public from anon, authenticated;
