import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  duration_months: number;
  price_btc: number | null;
  price_usdt: number | null;
  is_active: boolean;
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

export const useSubscription = () => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscriptionStatus();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null);
          if (session?.user) {
            await checkUserSubscription(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSubscription(null);
          setHasActiveSubscription(false);
        }
        setLoading(false);
      }
    );

    return () => authSubscription.unsubscribe();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // Fetch subscription plans
      await fetchSubscriptionPlans();

      // Check user subscription if logged in
      if (session?.user) {
        await checkUserSubscription(session.user);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('duration_months');

      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const checkUserSubscription = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user subscription:', error);
        return;
      }

      if (data) {
        setSubscription(data);
        setHasActiveSubscription(true);
      } else {
        setSubscription(null);
        setHasActiveSubscription(false);
      }
    } catch (error) {
      console.error('Error checking user subscription:', error);
      setSubscription(null);
      setHasActiveSubscription(false);
    }
  };

  const createSubscription = async (planId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (!plan) throw new Error('Subscription plan not found');

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration_months);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([{
          user_id: user.id,
          plan_id: planId,
          status: 'pending',
          starts_at: startDate.toISOString(),
          expires_at: endDate.toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  };

  const verifyPendingPayments = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('verify-crypto-payment-enhanced', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: {}, // Empty body triggers bulk verification for authenticated user
      });

      if (error) throw error;

      // Refresh subscription status after verification
      await checkUserSubscription(user);
      
      return data;
    } catch (error) {
      console.error('Error verifying payments:', error);
      throw error;
    }
  };

  const getSubscriptionTimeRemaining = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('get_subscription_time_remaining');
      
      if (error) throw error;
      
      return (data as any)?.result || null;
    } catch (error) {
      console.error('Error getting subscription time remaining:', error);
      throw error;
    }
  };

  return {
    user,
    subscription,
    subscriptionPlans,
    hasActiveSubscription,
    loading,
    checkSubscriptionStatus,
    createSubscription,
    verifyPendingPayments,
    getSubscriptionTimeRemaining,
  };
};