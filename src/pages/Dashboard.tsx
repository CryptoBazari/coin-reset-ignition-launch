import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { useAdmin } from "@/hooks/useAdmin";
import { useDashboard } from "@/hooks/useDashboard";
import AdminControls from "@/components/dashboard/AdminControls";
import AdminStats from "@/components/dashboard/AdminStats";
import UserQuickActions from "@/components/dashboard/UserQuickActions";
import AdminQuickActions from "@/components/dashboard/AdminQuickActions";
import PortfolioOverview from "@/components/dashboard/PortfolioOverview";
import RecentAnalyses from "@/components/dashboard/RecentAnalyses";
import PaymentVerification from "@/components/dashboard/PaymentVerification";
import PremiumFeatures from "@/components/dashboard/PremiumFeatures";
import AdminSystemStatus from "@/components/dashboard/AdminSystemStatus";

const Dashboard = () => {
  const { isAdmin, loading: adminLoading, checkAdminStatus } = useAdmin();
  const {
    user,
    portfolios,
    recentAnalyses,
    adminStats,
    loading,
    verifyingPayments,
    isAdminMode,
    hasActiveSubscription,
    subscriptionLoading,
    fetchAdminStats,
    handleVerifyPayments,
    handleModeToggle,
  } = useDashboard();

  useEffect(() => {
    if (isAdmin && isAdminMode) {
      fetchAdminStats(isAdmin);
    }
  }, [isAdmin, isAdminMode, fetchAdminStats]);

  console.log('Dashboard render - isAdmin:', isAdmin, 'adminLoading:', adminLoading, 'hasActiveSubscription:', hasActiveSubscription, 'user:', user?.email);

  if (loading || adminLoading || subscriptionLoading) {
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
          
          <AdminControls 
            isAdmin={isAdmin}
            isAdminMode={isAdminMode}
            onModeToggle={handleModeToggle}
            onRefreshAdminStatus={checkAdminStatus}
          />
        </div>

        {isAdminMode ? (
          <>
            {/* Admin Stats */}
            <AdminStats adminStats={adminStats} />

            {/* Admin Quick Actions */}
            <AdminQuickActions />

            {/* Admin System Status */}
            <AdminSystemStatus adminStats={adminStats} />
          </>
        ) : (
          <>
            {/* User Quick Actions */}
            <UserQuickActions />

            {/* User Portfolio and Analysis Overview */}
            <div className="grid lg:grid-cols-2 gap-8">
              <PortfolioOverview portfolios={portfolios} />
              <RecentAnalyses recentAnalyses={recentAnalyses} />
            </div>
          </>
        )}

        {/* Payment Verification Section */}
        <PaymentVerification 
          hasActiveSubscription={hasActiveSubscription}
          verifyingPayments={verifyingPayments}
          onVerifyPayments={handleVerifyPayments}
        />

        {/* Premium Features Section */}
        <PremiumFeatures 
          isAdminMode={isAdminMode}
          hasActiveSubscription={hasActiveSubscription}
        />
      </main>
    </div>
  );
};

export default Dashboard;