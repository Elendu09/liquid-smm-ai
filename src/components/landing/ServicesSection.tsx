import { Sparkles, Calendar, Bot, BarChart3, Hash, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  { icon: Sparkles, title: "AI Caption Generation", description: "Generate engaging, platform-optimized captions in seconds with our advanced AI. Supports multiple tones and styles.", href: "/dashboard/caption-generator" },
  { icon: Calendar, title: "Smart Post Scheduling", description: "Schedule posts across all platforms with AI-suggested optimal posting times for maximum engagement.", href: "/dashboard/scheduler" },
  { icon: Bot, title: "Auto Engagement Bot", description: "Automatically like, comment, and follow to grow your audience while maintaining authentic interactions.", href: "/dashboard/engagement-bot" },
  { icon: BarChart3, title: "Growth Analytics", description: "Track followers, engagement rates, and ROI across platforms with beautiful, actionable dashboards.", href: "/dashboard/analytics" },
  { icon: Hash, title: "Hashtag Research", description: "Discover trending hashtags with competition scores and growth metrics to boost your reach.", href: "/dashboard/hashtag-research" },
  { icon: MessageSquare, title: "Comment Management", description: "Manage all comments with AI-suggested replies and bulk actions to save hours of work.", href: "/dashboard/comment-manager" },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-20 lg:py-32 bg-background border-y border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-10 mb-16 items-end">
          <div className="lg:col-span-7">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">— Our services</p>
            <h2 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-foreground">
              Everything you need to <span className="italic text-rainbow">dominate</span> social media.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-8 lg:border-l lg:border-white/10">
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Comprehensive tools designed to save you time and amplify your social media presence across every platform that matters.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/10">
          {services.map((s) => (
            <Link
              key={s.title}
              to={s.href}
              className="group relative bg-background/80 backdrop-blur-xl p-8 lg:p-10 transition-colors hover:bg-white/[0.03] focus-visible:outline-none"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-primary">
                  <s.icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-1" />
              </div>
              <h3 className="font-['Instrument_Serif'] text-3xl leading-tight mb-3 text-foreground">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
