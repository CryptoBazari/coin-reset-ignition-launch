
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateNPV, 
  calculateIRR, 
  calculateCAGR, 
  calculateROI, 
  calculateRiskFactor,
  analyzeBitcoinMarketState,
  generateCashFlows,
  adjustDiscountRateForFed,
  checkAllocation
} from '@/utils/financialCalculations';
import type { CoinData, InvestmentInputs, AnalysisResult, MarketConditions } from '@/types/investment';

export const useInvestmentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeInvestment = async (inputs: InvestmentInputs): Promise<AnalysisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // Fetch coin data
      const { data: coinDataRaw, error: coinError } = await supabase
        .from('coins')
        .select('*')
        .eq('coin_id', inputs.coinId)
        .single();

      if (coinError || !coinDataRaw) {
        throw new Error('Coin not found');
      }

      // Convert database record to CoinData interface
      const coinData: CoinData = {
        id: coinDataRaw.id,
        coin_id: coinDataRaw.coin_id,
        name: coinDataRaw.name,
        basket: coinDataRaw.basket as 'Bitcoin' | 'Blue Chip' | 'Small-Cap',
        current_price: coinDataRaw.current_price,
        market_cap: coinDataRaw.market_cap,
        price_history: coinDataRaw.price_history,
        cagr_36m: coinDataRaw.cagr_36m,
        fundamentals_score: coinDataRaw.fundamentals_score,
        volatility: coinDataRaw.volatility,
        aviv_ratio: coinDataRaw.aviv_ratio,
        active_supply: coinDataRaw.active_supply,
        vaulted_supply: coinDataRaw.vaulted_supply,
        cointime_inflation: coinDataRaw.cointime_inflation,
        staking_yield: coinDataRaw.staking_yield
      };

      // Fetch assumptions for the basket
      const { data: assumptions, error: assumptionsError } = await supabase
        .from('assumptions')
        .select('*')
        .eq('basket', coinData.basket)
        .single();

      if (assumptionsError || !assumptions) {
        throw new Error('Failed to fetch basket assumptions');
      }

      // Fetch benchmark data
      const benchmarkId = coinData.basket === 'Bitcoin' ? 'SP500' : 'BTC';
      const { data: benchmark, error: benchmarkError } = await supabase
        .from('benchmarks')
        .select('*')
        .eq('benchmark_id', benchmarkId)
        .single();

      if (benchmarkError || !benchmark) {
        throw new Error('Failed to fetch benchmark data');
      }

      // Fetch latest market sentiment (simulated for now)
      const marketSentiment = {
        sentiment_score: 0, // Neutral
        smart_money_activity: false
      };

      // Simulate Fed rate data (4.5% neutral rate)
      const fedRateChange = 0; // No recent change

      // Analyze Bitcoin market state using Cointime Economics
      const bitcoinState = analyzeBitcoinMarketState(
        coinData.aviv_ratio,
        coinData.active_supply,
        coinData.vaulted_supply,
        marketSentiment.smart_money_activity
      );

      // Create market conditions object
      const marketConditions: MarketConditions = {
        bitcoinState,
        sentimentScore: marketSentiment.sentiment_score,
        smartMoneyActivity: marketSentiment.smart_money_activity,
        fedRateChange,
        avivRatio: coinData.aviv_ratio,
        activeSupply: coinData.active_supply,
        vaultedSupply: coinData.vaulted_supply
      };

      // Adjust discount rate based on Fed policy
      const adjustedDiscountRate = adjustDiscountRateForFed(
        assumptions.discount_rate / 100,
        fedRateChange
      );

      // Generate expected price if not provided
      const expectedPrice = inputs.expectedPrice || 
        coinData.current_price * (1 + (coinData.cagr_36m || 20) / 100) ** (inputs.investmentHorizon || 2);

      // Generate cash flows
      const cashFlows = generateCashFlows(
        inputs.investmentAmount,
        expectedPrice,
        coinData.current_price,
        inputs.investmentHorizon || 2,
        inputs.stakingYield || coinData.staking_yield || 0
      );

      // Calculate financial metrics
      const npv = calculateNPV(cashFlows, adjustedDiscountRate);
      const irr = calculateIRR(cashFlows);
      const cagr = calculateCAGR(
        inputs.investmentAmount,
        cashFlows[cashFlows.length - 1],
        inputs.investmentHorizon || 2
      );
      const roi = calculateROI(inputs.investmentAmount, cashFlows[cashFlows.length - 1]);
      const riskFactor = calculateRiskFactor(
        coinData.basket,
        coinData.volatility || 50,
        coinData.fundamentals_score || 5,
        coinData.aviv_ratio,
        coinData.active_supply,
        coinData.vaulted_supply,
        fedRateChange,
        marketSentiment.smart_money_activity
      );

      // Check allocation
      const basketAllocation = (inputs.totalPortfolio * assumptions.target_allocation / 100);
      const allocation = checkAllocation(inputs.investmentAmount, basketAllocation, inputs.totalPortfolio);

      // Generate comprehensive recommendation
      const recommendation = generateAdvancedRecommendation(
        npv,
        irr,
        assumptions.hurdle_rate,
        coinData,
        inputs.investmentAmount,
        inputs.totalPortfolio,
        assumptions.target_allocation,
        marketConditions,
        allocation
      );

      // Store analysis result
      await supabase.from('investment_analyses').insert({
        coin_id: inputs.coinId,
        investment_amount: inputs.investmentAmount,
        total_portfolio: inputs.totalPortfolio,
        investment_horizon: inputs.investmentHorizon || 2,
        expected_price: expectedPrice,
        npv,
        irr,
        cagr,
        roi,
        risk_factor: riskFactor,
        recommendation: recommendation.recommendation,
        conditions: recommendation.conditions,
        risks: recommendation.risks
      });

      return {
        coin: coinData,
        metrics: { npv, irr, cagr, roi, riskFactor },
        recommendation,
        marketConditions,
        benchmarkComparison: {
          coinPerformance: coinData.cagr_36m || 0,
          benchmarkPerformance: benchmark.cagr_36m,
          benchmarkName: benchmark.name
        }
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyzeInvestment, loading, error };
};

