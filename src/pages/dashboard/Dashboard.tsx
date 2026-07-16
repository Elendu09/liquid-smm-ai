import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  Users,
  TrendingUp,
  Calendar,
  Clock,
  Zap,
  Sparkles,
  Bot,
  BarChart3,
  FolderOpen,
  ArrowRight,
  CircleCheck,
  CircleAlert,
  CircleX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageHeader,
  KpiTile,
  SectionCard,
  EmptyState,
} from "@/components/dashboard/shell";
import { OnboardingChecklistCard } from "@/components/dashboard/OnboardingChecklistCard";
import { AiCommandBar } from "@/components/dashboard/AiCommandBar";
import { useOnboarding } from "@/hooks/useOnboarding";


import { useAccounts } from "@/contexts/AccountContext";
import { useRunHistory } from "@/hooks/useRunHistory";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { getPlatformById } from "@/config/platforms";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";

const quickLinks = [
  {
    title: "Create",
    description: "Captions, hashtags, AI Studio",
    href: "/dashboard/create",
    icon: Sparkles,
  },
  {
    title: "Publish",
    description: "Queue, calendar, stories",
    href: "/dashboard/publish",
    icon: Calendar,
  },
  {
    title: "Engage",
    description: "Bot, comments, DMs",
    href: "/dashboard/engage",
    icon: Bot,
  },
  {
    title: "Analytics",
    description: "Overview, reports, health",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Library",
    description: "Assets, link pages, presets",
    href: "/dashboard/library",
    icon: FolderOpen,
  },
];

function statusIcon(status: string) {
  if (status === "success") return <CircleCheck className="h-3.5 w-3.5 text-brand-green" />;
  if (status === "failed") return <CircleX className="h-3.5 w-3.5 text-destructive" />;
  return <CircleAlert className="h-3.5 w-3.5 text-brand-orange" />;
}

function accountStatusDot(status: string) {
  if (status === "active") return "bg-brand-green";
  if (status === "warning") return "bg-brand-orange";
  if (status === "error") return "bg-destructive";
  return "bg-muted-foreground/50";
}

