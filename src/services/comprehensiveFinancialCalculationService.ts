import { supabase } from '@/integrations/supabase/client';

// Core Data Types
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  category: 'bitcoin' | 'bluechip' | 'smallcap';
  quantity: number;
  purchasePrice: number;
  purchaseDate: Date;
  currentPrice: number;
  historicalPrices: number[];
  transactionVolumes: number[];
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  assets: Asset[];
  createdAt: Date;
  lastAnalyzed: Date | null;
  currentValue: number;
  costBasis: number;
}

export interface FinancialMetrics {
  npv: number;
  cagr: number;
  beta: number;
  volatility: number;
  liquidityScore: number;
  efficiencyRatio: number;
}

export interface PortfolioDecision {
  type: 'allocation' | 'rebalancing' | 'acquisition' | 'divestment';
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  amountUSD?: number;
  asset?: string;
  reason: string;
}

export interface PortfolioAnalysis {
  timestamp: Date;
  assets: Record<string, FinancialMetrics>;
  categories: {
    bitcoin: FinancialMetrics & { weight: number };
    bluechip: FinancialMetrics & { weight: number };
    smallcap: FinancialMetrics & { weight: number };
  };
  portfolio: {
    npv: number;
    cagr: number;
    beta: number;
    riskScore: number;
    diversificationScore: number;
    projectedValue1Y: number;
    projectedValue3Y: number;
  };
  decisions: PortfolioDecision[];
}

// Global benchmark data
let sp500HistoricalPrices: number[] = [];
let bitcoinHistoricalPrices: number[] = [];

// 1. Asset-Level Calculations
export function calculateAssetCAGR(asset: Asset): number {
  const daysHeld = (new Date().getTime() - asset.purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
  const yearsHeld = Math.max(daysHeld / 365.25, 0.01); // Minimum 1% of year to avoid division issues
  const growthFactor = asset.currentPrice / asset.purchasePrice;
  return Math.pow(growthFactor, 1 / yearsHeld) - 1;
}

export function calculateDailyReturns(prices: number[]): number[] {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i-1] !== 0) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
  }
  return returns;
}

export function calculateCovariance(returns1: number[], returns2: number[]): number {
  if (returns1.length !== returns2.length || returns1.length === 0) return 0;
  
  const mean1 = returns1.reduce((a, b) => a + b, 0) / returns1.length;
  const mean2 = returns2.reduce((a, b) => a + b, 0) / returns2.length;
  
  const covariance = returns1.reduce((sum, r1, i) => {
    return sum + (r1 - mean1) * (returns2[i] - mean2);
  }, 0) / returns1.length;
  
  return covariance;
}

export function calculateVariance(returns: number[]): number {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  return returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
}

export function calculateAssetBeta(asset: Asset, benchmarkPrices: number[]): number {
  if (asset.historicalPrices.length === 0 || benchmarkPrices.length === 0) return 1.0;
  
  const assetReturns = calculateDailyReturns(asset.historicalPrices);
  const benchmarkReturns = calculateDailyReturns(benchmarkPrices);
  
  const minLength = Math.min(assetReturns.length, benchmarkReturns.length);
  if (minLength === 0) return 1.0;
  
  const slicedAssetReturns = assetReturns.slice(0, minLength);
  const slicedBenchmarkReturns = benchmarkReturns.slice(0, minLength);
  
  const benchmarkVariance = calculateVariance(slicedBenchmarkReturns);
  if (benchmarkVariance === 0) return 1.0;
  
  return calculateCovariance(slicedAssetReturns, slicedBenchmarkReturns) / benchmarkVariance;
}

export function calculateAssetNPV(asset: Asset, riskFreeRate: number, years: number = 3): number {
  const cagr = calculateAssetCAGR(asset);
  const terminalValue = asset.quantity * asset.currentPrice * Math.pow(1 + cagr, years);
  const discountRate = riskFreeRate + 0.05; // Market risk premium
  const presentValue = terminalValue / Math.pow(1 + discountRate, years);
  return presentValue - (asset.quantity * asset.purchasePrice);
}

