import { Users, Calendar, Heart, Clock, Star, TrendingUp } from "lucide-react";

const stats = [
  { icon: Users, value: "50K+", label: "Active users", description: "Marketers trust SMMSAAS" },
  { icon: Calendar, value: "10M+", label: "Posts scheduled", description: "And counting every day" },
  { icon: Heart, value: "500M+", label: "Engagements", description: "Likes, comments & shares" },
  { icon: Clock, value: "99.9%", label: "Uptime", description: "Always running for you" },
];

const testimonials = [
  { quote: "SMMSAAS saved me 20+ hours per week. The AI captions are incredibly accurate and engaging.", author: "Sarah Johnson", role: "Content Creator", avatar: "SJ", rating: 5 },
  { quote: "Managing 15 client accounts was a nightmare until we found SMMSAAS. Game changer.", author: "Mike Chen", role: "Agency Owner", avatar: "MC", rating: 5 },
  { quote: "Our engagement rate increased by 340% in just 3 months. The ROI is incredible.", author: "Emily Davis", role: "Marketing Director", avatar: "ED", rating: 5 },
];

export function StatsSection() {
  return (
    <section className="py-20 lg:py-32 bg-background border-y border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/10 mb-24">
          {stats.map((s) => (
            <div key={s.label} className="bg-background/80 p-10 text-center">
              <div className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-primary mx-auto mb-6">
                <s.icon className="w-5 h-5" />
              </div>
              <div className="font-['Instrument_Serif'] text-5xl lg:text-6xl leading-none text-foreground mb-2">
                {s.value}
              </div>
              <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-foreground mb-2">
                {s.label}
              </div>
              <div className="text-xs text-muted-foreground">{s.description}</div>
            </div>
          ))}
        </div>

        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">— Testimonials</p>
          <h2 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
            Loved by <span className="italic text-primary">thousands.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 hover:border-primary/40 transition-colors"
            >
              <div className="flex gap-1 mb-6">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-primary fill-primary" />
                ))}
              </div>
              <p className="font-['Instrument_Serif'] text-2xl leading-snug text-foreground mb-8">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-6 border-t border-white/10">
                <div className="w-11 h-11 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-semibold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.author}</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-foreground">
              Join 50K+ marketers growing with SMMSAAS
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
