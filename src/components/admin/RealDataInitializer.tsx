import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { realDataPipelineService } from '@/services/realDataPipelineService';
import { PlayCircle, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const RealDataInitializer: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [dataQuality, setDataQuality] = useState<{
    totalCoins: number;
    realDataCoins: number;
    estimatedDataCoins: number;
    averageQuality: number;
    highQualityCoins: number;
  } | null>(null);

  const handleInitializeRealData = async () => {
    setIsInitializing(true);
    setStatus('running');
    setProgress(0);

    try {
      console.log('🚀 Starting REAL data pipeline initialization...');
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 85));
      }, 1000);
      
      // Initialize the real data pipeline
      await realDataPipelineService.initializeRealDataPipeline();
      
      clearInterval(progressInterval);
      setProgress(100);
      setStatus('completed');
      
      // Get updated data quality status
      const qualityStatus = await realDataPipelineService.getDataQualityStatus();
      setDataQuality(qualityStatus);
      
      console.log('✅ Real data pipeline initialization completed successfully');
    } catch (error) {
      console.error('❌ Failed to initialize real data pipeline:', error);
      setStatus('error');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      const qualityStatus = await realDataPipelineService.getDataQualityStatus();
      setDataQuality(qualityStatus);
    } catch (error) {
      console.error('❌ Failed to refresh data quality status:', error);
    }
  };

  React.useEffect(() => {
    // Load initial data quality status
    handleRefreshStatus();
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <PlayCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Real Data Pipeline Initializer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Replace Mock Data with Real APIs</p>
              <p className="text-xs text-muted-foreground">
                This will activate Glass Node, CoinMarketCap, and Alpha Vantage APIs to replace all estimated data
              </p>
            </div>
            <Button 
              onClick={handleInitializeRealData}
              disabled={isInitializing}
              className="min-w-[120px]"
            >
              {isInitializing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Real Data
                </>
              )}
            </Button>
          </div>

          {status === 'running' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Initializing real data pipeline...</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {status !== 'idle' && (
            <div className={`flex items-center gap-2 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {status === 'running' && 'Processing real data...'}
                {status === 'completed' && 'Real data pipeline activated successfully!'}
                {status === 'error' && 'Failed to initialize real data pipeline'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {dataQuality && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Data Quality Status
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshStatus}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Total Coins</p>
                <div className="text-2xl font-bold">{dataQuality.totalCoins}</div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Real Data</p>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-green-600">
                    {dataQuality.realDataCoins}
                  </div>
                  <Badge variant="secondary">
                    {Math.round((dataQuality.realDataCoins / dataQuality.totalCoins) * 100)}%
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Estimated Data</p>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-orange-600">
                    {dataQuality.estimatedDataCoins}
                  </div>
                  <Badge variant="outline">
                    {Math.round((dataQuality.estimatedDataCoins / dataQuality.totalCoins) * 100)}%
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">High Quality</p>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {dataQuality.highQualityCoins}
                  </div>
                  <Badge variant={dataQuality.averageQuality >= 70 ? 'default' : 'secondary'}>
                    {dataQuality.averageQuality}% avg
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Real Data Pipeline Status:</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Real APIs: {dataQuality.realDataCoins > 0 ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${dataQuality.averageQuality >= 70 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <span>Quality: {dataQuality.averageQuality >= 70 ? 'High' : 'Medium'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${dataQuality.realDataCoins >= dataQuality.estimatedDataCoins ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Coverage: {dataQuality.realDataCoins >= dataQuality.estimatedDataCoins ? 'Good' : 'Needs Improvement'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealDataInitializer;