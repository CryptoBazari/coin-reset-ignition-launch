
import { supabase } from '@/integrations/supabase/client';

export interface AnalysisInputs {
  coinSymbol: string;
  investmentAmount: number;
  holdingPeriod: number;
  riskFreeRate: number;
  marketPremium: number;
  stakingYield: number;
  transactionCosts: number;
  inflationRate: number;
}

export interface ComprehensiveAnalysisResult {
  coinId: string;
  benchmark: 'SP500' | 'BTC';
  analysis: {
    npv: number;
    irr: number;
    roi: number;
    cagr: number;
    beta: number;
    volatility: number;
    sharpeRatio: number;
    mvrv: number;
    drawdown: number;
    adjustedNpv: number; // NPV adjusted for costs, inflation, etc.
    realizedProfitLoss: number;
    liquidityScore: number;
  };
  monthlyData: {
    prices: Array<{ date: string; price: number }>;
    returns: number[];
    benchmarkReturns: number[];
    regionalReturns: {
      americas: number[];
      apac: number[];
      emea: number[];
      global: number[];
    };
  };
  detailedCalculations: {
    monthlyPricesTable: Array<{ 
      date: string; 
      coinPrice: number; 
      benchmarkPrice: number;
      coinReturn: number;
      benchmarkReturn: number;
    }>;
    cashFlows: number[];
    formulas: {
      npvFormula: string;
      irrFormula: string;
      betaFormula: string;
      cagrFormula: string;
    };
  };
  reasoning: string[];
  dataQuality: {
    endpointsWorking: string[];
    endpointsFailed: string[];
    dataFreshness: string;
    qualityScore: number;
  };
  dataSource: string;
}

class ComprehensiveGlassNodeAnalyzer {
  private readonly glassNodeEndpoints = [
    'market/price_usd_close',
    'market/price_usd_ohlc',
    'market/amer_30d_price_change',
    'market/apac_30d_price_change',
    'market/emea_30d_price_change',
    'market/realized_volatility_all',
    'indicators/net_realized_profit_loss',
    'market/mvrv_z_score',
    'market/price_drawdown_relative',
    'transactions/transfers_volume_mean'
  ];

  async analyzeInvestment(inputs: AnalysisInputs): Promise<ComprehensiveAnalysisResult> {
    console.log(`🚀 Starting comprehensive Glass Node analysis for ${inputs.coinSymbol}`);
    
    const coinId = inputs.coinSymbol.toLowerCase();
    const benchmark = this.determineBenchmark(inputs.coinSymbol);
    
    try {
      // Calculate time range (past 5 years for comprehensive analysis)
      const endTime = Date.now();
      const startTime = endTime - (5 * 365 * 24 * 60 * 60 * 1000);
      
      // Fetch all required data in parallel
      const [
        coinData,
        benchmarkData,
        dataQuality
      ] = await Promise.all([
        this.fetchComprehensiveGlassNodeData(inputs.coinSymbol, startTime, endTime),
        this.fetchBenchmarkData(benchmark, startTime, endTime),
        this.assessDataQuality(inputs.coinSymbol)
      ]);

      // Calculate comprehensive metrics
      const analysis = await this.calculateComprehensiveMetrics(
        coinData,
        benchmarkData,
        inputs
      );

      // Generate detailed calculations and reasoning
      const detailedCalculations = this.generateDetailedCalculations(
        coinData.prices,
        benchmarkData,
        inputs
      );

      const reasoning = this.generateComprehensiveReasoning(
        analysis,
        inputs.coinSymbol,
        benchmark,
        dataQuality
      );

      return {
        coinId,
        benchmark,
        analysis,
        monthlyData: {
          prices: coinData.prices,
          returns: coinData.returns,
          benchmarkReturns: coinData.benchmarkReturns,
          regionalReturns: coinData.regionalReturns
        },
        detailedCalculations,
        reasoning,
        dataQuality,
        dataSource: 'Comprehensive Glass Node + Real Market Data'
      };

    } catch (error) {
      console.error(`❌ Comprehensive analysis failed for ${inputs.coinSymbol}:`, error);
      throw error;
    }
  }

  private determineBenchmark(coinSymbol: string): 'SP500' | 'BTC' {
    return coinSymbol.toUpperCase() === 'BTC' ? 'SP500' : 'BTC';
  }

