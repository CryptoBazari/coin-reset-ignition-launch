import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

export const FinalCTASection = () => {
  return (
    <section className="py-24 px-6 md:px-8 bg-gradient-to-b from-primary/80 to-primary">
      <div className="container mx-auto">
        <div className="text-center bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-lg rounded-3xl p-16 border border-accent/30 shadow-2xl max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-card-foreground">
            Ready to Make Smarter Investment Decisions?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of investors who use our platform to analyze and optimize their cryptocurrency investments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-12 py-4 bg-accent text-accent-foreground hover:bg-accent/90 border-0 font-semibold hover:scale-105 transition-all duration-300 shadow-lg">
                <LogIn className="h-5 w-5 mr-2" />
                Sign Up Free Today
              </Button>
            </Link>
            <Link to="/analysis">
              <Button size="lg" variant="outline" className="text-lg px-12 py-4 border-secondary/50 text-card-foreground hover:bg-secondary/10 hover:text-secondary hover:border-secondary hover:scale-105 transition-all duration-300">
                Try Demo First
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Start with our free plan
          </p>
        </div>
      </div>
    </section>
  );
};