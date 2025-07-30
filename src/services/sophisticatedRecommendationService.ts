import { bitcoinGlassNodeService } from './bitcoinGlassNodeService';
import { riskManagementService } from './riskManagementService';
import { VirtualAsset } from '@/types/virtualPortfolio';

export interface SophisticatedRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'market_timing' | 'allocation' | 'risk_adjustment' | 'opportunity' | 'profit_taking' | 'optimization';
  message: string;
  action: string;
  reasoning: string[];
  amountUSD?: number;
  targetPercentage?: number;
  marketCondition?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface PortfolioAnalysisInput {
  assets: any[];
  liveCoinsData: Array<{ symbol: string; current_price: number }>;
  assetMetrics: any[];
  portfolioMetrics: any;
}

export interface MarketCondition {
  avivRatio: number;
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  reasoning: string;
}

class SophisticatedRecommendationService {

  /**
   * Generate sophisticated recommendations based on AVIV, risk management, and advanced metrics
   */
  async generateAdvancedRecommendations(input: PortfolioAnalysisInput): Promise<SophisticatedRecommendation[]> {
    try {
      // 1. Get current market conditions from AVIV
      const marketCondition = await this.getMarketCondition();
      
      // 2. Get risk analysis from compatible data
      const riskAnalysis = this.analyzePortfolioRisk(input.assets, input.liveCoinsData);
      
      // 3. Analyze individual asset performance
      const assetAnalysis = this.analyzeAssetPerformance(input.assetMetrics);
      
      // 4. Generate recommendations based on all factors
      const recommendations: SophisticatedRecommendation[] = [];
      
      // Market timing recommendations
      recommendations.push(...this.generateMarketTimingRecommendations(marketCondition, riskAnalysis, input.portfolioMetrics));
      
      // Risk management recommendations
      recommendations.push(...this.generateRiskManagementRecommendations(riskAnalysis, marketCondition));
      
      // Asset-specific recommendations
      recommendations.push(...this.generateAssetSpecificRecommendations(assetAnalysis, marketCondition, riskAnalysis));
      
      // Portfolio optimization recommendations
      recommendations.push(...this.generateOptimizationRecommendations(input.portfolioMetrics, riskAnalysis, marketCondition));
      
      // Sort by priority and return top recommendations
      return this.prioritizeRecommendations(recommendations);
      
    } catch (error) {
      console.error('❌ Failed to generate advanced recommendations:', error);
      return this.getFallbackRecommendations(input);
    }
  }

  /**
   * Get current market condition based on Bitcoin AVIV ratio
   */
  private async getMarketCondition(): Promise<MarketCondition> {
    try {
      const bitcoinData = await bitcoinGlassNodeService.getBitcoinCointimeData();
      const avivRatio = bitcoinData.avivRatio;
      
      let signal: MarketCondition['signal'];
      let confidence: number;
      let reasoning: string;
      
      if (avivRatio <= 0.5) {
        signal = 'STRONG_BUY';
        confidence = 0.9;
        reasoning = 'Extremely oversold conditions - historic accumulation opportunity';
      } else if (avivRatio <= 1.0) {
        signal = 'BUY';
        confidence = 0.8;
        reasoning = 'Undersold conditions favor accumulation';
      } else if (avivRatio <= 3.0) {
        signal = 'NEUTRAL';
        confidence = 0.6;
        reasoning = 'Balanced market conditions - focus on portfolio optimization';
      } else if (avivRatio <= 6.0) {
        signal = 'SELL';
        confidence = 0.7;
        reasoning = 'Elevated conditions suggest taking some profits';
      } else {
        signal = 'STRONG_SELL';
        confidence = 0.9;
        reasoning = 'Extremely overbought - strong profit-taking opportunity';
      }
      
      console.log(`📊 Market Condition: ${signal} (AVIV: ${avivRatio.toFixed(3)}, Confidence: ${(confidence * 100).toFixed(0)}%)`);
      
      return { avivRatio, signal, confidence, reasoning };
      
    } catch (error) {
      console.error('❌ Failed to get market condition:', error);
      return {
        avivRatio: 1.5,
        signal: 'NEUTRAL',
        confidence: 0.5,
        reasoning: 'Unable to determine market condition - proceeding with neutral stance'
      };
    }
  }

