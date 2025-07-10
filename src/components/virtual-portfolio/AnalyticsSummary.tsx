import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Award, AlertCircle } from 'lucide-react';

interface AnalyticsSummaryProps {
  portfolioId: string;
}

interface SummaryData {
  totalReturn: number;
  annualizedReturn: number;
  bestPerformingAsset: {
    symbol: string;
    return: number;
  };
  worstPerformingAsset: {
    symbol: string;
    return: number;
  };
  topGainer: {
    symbol: string;
    change: number;
  };
  topLoser: {
    symbol: string;
    change: number;
  };
}

const AnalyticsSummary = ({ portfolioId }: AnalyticsSummaryProps) => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSummary({
        totalReturn: 23.4,
        annualizedReturn: 45.8,
        bestPerformingAsset: { symbol: 'SOL', return: 78.2 },
        worstPerformingAsset: { symbol: 'ADA', return: -12.5 },
        topGainer: { symbol: 'ETH', change: 8.7 },
        topLoser: { symbol: 'DOT', change: -3.2 }
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [portfolioId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Loading summary...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Analytics Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Total Return</span>
            </div>
            <div className="text-xl font-bold text-green-600">
              +{summary.totalReturn.toFixed(1)}%
            </div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Award className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-muted-foreground">Best Asset</span>
            </div>
            <div className="text-lg font-bold">{summary.bestPerformingAsset.symbol}</div>
            <div className="text-sm text-green-600">+{summary.bestPerformingAsset.return.toFixed(1)}%</div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Worst Asset</span>
            </div>
            <div className="text-lg font-bold">{summary.worstPerformingAsset.symbol}</div>
            <div className="text-sm text-red-600">{summary.worstPerformingAsset.return.toFixed(1)}%</div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Annualized</span>
            </div>
            <div className="text-xl font-bold text-green-600">
              +{summary.annualizedReturn.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsSummary;