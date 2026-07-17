import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, X, Sparkles, Check } from "lucide-react";
import { tourSteps, type TourStep } from "./tourSteps";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useTourState, TOUR_OPEN_EVENT } from "@/hooks/useOnboardingTour";

interface Rect { top: number; left: number; width: number; height: number }

const PAD_DESKTOP = 8;
const PAD_MOBILE = 12;
const TOOLTIP_W_DESKTOP = 360;
const TOOLTIP_W_TABLET = 320;

async function waitForEl(selector: string, timeout = 1500): Promise<HTMLElement | null> {
  const start = performance.now();
  return new Promise((resolve) => {
    const tick = () => {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return resolve(el);
      if (performance.now() - start > timeout) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function getRect(el: HTMLElement, pad: number): Rect {
  const r = el.getBoundingClientRect();
  return {
    top: Math.max(0, r.top - pad),
    left: Math.max(0, r.left - pad),
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

export function OnboardingTour() {
  const { state, markCompleted, markDismissed } = useTourState();
  const { mode, hasBottomNav, safeBottomPx } = useViewportMode();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [loading, setLoading] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Filter steps by mode
  const steps = tourSteps.filter((s) => {
    if (s.desktopOnly && mode !== "desktop") return false;
    if (s.mobileOnly && mode === "desktop") return false;
    return true;
  });
  const step: TourStep | undefined = steps[stepIndex];
  const total = steps.length;

  // External trigger to open
  useEffect(() => {
    const handler = () => {
      setStepIndex(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_OPEN_EVENT, handler);
    return () => window.removeEventListener(TOUR_OPEN_EVENT, handler);
  }, []);

  // Auto-open once after wizard completes
  useEffect(() => {
    if (state.completed || state.dismissed) return;
    const onboardingRaw = window.localStorage.getItem("smmpilot:onboarding");
    if (!onboardingRaw) return;
    try {
      const parsed = JSON.parse(onboardingRaw);
      if (parsed?.completed) {
        const t = setTimeout(() => {
          setStepIndex(0);
          setOpen(true);
        }, 800);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, [state.completed, state.dismissed]);

  // Resolve current target
  const resolveTarget = useCallback(async () => {
    if (!step) return;
    setLoading(true);
    if (step.route && !pathname.startsWith(step.route)) {
      navigate(step.route);
    }
    const selector = mode !== "desktop" && step.mobileTarget ? step.mobileTarget : step.target;
    const el = await waitForEl(selector);
    if (el) {
      try {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch {
        // ignore
      }
      await new Promise((r) => setTimeout(r, 250));
      const pad = mode === "mobile" ? PAD_MOBILE : PAD_DESKTOP;
      setRect(getRect(el, pad));
    } else {
      setRect(null);
    }
    setLoading(false);
  }, [step, mode, pathname, navigate]);

  useEffect(() => {
    if (!open || !step) return;
    resolveTarget();
  }, [open, stepIndex, mode, resolveTarget, step]);

  // Track target rect on scroll/resize
  useEffect(() => {
    if (!open || !step) return;
    const selector = mode !== "desktop" && step.mobileTarget ? step.mobileTarget : step.target;
    const update = () => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return;
      const pad = mode === "mobile" ? PAD_MOBILE : PAD_DESKTOP;
      setRect(getRect(el, pad));
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const ro = "ResizeObserver" in window
      ? new ResizeObserver(update)
      : null;
    const el = document.querySelector<HTMLElement>(selector);
    if (el && ro) ro.observe(el);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [open, stepIndex, step, mode]);

  const close = useCallback((dismiss = true) => {
    setOpen(false);
    if (dismiss) markDismissed();
  }, [markDismissed]);

  const finish = useCallback(() => {
    setOpen(false);
    markCompleted();
  }, [markCompleted]);

  const next = useCallback(() => {
    if (stepIndex >= total - 1) return finish();
    setStepIndex((i) => i + 1);
  }, [stepIndex, total, finish]);
  const back = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, next, back]);

  // Swipe (mobile)
  useEffect(() => {
    if (!open || mode !== "mobile") return;
    const el = tooltipRef.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    const ts = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const te = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next();
        else back();
      }
    };
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchend", te);
    return () => {
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchend", te);
    };
  }, [open, mode, next, back]);

  if (!open || !step) return null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const bottomLimit = vh - (hasBottomNav ? safeBottomPx : 0) - 8;

  // Tooltip position
  let tooltipStyle: React.CSSProperties = {};
  const isMobileMode = mode === "mobile";
  const tooltipW = mode === "desktop" ? TOOLTIP_W_DESKTOP : TOOLTIP_W_TABLET;

  if (isMobileMode) {
    tooltipStyle = {
      position: "fixed",
      left: 8,
      right: 8,
      bottom: (hasBottomNav ? safeBottomPx : 0) + 8,
    };
  } else if (rect) {
    // Try below, then above, then right
    const spaceBelow = bottomLimit - (rect.top + rect.height);
    const spaceAbove = rect.top;
    const spaceRight = vw - (rect.left + rect.width);
    let top: number;
    let left: number;
    if (spaceBelow > 180) {
      top = rect.top + rect.height + 12;
      left = Math.max(8, Math.min(vw - tooltipW - 8, rect.left));
    } else if (spaceAbove > 180) {
      top = Math.max(8, rect.top - 12 - 200);
      left = Math.max(8, Math.min(vw - tooltipW - 8, rect.left));
    } else if (spaceRight > tooltipW + 20) {
      top = Math.max(8, Math.min(bottomLimit - 220, rect.top));
      left = rect.left + rect.width + 12;
    } else {
      top = Math.max(8, Math.min(bottomLimit - 220, rect.top));
      left = Math.max(8, rect.left - tooltipW - 12);
    }
    // Clamp above bottom nav
    top = Math.min(top, bottomLimit - 220);
    tooltipStyle = { position: "fixed", top, left, width: tooltipW };
  } else {
    // Center fallback
    tooltipStyle = {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: tooltipW,
    };
  }

  const isLast = stepIndex === total - 1;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      className="fixed inset-0 z-[200] animate-in fade-in duration-200"
    >
      {/* SVG mask overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        onClick={() => close(true)}
        aria-hidden="true"
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx={12}
                ry={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="hsl(var(--background))"
          fillOpacity="0.78"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Highlight ring */}
      {rect && (
        <div
          className="absolute pointer-events-none rounded-xl ring-2 ring-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.25)] motion-safe:animate-pulse"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
          aria-hidden="true"
        />
      )}

      {/* Tooltip / bottom sheet */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className={cn(
          "bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-4 sm:p-5",
          "animate-in fade-in slide-in-from-bottom-2 duration-200",
        )}
      >
        {isMobileMode && (
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" aria-hidden />
        )}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 justify-between">
              <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
                Step {stepIndex + 1} of {total}
              </span>
              <button
                type="button"
                onClick={() => close(true)}
                className="text-muted-foreground hover:text-foreground rounded p-1"
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 id="tour-title" className="text-base sm:text-lg font-semibold text-foreground mt-1">
              {step.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {step.body}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1 mt-4" aria-hidden>
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                i < stepIndex && "bg-primary/70",
                i === stepIndex && "bg-primary",
                i > stepIndex && "bg-muted",
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={() => close(true)}>
            Skip
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={back}
              disabled={stepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            {isLast ? (
              <Button size="sm" onClick={finish}>
                Finish <Check className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={next} disabled={loading}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
