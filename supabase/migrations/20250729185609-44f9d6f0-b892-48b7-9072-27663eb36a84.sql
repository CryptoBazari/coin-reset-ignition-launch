-- Add missing columns to virtual_portfolios table for proper performance tracking
ALTER TABLE public.virtual_portfolios 
ADD COLUMN IF NOT EXISTS total_invested numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS realized_profit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS unrealized_profit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_snapshot_date date;

-- Create index for better performance when querying snapshots
CREATE INDEX IF NOT EXISTS idx_portfolio_daily_snapshots_portfolio_date 
ON public.portfolio_daily_snapshots(portfolio_id, snapshot_date DESC);

-- Create index for performance metrics queries
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_metrics_portfolio_date 
ON public.portfolio_performance_metrics(portfolio_id, calculation_date DESC);