  /**
   * Generate market timing recommendations based on AVIV
   */
  private generateMarketTimingRecommendations(
    market: MarketCondition, 
    risk: any, 
    portfolio: any
  ): SophisticatedRecommendation[] {
    const recommendations: SophisticatedRecommendation[] = [];
    const totalValue = portfolio.totalCurrentValue;
    
    switch (market.signal) {
      case 'STRONG_BUY':
        recommendations.push({
          priority: 'high',
          type: 'market_timing',
          message: 'Historic Accumulation Opportunity',
          action: `Deploy available cash - Bitcoin AVIV at ${market.avivRatio.toFixed(3)} indicates extreme oversold conditions`,
          reasoning: [
            market.reasoning,
            'Historical data shows strong returns from these levels',
            'Risk-adjusted buying opportunity'
          ],
          amountUSD: Math.min(totalValue * 0.2, 10000), // Max 20% or $10k
          marketCondition: market.signal,
          confidence: 'high'
        });
        break;
        
      case 'BUY':
        recommendations.push({
          priority: 'medium',
          type: 'market_timing',
          message: 'Favorable Accumulation Conditions',
          action: `Consider increasing positions - AVIV at ${market.avivRatio.toFixed(3)} favors buyers`,
          reasoning: [
            market.reasoning,
            'Good entry point for long-term positions',
            'Dollar cost averaging opportunity'
          ],
          amountUSD: totalValue * 0.1,
          marketCondition: market.signal,
          confidence: 'medium'
        });
        break;
        
      case 'SELL':
        recommendations.push({
          priority: 'medium',
          type: 'profit_taking',
          message: 'Consider Profit Taking',
          action: `Take some profits - AVIV at ${market.avivRatio.toFixed(3)} suggests elevated prices`,
          reasoning: [
            market.reasoning,
            'Protect gains from strong run-up',
            'Prepare for potential pullback'
          ],
          amountUSD: totalValue * 0.15,
          marketCondition: market.signal,
          confidence: 'medium'
        });
        break;
        
      case 'STRONG_SELL':
        recommendations.push({
          priority: 'critical',
          type: 'profit_taking',
          message: 'Strong Profit-Taking Signal',
          action: `Significant profit taking recommended - AVIV at ${market.avivRatio.toFixed(3)} indicates extreme overbought conditions`,
          reasoning: [
            market.reasoning,
            'Historic levels suggest major top formation',
            'Protect capital for next cycle'
          ],
          amountUSD: totalValue * 0.25,
          marketCondition: market.signal,
          confidence: 'high'
        });
        break;
        
      default: // NEUTRAL
        recommendations.push({
          priority: 'low',
          type: 'optimization',
          message: 'Focus on Portfolio Optimization',
          action: `Neutral market conditions - optimize allocation and rebalance`,
          reasoning: [
            market.reasoning,
            'Use this time to improve portfolio structure',
            'Prepare for next directional move'
          ],
          marketCondition: market.signal,
          confidence: 'medium'
        });
    }
    
    return recommendations;
  }

