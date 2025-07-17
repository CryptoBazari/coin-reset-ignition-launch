import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Target, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface AllocationData {
  portfolioPercentage: number;
  status: 'underexposed' | 'optimal' | 'overexposed';
  recommendation: 'increase' | 'decrease' | 'maintain';
  message: string;
  targetRange: [number, number];
}

interface AllocationAnalysisCardProps {
  allocation: AllocationData;
  coinBasket: string;
  coinName: string;
}

export const AllocationAnalysisCard: React.FC<AllocationAnalysisCardProps> = ({
  allocation,
  coinBasket,
  coinName
}) => {
  // Basket allocation rules for display
  const basketRules = {
    'Bitcoin': { min: 60, max: 80, recommended: [60, 75], foundation: true },
    'Blue Chip': { min: 0, max: 40, recommended: [20, 35], foundation: false },
    'Small-Cap': { min: 0, max: 15, recommended: [5, 10], foundation: false }
  };

  const rules = basketRules[coinBasket as keyof typeof basketRules] || basketRules['Blue Chip'];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-success';
      case 'underexposed': return 'text-warning';
      case 'overexposed': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'underexposed': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'overexposed': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  const getRecommendationAction = (recommendation: string) => {
    switch (recommendation) {
      case 'increase': return { action: 'Increase Position', color: 'bg-success' };
      case 'decrease': return { action: 'Reduce Position', color: 'bg-destructive' };
      case 'maintain': return { action: 'Maintain Position', color: 'bg-primary' };
      default: return { action: 'Review Position', color: 'bg-muted' };
    }
  };

  const progressValue = Math.min(100, (allocation.portfolioPercentage / rules.max) * 100);
  const recommendationAction = getRecommendationAction(allocation.recommendation);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Portfolio Allocation Analysis - {coinName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Allocation Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Current {coinBasket} Allocation</div>
            <div className={`text-2xl font-bold ${getStatusColor(allocation.status)}`}>
              {allocation.portfolioPercentage.toFixed(1)}%
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(allocation.status)}
              <Badge variant={allocation.status === 'optimal' ? 'default' : 'secondary'}>
                {allocation.status.charAt(0).toUpperCase() + allocation.status.slice(1)}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {rules.recommended[0]}-{rules.recommended[1]}%
            </div>
          </div>
        </div>

        {/* Allocation Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Allocation Progress</span>
            <span>{allocation.portfolioPercentage.toFixed(1)}% of {rules.max}% max</span>
          </div>
          <Progress value={progressValue} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Min: {rules.min}%</span>
            <span>Recommended: {rules.recommended[0]}-{rules.recommended[1]}%</span>
            <span>Max: {rules.max}%</span>
          </div>
        </div>

        {/* Basket Rules */}
        <div>
          <h4 className="font-semibold mb-3">{coinBasket} Allocation Rules</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Minimum</div>
              <div className="text-lg font-semibold">{rules.min}%</div>
              <div className="text-xs text-muted-foreground">
                {rules.foundation ? 'Portfolio foundation' : 'Optional allocation'}
              </div>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Recommended</div>
              <div className="text-lg font-semibold">{rules.recommended[0]}-{rules.recommended[1]}%</div>
              <div className="text-xs text-muted-foreground">Optimal range</div>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Maximum</div>
              <div className="text-lg font-semibold">{rules.max}%</div>
              <div className="text-xs text-muted-foreground">
                {coinBasket === 'Bitcoin' ? 'Over-concentration risk' : 'Diversification limit'}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Recommendation</h4>
            <Badge className={recommendationAction.color}>
              {recommendationAction.action}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{allocation.message}</p>
        </div>

        {/* Special Alerts */}
        {coinBasket === 'Bitcoin' && allocation.portfolioPercentage < 60 && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Foundation Alert:</strong> Bitcoin allocation below 60% minimum. Bitcoin should form the foundation of a crypto portfolio for stability and long-term growth.
            </AlertDescription>
          </Alert>
        )}

        {coinBasket === 'Small-Cap' && allocation.portfolioPercentage > 10 && (
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>High Risk Warning:</strong> Small-cap allocation above 10% significantly increases portfolio volatility. Consider reducing exposure to manage risk.
            </AlertDescription>
          </Alert>
        )}

        {coinBasket === 'Blue Chip' && allocation.portfolioPercentage > 30 && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Diversification Note:</strong> High blue-chip allocation may reduce Bitcoin's foundational role. Ensure adequate Bitcoin exposure for portfolio stability.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};