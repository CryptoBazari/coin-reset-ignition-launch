
export interface CalculationDetails {
  npv: NPVCalculationDetails;
  irr: IRRCalculationDetails;
  cagr: CAGRCalculationDetails;
  roi: ROICalculationDetails;
  volatility: VolatilityCalculationDetails;
  beta: BetaCalculationDetails;
  dataSource: DataSourceDetails;
}

export interface NPVCalculationDetails {
  discountRate: number;
  riskPremium: number;
  riskFreeRate: number;
  projectedCashFlows: number[];
  presentValues: number[];
  terminalValue: number;
  terminalPresentValue: number;
  initialInvestment: number;
  netPresentValue: number;
  calculationSteps: string[];
}

export interface IRRCalculationDetails {
  iterations: number;
  convergenceTolerance: number;
  initialGuess: number;
  finalIRR: number;
  monthlyCashFlows: number[];
  calculationMethod: string;
  converged: boolean;
}

export interface CAGRCalculationDetails {
  startPrice: number;
  endPrice: number;
  timePeriodsMonths: number;
  timePeriodsYears: number;
  dataPoints: number;
  dataSource: 'real_historical' | 'glassnode' | 'coinmarketcap' | 'estimated';
  priceHistory: Array<{ date: string; price: number }>;
}

export interface ROICalculationDetails {
  currentPrice: number;
  expectedFuturePrice: number;
  timeHorizonYears: number;
  compoundingPeriods: number;
  totalReturn: number;
  annualizedReturn: number;
}

export interface VolatilityCalculationDetails {
  priceReturns: number[];
  meanReturn: number;
  variance: number;
  standardDeviation: number;
  annualizationFactor: number;
  dataPoints: number;
  calculationPeriod: string;
}

export interface BetaCalculationDetails {
  marketVolatility: number;
  assetVolatility: number;
  correlation: number;
  calculationMethod: 'real_correlation' | 'volatility_proxy' | 'estimated';
  benchmarkUsed: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface DataSourceDetails {
  primary: string;
  secondary?: string;
  apiEndpoints: string[];
  dataFreshness: string;
  monthsOfData: number;
  qualityScore: number;
  fallbacksUsed: string[];
}
