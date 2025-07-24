
import { fetchGlassNodeMetric, GLASS_NODE_METRICS } from '@/services/glassNodeService';
import { fetchCoinPrices, CoinMarketCapCoin } from '@/services/coinMarketCapService';
import { symbolMappingService } from '@/services/symbolMappingService';
import { bitcoinAnalysisService } from '@/services/bitcoinAnalysisService';
import { realDataFinancialCalculations } from '@/services/realDataFinancialCalculations';
import { bitcoinMarketAnalyzer } from '@/services/bitcoinMarketAnalyzer';
import { comprehensiveBetaCalculationService, type BetaCalculationResult } from '@/services/comprehensiveBetaCalculationService';
import { comprehensiveCAGRCalculationService, type CAGRCalculationResult } from '@/services/comprehensiveCAGRCalculationService';

export interface DirectAnalysisResult {
  coinId: string;
  symbol: string;
  name: string;
  isBitcoin: boolean;
  dataSource: 'glassnode' | 'coinmarketcap';
  hasRealData: boolean;
  
  // Basic market data (available for all coins)
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  
  // Standard financial metrics (for all coins)
  financialMetrics: {
    npv: number;
    irr: number;
    cagr: number;
    roi: number;
    volatility: number;
    beta: number;
    sharpeRatio: number;
  };
  
  // Bitcoin-specific cointime metrics (only for Bitcoin)
  cointimeMetrics?: {
    avivRatio: number;
    activeSupply: number;
    vaultedSupply: number;
    cointimeDestroyed: number;
    cointimePrice: number;
    liquidSupply: number;
  };
  
  // Bitcoin market context (shown for all analyses)
  bitcoinMarketState: {
    condition: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    summary: string;
  };
  
  // Investment recommendation
  recommendation: {
    action: 'Buy' | 'Hold' | 'Sell' | 'Not Recommended';
    confidence: number;
    reasoning: string[];
    riskWarnings: string[];
  };
  
  // Beta calculation details (when available)
  betaCalculationDetails?: BetaCalculationResult;
  cagrCalculationDetails?: CAGRCalculationResult;
  
  // Data quality indicators
  dataQuality: {
    score: number;
    source: string;
    freshness: string;
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
    console.log(`🔄 Starting differentiated analysis for ${symbol} (${coinId})`);
    
    const isBitcoin = this.isBitcoinSymbol(symbol);
    
    // Always get Bitcoin market state for context
    const bitcoinMarketState = await bitcoinMarketAnalyzer.getBitcoinMarketState();
    
    if (isBitcoin) {
      console.log('🟠 Detected Bitcoin - using full cointime analysis');
      return this.analyzeBitcoinWithCointime(coinId, symbol, investmentAmount, timeHorizon, bitcoinMarketState);
    } else {
      console.log('🔵 Detected altcoin - using standard financial analysis');
      return this.analyzeAltcoinStandard(coinId, symbol, investmentAmount, timeHorizon, bitcoinMarketState);
    }
  }
  
