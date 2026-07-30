import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

type Feature = { title: string; description: string };
type Group = { id: string; label: string; features: Feature[] };

const groups: Group[] = [
  {
    id: "workspace",
    label: "Workspace",
    features: [
      { title: "Unified dashboard", description: "Every channel, campaign and metric on a single home screen." },
      { title: "Multi-account switching", description: "Move between brands and client workspaces without signing out." },
      { title: "14 supported platforms", description: "Instagram, X, LinkedIn, Facebook, TikTok, YouTube, Google Business and more." },
      { title: "Guided onboarding", description: "A short setup that connects channels and tailors the dashboard to your goals." },
      { title: "Product tour", description: "Adaptive walkthroughs for desktop, tablet and mobile layouts." },
      { title: "Dark & light themes", description: "A high-contrast editorial interface that follows your system preference." },
      { title: "Mobile-friendly", description: "Full publishing and inbox workflows from a phone or tablet." },
      { title: "Saved views", description: "Pin the filters, platforms and date ranges you use every day." },
    ],
  },
  {
    id: "create",
    label: "Create",
    features: [
      { title: "AI caption generator", description: "On-brand captions in seconds, tuned per platform and tone." },
      { title: "Brand voice presets", description: "Teach the assistant how you write once and reuse it everywhere." },
      { title: "Hashtag research", description: "Trending, niche and competition-scored tags with one-click copy." },
      { title: "AI Studio", description: "Briefs, remixes and variants generated from a single idea." },
      { title: "Advanced remix controls", description: "Adjust tone, length, hook style and CTA before you publish." },
      { title: "Image attachments", description: "Give the assistant visual context or attach media to a draft." },
      { title: "Voice call mode", description: "Hands-free dictation that streams straight into the AI pipeline." },
      { title: "Translation", description: "Localise a caption into any market without leaving the composer." },
      { title: "Templates & presets", description: "Reusable post structures your whole team can start from." },
    ],
  },
  {
    id: "publish",
    label: "Publish",
    features: [
      { title: "Visual calendar", description: "Month, week, timeline and kanban views of everything scheduled." },
      { title: "Drag-and-drop scheduling", description: "Reschedule by dragging a card; resize to adjust the posting window." },
      { title: "Best time to post", description: "Slot suggestions based on when your audience actually engages." },
      { title: "Cross-platform publishing", description: "One draft, per-platform variants, one queue." },
      { title: "Bulk scheduling", description: "Fill a week of slots in a single pass." },
      { title: "Story automation", description: "Queue and publish stories on the same schedule as feed posts." },
      { title: "RSS auto-posting", description: "Turn any feed into a stream of drafts or scheduled posts." },
      { title: "Approval workflow", description: "Review states so nothing goes live unreviewed." },
      { title: "Shared calendar links", description: "Give clients a read-only public view of the plan." },
    ],
  },
  {
    id: "engage",
    label: "Engage",
    features: [
      { title: "Unified inbox", description: "Comments and DMs from every channel in one queue." },
      { title: "AI replies", description: "Suggested responses that match your voice and context." },
      { title: "Automation rules", description: "Trigger replies, tags and routing on keywords or sentiment." },
      { title: "Bulk reply", description: "Clear a backlog of similar messages in one action." },
      { title: "Moderation tools", description: "Hide, flag or escalate anything that needs a human." },
      { title: "Rate limiting", description: "Human-like pacing that keeps automation inside platform limits." },
      { title: "Quick replies", description: "Saved snippets for the questions you answer daily." },
    ],
  },
  {
    id: "audience",
    label: "Audience",
    features: [
      { title: "Follower analyzer", description: "Growth, churn and quality signals per account." },
      { title: "Audience segments", description: "Group followers by behaviour and value." },
      { title: "Competitor tracking", description: "Benchmark reach, cadence and engagement against rivals." },
      { title: "Side-by-side compare", description: "Put two accounts next to each other across any metric." },
      { title: "Export", description: "Take segments and benchmarks out as CSV." },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    features: [
      { title: "Cross-platform overview", description: "One rollup of reach, engagement and growth." },
      { title: "Post-level metrics", description: "See exactly which content earned the results." },
      { title: "Custom reports", description: "Build a report from the blocks that matter to your stakeholders." },
      { title: "Report templates", description: "Start from a template and duplicate it per client in one click." },
      { title: "Scheduled delivery", description: "Send recurring reports automatically." },
      { title: "Account health", description: "A running score with the issues holding performance back." },
      { title: "Live insights panel", description: "Growth charts and unresolved conversations beside your calendar." },
    ],
  },
  {
    id: "library",
    label: "Library & Link in bio",
    features: [
      { title: "Asset library", description: "Central storage for approved media with versions." },
      { title: "Version history", description: "Roll back to any earlier take of an asset." },
      { title: "Content categories", description: "Organise assets and posts by pillar or campaign." },
      { title: "Link in bio pages", description: "A themed landing page for the most-clicked link you own." },
      { title: "Custom themes", description: "Match the page to your brand, fonts and colours included." },
      { title: "Link analytics", description: "See which blocks earn the clicks." },
    ],
  },
  {
    id: "team",
    label: "Team & collaboration",
    features: [
      { title: "Roles & permissions", description: "Owner, admin and member scopes on every action." },
      { title: "Email invites", description: "Bring teammates in with a single link." },
      { title: "Activity history", description: "A full audit trail of runs, publishes and edits." },
      { title: "Notifications engine", description: "Alerts for viral posts, engagement spikes and health drops." },
      { title: "Notification preferences", description: "Per-user control over what fires and where." },
      { title: "AI daily summary", description: "A written digest of what happened while you were away." },
    ],
  },
  {
    id: "platform",
    label: "Security & platform",
    features: [
      { title: "Real OAuth connections", description: "Official platform flows with revocable tokens." },
      { title: "Two-factor authentication", description: "TOTP and passkey-grade protection on your account." },
      { title: "Row-level data isolation", description: "Workspace data is scoped at the database level." },
      { title: "Credits system", description: "Transparent AI usage with balances, history and top-ups." },
      { title: "MCP integrations", description: "Connect the workspace to external AI clients and tools." },
      { title: "Webhooks", description: "Push events into the systems you already run." },
      { title: "White label", description: "Your brand on reports, bio pages and client views." },
      { title: "Demo mode", description: "A fully isolated sandbox for prospects and training." },
    ],
  },
];

export default function Features() {
  const [active, setActive] = useState(groups[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-120px 0px -65% 0px", threshold: 0 },
    );
    groups.forEach((g) => {
      const el = document.getElementById(g.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const total = groups.reduce((n, g) => n + g.features.length, 0);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Navbar />

      <header className="border-b border-border/60">
        <div className="container mx-auto px-4 pt-28 pb-14 lg:pt-36 lg:pb-20 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Features</p>
          <h1 className="font-['Instrument_Serif'] text-4xl sm:text-6xl lg:text-7xl mt-4 leading-[1.02] max-w-4xl mx-auto">
            Explore all our <span className="italic text-primary">features.</span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            {total} capabilities across creating, publishing, engaging and measuring — everything
            your team needs to run social in one workspace.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/signup">
              <Button className="rounded-full px-6 text-[11px] uppercase tracking-[0.2em]">
                Start free trial
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" className="rounded-full px-6 text-[11px] uppercase tracking-[0.2em]">
                See pricing
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 lg:py-16 grid lg:grid-cols-[220px_minmax(0,1fr)] gap-10 lg:gap-16">
        <nav aria-label="Feature categories" className="lg:sticky lg:top-28 self-start">
          <ul className="flex lg:flex-col gap-2 flex-wrap">
            {groups.map((g) => (
              <li key={g.id}>
                <a
                  href={`#${g.id}`}
                  className={cn(
                    "block rounded-full lg:rounded-lg border px-3.5 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors",
                    active === g.id
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40",
                  )}
                >
                  {g.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-16">
          {groups.map((g) => (
            <section key={g.id} id={g.id} className="scroll-mt-28 space-y-6">
              <div className="flex items-baseline gap-3 border-b border-border/60 pb-4">
                <h2 className="font-['Instrument_Serif'] text-3xl sm:text-4xl leading-tight">
                  {g.label}
                </h2>
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {g.features.length}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-px bg-border/60 border border-border/60 rounded-xl overflow-hidden">
                {g.features.map((f) => (
                  <div
                    key={f.title}
                    className="bg-background hover:bg-muted/40 transition-colors p-5 space-y-2"
                  >
                    <h3 className="text-sm font-semibold tracking-tight">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="border-t border-border/60">
        <div className="container mx-auto px-4 py-16 lg:py-20 text-center">
          <h2 className="font-['Instrument_Serif'] text-3xl sm:text-5xl leading-tight">
            Ready to try every one of them?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Start a free trial, or explore the live demo workspace first — no card required.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/signup">
              <Button className="rounded-full px-6 text-[11px] uppercase tracking-[0.2em]">
                Start free trial
              </Button>
            </Link>
            <Link to="/tools">
              <Button variant="outline" className="rounded-full px-6 text-[11px] uppercase tracking-[0.2em]">
                Browse tools
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
