import { useEffect, useMemo, useState } from "react";
import { MessageSquare, TrendingUp, Meh, Smile, Frown, Radio, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Sentiment = "positive" | "neutral" | "negative";
interface Mention {
  id: string;
  handle: string;
  platform: string;
  text: string;
  sentiment: Sentiment;
  when: string;
  reach: number;
}

const MOCK: Mention[] = [
  { id: "m1", handle: "@jordan.creates", platform: "instagram", text: "Love the new scheduler — saved me 3h this week!", sentiment: "positive", when: "4m ago", reach: 12400 },
  { id: "m2", handle: "@rivalstudio", platform: "twitter", text: "SMMSAAS pricing is still too high for small teams", sentiment: "negative", when: "12m ago", reach: 8200 },
  { id: "m3", handle: "@marta.design", platform: "tiktok", text: "The cover picker is so smooth, finally!", sentiment: "positive", when: "23m ago", reach: 54000 },
  { id: "m4", handle: "@growthlabs", platform: "linkedin", text: "Looking for a Hootsuite alternative — any recs?", sentiment: "neutral", when: "41m ago", reach: 3100 },
  { id: "m5", handle: "@nichequeen", platform: "youtube", text: "Tutorial on auto-DMs was super helpful 🙌", sentiment: "positive", when: "1h ago", reach: 9800 },
];

const tone: Record<Sentiment, { icon: React.ComponentType<{ className?: string }>; cls: string; label: string }> = {
  positive: { icon: Smile, cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Positive" },
  neutral: { icon: Meh, cls: "bg-muted text-muted-foreground border-border/60", label: "Neutral" },
  negative: { icon: Frown, cls: "bg-rose-500/10 text-rose-600 border-rose-500/20", label: "Negative" },
};

export function BrandMentionsFeed() {
  const [live, setLive] = useState(true);
  const [mentions, setMentions] = useState<Mention[]>(MOCK);
  const [filter, setFilter] = useState<Sentiment | "all">("all");

  // live sync simulation: every 5s, prepend a new mention and drop last
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      const templates: Mention[] = [
        // eslint-disable-next-line no-restricted-syntax -- synth-ok: live demo jitter
        { id: `m-${Date.now()}`, handle: "@newfan", platform: "instagram", text: "Just hit schedule and it published instantly ⚡", sentiment: "positive", when: "now", reach: Math.floor(2000 + Math.random() * 8000) },
        { id: `m-${Date.now()}`, handle: "@critic", platform: "twitter", text: "Wish bulk CSV supported more columns", sentiment: "neutral", when: "now", reach: 1200 },
      ];
      // eslint-disable-next-line no-restricted-syntax -- synth-ok: demo pick
      const pick = templates[Math.floor(Math.random() * templates.length)];
      setMentions((prev) => [pick, ...prev.slice(0, 4)]);
    }, 5000);
    return () => clearInterval(id);
  }, [live]);

  const filtered = useMemo(() => (filter === "all" ? mentions : mentions.filter((m) => m.sentiment === filter)), [mentions, filter]);
  const counts = useMemo(() => ({
    positive: mentions.filter((m) => m.sentiment === "positive").length,
    neutral: mentions.filter((m) => m.sentiment === "neutral").length,
    negative: mentions.filter((m) => m.sentiment === "negative").length,
  }), [mentions]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 space-y-3">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary"><Radio className="h-4 w-4" /></span>
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1.5">Listening — brand mentions <span className={cn("h-2 w-2 rounded-full", live ? "bg-emerald-500 animate-pulse" : "bg-muted")} /></h3>
            <p className="text-xs text-muted-foreground">Live sync • sentiment auto-tagged • {live ? "polling 5s" : "paused"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 gap-1" onClick={() => setLive((v) => !v)}>
          <RefreshCw className={cn("h-3 w-3", live && "animate-spin")} /> {live ? "Live" : "Paused"}
        </Button>
      </header>

      <div className="flex gap-1.5 flex-wrap">
        { (["all", "positive", "neutral", "negative"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs border capitalize",
              filter === k ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
            )}
          >
            {k} {k !== "all" && `· ${counts[k as Sentiment]}`}
          </button>
        ))}
      </div>

      <div className="flex gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"><TrendingUp className="h-3 w-3" /> Positive {Math.round((counts.positive / Math.max(1, mentions.length)) * 100)}%</span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted border border-border/60"><MessageSquare className="h-3 w-3" /> {mentions.length} mentions</span>
      </div>

      <ul className="space-y-2">
        {filtered.map((m) => {
          const meta = tone[m.sentiment];
          const Icon = meta.icon;
          return (
            <li key={m.id} className="rounded-xl border border-border/60 bg-background p-3 flex gap-2.5 hover:border-primary/20 transition-colors">
              <span className={cn("grid h-8 w-8 place-items-center rounded-lg border shrink-0", meta.cls)}><Icon className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold">{m.handle}</span>
                  <span className="text-muted-foreground">· {m.platform}</span>
                  <Badge variant="secondary" className={cn("ml-auto text-[10px] border", meta.cls)}>{meta.label}</Badge>
                </div>
                <p className="text-sm mt-0.5 line-clamp-2">{m.text}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{m.when} · {m.reach.toLocaleString()} reach</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
