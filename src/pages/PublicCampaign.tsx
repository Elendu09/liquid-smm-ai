import { Link, useParams } from "react-router-dom";
import { ArrowRight, CalendarRange, Target, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { findDemoCampaign } from "@/lib/demoCampaigns";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary",
  paused: "bg-amber-500/15 text-amber-500",
  completed: "bg-emerald-500/15 text-emerald-500",
};

export default function PublicCampaign() {
  const { slug = "" } = useParams();
  const campaign = findDemoCampaign(slug);

  if (!campaign) {
    return (
      <main className="min-h-dvh grid place-items-center bg-background px-6 text-center">
        <div>
          <h1 className="font-['Instrument_Serif'] text-4xl">Campaign not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This shared campaign link is no longer available.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">Back to homepage</Link>
          </Button>
        </div>
      </main>
    );
  }

  const pct = campaign.goalPosts
    ? Math.min(100, Math.round(((campaign.goalPosts * 0.45) / campaign.goalPosts) * 100))
    : 0;

  return (
    <main className="min-h-dvh bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> SMMSAAS
        </Link>

        <article className="mt-6 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur-xl shadow-xl">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                Shared campaign
              </p>
              <h1 className="mt-1 font-['Instrument_Serif'] text-4xl leading-tight">{campaign.name}</h1>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {campaign.objective}
                {campaign.startDate ? ` · from ${campaign.startDate}` : ""}
                {campaign.endDate ? ` → ${campaign.endDate}` : ""}
              </p>
            </div>
            <Badge variant="secondary" className={STATUS_TONE[campaign.status] ?? STATUS_TONE.draft}>
              {campaign.status}
            </Badge>
          </header>

          {campaign.brief && <p className="mt-4 text-sm text-muted-foreground">{campaign.brief}</p>}

          <div className="mt-5 flex flex-wrap gap-1.5">
            {campaign.platformIds.map((p) => (
              <span
                key={p}
                className="flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-xs capitalize text-muted-foreground"
              >
                <PlatformIcon platform={p} className="h-3 w-3" />
                {p}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Posts planned", value: campaign.goalPosts || "—", icon: CalendarRange },
              { label: "Reach goal", value: (campaign.goalReach || 0).toLocaleString(), icon: Target },
              { label: "Engagement goal", value: (campaign.goalEngagement || 0).toLocaleString(), icon: Sparkles },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border/60 bg-background/50 p-3.5">
                <s.icon className="h-4 w-4 text-primary" />
                <p className="mt-2 text-lg font-semibold leading-none">{s.value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>

          <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium">Plan campaigns like this with AI</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Brief once, and SMMSAAS drafts the hooks, captions, hashtags and cadence for every channel.
            </p>
            <Button asChild className="mt-3 rounded-full">
              <Link to="/signup">
                Start free trial <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </article>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          This is a read-only sample campaign. No account data is shown.
        </p>
      </div>
    </main>
  );
}
