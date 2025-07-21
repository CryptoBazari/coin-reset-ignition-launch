import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Database, RefreshCw, CheckCircle, AlertCircle, Play } from 'lucide-react';

interface DataStatus {
  totalCoins: number;
  priceHistoryRecords: number;
  coinTimeMetrics: number;
  glassNodeSupported: number;
  lastUpdate: string | null;
  dataQuality: number;
}

export const RealDataStatus: React.FC = () => {
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    checkDataStatus();
    const interval = setInterval(checkDataStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkDataStatus = async () => {
    try {
      const [coinsResult, priceHistoryResult, coinTimeResult] = await Promise.all([
        supabase.from('coins').select('*', { count: 'exact' }),
        supabase.from('price_history_36m').select('*', { count: 'exact' }),
        supabase.from('cointime_metrics').select('*', { count: 'exact' })
      ]);

      const glassNodeSupported = coinsResult.data?.filter(coin => coin.glass_node_supported).length || 0;
      const totalCoins = coinsResult.count || 0;
      const priceRecords = priceHistoryResult.count || 0;
      const metricsRecords = coinTimeResult.count || 0;

      // Calculate data quality score
      const expectedMinRecords = 1000; // Minimum expected records
      const completeness = Math.min(100, (priceRecords / expectedMinRecords) * 100);
      const coverage = totalCoins > 0 ? (glassNodeSupported / totalCoins) * 100 : 0;
      const dataQuality = Math.round((completeness * 0.6 + coverage * 0.4));

      setDataStatus({
        totalCoins,
        priceHistoryRecords: priceRecords,
        coinTimeMetrics: metricsRecords,
        glassNodeSupported,
        lastUpdate: new Date().toISOString(),
        dataQuality
      });
    } catch (error) {
      console.error('Error checking data status:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDataPipeline = async () => {
    try {
      setInitializing(true);
      console.log('🚀 Triggering complete data pipeline initialization...');

      const { data, error } = await supabase.functions.invoke('initialize-real-data-pipeline', {
        body: { forceRefresh: true }
      });

      if (error) throw error;

      console.log('✅ Data pipeline triggered:', data);
      
      // Wait a moment then refresh status
      setTimeout(() => {
        checkDataStatus();
      }, 5000);

    } catch (error) {
      console.error('❌ Failed to initialize data pipeline:', error);
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Checking real data status...
          </div>
        </CardContent>
      </Card>
    );
  }

  const isDataEmpty = !dataStatus || (dataStatus.priceHistoryRecords === 0 && dataStatus.coinTimeMetrics === 0);
  const isDataIncomplete = dataStatus && dataStatus.dataQuality < 50;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Real Data Pipeline Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dataStatus && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{dataStatus.totalCoins}</div>
              <div className="text-sm text-muted-foreground">Total Coins</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{dataStatus.priceHistoryRecords}</div>
              <div className="text-sm text-muted-foreground">Price Records</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-secondary">{dataStatus.coinTimeMetrics}</div>
              <div className="text-sm text-muted-foreground">Glass Node Metrics</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-accent">{dataStatus.glassNodeSupported}</div>
              <div className="text-sm text-muted-foreground">Glass Node Coins</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant={dataStatus && dataStatus.dataQuality > 70 ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {dataStatus && dataStatus.dataQuality > 70 ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              Data Quality: {dataStatus?.dataQuality || 0}%
            </Badge>
            {dataStatus?.lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Last checked: {new Date(dataStatus.lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={checkDataStatus}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            {(isDataEmpty || isDataIncomplete) && (
              <Button 
                onClick={initializeDataPipeline}
                disabled={initializing}
                className="flex items-center gap-2"
              >
                {initializing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    {isDataEmpty ? 'Initialize Data' : 'Refresh Data'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {isDataEmpty && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Database is empty!</strong> Click "Initialize Data" to populate with real market data. 
              This process runs automatically but you can trigger it manually.
            </AlertDescription>
          </Alert>
        )}

        {isDataIncomplete && !isDataEmpty && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Data incomplete.</strong> Only {dataStatus?.dataQuality}% of expected data is available. 
              Click "Refresh Data" to complete the population.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};