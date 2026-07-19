import { Link } from "react-router-dom";
import { Sparkles, Calendar, Bot, BarChart3, Hash, MessageSquare, ArrowRight, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const tools = [
  { icon: Sparkles, title: "AI Caption Generator", description: "Generate viral-worthy captions with one click.", features: ["Multiple tones", "Platform optimization", "Hashtag suggestions"], badge: "AI Powered", href: "/dashboard/caption-generator" },
  { icon: Calendar, title: "Smart Scheduler", description: "Plan and schedule content across all platforms.", features: ["Optimal time suggestions", "Calendar view", "Bulk scheduling"], badge: "Time Saver", href: "/dashboard/scheduler" },
  { icon: Bot, title: "Engagement Bot", description: "Automate interactions to grow organically.", features: ["Auto likes", "Smart comments", "Follow/Unfollow"], badge: "24/7 Active", href: "/dashboard/engagement-bot" },
  { icon: BarChart3, title: "Growth Analytics", description: "Track performance with detailed insights.", features: ["Real-time data", "ROI tracking", "Competitor analysis"], badge: "Real-time", href: "/dashboard/analytics" },
  { icon: Hash, title: "Hashtag Research", description: "Find the best hashtags for maximum reach.", features: ["Trending tags", "Competition scores", "Copy to clipboard"], badge: "Research", href: "/dashboard/hashtag-research" },
  { icon: MessageSquare, title: "Comment Manager", description: "Manage all comments from one dashboard.", features: ["AI replies", "Bulk actions", "Sentiment analysis"], badge: "AI Powered", href: "/dashboard/comment-manager" },
];

export function ToolsShowcase() {
  return (
    <section id="tools" className="py-20 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-x-0 top-1/3 h-96 bg-primary/5 blur-[120px] -z-10" aria-hidden />
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">— Powerful tools</p>
          <h2 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
            Your complete <span className="italic text-primary">SMM toolkit.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground">
            Everything you need to manage, grow, and analyze your social media presence — all in one place.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((t) => (
            <article
              key={t.title}
              className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-full border border-white/15 bg-primary/10 flex items-center justify-center text-primary">
                  <t.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.18em] font-semibold px-3 py-1 rounded-full border border-white/10 text-muted-foreground">
                  {t.badge}
                </span>
              </div>

              <h3 className="font-['Instrument_Serif'] text-3xl leading-tight mb-2">{t.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t.description}</p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to={t.href}
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-primary hover:gap-3 transition-all"
              >
                Try now
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </article>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link to="/dashboard">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/15 bg-white/5 px-8 h-12 text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-white/10"
            >
              <Clock className="w-4 h-4 mr-2" />
              Start your free trial
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
