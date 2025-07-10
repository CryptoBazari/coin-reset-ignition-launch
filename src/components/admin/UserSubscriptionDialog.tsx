import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Calendar, Clock, User, CreditCard, AlertCircle, Plus } from 'lucide-react';

interface UserSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}

interface SubscriptionDetail {
  id: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  plan: {
    name: string;
    duration_months: number;
    price_usdt: number;
    price_btc: number;
  };
}

interface PaymentDetail {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  verified_at: string | null;
  transaction_hash: string | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  duration_months: number;
  price_usdt: number | null;
  price_btc: number | null;
  is_active: boolean;
}

const UserSubscriptionDialog = ({ isOpen, onClose, userId, userEmail }: UserSubscriptionDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [extendDays, setExtendDays] = useState('30');
  const [subscriptions, setSubscriptions] = useState<SubscriptionDetail[]>([]);
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [customDuration, setCustomDuration] = useState<string>('');
  const { toast } = useToast();

  const fetchUserDetails = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_subscription_details', {
        target_user_id: userId
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'result' in data) {
        const result = data.result as any;
        setSubscriptions(result?.subscriptions || []);
        setPayments(result?.payments || []);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: "Error",
        description: "Failed to load user subscription details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (!userId || !extendDays) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('extend_user_subscription', {
        target_user_id: userId,
        additional_days: parseInt(extendDays)
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data && (data as any).success) {
        toast({
          title: "Success",
          description: `Subscription extended by ${extendDays} days`,
        });
        await fetchUserDetails();
      } else {
        throw new Error((data as any)?.error || 'Failed to extend subscription');
      }
    } catch (error) {
      console.error('Error extending subscription:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extend subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('cancel_user_subscription', {
        target_user_id: userId
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data && (data as any).success) {
        toast({
          title: "Success",
          description: "Subscription cancelled successfully",
        });
        await fetchUserDetails();
      } else {
        throw new Error((data as any)?.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const fetchAvailablePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('duration_months');

      if (error) throw error;
      setAvailablePlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleActivateSubscription = async () => {
    if (!userId || !selectedPlanId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('activate_user_subscription', {
        target_user_id: userId,
        plan_id: selectedPlanId,
        custom_duration_months: customDuration ? parseInt(customDuration) : null
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data && (data as any).success) {
        const result = data as any;
        toast({
          title: "Success",
          description: `Activated ${result.plan_name} subscription for ${result.duration_months} months`,
        });
        setSelectedPlanId('');
        setCustomDuration('');
        await fetchUserDetails();
      } else {
        throw new Error((data as any)?.error || 'Failed to activate subscription');
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load user details and plans when dialog opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
      fetchAvailablePlans();
    }
  }, [isOpen, userId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Manage User Subscription
          </DialogTitle>
          <DialogDescription>
            Manage subscription and payment details for {userEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Admin Actions</CardTitle>
              <CardDescription>
                Manage this user's subscription status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activate New Subscription */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Activate New Subscription
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="plan-select">Subscription Plan</Label>
                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} ({plan.duration_months}m - ${plan.price_usdt} USDT)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="custom-duration">Custom Duration (months)</Label>
                    <Input
                      id="custom-duration"
                      type="number"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      placeholder="Leave empty for plan default"
                      min="1"
                      max="60"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleActivateSubscription}
                      disabled={loading || !selectedPlanId}
                      className="w-full flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Activate
                    </Button>
                  </div>
                </div>
              </div>

              {/* Extend Existing Subscription */}
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="extend-days">Extend Subscription (Days)</Label>
                  <Input
                    id="extend-days"
                    type="number"
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    placeholder="30"
                    min="1"
                    max="365"
                  />
                </div>
                <Button 
                  onClick={handleExtendSubscription}
                  disabled={loading || !extendDays}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Extend
                </Button>
              </div>
              
              <Button 
                variant="destructive" 
                onClick={handleCancelSubscription}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Cancel Active Subscription
              </Button>
            </CardContent>
          </Card>

          {/* Subscription History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Subscription History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No subscriptions found
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{sub.plan.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {sub.plan.duration_months} month{sub.plan.duration_months > 1 ? 's' : ''} • 
                            ${sub.plan.price_usdt} USDT
                          </p>
                        </div>
                        {getStatusBadge(sub.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <br />
                          {format(new Date(sub.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                        {sub.expires_at && (
                          <div>
                            <span className="text-muted-foreground">Expires:</span>
                            <br />
                            {format(new Date(sub.expires_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : payments.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No payments found
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">${payment.amount}</h4>
                          {payment.transaction_hash && (
                            <p className="text-sm text-muted-foreground font-mono">
                              {payment.transaction_hash.slice(0, 12)}...
                            </p>
                          )}
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <br />
                          {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                        {payment.verified_at && (
                          <div>
                            <span className="text-muted-foreground">Verified:</span>
                            <br />
                            {format(new Date(payment.verified_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSubscriptionDialog;