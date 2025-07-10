import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, BookOpen, Coins, CreditCard } from "lucide-react";

interface AdminStatsProps {
  adminStats: {
    totalNews: number;
    totalCourses: number;
    totalCryptoListings: number;
    activeSubscriptions: number;
  };
}

const AdminStats = ({ adminStats }: AdminStatsProps) => {
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

  return (
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
  );
};

export default AdminStats;