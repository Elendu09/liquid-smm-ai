import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the 14-day free trial work?",
    answer: "You get full access to all features for 14 days, no credit card required. If you love it, choose a plan that fits your needs. If not, no worries — your account will simply be paused.",
  },
  {
    question: "Which social media platforms do you support?",
    answer: "We support Instagram, Twitter/X, LinkedIn, Facebook, TikTok, YouTube, and Pinterest. You can connect multiple accounts from each platform and manage them all from one dashboard.",
  },
  {
    question: "Is the engagement bot safe to use?",
    answer: "Absolutely! Our bot uses human-like behavior patterns, smart rate limiting, and respects all platform guidelines. We've processed over 500M engagements without issues.",
  },
  {
    question: "Can I schedule posts in advance?",
    answer: "Yes! You can schedule posts weeks or even months in advance. Our AI also suggests optimal posting times based on when your audience is most active.",
  },
  {
    question: "How accurate is the AI caption generator?",
    answer: "Our AI is trained on millions of high-performing social media posts. It learns your brand voice over time and generates captions with optimal length, tone, and hashtags for each platform.",
  },
  {
    question: "Do you offer team/agency plans?",
    answer: "Yes! Our Agency plan includes multi-user access, client management, white-label reports, and bulk operations. Contact us for custom enterprise solutions.",
  },
  {
    question: "What kind of analytics do you provide?",
    answer: "We provide real-time follower growth, engagement rates, best performing content, audience demographics, competitor analysis, and ROI tracking across all connected platforms.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time with no questions asked. Your account will remain active until the end of your billing period.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">FAQ</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about SMMPilot. Can't find the answer? Contact our support team.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
