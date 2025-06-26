
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
          CryptoAnalyzer
        </Link>
        <div className="flex space-x-4">
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
          <Link to="/virtual-portfolio">
            <Button 
              variant={location.pathname === "/virtual-portfolio" ? "default" : "outline"}
              className="transition-colors"
            >
              Virtual Portfolio
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
