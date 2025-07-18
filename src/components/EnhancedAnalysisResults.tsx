import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, BarChart3 } from 'lucide-react';

interface EnhancedAnalysisResultsProps {
  result: {
    enhancedCoinData: any;
    metrics: {
      npv: { npv: number; confidenceScore: number; projectedValues: number[] };
      cagr: { cagr: number; volatilityAdjustedCAGR: number; onChainGrowthRate: number };
      irr: { irr: number; stakingAdjustedIRR: number; networkEffectIRR: number };
      beta: { traditionalBeta: number; onChainBeta: number; adjustedBeta: number };
      risk: { overallRisk: number; liquidityRisk: number; technicalRisk: number; fundamentalRisk: number; cointimeRisk: number };
    };
    recommendation: any;
    dataQuality: {
      glassnodeConnection: boolean;
      confidenceScore: number;
      lastUpdated: string;
      dataCompleteness?: number;
    };
    insights?: {
      glassnodeInsights?: string[];
    };
  };
}

export const EnhancedAnalysisResults: React.FC<EnhancedAnalysisResultsProps> = ({ result }) => {
  const { enhancedCoinData, metrics, recommendation, dataQuality, insights } = result;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'text-green-600';
    if (risk < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'Buy': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'Buy Less': return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      case 'Do Not Buy': return <TrendingDown className="h-5 w-5 text-red-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Buy': return 'bg-green-50 border-green-200 text-green-800';
      case 'Buy Less': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'Do Not Buy': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Data Quality Indicator */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Analysis Quality & Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {dataQuality.glassnodeConnection ? 
                <CheckCircle className="h-5 w-5 text-green-600" /> : 
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              }
              <span className="text-sm font-medium">
                {dataQuality.glassnodeConnection ? 'Live Glass Node Data' : 'Limited Data Available'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Confidence Score:</span>
              <Badge variant={dataQuality.confidenceScore > 80 ? 'default' : 'secondary'}>
                {dataQuality.confidenceScore}%
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Updated: {new Date(dataQuality.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
          
          {dataQuality.dataCompleteness && (
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Data Completeness</span>
                <span className="text-sm font-medium">{dataQuality.dataCompleteness}%</span>
              </div>
              <Progress value={dataQuality.dataCompleteness} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Recommendation */}
      <Card className={`border-2 ${getRecommendationColor(recommendation.recommendation)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            {getRecommendationIcon(recommendation.recommendation)}
            Investment Recommendation: {recommendation.recommendation}
          </CardTitle>
          <CardDescription className="text-base">
            {recommendation.conditions || recommendation.marketAnalysis}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Financial Summary</h4>
              <ul className="text-sm space-y-2">
                <li className="flex justify-between">
                  <span>NPV:</span>
                  <span className={metrics.npv.npv > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {formatCurrency(metrics.npv.npv)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Network Effect IRR:</span>
                  <span className="font-medium">{formatPercentage(metrics.irr.networkEffectIRR)}</span>
                </li>
                <li className="flex justify-between">
                  <span>On-chain Growth:</span>
                  <span className={metrics.cagr.onChainGrowthRate > 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercentage(metrics.cagr.onChainGrowthRate)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Overall Risk:</span>
                  <span className={getRiskColor(metrics.risk.overallRisk)}>
                    {metrics.risk.overallRisk.toFixed(0)}/100
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Cointime Economics</h4>
              <ul className="text-sm space-y-2">
                <li className="flex justify-between">
                  <span>AVIV Ratio:</span>
                  <span className="font-medium">{enhancedCoinData.liveMetrics.avivRatio.toFixed(2)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Active Supply:</span>
                  <span>{formatPercentage(enhancedCoinData.liveMetrics.activeSupply)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Vaulted Supply:</span>
                  <span>{formatPercentage(enhancedCoinData.liveMetrics.vaultedSupply)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Liveliness:</span>
                  <span>{enhancedCoinData.liveMetrics.liveliness.toFixed(3)}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Glass Node Insights */}
          {insights?.glassnodeInsights && insights.glassnodeInsights.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Glass Node Insights</h4>
              <ul className="text-sm space-y-1">
                {insights.glassnodeInsights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial" className="text-sm">Financial Metrics</TabsTrigger>
          <TabsTrigger value="risk" className="text-sm">Risk Analysis</TabsTrigger>
          <TabsTrigger value="onchain" className="text-sm">On-Chain Data</TabsTrigger>
          <TabsTrigger value="technical" className="text-sm">Technical Indicators</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NPV Analysis */}
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="text-lg">Net Present Value (NPV)</CardTitle>
                <CardDescription>Enhanced with Glass Node projections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Enhanced NPV:</span>
                    <span className={`text-lg font-bold ${metrics.npv.npv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(metrics.npv.npv)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence Score:</span>
                    <span className="font-medium">{metrics.npv.confidenceScore}%</span>
                  </div>
                  <Progress value={metrics.npv.confidenceScore} className="w-full" />
                </div>
              </CardContent>
            </Card>

            {/* CAGR Analysis */}
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="text-lg">Compound Annual Growth Rate</CardTitle>
                <CardDescription>Multiple growth perspectives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Traditional CAGR:</span>
                    <span className="font-medium">{formatPercentage(metrics.cagr.cagr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volatility-Adjusted:</span>
                    <span className="font-medium">{formatPercentage(metrics.cagr.volatilityAdjustedCAGR)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>On-Chain Growth:</span>
                    <span className={`font-medium ${metrics.cagr.onChainGrowthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(metrics.cagr.onChainGrowthRate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* IRR Analysis */}
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="text-lg">Internal Rate of Return</CardTitle>
                <CardDescription>Including network effects and staking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Base IRR:</span>
                    <span className="font-medium">{formatPercentage(metrics.irr.irr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>With Staking:</span>
                    <span className="font-medium">{formatPercentage(metrics.irr.stakingAdjustedIRR)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Effect IRR:</span>
                    <span className="text-lg font-bold text-primary">{formatPercentage(metrics.irr.networkEffectIRR)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Beta Analysis */}
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="text-lg">Beta (Market Correlation)</CardTitle>
                <CardDescription>Traditional vs. on-chain adjusted</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Traditional Beta:</span>
                    <span className="font-medium">{metrics.beta.traditionalBeta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>On-Chain Beta:</span>
                    <span className="font-medium">{metrics.beta.onChainBeta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Adjusted Beta:</span>
                    <span className="text-lg font-bold text-primary">{metrics.beta.adjustedBeta.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Risk Factor Breakdown
              </CardTitle>
              <CardDescription>Comprehensive risk analysis using Glass Node data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Overall Risk</span>
                      <span className={`font-bold ${getRiskColor(metrics.risk.overallRisk)}`}>
                        {metrics.risk.overallRisk.toFixed(0)}/100
                      </span>
                    </div>
                    <Progress value={metrics.risk.overallRisk} className="w-full h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Liquidity Risk</span>
                      <span className={getRiskColor(metrics.risk.liquidityRisk)}>
                        {metrics.risk.liquidityRisk.toFixed(0)}/100
                      </span>
                    </div>
                    <Progress value={metrics.risk.liquidityRisk} className="w-full" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Technical Risk</span>
                      <span className={getRiskColor(metrics.risk.technicalRisk)}>
                        {metrics.risk.technicalRisk.toFixed(0)}/100
                      </span>
                    </div>
                    <Progress value={metrics.risk.technicalRisk} className="w-full" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Cointime Risk</span>
                      <span className={getRiskColor(metrics.risk.cointimeRisk)}>
                        {metrics.risk.cointimeRisk.toFixed(0)}/100
                      </span>
                    </div>
                    <Progress value={metrics.risk.cointimeRisk} className="w-full" />
                  </div>
                </div>
                
                {recommendation.risks && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Risk Warnings</h4>
                    <p className="text-sm text-red-700">{recommendation.risks}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onchain" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle>Network Activity</CardTitle>
                <CardDescription>Live blockchain metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Transaction Volume:</span>
                    <span className="font-medium">{formatCurrency(enhancedCoinData.onChainData.transactionVolume)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Addresses:</span>
                    <span className="font-medium">{enhancedCoinData.onChainData.activeAddresses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Growth:</span>
                    <span className={`font-bold ${enhancedCoinData.onChainData.networkGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(enhancedCoinData.onChainData.networkGrowth)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <CardTitle>Supply Dynamics</CardTitle>
                <CardDescription>Cointime economics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Active Supply:</span>
                    <span className="font-medium">{formatPercentage(enhancedCoinData.liveMetrics.activeSupply)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vaulted Supply:</span>
                    <span className="font-medium">{formatPercentage(enhancedCoinData.liveMetrics.vaultedSupply)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Liveliness:</span>
                    <span className="font-medium">{enhancedCoinData.liveMetrics.liveliness.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vaultedness:</span>
                    <span className="font-medium">{enhancedCoinData.liveMetrics.vaultedness.toFixed(3)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Indicators</CardTitle>
              <CardDescription>Advanced on-chain technical analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>NVT Ratio:</span>
                    <span className="font-medium">{enhancedCoinData.technicalIndicators.nvtRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SOPR:</span>
                    <span className={`font-medium ${enhancedCoinData.technicalIndicators.sopr > 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {enhancedCoinData.technicalIndicators.sopr.toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Puell Multiple:</span>
                    <span className="font-medium">{enhancedCoinData.technicalIndicators.puellMultiple.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MVRV Ratio:</span>
                    <span className="font-medium">{enhancedCoinData.technicalIndicators.mvrv.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Technical Interpretation</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• SOPR &gt; 1.0 indicates profit-taking, &lt; 1.0 suggests accumulation</li>
                  <li>• NVT Ratio measures network valuation relative to transaction volume</li>
                  <li>• MVRV shows market value vs. realized value relationship</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};