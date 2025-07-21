
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiDataVerificationService, DataVerificationResult, APIEndpointStatus } from '@/services/apiDataVerificationService';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Database,
  Activity,
  Zap,
  TrendingUp,
  Globe
} from 'lucide-react';

export const APIDataVerification: React.FC = () => {
  const [verificationResult, setVerificationResult] = useState<DataVerificationResult | null>(null);
  const [endpointStatuses, setEndpointStatuses] = useState<APIEndpointStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');

  const verifyDataUsage = async (coinId: string) => {
    setIsLoading(true);
    try {
      console.log(`🔍 Verifying real data usage for ${coinId}...`);
      
      const result = await apiDataVerificationService.verifyRealDataUsage(coinId);
      setVerificationResult(result);
      
      console.log(`📊 Verification complete for ${coinId}:`);
      console.log(`   - Overall Quality: ${result.overallDataQuality}%`);
      console.log(`   - Price Data: ${result.priceData.isReal ? 'REAL' : 'ESTIMATED'} (${result.priceData.source})`);
      console.log(`   - Beta: ${result.calculatedMetrics.beta.isReal ? 'REAL' : 'ESTIMATED'} (${result.calculatedMetrics.beta.value})`);
      console.log(`   - Issues: ${result.issues.length}`);
      
    } catch (error) {
      console.error('❌ API verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEndpointStatuses = async () => {
    try {
      const statuses = await apiDataVerificationService.getAPIEndpointStatuses();
      setEndpointStatuses(statuses);
    } catch (error) {
      console.error('❌ Failed to load endpoint statuses:', error);
    }
  };

  useEffect(() => {
    verifyDataUsage(selectedCoin);
    loadEndpointStatuses();
  }, [selectedCoin]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-green-600';
    if (quality >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">API Data Verification</h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedCoin}
            onChange={(e) => setSelectedCoin(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="bitcoin">Bitcoin</option>
            <option value="ethereum">Ethereum</option>
            <option value="solana">Solana</option>
            <option value="cardano">Cardano</option>
          </select>
          <Button 
            onClick={() => verifyDataUsage(selectedCoin)}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verify
          </Button>
        </div>
      </div>

      <Tabs defaultValue="data-verification" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="data-verification">Data Verification</TabsTrigger>
          <TabsTrigger value="api-endpoints">API Endpoints</TabsTrigger>
        </TabsList>

        <TabsContent value="data-verification" className="space-y-4">
          {verificationResult && (
            <>
              {/* Overall Quality */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Overall Data Quality - {verificationResult.coinId.toUpperCase()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Data Quality Score</span>
                      <span className={`text-2xl font-bold ${getQualityColor(verificationResult.overallDataQuality)}`}>
                        {verificationResult.overallDataQuality}%
                      </span>
                    </div>
                    <Progress value={verificationResult.overallDataQuality} className="h-2" />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Price Data</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {verificationResult.priceData.isReal ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {verificationResult.priceData.isReal ? 'Real' : 'Estimated'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Glass Node</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {verificationResult.glassNodeData.avivRatio.isReal ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {verificationResult.glassNodeData.avivRatio.isReal ? 'Real' : 'Estimated'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Economic Data</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {verificationResult.economicData.fedRate.isReal ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {verificationResult.economicData.fedRate.isReal ? 'Real' : 'Estimated'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Beta</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {verificationResult.calculatedMetrics.beta.isReal ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {verificationResult.calculatedMetrics.beta.value.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Sources</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Price Data</span>
                      <Badge variant={verificationResult.priceData.isReal ? 'default' : 'secondary'}>
                        {verificationResult.priceData.source}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">AVIV Ratio</span>
                      <Badge variant={verificationResult.glassNodeData.avivRatio.isReal ? 'default' : 'secondary'}>
                        {verificationResult.glassNodeData.avivRatio.source}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fed Rate</span>
                      <Badge variant={verificationResult.economicData.fedRate.isReal ? 'default' : 'secondary'}>
                        {verificationResult.economicData.fedRate.source}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Beta</span>
                      <Badge variant={verificationResult.calculatedMetrics.beta.isReal ? 'default' : 'secondary'}>
                        {verificationResult.calculatedMetrics.beta.source}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Calculated Values</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Beta</span>
                      <span className="font-medium">
                        {verificationResult.calculatedMetrics.beta.value.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Volatility</span>
                      <span className="font-medium">
                        {verificationResult.calculatedMetrics.volatility.value.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CAGR (36m)</span>
                      <span className="font-medium">
                        {verificationResult.calculatedMetrics.cagr.value.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sharpe Ratio</span>
                      <span className="font-medium">
                        {verificationResult.calculatedMetrics.sharpeRatio.value.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Issues and Recommendations */}
              {(verificationResult.issues.length > 0 || verificationResult.recommendations.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        Issues Found
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {verificationResult.issues.length > 0 ? (
                        <div className="space-y-2">
                          {verificationResult.issues.map((issue, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <span className="text-yellow-800">{issue}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">No issues found</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Zap className="h-5 w-5 text-blue-600" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {verificationResult.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-blue-800">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="api-endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                API Endpoint Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {endpointStatuses.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(endpoint.status)}
                      <div>
                        <div className="font-medium">{endpoint.endpoint}</div>
                        <div className="text-sm text-muted-foreground">
                          Last called: {new Date(endpoint.lastCalled).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={endpoint.status === 'active' ? 'default' : 'secondary'}>
                        {endpoint.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {endpoint.dataPoints} data points
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
