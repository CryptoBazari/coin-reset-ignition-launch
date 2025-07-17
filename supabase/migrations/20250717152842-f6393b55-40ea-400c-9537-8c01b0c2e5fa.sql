-- =============================================================================
-- PHASE 0: CRITICAL DATABASE SCHEMA UPDATES
-- Run this FIRST before any code changes
-- =============================================================================

-- 1. Add beta tracking to coins table
ALTER TABLE public.coins ADD COLUMN beta DECIMAL(8,4) DEFAULT NULL;
ALTER TABLE public.coins ADD COLUMN beta_last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.coins ADD COLUMN beta_data_source TEXT DEFAULT 'estimated';
ALTER TABLE public.coins ADD COLUMN beta_confidence TEXT DEFAULT 'low';

-- 2. Add standard deviation and risk metrics
ALTER TABLE public.coins ADD COLUMN standard_deviation DECIMAL(8,4) DEFAULT NULL;
ALTER TABLE public.coins ADD COLUMN sharpe_ratio DECIMAL(8,4) DEFAULT NULL;

-- 3. Add allocation rules to assumptions table
ALTER TABLE public.assumptions ADD COLUMN min_allocation DECIMAL(8,4) DEFAULT 0;
ALTER TABLE public.assumptions ADD COLUMN max_allocation DECIMAL(8,4) DEFAULT 100;
ALTER TABLE public.assumptions ADD COLUMN recommended_min DECIMAL(8,4) DEFAULT 0;
ALTER TABLE public.assumptions ADD COLUMN recommended_max DECIMAL(8,4) DEFAULT 100;

-- 4. Update assumptions with your specific allocation rules
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

-- 5. Add initial beta estimates for existing coins
UPDATE public.coins SET 
  beta = 1.0,
  beta_data_source = 'estimated',
  beta_confidence = 'medium'
WHERE coin_id = 'BTC';

UPDATE public.coins SET 
  beta = CASE 
    WHEN coin_id = 'ETH' THEN 1.4
    WHEN coin_id = 'SOL' THEN 1.6
    WHEN coin_id = 'ADA' THEN 1.3
    ELSE 1.5
  END,
  beta_data_source = 'estimated',
  beta_confidence = 'medium'
WHERE basket = 'Blue Chip';

UPDATE public.coins SET 
  beta = 2.5,
  beta_data_source = 'estimated',
  beta_confidence = 'low'
WHERE basket = 'Small-Cap';

-- 6. Enhanced investment analyses table
ALTER TABLE public.investment_analyses ADD COLUMN price_cagr DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN total_return_cagr DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN price_roi DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN staking_roi DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN beta DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN standard_deviation DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN sharpe_ratio DECIMAL(8,4);
ALTER TABLE public.investment_analyses ADD COLUMN risk_adjusted_npv DECIMAL(20,8);
ALTER TABLE public.investment_analyses ADD COLUMN allocation_status TEXT;
ALTER TABLE public.investment_analyses ADD COLUMN portfolio_compliant BOOLEAN DEFAULT false;

-- 7. Create portfolio allocation tracking table
CREATE TABLE public.portfolio_allocations (
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

-- 8. Add indexes for performance
CREATE INDEX idx_coins_beta ON public.coins(beta);
CREATE INDEX idx_portfolio_allocations_user_id ON public.portfolio_allocations(user_id);
CREATE INDEX idx_investment_analyses_allocation_status ON public.investment_analyses(allocation_status);