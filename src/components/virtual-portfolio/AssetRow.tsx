import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { MoreVertical, Edit, Trash2, Plus, Minus } from 'lucide-react';
import { AssetHolding } from '@/types/assetHoldings';
import { CoinMarketCapCoin } from '@/services/coinMarketCapService';

interface AssetRowProps {
  asset: AssetHolding;
  liveCoinData: CoinMarketCapCoin | null;
  onEditAsset?: (asset: AssetHolding) => void;
  onDeleteAsset?: (asset: AssetHolding) => void;
  onBuyMore?: (asset: AssetHolding) => void;
  onSell?: (asset: AssetHolding) => void;
}

const AssetRow = ({ asset, liveCoinData, onEditAsset, onDeleteAsset, onBuyMore, onSell }: AssetRowProps) => {
  const getCategoryVariant = (category: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (category) {
      case 'Bitcoin': return 'default';
      case 'Blue Chip': return 'secondary';
      case 'Small-Cap': return 'outline';
      default: return 'outline';
    }
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(decimals);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const currentPrice = liveCoinData?.current_price || asset.current_price;
  const priceChange24h = liveCoinData?.price_change_percentage_24h || 0;
  
  return (
    <TableRow className="hover:bg-muted/50">
      {/* Asset Column */}
      <TableCell>
        <div className="flex items-center gap-3">
          {liveCoinData?.logo && (
            <img 
              src={liveCoinData.logo} 
              alt={asset.coin_symbol}
              className="w-8 h-8 rounded-full flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="min-w-0">
            <div className="font-medium text-foreground">
              {asset.coin_symbol}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {asset.coin_name}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Holdings Column */}
      <TableCell className="text-right">
        <div className="font-medium">
          {formatNumber(asset.total_amount, 8)} {asset.coin_symbol}
        </div>
        <div className="text-sm text-muted-foreground">
          Avg: {formatCurrency(asset.average_price)}
        </div>
      </TableCell>

      {/* Value Column */}
      <TableCell className="text-right">
        <div className="font-medium">
          {formatCurrency(asset.market_value)}
        </div>
        <div className={`text-sm ${priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}% (24h)
        </div>
      </TableCell>

      {/* P&L Column */}
      <TableCell className="text-right">
        <div className={`font-medium ${asset.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {asset.unrealized_pnl >= 0 ? '+' : ''}{formatCurrency(asset.unrealized_pnl)}
        </div>
        <div className={`text-sm ${asset.unrealized_pnl_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {asset.unrealized_pnl_percentage >= 0 ? '+' : ''}{asset.unrealized_pnl_percentage.toFixed(2)}%
        </div>
      </TableCell>

      {/* Allocation Column */}
      <TableCell className="text-center">
        <div className="space-y-2">
          <div className="font-medium">
            {asset.allocation_percentage.toFixed(1)}%
          </div>
          <Progress 
            value={asset.allocation_percentage} 
            className="h-2 w-16 mx-auto"
          />
        </div>
      </TableCell>

      {/* Category Column */}
      <TableCell className="text-center">
        <Badge variant={getCategoryVariant(asset.category)}>
          {asset.category}
        </Badge>
      </TableCell>

      {/* Actions Column */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onBuyMore?.(asset)}
            className="h-8 px-2"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSell?.(asset)}
            className="h-8 px-2"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditAsset?.(asset)} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                Edit Asset
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteAsset?.(asset)} 
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Asset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default AssetRow;