import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Newspaper, BookOpen, Coins } from "lucide-react";

interface AdminSystemStatusProps {
  adminStats: {
    activeSubscriptions: number;
  };
}

const AdminSystemStatus = ({ adminStats }: AdminSystemStatusProps) => {
  return (
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
  );
};

export default AdminSystemStatus;