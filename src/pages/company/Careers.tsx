import { CompanyLayout, Section } from "./CompanyLayout";

const perks = [
  { title: "Remote-first", body: "Work from anywhere with overlap hours that suit your team." },
  { title: "Real ownership", body: "Small team, wide scope — you own features end to end." },
  { title: "Ship weekly", body: "Short feedback loops, no six-month roadmaps in a drawer." },
  { title: "Learning budget", body: "Courses, conferences and tools that make you better at the craft." },
];

const roles = [
  {
    title: "Senior Frontend Engineer",
    team: "Product",
    location: "Remote",
    type: "Full-time",
    body: "React, TypeScript and a design system you will help shape. You'll build the calendar, inbox and analytics surfaces used daily.",
  },
  {
    title: "Product Designer",
    team: "Design",
    location: "Remote",
    type: "Full-time",
    body: "Own flows from onboarding to reporting. Strong systems thinking and a taste for editorial, high-contrast interfaces.",
  },
  {
    title: "AI Engineer",
    team: "AI",
    location: "Remote",
    type: "Full-time",
    body: "Prompting, evaluation and pipelines for captions, summaries and voice. You care about output quality as much as latency.",
  },
  {
    title: "Customer Success Lead",
    team: "Support",
    location: "Remote",
    type: "Full-time",
    body: "Onboard teams, run feedback loops with product, and turn support signal into roadmap input.",
  },
];

export default function Careers() {
  return (
    <CompanyLayout
      eyebrow="Careers"
      title="Build the workspace social teams live in"
      subtitle="We're a small remote team shipping fast. If you like wide ownership and short feedback loops, we'd like to meet you."
    >
      <div className="space-y-14">
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {perks.map((p) => (
            <div key={p.title} className="rounded-xl border border-border/60 bg-muted/30 p-6 space-y-2">
              <h3 className="font-['Instrument_Serif'] text-xl">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </section>

        <section className="space-y-5">
          <h2 className="font-['Instrument_Serif'] text-2xl sm:text-3xl">Open roles</h2>
          <div className="border-t border-border/60">
            {roles.map((r) => (
              <div
                key={r.title}
                className="border-b border-border/60 py-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="space-y-2">
                  <h3 className="font-['Instrument_Serif'] text-2xl leading-tight">{r.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{r.body}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="rounded-full border border-border/60 px-2.5 py-1">{r.team}</span>
                    <span className="rounded-full border border-border/60 px-2.5 py-1">{r.location}</span>
                    <span className="rounded-full border border-border/60 px-2.5 py-1">{r.type}</span>
                  </div>
                </div>
                <a
                  href={`mailto:careers@smmsaas.com?subject=${encodeURIComponent(r.title)}`}
                  className="justify-self-start lg:justify-self-end rounded-full border border-primary/50 bg-primary/10 text-primary px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] hover:bg-primary/20 transition-colors"
                >
                  Apply
                </a>
              </div>
            ))}
          </div>
        </section>

        <Section heading="Don't see your role?">
          <p>
            We always read thoughtful open applications. Tell us what you'd want to own and link
            something you've built — write to{" "}
            <a className="text-primary hover:underline" href="mailto:careers@smmsaas.com">
              careers@smmsaas.com
            </a>
            .
          </p>
        </Section>
      </div>
    </CompanyLayout>
  );
}
