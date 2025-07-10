import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Wallet, 
  BarChart3, 
  BookOpen, 
  Newspaper,
  Activity,
  ArrowRight,
  CreditCard,
  Settings,
  Users,
  Coins,
  Shield
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { useAdmin } from "@/hooks/useAdmin";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [user, setUser] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [adminStats, setAdminStats] = useState({
    totalNews: 0,
    totalCourses: 0,
    totalCryptoListings: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return localStorage.getItem('dashboard-mode') === 'admin';
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      await fetchUserData(session.user.id);
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin && isAdminMode) {
      fetchAdminStats();
    }
  }, [isAdmin, isAdminMode]);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch portfolios
      const { data: portfolioData } = await supabase
        .from('virtual_portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent analyses
      const { data: analysesData } = await supabase
        .from('investment_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setPortfolios(portfolioData || []);
      setRecentAnalyses(analysesData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    if (!isAdmin) return;
    
    try {
      const [newsResult, coursesResult, cryptoResult, subscriptionsResult] = await Promise.all([
        supabase.from('news').select('*', { count: 'exact', head: true }),
        supabase.from('learning_courses').select('*', { count: 'exact', head: true }),
        supabase.from('crypto_listings').select('*', { count: 'exact', head: true }),
        supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      setAdminStats({
        totalNews: newsResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalCryptoListings: cryptoResult.count || 0,
        activeSubscriptions: subscriptionsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const handleModeToggle = (checked: boolean) => {
    setIsAdminMode(checked);
    localStorage.setItem('dashboard-mode', checked ? 'admin' : 'user');
  };

  const userQuickActions = [
    {
      title: "Investment Analysis",
      description: "Analyze crypto investments with NPV, IRR, and risk metrics",
      icon: BarChart3,
      link: "/analysis",
      color: "bg-blue-500"
    },
    {
      title: "Virtual Portfolio",
      description: "Manage your virtual crypto portfolio",
      icon: Wallet,
      link: "/virtual-portfolio",
      color: "bg-green-500"
    },
    {
      title: "Market News",
      description: "Stay updated with latest crypto news",
      icon: Newspaper,
      link: "/news",
      color: "bg-purple-500"
    },
    {
      title: "Learning Center",
      description: "Expand your crypto knowledge",
      icon: BookOpen,
      link: "/learning",
      color: "bg-orange-500"
    }
  ];

  const adminQuickActions = [
    {
      title: "News Management",
      description: "Create and manage news articles",
      icon: Newspaper,
      link: "/admin/news",
      color: "bg-blue-500"
    },
    {
      title: "Learning Management",
      description: "Manage courses and educational content",
      icon: BookOpen,
      link: "/admin/learning",
      color: "bg-green-500"
    },
    {
      title: "Crypto Listings",
      description: "Manage cryptocurrency listings",
      icon: Coins,
      link: "/admin/crypto-listings",
      color: "bg-yellow-500"
    },
    {
      title: "User Management",
      description: "Manage users and subscriptions",
      icon: Users,
      link: "/admin/subscriptions",
      color: "bg-purple-500"
    }
  ];

  const adminStatCards = [
    {
      title: 'Total News Articles',
      value: adminStats.totalNews,
      description: 'Published and draft articles',
      icon: Newspaper,
      color: 'text-blue-600',
    },
    {
      title: 'Learning Courses',
      value: adminStats.totalCourses,
      description: 'Available courses',
      icon: BookOpen,
      color: 'text-green-600',
    },
    {
      title: 'Crypto Listings',
      value: adminStats.totalCryptoListings,
      description: 'Listed projects',
      icon: Coins,
      color: 'text-yellow-600',
    },
    {
      title: 'Active Subscriptions',
      value: adminStats.activeSubscriptions,
      description: 'Current paid users',
      icon: CreditCard,
      color: 'text-purple-600',
    },
  ];

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section with Mode Toggle */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground text-lg">
              {isAdminMode ? "Admin Dashboard - Manage your crypto platform" : "Here's your crypto investment dashboard overview"}
            </p>
          </div>
          
          {isAdmin && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">User Mode</span>
                <Switch
                  checked={isAdminMode}
                  onCheckedChange={handleModeToggle}
                />
                <span className="text-sm text-muted-foreground">Admin Mode</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {isAdminMode ? 'ADMIN VIEW' : 'USER VIEW'}
                </span>
              </div>
            </div>
          )}
        </div>

        {isAdminMode ? (
          <>
            {/* Admin Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {adminStatCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {card.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{card.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {card.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Admin Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {adminQuickActions.map((action) => (
                <Card key={action.title} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <Link to={action.link}>
                    <CardHeader className="pb-3">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {action.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        Manage <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* User Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {userQuickActions.map((action) => (
                <Card key={action.title} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <Link to={action.link}>
                    <CardHeader className="pb-3">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {action.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        Get Started <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </>
        )}

        {isAdminMode ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Admin Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/admin/news">
                      <Newspaper className="h-4 w-4 mr-2" />
                      Add News Article
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/admin/learning">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Create Course
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/admin/crypto-listings">
                      <Coins className="h-4 w-4 mr-2" />
                      Add Crypto Listing
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Platform health overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  All systems operational
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div>Last updated: {new Date().toLocaleString()}</div>
                  <div>Active sessions: {adminStats.activeSubscriptions}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Portfolio Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Your Portfolios
                </CardTitle>
                <CardDescription>
                  Recent virtual portfolio activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {portfolios.length > 0 ? (
                  <div className="space-y-4">
                    {portfolios.map((portfolio) => (
                      <div key={portfolio.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{portfolio.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Total Value: ${portfolio.total_value?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            portfolio.all_time_profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {portfolio.all_time_profit >= 0 ? '+' : ''}
                            ${portfolio.all_time_profit?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-muted-foreground">P&L</p>
                        </div>
                      </div>
                    ))}
                    <Button asChild className="w-full" variant="outline">
                      <Link to="/virtual-portfolio">
                        View All Portfolios <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-medium mb-2">No portfolios yet</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first virtual portfolio to start tracking investments
                    </p>
                    <Button asChild>
                      <Link to="/virtual-portfolio">Create Portfolio</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Analyses
                </CardTitle>
                <CardDescription>
                  Your latest investment analyses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentAnalyses.length > 0 ? (
                  <div className="space-y-4">
                    {recentAnalyses.slice(0, 3).map((analysis) => (
                      <div key={analysis.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{analysis.coin_id}</h4>
                          <p className="text-sm text-muted-foreground">
                            ${analysis.investment_amount?.toLocaleString() || '0'} investment
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            analysis.recommendation === 'Buy' 
                              ? 'bg-green-100 text-green-800' 
                              : analysis.recommendation === 'Buy Less'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {analysis.recommendation}
                          </span>
                        </div>
                      </div>
                    ))}
                    <Button asChild className="w-full" variant="outline">
                      <Link to="/analysis">
                        New Analysis <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-medium mb-2">No analyses yet</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start analyzing crypto investments to make informed decisions
                    </p>
                    <Button asChild>
                      <Link to="/analysis">Start Analysis</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upgrade Section - Only show in user mode */}
        {!isAdminMode && (
          <Card className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Premium Features
              </CardTitle>
              <CardDescription>
                Unlock advanced analytics and unlimited portfolios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Advanced portfolio analytics</li>
                    <li>• Unlimited virtual portfolios</li>
                    <li>• Real-time market alerts</li>
                    <li>• Priority customer support</li>
                  </ul>
                </div>
                <Button className="ml-4">
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;