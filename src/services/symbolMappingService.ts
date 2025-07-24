
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
    // Comprehensive cryptocurrencies with Glassnode support
    const glassnodeMappings: SymbolMapping[] = [
      // Major cryptocurrencies
      { coinMarketCapId: 'bitcoin', coinMarketCapSymbol: 'BTC', glassNodeAsset: 'BTC', glassNodeSupported: true, name: 'Bitcoin' },
      { coinMarketCapId: 'ethereum', coinMarketCapSymbol: 'ETH', glassNodeAsset: 'ETH', glassNodeSupported: true, name: 'Ethereum' },
      { coinMarketCapId: 'litecoin', coinMarketCapSymbol: 'LTC', glassNodeAsset: 'LTC', glassNodeSupported: true, name: 'Litecoin' },
      { coinMarketCapId: 'bitcoin-cash', coinMarketCapSymbol: 'BCH', glassNodeAsset: 'BCH', glassNodeSupported: true, name: 'Bitcoin Cash' },
      
      // DeFi Tokens
      { coinMarketCapId: 'chainlink', coinMarketCapSymbol: 'LINK', glassNodeAsset: 'LINK', glassNodeSupported: true, name: 'Chainlink' },
      { coinMarketCapId: 'uniswap', coinMarketCapSymbol: 'UNI', glassNodeAsset: 'UNI', glassNodeSupported: true, name: 'Uniswap' },
      { coinMarketCapId: 'aave', coinMarketCapSymbol: 'AAVE', glassNodeAsset: 'AAVE', glassNodeSupported: true, name: 'Aave' },
      { coinMarketCapId: 'compound', coinMarketCapSymbol: 'COMP', glassNodeAsset: 'COMP', glassNodeSupported: true, name: 'Compound' },
      { coinMarketCapId: 'maker', coinMarketCapSymbol: 'MKR', glassNodeAsset: 'MKR', glassNodeSupported: true, name: 'Maker' },
      { coinMarketCapId: 'yearn-finance', coinMarketCapSymbol: 'YFI', glassNodeAsset: 'YFI', glassNodeSupported: true, name: 'Yearn Finance' },
      { coinMarketCapId: 'sushi', coinMarketCapSymbol: 'SUSHI', glassNodeAsset: 'SUSHI', glassNodeSupported: true, name: 'SushiSwap' },
      { coinMarketCapId: '1inch', coinMarketCapSymbol: '1INCH', glassNodeAsset: '1INCH', glassNodeSupported: true, name: '1inch' },
      { coinMarketCapId: 'balancer', coinMarketCapSymbol: 'BAL', glassNodeAsset: 'BAL', glassNodeSupported: true, name: 'Balancer' },
      { coinMarketCapId: 'curve-dao-token', coinMarketCapSymbol: 'CRV', glassNodeAsset: 'CRV', glassNodeSupported: true, name: 'Curve DAO Token' },
      { coinMarketCapId: 'synthetix', coinMarketCapSymbol: 'SNX', glassNodeAsset: 'SNX', glassNodeSupported: true, name: 'Synthetix' },
      { coinMarketCapId: 'ens', coinMarketCapSymbol: 'ENS', glassNodeAsset: 'ENS', glassNodeSupported: true, name: 'Ethereum Name Service' },
      { coinMarketCapId: 'the-graph', coinMarketCapSymbol: 'GRT', glassNodeAsset: 'GRT', glassNodeSupported: true, name: 'The Graph' },
      { coinMarketCapId: 'basic-attention-token', coinMarketCapSymbol: 'BAT', glassNodeAsset: 'BAT', glassNodeSupported: true, name: 'Basic Attention Token' },
      { coinMarketCapId: '0x', coinMarketCapSymbol: 'ZRX', glassNodeAsset: 'ZRX', glassNodeSupported: true, name: '0x' },
      { coinMarketCapId: 'loopring', coinMarketCapSymbol: 'LRC', glassNodeAsset: 'LRC', glassNodeSupported: true, name: 'Loopring' },
      
      // Layer 1s and Infrastructure
      { coinMarketCapId: 'solana', coinMarketCapSymbol: 'SOL', glassNodeAsset: 'SOL', glassNodeSupported: true, name: 'Solana' },
      { coinMarketCapId: 'polygon', coinMarketCapSymbol: 'MATIC', glassNodeAsset: 'MATIC', glassNodeSupported: true, name: 'Polygon' },
      { coinMarketCapId: 'avalanche-2', coinMarketCapSymbol: 'AVAX', glassNodeAsset: 'AVAX', glassNodeSupported: true, name: 'Avalanche' },
      { coinMarketCapId: 'fantom', coinMarketCapSymbol: 'FTM', glassNodeAsset: 'FTM', glassNodeSupported: true, name: 'Fantom' },
      { coinMarketCapId: 'near', coinMarketCapSymbol: 'NEAR', glassNodeAsset: 'NEAR', glassNodeSupported: true, name: 'NEAR Protocol' },
      { coinMarketCapId: 'cosmos', coinMarketCapSymbol: 'ATOM', glassNodeAsset: 'ATOM', glassNodeSupported: true, name: 'Cosmos' },
      { coinMarketCapId: 'polkadot', coinMarketCapSymbol: 'DOT', glassNodeAsset: 'DOT', glassNodeSupported: true, name: 'Polkadot' },
      { coinMarketCapId: 'cardano', coinMarketCapSymbol: 'ADA', glassNodeAsset: 'ADA', glassNodeSupported: true, name: 'Cardano' },
      
      // Memecoins and Popular Tokens
      { coinMarketCapId: 'dogecoin', coinMarketCapSymbol: 'DOGE', glassNodeAsset: 'DOGE', glassNodeSupported: true, name: 'Dogecoin' },
      { coinMarketCapId: 'shiba-inu', coinMarketCapSymbol: 'SHIB', glassNodeAsset: 'SHIB', glassNodeSupported: true, name: 'Shiba Inu' },
      { coinMarketCapId: 'pepe', coinMarketCapSymbol: 'PEPE', glassNodeAsset: 'PEPE', glassNodeSupported: true, name: 'Pepe' },
      { coinMarketCapId: 'dogwifcoin', coinMarketCapSymbol: 'WIF', glassNodeAsset: 'WIF', glassNodeSupported: true, name: 'dogwifhat' },
      { coinMarketCapId: 'bonk', coinMarketCapSymbol: 'BONK', glassNodeAsset: 'BONK', glassNodeSupported: true, name: 'Bonk' },
      { coinMarketCapId: 'floki', coinMarketCapSymbol: 'FLOKI', glassNodeAsset: 'FLOKI', glassNodeSupported: true, name: 'FLOKI' },
      
      // Stablecoins
      { coinMarketCapId: 'tether', coinMarketCapSymbol: 'USDT', glassNodeAsset: 'USDT', glassNodeSupported: true, name: 'Tether' },
      { coinMarketCapId: 'usd-coin', coinMarketCapSymbol: 'USDC', glassNodeAsset: 'USDC', glassNodeSupported: true, name: 'USD Coin' },
      { coinMarketCapId: 'dai', coinMarketCapSymbol: 'DAI', glassNodeAsset: 'DAI', glassNodeSupported: true, name: 'Dai' },
      { coinMarketCapId: 'frax', coinMarketCapSymbol: 'FRAX', glassNodeAsset: 'FRAX', glassNodeSupported: true, name: 'Frax' },
      
      // Additional Popular Tokens
      { coinMarketCapId: 'thorchain', coinMarketCapSymbol: 'RUNE', glassNodeAsset: 'RUNE', glassNodeSupported: true, name: 'THORChain' },
      { coinMarketCapId: 'injective-protocol', coinMarketCapSymbol: 'INJ', glassNodeAsset: 'INJ', glassNodeSupported: true, name: 'Injective' },
      { coinMarketCapId: 'render-token', coinMarketCapSymbol: 'RNDR', glassNodeAsset: 'RNDR', glassNodeSupported: true, name: 'Render' },
      { coinMarketCapId: 'jupiter-exchange-solana', coinMarketCapSymbol: 'JUP', glassNodeAsset: 'JUP', glassNodeSupported: true, name: 'Jupiter' },
      { coinMarketCapId: 'worldcoin-wld', coinMarketCapSymbol: 'WLD', glassNodeAsset: 'WLD', glassNodeSupported: true, name: 'Worldcoin' },
      { coinMarketCapId: 'lido-dao', coinMarketCapSymbol: 'LDO', glassNodeAsset: 'LDO', glassNodeSupported: true, name: 'Lido DAO' },
      { coinMarketCapId: 'pendle', coinMarketCapSymbol: 'PENDLE', glassNodeAsset: 'PENDLE', glassNodeSupported: true, name: 'Pendle' },
      { coinMarketCapId: 'arbitrum', coinMarketCapSymbol: 'ARB', glassNodeAsset: 'ARB', glassNodeSupported: true, name: 'Arbitrum' },
      { coinMarketCapId: 'optimism', coinMarketCapSymbol: 'OP', glassNodeAsset: 'OP', glassNodeSupported: true, name: 'Optimism' }
    ];

    // Add mappings to the map with multiple key formats
    glassnodeMappings.forEach(mapping => {
      // Add by CoinMarketCap ID (slug)
      this.mappings.set(mapping.coinMarketCapId, mapping);
      this.mappings.set(mapping.coinMarketCapId.toLowerCase(), mapping);
      
      // Add by symbol (both cases)
      this.mappings.set(mapping.coinMarketCapSymbol.toLowerCase(), mapping);
      this.mappings.set(mapping.coinMarketCapSymbol.toUpperCase(), mapping);
      
      // Add by Glassnode asset name if available
      if (mapping.glassNodeAsset) {
        this.mappings.set(mapping.glassNodeAsset.toLowerCase(), mapping);
        this.mappings.set(mapping.glassNodeAsset.toUpperCase(), mapping);
      }
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
