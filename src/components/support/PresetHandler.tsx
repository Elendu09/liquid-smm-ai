import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { solutions } from "@/config/solutions";

/**
 * Reads `?preset=<id>` from the current URL and toasts a light acknowledgement
 * so users landing from a Solutions card get feedback that the preset was
 * recognised. Individual tools can still read the same param and open their
 * matching dialog if they wire it up later.
 */
export function PresetHandler() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const preset = params.get("preset");
    if (!preset) return;

    const solution = solutions.find(
      (s) => s.presetId === preset || s.id === preset || s.ctaHref.includes(`preset=${preset}`),
    );

    toast.success(
      solution ? `Preset ready: ${solution.title}` : `Preset "${preset}" loaded`,
      {
        description: solution?.ctaLabel ?? "Continue where you left off.",
        duration: 4000,
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  return null;
}
