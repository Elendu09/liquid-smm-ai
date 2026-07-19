import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { solutions } from "@/config/solutions";

interface SolutionsGridProps {
  heading?: boolean;
  limit?: number;
}

export function SolutionsGrid({ heading = true, limit }: SolutionsGridProps) {
  const items = typeof limit === "number" ? solutions.slice(0, limit) : solutions;

  return (
    <section id="solutions" className="py-20 lg:py-28 bg-background border-y border-white/5">
      <div className="container mx-auto px-4">
        {heading && (
          <div className="grid lg:grid-cols-12 gap-10 mb-14 items-end">
            <div className="lg:col-span-7">
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">— Solutions</p>
              <h2 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
                Solutions for your <span className="italic text-primary">social media.</span>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:pl-8 lg:border-l lg:border-white/10">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Every solution ships with ready-made applications, templates, and playbooks you can put to work today.
              </p>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {items.map((s) => (
            <article
              key={s.id}
              className="group relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-white/[0.04]"
            >
              <div className="w-11 h-11 rounded-full border border-white/15 bg-primary/10 flex items-center justify-center text-primary mb-6">
                <s.icon className="w-5 h-5" />
              </div>
              <h3 className="font-['Instrument_Serif'] text-3xl leading-tight mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{s.description}</p>

              <ul className="flex flex-wrap gap-2 mb-6" aria-label="Included assets">
                <li className="text-[10px] uppercase tracking-[0.15em] font-semibold px-2.5 py-1 rounded-full border border-white/10 text-muted-foreground">
                  {s.applications} Apps
                </li>
                <li className="text-[10px] uppercase tracking-[0.15em] font-semibold px-2.5 py-1 rounded-full border border-white/10 text-muted-foreground">
                  {s.templates} Templates
                </li>
                <li className="text-[10px] uppercase tracking-[0.15em] font-semibold px-2.5 py-1 rounded-full border border-white/10 text-muted-foreground">
                  {s.blogPosts} Posts
                </li>
              </ul>

              <Link
                to={s.ctaHref}
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-primary hover:gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                {s.ctaLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
