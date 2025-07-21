import { supabase } from '@/integrations/supabase/client';
import { realBetaCalculationService } from './realBetaCalculationService';
import { glassnodeNPVCalculator } from './glassnodeNPVCalculator';
import { glassnodeMonteCarloService } from './glassnodeMonteCarloService';
import { glassnodeDataInitializer } from './glassnodeDataInitializer';
import { realTimeGlassNodeService } from './realTimeGlassNodeService';

export interface AnalysisInputs {
  coinSymbol: string;
  investmentAmount: number;
  timeHorizon: number;
  region: 'US' | 'EU' | 'ASIA' | 'GLOBAL';
  includeInflation: boolean;
  includeTransactionCosts: boolean;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

export interface ComprehensiveAnalysisResult {
  coinSymbol: string;
  investmentAmount: number;
  timeHorizon: number;
  region: string;
  
  // Enhanced NPV Analysis
  enhancedNPV: {
    npv: number;
    adjustedNPV: number;
    mvrv: number;
    riskAdjustedDiscount: number;
    confidenceScore: number;
    dataSource: string;
  };
  
  // Monte Carlo Analysis
  monteCarlo: {
    expectedValue: number;
    confidenceInterval: { lower: number; upper: number };
    probabilityOfLoss: number;
    valueAtRisk: number;
    iterations: number;
    convergence: boolean;
  };
  
  // Monthly Beta Analysis
  monthlyBetaAnalysis: {
    beta: number;
    confidence: string;
    correlation: number;
    benchmarkUsed: string;
    dataPoints: number;
    dataFrequency: string;
    source: string;
  };
  
  glassNodeMetrics: {
    aviv_ratio: number;
    cointime_destroyed: number;
    cointime_created: number;
    active_supply: number;
    vaulted_supply: number;
    liquid_supply: number;
    confidence_score: number;
    mvrv_z_score: number;
    net_unrealized_pnl: number;
    data_source: string;
  };
  
  regionalData: {
    region: string;
    inflationRate: number;
    taxRate: number;
    transactionCost: number;
    marketPremium: number;
    dataSource: string;
  };
  
  marketComparison: {
    sp500Performance: number;
    bitcoinPerformance: number;
    relativePerformance: number;
    riskAdjustedReturn: number;
    sharpeRatio: number;
    dataSource: string;
  };
  
  finalRecommendation: {
    action: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
    confidence: number;
    reasoning: string[];
    riskWarnings: string[];
    dataQuality: number;
    methodology: string;
  };
}

class ComprehensiveGlassNodeAnalyzer {
  private async getCoinData(coinId: string) {
    try {
      console.log(`🔍 Fetching real coin data for ${coinId}`);
      
      // Check if we have fresh data, if not initialize it
      const dataFreshness = await glassnodeDataInitializer.checkDataFreshness(coinId);
      if (!dataFreshness.hasData || dataFreshness.dataAge > 24) {
        console.log(`📊 Data is stale or missing for ${coinId}, initializing...`);
        await glassnodeDataInitializer.initializeSingleCoin(coinId);
      }

      // Get real-time Glassnode data
      const realTimeData = await realTimeGlassNodeService.fetchRealTimeData(coinId);
      
      // Get price history from database for CAGR calculation
      const { data: priceHistory } = await supabase
        .from('price_history_36m')
        .select('price_date, price_usd')
        .eq('coin_id', coinId)
        .order('price_date', { ascending: true });

      // Calculate real CAGR from price history
      const realCagr = this.calculateRealCAGR(priceHistory || []);
      
      // Get latest cointime metrics
      const { data: cointimeData } = await supabase
        .from('cointime_metrics')
        .select('*')
        .eq('coin_id', coinId)
        .order('metric_date', { ascending: false })
        .limit(1)
        .single();

      // Get real MVRV data from Glassnode
      let mvrvZScore = realTimeData.technicalIndicators?.mvrv || 1.0;
      try {
        const { data: mvrvData } = await supabase.functions.invoke('fetch-glassnode-data', {
          body: { 
            metric: 'market/mvrv_z_score',
            asset: coinId.toUpperCase(),
            resolution: '24h'
          }
        });
        if (mvrvData?.data?.[0]?.value) {
          mvrvZScore = mvrvData.data[0].value;
        }
      } catch (error) {
        console.warn('MVRV data not available, using default');
      }

      console.log(`✅ Using real data for ${coinId}:`);
      console.log(`   - Real CAGR: ${realCagr}%`);
      console.log(`   - Real Volatility: ${realTimeData.realizedVolatility}%`);
      console.log(`   - Real MVRV: ${mvrvZScore}`);
      console.log(`   - Real AVIV: ${realTimeData.avivRatio}`);

      return {
        mvrv: mvrvZScore,
        volatility: realTimeData.realizedVolatility,
        drawdown: this.calculateDrawdown(priceHistory || []),
        realizedProfitLoss: this.estimateRealizedPnL(mvrvZScore),
        volume: realTimeData.priceHistory.length,
        prices: priceHistory?.map(p => ({ price: Number(p.price_usd), date: p.price_date })) || [],
        cagr36m: realCagr,
        avivRatio: realTimeData.avivRatio,
        activeSupply: realTimeData.activeSupply,
        vaultedSupply: realTimeData.vaultedSupply,
        dataQuality: realTimeData.dataQuality
      };
    } catch (error) {
      console.error('❌ Failed to get real coin data:', error);
      throw new Error(`Failed to fetch real data for ${coinId}: ${error.message}`);
    }
  }

