import { useMemo, useState } from "react";
import { Search, Puzzle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { INTEGRATIONS, CATEGORY_LABEL, type IntegrationCategory } from "@/config/integrations";
import { IntegrationCard } from "@/components/settings/IntegrationCard";

const CATEGORIES: IntegrationCategory[] = ["ai-agents", "automation", "productivity"];

export default function Integrations() {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filter = (i: (typeof INTEGRATIONS)[number]) =>
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.tagline.toLowerCase().includes(q);
    return CATEGORIES.map((cat) => ({
      category: cat,
      items: INTEGRATIONS.filter((i) => i.category === cat && filter(i)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Puzzle className="w-3.5 h-3.5" /> Integrations
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Extend SkyRank with agents and integrations
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Bring SkyRank into your favorite AI assistants and workflow tools through the Model Context Protocol.
          Every integration acts on your behalf using your connected channels and content.
        </p>
        <div className="relative max-w-sm pt-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search integrations…"
            className="pl-9 h-10 bg-card/60 border-border/60"
          />
        </div>
      </header>

      <div className="space-y-10">
        {grouped.map((g) => (
          <section key={g.category} className="space-y-3">
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground/80">
              {CATEGORY_LABEL[g.category]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {g.items.map((i) => (
                <IntegrationCard key={i.slug} integration={i} />
              ))}
            </div>
          </section>
        ))}
        {grouped.length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">
            No integrations match "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
