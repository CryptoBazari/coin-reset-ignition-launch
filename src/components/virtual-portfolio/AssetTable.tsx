import { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { AssetHolding, SortOption, SortOrder } from '@/types/assetHoldings';
import { CoinMarketCapCoin } from '@/services/coinMarketCapService';
import AssetRow from './AssetRow';
import EditAssetDialog from './EditAssetDialog';
import AddTransactionDialog from './AddTransactionDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AssetTableProps {
  assets: AssetHolding[];
  isEmpty: boolean;
  isFiltered: boolean;
  liveCoinsData: CoinMarketCapCoin[];
  sortBy: SortOption;
  setSortBy: (sortBy: SortOption) => void;
  sortOrder: SortOrder;
  setSortOrder: (sortOrder: SortOrder) => void;
  portfolioId: string;
  onAssetsUpdated?: () => void;
}

const AssetTable = ({ 
  assets, 
  isEmpty, 
  isFiltered, 
  liveCoinsData, 
  sortBy, 
  setSortBy, 
  sortOrder, 
  setSortOrder,
  portfolioId,
  onAssetsUpdated 
}: AssetTableProps) => {
  const { toast } = useToast();
  const [editAsset, setEditAsset] = useState<AssetHolding | null>(null);
  const [editAssetDialogOpen, setEditAssetDialogOpen] = useState(false);
  const [addTransactionDialogOpen, setAddTransactionDialogOpen] = useState(false);
  const [selectedAssetForTransaction, setSelectedAssetForTransaction] = useState<AssetHolding | null>(null);

  const handleSort = (column: SortOption) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }: { column: SortOption }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />;
  };

  const handleDeleteAsset = async (asset: AssetHolding) => {
    try {
      // First delete all related transactions by asset_id
      const { error: transactionError } = await supabase
        .from('virtual_transactions')
        .delete()
        .eq('asset_id', asset.id);

      if (transactionError) throw transactionError;

      // Also clean up any orphaned transactions for this coin (fallback for old data)
      const { error: orphanedError } = await supabase
        .from('virtual_transactions')
        .delete()
        .eq('coin_id', asset.id)
        .is('asset_id', null);

      if (orphanedError) throw orphanedError;

      // Then delete the asset
      const { error: assetError } = await supabase
        .from('virtual_assets')
        .delete()
        .eq('id', asset.id);

      if (assetError) throw assetError;

      toast({
        title: "Asset Deleted",
        description: `${asset.coin_symbol} has been removed from your portfolio.`,
      });
      
      onAssetsUpdated?.();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: "Error",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBuyMore = (asset: AssetHolding) => {
    setSelectedAssetForTransaction(asset);
    setAddTransactionDialogOpen(true);
  };

  const handleSell = (asset: AssetHolding) => {
    setSelectedAssetForTransaction(asset);
    setAddTransactionDialogOpen(true);
  };

  if (isEmpty) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="text-lg font-medium mb-2">No assets in portfolio yet</div>
        <div className="text-sm">Add your first transaction to get started.</div>
      </div>
    );
  }

  if (isFiltered) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="text-lg font-medium mb-2">No assets match your search criteria</div>
        <div className="text-sm">Try adjusting your filters.</div>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[250px]">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
                >
                  Asset
                  <SortIcon column="name" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Holdings</TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('value')}
                  className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
                >
                  Value
                  <SortIcon column="value" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('pnl')}
                  className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
                >
                  P&L
                  <SortIcon column="pnl" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('allocation')}
                  className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
                >
                  Allocation
                  <SortIcon column="allocation" />
                </Button>
              </TableHead>
              <TableHead className="text-center">Category</TableHead>
              <TableHead className="text-center w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => {
              const liveCoinData = liveCoinsData.find(coin => 
                coin.symbol.toLowerCase() === asset.coin_symbol.toLowerCase()
              ) || null;
              
              return (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  liveCoinData={liveCoinData}
                  onEditAsset={(asset) => {
                    setEditAsset(asset);
                    setEditAssetDialogOpen(true);
                  }}
                  onDeleteAsset={handleDeleteAsset}
                  onBuyMore={handleBuyMore}
                  onSell={handleSell}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>

      <EditAssetDialog
        open={editAssetDialogOpen}
        onOpenChange={setEditAssetDialogOpen}
        asset={editAsset}
        onSuccess={() => {
          onAssetsUpdated?.();
          setEditAsset(null);
        }}
      />

      <AddTransactionDialog
        open={addTransactionDialogOpen}
        onOpenChange={setAddTransactionDialogOpen}
        portfolioId={portfolioId}
        onSuccess={() => {
          onAssetsUpdated?.();
          setSelectedAssetForTransaction(null);
        }}
      />
    </>
  );
};

export default AssetTable;