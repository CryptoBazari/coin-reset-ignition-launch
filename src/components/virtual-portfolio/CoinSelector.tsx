
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { fetchCoinListings, CoinMarketCapCoin } from '@/services/coinMarketCapService';
import { useToast } from '@/hooks/use-toast';

interface CoinSelectorProps {
  value: string;
  onValueChange: (coinId: string, coinData: CoinMarketCapCoin) => void;
  placeholder?: string;
}

const CoinSelector = ({ value, onValueChange, placeholder = "Select a cryptocurrency" }: CoinSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Determine how many coins to fetch based on search term
  const shouldFetchMore = searchTerm.length >= 2;
  const fetchLimit = shouldFetchMore ? 200 : 30;

  const { data: coins, isLoading, error } = useQuery({
    queryKey: ['coinmarketcap-listings', fetchLimit],
    queryFn: () => fetchCoinListings(fetchLimit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Show error toast when API fails
  useEffect(() => {
    if (error) {
      console.error('CoinMarketCap API Error:', error);
      toast({
        title: "API Error",
        description: "Failed to load cryptocurrency data. Please check your CoinMarketCap API key configuration.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  console.log('CoinSelector query state:', { isLoading, error, coinsLength: coins?.length, fetchLimit, searchTerm });

  // Filter coins based on search term
  const filteredCoins = useMemo(() => {
    if (!coins) return [];
    
    if (!searchTerm) {
      return coins.slice(0, 30); // Show only top 30 when no search
    }
    
    return coins.filter(coin => 
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [coins, searchTerm]);

  const handleValueChange = (coinId: string) => {
    console.log('Coin selected:', coinId);
    const selectedCoin = coins?.find(coin => coin.id.toString() === coinId);
    if (selectedCoin) {
      console.log('Selected coin data:', selectedCoin);
      onValueChange(coinId, selectedCoin);
    }
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={`Loading ${searchTerm ? 'search results' : 'top cryptocurrencies'}...`} />
        </SelectTrigger>
      </Select>
    );
  }

  if (error || !coins || coins.length === 0) {
    console.error('CoinSelector error or no data:', error);
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Unable to load cryptocurrencies - Check API configuration" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search cryptocurrency... (type 2+ chars for full search)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-60 bg-white border border-gray-200 shadow-lg z-50">
          {filteredCoins.length === 0 ? (
            <div className="p-2 text-center text-gray-500">
              {searchTerm ? 'No cryptocurrencies found' : 'No data available'}
            </div>
          ) : (
            filteredCoins.map(coin => (
              <SelectItem key={coin.id} value={coin.id.toString()}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={coin.logo} alt={coin.symbol} />
                      <AvatarFallback className="text-xs bg-gray-200">
                        {coin.symbol.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{coin.symbol} - {coin.name}</span>
                  </div>
                  <span className="text-sm text-gray-500 ml-2">
                    ${coin.current_price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: coin.current_price < 1 ? 6 : 2
                    })}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
          {!searchTerm && filteredCoins.length === 30 && (
            <div className="p-2 text-center text-xs text-gray-400 border-t">
              Showing top 30 coins. Type to search all cryptocurrencies.
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CoinSelector;
