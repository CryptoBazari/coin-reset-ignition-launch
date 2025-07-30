import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertCircle, Clock, TrendingUp, TrendingDown, Coins, DollarSign, Zap } from 'lucide-react';
import { useUnifiedPortfolioData } from '@/hooks/useUnifiedPortfolioData';

interface PortfolioAllocationChartProps {
  portfolioId: string;
  title?: string;
}

// Crypto-specific colors with gradients
const CRYPTO_COLORS = {
  'BTC': '#F7931A',
  'ETH': '#627EEA', 
  'SOL': '#9945FF',
  'ADA': '#0033AD',
  'DOT': '#E6007A',
  'AVAX': '#E84142',
  'MATIC': '#8247E5',
  'LINK': '#375BD2',
  'UNI': '#FF007A',
  'ATOM': '#2E3148'
} as const;

const getCryptoColor = (symbol: string, index: number): string => {
  return CRYPTO_COLORS[symbol as keyof typeof CRYPTO_COLORS] || 
         `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
};

const getCryptoIcon = (symbol: string) => {
  const iconMap: Record<string, any> = {
    'BTC': Coins,
    'ETH': Zap,
    'SOL': TrendingUp,
    'ADA': DollarSign,
    'default': Coins
  };
  return iconMap[symbol] || iconMap.default;
};

const PortfolioAllocationChart: React.FC<PortfolioAllocationChartProps> = ({ 
  portfolioId, 
  title = "Portfolio Allocation" 
}) => {
  const { portfolioData, loading, error, refreshData, lastUpdated } = useUnifiedPortfolioData(portfolioId);

  // Enhanced allocations with crypto colors
  const enhancedAllocations = portfolioData?.allocations.map((allocation, index) => ({
    ...allocation,
    color: getCryptoColor(allocation.symbol, index),
    icon: getCryptoIcon(allocation.symbol)
  })) || [];

  const totalValue = portfolioData?.totalValue || 0;
  const largestHolding = enhancedAllocations.reduce((max, current) => 
    current.percentage > max.percentage ? current : max, enhancedAllocations[0]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const IconComponent = getCryptoIcon(data.symbol);
      
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <IconComponent className="w-4 h-4" style={{ color: data.color }} />
            <p className="font-semibold text-foreground">{data.symbol}</p>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground">
              {data.percentage.toFixed(1)}% of portfolio
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => (
    <div className="mt-6 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {enhancedAllocations.map((entry, index) => {
          const IconComponent = entry.icon;
          return (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="absolute inset-0 rounded-full animate-pulse opacity-30"
                       style={{ backgroundColor: entry.color }} />
                </div>
                <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <div>
                  <p className="font-medium text-sm">{entry.symbol}</p>
                  <p className="text-xs text-muted-foreground">{entry.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{entry.percentage.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  ${entry.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center h-80">
            <div className="text-center space-y-4">
              <Skeleton className="w-48 h-48 rounded-full mx-auto" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 mx-auto" />
                <Skeleton className="h-3 w-24 mx-auto" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <div className="text-destructive">{error}</div>
            <Button variant="outline" onClick={refreshData} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolioData || portfolioData.allocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-muted-foreground">No assets found in portfolio</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {enhancedAllocations.length} assets • ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {lastUpdated.toLocaleTimeString()}
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={loading}
              className="hover:bg-primary/10"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Portfolio Summary Stats */}
        {largestHolding && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Largest Holding</p>
                <p className="font-semibold text-sm">{largestHolding.symbol} ({largestHolding.percentage.toFixed(1)}%)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Diversification</p>
                <p className="font-semibold text-sm">
                  {enhancedAllocations.length > 5 ? 'Well Diversified' : 'Concentrated'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
              <Zap className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Live Data</p>
                <p className="font-semibold text-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Enhanced Donut Chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={enhancedAllocations}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  className="drop-shadow-sm"
                >
                  {enhancedAllocations.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={entry.color}
                      strokeWidth={2}
                      className="hover:brightness-110 transition-all duration-200"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Content */}
            <div className="relative -mt-60 flex flex-col items-center justify-center h-32 pointer-events-none">
              <p className="text-2xl font-bold text-foreground">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
            </div>
          </div>
          
          {/* Enhanced Legend */}
          <div className="lg:w-80">
            <CustomLegend />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioAllocationChart;