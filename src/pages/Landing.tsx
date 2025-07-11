
import Navbar from "@/components/Navbar";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { LoadingScreen } from "@/components/landing/LoadingScreen";
import { HeroSection } from "@/components/landing/HeroSection";
import { AnimatedFeatureCards } from "@/components/landing/AnimatedFeatureCards";
import { ConnectingSection } from "@/components/landing/ConnectingSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { WhyChooseSection } from "@/components/landing/WhyChooseSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";

const Landing = () => {
  const { loading, showContinue, handleContinue } = useAuthRedirect(true);

  if (loading) {
    return <LoadingScreen showContinue={showContinue} onContinue={handleContinue} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <Navbar />
      
      <main className="relative">
        <HeroSection />
        <AnimatedFeatureCards />
        <ConnectingSection />
        <StatsSection />
        <WhyChooseSection />
        <FinalCTASection />
      </main>
    </div>
  );
};

export default Landing;
