import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Target } from 'lucide-react';
import { VirtualPortfolio } from '@/types/virtualPortfolio';

interface PortfolioComparisonProps {
  portfolios: VirtualPortfolio[];
  currentPortfolioId: string;
}

const PortfolioComparison = ({ portfolios, currentPortfolioId }: PortfolioComparisonProps) => {
  const [comparePortfolioId, setComparePortfolioId] = useState<string>('');

  const currentPortfolio = portfolios.find(p => p.id === currentPortfolioId);
  const comparePortfolio = portfolios.find(p => p.id === comparePortfolioId);

  const comparisonData = [
    {
      metric: 'Total Value',
      current: currentPortfolio?.total_value || 0,
      compare: comparePortfolio?.total_value || 0,
    },
    {
      metric: 'All Time P&L',
      current: currentPortfolio?.all_time_profit || 0,
      compare: comparePortfolio?.all_time_profit || 0,
    }
  ];

  const ComparisonMetric = ({ 
    title, 
    currentValue, 
    compareValue, 
    format = 'currency' 
  }: { 
    title: string; 
    currentValue: number; 
    compareValue: number; 
    format?: 'currency' | 'percentage' 
  }) => {
    const difference = currentValue - compareValue;
    const percentDiff = compareValue !== 0 ? (difference / Math.abs(compareValue)) * 100 : 0;
    
    const formatValue = (value: number) => {
      if (format === 'currency') return `$${value.toFixed(2)}`;
      return `${value.toFixed(2)}%`;
    };

    return (
      <div className="p-4 border rounded-lg">
        <h4 className="font-medium text-sm text-gray-600 mb-2">{title}</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">{currentPortfolio?.name}</span>
            <span className="font-bold">{formatValue(currentValue)}</span>
          </div>
          {comparePortfolio && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm">{comparePortfolio.name}</span>
                <span className="font-bold">{formatValue(compareValue)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Difference</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {difference >= 0 ? '+' : ''}{formatValue(difference)}
                  </span>
                  <Badge variant={difference >= 0 ? 'default' : 'destructive'} className="text-xs">
                    {difference >= 0 ? '+' : ''}{percentDiff.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Portfolio Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">Compare with:</label>
            <Select value={comparePortfolioId} onValueChange={setComparePortfolioId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select portfolio to compare" />
              </SelectTrigger>
              <SelectContent>
                {portfolios
                  .filter(p => p.id !== currentPortfolioId)
                  .map(portfolio => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>

        {comparePortfolio && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComparisonMetric
                title="Portfolio Value"
                currentValue={currentPortfolio?.total_value || 0}
                compareValue={comparePortfolio.total_value}
              />
              <ComparisonMetric
                title="All Time P&L"
                currentValue={currentPortfolio?.all_time_profit || 0}
                compareValue={comparePortfolio.all_time_profit}
              />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                    labelFormatter={(label) => `Metric: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="current" 
                    fill="#3B82F6" 
                    name={currentPortfolio?.name || 'Current'} 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="compare" 
                    fill="#10B981" 
                    name={comparePortfolio.name} 
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!comparePortfolio && (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a portfolio to compare performance metrics</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioComparison;