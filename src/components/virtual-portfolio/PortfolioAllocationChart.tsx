
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchCoinPrices } from '@/services/coinMarketCapService';

interface PortfolioAllocationChartProps {
  portfolioId: string;
}

const COLORS = {
  'Bitcoin': '#F7931A',
  'Blue Chip': '#2563EB',
  'Small-Cap': '#16A34A'
};

const PortfolioAllocationChart = ({ portfolioId }: PortfolioAllocationChartProps) => {
  const { data: allocationData, isLoading } = useQuery({
    queryKey: ['portfolio-allocation', portfolioId],
    queryFn: async () => {
      const { data: assets, error } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins (symbol, name)
        `)
        .eq('portfolio_id', portfolioId)
        .gt('total_amount', 0.000000001);

      if (error) throw error;

      if (!assets || assets.length === 0) {
        return [];
      }

      // Get live prices for accurate valuation
      const symbols = assets.map(asset => asset.virtual_coins.symbol);
      let liveCoinsData = [];
      try {
        liveCoinsData = await fetchCoinPrices(symbols);
      } catch (error) {
        console.warn('Could not fetch live prices for allocation chart:', error);
      }

      const getLivePrice = (symbol: string) => {
        const coinData = liveCoinsData.find(coin => coin.symbol === symbol);
        return coinData?.current_price || null;
      };

      // Calculate allocation by category
      const categoryAllocations: { [key: string]: number } = {};
      let totalValue = 0;

      assets.forEach(asset => {
        const currentPrice = getLivePrice(asset.virtual_coins.symbol) || asset.average_price;
        const currentValue = asset.total_amount * currentPrice;
        
        categoryAllocations[asset.category] = (categoryAllocations[asset.category] || 0) + currentValue;
        totalValue += currentValue;
      });

      // Convert to percentage data for chart
      return Object.entries(categoryAllocations).map(([category, value]) => ({
        name: category,
        value: value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
      }));
    }
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            ${data.value.toFixed(2)} ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">Loading allocation data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!allocationData || allocationData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">No allocation data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Allocation by Basket</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ percentage }) => `${percentage.toFixed(1)}%`}
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {value}: ${allocationData.find(d => d.name === value)?.value.toFixed(2)}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioAllocationChart;
