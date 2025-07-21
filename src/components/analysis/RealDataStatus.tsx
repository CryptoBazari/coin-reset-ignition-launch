
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, RefreshCw, CheckCircle, AlertCircle, Play, Activity } from 'lucide-react';
import { useRealDataPopulation } from '@/hooks/useRealDataPopulation';

export const RealDataStatus: React.FC = () => {
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { loading, result, populateData, checkDataStatus } = useRealDataPopulation();

  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkDataStatus();
      setDataStatus(status);
    };

    checkStatus();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkDataStatus, autoRefresh]);

  const handleManualPopulation = async () => {
    await populateData();
    // Refresh status after population
    const status = await checkDataStatus();
    setDataStatus(status);
  };

  const handleRefreshStatus = async () => {
    const status = await checkDataStatus();
    setDataStatus(status);
  };

  const isDataEmpty = !dataStatus || (!dataStatus.isPopulated && dataStatus.coinsWithRealData === 0);
  const isDataIncomplete = dataStatus && dataStatus.isPopulated && dataStatus.dataQuality < 70;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Real Data Pipeline Status
          <Badge variant={dataStatus?.isPopulated ? "default" : "destructive"}>
            {dataStatus?.isPopulated ? "ACTIVE" : "INACTIVE"}
          </Badge>
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
              <div className="text-2xl font-bold text-primary">{dataStatus.coinsWithRealData}</div>
              <div className="text-sm text-muted-foreground">With Real Data</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-secondary">{dataStatus.dataQuality}%</div>
              <div className="text-sm text-muted-foreground">Data Quality</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-accent">
                {dataStatus.lastUpdate ? new Date(dataStatus.lastUpdate).toLocaleDateString() : 'Never'}
              </div>
              <div className="text-sm text-muted-foreground">Last Update</div>
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
              {dataStatus?.isPopulated ? 'REAL DATA ACTIVE' : 'USING MOCK DATA'}
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
            <Button variant="outline" size="sm" onClick={handleRefreshStatus}>
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
              <strong>Database is empty!</strong> Click "Initialize Real Data" to populate with real market data from APIs. 
              This will fetch current prices, historical data, and Glass Node metrics.
            </AlertDescription>
          </Alert>
        )}

        {isDataIncomplete && !isDataEmpty && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Data incomplete.</strong> Only {dataStatus?.dataQuality}% data quality. 
              Click "Refresh Real Data" to complete the population with latest market data.
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
