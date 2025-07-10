import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, RefreshCw, Globe, Activity, DollarSign, BarChart3 } from 'lucide-react';
import { realTimeMarketService, MarketStats, TrendingCoin } from '@/services/realTimeMarketService';

const MarketOverview = () => {
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [trendingCoins, setTrendingCoins] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchMarketData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchMarketData, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      
      const [stats, trending] = await Promise.all([
        realTimeMarketService.getMarketStats(),
        realTimeMarketService.getTrendingCoins()
      ]);

      setMarketStats(stats);
      setTrendingCoins(trending);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading && !marketStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Loading market data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Market Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global Market Statistics
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchMarketData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {marketStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">Total Market Cap</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(marketStats.total_market_cap)}
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  marketStats.market_cap_change_percentage_24h_usd >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {marketStats.market_cap_change_percentage_24h_usd >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatPercentage(marketStats.market_cap_change_percentage_24h_usd)} (24h)
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">24h Trading Volume</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(marketStats.total_volume)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Global cryptocurrency volume
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-muted-foreground">Market Dominance</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bitcoin</span>
                    <Badge variant="outline">
                      {marketStats.market_cap_percentage.btc?.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ethereum</span>
                    <Badge variant="outline">
                      {marketStats.market_cap_percentage.eth?.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Coins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Cryptocurrencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendingCoins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingCoins.slice(0, 6).map((coin, index) => (
                <Card key={coin.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={coin.thumb} 
                        alt={coin.name}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      <Badge 
                        className="absolute -top-1 -right-1 text-xs px-1 py-0 h-5 w-5 rounded-full flex items-center justify-center"
                        variant="secondary"
                      >
                        {index + 1}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{coin.name}</div>
                      <div className="text-sm text-muted-foreground uppercase">
                        {coin.symbol}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        #{coin.market_cap_rank || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Rank
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No trending data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketOverview;