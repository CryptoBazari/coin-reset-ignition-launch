export interface CoinData {
  id: string;
  coin_id: string;
  name: string;
  basket: 'Bitcoin' | 'Blue Chip' | 'Small-Cap';
  current_price: number;
  market_cap?: number;
  price_history?: any;
  cagr_36m?: number;
  fundamentals_score?: number;
  volatility?: number;
  aviv_ratio?: number;
  active_supply?: number;
  vaulted_supply?: number;
  cointime_inflation?: number;
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
  cagr: number;                    // Price appreciation CAGR
  totalReturnCAGR: number;         // Total return including staking
  roi: number;                     // Total ROI
  priceROI: number;                // Price appreciation ROI
  stakingROI: number;              // Staking contribution ROI
  riskFactor: number;
}

export interface MarketConditions {
  bitcoinState: 'bullish' | 'neutral' | 'bearish';
  sentimentScore: number;
  smartMoneyActivity: boolean;
  fedRateChange: number;
  avivRatio?: number;
  activeSupply?: number;
  vaultedSupply?: number;
}

export interface InvestmentRecommendation {
  recommendation: 'Buy' | 'Buy Less' | 'Do Not Buy' | 'Sell';
  worthInvesting: boolean;
  goodTiming: boolean;
  appropriateAmount: boolean;
  riskFactor: number;
  shouldDiversify: boolean;
  conditions?: string;
  risks?: string;
  rebalancingActions?: string[];
  marketAnalysis?: string;
}

export interface AnalysisResult {
  coin: CoinData;
  metrics: FinancialMetrics;
  recommendation: InvestmentRecommendation;
  marketConditions: MarketConditions;
  benchmarkComparison: {
    coinPerformance: number;
    benchmarkPerformance: number;
    benchmarkName: string;
  };
}

export interface FedRateData {
  timestamp: string;
  fed_funds_rate: number;
  rate_change: number;
}

export interface MarketSentiment {
  coin_id: string;
  timestamp: string;
  sentiment_score: number;
  sentiment_type: 'Bearish' | 'Neutral' | 'Bullish';
  smart_money_activity: boolean;
}

export interface MarketDataResult {
  fedRateChange: number;
  marketSentiment: { sentiment_score: number; smart_money_activity: boolean };
  realMarketData?: any;
}
