import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AssetHolding } from '@/types/assetHoldings';

interface AssetSummaryStatsProps {
  assets: AssetHolding[];
}

const AssetSummaryStats = ({ assets }: AssetSummaryStatsProps) => {
  const totalValue = assets.reduce((sum, asset) => sum + asset.market_value, 0);
  const totalUnrealizedPnl = assets.reduce((sum, asset) => sum + asset.unrealized_pnl, 0);
  const totalCostBasis = assets.reduce((sum, asset) => sum + asset.cost_basis, 0);
  const totalUnrealizedPnlPercentage = totalCostBasis > 0 ? (totalUnrealizedPnl / totalCostBasis) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Holdings Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost Basis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Unrealized P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalUnrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <Badge 
            variant="secondary" 
            className={`mt-1 ${totalUnrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {totalUnrealizedPnl >= 0 ? '+' : ''}{totalUnrealizedPnlPercentage.toFixed(2)}%
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetSummaryStats;