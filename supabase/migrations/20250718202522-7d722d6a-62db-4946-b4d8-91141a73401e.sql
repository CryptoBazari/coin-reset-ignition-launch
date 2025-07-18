
-- Add logo_url column to coins table for cryptocurrency logos
ALTER TABLE public.coins ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add Glass Node discovery metadata columns
ALTER TABLE public.coins ADD COLUMN IF NOT EXISTS glass_node_last_discovered TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.coins ADD COLUMN IF NOT EXISTS coingecko_id TEXT;
ALTER TABLE public.coins ADD COLUMN IF NOT EXISTS api_status TEXT DEFAULT 'unknown';

-- Create index for faster Glass Node asset queries
CREATE INDEX IF NOT EXISTS idx_coins_glass_node_supported ON public.coins(glass_node_supported);
CREATE INDEX IF NOT EXISTS idx_coins_api_status ON public.coins(api_status);

-- Create a table to track Glass Node API health and discovery runs
CREATE TABLE IF NOT EXISTS public.glass_node_discovery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discovery_run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assets_discovered INTEGER DEFAULT 0,
  assets_updated INTEGER DEFAULT 0,
  api_status TEXT DEFAULT 'unknown',
  error_message TEXT,
  discovery_duration_ms INTEGER
);

-- Enable RLS on the new table
ALTER TABLE public.glass_node_discovery_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to discovery logs for transparency
CREATE POLICY "Anyone can view Glass Node discovery logs" 
  ON public.glass_node_discovery_logs 
  FOR SELECT 
  USING (true);
