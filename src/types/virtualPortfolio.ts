
export interface VirtualPortfolio {
  id: string;
  user_id: string;
  name: string;
  total_value: number;
  all_time_profit: number;
  created_at: string;
  updated_at: string;
}

export interface VirtualCoin {
  id: string;
  symbol: string;
  name: string;
  created_at: string;
}

export interface VirtualAsset {
  id: string;
  portfolio_id: string;
  coin_id: string;
  category: 'Bitcoin' | 'Blue Chip' | 'Small-Cap';
  total_amount: number;
  average_price: number;
  cost_basis: number;
  realized_profit: number;
  created_at: string;
  updated_at: string;
  virtual_coins: VirtualCoin;
}

export interface VirtualTransaction {
  id: string;
  portfolio_id: string;
  coin_id: string;
  asset_id: string | null;
  transaction_type: 'buy' | 'sell';
  category: 'Bitcoin' | 'Blue Chip' | 'Small-Cap';
  amount: number;
  price: number;
  value: number;
  fee: number;
  note: string | null;
  transaction_date: string;
  created_at: string;
  virtual_coins: VirtualCoin;
}
