
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, Database } from 'lucide-react';
import { fetchGlassNodeMetric, getOnChainAnalysis, GLASS_NODE_METRICS } from '@/services/glassNodeService';

interface HistoricalDataChartProps {
  coinSymbol: string;
  metric?: string;
}

const HistoricalDataChart = ({ coinSymbol, metric = 'price' }: HistoricalDataChartProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState(metric);
  const [error, setError] = useState<string | null>(null);

  const metricOptions = [
    { key: 'price', label: 'Price USD', icon: TrendingUp, glassNodeMetric: GLASS_NODE_METRICS.PRICE_USD },
    { key: 'active_addresses', label: 'Active Addresses', icon: Activity, glassNodeMetric: GLASS_NODE_METRICS.ACTIVE_ADDRESSES },
    { key: 'exchange_flow', label: 'Exchange Flow', icon: Database, glassNodeMetric: GLASS_NODE_METRICS.EXCHANGE_INFLOW }
  ];

  useEffect(() => {
    fetchHistoricalData();
  }, [coinSymbol, activeMetric]);

  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const selectedMetric = metricOptions.find(m => m.key === activeMetric);
      
      if (!selectedMetric) {
        throw new Error('Invalid metric selected');
      }

      console.log(`Fetching ${selectedMetric.label} data for ${coinSymbol}`);
      
      if (activeMetric === 'exchange_flow') {
        // Fetch both inflow and outflow for exchange flow
        const analysis = await getOnChainAnalysis(coinSymbol, 30);
        const combinedData = analysis.exchangeFlow.inflow.map((point, index) => ({
          timestamp: point.timestamp,
          date: new Date(point.timestamp).toLocaleDateString(),
          inflow: point.value,
          outflow: analysis.exchangeFlow.outflow[index]?.value || 0,
          net_flow: point.value - (analysis.exchangeFlow.outflow[index]?.value || 0)
        }));
        setData(combinedData);
      } else {
        const metricData = await fetchGlassNodeMetric(
          selectedMetric.glassNodeMetric,
          coinSymbol,
          since
        );
        
        const formattedData = metricData.map(point => ({
          timestamp: point.timestamp,
          date: new Date(point.timestamp).toLocaleDateString(),
          value: point.value
        }));
        
        setData(formattedData);
      }
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="font-medium" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Historical Data - {coinSymbol}
          </CardTitle>
          <div className="flex gap-2">
            {metricOptions.map(option => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.key}
                  variant={activeMetric === option.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveMetric(option.key)}
                  className="gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading historical data...
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-red-600 mb-2">Error loading data</div>
            <div className="text-sm text-muted-foreground mb-4">{error}</div>
            <Button onClick={fetchHistoricalData} size="sm">
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No historical data available
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <>
            <div className="mb-4">
              <Badge variant="secondary">
                {data.length} data points • Last 30 days
              </Badge>
            </div>
            
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis 
                  className="text-muted-foreground"
                  fontSize={12}
                  tickFormatter={(value) => {
                    if (activeMetric === 'price') {
                      return `$${value.toLocaleString()}`;
                    }
                    return value.toLocaleString();
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {activeMetric === 'exchange_flow' ? (
                  <>
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="inflow" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                      name="Inflow"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="outflow" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      dot={false}
                      name="Outflow"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="net_flow" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      dot={false}
                      name="Net Flow"
                      strokeDasharray="5 5"
                    />
                  </>
                ) : (
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricalDataChart;
