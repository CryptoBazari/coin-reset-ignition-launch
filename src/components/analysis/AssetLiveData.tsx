import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, RefreshCw, Search, Star, ExternalLink } from 'lucide-react';
import { realTimeMarketService, CoinData } from '@/services/realTimeMarketService';

interface AssetLiveDataProps {
  coinId?: string;
  onCoinSelect?: (coinData: CoinData) => void;
}

const AssetLiveData = ({ coinId = 'bitcoin', onCoinSelect }: AssetLiveDataProps) => {
  const [coinData, setCoinData] = useState<CoinData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{id: string, name: string, symbol: string, thumb: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchCoinData(coinId);
    
    // Auto-refresh every minute
    const interval = setInterval(() => fetchCoinData(coinId), 60000);
    return () => clearInterval(interval);
  }, [coinId]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchCoins();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchCoinData = async (id: string) => {
    try {
      setLoading(true);
      const data = await realTimeMarketService.getCoinData(id);
      setCoinData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching coin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchCoins = async () => {
    try {
      setSearching(true);
      const results = await realTimeMarketService.searchCoins(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching coins:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleCoinSelect = async (selectedCoinId: string) => {
    setSearchQuery('');
    setSearchResults([]);
    await fetchCoinData(selectedCoinId);
    
    if (onCoinSelect && coinData) {
      const selectedCoinData = await realTimeMarketService.getCoinData(selectedCoinId);
      if (selectedCoinData) {
        onCoinSelect(selectedCoinData);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 1 ? 6 : 2
    }).format(value);
  };

  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading && !coinData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Live Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading asset data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Live Asset Data</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchCoinData(coinId)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a cryptocurrency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleCoinSelect(result.id)}
                  className="w-full p-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                >
                  <img 
                    src={result.thumb} 
                    alt={result.name}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-muted-foreground uppercase">{result.symbol}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {coinData && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="font-bold text-2xl">{coinData.name}</div>
                <Badge variant="outline" className="uppercase">
                  {coinData.symbol}
                </Badge>
                <Badge variant="secondary">
                  Rank #{coinData.market_cap_rank}
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Star className="h-4 w-4" />
                Watchlist
              </Button>
            </div>

            {/* Price Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Current Price</span>
                <div className="text-3xl font-bold">
                  {formatCurrency(coinData.current_price)}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">24h Change</span>
                <div className={`text-2xl font-bold flex items-center gap-2 ${
                  coinData.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {coinData.price_change_percentage_24h >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  {formatPercentage(coinData.price_change_percentage_24h)}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">7d Change</span>
                <div className={`text-xl font-bold ${
                  coinData.price_change_percentage_7d >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(coinData.price_change_percentage_7d)}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">30d Change</span>
                <div className={`text-xl font-bold ${
                  coinData.price_change_percentage_30d >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(coinData.price_change_percentage_30d)}
                </div>
              </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Market Cap</span>
                <div className="text-xl font-bold">
                  {formatLargeNumber(coinData.market_cap)}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Circulating Supply</span>
                <div className="text-lg font-medium">
                  {coinData.circulating_supply?.toLocaleString() || 'N/A'}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Max Supply</span>
                <div className="text-lg font-medium">
                  {coinData.max_supply?.toLocaleString() || 'N/A'}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">All-Time High</span>
                <div className="space-y-1">
                  <div className="text-lg font-medium">
                    {formatCurrency(coinData.ath)}
                  </div>
                  <div className={`text-sm ${
                    coinData.ath_change_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(coinData.ath_change_percentage)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">All-Time Low</span>
                <div className="space-y-1">
                  <div className="text-lg font-medium">
                    {formatCurrency(coinData.atl)}
                  </div>
                  <div className={`text-sm ${
                    coinData.atl_change_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(coinData.atl_change_percentage)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <div className="text-lg font-medium">
                  {new Date(coinData.last_updated).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={() => onCoinSelect?.(coinData)}
                className="gap-2"
              >
                Analyze Asset
              </Button>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View on CoinGecko
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetLiveData;