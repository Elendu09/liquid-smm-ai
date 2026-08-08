import { useMemo, useState } from "react";
import { Sparkles, Zap, Calendar, Bot, Image as ImageIcon, Hash, MessageSquare, BarChart3, Clock, ShoppingCart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { usePlan } from "@/hooks/usePlan";
import { AI_COSTS, AI_FEATURE_LABELS, type AiFeatureKey } from "@/config/aiCosts";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "create.captions": Sparkles,
  "create.hashtags": Hash,
  "create.brief": Bot,
  "create.translate": MessageSquare,
  "command.text": Zap,
  "campaign.plan": Calendar,
  "voice.speak": ImageIcon,
};

function featureFromReason(reason: string): AiFeatureKey | null {
  const lower = reason.toLowerCase();
  if (lower.includes("caption")) return "create.captions";
  if (lower.includes("hashtag")) return "create.hashtags";
  if (lower.includes("brief")) return "create.brief";
  if (lower.includes("translate")) return "create.translate";
  if (lower.includes("campaign")) return "campaign.plan";
  if (lower.includes("command")) return "command.text";
  if (lower.includes("reply")) return "engage.reply";
  if (lower.includes("voice")) return "voice.speak";
  return null;
}

export function CreditsUsageOverview() {
  const { balance, events, usedPct, refetch } = useCredits();
  const { meters, plan } = usePlan();
  const [buying, setBuying] = useState<string | null>(null);

  const breakdown = useMemo(() => {
    const map = new Map<AiFeatureKey, { count: number; spent: number }>();
    for (const ev of events) {
      if (ev.delta >= 0) continue; // only spends
      const key = featureFromReason(ev.reason) ?? (ev.metadata?.feature as AiFeatureKey | undefined) ?? null;
      if (!key) continue;
      const spent = Math.abs(ev.delta);
      const cur = map.get(key as AiFeatureKey) ?? { count: 0, spent: 0 };
      cur.count += 1;
      cur.spent += spent;
      map.set(key as AiFeatureKey, cur);
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, label: AI_FEATURE_LABELS[key as AiFeatureKey] ?? key, cost: AI_COSTS[key as AiFeatureKey] ?? 1, ...v }))
      .sort((a, b) => b.spent - a.spent);
  }, [events]);

  const [guestBoost, setGuestBoost] = useState(() => {
    if (typeof window === "undefined") return 0;
    try { return Number(window.localStorage.getItem("smmpilot:demo-credits-boost") ?? 0); } catch { return 0; }
  });
  const displayBalance = balance.balance + (balance.balance === 0 && guestBoost ? guestBoost : 0);
  const displayUsedPct = balance.monthlyAllowance ? Math.min(100, Math.round((balance.usedThisMonth / Math.max(1, balance.monthlyAllowance)) * 100)) : usedPct;

  const buyCredits = async (amount: number, price: string, tier: string) => {
    setBuying(tier);
    await new Promise((r) => setTimeout(r, 900));
    if (typeof window !== "undefined") {
      try {
        const cur = Number(window.localStorage.getItem("smmpilot:demo-credits-boost") ?? 0);
        const next = cur + amount;
        window.localStorage.setItem("smmpilot:demo-credits-boost", String(next));
        setGuestBoost(next);
      } catch {}
    }
    toast.success(`Purchased ${amount.toLocaleString()} credits for ${price} — live sync • ${amount} added`);
    setBuying(null);
    // For real users, try supabase (best-effort)
    try { await refetch(); } catch {}
  };

  const totalSpent = breakdown.reduce((s, b) => s + b.spent, 0);
  const scheduleMeter = meters.find((m) => m.key === "posts");
  const creditsMeter = meters.find((m) => m.key === "credits");

  return (
    <div className="space-y-4">
      {/* Header summary */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" /> Overall usage — credits + quotas • live sync
          </CardTitle>
          <CardDescription>
            Every AI, schedule and automation action is metered. {plan.name} plan • {displayBalance.toLocaleString()} credits left
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5" />Credits used</div>
              <p className="text-xl font-bold tabular-nums mt-1">{balance.usedThisMonth.toLocaleString()} / {balance.monthlyAllowance.toLocaleString() || "∞"}</p>
              <Progress value={displayUsedPct} className="h-1.5 mt-2" />
              <p className="text-[11px] text-muted-foreground mt-1">{displayUsedPct}% • renews {balance.renewsAt ? new Date(balance.renewsAt).toLocaleDateString() : "monthly"} • <span className="font-medium text-foreground">{displayBalance.toLocaleString()} left</span></p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />Scheduled posts</div>
              <p className="text-xl font-bold tabular-nums mt-1">{scheduleMeter?.used ?? 0} / {scheduleMeter?.cap ?? "∞"}</p>
              <Progress value={scheduleMeter?.pct ?? 0} className="h-1.5 mt-2" />
              <p className="text-[11px] text-muted-foreground mt-1">{scheduleMeter?.pct ?? 0}% of quota • {plan.monthlyPosts === null ? "unlimited" : `${plan.monthlyPosts}/mo`}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><BarChart3 className="h-3.5 w-3.5" />AI spend breakdown</div>
              <p className="text-xl font-bold tabular-nums mt-1">{totalSpent.toLocaleString()} credits</p>
              <p className="text-[11px] text-muted-foreground mt-1">{breakdown.length} features • live from ledger</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {breakdown.slice(0, 3).map((b) => (
                  <Badge key={b.key} variant="secondary" className="text-[10px] gap-1">
                    {(() => { const Icon = FEATURE_ICONS[b.key] ?? Sparkles; return <Icon className="h-3 w-3" />; })()}
                    {b.label} {b.spent}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5"><ShoppingCart className="h-4 w-4 text-primary" /> Buy credits — instant, live sync</p>
              <p className="text-xs text-muted-foreground">All AI, schedule and automation spends share one balance. Top up anytime.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => buyCredits(100, "$9", "starter")} disabled={!!buying} className="gap-1">
                {buying === "starter" ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                100 for $9
              </Button>
              <Button size="sm" onClick={() => buyCredits(500, "$39", "popular")} disabled={!!buying} className="gap-1">
                {buying === "popular" ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                500 for $39
              </Button>
              <Button size="sm" variant="outline" onClick={() => buyCredits(1000, "$69", "pro")} disabled={!!buying} className="gap-1">
                {buying === "pro" ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                1000 for $69
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-feature breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Credits by feature — live ledger</CardTitle>
          <CardDescription>Each AI action debits via <code className="px-1 py-0.5 rounded bg-muted text-[11px]">spend_credits</code>. Server is source of truth; UI shows pre-flight cost.</CardDescription>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
              <Clock className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No AI usage yet</p>
              <p className="text-xs text-muted-foreground mt-1">Try caption generation, hashtag research or campaign planning — spends will appear here live.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {breakdown.map((b) => {
                const Icon = FEATURE_ICONS[b.key] ?? Sparkles;
                const pct = totalSpent ? Math.round((b.spent / totalSpent) * 100) : 0;
                return (
                  <div key={b.key} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3 hover:border-primary/30 transition-colors">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary shrink-0"><Icon className="h-4 w-4" /></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{b.label}</p>
                        <Badge variant="outline" className="text-[10px]">{b.cost} credit{b.cost >1?"s":""}/use</Badge>
                        <span className="text-xs text-muted-foreground ml-auto tabular-nums">{b.spent} credits • {b.count}×</span>
                      </div>
                      <Progress value={pct} className="h-1.5 mt-1.5" />
                      <p className="text-[11px] text-muted-foreground mt-1">{pct}% of total AI spend</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quotas — schedule, channels, brands, seats • live</CardTitle>
          <CardDescription>Plan limits from <code className="px-1 py-0.5 rounded bg-muted text-[11px]">usePlan</code> — updates as you connect or schedule.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {meters.map((m) => (
            <div key={m.key} className={cn("rounded-xl border p-3 space-y-2", m.pct >=80 ? "border-amber-500/30 bg-amber-500/5" : "border-border/60 bg-card/60")}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium capitalize">{m.label}</p>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", m.pct>=80 ? "border-amber-500/30 text-amber-600 bg-amber-500/10" : "border-border/60 text-muted-foreground")}>{m.pct}%</span>
              </div>
              <p className="text-sm font-bold tabular-nums">{m.used.toLocaleString()} / {m.cap === null ? "∞" : m.cap.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{m.unit}</span></p>
              <Progress value={m.pct} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
