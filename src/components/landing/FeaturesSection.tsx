import { Zap, Globe, BarChart, Clock, Shield, Smartphone, RefreshCw, Layers } from "lucide-react";

const features = [
  { icon: Zap, title: "AI-Powered Automation", description: "Advanced AI generates content, suggests optimal times, and automates repetitive tasks." },
  { icon: Globe, title: "Cross-Platform Support", description: "Manage Instagram, X, LinkedIn, Facebook, TikTok, and YouTube from one dashboard." },
  { icon: BarChart, title: "Real-time Analytics", description: "Track engagement, followers, and ROI with live-updating dashboards and reports." },
  { icon: Clock, title: "Smart Scheduling", description: "AI analyzes your audience to suggest the best posting times for maximum engagement." },
  { icon: Shield, title: "Safe & Compliant", description: "Stay within platform guidelines with smart rate limiting and human-like behavior." },
  { icon: Smartphone, title: "Mobile Optimized", description: "Manage your accounts on the go with our fully responsive mobile interface." },
  { icon: RefreshCw, title: "24/7 Operation", description: "Your automation runs around the clock, engaging with your audience while you sleep." },
  { icon: Layers, title: "Bulk Actions", description: "Schedule, edit, or delete hundreds of posts at once with powerful bulk operations." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-background border-y border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-10 mb-16 items-end">
          <div className="lg:col-span-7">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">— Key features</p>
            <h2 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
              Built for <span className="italic text-primary">modern</span> marketers.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-8 lg:border-l lg:border-white/10">
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Every feature is designed to save you time and maximize your social media impact — at any scale.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/10">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-background/80 p-8 transition-colors hover:bg-white/[0.03]"
            >
              <div className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/10 transition-colors">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-['Instrument_Serif'] text-2xl leading-tight mb-3">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
