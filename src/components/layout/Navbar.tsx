import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/useAuthUser";
import { HeaderAccountMenu } from "./HeaderAccountMenu";

type NavChild = { label: string; href: string; description?: string };
type NavItem = { label: string; href?: string; children?: NavChild[] };

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Product",
    children: [
      { label: "Features", href: "/features", description: "Every capability, category by category" },
      { label: "Tools", href: "/tools", description: "Free AI tools for captions, hashtags & more" },
      { label: "MCP Server", href: "/mcp", description: "Connect your workspace to AI agents" },
      { label: "Integrations", href: "/#tools", description: "Connect 14+ social platforms" },
      { label: "FAQ", href: "/faq", description: "Answers on publishing, AI and security" },
    ],
  },
  { label: "Solutions", href: "/solutions" },
  { label: "Tools", href: "/tools" },
  {
    label: "Company",
    children: [
      { label: "About", href: "/about", description: "Our mission and the team behind it" },
      { label: "Blog", href: "/blog", description: "Playbooks, teardowns and product news" },
      { label: "Careers", href: "/careers", description: "Remote-first roles, always open" },
      { label: "Contact", href: "/contact", description: "Talk to support, sales or legal" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isGuest } = useAuthUser();
  const isAuthed = !!user && !isGuest;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const go = (href: string) => {
    setIsMobileMenuOpen(false);
    setOpenMenu(null);
    if (href.startsWith("/#")) {
      const id = href.substring(2);
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    navigate(href);
  };

  const openWithDelay = (label: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 140);
  };

  const isActive = (item: NavItem) =>
    item.href
      ? location.pathname === item.href
      : (item.children ?? []).some((c) => location.pathname === c.href);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-transparent",
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 lg:h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="font-['Instrument_Serif'] text-2xl lg:text-3xl leading-none tracking-tight text-foreground">
                SMMSAAS<span className="italic text-primary">.</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-5">
              {navItems.map((item) =>
                item.children ? (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => openWithDelay(item.label)}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}
                      aria-expanded={openMenu === item.label}
                      className={cn(
                        "flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-colors hover:text-foreground",
                        isActive(item) || openMenu === item.label
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 transition-transform duration-200",
                          openMenu === item.label && "rotate-180",
                        )}
                      />
                    </button>

                    {openMenu === item.label && (
                      <div
                        className={cn(
                          "absolute top-full pt-3 animate-fade-in",
                          // Align left for left-side items, right for the last one
                          item.label === "Company"
                            ? "right-0"
                            : "left-0",
                        )}
                      >
                        <div className="w-[20rem] rounded-2xl border border-border bg-popover/95 backdrop-blur-xl p-2 shadow-2xl">
                          {item.children.map((child) => (
                            <button
                              key={child.label}
                              onClick={() => go(child.href)}
                              className="w-full text-left px-4 py-2.5 rounded-xl transition-colors hover:bg-muted group/item"
                            >
                              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                                {child.label}
                                <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all group-hover/item:opacity-100 group-hover/item:translate-x-0 text-primary" />
                              </span>
                              {child.description && (
                                <span className="block text-xs text-muted-foreground mt-0.5">
                                  {child.description}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    key={item.label}
                    onClick={() => go(item.href!)}
                    className={cn(
                      "text-[11px] uppercase tracking-[0.22em] font-medium transition-colors hover:text-foreground relative group",
                      isActive(item) ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "absolute -bottom-1 left-0 h-px bg-primary transition-all duration-300",
                        isActive(item) ? "w-full" : "w-0 group-hover:w-full",
                      )}
                    />
                  </button>
                ),
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isAuthed ? (
                <HeaderAccountMenu className="hidden sm:flex" />
              ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-[11px] uppercase tracking-[0.2em]">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="h-9 rounded-full px-5 text-[11px] uppercase tracking-[0.2em] font-semibold shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
                  >
                    Get Started
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Toggle menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border max-h-[80vh] overflow-y-auto">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navItems.map((item) =>
                item.children ? (
                  <div key={item.label} className="rounded-lg overflow-hidden">
                    <button
                      onClick={() =>
                        setMobileOpenGroup(mobileOpenGroup === item.label ? null : item.label)
                      }
                      className="w-full flex items-center justify-between px-4 py-3 text-foreground"
                    >
                      <span className="text-[11px] uppercase tracking-[0.22em] font-medium">
                        {item.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          mobileOpenGroup === item.label && "rotate-180",
                        )}
                      />
                    </button>
                    {mobileOpenGroup === item.label && (
                      <div className="pl-3 pb-2 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.label}
                            onClick={() => go(child.href)}
                            className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    key={item.label}
                    onClick={() => go(item.href!)}
                    className="w-full text-left px-4 py-3 rounded-lg text-[11px] uppercase tracking-[0.22em] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </button>
                ),
              )}
              {isAuthed ? (
                <div className="mt-4 px-4">
                  <HeaderAccountMenu className="w-full justify-between" />
                </div>
              ) : (
                <div className="flex gap-2 mt-4 px-4">
                  <Link to="/login" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" className="flex-1">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
      {/* Spacer */}
      <div className="h-14 lg:h-16" />
    </>
  );
}
