import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { format } from 'date-fns';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  duration_months: number;
  price_btc: number | null;
  price_usdt: number | null;
  is_active: boolean;
  created_at: string;
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const SubscriptionManagement = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([fetchPlans(), fetchSubscriptions()]);
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('duration_months');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load user subscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      
      fetchPlans();
    } catch (error) {
      console.error('Error updating plan status:', error);
      toast({
        title: "Error",
        description: "Failed to update plan status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`text-xs px-2 py-1 rounded ${statusColors[status as keyof typeof statusColors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStats = () => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
    const pendingSubscriptions = subscriptions.filter(sub => sub.status === 'pending').length;
    const totalRevenue = subscriptions
      .filter(sub => sub.status === 'active')
      .length * 25; // Assuming average price for calculation

    return { activeSubscriptions, pendingSubscriptions, totalRevenue };
  };

  const { activeSubscriptions, pendingSubscriptions, totalRevenue } = getStats();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading subscriptions...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Subscription Management</h1>
            <p className="text-muted-foreground">Manage subscription plans and user subscriptions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Currently paying users</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment confirmation</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue}</div>
              <p className="text-xs text-muted-foreground">Based on active subscriptions</p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Plans */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Subscription Plans</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {plan.is_active ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                    >
                      {plan.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>USDT Price:</span>
                      <span>${plan.price_usdt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>BTC Price:</span>
                      <span>{plan.price_btc} BTC</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Subscriptions</h2>
          <div className="space-y-3">
            {subscriptions.slice(0, 10).map((subscription) => (
              <Card key={subscription.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="font-medium">User ID: {subscription.user_id.slice(0, 8)}...</div>
                      <div className="text-sm text-muted-foreground">
                        Created: {format(new Date(subscription.created_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                      {subscription.expires_at && (
                        <div className="text-sm text-muted-foreground">
                          Expires: {format(new Date(subscription.expires_at), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {getStatusBadge(subscription.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SubscriptionManagement;