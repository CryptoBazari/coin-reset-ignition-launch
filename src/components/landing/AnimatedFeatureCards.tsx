import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Newspaper, BookOpen, Wallet, TrendingUp, 
         BarChart3, PieChart, Users, GraduationCap,
         DollarSign, LineChart, Target, Brain } from "lucide-react";

export const AnimatedFeatureCards = () => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
      {/* News Section */}
      <div className="group">
        <Card className="h-full hover:shadow-2xl hover:scale-105 transition-all duration-500 border-0 shadow-lg overflow-hidden relative bg-gradient-to-br from-background to-secondary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500">
              <Newspaper className="h-8 w-8 text-white animate-pulse" />
            </div>
            <CardTitle className="text-xl group-hover:text-blue-600 transition-colors duration-300">
              Crypto News
            </CardTitle>
            <CardDescription className="text-base">
              Stay updated with the latest cryptocurrency news, market analysis, and industry insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {/* Animated newspaper elements */}
            <div className="space-y-2 mb-4">
              <div className="h-2 bg-gradient-to-r from-blue-500/20 to-transparent rounded animate-pulse" />
              <div className="h-2 bg-gradient-to-r from-blue-500/15 to-transparent rounded animate-pulse delay-100" />
              <div className="h-2 bg-gradient-to-r from-blue-500/10 to-transparent rounded animate-pulse delay-200" />
            </div>
            <Link to="/news">
              <Button variant="outline" className="w-full hover:bg-blue-500 hover:text-white transition-all duration-300 group-hover:shadow-lg">
                Read Latest News
              </Button>
            </Link>
          </CardContent>
          {/* Floating icons */}
          <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
            <div className="animate-bounce delay-300">
              <BarChart3 className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Learning Section */}
      <div className="group">
        <Card className="h-full hover:shadow-2xl hover:scale-105 transition-all duration-500 border-0 shadow-lg overflow-hidden relative bg-gradient-to-br from-background to-secondary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl group-hover:text-emerald-600 transition-colors duration-300">
              Learning Center
            </CardTitle>
            <CardDescription className="text-base">
              Master cryptocurrency trading and investment with our comprehensive educational resources.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {/* Animated book pages */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-emerald-500 animate-pulse" />
                <div className="h-2 bg-gradient-to-r from-emerald-500/20 to-transparent rounded flex-1" />
              </div>
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-emerald-500 animate-pulse delay-150" />
                <div className="h-2 bg-gradient-to-r from-emerald-500/15 to-transparent rounded flex-1" />
              </div>
            </div>
            <Link to="/learning">
              <Button variant="outline" className="w-full hover:bg-emerald-500 hover:text-white transition-all duration-300 group-hover:shadow-lg">
                Start Learning
              </Button>
            </Link>
          </CardContent>
          {/* Floating icons */}
          <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
            <div className="animate-bounce delay-500">
              <Users className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Virtual Portfolio Section */}
      <div className="group">
        <Card className="h-full hover:shadow-2xl hover:scale-105 transition-all duration-500 border-0 shadow-lg overflow-hidden relative bg-gradient-to-br from-background to-secondary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl group-hover:text-purple-600 transition-colors duration-300">
              Virtual Portfolio
            </CardTitle>
            <CardDescription className="text-base">
              Practice trading with virtual funds and track your investment performance risk-free.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {/* Animated portfolio elements */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-purple-500 animate-pulse" />
                  <span className="text-sm text-muted-foreground">Portfolio Value</span>
                </div>
                <div className="text-sm font-medium text-green-500 animate-pulse">+12.5%</div>
              </div>
              <div className="flex items-center space-x-2">
                <PieChart className="h-4 w-4 text-purple-500 animate-spin" style={{ animationDuration: '4s' }} />
                <div className="h-2 bg-gradient-to-r from-purple-500/20 to-transparent rounded flex-1" />
              </div>
            </div>
            <Link to="/virtual-portfolio">
              <Button variant="outline" className="w-full hover:bg-purple-500 hover:text-white transition-all duration-300 group-hover:shadow-lg">
                Manage Portfolio
              </Button>
            </Link>
          </CardContent>
          {/* Floating icons */}
          <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
            <div className="animate-bounce delay-700">
              <Target className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Crypto Analysis Section */}
      <div className="group">
        <Card className="h-full hover:shadow-2xl hover:scale-105 transition-all duration-500 border-0 shadow-lg overflow-hidden relative bg-gradient-to-br from-background to-secondary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl group-hover:text-orange-600 transition-colors duration-300">
              Investment Analysis
            </CardTitle>
            <CardDescription className="text-base">
              Get comprehensive analysis with NPV, IRR, CAGR, and advanced risk assessments.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {/* Animated chart elements */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-2">
                <LineChart className="h-4 w-4 text-orange-500 animate-pulse" />
                <div className="text-xs text-muted-foreground">NPV Analysis</div>
                <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded flex-1 animate-pulse" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-4 bg-orange-500/20 rounded animate-pulse" />
                <div className="h-6 bg-orange-500/30 rounded animate-pulse delay-100" />
                <div className="h-3 bg-orange-500/20 rounded animate-pulse delay-200" />
              </div>
            </div>
            <Link to="/analysis">
              <Button variant="outline" className="w-full hover:bg-orange-500 hover:text-white transition-all duration-300 group-hover:shadow-lg">
                Analyze Investments
              </Button>
            </Link>
          </CardContent>
          {/* Floating icons */}
          <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
            <div className="animate-bounce delay-1000">
              <BarChart3 className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};