  /**
   * Generate risk management recommendations
   */
  private generateRiskManagementRecommendations(
    risk: any, 
    market: MarketCondition
  ): SophisticatedRecommendation[] {
    const recommendations: SophisticatedRecommendation[] = [];
    
    // BTC allocation recommendations
    if (!risk.isCompliant) {
      const direction = risk.rebalanceDirection;
      const amount = risk.rebalanceAmount;
      
      recommendations.push({
        priority: risk.riskLevel === 'high' ? 'critical' : 'medium',
        type: 'allocation',
        message: `BTC Allocation ${direction === 'buy' ? 'Too Low' : 'Too High'}`,
        action: `${direction === 'buy' ? 'Increase' : 'Decrease'} Bitcoin allocation by $${amount.toFixed(0)}`,
        reasoning: [
          `Current allocation: ${risk.currentBtcAllocation.toFixed(1)}%`,
          `Target allocation: ${risk.recommendedBtcAllocation}%`,
          `Portfolio value: $${risk.totalValue.toFixed(0)}`,
          `Market condition supports ${direction === 'buy' ? 'accumulation' : 'reduction'}`
        ],
        amountUSD: amount,
        targetPercentage: risk.recommendedBtcAllocation,
        marketCondition: market.signal,
        confidence: 'high'
      });
    }
    
    // Diversification recommendations
    if (risk.diversificationScore < 50) {
      recommendations.push({
        priority: 'medium',
        type: 'risk_adjustment',
        message: 'Improve Portfolio Diversification',
        action: `Add 2-3 more assets to improve diversification score from ${risk.diversificationScore}/100`,
        reasoning: [
          'Low diversification increases portfolio risk',
          'Consider adding assets from different categories',
          'Reduce concentration risk'
        ],
        confidence: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate asset-specific recommendations based on metrics
   */
  private generateAssetSpecificRecommendations(
    assetAnalysis: any, 
    market: MarketCondition, 
    risk: any
  ): SophisticatedRecommendation[] {
    const recommendations: SophisticatedRecommendation[] = [];
    
    // Find underperforming assets
    const underperformers = assetAnalysis.underperformers || [];
    if (underperformers.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'optimization',
        message: 'Review Underperforming Assets',
        action: `Consider rebalancing from ${underperformers.map(a => a.symbol).join(', ')}`,
        reasoning: [
          'These assets are underperforming the portfolio average',
          'NPV analysis suggests limited upside potential',
          'Consider rotating to stronger performers'
        ],
        confidence: 'medium'
      });
    }
    
    // Find high-opportunity assets
    const opportunities = assetAnalysis.opportunities || [];
    if (opportunities.length > 0 && (market.signal === 'BUY' || market.signal === 'STRONG_BUY')) {
      recommendations.push({
        priority: 'medium',
        type: 'opportunity',
        message: 'High-Potential Assets Identified',
        action: `Consider increasing allocation to ${opportunities.map(a => a.symbol).join(', ')}`,
        reasoning: [
          'Strong NPV and CAGR metrics',
          'Market timing favors accumulation',
          'Risk-adjusted returns look attractive'
        ],
        confidence: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate portfolio optimization recommendations
   */
  private generateOptimizationRecommendations(
    portfolio: any, 
    risk: any, 
    market: MarketCondition
  ): SophisticatedRecommendation[] {
    const recommendations: SophisticatedRecommendation[] = [];
    
    // Sharpe ratio improvement
    if (portfolio.beta && portfolio.beta > 1.5) {
      recommendations.push({
        priority: 'medium',
        type: 'risk_adjustment',
        message: 'High Portfolio Beta Detected',
        action: `Reduce portfolio beta from ${portfolio.beta.toFixed(2)} by adding lower-risk assets`,
        reasoning: [
          'Portfolio is more volatile than the market',
          'Consider adding more stable assets',
          'Risk-adjusted returns could be improved'
        ],
        confidence: 'medium'
      });
    }
    
    // CAGR optimization
    if (portfolio.cagr < 0.15) {
      recommendations.push({
        priority: 'medium',
        type: 'optimization',
        message: 'Portfolio Returns Below Target',
        action: `Current CAGR of ${(portfolio.cagr * 100).toFixed(1)}% is below 15% target`,
        reasoning: [
          'Consider higher-growth assets',
          'Review allocation strategy',
          'Market conditions may support growth positions'
        ],
        confidence: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Analyze asset performance metrics
   */
  private analyzeAssetPerformance(assetMetrics: any[]): any {
    const underperformers = assetMetrics
      .filter(asset => asset.cagr < 0.1 || asset.npv < 0)
      .map(asset => ({ symbol: asset.symbol, cagr: asset.cagr, npv: asset.npv }));
    
    const opportunities = assetMetrics
      .filter(asset => asset.cagr > 0.2 && asset.npv > 0 && asset.confidence !== 'low')
      .map(asset => ({ symbol: asset.symbol, cagr: asset.cagr, npv: asset.npv }));
    
    return { underperformers, opportunities };
  }

  /**
   * Prioritize recommendations by importance and market conditions
   */
  private prioritizeRecommendations(recommendations: SophisticatedRecommendation[]): SophisticatedRecommendation[] {
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    
    return recommendations
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 8); // Return top 8 recommendations
  }

  /**
   * Simplified portfolio risk analysis for compatibility
   */
  private analyzePortfolioRisk(assets: any[], liveCoinsData: Array<{ symbol: string; current_price: number }>): any {
    let totalValue = 0;
    let btcValue = 0;
    
    // Calculate values
    assets.forEach(asset => {
      const price = liveCoinsData.find(coin => coin.symbol === asset.symbol)?.current_price || 0;
      const value = asset.totalAmount * price;
      totalValue += value;
      
      if (asset.symbol === 'BTC') {
        btcValue += value;
      }
    });
    
    const currentBtcAllocation = totalValue > 0 ? (btcValue / totalValue) * 100 : 0;
    const recommendedBtcAllocation = totalValue <= 20000 ? 50 : totalValue <= 100000 ? 70 : 85;
    const allocationDiff = Math.abs(currentBtcAllocation - recommendedBtcAllocation);
    
    return {
      currentBtcAllocation,
      recommendedBtcAllocation,
      totalValue,
      riskLevel: allocationDiff <= 5 ? 'low' : allocationDiff <= 15 ? 'medium' : 'high',
      isCompliant: currentBtcAllocation >= recommendedBtcAllocation,
      rebalanceAmount: Math.abs((recommendedBtcAllocation / 100) * totalValue - btcValue),
      rebalanceDirection: currentBtcAllocation < recommendedBtcAllocation ? 'buy' : 'sell',
      diversificationScore: Math.max(0, 100 - (assets.length > 0 ? (100 / assets.length) : 100))
    };
  }

  /**
   * Fallback recommendations when advanced analysis fails
   */
  private getFallbackRecommendations(input: PortfolioAnalysisInput): SophisticatedRecommendation[] {
    const riskAnalysis = this.analyzePortfolioRisk(input.assets, input.liveCoinsData);
    
    return [{
      priority: 'medium',
      type: 'allocation',
      message: 'Basic Portfolio Review',
      action: 'Review your portfolio allocation based on basic risk management principles',
      reasoning: [
        'Advanced analysis temporarily unavailable',
        'Focus on fundamental portfolio balance',
        'Ensure proper risk management'
      ],
      confidence: 'low'
    }];
  }
}

export const sophisticatedRecommendationService = new SophisticatedRecommendationService();