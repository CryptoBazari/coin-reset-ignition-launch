import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertCircle, Clock, TrendingUp, TrendingDown, Coins, DollarSign, Zap, Info } from 'lucide-react';
import { useUnifiedPortfolioData } from '@/hooks/useUnifiedPortfolioData';

interface PortfolioAllocationChartProps {
  portfolioId: string;
  title?: string;
}

// Crypto-specific colors with gradients
const CRYPTO_COLORS = {
  'BTC': { primary: '#F7931A', gradient: 'linear-gradient(135deg, #F7931A, #FFB347)' },
  'ETH': { primary: '#627EEA', gradient: 'linear-gradient(135deg, #627EEA, #8FA4F3)' },
  'SOL': { primary: '#9945FF', gradient: 'linear-gradient(135deg, #9945FF, #C77DFF)' },
  'ADA': { primary: '#0033AD', gradient: 'linear-gradient(135deg, #0033AD, #4169E1)' },
  'DOT': { primary: '#E6007A', gradient: 'linear-gradient(135deg, #E6007A, #FF69B4)' },
  'AVAX': { primary: '#E84142', gradient: 'linear-gradient(135deg, #E84142, #FF6B6B)' },
  'MATIC': { primary: '#8247E5', gradient: 'linear-gradient(135deg, #8247E5, #A78BFA)' },
  'LINK': { primary: '#375BD2', gradient: 'linear-gradient(135deg, #375BD2, #60A5FA)' },
  'UNI': { primary: '#FF007A', gradient: 'linear-gradient(135deg, #FF007A, #FF69B4)' },
  'ATOM': { primary: '#2E3148', gradient: 'linear-gradient(135deg, #2E3148, #6B7280)' }
} as const;

const getCryptoColor = (symbol: string, index: number): string => {
  const colorConfig = CRYPTO_COLORS[symbol as keyof typeof CRYPTO_COLORS];
  return colorConfig?.primary || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
};

