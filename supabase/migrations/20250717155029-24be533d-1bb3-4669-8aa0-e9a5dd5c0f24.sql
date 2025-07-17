-- Phase 2 Critical Database Schema Updates for Enhanced Financial Analysis

-- Add beta tracking columns to coins table
ALTER TABLE public.coins ADD COLUMN IF NOT EXISTS beta DECIMAL(8,4) DEFAULT NULL;
ALTER TABLE public.coins ADD COLUMN IF NOT EXISTS beta_confidence TEXT DEFAULT 'low';
ALTER TABLE public.coins ADD COLUMN IF NOT EXISTS beta_last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.coins ADD COLUMN IF NOT EXISTS beta_data_source TEXT DEFAULT 'estimated';

-- Add enhanced volatility metrics
ALTER TABLE public.coins ADD COLUMN IF NOT EXISTS standard_deviation DECIMAL(8,4) DEFAULT NULL;
ALTER TABLE public.coins ADD COLUMN IF NOT EXISTS sharpe_ratio DECIMAL(8,4) DEFAULT NULL;

-- Add enhanced metrics to investment_analyses table
ALTER TABLE public.investment_analyses ADD COLUMN IF NOT EXISTS price_cagr DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN IF NOT EXISTS total_return_cagr DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN IF NOT EXISTS price_roi DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN IF NOT EXISTS staking_roi DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN IF NOT EXISTS beta DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN IF NOT EXISTS standard_deviation DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN IF NOT EXISTS sharpe_ratio DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN IF NOT EXISTS risk_adjusted_npv DECIMAL(20,8);
ALTER TABLE public.investment_analyses ADD COLUMN IF NOT EXISTS allocation_status TEXT;
ALTER TABLE public.investment_analyses ADD COLUMN IF NOT EXISTS portfolio_compliant BOOLEAN;

-- Update assumptions table with basket allocation rules
ALTER TABLE public.assumptions ADD COLUMN IF NOT EXISTS min_allocation DECIMAL(8,4) DEFAULT 0;
ALTER TABLE public.assumptions ADD COLUMN IF NOT EXISTS max_allocation DECIMAL(8,4) DEFAULT 100;
ALTER TABLE public.assumptions ADD COLUMN IF NOT EXISTS recommended_min DECIMAL(8,4) DEFAULT 0;
ALTER TABLE public.assumptions ADD COLUMN IF NOT EXISTS recommended_max DECIMAL(8,4) DEFAULT 100;

-- Update default basket allocation rules (60% Bitcoin, 40% Blue-chip, 15% Small-cap)
UPDATE public.assumptions SET 
  min_allocation = 60, 
  max_allocation = 80, 
  recommended_min = 60, 
  recommended_max = 75,
  target_allocation = 70
WHERE basket = 'Bitcoin';

UPDATE public.assumptions SET 
  min_allocation = 0, 
  max_allocation = 40, 
  recommended_min = 20, 
  recommended_max = 35,
  target_allocation = 25
WHERE basket = 'Blue Chip';

UPDATE public.assumptions SET 
  min_allocation = 0, 
  max_allocation = 15, 
  recommended_min = 5, 
  recommended_max = 10,
  target_allocation = 5
WHERE basket = 'Small-Cap';

-- Create portfolio allocation tracking table
CREATE TABLE IF NOT EXISTS public.portfolio_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  portfolio_id TEXT NOT NULL,
  bitcoin_percentage DECIMAL(8,4) NOT NULL DEFAULT 0,
  bluechip_percentage DECIMAL(8,4) NOT NULL DEFAULT 0,
  smallcap_percentage DECIMAL(8,4) NOT NULL DEFAULT 0,
  total_value DECIMAL(20,8) NOT NULL DEFAULT 0,
  is_compliant BOOLEAN NOT NULL DEFAULT false,
  violations TEXT[],
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, portfolio_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coins_beta ON public.coins(beta);
CREATE INDEX IF NOT EXISTS idx_portfolio_allocations_user_id ON public.portfolio_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_analyses_beta ON public.investment_analyses(beta);
CREATE INDEX IF NOT EXISTS idx_investment_analyses_allocation_status ON public.investment_analyses(allocation_status);

-- Insert estimated beta values for common coins
UPDATE public.coins SET 
  beta = 1.0, 
  beta_confidence = 'medium',
  beta_data_source = 'estimated'
WHERE coin_id = 'BTC';

UPDATE public.coins SET 
  beta = 1.4, 
  beta_confidence = 'medium',
  beta_data_source = 'estimated'
WHERE coin_id = 'ETH';

UPDATE public.coins SET 
  beta = 1.6, 
  beta_confidence = 'medium',
  beta_data_source = 'estimated'
WHERE coin_id = 'SOL';

UPDATE public.coins SET 
  beta = 1.3, 
  beta_confidence = 'medium',
  beta_data_source = 'estimated'
WHERE coin_id = 'ADA';

-- Set default beta values for other coins by basket
UPDATE public.coins SET 
  beta = CASE 
    WHEN basket = 'Bitcoin' THEN 1.0
    WHEN basket = 'Blue Chip' THEN 1.5
    WHEN basket = 'Small-Cap' THEN 2.5
    ELSE 1.8
  END,
  beta_confidence = 'low',
  beta_data_source = 'estimated'
WHERE beta IS NULL;