import { useState } from 'react';
import AssetHoldingCard from './AssetHoldingCard';
import { AssetHolding } from '@/types/assetHoldings';
import { CoinMarketCapCoin } from '@/services/coinMarketCapService';
// import EmptyPortfolioState from './EmptyPortfolioState';
import EditAssetDialog from './EditAssetDialog';
import AddTransactionDialog from './AddTransactionDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AssetGridProps {
  assets: AssetHolding[];
  isEmpty: boolean;
  isFiltered: boolean;
  liveCoinsData: CoinMarketCapCoin[];
  onAssetsUpdated?: () => void;
}

const AssetGrid = ({ assets, isEmpty, isFiltered, liveCoinsData, onAssetsUpdated }: AssetGridProps) => {
  const { toast } = useToast();
  const [editAsset, setEditAsset] = useState<AssetHolding | null>(null);
  const [editAssetDialogOpen, setEditAssetDialogOpen] = useState(false);
  const [addTransactionDialogOpen, setAddTransactionDialogOpen] = useState(false);
  const [selectedAssetForTransaction, setSelectedAssetForTransaction] = useState<AssetHolding | null>(null);

  const handleDeleteAsset = async (asset: AssetHolding) => {
    try {
      // First delete all related transactions
      const { error: transactionError } = await supabase
        .from('virtual_transactions')
        .delete()
        .eq('asset_id', asset.id);

      if (transactionError) throw transactionError;

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
      <div className="text-center py-8 text-muted-foreground">
        No assets in portfolio yet. Add your first transaction to get started.
      </div>
    );
  }

  if (isFiltered) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No assets match your search criteria
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => {
          const liveCoinData = liveCoinsData.find(coin => 
            coin.symbol.toLowerCase() === asset.coin_symbol.toLowerCase()
          ) || null;
          
          return (
            <AssetHoldingCard 
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
        portfolioId={''}
        onSuccess={() => {
          onAssetsUpdated?.();
          setSelectedAssetForTransaction(null);
        }}
      />
    </>
  );
};

export default AssetGrid;