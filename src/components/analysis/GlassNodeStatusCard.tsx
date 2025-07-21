
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
  Zap
} from 'lucide-react';
import { 
  getDiscoveryLogs, 
  triggerGlassNodeDiscovery,
  fetchGlassNodeSupportedAssets 
} from '@/services/glassNodeAssetService';
import { useToast } from '@/hooks/use-toast';

const GlassNodeStatusCard = () => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isRunningDiscovery, setIsRunningDiscovery] = useState(false);
  const { toast } = useToast();

  const { data: discoveryLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['glass-node-discovery-logs'],
    queryFn: () => getDiscoveryLogs(5),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: supportedAssets, refetch: refetchAssets } = useQuery({
    queryKey: ['glass-node-supported-assets'],
    queryFn: fetchGlassNodeSupportedAssets,
    refetchInterval: 60000, // Refetch every minute
  });

  const handleManualDiscovery = async () => {
    setIsDiscovering(true);
    
    try {
      const result = await triggerGlassNodeDiscovery();
      
      toast({
        title: "Discovery Completed",
        description: `Updated ${result.stats?.database_updated || 0} assets successfully.`,
      });

      // Refetch data after discovery
      await Promise.all([refetchLogs(), refetchAssets()]);
      
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

  const handleFullDiscovery = async () => {
    setIsRunningDiscovery(true);
    
    try {
      // Call the discovery edge function to get all Glassnode assets
      const response = await fetch('/api/discover-glass-node-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullDiscovery: true })
      });

      if (!response.ok) {
        throw new Error('Discovery API call failed');
      }

      const result = await response.json();
      
      toast({
        title: "Full Discovery Completed",
        description: `Discovered ${result.stats?.total_discovered || 0} assets, updated ${result.stats?.database_updated || 0} in database.`,
      });

      // Refetch data after discovery
      await Promise.all([refetchLogs(), refetchAssets()]);
      
    } catch (error) {
      console.error('Full discovery failed:', error);
      toast({
        title: "Full Discovery Failed",
        description: "Failed to run full asset discovery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRunningDiscovery(false);
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
              onClick={handleManualDiscovery}
              disabled={isDiscovering}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isDiscovering ? 'animate-spin' : ''}`} />
              {isDiscovering ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              onClick={handleFullDiscovery}
              disabled={isRunningDiscovery}
              variant="default"
              size="sm"
            >
              <Search className={`h-4 w-4 mr-2 ${isRunningDiscovery ? 'animate-spin' : ''}`} />
              {isRunningDiscovery ? 'Discovering...' : 'Full Discovery'}
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
            <div className="text-sm text-gray-600">Supported Assets</div>
            <div className="text-2xl font-bold text-primary">
              {supportedAssets?.length || 0}
            </div>
          </div>
        </div>

        <Separator />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Premium Assets</div>
            <div className="text-lg font-semibold text-green-600">
              {supportedAssets?.filter(a => a.premium_metrics_available).length || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">High Quality</div>
            <div className="text-lg font-semibold text-blue-600">
              {supportedAssets?.filter(a => a.glass_node_data_quality >= 8).length || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Last Discovery</div>
            <div className="text-lg font-semibold text-gray-700">
              {lastLog ? new Date(lastLog.discovery_run_at).toLocaleDateString() : 'Never'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Target</div>
            <div className="text-lg font-semibold text-orange-600">
              1,845+
            </div>
          </div>
        </div>

        {/* Discovery Notice */}
        {(!supportedAssets || supportedAssets.length < 50) && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <Zap className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-blue-800">Run Full Discovery</div>
              <div className="text-sm text-blue-700">
                Click "Full Discovery" to fetch all 1,845+ Glass Node supported assets including Litecoin, Bitcoin Cash, and more.
              </div>
            </div>
          </div>
        )}

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
            <div className="text-center text-gray-500 py-4">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div>No discovery runs recorded</div>
              <div className="text-xs mt-1">
                Click "Full Discovery" to start discovering all Glass Node assets
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
