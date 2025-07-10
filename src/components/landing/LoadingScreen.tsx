import { Button } from "@/components/ui/button";

interface LoadingScreenProps {
  showContinue: boolean;
  onContinue: () => void;
}

export const LoadingScreen = ({ showContinue, onContinue }: LoadingScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground mb-4">Loading...</p>
        {showContinue && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Taking longer than expected?</p>
            <Button onClick={onContinue} variant="outline">
              Continue to Home Page
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};