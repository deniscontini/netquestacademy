import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CoursesSection from "@/components/CoursesSection";
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
        <section id="cursos">
          <CoursesSection />
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
