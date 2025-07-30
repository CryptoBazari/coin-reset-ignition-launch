import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calculator, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Target,
  Shield
} from 'lucide-react';
import { 
  enhancedVirtualPortfolioCalculatorService,
  EnhancedPortfolioAnalysis 
} from '@/services/enhancedVirtualPortfolioCalculatorService';

interface AdvancedMetricsCardProps {
  portfolioId: string;
}


const AdvancedMetricsCard: React.FC<AdvancedMetricsCardProps> = ({ portfolioId }) => {
  const [analysis, setAnalysis] = useState<EnhancedPortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Running enhanced virtual portfolio analysis...');
      const analysisResult = await enhancedVirtualPortfolioCalculatorService.analyzeVirtualPortfolio(portfolioId);
      
      setAnalysis(analysisResult);
      setLastUpdated(new Date());
      console.log('✅ Analysis completed successfully');
      
    } catch (error) {
      console.error('❌ Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Removed automatic analysis on portfolioId change
  // Analysis now only runs when manually triggered by user button click

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Advanced Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Advanced Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
            <div className="text-destructive">{error}</div>
            <Button variant="outline" onClick={runAnalysis} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Advanced Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto" />
            <div className="text-muted-foreground">No analysis data available</div>
            <Button onClick={runAnalysis} disabled={loading}>
              <Calculator className="w-4 h-4 mr-2" />
              Run Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Advanced Metrics</CardTitle>
              {lastUpdated && (
                <p className="text-sm text-muted-foreground mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runAnalysis}
            disabled={loading}
            className="hover:bg-primary/10 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-8">
        {/* Portfolio Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Portfolio NPV</p>
            <p className="text-2xl font-bold">{formatCurrency(analysis.portfolio.npv)}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Portfolio CAGR</p>
            <p className="text-2xl font-bold flex items-center gap-2">
              {formatPercentage(analysis.portfolio.cagr)}
              {analysis.portfolio.cagr >= 0 ? 
                <TrendingUp className="w-4 h-4 text-green-500" /> : 
                <TrendingDown className="w-4 h-4 text-red-500" />
              }
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Portfolio Beta</p>
            <p className="text-2xl font-bold">{analysis.portfolio.beta.toFixed(3)}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Diversification</p>
            <p className="text-2xl font-bold flex items-center gap-2">
              {analysis.portfolio.diversificationScore.toFixed(1)}/100
              <PieChart className="w-4 h-4 text-blue-500" />
            </p>
          </div>
        </div>

        <hr className="border-border" />

        {/* Projections */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Projections
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">1 Year:</span>
              <span className="text-lg font-bold">{formatCurrency(analysis.portfolio.projectedValue1Y)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">3 Years:</span>
              <span className="text-lg font-bold">{formatCurrency(analysis.portfolio.projectedValue3Y)}</span>
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Category Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Category Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(analysis.categories).map(([category, metrics]) => (
              <div key={category} className="p-4 rounded-lg border bg-muted/30">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium capitalize">{category}</h4>
                    <Badge variant="outline">{formatPercentage(metrics.weight)}</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">NPV:</span>
                      <span className="font-medium">{formatCurrency(metrics.npv)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CAGR:</span>
                      <span className="font-medium">{formatPercentage(metrics.cagr)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beta:</span>
                      <span className="font-medium">{metrics.beta.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        {/* Risk Analysis */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Risk Analysis
          </h3>
          
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Portfolio Risk Score</span>
              <Badge 
                variant={analysis.portfolio.riskScore > 70 ? 'destructive' : 
                        analysis.portfolio.riskScore > 40 ? 'default' : 'secondary'}
              >
                {analysis.portfolio.riskScore.toFixed(1)}/100
              </Badge>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  analysis.portfolio.riskScore > 70 ? 'bg-destructive' :
                  analysis.portfolio.riskScore > 40 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, analysis.portfolio.riskScore)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {analysis.decisions.length > 0 && (
          <>
            <hr className="border-border" />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Recommendations
              </h3>
              
              <div className="space-y-3">
                {analysis.decisions.slice(0, 5).map((decision, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getPriorityColor(decision.priority) as any}>
                            {decision.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">
                            {decision.type}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{decision.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">{decision.reason}</p>
                      </div>
                      {decision.amountUSD && (
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(decision.amountUSD)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {analysis.decisions.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{analysis.decisions.length - 5} more recommendations available
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedMetricsCard;