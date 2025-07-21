
// Symbol mapping service for CoinMarketCap to Glassnode asset conversion
export interface SymbolMapping {
  coinMarketCapId: string;
  symbol: string;
  name: string;
  glassNodeAsset: string | null;
  glassNodeSupported: boolean;
}

// Common symbol mappings between CoinMarketCap and Glassnode
const SYMBOL_MAPPINGS: SymbolMapping[] = [
  {
    coinMarketCapId: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    glassNodeAsset: 'BTC',
    glassNodeSupported: true
  },
  {
    coinMarketCapId: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    glassNodeAsset: 'ETH',
    glassNodeSupported: true
  },
  {
    coinMarketCapId: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    glassNodeAsset: 'SOL',
    glassNodeSupported: true
  },
  {
    coinMarketCapId: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    glassNodeAsset: 'ADA',
    glassNodeSupported: true
  },
  {
    coinMarketCapId: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    glassNodeAsset: 'LINK',
    glassNodeSupported: true
  },
  {
    coinMarketCapId: 'litecoin',
    symbol: 'LTC',
    name: 'Litecoin',
    glassNodeAsset: 'LTC',
    glassNodeSupported: true
  },
  {
    coinMarketCapId: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    glassNodeAsset: 'DOT',
    glassNodeSupported: true
  },
  {
    coinMarketCapId: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    glassNodeAsset: 'AVAX',
    glassNodeSupported: true
  },
  {
    coinMarketCapId: 'uniswap',
    symbol: 'UNI',
    name: 'Uniswap',
    glassNodeAsset: 'UNI',
    glassNodeSupported: true
  },
  {
    coinMarketCapId: 'matic-network',
    symbol: 'MATIC',
    name: 'Polygon',
    glassNodeAsset: 'MATIC',
    glassNodeSupported: true
  }
];

export class SymbolMappingService {
  private mappings: Map<string, SymbolMapping> = new Map();

  constructor() {
    this.initializeMappings();
  }

  private initializeMappings() {
    SYMBOL_MAPPINGS.forEach(mapping => {
      // Index by CoinMarketCap ID
      this.mappings.set(mapping.coinMarketCapId.toLowerCase(), mapping);
      // Index by symbol
      this.mappings.set(mapping.symbol.toLowerCase(), mapping);
      // Index by name
      this.mappings.set(mapping.name.toLowerCase(), mapping);
    });
  }

  public getGlassNodeAsset(coinMarketCapId: string): string | null {
    const mapping = this.mappings.get(coinMarketCapId.toLowerCase());
    return mapping?.glassNodeAsset || null;
  }

  public isGlassNodeSupported(coinMarketCapId: string): boolean {
    const mapping = this.mappings.get(coinMarketCapId.toLowerCase());
    return mapping?.glassNodeSupported || false;
  }

  public getMapping(coinMarketCapId: string): SymbolMapping | null {
    return this.mappings.get(coinMarketCapId.toLowerCase()) || null;
  }

  public getAllSupportedAssets(): SymbolMapping[] {
    return SYMBOL_MAPPINGS.filter(mapping => mapping.glassNodeSupported);
  }

  public searchBySymbol(symbol: string): SymbolMapping | null {
    return this.mappings.get(symbol.toLowerCase()) || null;
  }

  public searchByName(name: string): SymbolMapping | null {
    return this.mappings.get(name.toLowerCase()) || null;
  }
}

export const symbolMappingService = new SymbolMappingService();
