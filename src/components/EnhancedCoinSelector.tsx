import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, TrendingUp, Shield, AlertCircle } from 'lucide-react';
import { 
  fetchGlassNodeSupportedAssets, 
  fetchAllAvailableAssets, 
  GlassNodeAsset,
  getAssetDataQuality,
  getDataQualityColor,
  getDataQualityBadge
} from '@/services/glassNodeAssetService';
import { useToast } from '@/hooks/use-toast';

interface EnhancedCoinSelectorProps {
  value: string;
  onValueChange: (coinId: string, coinData: GlassNodeAsset) => void;
  placeholder?: string;
  showOnlyGlassNodeSupported?: boolean;
}

const EnhancedCoinSelector = ({ 
  value, 
  onValueChange, 
  placeholder = "Select a cryptocurrency",
  showOnlyGlassNodeSupported = false
}: EnhancedCoinSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['glass-node-assets', showOnlyGlassNodeSupported],
    queryFn: showOnlyGlassNodeSupported ? fetchGlassNodeSupportedAssets : fetchAllAvailableAssets,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Show error toast when API fails
  useEffect(() => {
    if (error) {
      console.error('Glass Node Asset API Error:', error);
      toast({
        title: "Asset Loading Error",
        description: "Failed to load cryptocurrency assets. Using fallback data.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Filter assets based on search term
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    
    if (!searchTerm) {
      return assets;
    }
    
    return assets.filter(asset => 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assets, searchTerm]);

  // Group assets by Glass Node support
  const groupedAssets = useMemo(() => {
    const glassNodeSupported = filteredAssets.filter(asset => asset.glass_node_supported);
    const others = filteredAssets.filter(asset => !asset.glass_node_supported);
    
    return {
      glassNodeSupported,
      others
    };
  }, [filteredAssets]);

  const handleValueChange = (coinId: string) => {
    console.log('Enhanced coin selected:', coinId);
    const selectedAsset = assets?.find(asset => asset.id === coinId);
    if (selectedAsset) {
      console.log('Selected asset data:', selectedAsset);
      onValueChange(coinId, selectedAsset);
    }
  };

  const renderAssetItem = (asset: GlassNodeAsset) => {
    const dataQuality = getAssetDataQuality(asset.glass_node_data_quality);
    const qualityColor = getDataQualityColor(dataQuality);
    const qualityBadge = getDataQualityBadge(dataQuality);
    
    return (
      <SelectItem key={asset.id} value={asset.id}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={asset.logo_url || undefined} alt={`${asset.name} logo`} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                {asset.symbol.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium">{asset.symbol}</span>
                <span className="text-sm text-gray-600">- {asset.name}</span>
                {asset.glass_node_supported && (
                  <Shield className="h-3 w-3 text-green-600" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${qualityColor}`}>
                  {qualityBadge}
                </Badge>
                <span className="text-xs text-gray-500">{asset.basket}</span>
                {asset.last_glass_node_update && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(asset.last_glass_node_update).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              ${asset.current_price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: asset.current_price < 1 ? 6 : 2
              })}
            </div>
            {asset.cagr_36m && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <TrendingUp className="h-3 w-3" />
                <span>{asset.cagr_36m.toFixed(1)}% CAGR</span>
              </div>
            )}
          </div>
        </div>
      </SelectItem>
    );
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={`Loading ${showOnlyGlassNodeSupported ? 'Glass Node' : 'all'} assets...`} />
        </SelectTrigger>
      </Select>
    );
  }

  if (error || !assets || assets.length === 0) {
    console.error('EnhancedCoinSelector error or no data:', error);
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Unable to load cryptocurrency assets" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search cryptocurrency..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-96 bg-white border border-gray-200 shadow-lg z-50">
          {filteredAssets.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <div>No cryptocurrencies found</div>
              <div className="text-xs mt-1">Try adjusting your search terms</div>
            </div>
          ) : (
            <>
              {groupedAssets.glassNodeSupported.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-50 border-b">
                    Glass Node Premium Assets ({groupedAssets.glassNodeSupported.length})
                  </div>
                  {groupedAssets.glassNodeSupported.map(renderAssetItem)}
                </>
              )}
              
              {!showOnlyGlassNodeSupported && groupedAssets.others.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-50 border-b">
                    Other Assets ({groupedAssets.others.length})
                  </div>
                  {groupedAssets.others.map(renderAssetItem)}
                </>
              )}
            </>
          )}
        </SelectContent>
      </Select>
      
      {/* Asset statistics */}
      <div className="flex gap-2 text-xs text-gray-500">
        <span>Glass Node: {groupedAssets.glassNodeSupported.length}</span>
        {!showOnlyGlassNodeSupported && (
          <span>Other: {groupedAssets.others.length}</span>
        )}
        <span>Total: {filteredAssets.length}</span>
      </div>
    </div>
  );
};

export default EnhancedCoinSelector;