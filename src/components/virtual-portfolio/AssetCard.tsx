import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, MoreVertical, Plus, Minus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AssetHolding } from '@/types/assetHoldings';

interface AssetCardProps {
  asset: AssetHolding;
}

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'bitcoin':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'ethereum':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'defi':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'altcoin':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const AssetCard = ({ asset }: AssetCardProps) => {
  const isProfit = asset.unrealized_pnl >= 0;
  const priceChange = asset.current_price - asset.average_price;
  const priceChangePercentage = asset.average_price > 0 ? (priceChange / asset.average_price) * 100 : 0;
  const isPriceUp = priceChange >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div>
            <CardTitle className="text-lg font-semibold">{asset.coin_symbol}</CardTitle>
            <p className="text-sm text-muted-foreground">{asset.coin_name}</p>
          </div>
          <Badge className={getCategoryColor(asset.category)}>
            {asset.category}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Plus className="h-4 w-4 mr-2" />
              Buy More
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Minus className="h-4 w-4 mr-2" />
              Sell
            </DropdownMenuItem>
            <DropdownMenuItem>
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Holdings</p>
            <p className="font-medium">{asset.total_amount.toFixed(6)} {asset.coin_symbol}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Market Value</p>
            <p className="font-medium">${asset.market_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg. Price</p>
            <p className="font-medium">${asset.average_price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Price</p>
            <div className="flex items-center gap-1">
              <p className="font-medium">${asset.current_price.toFixed(2)}</p>
              {Math.abs(priceChangePercentage) > 0.01 && (
                <div className={`flex items-center text-xs ${isPriceUp ? 'text-green-600' : 'text-red-600'}`}>
                  {isPriceUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isPriceUp ? '+' : ''}{priceChangePercentage.toFixed(1)}%
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cost Basis</p>
            <p className="font-medium">${asset.cost_basis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Unrealized P&L</p>
            <div className={`font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit ? '+' : ''}${asset.unrealized_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs ml-1">
                ({isProfit ? '+' : ''}{asset.unrealized_pnl_percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Portfolio Allocation</span>
            <Badge variant="outline">{asset.allocation_percentage.toFixed(1)}%</Badge>
          </div>
          <div className="mt-2 bg-muted rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${Math.min(asset.allocation_percentage, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetCard;