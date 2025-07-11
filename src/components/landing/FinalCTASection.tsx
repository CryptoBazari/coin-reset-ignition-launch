import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

export const FinalCTASection = () => {
  return (
    <div className="text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-white shadow-xl">
      <h2 className="text-4xl font-bold mb-4">
        Ready to Make Smarter Investment Decisions?
      </h2>
      <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
        Join thousands of investors who use our platform to analyze and optimize their cryptocurrency investments.
      </p>
      <Link to="/auth">
        <Button size="lg" variant="secondary" className="text-lg px-10 py-4">
          <LogIn className="h-5 w-5 mr-2" />
          Sign Up Free Today
        </Button>
      </Link>
    </div>
  );
};