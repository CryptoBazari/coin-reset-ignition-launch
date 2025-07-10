import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { Check, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '@/components/payment/PaymentModal';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
  const { subscriptionPlans, user } = useSubscription();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSelectPlan = (plan: any) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setSelectedPlan(plan);
    setShowPaymentModal(true);
    onClose(); // Close subscription modal when opening payment modal
  };

  const features = [
    "Advanced Crypto Analysis Tools",
    "Virtual Portfolio Management",
    "Real-time Market Data",
    "Advanced Trading Indicators",
    "Portfolio Performance Analytics",
    "Priority Customer Support",
    "Educational Resources",
    "Market News & Insights"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Unlock Premium Features
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose a subscription plan to access all premium features
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Features Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">What you'll get:</h3>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plans Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Your Plan:</h3>
            
            {subscriptionPlans.map((plan) => {
              const isYearly = plan.duration_months === 12;
              const monthlyPrice = isYearly ? (plan.price_usdt || 0) / 12 : (plan.price_usdt || 0);
              const savings = isYearly ? Math.round(((25 * 12) - (plan.price_usdt || 0)) / (25 * 12) * 100) : 0;

              return (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isYearly ? 'border-primary shadow-sm' : ''
                  }`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          {isYearly && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              <Star className="h-3 w-3 mr-1" />
                              Most Popular
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                      {isYearly && savings > 0 && (
                        <Badge className="bg-green-100 text-green-800">
                          Save {savings}%
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">${plan.price_usdt}</span>
                        <span className="text-muted-foreground">
                          / {isYearly ? 'year' : 'month'}
                        </span>
                      </div>
                      {isYearly && (
                        <div className="text-sm text-muted-foreground">
                          ${monthlyPrice.toFixed(2)} per month
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        ≈ {plan.price_btc} BTC
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      variant={isYearly ? "default" : "outline"}
                    >
                      Select Plan
                      {isYearly && <Zap className="h-4 w-4 ml-2" />}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Secure crypto payments • Cancel anytime • 7-day money-back guarantee</p>
        </div>

        {/* Payment Modal */}
        {selectedPlan && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedPlan(null);
            }}
            planId={selectedPlan.id}
            planDetails={{
              name: selectedPlan.name,
              price_usdt: selectedPlan.price_usdt,
              price_btc: selectedPlan.price_btc,
              duration_months: selectedPlan.duration_months,
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;