import { useEffect, useState } from "react";

export type ViewportMode = "mobile" | "tablet" | "desktop";

export interface ViewportInfo {
  mode: ViewportMode;
  hasBottomNav: boolean;
  safeBottomPx: number;
}

function detectMode(): ViewportMode {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function detectBottomPx(mode: ViewportMode): number {
  if (typeof window === "undefined" || mode === "desktop") return 0;
  const el = document.querySelector<HTMLElement>('nav[aria-label="Hub navigation"]');
  if (el) return Math.round(el.getBoundingClientRect().height) + 8;
  return 80;
}

export function useViewportMode(): ViewportInfo {
  const [info, setInfo] = useState<ViewportInfo>(() => {
    const mode = detectMode();
    return { mode, hasBottomNav: mode !== "desktop", safeBottomPx: detectBottomPx(mode) };
  });

  useEffect(() => {
    let raf = 0;
    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mode = detectMode();
        setInfo({
          mode,
          hasBottomNav: mode !== "desktop",
          safeBottomPx: detectBottomPx(mode),
        });
      });
    };

    const mqlMobile = window.matchMedia("(max-width: 767px)");
    const mqlTablet = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    mqlMobile.addEventListener("change", recompute);
    mqlTablet.addEventListener("change", recompute);
    window.addEventListener("resize", recompute);

    // Observe bottom nav if present
    let ro: ResizeObserver | null = null;
    const el = document.querySelector<HTMLElement>('nav[aria-label="Hub navigation"]');
    if (el && "ResizeObserver" in window) {
      ro = new ResizeObserver(recompute);
      ro.observe(el);
    }

    recompute();
    return () => {
      cancelAnimationFrame(raf);
      mqlMobile.removeEventListener("change", recompute);
      mqlTablet.removeEventListener("change", recompute);
      window.removeEventListener("resize", recompute);
      ro?.disconnect();
    };
  }, []);

  return info;
}
