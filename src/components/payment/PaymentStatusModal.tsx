import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  paymentId: string;
}

interface PaymentRecord {
  id: string;
  transaction_hash: string | null;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  created_at: string;
  verified_at: string | null;
  payment_addresses: {
    network: string;
    token: string;
    address: string;
  };
}

const PaymentStatusModal = ({ isOpen, onClose, onBack, paymentId }: PaymentStatusModalProps) => {
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const { checkSubscriptionStatus } = useSubscription();
  const { toast } = useToast();

  const fetchPaymentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_payments')
        .select(`
          *,
          payment_addresses!inner(network, token, address)
        `)
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      setPayment(data);
    } catch (error) {
      console.error('Error fetching payment status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!payment) return;

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-crypto-payment-enhanced', {
        body: {
          payment_id: paymentId,
          transaction_hash: payment.transaction_hash,
        },
      });

      if (error) throw error;

      if (data.verified) {
        toast({
          title: "Payment Verified!",
          description: "Your subscription has been activated",
        });
        await checkSubscriptionStatus();
        await fetchPaymentStatus();
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Payment could not be verified",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Verification Error",
        description: "Failed to verify payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleManualVerification = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-crypto-payment-enhanced', {
        body: {}, // Empty body triggers bulk verification
      });

      if (error) throw error;

      if (data.verified > 0) {
        toast({
          title: "Payment Verified!",
          description: `${data.verified} payment(s) verified and subscription activated`,
        });
        await checkSubscriptionStatus();
        await fetchPaymentStatus();
      } else {
        toast({
          title: "No Payments Found",
          description: "No pending payments found to verify",
        });
      }
    } catch (error) {
      console.error('Error with manual verification:', error);
      toast({
        title: "Verification Error",
        description: "Failed to verify payments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPaymentStatus();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchPaymentStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, paymentId]);

  const getStatusIcon = () => {
    if (!payment) return <Clock className="h-8 w-8 text-gray-400" />;
    
    switch (payment.status) {
      case 'confirmed':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-8 w-8 text-red-600" />;
      case 'expired':
        return <AlertCircle className="h-8 w-8 text-orange-600" />;
      default:
        return <Clock className="h-8 w-8 text-blue-600" />;
    }
  };

  const getStatusText = () => {
    if (!payment) return "Loading...";
    
    switch (payment.status) {
      case 'confirmed':
        return "Payment Confirmed";
      case 'failed':
        return "Payment Failed";
      case 'expired':
        return "Payment Expired";
      default:
        return "Payment Pending";
    }
  };

  const getStatusDescription = () => {
    if (!payment) return "Fetching payment details...";
    
    switch (payment.status) {
      case 'confirmed':
        return "Your payment has been verified and your subscription is now active!";
      case 'failed':
        return "Your payment could not be verified. Please contact support or try again.";
      case 'expired':
        return "This payment has expired. Please create a new payment.";
      default:
        return "Your payment is being processed. This usually takes 5-15 minutes.";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment Status</DialogTitle>
          <DialogDescription>
            Track your payment verification progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-muted-foreground">Loading payment details...</p>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {getStatusIcon()}
                    <div>
                      <CardTitle>{getStatusText()}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getStatusDescription()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                {payment && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Amount</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.amount} {payment.payment_addresses.token.toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Network</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.payment_addresses.network === 'arbitrum' ? 'Arbitrum' : 
                           payment.payment_addresses.network === 'ethereum' ? 'Ethereum' : 'Bitcoin'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <Badge variant={payment.status === 'confirmed' ? 'default' : 
                                      payment.status === 'failed' ? 'destructive' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {payment.transaction_hash && (
                      <div>
                        <p className="text-sm font-medium mb-2">Transaction Hash</p>
                        <code className="text-xs bg-muted p-2 rounded block break-all">
                          {payment.transaction_hash}
                        </code>
                      </div>
                    )}

                    {payment.verified_at && (
                      <div>
                        <p className="text-sm font-medium">Verified At</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.verified_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              <div className="flex gap-3">
                {payment?.status === 'pending' && (
                  <>
                    <Button 
                      onClick={handleVerifyPayment}
                      disabled={verifying || !payment?.transaction_hash}
                      className="flex-1"
                    >
                      {verifying ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify Payment"
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleManualVerification}
                      disabled={verifying}
                    >
                      {verifying ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        "Manual Check"
                      )}
                    </Button>
                  </>
                )}
                
                <Button 
                  variant="outline"
                  onClick={fetchPaymentStatus}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {payment?.status === 'confirmed' && (
                <Button onClick={onClose} className="w-full">
                  Continue to Dashboard
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentStatusModal;