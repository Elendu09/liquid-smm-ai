import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { question: "How does the 14-day free trial work?", answer: "You get full access to all features for 14 days, no credit card required. If you love it, choose a plan that fits your needs. If not, no worries — your account will simply be paused." },
  { question: "Which social media platforms do you support?", answer: "We support Instagram, X, LinkedIn, Facebook, TikTok, YouTube, and Google Business. You can connect multiple accounts from each platform and manage them all from one dashboard." },
  { question: "Is the engagement bot safe to use?", answer: "Absolutely. Our bot uses human-like behavior patterns, smart rate limiting, and respects all platform guidelines. We've processed over 500M engagements without issues." },
  { question: "Can I schedule posts in advance?", answer: "Yes — you can schedule posts weeks or even months in advance. Our AI also suggests optimal posting times based on when your audience is most active." },
  { question: "How accurate is the AI caption generator?", answer: "Our AI is trained on millions of high-performing social media posts. It learns your brand voice over time and generates captions with optimal length, tone, and hashtags for each platform." },
  { question: "Do you offer team / agency plans?", answer: "Yes. Our Agency plan includes multi-user access, client management, white-label reports, and bulk operations. Contact us for custom enterprise solutions." },
  { question: "What kind of analytics do you provide?", answer: "Real-time follower growth, engagement rates, best performing content, audience demographics, competitor analysis, and ROI tracking across all connected platforms." },
  { question: "Can I cancel my subscription anytime?", answer: "Yes — cancel anytime, no questions asked. Your account remains active until the end of your billing period." },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-5">— FAQ</p>
            <h2 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
              Frequently asked <span className="italic text-rainbow">questions.</span>
            </h2>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-md">
              Everything you need to know about SMMSAAS. Can't find your answer? Reach our support team from the Help widget.
            </p>
          </div>

          <div className="lg:col-span-7">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl px-6 data-[state=open]:border-primary/40"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-6 font-['Instrument_Serif'] text-xl md:text-2xl leading-snug">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
