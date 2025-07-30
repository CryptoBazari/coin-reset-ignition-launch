import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { fetchCoinPrices } from '@/services/coinMarketCapService';

interface AllocationData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface PortfolioAllocationChartProps {
  portfolioId: string;
  title?: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
];

const PortfolioAllocationChart = ({ portfolioId, title = "Portfolio Allocation" }: PortfolioAllocationChartProps) => {
  const [data, setData] = useState<AllocationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllocationData();
  }, [portfolioId]);

  // Add a ref for manual refresh capability
  const refreshData = () => {
    console.log('🔄 Manually refreshing allocation data for portfolio:', portfolioId);
    fetchAllocationData();
  };

  const fetchAllocationData = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching fresh allocation data for portfolio:', portfolioId);
      
      const { data: assets, error } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins!inner(name, symbol)
        `)
        .eq('portfolio_id', portfolioId)
        .gt('total_amount', 0);

      if (error) throw error;
      
      console.log(`📊 Found ${assets?.length || 0} assets with holdings > 0`);
      if (assets) {
        assets.forEach(asset => {
          console.log(`   - ${asset.virtual_coins.symbol}: ${asset.total_amount} @ $${asset.average_price}`);
        });
      }

      // Fetch live prices for current market value calculation
      const symbols = assets.map(asset => asset.virtual_coins.symbol);
      let liveCoinsData = [];
      
      console.log('💰 Fetching live prices for symbols:', symbols);
      try {
        liveCoinsData = await fetchCoinPrices(symbols);
        console.log('💰 Live prices fetched successfully:', liveCoinsData.map(coin => `${coin.symbol}: $${coin.current_price}`));
      } catch (error) {
        console.warn('Could not fetch live prices, using average price:', error);
      }

      // Calculate allocation data using current market values
      let totalValue = 0;
      const assetValues = assets.map(asset => {
        const liveCoinData = liveCoinsData.find(coin => coin.symbol === asset.virtual_coins.symbol);
        const currentPrice = liveCoinData?.current_price || asset.average_price;
        const currentValue = asset.total_amount * currentPrice;
        
        console.log(`💎 ${asset.virtual_coins.symbol}: ${asset.total_amount} * $${currentPrice} = $${currentValue.toFixed(2)} ${liveCoinData ? '(live)' : '(avg)'}`);
        
        totalValue += currentValue;
        return { asset, currentValue };
      });
      
      console.log(`💰 Total portfolio value: $${totalValue.toFixed(2)}`);
      
      const allocationData: AllocationData[] = assetValues.map(({ asset, currentValue }, index) => {
        const percentage = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
        return {
          name: asset.virtual_coins.symbol,
          value: currentValue,
          percentage,
          color: COLORS[index % COLORS.length]
        };
      });

      setData(allocationData);
      console.log('✅ Allocation data updated:', allocationData.map(item => `${item.name}: ${item.percentage.toFixed(1)}% ($${item.value.toFixed(2)})`));
    } catch (error) {
      console.error('❌ Error fetching allocation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Value: ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            Allocation: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">
              {entry.value} ({data[index]?.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
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
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <button
            onClick={refreshData}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            title="Refresh allocation data"
          >
            🔄
          </button>
        </div>
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
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PortfolioAllocationChart;