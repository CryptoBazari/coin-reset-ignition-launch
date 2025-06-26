
import { VirtualAsset } from '@/types/virtualPortfolio';
import { CoinMarketCapCoin } from '@/services/coinMarketCapService';

interface AssetMetricsProps {
  asset: VirtualAsset;
  currentPrice: number;
  priceChange: number;
  unrealizedPnL: number;
  liveCoinData: CoinMarketCapCoin | null;
}

const AssetMetrics = ({ asset, currentPrice, priceChange, unrealizedPnL, liveCoinData }: AssetMetricsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
      <div>
        <span className="font-medium text-gray-600">Holdings:</span>
        <div className="mt-1">{asset.total_amount.toFixed(8)} {asset.virtual_coins.symbol}</div>
      </div>
      <div>
        <span className="font-medium text-gray-600">Current Price:</span>
        <div className="mt-1">
          ${currentPrice.toLocaleString()}
          {liveCoinData && priceChange !== 0 && (
            <div className={`text-xs ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          )}
        </div>
      </div>
      <div>
        <span className="font-medium text-gray-600">Avg Buy Price:</span>
        <div className="mt-1">${asset.average_price.toLocaleString()}</div>
      </div>
      <div>
        <span className="font-medium text-gray-600">Cost Basis:</span>
        <div className="mt-1">${asset.cost_basis.toFixed(2)}</div>
      </div>
      <div>
        <span className="font-medium text-gray-600">Realized P&L:</span>
        <div className={`mt-1 ${asset.realized_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${asset.realized_profit.toFixed(2)}
        </div>
      </div>
      <div>
        <span className="font-medium text-gray-600">Unrealized P&L:</span>
        <div className={`mt-1 ${unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${unrealizedPnL.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default AssetMetrics;
