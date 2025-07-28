import { fetchGlassNodeMetric, GLASS_NODE_METRICS } from '@/services/glassNodeService';
import { fetchCoinPrices, CoinMarketCapCoin } from '@/services/coinMarketCapService';
import { symbolMappingService } from '@/services/symbolMappingService';
import { bitcoinAnalysisService } from '@/services/bitcoinAnalysisService';
import { realDataFinancialCalculations } from '@/services/realDataFinancialCalculations';
import { bitcoinMarketAnalyzer } from '@/services/bitcoinMarketAnalyzer';
import { comprehensiveBetaCalculationService, type BetaCalculationResult } from '@/services/comprehensiveBetaCalculationService';
import { standaloneCAGRCalculationService, type StandaloneCAGRResult } from '@/services/standaloneCAGRCalculationService';
import { hybridNPVCalculationService, type NPVCalculationResult } from '@/services/hybridNPVCalculationService';

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
  
  // CAGR calculation details (enhanced for Hybrid Analyzer)
  cagrCalculationDetails?: StandaloneCAGRResult;
  
  // Bitcoin-specific cointime metrics (only for Bitcoin)
  cointimeMetrics?: {
    avivRatio: number;
    activeSupply: number;
    vaultedSupply: number;
    cointimeDestroyed: number;
    stockToFlowRatio: number;
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
  
  // NPV calculation details (enhanced comprehensive NPV)
  npvCalculationDetails?: NPVCalculationResult;
  
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
    console.log(`🔄 Starting enhanced hybrid analysis for ${symbol} (${coinId})`);
    
    const isBitcoin = this.isBitcoinSymbol(symbol);
    
    // Always get Bitcoin market state for context
    const bitcoinMarketState = await bitcoinMarketAnalyzer.getBitcoinMarketState();
    
    if (isBitcoin) {
      console.log('🟠 Detected Bitcoin - using full cointime analysis with enhanced CAGR calculation');
      return this.analyzeBitcoinWithEnhancedCAGR(coinId, symbol, investmentAmount, timeHorizon, bitcoinMarketState);
    } else {
      console.log('🔵 Detected altcoin - using enhanced financial analysis with robust CAGR calculation');
      return this.analyzeAltcoinWithEnhancedCAGR(coinId, symbol, investmentAmount, timeHorizon, bitcoinMarketState);
    }
  }

  /**
   * Calculate comprehensive NPV with advanced beta integration
   */
  async calculateNPVWithAdvancedBeta(
    coinId: string,
    symbol: string,
    investmentAmount: number,
    timeHorizon: number,
    advancedBeta?: number
  ): Promise<NPVCalculationResult> {
    console.log(`💰 Calculating comprehensive NPV for ${symbol.toUpperCase()}`);
    console.log(`   Investment: $${investmentAmount}, Horizon: ${timeHorizon} years`);
    console.log(`   Advanced Beta: ${advancedBeta ? advancedBeta.toFixed(3) : 'None provided'}`);

    try {
      // Use hybrid NPV service for comprehensive calculation
      const npvResult = await hybridNPVCalculationService.calculateHybridNPV(
        symbol,
        investmentAmount,
        timeHorizon,
        advancedBeta
      );

      console.log(`✅ NPV calculation completed: $${npvResult.npv.toFixed(2)}`);
      console.log(`   IRR: ${(npvResult.irr * 100).toFixed(2)}%`);
      console.log(`   Benchmark: ${npvResult.benchmark}`);
      console.log(`   Confidence: ${npvResult.confidenceScore}%`);

      return npvResult;
    } catch (error) {
      console.warn('⚠️ Hybrid NPV calculation failed, attempting local fallback:', error);
      
      // Fallback to local calculation
      return await hybridNPVCalculationService.calculateLocalNPV(
        symbol,
        investmentAmount,
        timeHorizon,
        advancedBeta
      );
    }
  }
  
  private async analyzeBitcoinWithEnhancedCAGR(
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
      
      // Enhanced Standalone CAGR calculation with advanced volatility adjustment
      console.log('📊 Calculating standalone CAGR with volatility adjustment and liquidity analysis...');
      const cagrCalculationDetails = await standaloneCAGRCalculationService.calculateStandaloneCAGR(
        coinId, 
        symbol, 
        3 // 3 years of data for Bitcoin analysis
      );
      console.log(`✅ Standalone CAGR calculation completed: Basic ${cagrCalculationDetails.basic.toFixed(2)}%, Adjusted ${cagrCalculationDetails.adjusted.toFixed(2)}% (${cagrCalculationDetails.dataSource})`);
      console.log(`📈 Data points used: ${cagrCalculationDetails.dataPoints} from ${cagrCalculationDetails.dataSource}, Liquidity: ${cagrCalculationDetails.liquidityStatus}`);
      
      // Use Bitcoin analysis service for comprehensive analysis
      const bitcoinAnalysis = await bitcoinAnalysisService.analyzeBitcoinInvestment(
        investmentAmount,
        timeHorizon
      );
      
      // Always update CAGR with standalone adjusted calculation
      bitcoinAnalysis.financialMetrics.cagr = cagrCalculationDetails.adjusted;
      console.log(`🔄 Updated Bitcoin CAGR from standalone calculation: Basic ${cagrCalculationDetails.basic.toFixed(2)}%, Adjusted ${cagrCalculationDetails.adjusted.toFixed(2)}%`);
      
      // Get comprehensive beta calculation details for Bitcoin
      console.log('🔄 Calculating detailed beta analysis for Bitcoin...');
      let betaCalculationDetails: BetaCalculationResult | undefined;
      try {
        betaCalculationDetails = await comprehensiveBetaCalculationService.calculateComprehensiveBeta('BTC');
        console.log('✅ Detailed beta calculation completed for Bitcoin');
      } catch (error) {
        console.warn('⚠️ Detailed beta calculation failed for Bitcoin, continuing without it:', error);
      }
      
      console.log('✅ Enhanced Bitcoin analysis completed with robust CAGR calculation');
      
      return {
        coinId,
        symbol,
        name: coinPrice.name,
        isBitcoin: true,
        dataSource: cagrCalculationDetails.dataSource === 'glassnode' ? 'glassnode' : 'coinmarketcap',
        hasRealData: cagrCalculationDetails.dataSource !== 'test_data',
        currentPrice: coinPrice.current_price,
        priceChange24h: coinPrice.price_change_percentage_24h || 0,
        marketCap: coinPrice.market_cap,
        financialMetrics: bitcoinAnalysis.financialMetrics,
        cagrCalculationDetails, // Enhanced CAGR calculation details
        cointimeMetrics: {
          avivRatio: bitcoinAnalysis.cointimeMetrics.avivRatio,
          activeSupply: bitcoinAnalysis.cointimeMetrics.activeSupply,
          vaultedSupply: bitcoinAnalysis.cointimeMetrics.vaultedSupply,
          cointimeDestroyed: bitcoinAnalysis.cointimeMetrics.cointimeDestroyed,
          stockToFlowRatio: bitcoinAnalysis.cointimeMetrics.stockToFlowRatio,
          liquidSupply: bitcoinAnalysis.cointimeMetrics.liquidSupply
        },
        bitcoinMarketState: {
          condition: bitcoinMarketState.condition,
          confidence: bitcoinMarketState.confidence,
          summary: bitcoinMarketState.summary
        },
        recommendation: bitcoinAnalysis.recommendation,
        betaCalculationDetails,
        dataQuality: bitcoinAnalysis.dataQuality,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Enhanced Bitcoin analysis failed:`, error);
      throw error;
    }
  }
  
  private async analyzeAltcoinWithEnhancedCAGR(
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
      console.log(`✅ Using Glassnode data for ${symbol} with enhanced CAGR calculation`);
      result = await this.analyzeAltcoinWithGlassNodeEnhanced(coinId, symbol, glassNodeAsset, investmentAmount, timeHorizon, bitcoinMarketState);
    } else {
      console.log(`⚠️ Using CoinMarketCap data for ${symbol} with enhanced CAGR calculation`);
      result = await this.analyzeAltcoinWithCoinMarketCapEnhanced(coinId, symbol, investmentAmount, timeHorizon, bitcoinMarketState);
    }
    
    return result;
  }
  
  private async analyzeAltcoinWithGlassNodeEnhanced(
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
      
      // Enhanced Standalone CAGR calculation with advanced volatility adjustment
      console.log(`📊 Calculating standalone CAGR with volatility adjustment for altcoin ${symbol}...`);
      const cagrCalculationDetails = await standaloneCAGRCalculationService.calculateStandaloneCAGR(
        coinId, 
        symbol, 
        3 // 3 years of data for altcoin analysis
      );
      console.log(`✅ Standalone CAGR calculation completed for ${symbol}: Basic ${cagrCalculationDetails.basic.toFixed(2)}%, Adjusted ${cagrCalculationDetails.adjusted.toFixed(2)}% (${cagrCalculationDetails.dataSource})`);
      console.log(`📈 Data points used: ${cagrCalculationDetails.dataPoints} from ${cagrCalculationDetails.dataSource}, Liquidity: ${cagrCalculationDetails.liquidityStatus}`);
      
      // Calculate financial metrics using real Glassnode data
      const financialMetrics = await realDataFinancialCalculations.calculateRealMetrics(
        coinId,
        symbol,
        investmentAmount,
        timeHorizon,
        true
      );
      
      // Always update CAGR with standalone adjusted calculation
      financialMetrics.cagr = cagrCalculationDetails.adjusted;
      console.log(`🔄 Updated ${symbol} CAGR from standalone calculation: Basic ${cagrCalculationDetails.basic.toFixed(2)}%, Adjusted ${cagrCalculationDetails.adjusted.toFixed(2)}%`);
      
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
      
      // Generate altcoin recommendation
      const recommendation = this.generateAltcoinRecommendation(
        financialMetrics,
        bitcoinMarketState,
        coinPrice.market_cap,
        cagrCalculationDetails.dataSource
      );
      
      console.log(`✅ Enhanced altcoin analysis completed with robust CAGR for ${symbol}`);
      
      return {
        coinId,
        symbol,
        name: coinPrice.name,
        isBitcoin: false,
        dataSource: cagrCalculationDetails.dataSource === 'glassnode' ? 'glassnode' : 'coinmarketcap',
        hasRealData: cagrCalculationDetails.dataSource !== 'test_data',
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
        cagrCalculationDetails, // Enhanced CAGR calculation details
        bitcoinMarketState: {
          condition: bitcoinMarketState.condition,
          confidence: bitcoinMarketState.confidence,
          summary: bitcoinMarketState.summary
        },
        recommendation,
        betaCalculationDetails,
        dataQuality: {
          score: financialMetrics.confidenceScore,
          source: `Enhanced ${cagrCalculationDetails.dataSource} + CoinMarketCap`,
          freshness: 'Real-time'
        },
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Enhanced Glassnode altcoin analysis failed for ${symbol}:`, error);
      // Fallback to CoinMarketCap
      return this.analyzeAltcoinWithCoinMarketCapEnhanced(coinId, symbol, investmentAmount, timeHorizon, bitcoinMarketState);
    }
  }
  
  private async analyzeAltcoinWithCoinMarketCapEnhanced(
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
      
      // Enhanced Standalone CAGR calculation with fallback handling
      console.log(`📊 Calculating standalone CAGR with volatility adjustment for altcoin ${symbol} (CoinMarketCap fallback)...`);
      const cagrCalculationDetails = await standaloneCAGRCalculationService.calculateStandaloneCAGR(
        coinId, 
        symbol, 
        3 // 3 years of data
      );
      console.log(`✅ Standalone CAGR calculation completed for ${symbol}: Basic ${cagrCalculationDetails.basic.toFixed(2)}%, Adjusted ${cagrCalculationDetails.adjusted.toFixed(2)}% (${cagrCalculationDetails.dataSource})`);
      console.log(`📈 Data points used: ${cagrCalculationDetails.dataPoints} from ${cagrCalculationDetails.dataSource}, Liquidity: ${cagrCalculationDetails.liquidityStatus}`);
      
      // Calculate financial metrics using CoinMarketCap data
      const financialMetrics = await realDataFinancialCalculations.calculateRealMetrics(
        coinId,
        symbol,
        investmentAmount,
        timeHorizon,
        false
      );
      
      // Always update CAGR with standalone adjusted calculation
      financialMetrics.cagr = cagrCalculationDetails.adjusted;
      console.log(`🔄 Updated ${symbol} CAGR from standalone calculation: Basic ${cagrCalculationDetails.basic.toFixed(2)}%, Adjusted ${cagrCalculationDetails.adjusted.toFixed(2)}%`);
      
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
      
      // Generate conservative altcoin recommendation
      const recommendation = this.generateAltcoinRecommendation(
        financialMetrics,
        bitcoinMarketState,
        coinPrice.market_cap,
        cagrCalculationDetails.dataSource
      );
      
      console.log(`⚠️ Enhanced altcoin analysis completed with CoinMarketCap data for ${symbol}`);
      
      return {
        coinId,
        symbol,
        name: coinPrice.name,
        isBitcoin: false,
        dataSource: 'coinmarketcap',
        hasRealData: cagrCalculationDetails.dataSource !== 'test_data',
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
        cagrCalculationDetails, // Enhanced CAGR calculation details
        bitcoinMarketState: {
          condition: bitcoinMarketState.condition,
          confidence: bitcoinMarketState.confidence,
          summary: bitcoinMarketState.summary
        },
        recommendation,
        betaCalculationDetails,
        dataQuality: {
          score: financialMetrics.confidenceScore,
          source: `Enhanced ${cagrCalculationDetails.dataSource} + CoinMarketCap`,
          freshness: 'Real-time'
        },
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Enhanced CoinMarketCap altcoin analysis failed for ${symbol}:`, error);
      throw error;
    }
  }
  
  private generateAltcoinRecommendation(
    financialMetrics: any,
    bitcoinMarketState: any,
    marketCap: number,
    dataSource?: string
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
    if (dataSource === 'test_data') {
      riskWarnings.push(`Analysis based on realistic test data - live API data unavailable`);
      confidence -= 10;
    } else if (dataSource === 'database') {
      riskWarnings.push(`Analysis based on historical database data - may not reflect current market conditions`);
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
