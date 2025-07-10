import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

      // For now, generate mock historical data
      // In a real app, this would come from a portfolio_history table
      const mockData = generateMockMovementData(portfolio.total_value, timeframe);
      
      setData(mockData);
      setCurrentValue(portfolio.total_value);
      setPreviousValue(mockData[0]?.value || portfolio.total_value);
    } catch (error) {
      console.error('Error fetching movement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockMovementData = (currentValue: number, timeframe: string): MovementData[] => {
    let days = 30;
    switch (timeframe) {
      case '1D': days = 1; break;
      case '1W': days = 7; break;
      case '1M': days = 30; break;
      case '3M': days = 90; break;
      case '1Y': days = 365; break;
      case 'ALL': days = 365 * 2; break;
    }

    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      // Generate realistic price movement
      const progress = i / days;
      const trend = currentValue * 0.8; // Assume 20% growth over period
      const noise = (Math.random() - 0.5) * currentValue * 0.1; // 10% volatility
      const value = trend + (currentValue - trend) * progress + noise;
      
      return {
        date: date.toISOString().split('T')[0],
        value: Math.max(value, currentValue * 0.5), // Minimum 50% of current value
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
            Loading performance data...
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