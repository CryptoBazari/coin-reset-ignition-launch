import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HistoricalData {
  date: string;
  totalValue: number;
  totalProfit: number;
  dayChange: number;
  dayChangePercent: number;
}

interface HistoricalPerformanceProps {
  portfolioId: string;
}

export default function HistoricalPerformanceTracker({ portfolioId }: HistoricalPerformanceProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (portfolioId) {
      fetchHistoricalData();
    }
  }, [portfolioId, timeframe]);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      
      const days = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      }[timeframe];

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const { data, error } = await supabase
        .from('portfolio_daily_snapshots')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .lte('snapshot_date', endDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });

      if (error) throw error;

      const formattedData = (data || []).map(snapshot => ({
        date: new Date(snapshot.snapshot_date).toLocaleDateString(),
        totalValue: snapshot.total_value,
        totalProfit: snapshot.total_profit,
        dayChange: snapshot.day_change,
        dayChangePercent: snapshot.day_change_percent
      }));

      setHistoricalData(formattedData);
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      setHistoricalData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    if (historicalData.length < 2) return null;

    const firstValue = historicalData[0].totalValue;
    const lastValue = historicalData[historicalData.length - 1].totalValue;
    const totalReturn = ((lastValue - firstValue) / firstValue) * 100;
    
    const maxValue = Math.max(...historicalData.map(d => d.totalValue));
    const minValue = Math.min(...historicalData.map(d => d.totalValue));
    const maxDrawdown = ((maxValue - minValue) / maxValue) * 100;

    const volatility = Math.sqrt(
      historicalData.reduce((sum, d) => sum + Math.pow(d.dayChangePercent, 2), 0) / historicalData.length
    ) * Math.sqrt(252); // Annualized

    return {
      totalReturn: totalReturn.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      volatility: volatility.toFixed(2),
      bestDay: Math.max(...historicalData.map(d => d.dayChangePercent)).toFixed(2),
      worstDay: Math.min(...historicalData.map(d => d.dayChangePercent)).toFixed(2)
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Historical Performance
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', '1y'] as const).map((period) => (
              <Badge
                key={period}
                variant={timeframe === period ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setTimeframe(period)}
              >
                {period}
              </Badge>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Performance Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? `$${value.toLocaleString()}` : value,
                  name === 'totalValue' ? 'Portfolio Value' : 'Total Profit'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="totalValue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="totalProfit" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Return</p>
              <p className={`text-lg font-bold ${parseFloat(metrics.totalReturn) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(metrics.totalReturn) >= 0 ? '+' : ''}{metrics.totalReturn}%
              </p>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Max Drawdown</p>
              <p className="text-lg font-bold text-red-600">
                -{metrics.maxDrawdown}%
              </p>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Volatility</p>
              <p className="text-lg font-bold">
                {metrics.volatility}%
              </p>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Best Day</p>
              <p className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{metrics.bestDay}%
              </p>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Worst Day</p>
              <p className="text-lg font-bold text-red-600 flex items-center justify-center gap-1">
                <TrendingDown className="h-3 w-3" />
                {metrics.worstDay}%
              </p>
            </div>
          </div>
        )}

        {historicalData.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No historical data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Portfolio snapshots will appear here as data is collected over time
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}