
import { Badge } from '@/components/ui/badge';
import { VirtualAsset } from '@/types/virtualPortfolio';
import { CoinMarketCapCoin } from '@/services/coinMarketCapService';
import AssetMetrics from './AssetMetrics';
import AssetLiveData from './AssetLiveData';

interface AssetHoldingCardProps {
  asset: VirtualAsset;
  liveCoinData: CoinMarketCapCoin | null;
}

const AssetHoldingCard = ({ asset, liveCoinData }: AssetHoldingCardProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Bitcoin': return 'bg-orange-100 text-orange-800';
      case 'Blue Chip': return 'bg-blue-100 text-blue-800';
      case 'Small-Cap': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentPrice = liveCoinData?.current_price || asset.average_price;
  const currentValue = asset.total_amount * currentPrice;
  
  // Calculate unrealized profit/loss (current value - cost basis)
  const unrealizedPnL = currentValue - asset.cost_basis;
  const unrealizedPnLPercent = asset.cost_basis > 0 ? (unrealizedPnL / asset.cost_basis) * 100 : 0;
  
  // Total profit/loss = realized + unrealized
  const totalPnL = asset.realized_profit + unrealizedPnL;
  const totalPnLPercent = asset.cost_basis > 0 ? (totalPnL / asset.cost_basis) * 100 : 0;
  
  // Price change percentage
  const priceChange = liveCoinData ? ((liveCoinData.current_price - asset.average_price) / asset.average_price) * 100 : 0;

  console.log('Asset calculation:', {
    symbol: asset.virtual_coins.symbol,
    total_amount: asset.total_amount,
    currentPrice,
    currentValue,
    cost_basis: asset.cost_basis,
    unrealizedPnL,
    realized_profit: asset.realized_profit,
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
              alt={asset.virtual_coins.symbol}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              {asset.virtual_coins.symbol} - {asset.virtual_coins.name}
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
      </div>
      
      <AssetMetrics 
        asset={asset}
        currentPrice={currentPrice}
        priceChange={priceChange}
        unrealizedPnL={unrealizedPnL}
        liveCoinData={liveCoinData}
      />

      {liveCoinData && (
        <AssetLiveData liveCoinData={liveCoinData} />
      )}
    </div>
  );
};

export default AssetHoldingCard;
