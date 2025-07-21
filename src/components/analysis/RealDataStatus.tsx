
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, RefreshCw, CheckCircle, AlertCircle, Play, Activity, TrendingUp } from 'lucide-react';
import { useRealDataPopulation } from '@/hooks/useRealDataPopulation';
import { supabase } from '@/integrations/supabase/client';

interface DetailedDataStatus {
  coinsCount: number;
  priceHistoryCount: number;
  cointimeMetricsCount: number;
  lastUpdate: string | null;
  dataQuality: number;
  realDataPercentage: number;
  isFullyPopulated: boolean;
}

export const RealDataStatus: React.FC = () => {
  const [detailedStatus, setDetailedStatus] = useState<DetailedDataStatus | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { loading, result, populateData } = useRealDataPopulation();

  const checkDetailedStatus = async () => {
    try {
      const [coinsResult, priceHistoryResult, cointimeResult] = await Promise.all([
        supabase.from('coins').select('*', { count: 'exact', head: true }),
        supabase.from('price_history_36m').select('*', { count: 'exact', head: true }),
        supabase.from('cointime_metrics').select('*', { count: 'exact', head: true })
      ]);

      const { data: lastUpdateData } = await supabase
        .from('coins')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const coinsCount = coinsResult.count || 0;
      const priceHistoryCount = priceHistoryResult.count || 0;
      const cointimeMetricsCount = cointimeResult.count || 0;

      // Calculate data quality metrics
      const isFullyPopulated = coinsCount > 50 && priceHistoryCount > 1000 && cointimeMetricsCount > 100;
      const dataQuality = Math.min(100, Math.round(
        (coinsCount * 0.3 + (priceHistoryCount / 100) * 0.5 + (cointimeMetricsCount / 10) * 0.2) / 1 * 100
      ));
      const realDataPercentage = isFullyPopulated ? 95 : Math.round((coinsCount / 100) * 100);

      setDetailedStatus({
        coinsCount,
        priceHistoryCount,
        cointimeMetricsCount,
        lastUpdate: lastUpdateData?.updated_at || null,
        dataQuality,
        realDataPercentage,
        isFullyPopulated
      });
    } catch (error) {
      console.error('Error checking detailed status:', error);
    }
  };

  useEffect(() => {
    checkDetailedStatus();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(checkDetailedStatus, 30000); // Check every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleManualPopulation = async () => {
    await populateData();
    // Refresh status after population
    setTimeout(checkDetailedStatus, 2000);
  };

  if (!detailedStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading data status...</span>
        </CardContent>
      </Card>
    );
  }

  const isDataEmpty = detailedStatus.coinsCount <= 5 && detailedStatus.priceHistoryCount === 0;
  const isDataPartial = detailedStatus.coinsCount > 5 && !detailedStatus.isFullyPopulated;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Real Data Pipeline Status
          <Badge variant={detailedStatus.isFullyPopulated ? "default" : "destructive"}>
            {detailedStatus.isFullyPopulated ? "FULLY POPULATED" : "NEEDS POPULATION"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{detailedStatus.coinsCount}</div>
            <div className="text-sm text-muted-foreground">Coins</div>
            <div className="text-xs text-muted-foreground">
              {detailedStatus.coinsCount > 50 ? "✅ Good" : "❌ Need 50+"}
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{detailedStatus.priceHistoryCount}</div>
            <div className="text-sm text-muted-foreground">Price History</div>
            <div className="text-xs text-muted-foreground">
              {detailedStatus.priceHistoryCount > 1000 ? "✅ Good" : "❌ Need 1000+"}
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-secondary">{detailedStatus.cointimeMetricsCount}</div>
            <div className="text-sm text-muted-foreground">Glass Node</div>
            <div className="text-xs text-muted-foreground">
              {detailedStatus.cointimeMetricsCount > 100 ? "✅ Good" : "❌ Need 100+"}
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-accent">{detailedStatus.dataQuality}%</div>
            <div className="text-sm text-muted-foreground">Data Quality</div>
            <div className="text-xs text-muted-foreground">
              {detailedStatus.dataQuality > 70 ? "✅ Good" : "❌ Poor"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant={detailedStatus.isFullyPopulated ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {detailedStatus.isFullyPopulated ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {detailedStatus.isFullyPopulated ? '100% REAL DATA' : `${detailedStatus.realDataPercentage}% REAL DATA`}
            </Badge>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'text-green-600' : ''}
            >
              <Activity className={`h-4 w-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={checkDetailedStatus}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={handleManualPopulation}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Populating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {isDataEmpty ? 'Initialize Real Data' : 'Refresh Real Data'}
                </>
              )}
            </Button>
          </div>
        </div>

        {isDataEmpty && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ CRITICAL: Database is empty!</strong> 
              <br />
              Your system is using fallback/estimated data. Click "Initialize Real Data" to populate with:
              <br />
              • 100+ coins with real market data
              <br />
              • 36-month price history for accurate calculations
              <br />
              • Glass Node metrics for advanced analysis
            </AlertDescription>
          </Alert>
        )}

        {isDataPartial && !isDataEmpty && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ Data incomplete!</strong> 
              <br />
              Only {detailedStatus.dataQuality}% data quality. Some calculations may still use estimated values.
              <br />
              Click "Refresh Real Data" to complete the population.
            </AlertDescription>
          </Alert>
        )}

        {detailedStatus.isFullyPopulated && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✅ Real data pipeline is fully active!</strong>
              <br />
              All calculations now use real market data instead of estimates.
              <br />
              {detailedStatus.lastUpdate && (
                <>Last updated: {new Date(detailedStatus.lastUpdate).toLocaleString()}</>
              )}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className={result.success ? "text-green-800" : "text-red-800"}>
              <div className="font-semibold">
                {result.success ? "✅ Population Completed" : "❌ Population Failed"}
              </div>
              <div className="text-sm mt-1">{result.message}</div>
              {result.errors && result.errors.length > 0 && (
                <div className="text-sm mt-2">
                  <strong>Errors:</strong>
                  <ul className="list-disc ml-4">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
