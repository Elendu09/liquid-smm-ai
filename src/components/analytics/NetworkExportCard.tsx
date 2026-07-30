import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { usePlatformRollup } from "@/hooks/usePlatformRollup";
import { useScopedAccounts } from "@/hooks/useScopedAccounts";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type TemplateKey = "overview" | "growth" | "content";

const TEMPLATES: Record<TemplateKey, { label: string; description: string; columns: string[] }> = {
  overview: {
    label: "Network overview",
    description: "Followers, engagement, reach and impressions per day.",
    columns: ["day", "followers", "engagement", "reach", "impressions"],
  },
  growth: {
    label: "Growth tracking",
    description: "Follower trajectory with day-over-day delta.",
    columns: ["day", "followers", "delta", "accounts"],
  },
  content: {
    label: "Content output",
    description: "Publishing volume against reach efficiency.",
    columns: ["day", "posts", "reach", "impressions", "reach_per_post"],
  },
};

const RANGES = [7, 30, 90] as const;

/** Per-network export templates — one CSV per connected network, or all combined. */
export function NetworkExportCard() {
  const [days, setDays] = useState<number>(30);
  const [template, setTemplate] = useState<TemplateKey>("overview");
  const { rows } = usePlatformRollup(days);
  const { accounts } = useScopedAccounts();

  const byPlatform = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const r of rows) {
      const list = map.get(r.platform) ?? [];
      list.push(r);
      map.set(r.platform, list);
    }
    // Always surface connected networks, even with no rollup rows yet.
    for (const a of accounts) if (!map.has(a.platformId)) map.set(a.platformId, []);
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [rows, accounts]);

  const buildRows = (platform: string) => {
    const list = (byPlatform.find(([p]) => p === platform)?.[1] ?? [])
      .slice()
      .sort((a, b) => a.day.localeCompare(b.day));
    let prev = 0;
    return list.map((r) => {
      const delta = prev ? r.followers - prev : 0;
      prev = r.followers;
      const base: Record<string, string | number> = {
        day: r.day,
        followers: r.followers,
        engagement: Number(r.engagement).toFixed(2),
        reach: r.reach,
        impressions: r.impressions,
        posts: r.posts,
        accounts: r.accounts,
        delta,
        reach_per_post: r.posts ? Math.round(r.reach / r.posts) : 0,
      };
      return base;
    });
  };

  const download = (platform: string) => {
    const cols = TEMPLATES[template].columns;
    const data = buildRows(platform);
    if (!data.length) {
      toast({
        title: "Nothing to export yet",
        description: `No ${platform} analytics collected for the last ${days} days.`,
      });
      return;
    }
    const csv = [cols.join(","), ...data.map((d) => cols.map((c) => d[c] ?? "").join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${platform}-${template}-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export ready", description: `${platform} · ${data.length} rows` });
  };

  const downloadAll = () => {
    const cols = ["platform", ...TEMPLATES[template].columns];
    const lines: string[] = [cols.join(",")];
    for (const [platform] of byPlatform) {
      for (const d of buildRows(platform)) {
        lines.push([platform, ...TEMPLATES[template].columns.map((c) => d[c] ?? "")].join(","));
      }
    }
    if (lines.length === 1) {
      toast({ title: "Nothing to export yet", description: "Analytics are still collecting." });
      return;
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-networks-${template}-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Combined export ready", description: `${lines.length - 1} rows` });
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <header className="flex flex-col gap-3 p-4 sm:p-5 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Per-network export templates</h2>
            <p className="text-[11px] text-muted-foreground">{TEMPLATES[template].description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={template} onValueChange={(v) => setTemplate(v as TemplateKey)}>
            <SelectTrigger className="h-9 w-[170px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TEMPLATES).map(([k, t]) => (
                <SelectItem key={k} value={k}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="h-9 w-[90px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {r} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={downloadAll}>
            <Layers className="h-3.5 w-3.5 mr-1.5" /> All
          </Button>
        </div>
      </header>

      {byPlatform.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          Connect a channel to unlock network exports.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {byPlatform.map(([platform, list]) => (
            <li key={platform} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <PlatformIcon platform={platform} size="sm" showBackground />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium capitalize">{platform}</p>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {list.length} day{list.length === 1 ? "" : "s"} of data · {TEMPLATES[template].columns.length} columns
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn("text-[10px]", list.length ? "text-emerald-500 border-emerald-500/40" : "")}
              >
                {list.length ? "ready" : "collecting"}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => download(platform)}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
