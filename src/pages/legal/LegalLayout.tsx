import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const legalNav = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

interface Props {
  title: string;
  subtitle: string;
  updated: string;
  children: ReactNode;
}

export function LegalLayout({ title, subtitle, updated, children }: Props) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Navbar />

      <header className="border-b border-border/60">
        <div className="container mx-auto px-4 pt-28 pb-12 lg:pt-36 lg:pb-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Legal</p>
          <h1 className="font-['Instrument_Serif'] text-4xl sm:text-5xl lg:text-6xl mt-3 leading-[1.05]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
          <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
            Last updated {updated}
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 lg:py-16 grid lg:grid-cols-[220px_minmax(0,1fr)] gap-10 lg:gap-16">
        <nav aria-label="Legal pages" className="lg:sticky lg:top-28 self-start">
          <ul className="flex lg:flex-col gap-2 flex-wrap">
            {legalNav.map((l) => (
              <li key={l.href}>
                <Link
                  to={l.href}
                  className={cn(
                    "block rounded-full lg:rounded-lg border px-3.5 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors",
                    pathname === l.href
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="max-w-3xl space-y-10">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-5 text-sm text-muted-foreground leading-relaxed">
            This page is maintained by the SMMSAAS team to answer common questions about how the
            product works. It describes our own practices and product controls — it is not a
            certification, audit report, or legal advice. Contact us if you need contract-specific
            terms.
          </div>
          {children}
        </article>
      </div>

      <Footer />
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-['Instrument_Serif'] text-2xl sm:text-3xl leading-tight">{heading}</h2>
      <div className="space-y-3 text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-4">
      {items.map((i) => (
        <li key={i} className="relative pl-3 before:absolute before:left-0 before:top-2.5 before:h-1 before:w-1 before:rounded-full before:bg-primary">
          {i}
        </li>
      ))}
    </ul>
  );
}
