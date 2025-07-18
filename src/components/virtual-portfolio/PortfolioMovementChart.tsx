import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { enhancedRealTimeMarketService } from '@/services/enhancedRealTimeMarketService';
import { getOnChainAnalysis } from '@/services/glassNodeService';

interface MovementData {
  date: string;
  value: number;
  timestamp: string;
}

interface PortfolioMovementChartProps {
  portfolioId: string;
  timeframe?: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
}

const PortfolioMovementChart = ({ 
  portfolioId,
  timeframe = '1M'
}: PortfolioMovementChartProps) => {
  const [data, setData] = useState<MovementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentValue, setCurrentValue] = useState(0);
  const [previousValue, setPreviousValue] = useState(0);
  const [glassNodeInsights, setGlassNodeInsights] = useState<any>(null);

  useEffect(() => {
    fetchMovementData();
  }, [portfolioId, timeframe]);

  const fetchMovementData = async () => {
    try {
      setLoading(true);
      
      // Get current portfolio value
      const { data: portfolio, error: portfolioError } = await supabase
        .from('virtual_portfolios')
        .select('total_value')
        .eq('id', portfolioId)
        .single();

      if (portfolioError) throw portfolioError;

      // Get portfolio assets to analyze with Glass Node
      const { data: assets, error: assetsError } = await supabase
        .from('virtual_assets')
        .select(`
          total_amount,
          virtual_coins!inner(symbol, name)
        `)
        .eq('portfolio_id', portfolioId);

      if (assetsError) throw assetsError;

      // Try to get Glass Node historical data for major assets
      let enhancedData: MovementData[] = [];
      let insights = null;

      if (assets.length > 0) {
        try {
          const majorAsset = assets[0]; // Use the first asset for Glass Node analysis
          const coinSymbol = majorAsset.virtual_coins.symbol;
          
          // Get Glass Node price history
          const priceHistory = await enhancedRealTimeMarketService.getGlassNodePriceHistory(
            coinSymbol.toLowerCase(),
            getDaysFromTimeframe(timeframe)
          );

          if (priceHistory.length > 0) {
            enhancedData = priceHistory.map(([timestamp, price]) => ({
              date: new Date(timestamp).toISOString().split('T')[0],
              value: price * majorAsset.total_amount, // Approximate portfolio value
              timestamp: new Date(timestamp).toISOString()
            }));

            // Get on-chain insights
            const onChainAnalysis = await getOnChainAnalysis(coinSymbol, getDaysFromTimeframe(timeframe));
            insights = {
              activeAddresses: onChainAnalysis.activeAddresses[onChainAnalysis.activeAddresses.length - 1]?.value || 0,
              exchangeFlow: {
                inflow: onChainAnalysis.exchangeFlow.inflow[onChainAnalysis.exchangeFlow.inflow.length - 1]?.value || 0,
                outflow: onChainAnalysis.exchangeFlow.outflow[onChainAnalysis.exchangeFlow.outflow.length - 1]?.value || 0
              }
            };
          }
        } catch (glassNodeError) {
          console.log('Glass Node data unavailable, using mock data:', glassNodeError);
        }
      }

      // Fallback to mock data if Glass Node data is unavailable
      if (enhancedData.length === 0) {
        enhancedData = generateMockMovementData(portfolio.total_value, timeframe);
      }

      setData(enhancedData);
      setGlassNodeInsights(insights);
      setCurrentValue(portfolio.total_value);
      setPreviousValue(enhancedData[0]?.value || portfolio.total_value);
    } catch (error) {
      console.error('Error fetching movement data:', error);
      // Fallback to mock data
      const mockData = generateMockMovementData(10000, timeframe);
      setData(mockData);
      setCurrentValue(10000);
      setPreviousValue(mockData[0]?.value || 10000);
    } finally {
      setLoading(false);
    }
  };

  const getDaysFromTimeframe = (timeframe: string): number => {
    switch (timeframe) {
      case '1D': return 1;
      case '1W': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '1Y': return 365;
      case 'ALL': return 365 * 2;
      default: return 30;
    }
  };

  const generateMockMovementData = (currentValue: number, timeframe: string): MovementData[] => {
    let days = getDaysFromTimeframe(timeframe);

    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      const progress = i / days;
      const trend = currentValue * 0.8;
      const noise = (Math.random() - 0.5) * currentValue * 0.1;
      const value = trend + (currentValue - trend) * progress + noise;
      
      return {
        date: date.toISOString().split('T')[0],
        value: Math.max(value, currentValue * 0.5),
        timestamp: date.toISOString()
      };
    });
  };

  const change = currentValue - previousValue;
  const changePercentage = previousValue > 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change >= 0;

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    switch (timeframe) {
      case '1D':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '1W':
      case '1M':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '3M':
      case '1Y':
      case 'ALL':
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const date = new Date(label);
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">
            {date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className="font-medium">
            ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Portfolio Performance
            <Badge variant="secondary">{timeframe}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading Glass Node enhanced performance data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Portfolio Performance
            <Badge variant="secondary">{timeframe}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Portfolio Performance
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {isPositive ? '+' : ''}${change.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm">
                ({isPositive ? '+' : ''}{changePercentage.toFixed(2)}%)
              </span>
            </div>
            <Badge variant="secondary">{timeframe}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Glass Node Insights */}
        {glassNodeInsights && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">📊 Glass Node Insights</div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Active Addresses:</span>
                <div className="font-medium">{glassNodeInsights.activeAddresses.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Exchange Net Flow:</span>
                <div className={`font-medium ${glassNodeInsights.exchangeFlow.outflow > glassNodeInsights.exchangeFlow.inflow ? 'text-green-600' : 'text-red-600'}`}>
                  {(glassNodeInsights.exchangeFlow.outflow - glassNodeInsights.exchangeFlow.inflow).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis}
              className="text-muted-foreground"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => `$${value.toLocaleString('en-US')}`}
              className="text-muted-foreground"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PortfolioMovementChart;
