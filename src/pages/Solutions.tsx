import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SolutionsGrid } from "@/components/landing/SolutionsGrid";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { solutions } from "@/config/solutions";

export default function SolutionsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: solutions.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.title,
      description: s.description,
      url: `https://liquid-smm-ai.lovable.app${s.ctaHref}`,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        <section className="pt-16 pb-4 lg:pt-24 lg:pb-6">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <span className="text-sm font-medium text-primary uppercase tracking-wider">
              Solutions
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              A solution for every{" "}
              <span className="bg-gradient-to-r from-brand-cyan to-brand-green bg-clip-text text-transparent">
                social workflow
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Eleven ready-to-run playbooks — from autopilot sharing to sentiment monitoring — each wired to the tools inside SMMSAAS.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/dashboard">
                <Button variant="primaryGlow" size="lg">
                  Start free
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <a href="#solutions">
                <Button variant="outline" size="lg">
                  Browse solutions
                </Button>
              </a>
            </div>
          </div>
        </section>

        <SolutionsGrid heading={false} />
      </main>
      <Footer />
    </div>
  );
}
