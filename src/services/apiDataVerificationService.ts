
import { supabase } from '@/integrations/supabase/client';
import { fetchCoinPrices } from './coinMarketCapService';
import { fetchEconomicIndicators } from './fredService';
import { fetchGlassNodeMetric, GLASS_NODE_METRICS } from './glassNodeService';

interface APIEndpointStatus {
  endpoint: string;
  status: 'active' | 'inactive' | 'error';
  lastCalled: string;
  dataPoints: number;
  source: 'real' | 'estimated' | 'fallback';
}

interface DataVerificationResult {
  coinId: string;
  priceData: {
    source: 'coinmarketcap' | 'coingecko' | 'fallback';
    dataPoints: number;
    isReal: boolean;
  };
  glassNodeData: {
    avivRatio: { source: string; isReal: boolean };
    activeSupply: { source: string; isReal: boolean };
    vaultedSupply: { source: string; isReal: boolean };
  };
  economicData: {
    fedRate: { source: string; isReal: boolean };
    treasuryYield: { source: string; isReal: boolean };
  };
  calculatedMetrics: {
    beta: { source: string; isReal: boolean; value: number };
    volatility: { source: string; isReal: boolean; value: number };
    cagr: { source: string; isReal: boolean; value: number };
    sharpeRatio: { source: string; isReal: boolean; value: number };
  };
  overallDataQuality: number;
  issues: string[];
  recommendations: string[];
}

class APIDataVerificationService {
  
  async verifyRealDataUsage(coinId: string): Promise<DataVerificationResult> {
    const result: DataVerificationResult = {
      coinId,
      priceData: { source: 'fallback', dataPoints: 0, isReal: false },
      glassNodeData: {
        avivRatio: { source: 'estimated', isReal: false },
        activeSupply: { source: 'estimated', isReal: false },
        vaultedSupply: { source: 'estimated', isReal: false }
      },
      economicData: {
        fedRate: { source: 'estimated', isReal: false },
        treasuryYield: { source: 'estimated', isReal: false }
      },
      calculatedMetrics: {
        beta: { source: 'estimated', isReal: false, value: 0 },
        volatility: { source: 'estimated', isReal: false, value: 0 },
        cagr: { source: 'estimated', isReal: false, value: 0 },
        sharpeRatio: { source: 'estimated', isReal: false, value: 0 }
      },
      overallDataQuality: 0,
      issues: [],
      recommendations: []
    };

    // 1. Verify price data source
    await this.verifyPriceDataSource(coinId, result);
    
    // 2. Verify Glass Node data
    await this.verifyGlassNodeData(coinId, result);
    
    // 3. Verify economic data
    await this.verifyEconomicData(result);
    
    // 4. Verify calculated metrics
    await this.verifyCalculatedMetrics(coinId, result);
    
    // 5. Calculate overall quality and provide recommendations
    this.calculateOverallQuality(result);
    
    return result;
  }

  private async verifyPriceDataSource(coinId: string, result: DataVerificationResult): Promise<void> {
    try {
      // Check if we're using CoinMarketCap API
      const symbol = this.getCoinSymbol(coinId);
      const coinData = await fetchCoinPrices([symbol]);
      
      if (coinData && coinData.length > 0) {
        result.priceData = {
          source: 'coinmarketcap',
          dataPoints: coinData.length,
          isReal: true
        };
        console.log(`✅ ${coinId}: Using real price data from CoinMarketCap`);
      } else {
        result.priceData = {
          source: 'fallback',
          dataPoints: 0,
          isReal: false
        };
        result.issues.push('Price data not available from CoinMarketCap API');
      }
    } catch (error) {
      result.priceData = {
        source: 'fallback',
        dataPoints: 0,
        isReal: false
      };
      result.issues.push(`Price data API error: ${error.message}`);
    }
  }

