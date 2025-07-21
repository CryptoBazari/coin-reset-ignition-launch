
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Bitcoin } from 'lucide-react';
import { useVirtualPortfolioAnalysis, VirtualPortfolioAnalysisResult } from '@/hooks/useVirtualPortfolioAnalysis';
import { useEffect, useState } from 'react';

interface PortfolioAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  portfolioName: string;
}

const PortfolioAnalysisModal = ({ open, onOpenChange, portfolioId, portfolioName }: PortfolioAnalysisModalProps) => {
  const { analyzeVirtualPortfolio, loading, error } = useVirtualPortfolioAnalysis();
  const [analysis, setAnalysis] = useState<VirtualPortfolioAnalysisResult | null>(null);

  useEffect(() => {
    if (open && portfolioId) {
      runAnalysis();
    }
  }, [open, portfolioId]);

  const runAnalysis = async () => {
    const result = await analyzeVirtualPortfolio(portfolioId);
    setAnalysis(result);
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analyzing {portfolioName}...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Running comprehensive portfolio analysis...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analysis Error</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={runAnalysis}>Try Again</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Portfolio Analysis: {portfolioName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="allocations">Allocations</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="assets">Asset Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Portfolio Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analysis.totalValue)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total P&L</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${analysis.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analysis.totalProfit >= 0 ? '+' : ''}{formatCurrency(analysis.totalProfit)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Portfolio NPV</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${analysis.overallNPV >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(analysis.overallNPV)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Portfolio IRR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${analysis.overallIRR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(analysis.overallIRR)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bitcoin Market Timing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5" />
                  Bitcoin Market Timing (AVIV Ratio)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Current AVIV Ratio</div>
                    <div className="text-2xl font-bold">{analysis.marketTiming.bitcoinAvivRatio.toFixed(3)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Confidence</div>
                    <div className="text-2xl font-bold">{analysis.marketTiming.confidence}%</div>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{analysis.marketTiming.recommendation}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    AVIV ratio measures Bitcoin's market timing across all portfolio assets
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allocations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Basket Allocations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analysis.basketAllocations).map(([basket, percentage]) => (
                  <div key={basket} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{basket}</span>
                      <span>{formatPercentage(percentage)}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Risk Level</span>
                  <Badge className={getRiskColor(analysis.riskAnalysis.riskLevel)}>
                    {analysis.riskAnalysis.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current BTC Allocation</span>
                    <span>{formatPercentage(analysis.riskAnalysis.currentBtcAllocation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recommended BTC Allocation</span>
                    <span>{formatPercentage(analysis.riskAnalysis.recommendedBtcAllocation)}</span>
                  </div>
                  <Progress 
                    value={analysis.riskAnalysis.currentBtcAllocation} 
                    className="h-2"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {analysis.riskAnalysis.isCompliant ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="font-medium">
                    {analysis.riskAnalysis.isCompliant ? 'Compliant' : 'Needs Rebalancing'}
                  </span>
                </div>

                {analysis.riskAnalysis.rebalanceRecommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Recommendations:</h4>
                    {analysis.riskAnalysis.rebalanceRecommendations.map((rec, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        {rec}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            {analysis.assetAnalyses.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{item.asset.virtual_coins.name} ({item.asset.virtual_coins.symbol})</span>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Current Value</div>
                      <div className="font-bold">{formatCurrency(item.currentValue)}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">P&L</div>
                      <div className={`font-bold ${item.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.profitLoss >= 0 ? '+' : ''}{formatCurrency(item.profitLoss)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">NPV</div>
                      <div className="font-bold">{formatCurrency(item.analysis?.metrics?.npv || 0)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">IRR</div>
                      <div className="font-bold">{formatPercentage(item.analysis?.metrics?.irr || 0)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Recommendation</div>
                      <Badge variant="outline">{item.analysis?.recommendation?.recommendation || 'N/A'}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioAnalysisModal;
