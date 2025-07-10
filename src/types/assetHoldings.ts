export interface AssetHolding {
  id: string;
  coin_name: string;
  coin_symbol: string;
  total_amount: number;
  average_price: number;
  current_price: number;
  cost_basis: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percentage: number;
  allocation_percentage: number;
  category: string;
}

export interface AssetHoldingsProps {
  portfolioId: string;
}

export type SortOption = 'name' | 'value' | 'pnl' | 'allocation';
export type SortOrder = 'asc' | 'desc';