  private async verifyGlassNodeData(coinId: string, result: DataVerificationResult): Promise<void> {
    try {
      const coinSymbol = this.getCoinSymbol(coinId);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Test AVIV ratio
      try {
        const avivData = await fetchGlassNodeMetric(GLASS_NODE_METRICS.AVIV, coinSymbol, since);
        if (avivData && avivData.length > 0) {
          result.glassNodeData.avivRatio = {
            source: 'glassnode_api',
            isReal: true
          };
          console.log(`✅ ${coinId}: Using real AVIV ratio from Glass Node`);
        } else {
          result.glassNodeData.avivRatio = {
            source: 'estimated',
            isReal: false
          };
          result.issues.push('AVIV ratio not available from Glass Node');
        }
      } catch (error) {
        result.glassNodeData.avivRatio = {
          source: 'estimated',
          isReal: false
        };
        result.issues.push(`AVIV ratio API error: ${error.message}`);
      }
      
      // Test Liquid Supply
      try {
        const liquidData = await fetchGlassNodeMetric(GLASS_NODE_METRICS.LIQUID_SUPPLY, coinSymbol, since);
        if (liquidData && liquidData.length > 0) {
          result.glassNodeData.activeSupply = {
            source: 'glassnode_api',
            isReal: true
          };
          console.log(`✅ ${coinId}: Using real liquid supply from Glass Node`);
        } else {
          result.glassNodeData.activeSupply = {
            source: 'estimated',
            isReal: false
          };
          result.issues.push('Liquid supply not available from Glass Node');
        }
      } catch (error) {
        result.glassNodeData.activeSupply = {
          source: 'estimated',
          isReal: false
        };
        result.issues.push(`Liquid supply API error: ${error.message}`);
      }
      
      // Test Illiquid Supply
      try {
        const illiquidData = await fetchGlassNodeMetric(GLASS_NODE_METRICS.ILLIQUID_SUPPLY, coinSymbol, since);
        if (illiquidData && illiquidData.length > 0) {
          result.glassNodeData.vaultedSupply = {
            source: 'glassnode_api',
            isReal: true
          };
          console.log(`✅ ${coinId}: Using real illiquid supply from Glass Node`);
        } else {
          result.glassNodeData.vaultedSupply = {
            source: 'estimated',
            isReal: false
          };
          result.issues.push('Illiquid supply not available from Glass Node');
        }
      } catch (error) {
        result.glassNodeData.vaultedSupply = {
          source: 'estimated',
          isReal: false
        };
        result.issues.push(`Illiquid supply API error: ${error.message}`);
      }
      
    } catch (error) {
      result.issues.push(`Glass Node data verification failed: ${error.message}`);
    }
  }

  private async verifyEconomicData(result: DataVerificationResult): Promise<void> {
    try {
      const economicData = await fetchEconomicIndicators();
      
      // Check Fed Funds Rate
      if (economicData.fedFundsRate && economicData.fedFundsRate.length > 0) {
        result.economicData.fedRate = {
          source: 'fred_api',
          isReal: true
        };
        console.log('✅ Using real Fed Funds Rate from FRED API');
      } else {
        result.economicData.fedRate = {
          source: 'estimated',
          isReal: false
        };
        result.issues.push('Fed Funds Rate not available from FRED API');
      }
      
      // Check Treasury Yield
      if (economicData.treasuryYield10Y && economicData.treasuryYield10Y.length > 0) {
        result.economicData.treasuryYield = {
          source: 'fred_api',
          isReal: true
        };
        console.log('✅ Using real Treasury Yield from FRED API');
      } else {
        result.economicData.treasuryYield = {
          source: 'estimated',
          isReal: false
        };
        result.issues.push('Treasury Yield not available from FRED API');
      }
      
    } catch (error) {
      result.issues.push(`Economic data verification failed: ${error.message}`);
    }
  }

  private async verifyCalculatedMetrics(coinId: string, result: DataVerificationResult): Promise<void> {
    try {
      // Get coin data from database to check calculation sources
      const { data: coin } = await supabase
        .from('coins')
        .select('beta, beta_data_source, volatility, cagr_36m, sharpe_ratio')
        .eq('coin_id', coinId)
        .single();
      
      if (coin) {
        // Beta verification
        result.calculatedMetrics.beta = {
          source: coin.beta_data_source || 'estimated',
          isReal: coin.beta_data_source === 'real' || coin.beta_data_source === 'alpha_vantage',
          value: coin.beta || 0
        };
        
        // Volatility verification
        result.calculatedMetrics.volatility = {
          source: coin.volatility ? 'calculated' : 'estimated',
          isReal: coin.volatility ? true : false,
          value: coin.volatility || 0
        };
        
        // CAGR verification
        result.calculatedMetrics.cagr = {
          source: coin.cagr_36m ? 'calculated' : 'estimated',
          isReal: coin.cagr_36m ? true : false,
          value: coin.cagr_36m || 0
        };
        
        // Sharpe Ratio verification
        result.calculatedMetrics.sharpeRatio = {
          source: coin.sharpe_ratio ? 'calculated' : 'estimated',
          isReal: coin.sharpe_ratio ? true : false,
          value: coin.sharpe_ratio || 0
        };
        
        // Check if beta is in realistic range
        if (coin.beta && (coin.beta < 0.5 || coin.beta > 3.0)) {
          result.issues.push(`Beta value ${coin.beta} is outside realistic range (0.5-3.0)`);
        }
        
        console.log(`✅ ${coinId}: Calculated metrics verification complete`);
      } else {
        result.issues.push('Coin not found in database');
      }
      
    } catch (error) {
      result.issues.push(`Calculated metrics verification failed: ${error.message}`);
    }
  }

