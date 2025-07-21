
export interface MonteCarloNPVResult {
  expectedNPV: number;
  confidenceInterval: {
    lower5: number;
    upper95: number;
  };
  scenarios: Array<{
    npv: number;
    probability: number;
  }>;
  riskMetrics: {
    probabilityOfPositiveNPV: number;
    valueAtRisk: number;
    expectedShortfall: number;
  };
}

export class GlassnodeMonteCarloService {
  runMonteCarloNPV(
    investmentAmount: number,
    coinData: any,
    inputs: any,
    simulations: number = 10000
  ): MonteCarloNPVResult {
    console.log(`🎲 Running ${simulations} Monte Carlo NPV simulations using Glassnode data`);
    
    const npvResults: number[] = [];
    const mvrvRatio = coinData.mvrv || 1.0;
    const volatility = coinData.volatility || 50;
    const netRealizedPL = coinData.realizedProfitLoss || 0;
    
    // Base parameters from Glassnode data
    const baseGrowthRate = this.calculateBaseGrowthFromMVRV(mvrvRatio);
    const volatilityDaily = volatility / 100 / Math.sqrt(365);
    
    console.log(`📊 Monte Carlo Parameters:`);
    console.log(`   - Base Growth Rate: ${(baseGrowthRate * 100).toFixed(1)}%`);
    console.log(`   - Daily Volatility: ${(volatilityDaily * 100).toFixed(2)}%`);
    console.log(`   - MVRV Ratio: ${mvrvRatio}`);
    
    for (let sim = 0; sim < simulations; sim++) {
      const npv = this.simulateSingleNPVScenario(
        investmentAmount,
        baseGrowthRate,
        volatilityDaily,
        mvrvRatio,
        netRealizedPL,
        inputs
      );
      npvResults.push(npv);
    }
    
    // Sort results for percentile calculations
    npvResults.sort((a, b) => a - b);
    
    const expectedNPV = npvResults.reduce((sum, npv) => sum + npv, 0) / simulations;
    const lower5 = npvResults[Math.floor(simulations * 0.05)];
    const upper95 = npvResults[Math.floor(simulations * 0.95)];
    
    // Risk metrics
    const positiveNPVCount = npvResults.filter(npv => npv > 0).length;
    const probabilityOfPositiveNPV = positiveNPVCount / simulations;
    const valueAtRisk = investmentAmount - lower5;
    const worstTenPercent = npvResults.slice(0, Math.floor(simulations * 0.1));
    const expectedShortfall = worstTenPercent.reduce((sum, npv) => sum + npv, 0) / worstTenPercent.length;
    
    // Generate scenario distribution
    const scenarios = this.generateScenarioDistribution(npvResults);
    
    console.log(`📈 Monte Carlo Results:`);
    console.log(`   - Expected NPV: $${expectedNPV.toLocaleString()}`);
    console.log(`   - 90% Confidence: $${lower5.toLocaleString()} to $${upper95.toLocaleString()}`);
    console.log(`   - Probability of Profit: ${(probabilityOfPositiveNPV * 100).toFixed(1)}%`);
    console.log(`   - Value at Risk (5%): $${valueAtRisk.toLocaleString()}`);
    
    return {
      expectedNPV,
      confidenceInterval: { lower5, upper95 },
      scenarios,
      riskMetrics: {
        probabilityOfPositiveNPV,
        valueAtRisk,
        expectedShortfall
      }
    };
  }
  
  private calculateBaseGrowthFromMVRV(mvrvRatio: number): number {
    // MVRV-based growth rate calculation
    if (mvrvRatio < 0.5) return 0.50; // Extremely undervalued
    if (mvrvRatio < 0.8) return 0.35; // Undervalued
    if (mvrvRatio < 1.5) return 0.20; // Fair value
    if (mvrvRatio < 2.5) return 0.10; // Slightly overvalued
    return 0.02; // Overvalued
  }
  
  private simulateSingleNPVScenario(
    investmentAmount: number,
    baseGrowthRate: number,
    dailyVolatility: number,
    mvrvRatio: number,
    netRealizedPL: number,
    inputs: any
  ): number {
    const years = (inputs.holdingPeriod || 36) / 12;
    const dailyGrowthRate = Math.pow(1 + baseGrowthRate, 1/365) - 1;
    
    // Simulate daily price movements
    let currentPrice = 50000; // Starting price assumption
    const daysToSimulate = Math.floor(years * 365);
    
    for (let day = 0; day < daysToSimulate; day++) {
      // Generate random return using normal distribution
      const randomReturn = this.generateNormalRandom(dailyGrowthRate, dailyVolatility);
      
      // Apply MVRV-based momentum
      let momentumAdjustment = 1.0;
      if (mvrvRatio < 1.0) {
        momentumAdjustment = 1.001; // Slight upward bias when undervalued
      } else if (mvrvRatio > 2.0) {
        momentumAdjustment = 0.999; // Slight downward bias when overvalued
      }
      
      // Apply sentiment adjustment
      const sentimentFactor = netRealizedPL > 0 ? 1.0002 : 0.9998;
      
      currentPrice *= (1 + randomReturn) * momentumAdjustment * sentimentFactor;
    }
    
    // Calculate NPV for this scenario
    const finalPrice = currentPrice;
    const coinQuantity = investmentAmount / 50000; // Initial price
    const stakingYield = inputs.stakingYield || 0;
    const discountRate = inputs.riskFreeRate || 0.03;
    
    // Simple NPV calculation for this scenario
    const stakingIncome = coinQuantity * (stakingYield / 100) * 50000 * years; // Simplified
    const saleProceeds = coinQuantity * finalPrice;
    const totalCashFlow = stakingIncome + saleProceeds;
    
    const npv = totalCashFlow / Math.pow(1 + discountRate, years) - investmentAmount;
    
    return npv;
  }
  
  private generateNormalRandom(mean: number, stdDev: number): number {
    // Box-Muller transformation for normal distribution
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    
    const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mean + stdDev * normal;
  }
  
  private generateScenarioDistribution(npvResults: number[]): Array<{ npv: number; probability: number }> {
    const buckets = 20;
    const min = Math.min(...npvResults);
    const max = Math.max(...npvResults);
    const bucketSize = (max - min) / buckets;
    
    const scenarios: Array<{ npv: number; probability: number }> = [];
    
    for (let i = 0; i < buckets; i++) {
      const bucketMin = min + i * bucketSize;
      const bucketMax = min + (i + 1) * bucketSize;
      const count = npvResults.filter(npv => npv >= bucketMin && npv < bucketMax).length;
      
      scenarios.push({
        npv: (bucketMin + bucketMax) / 2,
        probability: count / npvResults.length
      });
    }
    
    return scenarios;
  }
}

export const glassnodeMonteCarloService = new GlassnodeMonteCarloService();
