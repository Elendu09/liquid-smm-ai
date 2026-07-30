import { useMemo, useState } from "react";
import { Trophy, Target, TrendingDown, TrendingUp, Download, Users } from "lucide-react";
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
import { useScopedAccounts } from "@/hooks/useScopedAccounts";
import { useCompetitors } from "@/hooks/useCompetitors";
import { buildBenchmarks, type BenchmarkRow } from "@/lib/benchmarks";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function GapPill({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium tabular-nums",
        up ? "text-emerald-500" : "text-rose-500",
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {value.toFixed(0)}
      {suffix}
    </span>
  );
}

/**
 * Full competitive leaderboard: ranks your channels against tracked competitors
 * on a blended reach + engagement score, with share of voice and gap-to-median.
 */
export function BenchmarkLeaderboard() {
  const { accounts, brandName } = useScopedAccounts();
  const { items: competitors } = useCompetitors();
  const [platform, setPlatform] = useState<string>("all");

  const platformOptions = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((a) => set.add(a.platformId));
    competitors.forEach((c) => set.add(c.platform));
    return Array.from(set).sort();
  }, [accounts, competitors]);

  const summary = useMemo(
    () => buildBenchmarks(accounts, competitors, platform),
    [accounts, competitors, platform],
  );

  const exportCsv = () => {
    const header = "rank,name,platform,you,followers,engagement,posts_per_week,share_of_voice,score";
    const lines = summary.rows.map((r: BenchmarkRow) =>
      [
        r.rank,
        `"${r.label.replace(/"/g, "'")}"`,
        r.platform,
        r.isYou ? "yes" : "no",
        r.followers,
        r.engagement,
        r.postsPerWeek,
        r.shareOfVoice.toFixed(2),
        r.score,
      ].join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `benchmarks-${platform}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Benchmark exported", description: `${summary.rows.length} rows as CSV.` });
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <header className="flex flex-col gap-3 p-4 sm:p-5 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Competitive leaderboard</h2>
            <p className="text-[11px] text-muted-foreground">
              {brandName ? `${brandName} · ` : ""}
              {summary.competitorCount} tracked competitor{summary.competitorCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="h-9 w-[150px] text-xs">
              <SelectValue placeholder="All networks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All networks</SelectItem>
              {platformOptions.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!summary.rows.length}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
          </Button>
        </div>
      </header>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/60 border-b border-border/60">
        {[
          { label: "Your rank", value: summary.yourRank ? `#${summary.yourRank}` : "—" },
          { label: "Share of voice", value: `${(summary.you?.shareOfVoice ?? 0).toFixed(1)}%` },
          { label: "Median engagement", value: `${summary.medianEngagement.toFixed(2)}%` },
          { label: "Set followers", value: fmt(summary.totalFollowers) },
        ].map((s) => (
          <div key={s.label} className="p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold tabular-nums mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {summary.rows.length === 0 ? (
        <div className="p-10 text-center space-y-2">
          <Users className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Connect a channel or add competitors in Audience → Competitors to build benchmarks.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {summary.rows.map((r) => (
            <li
              key={r.id}
              className={cn(
                "flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5",
                r.isYou && "bg-primary/5",
              )}
            >
              <span className="w-6 text-xs font-bold tabular-nums text-muted-foreground">
                {r.rank}
              </span>
              <PlatformIcon platform={r.platform} size="sm" showBackground />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm truncate", r.isYou ? "font-semibold text-primary" : "font-medium")}>
                    {r.label}
                  </p>
                  {r.isYou && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[9px] tracking-wider">
                      YOU
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                  <span className="tabular-nums">{fmt(r.followers)} followers</span>
                  <span className="tabular-nums">{r.engagement.toFixed(2)}% eng</span>
                  <span className="tabular-nums">{r.postsPerWeek}/wk</span>
                  <GapPill value={r.engagementGap} />
                </div>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <div className="hidden sm:block w-28">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full", r.isYou ? "bg-primary" : "bg-primary/40")}
                      style={{ width: `${Math.min(100, r.shareOfVoice)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                    {r.shareOfVoice.toFixed(1)}% SOV
                  </p>
                </div>
                <div className="text-right w-12">
                  <p className="text-sm font-bold tabular-nums">{r.score}</p>
                  <p className="text-[10px] text-muted-foreground">score</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {summary.leader && summary.you && summary.leader.id !== summary.you.id && (
        <footer className="flex items-start gap-2 px-4 py-3 sm:px-5 border-t border-border/60 bg-muted/30">
          <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{summary.leader.label}</span> leads with{" "}
            {fmt(summary.leader.followers)} followers at {summary.leader.engagement.toFixed(2)}% engagement.
            Closing the gap needs about {fmt(Math.max(0, summary.leader.followers - summary.you.followers))} more
            followers or +{Math.max(0, summary.leader.engagement - summary.you.engagement).toFixed(2)}pp engagement.
          </p>
        </footer>
      )}
    </section>
  );
}
