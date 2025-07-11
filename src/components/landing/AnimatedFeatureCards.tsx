import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Newspaper, BookOpen, Wallet, TrendingUp, 
         BarChart3, PieChart, Users, GraduationCap,
         DollarSign, LineChart, Target, Brain } from "lucide-react";

export const AnimatedFeatureCards = () => {
  return (
    <section className="py-20 px-6 md:px-8 bg-gradient-to-b from-primary/95 to-primary">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-accent-foreground mb-6">
            Powerful Features
          </h2>
          <p className="text-xl text-accent-foreground/80 max-w-2xl mx-auto">
            Everything you need to make informed crypto investment decisions
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* News Section */}
          <div className="group">
            <Card className="h-full hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-accent/20 shadow-lg overflow-hidden relative bg-card backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-primary rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500">
                  <Newspaper className="h-8 w-8 text-white animate-pulse" />
                </div>
                <CardTitle className="text-xl group-hover:text-secondary transition-colors duration-300">
                  Crypto News
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Stay updated with the latest cryptocurrency news, market analysis, and industry insights.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-2 mb-4">
                  <div className="h-2 bg-gradient-to-r from-secondary/20 to-transparent rounded animate-pulse" />
                  <div className="h-2 bg-gradient-to-r from-secondary/15 to-transparent rounded animate-pulse delay-100" />
                  <div className="h-2 bg-gradient-to-r from-secondary/10 to-transparent rounded animate-pulse delay-200" />
                </div>
                <Link to="/news">
                  <Button variant="outline" className="w-full hover:bg-secondary hover:text-white transition-all duration-300 group-hover:shadow-lg border-secondary/30">
                    Read Latest News
                  </Button>
                </Link>
              </CardContent>
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                <div className="animate-bounce delay-300">
                  <BarChart3 className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </Card>
          </div>

          {/* Learning Section */}
          <div className="group">
            <Card className="h-full hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-accent/20 shadow-lg overflow-hidden relative bg-card backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500">
                  <BookOpen className="h-8 w-8 text-accent-foreground" />
                </div>
                <CardTitle className="text-xl group-hover:text-accent transition-colors duration-300">
                  Learning Center
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Master cryptocurrency trading and investment with our comprehensive educational resources.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-accent animate-pulse" />
                    <div className="h-2 bg-gradient-to-r from-accent/20 to-transparent rounded flex-1" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-accent animate-pulse delay-150" />
                    <div className="h-2 bg-gradient-to-r from-accent/15 to-transparent rounded flex-1" />
                  </div>
                </div>
                <Link to="/learning">
                  <Button variant="outline" className="w-full hover:bg-accent hover:text-accent-foreground transition-all duration-300 group-hover:shadow-lg border-accent/30">
                    Start Learning
                  </Button>
                </Link>
              </CardContent>
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                <div className="animate-bounce delay-500">
                  <Users className="h-6 w-6 text-accent" />
                </div>
              </div>
            </Card>
          </div>

          {/* Virtual Portfolio Section */}
          <div className="group">
            <Card className="h-full hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-accent/20 shadow-lg overflow-hidden relative bg-card backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                  Virtual Portfolio
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Practice trading with virtual funds and track your investment performance risk-free.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-sm text-muted-foreground">Portfolio Value</span>
                    </div>
                    <div className="text-sm font-medium text-secondary animate-pulse">+12.5%</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <PieChart className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: '4s' }} />
                    <div className="h-2 bg-gradient-to-r from-primary/20 to-transparent rounded flex-1" />
                  </div>
                </div>
                <Link to="/virtual-portfolio">
                  <Button variant="outline" className="w-full hover:bg-primary hover:text-white transition-all duration-300 group-hover:shadow-lg border-primary/30">
                    Manage Portfolio
                  </Button>
                </Link>
              </CardContent>
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                <div className="animate-bounce delay-700">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          </div>

          {/* Crypto Analysis Section */}
          <div className="group">
            <Card className="h-full hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-accent/20 shadow-lg overflow-hidden relative bg-card backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500">
                  <TrendingUp className="h-8 w-8 text-accent-foreground" />
                </div>
                <CardTitle className="text-xl group-hover:text-accent transition-colors duration-300">
                  Investment Analysis
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Get comprehensive analysis with NPV, IRR, CAGR, and advanced risk assessments.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <LineChart className="h-4 w-4 text-accent animate-pulse" />
                    <div className="text-xs text-muted-foreground">NPV Analysis</div>
                    <div className="h-1 bg-gradient-to-r from-accent to-primary rounded flex-1 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-4 bg-accent/20 rounded animate-pulse" />
                    <div className="h-6 bg-accent/30 rounded animate-pulse delay-100" />
                    <div className="h-3 bg-accent/20 rounded animate-pulse delay-200" />
                  </div>
                </div>
                <Link to="/analysis">
                  <Button variant="outline" className="w-full hover:bg-accent hover:text-accent-foreground transition-all duration-300 group-hover:shadow-lg border-accent/30">
                    Analyze Investments
                  </Button>
                </Link>
              </CardContent>
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                <div className="animate-bounce delay-1000">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};