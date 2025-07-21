
import { fetchGlassNodeMetric, GLASS_NODE_METRICS } from '@/services/glassNodeService';
import { fetchCoinPrices, CoinMarketCapCoin } from '@/services/coinMarketCapService';
import { symbolMappingService } from '@/services/symbolMappingService';

export interface DirectAnalysisResult {
  coinId: string;
  symbol: string;
  name: string;
  dataSource: 'glassnode' | 'coinmarketcap';
  hasRealData: boolean;
  
  // Basic metrics (available from both sources)
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  
  // Glassnode-specific metrics (only when available)
  glassNodeMetrics?: {
    avivRatio: number;
    activeSupply: number;
    vaultedSupply: number;
    realizedVolatility: number;
    cagr36m: number;
    onChainStrength: number;
  };
  
  // Financial calculations
  financialMetrics: {
    npv: number;
    irr: number;
    cagr: number;
    roi: number;
    volatility: number;
    beta: number;
    sharpeRatio: number;
  };
  
  // Investment recommendation
  recommendation: {
    action: 'Buy' | 'Hold' | 'Sell' | 'Not Recommended';
    confidence: number;
    reasoning: string[];
    riskWarnings: string[];
  };
  
  lastUpdated: string;
}

export class DirectApiAnalysisService {
  
  async analyzeInvestment(
    coinId: string,
    symbol: string,
    investmentAmount: number,
    timeHorizon: number
  ): Promise<DirectAnalysisResult> {
    console.log(`🔄 Starting direct API analysis for ${symbol} (${coinId})`);
    
    const mapping = symbolMappingService.getMapping(coinId);
    const glassNodeAsset = mapping?.glassNodeAsset;
    
    let result: DirectAnalysisResult;
    
    if (glassNodeAsset && mapping?.glassNodeSupported) {
      console.log(`✅ Using Glassnode data for ${symbol}`);
      result = await this.analyzeWithGlassNode(coinId, symbol, glassNodeAsset, investmentAmount, timeHorizon);
    } else {
      console.log(`⚠️ Using CoinMarketCap data for ${symbol} (Glassnode not supported)`);
      result = await this.analyzeWithCoinMarketCap(coinId, symbol, investmentAmount, timeHorizon);
    }
    
    console.log(`📊 Analysis completed for ${symbol}:`, result);
    return result;
  }
  
