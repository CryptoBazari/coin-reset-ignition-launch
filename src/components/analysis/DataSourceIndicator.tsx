import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Calculator,
  Database,
  Zap
} from 'lucide-react';

interface DataSourceIndicatorProps {
  isRealData: boolean;
  dataType: 'price' | 'beta' | 'cagr' | 'volatility' | 'metrics' | 'analysis';
  confidence?: 'high' | 'medium' | 'low';
  lastUpdated?: string;
  className?: string;
}

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  isRealData,
  dataType,
  confidence = 'medium',
  lastUpdated,
  className = ''
}) => {
  const getIcon = () => {
    if (isRealData) {
      return <CheckCircle className="h-3 w-3" />;
    }
    return <Calculator className="h-3 w-3" />;
  };

  const getVariant = () => {
    if (isRealData) {
      return confidence === 'high' ? 'default' : 'secondary';
    }
    return 'outline';
  };

  const getLabel = () => {
    if (isRealData) {
      return confidence === 'high' ? 'REAL DATA' : 'REAL DATA (PARTIAL)';
    }
    return 'ESTIMATED';
  };

  const getDescription = () => {
    const typeDescriptions = {
      price: isRealData ? 'Live market price from CoinMarketCap' : 'Estimated based on market patterns',
      beta: isRealData ? 'Calculated from 36-month price history vs S&P 500' : 'Estimated beta coefficient',
      cagr: isRealData ? 'Actual 36-month compound annual growth rate' : 'Estimated growth rate',
      volatility: isRealData ? 'Historical volatility from real price data' : 'Estimated volatility',
      metrics: isRealData ? 'On-chain metrics from Glass Node API' : 'Estimated blockchain metrics',
      analysis: isRealData ? 'Investment analysis using real market data' : 'Analysis using estimated data points'
    };

    return typeDescriptions[dataType];
  };

  const getConfidenceColor = () => {
    if (!isRealData) return 'text-orange-600';
    
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={getVariant()} 
            className={`flex items-center gap-1 text-xs ${className}`}
          >
            {getIcon()}
            {getLabel()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 max-w-xs">
            <div className="font-medium flex items-center gap-2">
              {isRealData ? (
                <Database className="h-4 w-4 text-green-600" />
              ) : (
                <Calculator className="h-4 w-4 text-orange-600" />
              )}
              {getLabel()}
            </div>
            <div className="text-sm text-muted-foreground">
              {getDescription()}
            </div>
            {isRealData && lastUpdated && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Updated: {new Date(lastUpdated).toLocaleDateString()}
              </div>
            )}
            {!isRealData && (
              <div className="text-xs text-orange-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Consider populating real data for accuracy
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DataSourceIndicator;