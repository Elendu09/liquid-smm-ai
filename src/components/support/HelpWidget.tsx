import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LifeBuoy, X, Sparkles, MessageCircle, Keyboard, BookOpen, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useViewportMode } from "@/hooks/useViewportMode";
import { TOUR_OPEN_EVENT } from "@/hooks/useOnboardingTour";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";

const HIDDEN_ROUTES = ["/", "/login", "/signup", "/pricing", "/.lovable/oauth/consent"];

export function HelpWidget() {
  const { hasBottomNav, safeBottomPx, mode } = useViewportMode();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Hide on public routes
  if (HIDDEN_ROUTES.some((r) => pathname === r || (r !== "/" && pathname.startsWith(r)))) {
    return null;
  }

  const bottomOffset = hasBottomNav ? safeBottomPx + 12 : 20;

  const startTour = () => {
    setOpen(false);
    window.dispatchEvent(new Event(TOUR_OPEN_EVENT));
  };

  const openShortcuts = () => {
    setOpen(false);
    const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
    window.dispatchEvent(e);
  };

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Help menu"
          className={cn(
            "fixed z-[90] w-72 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-200",
            mode === "mobile" ? "left-3 right-3 w-auto" : "right-4",
          )}
          style={{ bottom: bottomOffset + 60 }}
        >
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <LifeBuoy className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="text-sm font-semibold">How can we help?</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground rounded p-1"
              aria-label="Close help menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-0.5">
            <HelpItem icon={Sparkles} label="Take the product tour" hint="Guided walkthrough" onClick={startTour} />
            <HelpItem
              icon={MessageCircle}
              label="Contact support"
              hint="Reply within 24h"
              onClick={() => {
                setOpen(false);
                setContactOpen(true);
              }}
            />
            <HelpItem icon={Keyboard} label="Keyboard shortcuts" hint="Press ⌘K" onClick={openShortcuts} />
            <HelpItem
              icon={Activity}
              label="Run troubleshooter"
              hint="Diagnose common issues"
              onClick={() => {
                setOpen(false);
                navigate("/dashboard/support?tab=troubleshooter");
              }}
            />
            <HelpItem
              icon={BookOpen}
              label="Help center"
              hint="FAQs & guides"
              onClick={() => {
                setOpen(false);
                navigate("/dashboard/support");
              }}
            />
          </div>
        </div>
      )}

      {/* Floating action button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-tour="help-widget"
        aria-label={open ? "Close help" : "Open help"}
        aria-expanded={open}
        className={cn(
          "fixed z-[90] flex items-center justify-center rounded-full shadow-xl transition-all",
          "bg-primary text-primary-foreground hover:brightness-110 active:scale-95",
          "ring-4 ring-background",
          mode === "mobile" ? "h-11 w-11" : "h-12 w-12",
          open && "rotate-90",
        )}
        style={{ right: mode === "mobile" ? 12 : 20, bottom: bottomOffset }}
      >
        {open ? <X className="w-5 h-5" /> : <LifeBuoy className="w-5 h-5" />}
      </button>

      <ContactSupportDialog open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
}

function HelpItem({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-muted/60 transition-colors group"
    >
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground truncate">{hint}</div>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}
