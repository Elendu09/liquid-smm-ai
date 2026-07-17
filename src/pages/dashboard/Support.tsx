import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/dashboard/shell/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageCircle,
  Bug,
  Lightbulb,
  Calendar,
  Search,
  Sparkles,
  BookOpen,
  History,
  Keyboard,
  Circle,
  LifeBuoy,
} from "lucide-react";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";
import { TOUR_OPEN_EVENT } from "@/hooks/useOnboardingTour";

const FAQ = [
  {
    q: "How do I connect a social account?",
    a: "Go to Settings → Connected accounts and click Connect for the platform. You'll be redirected to the platform's OAuth flow. Once approved, the account appears in your Account Switcher.",
  },
  {
    q: "What are AI usage limits?",
    a: "Every plan includes a monthly quota of AI generations (captions, hashtags, studio images). Your current usage is visible in Settings → Billing. Unused credits do not roll over.",
  },
  {
    q: "How does the autonomy setting work?",
    a: "Manual = you approve every action. Suggest = AI drafts and waits for approval. Auto with approval = AI queues actions and you review them in batches in Activity.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. Go to Settings → Account → Export data to download a JSON archive of your captions, schedules, analytics, and notification history.",
  },
  {
    q: "How do I change notification preferences?",
    a: "Open Activity → Notifications → Preferences to configure channels (in-app, email, webhook), severity thresholds, and quiet hours per rule.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Go to Settings → Billing → Manage subscription and click Cancel. You'll retain access until the end of the current billing period.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted in transit (TLS 1.3) and at rest. OAuth tokens are stored using row-level security. We never sell your data or use it to train external models.",
  },
  {
    q: "How do I invite team members?",
    a: "Settings → Team → Invite member. Assign a role (Owner, Admin, Editor, Viewer) — each has scoped permissions across posts, analytics, and settings.",
  },
  {
    q: "Why is a post stuck in the queue?",
    a: "Most stuck posts are due to expired OAuth tokens or platform rate limits. Open the post from the Queue to see the error, then reconnect the account or reschedule.",
  },
  {
    q: "Can I white-label the dashboard?",
    a: "White-label branding (logo, colors, custom domain) is available on the Agency and Enterprise plans. Contact us to enable it.",
  },
];

export default function Support() {
  const [query, setQuery] = useState("");
  const [contactOpen, setContactOpen] = useState(false);
  const [category, setCategory] = useState("Feedback");

  const filteredFaq = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ;
    return FAQ.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q),
    );
  }, [query]);

  const openContact = (cat: string) => {
    setCategory(cat);
    setContactOpen(true);
  };

  const openTour = () => {
    window.dispatchEvent(new Event(TOUR_OPEN_EVENT));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Help & Support"
        description="Search the FAQ, contact us, or take a quick product tour."
      />

      {/* Hero search */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" aria-hidden />
        <div className="relative p-6 sm:p-10 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <LifeBuoy className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How can we help?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Search our knowledge base or reach out directly.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="secondary" className="gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <Circle className="w-2 h-2 fill-current" /> 24/7 email support
              </Badge>
              <Badge variant="secondary">Avg. first reply &lt; 1 hour</Badge>
              <Badge variant="secondary">Human replies, always</Badge>
            </div>
          </div>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQs, e.g. billing, autonomy, export…"
              className="pl-11 h-12 text-sm rounded-xl"
              aria-label="Search FAQs"
            />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <QuickAction
          icon={MessageCircle}
          title="Contact Support"
          desc="Chat with a real human."
          onClick={() => openContact("Feedback")}
        />
        <QuickAction
          icon={Bug}
          title="Report a Bug"
          desc="Something broken? Tell us."
          onClick={() => openContact("Bug")}
        />
        <QuickAction
          icon={Lightbulb}
          title="Request a Feature"
          desc="Shape the roadmap."
          onClick={() => openContact("Feature request")}
        />
        <QuickAction
          icon={Calendar}
          title="Book a Demo"
          desc="Walk through with an expert."
          href="mailto:hello@smmsaas.app?subject=Demo request"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQ */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Frequently asked questions</h3>
            <span className="text-xs text-muted-foreground">{filteredFaq.length} results</span>
          </div>
          {filteredFaq.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No answers matched "{query}".{" "}
                <button
                  className="text-primary hover:underline"
                  onClick={() => openContact("Feedback")}
                >
                  Contact us instead
                </button>
                .
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-2 sm:p-4">
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaq.map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Guides + Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Guides & Resources</CardTitle>
              <CardDescription>Explore the product at your own pace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <ResourceLink icon={Sparkles} label="Product tour" hint="Interactive walkthrough" onClick={openTour} />
              <ResourceLink icon={BookOpen} label="Documentation" hint="Guides & API" href="https://docs.smmsaas.app" external />
              <ResourceLink icon={History} label="Changelog" hint="Recent releases" href="https://smmsaas.app/changelog" external />
              <ResourceLink
                icon={Keyboard}
                label="Keyboard shortcuts"
                hint="Press ⌘K anywhere"
                onClick={() => {
                  const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
                  window.dispatchEvent(e);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">System status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="font-medium">All systems operational</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>App version</span>
                <Badge variant="secondary">v2.4.1</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Current plan</span>
                <Link to="/dashboard/settings/billing" className="text-primary hover:underline">
                  Free plan
                </Link>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Region</span>
                <span>EU-West</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ContactSupportDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        defaultCategory={category}
      />
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  onClick,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <Card className="h-full transition-all hover:border-primary/60 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
      <CardContent className="p-5 flex flex-col gap-2 text-left">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </CardContent>
    </Card>
  );
  if (href) {
    return <a href={href}>{inner}</a>;
  }
  return (
    <button type="button" onClick={onClick} className="text-left">
      {inner}
    </button>
  );
}

function ResourceLink({
  icon: Icon,
  label,
  hint,
  href,
  onClick,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
}) {
  const inner = (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground truncate">{hint}</div>}
      </div>
    </div>
  );
  if (href) {
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {inner}
    </button>
  );
}
