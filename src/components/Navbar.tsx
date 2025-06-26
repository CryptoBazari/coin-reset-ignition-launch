
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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
    <nav className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
          CryptoAnalyzer
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button 
              variant={location.pathname === "/" ? "default" : "outline"}
              className="transition-colors"
            >
              Home
            </Button>
          </Link>
          <Link to="/analysis">
            <Button 
              variant={location.pathname === "/analysis" ? "default" : "outline"}
              className="transition-colors"
            >
              Investment Analyzer
            </Button>
          </Link>
          {user ? (
            <>
              <Link to="/virtual-portfolio">
                <Button 
                  variant={location.pathname === "/virtual-portfolio" ? "default" : "outline"}
                  className="transition-colors"
                >
                  Virtual Portfolio
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
