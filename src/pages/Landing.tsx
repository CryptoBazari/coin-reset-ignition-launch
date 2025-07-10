
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, BarChart3, Wallet, ArrowRight, LogIn, Shield, Zap, Users, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

const Landing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated and redirect to dashboard
    const checkAuth = async () => {
      try {
        console.log('Landing: Checking auth status...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Landing: Session found:', !!session?.user);
        
        if (session?.user) {
          console.log('Landing: User authenticated, redirecting to dashboard...');
          navigate('/dashboard', { replace: true });
          return;
        }
        console.log('Landing: No user found, showing landing page');
      } catch (error) {
        console.error('Landing: Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
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

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 shadow-lg">
            <CardHeader>
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Investment Analysis</CardTitle>
              <CardDescription className="text-base">
                Get comprehensive analysis including NPV, IRR, CAGR, and risk assessments for any cryptocurrency investment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/analysis">
                <Button variant="outline" className="w-full hover:bg-primary hover:text-white transition-colors">
                  Analyze Investments
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 shadow-lg">
            <CardHeader>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Real-Time Market Data</CardTitle>
              <CardDescription className="text-base">
                Access live market data, price trends, and fundamental analysis to stay ahead of market movements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/crypto-list">
                <Button variant="outline" className="w-full hover:bg-green-500 hover:text-white transition-colors">
                  View Markets
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 shadow-lg">
            <CardHeader>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Virtual Portfolio</CardTitle>
              <CardDescription className="text-base">
                Practice trading with virtual funds, track performance, and refine your investment strategy risk-free.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/virtual-portfolio">
                <Button variant="outline" className="w-full hover:bg-purple-500 hover:text-white transition-colors">
                  Start Trading
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">10,000+</div>
            <div className="text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">$50M+</div>
            <div className="text-muted-foreground">Assets Analyzed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">25k+</div>
            <div className="text-muted-foreground">Portfolios Created</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">99.9%</div>
            <div className="text-muted-foreground">Uptime</div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">Why Choose CryptoAnalyzer?</h2>
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

        {/* Final CTA Section */}
        <div className="text-center bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Make Smarter Investment Decisions?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of investors who use our platform to analyze and optimize their cryptocurrency investments.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-10 py-4">
              <LogIn className="h-5 w-5 mr-2" />
              Sign Up Free Today
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Landing;
