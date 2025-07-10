import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { riskManagementService, RiskAnalysis, RebalanceRecommendation } from '@/services/riskManagementService';
import { fetchCoinPrices } from '@/services/coinMarketCapService';
import { supabase } from '@/integrations/supabase/client';
import { VirtualAsset } from '@/types/virtualPortfolio';

interface RiskAnalysisCardProps {
  portfolioId: string;
}

const RiskAnalysisCard = ({ portfolioId }: RiskAnalysisCardProps) => {
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [recommendation, setRecommendation] = useState<RebalanceRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<VirtualAsset[]>([]);

  useEffect(() => {
    fetchRiskAnalysis();
  }, [portfolioId]);

  const fetchRiskAnalysis = async () => {
    try {
      setLoading(true);

      // Fetch portfolio assets
      const { data: portfolioAssets, error } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins!inner(id, symbol, name)
        `)
        .eq('portfolio_id', portfolioId)
        .gt('total_amount', 0);

      if (error) throw error;

      if (!portfolioAssets || portfolioAssets.length === 0) {
        setRiskAnalysis(null);
        setRecommendation(null);
        setLoading(false);
        return;
      }

      // Type assertion for assets with proper category type
      const typedAssets = portfolioAssets as VirtualAsset[];
      setAssets(typedAssets);

      // Fetch live prices
      const symbols = portfolioAssets.map(asset => asset.virtual_coins.symbol);
      let liveCoinsData = [];
      
      try {
        liveCoinsData = await fetchCoinPrices(symbols);
      } catch (error) {
        console.warn('Could not fetch live prices for risk analysis:', error);
      }

      // Perform risk analysis
      const analysis = riskManagementService.analyzeRisk(typedAssets, liveCoinsData);
      const rebalanceRec = riskManagementService.getRebalanceRecommendation(analysis);

      setRiskAnalysis(analysis);
      setRecommendation(rebalanceRec);
    } catch (error) {
      console.error('Error fetching risk analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
    }
  };

  const getRiskIcon = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Shield className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Analyzing portfolio risk...</div>
        </CardContent>
      </Card>
    );
  }

  if (!riskAnalysis || assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Analysis
          </CardTitle>
          <CardDescription>Portfolio risk assessment and allocation recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No assets found in portfolio. Add some assets to see risk analysis.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Analysis
        </CardTitle>
        <CardDescription>Portfolio risk assessment and allocation recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Level Overview */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getRiskIcon(riskAnalysis.riskLevel)}
              <span className="font-medium">Risk Level</span>
            </div>
            <Badge className={getRiskLevelColor(riskAnalysis.riskLevel)}>
              {riskAnalysis.riskLevel.toUpperCase()}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Diversification Score</div>
            <div className="text-2xl font-bold">{riskAnalysis.diversificationScore}/100</div>
          </div>
        </div>

        {/* BTC Allocation */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Bitcoin Allocation</span>
            <span className="text-sm text-muted-foreground">
              {riskAnalysis.currentBtcAllocation.toFixed(1)}% / {riskAnalysis.recommendedBtcAllocation}%
            </span>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={riskAnalysis.currentBtcAllocation} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Current: {riskAnalysis.currentBtcAllocation.toFixed(1)}%</span>
              <span>Target: {riskAnalysis.recommendedBtcAllocation}%</span>
            </div>
          </div>
        </div>

        {/* Portfolio Value Tier Info */}
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          <div className="font-medium mb-1">Portfolio Value: ${riskAnalysis.totalValue.toLocaleString()}</div>
          <div>
            {riskAnalysis.totalValue <= 20000 && "Up to $20K: Minimum 50% BTC recommended"}
            {riskAnalysis.totalValue > 20000 && riskAnalysis.totalValue <= 100000 && "$20K - $100K: Minimum 70% BTC recommended"}
            {riskAnalysis.totalValue > 100000 && "Above $100K: Minimum 85% BTC recommended"}
          </div>
        </div>

        {/* Rebalancing Recommendation */}
        {recommendation && recommendation.action !== 'none' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Rebalancing Recommended</div>
                <div className="text-sm">{recommendation.reason}</div>
                <div className="flex items-center gap-2 text-sm">
                  {recommendation.action === 'buy_btc' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">
                    {recommendation.action === 'buy_btc' ? 'Buy' : 'Sell'} ~${recommendation.amount.toLocaleString()} worth of BTC
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Compliance Status */}
        <div className="flex items-center gap-2">
          {riskAnalysis.isCompliant ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">Portfolio is compliant with risk guidelines</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-600 font-medium">Portfolio needs rebalancing</span>
            </>
          )}
        </div>

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchRiskAnalysis}
          className="w-full"
        >
          Refresh Analysis
        </Button>
      </CardContent>
    </Card>
  );
};

export default RiskAnalysisCard;