  private async fetchComprehensiveGlassNodeData(asset: string, startTime: number, endTime: number) {
    const results: any = {
      prices: [],
      returns: [],
      benchmarkReturns: [],
      regionalReturns: { americas: [], apac: [], emea: [], global: [] },
      volatility: 0,
      mvrv: 0,
      drawdown: 0,
      realizedProfitLoss: 0,
      volume: 0
    };

    // Fetch all endpoints
    const endpointPromises = this.glassNodeEndpoints.map(async (endpoint) => {
      try {
        const { data } = await supabase.functions.invoke('fetch-glassnode-data', {
          body: {
            metric: endpoint,
            asset: asset.toUpperCase(),
            since: startTime,
            until: endTime,
            resolution: '1month'
          }
        });

        return { endpoint, data: data?.data || [], success: true };
      } catch (error) {
        console.warn(`Failed to fetch ${endpoint}:`, error);
        return { endpoint, data: [], success: false };
      }
    });

    const endpointResults = await Promise.all(endpointPromises);

    // Process results
    endpointResults.forEach(({ endpoint, data, success }) => {
      if (!success || !data.length) return;

      switch (endpoint) {
        case 'market/price_usd_close':
          results.prices = data.map((point: any) => ({
            date: point.timestamp,
            price: point.value
          }));
          results.returns = this.calculateReturns(results.prices);
          break;
        
        case 'market/amer_30d_price_change':
          results.regionalReturns.americas = data.map((point: any) => point.value);
          break;
        
        case 'market/apac_30d_price_change':
          results.regionalReturns.apac = data.map((point: any) => point.value);
          break;
        
        case 'market/emea_30d_price_change':
          results.regionalReturns.emea = data.map((point: any) => point.value);
          break;
        
        case 'market/realized_volatility_all':
          results.volatility = data[data.length - 1]?.value || 0;
          break;
        
        case 'market/mvrv_z_score':
          results.mvrv = data[data.length - 1]?.value || 1.0;
          break;
        
        case 'market/price_drawdown_relative':
          results.drawdown = Math.abs(data[data.length - 1]?.value || 0.2);
          break;
        
        case 'indicators/net_realized_profit_loss':
          results.realizedProfitLoss = data[data.length - 1]?.value || 0;
          break;
        
        case 'transactions/transfers_volume_mean':
          results.volume = data[data.length - 1]?.value || 0;
          break;
      }
    });

    // Calculate global regional returns (average of all regions)
    const maxLength = Math.max(
      results.regionalReturns.americas.length,
      results.regionalReturns.apac.length,
      results.regionalReturns.emea.length
    );

    for (let i = 0; i < maxLength; i++) {
      const validReturns = [
        results.regionalReturns.americas[i],
        results.regionalReturns.apac[i],
        results.regionalReturns.emea[i]
      ].filter(val => val !== undefined && !isNaN(val));

      if (validReturns.length > 0) {
        results.regionalReturns.global[i] = validReturns.reduce((sum, val) => sum + val, 0) / validReturns.length;
      }
    }

    return results;
  }

