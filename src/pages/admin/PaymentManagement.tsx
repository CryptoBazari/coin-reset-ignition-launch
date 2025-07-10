import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { format } from 'date-fns';

interface CryptoPayment {
  id: string;
  user_id: string;
  transaction_hash: string | null;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  verified_at: string | null;
  created_at: string;
  payment_addresses: {
    network: string;
    token: string;
    address: string;
  };
  user_subscriptions?: {
    plan_id: string;
    status: string;
  };
}

const PaymentManagement = () => {
  const [payments, setPayments] = useState<CryptoPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_payments')
        .select(`
          *,
          payment_addresses!inner(network, token, address),
          user_subscriptions(plan_id, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to load payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runPaymentMonitoring = async () => {
    setMonitoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('monitor-crypto-payments');

      if (error) throw error;

      toast({
        title: "Monitoring Complete",
        description: `Processed ${data.processed} payments. Verified: ${data.verified}`,
      });

      // Refresh the payments list
      fetchPayments();
    } catch (error) {
      console.error('Error running payment monitoring:', error);
      toast({
        title: "Error",
        description: "Failed to run payment monitoring",
        variant: "destructive",
      });
    } finally {
      setMonitoring(false);
    }
  };

  const verifySpecificPayment = async (paymentId: string, transactionHash: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-crypto-payment', {
        body: {
          payment_id: paymentId,
          transaction_hash: transactionHash
        }
      });

      if (error) throw error;

      if (data.verified) {
        toast({
          title: "Payment Verified",
          description: "Payment verified and subscription activated",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Could not verify payment",
          variant: "destructive",
        });
      }

      fetchPayments();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors]} border-0`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getExplorerUrl = (network: string, txHash: string) => {
    switch (network) {
      case 'ethereum':
        return `https://etherscan.io/tx/${txHash}`;
      case 'arbitrum':
        return `https://arbiscan.io/tx/${txHash}`;
      case 'bitcoin':
        return `https://blockstream.info/tx/${txHash}`;
      default:
        return null;
    }
  };

  const getStats = () => {
    const totalPayments = payments.length;
    const confirmedPayments = payments.filter(p => p.status === 'confirmed').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const totalAmount = payments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalPayments, confirmedPayments, pendingPayments, totalAmount };
  };

  const { totalPayments, confirmedPayments, pendingPayments, totalAmount } = getStats();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading payments...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Payment Management</h1>
            <p className="text-muted-foreground">Monitor and verify crypto payments</p>
          </div>
          <Button onClick={runPaymentMonitoring} disabled={monitoring} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${monitoring ? 'animate-spin' : ''}`} />
            {monitoring ? 'Monitoring...' : 'Run Monitoring'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPayments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedPayments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalAmount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Payments</h2>
          
          {payments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No payments found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(payment.status)}
                          <span className="font-medium">
                            {payment.amount} {payment.payment_addresses.token.toUpperCase()}
                          </span>
                          {getStatusBadge(payment.status)}
                          <Badge variant="outline">
                            {payment.payment_addresses.network}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>User ID: {payment.user_id.slice(0, 8)}...</div>
                          <div>Created: {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}</div>
                          {payment.verified_at && (
                            <div>Verified: {format(new Date(payment.verified_at), 'MMM dd, yyyy HH:mm')}</div>
                          )}
                          <div>Address: <code className="text-xs">{payment.payment_addresses.address}</code></div>
                        </div>

                        {payment.transaction_hash && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">TX Hash:</span>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {payment.transaction_hash.slice(0, 20)}...
                            </code>
                            {getExplorerUrl(payment.payment_addresses.network, payment.transaction_hash) && (
                              <Button size="sm" variant="ghost" asChild>
                                <a 
                                  href={getExplorerUrl(payment.payment_addresses.network, payment.transaction_hash)!} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {payment.status === 'pending' && payment.transaction_hash && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => verifySpecificPayment(payment.id, payment.transaction_hash!)}
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PaymentManagement;