import { supabase } from '@/integrations/supabase/client';
import { hybridNPVCalculationService } from './hybridNPVCalculationService';
import { standaloneCAGRCalculationService } from './standaloneCAGRCalculationService';
import { glassnodeBetaCalculationService } from './glassnodeBetaCalculationService';
import { fetchCoinPrices } from './coinMarketCapService';

export interface AssetMetrics {
  id: string;
  symbol: string;
  name: string;
  category: 'bitcoin' | 'bluechip' | 'smallcap';
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  profit: number;
  holdingPeriodDays: number;
  holdingPeriodYears: number;
  npv: number;
  cagr: number;
  beta: number;
  confidence: string;
}

export interface CategoryMetrics {
  category: 'bitcoin' | 'bluechip' | 'smallcap';
  npv: number;
  cagr: number;
  beta: number;
  weight: number;
  currentValue: number;
  allocation: number;
}

export interface PortfolioMetrics {
  totalCurrentValue: number;
  totalCostBasis: number;
  totalProfit: number;
  npv: number;
  cagr: number;
  beta: number;
  diversificationScore: number;
  riskScore: number;
  projectedValue1Y: number;
  projectedValue3Y: number;
}

export interface EnhancedPortfolioAnalysis {
  portfolio: PortfolioMetrics;
  categories: Record<string, CategoryMetrics>;
  assets: AssetMetrics[];
  decisions: Array<{
    type: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    reason: string;
    amountUSD?: number;
  }>;
  lastCalculated: Date;
}

class EnhancedVirtualPortfolioCalculatorService {
  
  /**
   * Main analysis function that uses hybrid calculators
   */
  async analyzeVirtualPortfolio(portfolioId: string): Promise<EnhancedPortfolioAnalysis> {
    console.log('🔄 Starting enhanced virtual portfolio analysis...');
    
    try {
      // Step 1: Fetch portfolio assets and transactions
      const { portfolioAssets, earliestTransactions } = await this.fetchPortfolioData(portfolioId);
      
      if (!portfolioAssets || portfolioAssets.length === 0) {
        throw new Error('No assets found in portfolio');
      }

      // Step 2: Get current market prices
      const symbols = portfolioAssets.map(asset => asset.virtual_coins.symbol);
      const marketPrices = await this.getCurrentMarketPrices(symbols);
      
      // Step 3: Calculate asset-level metrics using hybrid calculators
      const assetMetrics = await this.calculateAssetMetrics(portfolioAssets, earliestTransactions, marketPrices);
      
      // Step 4: Aggregate to category level
      const categoryMetrics = this.calculateCategoryMetrics(assetMetrics);
      
      // Step 5: Calculate portfolio-level metrics
      const portfolioMetrics = this.calculatePortfolioMetrics(assetMetrics, categoryMetrics);
      
      // Step 6: Generate recommendations
      const decisions = this.generateRecommendations(portfolioMetrics, categoryMetrics, assetMetrics);
      
      console.log('✅ Enhanced portfolio analysis completed');
      
      return {
        portfolio: portfolioMetrics,
        categories: categoryMetrics,
        assets: assetMetrics,
        decisions,
        lastCalculated: new Date()
      };
      
    } catch (error) {
      console.error('❌ Enhanced portfolio analysis failed:', error);
      throw error;
    }
  }

  /**
   * Fetch portfolio data and earliest transactions
   */
  private async fetchPortfolioData(portfolioId: string) {
    // Fetch assets with coin info
    const { data: portfolioAssets, error: assetsError } = await supabase
      .from('virtual_assets')
      .select(`
        *,
        virtual_coins (
          symbol,
          name
        )
      `)
      .eq('portfolio_id', portfolioId)
      .gt('total_amount', 0);

    if (assetsError) throw assetsError;

    // Fetch earliest transaction for each asset to calculate holding period
    const { data: transactions, error: txError } = await supabase
      .from('virtual_transactions')
      .select('coin_id, transaction_date')
      .eq('portfolio_id', portfolioId)
      .order('transaction_date', { ascending: true });

    if (txError) throw txError;

    // Group transactions by coin_id to find earliest dates
    const earliestTransactions = transactions?.reduce((acc, tx) => {
      if (!acc[tx.coin_id] || new Date(tx.transaction_date) < new Date(acc[tx.coin_id])) {
        acc[tx.coin_id] = tx.transaction_date;
      }
      return acc;
    }, {} as Record<string, string>) || {};

    return { portfolioAssets, earliestTransactions };
  }

