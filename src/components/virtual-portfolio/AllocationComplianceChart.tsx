import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fetchCoinPrices } from '@/services/coinMarketCapService';

interface AllocationData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  isCompliant: boolean;
  targetMin?: number;
  targetMax?: number;
}

interface AllocationComplianceChartProps {
  portfolioId: string;
  title?: string;
}

const BASKET_COLORS = {
  'Bitcoin': '#F7931A',
  'Blue Chip': '#627EEA', 
  'Small-Cap': '#FF6B6B'
};

const getBasketForSymbol = (symbol: string): 'Bitcoin' | 'Blue Chip' | 'Small-Cap' => {
  if (symbol === 'BTC') return 'Bitcoin';
  if (['ETH', 'BNB', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI'].includes(symbol)) return 'Blue Chip';
  return 'Small-Cap';
};

const getComplianceRules = (totalValue: number) => {
  if (totalValue <= 20000) {
    return { minBtc: 50, maxBluechip: 30, maxSmallcap: 20 };
  } else if (totalValue <= 100000) {
    return { minBtc: 70, maxBluechip: 20, maxSmallcap: 10 };
  } else {
    return { minBtc: 85, maxBluechip: 10, maxSmallcap: 5 };
  }
};

const AllocationComplianceChart = ({ portfolioId, title = "Asset Category Allocation" }: AllocationComplianceChartProps) => {
  const [data, setData] = useState<AllocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [complianceStatus, setComplianceStatus] = useState<'compliant' | 'non-compliant'>('compliant');
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    fetchAllocationData();
  }, [portfolioId]);

  const fetchAllocationData = async () => {
    try {
      setLoading(true);
      
      const { data: assets, error } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins!inner(name, symbol)
        `)
        .eq('portfolio_id', portfolioId)
        .gt('total_amount', 0);

      if (error) throw error;

      if (!assets || assets.length === 0) {
        setData([]);
        return;
      }

      // Fetch live prices
      const symbols = assets.map(asset => asset.virtual_coins.symbol);
      let liveCoinsData = [];
      
      try {
        liveCoinsData = await fetchCoinPrices(symbols);
      } catch (error) {
        console.warn('Could not fetch live prices:', error);
      }

      // Calculate current values by basket
      let totalValue = 0;
      const basketValues = { Bitcoin: 0, 'Blue Chip': 0, 'Small-Cap': 0 };

      assets.forEach(asset => {
        const liveCoinData = liveCoinsData.find(coin => coin.symbol === asset.virtual_coins.symbol);
        const currentPrice = liveCoinData?.current_price || asset.average_price;
        const currentValue = asset.total_amount * currentPrice;
        
        totalValue += currentValue;
        const basket = getBasketForSymbol(asset.virtual_coins.symbol);
        basketValues[basket] += currentValue;
      });

      // Get compliance rules based on portfolio value
      const rules = getComplianceRules(totalValue);
      
      // Calculate percentages and check compliance
      const allocationData: AllocationData[] = [];
      const complianceIssues: string[] = [];

      // Bitcoin allocation
      const btcPercentage = totalValue > 0 ? (basketValues.Bitcoin / totalValue) * 100 : 0;
      const btcCompliant = btcPercentage >= rules.minBtc;
      if (!btcCompliant) {
        complianceIssues.push(`Bitcoin allocation (${btcPercentage.toFixed(1)}%) is below minimum requirement of ${rules.minBtc}%`);
      }

      allocationData.push({
        name: 'Bitcoin',
        value: basketValues.Bitcoin,
        percentage: btcPercentage,
        color: BASKET_COLORS.Bitcoin,
        isCompliant: btcCompliant,
        targetMin: rules.minBtc
      });

      // Blue Chip allocation
      const bluechipPercentage = totalValue > 0 ? (basketValues['Blue Chip'] / totalValue) * 100 : 0;
      const bluechipCompliant = bluechipPercentage <= rules.maxBluechip;
      if (!bluechipCompliant) {
        complianceIssues.push(`Blue Chip allocation (${bluechipPercentage.toFixed(1)}%) exceeds maximum of ${rules.maxBluechip}%`);
      }

      allocationData.push({
        name: 'Blue Chip',
        value: basketValues['Blue Chip'],
        percentage: bluechipPercentage,
        color: BASKET_COLORS['Blue Chip'],
        isCompliant: bluechipCompliant,
        targetMax: rules.maxBluechip
      });

      // Small-Cap allocation
      const smallcapPercentage = totalValue > 0 ? (basketValues['Small-Cap'] / totalValue) * 100 : 0;
      const smallcapCompliant = smallcapPercentage <= rules.maxSmallcap;
      if (!smallcapCompliant) {
        complianceIssues.push(`Small-Cap allocation (${smallcapPercentage.toFixed(1)}%) exceeds maximum of ${rules.maxSmallcap}%`);
      }

      allocationData.push({
        name: 'Small-Cap',
        value: basketValues['Small-Cap'],
        percentage: smallcapPercentage,
        color: BASKET_COLORS['Small-Cap'],
        isCompliant: smallcapCompliant,
        targetMax: rules.maxSmallcap
      });

      // Filter out empty allocations
      const filteredData = allocationData.filter(item => item.value > 0);
      
      setData(filteredData);
      setComplianceStatus(complianceIssues.length === 0 ? 'compliant' : 'non-compliant');
      setIssues(complianceIssues);

    } catch (error) {
      console.error('Error fetching allocation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium flex items-center gap-2">
            {data.name}
            {data.isCompliant ? (
              <CheckCircle className="h-3 w-3 text-green-600" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-orange-600" />
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            Value: ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            Allocation: {data.percentage.toFixed(1)}%
          </p>
          {data.targetMin && (
            <p className="text-xs text-muted-foreground">
              Min Required: {data.targetMin}%
            </p>
          )}
          {data.targetMax && (
            <p className="text-xs text-muted-foreground">
              Max Allowed: {data.targetMax}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const item = data[index];
          return (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">
                {entry.value} ({item?.percentage.toFixed(1)}%)
                {item?.isCompliant ? (
                  <CheckCircle className="h-3 w-3 text-green-600 inline ml-1" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-orange-600 inline ml-1" />
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading allocation data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No allocation data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant={complianceStatus === 'compliant' ? "default" : "destructive"}>
            {complianceStatus === 'compliant' ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <AlertTriangle className="h-3 w-3 mr-1" />
            )}
            {complianceStatus === 'compliant' ? 'Compliant' : 'Non-Compliant'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke={entry.isCompliant ? 'transparent' : '#f59e0b'}
                  strokeWidth={entry.isCompliant ? 0 : 2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>

        {complianceStatus === 'non-compliant' && issues.length > 0 && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Compliance Issues:</div>
                {issues.map((issue, index) => (
                  <div key={index} className="text-sm">• {issue}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {complianceStatus === 'compliant' && (
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium text-green-800">
                Portfolio allocation is compliant with risk management guidelines.
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AllocationComplianceChart;