  private calculateOverallQuality(result: DataVerificationResult): void {
    let qualityScore = 0;
    let maxScore = 0;
    
    // Price data (25% weight)
    maxScore += 25;
    if (result.priceData.isReal) qualityScore += 25;
    
    // Glass Node data (30% weight)
    maxScore += 30;
    if (result.glassNodeData.avivRatio.isReal) qualityScore += 10;
    if (result.glassNodeData.activeSupply.isReal) qualityScore += 10;
    if (result.glassNodeData.vaultedSupply.isReal) qualityScore += 10;
    
    // Economic data (20% weight)
    maxScore += 20;
    if (result.economicData.fedRate.isReal) qualityScore += 10;
    if (result.economicData.treasuryYield.isReal) qualityScore += 10;
    
    // Calculated metrics (25% weight)
    maxScore += 25;
    if (result.calculatedMetrics.beta.isReal) qualityScore += 8;
    if (result.calculatedMetrics.volatility.isReal) qualityScore += 6;
    if (result.calculatedMetrics.cagr.isReal) qualityScore += 6;
    if (result.calculatedMetrics.sharpeRatio.isReal) qualityScore += 5;
    
    result.overallDataQuality = Math.round((qualityScore / maxScore) * 100);
    
    // Generate recommendations
    if (result.overallDataQuality < 70) {
      result.recommendations.push('Run Real Data Pipeline to improve data quality');
    }
    
    if (!result.priceData.isReal) {
      result.recommendations.push('Configure CoinMarketCap API for real price data');
    }
    
    if (!result.glassNodeData.avivRatio.isReal) {
      result.recommendations.push('Verify Glass Node API configuration');
    }
    
    if (!result.economicData.fedRate.isReal) {
      result.recommendations.push('Configure FRED API for economic data');
    }
    
    if (result.calculatedMetrics.beta.value < 0.5 || result.calculatedMetrics.beta.value > 3.0) {
      result.recommendations.push('Recalculate beta with real market data');
    }
  }

  private getCoinSymbol(coinId: string): string {
    const symbolMap: { [key: string]: string } = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'solana': 'SOL',
      'cardano': 'ADA',
      'polkadot': 'DOT',
      'chainlink': 'LINK',
      'BTC': 'BTC',
      'ETH': 'ETH',
      'SOL': 'SOL',
      'ADA': 'ADA'
    };
    
    return symbolMap[coinId] || coinId.toUpperCase();
  }

  async getAPIEndpointStatuses(): Promise<APIEndpointStatus[]> {
    const endpoints: APIEndpointStatus[] = [];
    
    // CoinMarketCap API
    try {
      const testCoins = await fetchCoinPrices(['BTC']);
      endpoints.push({
        endpoint: 'CoinMarketCap /quotes/latest',
        status: testCoins.length > 0 ? 'active' : 'inactive',
        lastCalled: new Date().toISOString(),
        dataPoints: testCoins.length,
        source: testCoins.length > 0 ? 'real' : 'fallback'
      });
    } catch (error) {
      endpoints.push({
        endpoint: 'CoinMarketCap /quotes/latest',
        status: 'error',
        lastCalled: new Date().toISOString(),
        dataPoints: 0,
        source: 'fallback'
      });
    }
    
    // FRED API
    try {
      const economicData = await fetchEconomicIndicators();
      endpoints.push({
        endpoint: 'FRED /series/observations',
        status: economicData.fedFundsRate.length > 0 ? 'active' : 'inactive',
        lastCalled: new Date().toISOString(),
        dataPoints: economicData.fedFundsRate.length,
        source: economicData.fedFundsRate.length > 0 ? 'real' : 'fallback'
      });
    } catch (error) {
      endpoints.push({
        endpoint: 'FRED /series/observations',
        status: 'error',
        lastCalled: new Date().toISOString(),
        dataPoints: 0,
        source: 'fallback'
      });
    }
    
    // Glass Node API
    try {
      const avivData = await fetchGlassNodeMetric(GLASS_NODE_METRICS.AVIV, 'BTC', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      endpoints.push({
        endpoint: 'Glass Node /metrics/indicators/aviv',
        status: avivData.length > 0 ? 'active' : 'inactive',
        lastCalled: new Date().toISOString(),
        dataPoints: avivData.length,
        source: avivData.length > 0 ? 'real' : 'fallback'
      });
    } catch (error) {
      endpoints.push({
        endpoint: 'Glass Node /metrics/indicators/aviv',
        status: 'error',
        lastCalled: new Date().toISOString(),
        dataPoints: 0,
        source: 'fallback'
      });
    }
    
    return endpoints;
  }
}

export const apiDataVerificationService = new APIDataVerificationService();
export type { DataVerificationResult, APIEndpointStatus };
