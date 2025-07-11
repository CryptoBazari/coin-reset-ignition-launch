import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Star, LogIn, ArrowRight, TrendingUp } from "lucide-react";

export const HeroSection = () => {
  return (
    <div className="text-center mb-20 animate-fade-in relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-32 h-32 bg-primary/5 rounded-full animate-pulse" />
        <div className="absolute top-40 right-1/4 w-24 h-24 bg-secondary/10 rounded-full animate-pulse delay-300" />
        <div className="absolute bottom-20 left-1/3 w-16 h-16 bg-accent/10 rounded-full animate-pulse delay-700" />
      </div>
      
      <div className="mb-6">
        <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-bounce">
          <Star className="h-4 w-4 mr-2 animate-spin" style={{ animationDuration: '3s' }} />
          Trusted by 10,000+ crypto investors
        </span>
      </div>
      
      <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
        Master <span className="text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text animate-pulse">Cryptocurrency</span>
        <br />
        <span className="relative">
          Investment Analysis
          <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-full animate-pulse delay-500" />
        </span>
      </h1>
      
      <p className="text-xl text-muted-foreground mb-10 max-w-4xl mx-auto leading-relaxed animate-fade-in delay-300">
        Make informed crypto investment decisions with our comprehensive analysis tools, 
        real-time market insights, and advanced virtual portfolio management system.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in delay-500">
        <Link to="/auth">
          <Button size="lg" className="text-lg px-10 py-4 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
            <LogIn className="h-5 w-5 mr-2" />
            Start Free Today
          </Button>
        </Link>
        <Link to="/analysis">
          <Button variant="outline" size="lg" className="text-lg px-10 py-4 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
            Try Demo <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </div>
      
      <p className="text-sm text-muted-foreground mt-4 animate-fade-in delay-700">
        No credit card required • Free forever plan available
      </p>
      
      {/* Floating animated elements */}
      <div className="absolute top-1/2 left-8 animate-bounce delay-1000 hidden lg:block">
        <TrendingUp className="h-8 w-8 text-primary/30" />
      </div>
      <div className="absolute top-1/3 right-8 animate-bounce delay-1500 hidden lg:block">
        <Star className="h-6 w-6 text-secondary/40 animate-spin" style={{ animationDuration: '4s' }} />
      </div>
    </div>
  );
};