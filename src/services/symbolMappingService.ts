
export interface SymbolMapping {
  coinMarketCapId: string;
  coinMarketCapSymbol: string;
  glassNodeAsset?: string;
  glassNodeSupported: boolean;
  name: string;
}

export class SymbolMappingService {
  private mappings: Map<string, SymbolMapping> = new Map();

  constructor() {
    this.initializeMappings();
  }

  private initializeMappings() {
    // Major cryptocurrencies with Glassnode support
    const glassnodeMappings: SymbolMapping[] = [
      { coinMarketCapId: 'bitcoin', coinMarketCapSymbol: 'BTC', glassNodeAsset: 'BTC', glassNodeSupported: true, name: 'Bitcoin' },
      { coinMarketCapId: 'ethereum', coinMarketCapSymbol: 'ETH', glassNodeAsset: 'ETH', glassNodeSupported: true, name: 'Ethereum' },
      { coinMarketCapId: 'litecoin', coinMarketCapSymbol: 'LTC', glassNodeAsset: 'LTC', glassNodeSupported: true, name: 'Litecoin' },
      { coinMarketCapId: 'bitcoin-cash', coinMarketCapSymbol: 'BCH', glassNodeAsset: 'BCH', glassNodeSupported: true, name: 'Bitcoin Cash' },
      { coinMarketCapId: 'chainlink', coinMarketCapSymbol: 'LINK', glassNodeAsset: 'LINK', glassNodeSupported: true, name: 'Chainlink' },
      { coinMarketCapId: 'uniswap', coinMarketCapSymbol: 'UNI', glassNodeAsset: 'UNI', glassNodeSupported: true, name: 'Uniswap' },
      { coinMarketCapId: 'aave', coinMarketCapSymbol: 'AAVE', glassNodeAsset: 'AAVE', glassNodeSupported: true, name: 'Aave' },
      { coinMarketCapId: 'compound', coinMarketCapSymbol: 'COMP', glassNodeAsset: 'COMP', glassNodeSupported: true, name: 'Compound' },
      { coinMarketCapId: 'maker', coinMarketCapSymbol: 'MKR', glassNodeAsset: 'MKR', glassNodeSupported: true, name: 'Maker' },
      { coinMarketCapId: 'yearn-finance', coinMarketCapSymbol: 'YFI', glassNodeAsset: 'YFI', glassNodeSupported: true, name: 'Yearn Finance' },
      { coinMarketCapId: 'sushi', coinMarketCapSymbol: 'SUSHI', glassNodeAsset: 'SUSHI', glassNodeSupported: true, name: 'SushiSwap' },
      { coinMarketCapId: '1inch', coinMarketCapSymbol: '1INCH', glassNodeAsset: '1INCH', glassNodeSupported: true, name: '1inch' },
      { coinMarketCapId: 'balancer', chainLinkAsset: 'BAL', glassNodeAsset: 'BAL', glassNodeSupported: true, name: 'Balancer' },
      { coinMarketCapId: 'curve-dao-token', coinMarketCapSymbol: 'CRV', glassNodeAsset: 'CRV', glassNodeSupported: true, name: 'Curve DAO Token' },
      { coinMarketCapId: 'synthetix', coinMarketCapSymbol: 'SNX', glassNodeAsset: 'SNX', glassNodeSupported: true, name: 'Synthetix' },
      { coinMarketCapId: 'ens', coinMarketCapSymbol: 'ENS', glassNodeAsset: 'ENS', glassNodeSupported: true, name: 'Ethereum Name Service' },
      { coinMarketCapId: 'the-graph', coinMarketCapSymbol: 'GRT', glassNodeAsset: 'GRT', glassNodeSupported: true, name: 'The Graph' },
      { coinMarketCapId: 'basic-attention-token', coinMarketCapSymbol: 'BAT', glassNodeAsset: 'BAT', glassNodeSupported: true, name: 'Basic Attention Token' },
      { coinMarketCapId: '0x', coinMarketCapSymbol: 'ZRX', glassNodeAsset: 'ZRX', glassNodeSupported: true, name: '0x' },
      { coinMarketCapId: 'loopring', coinMarketCapSymbol: 'LRC', glassNodeAsset: 'LRC', glassNodeSupported: true, name: 'Loopring' }
    ];

    // Add mappings to the map
    glassnodeMappings.forEach(mapping => {
      this.mappings.set(mapping.coinMarketCapId, mapping);
      this.mappings.set(mapping.coinMarketCapSymbol.toLowerCase(), mapping);
    });

    console.log(`📊 Symbol mapping service initialized with ${glassnodeMappings.length} Glassnode-supported assets`);
  }

  getMapping(coinIdOrSymbol: string): SymbolMapping | null {
    const key = coinIdOrSymbol.toLowerCase();
    const mapping = this.mappings.get(key);
    
    if (mapping) {
      console.log(`✅ Found mapping for ${coinIdOrSymbol}: Glassnode ${mapping.glassNodeSupported ? 'supported' : 'not supported'}`);
      return mapping;
    }
    
    console.log(`⚠️ No mapping found for ${coinIdOrSymbol} - will use CoinMarketCap only`);
    return null;
  }

  isGlassNodeSupported(coinIdOrSymbol: string): boolean {
    const mapping = this.getMapping(coinIdOrSymbol);
    return mapping?.glassNodeSupported || false;
  }

  getGlassNodeAsset(coinIdOrSymbol: string): string | null {
    const mapping = this.getMapping(coinIdOrSymbol);
    return mapping?.glassNodeAsset || null;
  }

  getAllSupportedAssets(): SymbolMapping[] {
    return Array.from(this.mappings.values()).filter(mapping => mapping.glassNodeSupported);
  }

  getAllMappings(): SymbolMapping[] {
    return Array.from(this.mappings.values());
  }
}

export const symbolMappingService = new SymbolMappingService();
