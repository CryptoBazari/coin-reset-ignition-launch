
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const publicLinks = [
    { to: "/", label: "Home" },
    { to: "/news", label: "News" },
    { to: "/learning", label: "Learning" },
    { to: "/crypto-list", label: "Crypto List" },
  ];

  const premiumLinks = [
    { to: "/analysis", label: "Analysis" },
    { to: "/virtual-portfolio", label: "Portfolio" },
  ];

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">CryptoAnalyzer</span>
        </Link>
        
        <div className="hidden lg:flex items-center space-x-6">
          {/* Public Links */}
          {publicLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-foreground hover:text-primary transition-colors relative px-2 py-1",
                location.pathname === link.to && "text-primary font-medium"
              )}
            >
              {link.label}
              {location.pathname === link.to && (
                <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
          
          {/* Premium Links */}
          {premiumLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-foreground hover:text-primary transition-colors relative px-2 py-1",
                location.pathname === link.to && "text-primary font-medium"
              )}
            >
              {link.label}
              {location.pathname === link.to && (
                <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          {user ? (
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Button asChild>
              <Link to="/auth" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Get Started
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
