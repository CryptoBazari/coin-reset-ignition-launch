import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, BookOpen, Coins, Users, CreditCard, TrendingUp } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface DashboardStats {
  totalNews: number;
  totalCourses: number;
  totalCryptoListings: number;
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalNews: 0,
    totalCourses: 0,
    totalCryptoListings: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch news count
      const { count: newsCount } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true });

      // Fetch courses count
      const { count: coursesCount } = await supabase
        .from('learning_courses')
        .select('*', { count: 'exact', head: true });

      // Fetch crypto listings count
      const { count: cryptoCount } = await supabase
        .from('crypto_listings')
        .select('*', { count: 'exact', head: true });

      // Fetch active subscriptions count
      const { count: subscriptionsCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // For now, we'll set totalUsers and totalRevenue to placeholder values
      // since we don't have direct access to auth.users table from client
      
      setStats({
        totalNews: newsCount || 0,
        totalCourses: coursesCount || 0,
        totalCryptoListings: cryptoCount || 0,
        totalUsers: 0, // This would need a server function to count auth.users
        activeSubscriptions: subscriptionsCount || 0,
        totalRevenue: 0, // This would be calculated from payments
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total News Articles',
      value: stats.totalNews,
      description: 'Published and draft articles',
      icon: Newspaper,
      color: 'text-blue-600',
    },
    {
      title: 'Learning Courses',
      value: stats.totalCourses,
      description: 'Available courses',
      icon: BookOpen,
      color: 'text-green-600',
    },
    {
      title: 'Crypto Listings',
      value: stats.totalCryptoListings,
      description: 'Listed projects',
      icon: Coins,
      color: 'text-yellow-600',
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      description: 'Current paid users',
      icon: CreditCard,
      color: 'text-purple-600',
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your crypto platform
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                • Add new news article<br/>
                • Create learning course<br/>
                • Add crypto listing<br/>
                • Manage user access
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
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;