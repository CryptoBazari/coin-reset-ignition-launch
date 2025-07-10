import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { TrendingUp, BarChart3, Wallet } from "lucide-react";

export const FeaturesSection = () => {
  return (
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
  );
};