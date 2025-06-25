
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateNPV, 
  calculateIRR, 
  calculateCAGR, 
  calculateROI, 
  calculateRiskFactor,
  generateCashFlows 
} from '@/utils/financialCalculations';
import type { CoinData, InvestmentInputs, AnalysisResult } from '@/types/investment';

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
      const npv = calculateNPV(cashFlows, assumptions.discount_rate / 100);
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
        coinData.aviv_ratio
      );

      // Generate recommendation
      const recommendation = generateRecommendation(
        npv,
        irr,
        assumptions.hurdle_rate,
        coinData,
        inputs.investmentAmount,
        inputs.totalPortfolio,
        assumptions.target_allocation
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

const generateRecommendation = (
  npv: number,
  irr: number,
  hurdleRate: number,
  coin: CoinData,
  investmentAmount: number,
  totalPortfolio: number,
  targetAllocation: number
): any => {
  const basketAllocation = (totalPortfolio * targetAllocation / 100);
  const allocationPercentage = (investmentAmount / basketAllocation) * 100;
  
  // Determine recommendation based on NPV, IRR, and other factors
  let recommendation: 'Buy' | 'Buy Less' | 'Do Not Buy';
  let conditions = '';
  let risks = '';
  
  if (npv > 0 && irr > hurdleRate && allocationPercentage <= 5) {
    if (coin.basket === 'Bitcoin' && coin.aviv_ratio && coin.aviv_ratio < 0.55) {
      recommendation = 'Buy';
      conditions = 'Strong undervaluation signals. Good entry point.';
    } else if (coin.basket !== 'Bitcoin' && (coin.fundamentals_score || 0) > 7) {
      recommendation = 'Buy';
      conditions = 'Strong fundamentals support investment.';
    } else {
      recommendation = 'Buy Less';
      conditions = 'Neutral valuation. Consider smaller position.';
    }
  } else if (npv < 0 || irr < hurdleRate || allocationPercentage > 10) {
    recommendation = 'Do Not Buy';
    conditions = 'Poor risk-adjusted returns or overallocation risk.';
  } else {
    recommendation = 'Buy Less';
    conditions = 'Mixed signals. Proceed with caution.';
  }

  // Generate risk warnings
  const volatilityRisk = (coin.volatility || 50) > 70 ? `High volatility (${coin.volatility}%). ` : '';
  const regulatoryRisk = coin.basket === 'Small-Cap' ? 'Regulatory uncertainty. ' : '';
  risks = volatilityRisk + regulatoryRisk + 'Potential for significant drawdowns.';

  return {
    recommendation,
    worthInvesting: npv > 0,
    goodTiming: coin.aviv_ratio ? coin.aviv_ratio < 1.5 : true,
    appropriateAmount: allocationPercentage <= 5,
    riskFactor: calculateRiskFactor(coin.basket, coin.volatility || 50, coin.fundamentals_score || 5, coin.aviv_ratio),
    shouldDiversify: coin.basket !== 'Bitcoin',
    conditions,
    risks
  };
};