  /**
   * Get current market prices from CoinMarketCap
   */
  private async getCurrentMarketPrices(symbols: string[]) {
    try {
      const marketData = await fetchCoinPrices(symbols);
      return marketData.reduce((acc, coin) => {
        acc[coin.symbol] = coin.current_price;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      console.warn('Failed to fetch market prices, using stored prices:', error);
      return {};
    }
  }

  /**
   * Calculate metrics for each asset using hybrid calculators
   */
  private async calculateAssetMetrics(
    portfolioAssets: any[], 
    earliestTransactions: Record<string, string>, 
    marketPrices: Record<string, number>
  ): Promise<AssetMetrics[]> {
    const assetMetrics: AssetMetrics[] = [];

    for (const asset of portfolioAssets) {
      const symbol = asset.virtual_coins.symbol;
      const currentPrice = marketPrices[symbol] || asset.average_price;
      const currentValue = asset.total_amount * currentPrice;
      const costBasis = asset.cost_basis;
      const profit = currentValue - costBasis;

      // Calculate actual holding period
      const earliestDate = earliestTransactions[asset.coin_id] 
        ? new Date(earliestTransactions[asset.coin_id])
        : new Date(asset.created_at);
      const holdingPeriodDays = Math.max(1, Math.floor((Date.now() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)));
      const holdingPeriodYears = Math.max(0.1, holdingPeriodDays / 365.25);

      // Use hybrid calculators with current market value and actual holding period
      console.log(`📊 Calculating metrics for ${symbol}: $${currentValue.toFixed(2)}, ${holdingPeriodYears.toFixed(2)} years`);

      try {
        // Calculate NPV using hybrid calculator
        const npvResult = await hybridNPVCalculationService.calculateHybridNPV(
          symbol.toLowerCase(), 
          currentValue, 
          Math.ceil(holdingPeriodYears)
        );

        // Calculate CAGR with 36-month lookback
        const cagrResult = await standaloneCAGRCalculationService.calculateStandaloneCAGR(
          symbol.toLowerCase(), 
          symbol, 
          3
        );

        // Calculate Beta
        const betaResult = await glassnodeBetaCalculationService.calculateBeta(symbol.toLowerCase());

        assetMetrics.push({
          id: asset.id,
          symbol,
          name: asset.virtual_coins.name,
          category: this.categorizeAsset(symbol),
          quantity: asset.total_amount,
          averagePurchasePrice: asset.average_price,
          currentPrice,
          currentValue,
          costBasis,
          profit,
          holdingPeriodDays,
          holdingPeriodYears,
          npv: npvResult.npv || 0,
          cagr: (cagrResult.cagr || 0) / 100, // Convert percentage to decimal
          beta: betaResult.beta || 1.0,
          confidence: cagrResult.confidence || 'medium'
        });

      } catch (error) {
        console.warn(`Failed to calculate metrics for ${symbol}:`, error);
        
        // Fallback values
        assetMetrics.push({
          id: asset.id,
          symbol,
          name: asset.virtual_coins.name,
          category: this.categorizeAsset(symbol),
          quantity: asset.total_amount,
          averagePurchasePrice: asset.average_price,
          currentPrice,
          currentValue,
          costBasis,
          profit,
          holdingPeriodDays,
          holdingPeriodYears,
          npv: profit, // Use simple profit as NPV fallback
          cagr: holdingPeriodYears > 0 ? Math.pow(currentValue / costBasis, 1 / holdingPeriodYears) - 1 : 0,
          beta: this.getEstimatedBeta(symbol),
          confidence: 'low'
        });
      }
    }

    return assetMetrics;
  }

  /**
   * Categorize asset by symbol
   */
  private categorizeAsset(symbol: string): 'bitcoin' | 'bluechip' | 'smallcap' {
    const symbolUpper = symbol.toUpperCase();
    
    if (symbolUpper === 'BTC') return 'bitcoin';
    
    const bluechipSymbols = ['ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM'];
    if (bluechipSymbols.includes(symbolUpper)) return 'bluechip';
    
    return 'smallcap';
  }

  /**
   * Get estimated beta for fallback
   */
  private getEstimatedBeta(symbol: string): number {
    const symbolUpper = symbol.toUpperCase();
    
    if (symbolUpper === 'BTC') return 1.0;
    if (['ETH', 'SOL', 'ADA'].includes(symbolUpper)) return 1.5;
    return 2.0; // Small caps typically have higher beta
  }

  /**
   * Calculate category-level metrics by aggregating assets
   */
  private calculateCategoryMetrics(assetMetrics: AssetMetrics[]): Record<string, CategoryMetrics> {
    const categories: Record<string, CategoryMetrics> = {};
    const totalPortfolioValue = assetMetrics.reduce((sum, asset) => sum + asset.currentValue, 0);

    // Group assets by category
    const assetsByCategory = assetMetrics.reduce((acc, asset) => {
      if (!acc[asset.category]) acc[asset.category] = [];
      acc[asset.category].push(asset);
      return acc;
    }, {} as Record<string, AssetMetrics[]>);

    // Calculate weighted metrics for each category
    Object.entries(assetsByCategory).forEach(([category, assets]) => {
      const totalCategoryValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
      const weight = totalPortfolioValue > 0 ? totalCategoryValue / totalPortfolioValue : 0;

      // Weighted averages
      const weightedCAGR = assets.reduce((sum, asset) => {
        const assetWeight = totalCategoryValue > 0 ? asset.currentValue / totalCategoryValue : 0;
        return sum + (asset.cagr * assetWeight);
      }, 0);

      const weightedBeta = assets.reduce((sum, asset) => {
        const assetWeight = totalCategoryValue > 0 ? asset.currentValue / totalCategoryValue : 0;
        return sum + (asset.beta * assetWeight);
      }, 0);

      const totalNPV = assets.reduce((sum, asset) => sum + asset.npv, 0);

      categories[category] = {
        category: category as 'bitcoin' | 'bluechip' | 'smallcap',
        npv: totalNPV,
        cagr: weightedCAGR,
        beta: weightedBeta,
        weight,
        currentValue: totalCategoryValue,
        allocation: weight * 100
      };
    });

    return categories;
  }

  /**
   * Calculate portfolio-level metrics
   */
  private calculatePortfolioMetrics(assetMetrics: AssetMetrics[], categoryMetrics: Record<string, CategoryMetrics>): PortfolioMetrics {
    const totalCurrentValue = assetMetrics.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalCostBasis = assetMetrics.reduce((sum, asset) => sum + asset.costBasis, 0);
    const totalProfit = totalCurrentValue - totalCostBasis;

    // Portfolio NPV (sum of all asset NPVs)
    const portfolioNPV = assetMetrics.reduce((sum, asset) => sum + asset.npv, 0);

    // Portfolio weighted CAGR
    const portfolioCAGR = assetMetrics.reduce((sum, asset) => {
      const weight = totalCurrentValue > 0 ? asset.currentValue / totalCurrentValue : 0;
      return sum + (asset.cagr * weight);
    }, 0);

    // Portfolio weighted Beta
    const portfolioBeta = assetMetrics.reduce((sum, asset) => {
      const weight = totalCurrentValue > 0 ? asset.currentValue / totalCurrentValue : 0;
      return sum + (asset.beta * weight);
    }, 0);

    // Diversification score using Herfindahl-Hirschman Index
    const hhiScore = assetMetrics.reduce((sum, asset) => {
      const weight = totalCurrentValue > 0 ? asset.currentValue / totalCurrentValue : 0;
      return sum + (weight * weight);
    }, 0);
    const diversificationScore = Math.max(0, (1 - hhiScore) * 100);

    // Risk score based on concentration and volatility
    const categoryCount = Object.keys(categoryMetrics).length;
    const riskScore = Math.min(100, 
      (hhiScore * 50) + // Concentration risk
      (portfolioBeta > 1.5 ? 25 : 0) + // Beta risk
      (categoryCount < 2 ? 25 : 0) // Diversification penalty
    );

    // Projections using portfolio CAGR
    const projectedValue1Y = totalCurrentValue * (1 + portfolioCAGR);
    const projectedValue3Y = totalCurrentValue * Math.pow(1 + portfolioCAGR, 3);

    return {
      totalCurrentValue,
      totalCostBasis,
      totalProfit,
      npv: portfolioNPV,
      cagr: portfolioCAGR,
      beta: portfolioBeta,
      diversificationScore,
      riskScore,
      projectedValue1Y,
      projectedValue3Y
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    portfolio: PortfolioMetrics,
    categories: Record<string, CategoryMetrics>,
    assets: AssetMetrics[]
  ) {
    const decisions = [];
    
    // Bitcoin allocation check
    const btcAllocation = categories.bitcoin?.allocation || 0;
    if (btcAllocation < 40) {
      decisions.push({
        type: 'rebalance',
        priority: 'high' as const,
        action: `Increase Bitcoin allocation from ${btcAllocation.toFixed(1)}% to 40-60%`,
        reason: 'Bitcoin should be the core holding for portfolio stability',
        amountUSD: portfolio.totalCurrentValue * 0.1
      });
    } else if (btcAllocation > 70) {
      decisions.push({
        type: 'rebalance',
        priority: 'medium' as const,
        action: `Reduce Bitcoin allocation from ${btcAllocation.toFixed(1)}% to 60-70%`,
        reason: 'Over-concentration in Bitcoin reduces growth potential',
        amountUSD: portfolio.totalCurrentValue * 0.05
      });
    }

    // Diversification check
    if (portfolio.diversificationScore < 50) {
      decisions.push({
        type: 'diversify',
        priority: 'high' as const,
        action: 'Add more assets to improve diversification',
        reason: `Current diversification score: ${portfolio.diversificationScore.toFixed(1)}/100`
      });
    }

    // Risk management
    if (portfolio.riskScore > 70) {
      decisions.push({
        type: 'risk_management',
        priority: 'critical' as const,
        action: 'Reduce portfolio risk through rebalancing',
        reason: `High risk score: ${portfolio.riskScore.toFixed(1)}/100`
      });
    }

    // Performance insights
    if (portfolio.cagr < 0.1) {
      decisions.push({
        type: 'performance',
        priority: 'medium' as const,
        action: 'Consider reviewing underperforming assets',
        reason: `Portfolio CAGR below 10%: ${(portfolio.cagr * 100).toFixed(1)}%`
      });
    }

    return decisions;
  }
}

export const enhancedVirtualPortfolioCalculatorService = new EnhancedVirtualPortfolioCalculatorService();