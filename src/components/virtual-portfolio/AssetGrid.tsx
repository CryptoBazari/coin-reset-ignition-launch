import AssetCard from './AssetCard';
import { AssetHolding } from '@/types/assetHoldings';

interface AssetGridProps {
  assets: AssetHolding[];
  isEmpty: boolean;
  isFiltered: boolean;
}

const AssetGrid = ({ assets, isEmpty, isFiltered }: AssetGridProps) => {
  if (assets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isEmpty ? 'No assets in portfolio' : 'No assets match your search criteria'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {assets.map(asset => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
};

export default AssetGrid;