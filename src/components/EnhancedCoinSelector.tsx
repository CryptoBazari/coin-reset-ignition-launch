
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, TrendingUp, Shield, AlertCircle, Search } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
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
        description: "Failed to load cryptocurrency assets. Please try running asset discovery.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Enhanced search filtering with fuzzy matching
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    
    if (!searchTerm) {
      // Show top 50 by data quality when no search term
      return assets
        .sort((a, b) => b.glass_node_data_quality - a.glass_node_data_quality)
        .slice(0, 50);
    }
    
    const term = searchTerm.toLowerCase();
    
    return assets.filter(asset => {
      const matchesName = asset.name.toLowerCase().includes(term);
      const matchesSymbol = asset.symbol.toLowerCase().includes(term);
      const matchesId = asset.id.toLowerCase().includes(term);
      
      // Enhanced matching for common coin names
      const commonNames: Record<string, string[]> = {
        'bitcoin': ['btc', 'bitcoin'],
        'ethereum': ['eth', 'ethereum'],
        'litecoin': ['ltc', 'litecoin'],
        'cardano': ['ada', 'cardano'],
        'solana': ['sol', 'solana'],
        'polkadot': ['dot', 'polkadot'],
        'chainlink': ['link', 'chainlink'],
        'avalanche': ['avax', 'avalanche'],
        'polygon': ['matic', 'polygon'],
        'uniswap': ['uni', 'uniswap']
      };
      
      const matchesCommon = Object.entries(commonNames).some(([coinId, aliases]) => {
        return aliases.some(alias => alias.includes(term)) && 
               (asset.id.toLowerCase() === coinId || asset.symbol.toLowerCase() === aliases[0]);
      });
      
      return matchesName || matchesSymbol || matchesId || matchesCommon;
    })
    .sort((a, b) => {
      // Prioritize exact matches and Glass Node supported assets
      const aExact = a.symbol.toLowerCase() === term || a.name.toLowerCase() === term;
      const bExact = b.symbol.toLowerCase() === term || b.name.toLowerCase() === term;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then by Glass Node support
      if (a.glass_node_supported && !b.glass_node_supported) return -1;
      if (!a.glass_node_supported && b.glass_node_supported) return 1;
      
      // Then by data quality
      return b.glass_node_data_quality - a.glass_node_data_quality;
    })
    .slice(0, 100); // Limit to top 100 results for performance
  }, [assets, searchTerm]);

  // Group assets by Glass Node support
  const groupedAssets = useMemo(() => {
    const glassNodeSupported = filteredAssets.filter(asset => asset.glass_node_supported);
    const others = filteredAssets.filter(asset => !asset.glass_node_supported);
    
    return {
      glassNodeSupported: glassNodeSupported.slice(0, 50),
      others: others.slice(0, 25)
    };
  }, [filteredAssets]);

  const handleValueChange = (coinId: string) => {
    console.log('Enhanced coin selected:', coinId);
    const selectedAsset = assets?.find(asset => asset.id === coinId);
    if (selectedAsset) {
      console.log('Selected asset data:', selectedAsset);
      onValueChange(coinId, selectedAsset);
      setIsOpen(false);
      setSearchTerm('');
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
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 border rounded-md">
          <Search className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Loading assets...</span>
        </div>
      </div>
    );
  }

  if (error || !assets || assets.length === 0) {
    console.error('EnhancedCoinSelector error or no data:', error);
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 border rounded-md bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600">Unable to load assets. Please run asset discovery.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search cryptocurrencies... (e.g., bitcoin, btc, litecoin)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={value} onValueChange={handleValueChange} open={isOpen} onOpenChange={setIsOpen}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-96 bg-white border border-gray-200 shadow-lg z-50">
          {filteredAssets.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <div>No cryptocurrencies found</div>
              <div className="text-xs mt-1">Try different search terms or run asset discovery</div>
            </div>
          ) : (
            <>
              {groupedAssets.glassNodeSupported.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-50 border-b sticky top-0 z-10">
                    🟢 Glass Node Supported ({groupedAssets.glassNodeSupported.length})
                  </div>
                  {groupedAssets.glassNodeSupported.map(renderAssetItem)}
                </>
              )}
              
              {!showOnlyGlassNodeSupported && groupedAssets.others.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-50 border-b sticky top-0 z-10">
                    ⚪ Other Assets ({groupedAssets.others.length})
                  </div>
                  {groupedAssets.others.map(renderAssetItem)}
                </>
              )}
              
              {searchTerm && filteredAssets.length > 75 && (
                <div className="px-2 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                  Showing top {filteredAssets.length} results. Refine your search for more specific results.
                </div>
              )}
            </>
          )}
        </SelectContent>
      </Select>
      
      {/* Asset statistics */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span>Glass Node: {groupedAssets.glassNodeSupported.length}</span>
        {!showOnlyGlassNodeSupported && (
          <span>Other: {groupedAssets.others.length}</span>
        )}
        <span>Total Available: {assets.length}</span>
        {searchTerm && <span>Filtered: {filteredAssets.length}</span>}
      </div>
    </div>
  );
};

export default EnhancedCoinSelector;