  private async fetchBenchmarkData(benchmark: 'SP500' | 'BTC', startTime: number, endTime: number) {
    if (benchmark === 'BTC') {
      // Use Glass Node for Bitcoin data
      const { data } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          metric: 'market/price_usd_close',
          asset: 'BTC',
          since: startTime,
          until: endTime,
          resolution: '1month'
        }
      });

      return (data?.data || []).map((point: any) => ({
        date: point.timestamp,
        price: point.value
      }));
    } else {
      // Use Yahoo Finance for S&P 500 data
      const { data } = await supabase.functions.invoke('fetch-sp500-data', {
        body: {
          startDate: new Date(startTime).toISOString(),
          endDate: new Date(endTime).toISOString()
        }
      });

      return data?.data || [];
    }
  }

  private calculateReturns(prices: Array<{ date: string; price: number }>): number[] {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const currentPrice = prices[i].price;
      const previousPrice = prices[i - 1].price;
      if (previousPrice > 0) {
        returns.push(((currentPrice - previousPrice) / previousPrice) * 100);
      }
    }
    return returns;
  }

  private async calculateComprehensiveMetrics(coinData: any, benchmarkData: any, inputs: AnalysisInputs) {
    const coinPrices = coinData.prices;
    const coinReturns = coinData.returns;
    const benchmarkReturns = this.calculateReturns(benchmarkData);

    if (coinPrices.length < 2) {
      throw new Error('Insufficient price data for analysis');
    }

    const initialPrice = coinPrices[0].price;
    const finalPrice = coinPrices[coinPrices.length - 1].price;
    const years = inputs.holdingPeriod / 12;

    // Basic calculations
    const roi = ((finalPrice - initialPrice) / initialPrice) * 100;
    const cagr = (Math.pow(finalPrice / initialPrice, 1 / years) - 1) * 100;

    // Advanced volatility calculation
    const meanReturn = coinReturns.reduce((sum, ret) => sum + ret, 0) / coinReturns.length;
    const variance = coinReturns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / coinReturns.length;
    const volatility = Math.sqrt(variance * 12) * 100; // Annualized

    // Beta calculation with enhanced accuracy
    const beta = this.calculateBeta(coinReturns, benchmarkReturns);

    // Sharpe Ratio with real risk-free rate
    const excessReturn = (cagr / 100) - inputs.riskFreeRate;
    const sharpeRatio = volatility > 0 ? excessReturn / (volatility / 100) : 0;

    // Enhanced NPV calculation with all adjustments
    const adjustedDiscountRate = inputs.riskFreeRate + beta * inputs.marketPremium;
    
    // Generate cash flows with transaction costs
    const cashFlows = this.generateCashFlows(
      inputs.investmentAmount,
      finalPrice,
      initialPrice,
      inputs.holdingPeriod,
      inputs.stakingYield,
      inputs.transactionCosts
    );

    const npv = this.calculateNPV(cashFlows, adjustedDiscountRate);
    
    // Inflation-adjusted NPV
    const realDiscountRate = adjustedDiscountRate + inputs.inflationRate;
    const adjustedNpv = this.calculateNPV(cashFlows, realDiscountRate);

    // IRR calculation
    const irr = this.calculateIRR(cashFlows);

    // Liquidity score based on volume
    const liquidityScore = Math.min(100, Math.max(0, (coinData.volume / 1000000) * 10));

    return {
      npv: Math.round(npv),
      irr: Math.round(irr * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      cagr: Math.round(cagr * 100) / 100,
      beta: Math.round(beta * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      mvrv: coinData.mvrv,
      drawdown: coinData.drawdown,
      adjustedNpv: Math.round(adjustedNpv),
      realizedProfitLoss: coinData.realizedProfitLoss,
      liquidityScore: Math.round(liquidityScore)
    };
  }

  private calculateBeta(assetReturns: number[], marketReturns: number[]): number {
    if (assetReturns.length !== marketReturns.length || assetReturns.length < 2) {
      return 1.0;
    }

    const assetMean = assetReturns.reduce((sum, ret) => sum + ret, 0) / assetReturns.length;
    const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < assetReturns.length; i++) {
      covariance += (assetReturns[i] - assetMean) * (marketReturns[i] - marketMean);
      marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
    }

    return marketVariance > 0 ? covariance / marketVariance : 1.0;
  }

  private generateCashFlows(
    investmentAmount: number,
    finalPrice: number,
    initialPrice: number,
    holdingPeriod: number,
    stakingYield: number,
    transactionCosts: number
  ): number[] {
    const cashFlows = [-(investmentAmount * (1 + transactionCosts / 100))]; // Initial investment with transaction costs
    
    const coinQuantity = investmentAmount / initialPrice;
    let totalCoins = coinQuantity;
    
    // Annual staking rewards with compounding
    for (let i = 1; i < holdingPeriod; i++) {
      const stakingRewardCoins = totalCoins * (stakingYield / 100);
      totalCoins += stakingRewardCoins;
      
      const intermediatePrice = initialPrice * Math.pow(finalPrice / initialPrice, i / holdingPeriod);
      const stakingCashValue = stakingRewardCoins * intermediatePrice * (1 - transactionCosts / 100);
      cashFlows.push(stakingCashValue);
    }
    
    // Final sale with transaction costs
    const finalValue = totalCoins * finalPrice * (1 - transactionCosts / 100);
    cashFlows.push(finalValue);
    
    return cashFlows;
  }

  private calculateNPV(cashFlows: number[], discountRate: number): number {
    return cashFlows.reduce((npv, cashFlow, period) => {
      return npv + cashFlow / Math.pow(1 + discountRate, period);
    }, 0);
  }

  private calculateIRR(cashFlows: number[], maxIterations = 100, precision = 0.0001): number {
    let rate = 0.1; // Initial guess
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;
      
      for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + rate, t);
        dnpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
      }
      
      if (Math.abs(npv) < precision) {
        return rate * 100;
      }
      
      if (dnpv === 0) break;
      rate = rate - npv / dnpv;
      
      if (rate < -0.99) rate = -0.99;
    }
    
    return rate * 100;
  }

  private generateDetailedCalculations(
    coinPrices: Array<{ date: string; price: number }>,
    benchmarkData: Array<{ date: string; price: number }>,
    inputs: AnalysisInputs
  ) {
    const monthlyPricesTable = [];
    const coinReturns = this.calculateReturns(coinPrices);
    const benchmarkReturns = this.calculateReturns(benchmarkData);

    for (let i = 0; i < Math.min(coinPrices.length, benchmarkData.length); i++) {
      monthlyPricesTable.push({
        date: coinPrices[i].date.split('T')[0],
        coinPrice: Math.round(coinPrices[i].price * 100) / 100,
        benchmarkPrice: Math.round(benchmarkData[i].price * 100) / 100,
        coinReturn: i > 0 ? Math.round(coinReturns[i - 1] * 100) / 100 : 0,
        benchmarkReturn: i > 0 ? Math.round(benchmarkReturns[i - 1] * 100) / 100 : 0
      });
    }

    const cashFlows = this.generateCashFlows(
      inputs.investmentAmount,
      coinPrices[coinPrices.length - 1].price,
      coinPrices[0].price,
      inputs.holdingPeriod,
      inputs.stakingYield,
      inputs.transactionCosts
    );

    return {
      monthlyPricesTable,
      cashFlows,
      formulas: {
        npvFormula: 'NPV = Σ[CFt / (1 + r)^t] where CFt = cash flow at time t, r = discount rate',
        irrFormula: 'IRR = rate where NPV = 0, solved iteratively using Newton-Raphson method',
        betaFormula: 'β = Cov(Ra, Rm) / Var(Rm) where Ra = asset returns, Rm = market returns',
        cagrFormula: 'CAGR = (Ending Value / Beginning Value)^(1/n) - 1 where n = years'
      }
    };
  }

  private async assessDataQuality(asset: string) {
    const endpointsWorking = [];
    const endpointsFailed = [];

    for (const endpoint of this.glassNodeEndpoints) {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
          body: {
            metric: endpoint,
            asset: asset.toUpperCase(),
            since: Date.now() - (30 * 24 * 60 * 60 * 1000), // Last 30 days
            until: Date.now(),
            resolution: '1d'
          }
        });

        if (error || !data?.data?.length) {
          endpointsFailed.push(endpoint);
        } else {
          endpointsWorking.push(endpoint);
        }
      } catch (error) {
        endpointsFailed.push(endpoint);
      }
    }

    const qualityScore = (endpointsWorking.length / this.glassNodeEndpoints.length) * 100;
    const dataFreshness = new Date().toISOString().split('T')[0];

    return {
      endpointsWorking,
      endpointsFailed,
      dataFreshness,
      qualityScore: Math.round(qualityScore)
    };
  }

  private generateComprehensiveReasoning(
    analysis: any,
    coinSymbol: string,
    benchmark: string,
    dataQuality: any
  ): string[] {
    const reasoning = [
      `🔍 Comprehensive Analysis for ${coinSymbol.toUpperCase()} vs ${benchmark === 'SP500' ? 'S&P 500' : 'Bitcoin'}`,
      `📊 Data Quality: ${dataQuality.qualityScore}% (${dataQuality.endpointsWorking.length}/${dataQuality.endpointsWorking.length + dataQuality.endpointsFailed.length} endpoints working)`,
      `💰 Core Metrics: NPV: $${analysis.npv.toLocaleString()}, IRR: ${analysis.irr}%, CAGR: ${analysis.cagr}%`,
      `📈 Risk Assessment: Beta: ${analysis.beta}, Volatility: ${analysis.volatility}%, Sharpe: ${analysis.sharpeRatio}`,
      `🎯 Advanced Metrics: MVRV: ${analysis.mvrv}, Max Drawdown: ${(analysis.drawdown * 100).toFixed(1)}%`,
      `💧 Liquidity Score: ${analysis.liquidityScore}/100 (based on trading volume)`,
      `🏦 Inflation-Adjusted NPV: $${analysis.adjustedNpv.toLocaleString()} (accounts for real purchasing power)`,
      `⚡ Regional Performance: Analyzed Americas, APAC, and EMEA price movements for global perspective`
    ];

    // Add specific recommendations based on comprehensive metrics
    if (analysis.npv > 0 && analysis.sharpeRatio > 1 && analysis.liquidityScore > 50) {
      reasoning.push('✅ STRONG BUY: Positive NPV, excellent risk-adjusted returns, and high liquidity');
    } else if (analysis.adjustedNpv < 0 || analysis.volatility > 100) {
      reasoning.push('⚠️ HIGH RISK: Negative inflation-adjusted NPV or extreme volatility detected');
    } else {
      reasoning.push('📊 MODERATE: Mixed signals suggest careful position sizing and monitoring');
    }

    if (dataQuality.endpointsFailed.length > 0) {
      reasoning.push(`⚠️ Data Limitations: ${dataQuality.endpointsFailed.length} endpoints unavailable: ${dataQuality.endpointsFailed.join(', ')}`);
    }

    return reasoning;
  }
}

export const comprehensiveGlassNodeAnalyzer = new ComprehensiveGlassNodeAnalyzer();
