import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  planId: string;
  planDetails: {
    name: string;
    price_usdt: number | null;
    price_btc: number | null;
    duration_months: number;
  };
  onPaymentSubmit: (paymentId: string) => void;
}

interface PaymentAddress {
  id: string;
  network: string;
  token: string;
  address: string;
}

const PaymentModal = ({ isOpen, onClose, onBack, planId, planDetails, onPaymentSubmit }: PaymentModalProps) => {
  const [currentStep, setCurrentStep] = useState<'select' | 'pay' | 'verify'>('select');
  const [selectedPayment, setSelectedPayment] = useState<PaymentAddress | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [paymentAddresses, setPaymentAddresses] = useState<PaymentAddress[]>([]);
  const { createSubscription, user } = useSubscription();
  const { toast } = useToast();

  const fetchPaymentAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_addresses')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPaymentAddresses(data || []);
    } catch (error) {
      console.error('Error fetching payment addresses:', error);
    }
  };

  const handlePaymentSelect = async (address: PaymentAddress) => {
    if (!user) return;

    try {
      // Create subscription record
      await createSubscription(planId);
      setSelectedPayment(address);
      setCurrentStep('pay');
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const handleVerifyTransaction = async () => {
    if (!transactionHash || !selectedPayment) return;

    setVerifying(true);
    try {
      // Create payment record
      const { data, error } = await supabase
        .from('crypto_payments')
        .insert([{
          user_id: user!.id,
          payment_address_id: selectedPayment.id,
          transaction_hash: transactionHash,
          amount: selectedPayment.token === 'btc' ? planDetails.price_btc : planDetails.price_usdt,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Transaction Submitted",
        description: "Redirecting to payment status...",
      });

      // Pass the payment ID to the parent to show status modal
      onPaymentSubmit(data.id);
    } catch (error) {
      console.error('Error submitting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to submit transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const getPaymentOptions = () => {
    return paymentAddresses.map(addr => {
      const price = addr.token === 'btc' ? planDetails.price_btc : planDetails.price_usdt;
      const symbol = addr.token === 'btc' ? 'BTC' : 'USDT';
      const networkName = addr.network === 'arbitrum' ? 'Arbitrum' : 
                          addr.network === 'ethereum' ? 'Ethereum' : 'Bitcoin';
      
      return {
        ...addr,
        price,
        symbol,
        networkName,
        displayName: `${symbol} (${networkName})`
      };
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchPaymentAddresses();
    }
  }, [isOpen]);

  const resetModal = () => {
    setCurrentStep('select');
    setSelectedPayment(null);
    setTransactionHash('');
    setVerifying(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'select' && 'Choose Payment Method'}
            {currentStep === 'pay' && 'Send Payment'}
            {currentStep === 'verify' && 'Payment Submitted'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'select' && 'Select your preferred cryptocurrency payment method'}
            {currentStep === 'pay' && 'Send the exact amount to the address below'}
            {currentStep === 'verify' && 'Your payment is being processed'}
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'select' && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <h3 className="font-semibold">{planDetails.name}</h3>
              <p className="text-sm text-muted-foreground">
                {planDetails.duration_months} month{planDetails.duration_months > 1 ? 's' : ''} subscription
              </p>
            </div>

            <div className="grid gap-3">
              {getPaymentOptions().map((option) => (
                <Card 
                  key={option.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handlePaymentSelect(option)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{option.displayName}</CardTitle>
                      <Badge variant="outline">{option.networkName}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {option.price} {option.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Click to proceed with {option.symbol} payment
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'pay' && selectedPayment && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep('select')}>
                <ArrowLeft className="h-4 w-4" />
                Back to Payment Options
              </Button>
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
                Back to Plans
              </Button>
            </div>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800">Payment Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Send exactly this amount:</Label>
                  <div className="text-2xl font-bold text-orange-800">
                    {selectedPayment.token === 'btc' ? planDetails.price_btc : planDetails.price_usdt}{' '}
                    {selectedPayment.token === 'btc' ? 'BTC' : 'USDT'}
                  </div>
                </div>

                <div>
                  <Label>To this address:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-white rounded border text-sm break-all">
                      {selectedPayment.address}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(selectedPayment.address)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Network:</Label>
                  <div className="font-medium">
                    {selectedPayment.network === 'arbitrum' ? 'Arbitrum' : 
                     selectedPayment.network === 'ethereum' ? 'Ethereum' : 'Bitcoin'}
                  </div>
                </div>

                <div className="text-sm text-orange-700 bg-orange-100 p-3 rounded">
                  ⚠️ Make sure to send the exact amount to the exact address on the correct network. 
                  Incorrect payments cannot be refunded.
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <Label htmlFor="txHash">Transaction Hash</Label>
                <Input
                  id="txHash"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  placeholder="Enter your transaction hash after sending payment"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleVerifyTransaction}
                disabled={!transactionHash || verifying}
              >
                {verifying ? "Submitting..." : "Verify Payment"}
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;