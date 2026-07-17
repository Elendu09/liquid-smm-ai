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
    <section id="solutions" className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        {heading && (
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-sm font-medium text-primary uppercase tracking-wider">
              Solutions
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
              Solutions for your{" "}
              <span className="bg-gradient-to-r from-brand-cyan to-brand-green bg-clip-text text-transparent">
                social media
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Every solution ships with ready-made applications, templates, and playbooks.
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {items.map((s) => (
            <article
              key={s.id}
              className="group relative flex flex-col rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl p-6 lg:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <s.icon className="w-6 h-6 text-primary" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
                {s.description}
              </p>

              <ul className="flex flex-wrap gap-2 mb-5" aria-label="Included assets">
                <li className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {s.applications} Applications
                </li>
                <li className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green">
                  {s.templates} Templates
                </li>
                <li className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan">
                  {s.blogPosts} Blog posts
                </li>
              </ul>

              <Link
                to={s.ctaHref}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                {s.ctaLabel}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
