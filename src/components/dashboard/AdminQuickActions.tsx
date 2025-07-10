import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Newspaper, BookOpen, Coins, Users, ArrowRight } from "lucide-react";

const AdminQuickActions = () => {
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

  return (
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
  );
};

export default AdminQuickActions;