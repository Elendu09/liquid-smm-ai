import { useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, Settings2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { cn } from "@/lib/utils";

/**
 * CookieBanner
 *
 * A compact, non-intrusive bottom-sheet that surfaces once on the
 * visitor's first page view. Three states:
 *  - First view: short message + Accept all / Reject all / Customize
 *  - Customize: per-category toggles with a Save button
 *  - Dismissed: stored in localStorage, never shown again on this
 *    version. A "Cookie preferences" link in the footer re-opens it.
 *
 * Placement: the banner is a renderless mount; it doesn't matter
 * where you place the component in the tree.
 */
export function CookieBanner() {
  const { open, accept, reject, save, close, reopen, record } = useCookieConsent();
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  if (record) return null; // already decided; nothing to show
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl",
        "transition-transform duration-300",
      )}
    >
      <div className="container mx-auto max-w-6xl px-4 py-4">
        {!customizing ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2.5 sm:flex-1">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Cookie className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">We use cookies to keep you signed in and to learn what works.</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Essential cookies are always on. You can opt in to analytics and marketing, or
                  reject non-essential ones.{" "}
                  <Link to="/cookies" className="text-primary underline-offset-2 hover:underline">
                    Read the cookie policy
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <Button
                size="sm"
                variant="ghost"
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                onClick={() => setCustomizing(true)}
              >
                <Settings2 className="mr-1 h-3.5 w-3.5" /> Customize
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={reject}
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              >
                Reject all
              </Button>
              <Button
                size="sm"
                onClick={accept}
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              >
                Accept all
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Settings2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">Cookie categories</p>
                <p className="text-[11px] text-muted-foreground">Toggle the categories you allow. We never sell your data.</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close cookie preferences"
                className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <CategoryRow
                title="Essential"
                description="Sign-in and request security. Required."
                checked
                disabled
              />
              <CategoryRow
                title="Analytics"
                description="Which tools get used. Helps us prioritise fixes."
                checked={analytics}
                onChange={setAnalytics}
              />
              <CategoryRow
                title="Marketing"
                description="Personalised recommendations across the product."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCustomizing(false)}
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={() => save(analytics, marketing)}
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              >
                <Check className="mr-1 h-3.5 w-3.5" /> Save preferences
              </Button>
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={reopen}
        className="absolute -top-9 right-4 hidden items-center gap-1 rounded-full border border-border/60 bg-card/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-md backdrop-blur sm:inline-flex"
        aria-label="Reopen cookie preferences"
      >
        <Cookie className="h-3 w-3" /> Cookie preferences
      </button>
    </div>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3 transition-colors",
        disabled ? "border-border/60 bg-muted/30" : "border-border/60 bg-card/60 cursor-pointer hover:border-primary/30",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border/60 accent-primary"
        aria-label={title}
      />
      <div>
        <p className="text-xs font-semibold">{title}</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}
