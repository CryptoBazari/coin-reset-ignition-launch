import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Portfolio {
  id: string;
  name: string;
  total_value: number;
  all_time_profit: number;
}

interface Analysis {
  id: string;
  coin_id: string;
  investment_amount: number;
  recommendation: string;
}

interface AdminStats {
  totalNews: number;
  totalCourses: number;
  totalCryptoListings: number;
  activeSubscriptions: number;
}

export const useDashboard = () => {
  const { user } = useAuth();
  const { hasActiveSubscription, verifyPendingPayments, loading: subscriptionLoading } = useSubscription();
  
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalNews: 0,
    totalCourses: 0,
    totalCryptoListings: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [verifyingPayments, setVerifyingPayments] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return localStorage.getItem('dashboard-mode') === 'admin';
  });

  useEffect(() => {
    if (user) {
      fetchUserData(user.id);
    }
  }, [user]);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch portfolios
      const { data: portfolioData } = await supabase
        .from('virtual_portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent analyses
      const { data: analysesData } = await supabase
        .from('investment_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setPortfolios(portfolioData || []);
      setRecentAnalyses(analysesData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async (isAdmin: boolean) => {
    if (!isAdmin) return;
    
    try {
      const [newsResult, coursesResult, cryptoResult, subscriptionsResult] = await Promise.all([
        supabase.from('news').select('*', { count: 'exact', head: true }),
        supabase.from('learning_courses').select('*', { count: 'exact', head: true }),
        supabase.from('crypto_listings').select('*', { count: 'exact', head: true }),
        supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      setAdminStats({
        totalNews: newsResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalCryptoListings: cryptoResult.count || 0,
        activeSubscriptions: subscriptionsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const handleVerifyPayments = async () => {
    setVerifyingPayments(true);
    try {
      const result = await verifyPendingPayments();
      if (result?.verified > 0) {
        toast({
          title: "Payments Verified",
          description: `Successfully verified ${result.verified} payment(s). Your subscription is now active!`,
        });
      } else {
        toast({
          title: "No Payments Found",
          description: "No pending payments were found to verify.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying payments:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify payments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifyingPayments(false);
    }
  };

  const handleModeToggle = (checked: boolean) => {
    setIsAdminMode(checked);
    localStorage.setItem('dashboard-mode', checked ? 'admin' : 'user');
  };

  return {
    user,
    portfolios,
    recentAnalyses,
    adminStats,
    loading,
    verifyingPayments,
    isAdminMode,
    hasActiveSubscription,
    subscriptionLoading,
    fetchAdminStats,
    handleVerifyPayments,
    handleModeToggle,
  };
};