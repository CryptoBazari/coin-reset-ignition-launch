import axios from 'axios';
import { enhancedGlassnodeService } from './enhancedGlassnodeService';

interface BenchmarkData {
  prices: Array<{ date: string; close: number }>;
  cagr: number;
  volatility: number;
  monthlyReturns: number[];
}

interface NPVCalculationParams {
  coinSymbol: string;
  initialInvestment: number;
  projectionYears: number;
  stakingYield?: number;
  riskFreeRate: number;
}

interface NPVResult {
  npv: number;
  irr: number;
  roi: number;
  cagr: number;
  beta: number;
  discountRate: number;
  projectedPrices: number[];
  cashFlows: number[];
  stressTestedNPV: number;
  marketPremium: number;
  monthlyChanges: number[];
  isStakeable: boolean;
  benchmark: string;
  riskAdjustments: {
    mvrvAdjustment: number;
    liquidityAdjustment: number;
    drawdownRisk: number;
  };
}

export class AdvancedInvestmentCalculationService {
  private stakeableCoins = ['eth', 'ada', 'sol', 'dot', 'atom', 'avax', 'near', 'algo'];

  // Check if coin is stakeable
  private isStakeable(coinSymbol: string): boolean {
    return this.stakeableCoins.includes(coinSymbol.toLowerCase());
  }

  // Get benchmark data based on coin
  private async getBenchmarkData(coinSymbol: string): Promise<BenchmarkData> {
    const coin = coinSymbol.toLowerCase();
    
    if (coin === 'btc') {
      // Use S&P 500 for Bitcoin
      return this.getSP500BenchmarkData();
    } else {
      // Use Bitcoin for altcoins
      return this.getBitcoinBenchmarkData();
    }
  }

