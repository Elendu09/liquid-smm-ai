import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FAQSection } from "@/components/landing/FAQSection";
import { FAQExtended } from "@/components/landing/FAQExtended";
import { CTASection } from "@/components/landing/CTASection";

export default function FAQ() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Navbar />

      <header className="border-b border-border/60">
        <div className="container mx-auto px-4 pt-28 pb-12 lg:pt-36 lg:pb-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">FAQ</p>
          <h1 className="font-['Instrument_Serif'] text-4xl sm:text-5xl lg:text-6xl mt-3 leading-[1.05]">
            Answers before you <span className="italic text-primary">commit.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Trials, platforms, automation safety, billing and team plans — the questions we get most.
          </p>
        </div>
      </header>

      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