export default function Dashboard() {
  const { accounts, totalAccounts } = useAccounts();
  const { state: onboarding } = useOnboarding();
  const openTour = () => window.dispatchEvent(new Event("smmpilot:open-onboarding"));
  const { rows: runs } = useRunHistory();
  const { posts } = useScheduledPosts();

  const upcoming = [...posts]
    .filter((p) => new Date(p.scheduledAt).getTime() >= Date.now() - 60_000)
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
    .slice(0, 5);

  const recent = runs.slice(0, 5);
  const totalFollowers = accounts.reduce((s, a) => s + a.followers, 0);
  const avgEngagement =
    accounts.length > 0
      ? accounts.reduce((s, a) => s + a.engagement, 0) / accounts.length
      : 0;
  const successful = runs.filter((r) => r.status === "success").length;
  const successRate = runs.length > 0 ? (successful / runs.length) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Welcome back"
        description="Everything you scheduled, ran, and grew — at a glance."
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex md:items-center">
            {/* Unified glass button style: translucent surface, gradient sheen on top edge, primary hover */}
            <Button
              asChild
              size="sm"
              className="w-full md:w-auto group relative overflow-hidden rounded-lg border border-primary/40 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.6)] hover:shadow-[0_8px_22px_-6px_hsl(var(--primary)/0.75)] hover:from-primary hover:to-primary/90 transition-all before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary-foreground/60 before:to-transparent"
            >
              <Link to="/dashboard/create">
                <Zap className="mr-2 h-4 w-4" /> Quick action
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openTour}
              className="w-full md:w-auto group relative overflow-hidden rounded-lg border border-border/60 bg-card/60 text-foreground backdrop-blur-md hover:bg-card/80 hover:border-primary/50 hover:text-foreground transition-all before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-foreground/25 before:to-transparent"
            >
              <Sparkles className="mr-2 h-4 w-4" /> Take the tour
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full md:w-auto group relative overflow-hidden rounded-lg border border-border/60 bg-card/60 text-foreground backdrop-blur-md hover:bg-card/80 hover:border-primary/50 hover:text-foreground transition-all before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-foreground/25 before:to-transparent"
            >
              <Link to="/dashboard/activity/runs">
                <Clock className="mr-2 h-4 w-4" /> Activity
              </Link>
            </Button>
          </div>
        }
      />

      <AiCommandBar />

      {!onboarding.completed && <OnboardingChecklistCard onReopen={openTour} />}


      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiTile
          label="Connected accounts"
          value={totalAccounts}
          icon={Users}
        />
        <KpiTile
          label="Total followers"
          value={totalFollowers.toLocaleString()}
          icon={TrendingUp}
        />
        <KpiTile
          label="Scheduled posts"
          value={posts.length}
          icon={Calendar}
        />
        <KpiTile
          label="Success rate"
          value={`${successRate.toFixed(0)}%`}
          icon={CircleCheck}
        />
      </div>

      {/* Kanban lanes: Upcoming · Health · Activity */}
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="flex lg:grid lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 overflow-x-auto snap-x snap-mandatory pb-3 lg:overflow-visible lg:pb-0">
          {/* Upcoming posts lane */}
          <div className="snap-start shrink-0 w-[85vw] sm:w-80 lg:w-auto lg:col-span-1">
            <SectionCard
              title="Upcoming posts"
              description={`Next ${upcoming.length} scheduled`}
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard/publish/queue" aria-label="Open queue">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Queue</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-foreground/70">{upcoming.length}</span>
              </div>
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Nothing scheduled yet"
                  description="Draft a post and schedule it to see it here."
                  action={
                    <Button asChild size="sm">
                      <Link to="/dashboard/publish/queue">Schedule a post</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-2">
                  {upcoming.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-2.5 hover:bg-muted/40 transition-colors">
                      <div className="flex -space-x-1.5 flex-shrink-0">
                        {p.platformIds.slice(0, 3).map((pid) => (
                          <div key={pid} className="ring-2 ring-card rounded-full">
                            <PlatformIcon platform={pid} size="xs" />
                          </div>
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.caption || "(no caption)"}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(p.scheduledAt), "MMM d, h:mm a")}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        {p.platformIds.length}ch
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          {/* Account health lane */}
          <div className="snap-start shrink-0 w-[85vw] sm:w-80 lg:w-auto lg:col-span-1">
            <SectionCard
              title="Account health"
              description={`${accounts.length} connected`}
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard/analytics/health" aria-label="Open health">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Accounts</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-foreground/70">{accounts.length}</span>
              </div>
              {accounts.length === 0 ? (
                <EmptyState icon={Users} title="No accounts connected" description="Connect a platform to unlock tools." />
              ) : (
                <ul className="space-y-2">
                  {accounts.slice(0, 5).map((a) => {
                    const p = getPlatformById(a.platformId);
                    return (
                      <li key={a.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-2.5">
                        <PlatformIcon platform={a.platformId} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">@{a.username}</p>
                          <p className="text-xs text-muted-foreground truncate">{p?.name} · {a.followers.toLocaleString()}</p>
                        </div>
                        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", accountStatusDot(a.status))} aria-label={`Status: ${a.status}`} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>
          </div>

          {/* Recent activity lane */}
          <div className="snap-start shrink-0 w-[85vw] sm:w-80 lg:w-auto lg:col-span-1">
            <SectionCard
              title="Recent activity"
              description={`Last ${recent.length} runs`}
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard/activity/runs" aria-label="View all activity">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Runs</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-foreground/70">{recent.length}</span>
              </div>
              {recent.length === 0 ? (
                <EmptyState icon={Clock} title="No runs yet" description="Every automation you run shows up here." />
              ) : (
                <ul className="space-y-2">
                  {recent.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-2.5">
                      {statusIcon(r.status)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{r.action}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.toolKey}{r.accountHandle ? ` · @${r.accountHandle}` : ""}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Quick access to hubs (desktop/tablet) */}
      <div className="hidden md:block">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Jump to a hub
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="group rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 hover:border-primary/50 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <l.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">{l.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {l.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
