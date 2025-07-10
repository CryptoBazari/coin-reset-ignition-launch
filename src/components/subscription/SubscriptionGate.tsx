import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionModal from './SubscriptionModal';

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
  const { hasActiveSubscription, loading, user } = useSubscription();

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

  if (!hasActiveSubscription) {
    if (showModal) {
      return <SubscriptionModal isOpen={true} onClose={onClose || (() => {})} />;
    }
    
    return fallback || (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
        <p className="text-muted-foreground">This feature requires an active subscription.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;