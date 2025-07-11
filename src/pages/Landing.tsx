
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
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-100 to-white">
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
    </div>
  );
};

export default Landing;
