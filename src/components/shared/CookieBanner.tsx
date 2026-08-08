import { useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, Shield, BarChart3, BadgeCheck, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { isGuestSession } from "@/hooks/useGuest";
import { cn } from "@/lib/utils";

export function CookieBanner() {
  const { open, accept, reject, save, close, record } = useCookieConsent();
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  if (isGuestSession()) return null;
  if (record) return null;
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />

      {/* Floating card — centered on all screens */}
      <div
        role="dialog"
        aria-live="polite"
        aria-label="Cookie preferences"
        className={cn(
          "fixed inset-4 z-50 m-auto flex items-center justify-center",
          "animate-fade-in",
        )}
      >
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
          {!customizing ? (
            <>
              {/* Header */}
              <div className="relative px-5 pt-5 pb-3">
                <button
                  type="button"
                  onClick={close}
                  className="absolute right-4 top-4 h-8 w-8 rounded-full border border-border/60 bg-background/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close cookie banner"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-400/15 to-orange-400/10 ring-1 ring-amber-500/20">
                    <Cookie className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground leading-tight">
                      We use cookies
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed max-w-sm">
                      Essential cookies keep you signed in and secure. Optional ones help us
                      understand what's useful and tune the product.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick-perk chips */}
              <div className="px-5 pb-1 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[10px] text-muted-foreground">
                  <Shield className="h-2.5 w-2.5 text-emerald-500" />
                  No data sold
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[10px] text-muted-foreground">
                  <EyeOff className="h-2.5 w-2.5 text-sky-500" />
                  No tracking ads
                </span>
                <Link
                  to="/cookies"
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[10px] text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors"
                >
                  View policy →
                </Link>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 pt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl text-[11px] font-semibold tracking-[0.15em] uppercase border-border/60"
                  onClick={() => setCustomizing(true)}
                >
                  Customize
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-xl text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground"
                  onClick={reject}
                >
                  Reject all
                </Button>
                <Button
                  size="sm"
                  onClick={accept}
                  className="ml-auto h-9 rounded-xl px-4 text-[11px] font-semibold tracking-[0.15em] uppercase shadow-lg shadow-primary/25"
                >
                  Accept all
                  <BadgeCheck className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Customize header */}
              <div className="relative px-5 pt-5 pb-3">
                <button
                  type="button"
                  onClick={close}
                  className="absolute right-4 top-4 h-8 w-8 rounded-full border border-border/60 bg-background/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close cookie preferences"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/5 ring-1 ring-primary/20">
                    <Shield className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Cookie preferences</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Choose what you're comfortable with. Essentials are always on.
                    </p>
                  </div>
                </div>
              </div>

              {/* Toggle cards */}
              <div className="px-5 pb-3 space-y-2">
                <ToggleCard
                  icon={Shield}
                  color="emerald"
                  title="Essential"
                  description="Sign-in, security, and request delivery. Always active."
                  checked
                  disabled
                />
                <ToggleCard
                  icon={BarChart3}
                  color="sky"
                  title="Analytics"
                  description="Which features get used so we can fix bugs and improve the product."
                  checked={analytics}
                  onChange={setAnalytics}
                />
                <ToggleCard
                  icon={Eye}
                  color="violet"
                  title="Marketing"
                  description="Personalized tips and recommendations inside the product."
                  checked={marketing}
                  onChange={setMarketing}
                />
              </div>

              {/* Save */}
              <div className="px-5 pb-5 pt-1 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCustomizing(false)}
                  className="h-9 rounded-xl text-[11px]"
                >
                  ← Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => save(analytics, marketing)}
                  className="ml-auto h-9 rounded-xl px-5 text-[11px] font-semibold tracking-[0.15em] uppercase shadow-lg shadow-primary/25"
                >
                  Save preferences
                  <BadgeCheck className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle card for customize view                                     */
/* ------------------------------------------------------------------ */

function ToggleCard({
  icon: Icon,
  color,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: "emerald" | "sky" | "violet";
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  const colorMap = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    sky: "text-sky-500 bg-sky-500/10",
    violet: "text-violet-500 bg-violet-500/10",
  };

  return (
    <label
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-all",
        disabled
          ? "border-border/40 bg-muted/20 cursor-default"
          : "border-border/60 bg-card/40 cursor-pointer hover:border-primary/30 hover:bg-primary/[0.03]",
      )}
    >
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", colorMap[color])}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-foreground">{title}</p>
        <p className="text-[10px] leading-relaxed text-muted-foreground line-clamp-2">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          onChange?.(!checked);
        }}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors shrink-0",
          disabled
            ? "bg-emerald-500/40"
            : checked
              ? "bg-primary"
              : "bg-muted-foreground/25",
          disabled && "cursor-default",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "left-[18px]" : "left-0.5",
            disabled && "opacity-60",
          )}
        />
      </button>
    </label>
  );
}
