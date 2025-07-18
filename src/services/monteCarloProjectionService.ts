
import { RealTimeGlassNodeData } from './realTimeGlassNodeService';

export interface MonteCarloProjection {
  expectedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  scenarios: Array<{
    probability: number;
    finalValue: number;
    pathway: number[];
  }>;
  riskMetrics: {
    valueAtRisk: number;
    maxDrawdown: number;
    probabilityOfLoss: number;
  };
}

class MonteCarloProjectionService {
  generateProjection(
    initialInvestment: number,
    realTimeData: RealTimeGlassNodeData,
    horizon: number,
    simulations: number = 10000
  ): MonteCarloProjection {
    console.log(`🎲 Running Monte Carlo simulation with ${simulations} scenarios for ${horizon} years`);
    console.log(`📊 Using real volatility: ${realTimeData.volatility.toFixed(2)}%`);
    console.log(`📈 Using real CAGR: ${realTimeData.cagr36m.toFixed(2)}%`);

    const scenarios: Array<{
      probability: number;
      finalValue: number;
      pathway: number[];
    }> = [];

    // Convert annual metrics to daily
    const dailyReturn = realTimeData.cagr36m / 100 / 365;
    const dailyVolatility = realTimeData.volatility / 100 / Math.sqrt(365);
    const totalDays = horizon * 365;

    let allFinalValues: number[] = [];

    for (let sim = 0; sim < simulations; sim++) {
      let currentValue = initialInvestment;
      const pathway = [currentValue];

      for (let day = 0; day < totalDays; day++) {
        // Generate random return using Box-Muller transformation
        const randomReturn = this.generateNormalRandom(dailyReturn, dailyVolatility);
        
        // Apply AVIV ratio adjustment (undervalued assets have higher upside potential)
        let adjustedReturn = randomReturn;
        if (realTimeData.avivRatio < 0.8) {
          adjustedReturn *= 1.2; // 20% upside bias for undervalued assets
        } else if (realTimeData.avivRatio > 2.0) {
          adjustedReturn *= 0.8; // 20% downside bias for overvalued assets
        }

        // Apply supply dynamics (high vaulted supply reduces volatility)
        if (realTimeData.vaultedSupply > 70) {
          adjustedReturn *= 0.9; // Reduced volatility for strong holders
        }

        currentValue *= (1 + adjustedReturn);
        
        // Record pathway every 30 days
        if (day % 30 === 0) {
          pathway.push(currentValue);
        }
      }

      scenarios.push({
        probability: 1 / simulations,
        finalValue: currentValue,
        pathway
      });

      allFinalValues.push(currentValue);
    }

    // Sort final values for percentile calculations
    allFinalValues.sort((a, b) => a - b);

    const expectedValue = allFinalValues.reduce((sum, val) => sum + val, 0) / simulations;
    const percentile5 = allFinalValues[Math.floor(simulations * 0.05)];
    const percentile95 = allFinalValues[Math.floor(simulations * 0.95)];
    const valueAtRisk = initialInvestment - percentile5;
    const maxDrawdown = this.calculateMaxDrawdown(scenarios);
    const probabilityOfLoss = allFinalValues.filter(val => val < initialInvestment).length / simulations;

    const projection: MonteCarloProjection = {
      expectedValue,
      confidenceInterval: {
        lower: percentile5,
        upper: percentile95
      },
      scenarios: scenarios.slice(0, 100), // Return top 100 scenarios for visualization
      riskMetrics: {
        valueAtRisk,
        maxDrawdown,
        probabilityOfLoss
      }
    };

    console.log(`📊 Monte Carlo Results:`);
    console.log(`   Expected Value: $${expectedValue.toLocaleString()}`);
    console.log(`   95% Confidence: $${percentile5.toLocaleString()} - $${percentile95.toLocaleString()}`);
    console.log(`   Probability of Loss: ${(probabilityOfLoss * 100).toFixed(1)}%`);
    console.log(`   Value at Risk (5%): $${valueAtRisk.toLocaleString()}`);

    return projection;
  }

  private generateNormalRandom(mean: number, stdDev: number): number {
    // Box-Muller transformation for normal distribution
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    
    const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mean + stdDev * normal;
  }

  private calculateMaxDrawdown(scenarios: Array<{ pathway: number[] }>): number {
    let maxDrawdown = 0;

    for (const scenario of scenarios.slice(0, 1000)) { // Sample 1000 scenarios
      let peak = scenario.pathway[0];
      let maxScenarioDrawdown = 0;

      for (const value of scenario.pathway) {
        if (value > peak) {
          peak = value;
        }
        const drawdown = (peak - value) / peak;
        maxScenarioDrawdown = Math.max(maxScenarioDrawdown, drawdown);
      }

      maxDrawdown = Math.max(maxDrawdown, maxScenarioDrawdown);
    }

    return maxDrawdown;
  }

  generateRealCashFlows(
    initialInvestment: number,
    projection: MonteCarloProjection,
    horizon: number,
    stakingYield: number = 0
  ): number[] {
    console.log(`💰 Generating real cash flows from Monte Carlo projection`);
    
    const cashFlows = [-initialInvestment]; // Initial investment (negative)
    const annualStakingIncome = initialInvestment * (stakingYield / 100);

    // Add annual staking income
    for (let year = 1; year <= horizon; year++) {
      if (year < horizon) {
        cashFlows.push(annualStakingIncome);
      } else {
        // Final year: staking income + expected final value
        cashFlows.push(annualStakingIncome + projection.expectedValue);
      }
    }

    console.log(`💰 Generated cash flows:`, cashFlows.map(cf => `$${cf.toLocaleString()}`));
    return cashFlows;
  }
}

export const monteCarloProjectionService = new MonteCarloProjectionService();
