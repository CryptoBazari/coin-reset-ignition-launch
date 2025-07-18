
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { testAllApis, type ApiTestResult } from '@/services/apiTestingService';

const ApiStatusMonitor = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<ApiTestResult[]>([]);

  const handleTestApis = async () => {
    setTesting(true);
    try {
      const testResults = await testAllApis();
      setResults(testResults);
      console.log('API Test Results:', testResults);
    } catch (error) {
      console.error('Error testing APIs:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>API Integration Status</CardTitle>
          <Button 
            onClick={handleTestApis} 
            disabled={testing}
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Test All APIs'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {results.length === 0 && !testing && (
          <div className="text-center py-8 text-muted-foreground">
            Click "Test All APIs" to check the status of your API integrations
          </div>
        )}

        {testing && (
          <div className="text-center py-8 text-muted-foreground">
            Testing API integrations...
          </div>
        )}

        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <h3 className="font-medium">{result.service}</h3>
                </div>
                <Badge className={getStatusColor(result.status)}>
                  {result.status.toUpperCase()}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {result.message}
              </p>
              
              <div className="text-xs text-muted-foreground">
                Tested: {new Date(result.timestamp).toLocaleString()}
              </div>

              {result.data && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    View sample data
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {results.length > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Summary</h4>
            <div className="text-sm text-muted-foreground">
              <div>✅ Successful: {results.filter(r => r.status === 'success').length}</div>
              <div>⚠️ Warnings: {results.filter(r => r.status === 'warning').length}</div>
              <div>❌ Errors: {results.filter(r => r.status === 'error').length}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiStatusMonitor;