  // Fetch S&P 500 data
  private async getSP500BenchmarkData(): Promise<BenchmarkData> {
    try {
      const fiveYearsAgo = Math.floor((Date.now() - (5 * 365 * 24 * 60 * 60 * 1000)) / 1000);
      const currentTime = Math.floor(Date.now() / 1000);
      
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v7/finance/download/^GSPC?period1=${fiveYearsAgo}&period2=${currentTime}&interval=1mo&events=history&includeAdjustedClose=true`
      );

      const lines = response.data.split('\n').slice(1).filter((line: string) => line.trim());
      const prices = lines.map((line: string) => {
        const [date, , , , close] = line.split(',');
        return { date, close: parseFloat(close) };
      }).filter((item: any) => !isNaN(item.close));

      const monthlyReturns = this.calculateMonthlyReturns(prices.map(p => p.close));
      const cagr = this.calculateCAGR(prices[0].close, prices[prices.length - 1].close, 5);
      const volatility = this.calculateVolatility(monthlyReturns);

      return { prices, cagr, volatility, monthlyReturns };
    } catch (error) {
      console.warn('Failed to fetch S&P 500 data, using defaults:', error);
      return {
        prices: [],
        cagr: 0.08, // 8% default
        volatility: 0.15, // 15% default
        monthlyReturns: []
      };
    }
  }

  // Fetch Bitcoin benchmark data
  private async getBitcoinBenchmarkData(): Promise<BenchmarkData> {
    try {
      const priceData = await enhancedGlassnodeService.getMonthlyClosingPrices('btc');
      const prices = priceData.map(point => ({
        date: new Date(point.t * 1000).toISOString().split('T')[0],
        close: point.v
      }));

      const monthlyReturns = enhancedGlassnodeService.calculateMonthlyReturns(priceData);
      const cagr = enhancedGlassnodeService.calculateCAGR(priceData) / 100;
      const volatility = enhancedGlassnodeService.calculateAnnualizedVolatility(monthlyReturns) / 100;

      return { prices, cagr, volatility, monthlyReturns };
    } catch (error) {
      console.warn('Failed to fetch Bitcoin benchmark data, using defaults:', error);
      return {
        prices: [],
        cagr: 0.08,
        volatility: 0.15,
        monthlyReturns: []
      };
    }
  }

  // Calculate monthly returns from prices
  private calculateMonthlyReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1] > 0) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
    }
    return returns;
  }

  // Calculate CAGR
  private calculateCAGR(startPrice: number, endPrice: number, years: number): number {
    if (startPrice <= 0 || endPrice <= 0 || years <= 0) return 0;
    return Math.pow(endPrice / startPrice, 1 / years) - 1;
  }

  // Calculate volatility
  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance * 12); // Annualized
  }

  // Calculate IRR using bisection method
  private calculateIRR(cashFlows: number[], initialGuess = 0.1): number {
    const maxIterations = 1000;
    const tolerance = 1e-6;
    let low = -0.99;
    let high = 10.0;

    const npvAtRate = (rate: number): number => {
      return cashFlows.reduce((npv, cf, index) => {
        return npv + cf / Math.pow(1 + rate, index);
      }, 0);
    };

    for (let i = 0; i < maxIterations; i++) {
      const mid = (low + high) / 2;
      const npv = npvAtRate(mid);

      if (Math.abs(npv) < tolerance) {
        return mid;
      }

      if (npv > 0) {
        low = mid;
      } else {
        high = mid;
      }

      if (Math.abs(high - low) < tolerance) {
        break;
      }
    }

    return (low + high) / 2;
  }

  // Main NPV calculation
  async calculateAdvancedNPV(params: NPVCalculationParams): Promise<NPVResult> {
    const { coinSymbol, initialInvestment, projectionYears, stakingYield = 0, riskFreeRate } = params;
    
    console.log(`🔄 Starting advanced NPV calculation for ${coinSymbol.toUpperCase()}`);

    // Fetch all required data
    const [
      priceData,
      volatilityData,
      mvrvData,
      drawdownData,
      volumeData,
      regionalData,
      benchmarkData
    ] = await Promise.all([
      enhancedGlassnodeService.getMonthlyClosingPrices(coinSymbol),
      enhancedGlassnodeService.getRealizedVolatility(coinSymbol),
      enhancedGlassnodeService.getMVRVZScore(coinSymbol),
      enhancedGlassnodeService.getPriceDrawdown(coinSymbol),
      enhancedGlassnodeService.getTransferVolume(coinSymbol),
      enhancedGlassnodeService.getRegionalPriceChanges(coinSymbol),
      this.getBenchmarkData(coinSymbol)
    ]);

    // Calculate base metrics
    const currentPrice = priceData[priceData.length - 1]?.v || 0;
    const cryptoCAGR = enhancedGlassnodeService.calculateCAGR(priceData) / 100;
    const cryptoReturns = enhancedGlassnodeService.calculateMonthlyReturns(priceData);
    const cryptoVolatility = enhancedGlassnodeService.calculateAnnualizedVolatility(cryptoReturns) / 100;
    const monthlyChanges = enhancedGlassnodeService.calculateAverageRegionalChange(regionalData);

    // Calculate Beta
    const beta = benchmarkData.volatility > 0 ? cryptoVolatility / benchmarkData.volatility : 1.0;

    // Calculate market premium and discount rate
    const marketPremium = benchmarkData.cagr - (riskFreeRate / 100);
    let discountRate = (riskFreeRate / 100) + beta * marketPremium;

    // Risk adjustments
    const latestMVRV = mvrvData[mvrvData.length - 1]?.v || 0;
    const mvrvAdjustment = latestMVRV > 7 ? 0.02 : latestMVRV > 4 ? 0.01 : 0;
    discountRate += mvrvAdjustment;

    const maxDrawdown = enhancedGlassnodeService.calculateMaxDrawdown(priceData) / 100;
    const avgVolume = volumeData.reduce((sum, point) => sum + point.v, 0) / volumeData.length;
    const liquidityAdjustment = avgVolume < 1000 ? 0.1 : 0; // 10% reduction for low liquidity

    // Generate projected prices and cash flows
    const projectedPrices: number[] = [];
    const cashFlows: number[] = [-initialInvestment]; // Initial investment (negative)

    for (let year = 1; year <= projectionYears; year++) {
      const projectedPrice = currentPrice * Math.pow(1 + cryptoCAGR, year);
      projectedPrices.push(projectedPrice);

      // Calculate cash flow for this year
      const baseFlow = initialInvestment * 0.2; // 20% of initial investment
      const priceAppreciation = baseFlow * (projectedPrice / currentPrice);
      
      let yearlyFlow = priceAppreciation;
      
      // Add staking yield if applicable
      if (this.isStakeable(coinSymbol) && stakingYield > 0) {
        yearlyFlow += initialInvestment * (stakingYield / 100);
      }

      // Apply liquidity adjustment
      yearlyFlow *= (1 - liquidityAdjustment);

      cashFlows.push(yearlyFlow);
    }

    // Calculate NPV
    const npv = cashFlows.reduce((total, flow, index) => {
      return total + flow / Math.pow(1 + discountRate, index);
    }, 0);

    // Calculate stress-tested NPV with drawdown
    const stressedCashFlows = cashFlows.map((flow, index) => {
      if (index === 0) return flow; // Don't adjust initial investment
      return flow * (1 - maxDrawdown);
    });

    const stressTestedNPV = stressedCashFlows.reduce((total, flow, index) => {
      return total + flow / Math.pow(1 + discountRate, index);
    }, 0);

    // Calculate IRR
    const irr = this.calculateIRR(cashFlows);

    // Calculate ROI
    const totalCashFlows = cashFlows.slice(1).reduce((sum, flow) => sum + flow, 0);
    const finalValue = projectedPrices[projectedPrices.length - 1];
    const roi = ((totalCashFlows + finalValue - initialInvestment) / initialInvestment) * 100;

    return {
      npv,
      irr: irr * 100, // Convert to percentage
      roi,
      cagr: cryptoCAGR * 100,
      beta,
      discountRate: discountRate * 100,
      projectedPrices,
      cashFlows,
      stressTestedNPV,
      marketPremium: marketPremium * 100,
      monthlyChanges,
      isStakeable: this.isStakeable(coinSymbol),
      benchmark: coinSymbol.toLowerCase() === 'btc' ? 'S&P 500' : 'Bitcoin',
      riskAdjustments: {
        mvrvAdjustment: mvrvAdjustment * 100,
        liquidityAdjustment: liquidityAdjustment * 100,
        drawdownRisk: maxDrawdown * 100
      }
    };
  }
}

export const advancedInvestmentService = new AdvancedInvestmentCalculationService();