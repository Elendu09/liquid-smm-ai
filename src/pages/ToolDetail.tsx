import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, HelpCircle, Sparkles, Star } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Seo } from "@/components/shared/Seo";
import { CTASection } from "@/components/landing/CTASection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tools, toolBySlug } from "@/data/tools";
import { useAuthUser } from "@/hooks/useAuthUser";
import { cn } from "@/lib/utils";

/**
 * ToolDetail
 *
 * The page users land on when they click "Try now" on /tools. It
 * shows what the tool does, a real screenshot, a step-by-step "how
 * to use" guide, an FAQ, and a single primary CTA that goes to:
 *   - /dashboard/{href}    if the user is signed in
 *   - /signup?next={href}   if the user is signed out
 *
 * This replaces the old behaviour where "Try now" jumped straight
 * into a deep dashboard route, which confused new visitors.
 */
export default function ToolDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const tool = toolBySlug[slug];
  const { user, isGuest } = useAuthUser();
  const navigate = useNavigate();
  const Icon = tool?.icon ?? Sparkles;

  if (!tool) {
    return (
      <>
        <Seo title="Tool not found" description="The tool you're looking for doesn't exist." canonical="/tools" />
        <div className="min-h-dvh bg-background text-foreground">
          <Navbar />
          <main className="container mx-auto px-4 py-32 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">404</p>
            <h1 className="mt-3 font-['Instrument_Serif'] text-4xl">That tool does not exist.</h1>
            <p className="mt-3 text-sm text-muted-foreground">It may have been renamed or the link is wrong.</p>
            <Button asChild className="mt-6">
              <Link to="/tools">Back to all tools</Link>
            </Button>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const goToDashboard = () => {
    if (user && !isGuest) navigate(tool.dashboardHref);
    else navigate(`/signup?next=${encodeURIComponent(tool.dashboardHref)}`);
  };

  return (
    <>
      <Seo
        title={tool.title}
        description={tool.tagline}
        canonical={`/tools/${tool.slug}`}
        image={tool.screenshot}
        keywords={["social media", tool.category.toLowerCase(), tool.slug, "smmsaas"]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: tool.title,
          applicationCategory: tool.category,
          operatingSystem: "Web",
          description: tool.tagline,
          image: `https://smmsaas.com${tool.screenshot}`,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD", category: "Free trial" },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.7", reviewCount: "128" },
        }}
      />
      <div className="min-h-dvh bg-background text-foreground">
        <Navbar />

        <header className="border-b border-border/60">
          <div className="container mx-auto max-w-6xl px-4 pt-28 pb-12 lg:pt-32 lg:pb-16">
            <Link to="/tools" className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> All tools
            </Link>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">{tool.badge}</Badge>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{tool.category}</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h1 className="font-['Instrument_Serif'] text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                    {tool.title}
                  </h1>
                </div>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {tool.tagline}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground/80">
                  {tool.description}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button size="lg" onClick={goToDashboard} className="rounded-full px-6 h-12 text-[12px] uppercase tracking-[0.18em] font-semibold">
                    Get started
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  <Link
                    to="/signup"
                    className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
                  >
                    Create a free account
                  </Link>
                  <div className="ml-auto hidden items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:flex">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="ml-1.5">4.7 / 128 reviews</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl shadow-primary/5">
                  <img
                    src={tool.screenshot}
                    alt={tool.screenshotAlt}
                    className="aspect-[16/10] w-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                  />
                </div>
                <div className="pointer-events-none absolute -inset-x-3 -bottom-3 -z-10 h-24 rounded-3xl bg-primary/20 blur-2xl" aria-hidden />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto max-w-6xl px-4 py-12 lg:py-20 space-y-16">
          <section>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">What it does</p>
            <h2 className="mt-2 font-['Instrument_Serif'] text-3xl sm:text-4xl">Everything this tool does, in one place</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {tool.features.map((f, i) => {
                const FeatureIcon = f.icon ?? Check;
                return (
                  <div key={i} className="rounded-2xl border border-border/60 bg-card/60 p-5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                        <FeatureIcon className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-semibold">{f.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.detail}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">How to use it</p>
            <h2 className="mt-2 font-['Instrument_Serif'] text-3xl sm:text-4xl">Up and running in four steps</h2>
            <ol className="mt-6 grid gap-3 md:grid-cols-2">
              {tool.howTo.map((step, i) => (
                <li key={i} className="flex gap-3 rounded-2xl border border-border/60 bg-card/60 p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Why teams pick it</p>
            <h2 className="mt-2 font-['Instrument_Serif'] text-3xl sm:text-4xl">What you get for the time you save</h2>
            <ul className="mt-6 grid gap-2.5 md:grid-cols-3">
              {tool.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-card/60 p-3 text-sm">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Common questions</p>
            <h2 className="mt-2 font-['Instrument_Serif'] text-3xl sm:text-4xl">Before you click Get started</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {tool.faq.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border border-border/60 bg-card/60 p-4 open:bg-card"
                >
                  <summary className="flex cursor-pointer list-none items-start gap-2 text-sm font-semibold">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f.q}
                  </summary>
                  <p className="mt-2 pl-6 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card p-6 sm:p-10">
            <div className="grid items-center gap-6 sm:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Try {tool.title}</p>
                <h3 className="mt-2 font-['Instrument_Serif'] text-3xl leading-tight sm:text-4xl">
                  Open the dashboard, run your first {tool.title.toLowerCase()} in under two minutes.
                </h3>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                  Free to start, no credit card, no setup. Sign in or create an account, and the
                  tool opens on the right page — already wired to your channels.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Button size="lg" onClick={goToDashboard} className="rounded-full px-6 h-12 text-[12px] uppercase tracking-[0.18em] font-semibold">
                    Get started
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  <Link to="/tools" className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
                    See all tools
                  </Link>
                </div>
              </div>
              <ul className="space-y-2">
                {tool.benefits.map((b) => (
                  <li key={b} className={cn("flex items-start gap-2 rounded-xl border border-border/60 bg-card p-3 text-sm")}>
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Other tools you might like</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.filter((t) => t.slug !== tool.slug).slice(0, 3).map((t) => {
                const TIcon = t.icon;
                return (
                  <Link
                    key={t.slug}
                    to={`/tools/${t.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-colors hover:border-primary/40"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img src={t.screenshot} alt={t.screenshotAlt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    </div>
                    <div className="flex flex-1 items-start gap-2.5 p-4">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <TIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">{t.title}</h3>
                        <p className="line-clamp-2 text-[11px] text-muted-foreground">{t.tagline}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </main>

        <CTASection />
        <Footer />
      </div>
    </>
  );
}