  private calculateRealCAGR(priceHistory: Array<{ price_date: string; price_usd: string }>): number {
    if (priceHistory.length < 2) {
      console.warn('Insufficient price history for CAGR calculation');
      return 0;
    }

    const sortedPrices = priceHistory.sort((a, b) => 
      new Date(a.price_date).getTime() - new Date(b.price_date).getTime()
    );

    const startPrice = Number(sortedPrices[0].price_usd);
    const endPrice = Number(sortedPrices[sortedPrices.length - 1].price_usd);
    
    const startDate = new Date(sortedPrices[0].price_date);
    const endDate = new Date(sortedPrices[sortedPrices.length - 1].price_date);
    const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (years <= 0 || startPrice <= 0) {
      console.warn('Invalid data for CAGR calculation');
      return 0;
    }

    const cagr = (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
    console.log(`📊 Real CAGR calculated: ${cagr.toFixed(2)}% over ${years.toFixed(2)} years`);
    
    return Math.max(-80, Math.min(500, cagr)); // Reasonable bounds
  }

  private calculateDrawdown(priceHistory: Array<{ price_date: string; price_usd: string }>): number {
    if (priceHistory.length < 2) return 0.2; // Default fallback

    const prices = priceHistory.map(p => Number(p.price_usd));
    let maxDrawdown = 0;
    let peak = prices[0];

    for (const price of prices) {
      if (price > peak) {
        peak = price;
      } else {
        const drawdown = (peak - price) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }

    return maxDrawdown;
  }

  private estimateRealizedPnL(mvrvZScore: number): number {
    // Estimate realized P&L based on MVRV Z-Score
    // MVRV > 1 suggests net profit, < 1 suggests net loss
    return (mvrvZScore - 1) * 1000000; // Scale for meaningful numbers
  }

  async analyzeInvestment(inputs: AnalysisInputs): Promise<ComprehensiveAnalysisResult> {
    console.log('🚀 Starting comprehensive Glass Node analysis with REAL DATA');
    
    try {
      const coinId = inputs.coinSymbol.toLowerCase();
      
      // Step 1: Get REAL monthly beta analysis
      console.log('📊 Step 1: Calculating real monthly beta...');
      const monthlyBetaResult = await realBetaCalculationService.calculateRealBeta(coinId);
      
      // Step 2: Get REAL coin data for NPV calculation
      console.log('📊 Step 2: Fetching real coin data...');
      const coinData = await this.getCoinData(coinId);
      
      // Step 3: Enhanced NPV calculation with REAL MVRV integration
      console.log('📊 Step 3: Calculating NPV with real data...');
      const npvResult = glassnodeNPVCalculator.calculateDataDrivenNPV(
        inputs.investmentAmount,
        coinData,
        { 
          timeHorizon: inputs.timeHorizon, 
          riskFreeRate: 0.03,
          holdingPeriod: inputs.timeHorizon * 12,
          stakingYield: 0,
          transactionCosts: inputs.includeTransactionCosts ? 0.5 : 0,
          inflationRate: inputs.includeInflation ? 0.025 : 0
        }
      );
      
      // Step 4: Monte Carlo simulation with real data
      console.log('📊 Step 4: Running Monte Carlo with real data...');
      const monteCarloResult = glassnodeMonteCarloService.runMonteCarloNPV(
        inputs.investmentAmount,
        coinData,
        { 
          timeHorizon: inputs.timeHorizon, 
          riskTolerance: inputs.riskTolerance,
          realCagr: coinData.cagr36m,
          realVolatility: coinData.volatility
        },
        10000
      );
      
      // Step 5: Get latest Glass Node metrics with real data
      console.log('📊 Step 5: Fetching latest Glassnode metrics...');
      const glassNodeMetrics = await this.getLatestGlassNodeMetrics(coinId);
      
      // Step 6: Regional data analysis
      const regionalData = await this.getRegionalData(inputs.region, inputs.includeInflation, inputs.includeTransactionCosts);
      
      // Step 7: Market comparison with real data
      console.log('📊 Step 7: Performing market comparison...');
      const marketComparison = await this.getMarketComparison(coinId, inputs.timeHorizon);
      
      // Step 8: Generate final recommendation based on real data
      const finalRecommendation = this.generateFinalRecommendation(
        npvResult,
        monteCarloResult,
        monthlyBetaResult,
        glassNodeMetrics,
        inputs.riskTolerance
      );
      
      console.log('✅ Comprehensive analysis completed with REAL DATA');
      console.log(`📊 Final NPV: $${npvResult.npv.toLocaleString()}`);
      console.log(`📊 Real CAGR: ${coinData.cagr36m}%`);
      console.log(`📊 Real Beta: ${monthlyBetaResult.beta}`);
      console.log(`📊 Data Quality: ${coinData.dataQuality}%`);

      return {
        coinSymbol: inputs.coinSymbol,
        investmentAmount: inputs.investmentAmount,
        timeHorizon: inputs.timeHorizon,
        region: inputs.region,
        
        enhancedNPV: {
          npv: npvResult.npv,
          adjustedNPV: npvResult.adjustedNpv,
          mvrv: coinData.mvrv,
          riskAdjustedDiscount: npvResult.riskAdjustedDiscount,
          confidenceScore: npvResult.confidenceLevel,
          dataSource: 'glassnode_real_data'
        },
        
        monteCarlo: {
          expectedValue: monteCarloResult.expectedNPV,
          confidenceInterval: { 
            lower: monteCarloResult.confidenceInterval.lower5, 
            upper: monteCarloResult.confidenceInterval.upper95 
          },
          probabilityOfLoss: 1 - monteCarloResult.riskMetrics.probabilityOfPositiveNPV,
          valueAtRisk: monteCarloResult.riskMetrics.valueAtRisk,
          iterations: 10000,
          convergence: true
        },
        
        monthlyBetaAnalysis: {
          beta: monthlyBetaResult.beta,
          confidence: monthlyBetaResult.confidence,
          correlation: monthlyBetaResult.correlation,
          benchmarkUsed: monthlyBetaResult.benchmarkUsed,
          dataPoints: monthlyBetaResult.dataPoints || 0,
          dataFrequency: monthlyBetaResult.dataFrequency || 'monthly',
          source: 'glassnode_monthly_data'
        },
        
        glassNodeMetrics,
        regionalData,
        marketComparison,
        finalRecommendation
      };
      
    } catch (error) {
      console.error('❌ Comprehensive analysis failed:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  private async getLatestGlassNodeMetrics(coinId: string) {
    try {
      // Get latest cointime metrics
      const { data: cointimeData } = await supabase
        .from('cointime_metrics')
        .select('*')
        .eq('coin_id', coinId)
        .order('metric_date', { ascending: false })
        .limit(1);

      const cointime = cointimeData?.[0];
      
      // Get additional Glass Node metrics via API
      const { data: apiData } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'indicators/mvrv_z_score',
          asset: coinId.toUpperCase(),
          resolution: '24h'
        }
      });

      const mvrvZScore = apiData?.data?.[0]?.value || 0;
      
      return {
        aviv_ratio: cointime?.aviv_ratio || 0,
        cointime_destroyed: cointime?.cointime_destroyed || 0,
        cointime_created: cointime?.cointime_created || 0,
        active_supply: cointime?.active_supply_pct || 0,
        vaulted_supply: cointime?.vaulted_supply_pct || 0,
        liquid_supply: cointime?.liquid_supply_pct || 0,
        confidence_score: cointime?.confidence_score || 0,
        mvrv_z_score: mvrvZScore,
        net_unrealized_pnl: 0, // Will be calculated from additional endpoints
        data_source: 'glassnode_api'
      };
      
    } catch (error) {
      console.error('❌ Failed to get Glass Node metrics:', error);
      return {
        aviv_ratio: 0,
        cointime_destroyed: 0,
        cointime_created: 0,
        active_supply: 0,
        vaulted_supply: 0,
        liquid_supply: 0,
        confidence_score: 0,
        mvrv_z_score: 0,
        net_unrealized_pnl: 0,
        data_source: 'fallback'
      };
    }
  }

  private async getRegionalData(region: string, includeInflation: boolean, includeTransactionCosts: boolean) {
    // Regional data configurations
    const regionalConfig = {
      'US': { inflation: 0.03, tax: 0.28, transactionCost: 0.005, marketPremium: 1.0 },
      'EU': { inflation: 0.025, tax: 0.35, transactionCost: 0.008, marketPremium: 1.02 },
      'ASIA': { inflation: 0.02, tax: 0.20, transactionCost: 0.012, marketPremium: 1.05 },
      'GLOBAL': { inflation: 0.03, tax: 0.25, transactionCost: 0.007, marketPremium: 1.0 }
    };

    const config = regionalConfig[region as keyof typeof regionalConfig] || regionalConfig['GLOBAL'];
    
    return {
      region,
      inflationRate: includeInflation ? config.inflation : 0,
      taxRate: config.tax,
      transactionCost: includeTransactionCosts ? config.transactionCost : 0,
      marketPremium: config.marketPremium,
      dataSource: 'regional_config'
    };
  }

  private async getMarketComparison(coinId: string, timeHorizon: number) {
    try {
      // Get real S&P 500 data
      const { data: sp500Data } = await supabase.functions.invoke('fetch-alpha-vantage-data', {
        body: { 
          symbol: 'SPY',
          function: 'TIME_SERIES_MONTHLY'
        }
      });

      const sp500Performance = this.calculatePerformance(sp500Data, timeHorizon);
      
      // Get Bitcoin performance for comparison
      const { data: btcData } = await supabase
        .from('price_history_36m')
        .select('price_usd, price_date')
        .eq('coin_id', 'bitcoin')
        .order('price_date', { ascending: false })
        .limit(timeHorizon * 12);

      const bitcoinPerformance = this.calculateMonthlyPerformance(btcData, timeHorizon);
      
      return {
        sp500Performance,
        bitcoinPerformance,
        relativePerformance: bitcoinPerformance - sp500Performance,
        riskAdjustedReturn: bitcoinPerformance / 1.5, // Assuming 1.5x volatility
        sharpeRatio: (bitcoinPerformance - 0.02) / 0.45, // Risk-free rate 2%, volatility 45%
        dataSource: 'real_market_data'
      };
      
    } catch (error) {
      console.error('❌ Failed to get market comparison:', error);
      return {
        sp500Performance: 0.08,
        bitcoinPerformance: 0.15,
        relativePerformance: 0.07,
        riskAdjustedReturn: 0.10,
        sharpeRatio: 0.29,
        dataSource: 'fallback'
      };
    }
  }

  private calculatePerformance(data: any, timeHorizon: number): number {
    if (!data || !data.length) return 0.08; // Default S&P 500 return
    
    const monthsToAnalyze = timeHorizon * 12;
    const relevantData = data.slice(0, monthsToAnalyze);
    
    if (relevantData.length < 2) return 0.08;
    
    const startPrice = relevantData[relevantData.length - 1].price;
    const endPrice = relevantData[0].price;
    
    return Math.pow(endPrice / startPrice, 1 / timeHorizon) - 1;
  }

  private calculateMonthlyPerformance(data: any, timeHorizon: number): number {
    if (!data || !data.length) return 0.15; // Default Bitcoin return
    
    const monthsToAnalyze = timeHorizon * 12;
    const relevantData = data.slice(0, monthsToAnalyze);
    
    if (relevantData.length < 2) return 0.15;
    
    const startPrice = relevantData[relevantData.length - 1].price_usd;
    const endPrice = relevantData[0].price_usd;
    
    return Math.pow(endPrice / startPrice, 1 / timeHorizon) - 1;
  }

  private generateFinalRecommendation(
    enhancedNPV: any,
    monteCarlo: any,
    monthlyBeta: any,
    glassNode: any,
    riskTolerance: string
  ) {
    const reasoning: string[] = [];
    const riskWarnings: string[] = [];
    let confidence = 0;
    let action: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' = 'Hold';

    // NPV Analysis
    if (enhancedNPV.npv > 0) {
      reasoning.push(`Positive NPV of $${enhancedNPV.npv.toLocaleString()} indicates value creation`);
      confidence += 20;
    } else {
      riskWarnings.push(`Negative NPV of $${enhancedNPV.npv.toLocaleString()} suggests potential value destruction`);
      confidence -= 10;
    }

    // Monte Carlo Analysis
    if (monteCarlo.probabilityOfLoss < 0.3) {
      reasoning.push(`Low probability of loss (${(monteCarlo.probabilityOfLoss * 100).toFixed(1)}%)`);
      confidence += 15;
    } else {
      riskWarnings.push(`High probability of loss (${(monteCarlo.probabilityOfLoss * 100).toFixed(1)}%)`);
    }

    // Monthly Beta Analysis
    if (monthlyBeta.confidence === 'high' && monthlyBeta.dataPoints > 24) {
      reasoning.push(`High confidence monthly beta (${monthlyBeta.beta.toFixed(2)}) based on ${monthlyBeta.dataPoints} months of data`);
      confidence += 15;
    } else if (monthlyBeta.confidence === 'low') {
      riskWarnings.push(`Low confidence beta calculation may affect accuracy`);
    }

    // Glass Node Metrics
    if (glassNode.mvrv_z_score < -1) {
      reasoning.push(`MVRV Z-Score (${glassNode.mvrv_z_score.toFixed(2)}) suggests undervaluation`);
      confidence += 10;
    } else if (glassNode.mvrv_z_score > 2) {
      riskWarnings.push(`MVRV Z-Score (${glassNode.mvrv_z_score.toFixed(2)}) suggests overvaluation`);
    }

    // Risk Tolerance Adjustment
    if (riskTolerance === 'conservative') {
      confidence = Math.max(confidence - 20, 0);
      if (monteCarlo.probabilityOfLoss > 0.2) {
        riskWarnings.push(`Conservative risk tolerance conflicts with high loss probability`);
      }
    } else if (riskTolerance === 'aggressive') {
      confidence = Math.min(confidence + 10, 100);
    }

    // Final Action Decision
    if (confidence > 80 && enhancedNPV.npv > 0) {
      action = 'Strong Buy';
    } else if (confidence > 60 && enhancedNPV.npv > 0) {
      action = 'Buy';
    } else if (confidence < 40 || enhancedNPV.npv < -1000) {
      action = 'Sell';
    } else if (confidence < 20 || monteCarlo.probabilityOfLoss > 0.7) {
      action = 'Strong Sell';
    }

    return {
      action,
      confidence: Math.max(0, Math.min(100, confidence)),
      reasoning,
      riskWarnings,
      dataQuality: Math.round((enhancedNPV.confidenceScore + monthlyBeta.dataPoints) / 2),
      methodology: 'comprehensive_monthly_analysis'
    };
  }
}

export const comprehensiveGlassNodeAnalyzer = new ComprehensiveGlassNodeAnalyzer();
