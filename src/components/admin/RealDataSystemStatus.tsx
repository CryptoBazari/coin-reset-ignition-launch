import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { realDataPipelineService } from '@/services/realDataPipelineService';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  RefreshCw,
  Zap,
  TrendingUp,
  Database,
  Activity
} from 'lucide-react';

interface SystemStatus {
  overallHealth: 'excellent' | 'good' | 'poor';
  dataQuality: number;
  realDataPercentage: number;
  estimatedDataPercentage: number;
  issues: string[];
  recommendations: string[];
  lastUpdateTime: string;
}

export const RealDataSystemStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculateSystemStatus = async () => {
    setIsLoading(true);
    try {
      const qualityData = await realDataPipelineService.getDataQualityStatus();
      
      const realDataPercentage = Math.round((qualityData.realDataCoins / qualityData.totalCoins) * 100);
      const estimatedDataPercentage = 100 - realDataPercentage;
      
      let overallHealth: 'excellent' | 'good' | 'poor' = 'poor';
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      // Determine overall health
      if (qualityData.averageQuality >= 80 && realDataPercentage >= 70) {
        overallHealth = 'excellent';
      } else if (qualityData.averageQuality >= 60 && realDataPercentage >= 40) {
        overallHealth = 'good';
      } else {
        overallHealth = 'poor';
      }
      
      // Identify issues and recommendations
      if (realDataPercentage < 50) {
        issues.push('High percentage of estimated data');
        recommendations.push('Run Real Data Pipeline to upgrade to real API data');
      }
      
      if (qualityData.averageQuality < 70) {
        issues.push('Low average data quality score');
        recommendations.push('Verify API connections and update data sources');
      }
      
      if (qualityData.highQualityCoins < qualityData.totalCoins * 0.5) {
        issues.push('Few coins have high-quality data');
        recommendations.push('Focus on improving Glass Node and API integrations');
      }
      
      if (issues.length === 0) {
        recommendations.push('System is operating optimally');
      }

      setStatus({
        overallHealth,
        dataQuality: qualityData.averageQuality,
        realDataPercentage,
        estimatedDataPercentage,
        issues,
        recommendations,
        lastUpdateTime: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Failed to calculate system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calculateSystemStatus();
  }, []);

  const getHealthColor = () => {
    if (!status) return 'text-gray-500';
    switch (status.overallHealth) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getHealthIcon = () => {
    if (!status) return <Database className="h-5 w-5" />;
    switch (status.overallHealth) {
      case 'excellent': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'poor': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Database className="h-5 w-5" />;
    }
  };

  const getHealthLabel = () => {
    if (!status) return 'Loading...';
    switch (status.overallHealth) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'poor': return 'Needs Attention';
      default: return 'Unknown';
    }
  };

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Analyzing system status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getHealthIcon()}
              <span>Real Data System Status</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={status.overallHealth === 'excellent' ? 'default' : 
                        status.overallHealth === 'good' ? 'secondary' : 'destructive'}
              >
                {getHealthLabel()}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={calculateSystemStatus}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Data Quality</span>
              </div>
              <div className={`text-2xl font-bold ${getHealthColor()}`}>
                {status.dataQuality}%
              </div>
              <Progress value={status.dataQuality} className="mt-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Real Data</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {status.realDataPercentage}%
              </div>
              <Progress value={status.realDataPercentage} className="mt-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Estimated Data</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {status.estimatedDataPercentage}%
              </div>
              <Progress value={status.estimatedDataPercentage} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.issues.length > 0 ? (
              <div className="space-y-2">
                {status.issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-800">{issue}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">No issues detected</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-800">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <div className="font-medium">Financial Metrics</div>
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${status.realDataPercentage >= 50 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{status.realDataPercentage >= 50 ? 'Enhanced with real data' : 'Using estimated values'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Beta Calculations</div>
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${status.realDataPercentage >= 30 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{status.realDataPercentage >= 30 ? '1.2-1.8 range' : '0.10 (incorrect)'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Price History</div>
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${status.dataQuality >= 70 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <span>{status.dataQuality >= 70 ? '36 months real data' : 'Limited historical data'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Glass Node Integration</div>
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${status.dataQuality >= 60 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <span>{status.dataQuality >= 60 ? 'Active metrics' : 'Basic integration'}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                Last updated: {status.lastUpdateTime}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealDataSystemStatus;