import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Check,
  Minus,
  Zap,
  Crown,
  Building2,
  Sparkles,
  Users,
  BarChart3,
  Calendar,
  MessageSquare,
  Hash,
  Bot,
  Link2,
  Eye,
  Headphones,
  ShieldCheck,
  Rss,
  Workflow,
  ArrowRight,
} from "lucide-react";

const plans = [
  {
    name: "Free",
    icon: Sparkles,
    description: "Everything you need to run one brand, forever free.",
    monthlyPrice: 0,
    annualPrice: 0,
    popular: false,
    custom: false,
    cta: "Get started free",
    ctaHref: "/signup",
    highlight: "1 brand workspace",
    features: [
      "1 brand with 3 connected channels",
      "20 scheduled posts / month",
      "30 days of analytics history",
      "5 competitor profiles tracked",
      "AI social assistant (50 credits/mo)",
      "MCP access & link-in-bio (1 page)",
    ],
    limitations: ["No team seats", "No approval workflow"],
  },
  {
    name: "Starter",
    icon: Zap,
    description: "For solo creators running a couple of channels.",
    monthlyPrice: 19,
    annualPrice: 15,
    popular: false,
    custom: false,
    cta: "Start free trial",
    ctaHref: "/signup",
    highlight: "3 social channels",
    features: [
      "Everything in Free, plus:",
      "10 channels across any platform",
      "500 scheduled posts / month",
      "Unified calendar, list & kanban views",
      "AI captions & hashtags (200 credits/mo)",
      "Unlimited analytics history",
      "PDF & PPT report exports",
    ],
    limitations: ["No engagement automation", "No team seats"],
  },
  {
    name: "Professional",
    icon: Crown,
    description: "For brands publishing everywhere, every day.",
    monthlyPrice: 49,
    annualPrice: 39,
    popular: true,
    custom: false,
    cta: "Start free trial",
    ctaHref: "/signup",
    highlight: "15 social channels",
    features: [
      "Everything in Starter, plus:",
      "15 channels & unlimited publishing",
      "Advanced analytics, best-times & heatmaps",
      "AI captions, remix & images (2,000 credits/mo)",
      "Engagement automation & unified inbox",
      "Approval workflow + 3 team seats",
      "Smartlinks & multiple link-in-bio pages",
      "Priority support",
    ],
    limitations: ["No white-label reporting", "No SSO"],
  },
  {
    name: "Custom",
    icon: Building2,
    description: "For agencies and enterprises managing many clients.",
    monthlyPrice: null,
    annualPrice: null,
    popular: false,
    custom: true,
    cta: "Let's talk",
    ctaHref: "/contact",
    highlight: "Custom number of brands",
    features: [
      "Custom channels & client workspaces",
      "Everything in Professional, uncapped",
      "White-label reports & shared client calendars",
      "Custom AI assistant credits",
      "Competitor tracking & share-of-voice",
      "Unlimited seats with owner/admin/member roles",
      "API + MCP access, webhooks & SSO",
      "Dedicated account manager, 24/7 escalation",
    ],
    limitations: [],
  },
];

const featureComparison = [
  { feature: "Social channels", free: "3", starter: "10", professional: "15", business: "Custom", icon: Users },
  { feature: "Scheduled posts", free: "20/mo", starter: "500/mo", professional: "Unlimited", business: "Unlimited", icon: Calendar },
  { feature: "AI credits included", free: "50/mo", starter: "200/mo", professional: "2,000/mo", business: "Custom", icon: Sparkles },
  { feature: "Analytics history", free: "30 days", starter: "Unlimited", professional: "Unlimited", business: "Unlimited", icon: BarChart3 },
  { feature: "Reports & exports", free: false, starter: "PDF & PPT", professional: "Templates", business: "White-label", icon: BarChart3 },
  { feature: "Hashtag research", free: "Basic", starter: "Basic", professional: "Advanced", business: "Premium", icon: Hash },
  { feature: "Engagement automation", free: false, starter: false, professional: true, business: "Premium", icon: Bot },
  { feature: "Unified inbox & moderation", free: false, starter: false, professional: true, business: true, icon: MessageSquare },
  { feature: "Stories & RSS autolists", free: false, starter: true, professional: true, business: true, icon: Rss },
  { feature: "Approval workflow", free: false, starter: false, professional: true, business: true, icon: ShieldCheck },
  { feature: "Link-in-bio & smartlinks", free: "1 page", starter: "Multiple", professional: "Standard", business: "Custom domain", icon: Link2 },
  { feature: "Competitor tracking", free: "5", starter: "100", professional: "100", business: "Unlimited", icon: Eye },
  { feature: "DM automation", free: false, starter: false, professional: true, business: true, icon: MessageSquare },
  { feature: "Team seats", free: "1", starter: "1", professional: "3", business: "Unlimited", icon: Users },
  { feature: "API, MCP & webhooks", free: "MCP only", starter: "MCP only", professional: true, business: true, icon: Workflow },
  { feature: "Support", free: "Community", starter: "Email", professional: "Priority", business: "24/7 dedicated", icon: Headphones },
];


