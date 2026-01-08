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

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <Hero />
        
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
    </div>
  );
};

export default Index;
