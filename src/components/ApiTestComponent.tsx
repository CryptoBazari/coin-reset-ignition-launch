
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ApiTestResult {
  success: boolean;
  apiHealthy: boolean;
  qualityScore: number;
  metricsAvailable: number;
  totalMetrics: number;
  totalDataPoints: number;
  testResults: Array<{
    metric: string;
    success: boolean;
    dataPoints: number;
    status?: number;
    error?: string;
  }>;
  message: string;
}

export const ApiTestComponent = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<ApiTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testGlassNodeApi = async () => {
    setTesting(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 Testing Glass Node API connectivity...');
      
      const { data, error: functionError } = await supabase.functions.invoke('verify-glass-node-api');

      if (functionError) {
        throw new Error(`Function error: ${functionError.message}`);
      }

      if (!data) {
        throw new Error('No response data received');
      }

      console.log('✅ Glass Node API test completed:', data);
      setResults(data);

    } catch (err) {
      console.error('❌ Glass Node API test failed:', err);
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Glass Node API Status Check
          </CardTitle>
          <CardDescription>
            Test the connectivity and functionality of the Glass Node API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testGlassNodeApi} 
            disabled={testing}
            className="mb-4"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing API...
              </>
            ) : (
              'Test Glass Node API'
            )}
          </Button>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">API Test Failed</span>
                </div>
                <p className="mt-2 text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {results && (
            <div className="space-y-4">
              {/* Overall Status */}
              <Card className={results.apiHealthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(results.apiHealthy)}
                      <span className="font-medium">
                        {results.apiHealthy ? 'API is Healthy' : 'API is Down'}
                      </span>
                    </div>
                    <Badge className={getQualityColor(results.qualityScore)}>
                      Quality: {results.qualityScore}%
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{results.message}</p>
                </CardContent>
              </Card>

              {/* Metrics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{results.metricsAvailable}/{results.totalMetrics}</div>
                    <p className="text-sm text-gray-600">Metrics Available</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{results.totalDataPoints}</div>
                    <p className="text-sm text-gray-600">Total Data Points</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{results.qualityScore}%</div>
                    <p className="text-sm text-gray-600">Quality Score</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Metric Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.testResults.map((test, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(test.success)}
                          <span className="font-mono text-sm">{test.metric}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.success ? (
                            <Badge variant="secondary">{test.dataPoints} points</Badge>
                          ) : (
                            <Badge variant="destructive">
                              {test.error || `HTTP ${test.status}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
