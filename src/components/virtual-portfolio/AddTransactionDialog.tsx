import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { portfolioService } from '@/services/portfolioService';
import { useAuth } from '@/hooks/useAuth';
import { fetchCoinListings, CoinMarketCapCoin } from '@/services/coinMarketCapService';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  onSuccess: () => void;
}

const AddTransactionDialog = ({ open, onOpenChange, portfolioId, onSuccess }: AddTransactionDialogProps) => {
  const [cryptoList, setCryptoList] = useState<CoinMarketCapCoin[]>([]);
  const [formData, setFormData] = useState({
    type: 'buy' as 'buy' | 'sell',
    coinId: '',
    coinSymbol: '',
    coinName: '',
    amount: '',
    price: '',
    fee: '',
    note: '',
    category: 'bitcoin' as 'bitcoin' | 'bluechip' | 'smallcap'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user, session } = useAuth();

  // Fetch cryptocurrencies when dialog opens
  useEffect(() => {
    if (open) {
      fetchCryptocurrencies();
    }
  }, [open]);

  const fetchCryptocurrencies = async () => {
    try {
      const coins = await fetchCoinListings(100);
      setCryptoList(coins);
    } catch (error) {
      console.error('Error fetching cryptocurrencies:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'buy',
      coinId: '',
      coinSymbol: '',
      coinName: '',
      amount: '',
      price: '',
      fee: '',
      note: '',
      category: 'bitcoin'
    });
  };

  const handleAddTransaction = async () => {
    if (!isAuthenticated || !session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add transactions.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.coinId || !formData.amount || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (coin, amount, price).",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('Starting transaction submission with data:', formData);

    try {
      const amount = parseFloat(formData.amount);
      const price = parseFloat(formData.price);
      const fee = formData.fee ? parseFloat(formData.fee) : 0;
      const value = amount * price;

      // Map category to proper format
      const categoryMap: Record<string, 'Bitcoin' | 'Blue Chip' | 'Small-Cap'> = {
        bitcoin: 'Bitcoin',
        bluechip: 'Blue Chip',
        smallcap: 'Small-Cap'
      };

      // Ensure the virtual coin exists first
      await portfolioService.ensureVirtualCoin({
        symbol: formData.coinSymbol,
        name: formData.coinName
      });

      // Add the transaction
      await portfolioService.addTransaction(portfolioId, {
        coin_symbol: formData.coinSymbol,
        transaction_type: formData.type,
        category: categoryMap[formData.category],
        amount,
        price,
        value,
        fee,
        note: formData.note || null
      });

      toast({
        title: "Success",
        description: "Transaction added successfully!",
      });
      
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding transaction:', error);
      
      let errorMessage = 'Failed to add transaction';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoinSelect = (coinId: string) => {
    const crypto = cryptoList.find(c => c.id.toString() === coinId);
    if (crypto) {
      setFormData(prev => ({
        ...prev,
        coinId,
        coinSymbol: crypto.symbol,
        coinName: crypto.name,
        price: crypto.current_price.toString()
      }));
    }
  };

  // Show authentication warning if not logged in
  if (open && !isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              You must be logged in to add transactions to your portfolio.
            </p>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Transaction Type Toggle */}
          <div>
            <Label className="block text-sm font-medium mb-1">Type</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={formData.type === 'buy' ? 'default' : 'outline'}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  formData.type === 'buy' 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setFormData({...formData, type: 'buy'})}
              >
                Buy
              </Button>
              <Button
                type="button"
                variant={formData.type === 'sell' ? 'default' : 'outline'}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  formData.type === 'sell' 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setFormData({...formData, type: 'sell'})}
              >
                Sell
              </Button>
            </div>
          </div>
          
          {/* Cryptocurrency Selection */}
          <div>
            <Label className="block text-sm font-medium mb-1">Cryptocurrency</Label>
            <Select value={formData.coinId} onValueChange={handleCoinSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select cryptocurrency" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {cryptoList.map(crypto => (
                  <SelectItem key={crypto.id} value={crypto.id.toString()}>
                    <div className="flex items-center gap-2">
                      {crypto.logo && (
                        <img 
                          src={crypto.logo} 
                          alt={crypto.name} 
                          className="h-4 w-4 rounded-full" 
                        />
                      )}
                      {crypto.name} ({crypto.symbol})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Amount and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium mb-1">Amount</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
                step="any"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">Price per unit ($)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
                step="any"
              />
            </div>
          </div>
          
          {/* Category Selection */}
          <div>
            <Label className="block text-sm font-medium mb-1">Category</Label>
            <Select value={formData.category} onValueChange={(value: 'bitcoin' | 'bluechip' | 'smallcap') => setFormData({...formData, category: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bitcoin">Bitcoin</SelectItem>
                <SelectItem value="bluechip">Blue Chip</SelectItem>
                <SelectItem value="smallcap">Small Cap</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Fee (Optional) */}
          <div>
            <Label className="block text-sm font-medium mb-1">
              Fee ($) <span className="text-muted-foreground">- Optional</span>
            </Label>
            <Input
              type="number"
              value={formData.fee}
              onChange={(e) => setFormData({...formData, fee: e.target.value})}
              placeholder="0.00"
              step="any"
            />
          </div>
          
          {/* Note (Optional) */}
          <div>
            <Label className="block text-sm font-medium mb-1">
              Note <span className="text-muted-foreground">- Optional</span>
            </Label>
            <Textarea
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              rows={2}
              placeholder="Any additional notes..."
            />
          </div>

          {/* Transaction Preview */}
          {formData.amount && formData.price && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Total Value: ${(parseFloat(formData.amount) * parseFloat(formData.price)).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
              {formData.coinSymbol && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.coinSymbol} - {formData.coinName} (Category: {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)})
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAddTransaction}
            disabled={isLoading || !formData.coinId || !formData.amount || !formData.price}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? 'Adding...' : 'Add Transaction'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;