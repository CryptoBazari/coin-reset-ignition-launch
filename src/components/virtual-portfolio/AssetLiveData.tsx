
import { CoinMarketCapCoin } from '@/services/coinMarketCapService';

interface AssetLiveDataProps {
  liveCoinData: CoinMarketCapCoin;
}

const AssetLiveData = ({ liveCoinData }: AssetLiveDataProps) => {
  return (
    <div className="mt-3 pt-3 border-t">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-500">
        <div>
          <span className="font-medium">Market Cap:</span>
          <div>${liveCoinData.market_cap?.toLocaleString() || 'N/A'}</div>
        </div>
        <div>
          <span className="font-medium">24h Change:</span>
          <div className={liveCoinData.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}>
            {liveCoinData.price_change_24h >= 0 ? '+' : ''}{liveCoinData.price_change_24h?.toFixed(2)}%
          </div>
        </div>
        <div>
          <span className="font-medium">Data Source:</span>
          <div>CoinMarketCap</div>
        </div>
      </div>
    </div>
  );
};

export default AssetLiveData;
