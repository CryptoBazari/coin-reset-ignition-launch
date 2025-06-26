
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PortfolioMovementChartProps {
  portfolioId: string;
}

const PortfolioMovementChart = ({ portfolioId }: PortfolioMovementChartProps) => {
  const { data: movementData, isLoading } = useQuery({
    queryKey: ['portfolio-movement', portfolioId],
    queryFn: async () => {
      // Get all transactions for this portfolio ordered by date
      const { data: transactions, error } = await supabase
        .from('virtual_transactions')
        .select(`
          *,
          virtual_coins (symbol, name)
        `)
        .eq('portfolio_id', portfolioId)
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        return [];
      }

      // Calculate cumulative portfolio value over time
      const movementPoints = [];
      let cumulativeInvestment = 0;
      let cumulativeValue = 0;

      transactions.forEach((transaction, index) => {
        if (transaction.transaction_type === 'buy') {
          cumulativeInvestment += transaction.value + transaction.fee;
          cumulativeValue += transaction.value;
        } else {
          // For sell transactions, we need to calculate profit/loss
          const profit = transaction.value - (transaction.amount * transaction.price);
          cumulativeValue += profit;
        }

        movementPoints.push({
          date: transaction.transaction_date,
          investment: cumulativeInvestment,
          value: cumulativeValue,
          profit: cumulativeValue - cumulativeInvestment,
          transaction: `${transaction.transaction_type.toUpperCase()} ${transaction.amount} ${transaction.virtual_coins.symbol}`
        });
      });

      return movementPoints;
    }
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{format(new Date(label), 'MMM dd, yyyy')}</p>
          <p className="text-sm text-blue-600">Investment: ${data.investment.toFixed(2)}</p>
          <p className="text-sm text-green-600">Value: ${data.value.toFixed(2)}</p>
          <p className={`text-sm ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            P&L: ${data.profit >= 0 ? '+' : ''}${data.profit.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{data.transaction}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Movement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">Loading movement data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!movementData || movementData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Movement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">No transaction history available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Value Movement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={movementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="investment" 
                stroke="#2563EB" 
                strokeWidth={2}
                name="Investment"
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#16A34A" 
                strokeWidth={2}
                name="Portfolio Value"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioMovementChart;
