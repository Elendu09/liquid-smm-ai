import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Check, 
  X, 
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
  Headphones
} from "lucide-react";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      icon: Zap,
      description: "Perfect for individuals just getting started",
      monthlyPrice: 19,
      annualPrice: 15,
      popular: false,
      features: [
        "1 Instagram account",
        "500 scheduled posts/month",
        "Basic analytics",
        "AI caption generator (50/month)",
        "Hashtag research (basic)",
        "Email support",
      ],
      limitations: [
        "No auto-engagement",
        "No competitor tracking",
        "No DM automation",
      ]
    },
    {
      name: "Professional",
      icon: Crown,
      description: "For creators and growing businesses",
      monthlyPrice: 49,
      annualPrice: 39,
      popular: true,
      features: [
        "5 Instagram accounts",
        "Unlimited scheduled posts",
        "Advanced analytics & reports",
        "AI caption generator (unlimited)",
        "Hashtag research (advanced)",
        "Auto-engagement bot",
        "Comment management",
        "Story automation",
        "Link in bio builder",
        "Priority email support",
      ],
      limitations: [
        "No competitor tracking",
        "No DM automation",
      ]
    },
    {
      name: "Business",
      icon: Building2,
      description: "For agencies and large teams",
      monthlyPrice: 99,
      annualPrice: 79,
      popular: false,
      features: [
        "Unlimited Instagram accounts",
        "Unlimited scheduled posts",
        "White-label reports",
        "AI caption generator (unlimited)",
        "Advanced hashtag research",
        "Auto-engagement bot (premium)",
        "Comment management",
        "Story automation",
        "Link in bio builder (custom)",
        "Competitor tracking",
        "DM automation",
        "Follower analyzer",
        "Team collaboration",
        "API access",
        "Dedicated account manager",
        "24/7 priority support",
      ],
      limitations: []
    },
  ];

  const featureComparison = [
    { feature: "Instagram Accounts", starter: "1", professional: "5", business: "Unlimited", icon: Users },
    { feature: "Scheduled Posts", starter: "500/month", professional: "Unlimited", business: "Unlimited", icon: Calendar },
    { feature: "Analytics & Reports", starter: "Basic", professional: "Advanced", business: "White-label", icon: BarChart3 },
    { feature: "AI Caption Generator", starter: "50/month", professional: "Unlimited", business: "Unlimited", icon: Sparkles },
    { feature: "Hashtag Research", starter: "Basic", professional: "Advanced", business: "Premium", icon: Hash },
    { feature: "Auto-Engagement Bot", starter: false, professional: true, business: "Premium", icon: Bot },
    { feature: "Comment Management", starter: false, professional: true, business: true, icon: MessageSquare },
    { feature: "Story Automation", starter: false, professional: true, business: true, icon: Calendar },
    { feature: "Link in Bio Builder", starter: false, professional: "Standard", business: "Custom", icon: Link2 },
    { feature: "Competitor Tracking", starter: false, professional: false, business: true, icon: Eye },
    { feature: "DM Automation", starter: false, professional: false, business: true, icon: MessageSquare },
    { feature: "Team Collaboration", starter: false, professional: false, business: true, icon: Users },
    { feature: "API Access", starter: false, professional: false, business: true, icon: Zap },
    { feature: "Support", starter: "Email", professional: "Priority Email", business: "24/7 Dedicated", icon: Headphones },
  ];

  const faqs = [
    {
      question: "Can I switch plans at any time?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate will apply at the start of your next billing cycle."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes! All plans come with a 14-day free trial. No credit card required to start. You'll have full access to all features in your chosen plan during the trial period."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual Business plans."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "You can cancel your subscription at any time. You'll continue to have access to your plan features until the end of your current billing period."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all plans. If you're not satisfied, contact our support team for a full refund."
    },
    {
      question: "Is my Instagram account safe?",
      answer: "Absolutely. We use Instagram's official API and follow all platform guidelines. Your account credentials are encrypted and never stored in plain text. We also have built-in safety limits to protect your account."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Simple, Transparent Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Choose the Perfect Plan for Your{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Growth Journey
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Start with a 14-day free trial. No credit card required.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <Label htmlFor="billing" className={!isAnnual ? "font-semibold" : "text-muted-foreground"}>
                Monthly
              </Label>
              <Switch
                id="billing"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label htmlFor="billing" className={isAnnual ? "font-semibold" : "text-muted-foreground"}>
                Annual
                <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-500">
                  Save 20%
                </Badge>
              </Label>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative flex flex-col ${
                  plan.popular 
                    ? "border-primary shadow-lg shadow-primary/10 scale-105" 
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-accent">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-8">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    plan.popular 
                      ? "bg-gradient-to-br from-primary to-accent" 
                      : "bg-muted"
                  }`}>
                    <plan.icon className={`w-7 h-7 ${plan.popular ? "text-primary-foreground" : "text-foreground"}`} />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                    {isAnnual && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed annually (${plan.annualPrice * 12}/year)
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, limitIndex) => (
                      <li key={limitIndex} className="flex items-start gap-3 text-muted-foreground">
                        <X className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6">
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? "bg-gradient-to-r from-primary to-accent hover:opacity-90" 
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/signup">
                      Start Free Trial
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Compare All Features</h2>
            <p className="text-muted-foreground">
              See what's included in each plan
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Feature</TableHead>
                  <TableHead className="text-center">Starter</TableHead>
                  <TableHead className="text-center bg-primary/5">Professional</TableHead>
                  <TableHead className="text-center">Business</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureComparison.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <row.icon className="w-4 h-4 text-muted-foreground" />
                        {row.feature}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {typeof row.starter === "boolean" ? (
                        row.starter ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="text-sm">{row.starter}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center bg-primary/5">
                      {typeof row.professional === "boolean" ? (
                        row.professional ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="text-sm font-medium">{row.professional}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {typeof row.business === "boolean" ? (
                        row.business ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="text-sm">{row.business}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Instagram?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of creators and businesses who are already using InstaGrow to 
            accelerate their Instagram growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90" asChild>
              <Link to="/signup">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Free Trial
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
