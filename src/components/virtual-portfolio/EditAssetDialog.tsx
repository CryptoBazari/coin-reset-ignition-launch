import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VirtualAsset } from '@/types/virtualPortfolio';

interface EditAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: VirtualAsset | null;
  onSuccess: () => void;
}

const EditAssetDialog = ({ open, onOpenChange, asset, onSuccess }: EditAssetDialogProps) => {
  const [formData, setFormData] = useState({
    total_amount: '',
    average_price: '',
    category: 'Bitcoin' as 'Bitcoin' | 'Blue Chip' | 'Small-Cap'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (asset) {
      setFormData({
        total_amount: asset.total_amount.toString(),
        average_price: asset.average_price.toString(),
        category: asset.category as 'Bitcoin' | 'Blue Chip' | 'Small-Cap'
      });
    }
  }, [asset]);

  const handleUpdateAsset = async () => {
    if (!asset) return;

    setIsLoading(true);
    try {
      const totalAmount = parseFloat(formData.total_amount);
      const averagePrice = parseFloat(formData.average_price);
      const costBasis = totalAmount * averagePrice;

      const { error } = await supabase
        .from('virtual_assets')
        .update({
          total_amount: totalAmount,
          average_price: averagePrice,
          cost_basis: costBasis,
          category: formData.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', asset.id);

      if (error) throw error;

      toast({
        title: "Asset Updated",
        description: "Asset has been updated successfully.",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating asset:', error);
      toast({
        title: "Error",
        description: "Failed to update asset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!asset) return null;

  const currentCostBasis = parseFloat(formData.total_amount || '0') * parseFloat(formData.average_price || '0');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Coin Info (Read Only) */}
          <div>
            <Label className="block text-sm font-medium mb-1">Cryptocurrency</Label>
            <Input
              value={`${asset.virtual_coins.symbol} - ${asset.virtual_coins.name}`}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Total Amount */}
          <div>
            <Label className="block text-sm font-medium mb-1">Total Amount</Label>
            <Input
              type="number"
              value={formData.total_amount}
              onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
              placeholder="0.00"
              step="any"
            />
          </div>

          {/* Average Price */}
          <div>
            <Label className="block text-sm font-medium mb-1">Average Price ($)</Label>
            <Input
              type="number"
              value={formData.average_price}
              onChange={(e) => setFormData({...formData, average_price: e.target.value})}
              placeholder="0.00"
              step="any"
            />
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

          {/* Cost Basis Preview */}
          {formData.total_amount && formData.average_price && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Current Cost Basis: ${currentCostBasis.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.total_amount} × ${formData.average_price}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Editing assets directly will not update transaction history. 
              This action will recalculate the cost basis based on the new values.
            </p>
          </div>
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
            onClick={handleUpdateAsset}
            disabled={isLoading || !formData.total_amount || !formData.average_price}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? 'Updating...' : 'Update Asset'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAssetDialog;