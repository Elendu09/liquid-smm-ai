import { Check, Sparkles, Rocket, Crown } from "lucide-react";

const offerings = [
  {
    icon: Sparkles,
    title: "For Content Creators",
    description: "Focus on creating amazing content while we handle the rest.",
    features: [
      "AI-generated captions that match your voice",
      "Automated cross-platform posting",
      "Hashtag optimization for discovery",
      "Engagement analytics and insights",
      "Comment management with AI replies",
    ],
    color: "from-brand-blue to-brand-cyan",
  },
  {
    icon: Rocket,
    title: "For Marketing Agencies",
    description: "Scale your social media services without scaling your team.",
    features: [
      "Multi-client dashboard management",
      "White-label reporting options",
      "Team collaboration tools",
      "Bulk scheduling across accounts",
      "Custom branding for client portals",
    ],
    color: "from-brand-purple to-brand-pink",
  },
  {
    icon: Crown,
    title: "For Businesses",
    description: "Build brand awareness and drive conversions on autopilot.",
    features: [
      "Consistent brand voice across platforms",
      "ROI tracking and conversion metrics",
      "Competitor analysis and benchmarking",
      "Lead generation through engagement",
      "Customer support via social channels",
    ],
    color: "from-brand-orange to-brand-green",
  },
];

export function WhatWeOffer() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">What We Offer</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Tailored Solutions for{" "}
            <span className="bg-gradient-to-r from-brand-orange to-brand-pink bg-clip-text text-transparent">
              Every Need
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're a solo creator or a large agency, we have the tools to accelerate your growth.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {offerings.map((offering) => (
            <div
              key={offering.title}
              className="relative group overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
            >
              {/* Header */}
              <div className={`p-8 bg-gradient-to-br ${offering.color}`}>
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                  <offering.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{offering.title}</h3>
                <p className="text-white/80">{offering.description}</p>
              </div>

              {/* Features */}
              <div className="p-8">
                <ul className="space-y-4">
                  {offering.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
