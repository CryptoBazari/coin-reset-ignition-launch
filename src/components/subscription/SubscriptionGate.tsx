
import { ReactNode } from 'react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import SubscriptionModal from './SubscriptionModal';
import { Shield } from 'lucide-react';

interface SubscriptionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  showModal?: boolean;
  onClose?: () => void;
}

const SubscriptionGate = ({ 
  children, 
  fallback, 
  showModal = false, 
  onClose 
}: SubscriptionGateProps) => {
  const { hasAccess, hasActiveSubscription, isAdmin, loading, user, accessType } = useAdminAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
        <p className="text-muted-foreground">Please sign in to access this feature.</p>
      </div>
    );
  }

  if (!hasAccess) {
    if (showModal) {
      return <SubscriptionModal isOpen={true} onClose={onClose || (() => {})} onPlanSelect={() => {}} />;
    }
    
    return fallback || (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
        <p className="text-muted-foreground">This feature requires an active subscription.</p>
      </div>
    );
  }

  // Show admin indicator if accessed via admin privileges
  if (accessType === 'admin') {
    return (
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Shield className="h-3 w-3" />
            ADMIN ACCESS
          </div>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;
