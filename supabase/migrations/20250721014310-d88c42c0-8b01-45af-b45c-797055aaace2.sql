
-- Create missing database tables for real data storage and quality monitoring

-- Create table for 36-month price history storage
CREATE TABLE IF NOT EXISTS public.price_history_36m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id TEXT NOT NULL,
  price_date DATE NOT NULL,
  price_usd NUMERIC NOT NULL,
  volume_24h NUMERIC DEFAULT 0,
  market_cap NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coin_id, price_date)
);

-- Create table for cointime metrics storage
CREATE TABLE IF NOT EXISTS public.cointime_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id TEXT NOT NULL,
  coinblocks_created NUMERIC DEFAULT 0,
  coinblocks_destroyed NUMERIC DEFAULT 0,
  coinblocks_stored NUMERIC DEFAULT 0,
  aviv_ratio NUMERIC DEFAULT 1.0,
  active_supply_pct NUMERIC DEFAULT 50,
  vaulted_supply_pct NUMERIC DEFAULT 50,
  liveliness NUMERIC DEFAULT 0.5,
  vaultedness NUMERIC DEFAULT 0.5,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_source TEXT DEFAULT 'glassnode',
  confidence_score INTEGER DEFAULT 0,
  UNIQUE(coin_id, calculated_at::DATE)
);

-- Create table for calculated financial metrics
CREATE TABLE IF NOT EXISTS public.calculated_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id TEXT NOT NULL,
  real_volatility NUMERIC,
  real_beta NUMERIC,
  real_cagr_36m NUMERIC,
  real_standard_deviation NUMERIC,
  sharpe_ratio NUMERIC,
  correlation_btc NUMERIC,
  data_points_used INTEGER DEFAULT 0,
  calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_quality_score INTEGER DEFAULT 0,
  calculation_method TEXT DEFAULT 'historical',
  is_estimated BOOLEAN DEFAULT FALSE,
  UNIQUE(coin_id, calculation_date::DATE)
);

-- Create table for data quality tracking
CREATE TABLE IF NOT EXISTS public.data_quality_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'price', 'volume', 'glassnode', 'beta', etc.
  data_source TEXT NOT NULL, -- 'glassnode', 'coinmarketcap', 'calculated', etc.
  quality_score INTEGER DEFAULT 0, -- 0-100
  data_points INTEGER DEFAULT 0,
  completeness_pct NUMERIC DEFAULT 0,
  freshness_hours INTEGER DEFAULT 0,
  api_status TEXT DEFAULT 'unknown',
  error_message TEXT,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for API health monitoring
CREATE TABLE IF NOT EXISTS public.api_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER DEFAULT 0,
  success_rate_pct NUMERIC DEFAULT 0,
  last_successful_call TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(api_name, endpoint, checked_at::DATE)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_history_coin_date ON public.price_history_36m(coin_id, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_cointime_metrics_coin_date ON public.cointime_metrics(coin_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculated_metrics_coin_date ON public.calculated_metrics(coin_id, calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_data_quality_coin_metric ON public.data_quality_log(coin_id, metric_type, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_health_name_date ON public.api_health_status(api_name, checked_at DESC);

-- Enable RLS on new tables
ALTER TABLE public.price_history_36m ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cointime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculated_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_quality_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_health_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read access for analysis)
CREATE POLICY "Allow public read access to price history" ON public.price_history_36m FOR SELECT USING (true);
CREATE POLICY "Allow public read access to cointime metrics" ON public.cointime_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public read access to calculated metrics" ON public.calculated_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public read access to data quality log" ON public.data_quality_log FOR SELECT USING (true);
CREATE POLICY "Allow public read access to api health status" ON public.api_health_status FOR SELECT USING (true);

-- Update existing coins table to track real data usage
ALTER TABLE public.coins 
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_calculation_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS calculation_data_source TEXT DEFAULT 'estimated',
ADD COLUMN IF NOT EXISTS price_history_completeness NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_volatility_calculated NUMERIC,
ADD COLUMN IF NOT EXISTS real_beta_calculated NUMERIC,
ADD COLUMN IF NOT EXISTS confidence_level TEXT DEFAULT 'low';

-- Schedule Glass Node discovery to run daily at 02:00 UTC
SELECT cron.schedule(
  'daily-glass-node-discovery',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://cljbwjglmvdpusmfyslh.supabase.co/functions/v1/schedule-glass-node-discovery',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsamJ3amdsbXZkcHVzbWZ5c2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTYzNDUsImV4cCI6MjA2NjI3MjM0NX0.c3cvSuuwe6tUvx6ogBuMHygKRa0wq9wHWjyi8KtotmI"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);

-- Schedule real Glass Node data updates every 2 hours
SELECT cron.schedule(
  'real-glass-node-updates',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://cljbwjglmvdpusmfyslh.supabase.co/functions/v1/update-real-glass-node-data',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsamJ3amdsbXZkcHVzbWZ5c2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTYzNDUsImV4cCI6MjA2NjI3MjM0NX0.c3cvSuuwe6tUvx6ogBuMHygKRa0wq9wHWjyi8KtotmI"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);

-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
