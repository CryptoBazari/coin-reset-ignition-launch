import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  ScatterChart,
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, PieChart as PieChartIcon, Activity, Target, BarChart3 } from 'lucide-react';

interface AdvancedAnalyticsProps {
  portfolioId: string;
}

const AdvancedAnalytics = ({ portfolioId }: AdvancedAnalyticsProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  // Fetch portfolio analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['portfolio-analytics', portfolioId, selectedTimeframe],
    queryFn: async () => {
      // Get portfolio assets with virtual coins data
      const { data: assets, error } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins (symbol, name)
        `)
        .eq('portfolio_id', portfolioId);

      if (error) throw error;

      // Get transaction history for trend analysis
      const { data: transactions, error: transError } = await supabase
        .from('virtual_transactions')
        .select(`
          *,
          virtual_coins (symbol, name)
        `)
        .eq('portfolio_id', portfolioId)
        .order('transaction_date', { ascending: true });

      if (transError) throw transError;

      return { assets, transactions };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">Loading analytics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData?.assets || analyticsData.assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">No data available for analytics</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process data for different chart types
  const assetDistribution = analyticsData.assets.map(asset => ({
    name: asset.virtual_coins.symbol,
    value: asset.total_amount * asset.average_price,
    amount: asset.total_amount,
    profit: asset.total_amount * asset.average_price - asset.cost_basis
  }));

  const riskMetrics = analyticsData.assets.map(asset => {
    const profit = asset.total_amount * asset.average_price - asset.cost_basis;
    const profitPercent = asset.cost_basis > 0 ? (profit / asset.cost_basis) * 100 : 0;
    
    return {
      asset: asset.virtual_coins.symbol,
      return: profitPercent,
      risk: Math.abs(profitPercent) * 0.8, // Simplified risk calculation
      value: asset.total_amount * asset.average_price
    };
  });

  const performanceData = analyticsData.transactions
    .reduce((acc, transaction, index) => {
      const date = new Date(transaction.transaction_date).toLocaleDateString();
      const existingEntry = acc.find(entry => entry.date === date);
      
      if (existingEntry) {
        existingEntry.volume += transaction.value;
        existingEntry.transactions += 1;
      } else {
        acc.push({
          date,
          volume: transaction.value,
          transactions: 1,
          cumulativeValue: acc.reduce((sum, entry) => sum + entry.volume, 0) + transaction.value
        });
      }
      
      return acc;
    }, [] as any[])
    .slice(-30); // Last 30 data points

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const RadarData = [
    { metric: 'Diversification', value: Math.min(analyticsData.assets.length * 20, 100) },
    { metric: 'Growth', value: Math.max(0, Math.min(100, riskMetrics.reduce((sum, item) => sum + item.return, 0) / riskMetrics.length + 50)) },
    { metric: 'Stability', value: Math.max(0, 100 - (riskMetrics.reduce((sum, item) => sum + item.risk, 0) / riskMetrics.length)) },
    { metric: 'Activity', value: Math.min(analyticsData.transactions.length * 5, 100) },
    { metric: 'Balance', value: 75 }, // Simplified metric
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Advanced Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio Health</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativeValue" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                    name="Cumulative Value"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.transactions.length}
                </div>
                <div className="text-sm text-blue-800">Total Transactions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ${performanceData.reduce((sum, item) => sum + item.volume, 0).toFixed(0)}
                </div>
                <div className="text-sm text-green-800">Total Volume</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData.assets.length}
                </div>
                <div className="text-sm text-purple-800">Assets Held</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={riskMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="risk" 
                    name="Risk Score" 
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                  />
                  <YAxis 
                    dataKey="return" 
                    name="Return" 
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}%`, 
                      name === 'return' ? 'Return' : 'Risk'
                    ]}
                    labelFormatter={(label, payload) => 
                      payload?.[0]?.payload?.asset ? `Asset: ${payload[0].payload.asset}` : ''
                    }
                  />
                  <Scatter dataKey="return" fill="#3B82F6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-2">
              {riskMetrics.map((metric, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <span className="font-medium">{metric.asset}</span>
                  <div className="flex gap-2">
                    <Badge variant={metric.return >= 0 ? 'default' : 'destructive'}>
                      {metric.return >= 0 ? '+' : ''}{metric.return.toFixed(1)}% Return
                    </Badge>
                    <Badge variant="outline">
                      {metric.risk.toFixed(1)}% Risk
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {assetDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {assetDistribution.map((asset, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{asset.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${asset.value.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">{asset.amount.toFixed(4)} units</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={RadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Portfolio Health"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(0)}%`, 'Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {RadarData.map((metric, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{metric.metric}</span>
                    <Badge variant={metric.value >= 70 ? 'default' : metric.value >= 40 ? 'secondary' : 'destructive'}>
                      {metric.value.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedAnalytics;