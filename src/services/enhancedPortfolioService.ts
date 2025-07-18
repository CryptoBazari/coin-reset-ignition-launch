
import { supabase } from '@/integrations/supabase/client';
import { enhancedRealTimeMarketService, GlassNodeCoinData } from './enhancedRealTimeMarketService';
import { getOnChainAnalysis } from './glassNodeService';
import type { VirtualPortfolio, VirtualAsset } from '@/types/virtualPortfolio';

interface EnhancedPortfolioMetrics {
  totalValue: number;
  totalProfit: number;
  onChainHealthScore: number;
  liquidityScore: number;
  exchangeFlowScore: number;
  cointimeScore: number;
  riskScore: number;
}

export class EnhancedPortfolioService {
  async getEnhancedPortfolioMetrics(portfolioId: string): Promise<EnhancedPortfolioMetrics> {
    try {
      // Get portfolio assets
      const { data: assets, error } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins!inner(symbol, name)
        `)
        .eq('portfolio_id', portfolioId);

      if (error) throw error;

      let totalValue = 0;
      let totalProfit = 0;
      let onChainScores: number[] = [];
      let liquidityScores: number[] = [];
      let exchangeFlowScores: number[] = [];
      let cointimeScores: number[] = [];

      for (const asset of assets) {
        const coinSymbol = asset.virtual_coins.symbol;
        
        // Get enhanced coin data
        const enhancedData = await enhancedRealTimeMarketService.getEnhancedCoinData(coinSymbol.toLowerCase());
        
        if (enhancedData) {
          const assetValue = asset.total_amount * enhancedData.current_price;
          totalValue += assetValue;
          totalProfit += asset.realized_profit + (assetValue - asset.cost_basis);

          // Calculate Glass Node scores
          if (enhancedData.onChainMetrics) {
            onChainScores.push(this.calculateOnChainScore(enhancedData.onChainMetrics));
            liquidityScores.push(this.calculateLiquidityScore(enhancedData.onChainMetrics));
            exchangeFlowScores.push(this.calculateExchangeFlowScore(enhancedData.onChainMetrics));
          }

          // Get cointime analysis
          const onChainAnalysis = await getOnChainAnalysis(coinSymbol, 7);
          if (onChainAnalysis.cointime.length > 0) {
            cointimeScores.push(this.calculateCointimeScore(onChainAnalysis.cointime));
          }
        }
      }

      return {
        totalValue,
        totalProfit,
        onChainHealthScore: this.averageScore(onChainScores),
        liquidityScore: this.averageScore(liquidityScores),
        exchangeFlowScore: this.averageScore(exchangeFlowScores),
        cointimeScore: this.averageScore(cointimeScores),
        riskScore: this.calculatePortfolioRiskScore(onChainScores, liquidityScores, exchangeFlowScores)
      };

    } catch (error) {
      console.error('Error calculating enhanced portfolio metrics:', error);
      return {
        totalValue: 0,
        totalProfit: 0,
        onChainHealthScore: 5,
        liquidityScore: 5,
        exchangeFlowScore: 5,
        cointimeScore: 5,
        riskScore: 5
      };
    }
  }

  async getPortfolioOnChainAnalysis(portfolioId: string) {
    const { data: assets, error } = await supabase
      .from('virtual_assets')
      .select(`
        total_amount,
        virtual_coins!inner(symbol, name)
      `)
      .eq('portfolio_id', portfolioId);

    if (error) throw error;

    const analyses = [];
    
    for (const asset of assets) {
      const coinSymbol = asset.virtual_coins.symbol;
      const analysis = await getOnChainAnalysis(coinSymbol, 30);
      
      analyses.push({
        coin: asset.virtual_coins,
        amount: asset.total_amount,
        analysis
      });
    }

    return analyses;
  }

  async getPortfolioRebalancingRecommendations(portfolioId: string) {
    const metrics = await this.getEnhancedPortfolioMetrics(portfolioId);
    const recommendations: string[] = [];

    // On-chain health recommendations
    if (metrics.onChainHealthScore < 4) {
      recommendations.push('⚠️ Low on-chain health detected. Consider reducing exposure to assets with declining network activity.');
    }

    // Liquidity recommendations
    if (metrics.liquidityScore < 4) {
      recommendations.push('💧 High liquidity risk. Consider assets with better liquid/illiquid supply ratios.');
    }

    // Exchange flow recommendations
    if (metrics.exchangeFlowScore < 4) {
      recommendations.push('🔄 Negative exchange flows detected. Market might be under selling pressure.');
    }

    // Cointime recommendations
    if (metrics.cointimeScore > 7) {
      recommendations.push('⏰ High cointime activity suggests potential market top. Consider taking profits.');
    } else if (metrics.cointimeScore < 3) {
      recommendations.push('⏰ Low cointime activity suggests accumulation phase. Good time to increase positions.');
    }

    return recommendations;
  }

  private calculateOnChainScore(metrics: any): number {
    let score = 5;
    
    // Active addresses trend
    if (metrics.activeAddresses > 50000) score += 1;
    if (metrics.activeAddresses > 100000) score += 1;
    
    // Exchange flow health
    const netFlow = metrics.exchangeOutflow - metrics.exchangeInflow;
    if (netFlow > 0) score += 1; // Outflow is bullish
    
    return Math.max(1, Math.min(10, score));
  }

  private calculateLiquidityScore(metrics: any): number {
    if (!metrics.liquidSupply || !metrics.illiquidSupply) return 5;
    
    const ratio = metrics.illiquidSupply / (metrics.liquidSupply + metrics.illiquidSupply);
    
    // Higher illiquid ratio is better (less selling pressure)
    if (ratio > 0.7) return 8;
    if (ratio > 0.5) return 6;
    if (ratio > 0.3) return 4;
    return 2;
  }

  private calculateExchangeFlowScore(metrics: any): number {
    const netFlow = metrics.exchangeOutflow - metrics.exchangeInflow;
    const totalFlow = metrics.exchangeInflow + metrics.exchangeOutflow;
    
    if (totalFlow === 0) return 5;
    
    const flowRatio = netFlow / totalFlow;
    
    // Positive flow ratio (more outflow) is bullish
    if (flowRatio > 0.2) return 8;
    if (flowRatio > 0) return 6;
    if (flowRatio > -0.2) return 4;
    return 2;
  }

  private calculateCointimeScore(cointimeData: any[]): number {
    if (cointimeData.length === 0) return 5;
    
    const latest = cointimeData[cointimeData.length - 1]?.value || 0;
    const average = cointimeData.reduce((sum, point) => sum + point.value, 0) / cointimeData.length;
    
    const ratio = latest / (average || 1);
    
    // Higher cointime destroyed suggests selling
    if (ratio > 2) return 2; // High selling pressure
    if (ratio > 1.5) return 4;
    if (ratio < 0.5) return 8; // Low selling pressure
    return 6;
  }

  private calculatePortfolioRiskScore(onChain: number[], liquidity: number[], exchangeFlow: number[]): number {
    const allScores = [...onChain, ...liquidity, ...exchangeFlow];
    const average = this.averageScore(allScores);
    
    // Invert the score (lower average = higher risk)
    return 11 - average;
  }

  private averageScore(scores: number[]): number {
    if (scores.length === 0) return 5;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
}

export const enhancedPortfolioService = new EnhancedPortfolioService();
