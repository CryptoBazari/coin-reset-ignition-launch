
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';

export const useAdminAccess = () => {
  const { hasActiveSubscription, loading: subscriptionLoading, ...subscriptionData } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const hasAccess = hasActiveSubscription || isAdmin;
  const loading = subscriptionLoading || adminLoading;
  const accessType = isAdmin ? 'admin' : hasActiveSubscription ? 'subscription' : 'none';

  return {
    hasAccess,
    hasActiveSubscription,
    isAdmin,
    loading,
    accessType,
    ...subscriptionData
  };
};