const faqs = [
  { question: "Can I switch plans at any time?", answer: "Yes. Upgrades apply instantly and are prorated; downgrades take effect at the start of your next billing period so you keep everything you already paid for." },
  { question: "How do AI credits work alongside my plan?", answer: "Each plan includes a monthly credit allowance for AI actions — captions, remixes, images, voice mode and AI reports. Scheduling, publishing and analytics never cost credits, and you can top up any time from Settings → Billing." },
  { question: "Is there a free trial?", answer: "Every plan includes a 14-day free trial with no card required. You also get an instant demo workspace if you'd rather look around before signing up." },
  { question: "Which platforms are included?", answer: "All of them, on every plan — Instagram, X, LinkedIn, Facebook, TikTok, YouTube, Pinterest, Threads and Google Business. Plans differ by how many channels you connect, not which networks you get." },
  { question: "What payment methods do you accept?", answer: "All major cards, plus invoicing and bank transfer for annual Agency contracts." },
  { question: "Are my connected accounts safe?", answer: "We use official platform APIs and OAuth only — we never ask for or store social passwords. Tokens are encrypted, workspaces are isolated with row-level security, and automation respects each platform's rate limits." },
];

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <header className="border-b border-border/60">
        <div className="container mx-auto px-4 pt-28 pb-14 lg:pt-36 lg:pb-20">
          <div className="grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">— Pricing</p>
              <h1 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl mt-4 leading-[0.95] tracking-tight">
                One workspace for <span className="italic text-rainbow">every channel.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                Plan, schedule, automate and measure social media across Instagram, TikTok, LinkedIn, X, YouTube, Facebook, Pinterest, Threads and Google Business — from a single calendar with one AI assistant.
              </p>
            </div>

            <div className="lg:col-span-5 lg:justify-self-end w-full lg:w-auto">
              <div className="rounded-3xl border border-border/60 bg-foreground/[0.02] backdrop-blur-xl p-6">
                <div className="flex items-center justify-between gap-6">
                  <Label htmlFor="billing" className={`text-sm ${!isAnnual ? "font-semibold" : "text-muted-foreground"}`}>
                    Monthly
                  </Label>
                  <Switch id="billing" checked={isAnnual} onCheckedChange={setIsAnnual} />
                  <Label htmlFor="billing" className={`text-sm ${isAnnual ? "font-semibold" : "text-muted-foreground"}`}>
                    Annual
                  </Label>
                </div>
                <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                  {isAnnual ? "Billed yearly — two months free on every plan." : "Billed monthly — switch to annual any time to save 20%."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="rounded-full border border-border/60 px-3 py-1">14-day trial</span>
                  <span className="rounded-full border border-border/60 px-3 py-1">No card</span>
                  <span className="rounded-full border border-border/60 px-3 py-1">Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Plans */}
      <section className="border-b border-border/60">
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl border p-7 lg:p-8 backdrop-blur-xl transition-colors ${
                  plan.popular
                    ? "border-primary/50 bg-primary/[0.04] shadow-[0_24px_80px_-40px_hsl(var(--primary)/0.6)]"
                    : "border-border/60 bg-foreground/[0.02] hover:border-border"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-8 rounded-full border border-primary/40 bg-background px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">
                    Most popular
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${plan.popular ? "border-primary/40 text-primary" : "border-border/60 text-muted-foreground"}`}>
                    <plan.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="font-['Instrument_Serif'] text-2xl leading-none">{plan.name}</h2>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{plan.highlight}</p>
                  </div>
                </div>

                <p className="mt-5 text-sm text-muted-foreground leading-relaxed min-h-[40px]">{plan.description}</p>

                <div className="mt-6 flex items-end gap-1">
                  <span className="font-['Instrument_Serif'] text-6xl leading-none">${isAnnual ? plan.annualPrice : plan.monthlyPrice}</span>
                  <span className="text-sm text-muted-foreground pb-2">/ month</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isAnnual ? `Billed annually at $${plan.annualPrice * 12}` : "Billed monthly, cancel anytime"}
                </p>

                <Button
                  asChild
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                  className="mt-7 w-full rounded-full"
                >
                  <Link to="/signup">
                    Start free trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <div className="mt-8 h-px bg-border/60" />

                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.popular ? "text-primary" : "text-foreground/70"}`} />
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-3 text-muted-foreground">
                      <Minus className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Need more than 10,000 credits, SSO or a custom retention policy?{" "}
            <Link to="/contact" className="text-primary underline underline-offset-4">Talk to sales</Link>.
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-b border-border/60">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">— Compare</p>
            <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl leading-[0.98] tracking-tight">
              Every feature, <span className="italic text-rainbow">side by side.</span>
            </h2>
          </div>

          <div className="mt-12 overflow-x-auto rounded-3xl border border-border/60 bg-foreground/[0.02] backdrop-blur-xl">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[320px] text-[11px] uppercase tracking-[0.18em]">Feature</TableHead>
                  <TableHead className="text-center text-[11px] uppercase tracking-[0.18em]">Starter</TableHead>
                  <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] bg-primary/5">Professional</TableHead>
                  <TableHead className="text-center text-[11px] uppercase tracking-[0.18em]">Agency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureComparison.map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <row.icon className="h-4 w-4 text-muted-foreground" />
                        {row.feature}
                      </div>
                    </TableCell>
                    {([row.starter, row.professional, row.business] as const).map((value, i) => (
                      <TableCell key={i} className={`text-center ${i === 1 ? "bg-primary/5" : ""}`}>
                        {typeof value === "boolean" ? (
                          value ? (
                            <Check className="h-4 w-4 text-primary mx-auto" />
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground/60 mx-auto" />
                          )
                        ) : (
                          <span className={`text-sm ${i === 1 ? "font-medium" : ""}`}>{value}</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border/60">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">— Billing FAQ</p>
              <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl leading-[0.98] tracking-tight">
                Pricing <span className="italic text-rainbow">questions.</span>
              </h2>
              <p className="mt-5 text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed">
                Looking for product answers instead?{" "}
                <Link to="/faq" className="text-primary underline underline-offset-4">Read the full FAQ</Link>.
              </p>
            </div>

            <div className="lg:col-span-7">
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="rounded-2xl border border-border/60 bg-foreground/[0.02] backdrop-blur-xl px-5 sm:px-6 data-[state=open]:border-primary/40"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-5 font-['Instrument_Serif'] text-lg md:text-xl leading-snug">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="container mx-auto px-4 py-20 lg:py-28">
          <div className="rounded-[2rem] border border-border/60 bg-foreground/[0.02] backdrop-blur-xl p-10 lg:p-16 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">— Get started</p>
            <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl lg:text-6xl mt-5 leading-[0.98] tracking-tight max-w-3xl mx-auto">
              Automate your whole social presence, <span className="italic text-rainbow">not just one app.</span>
            </h2>
            <p className="mt-6 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Connect every channel, let AI draft and schedule the work, and watch performance roll up into one report. Start free — no card, no lock-in.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="rounded-full px-8" asChild>
                <Link to="/signup">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start free trial
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                <Link to="/contact">Talk to sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
