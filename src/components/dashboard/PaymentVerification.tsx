import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface PaymentVerificationProps {
  hasActiveSubscription: boolean;
  verifyingPayments: boolean;
  onVerifyPayments: () => void;
}

const PaymentVerification = ({ 
  hasActiveSubscription, 
  verifyingPayments, 
  onVerifyPayments 
}: PaymentVerificationProps) => {
  if (hasActiveSubscription) return null;

  return (
    <Card className="mt-8 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Verify Payments
        </CardTitle>
        <CardDescription>
          If you've made a crypto payment, click here to verify and activate your subscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={onVerifyPayments} 
          disabled={verifyingPayments}
          className="w-full"
        >
          {verifyingPayments ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Verifying Payments...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Verify Payments
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentVerification;