import { 
  Zap, 
  Globe, 
  BarChart, 
  Clock, 
  Shield, 
  Smartphone,
  RefreshCw,
  Layers
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Automation",
    description: "Advanced AI generates content, suggests optimal times, and automates repetitive tasks.",
  },
  {
    icon: Globe,
    title: "Cross-Platform Support",
    description: "Manage Instagram, Twitter, LinkedIn, Facebook, TikTok, and YouTube from one dashboard.",
  },
  {
    icon: BarChart,
    title: "Real-time Analytics",
    description: "Track engagement, followers, and ROI with live updating dashboards and reports.",
  },
  {
    icon: Clock,
    title: "Smart Scheduling",
    description: "AI analyzes your audience to suggest the best posting times for maximum engagement.",
  },
  {
    icon: Shield,
    title: "Safe & Compliant",
    description: "Stay within platform guidelines with smart rate limiting and human-like behavior patterns.",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Manage your accounts on the go with our fully responsive mobile interface.",
  },
  {
    icon: RefreshCw,
    title: "24/7 Operation",
    description: "Your automation runs around the clock, engaging with your audience while you sleep.",
  },
  {
    icon: Layers,
    title: "Bulk Actions",
    description: "Schedule, edit, or delete hundreds of posts at once with powerful bulk operations.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Key Features</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Built for{" "}
            <span className="bg-gradient-to-r from-brand-cyan to-brand-green bg-clip-text text-transparent">
              Modern Marketers
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Every feature is designed to save you time and maximize your social media impact.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
