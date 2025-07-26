
import { testDataGenerator, TestCoinData } from './testDataGenerator';

interface MockGlassNodeResponse {
  data: Array<{
    t: number;
    v: number;
    unix_timestamp?: number;
    timestamp?: string;
    value?: number;
  }>;
}

class MockGlassNodeService {
  private testDataCache = new Map<string, TestCoinData>();
  
  constructor() {
    // Pre-generate test data for supported coins
    this.initializeTestData();
  }
  
  private initializeTestData() {
    const supportedCoins = [
      { coinId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      { coinId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
      { coinId: 'solana', symbol: 'SOL', name: 'Solana' },
      { coinId: 'cardano', symbol: 'ADA', name: 'Cardano' },
      { coinId: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
      { coinId: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' }
    ];
    
    supportedCoins.forEach(coin => {
      const testData = testDataGenerator.generateCoinTestData(coin.coinId, coin.symbol, coin.name);
      this.testDataCache.set(coin.symbol, testData);
      this.testDataCache.set(coin.coinId, testData); // Store by both symbol and coinId
    });
    
    console.log('🧪 Mock Glassnode Service initialized with test data for', supportedCoins.length, 'coins');
  }
  
  /**
   * Mock the Glassnode API response format for price data
   */
  async fetchPriceData(asset: string, since?: string, until?: string): Promise<MockGlassNodeResponse> {
    console.log(`🧪 Mock fetching price data for ${asset}`);
    
    const testData = this.testDataCache.get(asset.toUpperCase()) || this.testDataCache.get(asset.toLowerCase());
    
    if (!testData) {
      throw new Error(`Mock data not available for asset: ${asset}`);
    }
    
    // Filter by date range if provided
    let priceHistory = testData.priceHistory;
    if (since || until) {
      const sinceTs = since ? new Date(since).getTime() / 1000 : 0;
      const untilTs = until ? new Date(until).getTime() / 1000 : Date.now() / 1000;
      
      priceHistory = priceHistory.filter(point => 
        point.timestamp >= sinceTs && point.timestamp <= untilTs
      );
    }
    
    const mockResponse: MockGlassNodeResponse = {
      data: priceHistory.map(point => ({
        t: point.timestamp,
        v: point.price,
        unix_timestamp: point.timestamp,
        timestamp: new Date(point.timestamp * 1000).toISOString(),
        value: point.price
      }))
    };
    
    console.log(`🧪 Mock returning ${mockResponse.data.length} price points for ${asset}`);
    return mockResponse;
  }
  
  /**
   * Mock AVIV ratio data
   */
  async fetchAvivRatio(asset: string): Promise<MockGlassNodeResponse> {
    console.log(`🧪 Mock fetching AVIV ratio for ${asset}`);
    
    const testData = this.testDataCache.get(asset.toUpperCase()) || this.testDataCache.get(asset.toLowerCase());
    
    if (!testData) {
      throw new Error(`Mock data not available for asset: ${asset}`);
    }
    
    // Generate AVIV ratio time series based on price movements
    const avivHistory = testData.priceHistory.slice(-90).map((point, index) => {
      const baseAviv = testData.avivRatio;
      const variation = Math.sin(index * 0.1) * 0.2; // Add some realistic variation
      return {
        t: point.timestamp,
        v: Math.max(0.1, baseAviv + variation),
        unix_timestamp: point.timestamp,
        timestamp: new Date(point.timestamp * 1000).toISOString(),
        value: Math.max(0.1, baseAviv + variation)
      };
    });
    
    return { data: avivHistory };
  }
  
  /**
   * Mock supply metrics (liquid/illiquid)
   */
  async fetchSupplyMetrics(asset: string, metric: 'liquid' | 'illiquid'): Promise<MockGlassNodeResponse> {
    console.log(`🧪 Mock fetching ${metric} supply for ${asset}`);
    
    const testData = this.testDataCache.get(asset.toUpperCase()) || this.testDataCache.get(asset.toLowerCase());
    
    if (!testData) {
      throw new Error(`Mock data not available for asset: ${asset}`);
    }
    
    const supplyValue = metric === 'liquid' ? testData.liquidSupply : testData.vaultedSupply;
    const recentTimestamp = Math.floor(Date.now() / 1000);
    
    return {
      data: [{
        t: recentTimestamp,
        v: supplyValue,
        unix_timestamp: recentTimestamp,
        timestamp: new Date(recentTimestamp * 1000).toISOString(),
        value: supplyValue
      }]
    };
  }
  
  /**
   * Mock cointime destroyed data
   */
  async fetchCointimeDestroyed(asset: string): Promise<MockGlassNodeResponse> {
    console.log(`🧪 Mock fetching cointime destroyed for ${asset}`);
    
    const testData = this.testDataCache.get(asset.toUpperCase()) || this.testDataCache.get(asset.toLowerCase());
    
    if (!testData) {
      throw new Error(`Mock data not available for asset: ${asset}`);
    }
    
    const recentTimestamp = Math.floor(Date.now() / 1000);
    const cointimeDestroyed = testData.priceHistory[testData.priceHistory.length - 1]?.price * 10000 + Math.random() * 100000;
    
    return {
      data: [{
        t: recentTimestamp,
        v: cointimeDestroyed,
        unix_timestamp: recentTimestamp,
        timestamp: new Date(recentTimestamp * 1000).toISOString(),
        value: cointimeDestroyed
      }]
    };
  }
  
  /**
   * Get test data for a coin
   */
  getTestData(assetOrCoinId: string): TestCoinData | null {
    return this.testDataCache.get(assetOrCoinId.toUpperCase()) || 
           this.testDataCache.get(assetOrCoinId.toLowerCase()) || 
           null;
  }
  
  /**
   * Check if mock data is available for an asset
   */
  hasTestData(assetOrCoinId: string): boolean {
    return this.testDataCache.has(assetOrCoinId.toUpperCase()) || 
           this.testDataCache.has(assetOrCoinId.toLowerCase());
  }
  
  /**
   * Get all available test coins
   */
  getAvailableTestCoins(): string[] {
    return Array.from(this.testDataCache.keys()).filter(key => key.length <= 6); // Symbols only
  }
}

export const mockGlassNodeService = new MockGlassNodeService();
