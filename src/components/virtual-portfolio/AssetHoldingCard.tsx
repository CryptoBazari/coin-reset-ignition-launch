
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Plus, Minus } from 'lucide-react';
import { AssetHolding } from '@/types/assetHoldings';
import { CoinMarketCapCoin } from '@/services/coinMarketCapService';

import AssetLiveData from './AssetLiveData';

interface AssetHoldingCardProps {
  asset: AssetHolding;
  liveCoinData: CoinMarketCapCoin | null;
  onEditAsset?: (asset: AssetHolding) => void;
  onDeleteAsset?: (asset: AssetHolding) => void;
  onBuyMore?: (asset: AssetHolding) => void;
  onSell?: (asset: AssetHolding) => void;
}

const AssetHoldingCard = ({ asset, liveCoinData, onEditAsset, onDeleteAsset, onBuyMore, onSell }: AssetHoldingCardProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Bitcoin': return 'bg-orange-100 text-orange-800';
      case 'Blue Chip': return 'bg-blue-100 text-blue-800';
      case 'Small-Cap': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentPrice = liveCoinData?.current_price || asset.current_price;
  const currentValue = asset.market_value;
  
  // Use pre-calculated values from AssetHolding
  const unrealizedPnL = asset.unrealized_pnl;
  const unrealizedPnLPercent = asset.unrealized_pnl_percentage;
  
  // Total profit/loss (for AssetHolding, unrealized is the total since we don't track realized separately)
  const totalPnL = unrealizedPnL;
  const totalPnLPercent = unrealizedPnLPercent;
  
  // Price change percentage
  const priceChange = liveCoinData ? ((liveCoinData.current_price - asset.average_price) / asset.average_price) * 100 : 0;

  console.log('Asset calculation:', {
    symbol: asset.coin_symbol,
    total_amount: asset.total_amount,
    currentPrice,
    currentValue,
    cost_basis: asset.cost_basis,
    unrealizedPnL,
    totalPnL,
    liveCoinData
  });

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {liveCoinData?.logo && (
            <img 
              src={liveCoinData.logo} 
              alt={asset.coin_symbol}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              {asset.coin_symbol} - {asset.coin_name}
            </h3>
            <div className="flex gap-2 mt-1">
              <Badge className={getCategoryColor(asset.category)}>
                {asset.category}
              </Badge>
              {liveCoinData && (
                <Badge variant="outline" className="text-xs">
                  Live Data
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="font-semibold text-lg">
              ${currentValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <div className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
            </div>
          </div>
          
          {/* Action Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onBuyMore?.(asset)} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Buy More
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSell?.(asset)} className="cursor-pointer">
                <Minus className="h-4 w-4 mr-2" />
                Sell
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditAsset?.(asset)} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                Edit Asset
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteAsset?.(asset)} className="cursor-pointer text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Asset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* AssetMetrics temporarily commented out due to type mismatch 
      <AssetMetrics 
        asset={asset}
        currentPrice={currentPrice}
        priceChange={priceChange}
        unrealizedPnL={unrealizedPnL}
        liveCoinData={liveCoinData}
      />
      */}

      {liveCoinData && (
        <AssetLiveData liveCoinData={liveCoinData} />
      )}
    </div>
  );
};

export default AssetHoldingCard;
