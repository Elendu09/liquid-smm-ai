import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const companyNav = [
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

interface Props {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function CompanyLayout({ eyebrow = "Company", title, subtitle, children }: Props) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Navbar />

      <header className="border-b border-border/60">
        <div className="container mx-auto px-4 pt-28 pb-12 lg:pt-36 lg:pb-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
          <h1 className="font-['Instrument_Serif'] text-4xl sm:text-5xl lg:text-6xl mt-3 leading-[1.05]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            {subtitle}
          </p>

          <nav aria-label="Company pages" className="mt-8 flex flex-wrap gap-2">
            {companyNav.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors",
                  pathname === l.href
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 lg:py-16">{children}</main>

      <Footer />
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-3 max-w-3xl">
      <h2 className="font-['Instrument_Serif'] text-2xl sm:text-3xl leading-tight">{heading}</h2>
      <div className="space-y-3 text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
