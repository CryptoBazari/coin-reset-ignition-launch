
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { TrendingUp, BarChart3, Wallet, ArrowRight, LogIn } from "lucide-react";
import Navbar from "@/components/Navbar";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Master Cryptocurrency
            <span className="text-blue-600 block">Investment Analysis</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Make informed crypto investment decisions with our comprehensive analysis tools, 
            market insights, and virtual portfolio management system.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                <LogIn className="h-5 w-5 mr-2" />
                Get Started
              </Button>
            </Link>
            <Link to="/analysis">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Try Demo <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Investment Analysis</CardTitle>
              <CardDescription>
                Get comprehensive analysis including NPV, IRR, CAGR, and risk assessments for any cryptocurrency investment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/analysis">
                <Button variant="outline" className="w-full">
                  Analyze Investments
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Market Insights</CardTitle>
              <CardDescription>
                Access real-time market data, price trends, and fundamental analysis to stay ahead of market movements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Virtual Portfolio</CardTitle>
              <CardDescription>
                Practice trading with virtual funds, track performance, and refine your investment strategy risk-free.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button variant="outline" className="w-full">
                  Start Trading
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Make Smarter Investment Decisions?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of investors who use our platform to analyze and optimize their cryptocurrency investments.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              <LogIn className="h-5 w-5 mr-2" />
              Sign Up Free
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Landing;
