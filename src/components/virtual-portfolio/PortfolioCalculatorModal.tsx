import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Shield, Target, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BitcoinMarketIndicator from './BitcoinMarketIndicator';
import AllocationCompliance from './AllocationCompliance';
import PortfolioRecommendations from './PortfolioRecommendations';
import HistoricalPerformanceTracker from './HistoricalPerformanceTracker';

interface PortfolioCalculatorModalProps {
  portfolioId: string;
  trigger?: React.ReactNode;
}

interface AnalysisResult {
  bitcoinAVIV: number;
  marketCondition: string;
  summary: {
    currentValue: number;
    costBasis: number;
    unrealizedGain: number;
    roi: number;
  };
  metrics: {
    npv: number;
    cagr: number;
    beta: number;
    diversificationScore: number;
    projectedValue1Y: number;
    projectedValue3Y: number;
  };
  allocations: {
    bitcoin: number;
    bluechip: number;
    smallcap: number;
  };
  riskAnalysis: {
    complianceStatus: string;
    complianceIssues: string[];
    requiredRules: any;
  };
  recommendations: any[];
  assetBreakdown: any[];
}

export default function PortfolioCalculatorModal({ portfolioId, trigger }: PortfolioCalculatorModalProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: analysisError } = await supabase.functions.invoke('portfolio-analysis', {
        body: { portfolioId }
      });

      if (analysisError) throw analysisError;
      
      setAnalysis(data);
    } catch (err) {
      console.error('Portfolio analysis failed:', err);
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Portfolio Calculator
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Advanced Portfolio Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bitcoin Market Indicator */}
          <BitcoinMarketIndicator />

          {/* Analysis Trigger */}
          <div className="flex justify-center">
            <Button 
              onClick={runAnalysis} 
              disabled={loading}
              size="lg"
              className="px-8"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing Portfolio...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Run Complete Analysis
                </>
              )}
            </Button>
          </div>

          {error && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Analysis Error: {error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Portfolio Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Value</p>
                      <p className="text-2xl font-bold text-primary">
                        ${analysis.summary.currentValue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                      <p className={`text-2xl font-bold ${analysis.summary.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${analysis.summary.unrealizedGain.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ROI</p>
                      <p className={`text-xl font-semibold ${analysis.summary.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.summary.roi.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cost Basis</p>
                      <p className="text-xl font-semibold">
                        ${analysis.summary.costBasis.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Advanced Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Portfolio NPV</p>
                      <p className="text-xl font-bold">${analysis.metrics.npv.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Portfolio CAGR</p>
                      <p className="text-xl font-bold">{analysis.metrics.cagr.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Portfolio Beta</p>
                      <p className="text-xl font-bold">{analysis.metrics.beta.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Diversification</p>
                      <p className="text-xl font-bold">{analysis.metrics.diversificationScore.toFixed(1)}/10</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Projections</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>1 Year:</span>
                        <span className="font-semibold">${analysis.metrics.projectedValue1Y.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>3 Years:</span>
                        <span className="font-semibold">${analysis.metrics.projectedValue3Y.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Allocation Compliance */}
              <AllocationCompliance 
                allocations={analysis.allocations}
                rules={analysis.riskAnalysis.requiredRules}
                complianceStatus={analysis.riskAnalysis.complianceStatus}
                issues={analysis.riskAnalysis.complianceIssues}
              />

              {/* Recommendations */}
              <PortfolioRecommendations 
                recommendations={analysis.recommendations}
                portfolioId={portfolioId}
              />

              {/* Historical Performance */}
              <div className="lg:col-span-2">
                <HistoricalPerformanceTracker portfolioId={portfolioId} />
              </div>

              {/* Asset Breakdown */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Asset Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.assetBreakdown.map((asset, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold">{asset.name}</p>
                            <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">${asset.currentValue.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">{asset.allocation}</p>
                          </div>
                          
                          <Badge variant={asset.pnl >= 0 ? "default" : "destructive"}>
                            {asset.pnl >= 0 ? '+' : ''}${asset.pnl.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}