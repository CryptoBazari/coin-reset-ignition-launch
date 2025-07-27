-- Create NPV cache table for performance optimization
CREATE TABLE npv_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  years INTEGER NOT NULL,
  advanced_beta NUMERIC DEFAULT NULL,
  result JSONB NOT NULL,
  benchmark_type TEXT NOT NULL, -- 'SP500' or 'BTC'
  liquidity_status TEXT NOT NULL, -- 'liquid', 'moderate', 'illiquid'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 minutes'),
  UNIQUE(asset, amount, years, advanced_beta)
);

-- Enable RLS
ALTER TABLE npv_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "NPV cache is publicly readable" 
ON npv_cache 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can modify NPV cache" 
ON npv_cache 
FOR ALL 
USING (false);

-- Add NPV-related columns to investment_analyses
ALTER TABLE investment_analyses 
ADD COLUMN IF NOT EXISTS npv_terminal_value NUMERIC,
ADD COLUMN IF NOT EXISTS npv_discount_rate NUMERIC,
ADD COLUMN IF NOT EXISTS npv_benchmark_type TEXT,
ADD COLUMN IF NOT EXISTS npv_liquidity_status TEXT,
ADD COLUMN IF NOT EXISTS npv_yearly_breakdown JSONB;

-- Add liquidity classification to coins table
ALTER TABLE coins 
ADD COLUMN IF NOT EXISTS liquidity_status TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS avg_volume_30d NUMERIC;

-- Create index for NPV cache lookups
CREATE INDEX idx_npv_cache_lookup ON npv_cache(asset, amount, years, advanced_beta);
CREATE INDEX idx_npv_cache_expires ON npv_cache(expires_at);

-- Create function to clean expired NPV cache
CREATE OR REPLACE FUNCTION clean_expired_npv_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM npv_cache WHERE expires_at < now();
END;
$$;