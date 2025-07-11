
import Navbar from "@/components/Navbar";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/landing/LoadingScreen";
import { HeroSection } from "@/components/landing/HeroSection";
import { AnimatedFeatureCards } from "@/components/landing/AnimatedFeatureCards";
import { StatsSection } from "@/components/landing/StatsSection";
import { WhyChooseSection } from "@/components/landing/WhyChooseSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";

const Landing = () => {
  const { loading, showContinue, handleContinue } = useAuthRedirect(true);
  const { isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen showContinue={showContinue} onContinue={handleContinue} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-50 to-white">
      <Navbar />
      
      <main>
        <HeroSection />
        <div className="container mx-auto px-4 py-16 space-y-16">
          <AnimatedFeatureCards />
          <StatsSection />
          <WhyChooseSection />
          {!isAuthenticated && <FinalCTASection />}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                CoinPlatform
              </h3>
              <p className="text-slate-300 mb-4 max-w-md">
                Professional cryptocurrency analysis and portfolio management platform trusted by thousands of investors worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-blue-400">Platform</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="/analysis" className="hover:text-blue-400 transition-colors">Crypto Analysis</a></li>
                <li><a href="/portfolio" className="hover:text-blue-400 transition-colors">Portfolio</a></li>
                <li><a href="/learning" className="hover:text-blue-400 transition-colors">Learning</a></li>
                <li><a href="/news" className="hover:text-blue-400 transition-colors">News</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-blue-400">Support</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 CoinPlatform. All rights reserved. Secure • Professional • Trusted</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
