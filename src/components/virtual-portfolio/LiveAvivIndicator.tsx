import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, Clock } from 'lucide-react';
import { bitcoinGlassNodeService } from '@/services/bitcoinGlassNodeService';

export const LiveAvivIndicator: React.FC = () => {
  const [avivData, setAvivData] = useState<{
    ratio: number;
    lastUpdated: string;
    isLoading: boolean;
  }>({
    ratio: 0,
    lastUpdated: '',
    isLoading: true
  });

  const fetchAvivData = async (bypassCache = false) => {
    try {
      setAvivData(prev => ({ ...prev, isLoading: true }));
      
      if (bypassCache) {
        bitcoinGlassNodeService.clearCache();
        console.log('🔄 Cache cleared - fetching fresh AVIV data');
      }
      
      const bitcoinData = await bitcoinGlassNodeService.getBitcoinCointimeData();
      
      setAvivData({
        ratio: bitcoinData.avivRatio,
        lastUpdated: bitcoinData.lastUpdated,
        isLoading: false
      });
      
      console.log(`📊 Live AVIV Ratio Updated: ${bitcoinData.avivRatio.toFixed(3)}`);
    } catch (error) {
      console.error('❌ Failed to fetch live AVIV data:', error);
      setAvivData(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchAvivData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchAvivData(), 300000);
    return () => clearInterval(interval);
  }, []);

  const getAvivStatus = (ratio: number) => {
    if (ratio > 2.5) return { status: 'Overbought', color: 'destructive', bgColor: 'bg-destructive/10' };
    if (ratio < 0.55) return { status: 'Oversold', color: 'default', bgColor: 'bg-success/10' };
    return { status: 'Neutral', color: 'secondary', bgColor: 'bg-warning/10' };
  };

  const getMarketTiming = (ratio: number) => {
    if (ratio < 0.8) return { signal: 'Strong Buy', confidence: 85 };
    if (ratio < 1.2) return { signal: 'Buy', confidence: 70 };
    if (ratio < 2.0) return { signal: 'Hold', confidence: 60 };
    return { signal: 'Caution', confidence: 80 };
  };

  const status = getAvivStatus(avivData.ratio);
  const timing = getMarketTiming(avivData.ratio);
  const lastUpdate = avivData.lastUpdated ? new Date(avivData.lastUpdated) : null;

  return (
    <Card className={status.bgColor}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Live Bitcoin AVIV Ratio
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchAvivData(true)}
            disabled={avivData.isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${avivData.isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {avivData.isLoading ? '...' : avivData.ratio.toFixed(3)}
          </div>
          <Badge variant={status.color as any}>
            {status.status}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Market Signal:</span>
          <span className="font-medium">{timing.signal}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Confidence:</span>
          <span className="font-medium">{timing.confidence}%</span>
        </div>
        
        {lastUpdate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <Clock className="w-3 h-3" />
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground pt-1">
          Source: Glass Node API (Live)
        </div>
      </CardContent>
    </Card>
  );
};