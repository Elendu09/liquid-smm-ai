import { CompanyLayout, Section } from "./CompanyLayout";

const values = [
  {
    title: "Ship consistently",
    body: "Social teams win on rhythm, not bursts. Every feature we build should make the next post easier than the last.",
  },
  {
    title: "AI with a human hand",
    body: "Captions, hashtags, replies and summaries are drafted by AI — approved, edited and owned by you.",
  },
  {
    title: "One workspace, every channel",
    body: "Fourteen platforms, one calendar, one inbox, one analytics view. No tab juggling, no copy-paste.",
  },
  {
    title: "Transparent by default",
    body: "Clear credits, clear permissions, clear data handling. You always know what runs on your behalf.",
  },
];

const stats = [
  { value: "14", label: "Supported platforms" },
  { value: "1", label: "Unified calendar" },
  { value: "24/7", label: "Automation runtime" },
  { value: "100%", label: "Your content, your data" },
];

export default function About() {
  return (
    <CompanyLayout
      title="About SMMSAAS"
      subtitle="We build the workspace where social teams plan, create, publish and measure everything in one place — with AI doing the heavy lifting."
    >
      <div className="space-y-14">
        <Section heading="Why we exist">
          <p>
            Social media work is fragmented: a scheduler here, an analytics tool there, a spreadsheet
            for approvals, and a group chat holding it all together. SMMSAAS collapses that stack into
            a single, fast workspace built for teams that publish every day.
          </p>
          <p>
            From the first onboarding step to the weekly report, the product is designed around one
            question — what does this team need to ship next?
          </p>
        </Section>

        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-l border-border/60">
          {stats.map((s) => (
            <div key={s.label} className="border-b border-r border-border/60 p-6">
              <p className="font-['Instrument_Serif'] text-4xl leading-none">{s.value}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <section className="space-y-6">
          <h2 className="font-['Instrument_Serif'] text-2xl sm:text-3xl">What we believe</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-border/60 bg-muted/30 p-6 space-y-2"
              >
                <h3 className="font-['Instrument_Serif'] text-xl">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        <Section heading="How we work">
          <p>
            We are a small, remote-first team of builders, designers and social practitioners. We
            release often, read every support message, and prototype directly against real workflows
            instead of mockups.
          </p>
          <p>
            Have feedback, a partnership idea, or a workflow we should support? Reach us on the{" "}
            <a className="text-primary hover:underline" href="/contact">
              contact page
            </a>
            .
          </p>
        </Section>
      </div>
    </CompanyLayout>
  );
}
