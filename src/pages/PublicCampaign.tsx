import { Link, useParams } from "react-router-dom";
import { ArrowRight, CalendarRange, Target, Sparkles, MessageCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button as UIButton } from "@/components/ui/button";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { findDemoCampaign } from "@/lib/demoCampaigns";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

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

          <ClientComments slug={slug} />

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

function ClientComments({ slug }: { slug: string }) {
  const { isGuest, user } = useAuthUser();
  const key = `smmpilot:public-campaign:${slug}:comments`;
  const [comments, setComments] = useState<Array<{ id: string; author: string; text: string; at: string }>>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (_e) { void _e; }
    return [
      { id: "c1", author: "Alex (Client)", text: "Love the hook on Day 3 — can we swap the cover image?", at: new Date(Date.now() - 86400000).toISOString() },
      { id: "c2", author: "Sam (Manager)", text: "Updated cover per feedback ✅", at: new Date(Date.now() - 3600000 * 5).toISOString() },
      { id: "c3", author: "Client", text: "Approved! Ready to publish 🎉", at: new Date(Date.now() - 3600000).toISOString() },
    ];
  });
  const [text, setText] = useState("");
  // Hydrate from Supabase for signed-in users (with local fallback, live sync)
  useEffect(() => {
    if (isGuest) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await (supabase as any).from("campaign_comments").select("*").eq("slug", slug).order("created_at", { ascending: true }).limit(50);
        if (!cancelled && data && data.length) {
          setComments(data.map((r: any) => ({ id: r.id, author: r.author ?? "Client", text: r.text, at: r.created_at })));
        }
      } catch (_e) { void _e; }
    })();
    // Realtime for live sync
    let channel: any = null;
    try {
      channel = supabase.channel(`campaign-comments:${slug}`).on("postgres_changes" as any, { event: "INSERT", schema: "public", table: "campaign_comments", filter: `slug=eq.${slug}` }, (payload: any) => {
        const r = payload.new;
        setComments((prev) => [...prev, { id: r.id, author: r.author ?? "Client", text: r.text, at: r.created_at }]);
      }).subscribe();
    } catch (_e) { void _e; }
    return () => { cancelled = true; if (channel) try { supabase.removeChannel(channel); } catch (_e) { void _e; } };
  }, [isGuest, slug]);
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(comments)); } catch (_e) { void _e; }
  }, [comments, key]);
  const send = async () => {
    if (!text.trim()) return;
    const newComment = { id: crypto.randomUUID(), author: user?.email?.split("@")[0] ?? "You", text: text.trim(), at: new Date().toISOString() };
    setComments((prev) => [...prev, newComment]);
    setText("");
    if (!isGuest) {
      try { await (supabase as any).from("campaign_comments").insert({ id: newComment.id, slug, author: newComment.author, text: newComment.text }); } catch (_e) { void _e; }
    }
  };
  return (
    <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4">
      <h3 className="text-sm font-semibold flex items-center gap-1.5"><MessageCircle className="h-4 w-4 text-primary" /> Client feedback — live sync</h3>
      <p className="text-xs text-muted-foreground mt-1">Comments are synced to this share link. No account required for clients.</p>
      <ul className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
        {comments.map((c) => (
          <li key={c.id} className="rounded-lg border border-border/40 bg-muted/20 p-2.5">
            <div className="flex items-center gap-2 text-xs"><span className="font-medium">{c.author}</span><span className="text-muted-foreground">{new Date(c.at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
            <p className="text-sm mt-1">{c.text}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment..." onKeyDown={(e) => e.key === "Enter" && send()} />
        <UIButton size="sm" onClick={send}><Send className="h-3.5 w-3.5" /></UIButton>
      </div>
    </div>
  );
}
