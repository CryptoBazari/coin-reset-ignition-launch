
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, Target, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Smart Cryptocurrency Investment Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Make informed investment decisions using advanced financial metrics, Cointime Economics, 
            and value investing principles across Bitcoin, Blue Chip, and Small-Cap cryptocurrencies.
          </p>
          <Link to="/analysis">
            <Button size="lg" className="px-8 py-4 text-lg">
              Start Analysis <TrendingUp className="ml-2" size={24} />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Financial Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                NPV, IRR, CAGR, and ROI calculations for comprehensive investment evaluation
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Three Baskets Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Bitcoin, Blue Chip Coins, and Small-Cap analysis with tailored benchmarks
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced risk assessment with 1-5 scale rating and portfolio diversification guidance
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Smart Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Buy, Buy Less, or Do Not Buy recommendations with detailed conditions and risks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Investment Baskets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-2 border-orange-200 hover:border-orange-300 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Bitcoin Basket</CardTitle>
                <Badge variant="outline" className="bg-orange-50">Single Asset</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Focus on Cointime Economics metrics including AVIV ratio, active/vaulted supply analysis
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Benchmark:</span>
                  <span className="font-semibold">S&P 500</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Allocation:</span>
                  <span className="font-semibold">50%</span>
                </div>
                <div className="flex justify-between">
                  <span>Hurdle Rate:</span>
                  <span className="font-semibold">10%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Blue Chip Basket</CardTitle>
                <Badge variant="outline" className="bg-blue-50">36M+ History</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Established cryptocurrencies with minimum 36 months of price history and strong fundamentals
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Benchmark:</span>
                  <span className="font-semibold">Bitcoin</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Allocation:</span>
                  <span className="font-semibold">30%</span>
                </div>
                <div className="flex justify-between">
                  <span>Hurdle Rate:</span>
                  <span className="font-semibold">15%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Small-Cap Basket</CardTitle>
                <Badge variant="outline" className="bg-green-50">High Growth</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Market cap under $500M with less than 2 years of data. High risk, high potential returns
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Benchmark:</span>
                  <span className="font-semibold">Bitcoin</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Allocation:</span>
                  <span className="font-semibold">20%</span>
                </div>
                <div className="flex justify-between">
                  <span>Hurdle Rate:</span>
                  <span className="font-semibold">20%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Analyze Your Investment?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Get comprehensive analysis with NPV, IRR, CAGR calculations and smart recommendations
          </p>
          <Link to="/analysis">
            <Button size="lg" className="px-12 py-4 text-lg">
              Launch Investment Analyzer
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
