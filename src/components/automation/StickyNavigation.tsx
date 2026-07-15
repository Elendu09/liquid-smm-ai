import { useState, useEffect } from "react";
import { Menu, X, Zap, Sparkles, Calendar, Bot, TrendingUp, Hash, MessageCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { id: "hero", label: "Home", icon: Home },
  { id: "caption-generator", label: "Caption AI", icon: Sparkles },
  { id: "scheduler", label: "Scheduler", icon: Calendar },
  { id: "engagement-bot", label: "Engagement", icon: Bot },
  { id: "hashtag-tool", label: "Hashtags", icon: Hash },
  { id: "comment-manager", label: "Comments", icon: MessageCircle },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
];

export const StickyNavigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Determine active section
      const sections = navItems.map((item) => {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          return { id: item.id, top: rect.top };
        }
        return { id: item.id, top: Infinity };
      });

      const activeSection = sections.find((section) => section.top > -100 && section.top < 300);
      if (activeSection) {
        setActiveSection(activeSection.id);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">SMMSAAS</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Automation Suite</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeSection === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="flex items-center gap-3">
              <Button className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground font-semibold glow-blue">
                Get Started
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setIsMobileMenuOpen(false)} />
          <nav className="absolute top-16 left-0 right-0 p-4 bg-card border-b border-border shadow-xl animate-fade-in">
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all ${
                    activeSection === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
            <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Get Started
            </Button>
          </nav>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />
    </>
  );
};
