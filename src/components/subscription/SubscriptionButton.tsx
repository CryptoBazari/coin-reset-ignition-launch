import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionManager from '@/components/subscription/SubscriptionManager';
import { Lock } from 'lucide-react';

interface SubscriptionButtonProps {
  feature?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
}

const SubscriptionButton = ({ 
  feature = "premium feature", 
  size = "default",
  variant = "default",
  className = ""
}: SubscriptionButtonProps) => {
  const { hasActiveSubscription, user } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    setShowModal(true);
  };

  if (hasActiveSubscription) {
    return null; // Don't show button if user already has subscription
  }

  return (
    <>
      <Button
        onClick={handleClick}
        size={size}
        variant={variant}
        className={`flex items-center gap-2 ${className}`}
      >
        <Lock className="h-4 w-4" />
        {user ? `Upgrade to access ${feature}` : `Sign in to access ${feature}`}
      </Button>
      
      <SubscriptionManager 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
};

export default SubscriptionButton;