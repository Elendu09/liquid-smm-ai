import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "14-day free trial",
  "No credit card required",
  "Cancel anytime",
  "Full feature access",
];

export function CTASection() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden bg-[hsl(var(--canvas))] text-[hsl(var(--canvas-ink))]"
    >
      {/* Subtle grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="container mx-auto px-4 py-20 lg:py-32 relative">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-center">
          {/* Left: headline */}
          <div className="lg:col-span-7">
            <p className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--canvas-muted))] mb-6">
              — Start growing today
            </p>
            <h2
              id="cta-heading"
              className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] tracking-tight"
            >
              Ready to automate your
              <span className="italic"> social media growth</span>?
            </h2>
          </div>

          {/* Right: copy + CTA */}
          <div className="lg:col-span-5 lg:pl-8 lg:border-l lg:border-[hsl(var(--canvas-border))]">
            <p className="text-lg text-[hsl(var(--canvas-muted))] mb-8 max-w-md leading-relaxed">
              Join thousands of marketers saving 20+ hours per week and growing their
              audience on autopilot with SMMSAAS.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button
                  variant="ink"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 text-base font-semibold rounded-full"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-8 text-base rounded-full border-[hsl(var(--canvas-ink))]/25 bg-transparent text-[hsl(var(--canvas-ink))] hover:bg-[hsl(var(--canvas-ink))]/5"
              >
                Schedule Demo
              </Button>
            </div>

            <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-[hsl(var(--canvas-muted))]">
                  <Check className="w-4 h-4 text-[hsl(var(--canvas-ink))]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
