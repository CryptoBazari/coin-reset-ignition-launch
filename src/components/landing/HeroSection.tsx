import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Star, LogIn, ArrowRight, TrendingUp } from "lucide-react";
import { AnimatedBackground3D } from "./AnimatedBackground3D";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 3D Animated background */}
      <AnimatedBackground3D />
      
      {/* Additional animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse transform-gpu" 
             style={{ transform: 'translateZ(50px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse transform-gpu" 
             style={{ animationDelay: '1s', transform: 'translateZ(30px)' }} />
        <div className="absolute top-3/4 left-3/4 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl animate-pulse transform-gpu" 
             style={{ animationDelay: '2s', transform: 'translateZ(70px)' }} />
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="mb-6">
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-8 animate-bounce backdrop-blur-sm">
            <Star className="h-4 w-4 mr-2 animate-spin" style={{ animationDuration: '3s' }} />
            Trusted by 10,000+ crypto investors
          </span>
        </div>
      
      
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight transform-gpu">
          Welcome to
          <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-pulse">
            CoinPlatform
          </span>
        </h1>
      
        <p className="text-xl text-white/80 mb-10 max-w-4xl mx-auto leading-relaxed animate-fade-in delay-300">
          Make informed crypto investment decisions with our comprehensive analysis tools, 
          real-time market insights, and advanced virtual portfolio management system.
        </p>
      
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in delay-500">
          <Link to="/auth">
            <Button size="lg" className="text-lg px-10 py-4 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-0 hover:from-yellow-300 hover:to-orange-400">
              <LogIn className="h-5 w-5 mr-2" />
              Start Free Today
            </Button>
          </Link>
          <Link to="/analysis">
            <Button variant="outline" size="lg" className="text-lg px-10 py-4 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border-white/80 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm">
              Try Demo <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-white/60 mt-4 animate-fade-in delay-700">
          No credit card required • Free forever plan available
        </p>
        
        {/* 3D Floating animated elements */}
        <div className="absolute top-1/2 left-8 animate-bounce delay-1000 hidden lg:block transform-gpu" style={{ transform: 'translateZ(40px)' }}>
          <TrendingUp className="h-8 w-8 text-yellow-400/60" />
        </div>
        <div className="absolute top-1/3 right-8 animate-bounce delay-1500 hidden lg:block transform-gpu" style={{ transform: 'translateZ(30px)' }}>
          <Star className="h-6 w-6 text-orange-400/60 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
      </div>
    </section>
  );
};