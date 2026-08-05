import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Target, TrendingUp, CalendarRange, Trash2, Share2 } from "lucide-react";
import { DEMO_CAMPAIGNS, campaignSlug } from "@/lib/demoCampaigns";
import { PageHeader } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/EmptyState";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { CampaignBuilderDialog } from "@/components/campaigns/CampaignBuilderDialog";
import { useCampaigns, type Campaign } from "@/hooks/useCampaigns";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useGuest, guardWrite } from "@/hooks/useGuest";
import { useRealOrEmpty } from "@/hooks/useRealOrEmpty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary",
  paused: "bg-amber-500/15 text-amber-500",
  completed: "bg-emerald-500/15 text-emerald-500",
};

function CampaignCard({
  campaign,
  scheduledCount,
  onStatus,
  onDelete,
}: {
  campaign: Campaign;
  scheduledCount: number;
  onStatus: (s: Campaign["status"]) => void;
  onDelete: () => void;
}) {
  const goal = campaign.goalPosts || 0;
  const pct = goal ? Math.min(100, Math.round((scheduledCount / goal) * 100)) : 0;

  return (
    <article className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm transition-colors hover:border-primary/40">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{campaign.name}</h3>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">
            {campaign.objective}
            {campaign.startDate ? ` · from ${campaign.startDate}` : ""}
            {campaign.endDate ? ` → ${campaign.endDate}` : ""}
          </p>
        </div>
        <Badge className={STATUS_TONE[campaign.status] ?? STATUS_TONE.draft} variant="secondary">
          {campaign.status}
        </Badge>
      </header>

      {campaign.brief && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{campaign.brief}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {campaign.platformIds.map((p) => (
          <span
            key={p}
            className="flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-xs capitalize text-muted-foreground"
          >
            <PlatformIcon platform={p} className="h-3 w-3" />
            {p}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Posts planned</span>
          <span>
            {scheduledCount} / {goal || "—"}
          </span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      <footer className="mt-4 flex items-center gap-2">
        <Select value={campaign.status} onValueChange={(v) => onStatus(v as Campaign["status"])}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label={`Delete ${campaign.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </footer>
    </article>
  );
}

// Demo campaigns live in a shared module so the public /c/:slug share route
// can render the exact same read-only samples.


export default function Campaigns() {
  const { campaigns: real, update, remove } = useCampaigns();
  const { posts } = useScheduledPosts();
  const { isGuest } = useGuest();
  const [open, setOpen] = useState(false);
  const campaigns = useRealOrEmpty(real, { isGuest, demo: DEMO_CAMPAIGNS });
  const demoMode = isGuest && real.length === 0;

  const stats = useMemo(() => {
    const active = campaigns.filter((c) => c.status === "active").length;
    const planned = campaigns.reduce((n, c) => n + (c.goalPosts || 0), 0);
    return { active, planned, total: campaigns.length };
  }, [campaigns]);

  // Rough attribution: posts queued inside a campaign's date window.
  const countFor = (c: Campaign) => {
    if (!c.startDate) return 0;
    const from = new Date(c.startDate).getTime();
    const to = c.endDate ? new Date(c.endDate).getTime() + 86400000 : Infinity;
    return posts.filter((p) => {
      const t = new Date(p.scheduledAt).getTime();
      return t >= from && t <= to && p.platformIds.some((x) => c.platformIds.includes(x));
    }).length;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-10">
      <PageHeader
        title="Campaigns"
        description="Plan multi-week content pushes, brief the AI once, and ship the whole calendar."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Campaigns" }]}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New campaign
          </Button>
        }
      />

      {demoMode && (
        <p className="mt-4 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-xs text-muted-foreground">
          <span className="font-medium text-primary">Demo campaigns</span> — sample data so you can explore the
          builder. Sign up to create real, AI-planned campaigns.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Campaigns", value: stats.total, icon: Target },
          { label: "Active now", value: stats.active, icon: TrendingUp },
          { label: "Posts planned", value: stats.planned, icon: CalendarRange },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3.5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xl font-semibold leading-none">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {campaigns.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No campaigns yet"
            description="Create a campaign and let AI draft the hooks, captions, hashtags and cadence for you."
            ctaLabel="New campaign"
            onCta={() => setOpen(true)}
          />

        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                scheduledCount={countFor(c)}
                onStatus={(s) => {
                  if (demoMode) return void guardWrite("manage campaigns");
                  void update(c.id, { status: s });
                }}
                onDelete={() => {
                  if (demoMode) return void guardWrite("delete campaigns");
                  void remove(c.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <CampaignBuilderDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
