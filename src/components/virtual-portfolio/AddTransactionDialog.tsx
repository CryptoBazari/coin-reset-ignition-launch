import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { portfolioService } from '@/services/portfolioService';
import CoinSelector from './CoinSelector';
import { CoinMarketCapCoin } from '@/services/coinMarketCapService';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  onSuccess: () => void;
}

const AddTransactionDialog = ({ open, onOpenChange, portfolioId, onSuccess }: AddTransactionDialogProps) => {
  const [formData, setFormData] = useState({
    coinId: '',
    coinSymbol: '',
    coinName: '',
    transactionType: 'buy' as 'buy' | 'sell',
    category: 'Blue Chip' as 'Bitcoin' | 'Blue Chip' | 'Small-Cap',
    amount: '',
    price: '',
    fee: '',
    note: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCoinSelect = (coinId: string, coinData: CoinMarketCapCoin) => {
    setFormData(prev => ({
      ...prev,
      coinId,
      coinSymbol: coinData.symbol,
      coinName: coinData.name,
      price: coinData.current_price.toString()
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.coinId || !formData.amount || !formData.price) return;

    setIsLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      const price = parseFloat(formData.price);
      const fee = formData.fee ? parseFloat(formData.fee) : 0;
      const value = amount * price;

      // Create a virtual coin entry if it doesn't exist - without coinmarketcap_id
      await portfolioService.ensureVirtualCoin({
        symbol: formData.coinSymbol,
        name: formData.coinName
      });

      await portfolioService.addTransaction(portfolioId, {
        coin_symbol: formData.coinSymbol,
        transaction_type: formData.transactionType,
        category: formData.category,
        amount,
        price,
        value,
        fee,
        note: formData.note || null
      });

      setFormData({
        coinId: '',
        coinSymbol: '',
        coinName: '',
        transactionType: 'buy',
        category: 'Blue Chip',
        amount: '',
        price: '',
        fee: '',
        note: ''
      });
      onSuccess();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a buy or sell transaction for your virtual portfolio using live market data.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="coin">Cryptocurrency</Label>
            <CoinSelector
              value={formData.coinId}
              onValueChange={handleCoinSelect}
              placeholder="Select a cryptocurrency"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.transactionType} onValueChange={(value: 'buy' | 'sell') => setFormData(prev => ({ ...prev, transactionType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value: 'Bitcoin' | 'Blue Chip' | 'Small-Cap') => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                  <SelectItem value="Blue Chip">Blue Chip</SelectItem>
                  <SelectItem value="Small-Cap">Small-Cap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.001"
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="any"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="65000"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="fee">Fee ($) - Optional</Label>
            <Input
              id="fee"
              type="number"
              step="any"
              value={formData.fee}
              onChange={(e) => setFormData(prev => ({ ...prev, fee: e.target.value }))}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="note">Note - Optional</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          {formData.amount && formData.price && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Total Value: ${(parseFloat(formData.amount) * parseFloat(formData.price)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              {formData.coinSymbol && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.coinSymbol} - {formData.coinName}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.coinId || !formData.amount || !formData.price}>
              {isLoading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
