
import Navbar from "@/components/Navbar";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { LoadingScreen } from "@/components/landing/LoadingScreen";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { WhyChooseSection } from "@/components/landing/WhyChooseSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";

const Landing = () => {
  const { loading, showContinue, handleContinue } = useAuthRedirect();

  if (loading) {
    return <LoadingScreen showContinue={showContinue} onContinue={handleContinue} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <WhyChooseSection />
        <FinalCTASection />
      </main>
    </div>
  );
};

export default Landing;