const getCryptoGradient = (symbol: string, index: number): string => {
  const colorConfig = CRYPTO_COLORS[symbol as keyof typeof CRYPTO_COLORS];
  return colorConfig?.gradient || `linear-gradient(135deg, hsl(${(index * 137.5) % 360}, 70%, 50%), hsl(${(index * 137.5 + 30) % 360}, 70%, 60%))`;
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
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const { portfolioData, loading, error, refreshData, lastUpdated } = useUnifiedPortfolioData(portfolioId);

  // Enhanced allocations with crypto colors and gradients
  const enhancedAllocations = portfolioData?.allocations.map((allocation, index) => ({
    ...allocation,
    color: getCryptoColor(allocation.symbol, index),
    gradient: getCryptoGradient(allocation.symbol, index),
    icon: getCryptoIcon(allocation.symbol),
    // Mock 24h change data (in real app, this would come from API)
    change24h: (Math.random() - 0.5) * 10, // Random change between -5% to +5%
    isStale: false // Mock data staleness indicator
  })) || [];

  const totalValue = portfolioData?.totalValue || 0;
  const largestHolding = enhancedAllocations.reduce((max, current) => 
    current.percentage > max.percentage ? current : max, enhancedAllocations[0]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const IconComponent = getCryptoIcon(data.symbol);
      
      return (
        <div 
          className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-xl animate-scale-in"
          role="tooltip"
          aria-label={`${data.symbol} allocation details`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ background: data.gradient }}
            />
            <IconComponent className="w-4 h-4" style={{ color: data.color }} />
            <p className="font-semibold text-foreground">{data.symbol}</p>
            {data.isStale && (
              <Badge variant="destructive" className="text-xs">Stale</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{data.name}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Value:</span>
              <span className="text-sm font-bold">
                ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Allocation:</span>
              <span className="text-sm font-medium">{data.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">24h Change:</span>
              <span className={`text-sm font-medium flex items-center gap-1 ${
                data.change24h >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {data.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(data.change24h).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => (
    <div className="mt-6 space-y-3">
      <div className="grid grid-cols-1 gap-3">
        {enhancedAllocations.map((entry, index) => {
          const IconComponent = entry.icon;
          const isSelected = selectedAsset === entry.symbol;
          
          return (
            <div 
              key={index} 
              className={`
                flex items-center justify-between p-4 rounded-lg border transition-all duration-200 cursor-pointer
                ${isSelected 
                  ? 'bg-primary/10 border-primary shadow-lg scale-[1.02]' 
                  : 'bg-muted/30 hover:bg-muted/60 border-border hover:border-border/60 hover:scale-[1.01]'
                }
                ${entry.isStale ? 'opacity-75' : ''}
              `}
              onClick={() => setSelectedAsset(isSelected ? null : entry.symbol)}
              role="button"
              tabIndex={0}
              aria-label={`Select ${entry.symbol} for details`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedAsset(isSelected ? null : entry.symbol);
                }
              }}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  {/* Gradient circle with pulse animation */}
                  <div 
                    className="w-6 h-6 rounded-full shadow-lg border-2 border-white"
                    style={{ background: entry.gradient }}
                  />
                  {!entry.isStale && (
                    <div 
                      className="absolute inset-0 rounded-full animate-pulse opacity-40"
                      style={{ backgroundColor: entry.color }}
                    />
                  )}
                  {entry.isStale && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white animate-pulse" />
                  )}
                </div>
                
                <IconComponent 
                  className={`w-5 h-5 transition-colors ${
                    isSelected ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`} 
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{entry.symbol}</p>
                    {entry.isStale && (
                      <Badge variant="outline" className="text-xs">Stale</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{entry.name}</p>
                </div>
              </div>
              
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{entry.percentage.toFixed(1)}%</p>
                  <div className={`flex items-center text-xs ${
                    entry.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {entry.change24h >= 0 ? 
                      <TrendingUp className="w-3 h-3" /> : 
                      <TrendingDown className="w-3 h-3" />
                    }
                    {Math.abs(entry.change24h).toFixed(1)}%
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  ${entry.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Additional Portfolio Insights */}
      {selectedAsset && (
        <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-primary" />
            <p className="font-medium text-sm">Asset Insights</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Click on other assets to compare, or click again to close details view.
          </p>
        </div>
      )}
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

  // Data staleness check
  const isDataStale = lastUpdated && (Date.now() - lastUpdated.getTime()) > 5 * 60 * 1000; // 5 minutes

  return (
    <Card className="overflow-hidden" role="region" aria-label="Portfolio allocation chart">
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
              <Badge 
                variant={isDataStale ? "destructive" : "secondary"} 
                className="text-xs animate-fade-in"
              >
                <Clock className="w-3 h-3 mr-1" />
                {lastUpdated.toLocaleTimeString()}
                {isDataStale && " (Stale)"}
              </Badge>
            )}
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                isDataStale ? 'bg-red-500' : 'bg-green-500 animate-pulse'
              }`} />
              <span className="text-xs text-muted-foreground">
                {isDataStale ? 'Offline' : 'Live'}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={loading}
              className="hover:bg-primary/10 transition-all duration-200 hover:scale-105"
              aria-label="Refresh portfolio data"
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
      
      <CardContent className="p-4 lg:p-6">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Enhanced Donut Chart */}
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <defs>
                  {enhancedAllocations.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${entry.symbol}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={enhancedAllocations}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={125}
                  paddingAngle={2}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                  className="drop-shadow-lg"
                  onMouseEnter={(_, index) => setSelectedAsset(enhancedAllocations[index]?.symbol || null)}
                  onMouseLeave={() => setSelectedAsset(null)}
                >
                  {enhancedAllocations.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-${entry.symbol})`}
                      stroke="white"
                      strokeWidth={3}
                      className={`
                        transition-all duration-300 cursor-pointer
                        ${selectedAsset === entry.symbol ? 'drop-shadow-2xl' : 'hover:brightness-110'}
                        ${entry.isStale ? 'opacity-60' : ''}
                      `}
                      style={{
                        filter: selectedAsset === entry.symbol ? 'brightness(1.1) drop-shadow(0 0 8px rgba(0,0,0,0.3))' : undefined
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Enhanced Center Content */}
            <div className="relative -mt-60 flex flex-col items-center justify-center h-32 pointer-events-none">
              <div className="text-center space-y-1">
                <p className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                {selectedAsset && (
                  <p className="text-xs text-primary font-medium animate-fade-in">
                    {selectedAsset} Selected
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Enhanced Legend */}
          <div className="xl:w-96 w-full">
            <CustomLegend />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioAllocationChart;