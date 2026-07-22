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
      className="relative overflow-hidden bg-background text-foreground border-t border-white/5"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.14] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-20 lg:py-32 relative">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-6">
              — Start growing today
            </p>
            <h2
              id="cta-heading"
              className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.92] tracking-tight"
            >
              Ready to automate your
              <span className="italic text-rainbow"> social media growth</span>?
            </h2>
          </div>

          <div className="lg:col-span-5 lg:pl-8 lg:border-l lg:border-white/10">
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
              Join thousands of marketers saving 20+ hours per week and growing their
              audience on autopilot with SMMSAAS.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 rounded-full text-[11px] uppercase tracking-[0.2em] font-semibold shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_32px_hsl(var(--primary)/0.55)]"
                >
                  Start free trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-8 rounded-full text-[11px] uppercase tracking-[0.2em] font-semibold border-white/15 bg-white/5 hover:bg-white/10"
              >
                Schedule demo
              </Button>
            </div>

            <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary" />
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
