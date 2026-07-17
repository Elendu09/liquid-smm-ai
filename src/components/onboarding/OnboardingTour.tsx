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
type Placement = "top" | "bottom" | "left" | "right" | "center";

const PAD_DESKTOP = 8;
const PAD_MOBILE = 12;
const TOOLTIP_W_DESKTOP = 380;
const TOOLTIP_W_TABLET = 340;
const TOOLTIP_H_EST = 240;
const GAP = 14;

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
  // If the element sits inside the mobile bottom nav, expand the top so the
  // floating "Publish" button (which visually pokes above the nav) is included.
  const inBottomNav = !!el.closest('nav[aria-label="Hub navigation"]');
  const topPad = inBottomNav ? pad + 28 : pad;
  return {
    top: Math.max(0, r.top - topPad),
    left: Math.max(0, r.left - pad),
    width: r.width + pad * 2,
    height: r.height + topPad + pad,
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

  const steps = tourSteps.filter((s) => {
    if (s.desktopOnly && mode !== "desktop") return false;
    if (s.mobileOnly && mode === "desktop") return false;
    return true;
  });
  const step: TourStep | undefined = steps[stepIndex];
  const total = steps.length;

  useEffect(() => {
    const handler = () => {
      setStepIndex(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_OPEN_EVENT, handler);
    return () => window.removeEventListener(TOUR_OPEN_EVENT, handler);
  }, []);

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
      const pad = mode === "mobile" ? PAD_MOBILE : PAD_DESKTOP;
      // Re-measure a few times to handle route transitions & animated targets
      for (const delay of [180, 380, 700]) {
        await new Promise((r) => setTimeout(r, delay));
        const fresh = document.querySelector<HTMLElement>(selector);
        if (fresh) {
          const r = fresh.getBoundingClientRect();
          if (r.width > 4 && r.height > 4) setRect(getRect(fresh, pad));
        }
      }
    } else {
      setRect(null);
    }
    setLoading(false);
  }, [step, mode, pathname, navigate]);

  useEffect(() => {
    if (!open || !step) return;
    resolveTarget();
  }, [open, stepIndex, mode, resolveTarget, step]);

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
    const ro = "ResizeObserver" in window ? new ResizeObserver(update) : null;
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

  const isMobileMode = mode === "mobile";
  const tooltipW = mode === "desktop" ? TOOLTIP_W_DESKTOP : TOOLTIP_W_TABLET;
  const forceCentered = !!step.centered;

  let tooltipStyle: React.CSSProperties = {};
  let placement: Placement = "center";
  let arrowStyle: React.CSSProperties | null = null;

  if (forceCentered) {
    tooltipStyle = {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: isMobileMode ? Math.min(vw - 16, tooltipW) : tooltipW,
      maxWidth: "calc(100vw - 16px)",
    };
    placement = "center";
  } else if (isMobileMode && !step.preferPlacement) {
    tooltipStyle = {
      position: "fixed",
      left: 8,
      right: 8,
      bottom: (hasBottomNav ? safeBottomPx : 0) + 8,
    };
    placement = "bottom";
  } else if (rect) {
    const spaceBelow = bottomLimit - (rect.top + rect.height);
    const spaceAbove = rect.top;
    const spaceRight = vw - (rect.left + rect.width);
    const spaceLeft = rect.left;
    let top: number;
    let left: number;
    const wantTop =
      step.preferPlacement === "top" && spaceAbove > TOOLTIP_H_EST * 0.6;
    const wantBottom =
      step.preferPlacement === "bottom" && spaceBelow > TOOLTIP_H_EST * 0.6;
    if (wantTop) {
      top = Math.max(8, rect.top - GAP - TOOLTIP_H_EST);
      left = Math.max(8, Math.min(vw - tooltipW - 8, rect.left + rect.width / 2 - tooltipW / 2));
      placement = "top";
    } else if (wantBottom) {
      top = rect.top + rect.height + GAP;
      left = Math.max(8, Math.min(vw - tooltipW - 8, rect.left + rect.width / 2 - tooltipW / 2));
      placement = "bottom";
    } else if (spaceBelow > TOOLTIP_H_EST) {
      top = rect.top + rect.height + GAP;
      left = Math.max(8, Math.min(vw - tooltipW - 8, rect.left + rect.width / 2 - tooltipW / 2));
      placement = "bottom";
    } else if (spaceAbove > TOOLTIP_H_EST) {
      top = Math.max(8, rect.top - GAP - TOOLTIP_H_EST);
      left = Math.max(8, Math.min(vw - tooltipW - 8, rect.left + rect.width / 2 - tooltipW / 2));
      placement = "top";
    } else if (spaceRight > tooltipW + GAP) {
      top = Math.max(8, Math.min(bottomLimit - TOOLTIP_H_EST, rect.top + rect.height / 2 - TOOLTIP_H_EST / 2));
      left = rect.left + rect.width + GAP;
      placement = "right";
    } else if (spaceLeft > tooltipW + GAP) {
      top = Math.max(8, Math.min(bottomLimit - TOOLTIP_H_EST, rect.top + rect.height / 2 - TOOLTIP_H_EST / 2));
      left = rect.left - tooltipW - GAP;
      placement = "left";
    } else {
      top = Math.max(8, Math.min(bottomLimit - TOOLTIP_H_EST, rect.top - GAP - TOOLTIP_H_EST));
      left = Math.max(8, Math.min(vw - tooltipW - 8, rect.left));
      placement = "top";
    }
    top = Math.min(top, bottomLimit - TOOLTIP_H_EST);
    const effectiveW = isMobileMode ? Math.min(vw - 16, tooltipW) : tooltipW;
    if (isMobileMode) {
      left = Math.max(8, Math.min(vw - effectiveW - 8, left));
    }
    tooltipStyle = { position: "fixed", top, left, width: effectiveW };

    // Arrow relative to tooltip
    const targetCx = rect.left + rect.width / 2;
    const targetCy = rect.top + rect.height / 2;
    const arrowSize = 10;
    const arrowBase: React.CSSProperties = {
      position: "absolute",
      width: arrowSize * 2,
      height: arrowSize * 2,
      transform: "rotate(45deg)",
      background: "hsl(var(--card))",
      borderColor: "hsl(var(--border))",
      borderStyle: "solid",
    };
    if (placement === "bottom") {
      arrowStyle = {
        ...arrowBase,
        top: -arrowSize,
        left: Math.max(12, Math.min(effectiveW - 28, targetCx - left - arrowSize)),
        borderWidth: "1px 0 0 1px",
      };
    } else if (placement === "top") {
      arrowStyle = {
        ...arrowBase,
        bottom: -arrowSize,
        left: Math.max(12, Math.min(effectiveW - 28, targetCx - left - arrowSize)),
        borderWidth: "0 1px 1px 0",
      };
    } else if (placement === "right") {
      arrowStyle = {
        ...arrowBase,
        left: -arrowSize,
        top: Math.max(12, Math.min(TOOLTIP_H_EST - 28, targetCy - top - arrowSize)),
        borderWidth: "0 0 1px 1px",
      };
    } else if (placement === "left") {
      arrowStyle = {
        ...arrowBase,
        right: -arrowSize,
        top: Math.max(12, Math.min(TOOLTIP_H_EST - 28, targetCy - top - arrowSize)),
        borderWidth: "1px 1px 0 0",
      };
    }
  } else {
    tooltipStyle = {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: isMobileMode ? Math.min(vw - 16, tooltipW) : tooltipW,
    };
  }

  const isLast = stepIndex === total - 1;
  const StepIcon = step.icon ?? Sparkles;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      className="fixed inset-0 z-[200] animate-in fade-in duration-200"
    >
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
          fillOpacity="0.82"
          mask="url(#tour-mask)"
        />
      </svg>

      {rect && (
        <div
          className="absolute pointer-events-none rounded-xl ring-2 ring-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.25),0_0_40px_hsl(var(--primary)/0.4)] motion-safe:animate-pulse"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
          aria-hidden="true"
        />
      )}

      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className={cn(
          "bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-4 sm:p-5 relative",
          "animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300",
        )}
      >
        {arrowStyle && <div style={arrowStyle} aria-hidden />}

        {isMobileMode && (
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" aria-hidden />
        )}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 ring-1 ring-primary/20 flex items-center justify-center flex-shrink-0">
            <StepIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 justify-between">
              <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
                Step {stepIndex + 1} of {total}
              </span>
              <button
                type="button"
                onClick={() => close(true)}
                className="text-muted-foreground hover:text-foreground rounded p-1 -m-1"
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 id="tour-title" className="text-base sm:text-lg font-semibold text-foreground mt-1 leading-snug">
              {step.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {step.body}
            </p>
            {step.hint && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                <span className="inline-block w-1 h-1 rounded-full bg-primary/60" />
                {step.hint}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 mt-4" aria-hidden>
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStepIndex(i)}
              className={cn(
                "h-1 flex-1 rounded-full transition-all cursor-pointer",
                i < stepIndex && "bg-primary/70",
                i === stepIndex && "bg-primary",
                i > stepIndex && "bg-muted hover:bg-muted-foreground/30",
              )}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 mt-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => close(true)}>
              Skip
            </Button>
            {!isMobileMode && (
              <div className="hidden md:flex items-center gap-1 ml-1 text-[10px] text-muted-foreground/70">
                <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5">Esc</kbd>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isMobileMode && (
              <div className="hidden md:flex items-center gap-1 mr-1 text-[10px] text-muted-foreground/70">
                <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5">←</kbd>
                <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5">→</kbd>
              </div>
            )}
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
