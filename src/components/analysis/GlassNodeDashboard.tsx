
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, TrendingUp, ArrowUpDown, Clock, Shield, Zap } from 'lucide-react';
import { getOnChainAnalysis, calculateCointimeMetrics } from '@/services/glassNodeService';

interface GlassNodeDashboardProps {
  coinSymbol: string;
}

const GlassNodeDashboard = ({ coinSymbol }: GlassNodeDashboardProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');

  useEffect(() => {
    fetchGlassNodeData();
  }, [coinSymbol, timeframe]);

  const fetchGlassNodeData = async () => {
    setLoading(true);
    try {
      const analysis = await getOnChainAnalysis(coinSymbol, parseInt(timeframe));
      const cointimeMetrics = calculateCointimeMetrics(analysis.price, analysis.cointime);
      
      setData({
        ...analysis,
        cointimeMetrics
      });
    } catch (error) {
      console.error('Error fetching Glass Node data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="h-64 flex items-center justify-center">
              Loading Glass Node analytics...
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="h-64 flex items-center justify-center">
          No Glass Node data available
        </CardContent>
      </Card>
    );
  }

  const formatChartData = (rawData: any[]) => {
    return rawData.map(point => ({
      date: new Date(point.timestamp).toLocaleDateString(),
      value: point.value,
      timestamp: point.timestamp
    }));
  };

  const getHealthScore = (value: number, thresholds: [number, number, number]) => {
    if (value > thresholds[2]) return { score: 'Excellent', color: 'bg-green-500' };
    if (value > thresholds[1]) return { score: 'Good', color: 'bg-blue-500' };
    if (value > thresholds[0]) return { score: 'Fair', color: 'bg-yellow-500' };
    return { score: 'Poor', color: 'bg-red-500' };
  };

  const activeAddressesHealth = getHealthScore(
    data.activeAddresses[data.activeAddresses.length - 1]?.value || 0,
    [10000, 50000, 100000]
  );

  const exchangeFlowHealth = getHealthScore(
    (data.exchangeFlow.outflow[data.exchangeFlow.outflow.length - 1]?.value || 0) -
    (data.exchangeFlow.inflow[data.exchangeFlow.inflow.length - 1]?.value || 0),
    [-1000, 0, 1000]
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${activeAddressesHealth.color}`} />
              <span className="text-sm font-medium">{activeAddressesHealth.score}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(data.activeAddresses[data.activeAddresses.length - 1]?.value || 0).toLocaleString()} active addresses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exchange Flow</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${exchangeFlowHealth.color}`} />
              <span className="text-sm font-medium">{exchangeFlowHealth.score}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Net flow: {((data.exchangeFlow.outflow[data.exchangeFlow.outflow.length - 1]?.value || 0) -
              (data.exchangeFlow.inflow[data.exchangeFlow.inflow.length - 1]?.value || 0)).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cointime Price</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.cointimeMetrics.cointimePrice.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ratio: {data.cointimeMetrics.cointimeRatio.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supply Distribution</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Liquid:</span>
                <span>{((data.supply.liquid[data.supply.liquid.length - 1]?.value || 0) / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between">
                <span>Illiquid:</span>
                <span>{((data.supply.illiquid[data.supply.illiquid.length - 1]?.value || 0) / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {[
          { label: '7D', value: '7' },
          { label: '30D', value: '30' },
          { label: '90D', value: '90' },
          { label: '1Y', value: '365' }
        ].map(option => (
          <Badge
            key={option.value}
            variant={timeframe === option.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTimeframe(option.value)}
          >
            {option.label}
          </Badge>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="price" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="price">Price & Activity</TabsTrigger>
          <TabsTrigger value="exchange">Exchange Flow</TabsTrigger>
          <TabsTrigger value="supply">Supply Analysis</TabsTrigger>
          <TabsTrigger value="cointime">Cointime Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="price" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Price Movement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatChartData(data.price)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Active Addresses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={formatChartData(data.activeAddresses)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exchange" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Exchange Inflow vs Outflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line 
                    data={formatChartData(data.exchangeFlow.inflow)}
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2} 
                    dot={false}
                    name="Inflow"
                  />
                  <Line 
                    data={formatChartData(data.exchangeFlow.outflow)}
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={false}
                    name="Outflow"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supply" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Liquid vs Illiquid Supply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area 
                    data={formatChartData(data.supply.liquid)}
                    type="monotone" 
                    dataKey="value" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.6}
                    name="Liquid"
                  />
                  <Area 
                    data={formatChartData(data.supply.illiquid)}
                    type="monotone" 
                    dataKey="value" 
                    stackId="1"
                    stroke="hsl(var(--secondary))" 
                    fill="hsl(var(--secondary))" 
                    fillOpacity={0.6}
                    name="Illiquid"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cointime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Cointime Destroyed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={formatChartData(data.cointime)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlassNodeDashboard;
