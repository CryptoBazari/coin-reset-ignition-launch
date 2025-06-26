
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fetchCoinPrices } from '@/services/coinMarketCapService';

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

      // Get current market prices for accurate valuation
      const uniqueSymbols = [...new Set(transactions.map(t => t.virtual_coins.symbol))];
      let currentPrices = new Map();
      
      try {
        const liveData = await fetchCoinPrices(uniqueSymbols);
        liveData.forEach(coin => {
          currentPrices.set(coin.symbol, coin.current_price);
        });
        console.log('Fetched current prices for chart:', Object.fromEntries(currentPrices));
      } catch (error) {
        console.warn('Could not fetch current prices for chart:', error);
      }

      // Calculate portfolio movement over time
      const movementPoints = [];
      let cumulativeCostBasis = 0; // Total money invested
      let holdings = new Map(); // Track holdings by coin symbol

      transactions.forEach((transaction) => {
        const coinSymbol = transaction.virtual_coins.symbol;
        
        if (transaction.transaction_type === 'buy') {
          // Add to cost basis (money invested)
          cumulativeCostBasis += transaction.value + transaction.fee;
          
          // Update holdings
          const currentHolding = holdings.get(coinSymbol) || { amount: 0, totalCost: 0 };
          holdings.set(coinSymbol, {
            amount: currentHolding.amount + transaction.amount,
            totalCost: currentHolding.totalCost + transaction.value + transaction.fee
          });
        } else {
          // Sell transaction - reduce cost basis proportionally
          const currentHolding = holdings.get(coinSymbol) || { amount: 0, totalCost: 0 };
          const sellRatio = Math.min(transaction.amount / currentHolding.amount, 1);
          const costReduction = currentHolding.totalCost * sellRatio;
          
          cumulativeCostBasis -= costReduction;
          
          holdings.set(coinSymbol, {
            amount: Math.max(0, currentHolding.amount - transaction.amount),
            totalCost: Math.max(0, currentHolding.totalCost - costReduction)
          });
        }

        // Calculate current market value using live prices
        let currentMarketValue = 0;
        holdings.forEach((holding, symbol) => {
          if (holding.amount > 0) {
            const currentPrice = currentPrices.get(symbol) || transaction.price;
            currentMarketValue += holding.amount * currentPrice;
          }
        });

        // Calculate profit/loss
        const profitLoss = currentMarketValue - cumulativeCostBasis;
        const profitLossPercent = cumulativeCostBasis > 0 ? (profitLoss / cumulativeCostBasis) * 100 : 0;

        movementPoints.push({
          date: transaction.transaction_date,
          costBasis: cumulativeCostBasis,
          marketValue: currentMarketValue,
          profitLoss: profitLoss,
          profitLossPercent: profitLossPercent,
          transaction: `${transaction.transaction_type.toUpperCase()} ${transaction.amount} ${transaction.virtual_coins.symbol}`,
          transactionPrice: transaction.price,
          currentPrice: currentPrices.get(coinSymbol) || transaction.price
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
          <p className="text-sm text-blue-600">Start Capital: ${data.costBasis.toFixed(2)}</p>
          <p className="text-sm text-green-600">Market Value: ${data.marketValue.toFixed(2)}</p>
          <p className={`text-sm font-medium ${data.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            P&L: ${data.profitLoss >= 0 ? '+' : ''}${data.profitLoss.toFixed(2)} ({data.profitLossPercent >= 0 ? '+' : ''}{data.profitLossPercent.toFixed(2)}%)
          </p>
          <p className="text-xs text-gray-500 mt-1">{data.transaction}</p>
          <p className="text-xs text-gray-400">
            Transaction: ${data.transactionPrice.toFixed(4)} | Current: ${data.currentPrice.toFixed(4)}
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
        <p className="text-sm text-gray-500">
          Blue line shows total invested capital, green line shows current market value
        </p>
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
                dataKey="costBasis" 
                stroke="#2563EB" 
                strokeWidth={2}
                name="Start Capital (Cost Basis)"
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="marketValue" 
                stroke="#16A34A" 
                strokeWidth={2}
                name="Current Market Value"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioMovementChart;
