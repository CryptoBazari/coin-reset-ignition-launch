
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  Activity, 
  Database, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Shield,
  Search,
  Zap,
  BarChart3,
  Target
} from 'lucide-react';
import { 
  getDiscoveryLogs, 
  triggerGlassNodeDiscovery,
  fetchGlassNodeSupportedAssets,
  initializeGlassNodeDatabase,
  getAssetStatistics
} from '@/services/glassNodeAssetService';
import { useToast } from '@/hooks/use-toast';

const GlassNodeStatusCard = () => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  const { data: discoveryLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['glass-node-discovery-logs'],
    queryFn: () => getDiscoveryLogs(5),
    refetchInterval: 30000,
  });

  const { data: supportedAssets, refetch: refetchAssets } = useQuery({
    queryKey: ['glass-node-supported-assets'],
    queryFn: fetchGlassNodeSupportedAssets,
    refetchInterval: 60000,
  });

  const { data: assetStats, refetch: refetchStats } = useQuery({
    queryKey: ['asset-statistics'],
    queryFn: getAssetStatistics,
    refetchInterval: 60000,
  });

  const handleQuickDiscovery = async () => {
    setIsDiscovering(true);
    
    try {
      const result = await triggerGlassNodeDiscovery();
      
      toast({
        title: "Discovery Completed",
        description: `Updated ${result.stats?.database_updated || 0} assets successfully.`,
      });

      await Promise.all([refetchLogs(), refetchAssets(), refetchStats()]);
      
    } catch (error) {
      console.error('Discovery failed:', error);
      toast({
        title: "Discovery Failed",
        description: "Failed to update Glass Node assets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleFullInitialization = async () => {
    setIsInitializing(true);
    
    try {
      console.log('🚀 Starting full Glass Node database initialization...');
      
      const result = await initializeGlassNodeDatabase();
      
      toast({
        title: "✅ Full Initialization Complete!",
        description: `Successfully initialized database with ${result.discovery?.stats?.total_discovered || 'all'} Glass Node assets. Real data pipeline activated.`,
      });

      // Refresh all data
      await Promise.all([refetchLogs(), refetchAssets(), refetchStats()]);
      
    } catch (error) {
      console.error('Full initialization failed:', error);
      toast({
        title: "❌ Initialization Failed",
        description: "Failed to initialize full database. Please check the logs and try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const lastLog = discoveryLogs?.[0];
  const apiStatus = lastLog?.api_status || 'unknown';
  const isOperational = apiStatus === 'operational';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'unavailable': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const needsInitialization = !assetStats || assetStats.total < 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Glass Node Integration Status
            </CardTitle>
            <CardDescription>
              Real-time cryptocurrency data from Glass Node API
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleQuickDiscovery}
              disabled={isDiscovering || isInitializing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isDiscovering ? 'animate-spin' : ''}`} />
              {isDiscovering ? 'Refreshing...' : 'Quick Refresh'}
            </Button>
            <Button
              onClick={handleFullInitialization}
              disabled={isDiscovering || isInitializing}
              variant="default"
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Database className={`h-4 w-4 mr-2 ${isInitializing ? 'animate-spin' : ''}`} />
              {isInitializing ? 'Initializing...' : 'Full Initialize'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* API Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {getStatusIcon(apiStatus)}
            <div>
              <div className="font-medium">API Status</div>
              <div className={`text-sm ${getStatusColor(apiStatus)}`}>
                {apiStatus.charAt(0).toUpperCase() + apiStatus.slice(1)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Assets</div>
            <div className="text-2xl font-bold text-primary">
              {assetStats?.total || 0}
            </div>
          </div>
        </div>

        {/* Initialization Alert */}
        {needsInitialization && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <Zap className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <div className="font-medium text-amber-800">Database Initialization Required</div>
              <div className="text-sm text-amber-700">
                Click "Full Initialize" to populate the database with 1,845+ Glass Node supported assets including Bitcoin, Ethereum, Litecoin, and all major cryptocurrencies.
              </div>
            </div>
            <Button 
              onClick={handleFullInitialization}
              disabled={isInitializing}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <Database className="h-4 w-4 mr-2" />
              Initialize Now
            </Button>
          </div>
        )}

        <Separator />

        {/* Enhanced Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-50">
            <div className="text-sm text-green-700">Glass Node Supported</div>
            <div className="text-xl font-bold text-green-800">
              {assetStats?.glassNodeSupported || 0}
            </div>
            <div className="text-xs text-green-600">Assets Available</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <div className="text-sm text-blue-700">High Quality Data</div>
            <div className="text-xl font-bold text-blue-800">
              {assetStats?.highQuality || 0}
            </div>
            <div className="text-xs text-blue-600">Premium Metrics</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-50">
            <div className="text-sm text-purple-700">Bitcoin Basket</div>
            <div className="text-xl font-bold text-purple-800">
              {assetStats?.byBasket?.Bitcoin || 0}
            </div>
            <div className="text-xs text-purple-600">BTC Assets</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-50">
            <div className="text-sm text-orange-700">Blue Chip</div>
            <div className="text-xl font-bold text-orange-800">
              {assetStats?.byBasket?.['Blue Chip'] || 0}
            </div>
            <div className="text-xs text-orange-600">Major Coins</div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Database Population Progress</span>
            <span className="font-medium">
              {assetStats?.total || 0} / 1,845+ assets
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(((assetStats?.total || 0) / 1845) * 100, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 text-center">
            Target: 1,845+ Glass Node supported cryptocurrencies
          </div>
        </div>

        <Separator />

        {/* Recent Discovery Logs */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-gray-600" />
            <span className="font-medium">Recent Discovery Runs</span>
          </div>
          
          {discoveryLogs && discoveryLogs.length > 0 ? (
            <div className="space-y-2">
              {discoveryLogs.slice(0, 3).map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-background"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.api_status)}
                    <div>
                      <div className="text-sm font-medium">
                        {log.assets_discovered} discovered, {log.assets_updated} updated
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.discovery_run_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={log.api_status === 'operational' ? 'default' : 'destructive'}>
                      {log.api_status}
                    </Badge>
                    {log.discovery_duration_ms && (
                      <div className="text-xs text-gray-500 mt-1">
                        {log.discovery_duration_ms}ms
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-6">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="font-medium">Ready to Initialize</div>
              <div className="text-sm mt-1">
                Click "Full Initialize" to discover and populate all Glass Node assets
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {lastLog?.error_message && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-800 font-medium">
              <AlertCircle className="h-4 w-4" />
              Latest Error
            </div>
            <div className="text-sm text-red-700 mt-1">
              {lastLog.error_message}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GlassNodeStatusCard;
