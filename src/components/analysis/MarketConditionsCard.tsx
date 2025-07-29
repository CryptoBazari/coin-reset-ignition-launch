import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import { MarketConditions } from '@/types/investment';
import { bitcoinGlassNodeService } from '@/services/bitcoinGlassNodeService';

interface MarketConditionsCardProps {
  marketConditions: MarketConditions;
}

export const MarketConditionsCard: React.FC<MarketConditionsCardProps> = ({
  marketConditions
}) => {
  const [liveAvivRatio, setLiveAvivRatio] = useState<number | null>(null);
  const [isLoadingAviv, setIsLoadingAviv] = useState(false);

  const fetchLiveAvivRatio = async () => {
    try {
      setIsLoadingAviv(true);
      console.log('📊 Fetching live AVIV ratio for market conditions card...');
      
      const bitcoinData = await bitcoinGlassNodeService.getBitcoinCointimeData();
      setLiveAvivRatio(bitcoinData.avivRatio);
      
      console.log(`📊 Live AVIV Ratio: ${bitcoinData.avivRatio.toFixed(3)} (updated in market conditions)`);
    } catch (error) {
      console.error('❌ Failed to fetch live AVIV ratio:', error);
      setLiveAvivRatio(marketConditions.avivRatio || 1.0);
    } finally {
      setIsLoadingAviv(false);
    }
  };

  useEffect(() => {
    fetchLiveAvivRatio();
  }, [marketConditions.avivRatio]);

  // Use live AVIV ratio if available, otherwise fall back to market conditions
  const currentAvivRatio = liveAvivRatio ?? marketConditions.avivRatio;
  const getBitcoinStateConfig = (state: string) => {
    switch (state) {
      case 'bullish':
        return {
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-success',
          bgColor: 'bg-success/10',
          description: 'Favorable environment for crypto investments',
          recommendation: 'Consider increasing crypto allocation'
        };
      case 'bearish':
        return {
          icon: <TrendingDown className="w-5 h-5" />,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          description: 'Challenging environment with elevated risks',
          recommendation: 'Exercise caution and consider reducing exposure'
        };
      default:
        return {
          icon: <Minus className="w-5 h-5" />,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          description: 'Mixed signals requiring careful analysis',
          recommendation: 'Monitor closely and maintain balanced approach'
        };
    }
  };

  const getAvivAnalysis = (aviv?: number) => {
    if (!aviv) return null;
    
    if (aviv > 2.5) {
      return {
        status: 'Overbought',
        color: 'text-destructive',
        description: 'Bitcoin may be overvalued, potential correction ahead',
        risk: 'high'
      };
    } else if (aviv < 0.55) {
      return {
        status: 'Oversold',
        color: 'text-success',
        description: 'Bitcoin may be undervalued, potential buying opportunity',
        risk: 'low'
      };
    } else {
      return {
        status: 'Neutral',
        color: 'text-warning',
        description: 'Bitcoin trading within normal valuation range',
        risk: 'moderate'
      };
    }
  };

  const getFedRateImpact = (fedRateChange: number) => {
    if (Math.abs(fedRateChange) < 0.25) {
      return {
        impact: 'Minimal',
        color: 'text-muted-foreground',
        description: 'Limited impact on crypto markets'
      };
    } else if (fedRateChange > 0) {
      return {
        impact: 'Hawkish',
        color: 'text-destructive',
        description: 'Rate hikes typically pressure crypto prices'
      };
    } else {
      return {
        impact: 'Dovish',
        color: 'text-success',
        description: 'Rate cuts generally support crypto adoption'
      };
    }
  };

  const bitcoinState = getBitcoinStateConfig(marketConditions.bitcoinState);
  const avivAnalysis = getAvivAnalysis(currentAvivRatio);
  const fedImpact = getFedRateImpact(marketConditions.fedRateChange);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Market Conditions Analysis
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLiveAvivRatio}
            disabled={isLoadingAviv}
            className="h-7 px-2"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingAviv ? 'animate-spin' : ''}`} />
            {isLoadingAviv ? 'Updating...' : 'Refresh AVIV'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bitcoin State Overview */}
        <div className={`p-4 rounded-lg ${bitcoinState.bgColor}`}>
          <div className="flex items-center gap-3 mb-2">
            {bitcoinState.icon}
            <div>
              <div className="font-semibold">Bitcoin Market State</div>
              <Badge variant="outline" className={bitcoinState.color}>
                {marketConditions.bitcoinState.charAt(0).toUpperCase() + marketConditions.bitcoinState.slice(1)}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{bitcoinState.description}</p>
          <p className="text-sm font-medium">{bitcoinState.recommendation}</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* AVIV Ratio - Now using live data */}
          {currentAvivRatio && avivAnalysis && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-muted-foreground">AVIV Ratio</div>
                {liveAvivRatio && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span className="text-xs text-success">Live</span>
                  </div>
                )}
              </div>
              <div className={`text-xl font-bold ${avivAnalysis.color}`}>
                {isLoadingAviv ? '...' : currentAvivRatio.toFixed(3)}
              </div>
              <Badge variant="outline" className="mt-1 text-xs">
                {avivAnalysis.status}
              </Badge>
              <div className="text-xs text-muted-foreground mt-2">
                {avivAnalysis.description}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Source: Glass Node API
              </div>
            </div>
          )}

          {/* Smart Money Activity */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Smart Money</div>
            <div className={`text-lg font-semibold ${marketConditions.smartMoneyActivity ? 'text-destructive' : 'text-success'}`}>
              {marketConditions.smartMoneyActivity ? 'Selling' : 'Holding'}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {marketConditions.smartMoneyActivity 
                ? 'Institutional selling detected' 
                : 'Institutional confidence stable'
              }
            </div>
          </div>

          {/* Fed Rate Impact */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Fed Policy</div>
            <div className={`text-lg font-semibold ${fedImpact.color}`}>
              {fedImpact.impact}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {Math.abs(marketConditions.fedRateChange) > 0 
                ? `${marketConditions.fedRateChange > 0 ? '+' : ''}${(marketConditions.fedRateChange * 100).toFixed(1)}bps`
                : 'No change'
              }
            </div>
            <div className="text-xs text-muted-foreground">
              {fedImpact.description}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        {(marketConditions.vaultedSupply || marketConditions.activeSupply) && (
          <div>
            <h4 className="font-semibold mb-3">Supply Dynamics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketConditions.vaultedSupply && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Vaulted Supply</div>
                  <div className={`text-lg font-semibold ${marketConditions.vaultedSupply > 70 ? 'text-success' : 'text-warning'}`}>
                    {marketConditions.vaultedSupply.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {marketConditions.vaultedSupply > 70 ? 'High HODLing activity' : 'Moderate storage activity'}
                  </div>
                </div>
              )}
              
              {marketConditions.activeSupply && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Active Supply</div>
                  <div className={`text-lg font-semibold ${marketConditions.activeSupply > 50 ? 'text-warning' : 'text-success'}`}>
                    {marketConditions.activeSupply.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {marketConditions.activeSupply > 50 ? 'High trading activity' : 'Low selling pressure'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Alerts */}
        {marketConditions.bitcoinState === 'bearish' && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Bear Market Alert:</strong> Current conditions suggest elevated risk for all crypto investments. 
              Consider reducing position sizes and waiting for AVIV ratio below 0.55 before adding exposure.
            </AlertDescription>
          </Alert>
        )}

        {marketConditions.smartMoneyActivity && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Smart Money Activity:</strong> Institutional selling detected. Monitor price action closely 
              and consider taking profits or reducing exposure until selling pressure subsides.
            </AlertDescription>
          </Alert>
        )}

        {Math.abs(marketConditions.fedRateChange) > 0.5 && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Fed Policy Impact:</strong> Significant interest rate changes ({(marketConditions.fedRateChange * 100).toFixed(0)}bps) 
              may create volatility in crypto markets. Adjust position sizing accordingly.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};