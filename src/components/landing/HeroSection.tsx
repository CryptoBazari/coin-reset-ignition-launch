import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Star, LogIn, ArrowRight, TrendingUp } from "lucide-react";
import { AnimatedBackground3D } from "./AnimatedBackground3D";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 3D Animated background */}
      <AnimatedBackground3D />
      
      {/* Brand-colored background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-pulse transform-gpu" 
             style={{ transform: 'translateZ(50px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse transform-gpu" 
             style={{ animationDelay: '1s', transform: 'translateZ(30px)' }} />
        <div className="absolute top-3/4 left-3/4 w-48 h-48 bg-primary/25 rounded-full blur-3xl animate-pulse transform-gpu" 
             style={{ animationDelay: '2s', transform: 'translateZ(70px)' }} />
      </div>
      
      <div className="container mx-auto px-6 md:px-8 text-center relative z-10 py-20">
        <div className="mb-8">
          <span className="inline-flex items-center px-6 py-3 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium backdrop-blur-sm border border-accent/30 animate-bounce">
            <Star className="h-4 w-4 mr-2 animate-spin" style={{ animationDuration: '3s' }} />
            Trusted by 10,000+ crypto investors
          </span>
        </div>
      
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-accent-foreground mb-8 leading-tight">
          Welcome to
          <span className="block bg-gradient-to-r from-accent via-secondary to-accent bg-clip-text text-transparent mt-2">
            CoinPlatform
          </span>
        </h1>
      
        <p className="text-xl text-accent-foreground/80 mb-12 max-w-4xl mx-auto leading-relaxed">
          Make informed crypto investment decisions with our comprehensive analysis tools, 
          real-time market insights, and advanced virtual portfolio management system.
        </p>
      
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
          <Link to="/auth">
            <Button size="lg" className="text-lg px-12 py-4 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl bg-accent text-accent-foreground border-0 hover:bg-accent/90 font-semibold">
              <LogIn className="h-5 w-5 mr-2" />
              Start Free Today
            </Button>
          </Link>
          <Link to="/analysis">
            <Button variant="outline" size="lg" className="text-lg px-12 py-4 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border-accent/50 text-accent-foreground hover:bg-accent/10">
              Try Demo <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-muted-foreground">
          No credit card required • Free forever plan available
        </p>
        
        {/* Brand-colored floating elements */}
        <div className="absolute top-1/2 left-8 animate-bounce delay-1000 hidden lg:block transform-gpu" style={{ transform: 'translateZ(40px)' }}>
          <TrendingUp className="h-8 w-8 text-accent/60" />
        </div>
        <div className="absolute top-1/3 right-8 animate-bounce delay-1500 hidden lg:block transform-gpu" style={{ transform: 'translateZ(30px)' }}>
          <Star className="h-6 w-6 text-secondary/60 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
      </div>
    </section>
  );
};