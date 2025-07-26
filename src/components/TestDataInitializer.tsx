
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTestDataInitializer } from '@/hooks/useTestDataInitializer';
import { mockGlassNodeService } from '@/services/mockGlassNodeService';
import { Loader2, Database, TrendingUp, Activity } from 'lucide-react';

export const TestDataInitializer = () => {
  const { initializeTestData, loading, initialized } = useTestDataInitializer();
  const [showDetails, setShowDetails] = useState(false);
  
  const availableCoins = mockGlassNodeService.getAvailableTestCoins();
  
  const coinInfo = [
    { symbol: 'BTC', name: 'Bitcoin', startPrice: '$20,000', currentPrice: '$95,000', cagr: '~65%' },
    { symbol: 'ETH', name: 'Ethereum', startPrice: '$1,200', currentPrice: '$3,400', cagr: '~42%' },
    { symbol: 'SOL', name: 'Solana', startPrice: '$12', currentPrice: '$220', cagr: '~146%' },
    { symbol: 'ADA', name: 'Cardano', startPrice: '$0.25', currentPrice: '$1.05', cagr: '~62%' },
    { symbol: 'LINK', name: 'Chainlink', startPrice: '$5', currentPrice: '$22', cagr: '~63%' },
    { symbol: 'AVAX', name: 'Avalanche', startPrice: '$10', currentPrice: '$42', cagr: '~62%' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Test Data System
          </CardTitle>
          <CardDescription>
            Initialize realistic cryptocurrency data for CAGR calculations and analysis features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Status: {initialized ? 'Initialized' : 'Not Initialized'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {initialized 
                    ? 'Realistic test data is loaded and ready for analysis'
                    : 'Test data needs to be initialized for full functionality'
                  }
                </p>
              </div>
              <Button 
                onClick={initializeTestData} 
                disabled={loading || initialized}
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialized ? 'Data Ready' : 'Initialize Test Data'}
              </Button>
            </div>

            {!initialized && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2">What this does:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Creates 3+ years of realistic daily price history</li>
                  <li>• Generates proper CAGR calculations using the 7-step methodology</li>
                  <li>• Includes bull/bear market cycles and volatility patterns</li>
                  <li>• Adds cointime metrics (AVIV ratios, supply distribution)</li>
                  <li>• Enables all analysis features without API requirements</li>
                </ul>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Available Test Data
            </Button>

            {showDetails && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coinInfo.map((coin) => (
                    <Card key={coin.symbol} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{coin.name}</h4>
                          <Badge variant="outline">{coin.symbol}</Badge>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">3Y Start:</span>
                          <span>{coin.startPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current:</span>
                          <span className="font-medium">{coin.currentPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Est. CAGR:</span>
                          <span className="text-green-600 font-medium">{coin.cagr}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800 mb-2">Test Data Features</h4>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-blue-700">
                          <div>✅ 1,095 daily price points per coin</div>
                          <div>✅ Realistic market cycles (bull/bear)</div>
                          <div>✅ Proper volatility patterns</div>
                          <div>✅ AVIV ratios and cointime metrics</div>
                          <div>✅ Supply distribution data</div>
                          <div>✅ Volume and market cap data</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
