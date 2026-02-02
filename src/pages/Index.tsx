import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ModulesSection from "@/components/ModulesSection";
import GamificationSection from "@/components/GamificationSection";
import LabsSection from "@/components/LabsSection";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <section id="modulos">
          <ModulesSection />
        </section>
        <section id="ranking">
          <GamificationSection />
        </section>
        <section id="labs">
          <LabsSection />
        </section>
        <section id="precos">
          <PricingSection />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
