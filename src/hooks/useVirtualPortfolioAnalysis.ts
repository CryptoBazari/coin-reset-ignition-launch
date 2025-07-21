
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedGlassNodeAnalysis } from './useEnhancedGlassNodeAnalysis';
import { riskManagementService } from '@/services/riskManagementService';
import { fetchCoinPrices } from '@/services/coinMarketCapService';
import { VirtualAsset } from '@/types/virtualPortfolio';
import type { InvestmentInputs, AnalysisResult } from '@/types/investment';

export interface VirtualPortfolioAnalysisResult {
  totalValue: number;
  totalProfit: number;
  overallNPV: number;
  overallIRR: number;
  portfolioCAGR: number;
  portfolioRisk: number;
  basketAllocations: {
    Bitcoin: number;
    'Blue Chip': number;
    'Small-Cap': number;
  };
  riskAnalysis: {
    currentBtcAllocation: number;
    recommendedBtcAllocation: number;
    isCompliant: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    rebalanceRecommendations: string[];
  };
  assetAnalyses: Array<{
    asset: VirtualAsset;
    analysis: AnalysisResult;
    currentValue: number;
    profitLoss: number;
  }>;
  marketTiming: {
    bitcoinAvivRatio: number;
    recommendation: string;
    confidence: number;
  };
}

export const useVirtualPortfolioAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { analyzeInvestmentWithGlassNode } = useEnhancedGlassNodeAnalysis();

  const analyzeVirtualPortfolio = async (portfolioId: string): Promise<VirtualPortfolioAnalysisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting virtual portfolio analysis for:', portfolioId);

      // Fetch portfolio assets
      const { data: assets, error: assetsError } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins!inner(id, symbol, name)
        `)
        .eq('portfolio_id', portfolioId)
        .gt('total_amount', 0);

      if (assetsError) throw assetsError;

      if (!assets || assets.length === 0) {
        throw new Error('No assets found in portfolio');
      }

      console.log(`📊 Found ${assets.length} assets in portfolio`);

      // Get live market prices
      const symbols = assets.map(asset => asset.virtual_coins.symbol);
      const liveCoinsData = await fetchCoinPrices(symbols);

      // Calculate current values and P&L
      let totalValue = 0;
      let totalProfit = 0;
      const basketAllocations = { Bitcoin: 0, 'Blue Chip': 0, 'Small-Cap': 0 };
      const assetAnalyses = [];

      for (const asset of assets) {
        const liveCoinData = liveCoinsData.find(coin => coin.symbol === asset.virtual_coins.symbol);
        const currentPrice = liveCoinData?.current_price || asset.average_price;
        const currentValue = asset.total_amount * currentPrice;
        const profitLoss = asset.realized_profit + (currentValue - asset.cost_basis);

        totalValue += currentValue;
        totalProfit += profitLoss;

        // Calculate basket allocation
        const basket = getBasketForSymbol(asset.virtual_coins.symbol);
        basketAllocations[basket] += currentValue;

        // Run enhanced analysis for each asset
        const analysisInput: InvestmentInputs = {
          coinId: asset.virtual_coins.symbol.toLowerCase(),
          investmentAmount: currentValue,
          totalPortfolio: 100000, // Will be updated with actual total
          investmentHorizon: 2
        };

        const analysis = await analyzeInvestmentWithGlassNode(analysisInput);
        
        assetAnalyses.push({
          asset,
          analysis,
          currentValue,
          profitLoss
        });
      }

      // Convert to percentages
      Object.keys(basketAllocations).forEach(key => {
        basketAllocations[key as keyof typeof basketAllocations] = 
          (basketAllocations[key as keyof typeof basketAllocations] / totalValue) * 100;
      });

      // Calculate portfolio-level metrics
      const weightedNPV = assetAnalyses.reduce((sum, item) => {
        const weight = item.currentValue / totalValue;
        return sum + (item.analysis?.metrics?.npv || 0) * weight;
      }, 0);

      const weightedIRR = assetAnalyses.reduce((sum, item) => {
        const weight = item.currentValue / totalValue;
        return sum + (item.analysis?.metrics?.irr || 0) * weight;
      }, 0);

      const weightedCAGR = assetAnalyses.reduce((sum, item) => {
        const weight = item.currentValue / totalValue;
        return sum + (item.analysis?.metrics?.cagr || 0) * weight;
      }, 0);

      const portfolioRisk = assetAnalyses.reduce((sum, item) => {
        const weight = item.currentValue / totalValue;
        return sum + (item.analysis?.metrics?.riskFactor || 5) * weight;
      }, 0);

      // Get risk analysis
      const riskAnalysis = riskManagementService.analyzeRisk(assets, liveCoinsData);
      const rebalanceRecommendations = await getRebalanceRecommendations(riskAnalysis);

      // Get Bitcoin market timing from first analysis (all use Bitcoin AVIV)
      const bitcoinAvivRatio = assetAnalyses[0]?.analysis?.metrics?.bitcoinAvivRatio || 1.0;
      const marketTiming = analyzeMarketTiming(bitcoinAvivRatio);

      const result: VirtualPortfolioAnalysisResult = {
        totalValue,
        totalProfit,
        overallNPV: weightedNPV,
        overallIRR: weightedIRR,
        portfolioCAGR: weightedCAGR,
        portfolioRisk,
        basketAllocations,
        riskAnalysis: {
          currentBtcAllocation: riskAnalysis.currentBtcAllocation,
          recommendedBtcAllocation: riskAnalysis.recommendedBtcAllocation,
          isCompliant: riskAnalysis.isCompliant,
          riskLevel: riskAnalysis.riskLevel,
          rebalanceRecommendations
        },
        assetAnalyses,
        marketTiming
      };

      console.log('✅ Virtual portfolio analysis completed successfully');
      return result;

    } catch (err) {
      console.error('❌ Virtual portfolio analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeVirtualPortfolio,
    loading,
    error
  };
};

// Helper functions
function getBasketForSymbol(symbol: string): 'Bitcoin' | 'Blue Chip' | 'Small-Cap' {
  if (symbol === 'BTC') return 'Bitcoin';
  if (['ETH'].includes(symbol)) return 'Blue Chip';
  return 'Small-Cap';
}

function analyzeMarketTiming(avivRatio: number): {
  recommendation: string;
  confidence: number;
} {
  if (avivRatio < 0.8) {
    return {
      recommendation: 'Strong Buy - Bitcoin appears undervalued based on AVIV ratio',
      confidence: 85
    };
  } else if (avivRatio < 1.2) {
    return {
      recommendation: 'Buy - Bitcoin is fairly valued with upside potential',
      confidence: 70
    };
  } else if (avivRatio < 2.0) {
    return {
      recommendation: 'Hold - Bitcoin is approaching overvalued territory',
      confidence: 60
    };
  } else {
    return {
      recommendation: 'Caution - Bitcoin may be overextended, consider taking profits',
      confidence: 80
    };
  }
}

async function getRebalanceRecommendations(riskAnalysis: any): Promise<string[]> {
  const recommendations = [];
  
  if (!riskAnalysis.isCompliant) {
    if (riskAnalysis.currentBtcAllocation < riskAnalysis.recommendedBtcAllocation) {
      recommendations.push(`Increase Bitcoin allocation to ${riskAnalysis.recommendedBtcAllocation}%`);
    } else {
      recommendations.push(`Reduce Bitcoin allocation to ${riskAnalysis.recommendedBtcAllocation}%`);
    }
  }
  
  if (riskAnalysis.riskLevel === 'high') {
    recommendations.push('Consider rebalancing to reduce overall portfolio risk');
  }
  
  return recommendations;
}