  private async analyzeBitcoinWithCointime(
    coinId: string,
    symbol: string,
    investmentAmount: number,
    timeHorizon: number,
    bitcoinMarketState: any
  ): Promise<DirectAnalysisResult> {
    try {
      // Get current Bitcoin price
      const coinPrices = await fetchCoinPrices([symbol]);
      const coinPrice = coinPrices[0];
      
      if (!coinPrice) {
        throw new Error(`Unable to fetch Bitcoin price`);
      }
      
      // Use Bitcoin analysis service for comprehensive analysis
      const bitcoinAnalysis = await bitcoinAnalysisService.analyzeBitcoinInvestment(
        investmentAmount,
        timeHorizon
      );
      
      // Get comprehensive beta calculation details for Bitcoin
      console.log('🔄 Calculating detailed beta analysis for Bitcoin...');
      let betaCalculationDetails: BetaCalculationResult | undefined;
      try {
        betaCalculationDetails = await comprehensiveBetaCalculationService.calculateComprehensiveBeta('BTC');
        console.log('✅ Detailed beta calculation completed for Bitcoin');
      } catch (error) {
        console.warn('⚠️ Detailed beta calculation failed for Bitcoin, continuing without it:', error);
      }
      
      // Get comprehensive CAGR calculation details for Bitcoin
      console.log('🔄 Calculating detailed CAGR analysis for Bitcoin...');
      let cagrCalculationDetails: CAGRCalculationResult | undefined;
      try {
        cagrCalculationDetails = await comprehensiveCAGRCalculationService.calculateComprehensiveCAGR('bitcoin');
        console.log('✅ Detailed CAGR calculation completed for Bitcoin');
      } catch (error) {
        console.warn('⚠️ Detailed CAGR calculation failed for Bitcoin, continuing without it:', error);
      }
      
      console.log('✅ Bitcoin analysis completed with full cointime metrics');
      
      return {
        coinId,
        symbol,
        name: coinPrice.name,
        isBitcoin: true,
        dataSource: 'glassnode',
        hasRealData: true,
        currentPrice: coinPrice.current_price,
        priceChange24h: coinPrice.price_change_percentage_24h || 0,
        marketCap: coinPrice.market_cap,
        financialMetrics: bitcoinAnalysis.financialMetrics,
        cointimeMetrics: bitcoinAnalysis.cointimeMetrics,
        bitcoinMarketState: {
          condition: bitcoinMarketState.condition,
          confidence: bitcoinMarketState.confidence,
          summary: bitcoinMarketState.summary
        },
        recommendation: bitcoinAnalysis.recommendation,
        betaCalculationDetails,
        cagrCalculationDetails,
        dataQuality: bitcoinAnalysis.dataQuality,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Bitcoin analysis failed:`, error);
      throw error;
    }
  }
  
  private async analyzeAltcoinStandard(
    coinId: string,
    symbol: string,
    investmentAmount: number,
    timeHorizon: number,
    bitcoinMarketState: any
  ): Promise<DirectAnalysisResult> {
    const mapping = symbolMappingService.getMapping(symbol);
    const glassNodeAsset = mapping?.glassNodeAsset;
    
    let result: DirectAnalysisResult;
    
    if (glassNodeAsset && mapping?.glassNodeSupported) {
      console.log(`✅ Using Glassnode data for ${symbol} (no cointime metrics)`);
      result = await this.analyzeAltcoinWithGlassNode(coinId, symbol, glassNodeAsset, investmentAmount, timeHorizon, bitcoinMarketState);
    } else {
      console.log(`⚠️ Using CoinMarketCap data for ${symbol}`);
      result = await this.analyzeAltcoinWithCoinMarketCap(coinId, symbol, investmentAmount, timeHorizon, bitcoinMarketState);
    }
    
    return result;
  }
  
  private async analyzeAltcoinWithGlassNode(
    coinId: string,
    symbol: string,
    glassNodeAsset: string,
    investmentAmount: number,
    timeHorizon: number,
    bitcoinMarketState: any
  ): Promise<DirectAnalysisResult> {
    try {
      // Get current price from CoinMarketCap
      const coinPrices = await fetchCoinPrices([symbol]);
      const coinPrice = coinPrices[0];
      
      if (!coinPrice) {
        throw new Error(`Unable to fetch price for ${symbol}`);
      }
      
      // Calculate financial metrics using real Glassnode data
      const financialMetrics = await realDataFinancialCalculations.calculateRealMetrics(
        coinId,
        symbol,
        investmentAmount,
        timeHorizon,
        true
      );
      
      // Calculate accurate beta using comprehensive beta calculation service
      let betaCalculationDetails: BetaCalculationResult | undefined;
      try {
        console.log(`🔄 Calculating comprehensive beta for ${symbol}`);
        const betaResult = await comprehensiveBetaCalculationService.calculateComprehensiveBeta(symbol);
        if (betaResult?.beta && !isNaN(betaResult.beta)) {
          financialMetrics.beta = betaResult.beta;
          betaCalculationDetails = betaResult;
          console.log(`✅ Updated beta for ${symbol}: ${betaResult.beta.toFixed(3)}`);
        }
      } catch (betaError) {
        console.warn(`⚠️ Comprehensive beta calculation failed for ${symbol}, using fallback:`, betaError);
      }
      
      // Calculate comprehensive CAGR for detailed analysis
      let cagrCalculationDetails: CAGRCalculationResult | undefined;
      try {
        cagrCalculationDetails = await comprehensiveCAGRCalculationService.calculateComprehensiveCAGR(coinId);
        console.log('✅ Detailed CAGR calculation completed');
      } catch (error) {
        console.warn('⚠️ Detailed CAGR calculation failed, continuing without it:', error);
      }
      
      // Generate altcoin recommendation (no cointime metrics)
      const recommendation = this.generateAltcoinRecommendation(
        financialMetrics,
        bitcoinMarketState,
        coinPrice.market_cap
      );
      
      console.log(`✅ Altcoin analysis completed with Glassnode data for ${symbol}`);
      
      return {
        coinId,
        symbol,
        name: coinPrice.name,
        isBitcoin: false,
        dataSource: 'glassnode',
        hasRealData: true,
        currentPrice: coinPrice.current_price,
        priceChange24h: coinPrice.price_change_percentage_24h || 0,
        marketCap: coinPrice.market_cap,
        financialMetrics: {
          npv: financialMetrics.npv,
          irr: financialMetrics.irr,
          cagr: financialMetrics.cagr,
          roi: financialMetrics.roi,
          volatility: financialMetrics.volatility,
          beta: financialMetrics.beta,
          sharpeRatio: financialMetrics.sharpeRatio
        },
        bitcoinMarketState: {
          condition: bitcoinMarketState.condition,
          confidence: bitcoinMarketState.confidence,
          summary: bitcoinMarketState.summary
        },
        recommendation,
        betaCalculationDetails,
        cagrCalculationDetails,
        dataQuality: {
          score: financialMetrics.confidenceScore,
          source: 'Glassnode + CoinMarketCap',
          freshness: 'Real-time'
        },
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Glassnode altcoin analysis failed for ${symbol}:`, error);
      // Fallback to CoinMarketCap
      return this.analyzeAltcoinWithCoinMarketCap(coinId, symbol, investmentAmount, timeHorizon, bitcoinMarketState);
    }
  }
  
