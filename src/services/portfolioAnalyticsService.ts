import { supabase } from '@/integrations/supabase/client';
import { CoinMarketCapCoin } from './coinMarketCapService';
import { calculateCAGR, calculateNPV, generateCashFlows } from '@/utils/financialCalculations';
import { riskManagementService } from './riskManagementService';

export interface PortfolioAnalytics {
  totalReturn: number;
  annualizedReturn: number;
  bestPerformingAsset: {
    symbol: string;
    return: number;
  };
  worstPerformingAsset: {
    symbol: string;
    return: number;
  };
  topGainer: {
    symbol: string;
    change: number;
  };
  topLoser: {
    symbol: string;
    change: number;
  };
}

export interface AdvancedAnalytics {
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
  winRate: number;
  riskScore: number;
  diversificationScore: number;
  momentum: number;
  recommendations: string[];
  npvAnalysis: {
    portfolioNPV: number;
    projectedValue: number;
    riskAdjustedReturn: number;
  };
}

class PortfolioAnalyticsService {
  /**
   * Calculate portfolio analytics summary
   */
  async calculatePortfolioAnalytics(portfolioId: string): Promise<PortfolioAnalytics> {
    try {
      // Fetch assets and transactions
      const { data: assets, error: assetsError } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins!inner(name, symbol)
        `)
        .eq('portfolio_id', portfolioId)
        .gt('total_amount', 0);

      if (assetsError) throw assetsError;
      if (!assets || assets.length === 0) {
        return this.getEmptyAnalytics();
      }

      const { data: transactions, error: txError } = await supabase
        .from('virtual_transactions')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('transaction_date', { ascending: true });

      if (txError) throw txError;

      // Calculate performance metrics
      const assetReturns = assets.map(asset => {
        const totalReturn = asset.cost_basis > 0 
          ? ((asset.total_amount * asset.average_price) - asset.cost_basis) / asset.cost_basis * 100 
          : 0;
        return {
          symbol: asset.virtual_coins.symbol,
          return: totalReturn
        };
      });

      // Sort by performance
      const sortedReturns = [...assetReturns].sort((a, b) => b.return - a.return);
      
      // Calculate total portfolio return
      const totalCostBasis = assets.reduce((sum, asset) => sum + asset.cost_basis, 0);
      const totalCurrentValue = assets.reduce((sum, asset) => sum + (asset.total_amount * asset.average_price), 0);
      const totalReturn = totalCostBasis > 0 ? ((totalCurrentValue - totalCostBasis) / totalCostBasis) * 100 : 0;

      // Calculate annualized return (assuming portfolio created date as start)
      const portfolioStartDate = transactions?.[0]?.transaction_date || new Date().toISOString();
      const daysSinceStart = Math.max(1, (Date.now() - new Date(portfolioStartDate).getTime()) / (1000 * 60 * 60 * 24));
      const yearsElapsed = Math.max(0.1, daysSinceStart / 365.25);
      const annualizedReturn = totalCostBasis > 0 
        ? calculateCAGR(totalCostBasis, totalCurrentValue, yearsElapsed)
        : 0;

      // Calculate day changes (simulated based on crypto volatility)
      const dayChanges = assetReturns.map(asset => ({
        symbol: asset.symbol,
        change: (Math.random() - 0.5) * 20 // Random ±10% for demo
      }));
      dayChanges.sort((a, b) => b.change - a.change);

      return {
        totalReturn: Math.round(totalReturn * 10) / 10,
        annualizedReturn: Math.round(annualizedReturn * 10) / 10,
        bestPerformingAsset: sortedReturns[0] || { symbol: 'N/A', return: 0 },
        worstPerformingAsset: sortedReturns[sortedReturns.length - 1] || { symbol: 'N/A', return: 0 },
        topGainer: dayChanges[0] || { symbol: 'N/A', change: 0 },
        topLoser: dayChanges[dayChanges.length - 1] || { symbol: 'N/A', change: 0 }
      };
    } catch (error) {
      console.error('Error calculating portfolio analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Calculate advanced analytics with real data
   */
  async calculateAdvancedAnalytics(portfolioId: string, liveCoinsData: CoinMarketCapCoin[] = []): Promise<AdvancedAnalytics> {
    try {
      // Fetch assets
      const { data: assets, error: assetsError } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins!inner(name, symbol)
        `)
        .eq('portfolio_id', portfolioId)
        .gt('total_amount', 0);

      if (assetsError) throw assetsError;
      if (!assets || assets.length === 0) {
        return this.getEmptyAdvancedAnalytics();
      }

      // Get risk analysis - cast assets to VirtualAsset type
      const riskAnalysis = riskManagementService.analyzeRisk(assets as any, liveCoinsData);
      
      // Calculate portfolio metrics
      const totalValue = riskAnalysis.totalValue;
      const totalCostBasis = assets.reduce((sum, asset) => sum + asset.cost_basis, 0);
      const totalReturn = totalCostBasis > 0 ? ((totalValue - totalCostBasis) / totalCostBasis) * 100 : 0;

      // Calculate Sharpe Ratio (simplified)
      const riskFreeRate = 4.5; // Current US Treasury rate approximation
      const portfolioVolatility = this.calculatePortfolioVolatility(assets, liveCoinsData);
      const excessReturn = totalReturn - riskFreeRate;
      const sharpeRatio = portfolioVolatility > 0 ? excessReturn / portfolioVolatility : 0;

      // Calculate win rate
      const profitableAssets = assets.filter(asset => {
        const currentValue = asset.total_amount * asset.average_price;
        return currentValue > asset.cost_basis;
      });
      const winRate = assets.length > 0 ? (profitableAssets.length / assets.length) * 100 : 0;

      // Calculate max drawdown (simplified estimation)
      const maxDrawdown = this.estimateMaxDrawdown(totalReturn, portfolioVolatility);

      // Calculate momentum (price trend indicator)
      const momentum = this.calculateMomentum(assets, liveCoinsData);

      // NPV Analysis
      const npvAnalysis = this.calculatePortfolioNPV(assets, liveCoinsData);

      // Generate AI recommendations
      const recommendations = this.generateRecommendations(riskAnalysis, sharpeRatio, winRate, portfolioVolatility);

      return {
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        volatility: Math.round(portfolioVolatility * 10) / 10,
        maxDrawdown: Math.round(maxDrawdown * 10) / 10,
        winRate: Math.round(winRate * 10) / 10,
        riskScore: this.calculateRiskScore(riskAnalysis, portfolioVolatility),
        diversificationScore: riskAnalysis.diversificationScore,
        momentum: Math.round(momentum * 10) / 10,
        recommendations,
        npvAnalysis
      };
    } catch (error) {
      console.error('Error calculating advanced analytics:', error);
      return this.getEmptyAdvancedAnalytics();
    }
  }

  /**
   * Calculate portfolio volatility
   */
  private calculatePortfolioVolatility(assets: any[], liveCoinsData: CoinMarketCapCoin[]): number {
    if (assets.length === 0) return 0;

    const totalValue = assets.reduce((sum, asset) => {
      const liveCoinData = liveCoinsData.find(coin => coin.symbol === asset.virtual_coins.symbol);
      const currentPrice = liveCoinData?.current_price || asset.average_price;
      return sum + (asset.total_amount * currentPrice);
    }, 0);

    // Weighted average volatility
    let weightedVolatility = 0;
    assets.forEach(asset => {
      const liveCoinData = liveCoinsData.find(coin => coin.symbol === asset.virtual_coins.symbol);
      const currentPrice = liveCoinData?.current_price || asset.average_price;
      const assetValue = asset.total_amount * currentPrice;
      const weight = totalValue > 0 ? assetValue / totalValue : 0;
      
      // Estimate volatility based on asset type
      let assetVolatility = 50; // Default crypto volatility
      if (asset.virtual_coins.symbol === 'BTC') assetVolatility = 40;
      else if (['ETH', 'BNB', 'ADA', 'SOL'].includes(asset.virtual_coins.symbol)) assetVolatility = 60;
      else assetVolatility = 80; // Small caps
      
      weightedVolatility += weight * assetVolatility;
    });

    return weightedVolatility;
  }

  /**
   * Estimate max drawdown
   */
  private estimateMaxDrawdown(totalReturn: number, volatility: number): number {
    // Simplified estimation: drawdown typically correlates with volatility
    if (totalReturn >= 0) {
      return Math.min(volatility * 0.5, 25); // Positive returns have lower drawdowns
    } else {
      return Math.max(Math.abs(totalReturn), volatility * 0.7);
    }
  }

  /**
   * Calculate momentum indicator
   */
  private calculateMomentum(assets: any[], liveCoinsData: CoinMarketCapCoin[]): number {
    if (assets.length === 0) return 0;

    let momentumSum = 0;
    let totalWeight = 0;

    assets.forEach(asset => {
      const liveCoinData = liveCoinsData.find(coin => coin.symbol === asset.virtual_coins.symbol);
      const currentPrice = liveCoinData?.current_price || asset.average_price;
      const assetValue = asset.total_amount * currentPrice;
      
      // Calculate momentum based on price vs average price
      const priceMomentum = ((currentPrice - asset.average_price) / asset.average_price) * 100;
      
      momentumSum += priceMomentum * assetValue;
      totalWeight += assetValue;
    });

    return totalWeight > 0 ? momentumSum / totalWeight : 0;
  }

  /**
   * Calculate portfolio NPV
   */
  private calculatePortfolioNPV(assets: any[], liveCoinsData: CoinMarketCapCoin[]) {
    const totalValue = assets.reduce((sum, asset) => {
      const liveCoinData = liveCoinsData.find(coin => coin.symbol === asset.virtual_coins.symbol);
      const currentPrice = liveCoinData?.current_price || asset.average_price;
      return sum + (asset.total_amount * currentPrice);
    }, 0);

    const totalCostBasis = assets.reduce((sum, asset) => sum + asset.cost_basis, 0);
    
    // Project future value (2-year horizon)
    const expectedGrowthRate = 0.25; // 25% annual growth expectation for crypto
    const projectedValue = totalValue * Math.pow(1 + expectedGrowthRate, 2);
    
    // Calculate NPV using 10% discount rate
    const discountRate = 0.10;
    const cashFlows = [
      -totalCostBasis, // Initial investment (negative)
      0, // Year 1 (no cash flow)
      projectedValue // Year 2 (exit value)
    ];
    
    const portfolioNPV = calculateNPV(cashFlows, discountRate);
    const riskAdjustedReturn = totalCostBasis > 0 ? (portfolioNPV / totalCostBasis) * 100 : 0;

    return {
      portfolioNPV: Math.round(portfolioNPV),
      projectedValue: Math.round(projectedValue),
      riskAdjustedReturn: Math.round(riskAdjustedReturn * 10) / 10
    };
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(riskAnalysis: any, volatility: number): number {
    let score = 5; // Start neutral

    // Adjust based on BTC allocation compliance
    if (riskAnalysis.isCompliant) score -= 1;
    else score += 1;

    // Adjust based on diversification
    if (riskAnalysis.diversificationScore > 70) score -= 1;
    else if (riskAnalysis.diversificationScore < 30) score += 2;

    // Adjust based on volatility
    if (volatility > 70) score += 1;
    else if (volatility < 40) score -= 1;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  /**
   * Generate AI recommendations
   */
  private generateRecommendations(
    riskAnalysis: any, 
    sharpeRatio: number, 
    winRate: number, 
    volatility: number
  ): string[] {
    const recommendations: string[] = [];

    // BTC allocation recommendations
    if (!riskAnalysis.isCompliant) {
      if (riskAnalysis.currentBtcAllocation < riskAnalysis.recommendedBtcAllocation) {
        recommendations.push(`Increase Bitcoin allocation to ${riskAnalysis.recommendedBtcAllocation}% for better risk management`);
      } else {
        recommendations.push(`Reduce Bitcoin allocation to ${riskAnalysis.recommendedBtcAllocation}% to avoid over-concentration`);
      }
    }

    // Diversification recommendations
    if (riskAnalysis.diversificationScore < 50) {
      recommendations.push('Portfolio concentration is high - consider diversifying across more assets');
    }

    // Performance recommendations
    if (sharpeRatio < 1) {
      recommendations.push('Consider rebalancing to improve risk-adjusted returns');
    }

    if (winRate < 50) {
      recommendations.push('Review underperforming positions and consider profit-taking strategy');
    }

    // Volatility recommendations
    if (volatility > 70) {
      recommendations.push('High portfolio volatility detected - consider adding more stable assets');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Portfolio is well-balanced according to current risk guidelines');
      recommendations.push('Consider regular rebalancing to maintain optimal allocation');
    }

    return recommendations;
  }

  private getEmptyAnalytics(): PortfolioAnalytics {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      bestPerformingAsset: { symbol: 'N/A', return: 0 },
      worstPerformingAsset: { symbol: 'N/A', return: 0 },
      topGainer: { symbol: 'N/A', change: 0 },
      topLoser: { symbol: 'N/A', change: 0 }
    };
  }

  private getEmptyAdvancedAnalytics(): AdvancedAnalytics {
    return {
      sharpeRatio: 0,
      volatility: 0,
      maxDrawdown: 0,
      winRate: 0,
      riskScore: 5,
      diversificationScore: 0,
      momentum: 0,
      recommendations: ['No data available for analysis'],
      npvAnalysis: {
        portfolioNPV: 0,
        projectedValue: 0,
        riskAdjustedReturn: 0
      }
    };
  }
}

export const portfolioAnalyticsService = new PortfolioAnalyticsService();