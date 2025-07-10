import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Activity, TrendingUp, ArrowRight } from "lucide-react";

interface Analysis {
  id: string;
  coin_id: string;
  investment_amount: number;
  recommendation: string;
}

interface RecentAnalysesProps {
  recentAnalyses: Analysis[];
}

const RecentAnalyses = ({ recentAnalyses }: RecentAnalysesProps) => {
  return (
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
  );
};

export default RecentAnalyses;