const generateAdvancedRecommendation = (
  npv: number,
  irr: number,
  hurdleRate: number,
  coin: CoinData,
  investmentAmount: number,
  totalPortfolio: number,
  targetAllocation: number,
  marketConditions: MarketConditions,
  allocation: { basketPercentage: number; portfolioPercentage: number; overexposed: boolean }
): any => {
  const basketAllocation = (totalPortfolio * targetAllocation / 100);
  
  let recommendation: 'Buy' | 'Buy Less' | 'Do Not Buy' | 'Sell';
  let conditions = '';
  let risks = '';
  let marketAnalysis = '';

  // Market analysis based on Cointime Economics
  if (marketConditions.bitcoinState === 'bearish') {
    marketAnalysis = `Bitcoin is in bearish state (AVIV: ${marketConditions.avivRatio?.toFixed(2) || 'N/A'}, Active Supply: ${marketConditions.activeSupply?.toFixed(1) || 'N/A'}%). All crypto baskets carry elevated risk.`;
    
    if (marketConditions.smartMoneyActivity) {
      recommendation = 'Sell';
      conditions = 'Smart money is selling. Consider exiting positions to preserve capital.';
      risks = 'Major price correction likely. Protect against 50-70% drawdowns.';
    } else {
      recommendation = 'Do Not Buy';
      conditions = 'Wait for Bitcoin AVIV <0.55 or higher vaulted supply (>70%) before investing.';
      risks = 'High volatility expected. Market may decline further.';
    }
  } else if (marketConditions.bitcoinState === 'bullish') {
    marketAnalysis = `Bitcoin shows bullish signals (AVIV: ${marketConditions.avivRatio?.toFixed(2) || 'N/A'}, Vaulted Supply: ${marketConditions.vaultedSupply?.toFixed(1) || 'N/A'}%). Favorable environment for crypto investments.`;
    
    if (npv > 0 && irr > hurdleRate && !allocation.overexposed) {
      recommendation = 'Buy';
      conditions = 'Strong bullish Bitcoin environment supports investment thesis.';
    } else {
      recommendation = 'Buy Less';
      conditions = 'Bullish environment but consider position sizing carefully.';
    }
  } else {
    // Neutral Bitcoin market
    marketAnalysis = `Bitcoin in neutral state (AVIV: ${marketConditions.avivRatio?.toFixed(2) || 'N/A'}). Mixed signals require careful evaluation.`;
    
    if (npv > 0 && irr > hurdleRate && !allocation.overexposed) {
      if (coin.basket === 'Bitcoin' && marketConditions.avivRatio && marketConditions.avivRatio < 1.0) {
        recommendation = 'Buy';
        conditions = 'Good fundamentals with neutral Bitcoin environment.';
      } else {
        recommendation = 'Buy Less';
        conditions = 'Neutral conditions suggest cautious approach.';
      }
    } else {
      recommendation = 'Do Not Buy';
      conditions = 'Poor risk-adjusted returns or position too large for portfolio.';
    }
  }

  // Additional risk factors
  const volatilityRisk = (coin.volatility || 50) > 70 ? `High volatility (${coin.volatility}%). ` : '';
  const regulatoryRisk = 'Regulatory uncertainty remains. ';
  const fedRisk = marketConditions.fedRateChange > 0 ? 'Fed rate hikes increase crypto risk. ' : 
                  marketConditions.fedRateChange < 0 ? 'Fed rate cuts support crypto. ' : '';
  
  risks = volatilityRisk + regulatoryRisk + fedRisk + risks;

  // Rebalancing suggestions
  const rebalancingActions: string[] = [];
  if (allocation.overexposed) {
    rebalancingActions.push(`Reduce position size - currently ${allocation.basketPercentage.toFixed(1)}% of basket allocation`);
  }
  
  if (marketConditions.bitcoinState === 'bearish') {
    rebalancingActions.push('Consider selling 10-20% of crypto holdings');
    rebalancingActions.push('Increase stablecoin allocation until Bitcoin AVIV <1.0');
  }

  return {
    recommendation,
    worthInvesting: npv > 0 && marketConditions.bitcoinState !== 'bearish',
    goodTiming: marketConditions.bitcoinState === 'bullish' || (marketConditions.bitcoinState === 'neutral' && marketConditions.sentimentScore < 0),
    appropriateAmount: !allocation.overexposed,
    riskFactor: calculateRiskFactor(
      coin.basket,
      coin.volatility || 50,
      coin.fundamentals_score || 5,
      marketConditions.avivRatio,
      marketConditions.activeSupply,
      marketConditions.vaultedSupply,
      marketConditions.fedRateChange,
      marketConditions.smartMoneyActivity
    ),
    shouldDiversify: coin.basket !== 'Bitcoin',
    conditions,
    risks,
    rebalancingActions,
    marketAnalysis
  };
};
