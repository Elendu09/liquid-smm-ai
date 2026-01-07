import { HeroSection } from "@/components/automation/HeroSection";
import { AICaptionGenerator } from "@/components/automation/AICaptionGenerator";
import { SmartPostScheduler } from "@/components/automation/SmartPostScheduler";
import { AutoEngagementBot } from "@/components/automation/AutoEngagementBot";
import { GrowthAnalytics } from "@/components/automation/GrowthAnalytics";
import { Sparkles, Calendar, Bot, TrendingUp, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Automation Tools Section */}
      <section className="py-20 px-4">
        <div className="container max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Automation Suite
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Powerful Tools for <span className="text-gradient">Growth</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to automate, schedule, and scale your social media presence.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="space-y-8">
            {/* AI Caption Generator */}
            <div id="caption-generator" className="scroll-mt-20">
              <AICaptionGenerator />
            </div>

            {/* Smart Post Scheduler */}
            <div id="scheduler" className="scroll-mt-20">
              <SmartPostScheduler />
            </div>

            {/* Auto-Engagement Bot */}
            <div id="engagement-bot" className="scroll-mt-20">
              <AutoEngagementBot />
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-20 px-4 bg-secondary/20">
        <div className="container max-w-7xl mx-auto">
          <GrowthAnalytics />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 glow-blue-intense">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to <span className="text-gradient-blue-purple">Automate</span> Your Growth?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of creators and businesses who have transformed their social media strategy with HOME OF SMM.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl glow-blue transition-all">
                Get Started Free
              </button>
              <button className="px-8 py-4 border border-border hover:bg-secondary font-semibold rounded-xl transition-all">
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © 2026 HOME OF SMM. All rights reserved. Powered by AI Automation.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
