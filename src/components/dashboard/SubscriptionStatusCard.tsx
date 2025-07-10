import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface SubscriptionInfo {
  has_subscription: boolean;
  expires_at?: string;
  days_remaining?: number;
  hours_remaining?: number;
  status?: string;
  plan_name?: string;
  expired?: boolean;
  expired_at?: string;
}

const SubscriptionStatusCard = () => {
  const { hasActiveSubscription, subscription, checkSubscriptionStatus } = useSubscription();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSubscriptionDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_subscription_time_remaining');
      
      if (error) throw error;
      
      if (data && typeof data === 'object' && 'result' in data) {
        setSubscriptionInfo((data as any).result);
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      checkSubscriptionStatus(),
      fetchSubscriptionDetails()
    ]);
    
    toast({
      title: "Refreshed",
      description: "Subscription status updated",
    });
  };

  useEffect(() => {
    fetchSubscriptionDetails();
  }, [hasActiveSubscription]);

  if (!hasActiveSubscription && !subscriptionInfo?.expired) {
    return null;
  }

  const daysRemaining = subscriptionInfo?.days_remaining || 0;
  const hoursRemaining = subscriptionInfo?.hours_remaining || 0;
  const totalDays = 30; // Assuming 30 days for progress calculation
  const progressPercentage = Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));
  
  const getStatusColor = () => {
    if (subscriptionInfo?.expired) return 'bg-red-100 text-red-800';
    if (daysRemaining <= 3) return 'bg-red-100 text-red-800';
    if (daysRemaining <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getProgressColor = () => {
    if (daysRemaining <= 3) return 'bg-red-500';
    if (daysRemaining <= 7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Subscription Status</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          {subscriptionInfo?.plan_name && `${subscriptionInfo.plan_name} Plan`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {subscriptionInfo?.expired ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Subscription Expired</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your subscription expired on {format(new Date(subscriptionInfo.expired_at!), 'MMM dd, yyyy')}
            </p>
            <Badge className="bg-red-100 text-red-800">
              Expired
            </Badge>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor()}>
                {subscriptionInfo?.status?.charAt(0).toUpperCase()}{subscriptionInfo?.status?.slice(1)}
              </Badge>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {daysRemaining > 0 ? `${Math.floor(daysRemaining)} days` : `${Math.floor(hoursRemaining)} hours`} remaining
                </div>
                <div className="text-xs text-muted-foreground">
                  {subscriptionInfo?.expires_at && formatDistanceToNow(new Date(subscriptionInfo.expires_at), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Time Remaining</span>
                <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Expiration Details */}
            {subscriptionInfo?.expires_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Expires on {format(new Date(subscriptionInfo.expires_at), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
            )}

            {/* Warning for expiring soon */}
            {daysRemaining <= 7 && daysRemaining > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div className="text-sm">
                  <span className="font-medium text-yellow-800">Subscription expiring soon!</span>
                  <p className="text-yellow-700">
                    Your subscription will expire in {Math.floor(daysRemaining)} days. 
                    Consider renewing to continue accessing premium features.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusCard;