import { Link } from "react-router-dom";
import {
  Rocket,
  Sparkles,
  Send,
  Palette,
  Users,
  LifeBuoy,
  ArrowRight,
} from "lucide-react";

const pillars = [
  {
    icon: Rocket,
    eyebrow: "Pillar 01",
    title: "Fast, Friendly Onboarding",
    description:
      "Connect every account, learn the ropes with a guided tour, and ship your first post in under five minutes.",
    ctaLabel: "Start the tour",
    href: "/dashboard",
    accent: "from-brand-cyan/20 to-primary/10",
  },
  {
    icon: Sparkles,
    eyebrow: "Pillar 02",
    title: "Stunning Content, Tailored to You",
    description:
      "SkyRank AI learns your brand, audience, and style — then generates scroll-stopping captions, hashtags, and visuals on demand.",
    ctaLabel: "Open the AI Studio",
    href: "/dashboard/create/ai",
    accent: "from-primary/20 to-brand-green/10",
  },
  {
    icon: Send,
    eyebrow: "Pillar 03",
    title: "One-click, Multi-Platform Posting",
    description:
      "Publish and schedule to Facebook, Instagram, LinkedIn, X, Google Business, TikTok, Pinterest — from a single composer.",
    ctaLabel: "Open the scheduler",
    href: "/dashboard/publish/queue",
    accent: "from-brand-green/20 to-brand-cyan/10",
  },
  {
    icon: Palette,
    eyebrow: "Pillar 04",
    title: "Customize Like a Pro",
    description:
      "Swap images, tweak captions, and remix professionally designed presets — every post looks unmistakably yours.",
    ctaLabel: "Browse templates",
    href: "/dashboard/library/presets",
    accent: "from-brand-orange/20 to-primary/10",
  },
  {
    icon: Users,
    eyebrow: "Pillar 05",
    title: "Team Collaboration",
    description:
      "Invite teammates, set granular roles and approvals, and keep every campaign moving without the group-chat chaos.",
    ctaLabel: "Manage your team",
    href: "/dashboard/settings/team",
    accent: "from-primary/20 to-brand-orange/10",
  },
  {
    icon: LifeBuoy,
    eyebrow: "Pillar 06",
    title: "Always-On Support",
    description:
      "Real humans, 24/7. Reach us from the in-app Help widget or email support with an average first reply under an hour.",
    ctaLabel: "Contact support",
    href: "/dashboard/support",
    accent: "from-brand-cyan/20 to-brand-green/10",
  },
];

export function PillarsSection() {
  return (
    <section id="pillars" className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Why teams pick SMMSAAS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Six pillars.{" "}
            <span className="bg-gradient-to-r from-brand-cyan to-brand-green bg-clip-text text-transparent">
              One unfair advantage.
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Every promise below is wired to a real surface in the app — click through to see it live.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {pillars.map((p) => (
            <Link
              key={p.title}
              to={p.href}
              className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl p-6 lg:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div
                className={`pointer-events-none absolute -inset-px bg-gradient-to-br ${p.accent} opacity-0 group-hover:opacity-100 transition-opacity`}
                aria-hidden
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <p.icon className="w-6 h-6 text-primary" aria-hidden />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {p.eyebrow}
                  </span>
                </div>
                <h3 className="text-lg lg:text-xl font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {p.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  {p.ctaLabel}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
