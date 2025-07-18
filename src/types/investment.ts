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
  // Enhanced risk metrics
  beta?: number;
  beta_last_calculated?: string;
  beta_data_source?: string;
  beta_confidence?: string;
  standard_deviation?: number;
  sharpe_ratio?: number;
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
  // Enhanced risk metrics
  beta: number;
  standardDeviation: number;
  sharpeRatio: number;
  riskAdjustedNPV: number;
  expectedReturn: number;
  // Confidence indicators
  betaConfidence: 'low' | 'medium' | 'high';
  dataQuality: 'estimated' | 'calculated' | 'api' | 'database';
  // Glass Node specific metrics
  cointimePrice?: number;
  cointimeRatio?: number;
  onChainScore?: number;
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
  allocation?: AllocationResult;
  betaAnalysis?: {
    beta: number;
    confidence: 'low' | 'medium' | 'high';
    source: 'estimated' | 'calculated' | 'api' | 'database';
    lastCalculated?: string;
  };
  benchmarkComparison: {
    coinPerformance: number;
    benchmarkPerformance: number;
    benchmarkName: string;
  };
  glassNodeData?: {
    onChainAnalysis: any;
    cointimeMetrics: any;
    onChainMetrics: any;
  };
}

export interface BasketAllocationRules {
  bitcoin: { min: number; max: number; recommended: [number, number] };
  blueChip: { min: number; max: number; recommended: [number, number] };
  smallCap: { min: number; max: number; recommended: [number, number] };
}

export interface AllocationResult {
  portfolioPercentage: number;
  basketType: 'bitcoin' | 'blueChip' | 'smallCap';
  status: 'underexposed' | 'optimal' | 'overexposed';
  recommendation: 'increase' | 'decrease' | 'maintain';
  message: string;
  targetRange: [number, number];
}

export interface AllocationAnalysis {
  current: {
    bitcoinPercentage: number;
    blueChipPercentage: number;
    smallCapPercentage: number;
    totalAllocation: number;
  };
  recommended: {
    bitcoinRange: [number, number];
    blueChipRange: [number, number];
    smallCapRange: [number, number];
  };
  validation: {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  };
  rebalancing: {
    required: boolean;
    actions: Array<{
      basket: string;
      action: 'increase' | 'decrease' | 'maintain';
      targetPercentage: number;
      currentPercentage: number;
    }>;
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