  private async analyzeAltcoinWithCoinMarketCap(
    coinId: string,
    symbol: string,
    investmentAmount: number,
    timeHorizon: number,
    bitcoinMarketState: any
  ): Promise<DirectAnalysisResult> {
    try {
      const coinPrices = await fetchCoinPrices([symbol]);
      const coinPrice = coinPrices[0];
      
      if (!coinPrice) {
        throw new Error(`Unable to fetch price for ${symbol}`);
      }
      
      // Calculate financial metrics using CoinMarketCap data
      const financialMetrics = await realDataFinancialCalculations.calculateRealMetrics(
        coinId,
        symbol,
        investmentAmount,
        timeHorizon,
        false
      );
      
      // Calculate accurate beta using comprehensive beta calculation service
      let betaCalculationDetails: BetaCalculationResult | undefined;
      try {
        console.log(`🔄 Calculating comprehensive beta for ${symbol}`);
        const betaResult = await comprehensiveBetaCalculationService.calculateComprehensiveBeta(symbol);
        if (betaResult?.beta && !isNaN(betaResult.beta)) {
          financialMetrics.beta = betaResult.beta;
          betaCalculationDetails = betaResult;
          console.log(`✅ Updated beta for ${symbol}: ${betaResult.beta.toFixed(3)}`);
        }
      } catch (betaError) {
        console.warn(`⚠️ Comprehensive beta calculation failed for ${symbol}, using fallback:`, betaError);
      }
      
      // Calculate comprehensive CAGR for detailed analysis
      let cagrCalculationDetails: CAGRCalculationResult | undefined;
      try {
        console.log(`🔄 Calculating CAGR for ${symbol} using coinId: ${coinId}`);
        cagrCalculationDetails = await comprehensiveCAGRCalculationService.calculateComprehensiveCAGR(coinId);
        console.log('✅ Detailed CAGR calculation completed');
      } catch (error) {
        console.warn('⚠️ Detailed CAGR calculation failed, continuing without it:', error);
      }
      
      // Generate conservative altcoin recommendation
      const recommendation = this.generateAltcoinRecommendation(
        financialMetrics,
        bitcoinMarketState,
        coinPrice.market_cap
      );
      
      console.log(`⚠️ Altcoin analysis completed with CoinMarketCap data for ${symbol}`);
      
      return {
        coinId,
        symbol,
        name: coinPrice.name,
        isBitcoin: false,
        dataSource: 'coinmarketcap',
        hasRealData: false,
        currentPrice: coinPrice.current_price,
        priceChange24h: coinPrice.price_change_percentage_24h || 0,
        marketCap: coinPrice.market_cap,
        financialMetrics: {
          npv: financialMetrics.npv,
          irr: financialMetrics.irr,
          cagr: financialMetrics.cagr,
          roi: financialMetrics.roi,
          volatility: financialMetrics.volatility,
          beta: financialMetrics.beta,
          sharpeRatio: financialMetrics.sharpeRatio
        },
        bitcoinMarketState: {
          condition: bitcoinMarketState.condition,
          confidence: bitcoinMarketState.confidence,
          summary: bitcoinMarketState.summary
        },
        recommendation,
        betaCalculationDetails,
        cagrCalculationDetails,
        dataQuality: {
          score: financialMetrics.confidenceScore,
          source: 'CoinMarketCap only',
          freshness: 'Real-time'
        },
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ CoinMarketCap altcoin analysis failed for ${symbol}:`, error);
      throw error;
    }
  }
  
  private generateAltcoinRecommendation(
    financialMetrics: any,
    bitcoinMarketState: any,
    marketCap: number
  ) {
    const reasoning: string[] = [];
    const riskWarnings: string[] = [];
    
    let action: 'Buy' | 'Hold' | 'Sell' | 'Not Recommended' = 'Hold';
    let confidence = 40; // Lower base confidence for altcoins
    
    // Financial metrics analysis
    if (financialMetrics.npv > 0) {
      reasoning.push(`Positive NPV of $${financialMetrics.npv.toLocaleString()} indicates investment potential`);
      confidence += 10;
    }
    
    if (financialMetrics.cagr > 20) {
      reasoning.push(`Strong historical performance with ${financialMetrics.cagr.toFixed(1)}% CAGR`);
      confidence += 15;
      if (action === 'Hold') action = 'Buy';
    }
    
    // Market cap considerations
    if (marketCap > 1000000000) {
      reasoning.push(`Large market cap ($${(marketCap / 1000000000).toFixed(1)}B) provides some stability`);
      confidence += 10;
    } else if (marketCap < 100000000) {
      riskWarnings.push(`Small market cap ($${(marketCap / 1000000).toFixed(1)}M) - high volatility risk`);
      confidence -= 10;
    }
    
    // Bitcoin market context
    if (bitcoinMarketState.condition === 'bullish') {
      reasoning.push(`Bitcoin bullish trend supports altcoin investment timing`);
      confidence += 8;
    } else if (bitcoinMarketState.condition === 'bearish') {
      riskWarnings.push(`Bitcoin bearish trend may negatively impact altcoin performance`);
      confidence -= 8;
      if (action === 'Buy') action = 'Hold';
    }
    
    // Risk warnings
    if (financialMetrics.volatility > 80) {
      riskWarnings.push(`High volatility (${financialMetrics.volatility.toFixed(1)}%) - significant price swings expected`);
      confidence -= 10;
    }
    
    if (financialMetrics.beta > 1.5) {
      riskWarnings.push(`High beta (${financialMetrics.beta.toFixed(2)}) - more volatile than market average`);
      confidence -= 5;
    }
    
    // Data source warning
    if (financialMetrics.dataSource === 'coinmarketcap') {
      riskWarnings.push(`Limited on-chain data available - analysis based on price action only`);
      confidence -= 5;
    }
    
    confidence = Math.min(85, Math.max(20, confidence)); // Cap altcoin confidence lower than Bitcoin
    
    return {
      action,
      confidence,
      reasoning,
      riskWarnings
    };
  }
  
  private isBitcoinSymbol(symbol: string): boolean {
    const btcSymbols = ['BTC', 'BITCOIN', 'bitcoin', 'btc'];
    return btcSymbols.includes(symbol.toUpperCase()) || btcSymbols.includes(symbol.toLowerCase());
  }
}

export const directApiAnalysisService = new DirectApiAnalysisService();
