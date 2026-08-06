import { useMemo, useState } from "react";
import { AlertTriangle, Clock, Inbox, MessageSquareQuote, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SavedRepliesDialog } from "@/components/engage/SavedRepliesDialog";
import { analyzeMessage, type Intent, type Sentiment } from "@/hooks/useInboxAnalysis";
import type { InboxItem } from "@/pages/dashboard/views/InboxBoard";

const SLA_HOURS = 4;

const SENTIMENTS: (Sentiment | "all")[] = ["all", "positive", "neutral", "negative"];
const INTENTS: (Intent | "all")[] = ["all", "question", "lead", "collab", "support", "complaint", "spam"];

/**
 * Triage header for the unified inbox — SLA counters (waiting / breached),
 * sentiment + intent filters and saved-reply management.
 */
export function InboxTriageBar({
  items,
  sentiment,
  intent,
  onSentiment,
  onIntent,
}: {
  items: InboxItem[];
  sentiment: Sentiment | "all";
  intent: Intent | "all";
  onSentiment: (s: Sentiment | "all") => void;
  onIntent: (i: Intent | "all") => void;
}) {
  const [repliesOpen, setRepliesOpen] = useState(false);

  const stats = useMemo(() => {
    const now = Date.now();
    const open = items.filter((i) => i.status === "new");
    const ages = open.map((i) => (now - new Date(i.createdAt).getTime()) / 3_600_000);
    const breached = ages.filter((h) => h > SLA_HOURS).length;
    const negative = items.filter(
      (i) => i.status === "new" && analyzeMessage(i.message).sentiment === "negative",
    ).length;
    const replied = items.filter((i) => i.status === "replied" || i.status === "resolved").length;
    const responseRate = items.length ? Math.round((replied / items.length) * 100) : 0;
    const oldest = ages.length ? Math.max(...ages) : 0;
    return { waiting: open.length, breached, negative, responseRate, oldest };
  }, [items]);

  const tiles = [
    { icon: Inbox, label: "Waiting", value: `${stats.waiting}`, tone: "text-foreground" },
    {
      icon: Timer,
      label: `SLA > ${SLA_HOURS}h`,
      value: `${stats.breached}`,
      tone: stats.breached ? "text-destructive" : "text-muted-foreground",
    },
    {
      icon: AlertTriangle,
      label: "Negative",
      value: `${stats.negative}`,
      tone: stats.negative ? "text-amber-500" : "text-muted-foreground",
    },
    { icon: Zap, label: "Handled", value: `${stats.responseRate}%`, tone: "text-emerald-500" },
    {
      icon: Clock,
      label: "Oldest",
      value: stats.oldest >= 1 ? `${Math.round(stats.oldest)}h` : `${Math.round(stats.oldest * 60)}m`,
      tone: "text-muted-foreground",
    },
  ];

  const chip = (active: boolean) =>
    cn(
      "px-2.5 py-1 rounded-full text-[11px] font-medium capitalize whitespace-nowrap transition-colors min-h-7",
      active ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 space-y-3">
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible">
          {tiles.map(({ icon: Icon, label, value, tone }) => (
            <div
              key={label}
              className="snap-start shrink-0 min-w-[38%] sm:min-w-0 rounded-xl border border-border/60 bg-card/40 backdrop-blur px-3 py-2"
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <Icon className="h-3 w-3" />
                {label}
              </div>
              <p className={cn("text-lg font-semibold leading-tight", tone)}>{value}</p>
            </div>
          ))}
        </div>
      </div>


      <div className="flex items-center gap-2">
        <div className="-mx-4 flex flex-1 min-w-0 gap-1 overflow-x-auto scrollbar-none px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <div className="flex gap-1" role="group" aria-label="Filter by sentiment">
            {SENTIMENTS.map((s) => (
              <button key={s} type="button" onClick={() => onSentiment(s)} aria-pressed={sentiment === s} className={chip(sentiment === s)}>
                {s === "all" ? "All sentiment" : s}
              </button>
            ))}
          </div>
          <div className="flex gap-1" role="group" aria-label="Filter by intent">
            {INTENTS.map((i) => (
              <button key={i} type="button" onClick={() => onIntent(i)} aria-pressed={intent === i} className={chip(intent === i)}>
                {i === "all" ? "All intents" : i}
              </button>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5" onClick={() => setRepliesOpen(true)}>
          <MessageSquareQuote className="h-3.5 w-3.5" />
          <span className="hidden text-xs sm:inline">Saved replies</span>
        </Button>
      </div>


      <SavedRepliesDialog open={repliesOpen} onOpenChange={setRepliesOpen} />
    </div>
  );
}