  private async analyzeWithGlassNode(
    coinId: string,
    symbol: string,
    glassNodeAsset: string,
    investmentAmount: number,
    timeHorizon: number
  ): Promise<DirectAnalysisResult> {
    try {
      // Get current price from CoinMarketCap
      const coinPrices = await fetchCoinPrices([symbol]);
      const coinPrice = coinPrices[0];
      
      if (!coinPrice) {
        throw new Error(`Unable to fetch price for ${symbol}`);
      }
      
      // Fetch Glassnode metrics
      const since = new Date(Date.now() - 36 * 30 * 24 * 60 * 60 * 1000); // 36 months
      
      const [
        priceData,
        liquidSupplyData,
        illiquidSupplyData,
        avivData,
        volatilityData,
        activeAddressData
      ] = await Promise.all([
        fetchGlassNodeMetric(GLASS_NODE_METRICS.PRICE_USD, glassNodeAsset, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.LIQUID_SUPPLY, glassNodeAsset, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.ILLIQUID_SUPPLY, glassNodeAsset, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.AVIV_RATIO, glassNodeAsset, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.REALIZED_VOLATILITY, glassNodeAsset, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.ACTIVE_ADDRESSES, glassNodeAsset, since)
      ]);
      
      // Calculate metrics from real data
      const currentPrice = coinPrice.current_price;
      const cagr36m = this.calculateCAGR(priceData, 36);
      const realizedVolatility = this.getLatestValue(volatilityData) || 60;
      const avivRatio = this.getLatestValue(avivData) || 1.0;
      
      const { activeSupply, vaultedSupply } = this.calculateSupplyMetrics(
        liquidSupplyData,
        illiquidSupplyData
      );
      
      const onChainStrength = this.calculateOnChainStrength(
        activeAddressData,
        liquidSupplyData,
        priceData
      );
      
      // Financial calculations
      const financialMetrics = this.calculateFinancialMetrics(
        currentPrice,
        cagr36m,
        realizedVolatility,
        investmentAmount,
        timeHorizon
      );
      
      // Generate recommendation
      const recommendation = this.generateRecommendation(
        financialMetrics,
        { avivRatio, activeSupply, vaultedSupply, onChainStrength },
        realizedVolatility
      );
      
      return {
        coinId,
        symbol,
        name: coinPrice.name,
        dataSource: 'glassnode',
        hasRealData: true,
        currentPrice,
        priceChange24h: coinPrice.price_change_percentage_24h || 0,
        marketCap: coinPrice.market_cap,
        glassNodeMetrics: {
          avivRatio,
          activeSupply,
          vaultedSupply,
          realizedVolatility,
          cagr36m,
          onChainStrength
        },
        financialMetrics,
        recommendation,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Glassnode analysis failed for ${symbol}:`, error);
      // Fallback to CoinMarketCap
      return this.analyzeWithCoinMarketCap(coinId, symbol, investmentAmount, timeHorizon);
    }
  }
  
  private async analyzeWithCoinMarketCap(
    coinId: string,
    symbol: string,
    investmentAmount: number,
    timeHorizon: number
  ): Promise<DirectAnalysisResult> {
    try {
      const coinPrices = await fetchCoinPrices([symbol]);
      const coinPrice = coinPrices[0];
      
      if (!coinPrice) {
        throw new Error(`Unable to fetch price for ${symbol}`);
      }
      
      const currentPrice = coinPrice.current_price;
      const priceChange24h = coinPrice.price_change_percentage_24h || 0;
      
      // Use available price changes to estimate metrics
      const estimatedCAGR = this.estimateCAGRFromPriceChanges(coinPrice);
      const estimatedVolatility = this.estimateVolatilityFromPriceChanges(coinPrice);
      
      // Basic financial calculations
      const financialMetrics = this.calculateFinancialMetrics(
        currentPrice,
        estimatedCAGR,
        estimatedVolatility,
        investmentAmount,
        timeHorizon
      );
      
      // Conservative recommendation for non-Glassnode coins
      const recommendation = this.generateBasicRecommendation(
        financialMetrics,
        estimatedVolatility,
        coinPrice.market_cap
      );
      
      return {
        coinId,
        symbol,
        name: coinPrice.name,
        dataSource: 'coinmarketcap',
        hasRealData: false,
        currentPrice,
        priceChange24h,
        marketCap: coinPrice.market_cap,
        financialMetrics,
        recommendation,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ CoinMarketCap analysis failed for ${symbol}:`, error);
      throw error;
    }
  }
  
  private getLatestValue(data: Array<{ value: number }>): number | null {
    return data.length > 0 ? data[data.length - 1].value : null;
  }
  
  private calculateCAGR(priceData: Array<{ value: number }>, months: number): number {
    if (priceData.length < 2) return 0;
    
    const startPrice = priceData[0].value;
    const endPrice = priceData[priceData.length - 1].value;
    const years = months / 12;
    
    return (Math.pow(endPrice / startPrice, 1/years) - 1) * 100;
  }
  
  private calculateSupplyMetrics(
    liquidSupplyData: Array<{ value: number }>,
    illiquidSupplyData: Array<{ value: number }>
  ): { activeSupply: number; vaultedSupply: number } {
    const latestLiquid = this.getLatestValue(liquidSupplyData) || 0;
    const latestIlliquid = this.getLatestValue(illiquidSupplyData) || 0;
    const total = latestLiquid + latestIlliquid;
    
    return {
      activeSupply: total > 0 ? (latestLiquid / total) * 100 : 50,
      vaultedSupply: total > 0 ? (latestIlliquid / total) * 100 : 50
    };
  }
  
  private calculateOnChainStrength(
    activeAddressData: Array<{ value: number }>,
    liquidSupplyData: Array<{ value: number }>,
    priceData: Array<{ value: number }>
  ): number {
    const activeAddresses = this.getLatestValue(activeAddressData) || 0;
    const liquidSupply = this.getLatestValue(liquidSupplyData) || 0;
    const price = this.getLatestValue(priceData) || 0;
    
    // Simple on-chain strength calculation
    const networkValue = activeAddresses * Math.log(liquidSupply + 1) * Math.log(price + 1);
    return Math.min(100, Math.max(0, networkValue / 10000));
  }
  
  private calculateFinancialMetrics(
    currentPrice: number,
    cagr: number,
    volatility: number,
    investmentAmount: number,
    timeHorizon: number
  ) {
    const expectedReturn = cagr / 100;
    const riskFreeRate = 0.05; // 5% risk-free rate
    const beta = Math.min(2.0, Math.max(0.5, volatility / 50)); // Estimate beta from volatility
    
    // Calculate future value
    const futureValue = investmentAmount * Math.pow(1 + expectedReturn, timeHorizon);
    
    // NPV calculation
    const npv = futureValue - investmentAmount;
    
    // IRR approximation
    const irr = Math.pow(futureValue / investmentAmount, 1/timeHorizon) - 1;
    
    // ROI
    const roi = (futureValue - investmentAmount) / investmentAmount * 100;
    
    // Sharpe ratio
    const sharpeRatio = (expectedReturn - riskFreeRate) / (volatility / 100);
    
    return {
      npv,
      irr: irr * 100,
      cagr,
      roi,
      volatility,
      beta,
      sharpeRatio
    };
  }
  
