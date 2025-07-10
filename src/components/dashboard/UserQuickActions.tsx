import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart3, Wallet, Newspaper, BookOpen, ArrowRight } from "lucide-react";

const UserQuickActions = () => {
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

  return (
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
  );
};

export default UserQuickActions;