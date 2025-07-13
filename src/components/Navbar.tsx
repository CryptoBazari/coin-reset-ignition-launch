import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut, TrendingUp, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const publicLinks = [{
    to: "/",
    label: "Home"
  }, {
    to: "/news",
    label: "News"
  }, {
    to: "/learning",
    label: "Learning"
  }, {
    to: "/crypto-list",
    label: "Crypto List"
  }];
  const premiumLinks = [{
    to: "/analysis",
    label: "Analysis"
  }, {
    to: "/virtual-portfolio",
    label: "Portfolio"
  }];
  const userLinks = user ? [{
    to: "/dashboard",
    label: "Dashboard"
  }] : [];
  const allLinks = [...publicLinks, ...premiumLinks, ...userLinks];
  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getSession();

    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({
        scope: 'global'
      });
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  return <nav className="sticky top-0 z-50 border-b border-blue-200/20 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-blue-400" />
          <span className="font-bold text-xl text-white">CoinPlatform</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          {allLinks.map(link => <Link key={link.to} to={link.to} className={cn("text-blue-100 hover:text-blue-400 transition-colors relative px-2 py-1", location.pathname === link.to && "text-blue-400 font-medium")}>
              {link.label}
              {location.pathname === link.to && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />}
            </Link>)}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center space-x-2">
          {user ? <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2 border-blue-300/60 text-blue-100 hover:bg-blue-800/30">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button> : <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600">
              <Link to="/auth" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Get Started
              </Link>
            </Button>}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center space-x-2">
          {user ? <Button variant="outline" size="sm" onClick={handleSignOut} className="mr-2 border-blue-300/60 hover:bg-blue-800/30 text-[#f3f3f4]">
              <LogOut className="h-4 w-4" />
            </Button> : <Button asChild size="sm" className="mr-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600">
              <Link to="/auth">
                <User className="h-4 w-4" />
              </Link>
            </Button>}
          <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-blue-100 hover:text-blue-400 hover:bg-blue-800/30">
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && <div className="lg:hidden border-t border-blue-200/20 bg-slate-900/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {allLinks.map(link => <Link key={link.to} to={link.to} onClick={() => setIsMobileMenuOpen(false)} className={cn("block px-4 py-2 rounded-md text-blue-100 hover:text-blue-400 hover:bg-blue-800/30 transition-colors", location.pathname === link.to && "text-blue-400 bg-blue-800/30 font-medium")}>
                {link.label}
              </Link>)}
          </div>
        </div>}
    </nav>;
};
export default Navbar;