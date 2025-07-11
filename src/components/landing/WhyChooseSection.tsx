import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Zap, Users, LogIn } from "lucide-react";

export const WhyChooseSection = () => {
  return (
    <div className="grid md:grid-cols-2 gap-12 mb-20">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-foreground">Why Choose CoinPlatform?</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Bank-Grade Security</h3>
              <p className="text-muted-foreground">Your data is encrypted and secured with industry-leading protocols.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Lightning Fast</h3>
              <p className="text-muted-foreground">Real-time analysis and portfolio updates with sub-second response times.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Expert Support</h3>
              <p className="text-muted-foreground">24/7 support from crypto investment professionals.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-primary/5 to-secondary/20 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-foreground mb-4">Ready to get started?</h3>
        <p className="text-muted-foreground mb-6">
          Join the community of smart crypto investors who use data-driven analysis to make better investment decisions.
        </p>
        <div className="space-y-4">
          <Link to="/auth">
            <Button size="lg" className="w-full">
              <LogIn className="h-5 w-5 mr-2" />
              Start Free Account
            </Button>
          </Link>
          <Link to="/learning">
            <Button variant="outline" size="lg" className="w-full">
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};