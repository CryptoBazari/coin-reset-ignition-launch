-- Create table for caching standalone CAGR calculations
CREATE TABLE IF NOT EXISTS public.standalone_cagr_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  years_back NUMERIC NOT NULL,
  basic_cagr NUMERIC NOT NULL,
  adjusted_cagr NUMERIC NOT NULL,
  start_price NUMERIC NOT NULL,
  end_price NUMERIC NOT NULL,
  days_held INTEGER NOT NULL,
  volatility_90d NUMERIC NOT NULL,
  liquidity_status TEXT NOT NULL CHECK (liquidity_status IN ('liquid', 'moderate', 'illiquid')),
  data_points INTEGER NOT NULL,
  data_source TEXT NOT NULL DEFAULT 'glassnode',
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  calculation_steps JSONB NOT NULL,
  timeperiod_years NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(asset, start_date, end_date)
);

-- Enable Row Level Security
ALTER TABLE public.standalone_cagr_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since CAGR data is not user-specific)
CREATE POLICY "CAGR cache is publicly readable" 
ON public.standalone_cagr_cache 
FOR SELECT 
USING (true);

-- Only allow system/admin to insert/update cache data
CREATE POLICY "Only system can modify CAGR cache" 
ON public.standalone_cagr_cache 
FOR ALL 
USING (false);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cagr_cache_lookup 
ON public.standalone_cagr_cache (asset, start_date, end_date);

-- Create index for cache cleanup
CREATE INDEX IF NOT EXISTS idx_cagr_cache_created_at 
ON public.standalone_cagr_cache (created_at);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cagr_cache_updated_at
BEFORE UPDATE ON public.standalone_cagr_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();