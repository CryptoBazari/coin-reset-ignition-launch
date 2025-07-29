import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VirtualTransaction } from '@/types/virtualPortfolio';

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: VirtualTransaction | null;
  onSuccess: () => void;
}

const EditTransactionDialog = ({ open, onOpenChange, transaction, onSuccess }: EditTransactionDialogProps) => {
  const [formData, setFormData] = useState({
    type: 'buy' as 'buy' | 'sell',
    amount: '',
    price: '',
    fee: '',
    note: '',
    category: 'Bitcoin' as 'Bitcoin' | 'Blue Chip' | 'Small-Cap'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.transaction_type as 'buy' | 'sell',
        amount: transaction.amount.toString(),
        price: transaction.price.toString(),
        fee: transaction.fee.toString(),
        note: transaction.note || '',
        category: transaction.category as 'Bitcoin' | 'Blue Chip' | 'Small-Cap'
      });
    }
  }, [transaction]);

  const handleUpdateTransaction = async () => {
    if (!transaction) return;

    setIsLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      const price = parseFloat(formData.price);
      const fee = formData.fee ? parseFloat(formData.fee) : 0;
      const value = amount * price;

      const { error } = await supabase
        .from('virtual_transactions')
        .update({
          transaction_type: formData.type,
          amount,
          price,
          value,
          fee,
          note: formData.note || null,
          category: formData.category
        })
        .eq('id', transaction.id);

      if (error) throw error;

      toast({
        title: "Transaction Updated",
        description: "Transaction has been updated successfully.",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Coin Info (Read Only) */}
          <div>
            <Label className="block text-sm font-medium mb-1">Cryptocurrency</Label>
            <Input
              value={`${transaction.virtual_coins.symbol} - ${transaction.virtual_coins.name}`}
              disabled
              className="bg-muted"
            />
          </div>

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
            <Select value={formData.category} onValueChange={(value: 'Bitcoin' | 'Blue Chip' | 'Small-Cap') => setFormData({...formData, category: value})}>
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
          
          {/* Fee */}
          <div>
            <Label className="block text-sm font-medium mb-1">Fee ($)</Label>
            <Input
              type="number"
              value={formData.fee}
              onChange={(e) => setFormData({...formData, fee: e.target.value})}
              placeholder="0.00"
              step="any"
            />
          </div>
          
          {/* Note */}
          <div>
            <Label className="block text-sm font-medium mb-1">Note</Label>
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
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpdateTransaction}
            disabled={isLoading || !formData.amount || !formData.price}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? 'Updating...' : 'Update Transaction'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionDialog;