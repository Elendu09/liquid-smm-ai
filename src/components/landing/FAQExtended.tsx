import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Group = { label: string; blurb: string; items: { question: string; answer: string }[] };

const groups: Group[] = [
  {
    label: "Platforms & connections",
    blurb: "Connecting channels, permissions and limits.",
    items: [
      { question: "How do I connect a social channel?", answer: "Go to Settings → Connected accounts (or run the onboarding setup) and pick a platform. You'll be sent through the platform's official OAuth screen, approve the permissions, and the channel appears in your account switcher within seconds. No passwords are ever typed into SMMSAAS." },
      { question: "Can I manage multiple brands or clients from one workspace?", answer: "Yes. Every connected channel lives in a global account context, so you can switch brands from the header switcher without logging out. Agency plans add client grouping, per-client permissions and white-label reporting." },
      { question: "What happens when a platform token expires?", answer: "We refresh tokens automatically in the background. If a platform force-expires a session (password change, revoked app, 2FA reset), the channel is flagged as 'needs reconnect', publishing for that channel pauses instead of failing silently, and you get a notification with a one-click reconnect link." },
      { question: "Do you support Google Business Profile and YouTube?", answer: "Yes — alongside Instagram, X, LinkedIn, Facebook, TikTok, Pinterest, Threads and more. Each platform exposes only the features its API allows, and the composer greys out anything unsupported for the selected channel." },
    ],
  },
  {
    label: "Publishing & scheduling",
    blurb: "Calendar, queues, approvals and recycling.",
    items: [
      { question: "How does the scheduling calendar work?", answer: "The calendar supports month, week time-grid, list and kanban views. Drag a card to reschedule, drag its edge to resize the posting window, or click an empty slot to compose in place. Everything snaps to 15-minute increments and respects each channel's timezone." },
      { question: "What are best times and how are they calculated?", answer: "We score every hour of the week using your own historical reach, engagement rate and audience activity per platform, then surface the top windows directly in the calendar. Scores refresh as new performance data arrives, so they get sharper the longer you publish." },
      { question: "Can I set up approvals before anything goes live?", answer: "Yes. Posts can move through draft → needs approval → approved → scheduled. Members can draft, admins and owners approve, and every state change is written to the activity log with who did it and when." },
      { question: "Does content recycling repost the same thing forever?", answer: "No. Recycling rules let you define how often an evergreen post can be reused, a cooldown period and an expiry date. Recycled posts can also be automatically remixed by AI so the caption differs each time." },
      { question: "What if a post fails to publish?", answer: "It's retried with backoff, then marked failed with the platform's exact error. You get a notification, the item stays in the queue, and you can fix and re-run it without recreating the post." },
    ],
  },
  {
    label: "AI, credits & automation",
    blurb: "How the assistant, credits and rules behave.",
    items: [
      { question: "What are credits and what consumes them?", answer: "Credits power AI actions: caption and variant generation, hashtag research, AI remix, image generation, voice mode, AI summaries and automated reports. Ordinary scheduling, analytics and publishing never cost credits. Your balance, burn rate and full event history live in Settings → Billing." },
      { question: "What happens if I run out of credits?", answer: "AI actions pause with a clear prompt — nothing else breaks. Scheduled posts still publish, analytics keep collecting and automations that don't use AI keep running. You can top up instantly and the new balance applies to the next action." },
      { question: "Does the AI learn my brand voice?", answer: "Yes. Save one or more brand voices with tone, audience, banned words and example posts. Every generation is conditioned on the active voice, and you can switch voices per brand or per campaign." },
      { question: "Is the engagement automation safe for my accounts?", answer: "It uses official APIs, human-like pacing, per-platform rate limits and daily caps you control. Rules can be tested in dry-run mode before going live, and everything an automation does is recorded in the activity log so nothing happens invisibly." },
      { question: "What is voice mode?", answer: "A hands-free mode in the command bar: you speak, it transcribes, routes the request through the same AI pipeline as typed prompts, and reads the answer back. It can draft, schedule and query analytics exactly like the text assistant." },
    ],
  },
  {
    label: "Analytics & reporting",
    blurb: "Data accuracy, exports and client reports.",
    items: [
      { question: "How fresh is the analytics data?", answer: "Metrics are collected on a rolling schedule per channel and rolled up hourly, with post-level metrics refreshed more aggressively for the first 48 hours after publishing when engagement moves fastest." },
      { question: "Can I build custom reports?", answer: "Yes. Pick metrics, date ranges, channels and comparison periods, save it as a template, then duplicate that template for every client in one click. Reports can be scheduled to email or export as PDF/CSV." },
      { question: "Do you support competitor benchmarking?", answer: "Add competitor handles and we track their public posting cadence, engagement rate and growth so you can benchmark share of voice next to your own numbers in the same chart." },
      { question: "Can I white-label reports for clients?", answer: "On Business and Agency plans — your logo, colours, domain and sender identity, with SMMSAAS branding removed from shared links and exported files." },
    ],
  },
  {
    label: "Billing, security & support",
    blurb: "Plans, data handling and getting help.",
    items: [
      { question: "Can I change plans mid-cycle?", answer: "Yes. Upgrades apply immediately and are prorated; downgrades take effect at the start of your next billing period so you keep what you paid for." },
      { question: "How is my data protected?", answer: "Data is encrypted in transit and at rest, access is enforced with row-level security so one workspace can never read another's records, and OAuth tokens are stored encrypted and never exposed to the browser." },
      { question: "Is demo mode connected to real data?", answer: "No — demo mode is completely isolated. It runs on sample content, writes nothing to real accounts, and cannot read or touch authenticated workspace data. Signing up starts a clean workspace." },
      { question: "What roles can team members have?", answer: "Owner, admin and member. Owners control billing and ownership, admins manage channels, approvals and invitations, and members create and schedule content within the permissions you grant." },
      { question: "How do I reach support?", answer: "The Help widget inside the app opens a guided troubleshooter and contact form. Every plan includes email support; Professional adds priority response and Business/Agency adds a dedicated manager with 24/7 escalation." },
    ],
  },
];

export function FAQExtended() {
  return (
    <section className="border-t border-border/60">
      <div className="container mx-auto px-4 py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">— Deep dive</p>
          <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight">
            Everything else, <span className="italic text-rainbow">in detail.</span>
          </h2>
          <p className="mt-5 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Grouped by what you're actually trying to do — connecting channels, publishing, automating, measuring and billing.
          </p>
        </div>

        <div className="mt-14 space-y-14">
          {groups.map((group) => (
            <div key={group.label} className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4">
                <h3 className="font-['Instrument_Serif'] text-2xl sm:text-3xl leading-tight">{group.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{group.blurb}</p>
              </div>
              <div className="lg:col-span-8">
                <Accordion type="single" collapsible className="space-y-3">
                  {group.items.map((item, i) => (
                    <AccordionItem
                      key={i}
                      value={`${group.label}-${i}`}
                      className="rounded-2xl border border-border/60 bg-foreground/[0.02] backdrop-blur-xl px-5 sm:px-6 data-[state=open]:border-primary/40"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-5 font-['Instrument_Serif'] text-lg md:text-xl leading-snug">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