export function calculateAssetVolatility(historicalPrices: number[]): number {
  if (historicalPrices.length < 2) return 0;
  
  const returns = calculateDailyReturns(historicalPrices);
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

export function calculateLiquidityScore(transactionVolumes: number[]): number {
  if (transactionVolumes.length === 0) return 2;
  
  const avgVolume = transactionVolumes.reduce((sum, v) => sum + v, 0) / transactionVolumes.length;
  
  if (avgVolume > 1000000000) return 10;  // > $1B daily volume
  if (avgVolume > 500000000) return 8;
  if (avgVolume > 100000000) return 6;
  if (avgVolume > 50000000) return 4;
  return 2;  // Low liquidity
}

export function getBenchmark(asset: Asset): number[] {
  if (asset.category === 'bitcoin') return sp500HistoricalPrices;
  return bitcoinHistoricalPrices;
}

// 2. Category Aggregation
export function aggregateCategoryMetrics(
  assets: Asset[], 
  category: string, 
  riskFreeRate: number
): FinancialMetrics & { weight: number } {
  const categoryAssets = assets.filter(a => a.category === category);
  if (categoryAssets.length === 0) {
    return {
      weight: 0,
      npv: 0,
      cagr: 0,
      beta: 1,
      volatility: 0,
      liquidityScore: 0,
      efficiencyRatio: 0
    };
  }
  
  const categoryValue = categoryAssets.reduce((sum, a) => sum + a.currentPrice * a.quantity, 0);
  const portfolioValue = assets.reduce((sum, a) => sum + a.currentPrice * a.quantity, 0);
  
  if (categoryValue === 0 || portfolioValue === 0) {
    return {
      weight: 0,
      npv: 0,
      cagr: 0,
      beta: 1,
      volatility: 0,
      liquidityScore: 0,
      efficiencyRatio: 0
    };
  }
  
  // Weighted average calculations
  const weightedCagr = categoryAssets.reduce((sum, a) => {
    const assetValue = a.currentPrice * a.quantity;
    const weight = assetValue / categoryValue;
    return sum + weight * calculateAssetCAGR(a);
  }, 0);
  
  const weightedBeta = categoryAssets.reduce((sum, a) => {
    const assetValue = a.currentPrice * a.quantity;
    const weight = assetValue / categoryValue;
    return sum + weight * calculateAssetBeta(a, getBenchmark(a));
  }, 0);
  
  const weightedVolatility = categoryAssets.reduce((sum, a) => {
    const assetValue = a.currentPrice * a.quantity;
    const weight = assetValue / categoryValue;
    return sum + weight * calculateAssetVolatility(a.historicalPrices);
  }, 0);
  
  const weightedLiquidity = categoryAssets.reduce((sum, a) => {
    const assetValue = a.currentPrice * a.quantity;
    const weight = assetValue / categoryValue;
    return sum + weight * calculateLiquidityScore(a.transactionVolumes);
  }, 0);
  
  const efficiencyRatio = weightedVolatility > 0 ? weightedCagr / weightedVolatility : 0;
  
  return {
    weight: categoryValue / portfolioValue,
    npv: categoryAssets.reduce((sum, a) => sum + calculateAssetNPV(a, riskFreeRate), 0),
    cagr: weightedCagr,
    beta: weightedBeta,
    volatility: weightedVolatility,
    liquidityScore: weightedLiquidity,
    efficiencyRatio
  };
}

// 3. Portfolio-Level Calculations
export function calculatePortfolioMetrics(assets: Asset[], riskFreeRate: number): {
  npv: number;
  cagr: number;
  beta: number;
  riskScore: number;
  diversificationScore: number;
  projectedValue1Y: number;
  projectedValue3Y: number;
} {
  if (assets.length === 0) {
    return {
      npv: 0,
      cagr: 0,
      beta: 1,
      riskScore: 0,
      diversificationScore: 0,
      projectedValue1Y: 0,
      projectedValue3Y: 0
    };
  }
  
  const portfolioValue = assets.reduce((sum, a) => sum + a.currentPrice * a.quantity, 0);
  const costBasis = assets.reduce((sum, a) => sum + a.purchasePrice * a.quantity, 0);
  
  if (portfolioValue === 0 || costBasis === 0) {
    return {
      npv: 0,
      cagr: 0,
      beta: 1,
      riskScore: 100,
      diversificationScore: 0,
      projectedValue1Y: 0,
      projectedValue3Y: 0
    };
  }
  
  // Portfolio CAGR
  const oldestPurchase = new Date(Math.min(...assets.map(a => a.purchaseDate.getTime())));
  const daysHeld = (new Date().getTime() - oldestPurchase.getTime()) / (1000 * 60 * 60 * 24);
  const yearsHeld = Math.max(daysHeld / 365.25, 0.01);
  const portfolioCAGR = Math.pow(portfolioValue / costBasis, 1 / yearsHeld) - 1;
  
  // Portfolio Beta (Weighted average)
  const portfolioBeta = assets.reduce((sum, a) => {
    const assetValue = a.currentPrice * a.quantity;
    const weight = assetValue / portfolioValue;
    return sum + weight * calculateAssetBeta(a, getBenchmark(a));
  }, 0);
  
  // Diversification Score (1 - Herfindahl Index)
  const weights = assets.map(a => (a.currentPrice * a.quantity) / portfolioValue);
  const hhi = weights.reduce((sum, w) => sum + w ** 2, 0);
  const diversificationScore = (1 - hhi) * 100; // 0-100 scale
  
  return {
    npv: assets.reduce((sum, a) => sum + calculateAssetNPV(a, riskFreeRate), 0),
    cagr: portfolioCAGR,
    beta: portfolioBeta,
    riskScore: calculatePortfolioRisk(assets, portfolioValue),
    diversificationScore,
    projectedValue1Y: portfolioValue * (1 + portfolioCAGR),
    projectedValue3Y: portfolioValue * Math.pow(1 + portfolioCAGR, 3)
  };
}

// Portfolio Risk Score (0-100)
export function calculatePortfolioRisk(assets: Asset[], portfolioValue: number): number {
  if (assets.length === 0 || portfolioValue === 0) return 100;
  
  // Concentration risk
  const weights = assets.map(a => (a.currentPrice * a.quantity) / portfolioValue);
  const hhi = weights.reduce((sum, w) => sum + w ** 2, 0);
  const concentrationRisk = hhi * 50; // 0-50 scale
  
  // Volatility risk
  const avgVolatility = assets.reduce((sum, a) => {
    const weight = (a.currentPrice * a.quantity) / portfolioValue;
    return sum + weight * calculateAssetVolatility(a.historicalPrices);
  }, 0);
  const volatilityRisk = Math.min(30, avgVolatility * 100); // 0-30 scale
  
  // Liquidity risk
  const illiquidAssets = assets.filter(a => 
    calculateLiquidityScore(a.transactionVolumes) < 5
  );
  const liquidityRisk = illiquidAssets.reduce((sum, a) => 
    sum + (a.currentPrice * a.quantity) / portfolioValue, 0
  ) * 20; // 0-20 scale
  
  return Math.min(100, concentrationRisk + volatilityRisk + liquidityRisk);
}

// 4. Decision Engine
export function getAllocationRules(totalValue: number) {
  if (totalValue <= 50000) {
    return { minBtc: 0.6, maxBluechip: 0.4, maxSmallcap: 0.15 };
  } else if (totalValue <= 200000) {
    return { minBtc: 0.7, maxBluechip: 0.3, maxSmallcap: 0.10 };
  } else {
    return { minBtc: 0.85, maxBluechip: 0.15, maxSmallcap: 0.05 };
  }
}

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

export function generatePortfolioDecisions(
  portfolio: Portfolio,
  metrics: PortfolioAnalysis,
  riskFreeRate: number
): PortfolioDecision[] {
  const decisions: PortfolioDecision[] = [];
  const totalValue = portfolio.currentValue;
  
  if (totalValue === 0) return decisions;
  
  // 1. Allocation compliance decisions
  const allocationRules = getAllocationRules(totalValue);
  
  // Bitcoin allocation check
  const btcAllocation = metrics.categories.bitcoin.weight;
  if (btcAllocation < allocationRules.minBtc) {
    const deficitUSD = (allocationRules.minBtc - btcAllocation) * totalValue;
    decisions.push({
      type: 'allocation',
      priority: 'high',
      action: `Buy $${deficitUSD.toFixed(0)} BTC`,
      amountUSD: deficitUSD,
      reason: `Bitcoin allocation below minimum (${(btcAllocation*100).toFixed(1)}% < ${allocationRules.minBtc*100}%)`
    });
  }
  
  // Smallcap allocation check
  const smallcapAllocation = metrics.categories.smallcap.weight;
  if (smallcapAllocation > allocationRules.maxSmallcap) {
    const excessUSD = (smallcapAllocation - allocationRules.maxSmallcap) * totalValue;
    decisions.push({
      type: 'allocation',
      priority: 'high',
      action: `Sell $${excessUSD.toFixed(0)} smallcap assets`,
      amountUSD: excessUSD,
      reason: `Smallcap allocation exceeds limit (${(smallcapAllocation*100).toFixed(1)}% > ${allocationRules.maxSmallcap*100}%)`
    });
  }
  
  // 2. NPV-based opportunities
  portfolio.assets.forEach(asset => {
    const assetMetrics = metrics.assets[asset.id];
    if (assetMetrics) {
      const npvRatio = assetMetrics.npv / (asset.purchasePrice * asset.quantity);
      if (npvRatio > 1.3) {
        decisions.push({
          type: 'acquisition',
          priority: 'medium',
          action: `Increase position in ${asset.symbol}`,
          asset: asset.symbol,
          reason: `High NPV ratio: ${npvRatio.toFixed(2)} (Future value significantly exceeds cost basis)`
        });
      } else if (npvRatio < 0.8) {
        decisions.push({
          type: 'divestment',
          priority: 'medium',
          action: `Consider reducing position in ${asset.symbol}`,
          asset: asset.symbol,
          reason: `Low NPV ratio: ${npvRatio.toFixed(2)} (Future value below cost basis)`
        });
      }
    }
  });
  
  // 3. Risk-based decisions
  if (metrics.portfolio.riskScore > 70) {
    decisions.push({
      type: 'rebalancing',
      priority: 'critical',
      action: 'Reduce high-volatility assets by 15%',
      reason: `High portfolio risk score: ${metrics.portfolio.riskScore.toFixed(1)}/100`
    });
  }
  
  // 4. Efficiency opportunities
  if (metrics.categories.bluechip.efficiencyRatio > 1.5) {
    decisions.push({
      type: 'acquisition',
      priority: 'medium',
      action: 'Increase bluechip allocation by 5%',
      reason: `High efficiency ratio: ${metrics.categories.bluechip.efficiencyRatio.toFixed(2)}`
    });
  }
  
  // Sort by priority
  return decisions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// 5. API Integration Functions
export async function fetchCurrentPrices(portfolio: Portfolio): Promise<Portfolio> {
  try {
    const symbols = [...new Set(portfolio.assets.map(a => a.symbol))];
    
    // Call Supabase edge function to get prices from CoinMarketCap
    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
      body: { symbols }
    });
    
    if (error) {
      console.error('Error fetching prices:', error);
      return portfolio;
    }
    
    const prices = data.prices || {};
    
    return {
      ...portfolio,
      assets: portfolio.assets.map(asset => ({
        ...asset,
        currentPrice: prices[asset.symbol] || asset.currentPrice
      })),
      currentValue: portfolio.assets.reduce((sum, asset) => 
        sum + ((prices[asset.symbol] || asset.currentPrice) * asset.quantity), 0)
    };
  } catch (error) {
    console.error('Error in fetchCurrentPrices:', error);
    return portfolio;
  }
}

