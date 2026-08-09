import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Seo } from "@/components/shared/Seo";
import { changelogEntries, type ChangelogKind } from "@/data/changelog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wrench, Palette, ShieldCheck } from "lucide-react";

const kindMeta: Record<ChangelogKind, { label: string; icon: typeof Sparkles; cls: string }> = {
  feature: { label: "Feature", icon: Sparkles, cls: "bg-primary/10 text-primary border-primary/30" },
  fix: { label: "Fix", icon: Wrench, cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  polish: { label: "Polish", icon: Palette, cls: "bg-violet-500/10 text-violet-600 border-violet-500/30" },
  trust: { label: "Trust", icon: ShieldCheck, cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
};

function groupByMonth(entries: typeof changelogEntries) {
  const groups = new Map<string, typeof entries>();
  entries.forEach((e) => {
    const d = new Date(e.date);
    const key = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  });
  return Array.from(groups.entries());
}

export default function Changelog() {
  const grouped = groupByMonth([...changelogEntries].sort((a, b) => +new Date(b.date) - +new Date(a.date)));

  return (
    <>
      <Seo
        title="Changelog"
        description="Every fix, feature and polish we ship — grouped by month with kind badges and JSON-LD."
        canonical="/changelog"
        keywords={["changelog", "releases", "updates", "social media", "SMMSAAS"]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "SMMSAAS Changelog",
          url: "https://smmsaas.com/changelog",
          description: "Dated product updates grouped by month.",
          hasPart: changelogEntries.map((e) => ({
            "@type": "BlogPosting",
            headline: e.title,
            datePublished: e.date,
            keywords: e.kind,
            description: e.summary,
          })),
        }}
      />
      <div className="min-h-dvh bg-background text-foreground">
        <Navbar />
        <header className="border-b border-border/60">
          <div className="container mx-auto px-4 pt-28 pb-12 lg:pt-36 lg:pb-16">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">— Changelog</p>
            <h1 className="font-['Instrument_Serif'] text-5xl sm:text-6xl mt-4 leading-[0.95] tracking-tight">
              What's <span className="italic text-rainbow">new.</span>
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground leading-relaxed">
              Every competitive fix we ship, dated and grouped by month. Filter by kind: feature, fix, polish, or trust.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {(Object.keys(kindMeta) as ChangelogKind[]).map((k) => {
                const m = kindMeta[k];
                const Icon = m.icon;
                return (
                  <span key={k} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${m.cls}`}>
                    <Icon className="h-3 w-3" /> {m.label}
                  </span>
                );
              })}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-10 lg:py-14">
          <div className="max-w-3xl space-y-10">
            {grouped.map(([month, items]) => (
              <section key={month} className="space-y-4">
                <h2 className="font-['Instrument_Serif'] text-2xl sticky top-0 bg-background/80 backdrop-blur py-2 z-10 border-b border-border/40">{month}</h2>
                <ul className="space-y-3">
                  {items.map((e) => {
                    const m = kindMeta[e.kind];
                    const Icon = m.icon;
                    return (
                      <li key={e.id} className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 hover:border-primary/30 transition-colors">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${m.cls}`}>
                            <Icon className="h-3 w-3" /> {m.label}
                          </span>
                          <span className="text-muted-foreground">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          {e.tags?.map((t) => (
                            <span key={t} className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>
                          ))}
                        </div>
                        <h3 className="mt-2 font-semibold leading-snug">{e.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{e.summary}</p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link to="/" className="text-sm text-primary underline underline-offset-4">Back to home</Link>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
