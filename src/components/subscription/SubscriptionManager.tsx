import { useState } from 'react';
import SubscriptionModal from './SubscriptionModal';
import PaymentModal from '../payment/PaymentModal';
import PaymentStatusModal from '../payment/PaymentStatusModal';

interface SubscriptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  duration_months: number;
  price_btc: number | null;
  price_usdt: number | null;
  is_active: boolean;
}

const SubscriptionManager = ({ isOpen, onClose }: SubscriptionManagerProps) => {
  const [currentModal, setCurrentModal] = useState<'subscription' | 'payment' | 'status'>('subscription');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setCurrentModal('payment');
  };

  const handlePaymentSubmit = (paymentId: string) => {
    setPaymentId(paymentId);
    setCurrentModal('status');
  };

  const handleClose = () => {
    setCurrentModal('subscription');
    setSelectedPlan(null);
    setPaymentId(null);
    onClose();
  };

  const handleBackToSubscription = () => {
    setCurrentModal('subscription');
    setSelectedPlan(null);
  };

  const handleBackToPayment = () => {
    setCurrentModal('payment');
    setPaymentId(null);
  };

  return (
    <>
      <SubscriptionModal
        isOpen={isOpen && currentModal === 'subscription'}
        onClose={handleClose}
        onPlanSelect={handlePlanSelect}
      />
      
      {selectedPlan && (
        <PaymentModal
          isOpen={currentModal === 'payment'}
          onClose={handleClose}
          onBack={handleBackToSubscription}
          planId={selectedPlan.id}
          planDetails={{
            name: selectedPlan.name,
            price_usdt: selectedPlan.price_usdt,
            price_btc: selectedPlan.price_btc,
            duration_months: selectedPlan.duration_months,
          }}
          onPaymentSubmit={handlePaymentSubmit}
        />
      )}
      
      {paymentId && (
        <PaymentStatusModal
          isOpen={currentModal === 'status'}
          onClose={handleClose}
          onBack={handleBackToPayment}
          paymentId={paymentId}
        />
      )}
    </>
  );
};

export default SubscriptionManager;