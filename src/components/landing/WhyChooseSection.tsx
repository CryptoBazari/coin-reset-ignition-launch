import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Zap, Users, LogIn } from "lucide-react";

export const WhyChooseSection = () => {
  return (
    <section className="relative py-24 px-6 md:px-8 bg-gradient-to-b from-primary/90 to-primary/80 overflow-hidden">
      {/* Brand-colored background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-accent-foreground mb-8">
              Why Choose CoinPlatform?
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary/30 to-accent/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-secondary/40">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-accent-foreground mb-2 group-hover:text-secondary transition-colors duration-300">Bank-Grade Security</h3>
                  <p className="text-accent-foreground/80 leading-relaxed">Your data is encrypted and secured with industry-leading protocols and multi-layer protection systems.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 bg-gradient-to-br from-accent/30 to-secondary/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-accent/40">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-accent-foreground mb-2 group-hover:text-accent transition-colors duration-300">Lightning Fast</h3>
                  <p className="text-accent-foreground/80 leading-relaxed">Real-time analysis and portfolio updates with sub-second response times powered by advanced algorithms.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/40 to-secondary/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-primary/50">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-accent-foreground mb-2 group-hover:text-primary transition-colors duration-300">Expert Support</h3>
                  <p className="text-accent-foreground/80 leading-relaxed">24/7 support from crypto investment professionals with years of market experience.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-lg rounded-3xl p-10 border border-accent/30 hover:border-secondary/50 transition-all duration-500 group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
            
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-card-foreground mb-6 group-hover:text-secondary transition-colors duration-300">Ready to get started?</h3>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Join the community of smart crypto investors who use data-driven analysis to make better investment decisions.
              </p>
              
              <div className="space-y-4">
                <Link to="/auth">
                  <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 border-0 text-lg py-4 group-hover:scale-105 transition-all duration-300 font-semibold">
                    <LogIn className="h-5 w-5 mr-2" />
                    Start Free Account
                  </Button>
                </Link>
                <Link to="/learning">
                  <Button variant="outline" size="lg" className="w-full border-secondary/50 text-card-foreground hover:bg-secondary/10 hover:text-secondary hover:border-secondary text-lg py-4 group-hover:scale-105 transition-all duration-300">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};