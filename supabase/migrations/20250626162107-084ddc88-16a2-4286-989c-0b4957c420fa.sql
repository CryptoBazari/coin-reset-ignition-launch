
-- Create virtual_portfolios table
CREATE TABLE public.virtual_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  total_value NUMERIC NOT NULL DEFAULT 0,
  all_time_profit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create virtual_coins table for available coins
CREATE TABLE public.virtual_coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create virtual_assets table for portfolio holdings
CREATE TABLE public.virtual_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.virtual_portfolios(id) ON DELETE CASCADE,
  coin_id UUID NOT NULL REFERENCES public.virtual_coins(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Bitcoin', 'Blue Chip', 'Small-Cap')),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  average_price NUMERIC NOT NULL DEFAULT 0,
  cost_basis NUMERIC NOT NULL DEFAULT 0,
  realized_profit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(portfolio_id, coin_id, category)
);

-- Create virtual_transactions table for transaction history
CREATE TABLE public.virtual_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.virtual_portfolios(id) ON DELETE CASCADE,
  coin_id UUID NOT NULL REFERENCES public.virtual_coins(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.virtual_assets(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  category TEXT NOT NULL CHECK (category IN ('Bitcoin', 'Blue Chip', 'Small-Cap')),
  amount NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  value NUMERIC NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert some sample coins
INSERT INTO public.virtual_coins (symbol, name) VALUES
('BTC', 'Bitcoin'),
('ETH', 'Ethereum'),
('SOL', 'Solana'),
('ADA', 'Cardano'),
('DOT', 'Polkadot'),
('LINK', 'Chainlink'),
('AVAX', 'Avalanche'),
('MATIC', 'Polygon'),
('ATOM', 'Cosmos'),
('ALGO', 'Algorand');

-- Enable Row Level Security
ALTER TABLE public.virtual_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_coins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view their own portfolios" ON public.virtual_portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios" ON public.virtual_portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" ON public.virtual_portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" ON public.virtual_portfolios
  FOR DELETE USING (auth.uid() = user_id);

-- Assets policies
CREATE POLICY "Users can view assets in their portfolios" ON public.virtual_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.virtual_portfolios 
      WHERE id = portfolio_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create assets in their portfolios" ON public.virtual_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.virtual_portfolios 
      WHERE id = portfolio_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assets in their portfolios" ON public.virtual_assets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.virtual_portfolios 
      WHERE id = portfolio_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete assets in their portfolios" ON public.virtual_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.virtual_portfolios 
      WHERE id = portfolio_id AND user_id = auth.uid()
    )
  );

-- Transactions policies
CREATE POLICY "Users can view transactions in their portfolios" ON public.virtual_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.virtual_portfolios 
      WHERE id = portfolio_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions in their portfolios" ON public.virtual_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.virtual_portfolios 
      WHERE id = portfolio_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update transactions in their portfolios" ON public.virtual_transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.virtual_portfolios 
      WHERE id = portfolio_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transactions in their portfolios" ON public.virtual_transactions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.virtual_portfolios 
      WHERE id = portfolio_id AND user_id = auth.uid()
    )
  );

-- Allow everyone to read virtual_coins
CREATE POLICY "Allow read access to virtual_coins" ON public.virtual_coins
  FOR SELECT USING (true);
