import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Star, LogIn, ArrowRight } from "lucide-react";

export const HeroSection = () => {
  return (
    <div className="text-center mb-20 animate-fade-in">
      <div className="mb-6">
        <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
          <Star className="h-4 w-4 mr-2" />
          Trusted by 10,000+ crypto investors
        </span>
      </div>
      <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
        Master <span className="text-transparent bg-gradient-to-r from-primary to-primary/60 bg-clip-text">Cryptocurrency</span>
        <br />Investment Analysis
      </h1>
      <p className="text-xl text-muted-foreground mb-10 max-w-4xl mx-auto leading-relaxed">
        Make informed crypto investment decisions with our comprehensive analysis tools, 
        real-time market insights, and advanced virtual portfolio management system.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link to="/auth">
          <Button size="lg" className="text-lg px-10 py-4 hover:scale-105 transition-transform">
            <LogIn className="h-5 w-5 mr-2" />
            Start Free Today
          </Button>
        </Link>
        <Link to="/analysis">
          <Button variant="outline" size="lg" className="text-lg px-10 py-4 hover:scale-105 transition-transform">
            Try Demo <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        No credit card required • Free forever plan available
      </p>
    </div>
  );
};