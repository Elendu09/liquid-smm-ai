import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, X, ArrowLeft } from "lucide-react";
import { solutions } from "@/config/solutions";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "smmpilot:preset-banner-dismissed";

function readDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

/**
 * Dismissible banner shown whenever the URL contains `?preset=<id>`, so users
 * arriving from a Solutions card get context on what the preset does and a
 * one-click way back to browse other solutions. Dismissal is per-preset and
 * strips the query param.
 */
export function PresetLandingBanner() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const preset = params.get("preset");
  const [dismissed, setDismissed] = useState<Set<string>>(readDismissed);

  const solution = useMemo(
    () =>
      preset
        ? solutions.find(
            (s) => s.presetId === preset || s.id === preset || s.ctaHref.includes(`preset=${preset}`),
          )
        : undefined,
    [preset],
  );

  useEffect(() => { setDismissed(readDismissed()); }, [location.pathname]);

  if (!preset || dismissed.has(preset)) return null;

  const dismiss = () => {
    const next = new Set(dismissed);
    next.add(preset);
    setDismissed(next);
    try { window.localStorage.setItem(DISMISS_KEY, JSON.stringify(Array.from(next))); } catch { /* noop */ }
    const p = new URLSearchParams(location.search);
    p.delete("preset");
    navigate({ pathname: location.pathname, search: p.toString() ? `?${p.toString()}` : "" }, { replace: true });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4">
      <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 overflow-hidden">
        <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-primary/80 font-semibold mb-0.5">
            Solution preset · {preset}
          </p>
          <h4 className="text-sm sm:text-base font-semibold leading-tight truncate">
            {solution?.title ?? "Preset loaded"}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {solution?.description ?? "Continue configuring this workflow. Dismiss when you're set."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link to="/solutions">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Browse solutions
            </Link>
          </Button>
          <button
            onClick={dismiss}
            className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="Dismiss preset banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
