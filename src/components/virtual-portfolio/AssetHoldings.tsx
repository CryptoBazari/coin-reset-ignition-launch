import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAssetHoldings } from '@/hooks/useAssetHoldings';
import { AssetHoldingsProps } from '@/types/assetHoldings';
import AssetSummaryStats from './AssetSummaryStats';
import AssetFiltersControls from './AssetFiltersControls';
import AssetGrid from './AssetGrid';

const AssetHoldings = ({ portfolioId }: AssetHoldingsProps) => {
  const {
    assets,
    filteredAssets,
    loading,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  } = useAssetHoldings(portfolioId);

  const categories = ['all', ...Array.from(new Set(assets.map(asset => asset.category)))];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading holdings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <AssetSummaryStats assets={assets} />

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Asset Holdings
            <Badge variant="secondary">{filteredAssets.length} assets</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AssetFiltersControls
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            categories={categories}
          />

          <AssetGrid 
            assets={filteredAssets}
            isEmpty={assets.length === 0}
            isFiltered={filteredAssets.length === 0 && assets.length > 0}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetHoldings;