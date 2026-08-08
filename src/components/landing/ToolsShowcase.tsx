import { Link } from "react-router-dom";
import { Zap, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tools } from "@/data/tools";
import { cn } from "@/lib/utils";

/**
 * ToolsShowcase
 *
 * The grid on the marketing /tools page. Each card shows a real
 * screenshot, the headline, and a "Try now" link that takes the
 * visitor to the tool's detail page (/tools/:slug) — not deep into
 * the dashboard. The detail page explains what the tool does and
 * routes to the dashboard only when the user clicks "Get started".
 */
export function ToolsShowcase() {
  return (
    <section id="tools" className="py-20 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-x-0 top-1/3 h-96 bg-primary/5 blur-[120px] -z-10" aria-hidden />
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">— Powerful tools</p>
          <h2 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
            Your complete <span className="italic text-rainbow">SMM toolkit.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground">
            Everything you need to manage, grow, and analyze your social media presence — all in one place.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <article
                key={t.slug}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-white/[0.04]"
              >
                <Link to={`/tools/${t.slug}`} className="relative block aspect-[16/10] overflow-hidden">
                  <img
                    src={t.screenshot}
                    alt={t.screenshotAlt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <span className="grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-background/80 text-primary backdrop-blur">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="rounded-full border border-white/10 bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground backdrop-blur">
                      {t.badge}
                    </span>
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-['Instrument_Serif'] text-2xl leading-tight">{t.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{t.tagline}</p>
                  <ul className="mt-4 space-y-1.5">
                    {t.features.slice(0, 3).map((f) => (
                      <li key={f.title} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <Zap className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        {f.title}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`/tools/${t.slug}`}
                    className={cn(
                      "mt-5 inline-flex items-center gap-1.5 self-start rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground transition-all hover:border-primary/40 hover:text-primary",
                    )}
                  >
                    Try now
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="text-center mt-16">
          <Link to="/signup">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/15 bg-white/5 px-8 h-12 text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-white/10"
            >
              <Clock className="w-4 h-4 mr-2" />
              Start your free trial
            </Button>
          </Link>
          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
            Every tool ships with a real screenshot and a one-click setup.
          </p>
        </div>
      </div>
    </section>
  );
}
