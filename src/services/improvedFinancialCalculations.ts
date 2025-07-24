
import { enhancedHistoricalDataService, MonthlyPriceData } from './enhancedHistoricalDataService';
import { comprehensiveBetaCalculationService } from './comprehensiveBetaCalculationService';

export interface ImprovedFinancialMetrics {
  npv: number;
  irr: number;
  cagr: number;
  roi: number;
  volatility: number;
  beta: number;
  sharpeRatio: number;
  confidenceScore: number;
  dataSource: string;
  monthsOfData: number;
}

export interface NPVCalculationDetails {
  investmentAmount: number;
  timeHorizon: number;
  discountRate: number;
  projectedCashFlows: number[];
  terminalValue: number;
  presentValues: number[];
}

class ImprovedFinancialCalculations {
  
  async calculateImprovedMetrics(
    coinId: string,
    symbol: string,
    investmentAmount: number,
    timeHorizon: number
  ): Promise<ImprovedFinancialMetrics> {
    console.log(`💰 Calculating improved financial metrics for ${symbol}`);
    
    // Get real historical data
    const historicalResult = await enhancedHistoricalDataService.getHistoricalData(coinId, symbol);
    
    if (!historicalResult.success || historicalResult.data.length < 12) {
      console.warn(`⚠️ Insufficient historical data for ${symbol}, using fallback`);
      return this.calculateFallbackMetrics(investmentAmount, timeHorizon);
    }

    const data = historicalResult.data;
    console.log(`✅ Using ${data.length} months of real price data for ${symbol}`);
    
    // Calculate real metrics from historical data
    const cagr = enhancedHistoricalDataService.calculateRealCAGR(data);
    const volatility = enhancedHistoricalDataService.calculateRealVolatility(data);
    const monthlyReturns = enhancedHistoricalDataService.calculateMonthlyReturns(data);
    
    console.log(`📊 Real metrics calculated: CAGR=${cagr.toFixed(2)}%, Volatility=${volatility.toFixed(2)}%`);
    
    // Calculate NPV using real data and proper methodology
    const npvDetails = this.calculateImprovedNPV(
      investmentAmount,
      timeHorizon,
      cagr,
      volatility,
      data
    );
    
    // Calculate IRR using real cash flow projections
    const irr = this.calculateRealIRR(investmentAmount, npvDetails.projectedCashFlows, timeHorizon);
    
    // Calculate ROI from actual expected returns
    const roi = this.calculateRealROI(cagr, timeHorizon);
    
    // Calculate Beta using comprehensive CAPM methodology
    const beta = await this.calculateComprehensiveBeta(symbol);
    
    // Calculate Sharpe ratio with real risk-free rate
    const sharpeRatio = this.calculateSharpeRatio(cagr, volatility);
    
    const confidenceScore = this.calculateConfidenceScore(
      data.length,
      historicalResult.dataQuality,
      historicalResult.source
    );

    console.log(`✅ Improved metrics completed for ${symbol}:`);
    console.log(`   NPV: $${npvDetails.npv.toLocaleString()}`);
    console.log(`   IRR: ${irr.toFixed(2)}%`);
    console.log(`   CAGR: ${cagr.toFixed(2)}%`);
    console.log(`   Volatility: ${volatility.toFixed(2)}%`);
    console.log(`   Confidence: ${confidenceScore}%`);

    return {
      npv: npvDetails.npv,
      irr,
      cagr,
      roi,
      volatility,
      beta,
      sharpeRatio,
      confidenceScore,
      dataSource: historicalResult.source,
      monthsOfData: data.length
    };
  }

  private calculateImprovedNPV(
    investmentAmount: number,
    timeHorizon: number,
    cagr: number,
    volatility: number,
    historicalData: MonthlyPriceData[]
  ): NPVCalculationDetails & { npv: number } {
    
    // Risk-adjusted discount rate based on volatility
    const riskFreeRate = 0.05; // 5% risk-free rate
    const riskPremium = (volatility / 100) * 0.5; // Risk premium based on volatility
    const discountRate = riskFreeRate + riskPremium;
    
    console.log(`💡 Using risk-adjusted discount rate: ${(discountRate * 100).toFixed(2)}%`);
    
    const currentPrice = historicalData[historicalData.length - 1].price;
    const coinQuantity = investmentAmount / currentPrice;
    
    // Project monthly cash flows using Monte Carlo approach
    const projectedCashFlows: number[] = [];
    const monthlyGrowthRate = (cagr / 100) / 12;
    const monthlyVolatility = (volatility / 100) / Math.sqrt(12);
    
    for (let month = 1; month <= timeHorizon; month++) {
      // Use geometric Brownian motion for more realistic projections
      const randomFactor = this.generateRandomReturn(monthlyVolatility);
      const expectedPrice = currentPrice * Math.pow(1 + monthlyGrowthRate + randomFactor, month);
      const cashFlow = coinQuantity * expectedPrice;
      projectedCashFlows.push(cashFlow);
    }
    
    // Calculate terminal value using Gordon Growth Model
    const terminalGrowthRate = Math.min(0.03, cagr / 100 * 0.5); // Conservative long-term growth
    const finalCashFlow = projectedCashFlows[projectedCashFlows.length - 1];
    const terminalValue = finalCashFlow * (1 + terminalGrowthRate) / (discountRate - terminalGrowthRate);
    
    // Calculate present values
    const presentValues: number[] = [];
    let npv = -investmentAmount; // Initial investment
    
    for (let i = 0; i < projectedCashFlows.length; i++) {
      const presentValue = projectedCashFlows[i] / Math.pow(1 + discountRate / 12, i + 1);
      presentValues.push(presentValue);
      npv += presentValue;
    }
    
    // Add terminal value present value
    const terminalPV = terminalValue / Math.pow(1 + discountRate / 12, timeHorizon);
    npv += terminalPV;
    
    return {
      npv,
      investmentAmount,
      timeHorizon,
      discountRate,
      projectedCashFlows,
      terminalValue,
      presentValues
    };
  }

