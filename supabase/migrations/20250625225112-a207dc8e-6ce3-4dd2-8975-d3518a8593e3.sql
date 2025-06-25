
-- Create enums for better data consistency
CREATE TYPE basket_type AS ENUM ('Bitcoin', 'Blue Chip', 'Small-Cap');
CREATE TYPE recommendation_type AS ENUM ('Buy', 'Buy Less', 'Do Not Buy');
CREATE TYPE sentiment_type AS ENUM ('Bearish', 'Neutral', 'Bullish');

-- Coins table to store all cryptocurrency data
CREATE TABLE public.coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coin_id TEXT NOT NULL UNIQUE, -- e.g., BTC, ETH, SMALLCAP1
  name TEXT NOT NULL, -- e.g., Bitcoin, Ethereum
  basket basket_type NOT NULL,
  current_price DECIMAL(20,8) NOT NULL,
  market_cap BIGINT,
  price_history JSONB, -- Array of monthly prices
  cagr_36m DECIMAL(8,4), -- 36-month CAGR as percentage
  fundamentals_score INTEGER CHECK (fundamentals_score >= 1 AND fundamentals_score <= 10),
  volatility DECIMAL(8,4), -- Annualized volatility as percentage
  aviv_ratio DECIMAL(8,4), -- Cointime Economics metric for Bitcoin
  active_supply DECIMAL(8,4), -- Percentage of supply moved recently
  vaulted_supply DECIMAL(8,4), -- Percentage of supply unmoved
  staking_yield DECIMAL(8,4), -- Annual yield as percentage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Benchmarks table for S&P 500 and Bitcoin comparison data
CREATE TABLE public.benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  benchmark_id TEXT NOT NULL UNIQUE, -- e.g., SP500, BTC
  name TEXT NOT NULL, -- e.g., S&P 500, Bitcoin
  cagr_36m DECIMAL(8,4) NOT NULL, -- 36-month CAGR as percentage
  current_value DECIMAL(20,8) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Market sentiment tracking
CREATE TABLE public.market_sentiment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coin_id TEXT NOT NULL REFERENCES public.coins(coin_id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1), -- -1 (bearish) to +1 (bullish)
  sentiment_type sentiment_type NOT NULL
);

-- User portfolios for tracking allocations and holdings
CREATE TABLE public.user_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- Can be null for anonymous users
  portfolio_id TEXT NOT NULL,
  total_value DECIMAL(20,8) NOT NULL,
  allocations JSONB NOT NULL DEFAULT '{"Bitcoin": 50, "Blue Chip": 30, "Small-Cap": 20}', -- Target percentages
  holdings JSONB NOT NULL DEFAULT '[]', -- Array of {coin_id, amount_invested, current_value}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Investment analysis results storage
CREATE TABLE public.investment_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coin_id TEXT NOT NULL REFERENCES public.coins(coin_id),
  investment_amount DECIMAL(20,8) NOT NULL,
  total_portfolio DECIMAL(20,8) NOT NULL,
  investment_horizon INTEGER DEFAULT 2, -- years
  expected_price DECIMAL(20,8),
  npv DECIMAL(20,8),
  irr DECIMAL(8,4), -- as percentage
  cagr DECIMAL(8,4), -- as percentage
  roi DECIMAL(8,4), -- as percentage
  risk_factor INTEGER CHECK (risk_factor >= 1 AND risk_factor <= 5),
  recommendation recommendation_type NOT NULL,
  conditions TEXT,
  risks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Default assumptions and parameters
CREATE TABLE public.assumptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  basket basket_type NOT NULL UNIQUE,
  discount_rate DECIMAL(8,4) NOT NULL, -- Default discount rates
  hurdle_rate DECIMAL(8,4) NOT NULL, -- Minimum IRR thresholds
  target_allocation DECIMAL(8,4) NOT NULL -- Default allocation percentages
);

-- Insert default assumptions
INSERT INTO public.assumptions (basket, discount_rate, hurdle_rate, target_allocation) VALUES
('Bitcoin', 10.00, 10.00, 50.00),
('Blue Chip', 15.00, 15.00, 30.00),
('Small-Cap', 20.00, 20.00, 20.00);

-- Insert benchmark data
INSERT INTO public.benchmarks (benchmark_id, name, cagr_36m, current_value) VALUES
('SP500', 'S&P 500', 12.00, 5500.00),
('BTC', 'Bitcoin', 47.60, 65000.00);

-- Insert sample coin data
INSERT INTO public.coins (coin_id, name, basket, current_price, market_cap, cagr_36m, fundamentals_score, volatility, aviv_ratio, active_supply, vaulted_supply, staking_yield) VALUES
('BTC', 'Bitcoin', 'Bitcoin', 65000.00, 1200000000000, 47.60, 9, 50.00, 1.00, 15.00, 85.00, 0.00),
('ETH', 'Ethereum', 'Blue Chip', 3500.00, 420000000000, 50.00, 9, 70.00, null, null, null, 5.00),
('SOL', 'Solana', 'Blue Chip', 150.00, 65000000000, 45.00, 8, 75.00, null, null, null, 7.00),
('ADA', 'Cardano', 'Blue Chip', 0.45, 16000000000, 25.00, 7, 80.00, null, null, null, 4.50);

-- Create indexes for better performance
CREATE INDEX idx_coins_coin_id ON public.coins(coin_id);
CREATE INDEX idx_coins_basket ON public.coins(basket);
CREATE INDEX idx_market_sentiment_coin_id ON public.market_sentiment(coin_id);
CREATE INDEX idx_market_sentiment_timestamp ON public.market_sentiment(timestamp);
CREATE INDEX idx_user_portfolios_user_id ON public.user_portfolios(user_id);
CREATE INDEX idx_investment_analyses_coin_id ON public.investment_analyses(coin_id);

-- Enable Row Level Security (optional, for multi-user scenarios)
ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for user data access (if authentication is needed)
CREATE POLICY "Users can view their own portfolios" ON public.user_portfolios
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can manage their own portfolios" ON public.user_portfolios
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can view their own analyses" ON public.investment_analyses
  FOR SELECT USING (true); -- Allow all users to view analyses for now

CREATE POLICY "Users can create analyses" ON public.investment_analyses
  FOR INSERT WITH CHECK (true);
