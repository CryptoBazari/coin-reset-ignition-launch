
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { fetchCoinListings, CoinMarketCapCoin } from '@/services/coinMarketCapService';

interface CoinSelectorProps {
  value: string;
  onValueChange: (coinId: string, coinData: CoinMarketCapCoin) => void;
  placeholder?: string;
}

const CoinSelector = ({ value, onValueChange, placeholder = "Select a cryptocurrency" }: CoinSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: coins, isLoading, error } = useQuery({
    queryKey: ['coinmarketcap-listings'],
    queryFn: () => fetchCoinListings(200),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  console.log('CoinSelector query state:', { isLoading, error, coinsLength: coins?.length });

  const filteredCoins = coins?.filter(coin => 
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
          <SelectValue placeholder="Loading cryptocurrencies..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (error || !coins || coins.length === 0) {
    console.error('CoinSelector error or no data:', error);
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Unable to load cryptocurrencies" />
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
        <SelectContent className="max-h-60 bg-white border border-gray-200 shadow-lg z-50">
          {filteredCoins.slice(0, 50).map(coin => (
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
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CoinSelector;