  private calculateRealIRR(
    investmentAmount: number,
    projectedCashFlows: number[],
    timeHorizon: number
  ): number {
    // Use Newton-Raphson method to find IRR
    let irr = 0.1; // Initial guess: 10%
    let iteration = 0;
    const maxIterations = 100;
    const tolerance = 0.0001;
    
    while (iteration < maxIterations) {
      let npv = -investmentAmount;
      let derivative = 0;
      
      for (let i = 0; i < projectedCashFlows.length; i++) {
        const period = i + 1;
        npv += projectedCashFlows[i] / Math.pow(1 + irr / 12, period);
        derivative -= (period * projectedCashFlows[i]) / Math.pow(1 + irr / 12, period + 1);
      }
      
      if (Math.abs(npv) < tolerance) break;
      
      const newIrr = irr - npv / derivative;
      if (Math.abs(newIrr - irr) < tolerance) break;
      
      irr = newIrr;
      iteration++;
    }
    
    // Convert to annual percentage and validate
    const annualIRR = irr * 12 * 100;
    return Math.max(-95, Math.min(500, annualIRR));
  }

  private calculateRealROI(cagr: number, timeHorizon: number): number {
    const years = timeHorizon / 12;
    const totalReturn = (Math.pow(1 + cagr / 100, years) - 1) * 100;
    return Math.max(-95, Math.min(2000, totalReturn));
  }

  private async calculateComprehensiveBeta(symbol: string): Promise<number> {
    try {
      console.log(`🔄 Calculating comprehensive beta for ${symbol} using CAPM methodology`);
      const betaResult = await comprehensiveBetaCalculationService.calculateComprehensiveBeta(symbol);
      console.log(`✅ CAPM beta calculated: ${betaResult.beta.toFixed(3)} (${betaResult.confidence} confidence, ${betaResult.dataPoints} points)`);
      return betaResult.beta;
    } catch (error) {
      console.error(`❌ Beta calculation failed for ${symbol}:`, error);
      throw error; // Don't silently fail - let the calling code handle it
    }
  }

  private calculateSharpeRatio(cagr: number, volatility: number): number {
    const riskFreeRate = 5; // 5% risk-free rate
    const excessReturn = cagr - riskFreeRate;
    return volatility > 0 ? excessReturn / volatility : 0;
  }

  private generateRandomReturn(volatility: number): number {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z * volatility;
  }

  private calculateConfidenceScore(
    monthsOfData: number,
    dataQuality: number,
    dataSource: string
  ): number {
    let score = 0;
    
    // Data completeness (40 points)
    score += Math.min(40, (monthsOfData / 36) * 40);
    
    // Data quality (30 points)
    score += (dataQuality / 100) * 30;
    
    // Data source quality (20 points)
    if (dataSource === 'glassnode') score += 20;
    else if (dataSource === 'coinmarketcap') score += 15;
    else if (dataSource === 'database') score += 10;
    
    // Calculation methodology (10 points)
    score += 10; // We're using improved methodology
    
    return Math.round(Math.min(100, score));
  }

  private calculateFallbackMetrics(
    investmentAmount: number,
    timeHorizon: number
  ): ImprovedFinancialMetrics {
    console.warn('⚠️ Using fallback metrics due to insufficient data');
    
    return {
      npv: investmentAmount * 0.1, // Conservative 10% return
      irr: 8, // Conservative 8% IRR
      cagr: 12, // Conservative 12% CAGR
      roi: (Math.pow(1.12, timeHorizon / 12) - 1) * 100,
      volatility: 45, // Moderate volatility
      beta: 1.2, // Slightly higher than market
      sharpeRatio: 0.16, // Low but positive
      confidenceScore: 25, // Low confidence
      dataSource: 'fallback',
      monthsOfData: 0
    };
  }
}

export const improvedFinancialCalculations = new ImprovedFinancialCalculations();
