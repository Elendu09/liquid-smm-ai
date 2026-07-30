import { Link } from "react-router-dom";
import { Rocket, Sparkles, Send, Palette, Users, LifeBuoy, ArrowRight } from "lucide-react";

const pillars = [
  { icon: Rocket, eyebrow: "Pillar 01", title: "Fast, friendly onboarding", description: "Connect every account, learn the ropes with a guided tour, and ship your first post in under five minutes.", ctaLabel: "Start the tour", href: "/dashboard" },
  { icon: Sparkles, eyebrow: "Pillar 02", title: "Stunning content, tailored to you", description: "SkyRank AI learns your brand, audience, and style — then generates scroll-stopping captions, hashtags, and visuals on demand.", ctaLabel: "Open AI Studio", href: "/dashboard/create/ai" },
  { icon: Send, eyebrow: "Pillar 03", title: "One-click, multi-platform posting", description: "Publish and schedule to Facebook, Instagram, LinkedIn, X, Google Business, TikTok, YouTube — from a single composer.", ctaLabel: "Open scheduler", href: "/dashboard/publish/queue" },
  { icon: Palette, eyebrow: "Pillar 04", title: "Customize like a pro", description: "Swap images, tweak captions, and remix professionally designed presets — every post looks unmistakably yours.", ctaLabel: "Browse templates", href: "/dashboard/library/presets" },
  { icon: Users, eyebrow: "Pillar 05", title: "Team collaboration", description: "Invite teammates, set granular roles and approvals, and keep every campaign moving without the group-chat chaos.", ctaLabel: "Manage team", href: "/dashboard/team" },
  { icon: LifeBuoy, eyebrow: "Pillar 06", title: "Always-on support", description: "Real humans, 24/7. Reach us from the in-app Help widget or email support with an average first reply under an hour.", ctaLabel: "Contact support", href: "/dashboard/support" },
];

export function PillarsSection() {
  return (
    <section id="pillars" className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">— Why teams pick SMMSAAS</p>
          <h2 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
            Six pillars. <span className="italic text-rainbow">One</span> unfair advantage.
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground">
            Every promise below is wired to a real surface in the app — click through to see it live.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {pillars.map((p) => (
            <Link
              key={p.title}
              to={p.href}
              className="group relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-11 h-11 rounded-full border border-white/15 bg-primary/10 flex items-center justify-center text-primary">
                  <p.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                  {p.eyebrow}
                </span>
              </div>
              <h3 className="font-['Instrument_Serif'] text-3xl leading-tight mb-3">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{p.description}</p>
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-primary">
                {p.ctaLabel}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
