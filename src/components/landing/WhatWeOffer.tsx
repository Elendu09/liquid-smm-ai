import { Check, Sparkles, Rocket, Crown } from "lucide-react";

const offerings = [
  {
    icon: Sparkles,
    label: "01 · Creators",
    title: "For content creators",
    description: "Focus on creating amazing content while we handle the rest.",
    features: [
      "AI-generated captions that match your voice",
      "Automated cross-platform posting",
      "Hashtag optimization for discovery",
      "Engagement analytics and insights",
      "Comment management with AI replies",
    ],
  },
  {
    icon: Rocket,
    label: "02 · Agencies",
    title: "For marketing agencies",
    description: "Scale your social media services without scaling your team.",
    features: [
      "Multi-client dashboard management",
      "White-label reporting options",
      "Team collaboration tools",
      "Bulk scheduling across accounts",
      "Custom branding for client portals",
    ],
  },
  {
    icon: Crown,
    label: "03 · Businesses",
    title: "For businesses",
    description: "Build brand awareness and drive conversions on autopilot.",
    features: [
      "Consistent brand voice across platforms",
      "ROI tracking and conversion metrics",
      "Competitor analysis and benchmarking",
      "Lead generation through engagement",
      "Customer support via social channels",
    ],
  },
];

export function WhatWeOffer() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">— What we offer</p>
          <h2 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
            Tailored solutions for <span className="italic text-primary">every</span> need.
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground">
            Whether you're a solo creator or a large agency, we have the tools to accelerate your growth.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {offerings.map((o) => (
            <div
              key={o.title}
              className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden hover:border-primary/40 transition-colors"
            >
              <div className="p-8 border-b border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-11 h-11 rounded-full border border-white/15 bg-primary/10 flex items-center justify-center text-primary">
                    <o.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                    {o.label}
                  </span>
                </div>
                <h3 className="font-['Instrument_Serif'] text-3xl leading-tight mb-3">{o.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{o.description}</p>
              </div>
              <ul className="p-8 space-y-4 flex-1">
                {o.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
