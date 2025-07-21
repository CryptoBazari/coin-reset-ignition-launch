
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AutomatedDataRefresh from '@/components/admin/AutomatedDataRefresh';
import DataQualityDashboard from '@/components/analysis/DataQualityDashboard';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  PlayCircle,
  Clock,
  TrendingUp,
  Settings,
  Zap
} from 'lucide-react';

interface DataStatus {
  coinsCount: number;
  priceHistoryCount: number;
  cointimeMetricsCount: number;
  lastUpdate: string | null;
}

interface PopulationProgress {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  progress: number;
}

export const DataPopulation: React.FC = () => {
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [isPopulating, setIsPopulating] = useState(false);
  const [progress, setProgress] = useState<PopulationProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const { toast } = useToast();

  const checkDataStatus = async () => {
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

      setDataStatus({
        coinsCount: coinsResult.count || 0,
        priceHistoryCount: priceHistoryResult.count || 0,
        cointimeMetricsCount: cointimeResult.count || 0,
        lastUpdate: lastUpdateData?.updated_at || null
      });
    } catch (error) {
      console.error('Error checking data status:', error);
      toast({
        title: "Error",
        description: "Failed to check data status",
        variant: "destructive"
      });
    }
  };

  const startDataPopulation = async () => {
    setIsPopulating(true);
    setProgress([]);
    setOverallProgress(0);

    const steps = [
      { step: 'coins', message: 'Updating coins with real market data...', progress: 0 },
      { step: 'price_history', message: 'Populating 36-month price history...', progress: 0 },
      { step: 'glass_node', message: 'Fetching Glass Node metrics...', progress: 0 },
      { step: 'verification', message: 'Verifying data integrity...', progress: 0 }
    ];

    try {
      // Initialize progress
      setProgress(steps.map(s => ({ ...s, status: 'pending' as const })));

      toast({
        title: "🚀 Data Population Started",
        description: "Populating your database with real market data. This will take 2-3 minutes...",
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setOverallProgress(prev => Math.min(prev + 5, 85));
      }, 2000);

      // Call the initialize real data pipeline function
      console.log('🚀 Starting real data pipeline initialization...');
      
      const { data, error } = await supabase.functions.invoke('initialize-real-data-pipeline', {
        body: {}
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('❌ Real data pipeline failed:', error);
        throw error;
      }

      console.log('✅ Real data pipeline completed:', data);

      // Update progress to completed
      setProgress(steps.map(s => ({ 
        ...s, 
        status: 'completed' as const,
        progress: 100 
      })));
      setOverallProgress(100);

      toast({
        title: "✅ Data Population Completed!",
        description: `Successfully populated ${data.coinsInDatabase} coins with real market data.`,
      });

      // Refresh data status
      await checkDataStatus();

    } catch (error) {
      console.error('❌ Data population failed:', error);
      
      setProgress(prev => prev.map(p => 
        p.status === 'running' ? { ...p, status: 'failed' as const } : p
      ));

      toast({
        title: "❌ Data Population Failed",
        description: error.message || "Unknown error occurred. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsPopulating(false);
    }
  };

  useEffect(() => {
    checkDataStatus();
  }, []);

  const isDataEmpty = !dataStatus || (dataStatus.coinsCount <= 5 && dataStatus.priceHistoryCount === 0);
  const isDataPartial = dataStatus && dataStatus.coinsCount > 5 && dataStatus.priceHistoryCount < 1000;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Real Data Management</h1>
        <Button
          variant="outline"
          onClick={checkDataStatus}
          disabled={isPopulating}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Emergency Data Population Card - Show prominently when data is empty */}
      {isDataEmpty && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Zap className="h-5 w-5" />
              ⚠️ DATABASE IS EMPTY - ACTION REQUIRED
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-orange-700">
                Your database has no real market data! The analysis pages won't work properly without this data.
                Click the button below to populate your database with real market data from CoinMarketCap and Glass Node.
              </p>
              
              <Button
                onClick={startDataPopulation}
                disabled={isPopulating}
                size="lg"
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isPopulating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Populating Database...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    🚀 START REAL DATA POPULATION NOW
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="population" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="population" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Population
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Quality Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="population" className="space-y-6">
          {/* Data Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Current Data Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataStatus && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{dataStatus.coinsCount}</div>
                    <div className="text-sm text-muted-foreground">Coins in Database</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{dataStatus.priceHistoryCount}</div>
                    <div className="text-sm text-muted-foreground">Price History Records</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{dataStatus.cointimeMetricsCount}</div>
                    <div className="text-sm text-muted-foreground">Glass Node Metrics</div>
                  </div>
                </div>
              )}

              {isDataPartial && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Data is incomplete!</strong> You have some coins but missing price history or Glass Node metrics.
                    Running the population will complete your dataset.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={isDataEmpty ? "destructive" : isDataPartial ? "secondary" : "default"}>
                    {isDataEmpty ? "EMPTY DATABASE" : isDataPartial ? "PARTIAL DATA" : "REAL DATA ACTIVE"}
                  </Badge>
                  {dataStatus?.lastUpdate && (
                    <div className="text-sm text-muted-foreground">
                      Last updated: {new Date(dataStatus.lastUpdate).toLocaleString()}
                    </div>
                  )}
                </div>

                <Button
                  onClick={startDataPopulation}
                  disabled={isPopulating}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isPopulating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Populating...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      {isDataEmpty ? "Populate Real Data" : "Refresh All Data"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Tracking */}
          {(isPopulating || progress.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Population Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="w-full" />
                  </div>

                  {progress.map((step, index) => (
                    <div key={step.step} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {step.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                        {step.status === 'running' && <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />}
                        {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {step.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{step.message}</span>
                          <Badge variant={
                            step.status === 'completed' ? 'default' :
                            step.status === 'failed' ? 'destructive' :
                            step.status === 'running' ? 'secondary' : 'outline'
                          }>
                            {step.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>What This Does</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Updates 100+ coins</strong> with real current market data from CoinMarketCap
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Populates 36-month price history</strong> for accurate CAGR, volatility, and beta calculations
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Fetches Glass Node metrics</strong> for advanced on-chain analysis
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Replaces ALL estimated values</strong> with real calculations (Beta: 0.10 → 1.2-1.8 range)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <AutomatedDataRefresh />
        </TabsContent>

        <TabsContent value="quality">
          <DataQualityDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataPopulation;
