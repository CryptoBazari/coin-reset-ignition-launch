
-- Create portfolio daily snapshots table for tracking historical performance
CREATE TABLE public.portfolio_daily_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  total_value NUMERIC NOT NULL DEFAULT 0,
  total_profit NUMERIC NOT NULL DEFAULT 0,
  day_change NUMERIC NOT NULL DEFAULT 0,
  day_change_percent NUMERIC NOT NULL DEFAULT 0,
  asset_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(portfolio_id, snapshot_date)
);

-- Create price history table for storing 36-month price data
CREATE TABLE public.price_history_36m (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coin_id TEXT NOT NULL,
  price_date DATE NOT NULL,
  price_usd NUMERIC NOT NULL,
  volume_24h NUMERIC,
  market_cap BIGINT,
  data_source TEXT NOT NULL DEFAULT 'coinmarketcap',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coin_id, price_date)
);

-- Create cointime metrics table for Glass Node cointime data
CREATE TABLE public.cointime_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coin_id TEXT NOT NULL,
  metric_date DATE NOT NULL,
  aviv_ratio NUMERIC,
  cointime_destroyed NUMERIC,
  cointime_created NUMERIC,
  active_supply_pct NUMERIC,
  vaulted_supply_pct NUMERIC,
  liquid_supply_pct NUMERIC,
  data_source TEXT NOT NULL DEFAULT 'glassnode',
  confidence_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coin_id, metric_date)
);

-- Create portfolio performance metrics table
CREATE TABLE public.portfolio_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL,
  calculation_date DATE NOT NULL,
  sharpe_ratio NUMERIC,
  max_drawdown NUMERIC,
  volatility NUMERIC,
  beta NUMERIC,
  alpha NUMERIC,
  correlation_sp500 NUMERIC,
  data_points_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(portfolio_id, calculation_date)
);

-- Add RLS policies for portfolio daily snapshots
ALTER TABLE public.portfolio_daily_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view snapshots of their portfolios"
  ON public.portfolio_daily_snapshots
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM virtual_portfolios vp 
    WHERE vp.id = portfolio_daily_snapshots.portfolio_id 
    AND vp.user_id = auth.uid()
  ));

CREATE POLICY "System can insert portfolio snapshots"
  ON public.portfolio_daily_snapshots
  FOR INSERT
  WITH CHECK (true);

-- Add RLS policies for price history
ALTER TABLE public.price_history_36m ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price history"
  ON public.price_history_36m
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert price history"
  ON public.price_history_36m
  FOR INSERT
  WITH CHECK (true);

-- Add RLS policies for cointime metrics
ALTER TABLE public.cointime_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cointime metrics"
  ON public.cointime_metrics
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert cointime metrics"
  ON public.cointime_metrics
  FOR INSERT
  WITH CHECK (true);

-- Add RLS policies for portfolio performance metrics
ALTER TABLE public.portfolio_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view performance metrics of their portfolios"
  ON public.portfolio_performance_metrics
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM virtual_portfolios vp 
    WHERE vp.id = portfolio_performance_metrics.portfolio_id 
    AND vp.user_id = auth.uid()
  ));

CREATE POLICY "System can insert portfolio performance metrics"
  ON public.portfolio_performance_metrics
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_portfolio_daily_snapshots_portfolio_date ON portfolio_daily_snapshots(portfolio_id, snapshot_date DESC);
CREATE INDEX idx_price_history_36m_coin_date ON price_history_36m(coin_id, price_date DESC);
CREATE INDEX idx_cointime_metrics_coin_date ON cointime_metrics(coin_id, metric_date DESC);
CREATE INDEX idx_portfolio_performance_metrics_portfolio_date ON portfolio_performance_metrics(portfolio_id, calculation_date DESC);
