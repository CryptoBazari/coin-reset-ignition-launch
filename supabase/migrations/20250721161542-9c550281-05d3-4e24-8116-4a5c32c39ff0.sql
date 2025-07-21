-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests  
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily data updates at 6 AM UTC
SELECT cron.schedule(
  'daily-crypto-data-update',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://cljbwjglmvdpusmfyslh.supabase.co/functions/v1/initialize-real-data-pipeline',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsamJ3amdsbXZkcHVzbWZ5c2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTYzNDUsImV4cCI6MjA2NjI3MjM0NX0.c3cvSuuwe6tUvx6ogBuMHygKRa0wq9wHWjyi8KtotmI"}'::jsonb,
    body := '{"automated": true}'::jsonb
  );
  $$
);

-- Schedule hourly price updates
SELECT cron.schedule(
  'hourly-price-updates', 
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://cljbwjglmvdpusmfyslh.supabase.co/functions/v1/update-coins-real-data',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsamJ3amdsbXZkcHVzbWZ5c2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTYzNDUsImV4cCI6MjA2NjI3MjM0NX0.c3cvSuuwe6tUvx6ogBuMHygKRa0wq9wHWjyi8KtotmI"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Immediately trigger initial data population
SELECT net.http_post(
  url := 'https://cljbwjglmvdpusmfyslh.supabase.co/functions/v1/initialize-real-data-pipeline',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsamJ3amdsbXZkcHVzbWZ5c2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTYzNDUsImV4cCI6MjA2NjI3MjM0NX0.c3cvSuuwe6tUvx6ogBuMHygKRa0wq9wHWjyi8KtotmI"}'::jsonb,
  body := '{"immediate": true}'::jsonb
) as request_id;