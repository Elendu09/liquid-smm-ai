import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Target, TrendingUp, CalendarRange, Trash2, Share2, Edit3, Eye } from "lucide-react";
import { DEMO_CAMPAIGNS, campaignSlug } from "@/lib/demoCampaigns";
import { PageHeader } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { CampaignBuilderDialog } from "@/components/campaigns/CampaignBuilderDialog";
import { NewPostDialog } from "@/components/create/NewPostDialog";
import { useCampaigns, type Campaign } from "@/hooks/useCampaigns";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useGuest, guardWrite } from "@/hooks/useGuest";
import { useRealOrEmpty } from "@/hooks/useRealOrEmpty";
import { pushLocalCollection } from "@/hooks/useLocalCollection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  onShare,
  posts,
  onEdit,
  onCreateDraft,
  onSelect,
  isSelected,
}: {
  campaign: Campaign;
  scheduledCount: number;
  onStatus: (s: Campaign["status"]) => void;
  onDelete: () => void;
  onShare: () => void;
  posts?: Array<{ id: string; caption: string; scheduledAt: string; platformIds: string[]; mediaUrl?: string }>;
  onEdit?: () => void;
  onCreateDraft?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const goal = campaign.goalPosts || 0;
  const pct = goal ? Math.min(100, Math.round((scheduledCount / goal) * 100)) : 0;

  return (
    <article
      onClick={onSelect}
      className={cn(
        "group relative rounded-2xl border bg-card/70 p-4 backdrop-blur-sm transition-all cursor-pointer",
        isSelected
          ? "border-primary/60 ring-2 ring-primary/20 shadow-md shadow-primary/10"
          : "border-border/60 hover:border-primary/40 hover:shadow-md"
      )}
    >
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

      <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5 text-xs hover:bg-muted/40">
            <span className="inline-flex items-center gap-1.5"><Eye className="h-3 w-3" /> {posts?.length ?? scheduledCount} posts in campaign</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-1.5">
          {(!posts || posts.length === 0) ? (
            <p className="text-xs text-muted-foreground py-2">No posts yet — use “New campaign” to generate a plan, or schedule manually.</p>
          ) : (
            posts.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-md border border-border/40 bg-card px-2 py-1.5 text-xs">
                <span className="truncate flex-1">{p.caption || "Untitled"}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(p.scheduledAt).toLocaleDateString()}</span>
                <span className="flex -space-x-1">{p.platformIds.slice(0,2).map(pid => <span key={pid} className="h-4 w-4 rounded-full bg-primary/15 grid place-items-center text-[8px]">{pid.slice(0,2)}</span>)}</span>
              </div>
            ))
          )}
          {onCreateDraft && (
            <button
              onClick={(e) => { e.stopPropagation(); onCreateDraft(); }}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="h-3 w-3" /> Create draft for this campaign
            </button>
          )}
          {onEdit && <button onClick={onEdit} className="w-full text-xs text-primary underline underline-offset-4 py-1">Configure campaign</button>}
        </CollapsibleContent>
      </Collapsible>
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
          className="ml-auto h-10 w-10 rounded-full text-muted-foreground hover:text-primary"
          onClick={onShare}
          aria-label={`Copy share link for ${campaign.name}`}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-muted-foreground hover:text-destructive"
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPostInitial, setNewPostInitial] = useState<{ title?: string; caption?: string; platformIds?: string[] } | undefined>(undefined);
  const campaigns = useRealOrEmpty(real, { isGuest, demo: DEMO_CAMPAIGNS });
  const demoMode = isGuest && real.length === 0;

  // Opened via "Plan a campaign" in the Create studio (?builder=1).
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("builder") !== "1") return;
    setOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("builder");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const stats = useMemo(() => {
    const active = campaigns.filter((c) => c.status === "active").length;
    const planned = campaigns.reduce((n, c) => n + (c.goalPosts || 0), 0);
    return { active, planned, total: campaigns.length };
  }, [campaigns]);

  // Rough attribution: posts queued inside a campaign's date window.
  const countFor = (c: Campaign) => postsFor(c).length;
  const postsFor = (c: Campaign) => {
    if (!c.startDate) return posts.filter(p => c.platformIds.some(x => p.platformIds.includes(x))).slice(0,5);
    const from = new Date(c.startDate).getTime();
    const to = c.endDate ? new Date(c.endDate).getTime() + 86400000 : Infinity;
    return posts.filter((p) => {
      const t = new Date(p.scheduledAt).getTime();
      return t >= from && t <= to && p.platformIds.some((x) => c.platformIds.includes(x));
    });
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

      <div className="mt-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible">
          {[
            { label: "Campaigns", value: stats.total, icon: Target },
            { label: "Active now", value: stats.active, icon: TrendingUp },
            { label: "Posts planned", value: stats.planned, icon: CalendarRange },
          ].map((s) => (
            <div
              key={s.label}
              className="snap-start shrink-0 min-w-[62%] xs:min-w-[48%] sm:min-w-0 flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3.5 backdrop-blur-sm"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xl font-semibold leading-none">{s.value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
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
                posts={postsFor(c)}
                isSelected={selectedId === c.id}
                onSelect={() => setSelectedId(selectedId === c.id ? null : c.id)}
                onCreateDraft={() => {
                  if (demoMode) return void guardWrite("create campaign drafts");
                  setNewPostInitial({
                    title: `${c.name} — draft`,
                    caption: c.brief ? `${c.brief}\n\n` : "",
                    platformIds: c.platformIds,
                  });
                  setNewPostOpen(true);
                }}
                onEdit={() => {
                  if (demoMode) return void guardWrite("configure campaigns");
                  setOpen(true);
                }}
                onStatus={(s) => {
                  if (demoMode) return void guardWrite("manage campaigns");
                  void update(c.id, { status: s });
                }}
                onDelete={() => {
                  if (demoMode) return void guardWrite("delete campaigns");
                  void remove(c.id);
                }}
                onShare={() => {
                  const url = c.id.startsWith("demo-")
                    ? `${window.location.origin}/c/${campaignSlug(c.name)}`
                    : `${window.location.origin}/dashboard/campaigns`;
                  void navigator.clipboard.writeText(url);
                  toast.success("Share link copied", { description: url });
                }}
              />
            ))}
          </div>
        )}
      </div>

      <CampaignBuilderDialog open={open} onOpenChange={setOpen} />
      <NewPostDialog
        open={newPostOpen}
        onOpenChange={(v) => {
          setNewPostOpen(v);
          if (!v) {
            setNewPostInitial(undefined);
            // After closing, also save a draft to the create studio so it
            // appears under /dashboard/create drafts.
          }
        }}
        initial={newPostInitial}
      />
    </div>
  );
}
