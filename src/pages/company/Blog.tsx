import { CompanyLayout } from "./CompanyLayout";

const posts = [
  {
    title: "How to build a publishing rhythm your team can actually keep",
    excerpt:
      "A practical framework for turning scattered ideas into a weekly calendar that survives busy weeks — and the automations that keep it running.",
    category: "Playbooks",
    date: "July 2026",
    readTime: "7 min read",
  },
  {
    title: "AI captions that sound like you, not like a robot",
    excerpt:
      "Brand voice presets, tone controls and remix settings: how to get drafts that need edits measured in seconds, not rewrites.",
    category: "AI",
    date: "June 2026",
    readTime: "5 min read",
  },
  {
    title: "Reading your analytics without drowning in dashboards",
    excerpt:
      "Which metrics actually predict growth per platform, and how to build a weekly report your stakeholders will read.",
    category: "Analytics",
    date: "June 2026",
    readTime: "6 min read",
  },
  {
    title: "Approvals without the bottleneck",
    excerpt:
      "Roles, review states and comment threads — setting up a workflow where nothing ships unreviewed and nothing sits waiting.",
    category: "Teams",
    date: "May 2026",
    readTime: "4 min read",
  },
  {
    title: "The unified inbox: turning comments and DMs into conversations",
    excerpt:
      "Triage rules, saved replies and automation limits that keep engagement fast without sounding automated.",
    category: "Engagement",
    date: "May 2026",
    readTime: "5 min read",
  },
  {
    title: "Link in bio as a real landing page",
    excerpt:
      "Themes, blocks and tracking — how to make the single most-clicked link in your profile do more work.",
    category: "Growth",
    date: "April 2026",
    readTime: "4 min read",
  },
];

export default function Blog() {
  const [featured, ...rest] = posts;

  return (
    <CompanyLayout
      eyebrow="Blog"
      title="Notes on social, AI and shipping"
      subtitle="Playbooks, product notes and lessons from teams publishing across every channel."
    >
      <div className="space-y-12">
        <article className="rounded-2xl border border-border/60 bg-muted/30 p-8 lg:p-12">
          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-primary">{featured.category}</span>
            <span>{featured.date}</span>
            <span>{featured.readTime}</span>
          </div>
          <h2 className="font-['Instrument_Serif'] text-3xl sm:text-4xl lg:text-5xl mt-4 leading-[1.1] max-w-3xl">
            {featured.title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            {featured.excerpt}
          </p>
          <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
            Full article coming soon
          </p>
        </article>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.map((p) => (
            <article
              key={p.title}
              className="rounded-xl border border-border/60 p-6 flex flex-col gap-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="text-primary">{p.category}</span>
                <span>·</span>
                <span>{p.date}</span>
              </div>
              <h3 className="font-['Instrument_Serif'] text-xl leading-snug">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{p.excerpt}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
                {p.readTime}
              </p>
            </article>
          ))}
        </div>
      </div>
    </CompanyLayout>
  );
}
