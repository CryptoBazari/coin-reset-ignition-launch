
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Shield } from "lucide-react";

interface PremiumFeaturesProps {
  isAdminMode: boolean;
  hasActiveSubscription: boolean;
}

const PremiumFeatures = ({ isAdminMode, hasActiveSubscription }: PremiumFeaturesProps) => {
  // Don't show premium features if user has access (subscription or admin) or is in admin mode
  if (isAdminMode || hasActiveSubscription) return null;

  return (
    <Card className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Premium Features
        </CardTitle>
        <CardDescription>
          Unlock advanced analytics and unlimited portfolios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Advanced portfolio analytics</li>
              <li>• Unlimited virtual portfolios</li>
              <li>• Real-time market alerts</li>
              <li>• Priority customer support</li>
            </ul>
          </div>
          <Button className="ml-4">
            Upgrade Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumFeatures;