export async function fetchHistoricalData(portfolio: Portfolio): Promise<void> {
  try {
    // Fetch historical data for each asset
    await Promise.all(portfolio.assets.map(async asset => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
          body: { 
            metric: 'market/price_usd_close',
            asset: asset.symbol,
            resolution: '24h'
          }
        });
        
        if (!error && data?.data) {
          asset.historicalPrices = data.data.map((point: any) => point.v);
          
          // Fetch volume data
          const volumeResponse = await supabase.functions.invoke('fetch-glassnode-volume', {
            body: { 
              asset: asset.symbol,
              resolution: '24h'
            }
          });
          
          if (!volumeResponse.error && volumeResponse.data?.data) {
            asset.transactionVolumes = volumeResponse.data.data.map((point: any) => point.v);
          }
        }
      } catch (error) {
        console.error(`Error fetching data for ${asset.symbol}:`, error);
        // Use fallback data
        asset.historicalPrices = asset.historicalPrices || [];
        asset.transactionVolumes = asset.transactionVolumes || [];
      }
    }));
    
    // Fetch benchmark data
    try {
      const { data: sp500Data } = await supabase.functions.invoke('fetch-sp500-data', {});
      if (sp500Data?.data) {
        sp500HistoricalPrices = sp500Data.data.map((point: any) => point.v);
      }
      
      const { data: btcData } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'market/price_usd_close',
          asset: 'BTC',
          resolution: '24h'
        }
      });
      if (btcData?.data) {
        bitcoinHistoricalPrices = btcData.data.map((point: any) => point.v);
      }
    } catch (error) {
      console.error('Error fetching benchmark data:', error);
    }
    
  } catch (error) {
    console.error('Error in fetchHistoricalData:', error);
  }
}

export async function fetchRiskFreeRate(): Promise<number> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-fred-data', {
      body: { series_id: 'DGS10' } // 10-year Treasury constant maturity rate
    });
    
    if (error || !data?.observations?.length) {
      return 0.04; // Default 4% if API fails
    }
    
    const latestRate = data.observations[data.observations.length - 1]?.value;
    return latestRate ? parseFloat(latestRate) / 100 : 0.04;
  } catch (error) {
    console.error('Error fetching risk-free rate:', error);
    return 0.04; // Default fallback
  }
}

// 6. Main Analysis Function
export async function analyzePortfolio(portfolio: Portfolio): Promise<PortfolioAnalysis> {
  try {
    console.log('Starting comprehensive portfolio analysis...');
    
    // 1. Fetch current prices from CoinMarketCap
    const updatedPortfolio = await fetchCurrentPrices(portfolio);
    console.log('Fetched current prices');
    
    // 2. Fetch historical data from Glassnode
    await fetchHistoricalData(updatedPortfolio);
    console.log('Fetched historical data');
    
    // 3. Get risk-free rate
    const riskFreeRate = await fetchRiskFreeRate();
    console.log('Risk-free rate:', riskFreeRate);
    
    // 4. Calculate asset metrics
    const assetsMetrics: Record<string, FinancialMetrics> = {};
    updatedPortfolio.assets.forEach(asset => {
      const volatility = calculateAssetVolatility(asset.historicalPrices);
      assetsMetrics[asset.id] = {
        npv: calculateAssetNPV(asset, riskFreeRate),
        cagr: calculateAssetCAGR(asset),
        beta: calculateAssetBeta(asset, getBenchmark(asset)),
        volatility,
        liquidityScore: calculateLiquidityScore(asset.transactionVolumes),
        efficiencyRatio: volatility > 0 ? calculateAssetCAGR(asset) / volatility : 0
      };
    });
    console.log('Calculated asset metrics');
    
    // 5. Calculate category metrics
    const categories = {
      bitcoin: aggregateCategoryMetrics(updatedPortfolio.assets, 'bitcoin', riskFreeRate),
      bluechip: aggregateCategoryMetrics(updatedPortfolio.assets, 'bluechip', riskFreeRate),
      smallcap: aggregateCategoryMetrics(updatedPortfolio.assets, 'smallcap', riskFreeRate)
    };
    console.log('Calculated category metrics');
    
    // 6. Calculate portfolio metrics
    const portfolioMetrics = calculatePortfolioMetrics(updatedPortfolio.assets, riskFreeRate);
    console.log('Calculated portfolio metrics');
    
    // 7. Generate decisions
    const analysis: PortfolioAnalysis = {
      timestamp: new Date(),
      assets: assetsMetrics,
      categories,
      portfolio: portfolioMetrics,
      decisions: []
    };
    
    const decisions = generatePortfolioDecisions(updatedPortfolio, analysis, riskFreeRate);
    analysis.decisions = decisions;
    console.log('Generated decisions');
    
    return analysis;
    
  } catch (error) {
    console.error('Error in comprehensive portfolio analysis:', error);
    
    // Return fallback analysis
    return {
      timestamp: new Date(),
      assets: {},
      categories: {
        bitcoin: { weight: 0, npv: 0, cagr: 0, beta: 1, volatility: 0, liquidityScore: 0, efficiencyRatio: 0 },
        bluechip: { weight: 0, npv: 0, cagr: 0, beta: 1, volatility: 0, liquidityScore: 0, efficiencyRatio: 0 },
        smallcap: { weight: 0, npv: 0, cagr: 0, beta: 1, volatility: 0, liquidityScore: 0, efficiencyRatio: 0 }
      },
      portfolio: {
        npv: 0,
        cagr: 0,
        beta: 1,
        riskScore: 0,
        diversificationScore: 0,
        projectedValue1Y: 0,
        projectedValue3Y: 0
      },
      decisions: []
    };
  }
}