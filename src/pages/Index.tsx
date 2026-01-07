import { StickyNavigation } from "@/components/automation/StickyNavigation";
import { HeroSection } from "@/components/automation/HeroSection";
import { AICaptionGenerator } from "@/components/automation/AICaptionGenerator";
import { SmartPostScheduler } from "@/components/automation/SmartPostScheduler";
import { AutoEngagementBot } from "@/components/automation/AutoEngagementBot";
import { HashtagResearchTool } from "@/components/automation/HashtagResearchTool";
import { CommentManager } from "@/components/automation/CommentManager";
import { GrowthAnalytics } from "@/components/automation/GrowthAnalytics";
import { AIAssistantWidget } from "@/components/automation/AIAssistantWidget";
import { Sparkles, Calendar, Bot, TrendingUp, Zap, Hash, MessageCircle, Rocket, CheckCircle2, ArrowRight } from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI-Powered", description: "Smart algorithms that learn and adapt" },
  { icon: Zap, title: "Lightning Fast", description: "Real-time automation and instant results" },
  { icon: CheckCircle2, title: "100% Safe", description: "Compliant with all platform guidelines" },
  { icon: Rocket, title: "10x Growth", description: "Proven results from 50,000+ users" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation */}
      <StickyNavigation />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Banner */}
      <section className="py-12 px-4 border-y border-border bg-secondary/30">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-secondary/50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            <div id="caption-generator" className="scroll-mt-24">
              <AICaptionGenerator />
            </div>

            {/* Smart Post Scheduler */}
            <div id="scheduler" className="scroll-mt-24">
              <SmartPostScheduler />
            </div>

            {/* Auto-Engagement Bot */}
            <div id="engagement-bot" className="scroll-mt-24">
              <AutoEngagementBot />
            </div>

            {/* Hashtag Research Tool */}
            <div id="hashtag-tool" className="scroll-mt-24">
              <HashtagResearchTool />
            </div>

            {/* Comment Manager */}
            <div id="comment-manager" className="scroll-mt-24">
              <CommentManager />
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics" className="py-20 px-4 bg-secondary/20 scroll-mt-24">
        <div className="container max-w-7xl mx-auto">
          <GrowthAnalytics />
        </div>
      </section>

      {/* Testimonials/Stats Section */}
      <section className="py-20 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by <span className="text-gradient-blue-purple">50,000+</span> Creators
            </h2>
            <p className="text-muted-foreground">Join the community of successful social media managers</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { value: "50K+", label: "Active Users", color: "text-primary" },
              { value: "10M+", label: "Posts Scheduled", color: "text-brand-purple" },
              { value: "500M+", label: "Engagements", color: "text-brand-green" },
              { value: "99.9%", label: "Uptime", color: "text-brand-orange" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-8 text-center hover-lift">
                <p className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2`}>{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 md:p-16 glow-blue-intense relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-brand-purple/5 to-brand-cyan/5" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-6">
                <Rocket className="h-4 w-4" />
                Start for Free
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to <span className="text-gradient-blue-purple">Automate</span> Your Growth?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of creators and businesses who have transformed their social media strategy with HOME OF SMM.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-10 py-5 bg-gradient-to-r from-primary to-brand-purple hover:opacity-90 text-white font-bold rounded-xl glow-blue transition-all flex items-center justify-center gap-2 group">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button className="px-10 py-5 border border-border hover:bg-secondary font-semibold rounded-xl transition-all">
                  View Pricing
                </button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-6">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-primary to-brand-purple">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold">HOME OF SMM</h3>
                <p className="text-xs text-muted-foreground">Automation Suite 2026</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Features</a>
              <a href="#" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2026 HOME OF SMM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* AI Assistant Widget */}
      <AIAssistantWidget />
    </div>
  );
};

export default Index;
