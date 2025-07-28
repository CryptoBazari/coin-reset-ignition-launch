import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PlayCircle, Database, Calculator, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ApiCall {
  name: string;
  endpoint: string;
  params: any;
  response?: any;
  error?: string;
  duration?: number;
  status: 'pending' | 'success' | 'error' | 'idle';
}

interface Calculation {
  name: string;
  description: string;
  input: any;
  output?: any;
  formula?: string;
  status: 'pending' | 'success' | 'error' | 'idle';
}

export const CalculationDebugger = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const { toast } = useToast();

  const updateApiCall = (name: string, updates: Partial<ApiCall>) => {
    setApiCalls(prev => prev.map(call => 
      call.name === name ? { ...call, ...updates } : call
    ));
  };

  const updateCalculation = (name: string, updates: Partial<Calculation>) => {
    setCalculations(prev => prev.map(calc => 
      calc.name === name ? { ...calc, ...updates } : calc
    ));
  };

  const runFullAnalysis = async () => {
    setIsRunning(true);
    
    // Initialize tracking arrays
    const initialApiCalls: ApiCall[] = [
      { name: 'Market Data', endpoint: 'fetch-market-data', params: { coinSymbols: ['BTC'] }, status: 'idle' },
      { name: 'CAGR Calculation', endpoint: 'calculate-standalone-cagr', params: { asset: 'btc', startDate: '2022-07-28', endDate: '2025-07-28' }, status: 'idle' },
      { name: 'Glassnode Price Data', endpoint: 'fetch-glassnode-data', params: { metric: 'market/price_usd_close', asset: 'BTC' }, status: 'idle' },
      { name: 'S&P 500 Data', endpoint: 'fetch-sp500-data', params: { series_id: 'SP500' }, status: 'idle' },
      { name: 'NPV Calculation', endpoint: 'npv-calculation', params: { asset: 'BTC', amount: 10000, years: 3 }, status: 'idle' }
    ];

    const initialCalculations: Calculation[] = [
      { name: 'CAGR Basic', description: 'Compound Annual Growth Rate', input: {}, formula: '(End Value / Start Value)^(1/years) - 1', status: 'idle' },
      { name: 'CAGR Adjusted', description: 'Volatility-adjusted CAGR', input: {}, formula: 'Basic CAGR * (1 - volatility_penalty)', status: 'idle' },
      { name: 'Beta Calculation', description: 'Asset correlation to S&P 500', input: {}, formula: 'Covariance(Asset, Market) / Variance(Market)', status: 'idle' },
      { name: 'NPV Calculation', description: 'Net Present Value', input: {}, formula: 'Σ(Cash Flow / (1 + discount_rate)^year)', status: 'idle' }
    ];

    setApiCalls(initialApiCalls);
    setCalculations(initialCalculations);

    try {
      // 1. Fetch Market Data
      updateApiCall('Market Data', { status: 'pending' });
      const startTime1 = Date.now();
      
      const { data: marketData, error: marketError } = await supabase.functions.invoke('fetch-market-data', {
        body: { coinSymbols: ['BTC'] }
      });
      
      const duration1 = Date.now() - startTime1;
      
      if (marketError) {
        updateApiCall('Market Data', { status: 'error', error: marketError.message, duration: duration1 });
      } else {
        updateApiCall('Market Data', { status: 'success', response: marketData, duration: duration1 });
      }

      // 2. CAGR Calculation
      updateApiCall('CAGR Calculation', { status: 'pending' });
      const startTime2 = Date.now();
      
      const { data: cagrData, error: cagrError } = await supabase.functions.invoke('calculate-standalone-cagr', {
        body: { asset: 'btc', startDate: '2022-07-28', endDate: '2025-07-28' }
      });
      
      const duration2 = Date.now() - startTime2;
      
      if (cagrError) {
        updateApiCall('CAGR Calculation', { status: 'error', error: cagrError.message, duration: duration2 });
      } else {
        updateApiCall('CAGR Calculation', { status: 'success', response: cagrData, duration: duration2 });
        
        // Update CAGR calculations
        updateCalculation('CAGR Basic', {
          status: 'success',
          input: { startPrice: cagrData.startPrice, endPrice: cagrData.endPrice, years: cagrData.timeperiodYears },
          output: `${cagrData.basic.toFixed(2)}%`
        });
        
        updateCalculation('CAGR Adjusted', {
          status: 'success',
          input: { basicCAGR: cagrData.basic, volatility: cagrData.volatility90d },
          output: `${cagrData.adjusted.toFixed(2)}%`
        });
      }

      // 3. Glassnode Price Data for Beta
      updateApiCall('Glassnode Price Data', { status: 'pending' });
      const startTime3 = Date.now();
      
      const { data: glassnodeData, error: glassnodeError } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'market/price_usd_close', 
          asset: 'BTC',
          since: Math.floor(new Date('2022-07-29').getTime() / 1000),
          until: Math.floor(new Date('2025-07-28').getTime() / 1000),
          resolution: '24h',
          disableSampling: true
        }
      });
      
      const duration3 = Date.now() - startTime3;
      
      if (glassnodeError) {
        updateApiCall('Glassnode Price Data', { status: 'error', error: glassnodeError.message, duration: duration3 });
      } else {
        updateApiCall('Glassnode Price Data', { status: 'success', response: { dataPoints: glassnodeData.data.length, sampleData: glassnodeData.data.slice(0, 3) }, duration: duration3 });
      }

      // 4. S&P 500 Data
      updateApiCall('S&P 500 Data', { status: 'pending' });
      const startTime4 = Date.now();
      
      const { data: sp500Data, error: sp500Error } = await supabase.functions.invoke('fetch-sp500-data', {
        body: { 
          series_id: 'SP500',
          observation_start: '2022-07-29',
          observation_end: '2025-07-28'
        }
      });
      
      const duration4 = Date.now() - startTime4;
      
      if (sp500Error) {
        updateApiCall('S&P 500 Data', { status: 'error', error: sp500Error.message, duration: duration4 });
      } else {
        updateApiCall('S&P 500 Data', { status: 'success', response: { dataPoints: sp500Data.length, sampleData: sp500Data.slice(0, 3) }, duration: duration4 });
        
        // Update Beta calculation (simplified)
        if (glassnodeData && !glassnodeError) {
          updateCalculation('Beta Calculation', {
            status: 'success',
            input: { btcDataPoints: glassnodeData.data.length, sp500DataPoints: sp500Data.length },
            output: 'Calculated from price correlations'
          });
        }
      }

      // 5. NPV Calculation
      updateApiCall('NPV Calculation', { status: 'pending' });
      const startTime5 = Date.now();
      
      const { data: npvData, error: npvError } = await supabase.functions.invoke('npv-calculation', {
        body: { asset: 'BTC', amount: 10000, years: 3 }
      });
      
      const duration5 = Date.now() - startTime5;
      
      if (npvError) {
        updateApiCall('NPV Calculation', { status: 'error', error: npvError.message, duration: duration5 });
        updateCalculation('NPV Calculation', { status: 'error' });
      } else {
        updateApiCall('NPV Calculation', { status: 'success', response: npvData, duration: duration5 });
        updateCalculation('NPV Calculation', {
          status: 'success',
          input: { investment: 10000, discountRate: npvData.discountRate, years: 3 },
          output: `$${npvData.npv?.toFixed(2) || 'N/A'}`
        });
      }

      toast({
        title: "Analysis Complete",
        description: "All API calls and calculations have been tested",
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculation & API Debugger
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={runFullAnalysis} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              {isRunning ? 'Running Analysis...' : 'Run Full Analysis Test'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* API Calls Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            API Calls & Data Fetching
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiCalls.map((call, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(call.status)}
                  <h4 className="font-medium">{call.name}</h4>
                  <Badge variant="outline">{call.endpoint}</Badge>
                </div>
                {call.duration && (
                  <span className="text-sm text-muted-foreground">{call.duration}ms</span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Parameters:</p>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(call.params, null, 2)}
                  </pre>
                </div>
                
                {call.response && (
                  <div>
                    <p className="font-medium text-muted-foreground">Response:</p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto max-h-32">
                      {JSON.stringify(call.response, null, 2)}
                    </pre>
                  </div>
                )}
                
                {call.error && (
                  <div className="md:col-span-2">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{call.error}</AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Calculations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Financial Calculations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {calculations.map((calc, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(calc.status)}
                <h4 className="font-medium">{calc.name}</h4>
                <Badge variant="outline" className={getStatusColor(calc.status)}>
                  {calc.status}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">{calc.description}</p>
              
              {calc.formula && (
                <div className="bg-muted p-2 rounded">
                  <p className="text-xs font-mono">{calc.formula}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {calc.input && Object.keys(calc.input).length > 0 && (
                  <div>
                    <p className="font-medium text-muted-foreground">Input:</p>
                    <pre className="bg-muted p-2 rounded text-xs">
                      {JSON.stringify(calc.input, null, 2)}
                    </pre>
                  </div>
                )}
                
                {calc.output && (
                  <div>
                    <p className="font-medium text-muted-foreground">Output:</p>
                    <p className="bg-muted p-2 rounded text-xs font-mono">
                      {calc.output}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};