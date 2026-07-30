import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ChevronRight, Search, Sparkles, Workflow, LineChart } from "lucide-react";
import { solutions } from "@/config/solutions";

const stats = [
  { value: `${solutions.length}`, label: "Ready-made solutions" },
  {
    value: `${solutions.reduce((n, s) => n + s.applications, 0)}`,
    label: "Applications included",
  },
  {
    value: `${solutions.reduce((n, s) => n + s.templates, 0)}`,
    label: "Templates to remix",
  },
  { value: "14", label: "Connected platforms" },
];

const steps = [
  {
    icon: Sparkles,
    title: "Pick a solution",
    body: "Start from a playbook built for a real outcome — sharing, research, replies or reporting.",
  },
  {
    icon: Workflow,
    title: "Connect and configure",
    body: "Link your channels once, then tune tone, cadence and approval rules to match your team.",
  },
  {
    icon: LineChart,
    title: "Run and measure",
    body: "Automations run on schedule while analytics track lift against your baseline.",
  },
];

export default function SolutionsPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return solutions;
    return solutions.filter(
      (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
    );
  }, [query]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: solutions.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.title,
      description: s.description,
      url: `https://liquid-smm-ai.lovable.app${s.ctaHref}`,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-16 pb-14 lg:pt-24 lg:pb-20 border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[120px]"
          />
          <div className="container relative mx-auto px-4">
            <div className="grid lg:grid-cols-12 gap-10 items-end">
              <div className="lg:col-span-7">
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">
                  — Solutions
                </p>
                <h1 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
                  A solution for every{" "}
                  <span className="italic text-rainbow">social workflow.</span>
                </h1>
              </div>
              <div className="lg:col-span-5 lg:pl-8 lg:border-l lg:border-border">
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                  {solutions.length} ready-to-run playbooks — from autopilot sharing to sentiment
                  monitoring — each wired to the automation tools inside SMMSAAS.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link to="/signup">
                    <Button size="lg" className="rounded-full px-6 text-[11px] uppercase tracking-[0.2em] font-semibold">
                      Start free
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                  <a href="#solutions">
                    <Button variant="outline" size="lg" className="rounded-full px-6 text-[11px] uppercase tracking-[0.2em]">
                      Browse solutions
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4">
            <dl className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
              {stats.map((s) => (
                <div key={s.label} className="px-4 py-8 first:pl-0 text-center lg:text-left">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-['Instrument_Serif'] text-4xl lg:text-5xl leading-none">
                    {s.value}
                  </dd>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Grid + search */}
        <section id="solutions" className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
              <h2 className="font-['Instrument_Serif'] text-3xl sm:text-4xl leading-tight">
                Browse all solutions
              </h2>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search solutions…"
                  aria-label="Search solutions"
                  className="pl-9 rounded-full bg-card/60"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="text-muted-foreground py-16 text-center">
                No solutions match “{query}”. Try a different keyword.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {filtered.map((s) => (
                  <article
                    key={s.id}
                    className="group relative flex flex-col rounded-3xl border border-border bg-card/40 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/70"
                  >
                    <div className="w-11 h-11 rounded-full border border-border bg-primary/10 flex items-center justify-center text-primary mb-6">
                      <s.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-['Instrument_Serif'] text-3xl leading-tight mb-3">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                      {s.description}
                    </p>

                    <ul className="flex flex-wrap gap-2 mb-6" aria-label="Included assets">
                      {[
                        `${s.applications} Apps`,
                        `${s.templates} Templates`,
                        `${s.blogPosts} Posts`,
                      ].map((t) => (
                        <li
                          key={t}
                          className="text-[10px] uppercase tracking-[0.15em] font-semibold px-2.5 py-1 rounded-full border border-border text-muted-foreground"
                        >
                          {t}
                        </li>
                      ))}
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
            )}
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 lg:py-24 border-y border-border bg-card/20">
          <div className="container mx-auto px-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">
              — How it works
            </p>
            <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl leading-tight mb-12 max-w-2xl">
              Live in minutes, not quarters.
            </h2>
            <ol className="grid md:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-3xl border border-border bg-background/60 p-8"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      0{i + 1}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <step.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-['Instrument_Serif'] text-2xl mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl lg:text-6xl leading-[1.02] mb-6">
              Put a solution to work <span className="italic text-rainbow">today.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Every plan includes the full solution library, AI credits and unlimited scheduling
              across all connected channels.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="rounded-full px-7 text-[11px] uppercase tracking-[0.2em] font-semibold">
                  Get started free
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="rounded-full px-7 text-[11px] uppercase tracking-[0.2em]">
                  See pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
