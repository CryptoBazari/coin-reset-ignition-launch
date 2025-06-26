
export interface VirtualCoinData {
  symbol: string;
  name: string;
}

export interface TransactionData {
  coin_symbol: string;
  transaction_type: 'buy' | 'sell';
  category: 'Bitcoin' | 'Blue Chip' | 'Small-Cap';
  amount: number;
  price: number;
  value: number;
  fee: number;
  note: string | null;
}
