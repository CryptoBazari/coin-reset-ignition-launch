
import { supabase } from '@/integrations/supabase/client';
import { mockGlassNodeService } from './mockGlassNodeService';

class TestDataDatabasePopulator {
  
  /**
   * Populate the database with realistic test data
   */
  async populateTestData(): Promise<void> {
    console.log('🗄️ Starting test data population...');
    
    try {
      await this.populateCoinsTable();
      await this.populatePriceHistoryTable();
      await this.populateCointimeMetricsTable();
      
      console.log('✅ Test data population completed successfully');
    } catch (error) {
      console.error('❌ Test data population failed:', error);
      throw error;
    }
  }
  
  private async populateCoinsTable(): Promise<void> {
    const testCoins = [
      { coinId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', basket: 'bitcoin' },
      { coinId: 'ethereum', symbol: 'ETH', name: 'Ethereum', basket: 'blue_chip' },
      { coinId: 'solana', symbol: 'SOL', name: 'Solana', basket: 'small_cap' },
      { coinId: 'cardano', symbol: 'ADA', name: 'Cardano', basket: 'small_cap' },
      { coinId: 'chainlink', symbol: 'LINK', name: 'Chainlink', basket: 'small_cap' },
      { coinId: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', basket: 'small_cap' }
    ];
    
    for (const coin of testCoins) {
      const testData = mockGlassNodeService.getTestData(coin.symbol);
      if (!testData) continue;
      
      const coinRecord = {
        coin_id: coin.coinId,
        name: coin.name,
        basket: coin.basket,
        current_price: testData.currentPrice,
        market_cap: testData.marketCap,
        price_history: JSON.stringify(testData.priceHistory.slice(-365)), // Last year
        cagr_36m: this.calculateCAGR(testData.priceHistory),
        volatility: testData.volatility,
        aviv_ratio: testData.avivRatio,
        active_supply: testData.activeSupply,
        vaulted_supply: testData.vaultedSupply,
        glass_node_supported: true,
        premium_metrics_available: true,
        api_status: 'healthy',
        last_glass_node_update: new Date().toISOString(),
        data_quality_score: 85,
        calculation_data_source: 'test_data',
        confidence_level: 'high',
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('coins')
        .upsert(coinRecord, { onConflict: 'coin_id' });
      
      if (error) {
        console.error(`Failed to upsert coin ${coin.coinId}:`, error);
      } else {
        console.log(`✅ Updated coin record for ${coin.symbol}`);
      }
    }
  }
  
  private async populatePriceHistoryTable(): Promise<void> {
    const testCoins = ['BTC', 'ETH', 'SOL', 'ADA', 'LINK', 'AVAX'];
    const coinIdMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum', 
      'SOL': 'solana',
      'ADA': 'cardano',
      'LINK': 'chainlink',
      'AVAX': 'avalanche-2'
    };
    
    for (const symbol of testCoins) {
      const testData = mockGlassNodeService.getTestData(symbol);
      const coinId = coinIdMap[symbol as keyof typeof coinIdMap];
      
      if (!testData || !coinId) continue;
      
      const priceEntries = testData.priceHistory.map(point => ({
        coin_id: coinId,
        price_date: new Date(point.timestamp * 1000).toISOString().split('T')[0],
        price_usd: point.price,
        volume_24h: point.volume,
        market_cap: point.market_cap,
        data_source: 'test_data'
      }));
      
      // Insert in batches of 100 to avoid query limits
      const batchSize = 100;
      for (let i = 0; i < priceEntries.length; i += batchSize) {
        const batch = priceEntries.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('price_history_36m')
          .upsert(batch, { onConflict: 'coin_id,price_date' });
        
        if (error) {
          console.error(`Failed to insert price history batch for ${symbol}:`, error);
        }
      }
      
      console.log(`✅ Inserted ${priceEntries.length} price history entries for ${symbol}`);
    }
  }
  
  private async populateCointimeMetricsTable(): Promise<void> {
    const testCoins = ['BTC', 'ETH', 'SOL', 'ADA', 'LINK', 'AVAX'];
    const coinIdMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana', 
      'ADA': 'cardano',
      'LINK': 'chainlink',
      'AVAX': 'avalanche-2'
    };
    
    for (const symbol of testCoins) {
      const testData = mockGlassNodeService.getTestData(symbol);
      const coinId = coinIdMap[symbol as keyof typeof coinIdMap];
      
      if (!testData || !coinId) continue;
      
      // Generate cointime metrics for the last 30 days
      const cointimeEntries = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const baseMetrics = {
          coin_id: coinId,
          metric_date: date.toISOString().split('T')[0],
          aviv_ratio: testData.avivRatio + (Math.random() - 0.5) * 0.1,
          active_supply_pct: testData.activeSupply + (Math.random() - 0.5) * 5,
          vaulted_supply_pct: testData.vaultedSupply + (Math.random() - 0.5) * 5,
          liquid_supply_pct: testData.liquidSupply + (Math.random() - 0.5) * 5,
          cointime_destroyed: 1000000 + Math.random() * 500000,
          cointime_created: 800000 + Math.random() * 400000,
          data_source: 'test_data',
          confidence_score: 85
        };
        
        cointimeEntries.push(baseMetrics);
      }
      
      const { error } = await supabase
        .from('cointime_metrics')
        .upsert(cointimeEntries, { onConflict: 'coin_id,metric_date' });
      
      if (error) {
        console.error(`Failed to insert cointime metrics for ${symbol}:`, error);
      } else {
        console.log(`✅ Inserted ${cointimeEntries.length} cointime metrics for ${symbol}`);
      }
    }
  }
  
  private calculateCAGR(priceHistory: any[]): number {
    if (priceHistory.length < 2) return 0;
    
    const startPrice = priceHistory[0].price;
    const endPrice = priceHistory[priceHistory.length - 1].price;
    const years = (priceHistory[priceHistory.length - 1].timestamp - priceHistory[0].timestamp) / (365.25 * 24 * 60 * 60);
    
    if (years <= 0 || startPrice <= 0) return 0;
    
    const cagr = (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
    return Math.max(-80, Math.min(500, cagr));
  }
}

export const testDataDatabasePopulator = new TestDataDatabasePopulator();