  private generateRecommendation(
    financialMetrics: any,
    glassNodeMetrics: any,
    volatility: number
  ) {
    const reasoning: string[] = [];
    const riskWarnings: string[] = [];
    
    let action: 'Buy' | 'Hold' | 'Sell' | 'Not Recommended' = 'Hold';
    let confidence = 50;
    
    // Positive signals
    if (financialMetrics.npv > 0) {
      reasoning.push('Positive NPV indicates good investment potential');
      confidence += 10;
    }
    
    if (financialMetrics.cagr > 20) {
      reasoning.push('Strong historical returns (CAGR > 20%)');
      confidence += 15;
      action = 'Buy';
    }
    
    if (glassNodeMetrics.avivRatio > 1.2) {
      reasoning.push('Strong AVIV ratio indicates healthy on-chain activity');
      confidence += 10;
    }
    
    if (glassNodeMetrics.vaultedSupply > 60) {
      reasoning.push('High vaulted supply suggests strong HODLing behavior');
      confidence += 10;
    }
    
    // Risk warnings
    if (volatility > 80) {
      riskWarnings.push('High volatility - expect significant price swings');
      confidence -= 10;
    }
    
    if (financialMetrics.beta > 1.5) {
      riskWarnings.push('High beta - more volatile than market average');
      confidence -= 5;
    }
    
    if (financialMetrics.npv < 0) {
      riskWarnings.push('Negative NPV - investment may not meet return expectations');
      action = 'Not Recommended';
      confidence = Math.max(20, confidence - 20);
    }
    
    confidence = Math.min(95, Math.max(20, confidence));
    
    return {
      action,
      confidence,
      reasoning,
      riskWarnings
    };
  }
  
  private generateBasicRecommendation(
    financialMetrics: any,
    volatility: number,
    marketCap: number
  ) {
    const reasoning: string[] = [];
    const riskWarnings: string[] = [];
    
    let action: 'Buy' | 'Hold' | 'Sell' | 'Not Recommended' = 'Hold';
    let confidence = 40; // Lower confidence for basic analysis
    
    reasoning.push('Analysis based on limited price data (Glassnode unavailable)');
    
    if (financialMetrics.npv > 0) {
      reasoning.push('Positive NPV based on price history');
      confidence += 10;
    }
    
    if (marketCap > 1000000000) { // > $1B market cap
      reasoning.push('Large market cap provides some stability');
      confidence += 10;
    }
    
    // Conservative warnings
    riskWarnings.push('Limited on-chain data available for analysis');
    riskWarnings.push('Recommendation based on price action only');
    
    if (volatility > 70) {
      riskWarnings.push('High estimated volatility');
      action = 'Not Recommended';
      confidence = Math.max(20, confidence - 15);
    }
    
    confidence = Math.min(75, Math.max(20, confidence)); // Cap at 75% for basic analysis
    
    return {
      action,
      confidence,
      reasoning,
      riskWarnings
    };
  }
  
  private estimateCAGRFromPriceChanges(coinPrice: CoinMarketCapCoin): number {
    const change24h = coinPrice.price_change_percentage_24h || 0;
    const change7d = coinPrice.price_change_7d || 0;
    const change30d = coinPrice.price_change_30d || 0;
    
    // Simple annualized estimate
    if (change30d !== 0) {
      return (change30d / 30) * 365;
    } else if (change7d !== 0) {
      return (change7d / 7) * 365;
    } else {
      return change24h * 365;
    }
  }
  
  private estimateVolatilityFromPriceChanges(coinPrice: CoinMarketCapCoin): number {
    const change24h = Math.abs(coinPrice.price_change_percentage_24h || 0);
    const change7d = Math.abs(coinPrice.price_change_7d || 0);
    const change30d = Math.abs(coinPrice.price_change_30d || 0);
    
    // Estimate volatility from price changes
    const avgChange = (change24h + change7d + change30d) / 3;
    return Math.max(30, Math.min(150, avgChange * 5)); // Scale and bound
  }
}

export const directApiAnalysisService = new DirectApiAnalysisService();
