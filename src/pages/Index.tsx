import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { ToolsShowcase } from "@/components/landing/ToolsShowcase";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { WhatWeOffer } from "@/components/landing/WhatWeOffer";
import { StatsSection } from "@/components/landing/StatsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { PillarsSection } from "@/components/landing/PillarsSection";
import { SolutionsGrid } from "@/components/landing/SolutionsGrid";
import { AnimatedStatsBanner } from "@/components/landing/AnimatedStatsBanner";
import { CookieBanner } from "@/components/shared/CookieBanner";
import { useAuthUser } from "@/hooks/useAuthUser";

const Index = () => {
  const navigate = useNavigate();
  const { user, isGuest, loading } = useAuthUser();
  // Signed-in users land here after OAuth / email-confirmation redirects to the
  // origin. Send them to their dashboard instead of the marketing homepage.
  useEffect(() => {
    if (!loading && user && !isGuest) navigate("/dashboard", { replace: true });
  }, [user, isGuest, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <Hero />

        {/* Animated Stats Banner */}
        <AnimatedStatsBanner />

        {/* Services Section */}
        <section id="services">
          <ServicesSection />
        </section>

        
        {/* Tools Showcase */}
        <section id="tools">
          <ToolsShowcase />
        </section>
        
        {/* Features Section */}
        <section id="features">
          <FeaturesSection />
        </section>
        
        {/* Value pillars */}
        <PillarsSection />

        {/* Solutions grid */}
        <SolutionsGrid limit={6} />

        {/* What We Offer */}
        <WhatWeOffer />
        
        
        {/* Stats/Social Proof */}
        <StatsSection />
        
        {/* FAQ Section */}
        <section id="faq">
          <FAQSection />
        </section>
        
        {/* CTA Section */}
        <CTASection />
      </main>
      
      <Footer />
      <CookieBanner />
    </div>
  );
};

export default Index;
