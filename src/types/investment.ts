
export interface CoinData {
  id: string;
  coin_id: string;
  name: string;
  basket: 'Bitcoin' | 'Blue Chip' | 'Small-Cap';
  current_price: number;
  market_cap?: number;
  price_history?: number[];
  cagr_36m?: number;
  fundamentals_score?: number;
  volatility?: number;
  aviv_ratio?: number;
  active_supply?: number;
  vaulted_supply?: number;
  staking_yield?: number;
}

export interface InvestmentInputs {
  coinId: string;
  investmentAmount: number;
  totalPortfolio: number;
  investmentHorizon?: number;
  expectedPrice?: number;
  stakingYield?: number;
}

export interface FinancialMetrics {
  npv: number;
  irr: number;
  cagr: number;
  roi: number;
  riskFactor: number;
}

export interface InvestmentRecommendation {
  recommendation: 'Buy' | 'Buy Less' | 'Do Not Buy';
  worthInvesting: boolean;
  goodTiming: boolean;
  appropriateAmount: boolean;
  riskFactor: number;
  shouldDiversify: boolean;
  conditions?: string;
  risks?: string;
  rebalancingActions?: string[];
}

export interface AnalysisResult {
  coin: CoinData;
  metrics: FinancialMetrics;
  recommendation: InvestmentRecommendation;
  benchmarkComparison: {
    coinPerformance: number;
    benchmarkPerformance: number;
    benchmarkName: string;
  };
}
